"""Tests para POST /api/v1/auth/change-password.

Cobertura:
  - Camino feliz: cambio válido restablece la contraseña y actualiza
    password_changed_at.
  - Modo de fallo: contraseña actual incorrecta → 400.
  - Autenticación: sin token → 401.
  - Seguridad: tras el cambio, el login con la antigua contraseña falla.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client: TestClient, email: str = "change@trackflow.com") -> None:
    """Registra (o re-registra tras limpieza) un usuario de prueba."""
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "ViejaPass123"},
    )
    assert r.status_code == 201, r.text


def _login_headers(client: TestClient, email: str = "change@trackflow.com") -> dict[str, str]:
    """Devuelve headers con el token Bearer de un usuario ya registrado."""
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "ViejaPass123"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestChangePassword:
    """POST /api/v1/auth/change-password"""

    # ── Camino feliz ──

    def test_change_password_success(self, client: TestClient):
        _register(client)
        headers = _login_headers(client)
        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "ViejaPass123", "new_password": "NuevaPass456"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert "message" in resp.json()

    def test_login_with_old_password_fails_after_change(self, client: TestClient):
        _register(client)
        # Login inicial para obtener token
        old_login = _login_headers(client)
        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "ViejaPass123", "new_password": "NuevaPass456"},
            headers=old_login,
        )
        assert resp.status_code == 200
        # Login con contraseña vieja → 401
        old = client.post(
            "/api/v1/auth/login",
            json={"email": "change@trackflow.com", "password": "ViejaPass123"},
        )
        assert old.status_code == 401
        # Login con contraseña nueva → 200
        new = client.post(
            "/api/v1/auth/login",
            json={"email": "change@trackflow.com", "password": "NuevaPass456"},
        )
        assert new.status_code == 200

    def test_change_password_updates_password_changed_at(self, client: TestClient):
        _register(client)
        from routes.auth import users_table, UserQuery
        user = users_table.search(UserQuery.email == "change@trackflow.com")[0]
        before = user["password_changed_at"]

        client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "ViejaPass123", "new_password": "NuevaPass456"},
            headers=_login_headers(client),
        )
        after = users_table.search(UserQuery.email == "change@trackflow.com")[0]["password_changed_at"]
        assert after > before

    # ── Modo de fallo ──

    def test_change_password_wrong_current(self, client: TestClient):
        _register(client)
        headers = _login_headers(client)
        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "Incorrecta99", "new_password": "NuevaPass456"},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "incorrecta" in resp.json()["detail"].lower()

    def test_change_password_requires_auth(self, client: TestClient):
        _register(client)
        # Sin header Authorization → 401
        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "ViejaPass123", "new_password": "NuevaPass456"},
        )
        assert resp.status_code == 401

    def test_change_password_invalid_token(self, client: TestClient):
        _register(client)
        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "ViejaPass123", "new_password": "NuevaPass456"},
            headers={"Authorization": "Bearer token-falso"},
        )
        assert resp.status_code == 401

    def test_change_password_min_length_validation(self, client: TestClient):
        _register(client)
        headers = _login_headers(client)
        # new_password < 8 caracteres → 422
        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "ViejaPass123", "new_password": "corta"},
            headers=headers,
        )
        assert resp.status_code == 422