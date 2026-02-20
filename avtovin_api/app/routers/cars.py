import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.car import Car
from app.models.user import User
from app.schemas.car import CarCreate, CarOut, VinDecodeOut

router = APIRouter(prefix="/api/cars", tags=["cars"])

VIN_REGEX = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$", re.IGNORECASE)
NHTSA_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin"


@router.get("", response_model=list[CarOut])
async def list_cars(
    user_id: str | None = Query(None, alias="userId"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_user_id = user_id or current_user.id
    if target_user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    result = await db.execute(
        select(Car).where(Car.user_id == target_user_id).order_by(Car.created_at.desc())
    )
    cars = result.scalars().all()
    return [CarOut.model_validate(c) for c in cars]


@router.post("", response_model=CarOut, status_code=201)
async def create_car(
    body: CarCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check duplicate plate number
    result = await db.execute(
        select(Car).where(
            and_(Car.plate_number == body.plate_number, Car.user_id == current_user.id)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Автомобиль с таким гос.номером уже добавлен")

    # Check duplicate VIN
    if body.vin:
        result = await db.execute(
            select(Car).where(and_(Car.vin == body.vin, Car.user_id == current_user.id))
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Автомобиль с таким VIN уже добавлен")

    car = Car(**body.model_dump(), user_id=current_user.id)
    db.add(car)
    await db.commit()
    await db.refresh(car)
    return CarOut.model_validate(car)


@router.get("/decode-vin/{vin}", response_model=VinDecodeOut)
async def decode_vin(vin: str, request: Request):
    if not VIN_REGEX.match(vin):
        raise HTTPException(status_code=400, detail="Неверный формат VIN (17 символов)")

    # Check Redis cache
    redis = request.app.state.redis
    cache_key = f"vin:{vin.upper()}"
    cached = await redis.get(cache_key)
    if cached:
        import json
        return VinDecodeOut(**json.loads(cached))

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{NHTSA_URL}/{vin}", params={"format": "json"})
            data = resp.json()
    except Exception:
        raise HTTPException(status_code=500, detail="Ошибка декодирования VIN")

    results = data.get("Results", [])
    if not results:
        raise HTTPException(status_code=404, detail="VIN не найден")

    values = {r["Variable"]: r["Value"] for r in results if r.get("Value") and r["Value"].strip()}

    brand = values.get("Make")
    model = values.get("Model")
    year_str = values.get("Model Year")
    year = int(year_str) if year_str and year_str.isdigit() else None

    elec = (values.get("ElectrificationLevel") or "").lower()
    fuel = (values.get("FuelTypePrimary") or "").lower()
    if "bev" in elec or "electric" in fuel:
        engine_type = "ELECTRIC"
    elif "hybrid" in elec or "hybrid" in fuel:
        engine_type = "HYBRID"
    else:
        engine_type = "ICE"

    if not brand and not model:
        raise HTTPException(status_code=404, detail="VIN не найден")

    result = VinDecodeOut(
        vin=vin.upper(),
        brand=brand,
        model=model,
        year=year,
        engine_type=engine_type,
        fuel_type=values.get("FuelTypePrimary"),
        vehicle_type=values.get("BodyClass"),
        manufacturer=values.get("Manufacturer"),
    )

    # Cache for 24 hours
    import json
    await redis.setex(cache_key, 86400, json.dumps(result.model_dump(by_alias=True)))

    return result


@router.get("/{car_id}", response_model=CarOut)
async def get_car(
    car_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Car).where(Car.id == car_id))
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Автомобиль не найден")
    return CarOut.model_validate(car)


@router.delete("/{car_id}")
async def delete_car(
    car_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Car).where(Car.id == car_id))
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Автомобиль не найден")

    if car.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    await db.delete(car)
    await db.commit()
    return {"message": "Автомобиль удалён"}
