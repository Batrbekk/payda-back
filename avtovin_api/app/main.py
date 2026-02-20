from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth, users, cars, car_catalog, services, service_centers, visits,
    warranties, warranty_managers, settlements, banners, dashboard, settings,
    events, seed,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect Redis
    app.state.redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    yield
    # Shutdown: close Redis
    await app.state.redis.close()


app = FastAPI(title="Avtovin API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(cars.router)
app.include_router(car_catalog.router)
app.include_router(services.router)
app.include_router(service_centers.router)
app.include_router(visits.router)
app.include_router(warranties.router)
app.include_router(warranty_managers.router)
app.include_router(settlements.router)
app.include_router(banners.router)
app.include_router(dashboard.router)
app.include_router(settings.router)
app.include_router(events.router)
app.include_router(seed.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
