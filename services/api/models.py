"""Modelos Pydantic para Supplier e Incident — Alineados con CONTEXT.md de TrackFlow.

Suppliers:
  - Estados: activo, suspendido.
  - Categorías: Moda, Electrónica, Cosmética, Alimentación.
  - Países: Estados Unidos, España.

Incidents:
  - Categorías: Retraso en entrega, Producto dañado, Devolución incorrecta,
    Error de picking, Problema de inventario.
  - Estados: open, in_progress, resolved, discarded.
  - Orígenes: customer, branch, internal.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


# ═══════════════════════════════════════════════════════════
# Enums — Supplier (alineados con CONTEXT.md)
# ═══════════════════════════════════════════════════════════


class SupplierStatus(str, enum.Enum):
    """Estados permitidos para un proveedor (activo / suspendido)."""

    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"


class ProductCategory(str, enum.Enum):
    """Categorías de producto definidas en CONTEXT.md."""

    MODA = "Moda"
    ELECTRONICA = "Electrónica"
    COSMETICA = "Cosmética"
    ALIMENTACION = "Alimentación"


class Country(str, enum.Enum):
    """Países donde opera TrackFlow (CONTEXT.md)."""

    ESTADOS_UNIDOS = "Estados Unidos"
    ESPANA = "España"


# ═══════════════════════════════════════════════════════════
# Enums — Incident (alineados con incidents_core.py y CONTEXT.es.md)
# ═══════════════════════════════════════════════════════════


class IncidentCategory(str, enum.Enum):
    """Categorías de incidencia definidas en incidents_core.py."""

    RETRASO_ENTREGA = "Retraso en entrega"
    PRODUCTO_DANIADO = "Producto dañado"
    DEVOLUCION_INCORRECTA = "Devolución incorrecta"
    ERROR_PICKING = "Error de picking"
    PROBLEMA_INVENTARIO = "Problema de inventario"


class IncidentStatus(str, enum.Enum):
    """Estados del ciclo de vida de una incidencia.

    - open: recién creada, pendiente de acción.
    - in_progress: está siendo gestionada.
    - resolved: solucionada.
    - discarded: descartada (no procede).
    """

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISCARDED = "discarded"


class IncidentOrigin(str, enum.Enum):
    """Origen del reporte de la incidencia.

    - customer: reportada por un cliente final.
    - branch: reportada por una sede / almacén.
    - internal: detectada por un equipo interno de TrackFlow.
    """

    CUSTOMER = "customer"
    BRANCH = "branch"
    INTERNAL = "internal"


# ═══════════════════════════════════════════════════════════
# Modelos — Supplier
# ═══════════════════════════════════════════════════════════


class SupplierCreate(BaseModel):
    """Modelo de entrada para crear un proveedor."""

    nombre: str = Field(
        ..., min_length=2, description="Nombre del proveedor (mín. 2 caracteres)"
    )
    pais: Country
    categorias: list[ProductCategory] = Field(
        ..., min_length=1, description="Lista de categorías de producto"
    )
    tarifa: float = Field(
        ..., gt=0, description="Tarifa estrictamente positiva (debe ser > 0)"
    )
    status: SupplierStatus = Field(
        default=SupplierStatus.ACTIVO, description="Estado del proveedor"
    )

    @field_validator("categorias")
    @classmethod
    def categorias_no_repetidas(cls, v: list[ProductCategory]) -> list[ProductCategory]:
        if len(v) != len(set(v)):
            raise ValueError("Las categorías no pueden repetirse")
        return v


class SupplierUpdateRate(BaseModel):
    """Modelo para actualizar solo la tarifa."""

    tarifa: float = Field(..., gt=0, description="Nueva tarifa (> 0)")


class SupplierUpdateStatus(BaseModel):
    """Modelo para actualizar solo el estado."""

    status: SupplierStatus


class SupplierResponse(BaseModel):
    """Modelo de respuesta con todos los campos del proveedor."""

    id: int
    nombre: str
    pais: str
    categorias: list[str]
    tarifa: float
    status: str
    updated_at: str  # ISO format

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
# Modelos — Incident
# ═══════════════════════════════════════════════════════════


class IncidentCreate(BaseModel):
    """Modelo de entrada para registrar una nueva incidencia.

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
    """Modelo para actualizar solo el estado de una incidencia."""

    status: IncidentStatus = Field(
        ..., description="Nuevo estado de la incidencia"
    )


class IncidentResponse(BaseModel):
    """Modelo de respuesta con todos los campos de una incidencia."""

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
