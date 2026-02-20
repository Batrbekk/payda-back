from datetime import datetime

from app.schemas.base import CamelModel


class UserOut(CamelModel):
    id: str
    phone: str
    email: str | None = None
    name: str | None = None
    role: str
    balance: int = 0
    fcm_token: str | None = None
    salon_name: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UserUpdate(CamelModel):
    name: str | None = None
    email: str | None = None
    salon_name: str | None = None


class UserListOut(CamelModel):
    users: list[UserOut]
    total: int
    page: int
    total_pages: int


class FcmTokenRequest(CamelModel):
    fcm_token: str


class BalanceOut(CamelModel):
    balance: int
    transactions: list["TransactionOut"]
    total: int
    page: int
    total_pages: int


class TransactionOut(CamelModel):
    id: str
    user_id: str
    amount: int
    type: str
    description: str
    visit_id: str | None = None
    created_at: datetime | None = None
