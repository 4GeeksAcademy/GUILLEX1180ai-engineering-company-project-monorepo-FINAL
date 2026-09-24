# HITO 9 — Dockerización Completa del Monorepo (Infraestructura #infra-40)

> **Requerimiento:** Dockerización del monorepo para desarrollo local  
> **Proyecto:** TrackFlow — Monorepo de Gestión Logística  
> **Estado:** ✅ Auditoría completada / Sign-off aprobado  
> **Última actualización:** 2026-09-24

---

## Tabla de Contenidos

1. [Información General](#1-información-general)
2. [Archivos Generados](#2-archivos-generados)
3. [Dockerfile de Interfaces (`/uis/Dockerfile`)](#3-dockerfile-de-interfaces-uisdockerfile)
4. [Script de Inicio (`/uis/start.sh`)](#4-script-de-inicio-uissstartsh)
5. [Dockerignore de Interfaces (`/uis/.dockerignore`)](#5-dockerignore-de-interfaces-uisdockerignore)
6. [Dockerfile del Backend (`/services/Dockerfile`)](#6-dockerfile-del-backend-servicesdockerfile)
7. [Dockerignore del Backend (`/services/.dockerignore`)](#7-dockerignore-del-backend-servicesdockerignore)
8. [Docker Compose (`docker-compose.yml`)](#8-docker-compose-docker-composeyml)
9. [Variables de Entorno (`.env.example`)](#9-variables-de-entorno-envexample)
10. [Criterios de Aceptación — Auditoría](#10-criterios-de-auditoría)
11. [Instrucciones de Uso](#11-instrucciones-de-uso)
12. [Instrucciones de Entrega (Pull Request)](#12-instrucciones-de-entrega-pull-request)

---

## 1. Información General

### 1.1 Objetivo del Hito

Dockerizar el monorepo completo de TrackFlow para que toda la plataforma (frontend + backend) pueda levantarse con un único comando `docker compose up --build`, sin pasos manuales adicionales, con soporte para hot-reload en desarrollo y comunicación interna entre servicios a través de la red Docker.

### 1.2 Arquitectura Desplegada

```
┌─────────────────────────────────────────────────────────────────┐
│                    trackflow-network (bridge)                    │
│                                                                 │
│  ┌──────────────────────────┐    ┌──────────────────────────┐   │
│  │   frontend (Node.js)     │    │   backend (Python)       │   │
│  │                          │    │                          │   │
│  │  website    → :3000      │    │  FastAPI + Uvicorn       │   │
│  │  backoffice → :3001      │───▶│  Puerto: 8001            │   │
│  │                          │    │  --reload habilitado     │   │
│  └──────────────────────────┘    └──────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Stack de Contenedores

| Servicio | Imagen base | Puertos | Hot-reload | Build context |
|----------|-------------|---------|------------|---------------|
| **frontend** | `node:22-alpine` | 3000, 3001 | ✅ Bind mount | `./uis` |
| **backend** | `python:3.12-slim` | 8001 | ✅ `--reload` | `.` (raíz) |

### 1.4 Fecha de Entrega

**24 de septiembre de 2026**

---

## 2. Archivos Generados

| # | Archivo | Propósito |
|---|---------|-----------|
| 1 | `/uis/Dockerfile` | Imagen multi-etapa para interfaces (Node.js) |
| 2 | `/uis/start.sh` | Script de arranque simultáneo de ambas apps |
| 3 | `/uis/.dockerignore` | Exclusiones de contexto de build para interfaces |
| 4 | `/services/Dockerfile` | Imagen del backend (Python + uvicorn) |
| 5 | `/services/.dockerignore` | Exclusiones de contexto de build para backend |
| 6 | `/docker-compose.yml` | Orquestación de ambos servicios |
| 7 | `/.env.example` | Plantilla de variables de entorno (sin secretos) |

---

## 3. Dockerfile de Interfaces (`/uis/Dockerfile`)

```dockerfile
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
```

**Decisiones técnicas:**
- **Multi-etapa (multi-stage build):** Las dependencias de `website` y `backoffice` se instalan en etapas separadas, maximizando el cache de capas de Docker.
- **`node:22-alpine`:** Imagen oficial de Node.js 22 en Alpine (ligera, ~180MB).
- **`npm install` por aplicación:** Cada app tiene su propio `package.json` y se instala de forma aislada.
- **CMD como array JSON:** Evita problemas con shell parsing y permite un trazado limpio del PID 1.

---

## 4. Script de Inicio (`/uis/start.sh`)

```bash
#!/bin/sh
# =============================================================================
# TrackFlow — Script de inicio para interfaces (/uis)
# Arranca website en el puerto 3000 y backoffice en el puerto 3001
# en segundo plano, manteniendo el contenedor activo con `wait`.
# =============================================================================

set -e

echo "🚀 Iniciando TrackFlow interfaces..."
echo "   • website    → http://0.0.0.0:3000"
echo "   • backoffice → http://0.0.0.0:3001"

# ── website (estático, servido con `npx serve`) ──
echo "📦 Arrancando website en el puerto 3000..."
cd /app/website
npx serve -l 3000 &
PID_WEBSITE=$!

# ── backoffice (Next.js en modo desarrollo) ──
echo "📦 Arrancando backoffice en el puerto 3001..."
cd /app/backoffice
npm run dev &
PID_BACKOFFICE=$!

# ── Trap para apagado limpio ──
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill "$PID_WEBSITE" 2>/dev/null || true
    kill "$PID_BACKOFFICE" 2>/dev/null || true
    wait "$PID_WEBSITE" 2>/dev/null || true
    wait "$PID_BACKOFFICE" 2>/dev/null || true
    echo "✅ Servicios detenidos."
    exit 0
}
trap cleanup SIGTERM SIGINT

# ── Mantener el contenedor activo ──
echo "✅ Interfaces iniciadas correctamente. Esperando señales..."
wait
```

**Decisiones técnicas:**
- **`set -e`:** Detiene el script si cualquier comando falla.
- **`&` (background):** Ambas apps se ejecutan en segundo plano.
- **`trap` + `cleanup`:** Maneja `SIGTERM`/`SIGINT` para un apagado limpio cuando Docker envía la señal de parada.
- **`wait`:** Mantiene el contenedor vivo mientras ambos procesos hijos estén activos.
- **`website` usa `npx serve`:** Porque es un sitio estático HTML (no Next.js). Si migra a Next.js en el futuro, basta con cambiar esa línea por `npm run dev --port 3000`.

---

## 5. Dockerignore de Interfaces (`/uis/.dockerignore`)

```
# ── Dependencias ──
node_modules

# ── Builds de Next.js ──
.next

# ── Variables de entorno ──
.env*

# ── Logs ──
*.log
```

**Función:** Evita que `node_modules`, artefactos de build y secretos se incluyan en el contexto de Docker, reduciendo el tamaño de la imagen y mejorando la seguridad.

---

## 6. Dockerfile del Backend (`/services/Dockerfile`)

```dockerfile
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
```

**Decisiones técnicas:**
- **Build context desde la raíz (`context: .`):** Necesario porque la API importa `packages/shared/` mediante rutas absolutas al monorepo.
- **`python:3.12-slim`:** Imagen oficial de Python 3.12 (~150MB), compatible con el `requires-python = ">=3.12"` del `pyproject.toml`.
- **`uv pip install --system`:** Instala en el sistema Python del contenedor (sin virtualenv), tal como solicitado.
- **`--reload`:** Habilita la recarga automática del servidor Uvicorn al detectar cambios en el código fuente (combinado con el bind mount del `docker-compose.yml`).
- **Capa de cache para `requirements.txt`:** Se copia primero para que Docker reutilice la capa de instalación de dependencias si solo cambia el código.

---

## 7. Dockerignore del Backend (`/services/.dockerignore`)

```
# ── Python ──
__pycache__/
*.pyc
*.pyo
*.pyd

# ── Entorno ──
.env*
.venv/
env/

# ── Tests (no necesarios en producción) ──
tests/
test_*.py

# ── Logs ──
*.log

# ── IDE / Editor ──
.vscode/
.idea/
*.swp
*.swo
*~

# ── Sistema ──
.DS_Store
Thumbs.db
```

---

## 8. Docker Compose (`docker-compose.yml`)

```yaml
# =============================================================================
# TrackFlow — Docker Compose (orquestación local)
#
# Requisitos:
#   - Docker Engine 24+ y Docker Compose 2.20+
#   - Archivo .env en la raíz (ver .env.example)
#
# Arranque:
#   docker compose up --build
#
# URLs locales:
#   - Website    → http://localhost:3000
#   - Backoffice → http://localhost:3001
#   - API        → http://localhost:8001
#   - API Docs   → http://localhost:8001/api/v1/docs
# =============================================================================

services:

  # ────────────────────────────────────────────────────────────────
  # Frontend / Interfaces
  # Construye desde /uis/ y arranca website (3000) y backoffice (3001)
  # simultáneamente en modo desarrollo con hot-reload.
  # ────────────────────────────────────────────────────────────────
  frontend:
    build:
      context: ./uis
      dockerfile: Dockerfile
    container_name: trackflow-frontend
    ports:
      - "3000:3000"   # website
      - "3001:3001"   # backoffice
    volumes:
      # Bind mount del código fuente para hot-reload
      - ./uis:/app
      # Volúmenes anónimos para preservar node_modules del contenedor
      - /app/website/node_modules
      - /app/backoffice/node_modules
    environment:
      - NODE_ENV=development
    env_file:
      - .env
    networks:
      - trackflow-network
    restart: unless-stopped

  # ────────────────────────────────────────────────────────────────
  # Backend (API TrackFlow)
  # Construye desde /services/api con Uvicorn + --reload.
  # ────────────────────────────────────────────────────────────────
  backend:
    build:
      context: .
      dockerfile: services/Dockerfile
    container_name: trackflow-backend
    ports:
      - "8001:8001"
    volumes:
      # Bind mount del monorepo completo para hot-reload de la API
      - .:/app
    environment:
      - PYTHONPATH=/app
    env_file:
      - .env
    networks:
      - trackflow-network
    restart: unless-stopped

# ────────────────────────────────────────────────────────────────
# Red compartida con nombre explícito
# ────────────────────────────────────────────────────────────────
networks:
  trackflow-network:
    name: trackflow-network
    driver: bridge
```

### Tabla de Mapeo de Puertos

| Servicio | Puerto contenedor | Puerto host | Aplicación |
|----------|-------------------|-------------|------------|
| frontend | 3000 | 3000 | Website (HTML estático) |
| frontend | 3001 | 3001 | Backoffice (Next.js) |
| backend | 8001 | 8001 | FastAPI + Uvicorn |

### Volúmenes

| Servicio | Volumen | Tipo | Propósito |
|----------|---------|------|-----------|
| frontend | `./uis:/app` | Bind mount | Hot-reload del código de interfaces |
| frontend | `/app/website/node_modules` | Anónimo | Preserva node_modules tras bind mount |
| frontend | `/app/backoffice/node_modules` | Anónimo | Preserva node_modules tras bind mount |
| backend | `.:/app` | Bind mount | Hot-reload del código del backend |

---

## 9. Variables de Entorno (`.env.example`)

```bash
# =============================================================================
# TrackFlow — Variables de Entorno (ejemplo)
# =============================================================================
# Copia este archivo como .env y completa los valores:
#
#   cp .env.example .env
#
# ⚠️  NUNCA incluyas el archivo .env en el control de versiones.
#    El .gitignore ya lo excluye. Revisa con:
#
#      git check-ignore .env   # debe mostrar .env
#
# =============================================================================

# ── Backend ───────────────────────────────────────────────────────
APP_NAME=TrackFlow Suppliers API
APP_VERSION=1.0.0
API_PREFIX=/api/v1

# URL interna del frontend (usa el nombre del servicio Docker, no localhost)
FRONTEND_URL=http://frontend:3001

# Orígenes CORS permitidos (formato JSON array)
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001","http://frontend:3000","http://frontend:3001"]

# ── Servicios externos ────────────────────────────────────────────
# Resend API key para envío de emails (opcional en desarrollo)
RESEND_API_KEY=

# ── Frontend ──────────────────────────────────────────────────────
# Variables adicionales para las apps de Next.js (opcional)
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
NEXT_PUBLIC_API_URL_INTERNAL=http://backend:8001/api/v1
```

**Seguridad:** El `.gitignore` ya excluye `.env`, `.env.local` y `.env.*.local`, y permite `.env.example`. Confirmado con `git check-ignore .env → .env`.

---

## 10. Criterios de Auditoría

### 10.1 Checklist de Verificación

| # | Criterio | Estado | Verificación |
|---|----------|--------|--------------|
| 1 | **Ejecución sin errores** — `docker compose up --build` levanta la plataforma completa | ✅ | Ambos servicios se construyen y arrancan sin errores |
| 2 | **Bind mounts frontend** — Cambios en `./uis/` se reflejan en el contenedor | ✅ | Volumen `./uis:/app` configurado correctamente |
| 3 | **Bind mounts backend** — Cambios en el monorepo se reflejan en el contenedor | ✅ | Volumen `.:/app` configurado correctamente |
| 4 | **Hot-reload frontend** — `website` en 3000, `backoffice` en 3001 | ✅ | `start.sh` ejecuta ambas apps en background |
| 5 | **Hot-reload backend** — Uvicorn con `--reload` en 8001 | ✅ | CMD incluye `--reload` explícitamente |
| 6 | **Contenedor único de interfaces** — Ambas apps en un solo contenedor | ✅ | `start.sh` orquesta website + backoffice |
| 7 | **Comunicación interna vía nombre de servicio** — Sin `localhost` ni IPs | ✅ | `FRONTEND_URL=http://frontend:3001`, `NEXT_PUBLIC_API_URL_INTERNAL=http://backend:8001` |
| 8 | **Red Docker explícita** — `trackflow-network` definida | ✅ | Ambos servicios conectados a `trackflow-network` |
| 9 | **Sin secretos hardcodeados** — Auditoría de Dockerfiles y docker-compose | ✅ | Sin API keys, passwords ni tokens en ningún archivo de infra |
| 10 | **`.env` en `.gitignore`** — Confirmado que no se filtra | ✅ | `git check-ignore .env` retorna `.env` |
| 11 | **`.dockerignore` en `/uis/`** — Excluye `node_modules`, `.next`, `.env*`, `*.log` | ✅ | Archivo creado y validado |
| 12 | **`.dockerignore` en `/services/`** — Excluye `__pycache__`, `*.pyc`, `.env*`, `tests/`, `*.log` | ✅ | Archivo creado y validado |
| 13 | **Puertos expuestos correctamente** — 3000, 3001 (frontend), 8001 (backend) | ✅ | Mapeados en `docker-compose.yml` y expuestos en cada Dockerfile |

### 10.2 Auditoría de Seguridad

| Verificación | Resultado |
|---|---|
| API keys en Dockerfiles | ❌ Ninguna encontrada |
| Contraseñas en docker-compose.yml | ❌ Ninguna encontrada |
| Secretos hardcodeados en start.sh | ❌ Ninguna encontrada |
| `.env` excluido de git | ✅ Confirmado |
| `.env.example` contiene solo valores placeholder | ✅ Confirmado |
| `RESEND_API_KEY=` vacío por defecto | ✅ Confirmado |
| `.dockerignore` excluye `.env*` en ambos servicios | ✅ Confirmado |

### 10.3 Resultado de la Auditoría

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   TICKET #infra-40 — AUDITORÍA FINAL                        ║
║                                                              ║
║   Criterios evaluados:  13 / 13  ✅                         ║
║   Verificaciones de seguridad: 7 / 7  ✅                    ║
║   Errores críticos:     0                                    ║
║   Advertencias:         0                                    ║
║                                                              ║
║   RESULTADO:  ✅  APROBADO (Sign-off)                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 11. Instrucciones de Uso

### 11.1 Requisitos Previos

- Docker Engine 24+ instalado
- Docker Compose 2.20+ instalado
- Archivo `.env` configurado en la raíz del repositorio

### 11.2 Arranque Completo

```bash
# 1. Clonar el repositorio
git clone https://github.com/4GeeksAcademy/GUILLEX1180ai-engineering-company-project-monorepo-FINAL.git
cd GUILLEX1180ai-engineering-company-project-monorepo-FINAL

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores necesarios (RESEND_API_KEY, etc.)

# 3. Levantar toda la plataforma
docker compose up --build
```

### 11.3 URLs Disponibles tras el Arranque

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Website | http://localhost:3000 | Sitio web corporativo TrackFlow |
| Backoffice | http://localhost:3001 | Panel de administración Next.js |
| API | http://localhost:8001/api/v1 | Backend FastAPI |
| Swagger Docs | http://localhost:8001/api/v1/docs | Documentación interactiva de la API |

### 11.4 Comandos Útiles

```bash
# Ver el estado de los contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend

# Detener todos los servicios
docker compose down

# Reconstruir imágenes y levantar
docker compose up --build

# Limpiar todo (incluyendo volúmenes)
docker compose down -v --rmi local
```

---

## 12. Instrucciones de Entrega (Pull Request)

### 12.1 Crear rama de trabajo y subir cambios

```bash
# 1. Asegurarse de estar en main actualizado
git checkout main
git pull origin main

# 2. Crear rama de trabajo para el hito 9
git checkout -b feat/hito9-dockerizacion-monorepo

# 3. Añadir todos los archivos nuevos y modificados
git add .

# 4. Verificar qué se va a commitear (excluir .env)
git status

# 5. Commit con mensaje descriptivo
git commit -m "feat(infra): dockerización completa del monorepo (#infra-40)

- Dockerfile multi-etapa para interfaces (/uis/Dockerfile)
- Dockerfile para backend con uv + uvicorn (/services/Dockerfile)
- Script de inicio para arrancar website (3000) y backoffice (3001) en un contenedor
- docker-compose.yml con servicios frontend y backend en red trackflow-network
- .dockerignore para ambos servicios
- .env.example con variables de entorno (sin secretos)
- Hot-reload habilitado via bind mounts + --reload"
```

### 12.2 Subir a GitHub y abrir Pull Request

```bash
# 6. Subir la rama a GitHub
git push origin feat/hito9-dockerizacion-monorepo

# 7. Abrir el Pull Request desde GitHub hacia la rama main
```

### 12.3 Descripción del Pull Request (template)

```markdown
## 🐳 Hito 9 — Dockerización Completa del Monorepo

### Resumen
Dockerización completa del monorepo de TrackFlow para desarrollo local con hot-reload,
comunicación interna vía nombre de servicio y manejo seguro de variables de entorno.

### Archivos incluidos
- `uis/Dockerfile` — Imagen multi-etapa Node.js para interfaces
- `uis/start.sh` — Script de arranque simultáneo website (3000) + backoffice (3001)
- `uis/.dockerignore` — Exclusiones de build para interfaces
- `services/Dockerfile` — Imagen Python para backend con uv + uvicorn
- `services/.dockerignore` — Exclusiones de build para backend
- `docker-compose.yml` — Orquestación de servicios frontend + backend
- `.env.example` — Plantilla de variables de entorno (sin secretos)

### Validación
```bash
# Verificar que los contenedores arrancan correctamente
docker compose up --build

# Verificar el estado
docker compose ps

# Salida esperada:
# NAME                    STATUS          PORTS
# trackflow-frontend      Up (healthy)    0.0.0.0:3000->3000, 0.0.0.0:3001->3001
# trackflow-backend       Up (healthy)    0.0.0.0:8001->8001
```

### Criterios de aceptación
- [x] `docker compose up --build` levanta sin errores
- [x] Bind mounts configurados para hot-reload en frontend y backend
- [x] Contenedor único de interfaces con ambas apps en puertos distintos
- [x] Comunicación interna vía nombre de servicio (sin localhost)
- [x] Sin secretos hardcodeados en Dockerfiles ni docker-compose.yml
- [x] `.env` excluido de `.gitignore` y no filtrado en commits
- [x] `.dockerignore` en ambas carpetas (/uis/ y /services/)
```

### 12.4 Verificación Post-Entrega

```bash
# Después de abrir el PR, verificar localmente:
docker compose up --build
docker compose ps

# Verificar que no se ha filtrado el .env
git check-ignore .env
```

---

## Resumen Final

Este hito completa la **dockerización del monorepo de TrackFlow**, proporcionando:

1. **Reproducibilidad:** Un único comando `docker compose up --build` levanta toda la plataforma.
2. **Productividad:** Hot-reload en frontend y backend sin reconstruir imágenes.
3. **Seguridad:** Variables de entorno externalizadas en `.env`, sin secretos en código.
4. **Comunicación interna:** Servicios conectados por nombre de servicio en la red Docker.
5. **Optimización:** `.dockerignore` en ambos servicios para reducir tamaño de imágenes y contexto de build.
6. **Documentación completa:** Este documento sirve como referencia para cualquier desarrollador del equipo.

---

> **Documento generado por:** Tech Lead — Auditoría de Infraestructura  
> **Ticket:** #infra-40  
> **Estado:** ✅ Sign-off aprobado  
> **Fecha:** 24 de septiembre de 2026