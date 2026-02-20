import pytest
from httpx import AsyncClient


class TestListUsers:
    async def test_list_users_admin(self, client: AsyncClient, admin_token: str):
        resp = await client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert "users" in data
        assert "total" in data

    async def test_list_users_unauthorized(self, client: AsyncClient, user_token: str):
        resp = await client.get("/api/users", headers={"Authorization": f"Bearer {user_token}"})
        assert resp.status_code == 403

    async def test_list_users_no_auth(self, client: AsyncClient):
        resp = await client.get("/api/users")
        assert resp.status_code in (401, 403)


class TestGetUser:
    async def test_get_own_profile(self, client: AsyncClient, user_with_id, user_token: str):
        resp = await client.get(
            f"/api/users/{user_with_id.id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["phone"] == "+77001234567"

    async def test_get_other_user_forbidden(self, client: AsyncClient, user_token: str):
        resp = await client.get(
            "/api/users/nonexistent-id",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert resp.status_code in (403, 404)


class TestUpdateUser:
    async def test_update_own_name(self, client: AsyncClient, user_with_id, user_token: str):
        resp = await client.put(
            f"/api/users/{user_with_id.id}",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"name": "Updated Name"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"


class TestFcmToken:
    async def test_update_fcm_token(self, client: AsyncClient, user_token: str):
        resp = await client.post(
            "/api/users/fcm-token",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"fcmToken": "test-fcm-token-123"},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True


class TestDeleteUser:
    async def test_delete_user_admin(self, client: AsyncClient, admin_token: str, user_with_id):
        resp = await client.delete(
            f"/api/users/{user_with_id.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
