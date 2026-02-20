import pytest
from httpx import AsyncClient


class TestCreateCar:
    async def test_create_car(self, client: AsyncClient, user_token: str):
        resp = await client.post(
            "/api/cars",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "brand": "Toyota", "model": "Camry", "year": 2020,
                "plateNumber": "A001AA",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["brand"] == "Toyota"
        assert data["plateNumber"] == "A001AA"

    async def test_create_car_with_vin(self, client: AsyncClient, user_token: str):
        resp = await client.post(
            "/api/cars",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "vin": "WVWZZZ3CZ9E123456",
                "brand": "VW", "model": "Passat", "year": 2019,
                "plateNumber": "B002BB",
            },
        )
        assert resp.status_code == 201
        assert resp.json()["vin"] == "WVWZZZ3CZ9E123456"

    async def test_duplicate_plate(self, client: AsyncClient, user_token: str):
        car_data = {"brand": "Kia", "model": "K5", "year": 2021, "plateNumber": "C003CC"}
        await client.post("/api/cars", headers={"Authorization": f"Bearer {user_token}"}, json=car_data)
        resp = await client.post("/api/cars", headers={"Authorization": f"Bearer {user_token}"}, json=car_data)
        assert resp.status_code == 409

    async def test_duplicate_vin(self, client: AsyncClient, user_token: str):
        base = {"vin": "WVWZZZ3CZ9E999999", "brand": "BMW", "model": "X5", "year": 2022}
        await client.post("/api/cars", headers={"Authorization": f"Bearer {user_token}"},
                          json={**base, "plateNumber": "D004DD"})
        resp = await client.post("/api/cars", headers={"Authorization": f"Bearer {user_token}"},
                                 json={**base, "plateNumber": "E005EE"})
        assert resp.status_code == 409


class TestListCars:
    async def test_list_own_cars(self, client: AsyncClient, user_token: str):
        await client.post("/api/cars", headers={"Authorization": f"Bearer {user_token}"},
                          json={"brand": "Honda", "model": "CR-V", "year": 2023, "plateNumber": "F006FF"})
        resp = await client.get("/api/cars", headers={"Authorization": f"Bearer {user_token}"})
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


class TestDeleteCar:
    async def test_delete_own_car(self, client: AsyncClient, user_token: str):
        create_resp = await client.post("/api/cars", headers={"Authorization": f"Bearer {user_token}"},
                                        json={"brand": "Mazda", "model": "CX-5", "year": 2021, "plateNumber": "G007GG"})
        car_id = create_resp.json()["id"]
        resp = await client.delete(f"/api/cars/{car_id}", headers={"Authorization": f"Bearer {user_token}"})
        assert resp.status_code == 200
