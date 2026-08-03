from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.admin import Admin
from app.schemas.admin import AdminCreate, AdminOut
from app.schemas.auth import LoginRequest, Token
from app.schemas.company import CompanyOut
from app.schemas.internship import InternshipOut
from app.schemas.student import StudentOut
from app.services.admin_service import get_all_companies, get_all_internships, get_all_students
from app.services.auth_service import login_admin, register_admin

router = APIRouter()


# ── Admin Auth ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
async def admin_register(data: AdminCreate, db: AsyncSession = Depends(get_db)):
    return await register_admin(db, data)


@router.post("/login", response_model=Token)
async def admin_login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login_admin(db, data.email, data.password)


@router.get("/me", response_model=AdminOut)
async def admin_me(current: Admin = Depends(get_current_admin)):
    return current


# ── Admin Endpoints ──────────────────────────────────────────────────────────────

@router.get("/students", response_model=list[StudentOut])
async def get_students(
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await get_all_students(db)


@router.get("/companies", response_model=list[CompanyOut])
async def get_companies(
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await get_all_companies(db)


@router.get("/internships", response_model=list[InternshipOut])
async def get_internships(
    current: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await get_all_internships(db)
