import pytest


INTERNSHIP_DATA = {
    "role": "AI/ML Intern",
    "description": "Work on ML models",
    "required_skills": ["Python", "Machine Learning"],
    "location": "Bangalore",
    "mode": "remote",
    "seats": 2,
    "sector": "AI/ML"
}


@pytest.mark.asyncio
async def test_company_profile(client, company_token):
    res = await client.get("/api/company/profile", headers={"Authorization": f"Bearer {company_token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "test_company@test.com"


@pytest.mark.asyncio
async def test_create_internship(client, company_token):
    res = await client.post("/api/company/internships",
        headers={"Authorization": f"Bearer {company_token}"},
        json=INTERNSHIP_DATA
    )
    assert res.status_code == 201
    assert res.json()["role"] == "AI/ML Intern"
    assert res.json()["seats"] == 2
    assert res.json()["sector"] == "AI/ML"


@pytest.mark.asyncio
async def test_get_internships(client, company_token):
    res = await client.get("/api/company/internships", headers={"Authorization": f"Bearer {company_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.asyncio
async def test_update_internship(client, company_token):
    create_res = await client.post("/api/company/internships",
        headers={"Authorization": f"Bearer {company_token}"},
        json=INTERNSHIP_DATA
    )
    internship_id = create_res.json()["id"]

    res = await client.put(f"/api/company/internships/{internship_id}",
        headers={"Authorization": f"Bearer {company_token}"},
        json={**INTERNSHIP_DATA, "seats": 5, "sector": "Data Science"}
    )
    assert res.status_code == 200
    assert res.json()["seats"] == 5
    assert res.json()["sector"] == "Data Science"


@pytest.mark.asyncio
async def test_partial_update_internship(client, company_token):
    create_res = await client.post("/api/company/internships",
        headers={"Authorization": f"Bearer {company_token}"},
        json=INTERNSHIP_DATA
    )
    internship_id = create_res.json()["id"]

    res = await client.put(f"/api/company/internships/{internship_id}",
        headers={"Authorization": f"Bearer {company_token}"},
        json={"seats": 4}
    )
    assert res.status_code == 200
    assert res.json()["seats"] == 4
    assert res.json()["role"] == INTERNSHIP_DATA["role"]
    assert res.json()["sector"] == INTERNSHIP_DATA["sector"]
    assert res.json()["required_skills"] == INTERNSHIP_DATA["required_skills"]


@pytest.mark.asyncio
async def test_delete_internship(client, company_token):
    create_res = await client.post("/api/company/internships",
        headers={"Authorization": f"Bearer {company_token}"},
        json=INTERNSHIP_DATA
    )
    internship_id = create_res.json()["id"]

    res = await client.delete(f"/api/company/internships/{internship_id}",
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert res.status_code in [200, 204]


@pytest.mark.asyncio
async def test_company_dashboard(client, company_token):
    res = await client.get("/api/company/dashboard", headers={"Authorization": f"Bearer {company_token}"})
    assert res.status_code == 200
    assert "stats" in res.json()
    assert "total_internships" in res.json()["stats"]


@pytest.mark.asyncio
async def test_get_internship_by_id(client, company_token):
    """Company can fetch a single internship by its ID."""
    create_res = await client.post("/api/company/internships",
        headers={"Authorization": f"Bearer {company_token}"},
        json=INTERNSHIP_DATA
    )
    internship_id = create_res.json()["id"]

    res = await client.get(f"/api/company/internships/{internship_id}",
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert res.status_code == 200
    assert res.json()["id"] == internship_id
    assert res.json()["role"] == INTERNSHIP_DATA["role"]


@pytest.mark.asyncio
async def test_close_internship(client, company_token):
    """Company can close an internship; status changes to 'closed'."""
    create_res = await client.post("/api/company/internships",
        headers={"Authorization": f"Bearer {company_token}"},
        json=INTERNSHIP_DATA
    )
    internship_id = create_res.json()["id"]
    assert create_res.json()["status"] == "open"

    res = await client.patch(f"/api/company/internships/{internship_id}/close",
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "closed"


@pytest.mark.asyncio
async def test_internship_not_found_for_other_company(client, company_token):
    """A company cannot access another company's internship."""
    # Use an ID that almost certainly doesn't belong to this company
    res = await client.get("/api/company/internships/999999",
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert res.status_code == 404
