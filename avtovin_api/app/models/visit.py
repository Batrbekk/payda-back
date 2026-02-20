from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    car_id: Mapped[str] = mapped_column(String, ForeignKey("cars.id", ondelete="CASCADE"))
    service_center_id: Mapped[str] = mapped_column(String, ForeignKey("service_centers.id"))
    description: Mapped[str] = mapped_column(String)
    cost: Mapped[int] = mapped_column(Integer)
    mileage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cashback: Mapped[int] = mapped_column(Integer, default=0)
    cashback_used: Mapped[int] = mapped_column(Integer, default=0)
    service_fee: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="COMPLETED")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    car = relationship("Car", back_populates="visits")
    service_center = relationship("ServiceCenter", back_populates="visits")
    services = relationship("VisitService", back_populates="visit", cascade="all, delete-orphan")
    balance_transactions = relationship("BalanceTransaction", back_populates="visit")


class VisitService(Base):
    __tablename__ = "visit_services"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    visit_id: Mapped[str] = mapped_column(String, ForeignKey("visits.id", ondelete="CASCADE"))
    service_name: Mapped[str] = mapped_column(String)
    price: Mapped[int] = mapped_column(Integer)
    commission: Mapped[int] = mapped_column(Integer)
    cashback: Mapped[int] = mapped_column(Integer)
    details: Mapped[str | None] = mapped_column(String, nullable=True)

    visit = relationship("Visit", back_populates="services")
