"""Router de Autenticación y Perfiles (TrackFlow Backoffice).

Endpoints:
- POST /auth/register            — Registrar nuevo usuario
- POST /auth/login               — Iniciar sesión (devuelve token)
- POST /auth/forgot-password     — Solicita enlace de reset (anti-enumeración)
- POST /auth/reset-password      — Restablece contraseña con token JWT
- POST /auth/change-password     — Cambia contraseña (usuario autenticado)
- GET  /auth/me                  — Perfil del usuario actual (requiere Bearer token)
- PUT  /profiles/me              — Actualizar perfil del usuario actual (requiere Bearer token)

Seguridad:
  - Contraseñas almacenadas con **bcrypt** (nunca texto plano).
  - Tokens de reset JWT firmados con `JWT_SECRET_KEY` y de corta duración.
  - `forgot-password` responde SIEMPRE 200 genérico (no filtra emails).
  - Rate limiting por email en `forgot-password`.
  - Registro de auditoría (audit_log) para eventos de seguridad.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header, Request

# ─── Tinydb ───
from tinydb import TinyDB, Query

from models import (
    RegisterPayload,
    LoginPayload,
    ProfileUpdatePayload,
    ForgotPasswordPayload,
    ResetPasswordPayload,
    ChangePasswordPayload,
    RegisterResponse,
    UserInfo,
    TokenResponse,
    AuthResponse,
    UserProfileResponse,
    ForgotPasswordResponse,
    PasswordChangedResponse,
)
from security import (
    hash_password,
    verify_password,
    create_password_reset_token,
    verify_password_reset_token,
    InvalidResetTokenError,
)
from rate_limiter import password_reset_limiter
from audit_log import record_audit_event, extract_request_context, AuditEventType
from services.email import send_password_reset_email

DB_PATH = "auth_db.json"
db = TinyDB(DB_PATH)
users_table = db.table("users")
tokens_table = db.table("tokens")
UserQuery = Query()
TokenQuery = Query()

router = APIRouter(tags=["Auth"])


# ═══════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════


def _generate_token() -> str:
    return "tf_" + secrets.token_hex(32)


def _utcnow_iso() -> str:
    """Timestamp UTC ISO-8601 para almacenar en TinyDB."""
    return datetime.now(timezone.utc).isoformat()


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


@router.post("/auth/register", status_code=201, response_model=RegisterResponse)
async def register(payload: RegisterPayload):
    """Registra un nuevo usuario.

    Verifica que el email no exista, crea el usuario y devuelve confirmación.
    La contraseña se almacena **hasheada con bcrypt** (nunca texto plano).
    Nunca devuelve credenciales ni el email en la respuesta.
    """
    # Normalizar email
    email = payload.email.lower().strip()

    # Validar email único
    existing = _get_user_by_email(email)
    if existing is not None:
        raise HTTPException(status_code=409, detail="Este correo electrónico ya está registrado")

    now = _utcnow_iso()
    doc_data = {
        "email": email,
        "password": hash_password(payload.password),  # bcrypt hash
        "name": payload.name,
        "phone": payload.phone,
        "address": payload.address,
        "created_at": now,
        "updated_at": None,
        # Timestamp del último cambio de contraseña. Se inicializa al momento
        # de creación para que el mecanismo de invalidación por `pwd_iat`
        # funcione desde el primer registro.
        "password_changed_at": _utcnow_iso(),
    }
    doc_id = users_table.insert(doc_data)

    return RegisterResponse(
        id=doc_id,
        message="Usuario creado con éxito",
    )


# ═══════════════════════════════════════════════════════════
# Endpoints — Login
# ═══════════════════════════════════════════════════════════


@router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginPayload):
    """Autentica al usuario y devuelve un token Bearer."""
    email = payload.email.lower().strip()
    user = _get_user_by_email(email)

    # Verificación temporalmente constante; `verify_password` es seguro ante
    # hashes malformados (devuelve False sin lanzar).
    if user is None or not verify_password(payload.password, user.get("password")):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Generar token
    token = _generate_token()
    tokens_table.insert({
        "token": token,
        "user_id": user.doc_id,
        "created_at": _utcnow_iso(),
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserInfo(
            id=user.doc_id,
            email=user["email"],
            name=user.get("name"),
        ),
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
# Endpoints — Recuperación de contraseña
# ═══════════════════════════════════════════════════════════


def _password_changed_at_to_ts(value) -> float | None:
    """Convierte un `password_changed_at` ISO a timestamp UNIX (float).

    Se usa **float con microsegundos** (no int) para que la comparación de
    invalidación `pwd_iat < password_changed_at` sea estricta incluso si el
    token se emite y se consume dentro del mismo segundo cronológico.

    Devuelve ``None`` si el campo no existe o es inválido (usuarios creados
    antes de la migración sin `password_changed_at`). En ese caso el token se
    emite con el instante actual (equivalente a "sin historial previo").
    """
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
        # Normalizar a aware (si era naive, asumimos UTC)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.timestamp()
    except (ValueError, TypeError):
        return None


@router.post(
    "/auth/forgot-password",
    response_model=ForgotPasswordResponse,
)
async def forgot_password(payload: ForgotPasswordPayload, request: Request):
    """Solicita un enlace de restablecimiento de contraseña.

    Seguridad:
      - Respuesta SIEMPRE 200 con mensaje genérico (exista o no el email).
      - Rate limiting por email (429 si se supera el límite horario).
      - Registro de auditoría (`password_reset_requested`).
    """
    email = payload.email.lower().strip()
    ip_address, user_agent = extract_request_context(request)

    # ── Rate limiting (anti-abuso / anti-spam) ──
    if password_reset_limiter.exceeded(email):
        # Registramos el intento bloqueado para correlación forense.
        record_audit_event(
            event_type=AuditEventType.PASSWORD_RESET_REQUESTED,
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(
            status_code=429,
            detail="Demasiadas solicitudes. Inténtalo de nuevo más tarde.",
        )
    password_reset_limiter.register(email)

    user = _get_user_by_email(email)

    if user is not None:
        # Emitir token JWT vinculado al estado de contraseña (`pwd_iat`).
        pwd_iat = _password_changed_at_to_ts(user.get("password_changed_at"))
        token = create_password_reset_token(user_id=user.doc_id, pwd_iat=pwd_iat)
        # Envío best-effort: un fallo de email NUNCA altera la respuesta genérica.
        send_password_reset_email(to_email=email, reset_token=token)

    # Auditoría (registramos el email para correlación, sin exponer nada).
    record_audit_event(
        event_type=AuditEventType.PASSWORD_RESET_REQUESTED,
        user_id=user.doc_id if user is not None else None,
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # Respuesta idéntica con o sin usuario (anti-enumeración).
    remaining = password_reset_limiter.remaining(email)
    return ForgotPasswordResponse(remaining_requests=remaining)


@router.post(
    "/auth/reset-password",
    response_model=PasswordChangedResponse,
)
async def reset_password(payload: ResetPasswordPayload, request: Request):
    """Restablece la contraseña de un usuario mediante token JWT.

    Validaciones:
      - La firma JWT y su expiración se verifican en `verify_password_reset_token`.
      - **Invalidación de un solo uso:** el claim `pwd_iat` del token se
        compara contra `password_changed_at` del usuario. Si el token se emitió
        ANTES del último cambio de contraseña (porque ya se usó otro token o
        el usuario cambió la contraseña manualmente), se rechaza con 400.

    Tras un reset correcto:
      - `password_changed_at = ahora` → invalida automáticamente este token
        y cualquier otro token de reset anterior (mecanismo de un solo uso
        sin denylist).
    """
    ip_address, user_agent = extract_request_context(request)

    # 1) Validar firma + expiración + tipo de token
    try:
        claims = verify_password_reset_token(payload.token)
    except InvalidResetTokenError as exc:
        record_audit_event(
            event_type=AuditEventType.PASSWORD_RESET_FAILED,
            email=None,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(status_code=400, detail="Token inválido o expirado") from exc

    # 2) Resolver usuario a partir del claim `sub`
    try:
        user_id = int(claims["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Token inválido") from exc

    user = _get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=400, detail="Token inválido o expirado",
        )

    # 3) Invalidación de un solo uso: token emitido antes del último cambio
    token_pwd_iat = claims.get("pwd_iat")
    last_change_ts = _password_changed_at_to_ts(user.get("password_changed_at"))
    if last_change_ts is not None and token_pwd_iat is not None and token_pwd_iat < last_change_ts:
        record_audit_event(
            event_type=AuditEventType.PASSWORD_RESET_FAILED,
            user_id=user_id,
            email=user.get("email"),
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(
            status_code=400, detail="Token inválido o expirado",
        )

    # 4) Actualizar contraseña + invalidar tokens antiguos
    now_iso = _utcnow_iso()
    users_table.update(
        {
            "password": hash_password(payload.new_password),
            "password_changed_at": now_iso,
            "updated_at": now_iso,
        },
        doc_ids=[user_id],
    )

    record_audit_event(
        event_type=AuditEventType.PASSWORD_RESET_COMPLETED,
        user_id=user_id,
        email=user.get("email"),
        ip_address=ip_address,
        user_agent=user_agent,
    )

    return PasswordChangedResponse()


# ═══════════════════════════════════════════════════════════
# Endpoints — Cambio de contraseña (autenticado)
# ═══════════════════════════════════════════════════════════


@router.post(
    "/auth/change-password",
    response_model=PasswordChangedResponse,
)
async def change_password(
    payload: ChangePasswordPayload,
    request: Request,
    user: dict = Depends(_resolve_user),
):
    """Cambia la contraseña del usuario autenticado.

    Requiere la contraseña actual para autorizar la operación (defensa en
    profundidad incluso con sesión activa). Tras el cambio se actualiza
    `password_changed_at`, lo que invalida cualquier token de reset emitido
    anteriormente.

    Errores:
      - 401: sin sesión o token inválido (por `_resolve_user`).
      - 400: si `current_password` no coincide con el hash almacenado.
    """
    email = user.get("email")
    ip_address, user_agent = extract_request_context(request)

    # Verificar la contraseña actual contra el hash almacenado
    if not verify_password(payload.current_password, user.get("password")):
        record_audit_event(
            event_type=AuditEventType.PASSWORD_CHANGE_FAILED,
            user_id=user.get("id"),
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    now_iso = _utcnow_iso()
    users_table.update(
        {
            "password": hash_password(payload.new_password),
            "password_changed_at": now_iso,
            "updated_at": now_iso,
        },
        doc_ids=[user["id"]],
    )

    record_audit_event(
        event_type=AuditEventType.PASSWORD_CHANGE_COMPLETED,
        user_id=user["id"],
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    return PasswordChangedResponse()