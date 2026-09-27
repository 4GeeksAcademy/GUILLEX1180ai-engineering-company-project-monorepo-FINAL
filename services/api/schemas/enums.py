"""Enums compartidos — Fuente única de verdad para valores permitidos.

Este archivo NO tiene dependencias de otros módulos del proyecto,
lo que permite que sea importado tanto por schemas/ como por models.py
sin riesgo de imports circulares.
"""

from __future__ import annotations

import enum


# ═══════════════════════════════════════════════════════════
# Enums — Supplier
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
# Enums — Incident
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