# Documento Consolidado de los 3 Hitos — TrackFlow

> **Fecha de creación:** 14 de septiembre de 2026  
> **Versión del documento:** 1.0  
> **Estado:** Completo — Proyecto finalizado

---

## Tabla de Contenidos

1. [Resumen General del Proyecto](#1-resumen-general-del-proyecto)
2. [Hito 1: Sitio Web Público de TrackFlow](#2-hito-1-sitio-web-público-de-trackflow)
   - 2.1 Información General de la Empresa
   - 2.2 Estructura del Proyecto
   - 2.3 Archivos Clave
   - 2.4 Configuración Técnica
   - 2.5 Formulario y Validaciones
   - 2.6 Accesibilidad, SEO y Schema.org
3. [Hito 2: Tracker Core — Lógica TypeScript Pura](#3-hito-2-tracker-core--lógica-typescript-pura)
   - 3.1 Tecnologías y Diseño
   - 3.2 Estructura del Paquete
   - 3.3 Tipos y Modelos
   - 3.4 Colecciones (Filtrado, Ordenamiento, Paginación)
   - 3.5 Búsqueda (Lineal y Binaria)
   - 3.6 Transformaciones y Reportes
   - 3.7 Validaciones
   - 3.8 Auditoría de Código
   - 3.9 Especificaciones Técnicas
4. [Hito 3: Talent Pipeline Tracker — Next.js](#4-hito-3-talent-pipeline-tracker--nextjs)
   - 4.1 Tecnologías
   - 4.2 Estructura del Proyecto
   - 4.3 Tipos y API
   - 4.4 Hooks Personalizados
   - 4.5 Componentes
   - 4.6 Páginas y Navegación
   - 4.7 Endpoints de API
   - 4.8 Manejo de Estados
5. [Anexos](#5-anexos)

---

## 1. Resumen General del Proyecto

### 1.1 Visión General

| Aspecto | Detalle |
|---------|---------|
| **Empresa** | TrackFlow — Logística para e-commerce |
| **Año de fundación** | 2009 |
| **Sede central** | Los Ángeles, California, Estados Unidos |
| **Presencia** | Estados Unidos y España |
| **Stack tecnológico** | HTML, CSS, JavaScript, TypeScript, Next.js 15, React 19, Tailwind CSS |
| **Stakeholder principal** | Miguel Torres — Director Comercial |

### 1.2 Los 3 Hitos

| Hito | Nombre | Tecnología Principal | Ubicación |
|------|--------|---------------------|-----------|
| **Hito 1** | Sitio Web Público de TrackFlow | HTML + CSS + JS (Tailwind CSS) | `uis/website/` |
| **Hito 2** | Tracker Core — Lógica TypeScript Pura | TypeScript ^7.0.2 | `packages/tracker-core/` |
| **Hito 3** | Talent Pipeline Tracker — Next.js | Next.js 15.1.0 + React 19 | `uis/talent-pipeline-tracker/` |

---

## 2. Hito 1: Sitio Web Público de TrackFlow

> **Documento original:** `Documentos_Hito1.md` — Versión 1.0  
> **Estado:** ✅ Completo y listo para revisión

### 2.1 Información General de la Empresa

#### Identidad Corporativa

| Campo | Detalle |
|-------|---------|
| **Nombre comercial** | TrackFlow |
| **Año de fundación** | 2009 |
| **Sede central** | Los Ángeles, California, Estados Unidos |
| **Presencia internacional** | Estados Unidos y España |

#### Servicios Principales

1. **Gestión de Almacenes**
   - Almacenamiento, picking y packing
   - Inventario en tiempo real
   - Almacenes en **Los Ángeles** (California, EE.UU.) y **Zaragoza** (Aragón, España)

2. **Entregas de Última Milla**
   - Servicio de entrega puerta a puerta
   - Cobertura en EE.UU. y España
   - Logística optimizada para e-commerce

3. **Logística Inversa**
   - Gestión de devoluciones
   - Procesamiento de retornos
   - Control de inventario de productos devueltos

#### Stakeholder Principal

| Campo | Detalle |
|-------|---------|
| **Nombre** | Miguel Torres |
| **Cargo** | Director Comercial |
| **Rol** | Stakeholder principal y responsable de la toma de decisiones comerciales |

### 2.2 Estructura del Proyecto

```
uis/website/
├── index.html          # Landing page principal (~800 líneas)
├── application.html    # Formulario de leads (~450 líneas)
├── styles.css          # Estilos complementarios a Tailwind CSS (~150 líneas)
├── validation.js       # Lógica de validación en tiempo real (~500 líneas)
└── package.json        # Configuración del paquete
```

### 2.3 Archivos Clave

#### `index.html` — Landing Page Principal

- **Diseño:** Mobile-first con Tailwind CSS vía CDN
- **Tipografía:** Google Fonts (Inter, pesos 400-800)
- **Secciones:**
  - Header con navegación fija y menú móvil
  - Hero section con CTA principal
  - Servicios (Gestión de Almacenes, Última Milla, Logística Inversa)
  - Cobertura geográfica (EE.UU. y España)
  - Contacto
  - Footer
- **Características:** Schema.org JSON-LD, Smooth scrolling, Skip links de accesibilidad

#### `application.html` — Formulario de Leads

- **Propósito:** Captación de leads comerciales
- **Estructura del formulario:**
  - **Fieldset 1:** Datos de la empresa
  - **Fieldset 2:** Detalles operativos
  - **Fieldset 3:** Preferencias de servicio
  - **Consentimiento:** Política de privacidad
- **Características técnicas:**
  - Diseño responsive
  - Validación en tiempo real (JavaScript)
  - Mensajes de error descriptivos
  - Contador de caracteres para comentarios
  - Alerta de volumen bajo (0-100 envíos/mes)
  - Mensaje de éxito simulado tras envío

#### `styles.css` — Estilos Complementarios

- Reset y estilos base
- Foco accesible (`:focus-visible`)
- Animaciones (fadeInUp, fadeIn, pulse-dot)
- Transiciones suaves
- Estados de validación: `.input-success`, `.input-error`
- Estilo para botón de carga (`.btn-loading`)

#### `validation.js` — Lógica de Validación

- Validación de cada campo individual
- Eventos `blur` e `input` para validación en tiempo real
- Eventos `change` para selects, radios y checkboxes
- Contador de caracteres para comentarios
- Alerta de volumen bajo (0-100 envíos/mes)
- Validación completa antes del envío
- Simulación de envío con spinner de carga
- Reset del formulario y limpieza de estados

### 2.4 Configuración Técnica y Ejecución

#### Comando de Ejecución

```bash
cd uis/website
python3 -m http.server 3000
```

#### Configuración de Tailwind CSS

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'tf-blue': '#1e40af',
        'tf-blue-light': '#3b82f6',
        'tf-blue-dark': '#1e3a8a',
        'tf-accent': '#f59e0b',
        'tf-accent-dark': '#d97706',
        'tf-gray': '#f8fafc',
        'tf-dark': '#0f172a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

#### Paleta de Colores

| Nombre | HEX | Uso |
|--------|-----|-----|
| tf-blue | `#1e40af` | Color principal de la marca |
| tf-blue-light | `#3b82f6` | Hover states, focus rings |
| tf-blue-dark | `#1e3a8a` | Hover states para botones |
| tf-accent | `#f59e0b` | Acentos, highlights |
| tf-accent-dark | `#d97706` | Hover para acentos |
| tf-gray | `#f8fafc` | Fondos suaves |
| tf-dark | `#0f172a` | Texto principal, headers |

### 2.5 Especificaciones del Formulario y Reglas de Validación

#### Fieldset 1: Datos de la Empresa

| Campo | ID | Tipo | Obligatorio | Validación |
|-------|----|------|-------------|------------|
| Nombre de la empresa | `companyName` | text | ✅ | Mínimo 2 caracteres, máximo 100 |
| Persona de contacto | `contactPerson` | text | ✅ | Mínimo 2 palabras (nombre y apellido) |
| Email corporativo | `email` | email | ✅ | Formato de email válido |
| Teléfono | `phone` | tel | ✅ | Formato internacional (+código) |
| Sitio web | `website` | url | ❌ | URL válida (http/https) |

#### Fieldset 2: Detalles Operativos

| Campo | ID | Tipo | Obligatorio | Opciones |
|-------|----|------|-------------|----------|
| País de operación | `country` | select | ✅ | Estados Unidos, España, Ambos, Otro |
| Tipo de producto | `productType` | select | ✅ | Moda, Electrónica, Cosmética, Alimentación, Otro |
| Volumen mensual | `monthlyVolume` | select | ✅ | 0-100, 101-500, 501-2000, 2000+, No estoy seguro |
| ¿Trabajas con otro 3PL? | `has3pl` | radio | ✅ | Sí, No, Estoy evaluando opciones |

#### Fieldset 3: Preferencias de Servicio

| Campo | ID | Tipo | Obligatorio | Opciones |
|-------|----|------|-------------|----------|
| Servicios de interés | `services` | checkbox | ✅ (mín. 1) | Almacenaje, Última milla, Logística inversa |
| Comentarios | `comments` | textarea | ❌ | Máximo 500 caracteres |

#### Reglas de Validación por Campo

| Campo | Regla | Mensaje de Error |
|-------|-------|-------------------|
| `companyName` | `value.trim().length >= 2` | "El nombre de la empresa debe tener al menos 2 caracteres" |
| `contactPerson` | `words.length >= 2` | "Ingresa nombre y apellido del contacto" |
| `email` | `emailRegex.test(value)` | "Ingresa un email corporativo válido" |
| `phone` | `phoneRegex` con formato `+código` | "El teléfono debe incluir código de país" |
| `website` | URL válida (http/https) | "Si incluyes sitio web, debe ser una URL válida" |
| `country` | `value !== ""` | "Selecciona el país de operación principal" |
| `productType` | `value !== ""` | "Selecciona el tipo de producto que manejas" |
| `monthlyVolume` | `value !== ""` | "Selecciona el volumen mensual estimado" |
| `has3pl` | Al menos un radio seleccionado | "Indica si actualmente trabajas con otro proveedor logístico" |
| `services` | Al menos un checkbox marcado | "Selecciona al menos un servicio de interés" |
| `comments` | `value.length <= 500` | "Los comentarios no pueden exceder 500 caracteres" |
| `privacy` | Checkbox marcado | "Debes aceptar la política de privacidad para continuar" |

#### Restricción de Negocio: Volumen Bajo

Cuando se selecciona "0 – 100 envíos/mes", se muestra una alerta visual:
> ⚠️ **Volumen reducido** — Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?

#### Eventos de Validación

| Tipo de campo | Eventos |
|---------------|---------|
| Text inputs | `blur`, `input` |
| Selects | `change` |
| Radio buttons | `change` |
| Checkboxes | `change` |
| Textarea | `blur`, `input` |

#### Estados Visuales

| Estado | Clase CSS | Estilo |
|--------|-----------|--------|
| Válido | `.input-success` | Borde verde (#22c55e), fondo #f0fdf4 |
| Inválido | `.input-error` | Borde rojo (#ef4444), fondo #fef2f2 |
| Neutral | Sin clase | Borde slate-300, fondo blanco |

#### Flujo de Envío

1. Usuario hace clic en "Enviar solicitud"
2. Se ejecuta `validateAll()` que valida todos los campos
3. Si hay errores → se muestran mensajes y se enfoca el primer campo con error
4. Si es válido → botón muestra "Enviando..." con spinner, simulación de 1.5s, mensaje de éxito, reset del formulario

### 2.6 Accesibilidad, SEO y Schema.org

#### Accesibilidad (a11y)

| Elemento | Descripción |
|----------|-------------|
| Etiquetas semánticas | `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<fieldset>`, `<legend>` |
| Atributos ARIA | `aria-label`, `aria-hidden`, `aria-expanded`, `aria-controls`, `aria-describedby`, `aria-live`, `role="alert"`, `role="radiogroup"` |
| Skip link | `Saltar al contenido principal` |
| Foco visible | `:focus-visible` con `outline: 2px solid #3b82f6` |

#### SEO

Meta tags completos en ambas páginas: description, keywords, author, Open Graph, Twitter Card, canonical URL.

#### Schema.org (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TrackFlow",
  "description": "Gestión de almacenes y entregas de última milla para e-commerce",
  "url": "https://trackflow.com",
  "foundingDate": "2009",
  "address": [
    { "@type": "PostalAddress", "addressCountry": "US", "addressLocality": "Los Ángeles", "addressRegion": "California" },
    { "@type": "PostalAddress", "addressCountry": "ES", "addressLocality": "Zaragoza", "addressRegion": "Aragón" }
  ],
  "contactPoint": { "@type": "ContactPoint", "telephone": "+1-213-555-0147", "contactType": "sales" },
  "areaServed": [
    { "@type": "Country", "name": "Estados Unidos" },
    { "@type": "Country", "name": "Spain" }
  ]
}
```

#### Resumen de Archivos del Hito 1

| Archivo | Tamaño | Propósito |
|---------|--------|-----------|
| `index.html` | ~800 líneas | Landing page principal |
| `application.html` | ~450 líneas | Formulario de leads |
| `styles.css` | ~150 líneas | Estilos complementarios |
| `validation.js` | ~500 líneas | Validación del formulario |

---

## 3. Hito 2: Tracker Core — Lógica TypeScript Pura

> **Documento original:** `Documentos_hito2.md`  
> **Estado:** ✅ Completo — Auditoría realizada con 0 errores de compilación

### 3.1 Tecnologías y Principios de Diseño

| Aspecto | Detalle |
|---------|---------|
| **Lenguaje** | TypeScript ^7.0.2 |
| **Entorno** | Node.js 20.18.0 |
| **Validación** | `npx tsc --noEmit` — **0 errores** |

#### Principios de Diseño

- **100% funciones puras** — sin efectos secundarios, sin mutación de arrays de entrada
- **Tipado genérico** — tipos explícitos en parámetros y retornos, sin `any`
- **Inmutabilidad** — usan `[...spread]` y `slice()` para no modificar arrays originales

### 3.2 Estructura del Paquete

```
packages/tracker-core/
├── package.json                    # main + types apuntan a src/index.ts
├── tsconfig.json                   # target ES2020, strict true
├── index.html                      # Página de pruebas interactiva (Tailwind CSS)
└── src/
    ├── index.ts                    # Barrel file — re-exporta todo
    ├── types/
    │   └── models.ts               # Tipos, interfaces y constantes
    └── utils/
        ├── collections.ts          # Filtrado, ordenamiento, paginación
        ├── search.ts               # Búsqueda lineal y binaria
        ├── transformations.ts      # Agregaciones, agrupaciones, reportes
        └── validations.ts          # Validaciones de candidatos y negocio
```

### 3.3 Tipos y Modelos (`src/types/models.ts`)

#### Tipos Unión

| Tipo | Valores |
|------|---------|
| `CandidateStatus` | `"applied"`, `"screening"`, `"interview"`, `"on_hold"`, `"hired"`, `"rejected"` |
| `CandidateStage` | `"new"`, `"review"`, `"phone_screen"`, `"technical"`, `"final_interview"`, `"offer"`, `"hired"`, `"rejected"` |
| `LoadingState` | `"idle"`, `"loading"`, `"success"`, `"error"` |

#### Interfaces Principales

| Interfaz | Propiedades Clave |
|----------|-------------------|
| `Candidate` | `id`, `first_name`, `last_name`, `email`, `phone?`, `job_title`, `status`, `stage`, `linkedin?`, `cv_link?`, `years_experience?`, `created_at?`, `updated_at?` |
| `Note` | `id`, `record_id`, `content`, `created_by?`, `created_at?`, `updated_at?` |
| `User` | `id`, `username`, `email`, `first_name`, `last_name`, `is_active?`, `created_at?`, `updated_at?` |
| `CandidateFormData` | `first_name`, `last_name`, `email`, `phone?`, `job_title`, `years_experience?` |

#### Tipos de Payload y Configuración

| Tipo | Definición |
|------|------------|
| `CandidatePatchPayload` | `Partial<Pick<Candidate, "status" \| "stage">>` |
| `CandidatePutPayload` | `Omit<Candidate, "id" \| "created_at" \| "updated_at">` |
| `CandidatePostPayload` | `CandidateFormData` |
| `NotePostPayload` | `{ content: string }` |
| `ApiResponse<T>` | `T \| { results: T } \| { data: T }` |
| `SortCriterion<T>` | `{ field: keyof T, direction: "asc" \| "desc" }` |
| `FilterCriterion<T>` | `{ field, operator: 9 operadores, value }` |
| `ValidationResult` | `{ valid: boolean, errors: string[] }` |

#### Constantes

| Constante | Valores |
|-----------|---------|
| `STATUS_OPTIONS` | Applied, Screening, Interview, On Hold, Hired, Rejected |
| `STAGE_OPTIONS` | New, Review, Phone Screen, Technical, Final Interview, Offer, Hired, Rejected |

### 3.4 Colecciones (`src/utils/collections.ts`)

#### Filtrado

| Función | Descripción |
|---------|-------------|
| `matchesCriterion(item, criterion)` | Evalúa un criterio sobre un elemento. **9 operadores:** `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`, `between` |
| `filterByCriteria(items, criteria[])` | Filtra con múltiples criterios en **AND** |
| `filterByCriteriaOr(items, criteria[])` | Filtra con múltiples criterios en **OR** |
| `filterByStatus(items, status)` | Filtra candidatos por estado exacto |
| `filterByStage(items, stage)` | Filtra candidatos por etapa exacta |
| `filterByExperienceRange(items, min, max)` | Filtra por rango de años de experiencia |

#### Ordenamiento

| Función | Descripción |
|---------|-------------|
| `sortByField(items, field, direction?)` | Ordena por un campo (asc/desc). Nulls al final |
| `sortByMultipleCriteria(items, criteria[])` | Ordena multi-campo secuencial |

#### Paginación

| Función | Descripción |
|---------|-------------|
| `paginate(items, pageSize, pageIndex)` | Devuelve porción del array (pageIndex empieza en 0) |
| `totalPages(totalItems, pageSize)` | Calcula número total de páginas (`Math.ceil`) |

### 3.5 Búsqueda (`src/utils/search.ts`)

#### Búsqueda Lineal — O(n) — Arrays desordenados

| Función | Descripción |
|---------|-------------|
| `linearSearchByIdentity(items, field, value)` | Retorna el **primer** elemento que coincide, o `undefined` |
| `linearSearchAll(items, field, value)` | Retorna **todas** las coincidencias |
| `linearSearchByText(items, field, query)` | Búsqueda por substring **case-insensitive** |
| `linearSearchMultiField(items, fields[], value)` | Búsqueda multi-campo (OR lógico), evita duplicados |

#### Búsqueda Binaria — O(log n) — Requiere array ordenado

| Función | Descripción |
|---------|-------------|
| `binarySearchIndex(items, field, value)` | Retorna el **índice** del elemento, o **-1** |
| `binarySearch(items, field, value)` | Retorna el **elemento**, o `undefined` |
| `binarySearchNumber(items, field, value)` | Versión optimizada para números |
| `binarySearchRange(items, field, min, max)` | Búsqueda por rango [min, max] |

### 3.6 Transformaciones y Reportes (`src/utils/transformations.ts`)

#### Agregaciones Básicas

| Función | Descripción | Retorno (array vacío) |
|---------|-------------|----------------------|
| `count(items)` | Número total de elementos | `0` |
| `sum(items, field)` | Suma de campo numérico | `0` |
| `avg(items, field)` | Media aritmética | `0` |
| `max(items, field)` | Valor máximo | `undefined` |
| `min(items, field)` | Valor mínimo | `undefined` |
| `aggregate(items, field)` | Todas las métricas en un solo objeto | `{ count: 0, sum: 0, avg: 0, min: undefined, max: undefined }` |

#### Agrupaciones

| Función | Descripción |
|---------|-------------|
| `groupBy(items, field)` | Agrupa elementos por valor de campo. Retorna `Record<string, T[]>` |
| `countBy(items, field)` | Cuenta elementos por valor de campo |
| `distinct(items, field)` | Valores únicos de un campo (tipado preciso con `T[K][]`) |

#### Reportes Específicos para Candidatos

| Función | Descripción | Retorno |
|---------|-------------|---------|
| `reportByStatus(items)` | Reporte por estado: conteo y porcentaje, ordenado por count desc | `StatusReport[]` |
| `reportByStage(items)` | Reporte por etapa: conteo y porcentaje, ordenado por count desc | `StageReport[]` |
| `reportExperience(items)` | Reporte de experiencia: promedio, mínimo, máximo, total con datos | `ExperienceReport` |

### 3.7 Validaciones (`src/utils/validations.ts`)

#### Validaciones de Candidato

| Función | Reglas |
|---------|--------|
| `validateCandidateForm(data)` | Nombre ≥ 2, Apellido ≥ 2, Email válido, Teléfono ≥ 7 (opcional), Puesto ≥ 2, Experiencia no negativa |
| `validateCandidateComplete(candidate)` | Nombre, apellido, email, puesto, estado, etapa — todos requeridos |

#### Validaciones de Notas

| Función | Reglas |
|---------|--------|
| `validateNote(payload)` | Contenido no vacío, máximo 500 caracteres |

#### Validaciones de Negocio Avanzadas

| Función | Reglas |
|---------|--------|
| `canAdvanceToTechnical(candidate)` | Email registrado, Teléfono de contacto, Experiencia ≥ 1 año |
| `canReceiveOffer(candidate)` | Etapa `"final_interview"` (no `"offer"`), estado no `"rejected"` ni `"hired"` |
| `validatePipelineFlow(candidate, previousStage?)` | Etapa reconocida en el flujo. Opcional: detecta saltos de etapa |

#### Helpers de Validación

| Función | Descripción |
|---------|-------------|
| `isValidEmail(email)` | Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| `isValidUrl(url)` | Usa `new URL()` y verifica protocolo http/https |
| `isValidPhone(phone)` | Limpia caracteres especiales, verifica ≥ 7 dígitos |
| `isInRange(value, min, max)` | `value >= min && value <= max` |

### 3.8 Auditoría de Código

Se realizó una auditoría exhaustiva evaluando 5 criterios sobre los ~350 LOCs del paquete.

#### Corrección Técnica

| Aspecto | Estado |
|---------|--------|
| Tipado e Interfaces | ✅ Sin `any`. Tipos explícitos. Genéricos bien usados. |
| Filtrado | ✅ 9 operadores. AND y OR correctos. |
| Ordenamiento | ✅ Nulls al final. Comparación mixta número/string. |
| Búsqueda lineal | ✅ 4 variantes: primera, todas, substring, multi-campo. |
| Búsqueda binaria | ✅ Corregido: `right = mid - 1` en vez de `left = mid + 1`. |
| Agregaciones | ✅ `aggregate()` devuelve `undefined` para min/max sin datos. |
| Validaciones | ✅ `canReceiveOffer()` corrigió etapa `"offer"`. `validatePipelineFlow()` detecta saltos. |
| Compilación | ✅ **0 errores** — verificado con `npx tsc --noEmit` |

#### Hallazgos y Correcciones

| # | Severidad | Archivo | Problema | Corrección Aplicada |
|---|-----------|---------|----------|---------------------|
| 1 | 🔴 **Alto** | `search.ts` | `binarySearchNumber`/`binarySearchRange` usaban `left = mid + 1` saltándose valores | ✅ `right = mid - 1` |
| 2 | 🟡 **Medio** | `transformations.ts` + `models.ts` | `aggregate()` retornaba `min: 0, max: 0` inconsistente con `min()`/`max()` | ✅ `AggregateResult.min`/`max` son `number \| undefined` |
| 3 | 🟢 **Bajo** | `validations.ts` | `canReceiveOffer()` permitía etapa `"offer"` | ✅ Ahora rechaza explícitamente etapa `"offer"` |
| 4 | 🟢 **Bajo** | `validations.ts` | `validatePipelineFlow()` no detectaba saltos | ✅ Acepta `previousStage` opcional y detecta saltos |
| 5 | 🟡 **Medio** | *nuevo* | Sin barrel file — imports profundos | ✅ Creado `src/index.ts` con re-exportaciones |
| 6 | 🟡 **Medio** | `package.json` | `main` apuntaba a `src/types/models.ts` | ✅ `main` + `types` apuntan a `src/index.ts` |
| 7 | 🟢 **Bajo** | `index.html` | Clicks en filtrar acumulaban párrafos de conteo | ✅ Usa elemento fijo `id="filterCounter"` |
| 8 | 🟢 **Bajo** | `transformations.ts` | `distinct()` retornaba `unknown[]` | ✅ `distinct<T, K>(..., field: K): T[K][]` |

### 3.9 Especificaciones Técnicas

#### Configuración TypeScript (`tsconfig.json`)

| Opción | Valor |
|--------|-------|
| `target` | ES2020 |
| `module` | ESNext |
| `moduleResolution` | bundler |
| `strict` | true |
| `noEmit` | true (solo validación) |

#### Complejidad Algorítmica

| Operación | Complejidad | Requisito |
|-----------|-------------|-----------|
| Búsqueda lineal | **O(n)** | Ninguno |
| Búsqueda binaria | **O(log n)** | Array ordenado ascendentemente |
| Filtrado | **O(n × c)** | Ninguno (c = criterios) |
| Ordenamiento | **O(n log n)** | Ninguno (crea copia inmutada) |
| Agregaciones | **O(n)** | Ninguno |
| Reportes | **O(n + k log k)** | Ninguno (k = grupos únicos) |

#### Manejo de Casos Límite

| Escenario | Comportamiento |
|-----------|---------------|
| Array vacío en filtrado | Retorna `[]` |
| Array vacío en agregación | `sum = 0`, `avg = 0`, `min = undefined`, `max = undefined` |
| Sin criterios de filtrado | Retorna copia del array completo |
| Campo nulo/undefined en sort | Va al final del array ordenado |
| Valor no encontrado en búsqueda lineal | Retorna `undefined` o `[]` |
| Valor no encontrado en búsqueda binaria | Retorna `-1` o `undefined` |

#### Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run typecheck` | Valida compilación TypeScript (sin emitir archivos) |
| `npm test` | Ejecuta tests (no configurados aún) |
| `npx tsc --noEmit` | Alternativa directa para validar compilación |

---

## 4. Hito 3: Talent Pipeline Tracker — Next.js

> **Documento original:** `Documentos_hito3.md`  
> **Estado:** ✅ Completo

### 4.1 Tecnologías

| Tecnología | Versión |
|------------|---------|
| Next.js | 15.1.0 |
| React | 19.0.0 |
| React DOM | 19.0.0 |
| TypeScript | 5.7+ |
| Node.js | 20.18.0 |
| Tailwind CSS | Última (configurado en `tailwind.config.ts`) |
| API Base | `https://playground.4geeks.com/tracker/api/v1` |

### 4.2 Estructura del Proyecto

```
uis/talent-pipeline-tracker/
├── package.json
├── tsconfig.json                  # @/* → ./src/*
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .env.local                     # NEXT_PUBLIC_API_URL
└── src/
    ├── lib/
    │   ├── types.ts               # Definiciones de tipo
    │   └── api.ts                 # Servicio de API
    ├── hooks/
    │   └── useCandidate.ts        # Hooks personalizados
    ├── components/
    │   ├── LoadingSpinner.tsx
    │   ├── ErrorMessage.tsx
    │   ├── StatusBadge.tsx
    │   ├── CandidateCard.tsx
    │   ├── CandidateFilters.tsx
    │   ├── CandidateForm.tsx
    │   ├── StatusStageControl.tsx
    │   └── NotesSection.tsx
    └── app/
        ├── layout.tsx             # Layout principal con header y navegación
        ├── page.tsx               # / — Listado de candidaturas
        └── candidates/
            ├── [id]/
            │   ├── page.tsx       # /candidates/[id] — Detalle
            │   └── edit/
            │       └── page.tsx   # /candidates/[id]/edit — Editar
            └── new/
                └── page.tsx       # /candidates/new — Nuevo
```

### 4.3 Tipos y API

#### `src/lib/types.ts` — Definiciones de Tipo

| Tipo / Constante | Descripción |
|------------------|-------------|
| `CandidateStatus` | `"applied"`, `"screening"`, `"interview"`, `"hired"`, `"rejected"`, `"on_hold"` |
| `CandidateStage` | `"new"`, `"review"`, `"phone_screen"`, `"technical"`, `"final_interview"`, `"offer"`, `"hired"`, `"rejected"` |
| `Candidate` | Interfaz completa (id, nombres, email, teléfono, puesto, status, stage, etc.) |
| `Note` | Interfaz con id, record_id, content, timestamps |
| `LoadingState` | `"idle" \| "loading" \| "success" \| "error"` |
| `STATUS_OPTIONS` | Array de opciones de estado para selects |
| `STAGE_OPTIONS` | Array de opciones de etapa para selects |

#### `src/lib/api.ts` — Servicio de API

Función helper `fetchAPI<T>` que centraliza construcción de URL, headers JSON, manejo de errores HTTP y respuestas 204 (DELETE).

| Función | Método | Endpoint | Descripción |
|---------|--------|----------|-------------|
| `getAllCandidates()` | GET | `/records` | Obtener todos los candidatos (usa `?limit=500`) |
| `getCandidateById(id)` | GET | `/records/:id` | Obtener candidato por ID |
| `createCandidate(data)` | POST | `/records` | Crear nuevo candidato |
| `updateCandidate(id, data)` | PUT | `/records/:id` | Actualizar candidato completo |
| `patchCandidate(id, data)` | PATCH | `/records/:id` | Actualizar campos parciales |
| `getNotes(candidateId)` | GET | `/records/:id/notes` | Obtener notas del candidato |
| `addNote(candidateId, payload)` | POST | `/records/:id/notes` | Añadir nota |
| `deleteNote(candidateId, noteId)` | DELETE | `/records/:id/notes/:noteId` | Eliminar nota |

Incluye funciones `unwrapArray` y `unwrapSingle` para normalizar diferentes formatos de respuesta de la API.

### 4.4 Hooks Personalizados (`src/hooks/useCandidate.ts`)

| Hook | Estado Inicial | Propósito |
|------|----------------|-----------|
| `useCandidates()` | `{ candidates: [], state: "idle" }` | Carga inicial de lista. Retorna `candidates`, `state`, `error`, `refetch`, `setCandidates` |
| `useCandidate(id)` | `{ candidate: null, state: "idle" }` | Carga individual. Retorna `candidate`, `state`, `error`, `refetch`, `setCandidate` |

Ambos hooks usan `useState` + `useEffect` + `useCallback` y manejan los 4 estados de carga explícitamente.

### 4.5 Componentes

| Componente | Props | Propósito |
|------------|-------|-----------|
| `LoadingSpinner` | `message?: string` (default: "Cargando…") | Spinner animado + texto centrado |
| `ErrorMessage` | `title?`, `message`, `showBack?: boolean` | Caja roja con mensaje de error |
| `StatusBadge` | `value: string`, `type?: "status" \| "stage"` | Badge con color según valor y función `humanize()` |
| `CandidateCard` | `candidate: Candidate` | Tarjeta con nombre, puesto, badges, experiencia. Envuelta en `<Link>` |
| `CandidateFilters` | Ninguna (usa `useSearchParams`) | Input de búsqueda + selects de status/stage. Actualiza query params sin recargar |
| `CandidateForm` | `candidate?: Candidate`, `redirectTo?: string` | Formulario completo crear/editar. Validación: nombre y email obligatorios |
| `StatusStageControl` | `candidateId`, `initialStatus`, `initialStage`, `onUpdate` | Dos selects paralelos con PATCH, spinner individual, reversión en error, actualización optimista |
| `NotesSection` | `candidateId: number` | Input + botón añadir, lista con fecha y botón eliminar. Actualización optimista |

### 4.6 Páginas y Navegación

```
                    ┌──────────────────────────────────┐
                    │   / (Listado de candidaturas)    │
                    │   - Filtros (status, stage, q)   │
                    │   - Grid de CandidateCards       │
                    │   - Botón "Nuevo candidato"      │
                    └──────┬──────────────┬────────────┘
                           │              │
                           ▼              ▼
            ┌─────────────────────┐  ┌─────────────────────┐
            │ /candidates/[id]    │  │ /candidates/new     │
            │ (Detalle completo)  │  │ (Formulario crear)  │
            │ - StatusStageControl│  └─────────────────────┘
            │ - NotesSection      │
            │ - Botón "Editar"    │
            └──────┬──────────────┘
                   │
                   ▼
            ┌─────────────────────┐
            │ /candidates/[id]/   │
            │ edit                │
            │ (Formulario editar) │
            └─────────────────────┘
```

#### `layout.tsx` — Layout Principal
- Meta tags: `Talent Pipeline Tracker`
- Header fijo con logo y navegación
- Contenedor `max-w-7xl` centrado
- Estilos globales Tailwind cargados

#### `page.tsx` — Listado de Candidaturas (`/`)
- **Tipo:** Client Component con `"use client"`
- Envuelto en `<Suspense>` por `useSearchParams`
- **Estados:** loading → Spinner, error → ErrorMessage, success sin datos → "Aún no hay candidatos", success con filtros sin resultados → "No se encontraron candidatos"
- **Filtros:** Por `status`, `stage` (query params) y `q` (búsqueda por nombre/email)

#### `candidates/[id]/page.tsx` — Detalle (`/candidates/[id]`)
- **Tipo:** Client Component con `use()` para resolver params promesa
- **Secciones:** Cabecera con gradient azul, controles rápidos (StatusStageControl), información personal, fechas, notas (NotesSection)
- **Botones:** Volver al listado, Editar

#### `candidates/new/page.tsx` — Nuevo Candidato (`/candidates/new`)
- Renderiza `<CandidateForm>` en modo creación
- Botón "← Volver al listado"

#### `candidates/[id]/edit/page.tsx` — Editar (`/candidates/[id]/edit`)
- Carga candidato con `useCandidate(id)`
- Renderiza `<CandidateForm candidate={candidate}>` en modo edición
- Redirige al detalle tras éxito

### 4.7 Endpoints de API Consumidos

| Método | Endpoint | Propósito | Componente |
|--------|----------|-----------|------------|
| `GET` | `/records` | Listar candidatos | `page.tsx` (listado) |
| `GET` | `/records/:id` | Detalle candidato | Detalle, Editar |
| `POST` | `/records` | Crear candidato | Formulario nuevo |
| `PUT` | `/records/:id` | Actualizar candidato | Formulario editar |
| `PATCH` | `/records/:id` | Cambiar estado/etapa | StatusStageControl |
| `GET` | `/records/:id/notes` | Listar notas | NotesSection |
| `POST` | `/records/:id/notes` | Añadir nota | NotesSection |
| `DELETE` | `/records/:id/notes/:noteId` | Eliminar nota | NotesSection |

### 4.8 Manejo de Estados

#### Diagrama de Estados del Listado

```
┌───────┐   fetch()   ┌─────────┐   éxito   ┌─────────┐
│ idle  │ ──────────▶ │ loading │ ────────▶ │ success │
└───────┘             └─────────┘           └─────────┘
                        │ error               │
                        ▼                     ▼
                     ┌───────┐          ┌──────────┐
                     │ error │          │ sin dato │
                     └───────┘          └──────────┘
```

#### Diagrama de Estados del Detalle

```
┌───────┐   fetch(id)  ┌─────────┐   éxito   ┌─────────┐
│ idle  │ ────────────▶ │ loading │ ────────▶ │ success │
└───────┘               └─────────┘           └─────────┘
                          │ error               │
                          ▼                     ▼
                       ┌───────┐          ┌────────────┐
                       │ error │          │ candidato  │
                       └───────┘          │ mostrado   │
                                          └────────────┘
```

#### Actualización Optimista

- **StatusStageControl:** Al cambiar estado/etapa, la UI se actualiza inmediatamente y revierte en caso de error.
- **NotesSection:** Al crear una nota, aparece instantáneamente en la lista sin recargar.
- **CandidateDetailPage:** `setCandidate` actualiza el estado local tras PATCH exitoso.

#### Validación de Formularios

- **Campos obligatorios:** `first_name` y `email`
- Validación del lado del cliente antes de enviar
- Mensajes de feedback en la misma página (éxito/error)
- Botón deshabilitado durante el envío

---

## 5. Anexos

### Anexo A: Estructura Completa del Monorepo

```
/
├── CONTEXT.md                          # Contexto de la empresa
├── Documentos_Hito1.md                 # Documentación Hito 1
├── Documentos_hito2.md                 # Documentación Hito 2
├── Documentos_hito3.md                 # Documentación Hito 3
├── Documento123hitos.md                # ← Este documento (consolidado)
├── README.md / README.es.md            # Guía del monorepo
├── uis/
│   ├── website/                        # Hito 1 — Sitio web TrackFlow
│   │   ├── index.html
│   │   ├── application.html
│   │   ├── styles.css
│   │   ├── validation.js
│   │   └── package.json
│   └── talent-pipeline-tracker/        # Hito 3 — Next.js App
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── next.config.js
│       ├── .env.local
│       └── src/
│           ├── lib/types.ts
│           ├── lib/api.ts
│           ├── hooks/useCandidate.ts
│           ├── components/ (8 componentes)
│           └── app/ (4 rutas)
├── packages/
│   └── tracker-core/                   # Hito 2 — Lógica TypeScript
│       ├── package.json
│       ├── tsconfig.json
│       ├── index.html
│       └── src/
│           ├── index.ts
│           ├── types/models.ts
│           └── utils/
│               ├── collections.ts
│               ├── search.ts
│               ├── transformations.ts
│               └── validations.ts
├── agents/
├── data/
├── docs/
├── infra/
├── internal/
├── mcps/
├── scripts/
├── services/
├── shared/
├── skills/
└── workflows/
```

### Anexo B: Tecnologías por Hito

| Hito | Tecnologías |
|------|-------------|
| **Hito 1** | HTML5, CSS3 (Tailwind CSS CDN), JavaScript (ES6+), Google Fonts |
| **Hito 2** | TypeScript ^7.0.2, Node.js 20.18.0 |
| **Hito 3** | Next.js 15.1.0, React 19, TypeScript 5.7+, Tailwind CSS, PostCSS |

### Anexo C: Comandos Rápidos

| Acción | Comando | Ubicación |
|--------|---------|-----------|
| Ejecutar sitio web Hito 1 | `python3 -m http.server 3000` | `uis/website/` |
| Validar TypeScript Hito 2 | `npx tsc --noEmit` | `packages/tracker-core/` |
| Ejecutar dev Hito 3 | `npm run dev` | `uis/talent-pipeline-tracker/` |
| Acceder al sitio | `http://localhost:3000` | Navegador |

### Anexo D: Resumen de Componentes del Hito 3

| Categoría | Cantidad |
|-----------|----------|
| Componentes de UI | 8 (`LoadingSpinner`, `ErrorMessage`, `StatusBadge`, `CandidateCard`, `CandidateFilters`, `CandidateForm`, `StatusStageControl`, `NotesSection`) |
| Hooks personalizados | 2 (`useCandidates`, `useCandidate`) |
| Páginas (App Router) | 4 (`/`, `/candidates/[id]`, `/candidates/new`, `/candidates/[id]/edit`) |
| Endpoints de API | 8 (GET/POST/PUT/PATCH/DELETE) |

### Anexo E: Resumen de Funciones del Hito 2

| Archivo | Funciones Exportadas |
|---------|---------------------|
| `types/models.ts` | 24 tipos + 2 constantes |
| `utils/collections.ts` | 10 funciones |
| `utils/search.ts` | 8 funciones |
| `utils/transformations.ts` | 14 funciones + 3 interfaces de reporte |
| `utils/validations.ts` | 10 funciones |

---

*Fin del documento consolidado — TrackFlow — Proyecto completo de 3 hitos.*

**Estado general:** ✅ Completado — Todos los hitos desarrollados, auditados y documentados.