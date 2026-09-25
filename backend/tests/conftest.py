import logging

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 — register ORM models on Base.metadata
from app.core.database import Base, get_db
from app.main import app

logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("huggingface_hub").setLevel(logging.WARNING)

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def student_token(client):
    await client.post(
        "/api/auth/student/register",
        json={
            "email": "test_student@test.com",
            "password": "test1234",
            "name": "Test Student",
            "phone": "9999999999",
        },
    )
    res = await client.post(
        "/api/auth/student/login",
        json={"email": "test_student@test.com", "password": "test1234"},
    )
    return res.json()["access_token"]


@pytest_asyncio.fixture
async def admin_token(client):
    await client.post(
        "/api/auth/admin/register",
        json={
            "email": "admin@test.com",
            "password": "admin123",
            "name": "Test Admin",
        },
    )
    res = await client.post(
        "/api/auth/admin/login",
        json={"email": "admin@test.com", "password": "admin123"},
    )
    return res.json()["access_token"]


INTERNSHIP_PAYLOAD = {
    "title": "AI/ML Intern",
    "description": "Work on ML models",
    "required_skills": ["Python", "Machine Learning"],
    "preferred_degree": "B.Tech",
    "preferred_branches": ["AIML", "CSE"],
    "min_cgpa": 7.0,
    "location": "Bangalore",
    "mode": "onsite",
    "seats": 2,
    "sector": "AI/ML",
    "duration": "3 months",
    "status": "open",
}
