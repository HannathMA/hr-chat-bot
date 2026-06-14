"""
HR Portal – Database connection & session management
=====================================================
Uses SQLAlchemy 2.x async engine + FastAPI dependency injection.

Environment variables (set in .env or your deployment config):
    DATABASE_URL  – full DSN, e.g.
                    postgresql+asyncpg://hr_user:secret@localhost:5432/hr_portal
    DB_POOL_SIZE  – (optional) connection pool size, default 10
    DB_MAX_OVERFLOW – (optional) extra connections beyond pool, default 20
    DB_ECHO       – (optional) log SQL statements, default false
"""

from __future__ import annotations

import os
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

# ---------------------------------------------------------------------------
# Configuration (pulled from environment / .env via python-dotenv)
# ---------------------------------------------------------------------------

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://hr_user:changeme@localhost:5432/hr_portal",
)

# NullPool is recommended for test environments / serverless deployments.
# For a persistent server use the default pool with size settings below.
_USE_NULLPOOL: bool = os.getenv("DB_NULLPOOL", "false").lower() == "true"

_POOL_KWARGS: dict = (
    {"poolclass": NullPool}
    if _USE_NULLPOOL
    else {
        "pool_size":         int(os.getenv("DB_POOL_SIZE", 10)),
        "max_overflow":      int(os.getenv("DB_MAX_OVERFLOW", 20)),
        "pool_pre_ping":     True,   # drop dead connections before use
        "pool_recycle":      1800,   # recycle connections every 30 min
    }
)

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    future=True,
    **_POOL_KWARGS,
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

AsyncSessionFactory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,   # keep attribute access after commit
    autoflush=False,
    autocommit=False,
)


# ---------------------------------------------------------------------------
# FastAPI dependency  – yields a transactional session per request
# ---------------------------------------------------------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to inject into FastAPI route handlers::

        @router.get("/employees")
        async def list_employees(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ---------------------------------------------------------------------------
# Startup / Shutdown helpers (call from lifespan)
# ---------------------------------------------------------------------------

async def init_db() -> None:
    """
    Import all models so that Base.metadata is populated, then create
    tables that don't yet exist.  In production prefer Alembic migrations.
    """
    from app.models import Base  # noqa: F401 – registers all table metadata

    async with engine.begin() as conn:
        # Create tables only if they don't exist yet
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose the connection pool gracefully on shutdown."""
    await engine.dispose()


# ---------------------------------------------------------------------------
# Health-check helper
# ---------------------------------------------------------------------------

async def ping_db() -> bool:
    """Returns True if the database is reachable."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
