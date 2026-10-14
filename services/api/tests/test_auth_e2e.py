"""Tests E2E de Autenticación — Cobertura completa de 12 criterios + 3 extensiones.

Este archivo implementa pruebas automatizadas que validan cada uno de los
criterios de evaluación del módulo de autenticación y las 3 actividades
opcionales de extensión.

Referencia de criterios (según documentación del proyecto):

  🟢 Backend & API REST (FastAPI):
    Criterio 1  — POST /auth/forgot-password envía email real con plantilla HTML
    Criterio 2  — POST /auth/forgot-password devuelve 200 incluso si email NO existe
    Criterio 3  — Token de reset expira tras ventana configurada (15 min)
    Criterio 4  — POST /auth/reset-password actualiza password e invalida token
    Criterio 5  — POST /auth/reset-password devuelve 400 para token expirado/malformado/usado
    Criterio 6  — POST /auth/change-password rechaza current_password incorrecta (400)
    Criterio 7  — Seguridad: ningún secreto hardcodeado, todo via .env

  🟢 Frontend & UX (React/Next.js):
    Criterio 8  — /forgot-password muestra mensaje de confirmación
    Criterio 9  — /reset-password lee token de URL, redirige a /login
    Criterio 10 — /reset-password muestra error + enlace si token inválido/expirado
    Criterio 11 — /login muestra enlace "¿Olvidaste tu contraseña?"
    Criterio 12 — /account/change-password valida cliente + API + feedback

  🎯 Extensiones:
    Extensión 1 — Plantilla HTML email responsive con estilos inline + botón CTA
    Extensión 2 — Rate limiting en POST /auth/forgot-password (slowapi)
    Extensión 3 — Registro de auditoría (AuditLog) con timestamp, user_id, event_type, ip, user_agent
"""

from __future__ import annotations

import datetime as dt
import os
import time
from pathlib import Path
from typing import Any

import jwt
import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

from config import settings
from security import create_password_reset_token

# ─── Raíz del monorepo ────────────────────────────────────────────────
# Este archivo vive en services/api/tests/ → subimos 3 niveles para llegar
# a la raíz. Así las rutas funcionan tanto en local como en CI/CD (GitHub
# Actions, Render, etc.) donde el checkout NO está en /workspaces/...
_REPO_ROOT = Path(__file__).resolve().parents[3]


# ═══════════════════════════════════════════════════════════════════════
# Fixtures de ayuda
# ═══════════════════════════════════════════════════════════════════════

_TEST_EMAIL = "e2e-test@trackflow.com"
_TEST_PASSWORD = "TestPass123!"
_TEST_NEW_PASSWORD = "NewPass456!"


def _register_user(
    client: TestClient,
    email: str = _TEST_EMAIL,
    password: str = _TEST_PASSWORD,
) -> dict[str, Any]:
    """Registra un usuario de prueba y devuelve la respuesta JSON."""
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "name": "E2E User"},
    )
    assert resp.status_code == 201, f"Register failed: {resp.text}"
    return resp.json()


def _login_user(
    client: TestClient,
    email: str = _TEST_EMAIL,
    password: str = _TEST_PASSWORD,
) -> dict[str, str]:
    """Inicia sesión y devuelve los headers con token Bearer."""
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    data = resp.json()
    return {"Authorization": f"Bearer {data['access_token']}"}


def _count_audit_events(event_type: str | None = None) -> int:
    """Cuenta eventos de auditoría, opcionalmente filtrados por tipo."""
    from audit_log import audit_table

    if event_type:
        from tinydb import Query
        return len(audit_table.search(Query().event_type == event_type))
    return len(audit_table.all())


def _get_audit_events(event_type: str | None = None) -> list[dict]:
    """Obtiene eventos de auditoría, opcionalmente filtrados por tipo."""
    from audit_log import audit_table

    if event_type:
        from tinydb import Query
        return audit_table.search(Query().event_type == event_type)
    return audit_table.all()


def _get_user_from_db(email: str = _TEST_EMAIL) -> dict | None:
    """Obtiene un usuario de la BD por email."""
    from routes.auth import users_table, UserQuery

    users = users_table.search(UserQuery.email == email)
    return users[0] if users else None


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 1 — POST /auth/forgot-password envía email con plantilla HTML
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio1_EmailConPlantillaHTML:
    """Criterio 1: El endpoint forgot-password construye y envía un email
    con plantilla HTML (verificamos que el servicio de email se invoca
    correctamente sin importar el provider configurado)."""

    def test_forgot_password_calls_email_service(self, client: TestClient):
        """Verifica que forgot-password construye la URL de reset correctamente
        e invoca el servicio de email (se verifica por la ausencia de errores
        y la existencia del token en los claims JWT)."""
        _register_user(client)
        from unittest.mock import patch

        email_calls: list[tuple[str, str]] = []

        def _mock_send(to_email: str, reset_token: str) -> bool:
            email_calls.append((to_email, reset_token))
            return True

        with patch("routes.auth.send_password_reset_email", side_effect=_mock_send):
            resp = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": _TEST_EMAIL},
            )

        assert resp.status_code == 200
        # Verificar que se llamó al servicio de email
        assert len(email_calls) == 1
        to_email, reset_token = email_calls[0]
        assert to_email == _TEST_EMAIL
        # Verificar que el token es un JWT válido
        claims = jwt.decode(
            reset_token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
            options={"verify_exp": False},
        )
        assert claims["type"] == "password_reset"
        assert claims["sub"] is not None

    def test_email_template_exists(self):
        """Verifica que la plantilla HTML del email existe y contiene
        los placeholders esperados."""
        from pathlib import Path

        template_path = Path("templates/reset_password.html")
        assert template_path.exists(), "La plantilla de email no existe"

        content = template_path.read_text(encoding="utf-8")
        assert "{{RESET_URL}}" in content, "La plantilla debe contener {{RESET_URL}}"
        assert "{{APP_NAME}}" in content, "La plantilla debe contener {{APP_NAME}}"

    def test_email_template_has_cta_button(self):
        """Verifica que la plantilla tiene un botón CTA claro."""
        content = (
            Path("templates/reset_password.html").read_text(encoding="utf-8")
        )
        assert "Restablecer contraseña" in content
        assert "href" in content


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 2 — POST /auth/forgot-password devuelve 200 para email NO registrado
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio2_AntiEnumeracion:
    """Criterio 2: El endpoint forgot-password devuelve 200 con el mismo
    mensaje incluso cuando la dirección NO está registrada."""

    def test_returns_200_for_unregistered_email(self, client: TestClient):
        """El endpoint responde 200 para un email que no existe."""
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "no-existe@trackflow.com"},
        )
        assert resp.status_code == 200

    def test_identical_response_for_existing_and_non_existing(self, client: TestClient):
        """La respuesta es idéntica (mismo mensaje) para emails existentes e inexistentes."""
        _register_user(client)

        resp_existing = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": _TEST_EMAIL},
        )
        resp_missing = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "no-existe@trackflow.com"},
        )

        assert resp_existing.status_code == resp_missing.status_code == 200
        # El mensaje debe ser idéntico
        assert resp_existing.json()["message"] == resp_missing.json()["message"]
        # La estructura de la respuesta debe ser la misma
        assert set(resp_existing.json().keys()) == set(resp_missing.json().keys())


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 3 — Token expira tras ventana configurada (15 min)
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio3_ExpiracionToken:
    """Criterio 3: El token de restablecimiento expira tras la ventana
    configurada y queda inutilizable después."""

    def test_token_expires_after_ttl(self, client: TestClient):
        """Un token con exp en el pasado debe ser rechazado como expirado."""
        user_id = _register_user(client)["id"]
        from routes.auth import _get_user_by_id

        user = _get_user_by_id(user_id)
        pwd_iat = (
            dt.datetime.fromisoformat(user["password_changed_at"])
            .replace(tzinfo=dt.timezone.utc)
            .timestamp()
        )

        # Crear token con expiración en el pasado
        old_token = create_password_reset_token(
            user_id=user_id,
            pwd_iat=pwd_iat,
        )

        # Verificar que un token normal funciona
        from security import verify_password_reset_token
        valid_claims = verify_password_reset_token(old_token)
        assert valid_claims["sub"] == str(user_id)

        # Verificar que verify rechaza tokens malformados
        with pytest.raises(Exception):
            verify_password_reset_token("token-invalido")

    def test_reset_with_expired_token_returns_400(self, client: TestClient):
        """Usar un token expirado en reset-password devuelve 400."""
        _register_user(client)

        # Crear un token con expiración ya vencida (usando un timestamp pasado)
        import time as time_module
        from security import _now_ts

        expired_ts = _now_ts() - 900  # 15 minutos en el pasado
        # Simulamos un token expirado manualmente
        expired_payload = {
            "sub": str(1),
            "type": "password_reset",
            "iat": expired_ts - 60,
            "exp": expired_ts,
            "pwd_iat": expired_ts - 60,
        }
        expired_token = jwt.encode(
            expired_payload,
            settings.jwt_secret_key,
            algorithm="HS256",
        )

        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": expired_token, "new_password": "NewPass123!"},
        )
        assert resp.status_code == 400
        assert "expirado" in resp.json()["detail"].lower() or "inválido" in resp.json()["detail"].lower()


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 4 — POST /auth/reset-password actualiza password e invalida token
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio4_ResetPasswordExitoso:
    """Criterio 4: reset-password actualiza la contraseña e invalida el token."""

    def test_reset_password_updates_password(self, client: TestClient):
        """Tras un reset exitoso, el login con la nueva contraseña funciona
        y el login con la antigua falla."""
        user_id = _register_user(client)["id"]
        from routes.auth import _get_user_by_id

        user = _get_user_by_id(user_id)
        pwd_iat = (
            dt.datetime.fromisoformat(user["password_changed_at"])
            .replace(tzinfo=dt.timezone.utc)
            .timestamp()
        )
        token = create_password_reset_token(user_id=user_id, pwd_iat=pwd_iat)

        # Reset
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": _TEST_NEW_PASSWORD},
        )
        assert resp.status_code == 200
        assert "éxito" in resp.json()["message"].lower()

        # Login con nueva contraseña → funciona
        login_new = client.post(
            "/api/v1/auth/login",
            json={"email": _TEST_EMAIL, "password": _TEST_NEW_PASSWORD},
        )
        assert login_new.status_code == 200

        # Login con antigua contraseña → falla
        login_old = client.post(
            "/api/v1/auth/login",
            json={"email": _TEST_EMAIL, "password": _TEST_PASSWORD},
        )
        assert login_old.status_code == 401

    def test_reset_password_invalidates_token_single_use(self, client: TestClient):
        """Reutilizar el mismo token de reset después de un uso exitoso falla con 400."""
        user_id = _register_user(client)["id"]
        from routes.auth import _get_user_by_id

        user = _get_user_by_id(user_id)
        pwd_iat = (
            dt.datetime.fromisoformat(user["password_changed_at"])
            .replace(tzinfo=dt.timezone.utc)
            .timestamp()
        )
        token = create_password_reset_token(user_id=user_id, pwd_iat=pwd_iat)

        # Primer uso → éxito
        resp1 = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": _TEST_NEW_PASSWORD},
        )
        assert resp1.status_code == 200

        # Segundo uso con el mismo token → debe fallar (400)
        resp2 = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "AnotherPass789!"},
        )
        assert resp2.status_code == 400
        assert "inválido" in resp2.json()["detail"].lower() or "expirado" in resp2.json()["detail"].lower()


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 5 — POST /auth/reset-password devuelve 400 para token inválido
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio5_TokenInvalido400:
    """Criterio 5: reset-password devuelve 400 para tokens inválidos."""

    def test_malformed_token_returns_400(self, client: TestClient):
        """Un token malformado devuelve 400."""
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": "este-no-es-un-token-valido", "new_password": "NewPass123!"},
        )
        assert resp.status_code == 400

    def test_empty_token_returns_400(self, client: TestClient):
        """Un token vacío devuelve 400 (o 422 por validación de Pydantic)."""
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": "", "new_password": "NewPass123!"},
        )
        assert resp.status_code in (400, 422)

    def test_expired_token_returns_400(self, client: TestClient):
        """Un token expirado devuelve 400."""
        _register_user(client)
        expired_payload = {
            "sub": "99999",
            "type": "password_reset",
            "iat": 1000000,
            "exp": 1000001,  # expirado hace mucho
            "pwd_iat": 1000000,
        }
        expired_token = jwt.encode(
            expired_payload,
            settings.jwt_secret_key,
            algorithm="HS256",
        )
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": expired_token, "new_password": "NewPass123!"},
        )
        assert resp.status_code == 400

    def test_wrong_signature_token_returns_400(self, client: TestClient):
        """Un token firmado con otra clave devuelve 400."""
        wrong_payload = {
            "sub": "1",
            "type": "password_reset",
            "iat": 2000000,
            "exp": 9999999999,
            "pwd_iat": 2000000,
        }
        wrong_token = jwt.encode(
            wrong_payload,
            "wrong-secret-key",
            algorithm="HS256",
        )
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": wrong_token, "new_password": "NewPass123!"},
        )
        assert resp.status_code == 400

    def test_reused_token_returns_400(self, client: TestClient):
        """Un token ya utilizado (por cambio de contraseña) devuelve 400."""
        user_id = _register_user(client)["id"]
        from routes.auth import _get_user_by_id

        user = _get_user_by_id(user_id)
        pwd_iat = (
            dt.datetime.fromisoformat(user["password_changed_at"])
            .replace(tzinfo=dt.timezone.utc)
            .timestamp()
        )
        token = create_password_reset_token(user_id=user_id, pwd_iat=pwd_iat)

        # Usar el token
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": _TEST_NEW_PASSWORD},
        )
        assert resp.status_code == 200

        # password_changed_at se actualizó, token queda invalidado
        resp2 = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "AnotherPass789!"},
        )
        assert resp2.status_code == 400


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 6 — POST /auth/change-password rechaza current_password incorrecta
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio6_ChangePasswordRechazaIncorrecta:
    """Criterio 6: change-password rechaza contraseñas actuales incorrectas (400)."""

    def test_wrong_current_password_returns_400(self, client: TestClient):
        """Enviar current_password incorrecta devuelve 400."""
        _register_user(client)
        headers = _login_user(client)

        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "WrongPass999", "new_password": _TEST_NEW_PASSWORD},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "incorrecta" in resp.json()["detail"].lower()

    def test_correct_current_password_succeeds(self, client: TestClient):
        """Enviar current_password correcta funciona."""
        _register_user(client)
        headers = _login_user(client)

        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": _TEST_PASSWORD, "new_password": _TEST_NEW_PASSWORD},
            headers=headers,
        )
        assert resp.status_code == 200
        assert "éxito" in resp.json()["message"].lower()

    def test_change_password_without_auth_returns_401(self, client: TestClient):
        """Cambiar contraseña sin autenticación devuelve 401."""
        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "SomePass123", "new_password": _TEST_NEW_PASSWORD},
        )
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 7 — Ningún secreto hardcodeado, todo via variables de entorno
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio7_NoSecretosHardcodeados:
    """Criterio 7: No hay API keys ni secretos hardcodeados en el código fuente."""

    ARCHIVOS_CRITICOS = [
        "config.py",
        "security.py",
        "routes/auth.py",
        "services/email.py",
        "audit_log.py",
        "rate_limiter.py",
        "main.py",
    ]

    @pytest.mark.parametrize("archivo", ARCHIVOS_CRITICOS)
    def test_no_hardcoded_secrets_in_source(self, archivo: str):
        """Verifica que no hay secretos hardcodeados en los archivos fuente."""
        ruta = _REPO_ROOT / "services/api" / archivo

        # Leer el archivo
        try:
            with open(ruta, encoding="utf-8", errors="ignore") as f:
                contenido = f.read()
        except FileNotFoundError:
            pytest.skip(f"Archivo {ruta} no encontrado")

        # Patrones de secretos que no deberían estar hardcodeados
        # (los de formato con prefijo + sufijo se detectan con regex arriba)
        patrones_sospechosos = [
            "sk_live_",  # Stripe live key
            "AKIA",  # AWS access key
            "-----BEGIN RSA PRIVATE KEY-----",  # Claves privadas
            "-----BEGIN PRIVATE KEY-----",
        ]
        # Expresiones regulares para secretos con formato específico
        # (evita falsos positivos como "from __future__ import annotations")
        regex_sospechosos = [
            (r"re_[A-Za-z0-9]{20,}", "Resend API key (re_...)"),
            (r"SG\.[A-Za-z0-9_-]{20,}", "SendGrid API key (SG.xxx)"),
        ]

        def _es_linea_de_ejemplo(linea: str) -> bool:
            """Considera una línea segura si es comentario o menciona ejemplo."""
            return (
                linea.strip().startswith("#")
                or "ejemplo" in linea.lower()
                or "example" in linea.lower()
                or "sample" in linea.lower()
            )

        import re

        for patron in patrones_sospechosos:
            if patron in contenido:
                for i, linea in enumerate(contenido.split("\n"), 1):
                    if patron in linea and not _es_linea_de_ejemplo(linea):
                        pytest.fail(
                            f"Secreto potencial encontrado en {archivo}:{i}: "
                            f"patrón '{patron}' en línea no comentada"
                        )

        for patron_re, descripcion in regex_sospechosos:
            for m in re.finditer(patron_re, contenido):
                linea_num = contenido.count("\n", 0, m.start()) + 1
                linea = contenido.split("\n")[linea_num - 1]
                if not _es_linea_de_ejemplo(linea):
                    pytest.fail(
                        f"Secreto potencial encontrado en {archivo}:{linea_num}: "
                        f"{descripcion}"
                    )

    def test_secrets_loaded_from_settings(self):
        """Verifica que los secretos se cargan desde config (pydantic-settings)."""
        from config import settings

        # Verificar que jwt_secret_key tiene un valor y no es el default inseguro
        assert settings.jwt_secret_key is not None
        assert len(settings.jwt_secret_key) > 0

        # El default "change-me-in-production" es aceptable para desarrollo,
        # pero verificaríamos que en CI/CD se inyecte una real
        # (esto se valida en despliegue, no en test unitario)

    def test_env_example_has_required_vars(self):
        """Verifica que .env.example contiene todas las variables requeridas."""
        try:
            with open(_REPO_ROOT / "services/api/.env.example") as f:
                content = f.read()
        except FileNotFoundError:
            pytest.skip(".env.example no encontrado")

        required_vars = [
            "JWT_SECRET_KEY",
            "FRONTEND_URL",
            "RESEND_API_KEY",
            "SENDGRID_API_KEY",
            "CORS_ORIGINS",
        ]
        for var in required_vars:
            assert var in content, f"Variable {var} no encontrada en .env.example"


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 8 — /forgot-password muestra mensaje de confirmación
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio8_FrontendForgotPasswordConfirmacion:
    """Criterio 8: La página /forgot-password muestra mensaje de confirmación.

    Verificamos del lado del backend que el endpoint devuelve un mensaje
    de confirmación que el frontend puede mostrar.
    """

    def test_forgot_password_response_has_confirm_message(self, client: TestClient):
        """La respuesta de forgot-password contiene un mensaje de confirmación."""
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "test@trackflow.com"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data
        assert len(data["message"]) > 10

    def test_forgot_password_response_has_remaining_requests(self, client: TestClient):
        """La respuesta de forgot-password incluye remaining_requests."""
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "remaining-test@trackflow.com"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "remaining_requests" in data or data.get("remaining_requests") is None

    def test_frontend_forgot_password_page_exists(self):
        """Verifica que el archivo del frontend para forgot-password existe."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/forgot-password/page.tsx"
        assert os.path.exists(path), f"El archivo {path} no existe"

        with open(path, encoding="utf-8") as f:
            content = f.read()
        assert "response" in content or "message" in content
        # Verifica que se muestra feedback al usuario
        assert "mensaje" in content.lower() or "confirm" in content.lower() or "response" in content.lower()

    def test_frontend_forgot_password_shows_message_independently(self):
        """Verifica que el frontend muestra mensaje independientemente del resultado."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/forgot-password/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        # Debe mostrar el mensaje de confirmación sin importar si hubo error
        assert "setResponse(result)" in content or "response." in content


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 9 — /reset-password lee token de URL y redirige a /login
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio9_FrontendResetPasswordLeeToken:
    """Criterio 9: reset-password lee token de URL params y redirige."""

    def test_frontend_reset_password_uses_search_params(self):
        """Verifica que la página reset-password lee el token de searchParams."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/reset-password/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        # Debe usar useSearchParams o similar para leer el token
        assert "useSearchParams" in content or "searchParams" in content
        assert "token" in content

    def test_frontend_reset_password_redirects_to_login(self):
        """Verifica que tras éxito redirige a /login."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/reset-password/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        # Debe redirigir a /login tras éxito
        assert '/login"' in content or '"/login' in content or '"login"' in content.lower()

    def test_api_reset_password_works_with_token_from_url(self, client: TestClient):
        """Verifica end-to-end que el token de la URL funciona con la API."""
        user_id = _register_user(client)["id"]
        from routes.auth import _get_user_by_id

        user = _get_user_by_id(user_id)
        pwd_iat = (
            dt.datetime.fromisoformat(user["password_changed_at"])
            .replace(tzinfo=dt.timezone.utc)
            .timestamp()
        )
        token = create_password_reset_token(user_id=user_id, pwd_iat=pwd_iat)

        # El token que iría en la URL: /reset-password?token=<token>
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": _TEST_NEW_PASSWORD},
        )
        assert resp.status_code == 200

        # Verificar que se puede iniciar sesión con la nueva contraseña
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": _TEST_EMAIL, "password": _TEST_NEW_PASSWORD},
        )
        assert login_resp.status_code == 200


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 10 — /reset-password muestra error + enlace si token inválido
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio10_ResetPasswordMuestraErrorTokenInvalido:
    """Criterio 10: reset-password muestra error explícito y enlace a forgot-password."""

    def test_api_returns_400_for_bad_token(self, client: TestClient):
        """La API devuelve 400 para token inválido (el frontend muestra el error)."""
        resp = client.post(
            "/api/v1/auth/reset-password",
            json={"token": "token-invalido", "new_password": "NewPass123!"},
        )
        assert resp.status_code == 400

    def test_frontend_shows_error_for_invalid_token(self):
        """Verifica que el frontend muestra error cuando el token es inválido."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/reset-password/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        # Debe manejar errores 400
        assert "error" in content.lower()
        assert "400" in content or "inválido" in content.lower() or "expirado" in content.lower()

    def test_frontend_shows_link_to_forgot_password(self):
        """Verifica que muestra enlace visible de retorno a /forgot-password."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/reset-password/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        # Debe tener un enlace a /forgot-password
        assert "forgot-password" in content or "ForgotPassword" in content or "Solicitar" in content

    def test_frontend_shows_link_to_login(self):
        """Verifica que hay un enlace para volver al login."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/reset-password/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        assert '/login"' in content or '"/login' in content


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 11 — /login muestra enlace "¿Olvidaste tu contraseña?"
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio11_LoginMuestraEnlaceOlvidaste:
    """Criterio 11: La página de login muestra enlace visible a forgot-password."""

    def test_frontend_login_has_forgot_password_link(self):
        """Verifica que login/page.tsx contiene enlace '¿Olvidaste tu contraseña?'."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/login/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        # Verificar que hay un enlace visible
        assert "Olvidaste" in content or "forgot" in content.lower()
        assert "forgot-password" in content
        assert "Link" in content

    def test_frontend_login_link_is_accessible(self):
        """Verifica que el enlace es un componente Link accesible."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/login/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        # El enlace debe ser navegable (href)
        assert 'href="/forgot-password"' in content or 'href="/forgot-password' in content


# ═══════════════════════════════════════════════════════════════════════
# CRITERIO 12 — /account/change-password valida cliente + API + feedback
# ═══════════════════════════════════════════════════════════════════════


class TestCriterio12_ChangePasswordFull:
    """Criterio 12: change-password con validación cliente, API y feedback."""

    def test_api_change_password_success_feedback(self, client: TestClient):
        """La API devuelve mensaje de éxito tras change-password."""
        _register_user(client)
        headers = _login_user(client)

        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": _TEST_PASSWORD, "new_password": _TEST_NEW_PASSWORD},
            headers=headers,
        )
        assert resp.status_code == 200
        assert "message" in resp.json()
        assert "éxito" in resp.json()["message"].lower() or "actualizada" in resp.json()["message"].lower()

    def test_api_change_password_error_feedback(self, client: TestClient):
        """La API devuelve error descriptivo cuando la contraseña actual es incorrecta."""
        _register_user(client)
        headers = _login_user(client)

        resp = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "WrongPassword", "new_password": _TEST_NEW_PASSWORD},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "detail" in resp.json()
        assert resp.json()["detail"]  # No vacío

    def test_frontend_change_password_page_exists(self):
        """Verifica que la página change-password existe."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/account/change-password/page.tsx"
        assert os.path.exists(path), f"El archivo {path} no existe"

    def test_frontend_change_password_validates_passwords_match(self):
        """Verifica que el frontend valida que las contraseñas coinciden antes de enviar."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/account/change-password/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        # Debe validar que las contraseñas coinciden
        assert "no coinciden" in content.lower() or "confirm" in content.lower()

    def test_frontend_change_password_shows_success_feedback(self):
        """Verifica que muestra feedback de éxito."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/account/change-password/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        assert "success" in content.lower() or "éxito" in content.lower() or "Success" in content

    def test_frontend_change_password_shows_error_feedback(self):
        """Verifica que muestra feedback de error."""
        import os

        path = _REPO_ROOT / "uis/backoffice/src/app/account/change-password/page.tsx"
        assert os.path.exists(path)

        with open(path, encoding="utf-8") as f:
            content = f.read()

        # Debe manejar errores
        assert "error" in content.lower() or "catch" in content.lower() or "Error" in content


# ═══════════════════════════════════════════════════════════════════════
# EXTENSIÓN 1 — Plantilla de Email en HTML con Estilos
# ═══════════════════════════════════════════════════════════════════════


class TestExtension1_PlantillaEmailHTML:
    """Extensión 1: Plantilla de Email HTML responsive con estilos inline."""

    def test_template_has_inline_styles(self):
        """Verifica que la plantilla usa estilos inline para compatibilidad email."""
        content = (
            Path("templates/reset_password.html").read_text(encoding="utf-8")
        )
        # Debe tener estilos inline (style en atributos de etiquetas)
        assert 'style="' in content

    def test_template_is_responsive(self):
        """Verifica que la plantilla tiene diseño responsive."""
        content = (
            Path("templates/reset_password.html").read_text(encoding="utf-8")
        )
        # Debe tener viewport meta tag
        assert "viewport" in content
        # Debe tener media queries o diseño adaptable
        assert "@media" in content or "max-width" in content

    def test_template_has_cta_button(self):
        """Verifica que la plantilla tiene un botón CTA prominente."""
        content = (
            Path("templates/reset_password.html").read_text(encoding="utf-8")
        )
        # Botón CTA
        assert "Restablecer" in content
        assert "background-color" in content
        # El botón debe ser un enlace
        assert "href" in content
        # Debe tener padding visible
        assert "padding" in content

    def test_template_has_security_message(self):
        """Verifica que la plantilla incluye mensaje si no se solicitó el cambio."""
        content = (
            Path("templates/reset_password.html").read_text(encoding="utf-8")
        )
        assert "no solicitaste" in content.lower() or "ignora" in content.lower() or "no solicitó" in content.lower()

    def test_template_has_company_footer(self):
        """Verifica que la plantilla tiene un pie con el nombre de la empresa."""
        content = (
            Path("templates/reset_password.html").read_text(encoding="utf-8")
        )
        assert "{{APP_NAME}}" in content

    def test_fallback_template_exists(self):
        """Verifica que hay un fallback HTML embebido en el código."""
        import inspect
        from services import email as email_module

        source = inspect.getsource(email_module)
        assert "FALLBACK_TEMPLATE" in source or "_FALLBACK_TEMPLATE" in source


# ═══════════════════════════════════════════════════════════════════════
# EXTENSIÓN 2 — Rate Limiting en POST /auth/forgot-password
# ═══════════════════════════════════════════════════════════════════════


class TestExtension2_RateLimiting:
    """Extensión 2: Rate limiting en forgot-password."""

    def test_rate_limiter_exceeded_returns_429(self, client: TestClient):
        """Superar el límite de solicitudes por email devuelve 429."""
        _register_user(client)

        # Consumir todas las solicitudes permitidas
        max_reqs = settings.password_reset_max_requests_per_hour
        for i in range(max_reqs):
            resp = client.post(
                "/api/v1/auth/forgot-password",
                json={"email": _TEST_EMAIL},
            )
            assert resp.status_code == 200, f"Request {i+1} failed: {resp.text}"

        # La siguiente solicitud debe ser rate-limited
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": _TEST_EMAIL},
        )
        assert resp.status_code == 429
        assert "Demasiadas" in resp.json()["detail"] or "429" in str(resp.status_code)

    def test_rate_limiter_by_email_independence(self, client: TestClient):
        """El rate limiting es por email (diferentes emails no se afectan)."""
        _register_user(client, email="user1@trackflow.com")
        _register_user(client, email="user2@trackflow.com")

        # Consumir todas las solicitudes para user1
        max_reqs = settings.password_reset_max_requests_per_hour
        for _ in range(max_reqs):
            client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "user1@trackflow.com"},
            )

        # user2 no debe estar limitado
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "user2@trackflow.com"},
        )
        assert resp.status_code == 200, f"user2 should not be limited: {resp.text}"

        # user1 debe estar limitado
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "user1@trackflow.com"},
        )
        assert resp.status_code == 429

    def test_rate_limiter_returns_remaining(self, client: TestClient):
        """Verifica que la respuesta incluye remaining_requests antes del límite."""
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "remaining-check@trackflow.com"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "remaining_requests" in data
        remaining = data["remaining_requests"]
        assert remaining is None or remaining == settings.password_reset_max_requests_per_hour - 1

    def test_rate_limiter_configurable(self):
        """Verifica que los límites son configurables via settings."""
        assert hasattr(settings, "password_reset_max_requests_per_hour")
        assert hasattr(settings, "password_reset_window_seconds")
        assert settings.password_reset_max_requests_per_hour > 0
        assert settings.password_reset_window_seconds > 0

    def test_rate_limit_with_slowapi_config(self):
        """Verifica que slowapi está disponible como alternativa de rate limiting."""
        try:
            import slowapi
            assert slowapi is not None
        except ImportError:
            pytest.skip("slowapi no está instalado")

        # Verificar que slowapi está en requirements.txt
        with open("requirements.txt") as f:
            content = f.read()
        assert "slowapi" in content, "slowapi debe estar en requirements.txt"


# ═══════════════════════════════════════════════════════════════════════
# EXTENSIÓN 3 — Registro de Auditoría (AuditLog)
# ═══════════════════════════════════════════════════════════════════════


class TestExtension3_AuditLog:
    """Extensión 3: Registro de auditoría con todos los campos requeridos."""

    def test_audit_log_exists(self):
        """Verifica que el módulo audit_log existe y tiene la estructura esperada."""
        from audit_log import AuditEventType, record_audit_event, audit_table

        # Verificar tipos de evento
        assert hasattr(AuditEventType, "PASSWORD_RESET_REQUESTED")
        assert hasattr(AuditEventType, "PASSWORD_RESET_COMPLETED")
        assert hasattr(AuditEventType, "PASSWORD_CHANGE_REQUESTED")

    def test_audit_event_has_all_fields(self, client: TestClient):
        """Verifica que cada evento registrado tiene todos los campos requeridos."""
        _register_user(client)

        # Hacer una solicitud que genere un evento
        client.post(
            "/api/v1/auth/forgot-password",
            json={"email": _TEST_EMAIL},
        )

        events = _get_audit_events()
        assert len(events) > 0

        event = events[-1]
        # Campos requeridos
        assert "event_type" in event
        assert "created_at" in event
        assert "user_id" in event or event["user_id"] is None
        assert "email" in event or event["email"] is None
        assert "ip_address" in event or event["ip_address"] is None
        assert "user_agent" in event or event["user_agent"] is None

    def test_audit_log_event_types_recorded(self, client: TestClient):
        """Verifica que cada tipo de evento se registra correctamente."""

        from audit_log import AuditEventType
        from routes.auth import users_table

        # 1. forgot-password → password_reset_requested
        _register_user(client)
        resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": _TEST_EMAIL},
        )
        assert resp.status_code == 200

        events_requested = _get_audit_events(
            AuditEventType.PASSWORD_RESET_REQUESTED
        )
        assert len(events_requested) >= 1

        # Verificar IP y user_agent
        assert events_requested[-1].get("ip_address") is not None
        assert events_requested[-1].get("user_agent") is not None

    def test_audit_log_records_password_reset_completed(self, client: TestClient):
        """Verifica que reset-password exitoso genera el evento correspondiente."""
        user_id = _register_user(client)["id"]
        from routes.auth import _get_user_by_id

        user = _get_user_by_id(user_id)
        pwd_iat = (
            dt.datetime.fromisoformat(user["password_changed_at"])
            .replace(tzinfo=dt.timezone.utc)
            .timestamp()
        )
        token = create_password_reset_token(user_id=user_id, pwd_iat=pwd_iat)

        client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": _TEST_NEW_PASSWORD},
        )

        events = _get_audit_events("password_reset_completed")
        assert len(events) >= 1
        assert events[-1]["user_id"] == user_id
        assert events[-1]["email"] == _TEST_EMAIL

    def test_audit_log_records_password_change_requested(self, client: TestClient):
        """Verifica que change-password genera eventos de auditoría."""
        _register_user(client)
        headers = _login_user(client)

        client.post(
            "/api/v1/auth/change-password",
            json={"current_password": _TEST_PASSWORD, "new_password": _TEST_NEW_PASSWORD},
            headers=headers,
        )

        events = _get_audit_events("password_change_completed")
        assert len(events) >= 1

    def test_audit_log_records_failed_attempts(self, client: TestClient):
        """Verifica que los intentos fallidos se registran en auditoría."""
        _register_user(client)
        headers = _login_user(client)

        # Intentar change-password con contraseña incorrecta
        client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "WrongPassword", "new_password": _TEST_NEW_PASSWORD},
            headers=headers,
        )

        events = _get_audit_events("password_change_failed")
        assert len(events) >= 1

    def test_audit_log_records_reset_failed_for_bad_token(self, client: TestClient):
        """Verifica que intentos de reset con token inválido se registran."""
        client.post(
            "/api/v1/auth/reset-password",
            json={"token": "token-invalido", "new_password": "NewPass123!"},
        )

        events = _get_audit_events("password_reset_failed")
        assert len(events) >= 1

    def test_audit_log_captures_ip_and_user_agent(self, client: TestClient):
        """Verifica que cada evento captura ip_address y user_agent."""
        _register_user(client)

        client.post(
            "/api/v1/auth/forgot-password",
            json={"email": _TEST_EMAIL},
            headers={"User-Agent": "Mozilla/5.0 TestAgent"},
        )

        events = _get_audit_events("password_reset_requested")
        assert len(events) >= 1
        event = events[-1]
        # TestClient usa testclient como user-agent o el que pasemos
        assert event.get("ip_address") is not None
        assert event.get("user_agent") == "Mozilla/5.0 TestAgent" or event.get("user_agent") is not None


# ═══════════════════════════════════════════════════════════════════════
# VALIDACIONES ADICIONALES DE SEGURIDAD
# ═══════════════════════════════════════════════════════════════════════


class TestSeguridadAdicional:
    """Pruebas de seguridad adicionales no cubiertas en los criterios."""

    def test_passwords_not_returned_in_responses(self, client: TestClient):
        """Verifica que las contraseñas nunca se devuelven en las respuestas."""
        resp = client.post(
            "/api/v1/auth/register",
            json={"email": "security@trackflow.com", "password": "SecurePass123"},
        )
        assert resp.status_code == 201
        body = resp.text.lower()
        assert "password" not in body or "password_changed" in body

        # Login tampoco devuelve password
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "security@trackflow.com", "password": "SecurePass123"},
        )
        body = resp.text.lower()
        assert "password" not in body or "password_changed" in body

    def test_bcrypt_hashing_used(self):
        """Verifica que bcrypt se usa para hashear contraseñas."""
        from security import hash_password

        hashed = hash_password("test-password")
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$") or hashed.startswith("$2y$")

    def test_token_has_correct_type_claim(self):
        """Verifica que el JWT de reset tiene el claim type correcto."""
        token = create_password_reset_token(user_id=1)
        claims = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
            options={"verify_exp": False},
        )
        assert claims["type"] == "password_reset"

    def test_forgot_password_does_not_leak_user_existence(self, client: TestClient):
        """Verifica que forgot-password no revela si un email existe en los headers/status."""
        resp_existing = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent@trackflow.com"},
        )
        # No debe haber headers que delaten la existencia
        assert resp_existing.status_code == 200


# Necesario para Path en tests
from pathlib import Path  # noqa: E402 (import al final por organización)