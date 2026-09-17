# Project Brief — TrackFlow

> **Propósito:** Documento raíz del memory-bank. Define el "por qué" del proyecto: la empresa, el problema de negocio, los stakeholders y los objetivos.
> **Última actualización:** 2026-09-17

---

## 1. Identidad de la Empresa

| Campo | Valor |
|-------|-------|
| **Nombre** | TrackFlow |
| **Fundación** | 2009 |
| **Sede** | Los Ángeles, California, EE.UU. |
| **Presencia** | EE.UU. (Los Ángeles) y España (Zaragoza) |
| **Empleados** | ~130 |
| **Facturación** | ~9M €/año |
| **Sitio web** | https://trackflow.com |
| **Contacto** | comercial@trackflow.com |

### Servicios

1. **Gestión de Almacenes** — Almacenamiento, picking & packing, inventario en tiempo real
2. **Última Milla** — Carriers certificados (UPS, FedEx, DHL, MRW, SEUR), seguimiento unificado
3. **Logística Inversa** — Devoluciones, inspección, reacondicionamiento

### Clientes

Marcas medianas de **moda**, **electrónica** y **cosmética** que venden en línea (e-commerce).

---

## 2. Problema de Negocio

El sitio web corporativo actual está desactualizado. No refleja la operación binacional, no explica claramente los servicios, y no hay forma de que empresas interesadas soliciten información estructurada.

---

## 3. Objetivos del Proyecto

| # | Objetivo | Hito |
|---|----------|------|
| 1 | Sitio web profesional que presente los servicios de TrackFlow | Hito 1 — `uis/website/` |
| 2 | Formulario de captación de leads cualificados con validación completa | Hito 1 — `application.html` |
| 3 | Librería TypeScript de lógica de negocio (búsqueda, filtrado, validación) | Hito 2 — `packages/tracker-core/` |
| 4 | Aplicación de reclutamiento (Talent Pipeline Tracker) con Next.js | Hito 3 — `uis/talent-pipeline-tracker/` |
| 5 | Backoffice interno para gestión de leads comerciales (TrackFlow Tech) | Extensión — `uis/backoffice/` |
| 6 | Infraestructura de IA (banco de memoria, reglas, skills, protocolo de agente) | Base — `memory-bank/`, `.agents/`, `AGENTS.md` |

---

## 4. Stakeholders

| Nombre | Cargo | Rol |
|--------|-------|-----|
| **Miguel Torres** | Director Comercial | Necesita captación de leads cualificados |
| **Andrés Kim** | CTO | Supervisa TrackFlow Tech |

---

## 5. Restricciones de Negocio

1. El formulario es **solo para empresas e-commerce** que buscan externalizar logística
2. Volúmenes de **0-100 envíos/mes** → mostrar advertencia
3. Política de privacidad obligatoria para envío
4. Soporte multiidioma opcional (ES/EN) por operación binacional

---

## 6. Cobertura Geográfica

| País | Almacén | Carriers |
|------|---------|----------|
| **Estados Unidos** | Los Ángeles (California) | UPS, FedEx, DHL |
| **España** | Zaragoza (Aragón) | MRW, SEUR, DHL |

---

## 7. Diferenciadores Clave

1. Operación binacional — único operador con infraestructura propia en EE.UU. y España
2. +130 profesionales dedicados a la logística
3. Tecnología propia para visibilidad total del inventario
4. Especialización e-commerce en moda, electrónica y cosmética