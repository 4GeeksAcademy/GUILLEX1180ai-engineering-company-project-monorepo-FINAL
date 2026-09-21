# Hito 5 — Corrección de registro de usuarios Frontend/Backend

## 📋 Resumen

Se identificó y corrigió un error **404 (Not Found)** al intentar registrar usuarios desde el frontend (`/register`). La causa fue una **discrepancia de ruta (path mismatch)** entre la llamada HTTP del frontend y el endpoint expuesto por el backend.

---

## 🔍 Diagnóstico

### Síntoma

Al enviar el formulario de registro en `/app/register/page.tsx`, el navegador devolvía un error **404 Not Found**.

### Causa raíz

En el archivo `uis/backoffice/src/lib/api.ts`, la función `register()` realizaba la petición a:

```
POST /users
```

Pero el **backend** expone el registro en:

```
POST /auth/register
```

Dado que `NEXT_PUBLIC_API_URL=/api/v1`, la petición completa resultante era:

```
POST /api/v1/users   →   404 ❌
```

Cuando la ruta correcta es:

```
POST /api/v1/auth/register   →   201 ✅
```

### Archivos involucrados

| Archivo | Rol |
|---|---|
| `uis/backoffice/src/lib/api.ts` | Contiene la función `register()` con la ruta incorrecta |
| `uis/backoffice/.env.local` | Define `NEXT_PUBLIC_API_URL=/api/v1` |
| `uis/backoffice/next.config.js` | Proxy rewrites `/api/v1/*` → `http://127.0.0.1:8001/api/v1/*` |
| `services/api/main.py` | Incluye el router `auth` con prefijo `/api/v1` |
| `services/api/routes/auth.py` | Expone `POST /auth/register` |

---

## 🛠 Corrección aplicada

### Cambio en `uis/backoffice/src/lib/api.ts`

**Línea corregida:** función `register()` (~ línea 172)

| Antes (incorrecto) | Después (correcto) |
|---|---|
| `fetchAPI("/users", ...)` | `fetchAPI<{ id: number; email: string }>("/auth/register", ...)` |

Adicionalmente se añadió el tipo genérico explícito `<{ id: number; email: string }>` para mejorar la inferencia de tipos en TypeScript.

---

## ✅ Verificación

### Pruebas de regresión ejecutadas

| Prueba | Ruta | Resultado |
|---|---|---|
| Registro exitoso | `POST /api/v1/auth/register` | **201** `{"id":3, "email":"..."}` |
| Registro duplicado | `POST /api/v1/auth/register` (mismo email) | **409** `"Este correo electrónico ya está registrado"` |
| Login exitoso | `POST /api/v1/auth/login` | **200** (token recibido) |
| Ruta antigua `/users` | `POST /api/v1/users` | **404** (confirmación de que esa era la causa) |

### Pruebas adicionales del flujo completo

| Componente | Estado |
|---|---|
| Backend API (`:8001/api/v1/health`) | ✅ 200 |
| Frontend Backoffice (`:3001/`) | ✅ 200 |
| Login (`:3001/login`) | ✅ 200 |
| Registro (`:3001/register`) | ✅ 200 |
| Perfil (`:3001/account/profile`) | ✅ 200 |
| Website público (`:8080/`) | ✅ 200 — sin afectación |

---

## 🧠 Lecciones aprendidas

1. **Sincronización de rutas Frontend ↔ Backend**: Cada vez que se añade un nuevo endpoint al backend, debe verificarse que la ruta en `api.ts` coincida exactamente con la ruta decorada en FastAPI.
2. **Proxy de Next.js**: Las `rewrites` en `next.config.js` traducen `/api/v1/*` → `http://127.0.0.1:8001/api/v1/*`. El frontend solo necesita especificar la ruta relativa a `/api/v1/`.
3. **Prefijo unificado**: El `api_prefix = "/api/v1"` está definido en `services/api/config.py` y se aplica a todos los routers en `main.py`.

---

## 📁 Archivos modificados

```
M  uis/backoffice/src/lib/api.ts     (1 línea: /users → /auth/register)
```

## 📦 Commit

```
git commit -m "fix: corrige ruta de registro de /users a /auth/register

- La función register() en api.ts apuntaba a POST /users causando 404
- El backend expone el registro en POST /auth/register
- Se añadió tipo genérico explícito para mejor inferencia TypeScript
- Verificado: registro 201, duplicado 409, login 200, ruta antigua 404"
```