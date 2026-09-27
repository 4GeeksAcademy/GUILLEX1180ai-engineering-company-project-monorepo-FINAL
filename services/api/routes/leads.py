"""Router CRUD para Leads / Records (TrackFlow).

Endpoints (alineados con uis/backoffice/src/lib/api.ts):
- GET    /records?limit=500              — Listar leads
- GET    /records/{id}                   — Detalle de lead
- POST   /records                        — Crear lead
- PUT    /records/{id}                   — Actualizar lead completo
- PATCH  /records/{id}                   — Actualizar status/stage parcial
- GET    /records/{id}/notes             — Notas de un lead
- POST   /records/{id}/notes             — Agregar nota
- DELETE /records/{id}/notes/{note_id}   — Eliminar nota
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

# ─── TinyDB ───
from tinydb import TinyDB, Query as TQuery

from models import (
    LeadCreate,
    LeadUpdate,
    LeadPatch,
    LeadOut,
    LeadListResponse,
    NotePost,
    NoteOut,
    NoteListResponse,
)

DB_PATH = "leads_db.json"
db = TinyDB(DB_PATH)
leads_table = db.table("leads")
notes_table = db.table("notes")
LeadQuery = TQuery()

router = APIRouter(prefix="/records", tags=["Leads"])


# ═══════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════


def _lead_to_response(doc) -> LeadOut:
    return LeadOut(
        id=doc.doc_id,
        company_name=doc["company_name"],
        contact_person=doc["contact_person"],
        email=doc["email"],
        phone=doc["phone"],
        website=doc.get("website"),
        country=doc.get("country", ""),
        product_type=doc.get("product_type", ""),
        monthly_volume=doc.get("monthly_volume", ""),
        services=doc.get("services", []),
        has_3pl=doc.get("has_3pl", ""),
        comments=doc.get("comments"),
        status=doc.get("status", "new"),
        stage=doc.get("stage", "inbound"),
        created_at=doc["created_at"],
        updated_at=doc.get("updated_at"),
    )


def _get_lead_or_404(lead_id: int):
    doc = leads_table.get(doc_id=lead_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return doc


# ═══════════════════════════════════════════════════════════
# Endpoints — Leads
# ═══════════════════════════════════════════════════════════


@router.get("", response_model=LeadListResponse)
async def list_leads(limit: int = Query(500, ge=1, le=1000)):
    """Lista todos los leads. Devuelve formato compatible con unwrapArray()."""
    all_docs = leads_table.all()
    results = [_lead_to_response(doc) for doc in all_docs[-limit:]]
    return LeadListResponse(results=results)


@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: int):
    """Detalle de un lead por ID."""
    doc = _get_lead_or_404(lead_id)
    return _lead_to_response(doc)


@router.post("", response_model=LeadOut, status_code=201)
async def create_lead(payload: LeadCreate):
    """Crea un nuevo lead."""
    now = datetime.now(timezone.utc).isoformat()
    doc_data = payload.model_dump()
    doc_data["services"] = payload.services
    doc_data["created_at"] = now
    doc_id = leads_table.insert(doc_data)
    doc = leads_table.get(doc_id=doc_id)
    return _lead_to_response(doc)


@router.put("/{lead_id}", response_model=LeadOut)
async def update_lead(lead_id: int, payload: LeadUpdate):
    """Actualiza un lead completo (solo campos enviados)."""
    doc = _get_lead_or_404(lead_id)
    now = datetime.now(timezone.utc).isoformat()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_data["updated_at"] = now
    leads_table.update(update_data, doc_ids=[lead_id])
    updated = leads_table.get(doc_id=lead_id)
    return _lead_to_response(updated)


@router.patch("/{lead_id}", response_model=LeadOut)
async def patch_lead(lead_id: int, payload: LeadPatch):
    """Actualiza parcialmente status y/o stage de un lead."""
    doc = _get_lead_or_404(lead_id)
    now = datetime.now(timezone.utc).isoformat()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    update_data["updated_at"] = now
    leads_table.update(update_data, doc_ids=[lead_id])
    updated = leads_table.get(doc_id=lead_id)
    return _lead_to_response(updated)


# ═══════════════════════════════════════════════════════════
# Endpoints — Notes
# ═══════════════════════════════════════════════════════════


@router.get("/{lead_id}/notes", response_model=NoteListResponse)
async def list_notes(lead_id: int):
    """Lista las notas de un lead."""
    _get_lead_or_404(lead_id)  # verifica que el lead existe
    all_notes = notes_table.search(LeadQuery.lead_id == lead_id)
    results = []
    for doc in all_notes:
        results.append(NoteOut(
            id=doc.doc_id,
            lead_id=doc["lead_id"],
            content=doc["content"],
            created_by=doc.get("created_by"),
            created_at=doc["created_at"],
            updated_at=doc.get("updated_at"),
        ))
    return NoteListResponse(results=results)


@router.post("/{lead_id}/notes", response_model=NoteOut, status_code=201)
async def add_note(lead_id: int, payload: NotePost):
    """Agrega una nota a un lead."""
    _get_lead_or_404(lead_id)
    now = datetime.now(timezone.utc).isoformat()
    doc_data = {
        "lead_id": lead_id,
        "content": payload.content,
        "created_at": now,
    }
    doc_id = notes_table.insert(doc_data)
    doc = notes_table.get(doc_id=doc_id)
    return NoteOut(
        id=doc.doc_id,
        lead_id=doc["lead_id"],
        content=doc["content"],
        created_by=doc.get("created_by"),
        created_at=doc["created_at"],
        updated_at=doc.get("updated_at"),
    )


@router.delete("/{lead_id}/notes/{note_id}", status_code=204)
async def delete_note(lead_id: int, note_id: int):
    """Elimina una nota de un lead."""
    _get_lead_or_404(lead_id)
    doc = notes_table.get(doc_id=note_id)
    if doc is None or doc.get("lead_id") != lead_id:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    notes_table.remove(doc_ids=[note_id])