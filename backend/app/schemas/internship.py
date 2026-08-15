import json
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

VALID_MODES = {"remote", "hybrid", "onsite"}
VALID_STATUSES = {"draft", "open", "closed", "allocating", "allocated", "results_published"}


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

    @field_validator("required_skills", mode="before")
    @classmethod
    def validate_required_skills(cls, value):
        if not value or (isinstance(value, list) and len(value) == 0):
            raise ValueError("At least one required skill is required")
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]

    @field_validator("min_cgpa")
    @classmethod
    def validate_min_cgpa(cls, value: float) -> float:
        if value < 0 or value > 10:
            raise ValueError("min_cgpa must be between 0 and 10")
        return value

    @field_validator("seats")
    @classmethod
    def validate_seats(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("seats must be greater than zero")
        return value

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: str) -> str:
        if value not in VALID_MODES:
            raise ValueError(f"mode must be one of {sorted(VALID_MODES)}")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in VALID_STATUSES:
            raise ValueError(f"status must be one of {sorted(VALID_STATUSES)}")
        return value

    @model_validator(mode="after")
    def check_deadline(self):
        if self.application_deadline and self.application_start_date:
            if self.application_deadline < self.application_start_date:
                raise ValueError("application_deadline cannot be before application_start_date")
        return self


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

    @field_validator("required_skills", mode="before")
    @classmethod
    def validate_required_skills(cls, value):
        if value is None:
            return value
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]

    @field_validator("min_cgpa")
    @classmethod
    def validate_min_cgpa(cls, value: float | None) -> float | None:
        if value is None:
            return None
        if value < 0 or value > 10:
            raise ValueError("min_cgpa must be between 0 and 10")
        return value

    @field_validator("seats")
    @classmethod
    def validate_seats(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if value <= 0:
            raise ValueError("seats must be greater than zero")
        return value

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if value not in VALID_MODES:
            raise ValueError(f"mode must be one of {sorted(VALID_MODES)}")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if value not in VALID_STATUSES:
            raise ValueError(f"status must be one of {sorted(VALID_STATUSES)}")
        return value

    @model_validator(mode="after")
    def check_deadline(self):
        if self.application_deadline and self.application_start_date:
            if self.application_deadline < self.application_start_date:
                raise ValueError("application_deadline cannot be before application_start_date")
        return self


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
    created_at: datetime | None = None
    updated_at: datetime | None = None

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


class InternshipBrowseOut(InternshipOut):
    can_apply: bool
    ineligible_reasons: list[str]
    already_applied: bool

    model_config = ConfigDict(from_attributes=True)
