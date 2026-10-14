# HITO 12 — Módulo de Inventario: Supabase/SQLModel + Integración End-to-End

> **Requerimiento:** Migrar y reestructurar el módulo de inventario de TrackFlow a Supabase (PostgreSQL) usando SQLModel, con arquitectura en capas, trazabilidad de usuarios y control de stock por almacén.
> **Proyecto:** TrackFlow (3PL — Logística de Terceros)
> **Estado:** ✅ Completado
> **Última actualización:** 2026-10-12
> **Branch:** `feature/caching-optimisation`
> **PR:** Pendiente de apertura

---

## Tabla de Contenidos

1. [Objetivo y Alcance](#1-objetivo-y-alcance)
2. [Gestión de Dependencias y Entorno (`uv`)](#2-gestión-de-dependencias-y-entorno-uv)
3. [Configuración de Variables de Entorno (`.env`)](#3-configuración-de-variables-de-entorno-env)
4. [Conexión Dual: TinyDB + Supabase (`database.py`)](#4-conexión-dual-tinydb--supabase-databasepy)
5. [Modelos ORM (`models.py`)](#5-modelos-orm-modelspy)
6. [Esquema Sincronizado en Supabase](#6-esquema-sincronizado-en-supabase)
7. [Capa DTO (`schemas/stock.py`)](#7-capa-dto-schemasstockpy)
8. [Capa de Servicios (`services/inventory.py`)](#8-capa-de-servicios-servicesinventorypy)
9. [Router de Inventario (`routes/inventory.py`)](#9-router-de-inventario-routesinventorypy)
10. [Integración en `main.py`](#10-integración-en-mainpy)
11. [Datos Semilla (`seed_inventory.py`)](#11-datos-semilla-seed_inventorypy)
12. [Validación End-to-End (Resultados)](#12-validación-end-to-end-resultados)
13. [Seguridad y Auditoría](#13-seguridad-y-auditoría)
14. [Archivos Creados y Modificados](#14-archivos-creados-y-modificados)
15. [Notas Pendientes y Mejoras Futuras](#15-notas-pendientes-y-mejoras-futuras)
16. [Cómo Ejecutar](#16-cómo-ejecutar)

---

## 1. Objetivo y Alcance

Implementar el módulo de inventario de TrackFlow siguiendo la arquitectura del proyecto (`AGENTS.md`): separación estricta en capas (ORM / DTO / Servicios / Router), migración de persistencia desde TinyDB a **Supabase (PostgreSQL 17.11)** manteniendo TinyDB únicamente para autenticación, y trazabilidad completa de movimientos de stock.

**Alcance entregado:**

- ✅ Conexión dual TinyDB (auth) + Supabase (inventario) con carga jerárquica de `.env`.
- ✅ Modelos ORM: `Product`, `Warehouse`, `InboundOrder` (Orden de Entrada), `OutboundOrder` (Orden de Salida).
- ✅ Esquema sincronizado en Supabase (tablas + FKs + índices + CHECK constraints).
- ✅ Capa DTO con validaciones de entrada y serialización de respuesta.
- ✅ Reglas de negocio: stock neto dinámico, partición por almacén, inmutabilidad del stock, protección contra stock negativo.
- ✅ API REST `/inventory` con 8 endpoints y auditoría `user_uuid` vía token.
- ✅ Datos semilla (`seed_data()`) verificados contra Supabase.
- ✅ Validación end-to-end completa (11 criterios).

---

## 2. Gestión de Dependencias y Entorno (`uv`)

Se adopta **`uv`** (Astral) como gestor de entornos y dependencias del servicio `services/api`:

- **Instalación:** instalador oficial de Astral (`uv 0.13.0`) en `$HOME/.local/bin` (el `pip` del sistema está bloqueado por PEP 668).
- **Entorno y ejecución:** `uv run python ...` desde `services/api` (usa el `pyproject.toml` del servicio).
- **Dependencias añadidas/validadas:** `sqlmodel`, `psycopg2-binary` (driver PostgreSQL).
- **Versiones resueltas en el entorno:**

  | Paquete | Versión |
  |---|---|
  | SQLModel | 0.0.48 |
  | SQLAlchemy | 2.1.4 |
  | psycopg2-binary | 2.9.13 |
  | pydantic (resuelto) | 2.14.1 |

> ⚠️ **Desalineación conocida:** `requirements.txt` fija `pydantic==2.10.0` mientras el entorno `uv` resuelve 2.14.1 (compatible con SQLModel 0.0.48). Pendiente unificar el pinning (ver §15).

---

## 3. Configuración de Variables de Entorno (`.env`)

### 3.1. Variables configuradas

**Raíz del repositorio (`.env`):**

```env
DATABASE_URL=postgresql+psycopg2://postgres.qquxsrzjtkzsxmddrzcs:Lgjg1180%2B*%2B@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

- El password real `Lgjg1180+*+` requiere URL-encoding: `+` → `%2B`, `*` literal.
- `services/api/.env` conserva sus variables existentes (`RESEND_API_KEY`, `FRONTEND_URL`) **sin** `DATABASE_URL`.

**`services/api/.env` (CORS):**

```env
CORS_ORIGINS=["*"]
```

- `pydantic-settings` **JSON-parsa** valores de entorno complejos: el valor `"*"` (comillas incluidas) se interpreta como **JSON array** y se valida contra `Settings.cors_origins: list[str]`.
- Como `config.py` se importa **antes** que `database.py`/routers en `main.py`, el settings ya está resuelto cuando se construye el middleware CORS → cualquier origen (dev en puerto 3000/3001) queda permitido.

### 3.2. Carga jerárquica del `.env`

`database.py` implementa `_load_dotenv_hierarchy()`, que recorre desde el directorio de `database.py` hacia la raíz buscando `.env` (con `override=False`): las variables del nivel hijo tienen prioridad y el servicio funciona tanto desde el monorepo como de forma aislada.

### 3.3. `.gitignore` (verificado)

Ningún `.env` se versiona — verificado con `git check-ignore`:

- `.env` en la raíz (línea 18 de `.gitignore` raíz).
- `.env` en `services/api/.gitignore` (línea 6).

---

## 4. Conexión Dual: TinyDB + Supabase (`database.py`)

`services/api/database.py` orquesta ambas persistencias:

| Componente | Backend | Uso |
|---|---|---|
| `tinydb_client` | TinyDB (`auth_db.json`) | Usuarios y tokens de autenticación |
| `engine` | Supabase PostgreSQL (SQLModel) | Inventario (products, warehouses, órdenes de entrada/salida) |
| `suppliers_db` / `incidents_db` | TinyDB | Legado (preservado sin cambios) |

**Puntos clave:**

- **Validación temprana:** lanza `RuntimeError` si `DATABASE_URL` no está definida en ningún nivel.
- **Normalización:** convierte `postgres://` → `postgresql://` si se usa la URL de conexión directa de Supabase (SQLAlchemy 2.x no acepta el esquema antiguo con psycopg2).
- **Engine:** `create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)` (`pool_pre_ping` evita conexiones muertas del pooler).
- **Sesión por petición:** `get_db()` (tipo `Generator[sqlmodel.Session, None, None]`) con `with Session(engine) as session: yield session`, inyectada por FastAPI mediante `Depends(get_db)`.
  - ⚠️ **Corrección clave:** `get_db()` debe devolver `sqlmodel.Session` (no `sqlalchemy.orm.Session`), porque la capa de negocio usa `db.exec(...)`, método exclusivo de `Session` de SQLModel sobre `select()`.
- **`init_db()`:** llama a `SQLModel.metadata.create_all(engine)` en el arranque (lifespan). **Debe ejecutarse tras `import models`** para que el metadata registre las tablas (si no, faltan relaciones). Documenta que **Alembic es el siguiente paso** para migraciones versionadas.

---

## 5. Modelos ORM (`models.py`)

Capa de persistencia **exclusiva** (`table=True`), sin lógica de negocio ni DTOs mezclados:

Entidades nombradas según el dominio del hito (**Producto**, **Orden de Entrada**, **Orden de Salida**):

| Modelo ORM | Tabla | Campos principales | Restricciones |
|---|---|---|---|
| **`Product`** | `products` | `name`, `sku`, `description`, `category`, `unit`, `is_active`, timestamps | `sku` **UNIQUE + índice**; `category` ∈ Moda/Electrónica/Cosmética/Alimentación/Otro |
| **`Warehouse`** | `warehouses` | `code`, `name`, `city`, `country`, `is_active` | `code` **UNIQUE + índice** (ej. `US-LA`, `ES-ZAZ`) |
| **`InboundOrder`** (Orden de Entrada) | `inbound_orders` | `item_id` → products, `warehouse_id` → warehouses, `quantity`, `user_uuid`, `notes` | `warehouse_id` **NOT NULL + índice + FK**; `quantity > 0` + `CheckConstraint "ck_inbound_orders_quantity_positive"` |
| **`OutboundOrder`** (Orden de Salida) | `outbound_orders` | `item_id` → products, `warehouse_id` → warehouses, `quantity`, `user_uuid`, `destination`, `reason` | Igual + `CheckConstraint "ck_outbound_orders_quantity_positive"` |

> **Sin columna `current_stock`:** ninguna tabla almacena stock; es siempre `SUM(inbound_orders) − SUM(outbound_orders)` calculado en tiempo de lectura. `user_uuid` lleva **índice** para auditoría y búsquedas por usuario.

**Decisiones importantes:**

- **FK → warehouses en ambas tablas de movimientos:** el stock es **por almacén** (partición del dominio TrackFlow).
- **`warehouse_id NOT NULL` en la BD:** obliga explícitamente a indicar el almacén en cada movimiento.
- **`CheckConstraint` explícita:** en SQLModel, `Field(gt=0)` **NO** se valida en `__init__` de modelos con `table=True`; la protección a nivel de BD requiere el `CheckConstraint` (verificado: `IntegrityError` al intentar cantidad negativa).
- **Auditoría `user_uuid` (string):** formato `"tinydb:<id>"` — preparado para futura migración de auth a Supabase (`supabase:<uuid>`) sin tocar la BD.
- **Compatibilidad legada:** `models.py` re-exporta los esquemas de `schemas/stock.py`.

---

## 6. Esquema Sincronizado en Supabase

Estado verificado de las tablas en Supabase tras la sincronización:

```sql
-- Relaciones e índices confirmados en inbound_orders / outbound_orders
warehouse_id integer NOT NULL REFERENCES warehouses(id)
CREATE INDEX ix_inbound_orders_warehouse_id ON inbound_orders (warehouse_id)
CREATE INDEX ix_outbound_orders_warehouse_id ON outbound_orders (warehouse_id)
```

- **Migración de renombrado aplicada (2026-10-12)** sobre las tablas del prototipo, **preservando datos, FKs e índices**:
  - `items` → `products`, `stock_entries` → `inbound_orders`, `stock_exits` → `outbound_orders` (`ALTER TABLE ... RENAME TO ...` guardados con `to_regclass`).
  - Constraints: `ck_stock_entries_quantity_positive` → `ck_inbound_orders_quantity_positive`; `ck_stock_exits_quantity_positive` → `ck_outbound_orders_quantity_positive`.
  - Verificado: `products=3`, `warehouses=2`, `inbound_orders=4`, `outbound_orders=2` (datos seed intactos).
- **`warehouses`** se creó íntegra vía `create_all` (tabla nueva).
- **CHECK constraints** generados desde el metadata de SQLModel.

---

## 7. Capa DTO (`schemas/stock.py`)

Directorio `schemas/` como paquete (no un archivo `schemas.py` plano, para no pisar la estructura existente). Tipos Pydantic **solo DTO**:

| DTO | Uso | Detalles |
|---|---|---|
| `ItemCreate` | POST `/products` | `name`, `sku`, `description`, `category`, `unit`, `is_active` |
| `ItemUpdate` | PATCH `/products/{id}` | Todos opcionales — **sin campos de stock** (inmutabilidad) |
| `ItemResponse` | GET de productos | Incluye **`current_stock: float = 0.0`** (calculado, no persistido); `ConfigDict(from_attributes=True)` |
| `ItemEntryCreate` | POST `/orders/inbound` | `item_id`, `warehouse_id`, `quantity (gt=0)`, `notes` — **sin `user_uuid`** (lo estampa el servidor) |
| `ItemEntryResponse` | POST `/orders/inbound` respuesta | Incluye `user_uuid` auditado |
| `ItemExitCreate` | POST `/orders/outbound` | `item_id`, `warehouse_id`, `quantity (gt=0)`, `reason`, `destination` — **sin `user_uuid`** |
| `ItemExitResponse` | POST `/orders/outbound` respuesta | Incluye `user_uuid` auditado |
| `WarehouseResponse` | GET `/warehouses` | `code`, `name`, `city`, `country`, `is_active` |
| `StockViewResponse` | GET `/stock/{id}` | `item_id`, `warehouse_id` (`int \| None`), `current_stock` |
| `OrderResponse` | GET `/orders` (item del listado) | `id`, `type: Literal["inbound","outbound"]`, `item_id`, `warehouse_id`, `quantity`, `user_uuid`, `notes`/`reason`/`destination` (según tipo), `created_at` |
| `OrderListResponse` | GET `/orders` | `orders: list[OrderResponse]` + `total: int` — **unifica** ambas tablas de órdenes |

Exportados vía `schemas/__init__.py` (`from .stock import *`). **Los endpoints devuelven exclusivamente DTOs, nunca objetos ORM.**

---

## 8. Capa de Servicios (`services/inventory.py`)

Toda la lógica de negocio centralizada (el router solo orquesta):

| Función | Regla de negocio |
|---|---|
| `get_current_stock(db, item_id, warehouse_id=None)` | **Stock neto dinámico = SUM(entradas) − SUM(salidas)**; con `warehouse_id` acota al almacén (partición); con `None`, stock total global. Usa `select(func.coalesce(func.sum(...), 0.0))` (cero explícito sin movimientos). |
| `create_inbound_order` / `create_outbound_order` | Valida existencia de item y almacén (404). **Salida: bloquea la fila del producto (`SELECT ... FOR UPDATE`) y calcula el stock disponible ANTES de escribir**, lanzando `HTTPException 400` si `quantity > available` (protección contra stock negativo y contra carreras concurrentes). Estampa `user_uuid` recibido del router. |
| `create_item` / `list_items` / `update_item` | CRUD; `list_items` admite filtro opcional por `warehouse_id`. |
| `item_to_response` | Construye `ItemResponse` calculando `current_stock` bajo demanda (global o por almacén). |
| `list_warehouses` / `get_stock_view` | Listado de almacenes; vista de stock item↔almacén. |

**Semántica de inmutabilidad:** el stock **no es un campo editable**; es siempre el resultado agregado del libro de movimientos. `ItemUpdate` no contiene campos de stock y ningún endpoint los acepta.

---

## 9. Router de Inventario (`routes/inventory.py`)

`inventory_router = APIRouter(prefix="/inventory", tags=["Inventory"])`, registrado con `prefix=settings.api_prefix` (`/api/v1`). Todas las rutas bajo `/api/v1/inventory/...`:

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/warehouses` | — | Lista almacenes (`US-LA`, `ES-ZAZ`) |
| POST | `/products` | **Bearer** | Crea producto (201) |
| GET | `/products` | — | Lista productos; query opcional `warehouse_id` (stock particionado) |
| GET | `/products/{item_id}` | — | Detalle de producto con `current_stock` |
| PATCH | `/products/{item_id}` | — | Actualiza producto (sin campos de stock) |
| GET | `/stock/{item_id}` | — | Stock neto; query opcional `warehouse_id` |
| GET | `/orders` | — | **Listado unificado** de órdenes (inbound + outbound) por fecha desc.; filtros opcionales `item_id`, `warehouse_id`; devuelve `OrderListResponse` (`orders` + `total`) |
| POST | `/orders/inbound` | **Bearer** | Orden de entrada (201) — `user_uuid` del token |
| POST | `/orders/outbound` | **Bearer** | Orden de salida (201) — valida stock (400 si excede) |

> **Ningún endpoint manipula ORM directamente:** el router solo valida (`Depends`), delega en `services/inventory.py` y serializa con DTOs Pydantic (`response_model`).

**Integración con el auth existente:** `_user_uuid_from_tinydb(user)` deriva `user_uuid = f"tinydb:{user['id']}"` desde el usuario resuelto por `_resolve_user` (token `tf_...` → tabla `tokens` de TinyDB). Sin token → **401**; sin `id` → 401. El cliente **nunca** envía `user_uuid` (se ignora si lo envía).

---

## 10. Integración en `main.py`

- **`lifespan`:** arranca con `init_db()` (y `import models` previo para poblar el metadata) — crea `warehouses` si no existe y aplica constraints.
- **Router:** `app.include_router(inventory_router, prefix=settings.api_prefix)`.
- **Endpoints antiguos de stock eliminados del `main.py` inline**, sustituidos por un comentario `NOTA` que remite a `routes/inventory.py` (única fuente de verdad de inventario).
- **Preservado sin cambios:** health endpoints (incluido `/health/db` con `SELECT 1`), exception handler global y middleware de tiempos.
- **`services/__init__.py`:** docstring actualizado para incluir el módulo de inventario.

---

## 11. Datos Semilla (`seed_inventory.py`)

`seed_data()` **idempotente** (detecta el marcador `[seed]` en `notes`/`reason`); ejecutada y verificada contra Supabase.

**Almacenes:**

| Código | Ciudad | País |
|---|---|---|
| `US-LA` | Los Ángeles | Estados Unidos |
| `ES-ZAZ` | Zaragoza | España |

**Productos (categorías de `CONTEXT.es.md`):**

| SKU | Nombre | Categoría |
|---|---|---|
| `SKU-CAM-001` | Camiseta básica algodón | Moda |
| `SKU-AUR-001` | Auriculares inalámbricos | Electrónica |
| `SKU-CRE-001` | Crema hidratante facial | Cosmética |

**Movimientos y stock neto verificado (SUM(entradas) − SUM(salidas)):**

| Item | Entradas | Salidas | **Neto global** | Verificado |
|---|---|---|---|---|
| Camiseta básica (SKU-CAM-001) | 100 (LA) + 60 (ZAZ) | 25 (LA) | **135** (LA: 75, ZAZ: 60) | ✅ |
| Auriculares (SKU-AUR-001) | 80 (LA) | 30 (LA) | **50** | ✅ |
| Crema hidratante (SKU-CRE-001) | 120 (ZAZ) | — | **120** | ✅ |

> ⚠️ **Bug corregido durante la ejecución:** el seed accedía a `la.id`/`zaz.id` *fuera* de la sesión (tras `commit`), provocando `DetachedInstanceError`. Solución: capturar `la_id`/`zaz_id` dentro de la sesión activa antes del cierre.

---

## 12. Validación End-to-End (Resultados)

Ejecutada con `TestClient` de FastAPI contra el router `/inventory` real, **todos los criterios superados** (✅):

| # | Criterio | Resultado |
|---|---|---|
| 1 | `GET /inventory/warehouses` devuelve `US-LA` (Los Ángeles) y `ES-ZAZ` (Zaragoza) | ✅ |
| 2 | Neto del seed (global): CAM=135, AUR=50, CRE=120 | ✅ |
| 3 | Partición por almacén: CAM en LA = 75 | ✅ |
| 4 | Auth: registro → token real desde TinyDB | ✅ |
| 5 | Entrada con token → `user_uuid="tinydb:<id>"` auditado en BD | ✅ |
| 6 | Entrada sin token → **401** | ✅ |
| 7 | Salida que excede el stock → **400** *"Stock insuficiente en el almacén 1: se solicitaron 99999 unidades pero hay 75 disponibles."* | ✅ |
| 8 | Salida válida reduce el stock correctamente (75 + 5 − 10 = **70**) | ✅ |
| 9 | `quantity=0` → **422** (validación DTO) | ✅ |
| 10 | Inmutabilidad: `PATCH /products` sin campos de stock | ✅ |
| 11 | Limpieza de datos de prueba (borrado por `user_uuid`) | ✅ |

**Corrección detectada en la validación:** el tipo de retorno de `get_db()` (§4) — `sqlalchemy.orm.Session` no tiene `.exec()`; migrado a `sqlmodel.Session` en `database.py`, `services/inventory.py` y `routes/inventory.py`.

### 12.1. Tests automáticos (`uv run pytest`) — SUITE EN VERDE

```text
263 passed, 47 warnings in 41.20s
```

- **16 tests nuevos** del módulo de inventario (`services/api/tests/test_inventory.py`) + **247 tests existentes** de la suite (auth, incidents, leads, suppliers) intactos.
- **Hermeticidad total:** `tests/conftest.py` fija `DATABASE_URL` a un **SQLite temporal** antes de importar `main`/`database` (`load_dotenv(override=False)` respeta la variable de proceso) — la suite **nunca toca Supabase**. Cada test recrea el esquema (`drop_all`/`create_all`) y limpia `dependency_overrides`.
- **Auth sin depender de TinyDB:** fixture `auth_client` inyecta `main.app.dependency_overrides[_resolve_user] = lambda: FAKE_USER` → `user_uuid = "tinydb:42"` verificado server-side (payload con `user_uuid` hackeado se ignora).
- Cobertura de reglas: 401 sin token (productos y órdenes), stock inicial 0, netos 135/75/50/120 con partición por `warehouse_id`, `400` «Stock insuficiente» sin tocar la BD, `422` con `quantity=0`, inmutabilidad del `PATCH`, `GET /orders` unificado con filtros, shapes exactos de DTOs (sin objetos ORM), y `seed_data()` idempotente (doble ejecución).

### 12.2. Despliegue en vivo (puerto 8001) contra Supabase

`uv run uvicorn main:app --host 127.0.0.1 --port 8001` + verificación con `curl`:

| Prueba | Resultado |
|---|---|
| `GET /products` → netos globales | `CAM=135, AUR=50, CRE=120` ✅ |
| `GET /products?warehouse_id=1` (partición LA) | `CAM=75, AUR=50, CRE=0` ✅ |
| `GET /orders` | `total: 6` (4 inbound + 2 outbound, `user_uuid: "seed"`) ✅ |
| `POST /products` sin token | **401** ✅ |
| `POST /orders/outbound` excede (99999 > 75) con token | **400** *"Stock insuficiente en el almacén 1: se solicitaron 99999 unidades pero hay 75 disponibles."* ✅ |
| Salida válida → `user_uuid: "tinydb:2"` | auditado desde el token (no del cliente) ✅ |
| Rutas antiguas `/items`, `/entries`, `/exits` | **404** ✅ |
| `GET /products/999999` | **404** ✅ |

---

## 13. Seguridad y Auditoría

- **`.env` fuera de Git:** verificado en raíz y `services/api` (§3.3). La contraseña de Supabase está únicamente en el `.env` local.
- **Credenciales URL-encoded:** `+` y `*` del password escapados en `DATABASE_URL`.
- **Auth obligatoria en escritura:** `POST /products`, `POST /orders/inbound` y `POST /orders/outbound` exigen `Authorization: Bearer tf_...` (401 sin token). `user_uuid` se genera **en el servidor** a partir del token — manipulación imposible por parte del cliente.
- **CORS explícito:** `CORS_ORIGINS=["*"]` (JSON array) en `services/api/.env`, parseado por `pydantic-settings` contra `cors_origins: list[str]` (§3.1).
- **Auditoría trazable:** cada movimiento queda vinculado a `user_uuid = "tinydb:<id>"`, listo para migración futura a UUIDs de Supabase Auth sin cambios de esquema.
- **CHECK constraints a nivel de BD:** `quantity > 0` garantizado incluso si se evadiera la validación del DTO.

---

## 14. Archivos Creados y Modificados

**Creados:**

| Archivo | Propósito |
|---|---|
| `services/api/schemas/__init__.py` | Paquete DTO (exporta `stock`) |
| `services/api/schemas/stock.py` | DTOs del inventario (§7) |
| `services/api/services/__init__.py` | Paquete de servicios |
| `services/api/services/inventory.py` | Reglas de negocio (§8) |
| `services/api/routes/__init__.py` | Paquete de routers |
| `services/api/routes/inventory.py` | Router `/inventory` (§9) |
| `services/api/seed_inventory.py` | `seed_data()` idempotente (§11) |
| `services/api/tests/test_inventory.py` | **16 tests E2E** del inventario (herméticos en SQLite, §12.1) |
| `services/api/test_db.py` | Smoke de conexión a Supabase (`SELECT version()`) |

**Modificados:**

| Archivo | Cambio |
|---|---|
| `services/api/database.py` | Carga jerárquica `.env`, validación `Runtime_URL`, `engine` Supabase, `get_db()` con `sqlmodel.Session`, `init_db()` |
| `services/api/models.py` | Modelos **`Product`**, `Warehouse`, **`InboundOrder`**, **`OutboundOrder`** (tablas `products`/`inbound_orders`/`outbound_orders`) + constraints + re-export DTOs |
| `services/api/tests/conftest.py` | **Aislamiento de BD SQL:** `DATABASE_URL` → SQLite temporal antes de importar `main`/`database` (protege toda la suite) |
| `services/api/pyproject.toml` | `[tool.pytest.ini_options]` (`testpaths`, `pythonpath`, `filterwarnings`) |
| **Supabase (BD)** | Migración `ALTER ... RENAME` de tablas y constraints al nuevo dominio (§6) — datos preservados |
| `services/api/main.py` | `lifespan` con `init_db()`, `include_router(inventory_router)`, endpoints inline de stock removidos |
| `services/api/services/__init__.py` (raíz) | Docstring con módulo de inventario |
| `.gitignore` (verificado) | Exclusión de `.env` en raíz y `services/api` |

---

## 15. Notas Pendientes y Mejoras Futuras

> **Actualización (auditoría Tech Lead, 2026-10-12):** rutas renombradas a la nomenclatura del dominio (`/products`, `/orders/inbound`, `/orders/outbound`), funciones `create_inbound_order`/`create_outbound_order` con `SELECT ... FOR UPDATE` anti-carreras sobre la fila del producto, y docstrings corregidos. Re-validado E2E completo (11 criterios ✅).
>
> **Actualización (implementación completa, 2026-10-12):** ✅ entidades ORM renombradas a `Product`/`InboundOrder`/`OutboundOrder` **y migración aplicada en Supabase** (`ALTER ... RENAME` con datos preservados, §6); ✅ `GET /orders` unificado con DTOs `OrderResponse`/`OrderListResponse`; ✅ auth obligatoria en `POST /products`; ✅ `CORS_ORIGINS=["*"]`; ✅ **suite pytest en verde (`263 passed`)** con 16 tests nuevos herméticos en SQLite (§12.1); ✅ despliegue en vivo puerto 8001 verificado con `curl` (§12.2).

1. **Alembic:** instalar y generar la migración inicial (los modelos la documentan; hoy se usa `create_all` + `ALTER`s manuales). Centraliza el versionado del esquema.
2. **`echo=True` en el engine:** adecuado para desarrollo; desactivar en producción (ruido y rendimiento).
3. **Unificar `requirements.txt` vs `pyproject.toml`:** resolver el pin de `pydantic` (2.10.0 fijado vs 2.14.1 resuelto por `uv`).
4. **Migración de auth:** pasar de TinyDB a Supabase Auth cambiaría `user_uuid` de `"tinydb:<id>"` a `"supabase:<uuid>"`; el esquema ya lo soporta sin migración de datos (string genérico).
5. ~~**Tests automáticos:** trasladar la validación E2E (§12) a un test de pytest persistente en el pipeline.~~ **RESUELTO:** `uv run pytest` con 16 tests de inventario herméticos (SQLite temporal) — 263 passed (§12.1).

---

## 16. Cómo Ejecutar

```bash
export PATH="$HOME/.local/bin:$PATH"   # uv
cd services/api

# 1. Sembrar datos (idempotente)
uv run python seed_inventory.py

# 2. Ejecutar la suite de tests (hermética: SQLite temporal, NO toca Supabase)
uv run pytest            # esperado: 263 passed

# 3. Arrancar API (crea esquema y conecta ambas BDs) — puerto 8001 (BACKEND_PORT)
uv run uvicorn main:app --port 8001

# 4. Probar
curl http://localhost:8001/api/v1/inventory/warehouses

curl http://localhost:8001/api/v1/inventory/products        # current_stock calculado
curl "http://localhost:8001/api/v1/inventory/stock/1?warehouse_id=1"
curl http://localhost:8001/api/v1/inventory/orders         # listado unificado (6 órdenes del seed)

# Movimientos (requieren Bearer token de /api/v1/auth/login):
TOKEN="tf_..."
curl -X POST http://localhost:8001/api/v1/inventory/orders/inbound \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"item_id": 1, "warehouse_id": 1, "quantity": 10, "notes": "recepción"}'
curl -X POST http://localhost:8001/api/v1/inventory/orders/outbound \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"item_id": 1, "warehouse_id": 1, "quantity": 5, "reason": "envío a cliente"}'
```
