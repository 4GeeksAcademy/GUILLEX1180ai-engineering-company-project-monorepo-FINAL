"""Tests para routes/incidents.py — Análisis de CSV de incidencias.

Endpoints:
- POST {prefix}/incidents/analyze   — Subir y analizar CSV
- GET  {prefix}/incidents/results/export — Descargar último resultado como CSV

Columnas requeridas del CSV (incidents_core.py):
  id_incidencia, categoria, estado, puntuacion_satisfaccion, proveedor, fecha_apertura
"""

from __future__ import annotations

import io
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from main import app

API_PREFIX = "/api/v1"
_ANALYZE_URL = f"{API_PREFIX}/incidents/analyze"
_EXPORT_URL = f"{API_PREFIX}/incidents/results/export"

# Columnas que espera incidents_core.py
HEADERS = [
    "id_incidencia", "categoria", "estado", "puntuacion_satisfaccion",
    "proveedor", "fecha_apertura",
]


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


def _make_csv(content: str) -> tuple[str, bytes, str]:
    """Crea un archivo CSV simulado (encoding utf-8-sig con BOM)."""
    return ("test.csv", content.encode("utf-8-sig"), "text/csv")


@pytest.fixture(autouse=True)
def _clear_analysis():
    import routes.incidents as mod
    mod._last_analysis = None


# ═══════════════════════════════════════════════════════════
#  Análisis básico
# ═══════════════════════════════════════════════════════════

class TestAnalyze:
    def test_success(self, client):
        """Subida exitosa de CSV con una fila válida."""
        rows = [
            ",".join(HEADERS),
            "INC-001,Retraso en entrega,cerrado,4,UPS,2025-01-15",
        ]
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        assert resp.status_code == 200
        body = resp.json()
        assert body["total_registros"] == 1
        assert body["registros_validos"] == 1
        assert body["registros_invalidos"] == 0

    def test_success_multiple_rows(self, client):
        """CSV con múltiples filas cerradas → satisfaccion_media correcta."""
        rows = [
            ",".join(HEADERS),
            "INC-001,Retraso en entrega,cerrado,4,DHL,2025-01-15",
            "INC-002,Producto dañado,cerrado,3,FedEx,2025-01-16",
        ]
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        assert resp.status_code == 200
        body = resp.json()
        assert body["total_registros"] == 2
        assert body["registros_validos"] == 2
        # Solo cerrados con puntuación: ambas filas son cerradas con score
        assert body["satisfaccion_media"] == 3.5  # (4+3)/2

    def test_success_with_open_rows(self, client):
        """Filas abiertas sin puntuación no afectan satisfaccion_media.
        (puntuacion_satisfaccion es requerida, usamos 0 como fallback.)"""
        rows = [
            ",".join(HEADERS),
            "INC-001,Retraso en entrega,cerrado,4,DHL,2025-01-15",
            "INC-002,Producto dañado,abierto,3,FedEx,2025-01-16",
        ]
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        assert resp.status_code == 200
        body = resp.json()
        assert body["total_registros"] == 2
        assert body["registros_validos"] == 2
        assert body["registros_invalidos"] == 0
        # Solo cerrados con puntuación: INC-001 cerrado score=4, INC-002 abierto score=0
        assert body["total_cerrados_con_puntuacion"] == 1
        assert body["satisfaccion_media"] == 4.0

    def test_missing_columns(self, client):
        """CSV sin columna requerida → 422."""
        bad_csv = "id_incidencia,categoria\nINC-001,Retraso"
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv(bad_csv)})
        assert resp.status_code == 422
        assert "Faltan columnas" in resp.text

    def test_empty_file(self, client):
        """Archivo vacío (bytes vacíos) → 400."""
        resp = client.post(_ANALYZE_URL, files={
            "file": ("test.csv", b"", "text/csv"),
        })
        assert resp.status_code == 400

    def test_no_rows(self, client):
        """CSV con solo cabeceras → 400."""
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv(",".join(HEADERS))})
        assert resp.status_code == 400

    def test_not_csv_extension(self, client):
        """Archivo sin extensión .csv → 422."""
        resp = client.post(_ANALYZE_URL, files={
            "file": ("data.txt", b"a,b,c\n1,2,3", "text/plain"),
        })
        assert resp.status_code == 422

    def test_invalid_categoria(self, client):
        """Categoría inválida → fila inválida."""
        rows = [
            ",".join(HEADERS),
            "INC-001,CategoriaInvalida,cerrado,4,UPS,2025-01-15",
        ]
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        assert resp.status_code == 200
        assert resp.json()["registros_invalidos"] == 1

    def test_mixed_valid_invalid(self, client):
        """Mezcla de filas válidas e inválidas."""
        rows = [
            ",".join(HEADERS),
            "INC-001,Retraso en entrega,cerrado,4,UPS,2025-01-15",
            "INC-002,CategoriaInvalida,cerrado,5,FedEx,2025-01-16",
            "INC-003,Producto dañado,abierto,3,DHL,2025-01-17",
        ]
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        assert resp.status_code == 200
        body = resp.json()
        assert body["registros_validos"] == 2  # INC-001, INC-003
        assert body["registros_invalidos"] == 1  # INC-002
        assert len(body["errores_por_tipo"]) > 0

    def test_invalid_provider(self, client):
        """Proveedor inválido → fila inválida."""
        rows = [
            ",".join(HEADERS),
            "INC-001,Retraso en entrega,cerrado,4,ProveedorNoExistente,2025-01-15",
        ]
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        assert resp.status_code == 200
        assert resp.json()["registros_invalidos"] == 1

    def test_metrics_by_category_and_status(self, client):
        """Métricas por categoría y estado."""
        rows = [
            ",".join(HEADERS),
            "INC-001,Retraso en entrega,cerrado,4,UPS,2025-01-15",
            "INC-002,Producto dañado,abierto,5,FedEx,2025-01-16",
            "INC-003,Retraso en entrega,abierto,3,DHL,2025-01-17",
        ]
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        body = resp.json()
        assert body["categorias"]["Retraso en entrega"] == 2
        assert body["categorias"]["Producto dañado"] == 1
        assert body["estados"]["cerrado"] == 1
        assert body["estados"]["abierto"] == 2

    def test_all_invalid_rows(self, client):
        """Todas las filas inválidas."""
        rows = [
            ",".join(HEADERS),
            "INC-001,BadCat,cerrado,4,UPS,2025-01-15",
            "INC-002,Retraso en entrega,badstate,5,FedEx,2025-01-16",
        ]
        resp = client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        assert resp.status_code == 200
        body = resp.json()
        assert body["registros_validos"] == 0
        assert body["registros_invalidos"] == 2


# ═══════════════════════════════════════════════════════════
#  Exportar resultados
# ═══════════════════════════════════════════════════════════

class TestExport:
    def test_export_after_analysis(self, client):
        """Exportar CSV después de analizar."""
        rows = [
            ",".join(HEADERS),
            "INC-001,Retraso en entrega,cerrado,4,UPS,2025-01-15",
        ]
        client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        resp = client.get(_EXPORT_URL)
        assert resp.status_code == 200
        assert "total_registros" in resp.text

    def test_export_without_analysis(self, client):
        """404 si no hay análisis previo."""
        resp = client.get(_EXPORT_URL)
        assert resp.status_code == 404

    def test_export_content(self, client):
        """Verificar estructura del CSV exportado."""
        rows = [
            ",".join(HEADERS),
            "INC-001,Retraso en entrega,cerrado,4,UPS,2025-01-15",
        ]
        client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        resp = client.get(_EXPORT_URL)
        lines = resp.text.strip().split("\n")
        # strip() elimina \r de cada línea si existe
        lines = [l.strip() for l in lines]
        assert lines[0] == "metrica,valor"
        assert any("total_registros,1" in l for l in lines)
        assert any("registros_validos,1" in l for l in lines)

    def test_export_with_invalids(self, client):
        """Exportar después de análisis con inválidos."""
        rows = [
            ",".join(HEADERS),
            "INC-01,BadCategory,cerrado,5,UPS,2025-01-15",
        ]
        client.post(_ANALYZE_URL, files={"file": _make_csv("\n".join(rows))})
        resp = client.get(_EXPORT_URL)
        assert resp.status_code == 200
        assert "registros_invalidos,1" in resp.text