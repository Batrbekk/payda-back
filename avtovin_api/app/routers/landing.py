import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.landing_partner import LandingPartner
from app.dependencies import require_admin

router = APIRouter(prefix="/api/landing", tags=["landing"])


# ── Schemas ──────────────────────────────────────────────

class PartnerCreate(BaseModel):
    name: str
    city: str
    address: str | None = None
    phone: str | None = None
    logo_url: str | None = None
    services: str | None = None
    sort_order: int = 0
    is_active: bool = True


class PartnerUpdate(BaseModel):
    name: str | None = None
    city: str | None = None
    address: str | None = None
    phone: str | None = None
    logo_url: str | None = None
    services: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


# ── Public endpoints (no auth) ───────────────────────────

@router.get("/cities")
async def get_landing_cities(db: AsyncSession = Depends(get_db)):
    """Public: get unique cities from active landing partners."""
    result = await db.execute(
        select(LandingPartner.city, func.count(LandingPartner.id).label("count"))
        .where(LandingPartner.is_active == True)  # noqa: E712
        .group_by(LandingPartner.city)
        .order_by(LandingPartner.city)
    )
    rows = result.all()
    return [{"name": row.city, "count": row.count} for row in rows]


@router.get("/partners")
async def get_landing_partners(
    city: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Public: get active partners for landing page, optionally filtered by city."""
    q = (
        select(LandingPartner)
        .where(LandingPartner.is_active == True)  # noqa: E712
        .order_by(LandingPartner.sort_order, LandingPartner.name)
    )
    if city:
        q = q.where(LandingPartner.city == city)
    result = await db.execute(q)
    partners = result.scalars().all()
    return [_partner_dict(p) for p in partners]


# ── Admin CRUD ───────────────────────────────────────────

@router.get("/admin/partners")
async def admin_list_partners(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list ALL partners (including inactive)."""
    result = await db.execute(
        select(LandingPartner).order_by(LandingPartner.city, LandingPartner.sort_order, LandingPartner.name)
    )
    partners = result.scalars().all()
    return [_partner_dict(p) for p in partners]


@router.post("/admin/partners")
async def admin_create_partner(
    body: PartnerCreate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: create a new landing partner."""
    partner = LandingPartner(**body.model_dump())
    db.add(partner)
    await db.commit()
    await db.refresh(partner)
    return _partner_dict(partner)


@router.put("/admin/partners/{partner_id}")
async def admin_update_partner(
    partner_id: str,
    body: PartnerUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: update an existing landing partner."""
    result = await db.execute(select(LandingPartner).where(LandingPartner.id == partner_id))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(404, "Partner not found")

    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(partner, key, value)
    await db.commit()
    await db.refresh(partner)
    return _partner_dict(partner)


@router.delete("/admin/partners/{partner_id}")
async def admin_delete_partner(
    partner_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: delete a landing partner."""
    result = await db.execute(select(LandingPartner).where(LandingPartner.id == partner_id))
    partner = result.scalar_one_or_none()
    if not partner:
        raise HTTPException(404, "Partner not found")
    await db.delete(partner)
    await db.commit()
    return {"ok": True}


UPLOAD_DIR = "/app/uploads/logos"


@router.post("/admin/upload-logo")
async def upload_logo(
    file: UploadFile = File(...),
    admin=Depends(require_admin),
):
    """Admin: upload a partner logo, returns the public URL."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "logo.png")[1] or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/logos/{filename}"}


# ── Helpers ──────────────────────────────────────────────

def _partner_dict(p: LandingPartner) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "city": p.city,
        "address": p.address,
        "phone": p.phone,
        "logo_url": p.logo_url,
        "services": [s.strip() for s in p.services.split(",") if s.strip()] if p.services else [],
        "sort_order": p.sort_order,
        "is_active": p.is_active,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }
