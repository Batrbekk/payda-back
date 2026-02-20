from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ServiceCenter(Base):
    __tablename__ = "service_centers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String, default="SERVICE_CENTER")
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str] = mapped_column(String, default="Алматы")
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    commission_percent: Mapped[float] = mapped_column(Float, default=0)
    discount_percent: Mapped[float] = mapped_column(Float, default=0)
    logo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    link_2gis: Mapped[str | None] = mapped_column(String, nullable=True)
    link_instagram: Mapped[str | None] = mapped_column(String, nullable=True)
    link_website: Mapped[str | None] = mapped_column(String, nullable=True)
    link_whatsapp: Mapped[str | None] = mapped_column(String, nullable=True)
    manager_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    manager = relationship("User", back_populates="service_center")
    addresses = relationship("ServiceCenterAddress", back_populates="service_center", cascade="all, delete-orphan")
    services = relationship("ServiceCenterService", back_populates="service_center", cascade="all, delete-orphan")
    visits = relationship("Visit", back_populates="service_center")
    settlements = relationship("Settlement", back_populates="service_center")


class ServiceCenterAddress(Base):
    __tablename__ = "service_center_addresses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    address: Mapped[str] = mapped_column(String)
    city: Mapped[str] = mapped_column(String, default="Алматы")
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    service_center_id: Mapped[str] = mapped_column(String, ForeignKey("service_centers.id", ondelete="CASCADE"))

    service_center = relationship("ServiceCenter", back_populates="addresses")


class ServiceCenterService(Base):
    __tablename__ = "service_center_services"
    __table_args__ = (
        UniqueConstraint("service_center_id", "service_id", name="uq_sc_service"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    service_center_id: Mapped[str] = mapped_column(String, ForeignKey("service_centers.id", ondelete="CASCADE"))
    service_id: Mapped[str] = mapped_column(String, ForeignKey("services.id", ondelete="CASCADE"))
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_flex_price: Mapped[bool] = mapped_column(Boolean, default=False)

    service_center = relationship("ServiceCenter", back_populates="services")
    service = relationship("Service", back_populates="service_center_services")
