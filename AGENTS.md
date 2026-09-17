# AGENTS.md — Protocolo Operativo para Agentes de IA

> **Versión:** 1.0  
> **Última actualización:** 2026-09-17  
> **Propósito:** Definir el protocolo obligatorio que todo agente de IA debe seguir al operar en este repositorio.

---

## ⚠️ Regla de Oro

> **No escribas código sin haber leído el contexto primero.**
> Este repositorio representa una empresa real (TrackFlow) con reglas de negocio, restricciones y arquitectura específicas. Violar este protocolo puede romper la estructura del proyecto y generar código inválido.

---

## 1. Archivos de Lectura Obligatoria al Iniciar

Antes de cualquier edición, el agente DEBE leer los siguientes archivos en este orden:

| Orden | Archivo | Razón |
|:-----:|---------|-------|
| 1 | `CONTEXT.md` | Fuente única de verdad sobre la empresa, sus reglas de negocio y restricciones |
| 2 | `AGENTS.md` | *(Este archivo)* — Protocolo operativo actual |
| 3 | `memory-bank/projectbrief.md` | Documento raíz del memory bank — identidad, objetivos, stakeholders |
| 4 | `memory-bank/techContext.md` | Stack tecnológico, ADRs y convenciones técnicas |
| 5 | `memory-bank/progress.md` | Estado actual de cada hito y tareas pendientes |
| 6 | `memory-bank/trackflow-context.md` | Memoria consolidada con decisiones de arquitectura, hitos completados y restricciones vigentes |
| 7 | `README.md` | Guía de estructura del monorepo y propósito de cada carpeta |
| 8 | `.agents/rules/*.md` | Todas las reglas específicas de desarrollo |
| 9 | `package.json` (del área afectada) | Dependencias y scripts del proyecto a modificar |

> 💡 **Si el agente no puede leer estos archivos por cualquier razón, debe detenerse y reportar el error.** No continuar.

---

## 1-b. Archivos Protegidos — No Modificar Sin Autorización

Los siguientes archivos están **protegidos** y no deben ser modificados sin autorización explícita del Tech Lead. Cualquier cambio requiere justificación documentada en el commit.

| Archivo | Razón de la Protección |
|---------|----------------------|
| `CONTEXT.md` | Fuente única de verdad de la empresa — cambios afectan todo el contexto del proyecto |
| `CONTEXT.es.md` | Versión en español del contexto |
| `AGENTS.md` | Protocolo operativo de todos los agentes — modificarlo cambia las reglas del juego |
| `memory-bank/projectbrief.md` | Documento raíz del memory bank |
| `memory-bank/techContext.md` | Stack y ADRs — cambios afectan decisiones arquitectónicas |
| `memory-bank/progress.md` | Estado de avance del proyecto |
| `memory-bank/trackflow-context.md` | Memoria consolidada — los agentes dependen de ella |
| `.agents/rules/*.md` | Reglas de desarrollo compartidas |
| `.agents/skills/*/SKILL.md` | Skills reutilizables documentadas |
| `packages/shared/types/index.ts` | Tipos compartidos entre paquetes |
| `package.json` (raíz) | Configuración del monorepo |
| `README.md` / `README.es.md` | Documentación de entrada del proyecto |

> ⚠️ **Regla:** Si necesitas modificar un archivo protegido, documéntalo en el commit con la razón explícita. Los cambios no autorizados serán revertidos.

---

## 2. Flujo de Operación Estándar

### 2.1 Antes de Escribir Código

```
┌─────────────────────────────────────────────┐
│ 1. LEER contexto (archivos obligatorios)    │
│    └→ Confirmar que entendiste la empresa   │
├─────────────────────────────────────────────┤
│ 2. IDENTIFICAR la carpeta destino según     │
│    la capa del monorepo:                    │
│    - UI pública       → uis/website/        │
│    - UI interna       → uis/backoffice/     │
│    - App Next.js      → uis/*/              │
│    - Lógica pura      → packages/*/         │
│    - Backend API      → services/           │
│    - Agente IA        → agents/             │
│    - Workflow         → workflows/          │
├─────────────────────────────────────────────┤
│ 3. VERIFICAR que no duplicas funcionalidad  │
│    existente (buscar en packages/shared/)   │
├─────────────────────────────────────────────┤
│ 4. PLANIFICAR antes de implementar:         │
│    - ¿Qué tipos necesito?                   │
│    - ¿Qué componentes/hooks?                │
│    - ¿Qué endpoints?                        │
│    - ¿Cómo fluyen los datos?                │
└─────────────────────────────────────────────┘
```

### 2.2 Durante la Implementación

- Usar **TypeScript strict mode**, sin `any`
- **Sin librerías externas de gestión de estado** (solo `useState`/`useReducer`)
- **Fetch nativo** para llamadas API (no axios)
- **Tailwind CSS** como único framework de estilos
- Componentes en `src/components/`, tipos en `src/lib/types.ts` (o similar)
- Funciones **100% puras** en `packages/*/`

### 2.3 Antes de Hacer Commit — Proceso de Entrega

```
┌──────────────────────────────────────────────────┐
│ 1. ✅ VALIDAR TypeScript                          │
│    → npx tsc --noEmit (0 errores)                │
├──────────────────────────────────────────────────┤
│ 2. ✅ EJECUTAR pruebas (si existen)               │
│    → npm test                                    │
├──────────────────────────────────────────────────┤
│ 3. ✅ VERIFICAR lint (si configurado)             │
│    → npm run lint                                │
├──────────────────────────────────────────────────┤
│ 4. ✅ REVISAR que el código refleja el contexto   │
│    - ¿Los nombres de entidades son de TrackFlow? │
│    - ¿Las reglas de negocio están aplicadas?     │
│    - ¿No hay datos genéricos?                    │
├──────────────────────────────────────────────────┤
│ 5. ✅ REVISAR contra las reglas de .agents/rules/ │
├──────────────────────────────────────────────────┤
│ 6. ✅ DOCUMENTAR cambios en el mensaje de commit  │
│    Formato: [HitoX] tipo: descripción breve      │
│    Ejemplo: [Hito3] fix: paginación de API       │
└──────────────────────────────────────────────────┘
```

---

## 3. Prohibiciones Explícitas

| # | Prohibición | Consecuencia |
|:-:|-------------|--------------|
| 1 | ❌ Escribir código sin leer `CONTEXT.md` | Código fuera de contexto, rechazado |
| 2 | ❌ Usar `any` en TypeScript | Violación de strict mode |
| 3 | ❌ Instalar librerías de estado externas (Redux, Zustand, etc.) | Dependencia innecesaria |
| 4 | ❌ Usar axios en lugar de fetch | Inconsistencia técnica |
| 5 | ❌ Modificar la estructura de carpetas del monorepo | Desorganización del proyecto |
| 6 | ❌ Hacer commit sin pasar el proceso de entrega | Código no validado |
| 7 | ❌ Inventar datos de empresa que no están en CONTEXT.md | Ruido contextual |
| 8 | ❌ Mezclar responsabilidades (ej: lógica de negocio en componentes) | Código no mantenible |
| 9 | ❌ Ignorar la advertencia de volumen bajo "0-100 envíos/mes" | Violación de regla de negocio |

---

## 4. Estructura de Commits

### Formato

```
[HitoN] tipo(área): descripción breve

- Detalle del cambio
- Impacto en otros módulos (si aplica)
```

### Tipos permitidos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `refactor` | Refactorización sin cambio funcional |
| `test` | Pruebas |
| `chore` | Mantenimiento, configuraciones |

### Ejemplos

```
[Hito1] feat: formulario de leads con validación completa
[Hito2] fix: búsqueda binaria corrige left/right mid
[Hito3] feat: StatusStageControl con PATCH optimista
```

---

## 5. Rol del Agente en este Repositorio

El agente de IA opera como **miembro del equipo TrackFlow Tech** y debe:

1. **Tech Lead consciente:** Conoce la arquitectura, el stack y las restricciones
2. **Contextualizado:** No es un agente genérico — trabaja para TrackFlow
3. **Disciplinado:** Sigue el proceso de entrega sin excepciones
4. **Documentador:** Deja rastro de decisiones (ADR) en `docs/` o `memory-bank/`

---

*Fin del protocolo — Todo agente debe cumplirlo.*