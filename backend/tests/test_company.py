import pytest

from tests.conftest import INTERNSHIP_PAYLOAD


@pytest.mark.asyncio
async def test_admin_internship_crud(client, admin_token):
    res = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=INTERNSHIP_PAYLOAD,
    )
    assert res.status_code == 201
    iid = res.json()["id"]
    assert res.json()["title"] == "AI/ML Intern"

    got = await client.get(
        f"/api/admin/internships/{iid}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert got.status_code == 200

    updated = await client.put(
        f"/api/admin/internships/{iid}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"title": "Updated Intern", "seats": 5},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated Intern"
    assert updated.json()["seats"] == 5

    deleted = await client.delete(
        f"/api/admin/internships/{iid}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert deleted.status_code == 204


@pytest.mark.asyncio
async def test_student_cannot_manage_internships(client, student_token):
    res = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {student_token}"},
        json=INTERNSHIP_PAYLOAD,
    )
    assert res.status_code == 403
