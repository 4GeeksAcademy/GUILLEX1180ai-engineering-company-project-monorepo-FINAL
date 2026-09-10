# 📋 Documentación del Proyecto — TrackFlow

> **Versión:** 1.0.0  
> **Última actualización:** Septiembre 2026  
> **Monorepo:** AI Engineering Company Project — 4Geeks Academy

---

## 📑 Índice

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Estructura del Monorepo](#3-estructura-del-monorepo)
4. [Frontend — Sitio Web (uis/website)](#4-frontend--sitio-web-uiswebsite)
5. [Formulario de Solicitud de Información](#5-formulario-de-solicitud-de-información)
6. [Validaciones y Reglas de Negocio](#6-validaciones-y-reglas-de-negocio)
7. [Schema.org — Datos Estructurados](#7-schemaorg--datos-estructurados)
8. [API Endpoints](#8-api-endpoints)
9. [Base de Datos](#9-base-de-datos)
10. [Servicios Backend](#10-servicios-backend)
11. [Agentes de IA](#11-agentes-de-ia)
12. [Infraestructura y Despliegue](#12-infraestructura-y-despliegue)
13. [Guía de Desarrollo](#13-guía-de-desarrollo)

---

## 1. Visión General del Proyecto

### 1.1 La Empresa

**TrackFlow** es una empresa de gestión de almacenes y entregas de última milla fundada en **2009** en Los Ángeles, Estados Unidos.

| Característica | Detalle |
|---|---|
| **Fundación** | 2009 |
| **Sede central** | Los Ángeles, California, EE.UU. |
| **Segunda sede** | Zaragoza, Aragón, España |
| **Empleados** | ~130 |
| **Facturación anual** | ~9 millones de euros |
| **Sitio web** | [https://trackflow.com](https://trackflow.com) |
| **Contacto comercial** | [comercial@trackflow.com](mailto:comercial@trackflow.com) |

### 1.2 Servicios

1. **Gestión de Almacenes** — Almacenamiento, picking y packing, inventario en tiempo real. Almacenes en Los Ángeles y Zaragoza.
2. **Entregas de Última Milla** — Red de carriers certificados (UPS, FedEx, DHL, MRW, SEUR), seguimiento unificado, gestión de incidencias.
3. **Logística Inversa** — Gestión de devoluciones, inspección y reacondicionamiento, integración con plataformas de venta.

### 1.3 Clientes

Marcas medianas de **moda, electrónica y cosmética** que venden en línea (e-commerce).

### 1.4 Stakeholder Principal

**Miguel Torres** — Director Comercial de TrackFlow. Necesita:
- Un sitio web profesional que presente los servicios
- Un formulario para capturar leads calificados de empresas que buscan externalizar logística

### 1.5 Tech Stack

| Tecnología | Versión / Detalle |
|---|---|
| **HTML5** | Semántico con ARIA |
| **CSS** | Tailwind CSS (CDN) + `styles.css` complementario |
| **JavaScript** | Vanilla JS (ES5/ES6), `'use strict'` |
| **Fuentes** | Google Fonts — Inter (400, 500, 600, 700, 800) |
| **Schema.org** | JSON-LD para Organization |
| **Serving** | `npx serve` o `python3 -m http.server` |
| **Contenedor** | Docker + Nginx Alpine |

---

## 2. Arquitectura del Sistema

### 2.1 Estado Actual (Hito 1)

```
┌─────────────────────────────────────────────────────────┐
│                    Navegador Web                          │
│                                                           │
│  ┌──────────────┐    ┌──────────────┐                    │
│  │  index.html   │    │ application  │                    │
│  │  (Landing)    │◄──►│   .html      │                    │
│  │               │    │  (Formulario)│                    │
│  └──────┬───────┘    └──────┬───────┘                    │
│         │                   │                             │
│         └─────────┬─────────┘                             │
│                   │                                       │
│          ┌────────┴────────┐                              │
│          │   validation.js  │  ←──  Lógica de validación  │
│          └────────┬────────┘                              │
│                   │                                       │
│          ┌────────┴────────┐                              │
│          │   styles.css     │  ←──  Estilos adicionales   │
│          └─────────────────┘                              │
│                                                           │
│    CDN: Tailwind CSS + Google Fonts (Inter)              │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Arquitectura Futura (Próximos Hitos)

```
┌──────────────────────────────────────────────────────────────────┐
│                        Navegador Web                              │
├──────────────────────────────────────────────────────────────────┤
│  uis/website/        uis/backoffice/                              │
│  (Sitio público)     (Panel admin)                                │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────────────┐
│                    API Gateway / Load Balancer                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ services/admin- │  │ services/leads- │  │ services/data-  │  │
│  │ api             │  │ api             │  │ processor       │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                     │           │
│           └────────┬───────────┴─────────────────────┘           │
│                    │                                              │
│  ┌─────────────────┴─────────────────────────────────────────┐  │
│  │                   Base de Datos                              │  │
│  │              (PostgreSQL / MongoDB)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ agents/         │  │ skills/         │  │ mcps/           │  │
│  │ (Agentes IA)    │  │ (Capacidades)   │  │ (MCP Servers)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ workflows/      │  │ data/           │  │ packages/       │  │
│  │ (n8n / orquest.)│  │ (Pipelines)     │  │ (Tipos/SDKs)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura del Monorepo

```
/
├── 📄 CONTEXT.md                          ← Contexto de la empresa asignada
├── 📄 CONTEXT-trackflow.es.md             ← Contexto específico de TrackFlow (ES)
├── 📄 CONTEXT.es.md / CONTEXT.md          ← Placeholders del template
├── 📄 README.md / README.es.md            ← Guía general del monorepo
│
├── 📁 .devcontainer/                      ← Configuración de Codespaces
│   ├── devcontainer.json                  ← Imagen universal + extensiones
│   └── post-create.sh                     ← Script post-creación (pip, uv, pnpm)
│
├── 📁 uis/                                ← Interfaces de usuario
│   ├── README.md                          ← Documentación general de UIs
│   └── website/                           ← Sitio web público de TrackFlow
│       ├── index.html                     ← Landing page
│       ├── application.html               ← Formulario de solicitud
│       ├── styles.css                     ← Estilos complementarios
│       ├── validation.js                  ← Validación del formulario
│       └── package.json                   ← Scripts npm (serve)
│
├── 📁 services/                           ← Backend (APIs y workers)
│   └── README.md                          ← Plantilla para futuros servicios
│
├── 📁 agents/                             ← Agentes de IA
│   ├── _template/                         ← Template para nuevos agentes
│   │   ├── agent.py
│   │   └── tests/
│   └── tools/                             ← Herramientas compartidas
│
├── 📁 skills/                             ← Capacidades reutilizables de agentes
│   ├── _template/
│   ├── code-review/
│   ├── data-analysis/
│   │   ├── resources/common_metrics.md
│   │   └── scripts/pandas_clean.py
│   └── research/
│
├── 📁 mcps/                               ← MCP (Model Context Protocol) Servers
│   └── README.md
│
├── 📁 data/                               ← Datos y pipelines
│   ├── eval/
│   ├── pipelines/
│   ├── process/
│   └── raw/
│
├── 📁 packages/                           ← Paquetes compartidos
│   └── shared/
│       ├── package.json                   ← @repo/shared-types
│       └── types/index.ts                 ← Tipos base (Id, BaseEntity)
│
├── 📁 workflows/                          ← Orquestación (n8n)
│
├── 📁 infra/                              ← Infraestructura
│   ├── Dockerfile.web                     ← Docker para sitio estático (Nginx)
│   └── README.md / README.es.md           ← Guía de despliegue
│
├── 📁 scripts/                            ← Scripts auxiliares
│
├── 📁 shared/                             ← Recursos compartidos
│
├── 📁 internal/                           ← Documentación interna
│
└── 📁 docs/                               ← Documentación técnica
```

---

## 4. Frontend — Sitio Web (uis/website)

### 4.1 Archivos del Sitio

| Archivo | Propósito | Tecnología |
|---|---|---|
| `index.html` | Landing page principal | HTML5 semántico + Tailwind CSS CDN + styles.css |
| `application.html` | Formulario de captura de leads | HTML5 semántico + Tailwind CSS CDN + styles.css + validation.js |
| `styles.css` | Estilos complementarios a Tailwind | CSS3 con animaciones, validación, accesibilidad |
| `validation.js` | Lógica de validación del formulario | JavaScript Vanilla (ES5/ES6) |
| `package.json` | Configuración npm para servir el sitio | Scripts: `start`, `dev` → `npx serve .` |

### 4.2 Paleta de Colores (Tailwind)

| Clase | Color | Hex | Uso |
|---|---|---|---|
| `tf-blue` | Azul primario | `#1e40af` | Botones, headers, enlaces |
| `tf-blue-light` | Azul claro | `#3b82f6` | Hover, focus rings |
| `tf-blue-dark` | Azul oscuro | `#1e3a8a` | Hover de botones |
| `tf-accent` | Ámbar | `#f59e0b` | Acentos, badges |
| `tf-accent-dark` | Ámbar oscuro | `#d97706` | Hover de acentos |
| `tf-gray` | Gris fondo | `#f8fafc` | Fondos de sección |
| `tf-dark` | Azul casi negro | `#0f172a` | Títulos, footer |

### 4.3 Páginas

#### 4.3.1 Landing Page (`index.html`)

**URL canónica:** `https://www.trackflow.com`

Secciones (en orden):
1. **Header** — Logo + navegación (Inicio, Servicios, Cobertura, Contacto) + menú móvil hamburguesa
2. **Hero** — "Logística que escala con tu e-commerce" + CTA "Solicitar información"
3. **Servicios** — 3 artículos: Gestión de Almacenes, Última Milla, Logística Inversa
4. **Cobertura** — 2 columnas: Estados Unidos (Los Ángeles) y España (Zaragoza)
5. **Por qué TrackFlow** — 4 beneficios: Operación binacional, +130 profesionales, Tecnología propia, Especialización e-commerce
6. **Contacto** — Email, teléfonos Los Ángeles y Zaragoza
7. **Footer** — © 2025 TrackFlow + LinkedIn

**Atributos de accesibilidad:**
- Skip link (`a.skip-link`)
- ARIA: `aria-label`, `aria-expanded`, `aria-controls`, `aria-hidden`, `aria-describedby`, `role`
- Menú con `role="list"` y navegación semántica
- `focus-visible` para teclado

#### 4.3.2 Formulario de Solicitud (`application.html`)

**URL canónica:** `https://www.trackflow.com/application.html`

**Estructura:**
```
├── Header (logo + volver al inicio)
├── Main
│   ├── Título: "Cuéntanos sobre tu empresa"
│   └── Formulario (id="lead-form", novalidate)
│       ├── Fieldset 1: Datos de la Empresa
│       ├── Fieldset 2: Detalles Operativos
│       ├── Fieldset 3: Preferencias de Servicio
│       ├── Consentimiento (privacidad)
│       ├── Mensaje de éxito
│       └── Botones: Limpiar / Enviar
└── Footer
```

---

## 5. Formulario de Solicitud de Información

### 5.1 Campos del Formulario

| # | Campo | ID | Tipo | Obligatorio | Validación |
|---|-------|----|------|-------------|------------|
| 1 | Nombre de la empresa | `companyName` | text | ✅ | Mín. 2 caracteres |
| 2 | Persona de contacto | `contactPerson` | text | ✅ | Mín. 2 palabras (nombre y apellido) |
| 3 | Email corporativo | `email` | email | ✅ | Formato email válido (@ y dominio) |
| 4 | Teléfono | `phone` | tel | ✅ | Debe comenzar con `+` + código país |
| 5 | Sitio web | `website` | url | ❌ | URL válida (http/https) |
| 6 | País de operación principal | `country` | select | ✅ | Estados Unidos / España / Ambos / Otro |
| 7 | Tipo de producto | `productType` | select | ✅ | Moda / Electrónica / Cosmética / Alimentación / Otro |
| 8 | Volumen mensual estimado | `monthlyVolume` | select | ✅ | 0-100 / 101-500 / 501-2000 / 2000+ / No estoy seguro |
| 9 | ¿Trabajas con otro 3PL? | `has3pl` | radio | ✅ | Sí / No / Estoy evaluando opciones |
| 10 | Servicios de interés | `services` | checkbox | ✅ | Almacenaje / Última milla / Logística inversa |
| 11 | Comentarios | `comments` | textarea | ❌ | Máx. 500 caracteres (contador visible) |
| 12 | Acepto política de privacidad | `privacy` | checkbox | ✅ | Debe estar marcado |

### 5.2 Mensajes de Error

| Campo | Mensaje de Error Exacto |
|---|---|
| `companyName` | "El nombre de la empresa debe tener al menos 2 caracteres" |
| `contactPerson` | "Ingresa nombre y apellido del contacto" |
| `email` | "Ingresa un email corporativo válido (ejemplo: nombre@empresa.com)" |
| `phone` | "El teléfono debe incluir código de país (ejemplo: +1 213 555 0147)" |
| `website` | "Si incluyes sitio web, debe ser una URL válida" |
| `country` | "Selecciona el país de operación principal" |
| `productType` | "Selecciona el tipo de producto que manejas" |
| `monthlyVolume` | "Selecciona el volumen mensual estimado" |
| `has3pl` | "Indica si actualmente trabajas con otro proveedor logístico" |
| `services` | "Selecciona al menos un servicio de interés" |
| `comments` | "Los comentarios no pueden exceder 500 caracteres (quedan X)" |
| `privacy` | "Debes aceptar la política de privacidad para continuar" |

Cada mensaje se muestra en un elemento `<p>` con:
- `id="err-NOMBREDELCAMPO"`
- `class="text-red-600 text-sm mt-1 hidden"`
- `aria-live="polite"` (accesibilidad)

### 5.3 Mensaje de Éxito

```
¡Gracias por tu interés en TrackFlow!
Hemos recibido tu solicitud. Nuestro equipo comercial revisará tu información
y te contactará en las próximas 24-48 horas para agendar una llamada y
conocer tus necesidades logísticas en detalle.

Si tienes alguna consulta urgente, escríbenos directamente a comercial@trackflow.com
```

### 5.4 Regla de Negocio — Volumen Bajo

Si el usuario selecciona **"0-100 envíos/mes"**, se muestra una advertencia:

> **Volumen reducido** — Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?

### 5.5 Datos Enviados (Simulación)

Al hacer submit, se recopila un objeto JSON:

```json
{
  "companyName": "ModaTrend S.L.",
  "contactPerson": "Ana García",
  "email": "ana@modatrend.com",
  "phone": "+34 612 345 678",
  "website": "https://modatrend.com",
  "country": "España",
  "productType": "Moda",
  "monthlyVolume": "101-500",
  "has3pl": "no",
  "services": ["almacenaje", "ultima-milla"],
  "comments": "Buscamos un operador logístico en Zaragoza",
  "privacy": true
}
```

---

## 6. Validaciones y Reglas de Negocio

### 6.1 validation.js — Arquitectura

```
validation.js
├── 'use strict'
├── DOMContentLoaded
│   ├── getEl()              → Helper: document.getElementById
│   ├── showError()           → Muestra error (remove hidden)
│   ├── hideError()           → Oculta error (add hidden)
│   ├── addSuccessClass()     → Añade .input-success, quita .input-error
│   ├── addErrorClass()       → Añade .input-error, quita .input-success
│   ├── removeValidationClasses() → Limpia ambas clases
│   ├── getErrorId()          → Obtiene aria-describedby
│   ├── fields               → Mapa de elementos del formulario
│   ├── Contador caracteres  → Event listener en comments
│   ├── Funciones validación → Una por campo
│   ├── Validators array     → Lista ordenada de validaciones
│   ├── validateAll()        → Itera validators, retorna boolean
│   ├── Eventos blur/input   → Validación en tiempo real
│   ├── Eventos change       → Para selects, radios, checkboxes
│   ├── Submit handler       → validateAll + simulación envío
│   └── Reset handler        → Limpia todo
```

### 6.2 Validaciones Específicas

| Función | Campo | Regla |
|---|---|---|
| `validateCompanyName()` | companyName | `value.length >= 2` |
| `validateContactPerson()` | contactPerson | `words.length >= 2` (split por whitespace) |
| `validateEmail()` | email | Regex: `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` |
| `validatePhone()` | phone | Regex: `/^\+[0-9]{1,3}[-\s./0-9]{5,20}$/` |
| `validateWebsite()` | website | Si no vacío: `new URL(value)` con protocolo http/https |
| `validateCountry()` | country | `value !== ""` |
| `validateProductType()` | productType | `value !== ""` |
| `validateMonthlyVolume()` | monthlyVolume | `value !== ""` + activa `volume-warning` si "0-100" |
| `validateHas3pl()` | has3pl | Algún radio checked |
| `validateServices()` | services | Algún checkbox checked |
| `validatePrivacy()` | privacy | `checked === true` |
| `validateComments()` | comments | `value.length <= 500` + contador dinámico |

### 6.3 Estilos de Validación (styles.css)

| Clase | Input correcto | Input con error |
|---|---|---|
| `.input-success` | `border-color: #22c55e` (verde) | — |
| | `background-color: #f0fdf4` | — |
| `.input-error` | — | `border-color: #ef4444` (rojo) |
| | — | `background-color: #fef2f2` |
| `.btn-loading` | Oculta texto, muestra spinner con `::after` | — |

### 6.4 Animaciones CSS

- `@keyframes fadeInUp` — Para entradas de secciones
- `@keyframes fadeIn` — Fade general
- `@keyframes pulse-dot` — Spinner de carga
- `prefers-reduced-motion` — Respeta preferencias de accesibilidad

---

## 7. Schema.org — Datos Estructurados

### 7.1 JSON-LD Implementado

El marcado Schema.org está presente en ambas páginas (`index.html` y `application.html`):

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TrackFlow",
  "description": "Gestión de almacenes y entregas de última milla para e-commerce",
  "url": "https://trackflow.com",
  "foundingDate": "2009",
  "address": [
    {
      "@type": "PostalAddress",
      "addressCountry": "US",
      "addressLocality": "Los Ángeles",
      "addressRegion": "California"
    },
    {
      "@type": "PostalAddress",
      "addressCountry": "ES",
      "addressLocality": "Zaragoza",
      "addressRegion": "Aragón"
    }
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-213-555-0147",
    "contactType": "sales",
    "availableLanguage": ["Spanish", "English"]
  },
  "sameAs": ["https://linkedin.com/company/trackflow"],
  "areaServed": [
    { "@type": "Country", "name": "Estados Unidos" },
    { "@type": "Country", "name": "Spain" }
  ]
}
```

### 7.2 Especificaciones

| Propiedad | Valor | Notas |
|---|---|---|
| `@type` | `Organization` | Tipo de entidad |
| `url` | `https://trackflow.com` | Sin `www.` |
| `foundingDate` | `2009` | Año de fundación |
| `address` | Array de 2 `PostalAddress` | US (Los Ángeles, California) + ES (Zaragoza, Aragón) |
| `contactPoint` | Objeto único (no array) | Sales, +1-213-555-0147, idiomas Spanish/English |
| `areaServed` | Array de 2 `Country` | "Estados Unidos" y "Spain" (texto expandido) |
| `sameAs` | Perfil de LinkedIn | `https://linkedin.com/company/trackflow` |

---

## 8. API Endpoints

### 8.1 Estado Actual

Actualmente **no hay API endpoints implementados**. El formulario realiza una **simulación de envío** del lado del cliente con `setTimeout(1500ms)`.

### 8.2 Estructura Preparada para Futuros Endpoints

| Método | Endpoint | Propósito | Estado |
|---|---|---|---|
| `POST` | `/api/leads` | Recibir datos del formulario y almacenar lead | 🔜 Futuro |
| `GET` | `/api/leads` | Listar leads (panel admin) | 🔜 Futuro |
| `GET` | `/api/health` | Health check del servicio | 🔜 Futuro |

### 8.3 Payload Esperado para POST `/api/leads`

```json
{
  "companyName": "string (min 2 chars)",
  "contactPerson": "string (min 2 words)",
  "email": "string (valid email)",
  "phone": "string (starts with +)",
  "website": "string | null (valid URL or null)",
  "country": "Estados Unidos | España | Ambos | Otro",
  "productType": "Moda | Electrónica | Cosmética | Alimentación | Otro",
  "monthlyVolume": "0-100 | 101-500 | 501-2000 | 2000+ | no-estoy-seguro",
  "has3pl": "si | no | evaluando",
  "services": ["almacenaje", "ultima-milla", "logistica-inversa"],
  "comments": "string | null (max 500 chars)",
  "privacy": true
}
```

### 8.4 Ubicación de Futuros Endpoints

Los servicios backend se alojarán en `services/` siguiendo la estructura:
- `services/leads-api/` — API REST para gestión de leads
- `services/admin-api/` — API para panel de administración
- `services/data-processor/` — Workers de procesamiento

---

## 9. Base de Datos

### 9.1 Estado Actual

Actualmente **no hay base de datos**. Los datos del formulario se recopilan en consola (`console.log`) y se descartan tras simular el envío.

### 9.2 Modelo de Datos Planeado

```sql
-- Tabla: leads
CREATE TABLE leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name    VARCHAR(100) NOT NULL,
    contact_person  VARCHAR(80) NOT NULL,
    email           VARCHAR(254) NOT NULL,
    phone           VARCHAR(30) NOT NULL,
    website         VARCHAR(2048),
    country         VARCHAR(20) NOT NULL,
    product_type    VARCHAR(20) NOT NULL,
    monthly_volume  VARCHAR(20) NOT NULL,
    has_3pl         VARCHAR(20),
    services        TEXT[],           -- Array: almacenaje, ultima-milla, logistica-inversa
    comments        TEXT,
    privacy         BOOLEAN NOT NULL,
    status          VARCHAR(20) DEFAULT 'nuevo',  -- nuevo, contactado, calificado, convertido
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at);
CREATE INDEX idx_leads_country ON leads(country);
```

### 9.3 Tablas Futuras

| Tabla | Propósito |
|---|---|
| `leads` | Leads capturados del formulario |
| `contacts` | Contactos de empresas |
| `companies` | Empresas clientes |
| `users` | Usuarios del sistema (admin) |
| `shipments` | Envíos gestionados |
| `contracts` | Contratos de servicio |

---

## 10. Servicios Backend

### 10.1 Estado Actual

La carpeta `services/` está vacía (solo READMEs). No hay servicios backend implementados.

### 10.2 Servicios Planeados

| Servicio | Propósito | Tecnología sugerida |
|---|---|---|
| `leads-api` | API REST para CRUD de leads | Python (FastAPI) / Node.js (Express) |
| `admin-api` | API para panel de administración | Python (FastAPI) / Node.js (Express) |
| `data-processor` | Worker para procesar leads | Python (Celery / RQ) |
| `notifications` | Envío de emails automáticos | Python (SendGrid / SMTP) |

### 10.3 Estructura de un Servicio

```
services/
└── leads-api/
    ├── README.md
    ├── requirements.txt / package.json
    ├── main.py / index.js
    ├── routers/
    ├── models/
    ├── schemas/
    ├── services/
    └── tests/
```

---

## 11. Agentes de IA

### 11.1 Estado Actual

La carpeta `agents/` contiene solo la plantilla `_template/agent.py` y un directorio `tools/` vacío.

### 11.2 Agentes Planeados

| Agente | Propósito |
|---|---|
| `sales-assistant` | Asistente para el equipo comercial |
| `lead-qualifier` | Clasificación y calificación de leads automática |
| `support-agent` | Atención al cliente / FAQ |
| `onboarding-agent` | Guía para nuevos clientes |

### 11.3 Skills Definidos

| Skill | Ubicación | Propósito |
|---|---|---|
| `data-analysis` | `skills/data-analysis/` | Análisis de datos con pandas |
| `code-review` | `skills/code-review/` | Revisión de código |
| `research` | `skills/research/` | Investigación y búsqueda |

### 11.4 Tipos Compartidos (`packages/shared/types/index.ts`)

```typescript
export type Id = string;

export interface BaseEntity {
  id: Id;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 12. Infraestructura y Despliegue

### 12.1 Opciones de Despliegue

| Método | Comando / Configuración | URL |
|---|---|---|
| **Local (serve)** | `npx serve uis/website` | `http://localhost:3000` |
| **Local (Python)** | `python3 -m http.server 8080 -d uis/website` | `http://localhost:8080` |
| **Docker** | `docker build -f infra/Dockerfile.web -t trackflow-web . && docker run -p 8080:80 trackflow-web` | `http://localhost:8080` |
| **GitHub Pages** | Workflow Actions en `.github/workflows/deploy-pages.yml` | `https://<user>.github.io/<repo>` |
| **Netlify** | Importar repo → Publish directory: `uis/website` | `https://<site>.netlify.app` |
| **Vercel** | Importar repo → Root directory: `uis/website` | `https://<site>.vercel.app` |

### 12.2 Dockerfile.web

```dockerfile
FROM nginx:alpine

COPY uis/website /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 12.3 Devcontainer

**Archivo:** `.devcontainer/devcontainer.json`
- Imagen: `mcr.microsoft.com/devcontainers/universal:2`
- Extensiones VS Code: Python, Pylance, Jupyter, Docker, ESLint, Prettier, GitLens, Error Lens, 4Geeks Student
- Post-create: Instala Corepack, pnpm, uv, sincroniza entorno Python

### 12.4 Recursos CDN

| Recurso | URL |
|---|---|
| Tailwind CSS | `https://cdn.tailwindcss.com` |
| Google Fonts (Inter) | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap` |

---

## 13. Guía de Desarrollo

### 13.1 Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Opcional: Node.js para `npx serve`
- Opcional: Docker para contenedor

### 13.2 Comandos Útiles

```bash
# Servir el sitio localmente
cd uis/website && npx serve .

# O con Python
cd uis/website && python3 -m http.server 8080

# Construir y ejecutar Docker
docker build -f infra/Dockerfile.web -t trackflow-web .
docker run -p 8080:80 trackflow-web

# Validar HTML (opcional)
npx html-validator-cli uis/website/index.html
npx html-validator-cli uis/website/application.html
```

### 13.3 Convenciones de Código

- **HTML**: Semántico (header, nav, main, section, article, footer), ARIA attributes
- **CSS**: Mobile-first, clases Tailwind + CSS personalizado en `styles.css`
- **JS**: `'use strict'`, funciones nombradas, validación en tiempo real (blur + input)
- **Formulario**: `novalidate` (desactiva validación nativa del browser), validación JS personalizada

### 13.4 Próximos Pasos (Hito 2 en adelante)

1. ⬜ Implementar API REST en `services/leads-api/` (FastAPI / Express)
2. ⬜ Conectar formulario a API (reemplazar simulación con `fetch`)
3. ⬜ Persistir leads en base de datos (PostgreSQL / MongoDB)
4. ⬜ Crear panel de administración en `uis/backoffice/`
5. ⬜ Desarrollar agente `lead-qualifier` para clasificación automática
6. ⬜ Configurar CI/CD con GitHub Actions
7. ⬜ Añadir autenticación y autorización
8. ⬜ Implementar flujos n8n en `workflows/`

---

> 📝 **Nota:** Este documento se actualizará a medida que el proyecto evolucione a través de los hitos del programa AI Engineering de 4Geeks Academy.