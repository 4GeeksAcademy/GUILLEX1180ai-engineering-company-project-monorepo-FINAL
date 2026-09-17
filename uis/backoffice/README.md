# TrackFlow Tech — Backoffice

> **Ubicación:** `uis/backoffice/`  
> **Stack:** Next.js 15.1 + React 19 + TypeScript 5.7+ + Tailwind CSS  
> **Puerto:** 3001 (para no interferir con el talent-pipeline-tracker en :3000)  
> **Propósito:** Panel interno de TrackFlow para gestión de leads comerciales capturados desde el formulario público.

---

## Estructura

```
uis/backoffice/
├── .env.local                        # NEXT_PUBLIC_API_URL
├── package.json                      # Dependencias y scripts
├── next.config.js
├── tailwind.config.ts                # Paleta TrackFlow (tf-blue, tf-accent, etc.)
├── postcss.config.js
├── tsconfig.json                     # Strict mode, @/ → ./src/*
└── src/
    ├── app/
    │   ├── globals.css               # Tailwind directives
    │   ├── layout.tsx                # Layout con header/nav/footer
    │   ├── page.tsx                  # / — Listado de leads
    │   └── candidates/
    │       ├── [id]/
    │       │   ├── page.tsx          # /candidates/[id] — Detalle
    │       │   └── edit/
    │       │       └── page.tsx      # /candidates/[id]/edit — Editar
    │       └── new/
    │           └── page.tsx          # /candidates/new — Nuevo
    ├── components/
    │   ├── LoadingSpinner.tsx        # Spinner con mensaje opcional
    │   ├── ErrorMessage.tsx          # Caja de error con botón "volver"
    │   ├── StatusBadge.tsx           # Badge de estado/etapa con colores
    │   └── LeadCard.tsx              # Tarjeta de lead para el grid
    ├── hooks/
    │   ├── useLeads.ts               # Carga de lista de leads
    │   └── useLead.ts                # Carga individual de lead
    └── lib/
        ├── types.ts                  # Tipos (Lead, Note, LoadingState, etc.)
        └── api.ts                    # Fetch API centralizado (sin axios)
```

---

## Dominio: Leads Comerciales (TrackFlow)

A diferencia del `talent-pipeline-tracker` (candidatos de reclutamiento), este backoffice gestiona **leads comerciales** — empresas interesadas en los servicios logísticos de TrackFlow que llegan a través del formulario en `uis/website/application.html`.

### Tipos de Entidad

| Entidad | Descripción |
|---------|-------------|
| `Lead` | Empresa interesada en servicios de TrackFlow |
| `Note` | Nota asociada a un lead |

### Estados del Lead

| Estado | Descripción |
|--------|-------------|
| `new` | Recién capturado, sin contactar |
| `contacted` | Equipo comercial contactó |
| `qualified` | Lead cualificado como cliente potencial |
| `proposal` | Enviada propuesta comercial |
| `negotiation` | En negociación |
| `on_hold` | En pausa |
| `converted` | Convertido en cliente |
| `lost` | Perdido |

### Etapas del Lead

| Etapa | Descripción |
|-------|-------------|
| `inbound` | Llegada inicial |
| `discovery` | Descubrimiento de necesidades |
| `demo` | Demostración de servicios |
| `contract` | Negociación contractual |
| `onboarding` | Incorporación como cliente |
| `active` | Cliente activo |

---

## Convenciones

- **Sin librerías externas de estado** — Solo `useState` / `useReducer`
- **Fetch nativo** — Sin axios
- **Tailwind CSS** — Sin CSS-in-JS
- **Paleta de colores** — Usar variables `tf-*` definidas en `tailwind.config.ts`
- **Client Components** con `"use client"` solo donde hay interactividad

---

## Ejecución

```bash
cd uis/backoffice
npm install
npm run dev    # → http://localhost:3001
```