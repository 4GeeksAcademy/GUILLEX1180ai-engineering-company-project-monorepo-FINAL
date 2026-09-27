"""Esquemas comunes / compartidos entre dominios."""

from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Respuesta del endpoint de salud."""

    status: str
    app: str
    version: str


class ErrorDetail(BaseModel):
    """Detalle de un error de validación (field + message)."""

    field: str
    message: str