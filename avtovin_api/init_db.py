"""Create all tables and optionally seed the database.

Usage (inside Docker):
    python init_db.py          # create tables only
    python init_db.py --seed   # create tables + seed data
"""

import asyncio
import sys

from app.database import engine
from app.models import Base  # noqa — imports all models


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("All tables created successfully.")


async def run_migrations():
    """Add new columns to existing tables if they don't exist."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE service_centers ADD COLUMN IF NOT EXISTS show_on_landing BOOLEAN DEFAULT true",
        "ALTER TABLE car_brands ADD COLUMN IF NOT EXISTS logo_url VARCHAR",
    ]
    async with engine.begin() as conn:
        for sql in migrations:
            try:
                await conn.execute(text(sql))
            except Exception as e:
                print(f"Migration skipped: {e}")
    print("Migrations applied.")


async def main():
    await create_tables()
    await run_migrations()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
