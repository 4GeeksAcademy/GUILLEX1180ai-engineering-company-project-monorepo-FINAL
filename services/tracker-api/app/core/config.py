"""Configuración de la aplicación.

Variables de entorno y settings centralizados usando Pydantic Settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración global de la API."""

    app_name: str = "TrackFlow Tracker API"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # Base de datos
    database_url: str = "sqlite:///./trackflow.db"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
    ]

    class Config:
        env_file = ".env"


settings = Settings()