import pytest

from tests.conftest import INTERNSHIP_PAYLOAD


@pytest.mark.asyncio
async def test_admin_me(client, admin_token):
    res = await client.get("/api/auth/admin/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_only_one_admin_allowed(client, admin_token):
    res = await client.post(
        "/api/auth/admin/register",
        json={"email": "second@test.com", "password": "admin123", "name": "Second"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_create_and_list_internships(client, admin_token):
    res = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=INTERNSHIP_PAYLOAD,
    )
    assert res.status_code == 201
    assert res.json()["title"] == "AI/ML Intern"
    assert res.json()["status"] == "open"

    listed = await client.get(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert listed.status_code == 200
    assert len(listed.json()) >= 1


@pytest.mark.asyncio
async def test_close_and_status(client, admin_token):
    create = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=INTERNSHIP_PAYLOAD,
    )
    iid = create.json()["id"]
    res = await client.patch(
        f"/api/admin/internships/{iid}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "closed"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "closed"


@pytest.mark.asyncio
async def test_admin_dashboard(client, admin_token):
    res = await client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert "stats" in res.json()
    assert "internships" in res.json()


@pytest.mark.asyncio
async def test_admin_students_list(client, admin_token, student_token):
    res = await client.get(
        "/api/admin/students",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert len(res.json()) >= 1
