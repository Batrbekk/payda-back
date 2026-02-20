from unittest.mock import patch, AsyncMock

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.auth_service import hash_password


class TestSendCode:
    async def test_send_code_success(self, client: AsyncClient):
        with patch("app.routers.auth.send_sms", new_callable=AsyncMock, return_value=True):
            resp = await client.post("/api/auth/send-code", json={"phone": "+77001111111"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Код отправлен"
        assert data["expiresIn"] == 300

    async def test_send_code_invalid_phone(self, client: AsyncClient):
        resp = await client.post("/api/auth/send-code", json={"phone": "12345"})
        assert resp.status_code == 422  # validation error

    async def test_send_code_test_phone(self, client: AsyncClient):
        resp = await client.post("/api/auth/send-code", json={"phone": "+77760047836"})
        assert resp.status_code == 200

    async def test_send_code_sms_failure(self, client: AsyncClient):
        with patch("app.routers.auth.send_sms", new_callable=AsyncMock, return_value=False):
            resp = await client.post("/api/auth/send-code", json={"phone": "+77002222222"})
        assert resp.status_code == 502


class TestVerifyCode:
    async def test_verify_code_success(self, client: AsyncClient):
        # First send code (test phone gets 0000)
        await client.post("/api/auth/send-code", json={"phone": "+77760047836"})
        resp = await client.post("/api/auth/verify-code", json={
            "phone": "+77760047836", "code": "0000",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["isNewUser"] is True
        assert data["user"]["phone"] == "+77760047836"

    async def test_verify_code_wrong_code(self, client: AsyncClient):
        await client.post("/api/auth/send-code", json={"phone": "+77760047836"})
        resp = await client.post("/api/auth/verify-code", json={
            "phone": "+77760047836", "code": "9999",
        })
        assert resp.status_code == 401

    async def test_verify_code_existing_user(self, client: AsyncClient, db: AsyncSession):
        # Create user first
        user = User(phone="+77760047836", name="Existing")
        db.add(user)
        await db.commit()

        await client.post("/api/auth/send-code", json={"phone": "+77760047836"})
        resp = await client.post("/api/auth/verify-code", json={
            "phone": "+77760047836", "code": "0000",
        })
        assert resp.status_code == 200
        assert resp.json()["isNewUser"] is False


class TestAdminLogin:
    async def test_admin_login_success(self, client: AsyncClient, admin_token: str):
        resp = await client.post("/api/auth/admin-login", json={
            "email": "admin@test.kz", "password": "admin123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "ADMIN"

    async def test_admin_login_wrong_password(self, client: AsyncClient, admin_token: str):
        resp = await client.post("/api/auth/admin-login", json={
            "email": "admin@test.kz", "password": "wrong",
        })
        assert resp.status_code == 401

    async def test_admin_login_not_admin(self, client: AsyncClient, user_token: str):
        resp = await client.post("/api/auth/admin-login", json={
            "email": "user@test.kz", "password": "123",
        })
        assert resp.status_code == 401


class TestWarrantyLogin:
    async def test_warranty_login_success(self, client: AsyncClient, warranty_manager_token: str):
        resp = await client.post("/api/auth/warranty-login", json={
            "email": "wm@test.kz", "password": "wm123",
        })
        assert resp.status_code == 200
        assert resp.json()["user"]["role"] == "WARRANTY_MANAGER"
