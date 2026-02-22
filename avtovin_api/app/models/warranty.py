from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Warranty(Base):
    __tablename__ = "warranties"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    contract_number: Mapped[str] = mapped_column(String, unique=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    car_id: Mapped[str] = mapped_column(String, ForeignKey("cars.id", ondelete="CASCADE"))
    client_name: Mapped[str] = mapped_column(String)
    vin: Mapped[str] = mapped_column(String)
    brand: Mapped[str] = mapped_column(String)
    model: Mapped[str] = mapped_column(String)
    year: Mapped[int] = mapped_column(Integer)
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[datetime] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    doc_urls: Mapped[str | None] = mapped_column(String, nullable=True)
    created_by_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="warranties", foreign_keys=[user_id])
    car = relationship("Car", back_populates="warranties")
    created_by = relationship("User", back_populates="created_warranties", foreign_keys=[created_by_id])
