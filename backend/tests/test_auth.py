import pytest


@pytest.mark.asyncio
async def test_student_register(client):
    res = await client.post(
        "/api/auth/student/register",
        json={
            "email": "new_student@test.com",
            "password": "test1234",
            "name": "New Student",
            "phone": "9999999999",
        },
    )
    assert res.status_code == 201
    assert res.json()["email"] == "new_student@test.com"


@pytest.mark.asyncio
async def test_student_register_duplicate(client):
    data = {
        "email": "dup@test.com",
        "password": "test1234",
        "name": "Dup",
        "phone": "111",
    }
    await client.post("/api/auth/student/register", json=data)
    res = await client.post("/api/auth/student/register", json=data)
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_student_login(client):
    await client.post(
        "/api/auth/student/register",
        json={
            "email": "login_test@test.com",
            "password": "test1234",
            "name": "Login Test",
        },
    )
    res = await client.post(
        "/api/auth/student/login",
        json={"email": "login_test@test.com", "password": "test1234"},
    )
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["role"] == "student"


@pytest.mark.asyncio
async def test_student_login_wrong_password(client):
    await client.post(
        "/api/auth/student/register",
        json={
            "email": "wrongpw@test.com",
            "password": "test1234",
            "name": "Wrong",
        },
    )
    res = await client.post(
        "/api/auth/student/login",
        json={"email": "wrongpw@test.com", "password": "wrongpass"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_admin_register_and_login(client):
    res = await client.post(
        "/api/auth/admin/register",
        json={
            "email": "admin_login@test.com",
            "password": "admin123",
            "name": "Admin",
        },
    )
    assert res.status_code == 201

    res = await client.post(
        "/api/auth/admin/login",
        json={"email": "admin_login@test.com", "password": "admin123"},
    )
    assert res.status_code == 200
    assert res.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_student_me(client, student_token):
    res = await client.get(
        "/api/auth/student/me",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 200
    assert res.json()["email"] == "test_student@test.com"
