"""Tests para routes/leads.py — CRUD de leads y notas (TrackFlow).

Endpoints (prefix /api/v1/records):
- GET    ""                           → Listar leads
- GET    "/{id}"                      → Detalle lead
- POST   ""                           → Crear lead (201)
- PUT    "/{id}"                      → Actualizar lead (parcial)
- PATCH  "/{id}"                      → Actualizar status/stage
- GET    "/{id}/notes"                → Listar notas
- POST   "/{id}/notes"                → Agregar nota (201)
- DELETE "/{id}/notes/{note_id}"      → Eliminar nota (204)
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

API_PREFIX = "/api/v1"
RECORDS_URL = f"{API_PREFIX}/records"

VALID_LEAD = {
    "company_name": "TechCorp",
    "contact_person": "Juan Pérez",
    "email": "juan@techcorp.com",
    "phone": "+34 612 345 678",
    "website": "https://techcorp.com",
    "country": "España",
    "product_type": "Electrónica",
    "monthly_volume": "5000",
    "services": ["3PL", "Warehousing"],
    "has_3pl": "yes",
    "comments": "Cliente potencial grande",
}

MINIMAL_LEAD = {
    "company_name": "MiniCorp",
    "contact_person": "Ana García",
    "email": "ana@minicorp.com",
    "phone": "+34 600 000 000",
}


@pytest.fixture
def client():
    from main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _clean_notes():
    """Limpia la tabla de notas (la conftest solo limpia leads_table)."""
    from routes.leads import notes_table
    notes_table.truncate()


def _create_lead(client: TestClient, payload: dict | None = None) -> dict:
    """Helper: crea un lead y retorna el body JSON."""
    resp = client.post(RECORDS_URL, json=payload or VALID_LEAD)
    assert resp.status_code == 201
    return resp.json()


# ═══════════════════════════════════════════════════════════
#  Crear (POST)
# ═══════════════════════════════════════════════════════════

class TestCreate:
    _URL = RECORDS_URL

    def test_create_full(self, client):
        """Crear lead con todos los campos → 201."""
        body = _create_lead(client)
        assert body["company_name"] == VALID_LEAD["company_name"]
        assert body["contact_person"] == VALID_LEAD["contact_person"]
        assert body["email"] == VALID_LEAD["email"]
        assert body["status"] == "new"
        assert body["stage"] == "inbound"
        assert "id" in body
        assert "created_at" in body

    def test_create_minimal(self, client):
        """Crear lead solo con campos obligatorios."""
        body = _create_lead(client, MINIMAL_LEAD)
        assert body["company_name"] == MINIMAL_LEAD["company_name"]
        assert body["country"] == ""
        assert body["services"] == []
        assert body["comments"] is None

    def test_create_default_status_stage(self, client):
        """status=new y stage=inbound por defecto."""
        body = _create_lead(client, MINIMAL_LEAD)
        assert body["status"] == "new"
        assert body["stage"] == "inbound"

    def test_create_with_custom_status(self, client):
        """Crear con status personalizado."""
        payload = {**MINIMAL_LEAD, "status": "contacted", "stage": "negotiation"}
        body = _create_lead(client, payload)
        assert body["status"] == "contacted"
        assert body["stage"] == "negotiation"

    def test_create_missing_company_name(self, client):
        """Falta company_name → 422."""
        resp = client.post(self._URL, json={k: v for k, v in MINIMAL_LEAD.items()
                                             if k != "company_name"})
        assert resp.status_code == 422

    def test_create_empty_company_name(self, client):
        """company_name vacío → 422."""
        resp = client.post(self._URL, json={**MINIMAL_LEAD, "company_name": ""})
        assert resp.status_code == 422

    def test_create_increments_id(self, client):
        """Cada lead recibe un ID incremental."""
        b1 = _create_lead(client, MINIMAL_LEAD)
        b2 = _create_lead(client, MINIMAL_LEAD)
        assert b2["id"] == b1["id"] + 1

    def test_create_iso_date(self, client):
        """created_at está en formato ISO."""
        body = _create_lead(client, MINIMAL_LEAD)
        assert "T" in body["created_at"]


# ═══════════════════════════════════════════════════════════
#  Listar (GET)
# ═══════════════════════════════════════════════════════════

class TestList:
    _URL = RECORDS_URL

    def test_list_empty(self, client):
        """Sin leads → results vacío."""
        resp = client.get(self._URL)
        assert resp.status_code == 200
        assert resp.json() == {"results": []}

    def test_list_all(self, client):
        """Listar todos los leads."""
        _create_lead(client, MINIMAL_LEAD)
        _create_lead(client, MINIMAL_LEAD)
        resp = client.get(self._URL)
        assert len(resp.json()["results"]) == 2

    def test_list_limit(self, client):
        """Parámetro limit funciona."""
        for _ in range(5):
            _create_lead(client, MINIMAL_LEAD)
        resp = client.get(self._URL, params={"limit": 3})
        assert len(resp.json()["results"]) == 3

    def test_list_limit_max(self, client):
        """limit máximo 1000."""
        resp = client.get(self._URL, params={"limit": 1000})
        assert resp.status_code == 200

    def test_list_limit_too_high(self, client):
        """limit > 1000 → 422."""
        resp = client.get(self._URL, params={"limit": 1001})
        assert resp.status_code == 422

    def test_list_returns_latest_ids(self, client):
        """Los últimos leads creados aparecen en el resultado."""
        b1 = _create_lead(client, MINIMAL_LEAD)
        b2 = _create_lead(client, MINIMAL_LEAD)
        b3 = _create_lead(client, MINIMAL_LEAD)
        results = client.get(self._URL, params={"limit": 2}).json()["results"]
        assert len(results) == 2
        # Inserta en orden ascendente, [-limit:] toma los últimos
        assert results[0]["id"] == b2["id"]
        assert results[1]["id"] == b3["id"]


# ═══════════════════════════════════════════════════════════
#  Detalle (GET /{id})
# ═══════════════════════════════════════════════════════════

class TestGet:
    def test_get_exists(self, client):
        """Obtener lead existente."""
        created = _create_lead(client, MINIMAL_LEAD)
        resp = client.get(f"{RECORDS_URL}/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_get_not_found(self, client):
        """ID inexistente → 404."""
        resp = client.get(f"{RECORDS_URL}/99999")
        assert resp.status_code == 404

    def test_get_full_fields(self, client):
        """La respuesta contiene todos los campos del modelo."""
        created = _create_lead(client)
        body = client.get(f"{RECORDS_URL}/{created['id']}").json()
        for field in ("id", "company_name", "contact_person", "email", "phone",
                      "website", "country", "product_type", "monthly_volume",
                      "services", "has_3pl", "comments", "status", "stage",
                      "created_at"):
            assert field in body


# ═══════════════════════════════════════════════════════════
#  Actualizar (PUT /{id})
# ═══════════════════════════════════════════════════════════

class TestUpdate:
    def test_update_fields(self, client):
        """Actualizar campos de un lead."""
        created = _create_lead(client, MINIMAL_LEAD)
        resp = client.put(f"{RECORDS_URL}/{created['id']}", json={
            "company_name": "NewName",
            "contact_person": "New Person",
            "email": "new@email.com",
            "phone": "+34 600 000 001",
            "country": "México",
        })
        assert resp.status_code == 200
        body = resp.json()
        assert body["company_name"] == "NewName"
        assert body["contact_person"] == "New Person"
        assert body["country"] == "México"

    def test_update_partial(self, client):
        """Actualizar solo un campo, el resto se conserva."""
        created = _create_lead(client, VALID_LEAD)
        resp = client.put(f"{RECORDS_URL}/{created['id']}", json={
            "company_name": "UpdatedCorp",
        })
        body = resp.json()
        assert body["company_name"] == "UpdatedCorp"
        # El resto de campos se conservan
        assert body["contact_person"] == VALID_LEAD["contact_person"]

    def test_update_not_found(self, client):
        """ID inexistente → 404."""
        resp = client.put(f"{RECORDS_URL}/99999", json={"company_name": "Nope"})
        assert resp.status_code == 404

    def test_update_sets_updated_at(self, client):
        """updated_at se establece tras actualizar."""
        created = _create_lead(client, MINIMAL_LEAD)
        assert created.get("updated_at") is None
        resp = client.put(f"{RECORDS_URL}/{created['id']}", json={
            "company_name": "Updated",
        })
        assert resp.json()["updated_at"] is not None


# ═══════════════════════════════════════════════════════════
#  Patch (PATCH /{id})
# ═══════════════════════════════════════════════════════════

class TestPatch:
    def test_patch_status(self, client):
        """Actualizar solo status."""
        created = _create_lead(client, MINIMAL_LEAD)
        resp = client.patch(f"{RECORDS_URL}/{created['id']}", json={
            "status": "contacted",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "contacted"
        assert resp.json()["stage"] == "inbound"  # no cambia

    def test_patch_stage(self, client):
        """Actualizar solo stage."""
        created = _create_lead(client, MINIMAL_LEAD)
        resp = client.patch(f"{RECORDS_URL}/{created['id']}", json={
            "stage": "negotiation",
        })
        assert resp.status_code == 200
        assert resp.json()["stage"] == "negotiation"
        assert resp.json()["status"] == "new"  # no cambia

    def test_patch_both(self, client):
        """Actualizar status y stage simultáneamente."""
        created = _create_lead(client, MINIMAL_LEAD)
        resp = client.patch(f"{RECORDS_URL}/{created['id']}", json={
            "status": "won",
            "stage": "closed",
        })
        body = resp.json()
        assert body["status"] == "won"
        assert body["stage"] == "closed"

    def test_patch_empty_body(self, client):
        """Body vacío → 400."""
        created = _create_lead(client, MINIMAL_LEAD)
        resp = client.patch(f"{RECORDS_URL}/{created['id']}", json={})
        assert resp.status_code == 400

    def test_patch_not_found(self, client):
        """ID inexistente → 404."""
        resp = client.patch(f"{RECORDS_URL}/99999", json={"status": "lost"})
        assert resp.status_code == 404

    def test_patch_sets_updated_at(self, client):
        """updated_at se establece tras patch."""
        created = _create_lead(client, MINIMAL_LEAD)
        resp = client.patch(f"{RECORDS_URL}/{created['id']}", json={"status": "won"})
        assert resp.json()["updated_at"] is not None


# ═══════════════════════════════════════════════════════════
#  Notas — Listar (GET /{id}/notes)
# ═══════════════════════════════════════════════════════════

class TestListNotes:
    def test_notes_empty(self, client):
        """Lead sin notas → results vacío."""
        lead = _create_lead(client, MINIMAL_LEAD)
        resp = client.get(f"{RECORDS_URL}/{lead['id']}/notes")
        assert resp.status_code == 200
        assert resp.json() == {"results": []}

    def test_notes_lead_not_found(self, client):
        """Lead inexistente → 404."""
        resp = client.get(f"{RECORDS_URL}/99999/notes")
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════
#  Notas — Crear (POST /{id}/notes)
# ═══════════════════════════════════════════════════════════

class TestCreateNote:
    def test_create_note(self, client):
        """Agregar nota a lead existente."""
        lead = _create_lead(client, MINIMAL_LEAD)
        resp = client.post(f"{RECORDS_URL}/{lead['id']}/notes", json={
            "content": "Nota de prueba",
        })
        assert resp.status_code == 201
        body = resp.json()
        assert body["content"] == "Nota de prueba"
        assert body["lead_id"] == lead["id"]
        assert "id" in body
        assert "created_at" in body

    def test_create_note_empty_content(self, client):
        """Contenido vacío → 422."""
        lead = _create_lead(client, MINIMAL_LEAD)
        resp = client.post(f"{RECORDS_URL}/{lead['id']}/notes", json={"content": ""})
        assert resp.status_code == 422

    def test_create_note_lead_not_found(self, client):
        """Lead inexistente → 404."""
        resp = client.post(f"{RECORDS_URL}/99999/notes", json={
            "content": "Nota",
        })
        assert resp.status_code == 404

    def test_create_note_increments_id(self, client):
        """Cada nota recibe ID incremental."""
        lead = _create_lead(client, MINIMAL_LEAD)
        n1 = client.post(f"{RECORDS_URL}/{lead['id']}/notes",
                         json={"content": "Nota 1"}).json()
        n2 = client.post(f"{RECORDS_URL}/{lead['id']}/notes",
                         json={"content": "Nota 2"}).json()
        assert n2["id"] != n1["id"]
        assert n2["lead_id"] == n1["lead_id"] == lead["id"]

    def test_list_after_create(self, client):
        """Tras crear nota, aparece en el listado."""
        lead = _create_lead(client, MINIMAL_LEAD)
        client.post(f"{RECORDS_URL}/{lead['id']}/notes", json={"content": "Mi nota"})
        resp = client.get(f"{RECORDS_URL}/{lead['id']}/notes")
        notes = resp.json()["results"]
        assert len(notes) == 1
        assert notes[0]["content"] == "Mi nota"


# ═══════════════════════════════════════════════════════════
#  Notas — Eliminar (DELETE /{id}/notes/{note_id})
# ═══════════════════════════════════════════════════════════

class TestDeleteNote:
    def test_delete_note(self, client):
        """Eliminar nota existente → 204."""
        lead = _create_lead(client, MINIMAL_LEAD)
        note = client.post(f"{RECORDS_URL}/{lead['id']}/notes",
                           json={"content": "A borrar"}).json()
        resp = client.delete(f"{RECORDS_URL}/{lead['id']}/notes/{note['id']}")
        assert resp.status_code == 204

    def test_delete_note_then_list_empty(self, client):
        """Tras eliminar, el listado está vacío."""
        lead = _create_lead(client, MINIMAL_LEAD)
        note = client.post(f"{RECORDS_URL}/{lead['id']}/notes",
                           json={"content": "A borrar"}).json()
        client.delete(f"{RECORDS_URL}/{lead['id']}/notes/{note['id']}")
        resp = client.get(f"{RECORDS_URL}/{lead['id']}/notes")
        assert resp.json()["results"] == []

    def test_delete_note_not_found(self, client):
        """Nota inexistente → 404."""
        lead = _create_lead(client, MINIMAL_LEAD)
        resp = client.delete(f"{RECORDS_URL}/{lead['id']}/notes/99999")
        assert resp.status_code == 404

    def test_delete_note_wrong_lead(self, client):
        """Nota de otro lead → 404."""
        lead_a = _create_lead(client, {**MINIMAL_LEAD, "company_name": "A"})
        lead_b = _create_lead(client, {**MINIMAL_LEAD, "company_name": "B"})
        note = client.post(f"{RECORDS_URL}/{lead_a['id']}/notes",
                           json={"content": "Nota de A"}).json()
        resp = client.delete(f"{RECORDS_URL}/{lead_b['id']}/notes/{note['id']}")
        assert resp.status_code == 404

    def test_delete_lead_not_found(self, client):
        """Lead inexistente → 404."""
        resp = client.delete(f"{RECORDS_URL}/99999/notes/1")
        assert resp.status_code == 404