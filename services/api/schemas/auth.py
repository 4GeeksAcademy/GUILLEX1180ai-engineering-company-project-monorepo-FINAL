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