import pytest


@pytest.mark.asyncio
async def test_admin_register(client):
    res = await client.post("/api/admin/register", json={
        "email": "admin@test.com", "password": "admin123", "name": "Test Admin"
    })
    assert res.status_code == 201
    assert res.json()["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_admin_login(client):
    await client.post("/api/admin/register", json={
        "email": "admin_login@test.com", "password": "admin123", "name": "Login Admin"
    })
    res = await client.post("/api/admin/login", json={
        "email": "admin_login@test.com", "password": "admin123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_admin_me(client):
    await client.post("/api/admin/register", json={
        "email": "admin_me@test.com", "password": "admin123", "name": "Me Admin"
    })
    login_res = await client.post("/api/admin/login", json={
        "email": "admin_me@test.com", "password": "admin123"
    })
    token = login_res.json()["access_token"]
    res = await client.get("/api/admin/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "admin_me@test.com"


@pytest.mark.asyncio
async def test_admin_get_students(client):
    await client.post("/api/admin/register", json={
        "email": "admin_get@test.com", "password": "admin123", "name": "Get Admin"
    })
    login_res = await client.post("/api/admin/login", json={
        "email": "admin_get@test.com", "password": "admin123"
    })
    token = login_res.json()["access_token"]
    res = await client.get("/api/admin/students", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.asyncio
async def test_admin_get_companies(client):
    await client.post("/api/admin/register", json={
        "email": "admin_comp@test.com", "password": "admin123", "name": "Comp Admin"
    })
    login_res = await client.post("/api/admin/login", json={
        "email": "admin_comp@test.com", "password": "admin123"
    })
    token = login_res.json()["access_token"]
    res = await client.get("/api/admin/companies", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.asyncio
async def test_admin_get_internships(client):
    await client.post("/api/admin/register", json={
        "email": "admin_int@test.com", "password": "admin123", "name": "Int Admin"
    })
    login_res = await client.post("/api/admin/login", json={
        "email": "admin_int@test.com", "password": "admin123"
    })
    token = login_res.json()["access_token"]
    res = await client.get("/api/admin/internships", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)
