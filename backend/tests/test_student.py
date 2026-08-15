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
async def test_open_internships_include_eligibility_flags(client, student_token, admin_token):
    await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "AI Intern",
            "description": "Build ML prototypes",
            "required_skills": ["Python", "Machine Learning"],
            "preferred_degree": "B.Tech",
            "preferred_branches": ["CSE"],
            "min_cgpa": 8.0,
            "location": "Bangalore",
            "mode": "onsite",
            "seats": 1,
            "status": "open",
        },
    )

    res = await client.get("/api/student/internships", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["can_apply"] is False
    assert isinstance(data[0]["ineligible_reasons"], list)
    assert any("Confirm your skills" in reason for reason in data[0]["ineligible_reasons"])


@pytest.mark.asyncio
async def test_internship_detail_returns_eligibility_metadata(client, student_token, admin_token):
    internship = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Backend Intern",
            "description": "APIs and backend services",
            "required_skills": ["Python"],
            "min_cgpa": 6.0,
            "location": "Remote",
            "mode": "remote",
            "seats": 1,
            "status": "open",
        },
    )
    internship_id = internship.json()["id"]

    res = await client.get(f"/api/student/internships/{internship_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["already_applied"] is False
    assert data["can_apply"] is False
    assert isinstance(data["ineligible_reasons"], list)


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
