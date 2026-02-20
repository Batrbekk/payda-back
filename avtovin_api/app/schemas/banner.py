from datetime import datetime

from app.schemas.base import CamelModel


class BannerOut(CamelModel):
    id: str
    type: str = "promo"
    title: str
    subtitle: str | None = None
    description: str | None = None
    image_url: str | None = None
    action_type: str = "none"
    action_value: str | None = None
    sort_order: int = 0
    is_active: bool = True
    conditions: str | None = None
    winners: str | None = None
    prize_title: str | None = None
    prize_image: str | None = None
    draw_date: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class BannerCreate(CamelModel):
    type: str = "promo"
    title: str
    subtitle: str | None = None
    description: str | None = None
    image_url: str | None = None
    action_type: str = "none"
    action_value: str | None = None
    sort_order: int = 0
    is_active: bool = True
    conditions: str | None = None
    winners: str | None = None
    prize_title: str | None = None
    prize_image: str | None = None
    draw_date: str | None = None


class BannerUpdate(CamelModel):
    type: str | None = None
    title: str | None = None
    subtitle: str | None = None
    description: str | None = None
    image_url: str | None = None
    action_type: str | None = None
    action_value: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None
    conditions: str | None = None
    winners: str | None = None
    prize_title: str | None = None
    prize_image: str | None = None
    draw_date: str | None = None
