# SKILL: Candidato Curation — Curación de Leads de Candidatos

> **Ubicación:** `.agents/skills/candidate-curation/SKILL.md`  
> **Versión:** 1.0  
> **Propósito:** Skill reutilizable para validar, filtrar y cualificar leads/candidatos en el pipeline de TrackFlow, aplicando reglas de negocio del contexto de la empresa.

---

## Descripción

Esta skill encapsula el flujo de curación de leads/candidatos desde que entran por el formulario público (`uis/website/application.html`) o por la API (`uis/talent-pipeline-tracker/`) hasta que son cualificados como aptos para el pipeline de seguimiento. Aplica las reglas de negocio definidas en `CONTEXT.md` y las validaciones de `packages/tracker-core/`.

---

## Inputs

| Input | Tipo | Obligatorio | Descripción |
|-------|------|:-----------:|-------------|
| `candidateData` | `CandidateFormData` | ✅ | Datos crudos del candidato/lead (nombre, email, teléfono, puesto, experiencia) |
| `mode` | `"strict" \| "permissive"` | ✅ | `strict` = rechaza si no pasa validaciones de negocio; `permissive` = solo valida formato |
| `options` | `CurationOptions` | ❌ | Opciones adicionales (ver abajo) |

### Tipos Asociados

```typescript
interface CandidateFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title: string;
  years_experience?: number;
}

interface CurationOptions {
  validateEmail?: boolean;       // default: true
  validatePhone?: boolean;       // default: true
  minExperience?: number;        // default: 1 (para modo strict)
  maxNameLength?: number;        // default: 100
}
```

---

## Output

| Output | Tipo | Descripción |
|--------|------|-------------|
| `result` | `CurationResult` | Resultado de la curación |

```typescript
interface CurationResult {
  /** true si el candidato pasa todas las validaciones */
  passed: boolean;
  /** Errores de validación (si passed=false) */
  errors: string[];
  /** Advertencias (no bloqueantes, ej: volumen bajo) */
  warnings: string[];
  /** Datos normalizados y listos para insertar */
  normalizedData: CandidateFormData | null;
  /** Metadatos de la curación */
  meta: {
    curatedAt: string;           // ISO timestamp
    mode: "strict" | "permissive";
    validationSource: string;    // "tracker-core" o "inline"
  };
}
```

---

## Criterios de Aceptación

### CA-001: Validación de Formato
- [ ] `first_name` ≥ 2 caracteres → error si no cumple
- [ ] `last_name` ≥ 2 caracteres → error si no cumple
- [ ] `email` debe tener formato válido (`^[^\s@]+@[^\s@]+\.[^\s@]+$`) → error si no
- [ ] `phone` si se proporciona: ≥ 7 dígitos después de limpiar caracteres especiales → error si no
- [ ] `job_title` ≥ 2 caracteres → error si no cumple
- [ ] `years_experience` si se proporciona: ≥ 0 → error si negativo

### CA-002: Validación de Negocio (modo strict)
- [ ] `email` es obligatorio y debe ser corporativo (contiene `@` con dominio válido) → error si no
- [ ] `phone` es obligatorio → error si no se proporciona
- [ ] `years_experience` ≥ 1 (mínimo 1 año para considerar) → advertencia si 0, error si < 0

### CA-003: Normalización de Datos
- [ ] Trim en todos los campos de texto
- [ ] Email en minúsculas
- [ ] `years_experience` convertido a número (si viene como string)
- [ ] Teléfono sin espacios extra alrededor

### CA-004: Flujo Completo (modo strict)
```
Input:  { first_name: "A", last_name: "", email: "invalido", years_experience: -1 }
Output: { passed: false, errors: [...], normalizedData: null }
```

```
Input:  { first_name: "Ana", last_name: "García", email: "ana@empresa.com", phone: "+34 612345678", job_title: "Dev", years_experience: 3 }
Output: { passed: true, errors: [], warnings: [], normalizedData: {...} }
```

### CA-005: Casos Límite
- [ ] Campos vacíos → error específico por campo
- [ ] Email sin @ → error de email inválido
- [ ] Teléfono con caracteres no numéricos → limpiar y validar
- [ ] Experiencia = 0 en modo strict → advertencia (no error)

---

## Algoritmo / Flujo

```
┌──────────────────────────────────────┐
│ 1. NORMALIZAR datos de entrada       │
│    - Trim de textos                  │
│    - Email a lowercase               │
│    - years_experience a número       │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 2. VALIDAR formato (siempre)         │
│    - Usar validateCandidateForm()    │
│      de tracker-core                 │
│    - Acumular errores en array       │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 3. VALIDAR negocio (solo strict)     │
│    - ¿Email válido y presente?       │
│    - ¿Teléfono presente?             │
│    - ¿Experiencia >= 1 año?          │
│    - Acumular errores/advertencias   │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 4. CONSTRUIR resultado               │
│    - passed = errors.length === 0    │
│    - normalizedData o null           │
│    - Timestamp ISO                   │
└──────────────────────────────────────┘
```

---

## Dependencias

| Dependencia | ¿Obligatoria? | Propósito |
|-------------|:-------------:|-----------|
| `packages/tracker-core/` | ✅ | `validateCandidateForm()`, tipos `CandidateFormData` |
| `CONTEXT.md` | ✅ | Reglas de negocio de TrackFlow |
| `packages/shared/types/` | ❌ | Tipos compartidos (si existen) |

---

## Ejemplo de Uso

```typescript
import { validateCandidateForm } from "tracker-core";
import type { CandidateFormData } from "tracker-core";

function curateCandidate(data: CandidateFormData, mode: "strict" | "permissive"): CurationResult {
  // 1. Normalizar
  const normalized: CandidateFormData = {
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone?.trim(),
    job_title: data.job_title.trim(),
    years_experience: data.years_experience != null ? Number(data.years_experience) : undefined,
  };

  // 2. Validar formato
  const formatValidation = validateCandidateForm(normalized);
  const errors: string[] = [...formatValidation.errors];

  // 3. Validar negocio (strict)
  const warnings: string[] = [];
  if (mode === "strict") {
    if (!normalized.phone) errors.push("El teléfono es obligatorio para avanzar a entrevista técnica");
    if (normalized.years_experience != null && normalized.years_experience < 1) {
      warnings.push("Experiencia menor a 1 año — el candidato podría no estar preparado para entrevista técnica");
    }
  }

  // 4. Resultado
  return {
    passed: errors.length === 0,
    errors,
    warnings,
    normalizedData: errors.length === 0 ? normalized : null,
    meta: {
      curatedAt: new Date().toISOString(),
      mode,
      validationSource: "tracker-core",
    },
  };
}
```

---

## Integración con el Monorepo

| Componente | Cómo se integra |
|------------|-----------------|
| `uis/website/application.html` | Los leads se capturan aquí, luego pasan por curación antes de crear candidato |
| `uis/talent-pipeline-tracker/` | Al crear/editar candidatos, se aplica esta skill para validar |
| `packages/tracker-core/` | Proporciona `validateCandidateForm()` y tipos |

---

*Fin de la skill de Candidate Curation.*