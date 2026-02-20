import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.settlement import Settlement
from app.models.service_center import ServiceCenter
from app.models.visit import Visit
from app.models.car import Car
from app.models.user import User


class TestListSettlements:
    async def test_list_empty(self, client: AsyncClient, admin_token: str):
        resp = await client.get(
            "/api/settlements",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_unauthorized(self, client: AsyncClient, user_token: str):
        resp = await client.get(
            "/api/settlements",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert resp.status_code == 403


class TestCreateSettlements:
    async def test_create_for_period(self, client: AsyncClient, admin_token: str, db: AsyncSession):
        # Setup SC with visit
        owner = User(phone="+77009990001", name="Settle Owner")
        db.add(owner)
        await db.flush()

        car = Car(brand="Subaru", model="Forester", year=2020, plate_number="ST001", user_id=owner.id)
        db.add(car)

        sc = ServiceCenter(name="Settle SC", type="SERVICE_CENTER", is_active=True)
        db.add(sc)
        await db.flush()

        visit = Visit(
            car_id=car.id, service_center_id=sc.id, description="Test",
            cost=10000, service_fee=2000, cashback=500, cashback_used=0,
        )
        db.add(visit)
        await db.commit()

        resp = await client.post(
            "/api/settlements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "periodStart": "2020-01-01T00:00:00Z",
                "periodEnd": "2030-12-31T23:59:59Z",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["created"] >= 1

    async def test_create_no_period(self, client: AsyncClient, admin_token: str):
        resp = await client.post(
            "/api/settlements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={},
        )
        assert resp.status_code == 422


class TestUpdateSettlement:
    async def test_approve_receipt(self, client: AsyncClient, admin_token: str, db: AsyncSession):
        sc = ServiceCenter(name="Approve SC", type="SERVICE_CENTER")
        db.add(sc)
        await db.flush()

        settlement = Settlement(
            service_center_id=sc.id,
            period_start=datetime(2025, 1, 1, tzinfo=timezone.utc),
            period_end=datetime(2025, 1, 31, tzinfo=timezone.utc),
            total_commission=50000,
            total_cashback_redeemed=10000,
            net_amount=50000,
            receipt_status="PENDING",
        )
        db.add(settlement)
        await db.commit()
        await db.refresh(settlement)

        resp = await client.put(
            f"/api/settlements/{settlement.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"receiptStatus": "APPROVED"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["receiptStatus"] == "APPROVED"
        assert data["isPaid"] is True  # auto-set on APPROVED


class TestDeleteSettlement:
    async def test_delete(self, client: AsyncClient, admin_token: str, db: AsyncSession):
        sc = ServiceCenter(name="Delete SC", type="SERVICE_CENTER")
        db.add(sc)
        await db.flush()

        settlement = Settlement(
            service_center_id=sc.id,
            period_start=datetime(2025, 1, 1, tzinfo=timezone.utc),
            period_end=datetime(2025, 1, 31, tzinfo=timezone.utc),
            total_commission=10000, total_cashback_redeemed=0, net_amount=10000,
        )
        db.add(settlement)
        await db.commit()
        await db.refresh(settlement)

        resp = await client.delete(
            f"/api/settlements/{settlement.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
