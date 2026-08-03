import json

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_student
from app.models.student import Student
from app.schemas.student import (
    ExtractedResumeOut,
    SkillConfirmRequest,
    StudentOut,
    StudentProfileUpdate,
)
from app.services.student_service import (
    confirm_skills,
    get_student_by_id,
    update_profile,
    upload_and_parse_resume,
)
from app.ai.utils import from_json

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
    """Upload PDF resume — AI extracts and returns all parsed fields."""
    return await upload_and_parse_resume(db, current.id, file)


@router.get("/resume/extracted")
async def get_extracted_data(current: Student = Depends(get_current_student)):
    """Return the last AI-extracted resume data for student review."""
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
    }


# ── Skills Confirmation ───────────────────────────────────────────────────────

@router.post("/skills/confirm", response_model=StudentOut)
async def confirm_student_skills(
    data: SkillConfirmRequest,
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Student reviews AI-extracted skills, edits if needed, and confirms.
    These confirmed skills are used by the AI matching engine.
    """
    return await confirm_skills(db, current.id, data)


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def student_dashboard(
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """Returns all data needed to render the student dashboard."""
    from app.services.allocation_service import get_student_allocation
    from app.models.internship import Internship
    from sqlalchemy import select

    allocation = await get_student_allocation(db, current.id)
    internship = None
    if allocation:
        result = await db.execute(select(Internship).where(Internship.id == allocation.internship_id))
        internship_obj = result.scalar_one_or_none()
        if internship_obj:
            internship = {
                "id": internship_obj.id,
                "role": internship_obj.role,
                "location": internship_obj.location,
                "mode": internship_obj.mode,
                "duration": internship_obj.duration,
            }

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
        "allocation": {
            "allocated": allocation is not None,
            "internship": internship,
            "match_score": allocation.match_score if allocation else None,
            "rank": allocation.rank if allocation else None,
            "status": allocation.status if allocation else None,
            "allocated_at": allocation.allocated_at.isoformat() if allocation else None,
            "reason": json.loads(allocation.allocation_reason) if allocation and allocation.allocation_reason else None,
        },
    }
