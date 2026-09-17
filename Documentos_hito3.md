# Documentos Hito 3: Talent Pipeline Tracker (Next.js)

> **Fecha de creación:** 17 de septiembre de 2026  
> **Versión del documento:** 1.0  
> **Estado:** Completo

---

## Tabla de Contenidos

1. [Información General](#1-información-general)
2. [Estructura y Arquitectura del Proyecto](#2-estructura-y-arquitectura-del-proyecto)
3. [Descripción de Archivos](#3-descripción-de-archivos)
   - [3.1 Configuración Raíz](#31-configuración-raíz)
   - [3.2 Librerías (`src/lib/`)](#32-librerías-srclib)
   - [3.3 Hooks (`src/hooks/`)](#33-hooks-srchooks)
   - [3.4 Componentes (`src/components/`)](#34-componentes-srccomponents)
   - [3.5 Páginas (`src/app/`)](#35-páginas-srcapp)
4. [Flujo de Navegación](#4-flujo-de-navegación)
5. [Especificaciones Técnicas](#5-especificaciones-técnicas)
6. [Endpoints de API Consumidos](#6-endpoints-de-api-consumidos)
7. [Manejo de Estados](#7-manejo-de-estados)

---

## 1. Información General

### 1.1 Descripción del Proyecto

**Talent Pipeline Tracker** es una aplicación web construida con **Next.js 15** y **App Router** que permite gestionar el pipeline de reclutamiento de talento. Proporciona un CRUD completo de candidaturas, filtros dinámicos, búsqueda en tiempo real y gestión de notas asociadas a cada candidato.

### 1.2 Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 15.1.0 | Framework React con App Router (SSR/SSG) |
| React | 19.0.0 | Biblioteca de UI |
| TypeScript | 5.7+ | Tipado estático |
| Tailwind CSS | 3.4+ | Estilos utilitarios |
| Node.js | 20.18.0 | Entorno de ejecución |

### 1.3 API Base

```
NEXT_PUBLIC_API_URL=https://playground.4geeks.com/tracker/api/v1
```

---

## 2. Estructura y Arquitectura del Proyecto

```
uis/talent-pipeline-tracker/
├── .env.local                          # Variables de entorno (URL API)
├── package.json                        # Dependencias y scripts
├── tsconfig.json                       # Configuración de TypeScript
├── next.config.ts                      # Configuración de Next.js
├── tailwind.config.ts                  # Configuración de Tailwind CSS
├── postcss.config.mjs                  # Configuración de PostCSS
├── node_modules/                       # Dependencias instaladas
└── src/
    ├── lib/
    │   ├── types.ts                    # Tipos, interfaces y constantes
    │   └── api.ts                      # Servicio de API (fetch + CRUD)
    ├── hooks/
    │   ├── index.ts                    # Re-exportaciones de hooks
    │   └── useCandidate.ts             # Hooks personalizados
    ├── components/
    │   ├── index.ts                    # Re-exportaciones de componentes
    │   ├── LoadingSpinner.tsx           # Indicador de carga
    │   ├── ErrorMessage.tsx            # Mensaje de error con opción de volver
    │   ├── StatusBadge.tsx             # Badge de estado/etapa con colores
    │   ├── CandidateCard.tsx           # Tarjeta de candidato para listado
    │   ├── CandidateFilters.tsx        # Filtros por estado, etapa y búsqueda
    │   ├── CandidateForm.tsx           # Formulario crear/editar candidato
    │   ├── StatusStageControl.tsx       # Controles PATCH de estado y etapa
    │   └── NotesSection.tsx            # Sección de notas (CRUD)
    └── app/
        ├── globals.css                 # Estilos globales Tailwind
        ├── layout.tsx                  # Layout raíz con header
        ├── page.tsx                    # Página principal: listado (/)
        └── candidates/
            ├── [id]/
            │   ├── page.tsx            # Detalle de candidato (/candidates/[id])
            │   └── edit/
            │       └── page.tsx        # Editar candidato (/candidates/[id]/edit)
            └── new/
                └── page.tsx            # Nuevo candidato (/candidates/new)
```

---

## 3. Descripción de Archivos

### 3.1 Configuración Raíz

#### `.env.local`
Define la URL base de la API consumida por la aplicación.

```
NEXT_PUBLIC_API_URL=https://playground.4geeks.com/tracker/api/v1
```

#### `package.json`
Dependencias principales:
- `next` 15.1.0, `react` y `react-dom` 19.0.0
- Dev: TypeScript, Tailwind CSS, PostCSS, Autoprefixer, ESLint

#### `tsconfig.json`
Configuración con `@/*` apuntando a `./src/*`, JSX modo `preserve`, y `moduleResolution: "bundler"`.

#### `tailwind.config.ts`
Content apuntando a `src/app/`, `src/components/` y `src/pages/`.

---

### 3.2 Librerías (`src/lib/`)

#### `src/lib/types.ts` — Definiciones de Tipo

Define los siguientes tipos y constantes:

| Tipo / Constante | Descripción |
|------------------|-------------|
| `CandidateStatus` | Unión de strings: `"applied"`, `"screening"`, `"interview"`, `"hired"`, `"rejected"`, `"on_hold"` |
| `CandidateStage` | Unión de strings: `"new"`, `"review"`, `"phone_screen"`, `"technical"`, `"final_interview"`, `"offer"`, `"hired"`, `"rejected"` |
| `Candidate` | Interfaz completa con `id`, `first_name`, `last_name`, `email`, `phone`, `job_title`, `status`, `stage`, `linkedin?`, `cv_link?`, `years_experience?`, `application_date?`, `created_at?`, `updated_at?` |
| `Note` | Interfaz con `id`, `record_id`, `content`, `created_by?`, `created_at?`, `updated_at?` |
| `CandidateFormData` | Datos del formulario (crear/editar) |
| `CandidatePatchPayload` | Payload para PATCH parcial |
| `CandidatePutPayload` | Payload para PUT completo |
| `CandidatePostPayload` | Payload para POST (crear) |
| `NotePostPayload` | Payload para crear nota |
| `ApiResponse<T>` | Tipo genérico para respuesta de API |
| `LoadingState` | `"idle" \| "loading" \| "success" \| "error"` |
| `STATUS_OPTIONS` | Array de opciones de estado para selects |
| `STAGE_OPTIONS` | Array de opciones de etapa para selects |

#### `src/lib/api.ts` — Servicio de API

Función helper `fetchAPI<T>` que centraliza:
- Construcción de URL
- Headers JSON
- Manejo de errores HTTP
- Soporte para respuestas 204 (DELETE)

Funciones exportadas:

| Función | Método HTTP | Endpoint | Descripción |
|---------|-------------|----------|-------------|
| `getAllCandidates()` | GET | `/records` | Obtener todos los candidatos |
| `getCandidateById(id)` | GET | `/records/:id` | Obtener candidato por ID |
| `createCandidate(data)` | POST | `/records` | Crear nuevo candidato |
| `updateCandidate(id, data)` | PUT | `/records/:id` | Actualizar candidato completo |
| `patchCandidate(id, data)` | PATCH | `/records/:id` | Actualizar campos parciales |
| `getNotes(candidateId)` | GET | `/records/:id/notes` | Obtener notas del candidato |
| `addNote(candidateId, payload)` | POST | `/records/:id/notes` | Añadir nota |
| `deleteNote(candidateId, noteId)` | DELETE | `/records/:id/notes/:noteId` | Eliminar nota |

Incluye funciones `unwrapArray` y `unwrapSingle` para normalizar diferentes formatos de respuesta de la API.

---

### 3.3 Hooks (`src/hooks/`)

#### `src/hooks/useCandidate.ts`

Dos hooks personalizados:

| Hook | Estado Inicial | Propósito |
|------|----------------|-----------|
| `useCandidates()` | `{ candidates: [], state: "idle" }` | Carga inicial de lista. Retorna `candidates`, `state`, `error`, `refetch`, `setCandidates` |
| `useCandidate(id)` | `{ candidate: null, state: "idle" }` | Carga individual. Retorna `candidate`, `state`, `error`, `refetch`, `setCandidate` |

Ambos hooks:
- Usan `useState` + `useEffect` + `useCallback`
- Manejan los 4 estados de carga explícitamente
- Permiten actualización optimista mediante `setCandidates`/`setCandidate`

---

### 3.4 Componentes (`src/components/`)

#### `LoadingSpinner.tsx`
- **Props:** `message?: string` (default: "Cargando…")
- **UI:** Spinner animado + texto centrado
- **Uso:** Envolver áreas que cargan datos asíncronos

#### `ErrorMessage.tsx`
- **Props:** `title?`, `message`, `showBack?: boolean`
- **UI:** Caja roja con mensaje de error
- **Uso:** `showBack` muestra enlace "← Volver al listado"

#### `StatusBadge.tsx`
- **Props:** `value: string`, `type?: "status" | "stage"`
- **UI:** Badge con color según el valor (status: azul/verde/rojo; stage: gris/cián/violeta)
- **Función:** `humanize()` convierte `snake_case` a texto legible

#### `CandidateCard.tsx`
- **Props:** `candidate: Candidate`
- **UI:** Tarjeta con nombre, puesto, badges de status/stage, años de experiencia
- **Comportamiento:** Envuelta en `<Link>` hacia `/candidates/[id]`

#### `CandidateFilters.tsx`
- **Props:** Ninguna (usa `useSearchParams`)
- **UI:** Input de búsqueda + selects de estado y etapa
- **Comportamiento:** Actualiza query params (`q`, `status`, `stage`) de forma reactiva sin recargar la página
- **`useRouter` + `usePathname`** para navegación programática con `scroll: false`

#### `CandidateForm.tsx`
- **Props:** `candidate?: Candidate` (modo edición), `redirectTo?: string`
- **UI:** Formulario completo con campos: nombre, apellido, email, teléfono, puesto, experiencia, estado, etapa, LinkedIn, CV
- **Validación:** Nombre y email obligatorios
- **Feedback:** Mensajes de éxito/error tras envío
- **Comportamiento:** Navega a `redirectTo` tras 800ms de éxito

#### `StatusStageControl.tsx`
- **Props:** `candidateId`, `initialStatus`, `initialStage`, `onUpdate`
- **UI:** Dos selects paralelos para estado y etapa
- **Comportamiento:**
  - PATCH al cambiar cualquiera de los dos
  - Spinner de guardado individual por campo
  - Reversión al valor anterior en caso de error
  - Actualización optimista del padre vía `onUpdate`

#### `NotesSection.tsx`
- **Props:** `candidateId: number`
- **UI:**
  - Input + botón para añadir nota
  - Lista de notas con fecha y botón de eliminar
- **Comportamiento:**
  - Carga notas al montar (`GET /notes`)
  - Añade nota optimistamente al principio del array (`POST`)
  - Elimina con confirmación (`DELETE`)
  - Maneja estados loading, error y vacío

---

### 3.5 Páginas (`src/app/`)

#### `layout.tsx` — Layout Principal
- Meta tags: `Talent Pipeline Tracker`
- Header fijo con logo y navegación
- Contenedor `max-w-7xl` centrado
- Estilos globales Tailwind cargados

#### `page.tsx` — Listado de Candidaturas (`/`)
- **Tipo:** Client Component con `"use client"`
- Envuelto en `<Suspense>` por uso de `useSearchParams`
- **Estados manejados:**
  - `loading`: Muestra `<LoadingSpinner>`
  - `error`: Muestra `<ErrorMessage>`
  - `success` sin datos: Mensaje "Aún no hay candidatos" + botón "Crear primer candidato"
  - `success` con filtros sin resultados: "No se encontraron candidatos con estos filtros" + enlace "Limpiar filtros"
  - `success` con datos: Grid de `<CandidateCard>`
- **Filtros:** Por `status`, `stage` (query params) y `q` (búsqueda por nombre/email en tiempo real)

#### `candidates/[id]/page.tsx` — Detalle (`/candidates/[id]`)
- **Tipo:** Client Component con `use()` para resolver params promesa
- **Estados:** Loading → Spinner; Error → ErrorMessage con volver; Success → Detalle completo
- **Secciones:**
  - Cabecera con gradient azul, nombre, puesto, ID, badges
  - Controles rápidos (StatusStageControl)
  - Información personal (email, teléfono, puesto, experiencia, fecha, LinkedIn, CV)
  - Fechas de creación/actualización
  - Notas (NotesSection)
- **Botones:** Volver al listado, Editar (→ `/candidates/[id]/edit`)

#### `candidates/new/page.tsx` — Nuevo Candidato (`/candidates/new`)
- Renderiza `<CandidateForm>` en modo creación
- Botón "← Volver al listado"

#### `candidates/[id]/edit/page.tsx` — Editar (`/candidates/[id]/edit`)
- Carga candidato con `useCandidate(id)`
- Renderiza `<CandidateForm candidate={candidate}>` en modo edición
- Redirige al detalle tras éxito
- Botón "← Volver al detalle"

---

## 4. Flujo de Navegación

```
                    ┌──────────────────────────────────┐
                    │   / (Listado de candidaturas)    │
                    │   - Filtros (status, stage, q)   │
                    │   - Grid de CandidateCards       │
                    │   - Botón "Nuevo candidato"      │
                    └──────┬──────────────┬────────────┘
                           │              │
                           ▼              ▼
            ┌─────────────────────┐  ┌─────────────────────┐
            │ /candidates/[id]    │  │ /candidates/new     │
            │ (Detalle completo)  │  │ (Formulario crear)  │
            │ - StatusStageControl│  └─────────────────────┘
            │ - NotesSection      │
            │ - Botón "Editar"    │
            └──────┬──────────────┘
                   │
                   ▼
            ┌─────────────────────┐
            │ /candidates/[id]/   │
            │ edit                │
            │ (Formulario editar) │
            └─────────────────────┘
```

Toda la navegación utiliza el sistema de enrutamiento de Next.js App Router con componentes `<Link>` para evitar recargas completas de página.

---

## 5. Especificaciones Técnicas

### 5.1 Arquitectura de Componentes

```
Páginas (Server/Client Components)
  └── Hooks personalizados (lógica de estado y datos)
        └── Servicio API (fetch centralizado)
              └── Tipos TypeScript (interfaces)
```

### 5.2 Manejo de Estados (LoadingState)

Cada operación asíncrona maneja 4 estados:

| Estado | UI |
|--------|-----|
| `idle` | Estado inicial, no se ha disparado la carga |
| `loading` | `<LoadingSpinner>` con mensaje contextual |
| `success` | Renderizado de datos |
| `error` | `<ErrorMessage>` con mensaje del error |

### 5.3 Actualización Optimista

- **StatusStageControl:** Al cambiar estado/etapa, la UI se actualiza inmediatamente y revierte en caso de error.
- **NotesSection:** Al crear una nota, aparece instantáneamente en la lista sin recargar.
- **CandidateDetailPage:** `setCandidate` actualiza el estado local tras PATCH exitoso.

### 5.4 Validación de Formularios

- **Campos obligatorios:** `first_name` y `email`
- Validación del lado del cliente antes de enviar
- Mensajes de feedback en la misma página (éxito/error)
- Botón deshabilitado durante el envío

---

## 6. Endpoints de API Consumidos

| Método | Endpoint | Propósito | Componente |
|--------|----------|-----------|------------|
| `GET` | `/records` | Listar candidatos | `page.tsx` (listado) |
| `GET` | `/records/:id` | Detalle candidato | Detalle, Editar |
| `POST` | `/records` | Crear candidato | Formulario nuevo |
| `PUT` | `/records/:id` | Actualizar candidato | Formulario editar |
| `PATCH` | `/records/:id` | Cambiar estado/etapa | StatusStageControl |
| `GET` | `/records/:id/notes` | Listar notas | NotesSection |
| `POST` | `/records/:id/notes` | Añadir nota | NotesSection |
| `DELETE` | `/records/:id/notes/:noteId` | Eliminar nota | NotesSection |

---

## 7. Manejo de Estados

### 7.1 Diagrama de Estados del Listado

```
┌───────┐   fetch()   ┌─────────┐   éxito   ┌─────────┐
│ idle  │ ──────────▶ │ loading │ ────────▶ │ success │
└───────┘             └─────────┘           └─────────┘
                        │ error               │
                        ▼                     ▼
                     ┌───────┐          ┌──────────┐
                     │ error │          │ sin dato │
                     └───────┘          └──────────┘
```

### 7.2 Diagrama de Estados del Detalle

```
┌───────┐   fetch(id)  ┌─────────┐   éxito   ┌─────────┐
│ idle  │ ────────────▶ │ loading │ ────────▶ │ success │
└───────┘               └─────────┘           └─────────┘
                          │ error               │
                          ▼                     ▼
                       ┌───────┐          ┌────────────┐
                       │ error │          │ candidato  │
                       └───────┘          │ mostrado   │
                                          └────────────┘
```

### 7.3 Operaciones en el Detalle

```
┌──────────────────────┐
│ StatusStageControl   │
│  (PATCH status/stage)│
│                      │
│  1. UI optimista     │
│  2. Llamada PATCH    │
│  3. Éxito → mantiene │
│     Error → revierte │
└──────────────────────┘

┌──────────────────────┐
│ NotesSection         │
│                      │
│  Añadir:             │
│  1. Añade al array   │
│  2. POST a API       │
│                      │
│  Eliminar:           │
│  1. Confirm dialog   │
│  2. DELETE a API     │
│  3. Filtra del array │
└──────────────────────┘
```

---

## Notas Adicionales

- Se instaló Node.js v20.18.0 (compilación musl para Alpine Linux) para poder ejecutar el proyecto en el entorno.
- Todas las páginas son **Client Components** por el uso de hooks (`useSearchParams`, `useParams`, `useRouter`, `useState`, `useEffect`).
- El proyecto utiliza `npm` como gestor de paquetes.
- Para ejecutar en desarrollo: `npm run dev` → `http://localhost:3000`

---

*Fin del documento — Hito 3 completado.*