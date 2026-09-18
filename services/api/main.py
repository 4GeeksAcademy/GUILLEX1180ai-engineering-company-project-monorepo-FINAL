"""Punto de entrada de la API de Suppliers (TrackFlow).

Ejecución:
    uvicorn main:app --reload --port 8001
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routes import incidents, suppliers, leads

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url=f"{settings.api_prefix}/docs",
    openapi_url=f"{settings.api_prefix}/openapi.json",
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
    """
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Error interno del servidor: {type(exc).__name__}: {exc}",
        },
    )


# ─── Routers ───

app.include_router(suppliers.router, prefix=settings.api_prefix)
app.include_router(incidents.router, prefix=settings.api_prefix)
app.include_router(leads.router, prefix=settings.api_prefix)


# ─── Health ───

@app.get(f"{settings.api_prefix}/health")
async def health_check():
    """Endpoint de salud del servicio."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
    }