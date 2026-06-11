from datetime import datetime

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class UserInfo(BaseModel):
    id: int
    username: str
    created_at: datetime


class LoginData(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
