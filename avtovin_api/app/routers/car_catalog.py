from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.car_catalog import CarBrand, CarModel, CarGeneration
from app.schemas.car import BrandOut, ModelOut, GenerationOut

router = APIRouter(prefix="/api/car-catalog", tags=["car-catalog"])


@router.get("/brands", response_model=list[BrandOut])
async def list_brands(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CarBrand).order_by(CarBrand.name))
    return [BrandOut.model_validate(b) for b in result.scalars().all()]


@router.get("/models", response_model=list[ModelOut])
async def list_models(
    brand_id: str = Query(..., alias="brandId"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CarModel).where(CarModel.brand_id == brand_id).order_by(CarModel.name)
    )
    return [ModelOut.model_validate(m) for m in result.scalars().all()]


@router.get("/generations", response_model=list[GenerationOut])
async def list_generations(
    model_id: str = Query(..., alias="modelId"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CarGeneration)
        .where(CarGeneration.model_id == model_id)
        .order_by(CarGeneration.year_from.desc())
    )
    return [GenerationOut.model_validate(g) for g in result.scalars().all()]
