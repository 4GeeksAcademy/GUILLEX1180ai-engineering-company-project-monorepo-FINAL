# FASE 1 — Auditoría Integral de Manejo de Errores

**Fecha:** Fase 1 completa  
**Alcance:** Todo el monorepo (3 UIs, 1 API, scripts)  
**Archivos escaneados:** ~50 archivos fuente (.ts/.tsx/.py)

---

## Resumen Ejecutivo

| Severidad | Hallazgos | Estado |
|-----------|-----------|--------|
| 🔴 CRÍTICO | 1 | Pendiente FASE 2 |
| 🟠 ALTO | 4 | Pendiente FASE 2 |
| 🟡 MEDIO | 3 | Pendiente FASE 2 |
| 🟢 BAJO | 2 | Pendiente FASE 2 |

---

## 🔴 CRÍTICO

### C1. CATCH SILENCIOSO EN BACKOFFICE — proveedor detail (`handleStatusSubmit` y `handleDelete`)

**Archivo:** `uis/backoffice/src/app/suppliers/[id]/page.tsx`  
**Categoría:** FALLOS SILENCIOSOS + ESTADOS DE ERROR AUSENTES

```javascript
// handleStatusSubmit — el usuario NO recibe feedback cuando falla
const handleStatusSubmit = async () => {
    setStatusSubmitting(true);
    try {
      await updateStatus(newStatus);
      setEditingStatus(false);
    } catch (err) {
      // ← SILENCIOSO: sin setState de error, sin UI de feedback
    } finally {
      setStatusSubmitting(false);
    }
};

// handleDelete — igual: silencioso
const handleDelete = async () => {
    ...
    try {
      await remove();
      router.push("/suppliers");
    } catch (err) {
      // ← SILENCIOSO
    }
};
```

**Problema:** Cuando `updateStatus` o `remove` fallan (error de red, 500, timeout), el usuario no ve NINGÚN mensaje de error. La operación falla silenciosamente. No existe el estado `statusError` / `deleteError` (a diferencia de la versión en `uis/application/`).  
**Impacto:** El usuario puede creer que la acción se ejecutó correctamente cuando no fue así.

---

## 🟠 ALTO

### A1. ESTADOS DE ERROR AUSENTES EN UI — backoffice supplier detail

**Archivo:** `uis/backoffice/src/app/suppliers/[id]/page.tsx`  
**Categoría:** ESTADOS DE CARGA/ERROR AUSENTES EN LA UI

A diferencia de `uis/application/src/app/suppliers/[id]/page.tsx` (que sí tiene `statusError` y `deleteError`), la versión backoffice no tiene variables de estado para errores de status/delete. No hay `<p className="text-red-600">` ni ningún elemento visual que muestre el error.

---

### A2. STATUS/STAGE CONTROL SIN FEEDBACK DE ERROR — backoffice candidates

**Archivo:** `uis/backoffice/src/app/candidates/[id]/page.tsx`  
**Categoría:** FALLOS SILENCIOSOS + ESTADOS DE ERROR AUSENTES

```javascript
const handleStatusChange = async (newStatus: LeadStatus) => {
    const prev = status;
    setStatus(newStatus);       // ← optimista: cambia inmediatamente
    setSavingStatus(true);
    try {
      await patchLead(leadId, { status: newStatus });
      onUpdate(newStatus, stage);
    } catch {
      setStatus(prev);          // ← revierte, pero NO muestra error
    } finally {
      setSavingStatus(false);
    }
};
```

**Problema:** Si `patchLead` falla, el estado revierte pero el usuario no sabe por qué. No hay variable `statusError` ni UI de error. Solo hay un "(guardando…)" como indicador de loading.  
**Mismo problema en `handleStageChange`.**

---

### A3. REINTENTO NO ESTANDARIZADO — backoffice leads page

**Archivo:** `uis/backoffice/src/app/page.tsx`  
**Categoría:** SIN LLAMADA A LA ACCIÓN (CTA)

```jsx
<ErrorMessage
  title="Error al cargar leads"
  message={error ?? "Ocurrió un error inesperado"}
/>
<div className="text-center">
  <button onClick={refetch} ...>Reintentar</button>
</div>
```

**Problema:** Usa un botón de retry separado fuera del componente `ErrorMessage` en vez de la prop `retryAction`. Inconsistente con las demás páginas (suppliers, incidents) que ya usan `retryAction={refetch}`.  
**Nota:** El componente `ErrorMessage` ya soporta `retryAction` — simplemente no se usa aquí.

---

### A4. USO DE `alert()` EN LUGAR DE UI STATE — talent-pipeline-tracker notes

**Archivo:** `uis/talent-pipeline-tracker/src/components/NotesSection.tsx`  
**Categoría:** ESTADOS DE CARGA/ERROR AUSENTES EN LA UI

```javascript
} catch (err) {
  alert(err instanceof Error ? err.message : "Error al añadir nota");  // ← alert()
}

// ...

} catch (err) {
  alert(err instanceof Error ? err.message : "Error al eliminar nota");  // ← alert()
}
```

**Problema:** `alert()` bloquea el hilo, no es consistente con el resto de la UI, y rompe la experiencia de usuario. Debería usar un estado `error` y mostrar un `<p className="text-red-600">` o el componente `ErrorMessage`.

---

## 🟡 MEDIO

### M1. PARSING FRÁGIL DE ERRORES EN LOGIN — backoffice

**Archivo:** `uis/backoffice/src/app/login/page.tsx`  
**Categoría:** CATCH DEMASIADO AMPLIO + FILTRACIÓN DE DATOS SENSIBLES

```javascript
} catch (err) {
  const message = err instanceof Error ? err.message : "Error desconocido";
  try {
    const body = JSON.parse(
      (err instanceof Error ? err.message.split(": ").slice(1).join(": ") : "{}")
    );
    if (body?.detail && Array.isArray(body.detail)) {
      setFieldErrors(body.detail as FieldError[]);
    } else {
      setError(typeof body?.detail === "string" ? body.detail : message);
    }
  } catch {
    const match = message.match(/\{.*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as ValidationErrorResponse;
        ...
      } catch { setError(message); }
    } else {
      if (message.includes("401") || message.includes("403")) { ... }
      ...
    }
  }
}
```

**Problema:** Desde que `getHumanReadableError()` fue añadido a `api.ts`, el mensaje de error ya es una cadena legible ("Solicitud inválida: ...", "Credenciales inválidas", etc.). Todo este parsing de JSON regex es ahora **innecesario y frágil** — intenta extraer JSON de algo que ya NO es JSON. Además, el fallback con `message.includes("401")`检查的是人类可读消息中的数字，如果消息变成 "Tu sesión ha expirado" 就不再匹配.

---

### M2. PARSING FRÁGIL DE ERRORES EN REGISTER — backoffice

**Archivo:** `uis/backoffice/src/app/register/page.tsx`  
**Categoría:** CATCH DEMASIADO AMPLIO + FILTRACIÓN DE DATOS SENSIBLES

```javascript
const parseError = (err: unknown): void => {
  const message = err instanceof Error ? err.message : "Error desconocido";
  const match = message.match(/\{.*\}/s);   // ← regex para extraer JSON
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed.detail)) {
        setFieldErrors(parsed.detail as FieldError[]);
        return;
      }
      ...
    } catch { /* fallback */ }
  }
  // Errores HTTP conocidos (patrón de string matching frágil)
  if (message.includes("409")) { ... }
  ...
};
```

**Problema:** Igual que M1. El `getHumanReadableError()` ya convierte 409 a "Conflicto: ...", así que `message.includes("409")` ya no funciona. El parsing regex de JSON es inútil ahora.

---

### M3. PARSING FRÁGIL EN FORGOT PASSWORD / RESET PASSWORD

**Archivos:**  
- `uis/backoffice/src/app/forgot-password/page.tsx`  
- `uis/backoffice/src/app/reset-password/page.tsx`

**Categoría:** CATCH DEMASIADO AMPLIO

Ambos usan `message.match(/\{.*\}/)` para intentar parsear JSON del mensaje de error. Con `getHumanReadableError()`, esto ya no produce resultados útiles. Además, el fallback `message.includes("Failed to fetch")` o `message.includes("TypeError")` ya no se activará porque `getHumanReadableError` convierte esos casos a mensajes descriptivos en español.

---

## 🟢 BAJO

### B1. PATRÓN DUPLICADO DE `getHumanReadableError()`

**Archivos:**  
- `uis/application/src/lib/api.ts`  
- `uis/backoffice/src/lib/api.ts`  
- `uis/talent-pipeline-tracker/src/lib/api.ts`

**Categoría:** Mantenimiento / DRY

La función `getHumanReadableError()` está copiada idénticamente en los 3 archivos `api.ts`. No es un bug pero viola DRY. Idealmente se compartiría desde `packages/shared/`, pero dado que es un módulo compartido pequeño y estable, es un problema menor.

---

### B2. SIN VALIDACIÓN DE `res.status` ANTES DE `res.json()` EN `useIncidents`

**Archivo:** `uis/backoffice/src/hooks/useIncidents.ts`  
**Categoría:** TRY/CATCH DEMASIADO AMPLIO (menor)

```javascript
if (!res.ok) {
  let detail: string;
  try {
    const body = await res.json();
    detail = body?.detail ?? `Error HTTP ${res.status}: ${res.statusText}`;
  } catch {
    const textBody = await res.text().catch(() => "");
    detail = `Error HTTP ${res.status} — ...`;
  }
  throw new Error(detail);
}
```

**Nota:** Este patrón es en realidad ACEPTABLE — intenta parsear JSON y si falla, captura el texto. Es un enfoque defensivo razonable. Solo se marca como bajo porque el fallback de texto podría exponer fragmentos del HTML de error del servidor.

---

## Cambios Previos Verificados (FASE 0)

Los siguientes cambios del bloque anterior están correctamente aplicados y son válidos:

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `uis/application/src/lib/api.ts` | `getHumanReadableError()` + sanitización | ✅ |
| `uis/application/src/hooks/useSuppliers.ts` | try/catch en mutations | ✅ |
| `uis/application/src/app/suppliers/[id]/page.tsx` | `statusError` / `deleteError` | ✅ |
| `uis/application/src/app/suppliers/page.tsx` | `retryAction` prop | ✅ |
| `uis/application/src/components/ErrorMessage.tsx` | prop `retryAction` | ✅ |
| `uis/backoffice/src/lib/api.ts` | `getHumanReadableError()` + sanitización | ✅ |
| `uis/backoffice/src/hooks/useSuppliers.ts` | try/catch en mutations | ✅ |
| `uis/backoffice/src/hooks/useLead.ts` | null check + mejora mensajes | ✅ |
| `uis/backoffice/src/hooks/useLeads.ts` | mejora mensajes | ✅ |
| `uis/backoffice/src/app/suppliers/page.tsx` | `retryAction` prop | ✅ |
| `uis/backoffice/src/app/incidents/page.tsx` | `retryAction` prop | ✅ |
| `uis/backoffice/src/components/ErrorMessage.tsx` | prop `retryAction` | ✅ |
| `uis/talent-pipeline-tracker/src/lib/api.ts` | `getHumanReadableError()` + sanitización | ✅ |
| `uis/talent-pipeline-tracker/src/hooks/useCandidate.ts` | null check + mejora mensajes | ✅ |
| `uis/talent-pipeline-tracker/src/app/page.tsx` | `retryAction` prop | ✅ |
| `uis/talent-pipeline-tracker/src/components/ErrorMessage.tsx` | prop `retryAction` | ✅ |
| `services/api/main.py` | Handler global no expone info | ✅ |
| `scripts/analyze.py` | try/except + sys.exit | ✅ |

---

## Plan FASE 2 — Refactorización

| # | Hallazgo | Archivo(s) | Acción |
|---|----------|------------|--------|
| 1 | C1 | `backoffice/.../suppliers/[id]/page.tsx` | Añadir `statusError`/`deleteError` states, mostrar errores en UI |
| 2 | A2 | `backoffice/.../candidates/[id]/page.tsx` | Añadir `statusError`/`stageError` en StatusStageControl |
| 3 | A3 | `backoffice/.../page.tsx` (leads) | Reemplazar botón standalone por `retryAction={refetch}` |
| 4 | A4 | `talent-pipeline-tracker/.../NotesSection.tsx` | Reemplazar `alert()` por estado `error` + UI inline |
| 5 | M1 | `backoffice/.../login/page.tsx` | Simplificar catch: confiar en `getHumanReadableError()` |
| 6 | M2 | `backoffice/.../register/page.tsx` | Simplificar `parseError()`: confiar en `getHumanReadableError()` |
| 7 | M3 | `backoffice/.../forgot-password/page.tsx` + `reset-password/page.tsx` | Simplificar catch blocks |
