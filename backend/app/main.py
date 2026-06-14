"""
HR Portal – FastAPI Application Entry Point
============================================
Wires together the lifespan, routers, and middleware.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import close_db, init_db, ping_db


# ---------------------------------------------------------------------------
# Lifespan context manager (replaces deprecated on_event handlers)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ─────────────────────────────────────────────────────────────
    import os
    os.makedirs(os.path.join(os.getcwd(), "uploads"), exist_ok=True)
    await init_db()
    yield
    # ── Shutdown ────────────────────────────────────────────────────────────
    await close_db()


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HR Portal API",
    version="1.0.0",
    description="Manage employees, attendance, projects, skills & résumés.",
    lifespan=lifespan,
)

# CORS – tighten origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["system"])
async def health():
    db_ok = await ping_db()
    return {"status": "ok" if db_ok else "degraded", "database": db_ok}


# ---------------------------------------------------------------------------
# API Routers registration
# ---------------------------------------------------------------------------

from app.routers.employees import router as employees_router
from app.routers.attendance import router as attendance_router
from app.routers.projects import router as projects_router
from app.routers.skills import router as skills_router
from app.routers.resumes import router as resumes_router
from app.routers.chat import router as chat_router

app.include_router(employees_router, prefix="/api")
app.include_router(attendance_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(skills_router, prefix="/api")
app.include_router(resumes_router, prefix="/api")
app.include_router(chat_router)   # chat router already contains /api in its own prefix
