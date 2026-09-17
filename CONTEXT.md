# CONTEXT.md — TrackFlow

> Este archivo es la fuente única de verdad sobre nuestra empresa. Cualquier agente, skill o servicio debe leer esto antes de operar.
>
> ⚠️ **Regla de dominio:** Toda decisión técnica, nomenclatura y flujo debe derivarse de este contexto. No inventes datos genéricos.

---

## 1. Identidad Corporativa

| Campo | Valor |
|-------|-------|
| **Nombre comercial** | TrackFlow |
| **Año de fundación** | 2009 |
| **Sede central** | Los Ángeles, California, Estados Unidos |
| **Presencia** | Estados Unidos (Los Ángeles) y España (Zaragoza) |
| **Empleados** | ~130 |
| **Facturación anual** | ~9 millones de euros |
| **Sitio web** | https://trackflow.com |
| **Contacto comercial** | comercial@trackflow.com |
| **LinkedIn** | https://linkedin.com/company/trackflow |
| **Teléfono (EE.UU.)** | +1 213 555 0147 |
| **Teléfono (España)** | +34 976 123 456 |

## 2. Servicios

| # | Servicio | Descripción |
|---|----------|-------------|
| 1 | **Gestión de Almacenes** | Almacenamiento, picking y packing. Inventario en tiempo real. Almacenes en Los Ángeles y Zaragoza. |
| 2 | **Entregas de Última Milla** | Red de carriers certificados (UPS, FedEx, DHL, MRW, SEUR). Seguimiento unificado. Gestión de incidencias. |
| 3 | **Logística Inversa** | Gestión de devoluciones, inspección, reacondicionamiento. Integración con plataformas de venta. |

## 3. Clientes

Marcas medianas de **moda**, **electrónica** y **cosmética** que venden en línea (e-commerce).

## 4. Cobertura Geográfica

| País | Almacén | Carriers |
|------|---------|----------|
| **Estados Unidos** | Los Ángeles (California) — cobertura nacional | UPS, FedEx, DHL |
| **España** | Zaragoza (Aragón) — cobertura peninsular e islas | MRW, SEUR, DHL |

## 5. Diferenciadores Clave

1. **Operación binacional:** Único operador con infraestructura propia en EE.UU. y España
2. **+130 profesionales** dedicados a la logística
3. **Tecnología propia** para visibilidad total del inventario
4. **Especialización e-commerce** en moda, electrónica y cosmética

## 6. Stakeholders

| Nombre | Cargo | Rol en el proyecto |
|--------|-------|--------------------|
| Miguel Torres | Director Comercial | Stakeholder principal — necesita captación de leads cualificados |
| Andrés Kim | CTO | Reporte directo — supervisa TrackFlow Tech |

## 7. Departamentos Internos

| Unidad | Propósito |
|--------|-----------|
| **TrackFlow Tech** | Departamento de tecnología. Reporta al CTO Andrés Kim. |

## 8. Problema de Negocio

El sitio web corporativo actual está desactualizado. No refleja la operación binacional, no explica claramente los servicios, y no hay forma de que empresas interesadas soliciten información estructurada. Miguel Torres necesita:
- Sitio web profesional que presente los servicios
- Formulario de captación de leads cualificados
- Validación completa para filtrar leads no relevantes

## 9. Restricciones de Negocio

1. El formulario es **solo para empresas e-commerce** que buscan externalizar logística
2. Volúmenes de **0-100 envíos/mes** muestran advertencia: no son el perfil de cliente ideal
3. Política de privacidad obligatoria para envío
4. Soporte multiidioma opcional (ES/EN) por operación binacional

## 10. Stack Tecnológico del Proyecto

| Hito | Tecnología | Ubicación |
|------|------------|-----------|
| Hito 1 — Sitio Web Público | HTML5, CSS3 (Tailwind CSS CDN), JavaScript ES6+ | `uis/website/` |
| Hito 2 — Tracker Core | TypeScript ^7.0.2, Node.js 20 | `packages/tracker-core/` |
| Hito 3 — Talent Pipeline Tracker | Next.js 15.1, React 19, TypeScript 5.7+ | `uis/talent-pipeline-tracker/` |

## 11. Convenciones Técnicas

- **Frontend:** Next.js App Router, React, TypeScript
- **Gestión de estado:** Sin librerías externas (solo useState + useReducer)
- **Estilos:** Tailwind CSS
- **API:** Fetch nativo (sin axios)
- **Backend (futuro):** FastAPI centralizado en `/services/`
- **Tipado:** TypeScript strict mode, sin `any`

---

_This context is also available in [English](./CONTEXT.es.md)._
