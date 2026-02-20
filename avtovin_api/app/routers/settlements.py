from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_admin
from app.models.service_center import ServiceCenter
from app.models.settlement import Settlement
from app.models.user import User
from app.models.visit import Visit
from app.schemas.settlement import SettlementOut, SettlementCreate, SettlementUpdate

router = APIRouter(prefix="/api/settlements", tags=["settlements"])


@router.get("", response_model=list[SettlementOut])
async def list_settlements(
    is_paid: str | None = Query(None, alias="isPaid"),
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Settlement).order_by(Settlement.created_at.desc())
    if is_paid == "true":
        query = query.where(Settlement.is_paid == True)  # noqa: E712
    elif is_paid == "false":
        query = query.where(Settlement.is_paid == False)  # noqa: E712

    result = await db.execute(query)
    return [SettlementOut.model_validate(s) for s in result.scalars().all()]


@router.post("", status_code=201)
async def create_settlements(
    body: SettlementCreate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not body.period_start or not body.period_end:
        raise HTTPException(status_code=400, detail="Укажите период")

    # Get all active SCs
    result = await db.execute(
        select(ServiceCenter).where(ServiceCenter.is_active == True)  # noqa: E712
    )
    scs = result.scalars().all()

    created = []
    for sc in scs:
        # Get visits in period
        result = await db.execute(
            select(Visit).where(
                Visit.service_center_id == sc.id,
                Visit.created_at >= body.period_start,
                Visit.created_at <= body.period_end,
            )
        )
        visits = result.scalars().all()
        if not visits:
            continue

        total_commission = sum(v.service_fee for v in visits)
        total_cashback = sum(v.cashback_used for v in visits)

        settlement = Settlement(
            service_center_id=sc.id,
            period_start=body.period_start,
            period_end=body.period_end,
            total_commission=total_commission,
            total_cashback_redeemed=total_cashback,
            net_amount=total_commission,
        )
        db.add(settlement)
        created.append(settlement)

    await db.commit()
    for s in created:
        await db.refresh(s)

    return {
        "created": len(created),
        "settlements": [SettlementOut.model_validate(s) for s in created],
    }


@router.get("/{settlement_id}", response_model=SettlementOut)
async def get_settlement(
    settlement_id: str,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Settlement).where(Settlement.id == settlement_id))
    settlement = result.scalar_one_or_none()
    if not settlement:
        raise HTTPException(status_code=404, detail="Не найдено")
    return SettlementOut.model_validate(settlement)


@router.put("/{settlement_id}", response_model=SettlementOut)
async def update_settlement(
    settlement_id: str,
    body: SettlementUpdate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Settlement).where(Settlement.id == settlement_id))
    settlement = result.scalar_one_or_none()
    if not settlement:
        raise HTTPException(status_code=404, detail="Не найдено")

    data = body.model_dump(exclude_unset=True)

    # If receipt approved, auto mark as paid
    if data.get("receipt_status") == "APPROVED":
        data["is_paid"] = True

    for field, value in data.items():
        setattr(settlement, field, value)

    await db.commit()
    await db.refresh(settlement)
    return SettlementOut.model_validate(settlement)


@router.delete("/{settlement_id}")
async def delete_settlement(
    settlement_id: str,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Settlement).where(Settlement.id == settlement_id))
    settlement = result.scalar_one_or_none()
    if not settlement:
        raise HTTPException(status_code=404, detail="Не найдено")

    await db.delete(settlement)
    await db.commit()
    return {"success": True}
