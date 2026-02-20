import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.car import Car
from app.models.service import Service
from app.models.service_center import ServiceCenter, ServiceCenterService
from app.models.user import User
from app.services.auth_service import create_token


async def _setup_visit_data(db: AsyncSession):
    """Create user, car, SC, services for visit tests."""
    owner = User(phone="+77008888888", name="Car Owner", balance=10000)
    db.add(owner)
    await db.flush()

    car = Car(
        brand="Toyota", model="Camry", year=2020,
        plate_number="V001VV", user_id=owner.id,
    )
    db.add(car)

    manager = User(phone="+77006666666", name="Manager", role="SC_MANAGER")
    db.add(manager)
    await db.flush()

    sc = ServiceCenter(
        name="Visit Test SC", type="SERVICE_CENTER", city="Алматы",
        manager_id=manager.id, commission_percent=20, discount_percent=0,
    )
    db.add(sc)
    await db.flush()

    service = Service(
        name="Test Oil Change", category="engine",
        commission_type="percent", commission_value=20,
        cashback_type="percent", cashback_value=25,
    )
    db.add(service)
    await db.flush()

    db.add(ServiceCenterService(
        service_center_id=sc.id, service_id=service.id,
    ))

    await db.commit()
    await db.refresh(car)
    await db.refresh(sc)
    await db.refresh(service)
    await db.refresh(owner)

    manager_token = create_token(manager.id, manager.role)
    owner_token = create_token(owner.id, owner.role)
    return car, sc, service, manager_token, owner_token, owner


class TestCreateVisit:
    async def test_create_service_visit(self, client: AsyncClient, db: AsyncSession):
        car, sc, service, mgr_token, _, owner = await _setup_visit_data(db)
        resp = await client.post(
            "/api/visits",
            headers={"Authorization": f"Bearer {mgr_token}"},
            json={
                "carId": car.id,
                "serviceCenterId": sc.id,
                "services": [{"serviceId": service.id, "price": 10000}],
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["cost"] == 10000
        # commission = 10000 * 20% = 2000
        assert data["serviceFee"] == 2000
        # cashback = 2000 * 25% = 500
        assert data["cashback"] == 500
        assert data["status"] == "COMPLETED"
        assert len(data["services"]) == 1

    async def test_create_visit_with_cashback_spend(self, client: AsyncClient, db: AsyncSession):
        car, sc, service, mgr_token, _, owner = await _setup_visit_data(db)
        resp = await client.post(
            "/api/visits",
            headers={"Authorization": f"Bearer {mgr_token}"},
            json={
                "carId": car.id,
                "serviceCenterId": sc.id,
                "services": [{"serviceId": service.id, "price": 20000}],
                "cashbackUsed": 5000,
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["cashbackUsed"] == 5000

    async def test_cashback_exceeds_balance(self, client: AsyncClient, db: AsyncSession):
        car, sc, service, mgr_token, _, owner = await _setup_visit_data(db)
        resp = await client.post(
            "/api/visits",
            headers={"Authorization": f"Bearer {mgr_token}"},
            json={
                "carId": car.id,
                "serviceCenterId": sc.id,
                "services": [{"serviceId": service.id, "price": 10000}],
                "cashbackUsed": 99999,  # more than balance
            },
        )
        assert resp.status_code == 400
        assert "баланс" in resp.json()["detail"].lower()

    async def test_cashback_exceeds_50_percent(self, client: AsyncClient, db: AsyncSession):
        car, sc, service, mgr_token, _, owner = await _setup_visit_data(db)
        resp = await client.post(
            "/api/visits",
            headers={"Authorization": f"Bearer {mgr_token}"},
            json={
                "carId": car.id,
                "serviceCenterId": sc.id,
                "services": [{"serviceId": service.id, "price": 10000}],
                "cashbackUsed": 6000,  # > 50% of 10000
            },
        )
        assert resp.status_code == 400
        assert "50%" in resp.json()["detail"]

    async def test_user_cannot_create_visit(self, client: AsyncClient, db: AsyncSession):
        car, sc, service, _, owner_token, _ = await _setup_visit_data(db)
        resp = await client.post(
            "/api/visits",
            headers={"Authorization": f"Bearer {owner_token}"},
            json={
                "carId": car.id,
                "serviceCenterId": sc.id,
                "services": [{"serviceId": service.id, "price": 5000}],
            },
        )
        assert resp.status_code == 403


class TestSimpleVisit:
    async def test_auto_shop_simple_mode(self, client: AsyncClient, db: AsyncSession):
        owner = User(phone="+77003333333", name="Shop Owner", balance=0)
        db.add(owner)
        await db.flush()

        car = Car(brand="Kia", model="K5", year=2021, plate_number="S001SS", user_id=owner.id)
        db.add(car)

        manager = User(phone="+77004444444", name="Shop Mgr", role="SC_MANAGER")
        db.add(manager)
        await db.flush()

        shop = ServiceCenter(
            name="AutoParts", type="AUTO_SHOP", city="Алматы",
            manager_id=manager.id, commission_percent=10, discount_percent=5,
        )
        db.add(shop)
        await db.commit()
        await db.refresh(car)
        await db.refresh(shop)

        token = create_token(manager.id, manager.role)
        resp = await client.post(
            "/api/visits",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "carId": car.id,
                "serviceCenterId": shop.id,
                "totalAmount": 50000,
                "description": "Фильтры и масло",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["cost"] == 50000
        # commission = 50000 * 10% = 5000
        assert data["serviceFee"] == 5000
        # cashback (discount) = 50000 * 5% = 2500
        assert data["cashback"] == 2500
        assert data["description"] == "Фильтры и масло"


class TestListVisits:
    async def test_list_own_visits(self, client: AsyncClient, db: AsyncSession):
        car, sc, service, mgr_token, owner_token, _ = await _setup_visit_data(db)
        # Create a visit first
        await client.post(
            "/api/visits",
            headers={"Authorization": f"Bearer {mgr_token}"},
            json={
                "carId": car.id,
                "serviceCenterId": sc.id,
                "services": [{"serviceId": service.id, "price": 8000}],
            },
        )
        resp = await client.get("/api/visits", headers={"Authorization": f"Bearer {owner_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1

    async def test_get_visit_by_id(self, client: AsyncClient, db: AsyncSession):
        car, sc, service, mgr_token, owner_token, _ = await _setup_visit_data(db)
        create_resp = await client.post(
            "/api/visits",
            headers={"Authorization": f"Bearer {mgr_token}"},
            json={
                "carId": car.id,
                "serviceCenterId": sc.id,
                "services": [{"serviceId": service.id, "price": 15000}],
            },
        )
        visit_id = create_resp.json()["id"]
        resp = await client.get(
            f"/api/visits/{visit_id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == visit_id


class TestFixedCommission:
    async def test_fixed_commission_and_cashback(self, client: AsyncClient, db: AsyncSession):
        owner = User(phone="+77007770001", name="Fixed Owner", balance=0)
        db.add(owner)
        await db.flush()

        car = Car(brand="Audi", model="A4", year=2022, plate_number="X001XX", user_id=owner.id)
        db.add(car)

        manager = User(phone="+77007770002", name="Fixed Mgr", role="SC_MANAGER")
        db.add(manager)
        await db.flush()

        sc = ServiceCenter(
            name="Fixed SC", type="SERVICE_CENTER", city="Алматы",
            manager_id=manager.id, commission_percent=0, discount_percent=0,
        )
        db.add(sc)
        await db.flush()

        service = Service(
            name="Fixed Service", category="other",
            commission_type="fixed", commission_value=3000,
            cashback_type="fixed", cashback_value=500,
        )
        db.add(service)
        await db.flush()

        db.add(ServiceCenterService(service_center_id=sc.id, service_id=service.id))
        await db.commit()
        await db.refresh(car)
        await db.refresh(sc)
        await db.refresh(service)

        token = create_token(manager.id, manager.role)
        resp = await client.post(
            "/api/visits",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "carId": car.id,
                "serviceCenterId": sc.id,
                "services": [{"serviceId": service.id, "price": 25000}],
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["serviceFee"] == 3000  # fixed commission
        assert data["cashback"] == 500     # fixed cashback
