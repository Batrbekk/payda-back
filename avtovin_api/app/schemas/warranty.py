from datetime import datetime

from app.schemas.base import CamelModel


class WarrantyOut(CamelModel):
    id: str
    contract_number: str
    user_id: str
    car_id: str
    client_name: str
    vin: str
    brand: str
    model: str
    year: int
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    created_by_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WarrantyCreate(CamelModel):
    contract_number: str
    client_name: str
    vin: str | None = None
    brand: str | None = None
    model: str | None = None
    year: int | None = None
    start_date: datetime
    end_date: datetime
    plate_number: str | None = None
    user_id: str | None = None
    car_id: str | None = None
    phone: str | None = None


class WarrantyUpdate(CamelModel):
    contract_number: str | None = None
    client_name: str | None = None
    vin: str | None = None
    brand: str | None = None
    model: str | None = None
    year: int | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    is_active: bool | None = None


class SearchUserOut(CamelModel):
    id: str
    phone: str
    name: str | None = None
    cars: list["SearchCarOut"] = []


class SearchCarOut(CamelModel):
    id: str
    vin: str | None = None
    brand: str
    model: str
    year: int
    plate_number: str


class WarrantyManagerOut(CamelModel):
    id: str
    phone: str
    email: str | None = None
    name: str | None = None
    salon_name: str | None = None
    created_at: datetime | None = None
    total_warranties: int = 0
    active_warranties: int = 0


class WarrantyManagerCreate(CamelModel):
    phone: str
    name: str
    email: str
    password: str
    salon_name: str | None = None
