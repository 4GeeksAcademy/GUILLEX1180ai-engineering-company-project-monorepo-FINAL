# Optimización de Rendimiento: Caching y Carga Diferida

**Branch:** `feature/caching-optimisation`  
**Fecha:** 2025  
**Área:** `uis/backoffice/` — Next.js 15 + React 19

---

## Resumen Ejecutivo

Se implementaron optimizaciones de rendimiento en el frontend de **backoffice** (Next.js App Router) aplicando dos técnicas clave:

1. **Carga Diferida (Lazy Loading)** con `next/dynamic` — 2 candidatos
2. **Memoización (`useMemo`)** — 1 oportunidad genuina con 2 memorizaciones

> **Objetivo:** Reducir el tamaño del JavaScript principal (main bundle), mejorar el tiempo de carga inicial (LCP/FCP) y evitar recálculos innecesarios en renderizados frecuentes.

---

## Cambios Detallados

### 1. Lazy Loading — IncidentDashboard (Candidato 1)

**Problema:** La página `/incidents/summary` contenía todo el dashboard inline (~300 líneas JSX): KPI cards, progress bars, categorías, sucursales, estados y orígenes. Este código se descargaba como parte del bundle principal aunque el usuario rara vez visitaba esta ruta.

**Solución:**

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `incidents/summary/page.tsx` | **Modificado** | Se reemplazó el rendering inline con `dynamic(() => import("./IncidentDashboard"))` con skeleton loading |
| `incidents/summary/IncidentDashboard.tsx` | **Nuevo** | Componente self-contained con todo el dashboard extraído |

**Código clave:**

```tsx
// incidents/summary/page.tsx
const IncidentDashboard = dynamic(
  () => import("./IncidentDashboard").then((m) => m.IncidentDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
        ))}
      </div>
    ),
  }
);
```

**Beneficio estimado:** ~40-60 KB menos en el bundle principal (con dependencias de gráficos/charts que se cargan bajo demanda).

---

### 2. Lazy Loading — NewLeadForm (Candidato 2)

**Problema:** La página `/candidates/new` contenía un formulario largo (~280 líneas) con 6 fieldsets, múltiples campos, radio buttons, checkboxes y selects. Este formulario se incluía en el bundle de la ruta principal aunque solo se accede cuando se crea un lead nuevo.

**Solución:**

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `candidates/new/page.tsx` | **Modificado** | Se reemplazó el `<form>` inline con `dynamic(() => import("./NewLeadForm"))` + skeleton de 5 fieldsets |
| `candidates/new/NewLeadForm.tsx` | **Nuevo** | Componente self-contained con el formulario completo, manejo de estado local, y callbacks `onCreated`/`onError` |

**Código clave:**

```tsx
// candidates/new/page.tsx
const NewLeadForm = dynamic(
  () => import("./NewLeadForm").then((m) => m.NewLeadForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
        ))}
      </div>
    ),
  }
);
```

**Beneficio estimado:** ~30-40 KB menos en el bundle principal. El formulario solo se descarga cuando el usuario hace clic en "Nuevo Lead".

---

### 3. Memoización con `useMemo` — IncidentDashboard

**Problema:** En cada render del dashboard, se recalculaban operaciones de ordenamiento y porcentaje sobre arreglos de categorías y sucursales. Estos cálculos se repetían innecesariamente cuando cambiaba cualquier estado local (hover, filtros, etc.).

**Solución:** Se añadieron 2 llamadas a `useMemo` con dependencias correctas:

```tsx
// incidents/summary/IncidentDashboard.tsx

// Memoización 1: Categorías ordenadas por cantidad
const sortedCategories = useMemo(() => {
  if (!summary?.by_category || summary.total === 0) return [];
  return Object.entries(summary.by_category)
    .map(([name, count]) => ({
      name,
      count,
      pct: ((count / summary.total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);
}, [summary.by_category, summary.total]);

// Memoización 2: Sucursales ordenadas por cantidad
const sortedBranches = useMemo(() => {
  if (!summary?.by_branch || summary.total === 0) return [];
  return Object.entries(summary.by_branch)
    .map(([name, count]) => ({
      name,
      count,
      pct: ((count / summary.total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);
}, [summary.by_branch, summary.total]);
```

**¿Por qué estas dependencias?**  
- `summary.by_category` y `summary.by_branch` son objetos que solo cambian cuando llegan nuevos datos del API
- `summary.total` se usa para calcular porcentajes
- Se evita recalcular en cada render cuando otros estados (ej. hover) cambian

**Beneficio:** Evita ~2 operaciones de sort + map + percentage calc por render innecesario.

---

## Archivos Modificados (Resumen)

```
uis/backoffice/src/app/
├── incidents/summary/
│   ├── page.tsx              ← Modificado (dynamic import)
│   └── IncidentDashboard.tsx ← NUEVO (dashboard extraído + useMemo)
└── candidates/new/
    ├── page.tsx              ← Modificado (dynamic import)
    └── NewLeadForm.tsx       ← NUEVO (formulario extraído)
```

---

## Patrón Utilizado

### `next/dynamic` con `ssr: false`

```tsx
const Component = dynamic(() => import("./Component").then(m => m.Component), {
  ssr: false,  // No pre-renderizar en el servidor
  loading: () => <SkeletonFallback />,  // Estado de carga visual
});
```

**¿Por qué `ssr: false`?**  
Ambos componentes usan hooks de cliente (`useState`, `useEffect`, hooks de auth) y dependen de `localStorage`. No pueden pre-renderizarse en el servidor.

**¿Por qué Skeleton en vez de `LoadingSpinner`?**  
El skeleton imita la forma final del componente, proporcionando una experiencia de carga más fluida y reduciendo el CLS (Cumulative Layout Shift).

---

## Beneficios Esperados

| Métrica | Impacto |
|---------|---------|
| **Bundle size (main)** | Reducción estimada de ~70-100 KB |
| **FCP (First Contentful Paint)** | Mejora al cargar menos JS crítico |
| **LCP (Largest Contentful Paint)** | Skeleton aparece más rápido que el form completo |
| **CLS (Cumulative Layout Shift)** | Mínimo — skeleton reserva espacio |
| **TTI (Time to Interactive)** | Mejora al posponer carga de código no crítico |

---

## Notas para el Equipo

- **Extender el patrón:** Otros candidatos futuros incluyen páginas con gráficos pesados o tablas con muchos datos.
- **No abusar de `ssr: false`:** Solo usar cuando el componente genuinamente necesita APIs del navegador. Si el componente puede pre-renderizarse, dejar SSR habilitado.
- **Skeletons:** Mantener un estilo consistente con `animate-pulse rounded-lg border border-gray-200 bg-gray-50` para coherencia visual.
- **useMemo:** Solo memoizar cálculos costosos. No memoizar valores primitivos simples o JSX que React ya maneja eficientemente.
