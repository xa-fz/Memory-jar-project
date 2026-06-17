from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.validators import strip_required_text


class LoginRequest(BaseModel):
    username: str = Field(max_length=50)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return strip_required_text(value, field_name="Username")


class UserInfo(BaseModel):
    id: int
    username: str
    created_at: datetime


class LoginData(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
