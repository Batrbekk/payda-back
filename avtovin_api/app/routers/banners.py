from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.banner import Banner
from app.models.user import User
from app.schemas.banner import BannerOut, BannerCreate, BannerUpdate

router = APIRouter(prefix="/api/banners", tags=["banners"])


@router.get("", response_model=list[BannerOut])
async def list_banners(
    all: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Banner)
    if all != "true":
        query = query.where(Banner.is_active == True)  # noqa: E712
    query = query.order_by(Banner.sort_order)
    result = await db.execute(query)
    return [BannerOut.model_validate(b) for b in result.scalars().all()]


@router.post("", response_model=BannerOut, status_code=201)
async def create_banner(
    body: BannerCreate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not body.title:
        raise HTTPException(status_code=400, detail="Title обязателен")

    banner = Banner(**body.model_dump())
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return BannerOut.model_validate(banner)


@router.put("/{banner_id}", response_model=BannerOut)
async def update_banner(
    banner_id: str,
    body: BannerUpdate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Баннер не найден")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(banner, field, value)

    await db.commit()
    await db.refresh(banner)
    return BannerOut.model_validate(banner)


@router.delete("/{banner_id}")
async def delete_banner(
    banner_id: str,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Баннер не найден")

    await db.delete(banner)
    await db.commit()
    return {"message": "Баннер удалён"}
