"""Configuración de la API de Suppliers.

Variables de entorno y settings centralizados usando Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Configuración global de la API de Suppliers."""

    app_name: str = "TrackFlow Suppliers API"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # Frontend
    frontend_url: str = "http://localhost:3001"

    # CORS — se sobreescribe con variable de entorno CORS_ORIGINS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8080",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Permite pasar CORS_ORIGINS como string separado por comas."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        extra = "allow"

    # Resend
    resend_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()