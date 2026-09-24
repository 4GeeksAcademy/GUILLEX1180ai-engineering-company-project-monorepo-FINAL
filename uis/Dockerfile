# =============================================================================
# TrackFlow — Dockerfile de interfaces (/uis)
# Imagen multi-etapa para arrancar website (puerto 3000) y backoffice (puerto 3001)
# en modo desarrollo con hot-reload.
# =============================================================================

# ---------- Etapa 1: dependencias de website ----------
FROM node:22-alpine AS website-deps
WORKDIR /app/website
COPY website/package.json ./
RUN npm install

# ---------- Etapa 2: dependencias de backoffice ----------
FROM node:22-alpine AS backoffice-deps
WORKDIR /app/backoffice
COPY backoffice/package.json ./
COPY backoffice/next.config.js ./
RUN npm install

# ---------- Etapa 3: imagen final ----------
FROM node:22-alpine AS final

# Crear directorios para cada aplicación
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=website-deps /app/website /app/website
COPY --from=backoffice-deps /app/backoffice /app/backoffice

# Copiar el código fuente de cada aplicación
COPY website/ website/
COPY backoffice/ backoffice/

# Copiar script de arranque
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Exponer los puertos de las aplicaciones
EXPOSE 3000
EXPOSE 3001

# Comando por defecto: arrancar ambas aplicaciones simultáneamente
CMD ["/app/start.sh"]