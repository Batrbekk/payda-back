from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import CamelModel


class AddressIn(CamelModel):
    address: str
    city: str = "Алматы"


class ScServiceIn(CamelModel):
    service_id: str
    price: int | None = None
    is_flex_price: bool = False


class AddressOut(CamelModel):
    id: str
    address: str
    city: str


class ScServiceOut(CamelModel):
    id: str
    name: str
    category: str
    price: int | None = None
    is_flex_price: bool = False
    commission_type: str | None = None
    commission_value: float | None = None
    cashback_type: str | None = None
    cashback_value: float | None = None


class ManagerBrief(CamelModel):
    phone: str
    name: str | None = None


class ServiceBrief(CamelModel):
    id: str
    name: str
    category: str
    cashback_type: str | None = None
    cashback_value: float | None = None


class ScServiceDetail(CamelModel):
    id: str
    service_center_id: str
    service_id: str
    price: int | None = None
    is_flex_price: bool = False
    commission_type: str | None = None
    commission_value: float | None = None
    cashback_type: str | None = None
    cashback_value: float | None = None
    service: ServiceBrief | None = None


class ScCountOut(CamelModel):
    visits: int = 0


class ServiceCenterOut(CamelModel):
    id: str
    name: str
    type: str
    description: str | None = None
    city: str
    phone: str | None = None
    rating: float = 0
    is_active: bool = True
    commission_percent: float = 0
    discount_percent: float = 0
    logo_url: str | None = None
    link_2gis: str | None = None
    link_instagram: str | None = None
    link_website: str | None = None
    link_whatsapp: str | None = None
    manager_id: str | None = None
    show_on_landing: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
    addresses: list[AddressOut] = []
    manager: ManagerBrief | None = None
    services: list[ScServiceDetail] = []
    count: ScCountOut | None = Field(None, serialization_alias="_count")


class ServiceCenterCreate(CamelModel):
    name: str
    type: str = "SERVICE_CENTER"
    description: str | None = None
    city: str = "Алматы"
    phone: str | None = None
    manager_phone: str | None = None
    logo_url: str | None = None
    link_2gis: str | None = None
    link_instagram: str | None = None
    link_website: str | None = None
    link_whatsapp: str | None = None
    commission_percent: float = 0
    discount_percent: float = 0
    addresses: list[AddressIn]
    service_ids: list[ScServiceIn] = []


class ServiceCenterUpdate(CamelModel):
    name: str | None = None
    type: str | None = None
    description: str | None = None
    city: str | None = None
    phone: str | None = None
    manager_phone: str | None = None
    logo_url: str | None = None
    link_2gis: str | None = None
    link_instagram: str | None = None
    link_website: str | None = None
    link_whatsapp: str | None = None
    is_active: bool | None = None
    rating: float | None = None
    commission_percent: float | None = None
    discount_percent: float | None = None
    addresses: list[AddressIn] | None = None
    service_ids: list[ScServiceIn] | None = None


class ScDashboardOut(CamelModel):
    id: str
    name: str
    type: str
    description: str | None = None
    city: str
    phone: str | None = None
    rating: float = 0
    logo_url: str | None = None
    commission_percent: float = 0
    discount_percent: float = 0
    addresses: list[str] = []
    services: list[str] = []
    stats: "ScStatsOut"


class ScStatsOut(CamelModel):
    today_visits: int = 0
    month_visits: int = 0
    unpaid_amount: int = 0


class FinanceVisitOut(CamelModel):
    id: str
    date: datetime
    car: str
    vin: str | None = None
    plate: str
    fee: int


class FinancesOut(CamelModel):
    unpaid_amount: int
    current_month: "MonthDataOut"
    settlements: list["SettlementBriefOut"] = []


class MonthDataOut(CamelModel):
    name: str
    total: int
    visit_count: int
    visits: list[FinanceVisitOut] = []


class SettlementBriefOut(CamelModel):
    id: str
    period: str
    amount: int
    is_paid: bool
    period_start: datetime
    period_end: datetime


class UploadReceiptRequest(BaseModel):
    receiptBase64: str
    settlementId: str | None = None
