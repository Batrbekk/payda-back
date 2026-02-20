from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceOut, ServiceCreate, ServiceUpdate

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("", response_model=list[ServiceOut])
async def list_services(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).order_by(Service.name))
    return [ServiceOut.model_validate(s) for s in result.scalars().all()]


@router.post("", response_model=ServiceOut, status_code=201)
async def create_service(
    body: ServiceCreate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not body.name:
        raise HTTPException(status_code=400, detail="Название обязательно")

    service = Service(**body.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return ServiceOut.model_validate(service)


@router.put("/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: str,
    body: ServiceUpdate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(service, field, value)

    await db.commit()
    await db.refresh(service)
    return ServiceOut.model_validate(service)


@router.delete("/{service_id}")
async def delete_service(
    service_id: str,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")

    await db.delete(service)
    await db.commit()
    return {"ok": True}
