from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.models.warranty import Warranty
from app.services.auth_service import hash_password
from app.schemas.warranty import WarrantyManagerOut, WarrantyManagerCreate

router = APIRouter(prefix="/api/warranty-managers", tags=["warranty-managers"])


@router.get("", response_model=list[WarrantyManagerOut])
async def list_warranty_managers(
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.role == "WARRANTY_MANAGER")
        .options(selectinload(User.created_warranties))
    )
    managers = result.scalars().all()
    now = datetime.now(timezone.utc)

    return [
        WarrantyManagerOut(
            id=m.id, phone=m.phone, email=m.email,
            name=m.name, salon_name=m.salon_name, created_at=m.created_at,
            total_warranties=len(m.created_warranties),
            active_warranties=sum(
                1 for w in m.created_warranties if w.is_active and w.end_date >= now
            ),
        )
        for m in managers
    ]


@router.post("", response_model=WarrantyManagerOut, status_code=201)
async def create_warranty_manager(
    body: WarrantyManagerCreate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not body.phone or not body.name or not body.email or not body.password:
        raise HTTPException(status_code=400, detail="Заполните все обязательные поля")

    # Check uniqueness
    result = await db.execute(select(User).where(User.phone == body.phone))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Пользователь с таким телефоном уже существует")

    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует")

    manager = User(
        phone=body.phone,
        name=body.name,
        email=body.email,
        password=hash_password(body.password),
        role="WARRANTY_MANAGER",
        salon_name=body.salon_name,
    )
    db.add(manager)
    await db.commit()
    await db.refresh(manager)

    return WarrantyManagerOut(
        id=manager.id, phone=manager.phone, email=manager.email,
        name=manager.name, salon_name=manager.salon_name, created_at=manager.created_at,
        total_warranties=0, active_warranties=0,
    )


@router.put("/{manager_id}", response_model=WarrantyManagerOut)
async def update_warranty_manager(
    manager_id: str,
    body: WarrantyManagerCreate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == manager_id, User.role == "WARRANTY_MANAGER"))
    manager = result.scalar_one_or_none()
    if not manager:
        raise HTTPException(status_code=404, detail="Менеджер не найден")

    data = body.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        data["password"] = hash_password(data["password"])
    elif "password" in data:
        del data["password"]

    for field, value in data.items():
        setattr(manager, field, value)

    await db.commit()
    await db.refresh(manager)
    return WarrantyManagerOut(
        id=manager.id, phone=manager.phone, email=manager.email,
        name=manager.name, salon_name=manager.salon_name, created_at=manager.created_at,
        total_warranties=0, active_warranties=0,
    )


@router.delete("/{manager_id}")
async def delete_warranty_manager(
    manager_id: str,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == manager_id, User.role == "WARRANTY_MANAGER"))
    manager = result.scalar_one_or_none()
    if not manager:
        raise HTTPException(status_code=404, detail="Менеджер не найден")

    await db.delete(manager)
    await db.commit()
    return {"message": "Удалено"}
