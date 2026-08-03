from pydantic import BaseModel, ConfigDict, EmailStr


class AdminBase(BaseModel):
    name: str
    email: EmailStr


class AdminCreate(AdminBase):
    password: str


class AdminOut(AdminBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
