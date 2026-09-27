"""Script de seed volumétrico para generar datos a escala realista.

Inserta cientos de registros en las tablas de incidents y leads
para que las latencias del backend reflejen cargas de trabajo reales.

Ejecutar con:
    cd services/api && python seed_volumetric.py

Idempotente: si ya existen registros, inserta la diferencia para alcanzar
el objetivo configurable.
"""

from __future__ import annotations

import random
from datetime import datetime, timezone, timedelta

from database import incidents_table, IncidentQuery
from models import (
    IncidentCategory,
    IncidentStatus,
    IncidentOrigin,
)

# ─── Configuración ───

TARGET_INCIDENTS = 500  # Objetivo de registros de incidencias

# ─── Datos base para generación ───

BRANCHES = [
    "Los Ángeles",
    "Zaragoza",
    "central",
    "Miami",
    "Madrid",
    "Barcelona",
    "Houston",
    "Chicago",
]

CATEGORIES = [c.value for c in IncidentCategory]
STATUSES = [s.value for s in IncidentStatus]
ORIGINS = [o.value for o in IncidentOrigin]

TITLE_TEMPLATES = [
    "Retraso en entrega #{ref}",
    "Producto dañado en almacén #{ref}",
    "Devolución incorrecta de pedido #{ref}",
    "Error de picking en línea #{ref}",
    "Problema de inventario #{ref}",
    "Incidente de seguridad #{ref}",
    "Falla en transportista #{ref}",
    "Reclamación de cliente #{ref}",
    "Daño por manejo indebido #{ref}",
    "Falta de stock temporal #{ref}",
]

DESCRIPTIONS = [
    "El cliente reporta que el paquete llegó con 3 días de retraso respecto a la fecha estimada.",
    "Se detectó un producto con daño físico al momento de la inspección en receiving.",
    "El cliente devolvió un item que no corresponde al pedido original.",
    "Se registró un error de picking que resultó en envío de producto equivocado.",
    "El sistema reporta discrepancia entre stock físico y virtual.",
    "Se identificó un intento de acceso no autorizado al sistema de gestión.",
    "El transportista reportó un accidente en ruta que afectó 12 paquetes.",
    "El cliente solicita reembolso por producto que no recibió.",
    "El producto llegó con embalaje comprometido y contenido dañado.",
    "El almacén se quedó sin stock del SKU más vendido durante 6 horas.",
]


def _generate_incidents(n: int, start_id: int = 0) -> list[dict]:
    """Genera n registros de incidencias con datos pseudo-aleatorios."""
    now = datetime.now(timezone.utc)
    docs = []

    for i in range(n):
        ref = start_id + i + 1
        # Fechas distribuidas en los últimos 90 días
        days_ago = random.randint(0, 90)
        hours_ago = random.randint(0, 23)
        created = now - timedelta(days=days_ago, hours=hours_ago)

        # Distribución ponderada de estados (realista: más open/resolved que discarded)
        status_weights = [0.30, 0.25, 0.35, 0.10]  # open, in_progress, resolved, discarded
        status = random.choices(STATUSES, weights=status_weights, k=1)[0]

        doc = {
            "id": f"seed-{ref:05d}",
            "title": random.choice(TITLE_TEMPLATES).format(ref=ref),
            "description": random.choice(DESCRIPTIONS),
            "category": random.choice(CATEGORIES),
            "status": status,
            "origin": random.choice(ORIGINS),
            "branch": random.choice(BRANCHES),
            "created_at": created.isoformat(),
            "updated_at": created.isoformat(),
            "origin_ref": f"seed-{ref:05d}",
        }
        docs.append(doc)

    return docs


def seed_incidents():
    """Inserta incidencias hasta alcanzar TARGET_INCIDENTS."""
    existing = incidents_table.all()
    current_count = len(existing)

    if current_count >= TARGET_INCIDENTS:
        print(f"ℹ️  Ya existen {current_count} incidencias (>= {TARGET_INCIDENTS}). Seed omitido.")
        return

    to_insert = TARGET_INCIDENTS - current_count
    docs = _generate_incidents(to_insert, start_id=current_count)

    for doc in docs:
        incidents_table.insert(doc)

    final_count = len(incidents_table)
    print(f"✅ Seed de incidencias completado.")
    print(f"   Insertadas: {to_insert} nuevas incidencias.")
    print(f"   Total en base de datos: {final_count}")


if __name__ == "__main__":
    seed_incidents()
