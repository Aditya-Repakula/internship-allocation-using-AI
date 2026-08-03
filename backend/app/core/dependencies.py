import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.admin import Admin
from app.models.student import Student
from app.utils.auth import decode_token

logger = logging.getLogger(__name__)

_bearer = HTTPBearer()


def _get_payload(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload


async def get_current_student(
    payload: dict = Depends(_get_payload),
    db: AsyncSession = Depends(get_db),
) -> Student:
    if payload.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")

    result = await db.execute(
        select(Student).where(Student.id == int(payload["sub"]), Student.is_active == True)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


async def get_current_admin(
    payload: dict = Depends(_get_payload),
    db: AsyncSession = Depends(get_db),
) -> Admin:
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    result = await db.execute(
        select(Admin).where(Admin.id == int(payload["sub"]), Admin.is_active == True)
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    return admin
