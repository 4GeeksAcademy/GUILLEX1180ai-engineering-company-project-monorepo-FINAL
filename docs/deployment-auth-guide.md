# 🚀 Guía de Despliegue — Módulo de Autenticación TrackFlow

> **Última actualización:** 2026-10-11
> **Versión:** 1.0.0

---

## 📋 Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Backend — FastAPI en Render](#2-backend--fastapi-en-render)
3. [Frontend — React (Next.js) en Vercel](#3-frontend--react-nextjs-en-vercel)
4. [Publicación en GitHub](#4-publicación-en-github)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Verificación del Despliegue](#6-verificación-del-despliegue)
7. [Solución de Problemas](#7-solución-de-problemas)
8. [Pruebas en Entorno Publicado](#8-pruebas-en-entorno-publicado)

---

## 1. Requisitos Previos

| Recurso | Cuenta |
|---------|--------|
| **GitHub** | Repositorio del proyecto |
| **Render** | Cuenta gratuita en https://render.com |
| **Vercel** | Cuenta gratuita en https://vercel.com |
| **Resend** (opcional) | Cuenta en https://resend.com para envío de emails reales |
| **SendGrid** (opcional) | Cuenta en https://sendgrid.com como alternativa de email |

---

## 2. Backend — FastAPI en Render

### 2.1. Preparar el Dockerfile

El `Dockerfile` ya está optimizado con multi-stage build en `services/api/Dockerfile`:

```dockerfile
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### 2.2. Crear el Servicio Web en Render

1. Inicia sesión en [Render Dashboard](https://dashboard.render.com)
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura el servicio:

| Campo | Valor |
|-------|-------|
| **Name** | `trackflow-api` |
| **Region** | `Frankfurt (EU Central)` (o la más cercana a tus usuarios) |
| **Branch** | `main` |
| **Runtime** | `Docker` |
| **Root Directory** | `services/api` |
| **Health Check Path** | `/api/v1/health` |
| **Instance Type** | `Free` (o `Starter` para producción) |

### 2.3. Configurar Variables de Entorno en Render

En la sección **"Environment Variables"** del servicio, agrega:

```bash
# ═══ Obligatorias ═══
JWT_SECRET_KEY=<generar con: python -c "import secrets; print(secrets.token_urlsafe(64))">
FRONTEND_URL=https://trackflow-backoffice.vercel.app
CORS_ORIGINS=https://trackflow-backoffice.vercel.app,http://localhost:3001

# ═══ Email (elegir provider) ═══
EMAIL_PROVIDER=log
# RESEND_API_KEY=re_...         # Si usas Resend
# SENDGRID_API_KEY=SG....       # Si usas SendGrid
# RESEND_FROM_EMAIL=TrackFlow <no-reply@tudominio.com>
# SENDGRID_FROM_EMAIL=no-reply@tudominio.com

# ═══ Seguridad ═══
PASSWORD_RESET_TOKEN_TTL_MINUTES=15
PASSWORD_RESET_MAX_REQUESTS_PER_HOUR=3
PASSWORD_RESET_WINDOW_SECONDS=3600

# ═══ API ═══
API_PREFIX=/api/v1
APP_NAME=TrackFlow Suppliers API
```

### 2.4. Health Check

Render usará `GET /api/v1/health` para verificar que el servicio está vivo.  
El endpoint devuelve:

```json
{
  "status": "ok",
  "app": "TrackFlow Suppliers API",
  "version": "1.0.0"
}
```

---

## 3. Frontend — React (Next.js) en Vercel

### 3.1. Configurar Variables de Entorno en Vercel

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://trackflow-api.onrender.com/api/v1` |

### 3.2. Desplegar en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en **"Add New..."** → **"Project"**
3. Importa tu repositorio de GitHub
4. Configura:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | `Next.js` |
| **Root Directory** | `uis/backoffice` |
| **Build Command** | `npx next build` (por defecto) |
| **Output Directory** | `.next` (por defecto) |
| **Node.js Version** | `20.x` |

5. En **"Environment Variables"**, agrega:

```
NEXT_PUBLIC_API_URL=https://trackflow-api.onrender.com/api/v1
```

6. Haz clic en **"Deploy"**

### 3.3. Verificar Rutas del Frontend

Una vez desplegado, verifica que las siguientes rutas funcionan:

| Ruta | Propósito |
|------|-----------|
| `/login` | Inicio de sesión con enlace "¿Olvidaste tu contraseña?" |
| `/forgot-password` | Solicitar restablecimiento de contraseña |
| `/reset-password?token=<TOKEN>` | Restablecer contraseña (llega del email) |
| `/account/change-password` | Cambiar contraseña (requiere autenticación) |

---

## 4. Publicación en GitHub

### 4.1. Comandos Git Paso a Paso

```bash
# 1. Clonar el repositorio (si no lo tienes)
git clone https://github.com/TU_USUARIO/trackflow.git
cd trackflow

# 2. Verificar el estado
git status

# 3. Añadir los archivos modificados y nuevos
git add services/api/requirements.txt
git add services/api/schemas/auth.py
git add services/api/rate_limiter.py
git add services/api/routes/auth.py
git add services/api/tests/test_auth_e2e.py
git add services/api/.gitignore
git add services/api/Dockerfile
git add services/api/.dockerignore
git add services/api/.env.example
git add services/api/templates/reset_password.html
git add uis/backoffice/src/lib/api.ts
git add uis/backoffice/src/lib/types.ts
git add uis/backoffice/src/app/forgot-password/page.tsx
git add uis/backoffice/src/app/reset-password/page.tsx
git add uis/backoffice/src/app/account/change-password/page.tsx
git add uis/backoffice/src/app/login/page.tsx

# 4. Hacer commit
git commit -m "feat(auth): módulo completo de autenticación y recuperación de contraseñas

- POST /auth/forgot-password con anti-enumeración y rate limiting
- POST /auth/reset-password con tokens JWT de un solo uso
- POST /auth/change-password para usuarios autenticados
- Auditoría de eventos de seguridad (AuditLog)
- Plantilla HTML responsive para email de reset
- Frontend: /forgot-password, /reset-password, /login, /change-password
- Tests E2E completos (12 criterios + 3 extensiones)
- slowapi como dependencia de rate limiting
- remaining_requests en respuesta de forgot-password"

# 5. Subir a GitHub
git push origin main
```

### 4.2. Estructura de Archivos del Módulo

```
services/api/
├── .env.example              # Plantilla de variables de entorno
├── .gitignore                # Ignorar secretos y BD locales
├── Dockerfile                # Multi-stage build optimizado
├── .dockerignore             # Excluir secretos de la imagen
├── requirements.txt          # slowapi añadido
├── config.py                 # Settings via pydantic-settings
├── security.py               # JWT + bcrypt
├── rate_limiter.py           # Rate limiter con remaining()
├── audit_log.py              # Auditoría de eventos
├── routes/auth.py            # Endpoints de autenticación
├── schemas/auth.py           # Schemas input/output separados
├── templates/
│   └── reset_password.html   # Plantilla HTML del email
├── services/email.py         # Servicio de correo (Resend/SendGrid/log)
└── tests/
    └── test_auth_e2e.py      # Tests E2E completos

uis/backoffice/src/
├── lib/
│   ├── api.ts                # API service con authFetch
│   └── types.ts              # Tipos de autenticación
└── app/
    ├── login/page.tsx        # Login con enlace "¿Olvidaste?"
    ├── forgot-password/page.tsx  # Solicitar reset
    ├── reset-password/page.tsx   # Restablecer con token
    └── account/
        └── change-password/page.tsx  # Cambiar contraseña
```

---

## 5. Variables de Entorno

### 5.1. Backend (services/api/.env)

```bash
# ═══ Obligatorias ═══
JWT_SECRET_KEY=<generar con secreto seguro>
FRONTEND_URL=http://localhost:3001

# ═══ Email ═══
EMAIL_PROVIDER=log
RESEND_API_KEY=
SENDGRID_API_KEY=

# ═══ Seguridad ═══
PASSWORD_RESET_TOKEN_TTL_MINUTES=15
PASSWORD_RESET_MAX_REQUESTS_PER_HOUR=3
PASSWORD_RESET_WINDOW_SECONDS=3600

# ═══ CORS ═══
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

### 5.2. Frontend (uis/backoffice/.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
```

---

## 6. Verificación del Despliegue

### 6.1. Pruebas Locales

```bash
# Backend
cd services/api
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend
cd uis/backoffice
npm install
npm run dev
```

### 6.2. Health Check

```bash
curl https://trackflow-api.onrender.com/api/v1/health
# → {"status":"ok","app":"TrackFlow Suppliers API","version":"1.0.0"}
```

### 6.3. Ejecutar Tests

```bash
cd services/api
pip install -r requirements-dev.txt
pytest tests/test_auth_e2e.py -v
```

### 6.4. Flujo Completo de Prueba Manual

```bash
# 1. Registrar un usuario
curl -X POST https://trackflow-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# 2. Solicitar restablecimiento
curl -X POST https://trackflow-api.onrender.com/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 3. Iniciar sesión
curl -X POST https://trackflow-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# 4. Cambiar contraseña (autenticado)
TOKEN=<token_del_login>
curl -X POST https://trackflow-api.onrender.com/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"current_password":"TestPass123","new_password":"NuevaPass456"}'
```

---

## 7. Solución de Problemas

| Problema | Causa Posible | Solución |
|----------|--------------|----------|
| **CORS Error** | `FRONTEND_URL` o `CORS_ORIGINS` mal configurado | Verificar variables en Render |
| **401 en change-password** | Token no enviado o inválido | Verificar `Authorization: Bearer <token>` |
| **429 Too Many Requests** | Rate limiting activo | Esperar 1 hora o cambiar `PASSWORD_RESET_MAX_REQUESTS_PER_HOUR` |
| **Email no enviado** | `EMAIL_PROVIDER=log` en producción | Cambiar a `resend` o `sendgrid` con API key válida |
| **Token inválido** | Token expirado (15 min por defecto) | Solicitar nuevo enlace en `/forgot-password` |
| **Error 502 en Render** | Puerto incorrecto | Verificar que `CMD` expone el puerto 8001 |
| **Build falla en Vercel** | Versión de Node.js incorrecta | Configurar Node.js 20.x en Vercel |

---

## 8. Pruebas en Entorno Publicado

### 8.1. Cobertura de Criterios E2E

| # | Criterio | Cómo probar en producción |
|---|----------|--------------------------|
| 1 | Email con plantilla HTML | Configurar `EMAIL_PROVIDER=resend` con API key real → solicitar reset → revisar bandeja |
| 2 | 200 OK para email no registrado | `curl -X POST .../auth/forgot-password -d '{"email":"no-existe@test.com"}'` → 200 |
| 3 | Token expira a los 15 min | Solicitar reset, esperar 15 min, usar el token → 400 |
| 4 | Reset actualiza contraseña | Usar token válido → login con nueva pass → 200 |
| 5 | 400 para token inválido | `curl -X POST .../auth/reset-password -d '{"token":"bad","new_password":"X"}'` → 400 |
| 6 | 400 para current_password incorrecta | Autenticarse, enviar wrong current → 400 |
| 7 | Secretos vía .env | Verificar que no hay claves hardcodeadas en el código |
| 8 | Confirmación en /forgot-password | Abrir ruta en navegador → ver mensaje de confirmación |
| 9 | Token leído de URL | Recibir email → hacer clic en enlace → formulario precargado |
| 10 | Error si token inválido | Abrir `/reset-password?token=bad` → ver mensaje de error |
| 11 | Enlace en /login | Abrir `/login` → ver enlace "¿Olvidaste tu contraseña?" |
| 12 | Validación cliente + API | En `/account/change-password`, passwords no coinciden → error cliente |

### 8.2. Verificar Auditoría

Para verificar que los eventos de auditoría se registran correctamente, ejecuta:

```bash
# Ver en logs de Render que los eventos se registran
# (la BD audit_log se almacena en auth_db.json dentro del contenedor)
```

### 8.3. Prueba de Rate Limiting

```bash
# Enviar 4 solicitudes en ráfaga (límite = 3)
for i in 1 2 3 4; do
  curl -X POST https://trackflow-api.onrender.com/api/v1/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo ""
done
# Las primeras 3 → 200, la 4ª → 429
```

---

## 📊 Resumen de Endpoints

| Método | Ruta | Auth | Rate Limited | Descripción |
|--------|------|------|-------------|-------------|
| `POST` | `/api/v1/auth/register` | No | No | Registrar nuevo usuario |
| `POST` | `/api/v1/auth/login` | No | No | Iniciar sesión |
| `POST` | `/api/v1/auth/forgot-password` | No | Sí (3/hora) | Solicitar reset (anti-enumeración) |
| `POST` | `/api/v1/auth/reset-password` | No | No | Restablecer con token JWT |
| `POST` | `/api/v1/auth/change-password` | Sí | No | Cambiar contraseña |
| `GET` | `/api/v1/auth/me` | Sí | No | Perfil del usuario |
| `PUT` | `/api/v1/profiles/me` | Sí | No | Actualizar perfil |
| `GET` | `/api/v1/health` | No | No | Health check |

---

## 🔐 Política de Seguridad

- **Contraseñas**: Almacenadas con bcrypt (nunca en texto plano)
- **Tokens JWT**: Firmados con HMAC-SHA256, expiran a los 15 minutos
- **Anti-enumeración**: forgot-password siempre responde 200
- **Rate limiting**: 3 solicitudes por email por hora en forgot-password
- **Un solo uso**: Los tokens quedan invalidados tras usarse (vía `pwd_iat`)
- **Auditoría**: Todos los eventos de seguridad se registran con IP y User-Agent
- **CORS**: Configurable vía variable de entorno, no hardcodeado
- **Secretos**: 100% vía variables de entorno, nunca en el código fuente