"""Fixtures compartidos para los tests de la API.

Proporciona un cliente HTTP de prueba (TestClient) con una base de datos
TinyDB aislada, truncando todas las tablas antes de cada test para evitar
contaminación entre pruebas.
"""

from __future__ import annotations

from typing import Generator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _clean_db() -> Generator[None, None, None]:
    """Limpia todas las tablas de TinyDB antes de cada test.

    TinyDB instancia tablas singleton a nivel de módulo. Para evitar
    contaminación entre tests, truncamos (vaciado) todas las tablas
    conocidas antes de cada ejecución.
    """
    # Importar y truncar tablas de auth
    from routes.auth import users_table, tokens_table
    users_table.truncate()
    tokens_table.truncate()

    # Importar y truncar tablas de suppliers e incidents
    from database import suppliers_table, incidents_table
    suppliers_table.truncate()
    incidents_table.truncate()

    # Importar y truncar tabla de leads
    from routes.leads import leads_table
    leads_table.truncate()

    yield


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Cliente HTTP de pruebas montado sobre la aplicación FastAPI.

    Usa ``TestClient`` de ``httpx`` (incluido con FastAPI) para enviar
    peticiones reales a la aplicación sin necesidad de levantar un servidor.
    """
    # Importación tardía para evitar that FastAPI se inicialice antes
    # de que el fixture _isolate_db haya cambiado el cwd
    from main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    """Crea un usuario de prueba y devuelve headers con token Bearer.

    Utilidad para tests que requieren autenticación.
    """
    # Registrar usuario
    client.post(
        "/api/v1/auth/register",
        json={"email": "testuser@trackflow.com", "password": "TestPass123"},
    )
    # Iniciar sesión
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@trackflow.com", "password": "TestPass123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}