from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, delete, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin, require_sc_manager
from app.models.service import Service
from app.models.service_center import ServiceCenter, ServiceCenterAddress, ServiceCenterService
from app.models.settlement import Settlement
from app.models.user import User
from app.models.visit import Visit
from app.schemas.service_center import (
    ServiceCenterOut, ServiceCenterCreate, ServiceCenterUpdate,
    AddressOut, ScServiceOut, ScDashboardOut, ScStatsOut,
    FinancesOut, MonthDataOut, FinanceVisitOut, SettlementBriefOut,
    UploadReceiptRequest, ManagerBrief, ServiceBrief, ScServiceDetail, ScCountOut,
)

router = APIRouter(prefix="/api/service-centers", tags=["service-centers"])


def _sc_out(sc: ServiceCenter, visit_count: int = 0) -> ServiceCenterOut:
    manager_brief = None
    if sc.manager:
        manager_brief = ManagerBrief(phone=sc.manager.phone, name=sc.manager.name)
    svc_details = []
    for scs in sc.services:
        svc_brief = None
        if scs.service:
            svc_brief = ServiceBrief(id=scs.service.id, name=scs.service.name, category=scs.service.category)
        svc_details.append(ScServiceDetail(
            id=scs.id, service_center_id=scs.service_center_id,
            service_id=scs.service_id, price=scs.price,
            is_flex_price=scs.is_flex_price, service=svc_brief,
        ))
    return ServiceCenterOut(
        **{c.key: getattr(sc, c.key) for c in ServiceCenter.__table__.columns},
        addresses=[AddressOut.model_validate(a) for a in sc.addresses],
        manager=manager_brief,
        services=svc_details,
        count=ScCountOut(visits=visit_count),
    )

MONTH_NAMES = [
    "", "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
]


@router.get("", response_model=list[ServiceCenterOut])
async def list_service_centers(
    city: str | None = None,
    search: str | None = None,
    type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(ServiceCenter).where(ServiceCenter.is_active == True).options(  # noqa: E712
        selectinload(ServiceCenter.addresses),
        selectinload(ServiceCenter.manager),
        selectinload(ServiceCenter.services).selectinload(ServiceCenterService.service),
    )
    if city:
        query = query.where(ServiceCenter.city == city)
    if search:
        query = query.where(ServiceCenter.name.ilike(f"%{search}%"))
    if type:
        query = query.where(ServiceCenter.type == type)

    query = query.order_by(ServiceCenter.rating.desc())
    result = await db.execute(query)
    scs = result.scalars().all()

    # Batch count visits per SC
    sc_ids = [sc.id for sc in scs]
    visit_counts: dict[str, int] = {}
    if sc_ids:
        count_result = await db.execute(
            select(Visit.service_center_id, func.count(Visit.id))
            .where(Visit.service_center_id.in_(sc_ids))
            .group_by(Visit.service_center_id)
        )
        for sc_id, cnt in count_result.all():
            visit_counts[sc_id] = cnt

    return [_sc_out(sc, visit_counts.get(sc.id, 0)) for sc in scs]


@router.post("", response_model=ServiceCenterOut, status_code=201)
async def create_service_center(
    body: ServiceCenterCreate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not body.name:
        raise HTTPException(status_code=400, detail="Название обязательно")
    if not body.addresses:
        raise HTTPException(status_code=400, detail="Укажите хотя бы один адрес")

    # Handle manager
    manager_id = None
    if body.manager_phone:
        result = await db.execute(select(User).where(User.phone == body.manager_phone))
        manager = result.scalar_one_or_none()
        if not manager:
            manager = User(phone=body.manager_phone, role="SC_MANAGER")
            db.add(manager)
            await db.flush()
        else:
            manager.role = "SC_MANAGER"
        manager_id = manager.id

    sc = ServiceCenter(
        name=body.name,
        type=body.type,
        description=body.description,
        city=body.city,
        phone=body.phone,
        logo_url=body.logo_url,
        link_2gis=body.link_2gis,
        link_instagram=body.link_instagram,
        link_website=body.link_website,
        link_whatsapp=body.link_whatsapp,
        commission_percent=body.commission_percent,
        discount_percent=body.discount_percent,
        manager_id=manager_id,
    )
    db.add(sc)
    await db.flush()

    for addr in body.addresses:
        db.add(ServiceCenterAddress(address=addr.address, city=addr.city, service_center_id=sc.id))

    for svc in body.service_ids:
        db.add(ServiceCenterService(
            service_center_id=sc.id, service_id=svc.service_id,
            price=svc.price, is_flex_price=svc.is_flex_price,
        ))

    await db.commit()
    await db.refresh(sc, ["addresses", "manager", "services"])
    return _sc_out(sc, 0)


@router.get("/my", response_model=ScDashboardOut)
async def get_my_service_center(
    current_user: User = Depends(require_sc_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ServiceCenter)
        .where(ServiceCenter.manager_id == current_user.id)
        .options(
            selectinload(ServiceCenter.addresses),
            selectinload(ServiceCenter.services).selectinload(ServiceCenterService.service),
        )
    )
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="Сервисный центр не найден")

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    today_count = (await db.execute(
        select(func.count(Visit.id)).where(
            Visit.service_center_id == sc.id, Visit.created_at >= today_start
        )
    )).scalar() or 0

    month_count = (await db.execute(
        select(func.count(Visit.id)).where(
            Visit.service_center_id == sc.id, Visit.created_at >= month_start
        )
    )).scalar() or 0

    unpaid = (await db.execute(
        select(func.coalesce(func.sum(Settlement.net_amount), 0)).where(
            Settlement.service_center_id == sc.id, Settlement.is_paid == False  # noqa: E712
        )
    )).scalar() or 0

    return ScDashboardOut(
        id=sc.id, name=sc.name, type=sc.type, description=sc.description,
        city=sc.city, phone=sc.phone, rating=sc.rating, logo_url=sc.logo_url,
        commission_percent=sc.commission_percent, discount_percent=sc.discount_percent,
        addresses=[a.address for a in sc.addresses],
        services=[scs.service.name for scs in sc.services],
        stats=ScStatsOut(today_visits=today_count, month_visits=month_count, unpaid_amount=unpaid),
    )


@router.get("/my/finances", response_model=FinancesOut)
async def get_my_finances(
    current_user: User = Depends(require_sc_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ServiceCenter).where(ServiceCenter.manager_id == current_user.id)
    )
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="СЦ не найден")

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_name = f"{MONTH_NAMES[now.month]} {now.year}"

    # Current month visits
    from sqlalchemy.orm import selectinload as sl
    visits_result = await db.execute(
        select(Visit)
        .where(Visit.service_center_id == sc.id, Visit.created_at >= month_start)
        .options(sl(Visit.car))
        .order_by(Visit.created_at.desc())
    )
    visits = visits_result.scalars().all()

    month_total = sum(v.service_fee for v in visits)
    visit_items = [
        FinanceVisitOut(
            id=v.id, date=v.created_at,
            car=f"{v.car.brand} {v.car.model}",
            vin=v.car.vin, plate=v.car.plate_number,
            fee=v.service_fee,
        )
        for v in visits
    ]

    # Settlements
    settlements_result = await db.execute(
        select(Settlement)
        .where(Settlement.service_center_id == sc.id)
        .order_by(Settlement.created_at.desc())
    )
    settlements = settlements_result.scalars().all()

    unpaid = sum(s.total_commission for s in settlements if not s.is_paid)
    # Add current month if not covered
    covered = any(s.period_start >= month_start for s in settlements)
    if not covered:
        unpaid += month_total

    return FinancesOut(
        unpaid_amount=unpaid,
        current_month=MonthDataOut(
            name=month_name, total=month_total,
            visit_count=len(visits), visits=visit_items,
        ),
        settlements=[
            SettlementBriefOut(
                id=s.id,
                period=f"{MONTH_NAMES[s.period_start.month]} {s.period_start.year}",
                amount=s.total_commission,
                is_paid=s.is_paid,
                period_start=s.period_start,
                period_end=s.period_end,
            )
            for s in settlements
        ],
    )


@router.post("/my/finances/upload-receipt")
async def upload_receipt(
    body: UploadReceiptRequest,
    current_user: User = Depends(require_sc_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ServiceCenter).where(ServiceCenter.manager_id == current_user.id)
    )
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="СЦ не найден")
    if not body.receiptBase64:
        raise HTTPException(status_code=400, detail="Прикрепите чек")

    if body.settlementId:
        result = await db.execute(
            select(Settlement).where(
                Settlement.id == body.settlementId,
                Settlement.service_center_id == sc.id,
            )
        )
        settlement = result.scalar_one_or_none()
        if not settlement:
            raise HTTPException(status_code=404, detail="Расчёт не найден")

        settlement.receipt_url = body.receiptBase64
        settlement.receipt_status = "PENDING"
        await db.commit()
        return {"success": True, "settlementId": settlement.id}

    # Bulk: update all unpaid NONE-status settlements
    result = await db.execute(
        select(Settlement).where(
            Settlement.service_center_id == sc.id,
            Settlement.is_paid == False,  # noqa: E712
            Settlement.receipt_status == "NONE",
        )
    )
    settlements = result.scalars().all()

    if not settlements:
        # Auto-create settlement from current month
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        visits_result = await db.execute(
            select(Visit).where(
                Visit.service_center_id == sc.id, Visit.created_at >= month_start
            )
        )
        visits = visits_result.scalars().all()
        if not visits:
            raise HTTPException(status_code=400, detail="Нет визитов для расчёта")

        total_commission = sum(v.service_fee for v in visits)
        total_cashback = sum(v.cashback_used for v in visits)

        new_settlement = Settlement(
            service_center_id=sc.id,
            period_start=month_start,
            period_end=now,
            total_commission=total_commission,
            total_cashback_redeemed=total_cashback,
            net_amount=total_commission,
            receipt_url=body.receiptBase64,
            receipt_status="PENDING",
        )
        db.add(new_settlement)
        await db.commit()
        await db.refresh(new_settlement)
        return {"success": True, "settlementId": new_settlement.id}

    for s in settlements:
        s.receipt_url = body.receiptBase64
        s.receipt_status = "PENDING"
    await db.commit()
    return {"success": True, "updatedCount": len(settlements)}


@router.get("/{sc_id}", response_model=ServiceCenterOut)
async def get_service_center(
    sc_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ServiceCenter).where(ServiceCenter.id == sc_id)
        .options(
            selectinload(ServiceCenter.addresses),
            selectinload(ServiceCenter.manager),
            selectinload(ServiceCenter.services).selectinload(ServiceCenterService.service),
        )
    )
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="СЦ не найден")

    cnt = (await db.execute(
        select(func.count(Visit.id)).where(Visit.service_center_id == sc.id)
    )).scalar() or 0

    return _sc_out(sc, cnt)


@router.put("/{sc_id}", response_model=ServiceCenterOut)
async def update_service_center(
    sc_id: str,
    body: ServiceCenterUpdate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ServiceCenter).where(ServiceCenter.id == sc_id)
        .options(selectinload(ServiceCenter.addresses))
    )
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="СЦ не найден")

    data = body.model_dump(exclude_unset=True)

    # Handle manager
    if "manager_phone" in data:
        manager_phone = data.pop("manager_phone")
        if manager_phone:
            mr = await db.execute(select(User).where(User.phone == manager_phone))
            manager = mr.scalar_one_or_none()
            if not manager:
                manager = User(phone=manager_phone, role="SC_MANAGER")
                db.add(manager)
                await db.flush()
            else:
                manager.role = "SC_MANAGER"
            sc.manager_id = manager.id

    # Handle addresses
    if "addresses" in data:
        addrs = data.pop("addresses")
        await db.execute(
            delete(ServiceCenterAddress).where(ServiceCenterAddress.service_center_id == sc.id)
        )
        for addr in addrs:
            db.add(ServiceCenterAddress(
                address=addr["address"], city=addr.get("city", "Алматы"),
                service_center_id=sc.id,
            ))

    # Handle services
    if "service_ids" in data:
        svcs = data.pop("service_ids")
        await db.execute(
            delete(ServiceCenterService).where(ServiceCenterService.service_center_id == sc.id)
        )
        for svc in svcs:
            db.add(ServiceCenterService(
                service_center_id=sc.id, service_id=svc["service_id"],
                price=svc.get("price"), is_flex_price=svc.get("is_flex_price", False),
            ))

    for field, value in data.items():
        setattr(sc, field, value)

    await db.commit()
    await db.refresh(sc, ["addresses", "manager", "services"])

    cnt = (await db.execute(
        select(func.count(Visit.id)).where(Visit.service_center_id == sc.id)
    )).scalar() or 0

    return _sc_out(sc, cnt)


@router.delete("/{sc_id}")
async def delete_service_center(
    sc_id: str,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ServiceCenter).where(ServiceCenter.id == sc_id))
    sc = result.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="СЦ не найден")

    await db.delete(sc)
    await db.commit()
    return {"message": "Сервисный центр удалён"}


@router.get("/{sc_id}/services", response_model=list[ScServiceOut])
async def get_sc_services(
    sc_id: str,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ServiceCenterService)
        .where(ServiceCenterService.service_center_id == sc_id)
        .options(selectinload(ServiceCenterService.service))
    )
    sc_services = result.scalars().all()

    return [
        ScServiceOut(
            id=scs.service.id,
            name=scs.service.name,
            category=scs.service.category,
            price=scs.price,
            is_flex_price=scs.is_flex_price,
            commission_type=scs.service.commission_type,
            commission_value=scs.service.commission_value,
            cashback_type=scs.service.cashback_type,
            cashback_value=scs.service.cashback_value,
        )
        for scs in sc_services
    ]
