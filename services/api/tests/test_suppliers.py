"""Tests unitarios para endpoints de Suppliers (API-042).

Endpoints cubiertos:
  - POST   /api/v1/suppliers
  - GET    /api/v1/suppliers (con filtros)
  - GET    /api/v1/suppliers/{id}
  - PATCH  /api/v1/suppliers/{id}/rate
  - PATCH  /api/v1/suppliers/{id}/status
  - DELETE /api/v1/suppliers/{id}

Cobertura:
  - Camino feliz, caso límite y modo de fallo para cada endpoint
"""

from __future__ import annotations

from fastapi.testclient import TestClient

API_PREFIX = "/api/v1"
SUPPLIERS_URL = f"{API_PREFIX}/suppliers"

SAMPLE_SUPPLIER = {
    "nombre": "Test Carrier",
    "pais": "Estados Unidos",
    "categorias": ["Electrónica", "Moda"],
    "tarifa": 15.50,
}


def _create_supplier(client: TestClient, **overrides) -> dict:
    """Helper: crea un proveedor y devuelve el JSON de respuesta."""
    payload = {**SAMPLE_SUPPLIER, **overrides}
    resp = client.post(SUPPLIERS_URL, json=payload)
    assert resp.status_code == 201
    return resp.json()


# ═══════════════════════════════════════════════════════════
# POST /api/v1/suppliers — Crear proveedor
# ═══════════════════════════════════════════════════════════


class TestCreateSupplier:
    """POST /api/v1/suppliers"""

    # ── Camino feliz ──

    def test_create_success(self, client: TestClient):
        """Creación exitosa con datos válidos."""
        resp = client.post(SUPPLIERS_URL, json=SAMPLE_SUPPLIER)
        assert resp.status_code == 201
        data = resp.json()
        assert data["nombre"] == "Test Carrier"
        assert data["pais"] == "Estados Unidos"
        assert data["categorias"] == ["Electrónica", "Moda"]
        assert data["tarifa"] == 15.50
        assert data["status"] == "activo"
        assert "id" in data
        assert "updated_at" in data

    def test_create_with_suspended_status(self, client: TestClient):
        """Creación exitosa con estado explícito 'suspendido'."""
        payload = {**SAMPLE_SUPPLIER, "status": "suspendido"}
        resp = client.post(SUPPLIERS_URL, json=payload)
        assert resp.status_code == 201
        assert resp.json()["status"] == "suspendido"

    # ── Caso límite ──

    def test_create_minimum_nombre(self, client: TestClient):
        """Caso límite: nombre con la longitud mínima (2 caracteres)."""
        payload = {
            **SAMPLE_SUPPLIER,
            "nombre": "AB",
            "categorias": ["Moda"],
            "tarifa": 1.0,
        }
        resp = client.post(SUPPLIERS_URL, json=payload)
        assert resp.status_code == 201
        assert resp.json()["nombre"] == "AB"

    def test_create_minimum_tarifa(self, client: TestClient):
        """Caso límite: tarifa mínima válida apenas superior a 0."""
        payload = {**SAMPLE_SUPPLIER, "categorias": ["Cosmética"], "tarifa": 0.01}
        resp = client.post(SUPPLIERS_URL, json=payload)
        assert resp.status_code == 201
        assert resp.json()["tarifa"] == 0.01

    def test_create_espana_supplier(self, client: TestClient):
        """Caso límite: proveedor con país España."""
        payload = {**SAMPLE_SUPPLIER, "pais": "España"}
        resp = client.post(SUPPLIERS_URL, json=payload)
        assert resp.status_code == 201
        assert resp.json()["pais"] == "España"

    # ── Modo de fallo ──

    def test_create_nombre_too_short(self, client: TestClient):
        """Modo de fallo: nombre con menos de 2 caracteres."""
        resp = client.post(
            SUPPLIERS_URL,
            json={**SAMPLE_SUPPLIER, "nombre": "A"},
        )
        assert resp.status_code == 422

    def test_create_tarifa_zero(self, client: TestClient):
        """Modo de fallo: tarifa igual a 0 (debe ser > 0)."""
        resp = client.post(
            SUPPLIERS_URL,
            json={**SAMPLE_SUPPLIER, "tarifa": 0},
        )
        assert resp.status_code == 422

    def test_create_tarifa_negative(self, client: TestClient):
        """Modo de fallo: tarifa negativa."""
        resp = client.post(
            SUPPLIERS_URL,
            json={**SAMPLE_SUPPLIER, "tarifa": -5},
        )
        assert resp.status_code == 422

    def test_create_duplicate_categories(self, client: TestClient):
        """Modo de fallo: categorías duplicadas."""
        resp = client.post(
            SUPPLIERS_URL,
            json={**SAMPLE_SUPPLIER, "categorias": ["Moda", "Moda"]},
        )
        assert resp.status_code == 422

    def test_create_empty_categories(self, client: TestClient):
        """Modo de fallo: lista de categorías vacía."""
        resp = client.post(
            SUPPLIERS_URL,
            json={**SAMPLE_SUPPLIER, "categorias": []},
        )
        assert resp.status_code == 422

    def test_create_invalid_pais(self, client: TestClient):
        """Modo de fallo: país no válido."""
        resp = client.post(
            SUPPLIERS_URL,
            json={**SAMPLE_SUPPLIER, "pais": "Canadá"},
        )
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════
# GET /api/v1/suppliers — Listar proveedores
# ═══════════════════════════════════════════════════════════


class TestListSuppliers:
    """GET /api/v1/suppliers"""

    # ── Camino feliz ──

    def test_list_all(self, client: TestClient):
        """Listar todos los proveedores sin filtros."""
        _create_supplier(client, nombre="Carrier A")
        _create_supplier(client, nombre="Carrier B")
        resp = client.get(SUPPLIERS_URL)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_list_empty(self, client: TestClient):
        """Listar cuando no hay proveedores (lista vacía)."""
        resp = client.get(SUPPLIERS_URL)
        assert resp.status_code == 200
        assert resp.json() == []

    # ── Caso límite ──

    def test_list_filter_by_pais(self, client: TestClient):
        """Caso límite: filtrar por país."""
        _create_supplier(client, nombre="US Carrier", pais="Estados Unidos")
        _create_supplier(client, nombre="ES Carrier", pais="España")
        resp = client.get(SUPPLIERS_URL, params={"pais": "España"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["pais"] == "España"

    def test_list_filter_by_categoria(self, client: TestClient):
        """Caso límite: filtrar por categoría."""
        _create_supplier(client, nombre="Electro Shop", categorias=["Electrónica"])
        _create_supplier(client, nombre="Fashion Co", categorias=["Moda"])
        resp = client.get(SUPPLIERS_URL, params={"categoria": "Moda"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert "Moda" in data[0]["categorias"]

    def test_list_filter_no_match(self, client: TestClient):
        """Caso límite: filtro que no coincide con ningún proveedor."""
        _create_supplier(client, nombre="Test")
        resp = client.get(SUPPLIERS_URL, params={"pais": "España"})
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_filter_case_insensitive(self, client: TestClient):
        """Caso límite: filtro por país con mayúsculas/minúsculas."""
        _create_supplier(client, nombre="US Carrier", pais="Estados Unidos")
        resp = client.get(SUPPLIERS_URL, params={"pais": "ESTADOS UNIDOS"})
        assert resp.status_code == 200
        assert len(resp.json()) == 1


# ═══════════════════════════════════════════════════════════
# GET /api/v1/suppliers/{id} — Obtener proveedor por ID
# ═══════════════════════════════════════════════════════════


class TestGetSupplier:
    """GET /api/v1/suppliers/{id}"""

    # ── Camino feliz ──

    def test_get_by_id(self, client: TestClient):
        """Obtener proveedor existente por ID."""
        created = _create_supplier(client)
        supplier_id = created["id"]
        resp = client.get(f"{SUPPLIERS_URL}/{supplier_id}")
        assert resp.status_code == 200
        assert resp.json()["nombre"] == "Test Carrier"

    # ── Modo de fallo ──

    def test_get_not_found(self, client: TestClient):
        """Modo de fallo: ID de proveedor inexistente."""
        resp = client.get(f"{SUPPLIERS_URL}/99999")
        assert resp.status_code == 404
        assert "no encontrado" in resp.json()["detail"].lower()


# ═══════════════════════════════════════════════════════════
# PATCH /api/v1/suppliers/{id}/rate — Actualizar tarifa
# ═══════════════════════════════════════════════════════════


class TestUpdateRate:
    """PATCH /api/v1/suppliers/{id}/rate"""

    # ── Camino feliz ──

    def test_update_rate_success(self, client: TestClient):
        """Actualización exitosa de tarifa."""
        created = _create_supplier(client)
        supplier_id = created["id"]
        resp = client.patch(
            f"{SUPPLIERS_URL}/{supplier_id}/rate",
            json={"tarifa": 99.99},
        )
        assert resp.status_code == 200
        assert resp.json()["tarifa"] == 99.99

    # ── Caso límite ──

    def test_update_rate_minimum(self, client: TestClient):
        """Caso límite: tarifa mínima válida (0.01)."""
        created = _create_supplier(client)
        supplier_id = created["id"]
        resp = client.patch(
            f"{SUPPLIERS_URL}/{supplier_id}/rate",
            json={"tarifa": 0.01},
        )
        assert resp.status_code == 200
        assert resp.json()["tarifa"] == 0.01

    # ── Modo de fallo ──

    def test_update_rate_not_found(self, client: TestClient):
        """Modo de fallo: proveedor inexistente."""
        resp = client.patch(
            f"{SUPPLIERS_URL}/99999/rate",
            json={"tarifa": 10.0},
        )
        assert resp.status_code == 404

    def test_update_rate_zero(self, client: TestClient):
        """Modo de fallo: tarifa igual a 0."""
        created = _create_supplier(client)
        resp = client.patch(
            f"{SUPPLIERS_URL}/{created['id']}/rate",
            json={"tarifa": 0},
        )
        assert resp.status_code == 422

    def test_update_rate_negative(self, client: TestClient):
        """Modo de fallo: tarifa negativa."""
        created = _create_supplier(client)
        resp = client.patch(
            f"{SUPPLIERS_URL}/{created['id']}/rate",
            json={"tarifa": -1},
        )
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════
# PATCH /api/v1/suppliers/{id}/status — Actualizar estado
# ═══════════════════════════════════════════════════════════


class TestUpdateStatus:
    """PATCH /api/v1/suppliers/{id}/status"""

    # ── Camino feliz ──

    def test_update_status_to_suspended(self, client: TestClient):
        """Actualización exitosa de estado a 'suspendido'."""
        created = _create_supplier(client)
        supplier_id = created["id"]
        resp = client.patch(
            f"{SUPPLIERS_URL}/{supplier_id}/status",
            json={"status": "suspendido"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "suspendido"

    def test_update_status_back_to_active(self, client: TestClient):
        """Actualización exitosa de estado de vuelta a 'activo'."""
        created = _create_supplier(client, status="suspendido")
        resp = client.patch(
            f"{SUPPLIERS_URL}/{created['id']}/status",
            json={"status": "activo"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "activo"

    # ── Modo de fallo ──

    def test_update_status_not_found(self, client: TestClient):
        """Modo de fallo: proveedor inexistente."""
        resp = client.patch(
            f"{SUPPLIERS_URL}/99999/status",
            json={"status": "suspendido"},
        )
        assert resp.status_code == 404

    def test_update_status_invalid(self, client: TestClient):
        """Modo de fallo: estado no válido."""
        created = _create_supplier(client)
        resp = client.patch(
            f"{SUPPLIERS_URL}/{created['id']}/status",
            json={"status": "inexistente"},
        )
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════
# DELETE /api/v1/suppliers/{id} — Eliminar proveedor
# ═══════════════════════════════════════════════════════════


class TestDeleteSupplier:
    """DELETE /api/v1/suppliers/{id}"""

    # ── Camino feliz ──

    def test_delete_success(self, client: TestClient):
        """Eliminación exitosa de proveedor existente (204)."""
        created = _create_supplier(client)
        resp = client.delete(f"{SUPPLIERS_URL}/{created['id']}")
        assert resp.status_code == 204

    def test_delete_and_verify_gone(self, client: TestClient):
        """Eliminación exitosa y verificación de que ya no existe."""
        created = _create_supplier(client)
        supplier_id = created["id"]
        client.delete(f"{SUPPLIERS_URL}/{supplier_id}")
        resp = client.get(f"{SUPPLIERS_URL}/{supplier_id}")
        assert resp.status_code == 404

    # ── Modo de fallo ──

    def test_delete_not_found(self, client: TestClient):
        """Modo de fallo: proveedor inexistente."""
        resp = client.delete(f"{SUPPLIERS_URL}/99999")
        assert resp.status_code == 404