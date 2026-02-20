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


async def main():
    await create_tables()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
