# Hito 5 v2 — Última configuración y correcciones aplicadas

> **Fecha:** 2026-10-12
> **Rama:** `feature/caching-optimisation`
> **Estado:** CI ✅ en verde, todo verificado y subido a GitHub

---

## 📋 Resumen

Este documento actualiza el `Documentos_hito5.md` con **toda la configuración más reciente** del proyecto TrackFlow, incluyendo las correcciones aplicadas en la auditoría del ticket **AUTH-03** (recuperación y cambio de contraseña), el fix del error **"Error al cargar leads / Load failed"** en el frontend y la corrección del **pipeline de CI** (conflicto `ERESOLVE`).

---

## ⚙️ 1. Configuración de variables de entorno

### 1.1 Frontend Backoffice — `uis/backoffice/.env` y `.env.local`

```dotenv
# ─── Frontend Backoffice TrackFlow ────────────────────
NEXT_PUBLIC_API_URL=/api/v1
```

> ⚠️ **IMPORTANTE:** Se usa la URL **relativa** `/api/v1` en lugar de una absoluta
> (`http://localhost:8001/api/v1`). El motivo se explica en la sección 3. En un
> Codespaces / despliegue, el `localhost` del navegador del cliente NO apunta al
> backend; la ruta relativa hace que la petición viaje por el **proxy de Next.js**
> (`next.config.js` rewrites).

### 1.2 Backend — `services/api/.env`

```dotenv
# ─── Backend TrackFlow ─────────────────────────────────
RESEND_API_KEY=re_XXXXXXXXXXXXX
FRONTEND_URL=http://localhost:3001
```

> ⚠️ Los archivos `.env` están en `.gitignore` y **nunca** se suben al repositorio.
> Solo se versionan los `.env.example` con placeholders.

### 1.3 Raíz — `.env.example` (referencia de variables)

```dotenv
APP_NAME=TrackFlow
APP_VERSION=1.0.0
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://frontend:3000,http://frontend:3001

# Seguridad JWT (reseteo de contraseña)
JWT_SECRET_KEY=...            # NUNCA en el código
PASSWORD_RESET_TOKEN_TTL_MINUTES=15
EMAIL_PROVIDER=log            # "resend" | "sendgrid" | "log"
RESEND_API_KEY=...
SENDGRID_API_KEY=...
```

---

## 🖥️ 2. Configuración del proxy de Next.js — `uis/backoffice/next.config.js`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ── Proxy: redirige /api/v1/* al backend ──
  // En Docker usa el nombre del servicio ("backend"); fuera de Docker, localhost.
  async rewrites() {
    const backendHost =
      process.env.BACKEND_HOST || "localhost";
    return [
      {
        source: "/api/v1/:path*",
        destination: `http://${backendHost}:8001/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

**Comportamiento:**
- `/api/v1/:path*` → `http://localhost:8001/api/v1/:path*` (fuera de Docker)
- `/api/v1/:path*` → `http://backend:8001/api/v1/:path*` (en Docker Compose, vía `BACKEND_HOST`)

---

## 🔧 3. Fix #1 — Frontend: "Error al cargar leads / Load failed"

### Síntoma

Al intentar cargar la lista de leads desde el dashboard, aparecía el error
**"Error al cargar leads / Load failed"**.

### Causa raíz

`NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1` quedaba **horneada en el bundle
del cliente** en build time. En un Codespaces / despliegue remoto, el navegador
del usuario resuelve `localhost` como su propia máquina, NO como el servidor →
la petición `fetch` fallaba con "Load failed".

**Verificación:** `grep -rl "localhost:8001" uis/backoffice/.next/static` → coincidencias
en `app/page.js`, `login/page.js`, `reset-password/page.js`.

### Corrección aplicada — `uis/backoffice/src/lib/api.ts`

Se añadió `resolveApiUrl()` y se usa tanto en `fetchAPI` como en `authFetch`:

```typescript
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();

function resolveApiUrl(path: string): string {
  const relative = API_BASE.startsWith("http://") || API_BASE.startsWith("https://");
  const base = relative ? API_BASE : API_BASE || "/api/v1";
  const separator = base.endsWith("/") ? "" : "/";
  return `${base}${separator}${path.replace(/^\//, "")}`;
}
```

**Lógica:**
- Si `NEXT_PUBLIC_API_URL` es **absoluta** (`http://host:port`), se usa tal cual.
- Si es **relativa** (`/api/v1`) o está **vacía**, se resuelve contra el proxy de
  Next.js → la petición viaja por el mismo host del frontend. → **Se elimina el "Load failed"**.

Además se cambió `uis/backoffice/.env` de `http://localhost:8001/api/v1` → `/api/v1`.

### Verificación

| Comprobación | Resultado |
|---|---|
| Bundle (`.next/static`) sin `localhost:8001` | ✅ |
| Bundle contiene ruta relativa `api/v1` | ✅ |
| `GET http://localhost:3001/api/v1/records?limit=500` | ✅ 200 `{"results":[],"total":null}` |
| Backend health | ✅ 200 |

---

## 📧 4. Fix #2 — Backend AUTH-03: import relativo de `parse_email`

### Causa

En `services/api/services/email.py`, la función `_send_via_sendgrid` usaba:

```python
from parse_email import parse_from_address  # helper local  ← ERROR
```

Ese import absoluto generaba `ModuleNotFoundError` cuando se usaba el proveedor
**SendGrid**, rompiendo el envío del correo de reset de contraseña (ticket AUTH-03).

### Corrección aplicada

```python
from .parse_email import parse_from_address  # helper local (mismo paquete)
```

> Import **relativo** (mismo paquete `services`) para resolver `parse_email.py`.

### Verificación

- ✅ 88 tests de auth superados (`test_password_reset.py` + `test_change_password.py` + `test_auth_e2e.py`).

---

## 🎯 5. Fix #3 — CI: conflicto `ERESOLVE` en `packages/shared`

### Síntoma

El paso **"Instalar dependencias de packages/shared (paquete compartido)"** del
workflow `.github/workflows/ci.yml` fallaba con:

```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error While resolving: ts-jest@29.4.13
npm error Found: typescript@7.0.2
npm error Could not resolve dependency:
npm error peer typescript@">=4.3 <7" from ts-jest@29.4.13
```

### Causa raíz

- `packages/shared/package.json` declaraba `"typescript": "^7.0.2"` → el lockfile resolvía **TypeScript 7.0.2**.
- `ts-jest@29.4.13` exige peer `typescript >=4.3 <7` → **conflicto incompatible**.
- El resto del monorepo (backoffice) usa `typescript ^5.7.0`.

### Corrección aplicada

| Archivo | Antes | Después |
|---|---|---|
| `packages/shared/package.json` | `"typescript": "^7.0.2"` | `"typescript": "^5.7.0"` |
| `packages/shared/package-lock.json` | resolvía `typescript@7.0.2` | regenerado → `typescript@5.9.3` |

### Verificación

| Comprobación | Resultado |
|---|---|
| `npm ci --dry-run` en `packages/shared` | ✅ sin ERESOLVE |
| `npx tsc --noEmit` en `uis/backoffice` | ✅ EXIT 0 |
| `npm run build` en `uis/backoffice` (con `NEXT_PUBLIC_API_URL=""` como el CI) | ✅ EXIT 0 |
| Tests de `packages/shared` (jest) | ✅ 4/4 |
| **Check-runs del commit `dd76ae5c`** | ✅ 6/6 **success** (Backend ×3 + Frontend Build ×3) |

---

## 🔐 6. Configuración de seguridad / auth — `services/api/config.py`

Valores por defecto actuales:

| Variable | Valor | Descripción |
|---|---|---|
| `api_prefix` | `/api/v1` | Prefijo común de todos los routers FastAPI |
| `jwt_secret_key` | `change-me-in-production` | Clave HS256 para tokens (⚠️ obligatoria en prod) |
| `password_reset_token_ttl_minutes` | `15` | TTL del token de reset (min) |
| `password_reset_max_requests_per_hour` | `3` | Rate limit forgot-password por email |
| `password_reset_window_seconds` | `3600` | Ventana del rate limiter (1 h) |
| `email_provider` | `log` | `"resend"` \| `"sendgrid"` \| `"log"` |
| `resend_from_email` | `TrackFlow <no-reply@trackflow.local>` | Remitente Resend |
| `sendgrid_from_email` | `no-reply@trackflow.local` | Remitente SendGrid |
| `cors_origins` | localhost `3000/3001/3002/8080` | Orígenes CORS permitidos |

> El `Config` de pydantic-settings lee `.env` con `extra = "allow"`.

---

## 📁 7. Comandos para levantar el entorno

```bash
# Backend (puerto 8001)
cd services/api && uvicorn main:app --port 8001

# Frontend Backoffice (puerto 3001) — usa proxy relativo /api/v1
cd uis/backoffice && npm run dev
```

---

## 🧠 8. Lecciones aprendidas

1. **Nunca hornear URLs absolutas (`localhost:8001`) en el bundle del cliente**: usar rutas relativas y dejar el proxy de Next.js decida hacia dónde apuntar.
2. **Import relativos para módulos del mismo paquete**: `from .module import ...` en vez de `from module import ...` evita `ModuleNotFoundError`.
3. **Mantener TypeScript alineado en todo el monorepo**: `packages/shared` debe usar la misma versión mayor que los apps que lo consumen, o `ts-jest`/`tsc` romperán con `ERESOLVE`.
4. **Los `.env` locales jamás se versionan**: solo `.env.example` con placeholders.

---

## ✅ 9. Estado final de Git

```
Rama:        feature/caching-optimisation
Working tree: limpio (sin cambios pendientes)

dd76ae5c fix(ci): resolver conflicto ERESOLVE en packages/shared (typescript ^7.0.2 -> ^5.7.0)
28ad09fa fix(auth,frontend): import relativo de parse_email y URL relativa del proxy para leads
5933a834 ci(deploy): workflow de despliegue a Render + Vercel y fix typecheck frontend en CI
a30331ae ci: añadir job de build frontend Next.js y tests auth al pipeline CI
```

**PR #7** (`feature/caching-optimisation` → `main`):
https://github.com/4GeeksAcademy/GUILLEX1180ai-engineering-company-project-monorepo-FINAL/pull/7
— descripción completa (AUTH-03 + 3 fixes) con **CI en verde**.