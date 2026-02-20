from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True)
    category: Mapped[str] = mapped_column(String, default="general")
    commission_type: Mapped[str] = mapped_column(String, default="percent")
    commission_value: Mapped[int] = mapped_column(Integer, default=20)
    cashback_type: Mapped[str] = mapped_column(String, default="percent")
    cashback_value: Mapped[int] = mapped_column(Integer, default=25)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    service_center_services = relationship("ServiceCenterService", back_populates="service", cascade="all, delete-orphan")
