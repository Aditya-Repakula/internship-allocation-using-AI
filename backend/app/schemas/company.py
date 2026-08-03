from pydantic import BaseModel, ConfigDict, EmailStr


class CompanyRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    industry: str | None = None


class CompanyOut(BaseModel):
    id: int
    name: str
    email: str
    industry: str | None

    model_config = ConfigDict(from_attributes=True)
