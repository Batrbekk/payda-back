import json
import os

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.app_settings import AppSettings
from app.models.car_catalog import CarBrand, CarModel, CarGeneration
from app.models.service import Service
from app.models.service_center import ServiceCenter, ServiceCenterAddress, ServiceCenterService
from app.models.user import User
from app.services.auth_service import hash_password

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "car_catalog.json")

router = APIRouter(prefix="/api", tags=["seed"])


@router.post("/seed")
async def seed_data(db: AsyncSession = Depends(get_db)):
    # Check if already seeded
    count = (await db.execute(select(func.count(User.id)))).scalar()
    if count and count > 0:
        return {"message": "Already seeded", "users": count}

    # Admin
    admin = User(
        phone="+77777777777", email="admin@silkroadauto.kz", name="Админ",
        password=hash_password("admin123"), role="ADMIN",
    )
    db.add(admin)

    # Test user
    test_user = User(phone="+77760047836", name="Тест Пользователь")
    db.add(test_user)

    # Services (20)
    services_data = [
        ("Замена масла", "engine", "percent", 20, "percent", 25),
        ("Замена фильтра масляного", "engine", "percent", 20, "percent", 25),
        ("Замена воздушного фильтра", "engine", "percent", 20, "percent", 25),
        ("Замена свечей зажигания", "engine", "percent", 15, "percent", 30),
        ("Замена ремня ГРМ", "engine", "percent", 15, "percent", 20),
        ("Замена антифриза", "engine", "percent", 15, "percent", 25),
        ("Замена тормозных колодок", "brakes", "percent", 20, "percent", 25),
        ("Замена тормозных дисков", "brakes", "percent", 15, "percent", 20),
        ("Замена тормозной жидкости", "brakes", "percent", 15, "percent", 25),
        ("Замена масла АКПП", "transmission", "percent", 15, "percent", 20),
        ("Замена масла МКПП", "transmission", "percent", 15, "percent", 20),
        ("Компьютерная диагностика", "diagnostics", "percent", 20, "percent", 30),
        ("Развал-схождение", "diagnostics", "percent", 15, "percent", 25),
        ("Мойка кузова", "wash", "percent", 25, "percent", 20),
        ("Мойка двигателя", "wash", "percent", 25, "percent", 20),
        ("Химчистка салона", "wash", "percent", 20, "percent", 25),
        ("Полировка кузова", "other", "percent", 15, "percent", 20),
        ("Шиномонтаж", "other", "percent", 20, "percent", 25),
        ("Замена аккумулятора", "other", "percent", 15, "percent", 20),
        ("ТО комплексное", "engine", "percent", 15, "percent", 25),
    ]

    service_objs = []
    for name, cat, ct, cv, cbt, cbv in services_data:
        s = Service(
            name=name, category=cat,
            commission_type=ct, commission_value=cv,
            cashback_type=cbt, cashback_value=cbv,
        )
        db.add(s)
        service_objs.append(s)

    await db.flush()

    # Service Centers (5)
    sc_data = [
        ("SRA Auto Service", "SERVICE_CENTER", "+77011234501", 20, 15),
        ("Quick Oil", "SERVICE_CENTER", "+77011234502", 15, 10),
        ("AutoParts KZ", "AUTO_SHOP", "+77011234503", 10, 5),
        ("Clean Car", "CAR_WASH", "+77011234504", 25, 20),
        ("Premium Service", "SERVICE_CENTER", "+77011234505", 18, 12),
    ]

    for name, sc_type, phone, comm, disc in sc_data:
        # Create manager
        manager = User(phone=phone, name=f"Менеджер {name}", role="SC_MANAGER")
        db.add(manager)
        await db.flush()

        sc = ServiceCenter(
            name=name, type=sc_type, city="Алматы", phone=phone,
            commission_percent=comm, discount_percent=disc,
            manager_id=manager.id, rating=4.0,
        )
        db.add(sc)
        await db.flush()

        db.add(ServiceCenterAddress(
            address=f"ул. Абая {10 + sc_data.index((name, sc_type, phone, comm, disc))}",
            city="Алматы", service_center_id=sc.id,
        ))

        # Link first 5 services to SC
        for svc in service_objs[:5]:
            db.add(ServiceCenterService(
                service_center_id=sc.id, service_id=svc.id,
            ))

    # Settings
    for key, value in [
        ("warranty_whatsapp_link", "https://wa.me/77758221235"),
        ("warranty_conditions", "Гарантия действует на оригинальные детали и работы."),
        ("terms_of_service", "Условия использования приложения SRA."),
        ("privacy_policy", "Политика конфиденциальности приложения SRA."),
    ]:
        db.add(AppSettings(key=key, value=value))

    await db.commit()
    return {"message": "Seed complete", "services": len(services_data), "service_centers": 5}


@router.post("/seed-catalog")
async def seed_catalog(db: AsyncSession = Depends(get_db)):
    count = (await db.execute(select(func.count(CarBrand.id)))).scalar()
    if count and count > 0:
        return {"message": "Catalog already seeded", "brands": count}

    return await _do_seed_catalog(db)


@router.post("/reseed-catalog")
async def reseed_catalog(db: AsyncSession = Depends(get_db)):
    """Drop all catalog data and re-seed with full database."""
    await db.execute(select(CarGeneration).execution_options(synchronize_session="fetch"))
    await db.execute(CarGeneration.__table__.delete())
    await db.execute(CarModel.__table__.delete())
    await db.execute(CarBrand.__table__.delete())
    await db.commit()
    return await _do_seed_catalog(db)


def _load_catalog_from_file() -> dict:
    """Load brand -> (logo_url, [models]) catalog from data/car_catalog.json."""
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {name: (v.get("icon"), v.get("models", [])) for name, v in data.items()}


async def _do_seed_catalog(db: AsyncSession):
    catalog = _load_catalog_from_file()
    brand_count = 0
    model_count = 0

    for brand_name, (logo_url, model_names) in catalog.items():
        brand = CarBrand(name=brand_name, logo_url=logo_url)
        db.add(brand)
        await db.flush()
        brand_count += 1

        for model_name in model_names:
            car_model = CarModel(name=model_name, brand_id=brand.id)
            db.add(car_model)
            model_count += 1

    await db.commit()
    return {
        "message": "Catalog seeded",
        "brands": brand_count,
        "models": model_count,
    }
