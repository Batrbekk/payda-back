from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_admin
from app.models.car import Car
from app.models.service_center import ServiceCenter
from app.models.settlement import Settlement
from app.models.user import User
from app.models.visit import Visit
from app.schemas.dashboard import DashboardOut, PartnersOut, UnpaidOut
from app.schemas.visit import VisitOut, VisitServiceOut

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardOut)
async def get_stats(
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(
        select(func.count(User.id)).where(User.role == "USER")
    )).scalar() or 0

    total_cars = (await db.execute(select(func.count(Car.id)))).scalar() or 0

    sc_count = (await db.execute(
        select(func.count(ServiceCenter.id)).where(
            ServiceCenter.is_active == True, ServiceCenter.type == "SERVICE_CENTER"  # noqa: E712
        )
    )).scalar() or 0

    shop_count = (await db.execute(
        select(func.count(ServiceCenter.id)).where(
            ServiceCenter.is_active == True, ServiceCenter.type == "AUTO_SHOP"  # noqa: E712
        )
    )).scalar() or 0

    wash_count = (await db.execute(
        select(func.count(ServiceCenter.id)).where(
            ServiceCenter.is_active == True, ServiceCenter.type == "CAR_WASH"  # noqa: E712
        )
    )).scalar() or 0

    total_visits = (await db.execute(select(func.count(Visit.id)))).scalar() or 0

    total_revenue = (await db.execute(
        select(func.coalesce(func.sum(Visit.service_fee), 0))
    )).scalar() or 0

    total_cashback = (await db.execute(
        select(func.coalesce(func.sum(Visit.cashback), 0))
    )).scalar() or 0

    total_balance = (await db.execute(
        select(func.coalesce(func.sum(User.balance), 0))
    )).scalar() or 0

    unpaid_count = (await db.execute(
        select(func.count(Settlement.id)).where(Settlement.is_paid == False)  # noqa: E712
    )).scalar() or 0

    unpaid_amount = (await db.execute(
        select(func.coalesce(func.sum(Settlement.net_amount), 0))
        .where(Settlement.is_paid == False)  # noqa: E712
    )).scalar() or 0

    # Recent 10 visits
    result = await db.execute(
        select(Visit)
        .options(selectinload(Visit.services))
        .order_by(Visit.created_at.desc())
        .limit(10)
    )
    recent = result.scalars().all()

    return DashboardOut(
        total_users=total_users,
        total_cars=total_cars,
        partners=PartnersOut(
            service_centers=sc_count, auto_shops=shop_count,
            car_washes=wash_count, total=sc_count + shop_count + wash_count,
        ),
        total_visits=total_visits,
        total_revenue=total_revenue,
        total_cashback=total_cashback,
        total_cashback_balance=total_balance,
        unpaid_settlements=UnpaidOut(count=unpaid_count, amount=unpaid_amount),
        recent_visits=[
            VisitOut(
                **{c.key: getattr(v, c.key) for c in Visit.__table__.columns},
                services=[VisitServiceOut.model_validate(s) for s in v.services],
            )
            for v in recent
        ],
    )
