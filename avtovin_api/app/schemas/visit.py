from datetime import datetime

from app.schemas.base import CamelModel


class VisitServiceIn(CamelModel):
    service_id: str
    price: int
    details: str | None = None


class VisitCreate(CamelModel):
    car_id: str
    service_center_id: str
    services: list[VisitServiceIn] | None = None
    cashback_used: int = 0
    mileage: int | None = None
    total_amount: int | None = None
    description: str | None = None


class VisitServiceOut(CamelModel):
    id: str
    visit_id: str
    service_name: str
    price: int
    commission: int
    cashback: int
    details: str | None = None


# Brief nested objects for admin panel
class UserBriefForVisit(CamelModel):
    name: str | None = None
    phone: str


class CarBriefForVisit(CamelModel):
    brand: str
    model: str
    plate_number: str
    user: UserBriefForVisit | None = None


class ScBriefForVisit(CamelModel):
    name: str
    type: str


class VisitOut(CamelModel):
    id: str
    car_id: str
    service_center_id: str
    description: str
    cost: int
    mileage: int | None = None
    cashback: int
    cashback_used: int
    service_fee: int
    status: str
    created_at: datetime | None = None
    services: list[VisitServiceOut] = []
    car: CarBriefForVisit | None = None
    service_center: ScBriefForVisit | None = None


class VisitListOut(CamelModel):
    visits: list[VisitOut]
    total: int
    page: int
    total_pages: int
