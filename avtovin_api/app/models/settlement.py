from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Settlement(Base):
    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    service_center_id: Mapped[str] = mapped_column(String, ForeignKey("service_centers.id"))
    period_start: Mapped[datetime] = mapped_column(DateTime)
    period_end: Mapped[datetime] = mapped_column(DateTime)
    total_commission: Mapped[int] = mapped_column(Integer)
    total_cashback_redeemed: Mapped[int] = mapped_column(Integer)
    net_amount: Mapped[int] = mapped_column(Integer)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    receipt_url: Mapped[str | None] = mapped_column(String, nullable=True)
    receipt_status: Mapped[str] = mapped_column(String, default="NONE")  # NONE, PENDING, APPROVED, REJECTED
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    service_center = relationship("ServiceCenter", back_populates="settlements")
