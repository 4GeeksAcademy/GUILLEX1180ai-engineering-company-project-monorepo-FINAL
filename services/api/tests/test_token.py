"""Tests unitarios para validación de tokens y actualización de perfil (AUTH-088).

Endpoints cubiertos:
  - GET  /api/v1/auth/me     — Validación de token Bearer (perfil)
  - PUT  /api/v1/profiles/me — Actualización de perfil autenticado

Cobertura:
  - Camino feliz: token vigente permite acceso y devuelve perfil
  - Caso límite: 'bearer' en minúsculas funciona correctamente
  - Modo de fallo: token ausente, malformado, inválido o alterado
  - Perfil: actualización exitosa, sin autenticación, sin campos
"""

from __future__ import annotations

from fastapi.testclient import TestClient


# ═══════════════════════════════════════════════════════════
# GET /api/v1/auth/me — Validación de Token
# ═══════════════════════════════════════════════════════════


class TestTokenValidation:
    """GET /api/v1/auth/me — Validación de tokens de sesión."""

    # ── Camino feliz ──

    def test_token_valid_access(self, client: TestClient, auth_headers: dict):
        """Token JWT vigente permite el acceso exitoso."""
        resp = client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "email" in data
        assert data["email"] == "testuser@trackflow.com"

    def test_token_returns_user_profile(self, client: TestClient, auth_headers: dict):
        """Token válido devuelve el perfil completo del usuario."""
        resp = client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # Verificar campos del perfil
        assert "id" in data
        assert "email" in data
        assert "name" in data
        assert "created_at" in data
        assert "updated_at" in data

    # ── Caso límite ──

    def test_token_lowercase_bearer(self, client: TestClient, auth_headers: dict):
        """Caso límite: 'bearer' en minúsculas debe funcionar."""
        token = auth_headers["Authorization"].replace("Bearer ", "")
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"bearer {token}"},
        )
        assert resp.status_code == 200

    # ── Modo de fallo ──

    def test_token_missing_header(self, client: TestClient):
        """Modo de fallo: petición sin cabecera Authorization."""
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401
        assert "token requerido" in resp.json()["detail"].lower()

    def test_token_malformed_no_bearer(self, client: TestClient):
        """Modo de fallo: token sin prefijo Bearer."""
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "NotBearer some_token"},
        )
        assert resp.status_code == 401
        assert "Formato de token inválido" in resp.json()["detail"]

    def test_token_malformed_empty(self, client: TestClient):
        """Modo de fallo: cabecera Authorization vacía."""
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer "},
        )
        assert resp.status_code == 401
        assert "Formato de token inválido" in resp.json()["detail"]

    def test_token_invalid(self, client: TestClient):
        """Modo de fallo: token completamente inválido/aleatorio."""
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer tf_fake_token_12345"},
        )
        assert resp.status_code == 401
        assert "inválido" in resp.json()["detail"].lower()

    def test_token_tampered(self, client: TestClient, auth_headers: dict):
        """Modo de fallo: token alterado (un caracter cambiado)."""
        original = auth_headers["Authorization"]
        # Cambiar el último caracter
        tampered = original[:-1] + ("x" if original[-1] != "x" else "y")
        resp = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": tampered},
        )
        assert resp.status_code == 401
        assert "inválido" in resp.json()["detail"].lower()


# ═══════════════════════════════════════════════════════════
# PUT /api/v1/profiles/me — Actualización de perfil
# ═══════════════════════════════════════════════════════════


class TestProfileUpdate:
    """PUT /api/v1/profiles/me — Actualización de perfil."""

    # ── Camino feliz ──

    def test_update_profile_name(self, client: TestClient, auth_headers: dict):
        """Actualización exitosa del nombre."""
        resp = client.put(
            "/api/v1/profiles/me",
            json={"name": "Nuevo Nombre"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Nuevo Nombre"
        assert data["email"] == "testuser@trackflow.com"

    def test_update_profile_all_fields(self, client: TestClient, auth_headers: dict):
        """Actualización exitosa de todos los campos editables."""
        resp = client.put(
            "/api/v1/profiles/me",
            json={
                "name": "Nombre Completo",
                "phone": "+52 111 222 3333",
                "address": "Dirección Actualizada 456",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Nombre Completo"
        assert data["phone"] == "+52 111 222 3333"
        assert data["address"] == "Dirección Actualizada 456"

    # ── Modo de fallo ──

    def test_update_profile_no_auth(self, client: TestClient):
        """Modo de fallo: actualización sin autenticación."""
        resp = client.put(
            "/api/v1/profiles/me",
            json={"name": "Sin Token"},
        )
        assert resp.status_code == 401

    def test_update_profile_no_fields(self, client: TestClient, auth_headers: dict):
        """Modo de fallo: payload vacío sin campos para actualizar."""
        resp = client.put(
            "/api/v1/profiles/me",
            json={},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "No hay campos" in resp.json()["detail"]