import pytest
import pytest_asyncio
import logging
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_db
from app.core.database import Base

logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("huggingface_hub").setLevel(logging.WARNING)

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def student_token(client):
    await client.post("/api/auth/student/register", json={
        "email": "test_student@test.com", "password": "test123",
        "name": "Test Student", "college": "Test College", "branch": "AIML", "cgpa": 8.5
    })
    res = await client.post("/api/auth/student/login", json={
        "email": "test_student@test.com", "password": "test123"
    })
    return res.json()["access_token"]


@pytest_asyncio.fixture
async def company_token(client):
    await client.post("/api/auth/company/register", json={
        "email": "test_company@test.com", "password": "test123",
        "name": "Test Company", "industry": "Technology"
    })
    res = await client.post("/api/auth/company/login", json={
        "email": "test_company@test.com", "password": "test123"
    })
    return res.json()["access_token"]
