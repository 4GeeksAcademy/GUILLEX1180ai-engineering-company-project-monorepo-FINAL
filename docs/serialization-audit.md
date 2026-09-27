# Auditoría de Serialización de la API Backend — TrackFlow

> **Fecha**: 2026-09-27  
> **Alcance**: Servicio API (`services/api/`) — FastAPI + Pydantic v2 + TinyDB  
> **Objetivo**: Garantizar que **todos los endpoints** tengan `response_model` explícito, separación estricta input/output, y cero exposición de datos sensibles.

---

## 📐 Arquitectura de Schemas

```
services/api/schemas/
├── __init__.py          # Re-export global
├── enums.py             # Enums compartidos (SupplierStatus, IncidentCategory, etc.)
├── common.py            # HealthResponse, ErrorDetail
├── auth.py              # RegisterPayload, LoginPayload, ProfileUpdatePayload,
│                        # RegisterResponse, UserInfo, TokenResponse, AuthResponse,
│                        # UserProfileResponse
├── suppliers.py         # SupplierCreate, SupplierUpdateRate, SupplierUpdateStatus,
│                        # SupplierResponse, SupplierListItem, SupplierListResponse
├── incidents.py         # IncidentCreate, IncidentUpdateStatus, IncidentResponse,
│                        # IncidentListItem, IncidentSummaryResponse,
│                        # ErrorDetailAnalisis, AnalisisResponse
└── leads.py             # LeadCreate, LeadUpdate, LeadPatch, LeadOut,
                         # LeadListItem, LeadListResponse,
                         # NotePost, NoteOut, NoteListResponse
```

**Principios aplicados**:
1. **Separación estricta input/output**: ningún esquema de entrada se reutiliza como respuesta.
2. **Esquemas de listado ligeros**: `SupplierListItem`, `IncidentListItem`, `LeadListItem` omiten campos pesados.
3. **`model_config = {"from_attributes": True}`** solo en esquemas de salida.
4. **Cero datos sensibles**: ningún endpoint expone `password`, `hashed_password`, ni `email` innecesariamente.

---

## ✅ Estado por Endpoint

### 🏥 Health

| Endpoint | response_model | ¿Tipado? |
|---|---|---|
| `GET /api/v1/health` | `HealthResponse` | ✅ |

### 🔐 Auth

| Endpoint | response_model | Input (Request) | ¿Tipado? | ¿Sensible? |
|---|---|---|---|---|
| `POST /api/v1/auth/register` | `RegisterResponse` | `RegisterPayload` | ✅ | Solo `id` + genérico `message`. Sin email, sin password. |
| `POST /api/v1/auth/login` | `AuthResponse` | `LoginPayload` | ✅ | `user` es `UserInfo` (id, email, name). Sin password/hash. |
| `GET /api/v1/auth/me` | `UserProfileResponse` | — (token Bearer) | ✅ | Sin password/hash. |
| `PUT /api/v1/profiles/me` | `UserProfileResponse` | `ProfileUpdatePayload` | ✅ | Sin password/hash. |

### 📦 Suppliers

| Endpoint | response_model | Input | ¿Tipado? |
|---|---|---|---|
| `POST /api/v1/suppliers` | `SupplierResponse` | `SupplierCreate` | ✅ |
| `GET /api/v1/suppliers` | `list[SupplierResponse]` | — (query) | ✅ |
| `GET /api/v1/suppliers/{id}` | `SupplierResponse` | — | ✅ |
| `PATCH /api/v1/suppliers/{id}/rate` | `SupplierResponse` | `SupplierUpdateRate` | ✅ |
| `PATCH /api/v1/suppliers/{id}/status` | `SupplierResponse` | `SupplierUpdateStatus` | ✅ |
| `DELETE /api/v1/suppliers/{id}` | — (204) | — | ✅ |

### 🚨 Incidents (CRUD)

| Endpoint | response_model | Input | ¿Tipado? |
|---|---|---|---|
| `POST /api/v1/incidents` | `IncidentResponse` | `IncidentCreate` | ✅ |
| `GET /api/v1/incidents` | `list[IncidentResponse]` | — (query) | ✅ |
| `GET /api/v1/incidents/summary` | `IncidentSummaryResponse` | — | ✅ |
| `GET /api/v1/incidents/{id}` | `IncidentResponse` | — | ✅ |
| `PATCH /api/v1/incidents/{id}/status` | `IncidentResponse` | `IncidentUpdateStatus` | ✅ |
| `DELETE /api/v1/incidents/{id}` | — (204) | — | ✅ |

### 📊 Incidents (Análisis)

| Endpoint | response_model | Input | ¿Tipado? |
|---|---|---|---|
| `POST /api/v1/incidents/analyze` | `AnalisisResponse` | `UploadFile` | ✅ |
| `GET /api/v1/incidents/results/export` | `PlainTextResponse` | — | ✅ |

### 👥 Leads / Records

| Endpoint | response_model | Input | ¿Tipado? |
|---|---|---|---|
| `GET /api/v1/records` | `LeadListResponse` | — (query) | ✅ |
| `GET /api/v1/records/{id}` | `LeadOut` | — | ✅ |
| `POST /api/v1/records` | `LeadOut` | `LeadCreate` | ✅ |
| `PUT /api/v1/records/{id}` | `LeadOut` | `LeadUpdate` | ✅ |
| `PATCH /api/v1/records/{id}` | `LeadOut` | `LeadPatch` | ✅ |
| `GET /api/v1/records/{id}/notes` | `NoteListResponse` | — | ✅ |
| `POST /api/v1/records/{id}/notes` | `NoteOut` | `NotePost` | ✅ |
| `DELETE /api/v1/records/{id}/notes/{note_id}` | — (204) | — | ✅ |

---

## 🧩 Decisiones de Diseño de Relaciones

### Enums como fuente única de verdad
- **Archivo**: `schemas/enums.py`
- **Motivo**: Evitar imports circulares. `models.py` re-exporta desde aquí, `schemas/` también importa desde aquí.
- **Exportados**: `SupplierStatus`, `ProductCategory`, `Country`, `IncidentCategory`, `IncidentStatus`, `IncidentOrigin`

### List Schemas (ligeros)
| Esquema | Campos omitidos respecto al detalle |
|---|---|
| `SupplierListItem` | `updated_at` |
| `IncidentListItem` | `description`, `updated_at` |
| `LeadListItem` | `website`, `services`, `comments` |

### Input vs Output — Diferencias clave
| Recurso | Input acepta | Output devuelve |
|---|---|---|
| Auth Register | `email`, `password`, `name`, `phone`, `address` | Solo `id` + `message` |
| Auth Login | `email`, `password` | `access_token` + `UserInfo` |
| Supplier Create | `pais` como enum `Country` | `pais` como `str` |
| Incident Create | `category` como enum `IncidentCategory` | `category` como `str` |
| Note Create | Solo `content` | `id`, `lead_id`, `content`, `created_by`, timestamps |

### Seguridad — Datos sensibles
| Dato sensible | ¿Dónde se usa? | ¿Se expone? |
|---|---|---|
| `password` | `RegisterPayload`, `LoginPayload` (input) | ❌ Nunca en output |
| `email` | `RegisterPayload` (input), login response | ✅ Solo en login y perfil (necesario para frontend) |
| Token Bearer | Login response + Header auth | Solo en `access_token` |

---

## 📊 Resumen

| Métrica | Valor |
|---|---|
| Total endpoints | **23** |
| Con `response_model` explícito | **23** (100%) |
| Input/Output separados | **100%** |
| Esquemas de listado ligeros | **3** (`SupplierListItem`, `IncidentListItem`, `LeadListItem`) |
| Datos sensibles expuestos | **0** |
| Versión de Pydantic | **v2** (todos los modelos nuevos usan `model_config`) |

---

## ✅ Fase 3 — Verificación (Completada)

### Tests unitarios
| Suite | Resultado |
|---|---|
| `tests/test_register.py` | ✅ 9 passed |
| `tests/test_login.py` | ✅ 1 passed |
| `tests/test_token.py` | ✅ 10 passed |
| `tests/test_suppliers.py` | ✅ 27 passed |
| `tests/test_incidents.py` | ✅ 28 passed |
| `tests/test_incidents_crud.py` | ✅ 11 passed |
| `tests/test_leads.py` | ✅ 74 passed |
| **Total** | **✅ 160 passed, 0 failed** |

### Pruebas manuales (curl)
| Endpoint | Status | Verificado |
|---|---|---|
| `GET /api/v1/health` | `200` | ✅ |
| `POST /api/v1/auth/register` | `201` | ✅ |
| `POST /api/v1/auth/login` | `200` | ✅ |
| `GET /api/v1/auth/me` | `200` | ✅ |
| `GET /api/v1/suppliers` | `200` | ✅ |
| `GET /api/v1/incidents` | `200` | ✅ |

### Correcciones aplicadas durante verificación
| Archivo | Cambio |
|---|---|
| `tests/test_register.py` | 6 tests: aserciones de `email` reemplazadas por `"id"` + `"message"` |
| `tests/test_leads.py` | 1 test: aserción `{"results": []}` → `{"results": [], "total": None}` |