"""Initialize database tables."""

import asyncio
from app.db.base import Base, engine
from app.models import User, Session, DomainWhitelist, ActivityLog


async def init_db():
    """Create all database tables."""
    async with engine.begin() as conn:
        # Drop all tables (only for development)
        # await conn.run_sync(Base.metadata.drop_all)

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    print("Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())
