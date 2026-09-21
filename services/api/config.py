"""Configuración de la API de Suppliers.

Variables de entorno y settings centralizados usando Pydantic Settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración global de la API de Suppliers."""

    app_name: str = "TrackFlow Suppliers API"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
    ]

    # Resend
    resend_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()