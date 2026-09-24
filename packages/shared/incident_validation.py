"""
incident_validation.py — Lógica de validación compartida de incidencias.

Centraliza las reglas de negocio del dominio Incident para que sean
reutilizables tanto por el script de seed como por la API FastAPI,
evitando duplicación de código.

Uso desde seed:
    sys.path.insert(0, "packages/shared")
    from incident_validation import (
        CATEGORIAS_VALIDAS, ESTADOS_VALIDOS, ORIGENES_VALIDOS,
        TRANSICIONES_VALIDAS, ESTADOS_FINALES,
        ESTADO_MAP, CATEGORIA_MAP,
    )

Uso desde API:
    from packages.shared.incident_validation import ...
    (o vía sys.path en entornos sin instalación del paquete)
"""

from __future__ import annotations

import enum
from typing import Any


# ═══════════════════════════════════════════════════════════
# Enums de dominio (canonical source of truth)
# ═══════════════════════════════════════════════════════════


class IncidentCategory(str, enum.Enum):
    """Categorías de incidencia definidas en el dominio TrackFlow."""

    RETRASO_ENTREGA = "Retraso en entrega"
    PRODUCTO_DANIADO = "Producto dañado"
    DEVOLUCION_INCORRECTA = "Devolución incorrecta"
    ERROR_PICKING = "Error de picking"
    PROBLEMA_INVENTARIO = "Problema de inventario"


class IncidentStatus(str, enum.Enum):
    """Estados del ciclo de vida de una incidencia."""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISCARDED = "discarded"


class IncidentOrigin(str, enum.Enum):
    """Origen del reporte de la incidencia."""

    CUSTOMER = "customer"
    BRANCH = "branch"
    INTERNAL = "internal"


# ═══════════════════════════════════════════════════════════
# Constantes de validación
# ═══════════════════════════════════════════════════════════

CATEGORIAS_VALIDAS: set[str] = {c.value for c in IncidentCategory}
ESTADOS_VALIDOS: set[str] = {s.value for s in IncidentStatus}
ORIGENES_VALIDOS: set[str] = {o.value for o in IncidentOrigin}


# ═══════════════════════════════════════════════════════════
# Ciclo de vida de estados
# ═══════════════════════════════════════════════════════════

TRANSICIONES_VALIDAS: dict[IncidentStatus, set[IncidentStatus]] = {
    IncidentStatus.OPEN: {
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.DISCARDED,
    },
    IncidentStatus.IN_PROGRESS: {
        IncidentStatus.RESOLVED,
        IncidentStatus.DISCARDED,
    },
    IncidentStatus.RESOLVED: set(),   # estado final
    IncidentStatus.DISCARDED: set(),  # estado final
}

ESTADOS_FINALES: set[IncidentStatus] = {
    IncidentStatus.RESOLVED,
    IncidentStatus.DISCARDED,
}


def validar_transicion(actual: str, nuevo: str) -> None:
    """Valida que la transición de estado respete el ciclo de vida.

    Raises:
        ValueError: Si la transición no es válida.
    """
    try:
        estado_actual = IncidentStatus(actual)
        estado_nuevo = IncidentStatus(nuevo)
    except ValueError:
        raise ValueError("Estado desconocido.")

    if estado_nuevo == estado_actual:
        raise ValueError(
            f"La incidencia ya se encuentra en estado '{actual}'."
        )

    if estado_actual in ESTADOS_FINALES:
        raise ValueError(
            f"El estado '{actual}' es final y no admite más cambios. "
            f"Imposible pasar a '{nuevo}'."
        )

    if estado_nuevo not in TRANSICIONES_VALIDAS[estado_actual]:
        permitidos = sorted(s.value for s in TRANSICIONES_VALIDAS[estado_actual])
        raise ValueError(
            f"Transición no válida: '{actual}' → '{nuevo}'. "
            f"Estados permitidos desde '{actual}': {', '.join(permitidos)}."
        )


# ═══════════════════════════════════════════════════════════
# Mapas de transformación (CSV legacy → modelo actual)
# ═══════════════════════════════════════════════════════════

ESTADO_MAP: dict[str, IncidentStatus] = {
    "abierto": IncidentStatus.OPEN,
    "cerrado": IncidentStatus.RESOLVED,
    "descartado": IncidentStatus.DISCARDED,
}

CATEGORIA_MAP: dict[str, IncidentCategory] = {
    c.value: c for c in IncidentCategory
}

ORIGEN_MAP: dict[str, IncidentOrigin] = {
    o.value: o for o in IncidentOrigin
}
