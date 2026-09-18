"""Modelo Pydantic para Supplier — Alineado con CONTEXT.md de TrackFlow.

Estados permitidos: activo, suspendido.
Categorías: Moda, Electrónica, Cosmética, Alimentación.
Países: Estados Unidos, España.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ─── Enums alineados con CONTEXT.md ───


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


# ─── Modelos ───


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