# =============================================================================
# TrackFlow — Dockerfile del Backend (FastAPI + Uvicorn)
# Construye la API de Suppliers con hot-reload en desarrollo
# =============================================================================

FROM python:3.12-slim

# ── Instalar uv (ultra-fast Python package installer) ──
RUN pip install --no-cache-dir uv

WORKDIR /app

# ── Copiar requirements primero (caching de capas) ──
COPY services/api/requirements.txt services/api/requirements.txt

# ── Instalar dependencias del proyecto ──
RUN uv pip install --system -r services/api/requirements.txt

# ── Copiar código del backend ──
COPY services/ services/
COPY packages/ packages/

# ── PYTHONPATH para imports desde la raíz del monorepo ──
ENV PYTHONPATH=/app

# ── Directorio de trabajo donde está main.py ──
WORKDIR /app/services/api

# ── Puerto del backend ──
EXPOSE 8001

# ── Comando de arranque con hot-reload ──
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]