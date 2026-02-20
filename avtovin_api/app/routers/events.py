import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user, require_sc_manager
from app.models.car import Car
from app.models.service_center import ServiceCenter
from app.models.user import User
from app.services.event_service import publish_event, subscribe_events

router = APIRouter(prefix="/api/events", tags=["events"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # Verify JWT
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001, reason="Invalid token")
            return
    except JWTError:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await websocket.accept()
    redis = websocket.app.state.redis
    pubsub = await subscribe_events(redis, user_id)

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode()
                await websocket.send_text(data)
            # Small sleep to avoid busy loop
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(f"events:{user_id}")
        await pubsub.close()


class NotifyRequest(BaseModel):
    carId: str


@router.post("/notify")
async def notify_scan(
    body: NotifyRequest,
    request: Request,
    current_user: User = Depends(require_sc_manager),
    db: AsyncSession = Depends(get_db),
):
    # Find car and owner
    result = await db.execute(select(Car).where(Car.id == body.carId))
    car = result.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Авто не найдено")

    # Find SC name
    sc_name = "Сервисный центр"
    if current_user.service_center:
        sc_name = current_user.service_center.name
    else:
        result = await db.execute(
            select(ServiceCenter).where(ServiceCenter.manager_id == current_user.id)
        )
        sc = result.scalar_one_or_none()
        if sc:
            sc_name = sc.name

    redis = request.app.state.redis
    await publish_event(redis, car.user_id, "scan:started", {
        "carId": car.id,
        "carName": f"{car.brand} {car.model}",
        "serviceCenterName": sc_name,
    })

    return {"success": True}
