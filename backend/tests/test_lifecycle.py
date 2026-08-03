import pytest
from datetime import date, timedelta

from tests.conftest import INTERNSHIP_PAYLOAD


@pytest.mark.asyncio
async def test_invalid_status_jump_blocked(client, admin_token):
    create = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={**INTERNSHIP_PAYLOAD, "status": "draft"},
    )
    iid = create.json()["id"]

    # draft → closed is invalid
    res = await client.patch(
        f"/api/admin/internships/{iid}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "closed"},
    )
    assert res.status_code == 400

    # draft → open is valid
    res = await client.patch(
        f"/api/admin/internships/{iid}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "open"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "open"

    # open → allocated is invalid (must run allocation engine)
    res = await client.patch(
        f"/api/admin/internships/{iid}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "allocated"},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_cannot_create_as_allocated(client, admin_token):
    res = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={**INTERNSHIP_PAYLOAD, "status": "allocated"},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_auto_close_expired_deadline(client, admin_token, student_token):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    create = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            **INTERNSHIP_PAYLOAD,
            "status": "open",
            "application_deadline": yesterday,
        },
    )
    assert create.status_code == 201
    iid = create.json()["id"]

    # Student browse triggers auto-close
    listed = await client.get(
        "/api/student/internships",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert listed.status_code == 200
    assert all(i["id"] != iid for i in listed.json())

    # Admin view should show closed
    got = await client.get(
        f"/api/admin/internships/{iid}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    # get_by_id does not auto-close; list/dashboard does — force via list
    await client.get("/api/admin/internships", headers={"Authorization": f"Bearer {admin_token}"})
    got = await client.get(
        f"/api/admin/internships/{iid}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert got.json()["status"] == "closed"


@pytest.mark.asyncio
async def test_apply_blocked_before_start_date(client, admin_token, student_token):
    future = (date.today() + timedelta(days=7)).isoformat()
    create = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            **INTERNSHIP_PAYLOAD,
            "status": "open",
            "application_start_date": future,
            "application_deadline": (date.today() + timedelta(days=30)).isoformat(),
        },
    )
    iid = create.json()["id"]

    await client.put(
        "/api/student/profile",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"branch": "AIML", "degree": "B.Tech", "cgpa": 8.0},
    )
    await client.post(
        "/api/student/skills/confirm",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"confirmed_skills": ["Python"]},
    )

    res = await client.post(
        f"/api/student/apply/{iid}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 400
    assert "not opened" in res.json()["detail"].lower()
