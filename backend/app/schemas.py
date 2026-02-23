from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models import RoleEnum
from typing import Optional


# Auth
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.user


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    role: RoleEnum
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# Tasks
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    is_completed: bool
    owner_id: int
    created_at: datetime
    model_config = {"from_attributes": True}
