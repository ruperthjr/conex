"""
Async database engine and session configuration for Conexiaa.
Uses SQLAlchemy 2.0 async with asyncpg driver.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# ─── Engine ─────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    future=True,
)

# ─── Session factory ────────────────────────────────────────────────────
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# ─── Declarative base for all models ────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ─── FastAPI dependency ────────────────────────────────────────────────
async def get_session() -> AsyncSession:
    """
    Yields an async database session.
    Usage: `db: AsyncSession = Depends(get_session)` inside endpoints.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── Testing ──────────────────────────────
# 1. Set DATABASE_URL environment variable (or .env) to point to your PostgreSQL instance.
#    Example: postgresql+asyncpg://postgres:postgres@localhost:5432/conexiaa
# 2. The engine is created at import time; run Alembic migrations or use
#    `Base.metadata.create_all` in main.py lifespan to create tables quickly.
# 3. Use `get_session` dependency in all API routes that need database access.