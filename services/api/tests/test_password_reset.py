"""Tests para POST /api/v1/auth/forgot-password y /reset-password.

Cobertura:
  forgot-password:
    - Camino feliz: 200 con mensaje genérico, exista o no el email.
    - Anti-enumeración: respuesta idéntica para email existente/inexistente.
    - Rate limiting: 429 tras superar el límite horario por email.
    - Auditoría: se registra el evento en audit_log.

  reset-password:
    - Camino feliz: token válido restablece y actualiza password_changed_at.
    - Invalidez: token corrupto/expirado → 400.
    - Un solo uso: reutilizar el mismo token → 400.
    - Invalidación por pwd_iat: token emitido antes del último cambio → 400.
"""

from __future__ import annotations

import datetime as dt

import jwt
from fastapi.testclient import TestClient

from config import settings
from security import create_password_reset_token


def _register(client: TestClient, email: str = "reset@trackflow.com", password: str = "NuevaPass123"):
    """Crea un usuario de prueba y devuelve su id."""
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _get_user_pwd_changed_at(client: TestClient, user_id: int) -> str:
    """Lee `password_changed_at` del usuario desde la BD TinyDB."""
    from routes.auth import users_table
    return users_table.get(doc_id=user_id)["password_changed_at"]


class TestForgotPassword:
    """POST /api/v1/auth/forgot-password"""

    # ── Camino feliz / anti-enumeración ──

    def test_returns_200_with_generic_message_existing_email(self, client: TestClient):
        _register(client)
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "reset@trackflow.com"},
        )
        assert resp.status_code == 200
        assert resp.json()["message"] == (
            "Si la dirección está registrada, recibirás un enlace para "
            "restablecer tu contraseña."
        )

    def test_returns_200_with_generic_message_nonexistent_email(self, client: TestClient):
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nadie@trackflow.com"},
        )
        assert resp.status_code == 200
        assert "recibirás un enlace" in resp.json()["message"]

    def test_response_identical_for_existing_and_non_existing(self, client: TestClient):
        """Anti-enumeración: el body es el MISMO siga o no el email existiendo."""
        _register(client)
        resp_existing = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "reset@trackflow.com"},
        )
        resp_missing = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "no-existe@trackflow.com"},
        )
        assert resp_existing.status_code == resp_missing.status_code == 200
        assert resp_existing.json() == resp_missing.json()

    # ── Rate limiting ──

    def test_rate_limited_after_max_requests(self, client: TestClient):
        """Superar el límite horario para un email devuelve 429."""
        _register(client)
        # Las primeras `max` peticiones pasan (200)
        for _ in range(settings.password_reset_max_requests_per_hour):
            resp = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "reset@trackflow.com"},
            )
            assert resp.status_code == 200
        # La siguiente supera el límite → 429
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "reset@trackflow.com"},
        )
        assert resp.status_code == 429

    def test_rate_limit_is_per_email(self, client: TestClient):
        """El límite se aplica por email, no globalmente."""
        _register(client)
        for _ in range(settings.password_reset_max_requests_per_hour):
            client.post("/api/v1/auth/forgot-password", json={"email": "a@trackflow.com"})
        # Otro email distinto NO está limitado
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "b@trackflow.com"},
        )
        assert resp.status_code == 200

    # ── Auditoría ──

    def test_audit_event_registered(self, client: TestClient):
        _register(client, email="audit@trackflow.com")
        client.post("/api/v1/auth/forgot-password", json={"email": "audit@trackflow.com"})

        from audit_log import audit_table, AuditEventType
        events = audit_table.all()
        assert any(
            e["event_type"] == AuditEventType.PASSWORD_RESET_REQUESTED
            and e["email"] == "audit@trackflow.com"
            for e in events
        )


class TestResetPassword:
    """POST /api/v1/auth/reset-password"""

    def _forgot_token(self, client: TestClient, email: str = "reset@trackflow.com") -> str:
        """Emula la emisión del token tal y como hace el backend real.

        En `POST /auth/forgot-password` el token se firma con
        ``pwd_iat = _password_changed_at_to_ts(user.password_changed_at)``.
        Usamos exactamente la misma conversión para que la comparación de
        invalidación (`token.pwd_iat < user.password_changed_at`) sea fiel
        al comportamiento de producción.
        """
        from routes.auth import users_table, UserQuery, _password_changed_at_to_ts
        user = users_table.search(UserQuery.email == email)[0]
        pwd_iat = _password_changed_at_to_ts(user.get("password_changed_at"))
        return create_password_reset_token(user_id=user.doc_id, pwd_iat=pwd_iat)

    # ── Camino feliz ──

    def test_reset_success_updates_password(self, client: TestClient):
        user_id = _register(client)
        token = self._forgot_token(client)

        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "NuevaPass456"},
        )
        assert resp.status_code == 200
        assert "message" in resp.json()

        # El usuario ahora puede loguearse con la NUEVA contraseña
        login = client.post(
            "/api/v1/auth/login",
            json={"email": "reset@trackflow.com", "password": "NuevaPass456"},
        )
        assert login.status_code == 200
        # Y no con la antigua
        old = client.post(
            "/api/v1/auth/login",
            json={"email": "reset@trackflow.com", "password": "NuevaPass123"},
        )
        assert old.status_code == 401

    def test_reset_updates_password_changed_at(self, client: TestClient):
        user_id = _register(client)
        before = _get_user_pwd_changed_at(client, user_id)
        token = self._forgot_token(client)

        client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "NuevaPass456"},
        )
        after = _get_user_pwd_changed_at(client, user_id)
        assert after > before  # ISO strings con misma zona → comparables

    # ── Modo de fallo ──

    def test_reset_invalid_token(self, client: TestClient):
        _register(client)
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": "no-es-un-token", "new_password": "NuevaPass456"},
        )
        assert resp.status_code == 400

    def test_reset_tampered_token(self, client: TestClient):
        """Token con firma manipulada → 400."""
        _register(client)
        token = self._forgot_token(client)
        tampered = token[:-4] + ("AAAA" if token[-4:] != "AAAA" else "BBBB")
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": tampered, "new_password": "NuevaPass456"},
        )
        assert resp.status_code == 400

    def test_reset_expired_token(self, client: TestClient):
        """Token firmado pero con `exp` en el pasado → 400."""
        user_id = _register(client)
        now = int(dt.datetime.now(dt.timezone.utc).timestamp())
        payload = {
            "sub": str(user_id),
            "type": "password_reset",
            "iat": now - 7200,            # emitido hace 2h
            "exp": now - 3600,            # expiró hace 1h
            "pwd_iat": now - 7200,
        }
        expired = jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": expired, "new_password": "NuevaPass456"},
        )
        assert resp.status_code == 400

    # ── Un solo uso / invalidación por pwd_iat ──

    def test_reset_token_single_use(self, client: TestClient):
        """Reutilizar un token ya consumido → 400 (un solo uso)."""
        user_id = _register(client)
        token = self._forgot_token(client)

        first = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "NuevaPass456"},
        )
        assert first.status_code == 200

        # El mismo token vuelve a usarse → ya fue invalidado por pwd_iat
        second = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "OtraPass789"},
        )
        assert second.status_code == 400

    def test_reset_token_emitted_before_last_change_rejected(self, client: TestClient):
        """Token emitido antes del último cambio de contraseña → 400."""
        user_id = _register(client)
        now = int(dt.datetime.now(dt.timezone.utc).timestamp())

        # Token "viejo": emitido, pero el usuario cambió la contraseña después
        old_payload = {
            "sub": str(user_id),
            "type": "password_reset",
            "iat": now - 600,
            "exp": now + 600,
            "pwd_iat": now - 600,   # emitido ANTES del último cambio
        }
        old_token = jwt.encode(old_payload, settings.jwt_secret_key, algorithm="HS256")

        # Simular un cambio posterior de contraseña
        from routes.auth import users_table
        users_table.update(
            {"password_changed_at": dt.datetime.now(dt.timezone.utc).isoformat()},
            doc_ids=[user_id],
        )

        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": old_token, "new_password": "NuevaPass456"},
        )
        assert resp.status_code == 400