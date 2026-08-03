from pydantic import BaseModel, ConfigDict, EmailStr


class StudentRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None


class StudentProfileUpdate(BaseModel):
    college: str | None = None
    degree: str | None = None
    branch: str | None = None
    cgpa: float | None = None
    preferred_location: str | None = None
    interested_sector: str | None = None


class SkillConfirmRequest(BaseModel):
    confirmed_skills: list[str]


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
