import pytest

from tests.conftest import INTERNSHIP_PAYLOAD


async def _prepare_student(client, student_token):
    await client.put(
        "/api/student/profile",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "college": "Test College",
            "degree": "B.Tech",
            "branch": "AIML",
            "cgpa": 8.5,
            "interested_sector": "AI/ML",
            "preferred_location": "Bangalore",
        },
    )
    await client.post(
        "/api/student/skills/confirm",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"confirmed_skills": ["Python", "Machine Learning"]},
    )


async def _create_open_internship(client, admin_token, **overrides):
    payload = {**INTERNSHIP_PAYLOAD, **overrides}
    res = await client.post(
        "/api/admin/internships",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=payload,
    )
    assert res.status_code == 201
    return res.json()


@pytest.mark.asyncio
async def test_full_allocation_and_publish_flow(client, student_token, admin_token):
    await _prepare_student(client, student_token)
    internship = await _create_open_internship(client, admin_token)
    iid = internship["id"]

    apply = await client.post(
        f"/api/student/apply/{iid}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert apply.status_code == 201

    # Cannot allocate while open
    blocked = await client.post(
        f"/api/admin/internships/{iid}/run-allocation",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert blocked.status_code == 400

    await client.patch(
        f"/api/admin/internships/{iid}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "closed"},
    )

    alloc = await client.post(
        f"/api/admin/internships/{iid}/run-allocation",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert alloc.status_code == 200
    assert alloc.json()["allocated"] >= 1

    # Student must NOT see result before publish
    pending = await client.get(
        "/api/student/result",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert pending.status_code == 200
    assert pending.json()["allocated"] is False
    assert pending.json()["results_published"] is False

    # Admin reviews
    review = await client.get(
        f"/api/admin/internships/{iid}/allocations",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert review.status_code == 200
    assert len(review.json()["allocated_students"]) >= 1

    pub = await client.post(
        f"/api/admin/internships/{iid}/publish-results",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert pub.status_code == 200
    assert pub.json()["results_published"] is True

    result = await client.get(
        "/api/student/result",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert result.status_code == 200
    body = result.json()
    assert body["allocated"] is True
    assert body["match_scores"]["overall"] > 0
    assert body["internship"]["title"] == "AI/ML Intern"


@pytest.mark.asyncio
async def test_student_cannot_trigger_allocation(client, student_token, admin_token):
    internship = await _create_open_internship(client, admin_token)
    await client.patch(
        f"/api/admin/internships/{internship['id']}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "closed"},
    )
    res = await client.post(
        f"/api/admin/internships/{internship['id']}/run-allocation",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_duplicate_application_blocked(client, student_token, admin_token):
    await _prepare_student(client, student_token)
    internship = await _create_open_internship(client, admin_token)
    iid = internship["id"]
    first = await client.post(
        f"/api/student/apply/{iid}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert first.status_code == 201
    second = await client.post(
        f"/api/student/apply/{iid}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_global_allocation_one_student_one_seat(client, student_token, admin_token):
    await _prepare_student(client, student_token)
    a = await _create_open_internship(client, admin_token, title="Role A", seats=1)
    b = await _create_open_internship(
        client,
        admin_token,
        title="Role B",
        seats=1,
        required_skills=["Python", "SQL"],
    )

    await client.post(
        f"/api/student/apply/{a['id']}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    await client.post(
        f"/api/student/apply/{b['id']}",
        headers={"Authorization": f"Bearer {student_token}"},
    )

    for iid in (a["id"], b["id"]):
        await client.patch(
            f"/api/admin/internships/{iid}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "closed"},
        )

    res = await client.post(
        "/api/admin/run-allocation",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["allocated"] == 1


@pytest.mark.asyncio
async def test_rejected_applicant_sees_not_allocated_result(
    client, student_token, admin_token
):
    """Every applicant must see a final result after publish — including
    students who applied but were not selected."""
    await _prepare_student(client, student_token)

    await client.post(
        "/api/auth/student/register",
        json={
            "email": "second_student@test.com",
            "password": "test123",
            "name": "Second Student",
            "phone": "8888888888",
        },
    )
    login = await client.post(
        "/api/auth/student/login",
        json={"email": "second_student@test.com", "password": "test123"},
    )
    second_token = login.json()["access_token"]
    await _prepare_student(client, second_token)

    internship = await _create_open_internship(client, admin_token, seats=1)
    iid = internship["id"]

    await client.post(
        f"/api/student/apply/{iid}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    await client.post(
        f"/api/student/apply/{iid}",
        headers={"Authorization": f"Bearer {second_token}"},
    )

    await client.patch(
        f"/api/admin/internships/{iid}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "closed"},
    )
    alloc = await client.post(
        f"/api/admin/internships/{iid}/run-allocation",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert alloc.status_code == 200

    pub = await client.post(
        f"/api/admin/internships/{iid}/publish-results",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert pub.status_code == 200

    r1 = (
        await client.get(
            "/api/student/result",
            headers={"Authorization": f"Bearer {student_token}"},
        )
    ).json()
    r2 = (
        await client.get(
            "/api/student/result",
            headers={"Authorization": f"Bearer {second_token}"},
        )
    ).json()

    statuses = {r1["status"], r2["status"]}
    assert statuses == {"allocated", "not_allocated"}

    rejected = next(r for r in (r1, r2) if r["status"] == "not_allocated")
    assert rejected["allocated"] is False
    assert rejected["results_published"] is True
    assert rejected["internship"]["title"] == "AI/ML Intern"
    assert "not selected" in rejected["message"]

    dash = (
        await client.get(
            "/api/student/dashboard",
            headers={"Authorization": f"Bearer {second_token}"},
        )
    ).json()
    assert dash["result"]["status"] == "not_allocated"


@pytest.mark.asyncio
async def test_ai_skill_extraction():
    from app.ai.skill_extractor import extract_skills_from_text

    skills = extract_skills_from_text(
        "Experienced in Python, Machine Learning, and TensorFlow"
    )
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
    assert 0 < result.overall_score <= 100
