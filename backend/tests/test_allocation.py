import pytest


@pytest.mark.asyncio
async def test_run_allocation(client, student_token, company_token):
    await client.put("/api/student/profile",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"branch": "AIML", "interested_sector": "AI/ML", "preferred_location": "Bangalore"}
    )
    await client.post("/api/student/skills/confirm",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"confirmed_skills": ["Python", "Machine Learning"]}
    )
    await client.post("/api/company/internships",
        headers={"Authorization": f"Bearer {company_token}"},
        json={
            "role": "ML Intern", "description": "ML work",
            "required_skills": ["Python", "Machine Learning"],
            "location": "Bangalore", "mode": "remote", "seats": 2, "sector": "AI/ML"
        }
    )
    res = await client.post("/api/allocation/run",
        headers={"Authorization": f"Bearer {company_token}"},
        json={}
    )
    assert res.status_code == 200
    assert "allocated" in res.json()
    result_res = await client.get("/api/allocation/my-result",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert result_res.status_code == 200
    assert result_res.json()["allocated"] is True
    assert result_res.json()["match_scores"]["sector"] > 0


@pytest.mark.asyncio
async def test_student_allocation_result(client, student_token):
    res = await client.get("/api/allocation/my-result",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code in [200, 404]


@pytest.mark.asyncio
async def test_ai_skill_extraction():
    from app.ai.skill_extractor import extract_skills_from_text
    skills = extract_skills_from_text("Experienced in Python, Machine Learning, and TensorFlow")
    assert "python" in [s.lower() for s in skills]


@pytest.mark.asyncio
async def test_ai_matcher():
    from app.ai.matcher import calculate_match

    result = calculate_match(
        student_skills=["Python", "Machine Learning"],
        student_degree="B.Tech",
        student_branch="AIML",
        student_cgpa=8.5,
        student_location="Bangalore",
        student_sector="AI/ML",
        required_skills=["Python", "Machine Learning"],
        preferred_degree="B.Tech",
        preferred_branches=["AIML"],
        min_cgpa=6.0,
        internship_location="Bangalore",
        internship_sector="AI/ML",
    )
    assert result.overall_score > 0
    assert 0 <= result.overall_score <= 100


@pytest.mark.asyncio
async def test_company_view_internship_allocations(client, student_token, company_token):
    """Company can view allocated students for their internship via allocation route."""
    # Setup: confirm student skills
    await client.put("/api/student/profile",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"branch": "AIML", "degree": "B.Tech",
              "interested_sector": "AI/ML", "preferred_location": "Bangalore"}
    )
    await client.post("/api/student/skills/confirm",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"confirmed_skills": ["Python", "Deep Learning"]}
    )
    # Create internship
    intern_res = await client.post("/api/company/internships",
        headers={"Authorization": f"Bearer {company_token}"},
        json={
            "role": "DL Intern", "description": "Deep Learning role",
            "required_skills": ["Python", "Deep Learning"],
            "location": "Bangalore", "mode": "remote",
            "seats": 2, "sector": "AI/ML"
        }
    )
    internship_id = intern_res.json()["id"]
    # Run allocation
    await client.post("/api/allocation/run",
        headers={"Authorization": f"Bearer {company_token}"},
        json={}
    )
    # Company views allocations
    res = await client.get(f"/api/allocation/internship/{internship_id}",
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "students" in data
    assert "seats" in data
    assert data["internship_id"] == internship_id


@pytest.mark.asyncio
async def test_student_cannot_trigger_allocation(client, student_token):
    """Students must not be able to trigger the allocation engine."""
    res = await client.post("/api/allocation/run",
        headers={"Authorization": f"Bearer {student_token}"},
        json={}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_fresh_student_not_yet_allocated(client):
    """A brand new student who hasn't confirmed skills returns allocated=False."""
    # Register a fresh student
    await client.post("/api/auth/student/register", json={
        "email": "fresh_student@test.com", "password": "test123",
        "name": "Fresh Student", "college": "X", "branch": "CSE", "cgpa": 8.0
    })
    login_res = await client.post("/api/auth/student/login", json={
        "email": "fresh_student@test.com", "password": "test123"
    })
    token = login_res.json()["access_token"]
    res = await client.get("/api/allocation/my-result",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["allocated"] is False
