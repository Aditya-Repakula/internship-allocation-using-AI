from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.utils import from_json
from app.core.database import get_db
from app.core.dependencies import get_current_company
from app.models.company import Company
from app.models.internship import Internship
from app.models.student import Student
from app.schemas.company import CompanyOut
from app.schemas.internship import InternshipCreate, InternshipOut, InternshipUpdate
from app.services.allocation_service import get_internship_allocations
from app.services.company_service import (
    create_internship,
    delete_internship,
    get_company_internships,
    update_internship,
)

router = APIRouter()


# ── Company Profile ───────────────────────────────────────────────────────────

@router.get("/profile", response_model=CompanyOut)
async def get_profile(current: Company = Depends(get_current_company)):
    return current


# ── Internship CRUD ───────────────────────────────────────────────────────────

@router.post("/internships", response_model=InternshipOut, status_code=status.HTTP_201_CREATED)
async def create(
    data: InternshipCreate,
    current: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    return await create_internship(db, current.id, data)


@router.get("/internships", response_model=list[InternshipOut])
async def list_internships(
    current: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    return await get_company_internships(db, current.id)


@router.get("/internships/{internship_id}", response_model=InternshipOut)
async def get_internship(
    internship_id: int,
    current: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Internship).where(
            Internship.id == internship_id,
            Internship.company_id == current.id,
        )
    )
    internship = result.scalar_one_or_none()
    if not internship:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Internship not found")
    return internship


@router.put("/internships/{internship_id}", response_model=InternshipOut)
async def update(
    internship_id: int,
    data: InternshipUpdate,
    current: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    return await update_internship(db, internship_id, current.id, data)


@router.delete("/internships/{internship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    internship_id: int,
    current: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    await delete_internship(db, internship_id, current.id)


@router.patch("/internships/{internship_id}/close", response_model=InternshipOut)
async def close_internship(
    internship_id: int,
    current: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    """Close an internship so it no longer accepts allocations."""
    result = await db.execute(
        select(Internship).where(
            Internship.id == internship_id,
            Internship.company_id == current.id,
        )
    )
    internship = result.scalar_one_or_none()
    if not internship:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Internship not found")
    internship.status = "closed"
    await db.commit()
    await db.refresh(internship)
    return internship


# ── Allocated Students ────────────────────────────────────────────────────────

@router.get("/internships/{internship_id}/students")
async def get_allocated_students(
    internship_id: int,
    current: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    """View all students allocated to a specific internship with their match scores."""
    # Verify internship belongs to this company
    result = await db.execute(
        select(Internship).where(
            Internship.id == internship_id,
            Internship.company_id == current.id,
        )
    )
    internship = result.scalar_one_or_none()
    if not internship:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Internship not found")

    allocations = await get_internship_allocations(db, internship_id)

    students = []
    for alloc in allocations:
        s_result = await db.execute(select(Student).where(Student.id == alloc.student_id))
        student = s_result.scalar_one_or_none()
        if student:
            students.append({
                "rank": alloc.rank,
                "student_id": student.id,
                "name": student.name,
                "email": student.email,
                "college": student.college,
                "degree": student.degree,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "match_score": alloc.match_score,
                "skills_score": alloc.skills_score,
                "degree_score": alloc.degree_score,
                "branch_score": alloc.branch_score,
                "cgpa_score": alloc.cgpa_score,
                "confirmed_skills": from_json(student.confirmed_skills),
                "status": alloc.status,
                "allocated_at": alloc.allocated_at.isoformat(),
            })

    return {
        "internship_id": internship_id,
        "role": internship.role,
        "seats": internship.seats,
        "seats_filled": len(students),
        "seats_remaining": internship.seats - len(students),
        "students": students,
    }


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def company_dashboard(
    current: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    """Returns all data needed to render the company dashboard."""
    internships = await get_company_internships(db, current.id)

    summary = []
    total_seats = 0
    total_filled = 0

    for internship in internships:
        allocations = await get_internship_allocations(db, internship.id)
        filled = len(allocations)
        total_seats += internship.seats
        total_filled += filled
        summary.append({
            "id": internship.id,
            "role": internship.role,
            "location": internship.location,
            "sector": internship.sector,
            "mode": internship.mode,
            "seats": internship.seats,
            "seats_filled": filled,
            "seats_remaining": internship.seats - filled,
            "status": internship.status,
            "required_skills": from_json(internship.required_skills),
        })

    return {
        "company": {
            "id": current.id,
            "name": current.name,
            "email": current.email,
            "industry": current.industry,
        },
        "stats": {
            "total_internships": len(internships),
            "open_internships": sum(1 for i in internships if i.status == "open"),
            "total_seats": total_seats,
            "seats_filled": total_filled,
            "seats_remaining": total_seats - total_filled,
        },
        "internships": summary,
    }
