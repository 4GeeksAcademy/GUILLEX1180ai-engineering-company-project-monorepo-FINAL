"""Rate limiting en memoria para el flujo de restablecimiento de contraseña.

Protege ``POST /auth/forgot-password`` contra abuso / enumeración de correos
y spam de correos transaccionales.

Estrategia (best practices):
  - Límite por **email** (clave principal). Por defecto 3 solicitudes por
    dirección en una ventana de 1 hora.
  - Se mantiene la respuesta **genérica** (200 OK con el mensaje fijo) para
    no revelar si un email existe o no — incluso cuando el límite se alcanza,
    la respuesta no diferencia estados, salvo por el código HTTP 429 cuando
    el límite se supera (información inofensiva por sí misma).
  - El contador es por proceso (en memoria). Para despliegues multi-instancia
    habría que sustituir el almacén por Redis (misma interfaz: ``register``).

Uso:
    from rate_limiter import password_reset_limiter

    if password_reset_limiter.exceeded("alice@example.com"):
        raise HTTPException(429, ...)
    password_reset_limiter.register("alice@example.com")
"""

from __future__ import annotations

import threading
import time


class SlidingWindowRateLimiter:
    """Rate limiter de ventana deslizante (sin lógica de ancho fijo).

    Guarda los timestamps de cada solicitud por clave. Al comprobar,
    descarta las entradas más antiguas que la ventana (lazy) y cuenta
    las restantes.
    """

    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._store: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def exceeded(self, key: str) -> bool:
        """Devuelve ``True`` si `key` ha superado el límite en la ventana."""
        now = time.monotonic()
        with self._lock:
            timestamps = self._store.get(key, [])
            # Limpieza lazy de timestamps fuera de ventana
            timestamps = [t for t in timestamps if now - t < self._window_seconds]
            self._store[key] = timestamps
            return len(timestamps) >= self._max_requests

    def register(self, key: str) -> None:
        """Registra una nueva solicitud para `key`."""
        now = time.monotonic()
        with self._lock:
            timestamps = self._store.get(key, [])
            # Mantener solo la ventana (evita crecimiento ilimitado)
            timestamps = [t for t in timestamps if now - t < self._window_seconds]
            timestamps.append(now)
            self._store[key] = timestamps

    def remaining(self, key: str) -> int:
        """Devuelve el número de solicitudes restantes antes del límite.

        Si ya superó el límite, devuelve 0.
        """
        now = time.monotonic()
        with self._lock:
            timestamps = self._store.get(key, [])
            timestamps = [t for t in timestamps if now - t < self._window_seconds]
            self._store[key] = timestamps
            used = len(timestamps)
            return max(0, self._max_requests - used)

    def reset(self, key: str | None = None) -> None:
        """Limpia el historial de una clave (o todo si `key` es ``None``).

        Utilidad para tests y cambios de configuración en caliente.
        """
        with self._lock:
            if key is None:
                self._store.clear()
            else:
                self._store.pop(key, None)


from config import settings  # noqa: E402  (después de la clase)

# ─── Instancia única del limiter para forgot-password ───
password_reset_limiter = SlidingWindowRateLimiter(
    max_requests=settings.password_reset_max_requests_per_hour,
    window_seconds=settings.password_reset_window_seconds,
)