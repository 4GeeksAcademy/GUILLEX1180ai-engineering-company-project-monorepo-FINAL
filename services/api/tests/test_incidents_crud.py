"""Tests para routes/incidents_crud.py — CRUD de incidencias (TrackFlow).

Endpoints (prefix /api/v1/incidents):
- POST   ""                    → Crear incidencia (201)
- GET    ""                    → Listar con filtros
- GET    "/summary"            → Métricas agregadas
- GET    "/{id}"               → Detalle por UUID
- PATCH  "/{id}/status"        → Cambiar estado (con validación de ciclo de vida)
- DELETE "/{id}"               → Eliminar (204)

Modelo: title, description, category, status, origin, branch, created_at, updated_at
Ciclo de vida: open → in_progress/discarded, in_progress → resolved/discarded,
               resolved/discarded son finales.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

API_PREFIX = "/api/v1"
INCIDENTS_URL = f"{API_PREFIX}/incidents"

# ─── Payloads reutilizables ───

VALID_PAYLOAD = {
    "title": "Retraso en lote LP-2025-001",
    "description": "El pedido LP-2025-001 no llegó en la fecha acordada.",
    "category": "Retraso en entrega",
    "status": "open",
    "origin": "customer",
    "branch": "Madrid",
}

ANOTHER_PAYLOAD = {
    "title": "Producto dañado en almacén",
    "description": "Caja con roturas visibles en el embalaje.",
    "category": "Producto dañado",
    "status": "in_progress",
    "origin": "branch",
    "branch": "Barcelona",
}


@pytest.fixture
def client():
    from main import app
    with TestClient(app) as c:
        yield c


def _create_incident(client: TestClient, payload: dict | None = None) -> dict:
    """Helper: crea una incidencia y retorna el body JSON."""
    resp = client.post(INCIDENTS_URL, json=payload or VALID_PAYLOAD)
    assert resp.status_code == 201
    return resp.json()


# ═══════════════════════════════════════════════════════════
#  Crear (POST)
# ═══════════════════════════════════════════════════════════

class TestCreate:
    _URL = INCIDENTS_URL

    def test_create_success(self, client):
        """Crear incidencia válida → 201 con todos los campos."""
        body = _create_incident(client)
        assert body["title"] == VALID_PAYLOAD["title"]
        assert body["description"] == VALID_PAYLOAD["description"]
        assert body["category"] == VALID_PAYLOAD["category"]
        assert body["status"] == "open"
        assert body["origin"] == "customer"
        assert body["branch"] == "Madrid"
        assert "id" in body
        assert "created_at" in body
        assert "updated_at" in body

    def test_create_sets_default_status_open(self, client):
        """Si no se envía status, se asigna 'open' por defecto."""
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "status"}
        body = _create_incident(client, payload)
        assert body["status"] == "open"

    def test_create_with_explicit_status(self, client):
        """Crear con status 'in_progress' explícito."""
        payload = {**VALID_PAYLOAD, "status": "in_progress"}
        body = _create_incident(client, payload)
        assert body["status"] == "in_progress"

    def test_create_missing_title(self, client):
        """Falta title → 422 (Pydantic valida antes del handler)."""
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "title"}
        resp = client.post(self._URL, json=payload)
        assert resp.status_code == 422

    def test_create_empty_title(self, client):
        """Title vacío → 422 (Pydantic valida antes del handler)."""
        resp = client.post(self._URL, json={**VALID_PAYLOAD, "title": ""})
        assert resp.status_code == 422

    def test_create_invalid_category(self, client):
        """Categoría inválida → 422 (Pydantic valida antes del handler)."""
        resp = client.post(self._URL, json={**VALID_PAYLOAD, "category": "Invalida"})
        assert resp.status_code == 422

    def test_create_invalid_status(self, client):
        """Status inválido → 422 (Pydantic valida antes del handler)."""
        resp = client.post(self._URL, json={**VALID_PAYLOAD, "status": "invalid"})
        assert resp.status_code == 422

    def test_create_invalid_origin(self, client):
        """Origin inválido → 422 (Pydantic valida antes del handler)."""
        resp = client.post(self._URL, json={**VALID_PAYLOAD, "origin": "invalid"})
        assert resp.status_code == 422

    def test_create_unique_ids(self, client):
        """Cada incidencia recibe un UUID único."""
        b1 = _create_incident(client)
        b2 = _create_incident(client)
        assert b1["id"] != b2["id"]

    def test_create_branch_trimmed(self, client):
        """Branch se guarda sin espacios extra."""
        resp = client.post(self._URL, json={**VALID_PAYLOAD, "branch": "  Madrid  "})
        assert resp.status_code == 201
        assert resp.json()["branch"] == "Madrid"

    def test_create_returns_iso_dates(self, client):
        """created_at y updated_at en formato ISO."""
        body = _create_incident(client)
        assert "T" in body["created_at"]
        assert "T" in body["updated_at"]


# ═══════════════════════════════════════════════════════════
#  Listar (GET)
# ═══════════════════════════════════════════════════════════

class TestList:
    _URL = INCIDENTS_URL

    def test_list_empty(self, client):
        """Sin incidencias → lista vacía (200)."""
        resp = client.get(self._URL)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_all(self, client):
        """Listar todas las incidencias."""
        _create_incident(client)
        _create_incident(client, ANOTHER_PAYLOAD)
        resp = client.get(self._URL)
        assert len(resp.json()) == 2

    def test_list_filter_by_status(self, client):
        """Filtrar por status."""
        _create_incident(client)  # open
        _create_incident(client, {**ANOTHER_PAYLOAD, "status": "in_progress"})
        resp = client.get(self._URL, params={"status": "open"})
        assert len(resp.json()) == 1
        assert resp.json()[0]["status"] == "open"

    def test_list_filter_by_origin(self, client):
        """Filtrar por origin."""
        _create_incident(client)  # customer
        _create_incident(client, ANOTHER_PAYLOAD)  # branch
        resp = client.get(self._URL, params={"origin": "customer"})
        assert len(resp.json()) == 1
        assert resp.json()[0]["origin"] == "customer"

    def test_list_filter_by_branch(self, client):
        """Filtrar por branch."""
        _create_incident(client)  # Madrid
        _create_incident(client, ANOTHER_PAYLOAD)  # Barcelona
        resp = client.get(self._URL, params={"branch": "Madrid"})
        assert len(resp.json()) == 1

    def test_list_filter_by_category(self, client):
        """Filtrar por category."""
        _create_incident(client)  # Retraso en entrega
        _create_incident(client, ANOTHER_PAYLOAD)  # Producto dañado
        resp = client.get(self._URL, params={"category": "Retraso en entrega"})
        assert len(resp.json()) == 1

    def test_list_filter_combined(self, client):
        """Filtros combinados (AND)."""
        _create_incident(client)  # open, customer, Madrid
        _create_incident(client, {
            **ANOTHER_PAYLOAD, "status": "open", "origin": "branch",
        })
        resp = client.get(self._URL, params={
            "status": "open", "origin": "customer",
        })
        assert len(resp.json()) == 1

    def test_list_no_match(self, client):
        """Filtro sin coincidencias → lista vacía."""
        resp = client.get(self._URL, params={"status": "resolved"})
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_invalid_status_filter(self, client):
        """Filtro status inválido → 400."""
        resp = client.get(self._URL, params={"status": "nonexistent"})
        assert resp.status_code == 400

    def test_list_invalid_origin_filter(self, client):
        """Filtro origin inválido → 400."""
        resp = client.get(self._URL, params={"origin": "nonexistent"})
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════
#  Summary (GET /summary)
# ═══════════════════════════════════════════════════════════

class TestSummary:
    _URL = f"{INCIDENTS_URL}/summary"

    def test_summary_empty(self, client):
        """Sin incidencias → métricas en cero."""
        resp = client.get(self._URL)
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 0
        assert all(v == 0 for v in body["by_status"].values())

    def test_summary_with_incidents(self, client):
        """Métricas reflejan las incidencias creadas."""
        _create_incident(client)  # open, customer, Madrid
        _create_incident(client, {**ANOTHER_PAYLOAD, "status": "open"})  # in_progress→open, branch, Barcelona
        resp = client.get(self._URL)
        body = resp.json()
        assert body["total"] == 2
        assert body["by_status"]["open"] == 2
        assert body["by_status"]["in_progress"] == 0

    def test_summary_includes_all_statuses(self, client):
        """Todos los estados aparecen (incluso con 0)."""
        resp = client.get(self._URL)
        for s in ("open", "in_progress", "resolved", "discarded"):
            assert s in resp.json()["by_status"]

    def test_summary_includes_all_categories(self, client):
        """Todas las categorías aparecen."""
        resp = client.get(self._URL)
        for c in ("Retraso en entrega", "Producto dañado", "Devolución incorrecta",
                  "Error de picking", "Problema de inventario"):
            assert c in resp.json()["by_category"]

    def test_summary_includes_all_origins(self, client):
        """Todos los orígenes aparecen."""
        resp = client.get(self._URL)
        for o in ("customer", "branch", "internal"):
            assert o in resp.json()["by_origin"]


# ═══════════════════════════════════════════════════════════
#  Detalle (GET /{id})
# ═══════════════════════════════════════════════════════════

class TestDetail:
    def test_detail_exists(self, client):
        """Obtener incidencia existente."""
        created = _create_incident(client)
        resp = client.get(f"{INCIDENTS_URL}/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_detail_not_found(self, client):
        """UUID inexistente → 404."""
        resp = client.get(f"{INCIDENTS_URL}/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_detail_returns_all_fields(self, client):
        """La respuesta contiene todos los campos del modelo."""
        created = _create_incident(client)
        body = client.get(f"{INCIDENTS_URL}/{created['id']}").json()
        for field in ("id", "title", "description", "category", "status",
                      "origin", "branch", "created_at", "updated_at"):
            assert field in body


# ═══════════════════════════════════════════════════════════
#  Cambiar estado (PATCH /{id}/status)
# ═══════════════════════════════════════════════════════════

class TestChangeStatus:
    def test_open_to_in_progress(self, client):
        """open → in_progress es válido."""
        created = _create_incident(client)
        resp = client.patch(
            f"{INCIDENTS_URL}/{created['id']}/status",
            json={"status": "in_progress"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "in_progress"

    def test_open_to_discarded(self, client):
        """open → discarded es válido."""
        created = _create_incident(client)
        resp = client.patch(
            f"{INCIDENTS_URL}/{created['id']}/status",
            json={"status": "discarded"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "discarded"

    def test_in_progress_to_resolved(self, client):
        """in_progress → resolved es válido."""
        created = _create_incident(client, {**VALID_PAYLOAD, "status": "in_progress"})
        resp = client.patch(
            f"{INCIDENTS_URL}/{created['id']}/status",
            json={"status": "resolved"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "resolved"

    def test_in_progress_to_discarded(self, client):
        """in_progress → discarded es válido."""
        created = _create_incident(client, {**VALID_PAYLOAD, "status": "in_progress"})
        resp = client.patch(
            f"{INCIDENTS_URL}/{created['id']}/status",
            json={"status": "discarded"},
        )
        assert resp.status_code == 200

    def test_resolved_is_final(self, client):
        """resolved → open es inválido (409)."""
        created = _create_incident(client, {**VALID_PAYLOAD, "status": "resolved"})
        resp = client.patch(
            f"{INCIDENTS_URL}/{created['id']}/status",
            json={"status": "open"},
        )
        assert resp.status_code == 409

    def test_discarded_is_final(self, client):
        """discarded → open es inválido (409)."""
        created = _create_incident(client, {**VALID_PAYLOAD, "status": "discarded"})
        resp = client.patch(
            f"{INCIDENTS_URL}/{created['id']}/status",
            json={"status": "open"},
        )
        assert resp.status_code == 409

    def test_invalid_transition_open_to_resolved(self, client):
        """open → resolved es salto inválido (409)."""
        created = _create_incident(client)
        resp = client.patch(
            f"{INCIDENTS_URL}/{created['id']}/status",
            json={"status": "resolved"},
        )
        assert resp.status_code == 409

    def test_invalid_transition_discarded_to_resolved(self, client):
        """discarded → resolved es inválido (409)."""
        created = _create_incident(client, {**VALID_PAYLOAD, "status": "discarded"})
        resp = client.patch(
            f"{INCIDENTS_URL}/{created['id']}/status",
            json={"status": "resolved"},
        )
        assert resp.status_code == 409

    def test_not_found(self, client):
        """UUID inexistente → 404."""
        resp = client.patch(
            f"{INCIDENTS_URL}/00000000-0000-0000-0000-000000000000/status",
            json={"status": "in_progress"},
        )
        assert resp.status_code == 404

    def test_invalid_status_value(self, client):
        """Status inválido → 422 (Pydantic valida antes del handler)."""
        created = _create_incident(client)
        resp = client.patch(
            f"{INCIDENTS_URL}/{created['id']}/status",
            json={"status": "invalid_status"},
        )
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════
#  Eliminar (DELETE /{id})
# ═══════════════════════════════════════════════════════════

class TestDelete:
    def test_delete_success(self, client):
        """Eliminar incidencia existente → 204."""
        created = _create_incident(client)
        resp = client.delete(f"{INCIDENTS_URL}/{created['id']}")
        assert resp.status_code == 204

    def test_delete_not_found(self, client):
        """UUID inexistente → 404."""
        resp = client.delete(f"{INCIDENTS_URL}/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_delete_removes_from_db(self, client):
        """Tras eliminar, GET devuelve 404."""
        created = _create_incident(client)
        client.delete(f"{INCIDENTS_URL}/{created['id']}")
        resp = client.get(f"{INCIDENTS_URL}/{created['id']}")
        assert resp.status_code == 404