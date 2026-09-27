# =============================================================================
# TrackFlow — Dockerfile de la Application (Next.js)
# Construcción multi-etapa para producción
# =============================================================================

# ---- Etapa 1: dependencias ----
FROM node:22-alpine AS deps
WORKDIR /app

# Copiar package.json de application y shared
COPY uis/application/package.json ./uis/application/
COPY packages/shared/package.json ./packages/shared/

# Instalar dependencias
WORKDIR /app/uis/application
RUN npm install

# ---- Etapa 2: builder ----
FROM node:22-alpine AS builder
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app /app

# Copiar código fuente completo
COPY uis/application/ ./uis/application/
COPY packages/ ./packages/

# Build de producción
WORKDIR /app/uis/application
RUN npm run build

# ---- Etapa 3: producción ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar standalone y assets
COPY --from=builder /app/uis/application/.next/standalone ./
COPY --from=builder /app/uis/application/.next/static ./.next/static
COPY --from=builder /app/uis/application/public ./public

EXPOSE 3002

ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]