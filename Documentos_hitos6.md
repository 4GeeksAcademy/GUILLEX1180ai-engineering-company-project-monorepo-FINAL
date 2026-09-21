# Documentos Hito 6: Recuperación y Cambio de Contraseña (AUTH-03)

> **Fecha de creación:** 21 de septiembre de 2026  
> **Versión del documento:** 1.0  
> **Estado:** Completo (implementado y auditado)

---

## Tabla de Contenidos

1. [Información General](#1-información-general)
2. [Descripción del Ticket AUTH-03](#2-descripción-del-ticket-auth-03)
3. [Arquitectura de la Solución](#3-arquitectura-de-la-solución)
4. [Backend — FastAPI](#4-backend--fastapi)
   - [4.1 Endpoint forgot-password](#41-endpoint-forgot-password)
   - [4.2 Endpoint reset-password](#42-endpoint-reset-password)
   - [4.3 Endpoint change-password](#43-endpoint-change-password)
   - [4.4 Rate Limiting](#44-rate-limiting)
   - [4.5 Audit Logging](#45-audit-logging)
   - [4.6 Integración Resend SDK v2](#46-integración-resend-sdk-v2)
5. [Frontend — Next.js (Backoffice)](#5-frontend--nextjs-backoffice)
   - [5.1 Página forgot-password](#51-página-forgot-password)
   - [5.2 Página reset-password](#52-página-reset-password)
   - [5.3 Página change-password](#53-página-change-password)
   - [5.4 Tipos TypeScript (types.ts)](#54-tipos-typescript-typests)
   - [5.5 API Client (api.ts)](#55-api-client-apits)
6. [Configuración y Variables de Entorno](#6-configuración-y-variables-de-entorno)
7. [Correcciones Aplicadas Durante la Implementación](#7-correcciones-aplicadas-durante-la-implementación)
8. [Auditoría de Seguridad y Buenas Prácticas](#8-auditoría-de-seguridad-y-buenas-prácticas)
9. [Archivos Modificados](#9-archivos-modificados)
10. [Pruebas de Regresión](#10-pruebas-de-regresión)
11. [Commits](#11-commits)

---

## 1. Información General

### 1.1 Propósito

El Hito 6 implementa el flujo completo de **recuperación y cambio de contraseña (AUTH-03)** en el monorepo de TrackFlow. Abarca desde la generación de tokens seguros en el backend FastAPI, el envío de correos transaccionales vía Resend SDK, hasta las interfaces de usuario en Next.js (Backoffice) para solicitar restablecimiento, resetear la contraseña y cambiarla estando autenticado.

### 1.2 Objetivos Cumplidos

| # | Objetivo | Archivo/Ubicación | Estado |
|---|----------|-------------------|--------|
| 1 | Endpoint `POST /auth/forgot-password` con rate limiting y email | `services/api/routes/auth.py` | ✅ |
| 2 | Endpoint `POST /auth/reset-password` con validación de token | `services/api/routes/auth.py` | ✅ |
| 3 | Endpoint `POST /auth/change-password` protegido por Bearer | `services/api/routes/auth.py` | ✅ |
| 4 | Integración con Resend SDK v2 para envío de emails | `services/api/routes/auth.py` | ✅ |
| 5 | Plantilla HTML de email con fallback inline | `services/api/routes/auth.py` | ✅ |
| 6 | Rate limiting (3 solicitudes/hora por email) | `services/api/routes/auth.py` | ✅ |
| 7 | Audit logging en TinyDB para todos los eventos de auth | `services/api/routes/auth.py` | ✅ |
| 8 | Página forgot-password con cooldown de 30s | `uis/backoffice/src/app/forgot-password/page.tsx` | ✅ |
| 9 | Página reset-password con Suspense boundary | `uis/backoffice/src/app/reset-password/page.tsx` | ✅ |
| 10 | Página change-password protegida con auto-logout | `uis/backoffice/src/app/account/change-password/page.tsx` | ✅ |
| 11 | Enlace "¿Olvidaste tu contraseña?" en login | `uis/backoffice/src/app/login/page.tsx` | ✅ |
| 12 | Botón "Cambiar contraseña" en perfil | `uis/backoffice/src/app/account/profile/page.tsx` | ✅ |
| 13 | .env y .env.example con RESEND_API_KEY y FRONTEND_URL | `services/api/` y `uis/backoffice/` | ✅ |
| 14 | .gitignore corregido para permitir .env.example | `.gitignore` | ✅ |
| 15 | 0 errores TypeScript en frontend + 0 errores Python en backend | — | ✅ |

### 1.3 Stakeholders Relacionados

| Nombre | Cargo | Interés en este Hito |
|--------|-------|----------------------|
| **Andrés Kim** | CTO | Supervisa la seguridad de las credenciales y el flujo de autenticación |
| **Operadores Backoffice** | Usuarios finales | Flujo de recuperación de acceso a la plataforma |

### 1.4 Fecha de Entrega

**21 de septiembre de 2026**

---

## 2. Descripción del Ticket AUTH-03

El ticket **AUTH-03 (Recuperación y cambio de contraseña)** especifica tres funcionalidades principales:

1. **Forgot Password (Olvidé mi contraseña)** — El usuario ingresa su correo y recibe un enlace de restablecimiento por email.
2. **Reset Password (Restablecer contraseña)** — El usuario hace clic en el enlace, ingresa una nueva contraseña y la confirma.
3. **Change Password (Cambiar contraseña)** — El usuario autenticado puede cambiar su contraseña desde su perfil, requiriendo la contraseña actual y verificando que la nueva sea diferente.

### Requisitos de Seguridad

- **Mensaje neutro**: No revelar si el email está registrado o no.
- **Rate limiting**: Máximo 3 solicitudes por hora por email en forgot-password.
- **Token único**: UUID v4 no adivinable con prefijo `rst_`.
- **Expiración**: Token válido por 1 hora.
- **Un solo uso**: El token se marca como `used` tras su primer uso.
- **Invalidación de sesiones**: Al cambiar/resetear la contraseña, se invalidan todas las sesiones activas.
- **Audit logging**: Cada acción de autenticación se registra en TinyDB.

---

## 3. Arquitectura de la Solución

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Backoffice (Next.js 15)                     │
│                                                                     │
│  /forgot-password    /reset-password     /account/change-password   │
│       │                   │                       │                 │
│       │  POST /auth/      │  POST /auth/          │ POST /auth/     │
│       │  forgot-password  │  reset-password       │ change-password │
│       ▼                   ▼                       ▼                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              api.ts (fetchAPI / authFetch)                  │    │
│  └──────────────────────┬─────────────────────────────────────┘    │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Backend FastAPI (:8001)                           │
│                                                                     │
│  routes/auth.py                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  forgot_password()   → Resend SDK → Email al usuario          │  │
│  │  reset_password()    → Valida token → Actualiza BD            │  │
│  │  change_password()   → Verifica auth → Cambia pass            │  │
│  │                                                               │  │
│  │  Rate Limiting (in-memory)     Audit Log (TinyDB)             │  │
│  │  Resend Emails.SendParams      Token UUID + expiry            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  TinyDB (auth_db.json)                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────┐        │
│  │  users   │ │  tokens  │ │ reset_tokens │ │ audit_log  │        │
│  └──────────┘ └──────────┘ └──────────────┘ └────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────────┐
    │           Resend API (Email)                 │
    │  onboarding@resend.dev → usuario@correo.com  │
    └─────────────────────────────────────────────┘
```

---

## 4. Backend — FastAPI

### 4.1 Endpoint forgot-password

**Ruta:** `POST /api/v1/auth/forgot-password`  
**Autenticación:** No requiere  
**Rate Limit:** 3 solicitudes/hora por email

#### Flujo

1. Validar email con `EmailStr` de Pydantic
2. Verificar rate limiting (in-memory con ventana de 1 hora)
3. Buscar usuario en TinyDB por email
4. Si el usuario **no existe**: registrar auditoría como `forgot_password_user_not_found`, devolver mensaje neutro
5. Si el usuario **existe**:
   - Generar token UUID (`rst_` + `secrets.token_hex(32)`)
   - Guardar en tabla `reset_tokens` con `used=False` y `expires_at` (1 hora)
   - Construir URL de restablecimiento usando `FRONTEND_URL`
   - Renderizar plantilla HTML y enviar vía Resend
   - Registrar auditoría como `forgot_password_requested`
6. Devolver mensaje neutro: _"Si el correo está registrado, recibirás un enlace de restablecimiento."_

```python
# Fragmento clave: envío de email vía Resend
params = resend.Emails.SendParams(
    from_address="TrackFlow <onboarding@resend.dev>",
    to=[email],
    subject="Restablece tu contraseña — TrackFlow",
    html=email_html,
)
response = resend.Emails.send(params)
```

#### Respuesta exitosa (200)

```json
{
  "message": "Si el correo está registrado, recibirás un enlace de restablecimiento.",
  "remaining_requests": 2
}
```

#### Error rate limit (429)

```json
{
  "detail": {
    "message": "Has excedido el límite de solicitudes. Intenta de nuevo más tarde.",
    "retry_after_seconds": 3600
  }
}
```

### 4.2 Endpoint reset-password

**Ruta:** `POST /api/v1/auth/reset-password`  
**Autenticación:** No requiere (usa token)

#### Flujo

1. Buscar token en tabla `reset_tokens`
2. Validar:
   - Token **existe** → si no, error 400
   - Token **no usado** (`used=False`) → si usado, error 400
   - Token **no expirado** (`expires_at > now`) → si expirado, marcar como usado y error 400
3. Actualizar contraseña del usuario en tabla `users`
4. Marcar token como `used=True`
5. Invalidar **todas las sesiones activas** del usuario (eliminar de tabla `tokens`)
6. Registrar auditoría como `reset_password_success`
7. Devolver mensaje de éxito

```python
# Invalidación de sesiones
active_sessions = tokens_table.search(TokenQuery.user_id == user_id)
for session in active_sessions:
    tokens_table.remove(doc_ids=[session.doc_id])
```

#### Respuesta exitosa (200)

```json
{
  "message": "Contraseña restablecida correctamente. Inicia sesión con tu nueva contraseña."
}
```

### 4.3 Endpoint change-password

**Ruta:** `POST /api/v1/auth/change-password`  
**Autenticación:** Bearer token (protegido por `_resolve_user`)

#### Flujo

1. Extraer usuario autenticado del Bearer token mediante `Depends(_resolve_user)`
2. Verificar que la **contraseña actual** coincida con la almacenada
3. Verificar que la **nueva contraseña sea diferente** a la actual
4. Actualizar contraseña en tabla `users`
5. Invalidar **todas las sesiones activas** (forzar re-login)
6. Registrar auditoría como `change_password_success`
7. Devolver mensaje de éxito

#### Respuesta exitosa (200)

```json
{
  "message": "Contraseña cambiada correctamente. Vuelve a iniciar sesión."
}
```

### 4.4 Rate Limiting

Implementado **in-memory** (no persistente) usando un `defaultdict(list)`:

| Parámetro | Valor |
|-----------|-------|
| Máximo de solicitudes | 3 por email |
| Ventana de tiempo | 3600 segundos (1 hora) |
| Limpieza automática | Timestamps fuera de ventana se descartan |
| Persistencia | No (se pierde al reiniciar el servidor) |

```python
def _is_rate_limited(email: str) -> bool:
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    _rate_limit_store[email] = [
        ts for ts in _rate_limit_store[email] if ts > cutoff
    ]
    return len(_rate_limit_store[email]) >= RATE_LIMIT_MAX_REQUESTS
```

### 4.5 Audit Logging

Cada evento de autenticación se registra en la tabla `audit_log` de TinyDB:

| Campo | Descripción |
|-------|-------------|
| `event_type` | Tipo de evento (ej: `forgot_password_requested`) |
| `email` | Email del usuario involucrado |
| `ip_address` | Dirección IP del cliente |
| `detail` | Descripción adicional del evento |
| `success` | Booleano: si la acción fue exitosa |
| `timestamp` | ISO 8601 en UTC |

**Eventos registrados:**

| event_type | Cuándo ocurre |
|------------|---------------|
| `forgot_password_rate_limited` | Se excede el límite de solicitudes |
| `forgot_password_user_not_found` | Email no registrado (no revelado al usuario) |
| `forgot_password_requested` | Token generado y email enviado |
| `reset_password_invalid_token` | Token no encontrado |
| `reset_password_token_reused` | Token ya utilizado previamente |
| `reset_password_token_expired` | Token expirado |
| `reset_password_success` | Contraseña restablecida exitosamente |
| `change_password_wrong_current` | Contraseña actual incorrecta |
| `change_password_success` | Contraseña cambiada exitosamente |

### 4.6 Integración Resend SDK v2

Se utiliza **Resend SDK v2.47.0+** con la API de dataclasses (`SendParams`):

```python
import resend

resend.api_key = settings.resend_api_key or os.getenv("RESEND_API_KEY", "")

params = resend.Emails.SendParams(
    from_address="TrackFlow <onboarding@resend.dev>",
    to=[email],
    subject="Restablece tu contraseña — TrackFlow",
    html=email_html,
)
response = resend.Emails.send(params)
```

**Fallback:** Si no hay API key configurada, se imprime el email en consola con formato legible.

**Plantilla HTML:** Ubicada en `services/api/templates/reset_password.html` con fallback inline en el código (`_FALLBACK_EMAIL_TEMPLATE`). Variables interpoladas: `{{email}}`, `{{reset_url}}`, `{{expires_in}}`, `{{year}}`.

---

## 5. Frontend — Next.js (Backoffice)

### 5.1 Página forgot-password

**Ruta:** `/forgot-password`  
**Archivo:** `uis/backoffice/src/app/forgot-password/page.tsx`  
**Tipo:** Cliente (`"use client"`)

#### Funcionalidades

| Feature | Detalle |
|---------|---------|
| Campo email | `type="email"` con `autoComplete="email"` |
| Validación básica | `required` nativo del navegador |
| Cooldown | 30 segundos después del envío exitoso (deshabilita botón) |
| Mensaje neutro | Muestra `response.message` tal cual llega del backend |
| Manejo de errores | 429 → "demasiadas solicitudes"; Network → "Error de conexión"; otros → extrae `detail` del backend |
| Cleanup de timer | `useRef` + `useEffect` cleanup para evitar memory leaks |

#### Estados de UI

- **Formulario**: Campo email + botón "Enviar enlace"
- **Loading**: Botón deshabilitado con spinner "Enviando…"
- **Cooldown**: Botón muestra "Reintentar en Xs"
- **Success**: Banners azul con el mensaje neutro del backend
- **Error**: Banner rojo con mensaje descriptivo

### 5.2 Página reset-password

**Ruta:** `/reset-password?token=<token>`  
**Archivo:** `uis/backoffice/src/app/reset-password/page.tsx`  
**Tipo:** Cliente con `Suspense` boundary

#### Funcionalidades

| Feature | Detalle |
|---------|---------|
| Token desde URL | `useSearchParams().get("token")` |
| Validación en cliente | Mín. 6 caracteres, confirmación coincidente |
| Manejo de token faltante | Muestra pantalla de error con enlace a /forgot-password |
| Estados de error | Token inválido/expirado, error de conexión |
| Success | Pantalla verde con redirección automática a /login tras 3s |
| Suspense boundary | Envuelve componente interno para `useSearchParams()` |

#### Estructura del componente

```
ResetPasswordPage (default export)
  └── <Suspense fallback={skeleton}>
        └── ResetPasswordForm (contiene useSearchParams)
```

### 5.3 Página change-password

**Ruta:** `/account/change-password`  
**Archivo:** `uis/backoffice/src/app/account/change-password/page.tsx`  
**Tipo:** Cliente protegido

#### Funcionalidades

| Feature | Detalle |
|---------|---------|
| Protegida | `useAuthGuard()` redirige si no hay sesión |
| Campos | Contraseña actual, nueva contraseña, confirmar nueva |
| Validación cliente | Current no vacía, new ≥ 6 caracteres, new ≠ current, confirm coincide |
| Auto-logout | Tras éxito, espera 2s y ejecuta `logout()` |
| Manejo errores | 400 → detalle del backend; 401 → redirige a login; Network → error de conexión |
| Cleanup de timer | `useRef` + `useEffect` cleanup para el setTimeout de logout |

### 5.4 Tipos TypeScript (types.ts)

**Archivo:** `uis/backoffice/src/lib/types.ts`

```typescript
/* ─── Auth — Password Recovery (AUTH-03) ─── */

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  remaining_requests: number;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}
```

### 5.5 API Client (api.ts)

**Archivo:** `uis/backoffice/src/lib/api.ts`

Se añadieron 3 funciones:

```typescript
/* ─── Auth — Password Recovery (AUTH-03) ─── */

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  return fetchAPI<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  return fetchAPI<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> {
  return authFetch<ChangePasswordResponse>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
```

Nota: `forgotPassword` y `resetPassword` usan `fetchAPI` (público), mientras que `changePassword` usa `authFetch` (envía Bearer token automáticamente).

---

## 6. Configuración y Variables de Entorno

### Backend (`services/api/.env`)

```
RESEND_API_KEY=tu_api_key_de_resend
FRONTEND_URL=http://localhost:3001
```

### Backend (`services/api/.env.example`)

```
# API Key de Resend para envío de correos transaccionales
# Obtén tu key en: https://resend.com/api-keys
RESEND_API_KEY=

# URL base del frontend para construir enlaces de restablecimiento
FRONTEND_URL=http://localhost:3001
```

### Frontend (`uis/backoffice/.env`)

```
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
```

### Frontend (`uis/backoffice/.env.example`)

```
# URL base de la API (FastAPI) para el Backoffice
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
```

### Config Pydantic (`services/api/config.py`)

```python
class Settings(BaseSettings):
    ...
    resend_api_key: str = ""

    class Config:
        env_file = ".env"
```

### Dependencias (`services/api/requirements.txt`)

```
resend>=2.47.0
```

---

## 7. Correcciones Aplicadas Durante la Implementación

Durante el desarrollo y auditoría del Hito 6 se identificaron y corrigieron los siguientes problemas:

### 7.1 Resend SDK — Versión incorrecta

| Detalle | Valor |
|---------|-------|
| **Problema** | Se especificó `resend==0.8.1` en requirements.txt pero esa versión no existe en PyPI |
| **Solución** | Actualizado a `resend>=2.47.0` |
| **Cambio API** | v2 usa `resend.Emails.SendParams` (dataclass) en lugar del dict antiguo |
| **Impacto** | Se reescribió `_send_reset_email()` para usar `SendParams(from_address=..., to=[...], ...)` |

### 7.2 Cooldown Timer sin cleanup (forgot-password)

| Detalle | Valor |
|---------|-------|
| **Problema** | `setInterval` no se limpiaba al desmontar el componente → memory leak |
| **Solución** | Refactorizado con `useRef<ReturnType<typeof setInterval>>` + `useEffect` return cleanup |

### 7.3 Falta de Suspense boundary (reset-password)

| Detalle | Valor |
|---------|-------|
| **Problema** | `useSearchParams()` lanza error en producción Next.js 15 si no tiene Suspense boundary |
| **Solución** | Creado componente interno `ResetPasswordForm` + envuelto en `<Suspense>` con skeleton |

### 7.4 setTimeout sin cleanup (reset-password y change-password)

| Detalle | Valor |
|---------|-------|
| **Problema** | `setTimeout(redirect)` y `setTimeout(logout)` sin cleanup → navegaciones fantasma |
| **Solución** | Refactorizado con `useRef<ReturnType<typeof setTimeout>>` + `useEffect` cleanup |

### 7.5 .gitignore bloqueando .env.example

| Detalle | Valor |
|---------|-------|
| **Problema** | El patrón `.env` en `.gitignore` también ignoraba los archivos `.env.example` |
| **Solución** | Se añadió `!.env.example` para permitir el tracking de archivos plantilla |

---

## 8. Auditoría de Seguridad y Buenas Prácticas

### 8.1 Seguridad

| Práctica | Implementado | Detalle |
|----------|-------------|---------|
| Mensaje neutro | ✅ | "Si el correo está registrado, recibirás un enlace de restablecimiento." — no revela existencia del email |
| Rate limiting | ✅ | 3 solicitudes/hora en forgot-password |
| Token único | ✅ | `rst_` + `secrets.token_hex(32)` = 66 caracteres |
| Token no adivinable | ✅ | `secrets.token_hex` usa fuente criptográfica |
| Expiración de token | ✅ | 1 hora desde creación |
| Token de un solo uso | ✅ | Flag `used` — segunda solicitud con el mismo token es rechazada |
| Invalidación de sesiones | ✅ | Al cambiar/resetear pass, se eliminan todos los tokens activos |
| Contraseña no igual a actual | ✅ | Validación en change-password |
| No exponer contraseñas en respuestas | ✅ | Los modelos Response no incluyen el campo password |
| Sanitización HTML en emails | ✅ | `html.escape()` aplicado a `{{email}}` y `{{reset_url}}` |

### 8.2 Buenas Prácticas Frontend

| Práctica | Implementado | Detalle |
|----------|-------------|---------|
| Cleanup de timers | ✅ | useRef + useEffect cleanup en las 3 páginas |
| Suspense boundary | ✅ | reset-password para useSearchParams |
| Manejo de errores por código HTTP | ✅ | 400, 401, 429, 422, Failed to fetch |
| Validación en cliente | ✅ | Mín. 6 caracteres, confirmación, diferente a actual |
| Spinner durante carga | ✅ | Botón deshabilitado con spinner animado |
| Cooldown en forgot-password | ✅ | 30s bloqueo del botón tras envío |
| useCallback en validación | ✅ | reset-password usa useCallback para estabilidad de referencias |
| Auto-logout post cambio | ✅ | change-password fuerza re-login tras 2s |

### 8.3 Buenas Prácticas Backend

| Práctica | Implementado | Detalle |
|----------|-------------|---------|
| Audit logging | ✅ | Todos los eventos registrados con timestamp, IP y detalle |
| Fallback sin API key | ✅ | Si no hay RESEND_API_KEY, simula envío por consola |
| Tipo EmailStr | ✅ | Validación de formato email vía Pydantic |
| IP tracking | ✅ | `request.client.host` registrado en cada evento de auditoría |
| No lanzar excepción en _send_reset_email | ✅ | Captura error de Resend, logea, no propaga al usuario |

---

## 9. Archivos Modificados

### Archivos creados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `uis/backoffice/src/app/forgot-password/page.tsx` | Frontend | Página de solicitud de restablecimiento |
| `uis/backoffice/src/app/reset-password/page.tsx` | Frontend | Página de restablecimiento con token |
| `uis/backoffice/src/app/account/change-password/page.tsx` | Frontend | Página de cambio de contraseña protegida |
| `services/api/.env` | Config | Variables de entorno del backend |
| `services/api/.env.example` | Config | Plantilla de variables de entorno del backend |
| `uis/backoffice/.env` | Config | Variables de entorno del frontend |
| `uis/backoffice/.env.example` | Config | Plantilla de variables de entorno del frontend |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `services/api/routes/auth.py` | Añadidos 3 endpoints (forgot-password, reset-password, change-password), rate limiting, audit logging, integración Resend |
| `services/api/config.py` | Añadido campo `resend_api_key: str = ""` a Settings |
| `services/api/requirements.txt` | Añadido `resend>=2.47.0` |
| `uis/backoffice/src/lib/api.ts` | Añadidas funciones `forgotPassword()`, `resetPassword()`, `changePassword()` |
| `uis/backoffice/src/lib/types.ts` | Añadidas interfaces ForgotPasswordPayload/Response, ResetPasswordPayload/Response, ChangePasswordPayload/Response |
| `uis/backoffice/src/app/login/page.tsx` | Añadido enlace "¿Olvidaste tu contraseña?" → /forgot-password |
| `uis/backoffice/src/app/account/profile/page.tsx` | Añadido botón "Cambiar contraseña" → /account/change-password |
| `.gitignore` | Añadido `!.env.example` para permitir tracking de plantillas |

---

## 10. Pruebas de Regresión

### Backend (Python)

| Prueba | Ruta | Resultado Esperado |
|--------|------|--------------------|
| Compilación Python | `routes/auth.py` | ✅ Sin errores de sintaxis |
| forgot-password (email registrado) | `POST /auth/forgot-password` | 200 + mensaje neutro |
| forgot-password (email no registrado) | `POST /auth/forgot-password` | 200 + mensaje neutro (mismo que registrado) |
| forgot-password (rate limit excedido) | `POST /auth/forgot-password` x4 | 429 |
| reset-password (token válido) | `POST /auth/reset-password` | 200 |
| reset-password (token inválido) | `POST /auth/reset-password` | 400 |
| reset-password (token expirado) | `POST /auth/reset-password` | 400 |
| reset-password (token reutilizado) | `POST /auth/reset-password` x2 | 400 en segundo intento |
| change-password (autenticado) | `POST /auth/change-password` | 200 |
| change-password (current incorrecta) | `POST /auth/change-password` | 400 |
| change-password (new = current) | `POST /auth/change-password` | 400 |
| change-password (sin token) | `POST /auth/change-password` | 401 |

### Frontend (TypeScript)

| Archivo | Errores |
|---------|---------|
| `uis/backoffice/src/app/forgot-password/page.tsx` | ✅ 0 errores |
| `uis/backoffice/src/app/reset-password/page.tsx` | ✅ 0 errores |
| `uis/backoffice/src/app/account/change-password/page.tsx` | ✅ 0 errores |
| `uis/backoffice/src/lib/api.ts` | ✅ 0 errores |
| `uis/backoffice/src/lib/types.ts` | ✅ 0 errores |
| `uis/backoffice/src/app/login/page.tsx` | ✅ 0 errores |
| `uis/backoffice/src/app/account/profile/page.tsx` | ✅ 0 errores |

---

## 11. Commits

```
Implementación completa del ticket AUTH-03 (Recuperación y cambio de contraseña)

Backend:
- POST /auth/forgot-password: solicita restablecimiento vía email (Resend SDK)
- POST /auth/reset-password: restablece contraseña con token (UUID + expiry 1h)
- POST /auth/change-password: cambia contraseña estando autenticado
- Rate limiting in-memory (3 solicitudes/hora)
- Audit logging en TinyDB (9 tipos de eventos)
- Fallback a console si no hay API key de Resend

Frontend (Backoffice):
- /forgot-password: formulario email con cooldown 30s y mensaje neutro
- /reset-password: token desde URL, validación cliente, Suspense boundary
- /account/change-password: protegido, 3 campos, auto-logout, cleanup timers
- Login: enlace "¿Olvidaste tu contraseña?"
- Perfil: botón "Cambiar contraseña"

Configuración:
- .env y .env.example con RESEND_API_KEY y FRONTEND_URL
- .gitignore corregido para permitir .env.example
- requirements.txt actualizado con resend>=2.47.0
- config.py con campo resend_api_key

Seguridad:
- Mensaje neutro (no revela si email existe)
- Token único + 1 hora expiración + un solo uso
- Invalidación de sesiones al cambiar/resetear contraseña
- 0 errores TypeScript, 0 errores Python
```

---

> **Fin del Documento Hito 6**  
> Para más detalles técnicos, consultar el código en `services/api/routes/auth.py` y las páginas en `uis/backoffice/src/app/`.