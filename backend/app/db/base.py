"""Database base configuration and session management."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

from ..core.config import settings

# Create async engine with different settings for SQLite
if "sqlite" in settings.DATABASE_URL:
    # SQLite doesn't support pool settings
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DATABASE_ECHO,
        future=True,
    )
else:
    # PostgreSQL with pool settings
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DATABASE_ECHO,
        future=True,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create declarative base for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        # Import all models here to ensure they're registered
        from ..models import user, session, domain_whitelist, activity_log

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)