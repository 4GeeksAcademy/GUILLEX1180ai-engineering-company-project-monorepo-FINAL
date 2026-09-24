#!/usr/bin/env python3
"""
seed_incidents.py — Población de la base de datos de incidencias (TrackFlow).

Lee el fichero CSV histórico (esquema antiguo) y convierte cada registro al
nuevo modelo `Incident` del backend FastAPI (services/api), insertándolos en
la misma base TinyDB que usa la API.

Características
---------------
1. **Transformación de esquema**:
   - `id_incidencia` → se conserva como `origin_ref` (identificador único de
     origen, usado para idempotencia).
   - `categoria`       → `category` (mapeado al enum `IncidentCategory`).
   - `estado`          → `status` (mapeo abierto→open, cerrado→resolved,
     descartado→discarded, definido según CONTEXT.es.md).
   - `proveedor`       → `branch` (carrier/sede asociada; "central" si vacío).
   - `fecha_apertura`  → `created_at` (marca de tiempo histórica preservada).
   - Todos los registros se importan con `origin = "customer"`.

2. **Reutilización y validación**:
   - Se construye un `IncidentCreate` (Pydantic) por registro: los que no
     superen la validación NO se insertan y se acumulan con su motivo.

3. **Idempotencia**:
   - Antes de insertar se comprueba si ya existe un incidente con el mismo
     `origin_ref` (id_incidencia). Si existe, se omite (skipped).

4. **Persistencia**:
   - Usa la misma configuración TinyDB de la API (database.py + incidents_db.py).

Uso
---
    python scripts/seed_incidents.py
    python scripts/seed_incidents.py --csv scripts/incidents-TrackFlow.csv
    python scripts/seed_incidents.py --dry-run     # simula sin insertar
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

# ─── Permitir importar la lógica compartida de la API (DRY) ───
# Añade services/api al path para importar models, incidents_db y database.
SCRIPT_DIR = Path(__file__).resolve().parent
API_DIR = SCRIPT_DIR.parent / "services" / "api"
SHARED_DIR = SCRIPT_DIR.parent / "packages" / "shared"
sys.path.insert(0, str(API_DIR))
sys.path.insert(0, str(SHARED_DIR))

from models import (  # noqa: E402
    IncidentCreate,
    IncidentOrigin,
)
from database import incidents_table  # noqa: E402  (config de persistencia)
from incidents_db import (  # noqa: E402
    create_incident,
    get_incident_by_origin_ref,
)
# Validación compartida — única fuente de verdad para el dominio Incident
from incident_validation import (  # noqa: E402
    ESTADO_MAP,
    CATEGORIA_MAP,
    CATEGORIAS_VALIDAS,
)

# ═══════════════════════════════════════════════════════════
# Configuración
# ═══════════════════════════════════════════════════════════

DEFAULT_CSV = SCRIPT_DIR / "incidents-TrackFlow.csv"


def transformar_fila(fila: dict[str, str]) -> IncidentCreate:
    """Convierte una fila del CSV histórico en un `IncidentCreate` válido.

    Aplica las reglas de negocio documentadas en el contexto:

    - Origen siempre `customer` (incidencias históricas reportadas por clientes).
    - `proveedor` se usa como `branch` (sede/carrier); "central" si va vacío.
    - `title`/`description` se derivan de la categoría y del proveedor, ya
      que el CSV antiguo no las tenía.

    Nota: `origin_ref` y `created_at` (id_incidencia / fecha_apertura) los
    gestiona `ejecutar_seed()` directamente desde la fila CSV, para no inyectar
    atributos dinámicos en el modelo Pydantic.

    Args:
        fila: Fila del `csv.DictReader`.

    Returns:
        `IncidentCreate` validado por Pydantic.

    Raises:
        KeyError: si faltan columnas requeridas del CSV.
        ValueError: si el estado o la categoría no se pueden mapear.
    """
    id_incidencia = fila["id_incidencia"].strip()
    categoria_raw = fila["categoria"].strip()
    estado_raw = fila["estado"].strip()
    proveedor = fila["proveedor"].strip()

    # ── Conversión de estado (abierto/cerrado/descartado) ──
    if estado_raw not in ESTADO_MAP:
        raise ValueError(
            f"Estado '{estado_raw}' no mapeado: "
            f"se esperaba uno de {sorted(ESTADO_MAP)}"
        )
    status = ESTADO_MAP[estado_raw]

    # ── Conversión de categoría ──
    if categoria_raw not in CATEGORIA_MAP:
        raise ValueError(
            f"Categoría '{categoria_raw}' inválida: "
            f"esperada una de {sorted(CATEGORIA_MAP)}"
        )
    category = CATEGORIA_MAP[categoria_raw]

    # ── Branch: el CSV no tiene columna de ubicación; se usa el carrier
    #    como sede asociada, o "central" si está vacío. ──
    branch = proveedor if proveedor else "central"

    # ── title / description derivados del esquema antiguo ──
    # El CSV no incluía descripciones detalladas: se construyen a partir del
    # identificador original, la categoría y el carrier implicado.
    title = f"Incidencia: {category.value}"
    description = (
        f"Incidencia histórica #{id_incidencia} registrada en el CSV de "
        f"TrackFlow. Categoría: {category.value}. Carrier asociado: "
        f"{proveedor or 'sin asignar'}."
    )

    return IncidentCreate(
        title=title,
        description=description,
        category=category,
        status=status,
        origin=IncidentOrigin.CUSTOMER,  # regla de negocio del contexto
        branch=branch,
    )


def _normalizar_fecha_apertura(fecha_apertura: str) -> str | None:
    """Normaliza `fecha_apertura` (YYYY-MM-DD) a ISO 8601 con UTC.

    Args:
        fecha_apertura: Valor en bruto de la columna del CSV.

    Returns:
        String ISO 8601 con sufijo UTC, o None si está vacío.
    """
    fecha_apertura = fecha_apertura.strip()
    if not fecha_apertura:
        return None

    try:
        fecha = datetime.fromisoformat(fecha_apertura)
    except ValueError:
        raise ValueError(f"Fecha de apertura inválida: '{fecha_apertura}'")

    # Si no trae zona horaria, asumimos UTC (las fechas del CSV son fechas simples).
    if fecha.tzinfo is None:
        return fecha.isoformat() + "+00:00"
    return fecha.isoformat()


# ═══════════════════════════════════════════════════════════
# Lógica principal
# ═══════════════════════════════════════════════════════════


def ejecutar_seed(
    ruta_csv: Path,
    dry_run: bool = False,
) -> dict[str, Any]:
    """Procesa el CSV e inserta los registros válidos en TinyDB.

    Args:
        ruta_csv: Ruta al fichero CSV histórico.
        dry_run: Si True, no persiste nada (solo simula y reporta).

    Returns:
        Diccionario con el resumen de la operación.
    """
    if not ruta_csv.exists():
        raise FileNotFoundError(f"No existe el CSV: {ruta_csv}")

    # ── Lectura con soporte BOM (utf-8-sig) ──
    with open(ruta_csv, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        filas = list(reader)
        columnas = reader.fieldnames or []

    total = len(filas)
    insertados = 0
    omitidos_existentes = 0
    descartados: list[tuple[int, str, list[str]]] = []  # (nº_fila, id, errores)

    errores_por_tipo: Counter[str] = Counter()

    for num_fila, fila in enumerate(filas, start=2):  # 1 = cabecera
        id_incidencia = fila.get("id_incidencia", "").strip()

        # ── 1. Transformación + validación Pydantic ──
        try:
            incidente = transformar_fila(fila)
        except (ValueError, KeyError) as e:
            errores_por_tipo[type(e).__name__] += 1
            descartados.append((num_fila, id_incidencia, [str(e)]))
            continue

        # ── 1b. Normalizar fecha de apertura (created_at histórico) ──
        try:
            created_at = _normalizar_fecha_apertura(fila.get("fecha_apertura", ""))
        except ValueError as e:
            errores_por_tipo["ValueError"] += 1
            descartados.append((num_fila, id_incidencia, [str(e)]))
            continue

        # ── 2. Idempotencia: comprobar si ya existe por origin_ref ──
        #    `origin_ref` = `id_incidencia` del CSV original, identificador
        #    único que evita duplicados si el script se ejecuta varias veces.
        if id_incidencia:
            existente = get_incident_by_origin_ref(id_incidencia)
            if existente is not None:
                omitidos_existentes += 1
                continue

        # ── 3. Persistencia (o simulación en dry-run) ──
        if not dry_run:
            create_incident(
                incidente,
                origin_ref=id_incidencia or None,
                created_at=created_at,
            )
        insertados += 1

    return {
        "total_csv": total,
        "insertados": insertados,
        "ya_existentes": omitidos_existentes,
        "descartados": descartados,
        "errores_por_tipo": errores_por_tipo,
        "dry_run": dry_run,
    }


# ═══════════════════════════════════════════════════════════
# Reporte por consola
# ═══════════════════════════════════════════════════════════


def imprimir_reporte(resultado: dict[str, Any]) -> None:
    """Imprime un resumen claro y accionable del seed."""
    sep = "═" * 60
    sub = "─" * 60

    print()
    print(sep)
    print("   T R A C K F L O W   —   S E E D   D E   I N C I D E N C I A S")
    print(sep)
    if resultado["dry_run"]:
        print("   (modo DRY-RUN: no se escribió en la base de datos)")
        print(sep)

    print()
    print(f"  📄  Registros leídos del CSV:   {resultado['total_csv']}")
    print(f"  ✅  Insertados:                 {resultado['insertados']}")
    print(f"  ⏭️   Omitidos (ya existentes):   {resultado['ya_existentes']}")
    print(f"  ❌  Descartados por validación: {len(resultado['descartados'])}")
    print(sub)

    # ── Errores por tipo ──
    if resultado["errores_por_tipo"]:
        print()
        print("  ⚠️   ERRORES DE TRANSFORMACIÓN / VALIDACIÓN POR TIPO")
        print(sub)
        for tipo, cantidad in resultado["errores_por_tipo"].most_common():
            print(f"  • {tipo}: {cantidad}")

    # ── Detalle de filas descartadas ──
    if resultado["descartados"]:
        print()
        print("  ⚠️   DETALLE DE REGISTROS DESCARTADOS")
        print(sub)
        for num_fila, id_incidencia, errores in resultado["descartados"]:
            print(f"  • Fila {num_fila} (id={id_incidencia or '?'}):")
            for err in errores:
                print(f"      → {err}")
    print(sub)
    print()


def main() -> None:
    """Punto de entrada del script."""
    parser = argparse.ArgumentParser(
        description="Poblar la BD de incidencias desde el CSV histórico.",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=DEFAULT_CSV,
        help=f"Ruta al CSV histórico (por defecto: {DEFAULT_CSV})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simula la carga sin escribir en la base de datos.",
    )
    args = parser.parse_args()

    try:
        resultado = ejecutar_seed(ruta_csv=args.csv, dry_run=args.dry_run)
    except FileNotFoundError as e:
        print(f"❌ {e}", file=sys.stderr)
        sys.exit(1)

    imprimir_reporte(resultado)

    # Código de salida distinto de 0 si hubo descartes, para alertar en CI.
    if resultado["descartados"]:
        sys.exit(2)


if __name__ == "__main__":
    main()