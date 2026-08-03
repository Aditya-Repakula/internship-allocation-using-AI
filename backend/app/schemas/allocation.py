from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AllocationOut(BaseModel):
    id: int
    student_id: int
    internship_id: int
    match_score: float
    skills_score: float
    degree_score: float
    branch_score: float
    cgpa_score: float
    location_score: float
    sector_score: float
    rank: int | None
    allocation_reason: str   # raw JSON string
    status: str
    allocated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AllocationReasonOut(BaseModel):
    matched_skills: list[str]
    unmatched_skills: list[str]
    reasons: list[str]
