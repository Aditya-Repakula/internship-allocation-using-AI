import logging

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.allocation_engine import (
    AllocationRecord,
    InternshipProfile,
    StudentProfile,
    run_allocation,
)
from app.ai.utils import from_json
from app.models.allocation import Allocation
from app.models.internship import Internship
from app.models.student import Student

logger = logging.getLogger(__name__)


async def run_full_allocation(db: AsyncSession) -> dict:
    """
    Fetch all confirmed students and open internships,
    run the AI allocation engine, persist results.
    """
    # Fetch confirmed students only
    s_result = await db.execute(
        select(Student).where(Student.skills_confirmed == True, Student.is_active == True)
    )
    students = s_result.scalars().all()

    # Fetch open internships
    i_result = await db.execute(
        select(Internship).where(Internship.status == "open")
    )
    internships = i_result.scalars().all()

    if not students:
        return {"message": "No confirmed students found", "allocated": 0}
    if not internships:
        return {"message": "No open internships found", "allocated": 0}

    # Build profiles
    student_profiles = [
        StudentProfile(
            id=s.id,
            skills=from_json(s.confirmed_skills),
            degree=s.degree or "",
            branch=s.branch or "",
            cgpa=s.cgpa,
            preferred_location=s.preferred_location or "",
            interested_sector=s.interested_sector or "",
        )
        for s in students
    ]

    internship_profiles = [
        InternshipProfile(
            id=i.id,
            required_skills=from_json(i.required_skills),
            preferred_degree=i.preferred_degree or "",
            preferred_branches=from_json(i.preferred_branches),
            min_cgpa=i.min_cgpa or 0.0,
            location=i.location or "",
            sector=i.sector or "",
            seats=i.seats,
        )
        for i in internships
    ]

    # Run allocation
    records: list[AllocationRecord] = run_allocation(student_profiles, internship_profiles)

    # Clear previous allocations and persist new ones
    await db.execute(delete(Allocation))
    for rec in records:
        allocation = Allocation(
            student_id=rec.student_id,
            internship_id=rec.internship_id,
            match_score=rec.match_score,
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
        db.add(allocation)

    await db.commit()
    logger.info(f"Allocation run complete. {len(records)} students allocated.")
    return {"message": "Allocation complete", "allocated": len(records)}


async def get_student_allocation(db: AsyncSession, student_id: int) -> Allocation | None:
    result = await db.execute(
        select(Allocation).where(Allocation.student_id == student_id)
    )
    return result.scalar_one_or_none()


async def get_internship_allocations(db: AsyncSession, internship_id: int) -> list[Allocation]:
    result = await db.execute(
        select(Allocation).where(Allocation.internship_id == internship_id)
        .order_by(Allocation.rank)
    )
    return result.scalars().all()
