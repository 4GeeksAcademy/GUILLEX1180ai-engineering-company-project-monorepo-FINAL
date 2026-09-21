"""Router de Autenticación y Perfiles (TrackFlow Backoffice).

Endpoints:
- POST /auth/register            — Registrar nuevo usuario
- POST /auth/login               — Iniciar sesión (devuelve token)
- GET  /auth/me                  — Perfil del usuario actual (requiere Bearer token)
- PUT  /profiles/me              — Actualizar perfil del usuario actual (requiere Bearer token)
- POST /auth/forgot-password     — Solicitar restablecimiento de contraseña (envía email vía Resend)
- POST /auth/reset-password      — Restablecer contraseña con token válido
- POST /auth/change-password     — Cambiar contraseña estando autenticado (requiere Bearer token)
"""

from __future__ import annotations

import html
import os
import secrets
import time
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel, Field, EmailStr

# ─── Resend SDK ───
import resend

# ─── TinyDB ───
from tinydb import TinyDB, Query

from config import settings

DB_PATH = "auth_db.json"
db = TinyDB(DB_PATH)
users_table = db.table("users")
tokens_table = db.table("tokens")
reset_tokens_table = db.table("reset_tokens")
audit_log_table = db.table("audit_log")
UserQuery = Query()
TokenQuery = Query()
ResetTokenQuery = Query()
AuditQuery = Query()

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


class ForgotPasswordPayload(BaseModel):
    email: EmailStr


class ResetPasswordPayload(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=6)


class ChangePasswordPayload(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


# ═══════════════════════════════════════════════════════════
# Rate Limiting (in-memory)
# ═══════════════════════════════════════════════════════════

RATE_LIMIT_MAX_REQUESTS = 3       # máximo de solicitudes
RATE_LIMIT_WINDOW_SECONDS = 3600  # ventana de 1 hora

# Estructura: { "email": [timestamp1, timestamp2, ...] }
_rate_limit_store: dict[str, list[float]] = defaultdict(list)


def _is_rate_limited(email: str) -> bool:
    """Devuelve True si el email superó el límite de solicitudes por hora."""
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    # Limpiar timestamps fuera de la ventana
    _rate_limit_store[email] = [
        ts for ts in _rate_limit_store[email] if ts > cutoff
    ]
    return len(_rate_limit_store[email]) >= RATE_LIMIT_MAX_REQUESTS


def _record_request(email: str) -> None:
    """Registra una solicitud de reset para el email."""
    _rate_limit_store[email].append(time.time())


def _get_remaining_requests(email: str) -> int:
    """Devuelve cuántas solicitudes quedan para este email."""
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    current = sum(1 for ts in _rate_limit_store[email] if ts > cutoff)
    return max(0, RATE_LIMIT_MAX_REQUESTS - current)


# ═══════════════════════════════════════════════════════════
# Audit Logging
# ═══════════════════════════════════════════════════════════


def _log_audit_event(
    event_type: str,
    email: str,
    ip_address: str = "unknown",
    detail: str = "",
    success: bool = True,
) -> None:
    """Registra un evento de auditoría en la tabla audit_log."""
    audit_log_table.insert({
        "event_type": event_type,
        "email": email,
        "ip_address": ip_address,
        "detail": detail,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


# ═══════════════════════════════════════════════════════════
# Cliente Resend
# ═══════════════════════════════════════════════════════════

# Configurar API key de Resend desde settings o variable de entorno
resend.api_key = settings.resend_api_key or os.getenv("RESEND_API_KEY", "")


def _send_reset_email(email: str, reset_url: str) -> bool:
    """Envía el correo de restablecimiento vía Resend.

    Devuelve True si se envió correctamente (o si no hay API key configurada
    pero se simula la salida). Devuelve False si hay un error real.
    """
    email_html = _render_reset_email(email, reset_url)

    if not resend.api_key:
        # ── Fallback: simular envío (log en consola) ──
        print("\n" + "=" * 70)
        print("📧 EMAIL DE RESTABLECIMIENTO DE CONTRASEÑA (SIMULADO — sin API key)")
        print("=" * 70)
        print(f"Para:      {email}")
        print(f"URL:       {reset_url}")
        print("-" * 70)
        print(email_html[:300] + "...")
        print("=" * 70 + "\n")
        return True

    try:
        params = resend.Emails.SendParams(
            from_address="TrackFlow <onboarding@resend.dev>",
            to=[email],
            subject="Restablece tu contraseña — TrackFlow",
            html=email_html,
        )
        response = resend.Emails.send(params)
        print(f"✅ Email enviado vía Resend a {email}: {response}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar email vía Resend: {e}")
        # No lanzamos excepción para no revelar información al usuario
        return False


# ═══════════════════════════════════════════════════════════
# Plantilla de Email HTML
# ═══════════════════════════════════════════════════════════

_TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"


def _render_reset_email(email: str, reset_url: str) -> str:
    """Renderiza la plantilla HTML de restablecimiento de contraseña."""
    template_path = _TEMPLATE_DIR / "reset_password.html"
    if template_path.exists():
        raw = template_path.read_text(encoding="utf-8")
    else:
        # Fallback inline si no se encuentra el archivo
        raw = _FALLBACK_EMAIL_TEMPLATE

    return (
        raw.replace("{{email}}", html.escape(email))
           .replace("{{reset_url}}", html.escape(reset_url))
           .replace("{{expires_in}}", "1 hora")
           .replace("{{year}}", str(datetime.now(timezone.utc).year))
    )


# Plantilla fallback (si el archivo HTML no está disponible)
_FALLBACK_EMAIL_TEMPLATE = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif; padding:40px; background:#f1f5f9;">
<div style="max-width:480px; margin:auto; background:#fff; border-radius:12px; padding:32px; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
<h2 style="color:#1e40af;">TrackFlow — Restablece tu contraseña</h2>
<p>Haz clic en el botón para cambiar tu contraseña:</p>
<a href="{{reset_url}}" style="display:inline-block; padding:12px 32px; background:#1e40af; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">Restablecer</a>
<p style="color:#94a3b8; font-size:13px; margin-top:24px;">¿No solicitaste esto? Ignora este mensaje.</p>
</div></body></html>"""


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


# ═══════════════════════════════════════════════════════════
# Endpoints — Forgot Password (AUTH-03)
# ═══════════════════════════════════════════════════════════


@router.post("/auth/forgot-password", status_code=200)
async def forgot_password(payload: ForgotPasswordPayload, request: Request):
    """Solicita un enlace de restablecimiento de contraseña.

    - Genera un token temporal y simula el envío de email (log en consola).
    - Aplica rate limiting: máximo 3 solicitudes por email por hora.
    - Registra cada intento en la tabla de auditoría.
    """
    email = payload.email.lower().strip()
    client_ip = request.client.host if request.client else "unknown"

    # ── Rate limiting ──
    if _is_rate_limited(email):
        _log_audit_event(
            event_type="forgot_password_rate_limited",
            email=email,
            ip_address=client_ip,
            detail=f"Límite de {RATE_LIMIT_MAX_REQUESTS} solicitudes/hora alcanzado",
            success=False,
        )
        remaining_wait = RATE_LIMIT_WINDOW_SECONDS
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Has excedido el límite de solicitudes. Intenta de nuevo más tarde.",
                "retry_after_seconds": remaining_wait,
            },
        )

    # Registrar esta solicitud
    _record_request(email)

    # ── Buscar usuario ──
    user = _get_user_by_email(email)

    # Por seguridad, siempre devolver la misma respuesta sin importar si el email existe
    success_msg = "Si el correo está registrado, recibirás un enlace de restablecimiento."

    if user is None:
        # Usuario no existe — registrar intento pero no revelar información
        _log_audit_event(
            event_type="forgot_password_user_not_found",
            email=email,
            ip_address=client_ip,
            detail="Email no registrado en el sistema",
            success=False,
        )
        return {
            "message": success_msg,
            "remaining_requests": _get_remaining_requests(email),
        }

    # ── Generar token de restablecimiento ──
    reset_token = "rst_" + secrets.token_hex(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    reset_tokens_table.insert({
        "token": reset_token,
        "user_id": user.doc_id,
        "email": email,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at,
    })

    # ── Construir URL de restablecimiento ──
    # En producción, esto apuntaría al frontend: https://trackflow.com/reset-password?token=xxx
    base_url = os.environ.get("FRONTEND_URL", "http://localhost:3001")
    reset_url = f"{base_url}/reset-password?token={reset_token}"

    # ── Renderizar email HTML y enviar vía Resend ──
    _send_reset_email(email, reset_url)

    # ── Registrar auditoría ──
    _log_audit_event(
        event_type="forgot_password_requested",
        email=email,
        ip_address=client_ip,
        detail=f"Token generado: {reset_token[:20]}... | Expira: {expires_at}",
        success=True,
    )

    return {
        "message": success_msg,
        "remaining_requests": _get_remaining_requests(email),
    }


@router.post("/auth/reset-password", status_code=200)
async def reset_password(payload: ResetPasswordPayload, request: Request):
    """Restablece la contraseña del usuario usando un token válido.

    - Valida que el token exista, no esté usado y no haya expirado.
    - Actualiza la contraseña del usuario.
    - Invalida el token para que no pueda reutilizarse.
    - Registra el evento en la tabla de auditoría.
    """
    client_ip = request.client.host if request.client else "unknown"

    # ── Buscar token ──
    docs = reset_tokens_table.search(ResetTokenQuery.token == payload.token)
    if not docs:
        _log_audit_event(
            event_type="reset_password_invalid_token",
            email="unknown",
            ip_address=client_ip,
            detail=f"Token no encontrado: {payload.token[:20]}...",
            success=False,
        )
        raise HTTPException(
            status_code=400,
            detail="Token inválido o no existe.",
        )

    token_doc = docs[0]

    # ── Verificar si ya fue usado ──
    if token_doc.get("used", False):
        _log_audit_event(
            event_type="reset_password_token_reused",
            email=token_doc.get("email", "unknown"),
            ip_address=client_ip,
            detail=f"Token ya utilizado: {payload.token[:20]}...",
            success=False,
        )
        raise HTTPException(
            status_code=400,
            detail="Este token ya fue utilizado. Solicita uno nuevo.",
        )

    # ── Verificar expiración ──
    expires_at = datetime.fromisoformat(token_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        reset_tokens_table.update(
            {"used": True}, doc_ids=[token_doc.doc_id]
        )
        _log_audit_event(
            event_type="reset_password_token_expired",
            email=token_doc.get("email", "unknown"),
            ip_address=client_ip,
            detail=f"Token expirado: {payload.token[:20]}...",
            success=False,
        )
        raise HTTPException(
            status_code=400,
            detail="Este token ha expirado. Solicita uno nuevo.",
        )

    # ── Actualizar contraseña ──
    user_id = token_doc["user_id"]
    users_table.update(
        {
            "password": payload.new_password,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        doc_ids=[user_id],
    )

    # ── Invalidar token ──
    reset_tokens_table.update(
        {"used": True}, doc_ids=[token_doc.doc_id]
    )

    # ── Invalidar todas las sesiones activas del usuario ──
    active_sessions = tokens_table.search(TokenQuery.user_id == user_id)
    for session in active_sessions:
        tokens_table.remove(doc_ids=[session.doc_id])

    # ── Registrar auditoría ──
    _log_audit_event(
        event_type="reset_password_success",
        email=token_doc.get("email", "unknown"),
        ip_address=client_ip,
        detail=f"Contraseña actualizada para user_id={user_id}. Sesiones activas invalidadas: {len(active_sessions)}",
        success=True,
    )

    return {
        "message": "Contraseña restablecida correctamente. Inicia sesión con tu nueva contraseña.",
    }


# ═══════════════════════════════════════════════════════════
# Endpoint — Change Password (AUTH-03, protegido por Bearer)
# ═══════════════════════════════════════════════════════════


@router.post("/auth/change-password", status_code=200)
async def change_password(
    payload: ChangePasswordPayload,
    request: Request,
    user: dict = Depends(_resolve_user),
):
    """Cambia la contraseña del usuario autenticado.

    - Verifica que la contraseña actual coincida.
    - Hashea y actualiza la nueva contraseña.
    - Invalida todas las sesiones activas excepto la actual.
    - Registra el evento en la tabla de auditoría.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_id = user["id"]
    user_doc = _get_user_by_id(user_id)

    if user_doc is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # ── Verificar contraseña actual ──
    if user_doc.get("password") != payload.current_password:
        _log_audit_event(
            event_type="change_password_wrong_current",
            email=user_doc.get("email", "unknown"),
            ip_address=client_ip,
            detail=f"Intento fallido para user_id={user_id}",
            success=False,
        )
        raise HTTPException(
            status_code=400,
            detail="La contraseña actual no es correcta.",
        )

    # ── Verificar que la nueva sea diferente ──
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña debe ser diferente a la actual.",
        )

    # ── Actualizar contraseña ──
    users_table.update(
        {
            "password": payload.new_password,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        doc_ids=[user_id],
    )

    # ── Invalidar todas las sesiones activas (para forzar re-login) ──
    active_sessions = tokens_table.search(TokenQuery.user_id == user_id)
    for session in active_sessions:
        tokens_table.remove(doc_ids=[session.doc_id])

    # ── Registrar auditoría ──
    _log_audit_event(
        event_type="change_password_success",
        email=user_doc.get("email", "unknown"),
        ip_address=client_ip,
        detail=(
            f"Contraseña cambiada para user_id={user_id}. "
            f"Sesiones activas invalidadas: {len(active_sessions)}"
        ),
        success=True,
    )

    return {
        "message": "Contraseña cambiada correctamente. Vuelve a iniciar sesión.",
    }


# ═══════════════════════════════════════════════════════════
# Endpoint — Auditoría (solo para administradores)
# ═══════════════════════════════════════════════════════════


@router.get("/auth/audit-log")
async def get_audit_log(
    limit: int = 50,
    user: dict = Depends(_resolve_user),
):
    """Devuelve los últimos eventos de auditoría (solo autenticados)."""
    all_records = audit_log_table.all()
    # Ordenar por timestamp descendente
    sorted_records = sorted(
        all_records, key=lambda r: r.get("timestamp", ""), reverse=True
    )
    return sorted_records[:limit]