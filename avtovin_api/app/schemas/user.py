from datetime import datetime

from pydantic import Field

from app.schemas.base import CamelModel


class VisitScBrief(CamelModel):
    id: str
    name: str
    type: str


class VisitBrief(CamelModel):
    id: str
    description: str | None = None
    cost: int = 0
    mileage: int | None = None
    cashback: int = 0
    cashback_used: int = 0
    service_fee: int = 0
    status: str = "COMPLETED"
    created_at: datetime | None = None
    service_center: VisitScBrief | None = None


class CarInfoBrief(CamelModel):
    id: str
    brand: str | None = None
    model: str | None = None
    year: int | None = None
    plate_number: str | None = None
    vin: str | None = None
    mileage: int | None = None
    engine_type: str | None = None
    last_service_at: datetime | None = None
    last_service_mileage: int | None = None
    photo_url: str | None = None
    created_at: datetime | None = None
    visits: list[VisitBrief] = []


class UserCountOut(CamelModel):
    cars: int = 0


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
    cars: list[CarInfoBrief] = []
    count: UserCountOut | None = Field(None, serialization_alias="_count")


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
    total_earned: int = 0
    total_spent: int = 0
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
