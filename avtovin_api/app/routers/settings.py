from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.app_settings import AppSettings
from app.models.user import User

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
async def get_settings(
    key: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    if not key:
        raise HTTPException(status_code=400, detail="key parameter required")

    keys = [k.strip() for k in key.split(",") if k.strip()]
    result = await db.execute(select(AppSettings).where(AppSettings.key.in_(keys)))
    settings = result.scalars().all()

    return {s.key: s.value for s in settings}


class SettingUpdate(BaseModel):
    key: str
    value: str


@router.put("")
async def update_setting(
    body: SettingUpdate,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not body.key or body.value is None:
        raise HTTPException(status_code=400, detail="key and value required")

    result = await db.execute(select(AppSettings).where(AppSettings.key == body.key))
    setting = result.scalar_one_or_none()

    if setting:
        setting.value = body.value
    else:
        setting = AppSettings(key=body.key, value=body.value)
        db.add(setting)

    await db.commit()
    await db.refresh(setting)
    return {"id": setting.id, "key": setting.key, "value": setting.value}
