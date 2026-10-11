"""Módulo de seguridad central — Hashing de contraseñas y tokens JWT.

Responsabilidades:
  1. Hashing de contraseñas con **bcrypt** (bcrypt-escaza; nunca texto plano).
     - `hash_password(password)`  → hash bcrypt string
     - `verify_password(password, hashed)` → bool (retrocompatible: acepta
       hashes con prefijo `$2` / `$2a$` de bcrypt; los valores en claro
       legados devuelven `False`).
  2. Emisión y validación de **tokens JWT** de corta duración para el
     flujo de restablecimiento de contraseña:
     - Claims: `sub` (user_id), `type: "password_reset"`, `iat`, `exp`,
       `pwd_iat` (timestamp del último cambio de contraseña del usuario —
       clave para invalidar tokens antiguos de forma atómica).
     - `pwd_iat` se compara contra `password_changed_at` en BD: si el token
       se emitió *antes* del último cambio de contraseña, se rechaza, lo que
       invalida *todos* los tokens de reset emitidos con la contraseña
       anterior sin necesidad de una denylist.

Seguridad:
  - Algoritmo HMAC-SHA256 (`HS256`) con clave secreta de `JWT_SECRET_KEY`.
  - Máx. duración del token configurable (`password_reset_token_ttl_minutes`,
    por defecto 15 minutos, entre 15 y 30).
  - Claims tipados y validados con las validaciones predeterminadas de PyJWT
    (`iat`, `exp`, `sub`). Tokens con `type != "password_reset"` se rechazan.
"""

from __future__ import annotations

import datetime as dt
from typing import Any

import bcrypt
import jwt

# Configuración importada desde config.py (pydantic-settings) para que
# los valores se lean de variables de entorno en tiempo de arranque.
from config import settings

# ─── Excepción pública del módulo ───


class InvalidResetTokenError(Exception):
    """Token de restablecimiento inválido, expirado, reutilizado o mal formado."""


# ═══════════════════════════════════════════════════════════
# Hashing de contraseñas
# ═══════════════════════════════════════════════════════════


def hash_password(password: str) -> str:
    """Devuelve el hash bcrypt de una contraseña.

    El cost factor por defecto de bcrypt (12) ofrece una buena relación
    seguridad/rendimiento. El salt se genera automáticamente y se embebe
    en el propio hash, por lo que no hace falta almacenarlo aparte.
    """
    if not isinstance(password, str):
        raise TypeError("password debe ser un string")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str | None) -> bool:
    """Verifica una contraseña contra su hash.

    Retrocompatibilidad: si `hashed` es `None`, vacío, un hash de coste
    inferior a 4, o no es un hash bcrypt reconocible, devuelve `False`
    (nunca lanza), permitiendo que el sistema coexista con el esquema
    legado de texto plano sin dar información sobre el formato interno.
    """
    if not password or not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        # Hash malformado (p.ej. texto plano legado, hashes de otros esquemas)
        return False


# ═══════════════════════════════════════════════════════════
# Tokens JWT de restablecimiento de contraseña
# ═══════════════════════════════════════════════════════════


def _now_ts() -> int:
    """Timestamp UNIX (segundos) con la hora UTC actual."""
    return int(dt.datetime.now(dt.timezone.utc).timestamp())


def create_password_reset_token(user_id: int, pwd_iat: float | None = None) -> str:
    """Genera un JWT de restablecimiento firmado y de corta duración.

    Args:
        user_id:  Identificador del usuario que solicita el restablecimiento.
        pwd_iat:  Timestamp UNIX del último cambio de contraseña del usuario
                  (columna ``password_changed_at``). Debe reflejarse con la
                  máxima precisión disponible (float con microsegundos) para
                  que la comparación de invalidación ``pwd_iat <
                  password_changed_at`` sea estricta incluso en el mismo
                  segundo. Si es ``None``, se usa el instante actual.

    Returns:
        Token JWT firmado con HS256.
    """
    now = _now_ts()
    payload: dict[str, Any] = {
        "sub": str(user_id),          # Subject — user_id (string, estándar JWT)
        "type": "password_reset",     # Tipo de token (evita reusarlo como access)
        "iat": now,                   # Emitido en (segundos)
        "exp": now + settings.password_reset_token_ttl_seconds,  # Expira en
        "pwd_iat": now if pwd_iat is None else pwd_iat,  # Estado exacto de contraseña
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def verify_password_reset_token(token: str) -> dict[str, Any]:
    """Valida un token de restablecimiento y devuelve sus claims.

    Rechaza (lanza `InvalidResetTokenError`) si:
      - El token no es válido o está mal formado.
      - La firma no coincide con `JWT_SECRET_KEY`.
      - El token ha expirado (`exp`).
      - El tipo no es `password_reset` (rechaza reuso como access token).

    NOTA: La comprobación de que el token no haya sido utilizado (comparación
    de `pwd_iat` contra `password_changed_at`) se realiza en el endpoint
    `reset-password`, que tiene acceso al usuario de la BD.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
            options={
                "require": ["sub", "exp", "iat"],  # claims obligatorios
            },
        )
    except jwt.ExpiredSignatureError as exc:
        raise InvalidResetTokenError("Token expirado") from exc
    except jwt.PyJWTError as exc:
        raise InvalidResetTokenError("Token inválido") from exc

    if payload.get("type") != "password_reset":
        raise InvalidResetTokenError("Tipo de token no permitido")

    return payload