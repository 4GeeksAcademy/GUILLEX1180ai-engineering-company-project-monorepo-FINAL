# =============================================================================
# TrackFlow — Backend API (services/api)
# Imagen de producción para FastAPI + TinyDB
# Usada por Render / Railway / Fly.io, o localmente con `docker build`.
# =============================================================================

FROM python:3.12-slim AS runtime

# Evita escribir .pyc y activa salida estándar sin buffer (logs en tiempo real)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# 1) Copiar primero sólo las dependencias para aprovechar la caché de capas
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 2) Copiar el código de la API
COPY . .

# 3) Crear usuario sin privilegios (buena práctica de seguridad)
RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

# Uvicorn de producción, escuchando en el puerto que inyecte la plataforma
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]