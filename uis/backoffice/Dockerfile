# =============================================================================
# TrackFlow — Dockerfile del Backoffice (Next.js)
# Construcción multi-etapa para producción
# =============================================================================

# ---- Etapa 1: dependencias ----
FROM node:22-alpine AS deps
WORKDIR /app

# Copiar package.json de backoffice y shared
COPY uis/backoffice/package.json ./uis/backoffice/
COPY uis/backoffice/next.config.js ./uis/backoffice/
COPY packages/shared/package.json ./packages/shared/

# Instalar dependencias del backoffice
WORKDIR /app/uis/backoffice
RUN npm install

# ---- Etapa 2: builder ----
FROM node:22-alpine AS builder
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app /app

# Copiar código fuente completo
COPY uis/backoffice/ ./uis/backoffice/
COPY packages/ ./packages/

# Build de producción
WORKDIR /app/uis/backoffice
RUN npm run build

# ---- Etapa 3: producción ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar standalone y assets
COPY --from=builder /app/uis/backoffice/.next/standalone ./
COPY --from=builder /app/uis/backoffice/.next/static ./.next/static
COPY --from=builder /app/uis/backoffice/public ./public

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]