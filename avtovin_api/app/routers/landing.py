from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.service_center import ServiceCenter, ServiceCenterAddress, ServiceCenterService
from app.models.service import Service
from app.dependencies import require_admin

router = APIRouter(prefix="/api/landing", tags=["landing"])


@router.get("/cities")
async def get_landing_cities(db: AsyncSession = Depends(get_db)):
    """Public: get unique cities from active service centers shown on landing."""
    result = await db.execute(
        select(ServiceCenter.city, func.count(ServiceCenter.id).label("count"))
        .where(ServiceCenter.is_active == True, ServiceCenter.show_on_landing == True)
        .group_by(ServiceCenter.city)
        .order_by(func.count(ServiceCenter.id).desc())
    )
    rows = result.all()
    return [{"name": row.city, "count": row.count} for row in rows]


@router.get("/partners")
async def get_landing_partners(
    city: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Public: get partners for landing page, optionally filtered by city."""
    q = (
        select(ServiceCenter)
        .where(ServiceCenter.is_active == True, ServiceCenter.show_on_landing == True)
        .options(
            selectinload(ServiceCenter.addresses),
            selectinload(ServiceCenter.services).selectinload(ServiceCenterService.service),
        )
        .order_by(ServiceCenter.name)
    )
    if city:
        q = q.where(ServiceCenter.city == city)
    result = await db.execute(q)
    scs = result.scalars().all()
    return [
        {
            "id": sc.id,
            "name": sc.name,
            "type": sc.type,
            "city": sc.city,
            "rating": sc.rating,
            "logo_url": sc.logo_url,
            "addresses": [a.address for a in sc.addresses],
            "services": [s.service.name for s in sc.services if s.service],
        }
        for sc in scs
    ]


@router.put("/partners/{sc_id}/visibility")
async def toggle_partner_visibility(
    sc_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: toggle show_on_landing for a partner."""
    result = await db.execute(select(ServiceCenter).where(ServiceCenter.id == sc_id))
    sc = result.scalar_one_or_none()
    if not sc:
        from fastapi import HTTPException
        raise HTTPException(404, "Partner not found")
    sc.show_on_landing = not sc.show_on_landing
    await db.commit()
    return {"id": sc.id, "show_on_landing": sc.show_on_landing}
