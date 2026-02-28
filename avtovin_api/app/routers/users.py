import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.balance import BalanceTransaction
from app.schemas.user import (
    UserOut, UserUpdate, UserListOut,
    FcmTokenRequest, BalanceOut, TransactionOut,
    CarInfoBrief, UserCountOut,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=UserListOut)
async def list_users(
    search: str | None = None,
    role: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    count_query = select(func.count(User.id))

    if search:
        flt = or_(User.name.ilike(f"%{search}%"), User.phone.ilike(f"%{search}%"))
        query = query.where(flt)
        count_query = count_query.where(flt)

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = math.ceil(total / limit) if total else 1

    query = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    query = query.options(selectinload(User.cars))
    result = await db.execute(query)
    users = result.scalars().all()

    users_out = []
    for u in users:
        cars = [CarInfoBrief.model_validate(c) for c in u.cars]
        uo = UserOut(
            id=u.id, phone=u.phone, email=u.email, name=u.name, role=u.role,
            balance=u.balance, fcm_token=u.fcm_token, salon_name=u.salon_name,
            created_at=u.created_at, updated_at=u.updated_at,
            cars=cars, count=UserCountOut(cars=len(u.cars)),
        )
        users_out.append(uo)

    return UserListOut(
        users=users_out,
        total=total,
        page=page,
        total_pages=total_pages,
    )


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.cars))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return UserOut.model_validate(user)


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.cars))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user, attribute_names=["cars"])
    return UserOut.model_validate(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    await db.delete(user)
    await db.commit()
    return {"message": "Пользователь удалён"}


@router.get("/{user_id}/balance", response_model=BalanceOut)
async def get_balance(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Нет доступа")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    count_q = select(func.count(BalanceTransaction.id)).where(BalanceTransaction.user_id == user_id)
    total = (await db.execute(count_q)).scalar() or 0
    total_pages = math.ceil(total / limit) if total else 1

    q = (
        select(BalanceTransaction)
        .where(BalanceTransaction.user_id == user_id)
        .order_by(BalanceTransaction.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(q)
    txns = result.scalars().all()

    return BalanceOut(
        balance=user.balance,
        transactions=[TransactionOut.model_validate(t) for t in txns],
        total=total,
        page=page,
        total_pages=total_pages,
    )


@router.post("/fcm-token")
async def update_fcm_token(
    body: FcmTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.fcm_token:
        raise HTTPException(status_code=400, detail="fcmToken обязателен")

    current_user.fcm_token = body.fcm_token
    await db.commit()
    return {"success": True}
