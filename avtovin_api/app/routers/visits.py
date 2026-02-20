import math

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
    if not body.car_id or not body.service_center_id:
        raise HTTPException(status_code=400, detail="carId и serviceCenterId обязательны")

    try:
        visit = await create_visit(
            db=db,
            car_id=body.car_id,
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
