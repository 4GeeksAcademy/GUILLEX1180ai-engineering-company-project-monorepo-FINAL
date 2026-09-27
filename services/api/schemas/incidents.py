"""Esquemas de incidencias (CRUD + Análisis) — Separación estricta input/output.

Principios:
  - `IncidentCreate` (input) acepta enums para validación; se serializan a string.
  - `IncidentResponse` (output) devuelve strings planos.
  - `IncidentListItem` es un subconjunto ligero para listados (sin description).
  - `IncidentUpdateStatus` acepta solo el campo modificable.
  - `AnalisisResponse` modela el resultado del análisis CSV.
  - `IncidentSummaryResponse` modela métricas agregadas.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ═══════════════════════════════════════════════════════════
# Enums (importados desde enums.py — fuente única de verdad)
# ═══════════════════════════════════════════════════════════

from schemas.enums import (
    IncidentCategory,
    IncidentStatus,
    IncidentOrigin,
)


# ═══════════════════════════════════════════════════════════
# Input (Request) Schemas
# ═══════════════════════════════════════════════════════════


class IncidentCreate(BaseModel):
    """Entrada para registrar una nueva incidencia.

    El campo `branch` es obligatorio para todos los orígenes; usar
    "central" cuando la incidencia no esté asociada a una sede concreta.
    """

    title: str = Field(
        ...,
        min_length=1,
        description="Título breve de la incidencia (no puede estar vacío)",
    )
    description: str = Field(
        ...,
        min_length=1,
        description="Descripción detallada de la incidencia",
    )
    category: IncidentCategory = Field(
        ..., description="Categoría de la incidencia"
    )
    status: IncidentStatus = Field(
        default=IncidentStatus.OPEN,
        description="Estado actual de la incidencia",
    )
    origin: IncidentOrigin = Field(
        ..., description="Origen del reporte (customer / branch / internal)"
    )
    branch: str = Field(
        ...,
        min_length=1,
        description=(
            "Sede asociada a la incidencia. Usar 'central' si no "
            "corresponde a una sede específica."
        ),
    )

    @field_validator("branch")
    @classmethod
    def branch_no_vacia(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("El campo 'branch' no puede estar vacío")
        return stripped


class IncidentUpdateStatus(BaseModel):
    """Entrada para actualizar solo el estado de una incidencia."""

    status: IncidentStatus = Field(
        ..., description="Nuevo estado de la incidencia"
    )


# ═══════════════════════════════════════════════════════════
# Output (Response) Schemas
# ═══════════════════════════════════════════════════════════


class IncidentResponse(BaseModel):
    """Respuesta completa con todos los campos de una incidencia."""

    id: str  # UUID en formato string
    title: str
    description: str
    category: str
    status: str
    origin: str
    branch: str
    created_at: str  # ISO format
    updated_at: str  # ISO format

    model_config = {"from_attributes": True}


class IncidentListItem(BaseModel):
    """Versión ligera de IncidentResponse para endpoints de listado.

    Omite `description` (potencialmente largo) y `updated_at` para
    reducir payload en colecciones.
    """

    id: str
    title: str
    category: str
    status: str
    origin: str
    branch: str
    created_at: str

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
# Métricas Agregadas
# ═══════════════════════════════════════════════════════════


class IncidentSummaryResponse(BaseModel):
    """Métricas agregadas de todas las incidencias."""

    total: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_origin: dict[str, int]
    by_branch: dict[str, int]


# ═══════════════════════════════════════════════════════════
# Análisis CSV
# ═══════════════════════════════════════════════════════════


class ErrorDetailAnalisis(BaseModel):
    """Detalle de un tipo de error en el análisis CSV."""

    tipo: str
    cantidad: int


class AnalisisResponse(BaseModel):
    """Resultado del análisis de un CSV de incidencias."""

    total_registros: int
    registros_validos: int
    registros_invalidos: int
    errores_por_tipo: list[ErrorDetailAnalisis]
    categorias: dict[str, int]
    estados: dict[str, int]
    satisfaccion_media: Optional[float] = None
    total_cerrados_con_puntuacion: int
    analizado_en: str