"""Esquemas de proveedores (Suppliers) — Separación estricta input/output.

Principios:
  - `SupplierCreate` (input) acepta enums como valores; TinyDB los serializa a string.
  - `SupplierResponse` (output) devuelve strings planos (ya convertidos).
  - `SupplierListItem` es un subconjunto ligero para listados: omite `updated_at`.
  - `SupplierUpdateRate` / `SupplierUpdateStatus` aceptan solo el campo modificable.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ═══════════════════════════════════════════════════════════
# Enums (importados desde enums.py — fuente única de verdad)
# ═══════════════════════════════════════════════════════════

from schemas.enums import (
    SupplierStatus,
    ProductCategory,
    Country,
)


# ═══════════════════════════════════════════════════════════
# Input (Request) Schemas
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
    """Entrada para actualizar solo la tarifa."""

    tarifa: float = Field(..., gt=0, description="Nueva tarifa (> 0)")


class SupplierUpdateStatus(BaseModel):
    """Entrada para actualizar solo el estado."""

    status: SupplierStatus


# ═══════════════════════════════════════════════════════════
# Output (Response) Schemas
# ═══════════════════════════════════════════════════════════


class SupplierResponse(BaseModel):
    """Modelo de respuesta completo con todos los campos del proveedor."""

    id: int
    nombre: str
    pais: str
    categorias: list[str]
    tarifa: float
    status: str
    updated_at: str  # ISO format

    model_config = {"from_attributes": True}


class SupplierListItem(BaseModel):
    """Versión ligera de SupplierResponse para endpoints de listado.

    Omite `updated_at` para reducir payload en colecciones grandes.
    """

    id: int
    nombre: str
    pais: str
    categorias: list[str]
    tarifa: float
    status: str

    model_config = {"from_attributes": True}


class SupplierListResponse(BaseModel):
    """Envoltorio para listas de proveedores (consistente con otros listados)."""

    results: list[SupplierListItem]
    total: int