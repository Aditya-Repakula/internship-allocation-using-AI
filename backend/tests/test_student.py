import pytest


@pytest.mark.asyncio
async def test_get_student_profile(client, student_token):
    res = await client.get("/api/student/profile", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "test_student@test.com"


@pytest.mark.asyncio
async def test_update_student_profile(client, student_token):
    res = await client.put("/api/student/profile", headers={"Authorization": f"Bearer {student_token}"}, json={
        "phone": "9999999999",
        "preferred_location": "Bangalore",
        "interested_sector": "AI/ML",
        "degree": "B.Tech"
    })
    assert res.status_code == 200
    assert res.json()["preferred_location"] == "Bangalore"


@pytest.mark.asyncio
async def test_student_dashboard(client, student_token):
    res = await client.get("/api/student/dashboard", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "student" in data
    assert "profile_completion" in data["student"]


@pytest.mark.asyncio
async def test_confirm_skills(client, student_token):
    res = await client.post("/api/student/skills/confirm",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"confirmed_skills": ["Python", "Machine Learning", "Deep Learning"]}
    )
    assert res.status_code == 200
    assert res.json()["skills_confirmed"] is True


@pytest.mark.asyncio
async def test_unauthorized_access(client):
    res = await client.get("/api/student/profile")
    assert res.status_code in [401, 403]


@pytest.mark.asyncio
async def test_get_extracted_resume_data(client, student_token):
    """Extracted resume endpoint returns expected structure even before upload."""
    res = await client.get("/api/student/resume/extracted",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "resume_status" in data
    assert "extracted_skills" in data
    assert "confirmed_skills" in data
    assert isinstance(data["extracted_skills"], list)


@pytest.mark.asyncio
async def test_reconfirm_skills_with_different_set(client, student_token):
    """Student can re-confirm skills multiple times; latest wins."""
    await client.post("/api/student/skills/confirm",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"confirmed_skills": ["Python", "SQL"]}
    )
    res = await client.post("/api/student/skills/confirm",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"confirmed_skills": ["React", "Node.js", "MongoDB"]}
    )
    assert res.status_code == 200
    assert res.json()["skills_confirmed"] is True


@pytest.mark.asyncio
async def test_admin_cannot_access_student_route(client, admin_token):
    """Admin token must not be accepted on student-only endpoints."""
    res = await client.get(
        "/api/student/profile",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 403
