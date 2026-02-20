import asyncio
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.models.base import Base
from app.models import *  # noqa — register all models
from app.services.auth_service import create_token, hash_password

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
        finally:
            await session.close()


@pytest_asyncio.fixture
async def db():
    async with TestSession() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    from app.main import app

    # Mock Redis
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.setex = AsyncMock()
    mock_redis.publish = AsyncMock()
    mock_redis.close = AsyncMock()

    app.dependency_overrides[get_db] = override_get_db
    app.state.redis = mock_redis

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_token(db: AsyncSession):
    admin = User(
        phone="+77777777777", email="admin@test.kz", name="Admin",
        password=hash_password("admin123"), role="ADMIN",
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return create_token(admin.id, admin.role)


@pytest_asyncio.fixture
async def user_with_id(db: AsyncSession):
    user = User(phone="+77001234567", name="Test User", role="USER")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def user_token(db: AsyncSession, user_with_id):
    return create_token(user_with_id.id, user_with_id.role)


@pytest_asyncio.fixture
async def sc_manager_token(db: AsyncSession):
    manager = User(phone="+77009999999", name="SC Manager", role="SC_MANAGER")
    db.add(manager)
    await db.commit()
    await db.refresh(manager)

    sc = ServiceCenter(
        name="Test SC", type="SERVICE_CENTER", city="Алматы",
        manager_id=manager.id, commission_percent=20, discount_percent=0,
    )
    db.add(sc)
    await db.commit()
    return create_token(manager.id, manager.role)


@pytest_asyncio.fixture
async def warranty_manager_token(db: AsyncSession):
    wm = User(
        phone="+77005555555", email="wm@test.kz", name="WM",
        password=hash_password("wm123"), role="WARRANTY_MANAGER",
        salon_name="Test Salon",
    )
    db.add(wm)
    await db.commit()
    await db.refresh(wm)
    return create_token(wm.id, wm.role)
