from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class StudentRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if value.isalpha() or value.isnumeric():
            raise ValueError("Password must include letters and numbers")
        return value


class StudentProfileUpdate(BaseModel):
    college: str | None = None
    degree: str | None = None
    branch: str | None = None
    cgpa: float | None = None
    preferred_location: str | None = None
    interested_sector: str | None = None

    @field_validator("cgpa")
    @classmethod
    def validate_cgpa(cls, value: float | None) -> float | None:
        if value is None:
            return None
        if value < 0 or value > 10:
            raise ValueError("CGPA must be between 0 and 10")
        return value


class SkillConfirmRequest(BaseModel):
    confirmed_skills: list[str]

    @field_validator("confirmed_skills")
    @classmethod
    def validate_skills(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("At least one confirmed skill is required")
        if not all(isinstance(item, str) and item.strip() for item in value):
            raise ValueError("Confirmed skills must be non-empty strings")
        return [item.strip() for item in value]


class StudentOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    college: str | None
    degree: str | None
    branch: str | None
    cgpa: float | None
    preferred_location: str | None
    interested_sector: str | None
    resume_status: str
    skills_confirmed: bool
    profile_completion: float

    model_config = ConfigDict(from_attributes=True)


class ExtractedResumeOut(BaseModel):
    name: str
    email: str
    phone: str
    college: str
    degree: str
    branch: str
    cgpa: float | None
    skills: list[str]
    projects: list[str]
    certifications: list[str]
    tools: list[str]
    languages: list[str]
    experience: list[str]
