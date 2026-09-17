# Tech Context — TrackFlow

> **Propósito:** Stack, arquitectura, convenciones y decisiones técnicas del proyecto.
> **Última actualización:** 2026-09-17

---

## 1. Stack Tecnológico

### Por Proyecto

| Proyecto | Ruta | Stack | Puerto |
|----------|------|-------|--------|
| Sitio Web Corporativo | `uis/website/` | HTML5, CSS3 (Tailwind CDN), JavaScript ES6+ | 8080 (python3) |
| Tracker Core | `packages/tracker-core/` | TypeScript ^7.0.2, Node.js 20 | — |
| Talent Pipeline Tracker | `uis/talent-pipeline-tracker/` | Next.js 15.1, React 19, TypeScript 5.7+, Tailwind CSS | 3000 |
| Backoffice | `uis/backoffice/` | Next.js 15.1, React 19, TypeScript 5.7+, Tailwind CSS | 3001 |
| Backend (futuro) | `services/` | FastAPI, Python 3.11+ | — |

### Stack Compartido

| Tecnología | Versión | Ámbito |
|------------|---------|--------|
| Node.js | 20.x | Todas las apps |
| TypeScript | 5.7+ | Strict mode, sin `any` |
| Tailwind CSS | 3.x | Único framework de estilos |
| Playground API | — | `https://playground.4geeks.com/tracker/api/v1` |

---

## 2. Decisiones de Arquitectura (ADRs)

| ID | Decisión | Justificación |
|----|----------|---------------|
| **ADR-001** | Next.js App Router para todas las apps React | Enrutamiento basado en archivos, Server Components, soporte nativo TypeScript |
| **ADR-002** | Sin librerías externas de gestión de estado | `useState` + `useReducer` cubren necesidades actuales |
| **ADR-003** | Fetch nativo para llamadas API (sin axios) | API nativa del navegador, suficiente para endpoints actuales |
| **ADR-004** | Tailwind CSS como único framework de estilos | Consistencia visual, CDN para Hito 1, PostCSS para Next.js |
| **ADR-005** | TypeScript strict mode, sin `any` | Seguridad de tipos, auto-documentación |
| **ADR-006** | FastAPI centralizado (futuro en `/services/`) | Evita microservicios prematuros; routers por dominio |
| **ADR-007** | Barrel file en packages (`src/index.ts`) | Imports limpios, encapsulación de API pública |
| **ADR-008** | 100% funciones puras en tracker-core | Testabilidad, predecibilidad, sin efectos secundarios |

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
├── CONTEXT.md                 # Fuente única de verdad
├── AGENTS.md                  # Protocolo operativo para IA
├── memory-bank/               # Banco de memoria persistente
│   ├── projectbrief.md        # (este archivo)
│   ├── techContext.md         # Stack, ADRs, convenciones
│   └── progress.md            # Estado de cada hito
├── .agents/
│   ├── rules/                 # Reglas de desarrollo
│   │   ├── code-conventions.md
│   │   ├── stack-restrictions.md
│   │   └── git-protocol.md
│   └── skills/                # Skills reutilizables
│       └── candidate-curation/SKILL.md
├── uis/
│   ├── website/               # Hito 1
│   ├── backoffice/            # Backoffice Next.js
│   └── talent-pipeline-tracker/  # Hito 3
├── packages/
│   ├── tracker-core/          # Hito 2
│   └── shared/                # Tipos compartidos
├── services/                  # Backend FastAPI (scaffold)
├── agents/                    # Agentes de IA
├── skills/                    # Skills (formato template)
├── infra/                     # Docker
├── data/                      # Datos y pipelines
├── docs/                      # Documentación
├── internal/                  # Procesos internos
├── mcps/                      # MCP servers
├── scripts/                   # Scripts de utilidad
├── shared/                    # Recursos compartidos
└── workflows/                 # n8n workflows
```