"""Helpers de utilidad para el servicio de email.

``parse_from_address`` separa un remitente con formato
``"Nombre &lt;email@dominio&gt;"`` (o solo ``"email@dominio"``) en
``(nombre, email)``, necesario para la API de SendGrid.
"""

from __future__ import annotations

import re

_EMAIL_RE = re.compile(r"<([^<>]+)>")


def parse_from_address(raw: str) -> tuple[str | None, str]:
    """Divide ``raw`` (ej: ``"TrackFlow <no-reply@x.com>"``) en (name, email)."""
    if not raw or not raw.strip():
        return None, ""
    raw = raw.strip()
    match = _EMAIL_RE.search(raw)
    if match:
        email = match.group(1).strip()
        name = raw[: match.start()].strip(" \"'<>").strip()
        return (name or None), email
    # Sin `<...>` → asumimos que es solo un email
    return None, raw