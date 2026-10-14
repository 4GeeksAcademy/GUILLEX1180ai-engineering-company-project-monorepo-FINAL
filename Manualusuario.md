# 📘 Manual de Usuario — TrackFlow AI Engineering Project

> **Versión:** 1.0.0 · **Última actualización:** 2025-09-28
> **Repositorio:** [GUILLEX1180ai-engineering-company-project-monorepo-FINAL](https://github.com/4GeeksAcademy/GUILLEX1180ai-engineering-company-project-monorepo-FINAL)

---

## 📑 Tabla de Contenidos

1. [Descripción General del Proyecto](#1-descripción-general-del-proyecto)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Requisitos Previos](#3-requisitos-previos)
4. [Instalación y Arranque](#4-instalación-y-arranque)
5. [API REST — Referencia Completa](#5-api-rest--referencia-completa)
6. [Sistema de Caché (Hito 11)](#6-sistema-de-caché-hito-11)
7. [Panel Backoffice (Frontend)](#7-panel-backoffice-frontend)
8. [Autenticación y Perfiles](#8-autenticación-y-perfiles)
9. [Seeders de Datos](#9-seeders-de-datos)
10. [Docker y Despliegue](#10-docker-y-despliegue)
11. [Solución de Problemas Comunes](#11-solución-de-problemas-comunes)
12. [Glosario de Términos](#12-glosario-de-términos)

---

## 1. Descripción General del Proyecto

**TrackFlow** es un sistema de gestión de incidencias logísticas para la empresa ficticia TrackFlow. Permite registrar, seguir, analizar y resolver incidencias de entrega, producto dañado, errores de picking, etc. El proyecto también gestiona un catálogo de proveedores (carriers) y un pipeline de leads/candidatos.

### Componentes Principales

| Componente | Tecnología | Puerto | Descripción |
|---|---|---|---|
| **API REST** | FastAPI 0.115 + TinyDB 4.8 | `8001` | Backend principal con caché TTL |
| **Backoffice** | Next.js 15.1 + React 19 | `3001` | Panel interno de gestión |
| **Application** | Next.js 15 | `3002` | Portal de proveedores |
| **Website** | HTML/JS estático | `3000` | Sitio corporativo |

### Base de Datos

El proyecto usa **TinyDB** (base de datos JSON) en los siguientes archivos:

| Archivo | Contenido |
|---|---|
| `incidents_db.json` | ~502 incidencias (seeder volumétrico) |
| `suppliers_db.json` | 9 proveedores (seed.py) |
| `auth_db.json` | Usuarios y tokens de autenticación |
| `leads_db.json` | Leads / candidatos del pipeline |

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONOREPO TRACKFLOW                          │
├──────────────────┬──────────────────┬───────────────────────────┤
│  uis/backoffice  │  uis/application │  uis/website              │
│  Next.js 15      │  Next.js 15      │  HTML estático            │
│  Puerto 3001     │  Puerto 3002     │  Puerto 3000              │
└────────┬─────────┴────────┬─────────┴───────────────────────────┘
         │                  │
         │    HTTP REST     │
         ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    services/api (FastAPI)                        │
│                    Puerto 8001                                   │
├─────────────────────────────────────────────────────────────────┤
│  /api/v1/incidents   ← CRUD incidencias + caché TTL 15s         │
│  /api/v1/suppliers   ← CRUD proveedores + caché TTL 60s         │
│  /api/v1/records     ← CRUD leads/candidatos                    │
│  /api/v1/auth        ← Login, registro, perfil                  │
│  /api/v1/docs        ← Swagger UI (documentación interactiva)   │
├─────────────────────────────────────────────────────────────────┤
│  cache.py            ← Módulo de caché TTL en memoria           │
│  main.py             ← App FastAPI + middleware de timing        │
│  config.py           ← Settings centralizados (Pydantic)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Requisitos Previos

### Backend (Python)

| Paquete | Versión | Propósito |
|---|---|---|
| Python | ≥ 3.10 | Runtime |
| fastapi | 0.115.0 | Framework web async |
| uvicorn[standard] | 0.31.0 | Servidor ASGI |
| pydantic | 2.10.0 | Validación de modelos |
| pydantic-settings | 2.6.0 | Configuración por env vars |
| tinydb | 4.8.0 | Base de datos JSON |
| python-dotenv | 1.0.1 | Variables de entorno |
| httpx | 0.28.0 | Cliente HTTP |
| python-multipart | 0.0.19 | Upload de archivos |
| resend | ≥ 2.47.0 | Envío de emails |

### Frontend (Node.js)

| Paquete | Versión | Propósito |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| npm | ≥ 9 | Gestor de paquetes |
| Next.js | 15.1.0 | Framework React |
| React | ^19.0.0 | UI library |

---

## 4. Instalación y Arranque

### 4.1 Clonar el Repositorio

```bash
git clone https://github.com/4GeeksAcademy/GUILLEX1180ai-engineering-company-project-monorepo-FINAL.git
cd GUILLEX1180ai-engineering-company-project-monorepo-FINAL
```

### 4.2 Arrancar el Backend (API)

```bash
# Instalar dependencias
cd services/api
pip install -r requirements.txt

# Cargar datos iniciales (proveedores)
python seed.py

# Cargar datos volumétricos (500+ incidencias para testing)
python seed_volumetric.py

# Arrancar el servidor
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Verificar:** Abrir http://localhost:8001/api/v1/docs — debería mostrarse Swagger UI.

### 4.3 Arrancar el Frontend (Backoffice)

```bash
# Instalar dependencias
cd uis/backoffice
npm install

# Arrancar en modo desarrollo
npm run dev
```

**Verificar:** Abrir http://localhost:3001 — debería mostrarse la pantalla de login.

### 4.4 Arrancar con Docker Compose (Todos los servicios)

```bash
# Desde la raíz del proyecto
docker compose up --build
```

Esto arranca todos los servicios:
- Website → http://localhost:3000
- Backoffice → http://localhost:3001
- Application → http://localhost:3002
- API → http://localhost:8001

---

## 5. API REST — Referencia Completa

Base URL: `http://localhost:8001/api/v1`

### 5.1 Incidencias (Incidents)

| Método | Endpoint | Descripción | Caché |
|---|---|---|---|
| `GET` | `/incidents` | Lista incidencias (filtros: status, origin, branch, category) | TTL 15s |
| `GET` | `/incidents/summary` | Métricas agregadas (por estado, categoría, origen, sede) | TTL 30s |
| `POST` | `/incidents` | Crea una nueva incidencia | Invalida caché |
| `GET` | `/incidents/{id}` | Detalle de una incidencia | No |
| `PATCH` | `/incidents/{id}/status` | Actualiza estado (con ciclo de vida) | Invalida caché |
| `DELETE` | `/incidents/{id}` | Elimina una incidencia | Invalida caché |
| `POST` | `/incidents/analyze` | Analiza un CSV de incidencias (multipart) | No |
| `GET` | `/incidents/results/export` | Descarga el último análisis como CSV | No |

#### Valores Permitidos

**Status:** `open`, `in_progress`, `resolved`, `discarded`

**Origin:** `customer`, `branch`, `internal`

**Category:** `Retraso en entrega`, `Producto dañado`, `Devolución incorrecta`, `Error de picking`, `Problema de inventario`

#### Ejemplo: Crear Incidencia

```bash
curl -X POST http://localhost:8001/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Paquete dañado en ruta",
    "description": "El cliente reportó el paquete con daños visibles.",
    "category": "Producto dañado",
    "origin": "customer",
    "branch": "Madrid"
  }'
```

#### Ejemplo: Filtrar Incidencias

```bash
# Solo abiertas
curl "http://localhost:8001/api/v1/incidents?status=open"

# En proceso + reportadas por sede
curl "http://localhost:8001/api/v1/incidents?status=in_progress&origin=branch"
```

#### Ciclo de Vida de Estados

```
open ──────────► in_progress ──────────► resolved (estado final)
  │                    │
  └──► discarded       └──► discarded (estado final)
```

- `open` → solo puede pasar a `in_progress` o `discarded`
- `in_progress` → solo puede pasar a `resolved` o `discarded`
- `resolved` y `discarded` son **estados finales** (sin cambios posibles)

### 5.2 Proveedores (Suppliers)

| Método | Endpoint | Descripción | Caché |
|---|---|---|---|
| `GET` | `/suppliers` | Lista proveedores (filtros: pais, categoria) | TTL 60s |
| `POST` | `/suppliers` | Registra un proveedor nuevo | Invalida caché |
| `GET` | `/suppliers/{id}` | Detalle de un proveedor | No |
| `PATCH` | `/suppliers/{id}/rate` | Actualiza la tarifa | Invalida caché |
| `PATCH` | `/suppliers/{id}/status` | Actualiza el estado (activo/suspendido) | Invalida caché |
| `DELETE` | `/suppliers/{id}` | Elimina un proveedor | Invalida caché |

#### Valores Permitidos

**Status:** `activo`, `suspendido`

**Categorías:** `Moda`, `Electrónica`, `Cosmética`, `Alimentación`

**Países:** `Estados Unidos`, `España`

#### Ejemplo: Crear Proveedor

```bash
curl -X POST http://localhost:8001/api/v1/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "GLS España",
    "pais": "España",
    "categorias": ["Moda", "Electrónica"],
    "contacto_email": "info@gls.es"
  }'
```

### 5.3 Leads / Candidatos (Records)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/records` | Lista leads (query param: limit) |
| `GET` | `/records/{id}` | Detalle de un lead |
| `POST` | `/records` | Crea un lead nuevo |
| `PUT` | `/records/{id}` | Actualiza un lead completo |
| `PATCH` | `/records/{id}` | Actualiza status/stage parcial |
| `GET` | `/records/{id}/notes` | Notas de un lead |
| `POST` | `/records/{id}/notes` | Agrega una nota |
| `DELETE` | `/records/{id}/notes/{note_id}` | Elimina una nota |

### 5.4 Autenticación (Auth)

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registrar nuevo usuario |
| `POST` | `/auth/login` | Iniciar sesión (devuelve token) |
| `GET` | `/auth/me` | Perfil del usuario actual (requiere Bearer token) |
| `PUT` | `/profiles/me` | Actualizar perfil (requiere Bearer token) |

---

## 6. Sistema de Caché (Hito 11)

El proyecto implementa un módulo de caché en memoria con expiración por TTL (Time-To-Live), optimizado en el **Hito 11** de ingeniería.

### 6.1 Arquitectura del Caché

Ubicación: `services/api/cache.py`

```python
class TTLCache:
    """Caché en memoria thread-safe con expiración por TTL."""
    
    def get(key) -> dict | list | None    # Obtener valor (o None si expiró)
    def set(key, value, ttl) -> None      # Almacenar con TTL en segundos
    def invalidate_prefix(prefix) -> int  # Invalidar por prefijo
    def clear() -> None                   # Limpiar todo
```

**Características:**
- Thread-safe (usa `threading.Lock`)
- Limpieza lazy: los elementos expirados se eliminan al hacer `get()`
- Invalidación por prefijo: `invalidate_prefix("incidents:")` borra todas las claves que empiecen con ese prefijo

### 6.2 Qué se Cachea

| Endpoint | Clave de Caché | TTL | Razón |
|---|---|---|---|
| `GET /incidents` | `incidents:list:{status}:{origin}:{branch}:{category}` | **15s** | Lectura frecuente, datos semi-estáticos |
| `GET /incidents/summary` | `incidents:summary` | **30s** | Datos agregados, cambian raramente |
| `GET /suppliers` | `suppliers:list:{pais}:{categoria}` | **60s** | Catálogo estable |

### 6.3 Invalidation

El caché se invalida automáticamente cuando se realizan **escrituras**:

| Operación | Invalidación |
|---|---|
| `POST /incidents` | `invalidate_prefix("incidents:")` |
| `PATCH /incidents/{id}/status` | `invalidate_prefix("incidents:")` |
| `DELETE /incidents/{id}` | `invalidate_prefix("incidents:")` |
| `POST /suppliers` | `invalidate_prefix("suppliers:")` |
| `PATCH /suppliers/{id}/rate` | `invalidate_prefix("suppliers:")` |
| `PATCH /suppliers/{id}/status` | `invalidate_prefix("suppliers:")` |
| `DELETE /suppliers/{id}` | `invalidate_prefix("suppliers:")` |

### 6.4 Qué NO se Cachea (y Por Qué)

| Endpoint | Razón |
|---|---|
| `GET /auth/me` | Datos personales, siempre frescos |
| `GET /records` | Operaciones CRUD de leads, volumen bajo |
| `GET /incidents/{id}` | Detalle individual, acceso poco frecuente |
| `POST /incidents/analyze` | Procesamiento pesado, una vez por uso |

### 6.5 Middleware de Timing

El backend registra el tiempo de respuesta de cada petición en los logs:

```
⏱  GET /api/v1/incidents → 200 (6.1 ms, cache=42)
```

---

## 7. Panel Backoffice (Frontend)

URL: http://localhost:3001

### 7.1 Rutas Disponibles

| Ruta | Descripción |
|---|---|
| `/login` | Inicio de sesión |
| `/register` | Registro de nuevo usuario |
| `/forgot-password` | Recuperación de contraseña |
| `/reset-password` | Restablecimiento de contraseña |
| `/` | Dashboard principal (requiere login) |
| `/incidents` | Lista de incidencias |
| `/incidents/new` | Crear nueva incidencia |
| `/incidents/summary` | Dashboard de métricas (con lazy loading) |
| `/suppliers` | Lista de proveedores |
| `/suppliers/new` | Registrar nuevo proveedor |
| `/suppliers/[id]` | Detalle de proveedor |
| `/candidates/new` | Registrar nuevo candidato/lead |
| `/candidates/[id]` | Detalle de candidato |
| `/candidates/[id]/edit` | Editar candidato |
| `/account/profile` | Mi perfil |
| `/account/change-password` | Cambiar contraseña |

### 7.2 Optimizaciones de Rendering (Hito 11)

Se implementaron las siguientes optimizaciones en el frontend:

- **Lazy Loading** con `next/dynamic`:
  - `IncidentDashboard` (página de métricas)
  - `NewLeadForm` (formulario de candidatos)
  - Carga diferida con skeleton como fallback

- **useMemo** para derivaciones costosas:
  - `sortedCategories`: ordena categorías por conteo de incidencias
  - `sortedBranches`: ordena sedes por conteo de incidencias

Estas optimizaciones reducen el bundle inicial y mejoran el tiempo de carga percibido.

---

## 8. Autenticación y Perfiles

### 8.1 Flujo de Login

1. Envía `POST /auth/login` con `{ email, password }`
2. Recibe un `access_token` (prefijo `tf_`)
3. Usa el token en headers posteriores: `Authorization: Bearer tf_...`

### 8.2 Usuario de Prueba

| Campo | Valor |
|---|---|
| Email | `testuser@trackflow.com` |
| Password | `TestPass123` |

### 8.3 Ejemplo con curl

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@trackflow.com","password":"TestPass123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Usar token para acceder a /auth/me
curl -s http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 9. Seeders de Datos

### 9.1 seed.py — Proveedores Iniciales

```bash
cd services/api
python seed.py
```

Carga 9 proveedores iniciales alineados con el contexto de TrackFlow (UPS, FedEx, DHL, MRW, SEUR, etc.). **Idempotente**: no duplica si ya existen.

### 9.2 seed_volumetric.py — Incidencias para Pruebas de Carga

```bash
cd services/api
python seed_volumetric.py
```

Genera **500 registros** de incidencias realistas con:
- Distribución ponderada de estados: open (30%), in_progress (25%), resolved (35%), discarded (10%)
- 8 sedes (Madrid, Barcelona, Valencia, Sevilla, Bilbao, Málaga, Zaragoza, Central)
- 5 categorías de incidencia
- 3 orígenes (customer, branch, internal)
- Timestamps repartidos en 90 días

**Idempotente**: verifica el conteo actual antes de insertar.

---

## 10. Docker y Despliegue

### 10.1 Docker Compose (Desarrollo)

```bash
docker compose up --build
```

### 10.2 URLs en Docker

| Servicio | URL |
|---|---|
| Website | http://localhost:3000 |
| Backoffice | http://localhost:3001 |
| Application | http://localhost:3002 |
| API | http://localhost:8001 |
| Swagger Docs | http://localhost:8001/api/v1/docs |

### 10.3 Variables de Entorno

| Variable | Default | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Modo de ejecución |
| `NEXT_PUBLIC_API_URL` | `http://backend:8001/api/v1` | URL de la API (para frontends) |
| `BACKEND_HOST` | `backend` | Host del backend en Docker |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Orígenes permitidos (separados por coma) |
| `RESEND_API_KEY` | _(vacío)_ | API key para servicio de emails |

---

## 11. Solución de Problemas Comunes

### ❌ `ModuleNotFoundError: No module named 'tinydb'`

```bash
cd services/api
pip install -r requirements.txt
```

### ❌ `422 Unprocessable Entity` al crear incidencia

Verifica que el body tenga **todos los campos obligatorios** con los valores correctos:

```json
{
  "title": "Título descriptivo",
  "description": "Descripción detallada",
  "category": "Retraso en entrega",
  "origin": "customer",
  "branch": "Madrid"
}
```

**Categorías válidas:** `Retraso en entrega`, `Producto dañado`, `Devolución incorrecta`, `Error de picking`, `Problema de inventario`

**Orígenes válidos:** `customer`, `branch`, `internal`

### ❌ `400 Bad Request` al filtrar incidencias

Los filtros `status` y `origin` **validan** que pertenezcan a los valores conocidos.

```bash
# ✅ Correcto
curl "http://localhost:8001/api/v1/incidents?status=open&origin=branch"

# ❌ Incorrecto (valor no existe)
curl "http://localhost:8001/api/v1/incidents?status=activo"
```

### ❌ `409 Conflict` al cambiar estado

Esto significa que la transición de estado no es válida. Consulta la sección [Ciclo de Vida de Estados](#ciclo-de-vida-de-estados).

```bash
# ❌ No se puede pasar de resolved a in_progress (resolved es estado final)
curl -X PATCH http://localhost:8001/api/v1/incidents/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

### ❌ `401 Unauthorized` en /auth/me

Necesitas enviar el header de autenticación:

```bash
curl http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer tf_TU_TOKEN_AQUI"
```

### ❌ Frontend no conecta con la API

Verifica que `NEXT_PUBLIC_API_URL` esté configurado correctamente:

```bash
# Para desarrollo local
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1

# Para Docker
NEXT_PUBLIC_API_URL=http://backend:8001/api/v1
```

### ❌ Build de Next.js falla

```bash
cd uis/backoffice
rm -rf node_modules .next
npm install
npm run build
```

---

## 12. Glosario de Términos

| Término | Definición |
|---|---|
| **TrackFlow** | Nombre de la empresa ficticia del proyecto |
| **Incidencia** | Problema reportado en la cadena logística (entrega, producto, etc.) |
| **Lead** | Candidato o contacto registrado en el sistema CRM |
| **Supplier** | Proveedor / carrier que gestiona envíos |
| **TinyDB** | Base de datos JSON ligera (sin servidor) |
| **TTL** | Time-To-Live — duración de un elemento en caché antes de expirar |
| **Seed / Seeder** | Script que carga datos iniciales de prueba |
| **Lazy Loading** | Carga diferida de componentes para mejorar rendimiento |
| **useMemo** | Hook de React que memoriza valores calculados |
| **Hito** | Entrega o milestone del proyecto de ingeniería |
| **Ciclo de vida** | Flujo de estados por el que pasa una incidencia |

---

## 📞 Soporte

Para problemas técnicos, revisa:
1. [TESTING.md](./TESTING.md) — Guía de testing
2. [CACHING_REPORT.md](./CACHING_REPORT.md) — Reporte técnico de optimización de caché
3. [Documentos_hitos11.md](./Documentos_hitos11.md) — Documentación completa del Hito 11
4. [Swagger UI](http://localhost:8001/api/v1/docs) — Documentación interactiva de la API

---

> **Desarrollado por:** Guillem (GUILLEX1180) · 4Geeks Academy AI Engineering Program
