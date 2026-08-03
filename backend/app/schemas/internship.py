import json
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator


class InternshipCreate(BaseModel):
    title: str
    description: str | None = None
    required_skills: list[str]
    preferred_degree: str | None = None
    preferred_branches: list[str] = []
    min_cgpa: float = 0.0
    location: str | None = None
    sector: str | None = None
    mode: str = "onsite"                    # remote | hybrid | onsite
    seats: int
    duration: str | None = None
    application_start_date: date | None = None
    application_deadline: date | None = None
    status: str = "draft"                   # draft | open | closed | allocating | allocated | results_published


class InternshipUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    required_skills: list[str] | None = None
    preferred_degree: str | None = None
    preferred_branches: list[str] | None = None
    min_cgpa: float | None = None
    location: str | None = None
    sector: str | None = None
    mode: str | None = None
    seats: int | None = None
    duration: str | None = None
    application_start_date: date | None = None
    application_deadline: date | None = None
    status: str | None = None


class InternshipOut(BaseModel):
    id: int
    title: str
    description: str | None
    required_skills: list[str]
    preferred_degree: str | None
    preferred_branches: list[str]
    min_cgpa: float
    location: str | None
    sector: str | None
    mode: str
    seats: int
    duration: str | None
    application_start_date: date | None
    application_deadline: date | None
    status: str
    results_published: bool
    created_at: datetime | None
    updated_at: datetime | None

    @field_validator("required_skills", "preferred_branches", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    model_config = ConfigDict(from_attributes=True)
