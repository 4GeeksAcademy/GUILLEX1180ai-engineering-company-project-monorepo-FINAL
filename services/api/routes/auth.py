"""Router de Autenticación y Perfiles (TrackFlow Backoffice).

Endpoints:
- POST /auth/register       — Registrar nuevo usuario
- POST /auth/login          — Iniciar sesión (devuelve token)
- GET  /auth/me             — Perfil del usuario actual (requiere Bearer token)
- PUT  /profiles/me         — Actualizar perfil del usuario actual (requiere Bearer token)
"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field

# ─── TinyDB ───
from tinydb import TinyDB, Query

DB_PATH = "auth_db.json"
db = TinyDB(DB_PATH)
users_table = db.table("users")
tokens_table = db.table("tokens")
UserQuery = Query()
TokenQuery = Query()

router = APIRouter(tags=["Auth"])


# ═══════════════════════════════════════════════════════════
# Modelos Pydantic
# ═══════════════════════════════════════════════════════════


class RegisterPayload(BaseModel):
    email: str = Field(..., min_length=3, max_length=120)
    password: str = Field(..., min_length=3)
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class LoginPayload(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[dict] = None


class UserProfileResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


class ProfileUpdatePayload(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


# ═══════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════


def _generate_token() -> str:
    return "tf_" + secrets.token_hex(32)


def _get_user_by_email(email: str):
    docs = users_table.search(UserQuery.email == email)
    return docs[0] if docs else None


def _get_user_by_id(user_id: int):
    doc = users_table.get(doc_id=user_id)
    return doc


def _get_token_user(token: str) -> Optional[dict]:
    """Busca un token en la tabla de tokens y devuelve el usuario asociado."""
    tokens = tokens_table.search(TokenQuery.token == token)
    if not tokens:
        return None
    token_doc = tokens[0]
    user = _get_user_by_id(token_doc["user_id"])
    if user is None:
        return None
    # Enriquecer con id
    user["id"] = token_doc["user_id"]
    return user


def _user_to_profile(doc, doc_id: int) -> UserProfileResponse:
    return UserProfileResponse(
        id=doc_id,
        email=doc.get("email", ""),
        name=doc.get("name"),
        phone=doc.get("phone"),
        address=doc.get("address"),
        created_at=doc.get("created_at", ""),
        updated_at=doc.get("updated_at"),
    )


async def _resolve_user(authorization: str = Header(None)) -> dict:
    """Extrae y valida el token Bearer, devuelve el usuario."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Formato de token inválido")
    user = _get_token_user(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return user


# ═══════════════════════════════════════════════════════════
# Endpoints — Registro
# ═══════════════════════════════════════════════════════════


@router.post("/auth/register", status_code=201)
async def register(payload: RegisterPayload):
    """Registra un nuevo usuario.

    Verifica que el email no exista, crea el usuario y devuelve datos básicos.
    """
    # Normalizar email
    email = payload.email.lower().strip()

    # Validar email único
    existing = _get_user_by_email(email)
    if existing is not None:
        raise HTTPException(status_code=409, detail="Este correo electrónico ya está registrado")

    now = datetime.now(timezone.utc).isoformat()
    doc_data = {
        "email": email,
        "password": payload.password,  # En producción usar hash
        "name": payload.name,
        "phone": payload.phone,
        "address": payload.address,
        "created_at": now,
        "updated_at": None,
    }
    doc_id = users_table.insert(doc_data)

    return {
        "id": doc_id,
        "email": email,
    }


# ═══════════════════════════════════════════════════════════
# Endpoints — Login
# ═══════════════════════════════════════════════════════════


@router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginPayload):
    """Autentica al usuario y devuelve un token Bearer."""
    email = payload.email.lower().strip()
    user = _get_user_by_email(email)

    if user is None or user.get("password") != payload.password:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Generar token
    token = _generate_token()
    tokens_table.insert({
        "token": token,
        "user_id": user.doc_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": user.doc_id,
            "email": user["email"],
            "name": user.get("name"),
        },
    )


# ═══════════════════════════════════════════════════════════
# Endpoints — Perfil (protegidos)
# ═══════════════════════════════════════════════════════════


@router.get("/auth/me", response_model=UserProfileResponse)
async def get_me(user: dict = Depends(_resolve_user)):
    """Devuelve el perfil del usuario autenticado."""
    return _user_to_profile(user, user["id"])


@router.put("/profiles/me", response_model=UserProfileResponse)
async def update_me(
    payload: ProfileUpdatePayload,
    user: dict = Depends(_resolve_user),
):
    """Actualiza el perfil del usuario autenticado (name, phone, address)."""
    now = datetime.now(timezone.utc).isoformat()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    update_data["updated_at"] = now

    users_table.update(update_data, doc_ids=[user["id"]])
    updated = users_table.get(doc_id=user["id"])
    if updated is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    updated["id"] = user["id"]
    return _user_to_profile(updated, user["id"])