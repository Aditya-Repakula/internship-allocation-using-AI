import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin import Admin
from app.models.company import Company
from app.models.student import Student
from app.schemas.admin import AdminCreate
from app.schemas.auth import Token
from app.schemas.company import CompanyRegister
from app.schemas.student import StudentRegister
from app.utils.auth import create_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)


async def register_student(db: AsyncSession, data: StudentRegister) -> Student:
    existing = await db.execute(select(Student).where(Student.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    student = Student(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    logger.info(f"Student registered: {student.email}")
    return student


async def login_student(db: AsyncSession, email: str, password: str) -> Token:
    result = await db.execute(select(Student).where(Student.email == email, Student.is_active == True))
    student = result.scalar_one_or_none()

    if not student or not verify_password(password, student.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(subject=student.id, role="student")
    logger.info(f"Student logged in: {student.email}")
    return Token(access_token=token, role="student")


async def register_company(db: AsyncSession, data: CompanyRegister) -> Company:
    existing = await db.execute(select(Company).where(Company.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    company = Company(
        name=data.name,
        email=data.email,
        industry=data.industry,
        password_hash=hash_password(data.password),
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    logger.info(f"Company registered: {company.email}")
    return company


async def login_company(db: AsyncSession, email: str, password: str) -> Token:
    result = await db.execute(select(Company).where(Company.email == email, Company.is_active == True))
    company = result.scalar_one_or_none()

    if not company or not verify_password(password, company.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(subject=company.id, role="company")
    logger.info(f"Company logged in: {company.email}")
    return Token(access_token=token, role="company")


async def register_admin(db: AsyncSession, data: AdminCreate) -> Admin:
    existing = await db.execute(select(Admin).where(Admin.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    admin = Admin(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    logger.info(f"Admin registered: {admin.email}")
    return admin


async def login_admin(db: AsyncSession, email: str, password: str) -> Token:
    result = await db.execute(select(Admin).where(Admin.email == email, Admin.is_active == True))
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(subject=admin.id, role="admin")
    logger.info(f"Admin logged in: {admin.email}")
    return Token(access_token=token, role="admin")
