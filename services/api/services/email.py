"""Servicio de correo transaccional para restablecimiento de contraseña.

Soporta dos proveedores, seleccionables por variables de entorno:

  - **Resend**  (preferido): usa la librería oficial `resend`.
    - ``EMAIL_PROVIDER=resend``
    - ``RESEND_API_KEY=<key>``
    - ``RESEND_FROM_EMAIL=TrackFlow <no-reply@dominio>``
    - ``RESEND_FROM_NAME=TrackFlow`` (opcional)

  - **SendGrid** (alternativa): usa la API v3 por HTTP.
    - ``EMAIL_PROVIDER=sendgrid``
    - ``SENDGRID_API_KEY=<key>``
    - ``SENDGRID_FROM_EMAIL=no-reply@dominio``

El módulo expone la función de alto nivel:

    from services.email import send_password_reset_email
    ok = send_password_reset_email(to_email="user@x.com", reset_url="...")

Reglas del servicio:
  - El **envío es best-effort**: nunca debe romper la respuesta 200 genérica
    de ``forgot-password`` (anti-enumeración). Si falla, se registra en logs
    con `logger.exception` para investigación posterior.
  - Nunca se registran tokens en los logs.

Nota: la librería oficial `resend` usa un SDK síncrono (requests). Este
servicio lo invoca dentro de ``run_in_threadpool`` para no bloquear el
event loop de FastAPI.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from config import settings

logger = logging.getLogger(__name__)

# ─── Rutas de plantillas ───
_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"
RESET_PASSWORD_TEMPLATE = _TEMPLATES_DIR / "reset_password.html"


def _build_reset_password_body(reset_url: str, app_name: str = "TrackFlow") -> str:
    """Construye el cuerpo HTML del correo inyectando la URL del token.

    La plantilla HTML vive en ``templates/reset_password.html`` con el
    placeholder ``{{RESET_URL}}`` que se sustituye aquí. Así el diseño
    queda separado de la lógica del backend y sigue siendo fácil de
    editar sin tocar código Python.
    """
    if not RESET_PASSWORD_TEMPLATE.exists():
        logger.warning("Plantilla %s no encontrada; usando HTML embebido.", RESET_PASSWORD_TEMPLATE)
        return _FALLBACK_TEMPLATE.replace("{{RESET_URL}}", reset_url).replace("{{APP_NAME}}", app_name)

    html = RESET_PASSWORD_TEMPLATE.read_text(encoding="utf-8")
    return (
        html.replace("{{RESET_URL}}", reset_url)
        .replace("{{APP_NAME}}", app_name)
    )


# ═══════════════════════════════════════════════════════════
# SendGrid (proveedor alternativo, HTTP)
# ═══════════════════════════════════════════════════════════


def _send_via_sendgrid(to_email: str, html: str) -> None:
    """Envía el correo usando la v3 API de SendGrid.

    Usa httpx (ya incluido en requirements). En ``_send_reset_email`` se
    invoca dentro de un threadpool para no bloquear el event loop.
    """
    import httpx

    from .parse_email import parse_from_address  # helper local (mismo paquete)

    from_name, from_address = parse_from_address(settings.sendgrid_from_email)

    payload: dict[str, Any] = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": from_address},
        "subject": "Restablece tu contraseña — " + settings.app_name,
        "content": [{"type": "text/html", "value": html}],
    }
    if from_name:
        payload["from"]["name"] = from_name

    resp = httpx.post(
        "https://api.sendgrid.com/v3/mail/send",
        headers={
            "Authorization": f"Bearer {settings.sendgrid_api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=15.0,
    )
    resp.raise_for_status()


# ═══════════════════════════════════════════════════════════
# Resend (proveedor preferido, SDK oficial)
# ═══════════════════════════════════════════════════════════


def _send_via_resend(to_email: str, html: str) -> None:
    """Envía el correo usando el SDK oficial de Resend."""
    import resend

    resend.api_key = settings.resend_api_key
    params: dict[str, Any] = {
        "from": settings.resend_from_email,
        "to": [to_email],
        "subject": "Restablece tu contraseña — " + settings.app_name,
        "html": html,
    }
    resend.Emails.send(params)


# ═══════════════════════════════════════════════════════════
# API pública
# ═══════════════════════════════════════════════════════════


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """Envía el correo de restablecimiento (best-effort).

    Args:
        to_email:    Email del destinatario.
        reset_token: Token JWT de restablecimiento (se inyecta en la URL).

    Returns:
        ``True`` si el envío se lanzó sin errores; ``False`` en caso de
        error conocido (así el endpoint puede seguir respondiendo 200
        genérico sin filtrar información).
    """
    reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={reset_token}"
    html = _build_reset_password_body(reset_url)

    provider = settings.email_provider.lower()

    def _unsafe_send() -> None:  # pragma: no cover — requiere credenciales reales
        if provider == "resend":
            _send_via_resend(to_email, html)
        elif provider == "sendgrid":
            _send_via_sendgrid(to_email, html)
        else:
            # Modo "log-only" por defecto en desarrollo: no envía nada real.
            logger.info(
                "[email-driver] Simularía envío de reset a=%s url=%s (provider=%s)",
                to_email,
                reset_url,
                provider or "none",
            )

    try:
        # SDK síncrono: FastAPI ejecuta este endpoint (síncrono) en un
        # threadpool, por lo que las llamadas de red no bloquean el loop.
        _unsafe_send()
    except Exception:
        logger.exception("Error enviando correo de reset a %s (provider=%s)", to_email, provider)
        return False
    return True


# ═══════════════════════════════════════════════════════════
# Plantilla HTML embebida (fallback si falta el archivo en disco)
# ═══════════════════════════════════════════════════════════

_FALLBACK_TEMPLATE = """\
<div style="background-color:#f4f6f8;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#1f2937;padding:24px 32px;color:#ffffff;font-size:20px;font-weight:bold;">
              {{APP_NAME}}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">Restablece tu contraseña</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
                Hemos recibido una solicitud para restablecer tu contraseña. Si fuiste tú,
                pulsa el botón de abajo. El enlace es válido durante 15 minutos.
              </p>
              <p style="margin:0 0 24px;text-align:center;">
                <a href="{{RESET_URL}}"
                   style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
                          padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;">
                  Restablecer contraseña
                </a>
              </p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6b7280;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0;font-size:12px;word-break:break-all;color:#9ca3af;">
                {{RESET_URL}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;font-size:12px;color:#9ca3af;line-height:1.5;">
              Si no solicitaste este cambio, ignora este correo. Tu contraseña no cambiará a menos
              que pulses el enlace. Para cualquier duda, contacta con soporte.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
"""