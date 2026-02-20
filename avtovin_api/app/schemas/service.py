from datetime import datetime

from app.schemas.base import CamelModel


class ServiceOut(CamelModel):
    id: str
    name: str
    category: str
    commission_type: str
    commission_value: float
    cashback_type: str
    cashback_value: float
    created_at: datetime | None = None


class ServiceCreate(CamelModel):
    name: str
    category: str = "general"
    commission_type: str = "percent"
    commission_value: float = 20
    cashback_type: str = "percent"
    cashback_value: float = 25


class ServiceUpdate(CamelModel):
    name: str | None = None
    category: str | None = None
    commission_type: str | None = None
    commission_value: float | None = None
    cashback_type: str | None = None
    cashback_value: float | None = None
