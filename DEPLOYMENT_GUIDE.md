# =============================================================================
# GUÍA DE DESPLIEGUE DevSecOps — TrackFlow
# Publicar en GitHub + Desplegar Backend (FastAPI) y Frontend (Next.js)
# en la nube para pruebas funcionales E2E (Render / Railway / Vercel)
# =============================================================================

> Documento operativo generado a partir del código real del monorepo.
> Alcance de esta iteración: **despliegue de un entorno de PRUEBAS E2E**.
> El backend usa **TinyDB/JSON local** (disco efímero). Los datos se pierden en
> cada redeploy: válido para demos/E2E, **no para producción con datos reales**.

---

## 0. Arquitectura que vamos a desplegar

```
[ GitHub ] ── push ──▶ [ Render o Railway ]            Backend FastAPI (services/api)
                          └─ uvicorn main:app --port $PORT
                          └─ TinyDB local (efímero)
                          └─ JWT reset + bcrypt + rate limit + audit log
                          └─ Email: RESEND (real) o log (dev)

[ GitHub ] ── push ──▶ [ Vercel / Netlify / Render ]    Frontend Next.js (uis/backoffice)
                          └─ NEXT_PUBLIC_API_URL = https://<backend>.onrender.com/api/v1
```

- **Backend**: `services/api` → FastAPI 0.115, PyJWT, bcrypt, TinyDB.
- **Frontend**: `uis/backoffice` → Next.js 15 (React 19) con `NEXT_PUBLIC_API_URL`.
- **Reseteo de contraseña**: URL construida como `<FRONTEND_URL>/reset-password?token=<TOKEN>`.

---

## 1. ✅ Checklist rápido de preparación antes de `git push`

Antes de publicar, verifica **en orden**:

### 1.1 Secretos y `.env`
- [ ] **`.env` NO debe aparecer en `git status`** → comprobar con:
  ```bash
  git status --short | grep -i "\.env"   # solo deben salir los .env.example
  git check-ignore services/api/.env     # debe imprimir la ruta (está ignorado)
  ```
- [ ] `git check-ignore services/api/.env.example` → **no** debe estar ignorado (se versiona como plantilla).
- [ ] No existen otros secretos versionados: claves Firebase/Supabase, `*.pem`, `*.key`.
- [ ] `git ls-files | grep -iE "\.env$|\.pem$|serviceAccount"` → **vacío**.

### 1.2 Código y tests
- [ ] Tests verdes (180/180 con el trabajo de auth):
  ```bash
  cd services/api && ./.venv/bin/python -m pytest tests/ -q
  ```
  → `180 passed`.
- [ ] `JWT_SECRET_KEY` en tu `.env` local es >= 32 bytes:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(64))"
  ```
- [ ] `requirements.txt` incluye `PyJWT>=2.9.0,<3` y `bcrypt>=4.2.0,<5` (ya añadidos).

### 1.3 Repositorio y rama
- [ ] Estás en la rama correcta: `git branch --show-current` → `feature/caching-optimisation` (o `main` si decides fusionar).
- [ ] Origen remoto configurado: `git remote -v` (ya existe: `4GeeksAcademy/...FINAL`).

### 1.4 Versiones/build
- [ ] (Opcional) El backend construye con el nuevo `services/api/Dockerfile`:
  ```bash
  docker build -f services/api/Dockerfile -t trackflow-api services/api
  ```

---

## 2. 📄 `.gitignore` recomendado y plantilla `.env.example`

**Ya están en el repo** (esta sesión):
- `/.gitignore` → reforzado con: `*.pem`, `*.key`, `*.p12`, `*.pfx`, `serviceAccountKey*.json`, `firebase-*.json`, `google-credentials.json`, `.pytest_cache/`, `.mypy_cache/`, y `!**/.env.example` (usa anclas para que las plantillas SÍ se versionen).
- `/.env.example` → plantilla raíz actualizada con la sección de seguridad JWT/email (formato `CORS_ORIGINS` coma-separado, alineado con `parse_cors_origins`).
- `/services/api/.env.example` → plantilla del backend (ya actualizada en la iteración anterior: `JWT_SECRET_KEY`, TTL, rate limit, Resend/SendGrid/log, `FRONTEND_URL`).
- `/services/api/.dockerignore` (NUEVO) → excluye `.env`, `.venv/`, `tests/`, `*_db.json` del build de imagen.
- `/services/api/Dockerfile` (NUEVO) → imagen Python 3.12-slim segura (usuario sin privilegios, `uvicorn main:app --port 8001`).
- `/render.yaml` (NUEVO) → Blueprint de Render para backend + frontend en un solo click.

> ⚠️ Regla de oro: los `.env.example` se versionan; los `.env` **nunca**.

---

## 3. 🧱 Comandos de Git para subir el código a GitHub

Tu repo **ya está inicializado** y tiene `origin` configurado. Flujo completo:

```bash
# 0) Situarse en la raíz del monorepo
cd /workspaces/GUILLEX1180ai-engineering-company-project-monorepo-FINAL

# 1) (Opcional pero recomendado) Crea una rama limpia para el deploy
git checkout -b feat/deploy-cloud

# 2) Añade los archivos nuevos/modificados (incluye los archivos de esta sesión)
git add -A

# 3) Revisa EXACTAMENTE qué se va a commitear (¡verifica que no hay .env!)
git status
git diff --cached --stat

# 4) Commit con mensaje descriptivo
git commit -m "feat(deploy): add Dockerfile, render.yaml, .dockerignore y guía de despliegue DevSecOps"

# 5) Sube la rama
git push -u origin feat/deploy-cloud
```

> Si prefieres subir a `main` directamente (no recomendado en equipos):
> ```bash
# git checkout main && git pull origin main
# git merge feat/deploy-cloud
# git push origin main
```

> 💡 Si el repo no tuviera remoto (no es tu caso), se haría:
> ```bash
# git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
# git push -u origin main
```

### 3.1 Verificación post-push
```bash
git ls-remote origin   # debe listar tus ramas
```
En GitHub: abre el repo → verás la rama `feat/deploy-cloud` con los archivos nuevos.

---

## 4. 🚀 Pasos exactos para desplegar Backend y Frontend

### Opción A — **Render (recomendada para empezar): Blueprint de 1 clic**

`render.yaml` ya está en la raíz del repo. En el panel de Render:

1. **New + → Blueprint** → conectar el repo de GitHub.
2. Render detecta `render.yaml` y crea **2 servicios**:
   - `trackflow-api` (python, `rootDir: services/api`)
   - `trackflow-backoffice` (node, `rootDir: uis/backoffice`)
3. **Configura los Secretos/Env Vars del backend** en el dashboard (ajusta a tu subdominio real):
   | Variable | Valor |
   |---|---|
   | `JWT_SECRET_KEY` | generado (Render auto) o `secrets.token_urlsafe(64)` |
   | `EMAIL_PROVIDER` | `resend` |
   | `RESEND_API_KEY` | tu API key de Resend |
   | `RESEND_FROM_EMAIL` | `TrackFlow <no-reply@tu-dominio.com>` |
   | `FRONTEND_URL` | `https://trackflow-backoffice.onrender.com` |
   | `CORS_ORIGINS` | `https://trackflow-backoffice.onrender.com` |
4. **Env Vars del frontend**:
   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://trackflow-api.onrender.com/api/v1` |
   | `BACKEND_HOST` | `trackflow-api.onrender.com` |
5. **Deploy** y espera a que ambos estén `Live`.

**Notas Render:**
- `healthCheckPath: /api/v1/health` ya configurado en `render.yaml`.
- El backend arranca con `uvicorn main:app --host 0.0.0.0 --port $PORT` (Render inyecta `PORT`).
- Los datos TinyDB se pierden en cada redeploy (efímero) — previsto para E2E.

---

### Opción B — **Railway (alternativa backend, igual de simple)**

1. **New Project → Deploy from GitHub** → elige el repo.
2. Mira el **root directory**: configúralo en `services/api`.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Variables** (pestaña Variables):
   ```
   JWT_SECRET_KEY=...
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=...
   RESEND_FROM_EMAIL=...
   FRONTEND_URL=https://trackflow-backoffice.vercel.app
   CORS_ORIGINS=https://trackflow-backoffice.vercel.app
   ```
6. Aparecerá una URL pública tipo `https://trackflow-api.up.railway.app`. El puerto lo inyecta Railway.

---

### Opción C — **Vercel (frontend Next.js, la opción más cómoda)**

El backoffice es Next.js 15 con `output: standalone`. En Vercel:

1. **Add New Project → Import** el repo desde GitHub.
2. **Root Directory**: `uis/backoffice`
3. **Build Command**: `npm run build` (Vercel lo detecta automáticamente).
4. **Env Variable**:
   ```
   NEXT_PUBLIC_API_URL=https://trackflow-api.onrender.com/api/v1
   ```
5. **Deploy**. Si el backend usa CORS, añade el origen de Vercel:
   - `CORS_ORIGINS=https://trackflow-backoffice-xxxx.vercel.app`

> ⚠️ En Vercel **no** uses `BACKEND_HOST` para el proxy (`rewrites` → localhost no es accesible); usa siempre la URL pública vía `NEXT_PUBLIC_API_URL`. El código de `src/lib/api.ts` ya lo soporta (`process.env.NEXT_PUBLIC_API_URL ?? ""`).

---

### Opción D — **Self-hosted / Fly.io (optativa)**

Fly.io necesita un `fly.toml` con `internal_port: 8001` (tu `Dockerfile` EXPONE 8001). No se crea en esta iteración; se documenta en el README si lo necesitas.

---

### CORS — imprescindible tras desplegar

El backend solo acepta los orígenes en `settings.cors_origins`. **Después de desplegar**, actualiza el `CORS_ORIGINS` del backend con el dominio real del frontend:

```
CORS_ORIGINS=https://trackflow-backoffice.onrender.com
```

Si añades más (p. ej. el localhost de desarrollo):
```
CORS_ORIGINS=https://trackflow-backoffice.onrender.com,http://localhost:3001
```

---

## 5. ✅ Lista de comprobación E2E (auth + email) en el entorno publicado

Recomendación: usa un **buzón real** (Gmail/Outlook) para verificar el email de reseteo.

### 5.1 Backend saludable
- [ ] `GET https://<backend>/api/v1/health` → `200 OK` con `{"status":"ok",...}` (o similar).
- [ ] `GET https://<backend>/docs` → Swagger UI visible (confirmación de que uvicorn sirve la app).

### 5.2 Flujo de autenticación
1. [ ] **Registro**: `POST /api/v1/auth/register` con email real + contraseña → `201`.
2. [ ] **Login**: `POST /api/v1/auth/login` con esas credenciales → `200` + token.
3. [ ] **Perfil**: `GET /api/v1/auth/me` con `Authorization: Bearer <token>` → `200` y devuelve el usuario.

### 5.3 Reseteo de contraseña (email)
4. [ ] `POST /api/v1/auth/forgot-password` con el email real → `200` genérico (anti-enumeración).
5. [ ] **Recibes el email** en el buzón real con el asunto y URL `…/reset-password?token=…` (el botón CTA del HTML está renderizado).
6. [ ] Abres el enlace en el frontend desplegado:
   - [ ] Se renderiza la página de reset (Next.js) y captura el `?token=` de la URL.
7. [ ] Escribes una nueva contraseña y envías → `POST /api/v1/auth/reset-password` → `200`.
8. [ ] **Login con la NUEVA contraseña** → `200`.
9. [ ] **Login con la contraseña ANTERIOR** → `401` (el token era de un solo uso y el `password_changed_at` invalidó el anterior).

### 5.4 Cambio de contraseña autenticado
10. [ ] Con token vigente: `POST /api/v1/auth/change-password` con `current_password` correcto → `200`.
11. [ ] Repites con `current_password` incorrecto → `400` + audit `PASSWORD_CHANGE_FAILED`.

### 5.5 Seguridad / rate limit
12. [ ] Envía `forgot-password` **más de 3 veces por hora** al mismo email → la 4ª da `429`.
13. [ ] (Opcional) Verifica en `services/api/auth_db.json` (tabla `audit_log`) que quedaron registros: `password_reset_requested`, `password_reset_completed`, `password_change_completed`.

### 5.6 CORS entre dominios
14. [ ] Desde el navegador en el frontend desplegado, las llamadas a la API (login/register) **no** dan error de CORS en la consola del navegador.

---

## 6. 🔒 Recordatorios de seguridad (DevSecOps)

- **Nunca** hagas push de `.env` (verify con `git status` antes de cada commit).
- `JWT_SECRET_KEY` debe ser aleatorio y **≥32 bytes**. Si ves `InsecureKeyLengthWarning` al arrancar, es porque el secreto por defecto (`change-me-in-production`, 23 bytes) es corto: cámbialo.
- Usa `EMAIL_PROVIDER=resend` (o `sendgrid`) en producción; `log` solo para desarrollo.
- Con disco efímero (TinyDB/JSON), **no** alojes datos de clientes reales; esta instancia es solo para E2E.
- El rate limit de `forgot-password` (3/h/email) ya está activo para mitigar abuso de enumeración.
- Revisa `audit_log` para detectar intentos fallidos de reset (`password_reset_failed`).

---

## 7. 🚫 Limitaciones conocidas de este despliegue (importante)

| Limitación | Impacto | Mitigación E2E |
|---|---|---|
| TinyDB/JSON en disco efímero | Datos se pierden en cada redeploy | Aceptado para pruebas; para producción migrar a Supabase/PostgreSQL |
| Email en `log` si no pones key | No llegan emails reales | Poner `RESEND_API_KEY` real en Render/Railway |
| Sin CI/CD aún | Sin tests automáticos en el push | (Próximo paso opcional: GitHub Actions) |
| Frontend `website`/`application` estáticos no incluidos | Solo backoffice desplegado | Se pueden añadir como static site en Render/Vercel después |

---

## 8. 🧪 Próximo paso opcional (CI/CD con GitHub Actions)

Si quieres tests automáticos antes de cada deploy, basta un workflow que corra `pytest`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  api-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: services/api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: pytest tests/ -q
```

Se guarda en `.github/workflows/ci.yml` y se activa en `Settings → Secrets and variables → Actions` para las env vars.

---

*Documento generado para la iteración de despliegue DevSecOps del monorepo TrackFlow.*