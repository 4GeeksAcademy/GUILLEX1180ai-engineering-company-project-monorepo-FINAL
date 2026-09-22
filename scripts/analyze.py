#!/usr/bin/env python3
"""
analyze.py — Análisis de incidencias de TrackFlow.

Lee un fichero CSV con incidencias logísticas, detecta registros inválidos,
calcula métricas sobre los válidos y ofrece exportación opcional a CSV.

Uso:
    python analyze.py incidents-TrackFlow.csv

La lógica de validación y métricas se importa desde services/api/incidents_core.py
para garantizar DRY (mismo código en script y API).
"""

from __future__ import annotations

import csv
import os
import sys
from collections import Counter
from typing import Any

# ─── Lógica compartida (DRY) ────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "services", "api"))
from incidents_core import (  # noqa: E402
    COLUMNAS_REQUERIDAS,
    validar_fila,
    calcular_metricas,
)


# ═══════════════════════════════════════════════════════════
# Reporte por consola
# ═══════════════════════════════════════════════════════════


def imprimir_reporte(
    metricas: dict[str, Any],
    total_invalidos: int,
    errores_por_tipo: Counter[str],
    total_filas: int,
) -> None:
    """Imprime el resumen formateado en consola."""
    sep = "═" * 56
    sub = "─" * 56

    print()
    print(sep)
    print("   T R A C K F L O W   —   A N Á L I S I S   D E   I N C I D E N C I A S")
    print(sep)

    # ── Totales ──
    print()
    print(f"  📊  Total de registros procesados:  {total_filas}")
    print(f"  ✅  Registros válidos:              {metricas['total_validos']}")
    print(f"  ❌  Registros inválidos:            {total_invalidos}")
    print(sub)

    # ── Errores por tipo ──
    if total_invalidos > 0:
        print()
        print("  ⚠️   DETALLE DE REGISTROS INVÁLIDOS")
        print(sub)
        for error, cantidad in errores_por_tipo.most_common():
            print(f"  • {error}: {cantidad}")
        print(sub)

    # ── Por categoría ──
    print()
    print("  📦  INCIDENCIAS POR CATEGORÍA")
    print(sub)
    for cat, count in metricas["categorias"].items():
        pct = count / metricas["total_validos"] * 100
        print(f"  {cat:<30s}  {count:3d}  ({pct:5.1f}%)")

    # ── Por estado ──
    print()
    print("  🔵  INCIDENCIAS POR ESTADO")
    print(sub)
    for est, count in metricas["estados"].items():
        pct = count / metricas["total_validos"] * 100
        print(f"  {est:<30s}  {count:3d}  ({pct:5.1f}%)")

    # ── Satisfacción ──
    print()
    print("  ⭐  ÍNDICE DE SATISFACCIÓN (solo cerrados con puntuación)")
    print(sub)
    if metricas["satisfaccion_media"] is not None:
        print(
            f"  Media: {metricas['satisfaccion_media']:.2f}"
            f"  (basada en {metricas['total_cerrados_con_puntuacion']} registros)"
        )
    else:
        print("  No hay datos suficientes para calcular.")
    print(sub)
    print()


# ═══════════════════════════════════════════════════════════
# Exportación CSV
# ═══════════════════════════════════════════════════════════


def exportar_csv(
    metricas: dict[str, Any],
    total_invalidos: int,
    errores_por_tipo: Counter[str],
    total_filas: int,
    ruta_salida: str = "results.csv",
) -> bool:
    """Exporta las métricas a un CSV (una fila por métrica).

    Returns:
        True si la exportación fue exitosa, False en caso de error.
    """
    import csv as csv_mod

    try:
        with open(ruta_salida, "w", newline="", encoding="utf-8") as f:
            writer = csv_mod.writer(f)
            writer.writerow(["metrica", "valor"])

            writer.writerow(["total_registros", total_filas])
            writer.writerow(["registros_validos", metricas["total_validos"]])
            writer.writerow(["registros_invalidos", total_invalidos])

            for error, cantidad in errores_por_tipo.most_common():
                writer.writerow([f"invalido_{error}", cantidad])

            for cat, count in metricas["categorias"].items():
                writer.writerow([f"categoria_{cat}", count])

            for est, count in metricas["estados"].items():
                writer.writerow([f"estado_{est}", count])

            writer.writerow([
                "satisfaccion_media",
                f"{metricas['satisfaccion_media']:.2f}" if metricas["satisfaccion_media"] is not None else "",
            ])
            writer.writerow([
                "total_cerrados_con_puntuacion",
                metricas["total_cerrados_con_puntuacion"],
            ])

        print(f"  💾  Resultados exportados a: {ruta_salida}")
        print()
        return True
    except OSError as e:
        print(f"  ❌  Error al escribir el archivo '{ruta_salida}': {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"  ❌  Error inesperado al exportar CSV: {e}", file=sys.stderr)
        return False


# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════


def main() -> None:
    # ── Argumento CLI ──
    if len(sys.argv) < 2:
        print("Uso: python analyze.py <archivo.csv>", file=sys.stderr)
        sys.exit(1)

    ruta_csv = sys.argv[1]

    if not os.path.isfile(ruta_csv):
        print(f"Error: No se encuentra el archivo '{ruta_csv}'", file=sys.stderr)
        sys.exit(1)

    # ── Carga con manejo de errores ──
    try:
        with open(ruta_csv, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            # Validar columnas
            if not reader.fieldnames:
                print("Error: El archivo CSV está vacío o no tiene cabeceras.", file=sys.stderr)
                sys.exit(1)

            columnas_faltantes = [c for c in COLUMNAS_REQUERIDAS if c not in reader.fieldnames]
            if columnas_faltantes:
                print(
                    f"Error: Faltan columnas requeridas: {', '.join(columnas_faltantes)}",
                    file=sys.stderr,
                )
                sys.exit(1)

            filas = list(reader)
    except UnicodeDecodeError:
        print("Error: El archivo no está codificado en UTF-8.", file=sys.stderr)
        sys.exit(1)
    except csv.Error as e:
        print(f"Error: Error al parsear el archivo CSV: {e}", file=sys.stderr)
        sys.exit(1)
    except OSError as e:
        print(f"Error: No se pudo leer el archivo '{ruta_csv}': {e}", file=sys.stderr)
        sys.exit(1)

    if not filas:
        print("Error: El archivo CSV no contiene datos.", file=sys.stderr)
        sys.exit(1)

    # ── Validación ──
    validas: list[dict[str, str]] = []
    invalidas: list[tuple[int, list[str]]] = []  # (num_fila, errores)
    errores_por_tipo: Counter[str] = Counter()

    for idx, fila in enumerate(filas, start=2):  # +2 por header y 0-index
        errores = validar_fila(fila)
        if errores:
            invalidas.append((idx, errores))
            for err in errores:
                # Extraer tipo de error (antes del primer ":")
                tipo_error = err.split(":")[0].strip()
                errores_por_tipo[tipo_error] += 1
        else:
            validas.append(fila)

    total_filas = len(filas)
    total_invalidos = len(invalidas)

    # ── Métricas ──
    metricas = calcular_metricas(validas)
    metricas["total_invalidos"] = total_invalidos

    # ── Reporte ──
    imprimir_reporte(metricas, total_invalidos, errores_por_tipo, total_filas)

    # ── Exportación interactiva ──
    try:
        respuesta = input("  ¿Deseas exportar los resultados a CSV? [s / n]: ").strip().lower()
        if respuesta == "s":
            if not exportar_csv(metricas, total_invalidos, errores_por_tipo, total_filas):
                sys.exit(1)
        else:
            print("  Exportación omitida.")
    except (EOFError, KeyboardInterrupt):
        print()
        print("  Exportación omitida.")


if __name__ == "__main__":
    main()