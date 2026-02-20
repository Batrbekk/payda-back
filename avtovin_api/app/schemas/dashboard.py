from app.schemas.base import CamelModel
from app.schemas.visit import VisitOut


class PartnersOut(CamelModel):
    service_centers: int = 0
    auto_shops: int = 0
    car_washes: int = 0
    total: int = 0


class UnpaidOut(CamelModel):
    count: int = 0
    amount: int = 0


class DashboardOut(CamelModel):
    total_users: int = 0
    total_cars: int = 0
    partners: PartnersOut
    total_visits: int = 0
    total_revenue: int = 0
    total_cashback: int = 0
    total_cashback_balance: int = 0
    unpaid_settlements: UnpaidOut
    recent_visits: list[VisitOut] = []
