from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Car(Base):
    __tablename__ = "cars"
    __table_args__ = (
        UniqueConstraint("plate_number", "user_id", name="uq_car_plate_user"),
        UniqueConstraint("vin", "user_id", name="uq_car_vin_user"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    vin: Mapped[str | None] = mapped_column(String, nullable=True)
    brand: Mapped[str] = mapped_column(String)
    model: Mapped[str] = mapped_column(String)
    year: Mapped[int] = mapped_column(Integer)
    plate_number: Mapped[str] = mapped_column(String)
    mileage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    generation: Mapped[str | None] = mapped_column(String, nullable=True)
    engine_type: Mapped[str | None] = mapped_column(String, nullable=True)
    last_service_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_service_mileage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="cars")
    visits = relationship("Visit", back_populates="car", cascade="all, delete-orphan")
    warranties = relationship("Warranty", back_populates="car")
