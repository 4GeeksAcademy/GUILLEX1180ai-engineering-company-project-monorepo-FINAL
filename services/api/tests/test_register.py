"""Tests unitarios para POST /api/v1/auth/register — Registro de usuarios (AUTH-088).

Cobertura:
  - Camino feliz: registro exitoso con credenciales válidas
  - Caso límite: valores en bordes de validación (longitud mínima/máxima, capitalización)
  - Modo de fallo: email duplicado, campos faltantes, validaciones de entrada
"""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestRegister:
    """POST /api/v1/auth/register"""

    # ── Camino feliz ──

    def test_register_success(self, client: TestClient):
        """Registro exitoso con credenciales válidas (correo nuevo y contraseña correcta)."""
        payload = {
            "email": "nuevo@trackflow.com",
            "password": "SecurePass123",
            "name": "Usuario Test",
            "phone": "+52 555 123 4567",
            "address": "Calle Ejemplo 42",
        }
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert data["email"] == "nuevo@trackflow.com"

    def test_register_minimal_fields(self, client: TestClient):
        """Registro exitoso solo con campos obligatorios (email y password)."""
        payload = {"email": "minimal@trackflow.com", "password": "Min123"}
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "minimal@trackflow.com"
        assert "id" in data

    # ── Caso límite ──

    def test_register_minimum_password_length(self, client: TestClient):
        """Caso límite: contraseña con la longitud mínima exacta (3 caracteres)."""
        payload = {"email": "shortpass@trackflow.com", "password": "abc"}
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "shortpass@trackflow.com"

    def test_register_minimum_email_length(self, client: TestClient):
        """Caso límite: email con la longitud mínima (3 caracteres)."""
        payload = {"email": "a@b", "password": "ValidPass123"}
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "a@b"

    def test_register_maximum_email_length(self, client: TestClient):
        """Caso límite: email con la longitud máxima permitida (120 caracteres)."""
        local_part = "user" + "a" * 110
        email = f"{local_part}@b.co"
        # Truncar a 120 caracteres
        email = email[:120]
        payload = {"email": email, "password": "ValidPass123"}
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == email.lower()

    def test_register_email_case_insensitivity(self, client: TestClient):
        """Caso límite: email con mayúsculas se normaliza a minúsculas."""
        payload = {"email": "CaseTest@TrackFlow.com", "password": "Pass123"}
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        # El endpoint normaliza a minúsculas
        assert data["email"] == "casetest@trackflow.com"

    # ── Modo de fallo ──

    def test_register_duplicate_email(self, client: TestClient):
        """Modo de fallo: intento de registro con un email que ya existe."""
        payload = {"email": "duplicado@trackflow.com", "password": "Pass123"}
        # Primer registro — debe funcionar
        resp1 = client.post("/api/v1/auth/register", json=payload)
        assert resp1.status_code == 201

        # Segundo registro con el mismo email — debe fallar con 409
        resp2 = client.post("/api/v1/auth/register", json=payload)
        assert resp2.status_code == 409
        data = resp2.json()
        assert "detail" in data
        assert "ya está registrado" in data["detail"].lower()

    def test_register_duplicate_email_different_case(self, client: TestClient):
        """Modo de fallo: email duplicado con diferente capitalización."""
        payload_lower = {"email": "dupcase@trackflow.com", "password": "Pass123"}
        client.post("/api/v1/auth/register", json=payload_lower)

        payload_upper = {"email": "DUPCASE@TRACKFLOW.COM", "password": "Pass456"}
        resp = client.post("/api/v1/auth/register", json=payload_upper)
        assert resp.status_code == 409
        assert "ya está registrado" in resp.json()["detail"].lower()

    def test_register_missing_email(self, client: TestClient):
        """Modo de fallo: payload sin campo email."""
        resp = client.post("/api/v1/auth/register", json={"password": "Pass123"})
        assert resp.status_code == 422

    def test_register_missing_password(self, client: TestClient):
        """Modo de fallo: payload sin campo password."""
        resp = client.post("/api/v1/auth/register", json={"email": "nopass@trackflow.com"})
        assert resp.status_code == 422

    def test_register_empty_email(self, client: TestClient):
        """Modo de fallo: email vacío (no cumple min_length)."""
        resp = client.post(
            "/api/v1/auth/register", json={"email": "", "password": "Pass123"}
        )
        assert resp.status_code == 422

    def test_register_short_password(self, client: TestClient):
        """Modo de fallo: contraseña con menos de 3 caracteres."""
        resp = client.post(
            "/api/v1/auth/register",
            json={"email": "short@trackflow.com", "password": "ab"},
        )
        assert resp.status_code == 422