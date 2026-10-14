"""Punto de entrada de la API de Suppliers (TrackFlow).

Ejecución:
    uvicorn main:app --reload --port 8001
"""

import logging
import sys
from pathlib import Path

# Añadir la raíz del monorepo al sys.path para imports de packages/shared
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

import time

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session  # tipo real devuelto por get_db()

from config import settings
from database import get_db, init_db
from routes import auth, incidents, incidents_crud, inventory, leads, suppliers
from routes.inventory import inventory_router
from schemas.common import HealthResponse
from cache import api_cache

logger = logging.getLogger(__name__)


# ─── Ciclo de vida: init_db() al arrancar (Supabase / PostgreSQL) ───


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Arranque de la aplicación.

    Crea las tablas SQLModel definidas en `models.py` (items, almacenes y
    movimientos de stock) usando `create_all()`. Ver advertencia Alembic
    en `database.init_db()`.
    """
    logger.info("Inicializando base de datos (SQLModel/Supabase)...")
    init_db()
    logger.info("Base de datos inicializada correctamente.")
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url=f"{settings.api_prefix}/docs",
    openapi_url=f"{settings.api_prefix}/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════
# Manejador global de excepciones no controladas
# ═══════════════════════════════════════════════════════════


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Captura cualquier excepción no manejada y devuelve JSON limpio.

    Sin este handler, una excepción inesperada devuelve HTML 500
    y el frontend no puede parsear la respuesta, mostrando "Load failed".

    NOTA de seguridad: No se expone el tipo ni el mensaje de la excepción
    original al cliente para evitar filtrar información interna del sistema.
    El error completo se registra en logs para depuración interna.
    """
    logger.exception("Excepción no controlada en %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor. Por favor, intenta de nuevo más tarde.",
        },
    )


# ═══════════════════════════════════════════════════════════
# Middleware de Timing HTTP
# ═══════════════════════════════════════════════════════════


@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    """Mide e imprime en consola la latencia en ms de cada petición."""
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    # Usamos logging.getLogger("uvicorn") para que aparezca con el formato
    # nativo de uvicorn y sea visible en consola.
    _log = logging.getLogger("uvicorn.access")
    _log.info(
        "⏱  %s %s → %d (%.1f ms, cache=%d)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
        api_cache.size,
    )
    return response


# ─── Routers ───

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(suppliers.router, prefix=settings.api_prefix)
app.include_router(incidents.router, prefix=settings.api_prefix)
app.include_router(incidents_crud.router, prefix=settings.api_prefix)
app.include_router(leads.router, prefix=settings.api_prefix)
# Inventario (Supabase/SQLModel) — APIRouter dedicado con prefijo /inventory
app.include_router(inventory_router, prefix=settings.api_prefix)


# ─── Health ───

@app.get(f"{settings.api_prefix}/health", response_model=HealthResponse)
async def health_check():
    """Endpoint de salud del servicio."""
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        version=settings.app_version,
    )


@app.get(f"{settings.api_prefix}/health/db")
def health_check_db(db: Session = Depends(get_db)):
    """Health check de la base de datos (Supabase PostgreSQL).

    Ejecuta `SELECT 1` usando la sesión entregada por `Depends(get_db)`
    para verificar que el pool de conexiones de SQLModel responde.
    """
    from sqlalchemy import text

    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 — se traduce a HTTP 500
        logger.error("Health check de base de datos falló: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Base de datos no disponible: {exc}",
        ) from exc

    return {"status": "online", "database": "Supabase PostgreSQL"}


# NOTA: Los endpoints de inventario (/inventory/*) viven en
# `routes/inventory.py` (inventory_router) con su capa de negocio en
# `services/inventory.py`. El patrón DTO y el cálculo de current_stock
# están centralizados allí.
