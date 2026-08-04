import logging

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.allocation_engine import (
    AllocationRecord,
    InternshipProfile,
    StudentProfile,
    run_allocation,
)
from app.ai.utils import from_json
from app.core.config import settings
from app.models.allocation import Allocation
from app.models.application import Application
from app.models.internship import Internship
from app.models.student import Student

logger = logging.getLogger(__name__)

ELIGIBLE_FOR_ALLOCATION = ("closed",)


def _to_student_profile(s: Student) -> StudentProfile:
    return StudentProfile(
        id=s.id,
        skills=from_json(s.confirmed_skills),
        degree=s.degree or "",
        branch=s.branch or "",
        cgpa=s.cgpa,
        preferred_location=s.preferred_location or "",
        interested_sector=s.interested_sector or "",
    )


def _to_internship_profile(i: Internship) -> InternshipProfile:
    return InternshipProfile(
        id=i.id,
        required_skills=from_json(i.required_skills),
        preferred_degree=i.preferred_degree or "",
        preferred_branches=from_json(i.preferred_branches),
        min_cgpa=i.min_cgpa or 0.0,
        location=i.location or "",
        sector=i.sector or "",
        seats=i.seats,
    )


async def _eligible_applicants(
    db: AsyncSession, internship_id: int
) -> list[Student]:
    app_result = await db.execute(
        select(Application).where(
            Application.internship_id == internship_id,
            Application.status == "pending",
        )
    )
    applications = app_result.scalars().all()
    if not applications:
        return []

    student_ids = [a.student_id for a in applications]
    s_result = await db.execute(
        select(Student).where(
            Student.id.in_(student_ids),
            Student.skills_confirmed == True,  # noqa: E712
            Student.is_active == True,  # noqa: E712
        )
    )
    return list(s_result.scalars().all())


async def _persist_records(
    db: AsyncSession,
    records: list[AllocationRecord],
    *,
    skip_already_allocated: bool = True,
) -> int:
    saved = 0
    for rec in records:
        if skip_already_allocated:
            existing = await db.execute(
                select(Allocation).where(Allocation.student_id == rec.student_id)
            )
            if existing.scalar_one_or_none():
                logger.warning(
                    "Student %s already allocated elsewhere, skipping", rec.student_id
                )
                continue

        db.add(
            Allocation(
                student_id=rec.student_id,
                internship_id=rec.internship_id,
                overall_match_score=rec.match_score,
                skills_score=rec.skills_score,
                degree_score=rec.degree_score,
                branch_score=rec.branch_score,
                cgpa_score=rec.cgpa_score,
                location_score=rec.location_score,
                sector_score=rec.sector_score,
                rank=rec.rank,
                allocation_reason=rec.allocation_reason,
                status="allocated",
            )
        )
        saved += 1
    return saved


async def run_allocation_for_internship(db: AsyncSession, internship_id: int) -> dict:
    """
    Run AI allocation for a single CLOSED internship.
    Only applicants for this internship are considered.
    Students already allocated elsewhere are skipped.
    Re-run is safe: clears previous allocations for this internship first.
    """
    i_result = await db.execute(select(Internship).where(Internship.id == internship_id))
    internship = i_result.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")

    if internship.status not in ELIGIBLE_FOR_ALLOCATION:
        raise HTTPException(
            status_code=400,
            detail=(
                "Allocation can only run on CLOSED internships "
                f"(current status: {internship.status})"
            ),
        )

    students = await _eligible_applicants(db, internship_id)
    if not students:
        return {
            "message": "No eligible confirmed students among applicants",
            "allocated": 0,
            "internship_id": internship_id,
        }

    internship.status = "allocating"
    await db.flush()

    await db.execute(delete(Allocation).where(Allocation.internship_id == internship_id))

    records = run_allocation(
        [_to_student_profile(s) for s in students],
        [_to_internship_profile(internship)],
    )
    saved = await _persist_records(db, records)

    internship.status = "allocated"
    internship.results_published = False
    await db.commit()

    logger.info(
        "Allocation complete for internship %s: %s students allocated",
        internship_id,
        saved,
    )
    return {
        "message": "Allocation complete",
        "internship_id": internship_id,
        "allocated": saved,
        "total_applicants": len(students),
    }


async def run_global_allocation(db: AsyncSession) -> dict:
    """
    Run AI allocation across ALL closed internships in one batch.

    Resolves multi-internship conflicts: a student who applied to several
    roles receives at most one allocation (highest suitable match).
    Safe re-run: clears prior allocations for the closed set first.
    """
    i_result = await db.execute(
        select(Internship).where(Internship.status.in_(ELIGIBLE_FOR_ALLOCATION))
    )
    internships = list(i_result.scalars().all())
    if not internships:
        raise HTTPException(
            status_code=400,
            detail="No CLOSED internships available for allocation",
        )

    # Collect applicants per internship; union of eligible students
    students_by_id: dict[int, Student] = {}
    student_allowed_internships: dict[int, set[int]] = {}

    for internship in internships:
        applicants = await _eligible_applicants(db, internship.id)
        for s in applicants:
            students_by_id[s.id] = s
            student_allowed_internships.setdefault(s.id, set()).add(internship.id)

    if not students_by_id:
        return {
            "message": "No eligible applicants across closed internships",
            "allocated": 0,
            "internships": [i.id for i in internships],
        }

    for internship in internships:
        internship.status = "allocating"
    await db.flush()

    internship_ids = [i.id for i in internships]
    await db.execute(
        delete(Allocation).where(Allocation.internship_id.in_(internship_ids))
    )

    student_profiles = [_to_student_profile(s) for s in students_by_id.values()]
    internship_profiles = [_to_internship_profile(i) for i in internships]

    # Restrict matching to internships the student actually applied to
    records = run_allocation(
        student_profiles,
        internship_profiles,
        allowed_pairs=student_allowed_internships,
    )

    saved = await _persist_records(db, records, skip_already_allocated=False)

    for internship in internships:
        internship.status = "allocated"
        internship.results_published = False

    await db.commit()

    by_internship: dict[int, int] = {}
    for rec in records:
        by_internship[rec.internship_id] = by_internship.get(rec.internship_id, 0) + 1

    logger.info("Global allocation complete: %s students allocated", saved)
    return {
        "message": "Global allocation complete",
        "allocated": saved,
        "total_eligible_students": len(students_by_id),
        "internships_processed": internship_ids,
        "allocated_per_internship": by_internship,
    }


async def get_student_allocation(db: AsyncSession, student_id: int) -> Allocation | None:
    result = await db.execute(
        select(Allocation).where(Allocation.student_id == student_id)
    )
    return result.scalar_one_or_none()


async def get_student_result_if_published(db: AsyncSession, student_id: int) -> dict:
    """
    Returns the allocation result once results are published.
    Every applicant gets a final answer:
      - allocated      → full allocation breakdown
      - not_allocated  → rejection notice for the published internship
      - pending        → still under process (results not published yet)
    """
    allocation = await get_student_allocation(db, student_id)

    if not allocation:
        app_result = await db.execute(
            select(Application).where(Application.student_id == student_id)
        )
        applications = list(app_result.scalars().all())

        if not applications:
            return {
                "status": "no_applications",
                "allocated": False,
                "results_published": False,
                "message": "You have not applied to any internship yet.",
            }

        # An application only becomes "not_allocated" once the company
        # publishes results, so this student has a final answer to show.
        rejected = [a for a in applications if a.status == "not_allocated"]
        if rejected:
            i_result = await db.execute(
                select(Internship).where(
                    Internship.id.in_({a.internship_id for a in rejected})
                )
            )
            internships = {i.id: i for i in i_result.scalars().all()}
            for a in rejected:
                internship = internships.get(a.internship_id)
                if internship and internship.results_published:
                    return {
                        "status": "not_allocated",
                        "allocated": False,
                        "results_published": True,
                        "message": (
                            f"Unfortunately, you were not selected for "
                            f"{internship.title}."
                        ),
                        "internship": {
                            "id": internship.id,
                            "title": internship.title,
                            "location": internship.location,
                            "mode": internship.mode,
                            "duration": internship.duration,
                            "sector": internship.sector,
                        },
                    }

        return {
            "status": "pending",
            "allocated": False,
            "results_published": False,
            "message": "Allocation is under process. Results will be announced by the company.",
        }

    i_result = await db.execute(
        select(Internship).where(Internship.id == allocation.internship_id)
    )
    internship = i_result.scalar_one_or_none()

    if not internship or not internship.results_published:
        return {
            "allocated": False,
            "results_published": False,
            "message": "Allocation is under process. Results will be announced by the company.",
        }

    import json

    reason = {}
    if allocation.allocation_reason:
        try:
            reason = json.loads(allocation.allocation_reason)
        except Exception:
            pass

    return {
        "status": "allocated",
        "allocated": True,
        "results_published": True,
        "company_name": settings.COMPANY_NAME,
        "allocation": {
            "id": allocation.id,
            "status": allocation.status,
            "rank": allocation.rank,
            "allocated_at": allocation.allocated_at.isoformat(),
        },
        "match_scores": {
            "overall": allocation.overall_match_score,
            "skills": allocation.skills_score,
            "degree": allocation.degree_score,
            "branch": allocation.branch_score,
            "cgpa": allocation.cgpa_score,
            "location": allocation.location_score,
            "sector": allocation.sector_score,
        },
        "internship": {
            "id": internship.id,
            "title": internship.title,
            "description": internship.description,
            "location": internship.location,
            "mode": internship.mode,
            "duration": internship.duration,
            "sector": internship.sector,
        },
        "matched_skills": reason.get("matched_skills", []),
        "missing_skills": reason.get("unmatched_skills", []),
        "reasons": reason.get("reasons", []),
    }


async def get_internship_allocations(
    db: AsyncSession, internship_id: int
) -> list[Allocation]:
    result = await db.execute(
        select(Allocation)
        .where(Allocation.internship_id == internship_id)
        .order_by(Allocation.rank)
    )
    return list(result.scalars().all())
