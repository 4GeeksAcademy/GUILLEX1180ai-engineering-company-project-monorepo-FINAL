# Progress — TrackFlow

> **Propósito:** Estado actual de cada hito, tareas completadas y pendientes.
> **Última actualización:** 2026-09-17

---

## Estado General

| Hito | Estado | Validación |
|------|--------|------------|
| Hito 1 — Sitio Web Público | ✅ Completado | `python3 -m http.server` |
| Hito 2 — Tracker Core | ✅ Completado | `npx tsc --noEmit` |
| Hito 3 — Talent Pipeline Tracker | ✅ Completado | `npm run dev` → :3000 |
| Backoffice (extensión) | ✅ Completado | `npm run dev` → :3001 |
| Infraestructura IA | ✅ Completado | Documentación + reglas |
| Backend FastAPI | 🟡 Scaffold inicial | Pendiente de implementar |

---

## Hito 1 — Sitio Web Público (`uis/website/`)

### Completado
- [x] Landing page corporativa (`index.html`) con SEO + Schema.org
- [x] Formulario de captación de leads (`application.html`) con 12 campos
- [x] Paleta de colores TrackFlow (Tailwind CDN)
- [x] Validación JS (`validation.js`) con 8 reglas
- [x] Estilos complementarios (`styles.css`)
- [x] Advertencia de volumen bajo (0-100 envíos/mes)
- [x] Política de privacidad obligatoria
- [x] Diseño responsive
- [x] Nav fija con scroll effect

### Pendiente
- [ ] Traducción EN del sitio
- [ ] Tests E2E del formulario

---

## Hito 2 — Tracker Core (`packages/tracker-core/`)

### Completado
- [x] 24 tipos + 2 constantes (`types/models.ts`)
- [x] 10 funciones de colecciones (`utils/collections.ts`)
- [x] 8 funciones de búsqueda (`utils/search.ts`) — lineal + binaria
- [x] 14 funciones de transformación (`utils/transformations.ts`)
- [x] 10 funciones de validación (`utils/validations.ts`)
- [x] Barrel file (`src/index.ts`)
- [x] 100% funciones puras, sin `any`
- [x] 8 hallazgos de auditoría corregidos

### Pendiente
- [ ] Tests unitarios (Jest o Vitest)
- [ ] Documentación JSDoc completa

---

## Hito 3 — Talent Pipeline Tracker (`uis/talent-pipeline-tracker/`)

### Completado
- [x] 4 rutas: `/`, `/candidates/[id]`, `/candidates/new`, `/candidates/[id]/edit`
- [x] 8 componentes: LoadingSpinner, ErrorMessage, StatusBadge, CandidateCard, CandidateFilters, CandidateForm, StatusStageControl, NotesSection
- [x] 8 endpoints API (CRUD + notas)
- [x] PATCH optimista con reversion en StatusStageControl
- [x] Filtros: búsqueda, status, stage, experiencia
- [x] Paginación con `?limit=500`

### Pendiente
- [ ] Tests de integración con API real
- [ ] Manejo de paginación server-side

---

## Backoffice (`uis/backoffice/`)

### Completado
- [x] Configuración: Next.js 15.1, TypeScript strict, Tailwind (puerto 3001)
- [x] Layout con header (logo TF + navegación) + footer
- [x] Tipos: Lead (8 estados, 6 etapas), Note, helpers
- [x] API Service: fetchAPI genérico + 8 endpoints
- [x] Hooks: `useLeads()`, `useLead()`
- [x] 4 componentes: LoadingSpinner, ErrorMessage, StatusBadge, LeadCard
- [x] Página principal: listado con filtros (búsqueda, status, stage), 5 estados visuales
- [x] Detalle de lead: gradient header, StatusStageControl con PATCH optimista
- [x] Nuevo lead: formulario completo con 5 fieldsets + asignación interna
- [x] Editar lead: carga de datos existentes + update
- [x] Build exitoso (`npx next build`)
- [x] TypeScript 0 errores (`npx tsc --noEmit`)

### Pendiente
- [ ] Conexión real con API de leads
- [ ] Sección de notas en detalle del lead
- [ ] Autenticación básica

---

## Infraestructura IA

### Completado
- [x] `CONTEXT.md` actualizado con contexto real de TrackFlow
- [x] `AGENTS.md` con protocolo operativo, 9 prohibiciones, flujo pre-commit
- [x] `memory-bank/projectbrief.md`
- [x] `memory-bank/techContext.md`
- [x] `memory-bank/progress.md`
- [x] `memory-bank/trackflow-context.md` (memoria consolidada)
- [x] `.agents/rules/code-conventions.md`
- [x] `.agents/rules/stack-restrictions.md`
- [x] `.agents/rules/git-protocol.md`
- [x] `.agents/skills/candidate-curation/SKILL.md`

### Pendiente
- [ ] Más skills en `.agents/skills/` (research, data-analysis)
- [ ] Automatización de validación pre-commit (husky/lint-staged)

---

## Backend FastAPI (`services/`)

### Completado
- [x] README con propósito y estructura
- [x] README.es.md
- [x] `__init__.py` para módulo Python
- [ ] Scaffold de FastAPI (pendiente)

### Pendiente
- [ ] `services/tracker-api/main.py`
- [ ] `services/tracker-api/requirements.txt`
- [ ] Routers por dominio (records, candidates, leads)
- [ ] Modelos SQLAlchemy / Pydantic