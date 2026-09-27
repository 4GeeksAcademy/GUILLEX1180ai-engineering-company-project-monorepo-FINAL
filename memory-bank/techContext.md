# Tech Context — TrackFlow

> **Propósito:** Stack, arquitectura, convenciones y decisiones técnicas del proyecto.
> **Última actualización:** 2026-09-27

---

## 1. Stack Tecnológico

### Por Proyecto

| Proyecto | Ruta | Stack | Puerto |
|----------|------|-------|--------|
| Sitio Web Corporativo | `uis/website/` | HTML5, CSS3 (Tailwind CDN), JavaScript ES6+ | 8080 (python3) |
| Tracker Core | `packages/tracker-core/` | TypeScript ^7.0.2, Node.js 20 | — |
| Talent Pipeline Tracker | `uis/talent-pipeline-tracker/` | Next.js 15.1, React 19, TypeScript 5.7+, Tailwind CSS | 3000 |
| Backoffice | `uis/backoffice/` | Next.js 15.1, React 19, TypeScript 5.7+, Tailwind CSS | 3001 |
| Application (Sitio Corporativo) | `uis/application/` | Next.js 15.1, React 19, TypeScript 5.7+, Tailwind CSS | 3002 |
| Backend API | `services/api/` | FastAPI 0.115.0, Python 3.11+, Pydantic v2, TinyDB | 8001 |

### Stack Compartido

| Tecnología | Versión | Ámbito |
|------------|---------|--------|
| Node.js | 20.x | Todas las apps JS/TS |
| TypeScript | 5.7+ | Strict mode, sin `any` |
| Tailwind CSS | 3.x | Único framework de estilos |
| Python | 3.11+ | Backend API |
| FastAPI | 0.115.0 | Backend API |
| Pydantic | 2.10.0 | Validación de schemas |
| TinyDB | 4.8.0 | Base de datos JSON (desarrollo) |
| Docker | latest | Contenedores y orquestación |
| Playground API | — | `https://playground.4geeks.com/tracker/api/v1` |

### Stack de Infraestructura

| Componente | Tecnología | Archivo |
|------------|------------|---------|
| Orquestación local | Docker Compose | `docker-compose.yml` |
| Contenedores | Docker multi-stage builds | `services/Dockerfile`, `uis/*/Dockerfile` |
| Dev Environment | DevContainer (Codespaces) | `.devcontainer/` |
| Testing JS/TS | Jest | `packages/*/jest.config.js` |
| Testing Python | pytest | `services/api/tests/` |

---

## 2. Decisiones de Arquitectura (ADRs)

| ID | Decisión | Justificación |
|----|----------|---------------|
| **ADR-001** | Next.js App Router para todas las apps React | Enrutamiento basado en archivos, Server Components, soporte nativo TypeScript |
| **ADR-002** | Sin librerías externas de gestión de estado | `useState` + `useReducer` cubren necesidades actuales |
| **ADR-003** | Fetch nativo para llamadas API (sin axios) | API nativa del navegador, suficiente para endpoints actuales |
| **ADR-004** | Tailwind CSS como único framework de estilos | Consistencia visual, CDN para Hito 1, PostCSS para Next.js |
| **ADR-005** | TypeScript strict mode, sin `any` | Seguridad de tipos, auto-documentación |
| **ADR-006** | FastAPI centralizado en `services/api/` | Evita microservicios prematuros; routers por dominio |
| **ADR-007** | Barrel file en packages (`src/index.ts`) | Imports limpios, encapsulación de API pública |
| **ADR-008** | 100% funciones puras en tracker-core | Testabilidad, predecibilidad, sin efectos secundarios |
| **ADR-009** | Schemas modulares en `services/api/schemas/` | Separación estricta input/output, mantenibilidad, reutilización |
| **ADR-010** | TinyDB para desarrollo (JSON files) | Simplicidad, zero-config, suficiente para prototipado; migración a SQLAlchemy planeada |
| **ADR-011** | `response_model` explícito en todos los endpoints | Cero datos sensibles expuestos, tipado en documentación OpenAPI |
| **ADR-012** | Componentes compartidos en `packages/shared/` | Eliminación de código duplicado (~286 líneas), fuente única de verdad |
| **ADR-013** | `next/font/google` para optimización de fuentes | Eliminación de render-blocking, self-hosted en producción |
| **ADR-014** | `next/dynamic` para lazy loading pesado | Reducción de LCP (11.7s → 1.9s en Incidents) |

---

## 3. Convenciones Técnicas

### TypeScript
- Strict mode obligatorio
- Sin `any` — tipos explícitos y genéricos
- Interfaces en PascalCase, funciones en camelCase
- Constantes en UPPER_SNAKE_CASE
- Archivos en kebab-case

### React / Next.js
- App Router obligatorio
- Componentes en `src/components/`
- Tipos en `src/lib/types.ts`
- Hooks personalizados en `src/hooks/`
- `"use client"` solo en componentes interactivos

### Estado y Datos
- `useState` / `useReducer` — sin Redux, Zustand, Jotai
- Fetch nativo — sin axios, React Query, SWR
- Formularios con `useState` + validación manual — sin Formik

### Estilos
- Tailwind CSS — sin Bootstrap, MUI, styled-components
- Paleta TrackFlow: tf-blue, tf-blue-light, tf-blue-dark, tf-accent, tf-gray, tf-dark

---

## 4. Estructura del Monorepo

```
/
├── CONTEXT.md                    # Fuente única de verdad
├── AGENTS.md                     # Protocolo operativo para IA
├── docker-compose.yml            # Orquestación Docker local
├── memory-bank/                  # Banco de memoria persistente
│   ├── projectbrief.md
│   ├── techContext.md            # (este archivo)
│   ├── progress.md
│   └── trackflow-context.md
├── .agents/
│   ├── rules/                    # Reglas de desarrollo
│   └── skills/                   # Skills reutilizables
├── uis/
│   ├── website/                  # Hito 1 — HTML/CSS/JS puro
│   ├── backoffice/               # Next.js — Admin (puerto 3001)
│   ├── application/              # Next.js — Sitio corporativo (puerto 3002)
│   └── talent-pipeline-tracker/  # Hito 3 — Next.js (puerto 3000)
├── packages/
│   ├── tracker-core/             # Hito 2 — TypeScript puro
│   └── shared/                   # Componentes, hooks, tipos compartidos
├── services/
│   └── api/                      # Backend FastAPI (puerto 8001)
│       ├── main.py               # Entry point
│       ├── config.py             # Settings con pydantic-settings
│       ├── models.py             # Re-export desde schemas/
│       ├── schemas/              # Schemas Pydantic modulares
│       │   ├── auth.py
│       │   ├── suppliers.py
│       │   ├── incidents.py
│       │   ├── leads.py
│       │   ├── common.py
│       │   └── enums.py
│       ├── routes/               # Routers por dominio
│       └── tests/                # Tests pytest
├── agents/                       # Agentes de IA
├── skills/                       # Skills (formato template)
├── infra/                        # Docker, deploy configs
├── data/                         # Datos y pipelines
├── docs/                         # Documentación
├── internal/                     # Procesos internos
├── mcps/                         # MCP servers
├── scripts/                      # Scripts de utilidad
├── shared/                       # Recursos compartidos
└── workflows/                    # n8n workflows
```