from pydantic import BaseModel, field_validator
import re

from app.schemas.base import CamelModel


class SendCodeRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^\+7\d{10}$", v):
            raise ValueError("Неверный формат телефона. Используйте +7XXXXXXXXXX")
        return v


class SendCodeResponse(CamelModel):
    message: str
    expires_in: int


class VerifyCodeRequest(BaseModel):
    phone: str
    code: str


class VerifyCodeResponse(CamelModel):
    token: str
    is_new_user: bool
    user: "UserBrief"


class UserBrief(CamelModel):
    id: str
    phone: str
    name: str | None = None
    role: str
    cars: list = []
    service_center_id: str | None = None


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(CamelModel):
    token: str
    user: "AdminUserBrief"


class AdminUserBrief(CamelModel):
    id: str
    name: str | None = None
    email: str | None = None
    role: str
