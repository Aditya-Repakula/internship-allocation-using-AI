import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_company, get_current_student
from app.models.internship import Internship
from app.models.student import Student
from app.services.allocation_service import (
    get_internship_allocations,
    get_student_allocation,
    run_full_allocation,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Trigger Allocation (Company only) ─────────────────────────────────────────

@router.post("/run")
async def trigger_allocation(
    current=Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    """
    Run the full AI matching + allocation engine.
    Matches every confirmed student against every open internship.
    Allocates top-N students per internship based on weighted match score.
    """
    logger.info(f"Allocation triggered by company {current.id}")
    result = await run_full_allocation(db)
    return result


# ── Student: View My Allocation Result ────────────────────────────────────────

@router.get("/my-result")
async def my_allocation_result(
    current: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """Student views their internship allocation result and match score."""
    allocation = await get_student_allocation(db, current.id)

    if not allocation:
        return {
            "allocated": False,
            "message": "You have not been allocated to any internship yet.",
        }

    internship_result = await db.execute(
        select(Internship).where(Internship.id == allocation.internship_id)
    )
    internship = internship_result.scalar_one_or_none()

    reason = {}
    if allocation.allocation_reason:
        try:
            reason = json.loads(allocation.allocation_reason)
        except Exception:
            pass

    return {
        "allocated": True,
        "allocation": {
            "id": allocation.id,
            "status": allocation.status,
            "rank": allocation.rank,
            "allocated_at": allocation.allocated_at.isoformat(),
        },
        "match_scores": {
            "overall": allocation.match_score,
            "skills": allocation.skills_score,
            "degree": allocation.degree_score,
            "branch": allocation.branch_score,
            "cgpa": allocation.cgpa_score,
            "location": allocation.location_score,
            "sector": allocation.sector_score,
        },
        "internship": {
            "id": internship.id,
            "role": internship.role,
            "description": internship.description,
            "location": internship.location,
            "mode": internship.mode,
            "duration": internship.duration,
        } if internship else None,
        "reason": reason,
    }


# ── Company: View Allocations for an Internship ───────────────────────────────

@router.get("/internship/{internship_id}")
async def internship_allocation_results(
    internship_id: int,
    current=Depends(get_current_company),
    db: AsyncSession = Depends(get_db),
):
    """Company views all allocated students for a specific internship."""
    internship_result = await db.execute(
        select(Internship).where(
            Internship.id == internship_id,
            Internship.company_id == current.id,
        )
    )
    internship = internship_result.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")

    allocations = await get_internship_allocations(db, internship_id)

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
                "overall": alloc.match_score,
                "skills": alloc.skills_score,
                "degree": alloc.degree_score,
                "branch": alloc.branch_score,
                "cgpa": alloc.cgpa_score,
                "location": alloc.location_score,
                "sector": alloc.sector_score,
            },
            "matched_skills": reason.get("matched_skills", []),
            "unmatched_skills": reason.get("unmatched_skills", []),
            "reasons": reason.get("reasons", []),
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
