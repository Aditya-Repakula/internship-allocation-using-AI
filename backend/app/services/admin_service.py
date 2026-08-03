from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.internship import Internship
from app.models.student import Student


async def get_all_students(db: AsyncSession):
    result = await db.execute(select(Student))
    return result.scalars().all()


async def get_all_companies(db: AsyncSession):
    result = await db.execute(select(Company))
    return result.scalars().all()


async def get_all_internships(db: AsyncSession):
    result = await db.execute(select(Internship))
    return result.scalars().all()
