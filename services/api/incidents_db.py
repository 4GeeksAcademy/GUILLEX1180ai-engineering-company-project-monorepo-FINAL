"""incidents_db.py — Capa de persistencia para incidencias (TrackFlow).

Gestiona el almacenamiento de incidencias en TinyDB, proporcionando
operaciones CRUD básicas y reutilizando los modelos Pydantic definidos
en models.py.

Uso desde routes/incidents.py:
    from incidents_db import create_incident, get_incident, ...
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional

from database import incidents_table, IncidentQuery
from models import (
    IncidentCreate,
    IncidentResponse,
    IncidentStatus,
)


# ═══════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════


def _now_iso() -> str:
    """Retorna la marca de tiempo actual en formato ISO 8601 UTC."""
    return datetime.now(timezone.utc).isoformat()


def _doc_to_response(doc) -> IncidentResponse:
    """Convierte un documento TinyDB a IncidentResponse."""
    return IncidentResponse(
        id=doc["id"],
        title=doc["title"],
        description=doc["description"],
        category=doc["category"],
        status=doc["status"],
        origin=doc["origin"],
        branch=doc["branch"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


# ═══════════════════════════════════════════════════════════
# CRUD
# ═══════════════════════════════════════════════════════════


def create_incident(
    payload: IncidentCreate,
    origin_ref: Optional[str] = None,
    created_at: Optional[str] = None,
) -> IncidentResponse:
    """Registra una nueva incidencia con UUID y timestamps automáticos.

    Args:
        payload: Datos validados por IncidentCreate.
        origin_ref: Identificador único del registro en el sistema de
            origen (p.ej. `id_incidencia` del CSV histórico). Se usa
            para garantizar idempotencia en los scripts de seed.
        created_at: Marca de tiempo a preservar (p.ej. `fecha_apertura`
            del CSV histórico). Si se omite, se usa el momento actual.

    Returns:
        IncidentResponse con la incidencia recién creada.
    """
    now = _now_iso()
    created = created_at or now
    doc_data = {
        "id": str(uuid4()),
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "category": payload.category.value,
        "status": payload.status.value,
        "origin": payload.origin.value,
        "branch": payload.branch.strip(),
        "created_at": created,
        "updated_at": now,
    }

    if origin_ref is not None:
        doc_data["origin_ref"] = str(origin_ref).strip()
    incidents_table.insert(doc_data)
    return IncidentResponse(**doc_data)


def get_incident_by_origin_ref(origin_ref: str) -> Optional[IncidentResponse]:
    """Busca una incidencia por el identificador único del sistema de origen.

    Utilizada por el seed para evitar duplicados (idempotencia) cuando el
    mismo CSV se ejecuta varias veces.

    Args:
        origin_ref: Identificador original (p.ej. `id_incidencia` del CSV).

    Returns:
        IncidentResponse si existe, None en caso contrario.
    """
    docs = incidents_table.search(IncidentQuery.origin_ref == str(origin_ref).strip())
    if not docs:
        return None
    return _doc_to_response(docs[0])


def get_incident(incident_id: str) -> Optional[IncidentResponse]:
    """Obtiene una incidencia por su UUID.

    Args:
        incident_id: UUID de la incidencia.

    Returns:
        IncidentResponse si existe, None en caso contrario.
    """
    docs = incidents_table.search(IncidentQuery.id == incident_id)
    if not docs:
        return None
    return _doc_to_response(docs[0])


def list_incidents(
    status: Optional[str] = None,
    category: Optional[str] = None,
    origin: Optional[str] = None,
    branch: Optional[str] = None,
) -> list[IncidentResponse]:
    """Lista incidencias con filtros opcionales.

    Todos los filtros se aplican como intersección (AND).

    Args:
        status:  Filtrar por estado (open, in_progress, resolved, discarded).
        category: Filtrar por categoría de incidencia.
        origin:   Filtrar por origen (customer, branch, internal).
        branch:   Filtrar por sede.

    Returns:
        Lista de IncidentResponse que cumplen los filtros.
    """
    all_docs = incidents_table.all()
    results: list[IncidentResponse] = []

    for doc in all_docs:
        if status and doc.get("status") != status:
            continue
        if category and doc.get("category") != category:
            continue
        if origin and doc.get("origin") != origin:
            continue
        if branch and doc.get("branch", "").lower() != branch.lower():
            continue
        results.append(_doc_to_response(doc))

    return results


def update_incident_status(
    incident_id: str, new_status: IncidentStatus
) -> Optional[IncidentResponse]:
    """Actualiza el estado de una incidencia (open → in_progress → resolved / discarded).

    Args:
        incident_id: UUID de la incidencia a actualizar.
        new_status:  Nuevo estado (IncidentStatus).

    Returns:
        IncidentResponse actualizado, o None si no se encuentra.
    """
    docs = incidents_table.search(IncidentQuery.id == incident_id)
    if not docs:
        return None

    now = _now_iso()
    incidents_table.update(
        {"status": new_status.value, "updated_at": now},
        IncidentQuery.id == incident_id,
    )

    updated = incidents_table.search(IncidentQuery.id == incident_id)[0]
    return _doc_to_response(updated)


def delete_incident(incident_id: str) -> bool:
    """Elimina una incidencia por su UUID.

    Args:
        incident_id: UUID de la incidencia a eliminar.

    Returns:
        True si se eliminó, False si no existía.
    """
    docs = incidents_table.search(IncidentQuery.id == incident_id)
    if not docs:
        return False
    incidents_table.remove(IncidentQuery.id == incident_id)
    return True