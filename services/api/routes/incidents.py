"""Router de análisis de incidencias (TrackFlow).

Endpoints:
- POST /api/incidents/analyze  — Analiza un CSV subido como multipart/form-data
- GET  /api/incidents/results/export  — Descarga el último resultado como CSV

La lógica de validación y métricas se importa desde incidents_core.py
para garantizar DRY con scripts/analyze.py.
"""

from __future__ import annotations

import csv
import io
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from incidents_core import (
    COLUMNAS_REQUERIDAS,
    validar_fila,
    calcular_metricas,
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])

# ─── Almacén en memoria del último análisis ───
_last_analysis: dict[str, Any] | None = None


# ═══════════════════════════════════════════════════════════
# Modelos de respuesta
# ═══════════════════════════════════════════════════════════


class ErrorDetail(BaseModel):
    tipo: str
    cantidad: int


class AnalisisResponse(BaseModel):
    total_registros: int
    registros_validos: int
    registros_invalidos: int
    errores_por_tipo: list[ErrorDetail]
    categorias: dict[str, int]
    estados: dict[str, int]
    satisfaccion_media: Optional[float] = None
    total_cerrados_con_puntuacion: int
    analizado_en: str


# ═══════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════


@router.post("/analyze", response_model=AnalisisResponse)
async def analyze_incidents(file: UploadFile = File(...)):
    """Analiza un CSV de incidencias subido como multipart/form-data."""
    global _last_analysis
    # Validar que sea CSV
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=422,
            detail="El archivo debe tener extensión .csv",
        )

    # Leer contenido
    raw = await file.read()
    if not raw or len(raw.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="El archivo CSV está vacío",
        )

    try:
        text = raw.decode("utf-8-sig")  # soporta BOM
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=422,
            detail="El archivo no está codificado en UTF-8",
        )

    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        raise HTTPException(
            status_code=422,
            detail="El archivo CSV no tiene cabeceras válidas",
        )

    columnas_faltantes = [c for c in COLUMNAS_REQUERIDAS if c not in reader.fieldnames]
    if columnas_faltantes:
        raise HTTPException(
            status_code=422,
            detail=f"Faltan columnas requeridas: {', '.join(columnas_faltantes)}",
        )

    filas = list(reader)
    if not filas:
        raise HTTPException(
            status_code=400,
            detail="El archivo CSV no contiene datos",
        )

    # Validar
    validas: list[dict[str, str]] = []
    errores_por_tipo: Counter[str] = Counter()

    for fila in filas:
        errores = validar_fila(fila)
        if errores:
            for err in errores:
                tipo_error = err.split(":")[0].strip()
                errores_por_tipo[tipo_error] += 1
        else:
            validas.append(fila)

    # Calcular métricas
    metricas_raw = calcular_metricas(validas)

    now = datetime.now(timezone.utc).isoformat()

    result = AnalisisResponse(
        total_registros=len(filas),
        registros_validos=len(validas),
        registros_invalidos=len(filas) - len(validas),
        errores_por_tipo=[
            ErrorDetail(tipo=t, cantidad=c)
            for t, c in errores_por_tipo.most_common()
        ],
        categorias=metricas_raw["categorias"],
        estados=metricas_raw["estados"],
        satisfaccion_media=metricas_raw["satisfaccion_media"],
        total_cerrados_con_puntuacion=metricas_raw["total_cerrados_con_puntuacion"],
        analizado_en=now,
    )

    # Guardar en memoria para exportación
    _last_analysis = {
        "result": result,
        "metricas": metricas_raw,
        "errores_por_tipo": errores_por_tipo,
        "total_filas": len(filas),
        "total_invalidos": len(filas) - len(validas),
    }

    return result


@router.get("/results/export")
async def export_results():
    """Descarga el último análisis en formato CSV."""
    if _last_analysis is None:
        raise HTTPException(
            status_code=404,
            detail="No hay análisis previo. Ejecuta POST /incidents/analyze primero.",
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["metrica", "valor"])

    r = _last_analysis["result"]
    writer.writerow(["total_registros", r.total_registros])
    writer.writerow(["registros_validos", r.registros_validos])
    writer.writerow(["registros_invalidos", r.registros_invalidos])

    for err in r.errores_por_tipo:
        writer.writerow([f"invalido_{err.tipo}", err.cantidad])

    for cat, count in r.categorias.items():
        writer.writerow([f"categoria_{cat}", count])

    for est, count in r.estados.items():
        writer.writerow([f"estado_{est}", count])

    writer.writerow([
        "satisfaccion_media",
        f"{r.satisfaccion_media:.2f}" if r.satisfaccion_media is not None else "",
    ])
    writer.writerow(["total_cerrados_con_puntuacion", r.total_cerrados_con_puntuacion])
    writer.writerow(["analizado_en", r.analizado_en])

    return PlainTextResponse(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=results.csv",
        },
    )