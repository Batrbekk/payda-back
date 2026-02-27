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
        ("Payda Auto Service", "SERVICE_CENTER", "+77011234501", 20, 15),
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


async def _do_seed_catalog(db: AsyncSession):
    catalog = {
        "Toyota": ("https://vl.imgix.net/img/toyota-logo.png", ["4Runner", "Alphard", "Avalon", "Avensis", "C-HR", "Camry", "Corolla", "Corolla Cross", "Crown", "FJ Cruiser", "Fortuner", "GR86", "Harrier", "Hiace", "Highlander", "Hilux", "Land Cruiser", "Land Cruiser Prado", "Mark II", "Mark X", "Prius", "RAV4", "Rush", "Sequoia", "Sienna", "Supra", "Tacoma", "Tundra", "Venza", "Vitz", "Yaris", "Yaris Cross", "bZ4X"]),
        "Lexus": ("https://vl.imgix.net/img/lexus-logo.png", ["CT", "ES", "GS", "GX", "IS", "LC", "LM", "LS", "LX", "NX", "RC", "RX", "RZ", "TX", "UX"]),
        "Hyundai": ("https://vl.imgix.net/img/hyundai-logo.png", ["Accent", "Avante", "Azera", "Bayon", "Casper", "Creta", "Elantra", "Grandeur", "i10", "i20", "i30", "i40", "IONIQ 5", "IONIQ 6", "ix35", "Kona", "Palisade", "Santa Cruz", "Santa Fe", "Solaris", "Sonata", "Starex", "Staria", "Tucson", "Venue", "Veloster"]),
        "Kia": ("https://vl.imgix.net/img/kia-logo.png", ["Carnival", "Ceed", "Cerato", "EV6", "EV9", "Forte", "K5", "K8", "K9", "Mohave", "Niro", "Optima", "Picanto", "Rio", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Stonic", "Telluride", "XCeed"]),
        "Volkswagen": ("https://vl.imgix.net/img/volkswagen-logo.png", ["Amarok", "Arteon", "Atlas", "Caddy", "CC", "Golf", "ID.3", "ID.4", "ID.5", "ID.7", "Jetta", "Multivan", "Passat", "Polo", "T-Cross", "T-Roc", "Taos", "Tayron", "Tiguan", "Touareg", "Touran", "Transporter"]),
        "BMW": ("https://vl.imgix.net/img/bmw-logo.png", ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "i3", "i4", "i5", "i7", "iX", "iX1", "iX3", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z4"]),
        "Mercedes-Benz": ("https://vl.imgix.net/img/mercedes-benz-logo.png", ["A-Class", "AMG GT", "B-Class", "C-Class", "CLA", "CLE", "CLS", "E-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "Maybach", "S-Class", "SL", "Sprinter", "V-Class", "Vito"]),
        "Audi": ("https://vl.imgix.net/img/audi-logo.png", ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "e-tron GT", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "S4", "S5", "TT"]),
        "Nissan": ("https://vl.imgix.net/img/nissan-logo.png", ["370Z", "Almera", "Ariya", "Frontier", "GT-R", "Juke", "Kicks", "Leaf", "Maxima", "Murano", "Navara", "Note", "Pathfinder", "Patrol", "Qashqai", "Rogue", "Sentra", "Sunny", "Teana", "Terrano", "Tiida", "X-Trail"]),
        "Honda": ("https://vl.imgix.net/img/honda-logo.png", ["Accord", "BR-V", "City", "Civic", "CR-V", "Fit", "HR-V", "Insight", "Jazz", "Odyssey", "Passport", "Pilot", "Ridgeline", "Stepwgn", "Vezel", "WR-V", "ZR-V"]),
        "Mitsubishi": ("https://vl.imgix.net/img/mitsubishi-logo.png", ["ASX", "Delica", "Eclipse Cross", "L200", "Lancer", "Outlander", "Pajero", "Pajero Sport", "Triton", "Xpander"]),
        "Chevrolet": ("https://vl.imgix.net/img/chevrolet-logo.png", ["Aveo", "Blazer", "Bolt", "Camaro", "Captiva", "Cobalt", "Colorado", "Corvette", "Cruze", "Equinox", "Lacetti", "Malibu", "Monza", "Nexia", "Orlando", "Silverado", "Spark", "Suburban", "Tahoe", "Tracker", "Trailblazer", "Traverse", "Trax"]),
        "Ford": ("https://vl.imgix.net/img/ford-logo.png", ["Bronco", "EcoSport", "Edge", "Escape", "Everest", "Expedition", "Explorer", "F-150", "Fiesta", "Focus", "Galaxy", "Kuga", "Maverick", "Mondeo", "Mustang", "Mustang Mach-E", "Puma", "Ranger", "Territory", "Transit"]),
        "Mazda": ("https://vl.imgix.net/img/mazda-logo.png", ["2", "3", "5", "6", "CX-3", "CX-30", "CX-5", "CX-50", "CX-60", "CX-7", "CX-8", "CX-9", "CX-90", "MX-5", "MX-30"]),
        "Subaru": ("https://vl.imgix.net/img/subaru-logo.png", ["Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Levorg", "Outback", "Solterra", "WRX", "XV"]),
        "Skoda": ("https://vl.imgix.net/img/skoda-logo.png", ["Enyaq", "Fabia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Rapid", "Scala", "Superb"]),
        "Renault": ("https://vl.imgix.net/img/renault-logo.png", ["Arkana", "Austral", "Captur", "Clio", "Duster", "Espace", "Kangoo", "Koleos", "Logan", "Megane", "Sandero", "Scenic", "Talisman", "Trafic", "Zoe"]),
        "Peugeot": ("https://vl.imgix.net/img/peugeot-logo.png", ["2008", "208", "3008", "301", "308", "408", "5008", "508", "Partner", "Rifter", "Traveller"]),
        "Citroen": ("https://vl.imgix.net/img/citroen-logo.png", ["Berlingo", "C3", "C3 Aircross", "C4", "C4 X", "C5 Aircross", "C5 X", "Jumpy", "SpaceTourer"]),
        "Volvo": ("https://vl.imgix.net/img/volvo-logo.png", ["C40", "EX30", "EX90", "S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"]),
        "Land Rover": ("https://vl.imgix.net/img/land-rover-logo.png", ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"]),
        "Porsche": ("https://vl.imgix.net/img/porsche-logo.png", ["718", "911", "Cayenne", "Macan", "Panamera", "Taycan"]),
        "Jaguar": ("https://vl.imgix.net/img/jaguar-logo.png", ["E-Pace", "F-Pace", "F-Type", "I-Pace", "XE", "XF", "XJ"]),
        "Infiniti": ("https://vl.imgix.net/img/infiniti-logo.png", ["EX", "FX", "G", "M", "Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "QX55", "QX60", "QX70", "QX80"]),
        "Genesis": ("https://vl.imgix.net/img/genesis-logo.png", ["Electrified G80", "Electrified GV70", "G70", "G80", "G90", "GV60", "GV70", "GV80"]),
        "Tesla": ("https://vl.imgix.net/img/tesla-logo.png", ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y"]),
        "Geely": ("https://vl.imgix.net/img/geely-logo.png", ["Atlas", "Atlas Pro", "Coolray", "Emgrand", "Monjaro", "Okavango", "Preface", "Tugella"]),
        "Chery": ("https://vl.imgix.net/img/chery-logo.png", ["Arrizo 5", "Arrizo 7", "Arrizo 8", "Tiggo 2", "Tiggo 3", "Tiggo 4", "Tiggo 4 Pro", "Tiggo 5", "Tiggo 7", "Tiggo 7 Pro", "Tiggo 8", "Tiggo 8 Pro", "Tiggo 8 Pro Max", "Tiggo 9"]),
        "Haval": ("https://vl.imgix.net/img/haval-logo.png", ["Dargo", "F7", "F7x", "H2", "H5", "H6", "H9", "Jolion", "M6"]),
        "Changan": ("https://vl.imgix.net/img/changan-logo.png", ["Alsvin", "CS35 Plus", "CS55 Plus", "CS75 Plus", "CS85", "CS95", "Eado", "Lamore", "Uni-K", "Uni-T", "Uni-V"]),
        "BYD": ("https://vl.imgix.net/img/byd-logo.png", ["Atto 3", "Dolphin", "Han", "King", "Seal", "Song Plus", "Tang", "Yuan Plus"]),
        "Jetour": ("https://vl.imgix.net/img/jetour-logo.png", ["Dashing", "T2", "X70", "X70 Plus", "X90", "X90 Plus"]),
        "Exeed": ("https://vl.imgix.net/img/exeed-logo.png", ["LX", "RX", "TXL", "VX"]),
        "Omoda": ("https://vl.imgix.net/img/omoda-logo.png", ["C5", "C7", "C9", "S5"]),
        "Tank": ("https://vl.imgix.net/img/tank-logo.png", ["300", "400", "500", "700"]),
        "GAC": ("https://vl.imgix.net/img/gac-logo.png", ["Emkoo", "Empow", "GN6", "GN8", "GS3", "GS4", "GS5", "GS8", "M6", "M8"]),
        "Dongfeng": ("https://vl.imgix.net/img/dongfeng-logo.png", ["580", "AX7", "ix5", "Mengshi", "Rich", "T5 EVO"]),
        "Great Wall": ("https://vl.imgix.net/img/great-wall-logo.png", ["Cannon", "Pao", "Poer", "Steed", "Wingle 5", "Wingle 7"]),
        "Zeekr": ("https://vl.imgix.net/img/zeekr-logo.png", ["001", "007", "009", "X"]),
        "Lada": ("https://vl.imgix.net/img/lada-logo.png", ["Granta", "Largus", "Niva", "Niva Legend", "Niva Travel", "Vesta", "XRAY"]),
        "Daewoo": ("https://vl.imgix.net/img/daewoo-logo.png", ["Damas", "Gentra", "Lacetti", "Matiz", "Nexia"]),
        "Ravon": ("https://vl.imgix.net/img/ravon-logo.png", ["Gentra", "Nexia R3", "R2", "R4"]),
        "UAZ": ("https://vl.imgix.net/img/uaz-logo.png", ["Hunter", "Patriot", "Pickup", "Profi", "SGR"]),
        "SsangYong": ("https://vl.imgix.net/img/ssangyong-logo.png", ["Actyon", "Korando", "Kyron", "Musso", "Rexton", "Stavic", "Tivoli", "Torres", "XLV"]),
        "Suzuki": ("https://vl.imgix.net/img/suzuki-logo.png", ["Alto", "Baleno", "Celerio", "Ciaz", "Ertiga", "Grand Vitara", "Ignis", "Jimny", "S-Cross", "Swift", "Vitara", "XL7"]),
        "Daihatsu": ("https://vl.imgix.net/img/daihatsu-logo.png", ["Copen", "Mira", "Move", "Rocky", "Taft", "Tanto", "Terios"]),
        "Isuzu": ("https://vl.imgix.net/img/isuzu-logo.png", ["D-Max", "MU-X"]),
        "Fiat": ("https://vl.imgix.net/img/fiat-logo.png", ["500", "500e", "500L", "500X", "Doblo", "Ducato", "Panda", "Tipo"]),
        "Opel": ("https://vl.imgix.net/img/opel-logo.png", ["Astra", "Corsa", "Crossland", "Grandland", "Insignia", "Mokka", "Zafira"]),
        "MINI": ("https://vl.imgix.net/img/mini-logo.png", ["Clubman", "Convertible", "Countryman", "Hardtop", "Paceman"]),
        "Jeep": ("https://vl.imgix.net/img/jeep-logo.png", ["Avenger", "Cherokee", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"]),
        "Dodge": ("https://vl.imgix.net/img/dodge-logo.png", ["Challenger", "Charger", "Durango", "Hornet", "Ram"]),
        "Cadillac": ("https://vl.imgix.net/img/cadillac-logo.png", ["CT4", "CT5", "Escalade", "Lyriq", "XT4", "XT5", "XT6"]),
        "Chrysler": ("https://vl.imgix.net/img/chrysler-logo.png", ["300", "Pacifica", "Voyager"]),
        "Alfa Romeo": ("https://vl.imgix.net/img/alfa-romeo-logo.png", ["Giulia", "Giulietta", "Stelvio", "Tonale"]),
        "Maserati": ("https://vl.imgix.net/img/maserati-logo.png", ["Ghibli", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"]),
        "Ferrari": ("https://vl.imgix.net/img/ferrari-logo.png", ["296", "812", "F8", "Portofino", "Purosangue", "Roma", "SF90"]),
        "Lamborghini": ("https://vl.imgix.net/img/lamborghini-logo.png", ["Huracan", "Revuelto", "Urus"]),
        "Bentley": ("https://vl.imgix.net/img/bentley-logo.png", ["Bentayga", "Continental GT", "Flying Spur"]),
        "Rolls-Royce": ("https://vl.imgix.net/img/rolls-royce-logo.png", ["Cullinan", "Ghost", "Phantom", "Spectre", "Wraith"]),
        "Aston Martin": ("https://vl.imgix.net/img/aston-martin-logo.png", ["DB11", "DB12", "DBS", "DBX", "Valhalla", "Vantage"]),
        "Bugatti": ("https://vl.imgix.net/img/bugatti-logo.png", ["Chiron", "Mistral", "Tourbillon"]),
        "DS": ("https://vl.imgix.net/img/ds-logo.png", ["3", "4", "7", "9"]),
        "Seat": ("https://vl.imgix.net/img/seat-logo.png", ["Arona", "Ateca", "Ibiza", "Leon", "Tarraco"]),
    }

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
