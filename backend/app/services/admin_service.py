import logging
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.utils import to_json
from app.models.allocation import Allocation
from app.models.application import Application
from app.models.internship import Internship
from app.models.student import Student
from app.schemas.internship import InternshipCreate, InternshipUpdate

logger = logging.getLogger(__name__)

# Manual admin transitions only. allocating/allocated/results_published
# are set by the allocation/publish services, not arbitrary PATCH.
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"open"},
    "open": {"closed", "draft"},
    "closed": {"open"},  # reopen before allocation if needed
    "allocating": set(),  # transient — engine owns this
    "allocated": {"closed"},  # allow reset to re-run allocation before publish
    "results_published": set(),
}

CREATE_STATUSES = {"draft", "open"}


# ── Deadline helpers ──────────────────────────────────────────────────────────

async def close_expired_internships(db: AsyncSession) -> int:
    """
    Auto-close OPEN internships whose application_deadline has passed.
    Does NOT run allocation — admin must trigger that manually.
    """
    today = date.today()
    result = await db.execute(
        select(Internship).where(
            Internship.status == "open",
            Internship.application_deadline.is_not(None),
            Internship.application_deadline < today,
        )
    )
    expired = list(result.scalars().all())
    for internship in expired:
        internship.status = "closed"
        logger.info(
            "Auto-closed internship %s — deadline %s passed",
            internship.id,
            internship.application_deadline,
        )
    if expired:
        await db.commit()
    return len(expired)


# ── Internship CRUD ───────────────────────────────────────────────────────────

async def create_internship(db: AsyncSession, data: InternshipCreate) -> Internship:
    status = (data.status or "draft").lower()
    if status not in CREATE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"New internships may only start as draft or open (got: {status})",
        )

    internship = Internship(
        title=data.title,
        description=data.description,
        required_skills=to_json(data.required_skills),
        preferred_degree=data.preferred_degree,
        preferred_branches=to_json(data.preferred_branches),
        min_cgpa=data.min_cgpa,
        location=data.location,
        sector=data.sector,
        mode=data.mode,
        seats=data.seats,
        duration=data.duration,
        application_start_date=data.application_start_date,
        application_deadline=data.application_deadline,
        status=status,
        results_published=False,
    )
    db.add(internship)
    await db.commit()
    await db.refresh(internship)
    logger.info("Internship created: %s (id=%s)", internship.title, internship.id)
    return internship


async def get_all_internships(db: AsyncSession) -> list[Internship]:
    await close_expired_internships(db)
    result = await db.execute(select(Internship).order_by(Internship.created_at.desc()))
    return list(result.scalars().all())


async def get_internship_by_id(db: AsyncSession, internship_id: int) -> Internship:
    result = await db.execute(select(Internship).where(Internship.id == internship_id))
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    return internship


async def update_internship(
    db: AsyncSession, internship_id: int, data: InternshipUpdate
) -> Internship:
    internship = await get_internship_by_id(db, internship_id)

    if internship.status in ("allocating", "results_published"):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot edit internship while status is '{internship.status}'. "
                "Create a new announcement or reset from Allocations if not yet published."
            ),
        )
    if internship.status == "allocated" and internship.results_published:
        raise HTTPException(
            status_code=400,
            detail="Cannot edit an internship after results are published",
        )

    updates = data.model_dump(exclude_unset=True)

    # Status changes must go through validated transitions
    new_status = updates.pop("status", None)

    json_fields = {"required_skills", "preferred_branches"}
    for field, value in updates.items():
        if field in json_fields:
            setattr(internship, field, to_json(value or []))
        else:
            setattr(internship, field, value)

    if updates:
        await db.commit()
        await db.refresh(internship)

    if new_status and new_status != internship.status:
        return await set_internship_status(db, internship_id, new_status)

    if not updates:
        await db.refresh(internship)
    return internship


async def delete_internship(db: AsyncSession, internship_id: int) -> None:
    internship = await get_internship_by_id(db, internship_id)
    if internship.status in ("allocating", "allocated", "results_published"):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an internship after allocation has started",
        )
    await db.delete(internship)
    await db.commit()


# ── Lifecycle Controls ────────────────────────────────────────────────────────

async def set_internship_status(
    db: AsyncSession, internship_id: int, new_status: str
) -> Internship:
    """
    Valid manual transitions:
      draft → open
      open  → closed | draft
      closed → open   (reopen before allocation)
    Allocation engine sets: closed → allocating → allocated
    Publish sets: allocated → results_published
    """
    new_status = (new_status or "").lower()
    internship = await get_internship_by_id(db, internship_id)
    current = (internship.status or "draft").lower()

    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status transition: {current} → {new_status}. "
                f"Allowed from '{current}': {sorted(allowed) or 'none (use allocation/publish endpoints)'}"
            ),
        )

    internship.status = new_status
    if new_status in ("draft", "open", "closed"):
        internship.results_published = False
        # Resetting to closed after a dry-run allocation clears publish flag;
        # allocation rows are cleared on the next Run AI Allocation.

    await db.commit()
    await db.refresh(internship)
    logger.info("Internship %s status → %s", internship_id, new_status)
    return internship


async def publish_results(db: AsyncSession, internship_id: int) -> Internship:
    """Admin publishes allocation results — students can now see their result."""
    internship = await get_internship_by_id(db, internship_id)

    if internship.status != "allocated":
        raise HTTPException(
            status_code=400,
            detail="Allocation must be completed before publishing results",
        )

    internship.results_published = True
    internship.status = "results_published"

    alloc_result = await db.execute(
        select(Allocation).where(Allocation.internship_id == internship_id)
    )
    allocated_student_ids = {a.student_id for a in alloc_result.scalars().all()}

    app_result = await db.execute(
        select(Application).where(Application.internship_id == internship_id)
    )
    for app in app_result.scalars().all():
        app.status = "allocated" if app.student_id in allocated_student_ids else "not_allocated"

    await db.commit()
    await db.refresh(internship)
    logger.info("Results published for internship %s", internship_id)
    return internship


# ── Read-only listings ────────────────────────────────────────────────────────

async def get_all_students(db: AsyncSession) -> list[Student]:
    result = await db.execute(select(Student).order_by(Student.id))
    return list(result.scalars().all())
