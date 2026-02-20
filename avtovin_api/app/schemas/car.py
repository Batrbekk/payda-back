from datetime import datetime

from app.schemas.base import CamelModel


class CarCreate(CamelModel):
    vin: str | None = None
    brand: str
    model: str
    year: int
    plate_number: str
    mileage: int | None = None
    generation: str | None = None
    engine_type: str | None = None
    last_service_at: datetime | None = None
    photo_url: str | None = None


class CarOut(CamelModel):
    id: str
    vin: str | None = None
    brand: str
    model: str
    year: int
    plate_number: str
    mileage: int | None = None
    generation: str | None = None
    engine_type: str | None = None
    last_service_at: datetime | None = None
    photo_url: str | None = None
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class VinDecodeOut(CamelModel):
    vin: str
    brand: str | None = None
    model: str | None = None
    year: int | None = None
    engine_type: str | None = None
    fuel_type: str | None = None
    vehicle_type: str | None = None
    manufacturer: str | None = None


class BrandOut(CamelModel):
    id: str
    name: str


class ModelOut(CamelModel):
    id: str
    name: str
    brand_id: str


class GenerationOut(CamelModel):
    id: str
    name: str
    year_from: int
    year_to: int | None = None
    engine_types: str | None = None
    model_id: str
