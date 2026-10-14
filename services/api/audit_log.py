"""Registro de auditoría de eventos de seguridad.

Almacena de forma persistente (TinyDB) un historial de eventos relevantes
para el equipo de seguridad, p. ej.:

  - ``password_reset_requested``  — alguien pidió un enlace de reset.
  - ``password_reset_completed``  — se completó un restablecimiento.
  - ``password_reset_failed``     — token inválido/expirado/reutilizado.
  - ``password_change_requested`` — cambio por parte de un usuario autenticado.

Cada registro captura:
  - ``event_type``   — tipo de evento (ver `AuditEventType`).
  - ``user_id``      — id del usuario (o ``None`` si no autenticado).
  - ``email``        — email implicado (útil cuando no hay sesión).
  - ``ip_address``   — IP de origen de la petición.
  - ``user_agent``   — User-Agent del cliente.
  - ``created_at``   — timestamp UTC ISO-8601.

Seguridad:
  - Nunca se almacenan contraseñas, hashes ni tokens.
  - La email/email del usuario se guarda para correlación forense.
  - Este módulo no expone ningún endpoint de lectura; el acceso al
    historial queda restringido a herramientas internas (no ruteado).
"""

from __future__ import annotations

import datetime as dt
from enum import StrEnum

from tinydb import TinyDB

# Misma BD TinyDB que el router de auth para mantener un único archivo.
DB_PATH = "auth_db.json"
audit_db = TinyDB(DB_PATH)
audit_table = audit_db.table("audit_log")


class AuditEventType(StrEnum):
    """Tipos de evento de seguridad registrados."""

    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_COMPLETED = "password_reset_completed"
    PASSWORD_RESET_FAILED = "password_reset_failed"
    PASSWORD_CHANGE_REQUESTED = "password_change_requested"
    PASSWORD_CHANGE_COMPLETED = "password_change_completed"
    PASSWORD_CHANGE_FAILED = "password_change_failed"


def record_audit_event(
    *,
    event_type: AuditEventType | str,
    user_id: int | None = None,
    email: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> int:
    """Persiste un evento de seguridad en la tabla ``audit_log``.

    Args:
        event_type:   Tipo de evento (`AuditEventType` o string).
        user_id:      Id del usuario autenticado, si existe.
        email:        Email implicado (se almacena normalizado a minúsculas).
        ip_address:   IP de la petición (Header ``x-forwarded-for`` o remote).
        user_agent:   User-Agent del cliente.

    Returns:
        El ``doc_id`` del registro insertado.
    """
    now = dt.datetime.now(dt.timezone.utc)
    entry = {
        "event_type": str(event_type),
        "user_id": user_id,
        "email": (email or "").lower().strip() or None,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "created_at": now.isoformat(),
    }
    return audit_table.insert(entry)


def extract_request_context(request) -> tuple[str | None, str | None]:
    """Extrae (ip, user_agent) de una Request de FastAPI de forma segura.

    Respeta el header ``X-Forwarded-For`` cuando la API está detrás de un
    proxy/reverse (nunca confiamos ciegamente en el primero si el proxy no
    está configurado; tomamos el valor más a la derecha como fallback de
    proxies no fiables). Al no poder conocer la configuración de proxies,
    se devuelve el valor completo por defecto; el equipo de infra puede
    ajustar la estrategia según su topología.
    """
    user_agent = request.headers.get("user-agent")
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Primer valor = cliente original (tras proxies confiables)
        ip_address = forwarded_for.split(",")[0].strip()
    else:
        ip_address = request.client.host if request.client else None
    return ip_address, user_agent