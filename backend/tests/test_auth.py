import pytest


@pytest.mark.asyncio
async def test_student_register(client):
    res = await client.post("/api/auth/student/register", json={
        "email": "new_student@test.com", "password": "test123",
        "name": "New Student", "college": "ABC College", "branch": "CSE", "cgpa": 7.5
    })
    assert res.status_code == 201
    assert res.json()["email"] == "new_student@test.com"


@pytest.mark.asyncio
async def test_student_register_duplicate(client):
    data = {"email": "dup@test.com", "password": "test123", "name": "Dup", "college": "X", "branch": "CSE", "cgpa": 7.0}
    await client.post("/api/auth/student/register", json=data)
    res = await client.post("/api/auth/student/register", json=data)
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_student_login(client):
    await client.post("/api/auth/student/register", json={
        "email": "login_test@test.com", "password": "test123",
        "name": "Login Test", "college": "X", "branch": "CSE", "cgpa": 7.0
    })
    res = await client.post("/api/auth/student/login", json={
        "email": "login_test@test.com", "password": "test123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["role"] == "student"


@pytest.mark.asyncio
async def test_student_login_wrong_password(client):
    res = await client.post("/api/auth/student/login", json={
        "email": "login_test@test.com", "password": "wrongpass"
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_company_register_and_login(client):
    res = await client.post("/api/auth/company/register", json={
        "email": "comp_login@test.com", "password": "test123",
        "name": "Comp", "industry": "Tech"
    })
    assert res.status_code == 201

    res = await client.post("/api/auth/company/login", json={
        "email": "comp_login@test.com", "password": "test123"
    })
    assert res.status_code == 200
    assert res.json()["role"] == "company"


@pytest.mark.asyncio
async def test_student_me(client, student_token):
    res = await client.get("/api/auth/student/me", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "test_student@test.com"
