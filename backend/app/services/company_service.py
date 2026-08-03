import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.utils import from_json, to_json
from app.models.internship import Internship
from app.schemas.internship import InternshipCreate, InternshipUpdate

logger = logging.getLogger(__name__)


async def create_internship(db: AsyncSession, company_id: int, data: InternshipCreate) -> Internship:
    internship = Internship(
        company_id=company_id,
        role=data.role,
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
        application_deadline=data.application_deadline,
    )
    db.add(internship)
    await db.commit()
    await db.refresh(internship)
    logger.info(f"Internship created: {internship.role} by company {company_id}")
    return internship


async def get_company_internships(db: AsyncSession, company_id: int) -> list[Internship]:
    result = await db.execute(
        select(Internship).where(Internship.company_id == company_id)
    )
    return result.scalars().all()


async def update_internship(
    db: AsyncSession, internship_id: int, company_id: int, data: InternshipUpdate
) -> Internship:
    result = await db.execute(
        select(Internship).where(Internship.id == internship_id, Internship.company_id == company_id)
    )
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")

    updates = data.model_dump(exclude_unset=True)
    json_fields = {"required_skills", "preferred_branches"}

    for field, value in updates.items():
        if field in json_fields:
            setattr(internship, field, to_json(value or []))
        else:
            setattr(internship, field, value)

    await db.commit()
    await db.refresh(internship)
    return internship


async def delete_internship(db: AsyncSession, internship_id: int, company_id: int) -> None:
    result = await db.execute(
        select(Internship).where(Internship.id == internship_id, Internship.company_id == company_id)
    )
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    await db.delete(internship)
    await db.commit()
