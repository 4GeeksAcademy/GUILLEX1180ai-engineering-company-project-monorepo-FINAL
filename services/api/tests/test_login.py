"""Tests unitarios para POST /api/v1/auth/login — Inicio de sesión (AUTH-088).

Cobertura:
  - Camino feliz: credenciales correctas generan token Bearer
  - Caso límite: email con capitalización mixta, espacios, múltiples sesiones
  - Modo de fallo: credenciales inválidas, usuario no registrado, campos faltantes
"""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestLogin:
    """POST /api/v1/auth/login"""

    # ── Camino feliz ──

    def test_login_success(self, client: TestClient):
        """Credenciales correctas que generan y devuelven un token Bearer."""
        # Primero registrar un usuario
        client.post(
            "/api/v1/auth/register",
            json={"email": "login-test@trackflow.com", "password": "CorrectPass1"},
        )
        # Luego iniciar sesión
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "login-test@trackflow.com", "password": "CorrectPass1"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["access_token"].startswith("tf_")
        assert len(data["access_token"]) > 30
        # Verificar que se devuelve información del usuario
        assert "user" in data
        assert data["user"]["email"] == "login-test@trackflow.com"

    # ── Caso límite ──

    def test_login_email_case_insensitivity(self, client: TestClient):
        """Caso límite: email con mayúsculas/minúsculas mixtas en login."""
        client.post(
            "/api/v1/auth/register",
            json={"email": "case-login@trackflow.com", "password": "Pass1234"},
        )
        # Login con mayúsculas mezcladas
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "CASE-LOGIN@TRACKFLOW.COM", "password": "Pass1234"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_login_email_with_spaces(self, client: TestClient):
        """Caso límite: email con espacios alrededor debe ser manejado."""
        client.post(
            "/api/v1/auth/register",
            json={"email": "spaces@trackflow.com", "password": "Pass1234"},
        )
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "  spaces@trackflow.com  ", "password": "Pass1234"},
        )
        # El strip() en el código maneja espacios alrededor
        assert resp.status_code == 200

    def test_login_same_user_multiple_times(self, client: TestClient):
        """Caso límite: login múltiples veces genera distintos tokens."""
        client.post(
            "/api/v1/auth/register",
            json={"email": "multi-login@trackflow.com", "password": "Pass1234"},
        )
        tokens = set()
        for _ in range(3):
            resp = client.post(
                "/api/v1/auth/login",
                json={"email": "multi-login@trackflow.com", "password": "Pass1234"},
            )
            assert resp.status_code == 200
            tokens.add(resp.json()["access_token"])
        # Cada login debe generar un token distinto
        assert len(tokens) == 3

    # ── Modo de fallo ──

    def test_login_wrong_password(self, client: TestClient):
        """Modo de fallo: contraseña incorrecta."""
        client.post(
            "/api/v1/auth/register",
            json={"email": "wrongpass@trackflow.com", "password": "CorrectPass1"},
        )
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "wrongpass@trackflow.com", "password": "WrongPassword"},
        )
        assert resp.status_code == 401
        assert "credenciales" in resp.json()["detail"].lower()

    def test_login_unregistered_user(self, client: TestClient):
        """Modo de fallo: usuario no registrado."""
        resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": "noexiste@trackflow.com",
                "password": "SomePassword123",
            },
        )
        assert resp.status_code == 401
        assert "credenciales" in resp.json()["detail"].lower()

    def test_login_empty_password(self, client: TestClient):
        """Modo de fallo: contraseña vacía (no cumple min_length=1)."""
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "test@trackflow.com", "password": ""},
        )
        assert resp.status_code == 422

    def test_login_missing_fields(self, client: TestClient):
        """Modo de fallo: payload incompleto."""
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "test@trackflow.com"},
        )
        assert resp.status_code == 422

        resp2 = client.post(
            "/api/v1/auth/login",
            json={"password": "Pass123"},
        )
        assert resp2.status_code == 422