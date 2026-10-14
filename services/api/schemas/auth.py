"""Esquemas de autenticación y perfiles — Separación estricta input/output.

Principios de seguridad:
  - `RegisterResponse` NUNCA devuelve email ni password.
  - `TokenResponse` solo contiene el token (sin datos de usuario).
  - `UserInfo` expone solo id, email y name (NUNCA password/hash).
  - `UserProfileResponse` expone datos de perfil editables (phone, address).
  - Los esquemas de entrada (`RegisterPayload`, `LoginPayload`, `ProfileUpdatePayload`)
    solo aceptan los campos que el cliente debe enviar.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════
# Input (Request) Schemas
# ═══════════════════════════════════════════════════════════


class RegisterPayload(BaseModel):
    """Datos para registrar un nuevo usuario.

    El campo email se normaliza a minúsculas antes de almacenar.
    NOTA: En producción usar hash de password, no texto plano.
    """

    email: str = Field(..., min_length=3, max_length=120)
    password: str = Field(..., min_length=3)
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class LoginPayload(BaseModel):
    """Credenciales de inicio de sesión."""

    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class ProfileUpdatePayload(BaseModel):
    """Campos editables del perfil de usuario.

    NUNCA incluye email (no modificable desde este endpoint) ni password.
    """

    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


# ═══════════════════════════════════════════════════════════
# Contraseña — Input (Request) Schemas
# ═══════════════════════════════════════════════════════════


class ForgotPasswordPayload(BaseModel):
    """Solicitud de restablecimiento: solo el email (público).

    No requiere autenticación. La respuesta NUNCA revela si el email existe.
    """

    email: str = Field(..., min_length=3, max_length=120)


class ResetPasswordPayload(BaseModel):
    """Restablecimiento de contraseña con token JWT.

    El token es de un solo uso (invalidado por `password_changed_at`).
    """

    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangePasswordPayload(BaseModel):
    """Cambio de contraseña para usuarios autenticados.

    Requiere la contraseña actual para autorizar la operación.
    """

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


# ═══════════════════════════════════════════════════════════
# Contraseña — Output (Response) Schemas
# ═══════════════════════════════════════════════════════════


class ForgotPasswordResponse(BaseModel):
    """Respuesta genérica anti-enumeración.

    Siempre devuelve el mismo mensaje, exista o no el email.
    Incluye el número de solicitudes restantes en la ventana de rate limiting.
    """

    message: str = (
        "Si la dirección está registrada, recibirás un enlace para "
        "restablecer tu contraseña."
    )
    remaining_requests: Optional[int] = Field(
        default=None,
        description="Solicitudes restantes en la ventana de rate limiting. "
        "Solo se envía cuando el cliente no ha superado el límite.",
    )


class PasswordChangedResponse(BaseModel):
    """Respuesta de confirmación de cambio/restablecimiento de contraseña."""

    message: str = "Contraseña actualizada con éxito"


# ═══════════════════════════════════════════════════════════
# Output (Response) Schemas
# ═══════════════════════════════════════════════════════════


class RegisterResponse(BaseModel):
    """Respuesta del registro. Nunca devuelve credenciales ni email."""

    id: int
    message: str = "Usuario creado con éxito"


class UserInfo(BaseModel):
    """Información pública de un usuario (sin password ni hash)."""

    id: int
    email: str
    name: Optional[str] = None


class TokenResponse(BaseModel):
    """Respuesta de login: solo token, sin datos de usuario."""

    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Respuesta completa de login con token e información del usuario.

    NOTA: `access_token` y `user` se devuelven juntos para que el frontend
    pueda almacenar ambos en una sola llamada.
    """

    access_token: str
    token_type: str = "bearer"
    user: Optional[UserInfo] = None


class UserProfileResponse(BaseModel):
    """Perfil completo del usuario (sin password ni hash)."""

    id: int
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None