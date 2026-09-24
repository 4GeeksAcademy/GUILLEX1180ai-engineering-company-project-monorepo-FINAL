# =============================================================================
# TrackFlow — Dockerfile del backend (/services)
# Basado en Python oficial, instala uv y las dependencias del API.
# Expone el puerto 8001 para Uvicorn con --reload habilitado.
# =============================================================================

FROM python:3.12-slim

# ── Instalar uv (ultra-fast Python package installer) ──
RUN pip install --no-cache-dir uv

WORKDIR /app

# ── Copiar requirements primero (caching de capas) ──
COPY services/api/requirements.txt services/api/requirements.txt
COPY packages/shared/ packages/shared/

# ── Instalar dependencias del proyecto ──
RUN uv pip install --system -r services/api/requirements.txt

# ── Copiar el resto del código del backend ──
COPY services/ services/

# ── Directorio de trabajo donde está main.py ──
WORKDIR /app/services/api

# ── Puerto del backend ──
EXPOSE 8001

# ── Comando de arranque con hot-reload ──
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]