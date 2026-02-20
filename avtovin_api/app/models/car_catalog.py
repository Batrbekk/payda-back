from uuid import uuid4

from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class CarBrand(Base):
    __tablename__ = "car_brands"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True)

    models = relationship("CarModel", back_populates="brand", cascade="all, delete-orphan")


class CarModel(Base):
    __tablename__ = "car_models"
    __table_args__ = (
        UniqueConstraint("brand_id", "name", name="uq_model_brand_name"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String)
    brand_id: Mapped[str] = mapped_column(String, ForeignKey("car_brands.id", ondelete="CASCADE"))

    brand = relationship("CarBrand", back_populates="models")
    generations = relationship("CarGeneration", back_populates="model", cascade="all, delete-orphan")


class CarGeneration(Base):
    __tablename__ = "car_generations"
    __table_args__ = (
        UniqueConstraint("model_id", "name", name="uq_generation_model_name"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String)
    year_from: Mapped[int] = mapped_column(Integer)
    year_to: Mapped[int | None] = mapped_column(Integer, nullable=True)
    engine_types: Mapped[str] = mapped_column(String, default="ICE")
    model_id: Mapped[str] = mapped_column(String, ForeignKey("car_models.id", ondelete="CASCADE"))

    model = relationship("CarModel", back_populates="generations")
