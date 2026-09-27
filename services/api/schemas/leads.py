"""Esquemas de Leads / Records y Notas — Separación estricta input/output.

Principios:
  - `LeadCreate` (input) tiene campos obligatorios mínimos y defaults.
  - `LeadUpdate` (input) todos los campos opcionales para merge parcial.
  - `LeadPatch` (input) solo status/stage para actualización parcial específica.
  - `LeadOut` (output) incluye todos los campos del lead.
  - `LeadListItem` es subconjunto ligero para listados grandes.
  - `NotePost` (input) solo content; `NoteOut` (output) incluye metadatos.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════
# Input (Request) Schemas — Leads
# ═══════════════════════════════════════════════════════════


class LeadCreate(BaseModel):
    """Entrada para crear un nuevo lead."""

    company_name: str = Field(..., min_length=1)
    contact_person: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=1)
    website: Optional[str] = None
    country: str = ""
    product_type: str = ""
    monthly_volume: str = ""
    services: list[str] = []
    has_3pl: str = ""
    comments: Optional[str] = None
    status: str = "new"
    stage: str = "inbound"


class LeadUpdate(BaseModel):
    """Entrada para actualizar un lead (todos los campos opcionales)."""

    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    product_type: Optional[str] = None
    monthly_volume: Optional[str] = None
    services: Optional[list[str]] = None
    has_3pl: Optional[str] = None
    comments: Optional[str] = None


class LeadPatch(BaseModel):
    """Entrada para actualización parcial solo de status/stage."""

    status: Optional[str] = None
    stage: Optional[str] = None


# ═══════════════════════════════════════════════════════════
# Input (Request) Schemas — Notes
# ═══════════════════════════════════════════════════════════


class NotePost(BaseModel):
    """Entrada para crear una nota (solo content)."""

    content: str = Field(..., min_length=1)


# ═══════════════════════════════════════════════════════════
# Output (Response) Schemas — Leads
# ═══════════════════════════════════════════════════════════


class LeadOut(BaseModel):
    """Respuesta completa de un lead."""

    id: int
    company_name: str
    contact_person: str
    email: str
    phone: str
    website: Optional[str] = None
    country: str
    product_type: str
    monthly_volume: str
    services: list[str]
    has_3pl: str
    comments: Optional[str] = None
    status: str
    stage: str
    created_at: str
    updated_at: Optional[str] = None


class LeadListItem(BaseModel):
    """Versión ligera de LeadOut para listados.

    Omite campos extensos (comments, website, services) para reducir payload.
    """

    id: int
    company_name: str
    contact_person: str
    email: str
    phone: str
    country: str
    product_type: str
    status: str
    stage: str
    created_at: str


class LeadListResponse(BaseModel):
    """Lista paginada de leads."""

    results: list[LeadOut]
    total: Optional[int] = None


# ═══════════════════════════════════════════════════════════
# Output (Response) Schemas — Notes
# ═══════════════════════════════════════════════════════════


class NoteOut(BaseModel):
    """Respuesta completa de una nota."""

    id: int
    lead_id: int
    content: str
    created_by: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


class NoteListResponse(BaseModel):
    """Lista de notas de un lead."""

    results: list[NoteOut]