import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service
from app.models.service_center import ServiceCenter, ServiceCenterAddress
from app.models.user import User
from app.services.auth_service import create_token


class TestListServiceCenters:
    async def test_list_public(self, client: AsyncClient, db: AsyncSession):
        sc = ServiceCenter(name="Public SC", type="SERVICE_CENTER", city="Алматы", is_active=True)
        db.add(sc)
        await db.commit()
        resp = await client.get("/api/service-centers")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_filter_by_type(self, client: AsyncClient, db: AsyncSession):
        db.add(ServiceCenter(name="Shop1", type="AUTO_SHOP", is_active=True))
        db.add(ServiceCenter(name="SC1", type="SERVICE_CENTER", is_active=True))
        await db.commit()
        resp = await client.get("/api/service-centers?type=AUTO_SHOP")
        assert resp.status_code == 200
        for sc in resp.json():
            assert sc["type"] == "AUTO_SHOP"

    async def test_inactive_not_shown(self, client: AsyncClient, db: AsyncSession):
        db.add(ServiceCenter(name="Inactive SC", type="SERVICE_CENTER", is_active=False))
        await db.commit()
        resp = await client.get("/api/service-centers")
        names = [sc["name"] for sc in resp.json()]
        assert "Inactive SC" not in names


class TestCreateServiceCenter:
    async def test_create_sc_admin(self, client: AsyncClient, admin_token: str):
        resp = await client.post(
            "/api/service-centers",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "New SC",
                "type": "SERVICE_CENTER",
                "addresses": [{"address": "ул. Абая 1"}],
            },
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "New SC"

    async def test_create_sc_with_manager(self, client: AsyncClient, admin_token: str):
        resp = await client.post(
            "/api/service-centers",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Managed SC",
                "addresses": [{"address": "ул. Гоголя 5"}],
                "managerPhone": "+77001112233",
            },
        )
        assert resp.status_code == 201
        assert resp.json()["managerId"] is not None

    async def test_create_sc_user_forbidden(self, client: AsyncClient, user_token: str):
        resp = await client.post(
            "/api/service-centers",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"name": "Bad SC", "addresses": [{"address": "test"}]},
        )
        assert resp.status_code == 403


class TestGetServiceCenter:
    async def test_get_sc_by_id(self, client: AsyncClient, db: AsyncSession):
        sc = ServiceCenter(name="Detail SC", type="CAR_WASH", is_active=True)
        db.add(sc)
        await db.flush()
        db.add(ServiceCenterAddress(address="ул. Ленина 10", service_center_id=sc.id))
        await db.commit()
        await db.refresh(sc)

        resp = await client.get(f"/api/service-centers/{sc.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Detail SC"
        assert len(resp.json()["addresses"]) == 1


class TestMyServiceCenter:
    async def test_my_sc(self, client: AsyncClient, sc_manager_token: str):
        resp = await client.get(
            "/api/service-centers/my",
            headers={"Authorization": f"Bearer {sc_manager_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Test SC"
        assert "stats" in data
        assert data["stats"]["todayVisits"] == 0


class TestDeleteServiceCenter:
    async def test_delete_sc(self, client: AsyncClient, admin_token: str, db: AsyncSession):
        sc = ServiceCenter(name="To Delete", type="SERVICE_CENTER")
        db.add(sc)
        await db.commit()
        await db.refresh(sc)

        resp = await client.delete(
            f"/api/service-centers/{sc.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
