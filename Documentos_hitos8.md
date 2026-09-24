# HITO 8 — Estrategia de Pruebas (AUTH-088: Building Bullet-Proof Applications)

> **Requerimiento:** Building Bullet-Proof Applications  
> **Proyecto:** TrackFlow — Monorepo de Gestión Logística  
> **Última actualización:** 2026-09-24

---

## 📦 Stack de Testing

| Capa | Herramienta | Configuración |
|------|-------------|---------------|
| **Backend (FastAPI)** | `pytest` + `pytest-cov` + `httpx` | `services/api/pyproject.toml` |
| **TypeScript / Utilidades** | `Jest` + `@swc/jest` | `packages/*/jest.config.js` + `.swcrc` |

---

## 🚀 Cómo Ejecutar las Pruebas

### Backend — API (recomendado)

```bash
cd services/api

# Todos los tests con cobertura
uv run pytest --cov=./ --cov-report=term-missing -v

# Solo un fichero de tests específico
uv run pytest tests/test_suppliers.py -v --tb=short

# Con reporte HTML (abrir htmlcov/index.html)
uv run pytest --cov=./ --cov-report=html
```

### Backend — Sin `uv` (fallback con .venv)

```bash
cd services/api
.venv/bin/python -m pytest tests/ --cov=./ --cov-report=term-missing -v
```

### TypeScript — Utilidades compartidas

```bash
# Tracker-core (131 tests)
cd packages/tracker-core && npm test

# Shared types (4 tests)
cd packages/shared && npm test

# Con cobertura
cd packages/tracker-core && npx jest --coverage
```

---

## 📁 Estructura de Tests

```
services/
  api/
    tests/
      __init__.py                  # Inicializador del paquete de tests
      conftest.py                  # Fixtures compartidos (cliente HTTP, DB aislada)
      test_register.py             # 12 tests — Registro de usuarios
      test_login.py                #  9 tests — Inicio de sesión
      test_token.py                # 11 tests — Validación de token + perfil
      test_suppliers.py            # 31 tests — CRUD de proveedores
      test_incidents.py            # 16 tests — Análisis CSV de incidencias
      test_incidents_crud.py       # 42 tests — CRUD de incidencias + ciclo de vida
      test_leads.py                # 39 tests — CRUD de leads + notas

packages/
  tracker-core/
    src/
      utils/
        __tests__/
          collections.test.ts      # 39 tests — Filtrado, ordenación, paginación
          transformations.test.ts  # 38 tests — Agregación, groupBy, reportes
          search.test.ts           # 12 tests — Búsqueda binaria y lineal
          validations.test.ts      # 42 tests — Validación de formularios y pipeline
  shared/
    types/
      __tests__/
        index.test.ts              #  4 tests — Tipos compartidos
```

### Convenciones

- **Backend:** Un archivo `test_<modulo>.py` por cada módulo de rutas. Cada test class se organiza por endpoint.
- **TypeScript:** Tests en `__tests__/` con naming descriptivo (`colección.test.ts`).
- **Fixtures:** Toda la lógica de configuración compartida vive en `conftest.py`.
- **Aislamiento:** Cada test trunca (`truncate()`) todas las tablas TinyDB para evitar contaminación entre tests.
- **Nomenclatura:** `test_<escenario>` — el nombre describe qué condición se verifica.

---

## 📋 Matriz de Casos de Prueba

Cada caso incluye una columna de **justificación** que explica por qué se incluye, conectando la cobertura con reglas de negocio, riesgos de seguridad, o robustez del sistema.

---

### 1. `POST /api/v1/auth/register` — Registro de usuarios

| Tipo | Caso | Descripción | Justificación |
|------|------|-------------|---------------|
| ✅ **Camino feliz** | `test_register_success` | Registro exitoso con todos los campos (email, password, name, phone, address) | Verifica que el flujo completo funciona con todos los campos opcionales. |
| ✅ **Camino feliz** | `test_register_minimal_fields` | Registro exitoso solo con campos obligatorios (email y password) | Garantiza que los campos opcionales no son bloqueantes. |
| ⚠️ **Caso límite** | `test_register_minimum_password_length` | Contraseña con la longitud mínima exacta (3 caracteres) | Valida el límite inferior definido en el modelo Pydantic. |
| ⚠️ **Caso límite** | `test_register_minimum_email_length` | Email con la longitud mínima (3 caracteres) | Verifica que emails cortos pero válidos no sean rechazados. |
| ⚠️ **Caso límite** | `test_register_maximum_email_length` | Email con la longitud máxima permitida (120 caracteres) | Previene regresiones en la validación de max_length. |
| ⚠️ **Caso límite** | `test_register_email_case_insensitivity` | Email con mayúsculas se normaliza a minúsculas | Evita duplicados por capitalización (seguridad en unicidad). |
| ❌ **Modo de fallo** | `test_register_duplicate_email` | Intento de registro con un email que ya existe (409 Conflict) | Protege la unicidad del identificador de usuario. |
| ❌ **Modo de fallo** | `test_register_duplicate_email_different_case` | Email duplicado con diferente capitalización (409 Conflict) | Misma razón que el anterior, pero con mayúsculas. |
| ❌ **Modo de fallo** | `test_register_missing_email` | Payload sin campo email (422) | Verifica que el campo obligatorio no sea omitible. |
| ❌ **Modo de fallo** | `test_register_missing_password` | Payload sin campo password (422) | Misma razón, contraseña obligatoria. |
| ❌ **Modo de fallo** | `test_register_empty_email` | Email vacío — no cumple min_length (422) | Valida que cadenas vacías sean rechazadas. |
| ❌ **Modo de fallo** | `test_register_short_password` | Contraseña con menos de 3 caracteres (422) | Valida la restricción de seguridad de longitud mínima. |

---

### 2. `POST /api/v1/auth/login` — Inicio de sesión

| Tipo | Caso | Descripción | Justificación |
|------|------|-------------|---------------|
| ✅ **Camino feliz** | `test_login_success` | Credenciales correctas generan token `tf_...` y devuelven datos del usuario | Verifica el flujo principal de autenticación: login → token → respuesta. |
| ⚠️ **Caso límite** | `test_login_email_case_insensitivity` | Email con mayúsculas/minúsculas mixtas en login | Consistencia con la normalización del registro. |
| ⚠️ **Caso límite** | `test_login_email_with_spaces` | Email con espacios alrededor (se aplica `.strip()`) | Previene fallos por whitespace accidental. |
| ⚠️ **Caso límite** | `test_login_same_user_multiple_times` | Múltiples logins generan tokens distintos (no reutilización) | Cada token debe ser único por sesión (seguridad). |
| ❌ **Modo de fallo** | `test_login_wrong_password` | Contraseña incorrecta (401 Unauthorized) | Protege contra acceso no autorizado. |
| ❌ **Modo de fallo** | `test_login_unregistered_user` | Usuario no registrado (401) | Evita fuga de información sobre qué usuarios existen. |
| ❌ **Modo de fallo** | `test_login_empty_password` | Contraseña vacía — no cumple min_length=1 (422) | Rechaza payloads malformados. |
| ❌ **Modo de fallo** | `test_login_missing_fields` | Payload incompleto (422) | Validación de esquema Pydantic. |

---

### 3. `GET /api/v1/auth/me` — Validación de Token

| Tipo | Caso | Descripción | Justificación |
|------|------|-------------|---------------|
| ✅ **Camino feliz** | `test_token_valid_access` | Token Bearer vigente permite el acceso exitoso (200 OK) | Flujo principal de autorización. |
| ✅ **Camino feliz** | `test_token_returns_user_profile` | Token válido devuelve el perfil completo del usuario | Verifica integridad de la respuesta. |
| ⚠️ **Caso límite** | `test_token_lowercase_bearer` | `bearer` en minúsculas funciona correctamente | Tolerancia a formato del header (case-insensitive). |
| ❌ **Modo de fallo** | `test_token_missing_header` | Petición sin cabecera Authorization (401) | Autenticación obligatoria. |
| ❌ **Modo de fallo** | `test_token_malformed_no_bearer` | Token sin prefijo Bearer (401) | Formato incorrecto del header. |
| ❌ **Modo de fallo** | `test_token_malformed_empty` | Cabecera Authorization vacía (401) | Header presente pero vacío. |
| ❌ **Modo de fallo** | `test_token_invalid` | Token completamente inválido/aleatorio (401) | Previene falsificación de tokens. |
| ❌ **Modo de fallo** | `test_token_tampered` | Token alterado (un caracter cambiado, 401) | Detecta manipulación de tokens (HMAC/validez). |

---

### 4. `PUT /api/v1/profiles/me` — Actualización de perfil

| Tipo | Caso | Descripción | Justificación |
|------|------|-------------|---------------|
| ✅ **Camino feliz** | `test_update_profile_name` | Actualización exitosa del nombre | Caso de uso básico de edición de perfil. |
| ✅ **Camino feliz** | `test_update_profile_all_fields` | Actualización exitosa de todos los campos editables | Verifica que ningún campo editable esté roto. |
| ❌ **Modo de fallo** | `test_update_profile_no_auth` | Actualización sin autenticación (401) | Recurso protegido, requiere token. |
| ❌ **Modo de fallo** | `test_update_profile_no_fields` | Payload vacío sin campos para actualizar (400) | Validación de negocio: al menos un campo debe enviarse. |

---

### 5. `GET /api/v1/suppliers` + CRUD — Gestión de proveedores

| Tipo | Caso | Descripción | Justificación |
|------|------|-------------|---------------|
| ✅ **Camino feliz** | `test_create_success` | Crear proveedor con todos los campos válidos | Flujo principal de creación. |
| ✅ **Camino feliz** | `test_create_with_default_status` | status por defecto = "activo" | Verifica comportamiento por omisión del modelo. |
| ✅ **Camino feliz** | `test_create_multiple_categories` | Crear con 3 categorías válidas distintas | Array de categorías debe aceptarse con min_length=1. |
| ✅ **Camino feliz** | `test_create_single_category` | Crear con solo 1 categoría | Caso mínimo del array permitido. |
| ✅ **Camino feliz** | `test_create_country_usa` | Crear con país "Estados Unidos" | Todos los países del enum deben funcionar. |
| ✅ **Camino feliz** | `test_create_country_spain` | Crear con país "España" | Todos los países del enum deben funcionar. |
| ✅ **Camino feliz** | `test_create_all_product_categories` | Probar cada categoría de producto del enum | Cada variante de enum debe ser aceptada. |
| ✅ **Camino feliz** | `test_create_success_response_has_id` | Tras crear, la respuesta contiene un id numérico | Validación de que el documento se persiste correctamente. |
| ✅ **Camino feliz** | `test_list_empty` | Sin proveedores → lista vacía (200) | La API nunca debe devolver error si no hay datos. |
| ✅ **Camino feliz** | `test_list_one_supplier` | Listar con un proveedor creado | Listado básico. |
| ✅ **Camino feliz** | `test_list_multiple_suppliers` | Listar con múltiples proveedores | Listado con cardinalidad > 1. |
| ✅ **Camino feliz** | `test_get_by_id_success` | GET de proveedor existente por ID | Validación de que el detalle funciona. |
| ⚠️ **Caso límite** | `test_create_minimal_name_length` | Nombre con la longitud mínima (2 caracteres) | Límite inferior de min_length. |
| ⚠️ **Caso límite** | `test_create_tarifa_minimum` | Tarifa justo por encima de 0 (0.01) | Límite inferior de gt=0. |
| ⚠️ **Caso límite** | `test_create_tarifa_large` | Tarifa con valor muy grande (99,999.99) | Rango superior amplio, sin límite documentado. |
| ⚠️ **Caso límite** | `test_get_by_id_format` | GET devuelve campos en formato correcto (tarifa como float, id como int) | Verifica coerción de tipos por Pydantic. |
| ⚠️ **Caso límite** | `test_update_rate_positive` | Actualizar tarifa a valor positivo | Operación principal de actualización de tarifa. |
| ⚠️ **Caso límite** | `test_update_rate_fraction` | Actualizar tarifa con decimales | Precisión numérica. |
| ⚠️ **Caso límite** | `test_update_status_activates` | Cambiar de suspendido a activo | Transición bidireccional permitida. |
| ⚠️ **Caso límite** | `test_update_status_suspends` | Cambiar de activo a suspendido | Transición bidireccional permitida. |
| ⚠️ **Caso límite** | `test_delete_existing` | Eliminar proveedor existente → 204 | Operación básica de borrado. |
| ⚠️ **Caso límite** | `test_delete_then_list` | Tras eliminar, el proveedor ya no aparece en listados | Verifica persistencia del borrado. |
| ❌ **Modo de fallo** | `test_create_duplicate_categories` | Categorías repetidas en el array → 400 | Validación de negocio: sin duplicados. |
| ❌ **Modo de fallo** | `test_create_invalid_category` | Categoría inválida → 422 | Protege contra valores fuera del enum. |
| ❌ **Modo de fallo** | `test_create_invalid_country` | País inválido → 422 | Protege contra valores fuera del enum. |
| ❌ **Modo de fallo** | `test_create_missing_required_fields` | Payload sin campos obligatorios → 422 | Validación de esquema Pydantic. |
| ❌ **Modo de fallo** | `test_create_negative_tarifa` | Tarifa negativa → 422 | Restricción de dominio (gt=0). |
| ❌ **Modo de fallo** | `test_create_zero_tarifa` | Tarifa cero → 422 | Restricción de dominio (gt=0, no ge=0). |
| ❌ **Modo de fallo** | `test_get_by_id_not_found` | ID inexistente → 404 | Caso de recurso no encontrado. |
| ❌ **Modo de fallo** | `test_update_rate_zero` | Tarifa en 0 → 422 (debe ser > 0) | Refuerza la restricción de dominio. |
| ❌ **Modo de fallo** | `test_delete_not_found` | ID inexistente en DELETE → 404 | Operación sobre recurso inexistente. |

---

### 6. `POST /api/v1/incidents/analyze` + `GET /results/export` — Análisis CSV de incidencias

| Tipo | Caso | Descripción | Justificación |
|------|------|-------------|---------------|
| ✅ **Camino feliz** | `test_success` | Subir CSV con 1 fila válida → 200 con métricas | Flujo principal del análisis. |
| ✅ **Camino feliz** | `test_success_multiple_rows` | CSV con 2 filas cerradas → satisfaccion_media correcta | Verifica el cálculo de promedios. |
| ✅ **Camino feliz** | `test_success_with_open_rows` | Filas abiertas con puntuación no afectan el promedio de cerrados | Aísla el cálculo solo a filas cerradas. |
| ✅ **Camino feliz** | `test_metrics_by_category_and_status` | Verificar conteo por categoría y estado | Métricas desglosadas del análisis. |
| ⚠️ **Caso límite** | `test_all_invalid_rows` | Todas las filas inválidas → 0 válidas, 2 inválidas | Manejo de error total sin datos procesables. |
| ⚠️ **Caso límite** | `test_mixed_valid_invalid` | Mezcla de filas válidas e inválidas | Escenario realista con datos parcialmente limpios. |
| ❌ **Modo de fallo** | `test_missing_columns` | CSV sin columna requerida → 422 | Validación de estructura de columnas. |
| ❌ **Modo de fallo** | `test_empty_file` | Archivo vacío (bytes vacíos) → 400 | Protege contra archivos sin contenido. |
| ❌ **Modo de fallo** | `test_no_rows` | CSV con solo cabeceras → 400 | Sin datos para analizar. |
| ❌ **Modo de fallo** | `test_not_csv_extension` | Archivo sin extensión .csv → 422 | Validación de tipo de archivo. |
| ❌ **Modo de fallo** | `test_invalid_categoria` | Categoría inválida → fila inválida | Validación de dominio de categorías. |
| ❌ **Modo de fallo** | `test_invalid_provider` | Proveedor inválido → fila inválida | Validación de dominio de proveedores. |
| ✅ **Camino feliz** | `test_export_after_analysis` | Exportar CSV tras analizar | Flujo principal de exportación. |
| ✅ **Camino feliz** | `test_export_content` | Verificar estructura del CSV exportado | Formato correcto del archivo generado. |
| ✅ **Camino feliz** | `test_export_with_invalids` | Exportar después de análisis con inválidos | Exportación también funciona con datos parcialmente inválidos. |
| ❌ **Modo de fallo** | `test_export_without_analysis` | Exportar sin análisis previo → 404 | Recurso no disponible sin estado previo. |

---

### 7. CRUD completo de incidencias — Gestor Centralizado

**Endpoints:** `POST /api/v1/incidents`, `GET /incidents`, `GET /incidents/summary`, `GET /incidents/{id}`, `PATCH /incidents/{id}/status`, `DELETE /incidents/{id}`

| Tipo | Caso | Descripción | Justificación |
|------|------|-------------|---------------|
| ✅ **Camino feliz** | `test_create_success` | Crear incidencia → 201 con todos los campos | Flujo principal de creación. |
| ✅ **Camino feliz** | `test_create_sets_default_status_open` | Sin status explícito → "open" por defecto | Comportamiento por omisión del modelo. |
| ✅ **Camino feliz** | `test_create_with_explicit_status` | Crear con status "in_progress" | Todos los estados deben ser aceptados. |
| ✅ **Camino feliz** | `test_list_all` | Listar todas las incidencias | Listado básico. |
| ✅ **Camino feliz** | `test_list_filter_by_status` | Filtrar por status | Filtro funcional por estado. |
| ✅ **Camino feliz** | `test_list_filter_by_origin` | Filtrar por origin | Filtro funcional por origen. |
| ✅ **Camino feliz** | `test_list_filter_by_branch` | Filtrar por branch | Filtro funcional por sede. |
| ✅ **Camino feliz** | `test_list_filter_by_category` | Filtrar por category | Filtro funcional por categoría. |
| ✅ **Camino feliz** | `test_list_filter_combined` | Filtros combinados (AND) | Intersección de múltiples filtros. |
| ✅ **Camino feliz** | `test_summary_with_incidents` | Métricas con incidencias creadas | Conteo agregado refleja datos reales. |
| ✅ **Camino feliz** | `test_detail_exists` | Obtener incidencia existente | Detalle básico. |
| ✅ **Camino feliz** | `test_detail_returns_all_fields` | Respuesta contiene los 9 campos del modelo | Integridad del esquema de respuesta. |
| ✅ **Camino feliz** | `test_open_to_in_progress` | open → in_progress es válido | Primera transición permitida. |
| ✅ **Camino feliz** | `test_open_to_discarded` | open → discarded es válido | Segunda transición permitida desde open. |
| ✅ **Camino feliz** | `test_in_progress_to_resolved` | in_progress → resolved es válido | Transición principal hacia resolución. |
| ✅ **Camino feliz** | `test_in_progress_to_discarded` | in_progress → discarded es válido | Camino alternativo desde in_progress. |
| ✅ **Camino feliz** | `test_delete_success` | Eliminar → 204 | Borrado básico. |
| ⚠️ **Caso límite** | `test_create_unique_ids` | Cada incidencia recibe un UUID único | Idempotencia y unicidad. |
| ⚠️ **Caso límite** | `test_create_branch_trimmed` | Branch se guarda sin espacios extra | Limpieza de entrada. |
| ⚠️ **Caso límite** | `test_create_returns_iso_dates` | Fechas en formato ISO | Consistencia de formato temporal. |
| ⚠️ **Caso límite** | `test_list_empty` | Sin incidencias → lista vacía (200) | Nunca debe devolver error con DB vacía. |
| ⚠️ **Caso límite** | `test_list_no_match` | Filtro sin coincidencias → lista vacía | Filtro válido pero sin datos. |
| ⚠️ **Caso límite** | `test_summary_empty` | Sin incidencias → métricas en cero | Todos los contadores deben aparecer con 0. |
| ⚠️ **Caso límite** | `test_summary_includes_all_statuses` | Los 4 estados aparecen en métricas | No deben omitirse estados sin incidencias. |
| ⚠️ **Caso límite** | `test_summary_includes_all_categories` | Las 5 categorías aparecen en métricas | Completitud del resumen. |
| ⚠️ **Caso límite** | `test_summary_includes_all_origins` | Los 3 orígenes aparecen en métricas | Completitud del resumen. |
| ⚠️ **Caso límite** | `test_delete_removes_from_db` | Tras eliminar, GET devuelve 404 | Verifica persistencia del borrado. |
| ❌ **Modo de fallo** | `test_create_missing_title` | Falta title → 422 | Campo obligatorio. |
| ❌ **Modo de fallo** | `test_create_empty_title` | Title vacío → 422 | Validación de min_length. |
| ❌ **Modo de fallo** | `test_create_invalid_category` | Categoría inválida → 422 | Valor fuera del enum. |
| ❌ **Modo de fallo** | `test_create_invalid_status` | Status inválido → 422 | Valor fuera del enum. |
| ❌ **Modo de fallo** | `test_create_invalid_origin` | Origin inválido → 422 | Valor fuera del enum. |
| ❌ **Modo de fallo** | `test_detail_not_found` | UUID inexistente → 404 | Recurso no encontrado. |
| ❌ **Modo de fallo** | `test_resolved_is_final` | resolved → open → 409 | Estado final bloquea cambios. |
| ❌ **Modo de fallo** | `test_discarded_is_final` | discarded → open → 409 | Estado final bloquea cambios. |
| ❌ **Modo de fallo** | `test_invalid_transition_open_to_resolved` | open → resolved → 409 (salto inválido) | Ciclo de vida debe seguir open → in_progress → resolved. |
| ❌ **Modo de fallo** | `test_invalid_transition_discarded_to_resolved` | discarded → resolved → 409 | Estado final bloquea cambios. |
| ❌ **Modo de fallo** | `test_change_status_not_found` | UUID inexistente → 404 | Operación sobre recurso inexistente. |
| ❌ **Modo de fallo** | `test_change_status_invalid_value` | Status inválido en patch → 422 | Valor fuera del enum. |
| ❌ **Modo de fallo** | `test_delete_not_found` | UUID inexistente → 404 | Operación sobre recurso inexistente. |
| ❌ **Modo de fallo** | `test_list_invalid_status_filter` | Filtro status inválido → 400 | Validación de parámetros de query. |
| ❌ **Modo de fallo** | `test_list_invalid_origin_filter` | Filtro origin inválido → 400 | Validación de parámetros de query. |

---

### 8. CRUD de Leads + Notas — Pipeline de talento

**Endpoints:** `GET/POST /api/v1/records`, `GET/PUT/PATCH /records/{id}`, `GET/POST /records/{id}/notes`, `DELETE /records/{id}/notes/{note_id}`

| Tipo | Caso | Descripción | Justificación |
|------|------|-------------|---------------|
| ✅ **Camino feliz** | `test_create_full` | Crear lead con todos los campos → 201 | Flujo principal de creación. |
| ✅ **Camino feliz** | `test_create_minimal` | Crear lead solo con campos obligatorios | Sin campos opcionales no debe fallar. |
| ✅ **Camino feliz** | `test_create_default_status_stage` | status="new", stage="inbound" por defecto | Comportamiento por omisión del modelo. |
| ✅ **Camino feliz** | `test_create_with_custom_status` | status y stage personalizados | Todos los valores del modelo deben funcionar. |
| ✅ **Camino feliz** | `test_list_all` | Listar todos los leads | Listado básico. |
| ✅ **Camino feliz** | `test_get_exists` | Obtener lead existente | Detalle básico. |
| ✅ **Camino feliz** | `test_get_full_fields` | Respuesta contiene los 15+ campos del modelo | Integridad del esquema de respuesta. |
| ✅ **Camino feliz** | `test_update_fields` | Actualizar múltiples campos de un lead | PUT con varios campos. |
| ✅ **Camino feliz** | `test_update_partial` | Actualizar solo un campo, el resto se conserva | PUT parcial (merge con existente). |
| ✅ **Camino feliz** | `test_patch_status` | Actualizar solo status | PATCH de campo individual. |
| ✅ **Camino feliz** | `test_patch_stage` | Actualizar solo stage | PATCH de campo individual. |
| ✅ **Camino feliz** | `test_patch_both` | Actualizar status y stage simultáneamente | PATCH múltiple. |
| ✅ **Camino feliz** | `test_create_note` | Agregar nota a lead existente | Flujo principal de notas. |
| ✅ **Camino feliz** | `test_list_after_create` | Tras crear nota, aparece en el listado | Verifica persistencia de la nota. |
| ✅ **Camino feliz** | `test_delete_note` | Eliminar nota existente → 204 | Borrado básico de nota. |
| ⚠️ **Caso límite** | `test_create_increments_id` | IDs incrementales (secuenciales) | Validación de autoincrement de TinyDB. |
| ⚠️ **Caso límite** | `test_create_iso_date` | created_at en formato ISO | Consistencia temporal. |
| ⚠️ **Caso límite** | `test_list_empty` | Sin leads → results vacío | DB vacía nunca debe devolver error. |
| ⚠️ **Caso límite** | `test_list_limit` | Parámetro limit funciona (5 leads, limit=3) | Paginación por top-N. |
| ⚠️ **Caso límite** | `test_list_limit_max` | limit=1000 funciona | Límite superior del rango permitido. |
| ⚠️ **Caso límite** | `test_list_returns_latest_ids` | Últimos leads creados aparecen en resultados | Orden FIFO del listado. |
| ⚠️ **Caso límite** | `test_update_sets_updated_at` | updated_at se establece tras PUT | Trazabilidad de modificaciones. |
| ⚠️ **Caso límite** | `test_patch_sets_updated_at` | updated_at se establece tras PATCH | Trazabilidad de modificaciones. |
| ⚠️ **Caso límite** | `test_notes_empty` | Lead sin notas → results vacío | Listado de notas sin datos. |
| ⚠️ **Caso límite** | `test_create_note_increments_id` | IDs de nota incrementales | Validación de autoincrement. |
| ⚠️ **Caso límite** | `test_delete_note_then_list_empty` | Tras eliminar, listado vacío | Verifica persistencia del borrado. |
| ⚠️ **Caso límite** | `test_delete_note_wrong_lead` | Nota de otro lead → 404 | Aislamiento entre leads. |
| ❌ **Modo de fallo** | `test_create_missing_company_name` | Falta company_name → 422 | Campo obligatorio. |
| ❌ **Modo de fallo** | `test_create_empty_company_name` | company_name vacío → 422 | Validación de min_length. |
| ❌ **Modo de fallo** | `test_get_not_found` | ID inexistente → 404 | Recurso no encontrado. |
| ❌ **Modo de fallo** | `test_update_not_found` | PUT sobre ID inexistente → 404 | Operación sobre recurso inexistente. |
| ❌ **Modo de fallo** | `test_patch_empty_body` | PATCH con body vacío → 400 | Al menos un campo requerido. |
| ❌ **Modo de fallo** | `test_patch_not_found` | PATCH sobre ID inexistente → 404 | Operación sobre recurso inexistente. |
| ❌ **Modo de fallo** | `test_notes_lead_not_found` | Listar notas de lead inexistente → 404 | Validación de existencia del padre. |
| ❌ **Modo de fallo** | `test_create_note_empty_content` | Nota con contenido vacío → 422 | min_length=1 en content. |
| ❌ **Modo de fallo** | `test_create_note_lead_not_found` | Nota sobre lead inexistente → 404 | Validación de existencia del padre. |
| ❌ **Modo de fallo** | `test_delete_note_not_found` | Nota inexistente → 404 | Recurso no encontrado. |
| ❌ **Modo de fallo** | `test_delete_lead_not_found` | DELETE nota sobre lead inexistente → 404 | Validación de existencia del padre. |
| ❌ **Modo de fallo** | `test_list_limit_too_high` | limit > 1000 → 422 | Validación de rango de query param. |

---

### 9. Utilidades TypeScript — Tracker-core (`packages/tracker-core`)

| Módulo | Tests | Descripción | Justificación |
|--------|-------|-------------|---------------|
| ✅ **collections** | 39 | `matchesCriterion`, `filterByCriteria`, `sortByField`, `paginate`, etc. | Cobertura de operaciones fundamentales sobre arrays: filtrado, ordenación, paginación. |
| ✅ **transformations** | 38 | `count`, `sum`, `avg`, `max`, `min`, `aggregate`, `groupBy`, `reportByStatus` | Funciones de agregación de datos críticas para dashboards y reportes. |
| ✅ **search** | 12 | `linearSearchByIdentity`, `binarySearch`, `binarySearchNumber`, `binarySearchRange` | Algoritmos de búsqueda utilizados en listados de candidatos. |
| ✅ **validations** | 42 | `validateCandidateForm`, `validateCandidateComplete`, `validateNote`, `canAdvanceToTechnical`, `canReceiveOffer`, `validatePipelineFlow`, validadores de email/URL/phone/range | Reglas de negocio del pipeline de reclutamiento: transiciones de etapa, validación de formularios. |

### 10. Tipos Compartidos — Shared (`packages/shared`)

| Módulo | Tests | Descripción | Justificación |
|--------|-------|-------------|---------------|
| ✅ **types/index** | 4 | Verificación de tipos exportados y estructuras de datos compartidas | Garantiza que los tipos compartidos entre frontend y backend son correctos. |

---

## 🎯 Objetivos de Cobertura

| Fase | Módulo | Cobertura Mínima | Estado Actual |
|------|--------|-------------------|---------------|
| **FASE 2** | Backend API completo | **≥ 70%** | ✅ **97%** |
| **FASE 2** | `routes/auth.py` | **≥ 70%** | ✅ **98%** |
| **FASE 4** | `routes/leads.py` | **≥ 70%** | ✅ **100%** |
| **FASE 4** | `routes/suppliers.py` | **≥ 70%** | ✅ **100%** |
| **FASE 4** | `routes/incidents.py` | **≥ 70%** | ✅ **96%** |
| **FASE 4** | `routes/incidents_crud.py` | **≥ 70%** | ✅ **84%** |
| **FASE 4** | `incidents_core.py` | **≥ 70%** | ✅ **86%** |
| **FASE 4** | `incidents_db.py` | **≥ 70%** | ✅ **89%** |
| **FASE 4** | Tracker-core (TypeScript) | **≥ 60%** | ✅ **93.29% stmts / 88.97% branch** |

---

## 📊 Reporte de Cobertura — Backend (última ejecución)

```
Name                           Stmts   Miss  Cover
---------------------------------------------------
config.py                         11      0   100%
database.py                        9      0   100%
incidents_core.py                 56      8    86%
incidents_db.py                   56      6    89%
main.py                           26      3    88%
models.py                         84      1    99%
routes/__init__.py                 0      0   100%
routes/auth.py                   104      2    98%
routes/incidents.py               80      3    96%
routes/incidents_crud.py          75     12    84%
routes/leads.py                  135      0   100%
routes/suppliers.py               62      0   100%
---------------------------------------------------
GLOBAL                           697     35    95%
```

> **Nota:** Al ejecutar `pytest --cov=./` se incluyen también los ficheros de test, lo que eleva el total global a **97%** (1645 sentencias, 54 sin cubrir).

Para generar un reporte HTML completo:

```bash
cd services/api
uv run pytest --cov=./ --cov-report=html
# Abrir htmlcov/index.html
```

---

## 📈 Resumen global del proyecto

| Componente | Tests | Estado |
|-----------|-------|--------|
| Backend — Register | 12 | ✅ |
| Backend — Login | 9 | ✅ |
| Backend — Token + Profile | 11 | ✅ |
| Backend — Suppliers CRUD | 31 | ✅ |
| Backend — Incidents CSV analyze | 16 | ✅ |
| Backend — Incidents CRUD + lifecycle | 42 | ✅ |
| Backend — Leads + Notes CRUD | 39 | ✅ |
| TypeScript — tracker-core utils | 131 | ✅ |
| TypeScript — shared types | 4 | ✅ |
| **Total** | **295** | **✅ 100% passing** |

---

## 🔄 Integración Continua (recomendado)

Cuando se configure CI (GitHub Actions, etc.):

```yaml
# .github/workflows/test.yml (ejemplo)
name: Tests
on: [push, pull_request]
jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: cd services/api && uv run pytest --cov=./ --cov-report=term-missing
  test-typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: |
          cd packages/tracker-core && npm ci && npm test -- --coverage
          cd ../shared && npm ci && npm test -- --coverage
```

---

## ✅ Checklist de verificación del Hito 8

- [x] `TESTING.md` creado en la raíz del monorepo
- [x] Estrategia de pruebas documentada (stack, ejecución, estructura)
- [x] Matriz de casos para cada endpoint (Happy path, Edge cases, Failure modes)
- [x] Justificación individual de cada caso de prueba
- [x] 160 tests pytest en backend (Register, Login, Token, Profile, Suppliers, Incidents, Incidents CRUD, Leads)
- [x] 135 tests Jest en TypeScript (tracker-core + shared)
- [x] Cobertura backend: **97%** global
- [x] Cobertura TypeScript: **93.29%** statements / **88.97%** branch
- [x] Integración continua documentada (GitHub Actions)