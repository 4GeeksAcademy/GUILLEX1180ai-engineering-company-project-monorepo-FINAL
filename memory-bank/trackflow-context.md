# Memory Bank — TrackFlow

> **Propósito:** Banco de memoria persistente para agentes de IA. Debe ser leído antes de cada sesión de trabajo.
> **Última actualización:** 2026-09-17
> **Versión:** 1.0

---

## 📋 Archivos del Memory Bank

El memory bank está dividido en 3 archivos especializados:

| Archivo | Propósito |
|---------|-----------|
| [`projectbrief.md`](./projectbrief.md) | Identidad de la empresa, problema de negocio, stakeholders, objetivos y restricciones |
| [`techContext.md`](./techContext.md) | Stack tecnológico, ADRs, convenciones técnicas, estructura del monorepo |
| [`progress.md`](./progress.md) | Estado actual de cada hito, tareas completadas y pendientes |

> **El agente DEBE leer los 3 archivos al inicio de cada sesión.**

---

## 📋 Índice del Contexto Consolidado

1. [Identidad de la Empresa](#1-identidad-de-la-empresa)
2. [Arquitectura del Monorepo](#2-arquitectura-del-monorepo)
3. [Decisiones de Arquitectura](#3-decisiones-de-arquitectura)
4. [Hito 1 — Sitio Web Público](#4-hito-1--sitio-web-público)
5. [Hito 2 — Tracker Core (TypeScript)](#5-hito-2--tracker-core-typescript)
6. [Hito 3 — Talent Pipeline Tracker (Next.js)](#6-hito-3--talent-pipeline-tracker-nextjs)
7. [Restricciones Vigentes](#7-restricciones-vigentes)
8. [Glosario de Términos](#8-glosario-de-términos)

---

## 1. Identidad de la Empresa

| Campo | Valor |
|-------|-------|
| **Nombre** | TrackFlow |
| **Fundación** | 2009 |
| **Sede central** | Los Ángeles, California, EE.UU. |
| **Presencia** | EE.UU. (Los Ángeles) y España (Zaragoza) |
| **Empleados** | ~130 |
| **Facturación** | ~9M €/año |
| **Clientes** | Marcas medianas de moda, electrónica y cosmética (e-commerce) |

### Servicios

1. **Gestión de Almacenes** — Almacenamiento, picking & packing, inventario en tiempo real
2. **Última Milla** — Carriers certificados (UPS, FedEx, DHL, MRW, SEUR), seguimiento unificado
3. **Logística Inversa** — Devoluciones, inspección, reacondicionamiento

### Stakeholders

| Nombre | Cargo | Rol |
|--------|-------|-----|
| **Miguel Torres** | Director Comercial | Necesita captación de leads cualificados |
| **Andrés Kim** | CTO | Supervisa TrackFlow Tech |

---

## 2. Arquitectura del Monorepo

```
/
├── CONTEXT.md                    # Fuente única de verdad sobre la empresa
├── AGENTS.md                     # Protocolo operativo para agentes de IA
├── memory-bank/                  # Banco de memoria (este archivo)
├── .agents/
│   ├── rules/                    # Reglas de desarrollo
│   └── skills/                   # Skills reutilizables para agentes
├── uis/
│   ├── website/                  # Hito 1 — Landing page pública (HTML+CSS+JS)
│   ├── backoffice/               # Backoffice (Next.js App Router + TypeScript)
│   └── talent-pipeline-tracker/  # Hito 3 — App de reclutamiento (Next.js)
├── packages/
│   └── tracker-core/             # Hito 2 — Lógica TypeScript pura
├── services/                     # Backend FastAPI (futuro)
├── agents/                       # Agentes de IA (futuro)
├── skills/                       # Skills del proyecto (formato Skill template)
├── data/                         # Datos y pipelines
├── docs/                         # Documentación
├── infra/                        # Docker, despliegue
├── workflows/                    # Flujos n8n
└── shared/                       # Tipos y utilidades compartidas
```

---

## 3. Decisiones de Arquitectura

| ID | Decisión | Justificación |
|----|----------|---------------|
| **ADR-001** | Next.js App Router para todas las apps React | Enrutamiento basado en archivos, Server Components, soporte nativo TypeScript |
| **ADR-002** | Sin librerías externas de gestión de estado | useState + useReducer cubren las necesidades actuales; reduce dependencias |
| **ADR-003** | Fetch nativo para llamadas API (sin axios) | API nativa del navegador, suficiente para los endpoints actuales |
| **ADR-004** | Tailwind CSS como único framework de estilos | Consistencia visual, CDN para Hito 1, PostCSS para Next.js |
| **ADR-005** | TypeScript strict mode, sin `any` | Seguridad de tipos, auto-documentación, prevención de errores |
| **ADR-006** | FastAPI centralizado (futuro en `/services/`) | Evita microservicios prematuros; routers por dominio |
| **ADR-007** | Barrel file en packages (src/index.ts) | Imports limpios, encapsulación de la API pública |
| **ADR-008** | 100% funciones puras en tracker-core | Testabilidad, predecibilidad, sin efectos secundarios |

---

## 4. Hito 1 — Sitio Web Público

| Aspecto | Detalle |
|---------|---------|
| **Ubicación** | `uis/website/` |
| **Stack** | HTML5, CSS3 (Tailwind CDN), JavaScript ES6+ |
| **Ejecución** | `python3 -m http.server 3000` |
| **Idioma base** | Español |
| **Archivos** | `index.html`, `application.html`, `styles.css`, `validation.js` |

### Paleta de Colores

| Variable | HEX | Uso |
|----------|-----|-----|
| `tf-blue` | `#1e40af` | Principal de marca |
| `tf-blue-light` | `#3b82f6` | Hover, focus rings |
| `tf-blue-dark` | `#1e3a8a` | Hover botones |
| `tf-accent` | `#f59e0b` | Acentos |
| `tf-gray` | `#f8fafc` | Fondos suaves |
| `tf-dark` | `#0f172a` | Texto principal |

### Formulario de Leads — 12 Campos

| # | Campo | Tipo | ¿Obligatorio? |
|---|-------|------|:-------------:|
| 1 | Nombre de empresa | text | ✅ |
| 2 | Persona de contacto | text | ✅ (2 palabras) |
| 3 | Email corporativo | email | ✅ |
| 4 | Teléfono (+código) | tel | ✅ |
| 5 | Sitio web | url | ❌ |
| 6 | País operación | select | ✅ |
| 7 | Tipo de producto | select | ✅ |
| 8 | Volumen mensual | select | ✅ |
| 9 | Servicios de interés | checkbox (múltiple) | ✅ (≥1) |
| 10 | ¿Trabajas con 3PL? | radio | ✅ |
| 11 | Comentarios | textarea | ❌ (max 500) |
| 12 | Política de privacidad | checkbox | ✅ |

### Restricción de Negocio

> Volumen "0-100 envíos/mes" → Mostrar advertencia: *"Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente."*

---

## 5. Hito 2 — Tracker Core (TypeScript)

| Aspecto | Detalle |
|---------|---------|
| **Ubicación** | `packages/tracker-core/` |
| **Stack** | TypeScript ^7.0.2, Node.js 20 |
| **Validación** | `npx tsc --noEmit` (0 errores) |
| **Principio** | 100% funciones puras, tipado genérico, sin `any` |

### Estructura

```
packages/tracker-core/src/
├── index.ts                    # Barrel file (re-exporta todo)
├── types/models.ts             # 24 tipos + 2 constantes
└── utils/
    ├── collections.ts          # 10 funciones (filtro, orden, paginación)
    ├── search.ts               # 8 funciones (lineal + binaria)
    ├── transformations.ts      # 14 funciones (agregación, reportes)
    └── validations.ts          # 10 funciones (validación)
```

### Hallazgos de Auditoría (8 correcciones)

| # | Severidad | Archivo | Corrección |
|---|-----------|---------|------------|
| 1 | 🔴 Alto | `search.ts` | `binarySearchNumber` — `right = mid - 1` |
| 2 | 🟡 Medio | `transformations.ts` | `AggregateResult.min/max` como `undefined` |
| 3 | 🟢 Bajo | `validations.ts` | `canReceiveOffer` rechaza etapa `"offer"` |
| 4 | 🟢 Bajo | `validations.ts` | `validatePipelineFlow` detecta saltos |
| 5 | 🟡 Medio | *nuevo* | Creado barrel `src/index.ts` |
| 6 | 🟡 Medio | `package.json` | `main` actualizado a `src/index.ts` |
| 7 | 🟢 Bajo | `index.html` | Contador fijo (no acumulativo) |
| 8 | 🟢 Bajo | `transformations.ts` | `distinct()` con tipado `T[K][]` |

---

## 6. Hito 3 — Talent Pipeline Tracker (Next.js)

| Aspecto | Detalle |
|---------|---------|
| **Ubicación** | `uis/talent-pipeline-tracker/` |
| **Stack** | Next.js 15.1, React 19, TypeScript 5.7+, Tailwind CSS |
| **API Base** | `https://playground.4geeks.com/tracker/api/v1` |
| **Ejecución** | `npm run dev` → `http://localhost:3000` |

### Rutas (4 páginas)

| Ruta | Propósito |
|------|-----------|
| `/` | Listado de candidaturas + filtros |
| `/candidates/[id]` | Detalle del candidato + notas |
| `/candidates/new` | Crear nuevo candidato |
| `/candidates/[id]/edit` | Editar candidato |

### Componentes (8)

`LoadingSpinner`, `ErrorMessage`, `StatusBadge`, `CandidateCard`, `CandidateFilters`, `CandidateForm`, `StatusStageControl`, `NotesSection`

### Endpoints API (8)

`GET /records`, `GET /records/:id`, `POST /records`, `PUT /records/:id`, `PATCH /records/:id`, `GET /records/:id/notes`, `POST /records/:id/notes`, `DELETE /records/:id/notes/:noteId`

---

## 7. Restricciones Vigentes

1. **Sin `any` en TypeScript** — Usar tipos explícitos o genéricos
2. **Sin librerías externas de estado** — Solo `useState` y `useReducer`
3. **Sin `axios`** — Usar `fetch` nativo
4. **Tailwind CSS** — Único framework de estilos permitido
5. **100% funciones puras** en `packages/tracker-core/`
6. **Commits** deben seguir el protocolo de `AGENTS.md`
7. **Todo código nuevo** debe reflejar el contexto de TrackFlow (no genérico)

---

## 8. Glosario de Términos

| Término | Definición |
|---------|------------|
| **TrackFlow** | Empresa de logística para e-commerce (almacenes, última milla, logística inversa) |
| **Última Milla** | Tramo final de la entrega: del almacén al cliente |
| **3PL** | Third-Party Logistics — Proveedor externo de logística |
| **Logística Inversa** | Gestión de devoluciones y reacondicionamiento de productos |
| **Lead** | Empresa interesada en servicios de TrackFlow (no consumidor final) |
| **Tracker Core** | Paquete TypeScript de lógica de filtrado, búsqueda y validación |
| **Talent Pipeline** | App Next.js para gestión de candidatos en proceso de selección |
| **Carrier** | Empresa de transporte/logística (UPS, FedEx, DHL, MRW, SEUR) |