"""Configuración de la API de Suppliers.

Variables de entorno y settings centralizados usando Pydantic Settings.

Sensibilidad:
  - ``JWT_SECRET_KEY`` — clave de firma de tokens (NUNCA en el código).
  - ``RESEND_API_KEY`` / ``SENDGRID_API_KEY`` — credenciales de correo.
  - ``FRONTEND_URL`` — base pública del frontend para enlaces de reset.
  - ``EMAIL_PROVIDER`` — backend de correo ("resend" | "sendgrid" | "log").
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

    # ─── Seguridad / JWT ───
    # Clave de firma HMAC para tokens de restablecimiento (obligatoria en prod)
    jwt_secret_key: str = "change-me-in-production"
    # Duración del token de reset en minutos (15–30 min recomendado).
    password_reset_token_ttl_minutes: int = 15

    @property
    def password_reset_token_ttl_seconds(self) -> int:
        """Duración del token en segundos (derivada de los minutos).

        JWT usa ``exp`` en segundos; esta propiedad evita que el valor se
        desincronice si se cambia ``password_reset_token_ttl_minutes``.
        """
        return self.password_reset_token_ttl_minutes * 60

    # ─── Rate limiting (forgot-password) ───
    # Máx. solicitudes por email en la ventana (por defecto 3/hora).
    password_reset_max_requests_per_hour: int = 3
    password_reset_window_seconds: int = 3600

    # ─── Email (Resend preferido; SendGrid alternativo) ───
    email_provider: str = "log"  # "resend" | "sendgrid" | "log"
    resend_api_key: str = ""
    resend_from_email: str = "TrackFlow <no-reply@trackflow.local>"
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "no-reply@trackflow.local"

    # ─── Config interna (pydantic-settings) ───
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()