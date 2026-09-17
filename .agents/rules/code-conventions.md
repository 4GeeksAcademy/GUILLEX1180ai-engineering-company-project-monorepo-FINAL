# Code Conventions — Convenciones de Código

> **Regla:** `.agents/rules/code-conventions.md`  
> **Propósito:** Definir convenciones de estilo, nomenclatura y estructura para todo el código del monorepo.

---

## 1. TypeScript

### 1.1 Tipado

```typescript
// ✅ Correcto: Tipos explícitos, sin any
function filterByStatus(items: Candidate[], status: CandidateStatus): Candidate[] {
  return items.filter(item => item.status === status);
}

// ❌ Incorrecto: Uso de any
function filterByStatus(items: any[], status: string): any[] {
  return items.filter(item => item.status === status);
}
```

### 1.2 Genéricos

```typescript
// ✅ Correcto: Función genérica con tipo retornado explícito
function filterByCriteria<T>(items: T[], criteria: FilterCriterion<T>[]): T[] {
  // ...
}

// ❌ Incorrecto: Sin genérico, casteo manual
function filterByCriteria(items: any[], criteria: any[]): any[] {
  // ...
}
```

### 1.3 Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Interfaces | PascalCase | `Candidate`, `ApiResponse<T>` |
| Tipos unión | PascalCase | `CandidateStatus`, `LoadingState` |
| Funciones | camelCase | `filterByStatus()`, `getCandidateById()` |
| Constantes | UPPER_SNAKE_CASE | `STATUS_OPTIONS`, `STAGE_OPTIONS` |
| Archivos | kebab-case | `candidate-card.tsx`, `use-candidate.ts` |
| Carpetas | kebab-case | `talent-pipeline-tracker/` |

### 1.4 Null Safety

```typescript
// ✅ Correcto: Usar == null para capturar null y undefined
if (item.field == null) { /* null o undefined */ }

// ✅ Correcto: Optional chaining
const email = candidate?.email ?? 'sin-email@example.com';
```

### 1.5 Inmutabilidad

```typescript
// ✅ Correcto: No mutar arrays de entrada
function sortByField<T>(items: T[], field: keyof T): T[] {
  return [...items].sort(/* ... */);
}

// ❌ Incorrecto: Mutación directa
function sortByField<T>(items: T[], field: keyof T): T[] {
  return items.sort(/* ... */); // Muta el original
}
```

---

## 2. React / Next.js

### 2.1 Organización de Componentes

```
src/components/
├── ui/                    # Componentes atómicos/reutilizables
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
├── candidates/            # Componentes específicos del dominio
│   ├── CandidateCard.tsx
│   └── CandidateForm.tsx
└── layout/                # Componentes de layout
    └── Header.tsx
```

### 2.2 Client Components

```typescript
// ✅ Correcto: Solo cuando se necesita interactividad
"use client";

import { useState } from "react";

export function CandidateForm() {
  const [name, setName] = useState("");
  // ...
}
```

### 2.3 Props

```typescript
// ✅ Correcto: Interfaces para props
interface CandidateCardProps {
  candidate: Candidate;
  onStatusChange?: (id: number, status: CandidateStatus) => void;
}

export function CandidateCard({ candidate, onStatusChange }: CandidateCardProps) {
  // ...
}
```

### 2.4 Custom Hooks

```typescript
// ✅ Correcto: Hook con estado tipado y retorno explícito
interface UseCandidatesReturn {
  candidates: Candidate[];
  state: LoadingState;
  error: string | null;
  refetch: () => void;
}

export function useCandidates(): UseCandidatesReturn {
  // ...
}
```

---

## 3. CSS / Tailwind

- Preferir clases de Tailwind sobre CSS personalizado
- Solo crear clases CSS personalizadas para animaciones o estilos muy específicos
- Usar la paleta de colores de TrackFlow (`tf-blue`, `tf-accent`, etc.)

---

## 4. Estructura de Archivos

```
📁 feature-name/
├── components/       # Componentes de la feature
├── hooks/            # Hooks personalizados
├── lib/              # Lógica de negocio, API, tipos
└── types/            # Tipos específicos (opcional, puede ir en lib/)
```

---

*Fin de las convenciones de código.*