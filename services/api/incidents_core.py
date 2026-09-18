"""
incidents_core.py — Lógica compartida de validación y métricas de incidencias.

Usada por:
  - scripts/analyze.py   (via import desde el path)
  - services/api/routes/incidents.py (via import directo)

Alineado con CONTEXT.es.md de TrackFlow.
"""

from __future__ import annotations

from collections import Counter
from typing import Any

# ═══════════════════════════════════════════════════════════
# Dominio — Valores esperados (alineados con CONTEXT.es.md)
# ═══════════════════════════════════════════════════════════

CATEGORIAS_VALIDAS: set[str] = {
    "Retraso en entrega",
    "Producto dañado",
    "Devolución incorrecta",
    "Error de picking",
    "Problema de inventario",
}

ESTADOS_VALIDOS: set[str] = {"abierto", "cerrado", "descartado"}

PROVEEDORES_VALIDOS: set[str] = {
    "UPS", "FedEx", "DHL", "MRW", "SEUR",
    "DHL España", "Correos Express", "USPS",
}

PUNTUACION_MIN = 1
PUNTUACION_MAX = 5

COLUMNAS_REQUERIDAS: list[str] = [
    "id_incidencia",
    "categoria",
    "estado",
    "puntuacion_satisfaccion",
    "proveedor",
    "fecha_apertura",
]


# ═══════════════════════════════════════════════════════════
# Validación
# ═══════════════════════════════════════════════════════════


def validar_fila(fila: dict[str, str]) -> list[str]:
    """
    Valida una fila del CSV. Retorna lista de errores (vacía si es válida).
    """
    errores: list[str] = []

    # ── Campos obligatorios no vacíos ──
    for col in COLUMNAS_REQUERIDAS:
        valor = fila.get(col, "").strip()
        if not valor:
            errores.append(f"Campo faltante: '{col}'")

    # Si faltan campos clave, no podemos validar el resto
    categoria = fila.get("categoria", "").strip()
    estado = fila.get("estado", "").strip()
    punt_str = fila.get("puntuacion_satisfaccion", "").strip()
    proveedor = fila.get("proveedor", "").strip()

    if not categoria and not estado and not punt_str and not proveedor:
        return errores

    # ── Categoría ──
    if categoria and categoria not in CATEGORIAS_VALIDAS:
        errores.append(
            f"Categoría inválida: '{categoria}' — "
            f"esperada: {', '.join(sorted(CATEGORIAS_VALIDAS))}"
        )

    # ── Estado ──
    if estado and estado not in ESTADOS_VALIDOS:
        errores.append(
            f"Estado inválido: '{estado}' — "
            f"esperado: {', '.join(sorted(ESTADOS_VALIDOS))}"
        )

    # ── Puntuación (si tiene valor) ──
    if punt_str:
        try:
            punt = float(punt_str)
            if punt < PUNTUACION_MIN or punt > PUNTUACION_MAX:
                errores.append(
                    f"Puntuación fuera de rango: {punt} — "
                    f"debe estar entre {PUNTUACION_MIN} y {PUNTUACION_MAX}"
                )
            elif punt != int(punt):
                errores.append(f"Puntuación no entera: {punt}")
        except ValueError:
            errores.append(f"Puntuación no numérica: '{punt_str}'")

    # ── Proveedor ──
    if proveedor and proveedor not in PROVEEDORES_VALIDOS:
        errores.append(
            f"Proveedor inválido: '{proveedor}' — "
            f"esperado: {', '.join(sorted(PROVEEDORES_VALIDOS))}"
        )

    return errores


# ═══════════════════════════════════════════════════════════
# Métricas
# ═══════════════════════════════════════════════════════════


def calcular_metricas(
    filas_validas: list[dict[str, str]],
) -> dict[str, Any]:
    """Calcula métricas sobre las filas válidas."""
    total_validos = len(filas_validas)

    # ── Por categoría ──
    cat_counter: Counter[str] = Counter()
    for f in filas_validas:
        cat_counter[f["categoria"].strip()] += 1

    # ── Por estado ──
    est_counter: Counter[str] = Counter()
    for f in filas_validas:
        est_counter[f["estado"].strip()] += 1

    # ── Índice de satisfacción (solo cerrados con puntuación) ──
    puntuaciones: list[float] = []
    for f in filas_validas:
        if f["estado"].strip() == "cerrado":
            punt_str = f.get("puntuacion_satisfaccion", "").strip()
            if punt_str:
                try:
                    puntuaciones.append(float(punt_str))
                except ValueError:
                    pass

    satisfaccion_media = (
        round(sum(puntuaciones) / len(puntuaciones), 2) if puntuaciones else None
    )

    return {
        "total_validos": total_validos,
        "total_invalidos": 0,  # se asigna externamente
        "categorias": dict(cat_counter.most_common()),
        "estados": dict(est_counter.most_common()),
        "total_cerrados_con_puntuacion": len(puntuaciones),
        "satisfaccion_media": satisfaccion_media,
    }