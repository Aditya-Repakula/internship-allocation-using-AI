from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_company, get_current_student
from app.models.company import Company
from app.models.student import Student
from app.schemas.auth import LoginRequest, Token
from app.schemas.company import CompanyOut, CompanyRegister
from app.schemas.student import StudentOut, StudentRegister
from app.services.auth_service import (
    login_company,
    login_student,
    register_company,
    register_student,
)

router = APIRouter()


# ── Student Auth ──────────────────────────────────────────────────────────────

@router.post("/student/register", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def student_register(data: StudentRegister, db: AsyncSession = Depends(get_db)):
    return await register_student(db, data)


@router.post("/student/login", response_model=Token)
async def student_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_student(db, data.email, data.password)


@router.get("/student/me", response_model=StudentOut)
async def student_me(current: Student = Depends(get_current_student)):
    return current


# ── Company Auth ──────────────────────────────────────────────────────────────

@router.post("/company/register", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def company_register(data: CompanyRegister, db: AsyncSession = Depends(get_db)):
    return await register_company(db, data)


@router.post("/company/login", response_model=Token)
async def company_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_company(db, data.email, data.password)


@router.get("/company/me", response_model=CompanyOut)
async def company_me(current: Company = Depends(get_current_company)):
    return current
