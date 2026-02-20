from datetime import datetime

from app.schemas.base import CamelModel


class SettlementOut(CamelModel):
    id: str
    service_center_id: str
    period_start: datetime
    period_end: datetime
    total_commission: int
    total_cashback_redeemed: int
    net_amount: int
    is_paid: bool = False
    receipt_url: str | None = None
    receipt_status: str = "NONE"
    created_at: datetime | None = None


class SettlementCreate(CamelModel):
    period_start: datetime
    period_end: datetime


class SettlementUpdate(CamelModel):
    is_paid: bool | None = None
    receipt_status: str | None = None
