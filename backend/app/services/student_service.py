import json
import logging
import os
import shutil

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.resume_parser import parse_resume
from app.ai.utils import calculate_profile_completion, from_json, to_json
from app.core.config import settings
from app.models.student import Student
from app.schemas.student import StudentProfileUpdate, SkillConfirmRequest

logger = logging.getLogger(__name__)


async def get_student_by_id(db: AsyncSession, student_id: int) -> Student:
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


async def update_profile(db: AsyncSession, student_id: int, data: StudentProfileUpdate) -> Student:
    student = await get_student_by_id(db, student_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(student, field, value)
    student.profile_completion = calculate_profile_completion(student)
    await db.commit()
    await db.refresh(student)
    return student


async def upload_and_parse_resume(db: AsyncSession, student_id: int, file: UploadFile) -> dict:
    """Save PDF, parse it, store extracted fields, return parsed data."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    student = await get_student_by_id(db, student_id)

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, f"student_{student_id}.pdf")
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse
    parsed = parse_resume(file_path)

    # Store extracted data
    student.resume_path = file_path
    student.resume_status = "parsed"
    student.extracted_skills = to_json(parsed.skills)
    student.extracted_projects = to_json(parsed.projects)
    student.extracted_certifications = to_json(parsed.certifications)
    student.extracted_tools = to_json(parsed.tools)
    student.extracted_languages = to_json(parsed.languages)
    student.extracted_experience = to_json(parsed.experience)
    student.skills_confirmed = False

    # Auto-fill profile fields if empty
    if not student.college and parsed.college:
        student.college = parsed.college
    if not student.degree and parsed.degree:
        student.degree = parsed.degree
    if not student.branch and parsed.branch:
        student.branch = parsed.branch
    if not student.cgpa and parsed.cgpa:
        student.cgpa = parsed.cgpa

    student.profile_completion = calculate_profile_completion(student)
    await db.commit()

    logger.info(f"Resume parsed for student {student_id}: {len(parsed.skills)} skills extracted")

    return {
        "name": parsed.name,
        "email": parsed.email,
        "phone": parsed.phone,
        "college": parsed.college,
        "degree": parsed.degree,
        "branch": parsed.branch,
        "cgpa": parsed.cgpa,
        "skills": parsed.skills,
        "projects": parsed.projects,
        "certifications": parsed.certifications,
        "tools": parsed.tools,
        "languages": parsed.languages,
        "experience": parsed.experience,
    }


async def confirm_skills(db: AsyncSession, student_id: int, data: SkillConfirmRequest) -> Student:
    """Student reviews and confirms/edits extracted skills."""
    student = await get_student_by_id(db, student_id)
    student.confirmed_skills = to_json(data.confirmed_skills)
    student.skills_confirmed = True
    student.resume_status = "confirmed"
    student.profile_completion = calculate_profile_completion(student)
    await db.commit()
    await db.refresh(student)
    logger.info(f"Student {student_id} confirmed {len(data.confirmed_skills)} skills")
    return student
