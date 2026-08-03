from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str  # "student" | "company" | "admin"


class LoginRequest(BaseModel):
    email: str
    password: str
