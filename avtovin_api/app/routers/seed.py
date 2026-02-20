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

router = APIRouter(prefix="/api", tags=["seed"])


@router.post("/seed")
async def seed_data(db: AsyncSession = Depends(get_db)):
    # Check if already seeded
    count = (await db.execute(select(func.count(User.id)))).scalar()
    if count and count > 0:
        return {"message": "Already seeded", "users": count}

    # Admin
    admin = User(
        phone="+77777777777", email="admin@payda.kz", name="Админ",
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
        ("Payda Auto Service", "SERVICE_CENTER", "+77011234501", 20, 0),
        ("Quick Oil", "SERVICE_CENTER", "+77011234502", 15, 0),
        ("AutoParts KZ", "AUTO_SHOP", "+77011234503", 10, 5),
        ("Clean Car", "CAR_WASH", "+77011234504", 25, 10),
        ("Premium Service", "SERVICE_CENTER", "+77011234505", 18, 0),
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
        ("warranty_whatsapp_link", "https://wa.me/77760047836"),
        ("warranty_conditions", "Гарантия действует на оригинальные детали и работы."),
        ("terms_of_service", "Условия использования приложения Payda."),
        ("privacy_policy", "Политика конфиденциальности приложения Payda."),
    ]:
        db.add(AppSettings(key=key, value=value))

    await db.commit()
    return {"message": "Seed complete", "services": len(services_data), "service_centers": 5}


@router.post("/seed-catalog")
async def seed_catalog(db: AsyncSession = Depends(get_db)):
    count = (await db.execute(select(func.count(CarBrand.id)))).scalar()
    if count and count > 0:
        return {"message": "Catalog already seeded", "brands": count}

    catalog = {
        "Toyota": {
            "Camry": [("XV70 (2017-н.в.)", 2017, None, "ICE,HYBRID"), ("XV50 (2011-2017)", 2011, 2017, "ICE")],
            "Corolla": [("E210 (2018-н.в.)", 2018, None, "ICE,HYBRID"), ("E160 (2012-2018)", 2012, 2018, "ICE")],
            "RAV4": [("XA50 (2018-н.в.)", 2018, None, "ICE,HYBRID"), ("XA40 (2013-2018)", 2013, 2018, "ICE")],
            "Land Cruiser": [("300 (2021-н.в.)", 2021, None, "ICE"), ("200 (2007-2021)", 2007, 2021, "ICE")],
            "Prado": [("J150 (2009-н.в.)", 2009, None, "ICE")],
        },
        "Hyundai": {
            "Tucson": [("NX4 (2021-н.в.)", 2021, None, "ICE,HYBRID"), ("TL (2015-2021)", 2015, 2021, "ICE")],
            "Sonata": [("DN8 (2019-н.в.)", 2019, None, "ICE,HYBRID"), ("LF (2014-2019)", 2014, 2019, "ICE")],
            "Elantra": [("CN7 (2020-н.в.)", 2020, None, "ICE"), ("AD (2015-2020)", 2015, 2020, "ICE")],
            "Creta": [("SU2 (2021-н.в.)", 2021, None, "ICE"), ("GS (2016-2021)", 2016, 2021, "ICE")],
        },
        "Kia": {
            "Sportage": [("NQ5 (2021-н.в.)", 2021, None, "ICE,HYBRID"), ("QL (2015-2021)", 2015, 2021, "ICE")],
            "K5": [("DL3 (2019-н.в.)", 2019, None, "ICE"), ("JF (2015-2019)", 2015, 2019, "ICE")],
            "Cerato": [("BD (2018-н.в.)", 2018, None, "ICE"), ("YD (2013-2018)", 2013, 2018, "ICE")],
        },
        "Volkswagen": {
            "Polo": [("AW (2017-н.в.)", 2017, None, "ICE"), ("6R (2009-2017)", 2009, 2017, "ICE")],
            "Tiguan": [("AD (2016-н.в.)", 2016, None, "ICE"), ("5N (2007-2016)", 2007, 2016, "ICE")],
            "Passat": [("B8 (2014-н.в.)", 2014, None, "ICE"), ("B7 (2010-2014)", 2010, 2014, "ICE")],
        },
        "BMW": {
            "3 Series": [("G20 (2018-н.в.)", 2018, None, "ICE,HYBRID"), ("F30 (2011-2018)", 2011, 2018, "ICE")],
            "5 Series": [("G30 (2016-н.в.)", 2016, None, "ICE,HYBRID"), ("F10 (2010-2016)", 2010, 2016, "ICE")],
            "X5": [("G05 (2018-н.в.)", 2018, None, "ICE,HYBRID"), ("F15 (2013-2018)", 2013, 2018, "ICE")],
        },
        "Mercedes-Benz": {
            "C-Class": [("W206 (2021-н.в.)", 2021, None, "ICE,HYBRID"), ("W205 (2014-2021)", 2014, 2021, "ICE")],
            "E-Class": [("W214 (2023-н.в.)", 2023, None, "ICE,HYBRID"), ("W213 (2016-2023)", 2016, 2023, "ICE")],
            "GLE": [("V167 (2019-н.в.)", 2019, None, "ICE,HYBRID")],
        },
        "Lexus": {
            "RX": [("AL30 (2022-н.в.)", 2022, None, "ICE,HYBRID"), ("AL20 (2015-2022)", 2015, 2022, "ICE,HYBRID")],
            "ES": [("XV70 (2018-н.в.)", 2018, None, "ICE,HYBRID")],
            "LX": [("J300 (2021-н.в.)", 2021, None, "ICE")],
        },
        "Chevrolet": {
            "Cobalt": [("T250 (2011-н.в.)", 2011, None, "ICE")],
            "Malibu": [("Gen 9 (2016-н.в.)", 2016, None, "ICE")],
            "Tracker": [("2020-н.в.", 2020, None, "ICE")],
        },
        "Nissan": {
            "Qashqai": [("J12 (2021-н.в.)", 2021, None, "ICE"), ("J11 (2013-2021)", 2013, 2021, "ICE")],
            "X-Trail": [("T33 (2021-н.в.)", 2021, None, "ICE"), ("T32 (2013-2021)", 2013, 2021, "ICE")],
        },
        "Mitsubishi": {
            "Outlander": [("GN (2021-н.в.)", 2021, None, "ICE,HYBRID"), ("GF (2012-2021)", 2012, 2021, "ICE")],
            "Pajero": [("V80 (2006-2021)", 2006, 2021, "ICE")],
        },
        "Skoda": {
            "Octavia": [("NX (2020-н.в.)", 2020, None, "ICE"), ("5E (2012-2020)", 2012, 2020, "ICE")],
            "Rapid": [("NH (2012-н.в.)", 2012, None, "ICE")],
        },
        "Audi": {
            "A4": [("B9 (2015-н.в.)", 2015, None, "ICE"), ("B8 (2007-2015)", 2007, 2015, "ICE")],
            "Q7": [("4M (2015-н.в.)", 2015, None, "ICE,HYBRID")],
        },
        "Honda": {
            "CR-V": [("RW (2017-н.в.)", 2017, None, "ICE,HYBRID"), ("RM (2011-2017)", 2011, 2017, "ICE")],
            "Civic": [("FL (2021-н.в.)", 2021, None, "ICE,HYBRID")],
        },
        "Subaru": {
            "Forester": [("SK (2018-н.в.)", 2018, None, "ICE"), ("SJ (2012-2018)", 2012, 2018, "ICE")],
            "Outback": [("BT (2019-н.в.)", 2019, None, "ICE")],
        },
        "Mazda": {
            "CX-5": [("KF (2017-н.в.)", 2017, None, "ICE"), ("KE (2012-2017)", 2012, 2017, "ICE")],
            "6": [("GJ (2012-н.в.)", 2012, None, "ICE")],
        },
        "Renault": {
            "Duster": [("HJD (2021-н.в.)", 2021, None, "ICE"), ("HS (2010-2021)", 2010, 2021, "ICE")],
        },
        "Ford": {
            "Focus": [("Mk4 (2018-н.в.)", 2018, None, "ICE"), ("Mk3 (2010-2018)", 2010, 2018, "ICE")],
        },
        "Geely": {
            "Coolray": [("SX11 (2019-н.в.)", 2019, None, "ICE")],
            "Monjaro": [("KX11 (2022-н.в.)", 2022, None, "ICE,HYBRID")],
        },
        "Chery": {
            "Tiggo 7 Pro": [("2020-н.в.", 2020, None, "ICE")],
            "Tiggo 8 Pro": [("2020-н.в.", 2020, None, "ICE")],
        },
    }

    brand_count = 0
    model_count = 0
    gen_count = 0

    for brand_name, models in catalog.items():
        brand = CarBrand(name=brand_name)
        db.add(brand)
        await db.flush()
        brand_count += 1

        for model_name, generations in models.items():
            car_model = CarModel(name=model_name, brand_id=brand.id)
            db.add(car_model)
            await db.flush()
            model_count += 1

            for gen_name, year_from, year_to, engine_types in generations:
                gen = CarGeneration(
                    name=gen_name, year_from=year_from, year_to=year_to,
                    engine_types=engine_types, model_id=car_model.id,
                )
                db.add(gen)
                gen_count += 1

    await db.commit()
    return {
        "message": "Catalog seeded",
        "brands": brand_count,
        "models": model_count,
        "generations": gen_count,
    }
