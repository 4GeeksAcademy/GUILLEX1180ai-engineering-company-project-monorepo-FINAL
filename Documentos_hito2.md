# Documentos Hito 2: Tracker Core — Lógica Pura TypeScript

> **Fecha de creación:** 17 de septiembre de 2026  
> **Versión del documento:** 1.0  
> **Estado:** Completo (post auditoría y correcciones)

---

## Tabla de Contenidos

1. [Información General](#1-información-general)
2. [Estructura y Arquitectura del Paquete](#2-estructura-y-arquitectura-del-paquete)
3. [Descripción de Archivos](#3-descripción-de-archivos)
   - [3.1 Tipos y Modelos (`src/types/models.ts`)](#31-tipos-y-modelos-srctypesmodelsts)
   - [3.2 Colecciones (`src/utils/collections.ts`)](#32-colecciones-srcutilscollectionsts)
   - [3.3 Búsqueda (`src/utils/search.ts`)](#33-búsqueda-srcutilssearchts)
   - [3.4 Transformaciones y Reportes (`src/utils/transformations.ts`)](#34-transformaciones-y-reportes-srcutilstransformationsts)
   - [3.5 Validaciones (`src/utils/validations.ts`)](#35-validaciones-srcutilsvalidationsts)
   - [3.6 Barrel File (`src/index.ts`)](#36-barrel-file-srcindexts)
4. [Auditoría de Código](#4-auditoría-de-código)
   - [4.1 Corrección Técnica](#41-corrección-técnica)
   - [4.2 Estructura y Organización](#42-estructura-y-organización)
   - [4.3 Adaptación al Contexto](#43-adaptación-al-contexto)
   - [4.4 Calidad de Código](#44-calidad-de-código)
   - [4.5 Hallazgos y Correcciones](#45-hallazgos-y-correcciones)
5. [Especificaciones Técnicas](#5-especificaciones-técnicas)
6. [Comandos](#6-comandos)

---

## 1. Información General

### 1.1 Descripción del Proyecto

**Tracker Core** (`tracker-core`) es un paquete independiente de **lógica TypeScript pura** que encapsula toda la lógica de negocio del **Talent Pipeline Tracker**. Proporciona algoritmos de filtrado avanzado, ordenamiento multi-criterio, búsqueda lineal y binaria, agregaciones, reportes y validaciones de negocio — todo como **funciones puras** sin dependencias externas.

### 1.2 Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| TypeScript | ^7.0.2 | Tipado estático y compilación |
| Node.js | 20.18.0 | Entorno de ejecución |

### 1.3 Principios de Diseño

- **Funciones puras** — sin efectos secundarios, sin mutación de entrada
- **Tipado genérico** — máximo reuso con `<T extends Record<string, unknown>>`
- **Responsabilidad única** — cada función hace exactamente una cosa
- **Manejo de casos límite** — arrays vacíos, valores nulos, elementos no encontrados

---

## 2. Estructura y Arquitectura del Paquete

```
packages/tracker-core/
├── index.html                          # Página de pruebas interactivas (Tailwind CSS)
├── package.json                        # Dependencias y scripts
├── tsconfig.json                       # Configuración de TypeScript
└── src/
    ├── index.ts                        # Barrel file — punto de entrada único
    ├── types/
    │   └── models.ts                   # Interfaces, tipos unión, constantes
    └── utils/
        ├── collections.ts              # Filtrado, ordenamiento, paginación
        ├── search.ts                   # Búsqueda lineal (O(n)) y binaria (O(log n))
        ├── transformations.ts          # Agregaciones, agrupaciones, reportes
        └── validations.ts              # Validaciones de negocio y helpers
```

---

## 3. Descripción de Archivos

### 3.1 Tipos y Modelos (`src/types/models.ts`)

Define todos los tipos e interfaces del dominio centralizados.

#### Tipos Unión

| Tipo | Valores |
|------|---------|
| `CandidateStatus` | `"applied" \| "screening" \| "interview" \| "hired" \| "rejected" \| "on_hold"` |
| `CandidateStage` | `"new" \| "review" \| "phone_screen" \| "technical" \| "final_interview" \| "offer" \| "hired" \| "rejected"` |
| `LoadingState` | `"idle" \| "loading" \| "success" \| "error"` |

#### Interfaces Principales

| Interfaz | Campos Clave |
|----------|-------------|
| `Candidate` | `id`, `first_name`, `last_name`, `email`, `phone`, `job_title`, `status`, `stage`, `linkedin?`, `cv_link?`, `years_experience?`, `application_date?`, `created_at?`, `updated_at?` |
| `Note` | `id`, `record_id`, `content`, `created_by?`, `created_at?`, `updated_at?` |
| `User` | `id`, `name`, `email`, `role: "admin" \| "recruiter" \| "viewer"` |
| `BaseEntity` | `id`, `created_at?`, `updated_at?` |
| `CandidateFormData` | Datos de formulario: `first_name`, `last_name`, `email`, `phone`, `job_title`, `status`, `stage`, `linkedin`, `cv_link`, `years_experience (number \| "")` |

#### Payloads y Tipos Genéricos

| Tipo | Descripción |
|------|-------------|
| `CandidatePatchPayload` | `Partial<Pick<Candidate, "status" \| "stage">>` |
| `CandidatePutPayload` | `Omit<Candidate, "id" \| "created_at" \| "updated_at">` |
| `CandidatePostPayload` | `CandidateFormData` |
| `NotePostPayload` | `{ content: string }` |
| `ApiResponse<T>` | `T \| { results: T } \| { data: T }` |

#### Tipos de Configuración

| Tipo | Propósito |
|------|-----------|
| `SortCriterion<T>` | `{ field: keyof T, direction: "asc" \| "desc" }` |
| `FilterCriterion<T>` | `{ field, operator: 9 operadores, value }` |
| `BinarySearchOptions<T>` | Opciones para búsqueda binaria |
| `AggregateResult` | `{ count, sum, avg, min, max }` con `min`/`max` como `number \| undefined` |
| `ValidationResult` | `{ valid: boolean, errors: string[] }` |

#### Constantes

| Constante | Descripción |
|-----------|-------------|
| `STATUS_OPTIONS` | 6 opciones: Applied, Screening, Interview, On Hold, Hired, Rejected |
| `STAGE_OPTIONS` | 8 opciones: New, Review, Phone Screen, Technical, Final Interview, Offer, Hired, Rejected |

---

### 3.2 Colecciones (`src/utils/collections.ts`)

Funciones para manipulación de arrays: filtrado, ordenamiento y paginación.

#### Filtrado

| Función | Descripción |
|---------|-------------|
| `matchesCriterion(item, criterion)` | Evalúa un criterio sobre un elemento. 9 operadores: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `between` |
| `filterByCriteria(items, criteria[])` | Filtra con múltiples criterios en **AND** |
| `filterByCriteriaOr(items, criteria[])` | Filtra con múltiples criterios en **OR** |
| `filterByStatus(items, status)` | Filtra candidatos por estado exacto |
| `filterByStage(items, stage)` | Filtra candidatos por etapa exacta |
| `filterByExperienceRange(items, min, max)` | Filtra por rango de años de experiencia |

#### Ordenamiento

| Función | Descripción |
|---------|-------------|
| `sortByField(items, field, direction?)` | Ordena por un campo (asc/desc). Nulls al final. Números y strings |
| `sortByMultipleCriteria(items, criteria[])` | Ordena multi-campo: `[{field: "status", direction: "asc"}, {field: "last_name", direction: "asc"}]` |

#### Paginación

| Función | Descripción |
|---------|-------------|
| `paginate(items, pageSize, pageIndex)` | Devuelve la porción del array (pageIndex empieza en 0) |
| `totalPages(totalItems, pageSize)` | Calcula número total de páginas (`Math.ceil`) |

---

### 3.3 Búsqueda (`src/utils/search.ts`)

Dos familias de algoritmos de búsqueda: lineal y binaria.

#### Búsqueda Lineal — O(n) — Arrays desordenados

| Función | Descripción |
|---------|-------------|
| `linearSearchByIdentity(items, field, value)` | Retorna el **primer** elemento que coincide exactamente, o `undefined` |
| `linearSearchAll(items, field, value)` | Retorna **todas** las coincidencias |
| `linearSearchByText(items, field, query)` | Búsqueda por substring **case-insensitive** |
| `linearSearchMultiField(items, fields[], value)` | Búsqueda multi-campo (OR lógico). Evita duplicados con `break` |

#### Búsqueda Binaria — O(log n) — Requiere array ordenado

| Función | Descripción |
|---------|-------------|
| `binarySearchIndex(items, field, value)` | Retorna el **índice** del elemento encontrado, o **-1** |
| `binarySearch(items, field, value)` | Retorna el **elemento** encontrado, o `undefined` |
| `binarySearchNumber(items, field, value)` | Versión optimizada para números. Requiere array ordenado asc con valores numéricos primero |
| `binarySearchRange(items, field, min, max)` | Búsqueda por rango [min, max] en arrays ordenados numéricamente |

> **Nota técnica:** `binarySearchNumber` y `binarySearchRange` fueron corregidos durante la auditoría (ver [Hallazgos](#45-hallazgos-y-correcciones)). La versión original usaba `left = mid + 1` al encontrar no-números, lo que podía saltarse el valor buscado. Ahora usa `right = mid - 1`.

---

### 3.4 Transformaciones y Reportes (`src/utils/transformations.ts`)

#### Agregaciones Básicas

| Función | Descripción | Retorno (array vacío) |
|---------|-------------|----------------------|
| `count(items)` | Número total de elementos | `0` |
| `sum(items, field)` | Suma de campo numérico | `0` |
| `avg(items, field)` | Media aritmética | `0` |
| `max(items, field)` | Valor máximo | `undefined` |
| `min(items, field)` | Valor mínimo | `undefined` |
| `aggregate(items, field)` | Todas las métricas en un solo objeto | `{ count: 0, sum: 0, avg: 0, min: undefined, max: undefined }` |

#### Agrupaciones

| Función | Descripción |
|---------|-------------|
| `groupBy(items, field)` | Agrupa elementos por valor de campo. Retorna `Record<string, T[]>` |
| `countBy(items, field)` | Cuenta elementos por valor de campo. Retorna `Record<string, number>` |
| `distinct(items, field)` | Valores únicos de un campo. Retorna `T[K][]` (tipado preciso) |

#### Reportes Específicos para Candidatos

| Función | Descripción | Interfaz de Retorno |
|---------|-------------|---------------------|
| `reportByStatus(items)` | Reporte por estado: conteo y porcentaje, ordenado por count descendente | `StatusReport[]` |
| `reportByStage(items)` | Reporte por etapa: conteo y porcentaje, ordenado por count descendente | `StageReport[]` |
| `reportExperience(items)` | Reporte de experiencia: promedio, mínimo, máximo, total con datos | `ExperienceReport` |

Interfaces de reporte:

```typescript
interface StatusReport { status: string; count: number; percentage: number; }
interface StageReport  { stage: string;  count: number; percentage: number; }
interface ExperienceReport {
  average_years: number;
  min_years: number | undefined;
  max_years: number | undefined;
  total_candidates_with_data: number;
}
```

---

### 3.5 Validaciones (`src/utils/validations.ts`)

#### Validaciones de Candidato

| Función | Reglas |
|---------|--------|
| `validateCandidateForm(data)` | Nombre ≥ 2, Apellido ≥ 2, Email formato válido, Teléfono ≥ 7 (opcional), Puesto ≥ 2, Experiencia no negativa |
| `validateCandidateComplete(candidate)` | Nombre, apellido, email, puesto, estado, etapa — todos requeridos |

#### Validaciones de Notas

| Función | Reglas |
|---------|--------|
| `validateNote(payload)` | Contenido no vacío, máximo 500 caracteres |

#### Validaciones de Negocio Avanzadas

| Función | Reglas |
|---------|--------|
| `canAdvanceToTechnical(candidate)` | Email registrado, Teléfono de contacto, Experiencia ≥ 1 año |
| `canReceiveOffer(candidate)` | Etapa `"final_interview"` (no `"offer"`), estado no `"rejected"` ni `"hired"` |
| `validatePipelineFlow(candidate, previousStage?)` | Etapa reconocida en el flujo. Opcional: detecta saltos de etapa |

> **Nota técnica:** `canReceiveOffer` fue corregido durante la auditoría. Originalmente permitía etapa `"offer"`, pero si el candidato ya está en etapa de oferta, no debería poder recibir otra.

#### Helpers de Validación

| Función | Descripción |
|---------|-------------|
| `isValidEmail(email)` | Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| `isValidUrl(url)` | Usa `new URL()` y verifica protocolo http/https |
| `isValidPhone(phone)` | Limpia caracteres especiales, verifica ≥ 7 dígitos |
| `isInRange(value, min, max)` | `value >= min && value <= max` |

---

### 3.6 Barrel File (`src/index.ts`)

Archivo de entrada único que re-exporta todos los tipos y funciones públicas. Permite imports limpios desde el paquete:

```typescript
// En lugar de imports profundos:
import { Candidate } from 'tracker-core/src/types/models';
import { filterByCriteria } from 'tracker-core/src/utils/collections';

// Se puede importar directamente:
import { Candidate, filterByCriteria, validateCandidateForm } from 'tracker-core';
```

Re-exporta:
- **24 tipos** desde `types/models`
- **10 funciones** desde `utils/collections`
- **8 funciones** desde `utils/search`
- **14 funciones** desde `utils/transformations` (más 3 interfaces de reporte)
- **10 funciones** desde `utils/validations`

---

## 4. Auditoría de Código

Se realizó una auditoría exhaustiva como Tech Lead y Senior Code Reviewer, evaluando 5 criterios sobre los ~350 LOCs del paquete.

### 4.1 Corrección Técnica

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Tipado e Interfaces** | ✅ Sin `any`. Tipos explícitos en parámetros y retornos. Genéricos bien usados. |
| **Filtrado** | ✅ `matchesCriterion` cubre 9 operadores. `filterByCriteria` (AND) y `filterByCriteriaOr` (OR) correctos. |
| **Ordenamiento** | ✅ Nulls al final. Comparación mixta número/string. `sortByMultipleCriteria` con orden secuencial correcto. |
| **Búsqueda lineal** | ✅ Cuatro variantes cubriendo primera coincidencia, todas, substring y multi-campo. |
| **Búsqueda binaria** | ✅ Corregido: ahora `right = mid - 1` en vez de `left = mid + 1` al encontrar no-números. |
| **Agregaciones** | ✅ Corregido: `aggregate()` ahora devuelve `undefined` para min/max sin datos, consistente con `min()`/`max()` individuales. |
| **Validaciones** | ✅ Corregido: `canReceiveOffer()` ya no permite etapa `"offer"`. `validatePipelineFlow()` ahora detecta saltos con `previousStage`. |
| **Compilación** | ✅ **0 errores** — Verificado con `npx tsc --noEmit` |

### 4.2 Estructura y Organización

| Aspecto | Estado |
|---------|--------|
| **Modularización** | ✅ Separación clara: `types/` (modelos) y `utils/` (4 archivos: collections, search, transformations, validations) |
| **Responsabilidad Única** | ✅ Cada función hace exactamente una cosa |
| **Punto de entrada** | ✅ **Creado** `src/index.ts` barrel file que re-exporta todo |
| **package.json** | ✅ Corregido: `main` y `types` ahora apuntan a `src/index.ts` |

### 4.3 Adaptación al Contexto

| Aspecto | Estado |
|---------|--------|
| **Nombres de entidades** | ✅ `Candidate`, `Note`, `User` — correctos para el dominio |
| **Campos y tipos** | ✅ `CandidateStatus`, `CandidateStage`, `CandidateFormData` alineados con la API |
| **Validaciones de negocio** | ✅ Reglas realistas: email, teléfono, experiencia mínima para entrevista técnica |
| **Reportes** | ✅ `reportByStatus`, `reportByStage`, `reportExperience` — métricas relevantes para RRHH |

### 4.4 Calidad de Código

| Aspecto | Estado |
|---------|--------|
| **Funciones puras** | ✅ 100% — sin efectos secundarios, sin mutación de arrays de entrada |
| **Arrays vacíos** | ✅ `filterByCriteria` retorna `[...items]`, `paginate` retorna `[]`, `min`/`max` retornan `undefined` |
| **Valores nulos** | ✅ `sortByField` coloca nulls al final con `== null`. `filterByExperienceRange` usa `== null` |
| **camelCase / PascalCase** | ✅ Consistente en todo el código |
| **Uso de `const`** | ✅ Solo `let` en loops e índices cuando es necesario |
| **Comentarios** | ✅ Solo en lógica compleja (búsqueda binaria, operador between) y cabeceras de sección |

### 4.5 Hallazgos y Correcciones

| # | Severidad | Archivo | Problema | Corrección Aplicada |
|---|-----------|---------|----------|---------------------|
| 1 | 🔴 **Alto** | `search.ts` | `binarySearchNumber` y `binarySearchRange` usaban `left = mid + 1` al encontrar no-números, saltándose potencialmente el valor buscado | ✅ `right = mid - 1` (en array ordenado asc, los no-números están al final) |
| 2 | 🟡 **Medio** | `transformations.ts` + `models.ts` | `aggregate()` retornaba `min: 0, max: 0` para arrays vacíos, inconsistente con `min()`/`max()` individuales que retornaban `undefined` | ✅ `AggregateResult.min`/`max` son `number \| undefined`. `aggregate()` retorna `undefined` para vacío |
| 3 | 🟢 **Bajo** | `validations.ts` | `canReceiveOffer()` permitía etapa `"offer"`, pero si ya está en oferta no debería poder recibir otra | ✅ Ahora rechaza explícitamente etapa `"offer"` |
| 4 | 🟢 **Bajo** | `validations.ts` | `validatePipelineFlow()` solo verificaba existencia de etapa, no detectaba saltos | ✅ Ahora acepta `previousStage` opcional y detecta saltos con mensaje descriptivo |
| 5 | 🟡 **Medio** | *nuevo* | **Sin barrel file** — imports desde fuera serían profundos y frágiles | ✅ Creado `src/index.ts` con todas las re-exportaciones |
| 6 | 🟡 **Medio** | `package.json` | `main` apuntaba a `src/types/models.ts` en vez de un barrel | ✅ `main` + `types` ahora apuntan a `src/index.ts` |
| 7 | 🟢 **Bajo** | `index.html` | Cada click en filtrar agregaba un nuevo párrafo de conteo (acumulación visual) | ✅ Usa elemento con `id="filterCounter"` que se reemplaza en cada click |
| 8 | 🟢 **Bajo** | `transformations.ts` | `distinct()` retornaba `unknown[]` — tipo débil | ✅ Ahora `distinct<T, K>(..., field: K): T[K][]` con tipado preciso |

---

## 5. Especificaciones Técnicas

### 5.1 Configuración de TypeScript (`tsconfig.json`)

| Opción | Valor |
|--------|-------|
| `target` | `ES2020` |
| `module` | `ESNext` |
| `moduleResolution` | `bundler` |
| `strict` | `true` |
| `noEmit` | `true` (solo validación) |
| `esModuleInterop` | `true` |
| `skipLibCheck` | `true` |
| `forceConsistentCasingInFileNames` | `true` |

### 5.2 Package.json

```json
{
  "name": "tracker-core",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "echo \"No tests configured yet\" && exit 0"
  },
  "devDependencies": {
    "typescript": "^7.0.2"
  }
}
```

### 5.3 Complejidad Algorítmica

| Operación | Complejidad | Requisito |
|-----------|-------------|-----------|
| Búsqueda lineal | **O(n)** | Ninguno |
| Búsqueda binaria | **O(log n)** | Array ordenado ascendentemente |
| Filtrado | **O(n × c)** | Ninguno (c = número de criterios) |
| Ordenamiento (sort) | **O(n log n)** | Ninguno (crea copia inmutada) |
| Agregaciones | **O(n)** | Ninguno |
| Reportes | **O(n + k log k)** | Ninguno (k = número de grupos únicos) |

### 5.4 Funciones Puras

Todas las funciones en el paquete son **100% puras**:
- No modifican los arrays de entrada (usan `[...spread]` o `slice()`)
- No dependen de variables externas ni estado global
- Dados los mismos argumentos, siempre retornan el mismo resultado
- No producen efectos secundarios observables

### 5.5 Manejo de Casos Límite

| Escenario | Comportamiento |
|-----------|---------------|
| Array vacío en filtrado | Retorna `[]` (vacíos items = vacíos resultados) |
| Array vacío en agregación | `sum = 0`, `avg = 0`, `min = undefined`, `max = undefined` |
| Sin criterios de filtrado | Retorna copia del array completo (operación identidad) |
| Campo nulo/undefined en sort | Va al final del array ordenado |
| Valor no encontrado en búsqueda lineal | Retorna `undefined` o `[]` |
| Valor no encontrado en búsqueda binaria | Retorna `-1` o `undefined` |

---

## 6. Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run typecheck` | Valida compilación TypeScript (sin emitir archivos) |
| `npm test` | Ejecuta tests (no configurados aún) |
| `npx tsc --noEmit` | Alternativa directa para validar compilación |

### Ubicación del Paquete

```
/workspaces/GUILLEX1180ai-engineering-company-project-monorepo-FINAL/packages/tracker-core/
```

### Página de Pruebas

El archivo `index.html` en la raíz del paquete proporciona una interfaz interactiva con Tailwind CSS para probar visualmente:
- **Filtrado** por estado, etapa y experiencia mínima
- **Ordenamiento** por apellido, nombre, experiencia o estado (asc/desc)
- **Búsqueda** por texto (substring case-insensitive) y campo exacto
- **Reportes** por estado, etapa y agregación de experiencia
- **Validaciones** con selector de candidato

Para usarla, abre el archivo `index.html` directamente en un navegador (no requiere servidor).

---

*Fin del documento — Hito 2 completado.*