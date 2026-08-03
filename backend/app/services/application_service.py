import logging
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application
from app.models.internship import Internship
from app.models.student import Student
from app.services.admin_service import close_expired_internships

logger = logging.getLogger(__name__)


async def apply_to_internship(db: AsyncSession, student_id: int, internship_id: int) -> Application:
    await close_expired_internships(db)

    i_result = await db.execute(select(Internship).where(Internship.id == internship_id))
    internship = i_result.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")

    if internship.application_start_date and internship.application_start_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Applications have not opened yet for this internship",
        )

    if internship.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Applications are not open for this internship (status: {internship.status})",
        )

    if internship.application_deadline and internship.application_deadline < date.today():
        internship.status = "closed"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application deadline has passed",
        )

    s_result = await db.execute(select(Student).where(Student.id == student_id))
    student = s_result.scalar_one_or_none()
    if not student or not student.skills_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must upload your resume and confirm your skills before applying",
        )

    existing = await db.execute(
        select(Application).where(
            Application.student_id == student_id,
            Application.internship_id == internship_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this internship",
        )

    application = Application(
        student_id=student_id,
        internship_id=internship_id,
        status="pending",
        resume_used=student.resume_path,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    logger.info("Student %s applied to internship %s", student_id, internship_id)
    return application


async def list_open_internships(db: AsyncSession) -> list[Internship]:
    """Open internships only; auto-closes any past deadline first."""
    await close_expired_internships(db)
    result = await db.execute(
        select(Internship)
        .where(Internship.status == "open")
        .order_by(Internship.application_deadline)
    )
    return list(result.scalars().all())


async def get_student_applications(db: AsyncSession, student_id: int) -> list[dict]:
    result = await db.execute(
        select(Application)
        .where(Application.student_id == student_id)
        .order_by(Application.applied_at.desc())
    )
    applications = result.scalars().all()

    output = []
    for app in applications:
        i_result = await db.execute(select(Internship).where(Internship.id == app.internship_id))
        internship = i_result.scalar_one_or_none()
        output.append({
            "application_id": app.id,
            "internship_id": app.internship_id,
            "title": internship.title if internship else "Unknown",
            "location": internship.location if internship else None,
            "mode": internship.mode if internship else None,
            "application_deadline": (
                internship.application_deadline.isoformat()
                if internship and internship.application_deadline
                else None
            ),
            "internship_status": internship.status if internship else None,
            "application_status": app.status,
            "applied_at": app.applied_at.isoformat(),
        })
    return output


async def get_internship_applicants(db: AsyncSession, internship_id: int) -> list[Application]:
    result = await db.execute(
        select(Application)
        .where(Application.internship_id == internship_id)
        .order_by(Application.applied_at)
    )
    return list(result.scalars().all())


async def get_applicant_count(db: AsyncSession, internship_id: int) -> int:
    result = await db.execute(
        select(Application).where(Application.internship_id == internship_id)
    )
    return len(result.scalars().all())
