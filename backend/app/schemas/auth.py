from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str  # "student" | "admin"


class LoginRequest(BaseModel):
    email: str
    password: str
