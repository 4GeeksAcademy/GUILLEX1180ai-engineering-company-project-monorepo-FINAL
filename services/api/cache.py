"""Módulo de caché genérico en memoria con expiración por TTL.

Uso:
    from cache import api_cache

    # Consultar (devuelve None si no existe o expiró)
    data = api_cache.get("incidents:list:status=open")

    # Almacenar con TTL en segundos
    api_cache.set("incidents:list:status=open", response_data, ttl=15)

    # Invalidar por prefijo (invalida todas las claves que empiecen con el patrón)
    api_cache.invalidate_prefix("incidents:")

Garantías de seguridad:
- NO almacena tokens, headers de autenticación ni datos de sesión.
- Las claves se componen exclusivamente de método + ruta + query params.
- La caché es un diccionario en memoria del proceso — no persiste a disco.
"""

from __future__ import annotations

import time
import threading
from typing import Any


class TTLCache:
    """Caché en memoria con expiración por TTL (Time To Live).

    Thread-safe: utiliza un lock para operaciones de escritura.
    Limpieza lazy: los entries expirados se eliminan bajo demanda
    (al hacer get o al invalidar por prefijo).
    """

    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, float]] = {}  # key → (value, expires_at)
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        """Obtiene un valor de la caché. Devuelve None si no existe o expiró."""
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            # Expirado — limpiar lazy
            with self._lock:
                # Doble check bajo lock para evitar race condition
                current = self._store.get(key)
                if current and time.monotonic() > current[1]:
                    del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: float = 30.0) -> None:
        """Almacena un valor con TTL en segundos."""
        expires_at = time.monotonic() + ttl
        with self._lock:
            self._store[key] = (value, expires_at)

    def invalidate_prefix(self, prefix: str) -> int:
        """Elimina todas las claves que comiencen con `prefix`.

        Returns:
            Número de claves eliminadas.
        """
        to_delete = [
            key for key in self._store
            if key.startswith(prefix)
        ]
        with self._lock:
            for key in to_delete:
                del self._store[key]
        return len(to_delete)

    def clear(self) -> None:
        """Elimina todos los entries de la caché."""
        with self._lock:
            self._store.clear()

    @property
    def size(self) -> int:
        """Número de entries activos (incluye potencialmente algunos expirados)."""
        return len(self._store)


# ─── Instancia global compartida ───
api_cache = TTLCache()
