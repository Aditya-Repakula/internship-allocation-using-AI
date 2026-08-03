from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_student
from app.models.admin import Admin
from app.models.student import Student
from app.schemas.admin import AdminCreate, AdminOut
from app.schemas.auth import LoginRequest, Token
from app.schemas.student import StudentOut, StudentRegister
from app.services.auth_service import (
    login_admin,
    login_student,
    register_admin,
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


# ── Admin Auth ────────────────────────────────────────────────────────────────

@router.post("/admin/register", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
async def admin_register(data: AdminCreate, db: AsyncSession = Depends(get_db)):
    return await register_admin(db, data)


@router.post("/admin/login", response_model=Token)
async def admin_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_admin(db, data.email, data.password)


@router.get("/admin/me", response_model=AdminOut)
async def admin_me(current: Admin = Depends(get_current_admin)):
    return current
