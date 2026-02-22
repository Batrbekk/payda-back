import asyncio
import re
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin, require_warranty_manager
from app.models.car import Car
from app.models.user import User
from app.models.warranty import Warranty
from app.schemas.warranty import (
    WarrantyOut, WarrantyCreate, WarrantyUpdate,
    SearchUserOut, SearchCarOut, UserBriefForWarranty,
)

router = APIRouter(prefix="/api/warranties", tags=["warranties"])


@router.get("", response_model=list[WarrantyOut])
async def list_warranties(
    user_id: str | None = Query(None, alias="userId"),
    search: str | None = None,
    filter: str = "all",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Warranty).options(selectinload(Warranty.user))

    if current_user.role == "USER":
        query = query.where(Warranty.user_id == current_user.id)
    elif user_id:
        query = query.where(Warranty.user_id == user_id)

    if search:
        query = query.where(or_(
            Warranty.contract_number.ilike(f"%{search}%"),
            Warranty.client_name.ilike(f"%{search}%"),
            Warranty.vin.ilike(f"%{search}%"),
        ))

    now = datetime.utcnow()
    if filter == "active":
        query = query.where(Warranty.is_active == True, Warranty.end_date >= now)  # noqa: E712
    elif filter == "expired":
        query = query.where(or_(Warranty.is_active == False, Warranty.end_date < now))  # noqa: E712

    query = query.order_by(Warranty.created_at.desc())
    result = await db.execute(query)
    warranties = result.scalars().all()

    out = []
    for w in warranties:
        wo = WarrantyOut.model_validate(w)
        if w.user:
            wo.user = UserBriefForWarranty(phone=w.user.phone, name=w.user.name)
        out.append(wo)
    return out


@router.post("", response_model=WarrantyOut, status_code=201)
async def create_warranty(
    body: WarrantyCreate,
    current_user: User = Depends(require_warranty_manager),
    db: AsyncSession = Depends(get_db),
):
    if not body.contract_number or not body.client_name:
        raise HTTPException(status_code=400, detail="Заполните все обязательные поля")

    # Auto-calculate dates if not provided
    now = datetime.utcnow()
    start_date = body.start_date or now
    if body.end_date:
        end_date = body.end_date
    elif body.year:
        # БУ (older than 2 years) → 1 month, new → 5 years
        if now.year - body.year >= 2:
            end_date = start_date + relativedelta(months=1)
        else:
            end_date = start_date + relativedelta(years=5)
    else:
        end_date = start_date + relativedelta(years=5)

    # Check unique contract number
    result = await db.execute(select(Warranty).where(Warranty.contract_number == body.contract_number))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Договор с таким номером уже существует")

    user_id = body.user_id
    car_id = body.car_id

    if body.phone and not user_id:
        # New client flow
        if not re.match(r"^\+7\d{10}$", body.phone):
            raise HTTPException(status_code=400, detail="Неверный формат телефона")
        if not body.brand or not body.model or not body.year or not body.plate_number:
            raise HTTPException(status_code=400, detail="Для нового клиента заполните данные авто")

        result = await db.execute(select(User).where(User.phone == body.phone))
        user = result.scalar_one_or_none()
        if not user:
            user = User(phone=body.phone)
            db.add(user)
            await db.flush()

        user_id = user.id

        car = Car(
            user_id=user_id, brand=body.brand, model=body.model,
            year=body.year, plate_number=body.plate_number,
            vin=body.vin,
        )
        db.add(car)
        await db.flush()
        car_id = car.id

    elif not user_id or not car_id:
        raise HTTPException(status_code=400, detail="Укажите пользователя и автомобиль")

    warranty = Warranty(
        contract_number=body.contract_number,
        user_id=user_id,
        car_id=car_id,
        client_name=body.client_name,
        vin=body.vin or "",
        brand=body.brand or "",
        model=body.model or "",
        year=body.year or 0,
        start_date=start_date,
        end_date=end_date,
        created_by_id=current_user.id,
    )
    db.add(warranty)
    await db.commit()
    await db.refresh(warranty)

    # Fire-and-forget Telegram notification
    try:
        from app.services.telegram_service import send_telegram, format_warranty_message
        msg = format_warranty_message(
            contract_number=body.contract_number,
            client_name=body.client_name,
            phone=body.phone or "",
            brand=body.brand or "",
            model=body.model or "",
            year=body.year or 0,
            vin=body.vin or "",
            start_date=start_date.strftime("%d.%m.%Y"),
            end_date=end_date.strftime("%d.%m.%Y"),
            manager_name=current_user.name,
        )
        asyncio.create_task(send_telegram(msg))
    except Exception:
        pass  # Don't block warranty creation

    return WarrantyOut.model_validate(warranty)


@router.put("/{warranty_id}", response_model=WarrantyOut)
async def update_warranty(
    warranty_id: str,
    body: WarrantyUpdate,
    _user: User = Depends(require_warranty_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Warranty).where(Warranty.id == warranty_id))
    warranty = result.scalar_one_or_none()
    if not warranty:
        raise HTTPException(status_code=404, detail="Гарантия не найдена")

    data = body.model_dump(exclude_unset=True)

    if "contract_number" in data and data["contract_number"] != warranty.contract_number:
        dup = await db.execute(
            select(Warranty).where(Warranty.contract_number == data["contract_number"])
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Договор с таким номером уже существует")

    for field, value in data.items():
        setattr(warranty, field, value)

    await db.commit()
    await db.refresh(warranty)
    return WarrantyOut.model_validate(warranty)


@router.delete("/{warranty_id}")
async def delete_warranty(
    warranty_id: str,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Warranty).where(Warranty.id == warranty_id))
    warranty = result.scalar_one_or_none()
    if not warranty:
        raise HTTPException(status_code=404, detail="Гарантия не найдена")

    await db.delete(warranty)
    await db.commit()
    return {"message": "Удалено"}


@router.get("/search-users", response_model=list[SearchUserOut])
async def search_users(
    phone: str = Query(""),
    _user: User = Depends(require_warranty_manager),
    db: AsyncSession = Depends(get_db),
):
    if len(phone) < 3:
        return []

    result = await db.execute(
        select(User)
        .where(User.phone.ilike(f"%{phone}%"))
        .options(selectinload(User.cars))
        .limit(10)
    )
    users = result.scalars().all()

    return [
        SearchUserOut(
            id=u.id, phone=u.phone, name=u.name,
            cars=[
                SearchCarOut(
                    id=c.id, vin=c.vin, brand=c.brand,
                    model=c.model, year=c.year, plate_number=c.plate_number,
                )
                for c in u.cars
            ],
        )
        for u in users
    ]
