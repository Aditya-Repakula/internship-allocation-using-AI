import json

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.utils import from_json
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.admin import Admin
from app.models.internship import Internship
from app.models.student import Student
from app.schemas.admin import AdminOut
from app.schemas.internship import InternshipCreate, InternshipOut, InternshipUpdate
from app.schemas.student import StudentOut
from app.services.admin_service import (
    create_internship,
    delete_internship,
    get_all_internships,
    get_all_students,
    get_internship_by_id,
    publish_results,
    set_internship_status,
    update_internship,
)
from app.services.allocation_service import (
    get_internship_allocations,
    preview_allocation_for_internship,
    preview_global_allocation,
    run_allocation_for_internship,
    run_global_allocation,
)
from app.services.application_service import get_applicant_count, get_internship_applicants

router = APIRouter()


# ── Admin Profile ─────────────────────────────────────────────────────────────

@router.get("/me", response_model=AdminOut)
async def get_me(current: Admin = Depends(get_current_admin)):
    return current


# ── Internship CRUD ───────────────────────────────────────────────────────────

@router.post("/internships", response_model=InternshipOut, status_code=status.HTTP_201_CREATED)
async def create(
    data: InternshipCreate,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await create_internship(db, data)


@router.get("/internships", response_model=list[InternshipOut])
async def list_internships(
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await get_all_internships(db)


@router.get("/internships/{internship_id}", response_model=InternshipOut)
async def get_internship(
    internship_id: int,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await get_internship_by_id(db, internship_id)


@router.put("/internships/{internship_id}", response_model=InternshipOut)
async def update(
    internship_id: int,
    data: InternshipUpdate,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await update_internship(db, internship_id, data)


@router.delete("/internships/{internship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    internship_id: int,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    await delete_internship(db, internship_id)


# ── Lifecycle Controls ────────────────────────────────────────────────────────

@router.patch("/internships/{internship_id}/status", response_model=InternshipOut)
async def change_status(
    internship_id: int,
    body: dict,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Set internship status. Body: {"status": "open" | "closed" | ...}"""
    new_status = body.get("status")
    if not new_status:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="status field required")
    return await set_internship_status(db, internship_id, new_status)


@router.get("/internships/{internship_id}/preview-allocation")
async def preview_allocation(
    internship_id: int,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Preview AI allocation for a specific internship without persisting results."""
    return await preview_allocation_for_internship(db, internship_id)


@router.post("/internships/{internship_id}/run-allocation")
async def trigger_allocation(
    internship_id: int,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Run AI allocation for a specific internship. Internship must be CLOSED."""
    return await run_allocation_for_internship(db, internship_id)


@router.get("/preview-allocation")
async def preview_global(
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Preview AI allocation across all CLOSED internships without making changes."""
    return await preview_global_allocation(db)


@router.post("/run-allocation")
async def trigger_global_allocation(
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Run AI allocation across all CLOSED internships in one batch.
    Resolves multi-internship conflicts (one student → one allocation).
    Does NOT publish results — admin must call publish separately.
    """
    return await run_global_allocation(db)


@router.post("/internships/{internship_id}/publish-results", response_model=InternshipOut)
async def publish(
    internship_id: int,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Publish allocation results so students can see them."""
    return await publish_results(db, internship_id)


# ── View Applicants ───────────────────────────────────────────────────────────

@router.get("/internships/{internship_id}/applicants")
async def get_applicants(
    internship_id: int,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """View all students who applied to an internship."""
    internship = await get_internship_by_id(db, internship_id)
    applications = await get_internship_applicants(db, internship_id)

    applicants = []
    for app in applications:
        s_result = await db.execute(select(Student).where(Student.id == app.student_id))
        student = s_result.scalar_one_or_none()
        if student:
            applicants.append({
                "application_id": app.id,
                "student_id": student.id,
                "name": student.name,
                "email": student.email,
                "college": student.college,
                "degree": student.degree,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "skills_confirmed": student.skills_confirmed,
                "confirmed_skills": from_json(student.confirmed_skills),
                "application_status": app.status,
                "applied_at": app.applied_at.isoformat(),
            })

    return {
        "internship_id": internship_id,
        "title": internship.title,
        "seats": internship.seats,
        "status": internship.status,
        "total_applicants": len(applicants),
        "applicants": applicants,
    }


# ── View Allocation Results ───────────────────────────────────────────────────

@router.get("/internships/{internship_id}/allocations")
async def get_allocations(
    internship_id: int,
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """View allocation results for an internship (admin review before publishing)."""
    internship = await get_internship_by_id(db, internship_id)
    allocations = await get_internship_allocations(db, internship_id)
    applicant_count = await get_applicant_count(db, internship_id)

    students = []
    for alloc in allocations:
        s_result = await db.execute(select(Student).where(Student.id == alloc.student_id))
        student = s_result.scalar_one_or_none()
        if not student:
            continue
        reason = {}
        if alloc.allocation_reason:
            try:
                reason = json.loads(alloc.allocation_reason)
            except Exception:
                pass
        students.append({
            "rank": alloc.rank,
            "student_id": student.id,
            "name": student.name,
            "email": student.email,
            "college": student.college,
            "degree": student.degree,
            "branch": student.branch,
            "cgpa": student.cgpa,
            "match_scores": {
                "overall": alloc.overall_match_score,
                "skills": alloc.skills_score,
                "degree": alloc.degree_score,
                "branch": alloc.branch_score,
                "cgpa": alloc.cgpa_score,
                "location": alloc.location_score,
                "sector": alloc.sector_score,
            },
            "matched_skills": reason.get("matched_skills", []),
            "missing_skills": reason.get("unmatched_skills", []),
            "reasons": reason.get("reasons", []),
            "status": alloc.status,
            "allocated_at": alloc.allocated_at.isoformat(),
        })

    return {
        "internship_id": internship_id,
        "title": internship.title,
        "seats": internship.seats,
        "seats_filled": len(students),
        "seats_remaining": internship.seats - len(students),
        "total_applicants": applicant_count,
        "results_published": internship.results_published,
        "status": internship.status,
        "allocated_students": students,
    }


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def admin_dashboard(
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    internships = await get_all_internships(db)
    students = await get_all_students(db)

    summary = []
    for internship in internships:
        applicant_count = await get_applicant_count(db, internship.id)
        allocs = await get_internship_allocations(db, internship.id)
        summary.append({
            "id": internship.id,
            "title": internship.title,
            "location": internship.location,
            "mode": internship.mode,
            "seats": internship.seats,
            "seats_filled": len(allocs),
            "total_applicants": applicant_count,
            "status": internship.status,
            "results_published": internship.results_published,
            "application_deadline": internship.application_deadline.isoformat() if internship.application_deadline else None,
            "required_skills": from_json(internship.required_skills),
        })

    return {
        "admin": {"id": current.id, "name": current.name, "email": current.email},
        "stats": {
            "total_students": len(students),
            "total_internships": len(internships),
            "open_internships": sum(1 for i in internships if i.status == "open"),
            "allocated_internships": sum(1 for i in internships if i.status in ("allocated", "results_published")),
        },
        "internships": summary,
    }


# ── Students listing ──────────────────────────────────────────────────────────

@router.get("/students", response_model=list[StudentOut])
async def get_students(
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await get_all_students(db)
