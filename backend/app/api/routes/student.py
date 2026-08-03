from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.utils import from_json
from app.core.database import get_db
from app.core.dependencies import get_current_student
from app.models.internship import Internship
from app.models.student import Student
from app.schemas.internship import InternshipOut
from app.schemas.student import (
    ExtractedResumeOut,
    SkillConfirmRequest,
    StudentOut,
    StudentProfileUpdate,
)
from app.services.application_service import (
    apply_to_internship,
    get_student_applications,
    list_open_internships,
)
from app.services.allocation_service import get_student_result_if_published
from app.services.student_service import (
    confirm_skills,
    get_student_by_id,
    update_profile,
    upload_and_parse_resume,
)

router = APIRouter()


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=StudentOut)
async def get_profile(current: Student = Depends(get_current_student)):
    return current


@router.put("/profile", response_model=StudentOut)
async def update_student_profile(
    data: StudentProfileUpdate,
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await update_profile(db, current.id, data)


# ── Resume ────────────────────────────────────────────────────────────────────

@router.post("/resume/upload", response_model=ExtractedResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await upload_and_parse_resume(db, current.id, file)


@router.get("/resume/extracted")
async def get_extracted_data(current: Student = Depends(get_current_student)):
    return {
        "resume_status": current.resume_status,
        "skills_confirmed": current.skills_confirmed,
        "extracted_skills": from_json(current.extracted_skills),
        "confirmed_skills": from_json(current.confirmed_skills),
        "projects": from_json(current.extracted_projects),
        "certifications": from_json(current.extracted_certifications),
        "tools": from_json(current.extracted_tools),
        "languages": from_json(current.extracted_languages),
        "experience": from_json(current.extracted_experience),
        "name": current.name,
        "email": current.email,
        "college": current.college,
        "degree": current.degree,
        "branch": current.branch,
        "cgpa": current.cgpa,
    }


# ── Skills Confirmation ───────────────────────────────────────────────────────

@router.post("/skills/confirm", response_model=StudentOut)
async def confirm_student_skills(
    data: SkillConfirmRequest,
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await confirm_skills(db, current.id, data)


# ── Internship Browse ─────────────────────────────────────────────────────────

@router.get("/internships", response_model=list[InternshipOut])
async def browse_internships(
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """List all OPEN internships available for application."""
    return await list_open_internships(db)


@router.get("/internships/{internship_id}")
async def get_internship_detail(
    internship_id: int,
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """Get full details of a specific internship."""
    result = await db.execute(select(Internship).where(Internship.id == internship_id))
    internship = result.scalar_one_or_none()
    if not internship:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Internship not found")

    from app.models.application import Application
    applied = await db.execute(
        select(Application).where(
            Application.student_id == current.id,
            Application.internship_id == internship_id,
        )
    )
    already_applied = applied.scalar_one_or_none() is not None

    return {
        "id": internship.id,
        "title": internship.title,
        "description": internship.description,
        "required_skills": from_json(internship.required_skills),
        "preferred_degree": internship.preferred_degree,
        "preferred_branches": from_json(internship.preferred_branches),
        "min_cgpa": internship.min_cgpa,
        "location": internship.location,
        "sector": internship.sector,
        "mode": internship.mode,
        "seats": internship.seats,
        "duration": internship.duration,
        "application_deadline": internship.application_deadline.isoformat() if internship.application_deadline else None,
        "status": internship.status,
        "already_applied": already_applied,
    }


# ── Apply ─────────────────────────────────────────────────────────────────────

@router.post("/apply/{internship_id}", status_code=status.HTTP_201_CREATED)
async def apply(
    internship_id: int,
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """Apply to an internship. Rules enforced: open status, deadline, confirmed skills, no duplicate."""
    application = await apply_to_internship(db, current.id, internship_id)
    return {
        "message": "Application submitted successfully",
        "application_id": application.id,
        "internship_id": internship_id,
        "status": application.status,
        "applied_at": application.applied_at.isoformat(),
    }


# ── My Applications ───────────────────────────────────────────────────────────

@router.get("/applications")
async def my_applications(
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """View all internships the student has applied to."""
    return await get_student_applications(db, current.id)


# ── My Result ─────────────────────────────────────────────────────────────────

@router.get("/result")
async def my_result(
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """View allocation result — only visible after admin publishes results."""
    return await get_student_result_if_published(db, current.id)


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def student_dashboard(
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    from app.models.application import Application
    from sqlalchemy import select as sa_select

    # Applications
    app_result = await db.execute(
        sa_select(Application).where(Application.student_id == current.id)
    )
    applications = app_result.scalars().all()

    # Result (only if published)
    result_data = await get_student_result_if_published(db, current.id)

    open_internships = await list_open_internships(db)

    return {
        "student": {
            "id": current.id,
            "name": current.name,
            "email": current.email,
            "profile_completion": current.profile_completion,
            "resume_status": current.resume_status,
            "skills_confirmed": current.skills_confirmed,
        },
        "confirmed_skills": from_json(current.confirmed_skills),
        "stats": {
            "total_applications": len(applications),
            "open_internships_available": len(open_internships),
        },
        "result": result_data,
    }
