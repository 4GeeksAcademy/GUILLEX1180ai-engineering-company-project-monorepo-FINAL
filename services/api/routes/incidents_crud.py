"""
Router CRUD del Gestor de Incidencias Centralizado (TrackFlow).

Alineado con CONTEXT.es.md y el modelo Incident de models.py.

Endpoints:
- POST   /incidents                     — Crea una nueva incidencia.
- GET    /incidents                     — Lista con filtros opcionales.
- GET    /incidents/summary             — Métricas agregadas (estado/categoría/origen/sede).
- GET    /incidents/{id}                — Detalle de una incidencia.
- PATCH  /incidents/{id}/status         — Actualiza el estado (con ciclo de vida).
- DELETE /incidents/{id}                — Elimina una incidencia.

Manejo de errores:
- 400 para validación de dominio con JSON descriptivo { field, message }.
- 404 cuando la incidencia no existe.
- 409 para transiciones de estado no válidas (estados finales o salto inválido).
"""

from __future__ import annotations

from collections import Counter
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError

from database import incidents_table, IncidentQuery
from incidents_db import (
    create_incident,
    get_incident,
    get_incident_by_origin_ref,
    list_incidents,
    update_incident_status,
    delete_incident,
)
from models import (
    IncidentCategory,
    IncidentCreate,
    IncidentOrigin,
    IncidentResponse,
    IncidentStatus,
    IncidentUpdateStatus,
)
# Constantes compartidas — única fuente de verdad para el ciclo de vida
from packages.shared.incident_validation import (
    TRANSICIONES_VALIDAS,
    ESTADOS_FINALES,
    validar_transicion as _validar_transicion_domain,
)

router = APIRouter(prefix="/incidents", tags=["Incidents CRUD"])


# ═══════════════════════════════════════════════════════════
# Ciclo de vida de estados (wrapper HTTP sobre dominio compartido)
# ═══════════════════════════════════════════════════════════


def _validar_transicion(actual: str, nuevo: str) -> None:
    """Wrapper HTTP de la validación de transición de estado.

    Delega la lógica de negocio a packages/shared/incident_validation.py
    y convierte ValueError → HTTPException 409 para FastAPI.

    Args:
        actual: Estado actual (string del documento).
        nuevo:  Estado solicitado (string del documento).

    Raises:
        HTTPException 400 si el estado es desconocido.
        HTTPException 409 si la transición no es válida.
    """
    try:
        _validar_transicion_domain(actual, nuevo)
    except ValueError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        )


# ═══════════════════════════════════════════════════════════
# Validación de entrada (400 con JSON descriptivo)
# ═══════════════════════════════════════════════════════════


def _errores_validacion(exc: ValidationError) -> list[dict[str, str]]:
    """Traduce errores de Pydantic a una lista de { field, message } legible."""
    errores: list[dict[str, str]] = []
    for e in exc.errors():
        campo = ".".join(str(p) for p in e.get("loc", []))
        msg = e.get("msg", "Valor no permitido.")
        # Pydantic a veces envuelve el mensaje: "Value error, ..." en v2
        msg = msg.replace("Value error, ", "").replace("Input should be ", "Debe ser ")
        errores.append({"field": campo or "body", "message": msg})
    return errores


# ═══════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════


@router.post("", response_model=IncidentResponse, status_code=201)
async def create(payload: IncidentCreate):
    """Crea una nueva incidencia.

    Devuelve 400 con JSON descriptivo si falta un campo obligatorio o
    contiene un valor no permitido.
    """
    try:
        incidente = create_incident(payload)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=_errores_validacion(exc))
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=[{"field": "branch", "message": str(exc)}],
        )
    return incidente


@router.get("", response_model=list[IncidentResponse])
async def list_all(
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    origin: Optional[str] = Query(None, description="Filtrar por origen"),
    branch: Optional[str] = Query(None, description="Filtrar por sede"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
):
    """Lista incidencias con filtros opcionales (status, origin, branch, category).

    Los filtros se aplican como intersección (AND). Si la base de datos está
    vacía o no hay coincidencias, devuelve una lista vacía (200), nunca error.
    """
    # Validar que los filtros correspondan a valores conocidos (400 si no).
    for filtro, valores_validos, nombre in (
        (status, {s.value for s in IncidentStatus}, "status"),
        (origin, {o.value for o in IncidentOrigin}, "origin"),
    ):
        if filtro is not None and filtro not in valores_validos:
            raise HTTPException(
                status_code=400,
                detail=[{
                    "field": nombre,
                    "message": (
                        f"Valor '{filtro}' no permitido para '{nombre}'. "
                        f"Permitidos: {', '.join(sorted(valores_validos))}."
                    ),
                }],
            )

    return list_incidents(
        status=status,
        category=category,
        origin=origin,
        branch=branch,
    )


@router.get("/summary", response_model=dict[str, Any])
async def summary():
    """Devuelve métricas agregadas de todas las incidencias.

    - total: número de incidencias registradas.
    - by_status: conteo por estado.
    - by_category: conteo por categoría.
    - by_origin: conteo por origen.
    - by_branch: conteo por sede.

    Si la base de datos está vacía, devuelve métricas en cero (nunca error).
    """
    docs = incidents_table.all()

    # Inicializamos los contadores con todos los valores conocidos para que
    # las categorías/estados sin incidencias aparezcan con 0.
    by_status = Counter({s.value: 0 for s in IncidentStatus})
    by_category = Counter({c.value: 0 for c in IncidentCategory})
    by_origin = Counter({o.value: 0 for o in IncidentOrigin})
    by_branch: Counter[str] = Counter()

    for doc in docs:
        by_status[doc.get("status", "unknown")] += 1
        by_category[doc.get("category", "unknown")] += 1
        by_origin[doc.get("origin", "unknown")] += 1
        branch = doc.get("branch") or "central"
        by_branch[branch] += 1

    return {
        "total": len(docs),
        "by_status": dict(by_status),
        "by_category": dict(by_category),
        "by_origin": dict(by_origin),
        "by_branch": dict(by_branch),
    }


@router.get("/{incident_id}", response_model=IncidentResponse)
async def detail(incident_id: str):
    """Detalle de una incidencia por su UUID. Devuelve 404 si no existe."""
    incidente = get_incident(incident_id)
    if incidente is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return incidente


@router.patch("/{incident_id}/status", response_model=IncidentResponse)
async def change_status(incident_id: str, payload: IncidentUpdateStatus):
    """Actualiza el estado de una incidencia validando el ciclo de vida.

    Reglas:
    - open        → in_progress o discarded
    - in_progress → resolved o discarded
    - resolved    → estado final (sin más cambios)
    - discarded   → estado final (sin más cambios)

    Devuelve 404 si la incidencia no existe y 409 si la transición es inválida.
    """
    # Buscar el documento para conocer el estado actual
    docs = incidents_table.search(IncidentQuery.id == incident_id)
    if not docs:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")

    estado_actual = docs[0].get("status", "")
    _validar_transicion(estado_actual, payload.status.value)

    actualizado = update_incident_status(incident_id, payload.status)
    if actualizado is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return actualizado


@router.delete("/{incident_id}", status_code=204)
async def remove(incident_id: str):
    """Elimina una incidencia. Devuelve 204 o 404 si no existe."""
    borrado = delete_incident(incident_id)
    if not borrado:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada.")
    return None