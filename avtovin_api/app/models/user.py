from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    phone: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    password: Mapped[str | None] = mapped_column(String, nullable=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, default="USER")  # USER, ADMIN, SC_MANAGER, WARRANTY_MANAGER
    fcm_token: Mapped[str | None] = mapped_column(String, nullable=True)
    salon_name: Mapped[str | None] = mapped_column(String, nullable=True)
    balance: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    cars = relationship("Car", back_populates="user", cascade="all, delete-orphan")
    service_center = relationship("ServiceCenter", back_populates="manager", uselist=False)
    warranties = relationship("Warranty", back_populates="user", foreign_keys="[Warranty.user_id]")
    created_warranties = relationship("Warranty", back_populates="created_by", foreign_keys="[Warranty.created_by_id]")
    balance_transactions = relationship("BalanceTransaction", back_populates="user", cascade="all, delete-orphan")
