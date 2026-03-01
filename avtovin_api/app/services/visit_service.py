from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.balance import BalanceTransaction
from app.models.car import Car
from app.models.service import Service
from app.models.service_center import ServiceCenter, ServiceCenterService
from app.models.user import User
from app.models.visit import Visit, VisitService


async def create_visit(
    db: AsyncSession,
    car_id: str,
    service_center_id: str,
    services_in: list | None,
    cashback_used: int,
    mileage: int | None,
    total_amount: int | None,
    description: str | None,
) -> Visit:
    # Load car
    result = await db.execute(select(Car).where(Car.id == car_id))
    car = result.scalar_one_or_none()
    if not car:
        raise ValueError("Авто не найдено")

    # Load car owner
    result = await db.execute(select(User).where(User.id == car.user_id))
    owner = result.scalar_one_or_none()
    if not owner:
        raise ValueError("Владелец авто не найден")

    # Load SC
    result = await db.execute(select(ServiceCenter).where(ServiceCenter.id == service_center_id))
    sc = result.scalar_one_or_none()
    if not sc:
        raise ValueError("Сервисный центр не найден")

    # Determine mode
    is_simple = sc.type == "AUTO_SHOP" or (sc.type == "CAR_WASH" and not services_in)

    if is_simple:
        if not total_amount:
            raise ValueError("Укажите сумму")
        return await _create_simple_visit(
            db, car, owner, sc, total_amount, cashback_used, mileage, description
        )
    else:
        if not services_in:
            raise ValueError("services обязательны")
        return await _create_service_visit(
            db, car, owner, sc, services_in, cashback_used, mileage
        )


async def _create_simple_visit(
    db: AsyncSession,
    car: Car, owner: User, sc: ServiceCenter,
    total_amount: int, cashback_used: int, mileage: int | None, description: str | None,
) -> Visit:
    commission = round(total_amount * sc.commission_percent / 100)
    cashback = round(total_amount * sc.discount_percent / 100)

    # Validate cashback usage
    _validate_cashback(owner, cashback_used, total_amount)

    visit = Visit(
        car_id=car.id,
        service_center_id=sc.id,
        description=description or "Покупка",
        cost=total_amount,
        mileage=mileage,
        cashback=cashback,
        cashback_used=cashback_used,
        service_fee=commission,
        status="COMPLETED",
    )
    db.add(visit)
    await db.flush()

    db.add(VisitService(
        visit_id=visit.id,
        service_name=description or "Покупка",
        price=total_amount,
        commission=commission,
        cashback=cashback,
    ))

    await _finalize_visit(db, car, owner, visit, cashback, cashback_used, mileage, visit_services=None)
    return visit


async def _create_service_visit(
    db: AsyncSession,
    car: Car, owner: User, sc: ServiceCenter,
    services_in: list, cashback_used: int, mileage: int | None,
) -> Visit:
    total_cost = 0
    total_commission = 0
    total_cashback = 0
    visit_services = []

    for svc_in in services_in:
        service_id = svc_in.service_id
        price = svc_in.price
        details = svc_in.details

        result = await db.execute(select(Service).where(Service.id == service_id))
        service = result.scalar_one_or_none()
        if not service:
            continue

        # Check for SC-level override
        scs_result = await db.execute(
            select(ServiceCenterService).where(
                ServiceCenterService.service_center_id == sc.id,
                ServiceCenterService.service_id == service_id,
            )
        )
        scs_override = scs_result.scalar_one_or_none()

        # Commission: use override if set, else catalog default
        comm_type = (scs_override.commission_type if scs_override and scs_override.commission_type else service.commission_type)
        comm_value = (scs_override.commission_value if scs_override and scs_override.commission_value is not None else service.commission_value)
        if comm_type == "percent":
            commission = round(price * comm_value / 100)
        else:
            commission = int(comm_value)

        # Cashback: use override if set, else catalog default
        cb_type = (scs_override.cashback_type if scs_override and scs_override.cashback_type else service.cashback_type)
        cb_value = (scs_override.cashback_value if scs_override and scs_override.cashback_value is not None else service.cashback_value)
        if cb_type == "percent":
            cashback = round(commission * cb_value / 100)
        else:
            cashback = int(cb_value)

        total_cost += price
        total_commission += commission
        total_cashback += cashback

        visit_services.append(VisitService(
            service_name=service.name,
            price=price,
            commission=commission,
            cashback=cashback,
            details=details,
        ))

    _validate_cashback(owner, cashback_used, total_cost)

    desc_parts = [vs.service_name for vs in visit_services]
    visit = Visit(
        car_id=car.id,
        service_center_id=sc.id,
        description=", ".join(desc_parts),
        cost=total_cost,
        mileage=mileage,
        cashback=total_cashback,
        cashback_used=cashback_used,
        service_fee=total_commission,
        status="COMPLETED",
    )
    db.add(visit)
    await db.flush()

    for vs in visit_services:
        vs.visit_id = visit.id
        db.add(vs)

    await _finalize_visit(db, car, owner, visit, total_cashback, cashback_used, mileage, visit_services=visit_services)
    return visit


def _validate_cashback(owner: User, cashback_used: int, total_cost: int):
    if cashback_used <= 0:
        return
    if cashback_used > owner.balance:
        raise ValueError("Недостаточно кэшбэка на балансе")
    max_cashback = total_cost // 2
    if cashback_used > max_cashback:
        raise ValueError(f"Кэшбэк покрывает не более 50% (макс {max_cashback}₸)")


async def _finalize_visit(
    db: AsyncSession,
    car: Car, owner: User, visit: Visit,
    cashback: int, cashback_used: int, mileage: int | None,
    visit_services: list[VisitService] | None = None,
):
    # Update mileage (always)
    if mileage:
        car.mileage = mileage

    # Update ТО only if visit includes oil change
    has_oil_change = False
    if visit_services:
        has_oil_change = any(
            "замена масла" in (vs.service_name or "").lower()
            for vs in visit_services
        )
    if has_oil_change:
        car.last_service_at = datetime.now(timezone.utc)
        if mileage:
            car.last_service_mileage = mileage

    # Balance transactions
    if cashback > 0:
        db.add(BalanceTransaction(
            user_id=owner.id,
            amount=cashback,
            type="CASHBACK_EARN",
            description=f"Кэшбэк за визит",
            visit_id=visit.id,
        ))

    if cashback_used > 0:
        db.add(BalanceTransaction(
            user_id=owner.id,
            amount=-cashback_used,
            type="CASHBACK_SPEND",
            description=f"Списание кэшбэка",
            visit_id=visit.id,
        ))

    # Update user balance
    owner.balance += (cashback - cashback_used)

    await db.flush()
