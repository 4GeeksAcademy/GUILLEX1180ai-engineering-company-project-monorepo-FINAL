# TrackFlow Tech — Backoffice (English)

> **Location:** `uis/backoffice/`  
> **Stack:** Next.js 15.1 + React 19 + TypeScript 5.7+ + Tailwind CSS  
> **Port:** 3001  
> **Purpose:** Internal panel for TrackFlow commercial lead management.

---

## Structure

```
uis/backoffice/
├── .env.local
├── package.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── candidates/
    │       ├── [id]/
    │       │   ├── page.tsx
    │       │   └── edit/
    │       │       └── page.tsx
    │       └── new/
    │           └── page.tsx
    ├── components/
    │   ├── LoadingSpinner.tsx
    │   ├── ErrorMessage.tsx
    │   ├── StatusBadge.tsx
    │   └── LeadCard.tsx
    ├── hooks/
    │   ├── useLeads.ts
    │   └── useLead.ts
    └── lib/
        ├── types.ts
        └── api.ts
```

## Run

```bash
cd uis/backoffice
npm install
npm run dev    # → http://localhost:3001
```