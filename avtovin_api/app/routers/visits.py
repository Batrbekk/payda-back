import math
import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_sc_manager
from app.models.car import Car
from app.models.service_center import ServiceCenter
from app.models.user import User
from app.models.visit import Visit
from app.models.warranty import Warranty
from app.schemas.visit import (
    VisitOut, VisitCreate, VisitListOut, VisitServiceOut,
    CarBriefForVisit, UserBriefForVisit, ScBriefForVisit,
)
from app.services.event_service import publish_event
from app.services.visit_service import create_visit


def _visit_out(v: Visit) -> VisitOut:
    car_brief = None
    if v.car:
        user_brief = None
        if v.car.user:
            user_brief = UserBriefForVisit(name=v.car.user.name, phone=v.car.user.phone)
        car_brief = CarBriefForVisit(
            brand=v.car.brand, model=v.car.model,
            plate_number=v.car.plate_number, user=user_brief,
        )
    sc_brief = None
    if v.service_center:
        sc_brief = ScBriefForVisit(name=v.service_center.name, type=v.service_center.type)
    return VisitOut(
        **{c.key: getattr(v, c.key) for c in Visit.__table__.columns},
        services=[VisitServiceOut.model_validate(s) for s in v.services],
        car=car_brief,
        service_center=sc_brief,
    )

router = APIRouter(prefix="/api/visits", tags=["visits"])


@router.get("", response_model=VisitListOut)
async def list_visits(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    car_id: str | None = Query(None, alias="carId"),
    service_center_id: str | None = Query(None, alias="serviceCenterId"),
    warranty: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Visit).options(
        selectinload(Visit.services),
        selectinload(Visit.car).selectinload(Car.user),
        selectinload(Visit.service_center),
    )
    count_query = select(func.count(Visit.id))

    # USER can only see visits for their cars
    if current_user.role == "USER":
        car_ids_q = select(Car.id).where(Car.user_id == current_user.id)
        query = query.where(Visit.car_id.in_(car_ids_q))
        count_query = count_query.where(Visit.car_id.in_(car_ids_q))

    if car_id:
        query = query.where(Visit.car_id == car_id)
        count_query = count_query.where(Visit.car_id == car_id)

    if service_center_id:
        query = query.where(Visit.service_center_id == service_center_id)
        count_query = count_query.where(Visit.service_center_id == service_center_id)

    # Filter by whether the visited car has an active warranty
    if warranty in ("true", "false"):
        now = datetime.utcnow()
        warranty_cars_q = select(Warranty.car_id).where(
            Warranty.is_active == True,  # noqa: E712
            Warranty.end_date >= now,
        )
        if warranty == "true":
            query = query.where(Visit.car_id.in_(warranty_cars_q))
            count_query = count_query.where(Visit.car_id.in_(warranty_cars_q))
        else:
            query = query.where(Visit.car_id.notin_(warranty_cars_q))
            count_query = count_query.where(Visit.car_id.notin_(warranty_cars_q))

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = math.ceil(total / limit) if total else 1

    query = query.order_by(Visit.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    visits = result.scalars().all()

    return VisitListOut(
        visits=[_visit_out(v) for v in visits],
        total=total,
        page=page,
        total_pages=total_pages,
    )


@router.post("", response_model=VisitOut, status_code=201)
async def create_visit_endpoint(
    body: VisitCreate,
    request: Request,
    current_user: User = Depends(require_sc_manager),
    db: AsyncSession = Depends(get_db),
):
    if not body.service_center_id:
        raise HTTPException(status_code=400, detail="serviceCenterId обязателен")

    car_id = body.car_id

    # Quick-create by VIN: resolve existing car or create user+car
    if not car_id and body.vin:
        vin_upper = body.vin.upper().strip()
        result = await db.execute(
            select(Car).where(Car.vin == vin_upper).order_by(Car.created_at.desc()).limit(1)
        )
        existing_car = result.scalar_one_or_none()
        if existing_car:
            car_id = existing_car.id
        else:
            # New client: need phone + car data
            if not body.phone or not body.brand or not body.model or not body.year or not body.plate_number:
                raise HTTPException(
                    status_code=400,
                    detail="Авто не найдено по VIN. Заполните телефон, марку, модель, год и гос.номер для создания новой записи",
                )
            if not re.match(r"^\+7\d{10}$", body.phone):
                raise HTTPException(status_code=400, detail="Неверный формат телефона")

            user_result = await db.execute(select(User).where(User.phone == body.phone))
            user = user_result.scalar_one_or_none()
            if not user:
                user = User(phone=body.phone, name=body.client_name)
                db.add(user)
                await db.flush()

            plate_car_result = await db.execute(
                select(Car).where(Car.user_id == user.id, Car.plate_number == body.plate_number)
            )
            plate_car = plate_car_result.scalar_one_or_none()
            if plate_car:
                car_id = plate_car.id
                if not plate_car.vin:
                    plate_car.vin = vin_upper
            else:
                new_car = Car(
                    user_id=user.id, brand=body.brand, model=body.model,
                    year=body.year, plate_number=body.plate_number, vin=vin_upper,
                )
                db.add(new_car)
                await db.flush()
                car_id = new_car.id

    if not car_id:
        raise HTTPException(status_code=400, detail="Укажите carId или VIN")

    try:
        visit = await create_visit(
            db=db,
            car_id=car_id,
            service_center_id=body.service_center_id,
            services_in=body.services,
            cashback_used=body.cashback_used,
            mileage=body.mileage,
            total_amount=body.total_amount,
            description=body.description,
        )
        await db.commit()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Reload with services, car (with user), and service_center
    await db.refresh(visit, ["services", "car", "service_center"])
    if visit.car:
        await db.refresh(visit.car, ["user"])

    # Publish real-time event to car owner
    car = visit.car
    sc = visit.service_center

    redis = request.app.state.redis
    await publish_event(redis, car.user_id, "visit:created", {
        "visitId": visit.id,
        "carName": f"{car.brand} {car.model}",
        "serviceCenterName": sc.name if sc else "",
        "serviceCenterType": sc.type if sc else "",
        "cost": visit.cost,
        "cashback": visit.cashback,
        "cashbackUsed": visit.cashback_used,
        "mileage": visit.mileage,
        "description": visit.description,
    })

    return _visit_out(visit)


@router.get("/{visit_id}", response_model=VisitOut)
async def get_visit(
    visit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Visit)
        .where(Visit.id == visit_id)
        .options(
            selectinload(Visit.services),
            selectinload(Visit.car).selectinload(Car.user),
            selectinload(Visit.service_center),
        )
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Визит не найден")

    # Access control
    if current_user.role == "USER" and visit.car.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    return _visit_out(visit)
