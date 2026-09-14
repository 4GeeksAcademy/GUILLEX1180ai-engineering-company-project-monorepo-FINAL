# Documentos Hito 1: Sitio Web Público de TrackFlow

> **Fecha de creación:** 14 de septiembre de 2026  
> **Versión del documento:** 1.0  
> **Estado:** Completo

---

## Tabla de Contenidos

1. [Información General de la Empresa](#1-información-general-de-la-empresa)
2. [Estructura y Arquitectura del Proyecto](#2-estructura-y-arquitectura-del-proyecto)
3. [Configuración Técnica y Ejecución](#3-configuración-técnica-y-ejecución)
4. [Especificaciones del Formulario y Reglas de Validación](#4-especificaciones-del-formulario-y-reglas-de-validación)
5. [Accesibilidad, SEO y Schema.org](#5-accesibilidad-seo-y-schemaorg)

---

## 1. Información General de la Empresa

### 1.1 Identidad Corporativa

| Campo | Detalle |
|-------|---------|
| **Nombre comercial** | TrackFlow |
| **Año de fundación** | 2009 |
| **Sede central** | Los Ángeles, California, Estados Unidos |
| **Presencia internacional** | Estados Unidos y España |

### 1.2 Servicios Principales

TrackFlow se especializa en tres pilares fundamentales de la logística para e-commerce:

1. **Gestión de Almacenes**
   - Almacenamiento, picking y packing
   - Inventario en tiempo real
   - Almacenes operativos en **Los Ángeles** (California, EE.UU.) y **Zaragoza** (Aragón, España)

2. **Entregas de Última Milla**
   - Servicio de entrega puerta a puerta
   - Cobertura en EE.UU. y España
   - Logística optimizada para e-commerce

3. **Logística Inversa**
   - Gestión de devoluciones
   - Procesamiento de retornos
   - Control de inventario de productos devueltos

### 1.3 Stakeholder Principal

| Campo | Detalle |
|-------|---------|
| **Nombre** | Miguel Torres |
| **Cargo** | Director Comercial |
| **Rol en el proyecto** | Stakeholder principal y responsable de la toma de decisiones comerciales |

---

## 2. Estructura y Arquitectura del Proyecto

### 2.1 Descripción General

El sitio web de TrackFlow está diseñado como una **landing page de una sola página** con un formulario de captación de leads separado. El diseño sigue un enfoque **mobile-first** y utiliza **Tailwind CSS** como framework de estilos principal.

### 2.2 Archivos Clave

```
uis/website/
├── index.html          # Landing page principal
├── application.html    # Formulario de aplicación y registro de leads
├── styles.css          # Estilos complementarios a Tailwind CSS
├── validation.js       # Lógica de validación en tiempo real
└── package.json        # Configuración del paquete (si aplica)
```

### 2.3 Descripción Detallada de Cada Archivo

#### 2.3.1 `index.html` — Landing Page Principal

- **Propósito:** Página de aterrizaje principal de TrackFlow
- **Diseño:** Mobile-first con Tailwind CSS
- **Secciones incluidas:**
  - Header con navegación fija y menú móvil
  - Hero section con llamada a la acción principal
  - Sección de servicios (Gestión de Almacenes, Última Milla, Logística Inversa)
  - Sección de cobertura geográfica (EE.UU. y España)
  - Sección de contacto
  - Footer

- **Características técnicas:**
  - Tailwind CSS vía CDN
  - Google Fonts (Inter)
  - Schema.org JSON-LD integrado
  - Smooth scrolling habilitado
  - Accesibilidad mejorada con skip links

#### 2.3.2 `application.html` — Formulario de Leads

- **Propósito:** Captación de leads comerciales a través de un formulario detallado
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
  - Alerta de volumen bajo para 0-100 envíos/mes
  - Mensaje de éxito simulado tras envío

#### 2.3.3 `styles.css` — Estilos Complementarios

- **Propósito:** Estilos adicionales que complementan Tailwind CSS
- **Contenido principal:**
  - Reset y estilos base
  - Foco accesible (`:focus-visible`)
  - Animaciones (fadeInUp, fadeIn, pulse-dot)
  - Transiciones suaves para elementos de página
  - Estilos para estados de validación del formulario:
    - `.input-success` (borde verde, fondo verde claro)
    - `.input-error` (borde rojo, fondo rojo claro)
  - Estilos para botón de carga (`.btn-loading`)

#### 2.3.4 `validation.js` — Lógica de Validación

- **Propósito:** Validación completa del formulario en tiempo real
- **Funcionalidades principales:**
  - Validación de cada campo individual
  - Eventos `blur` y `input` para validación en tiempo real
  - Eventos `change` para selects, radios y checkboxes
  - Contador de caracteres para el campo de comentarios
  - Alerta de volumen bajo (0-100 envíos/mes)
  - Validación completa antes del envío
  - Simulación de envío con spinner de carga
  - Reset del formulario y limpieza de estados

---

## 3. Configuración Técnica y Ejecución

### 3.1 Ejecución Local en GitHub Codespaces

#### Comando de Ejecución

```bash
python3 -m http.server 3000
```

**Instrucciones paso a paso:**

1. Abrir una terminal en GitHub Codespaces
2. Navegar al directorio del proyecto:
   ```bash
   cd uis/website
   ```
3. Ejecutar el servidor local:
   ```bash
   python3 -m http.server 3000
   ```
4. El servidor estará disponible en `http://localhost:3000`

### 3.2 Configuración de Puerto en Codespaces

Para acceder al sitio web desde el navegador:

1. Ir a la pestaña **"Ports"** en la barra inferior de Codespaces
2. Buscar el puerto **3000**
3. Cambiar la visibilidad a **"Public"** (en lugar de "Private")
4. Hacer clic en el ícono de globe para abrir el sitio en el navegador

### 3.3 Dependencias Externas

| Recurso | Tipo | URL/Descripción |
|---------|------|-----------------|
| Tailwind CSS | Framework CSS | `https://cdn.tailwindcss.com` |
| Google Fonts | Tipografía | Fuente Inter (pesos 400-800) |

### 3.4 Configuración de Tailwind CSS

Tailwind CSS se carga vía CDN con una configuración personalizada:

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

### 3.5 Paleta de Colores

| Nombre | HEX | Uso |
|--------|-----|-----|
| tf-blue | `#1e40af` | Color principal de la marca |
| tf-blue-light | `#3b82f6` | Hover states, focus rings |
| tf-blue-dark | `#1e3a8a` | Hover states para botones |
| tf-accent | `#f59e0b` | Acentos, highlights |
| tf-accent-dark | `#d97706` | Hover para acentos |
| tf-gray | `#f8fafc` | Fondos suaves |
| tf-dark | `#0f172a` | Texto principal, headers |

---

## 4. Especificaciones del Formulario y Reglas de Validación

### 4.1 Campos del Formulario

#### Fieldset 1: Datos de la Empresa

| Campo | ID | Tipo | Obligatorio | Validación |
|-------|----|------|-------------|------------|
| Nombre de la empresa | `companyName` | text | ✅ Sí | Mínimo 2 caracteres, máximo 100 |
| Persona de contacto | `contactPerson` | text | ✅ Sí | Mínimo 2 palabras (nombre y apellido) |
| Email corporativo | `email` | email | ✅ Sí | Formato de email válido |
| Teléfono | `phone` | tel | ✅ Sí | Formato internacional (+código) |
| Sitio web | `website` | url | ❌ No | URL válida (http/https) |

#### Fieldset 2: Detalles Operativos

| Campo | ID | Tipo | Obligatorio | Opciones |
|-------|----|------|-------------|----------|
| País de operación principal | `country` | select | ✅ Sí | Estados Unidos, España, Ambos, Otro |
| Tipo de producto | `productType` | select | ✅ Sí | Moda, Electrónica, Cosmética, Alimentación, Otro |
| Volumen mensual estimado | `monthlyVolume` | select | ✅ Sí | 0-100, 101-500, 501-2000, 2000+, No estoy seguro |
| ¿Trabajas con otro 3PL? | `has3pl` | radio | ✅ Sí | Sí, No, Estoy evaluando opciones |

#### Fieldset 3: Preferencias de Servicio

| Campo | ID | Tipo | Obligatorio | Opciones |
|-------|----|------|-------------|----------|
| Servicios de interés | `services` | checkbox | ✅ Sí (mínimo 1) | Almacenaje, Última milla, Logística inversa |
| Comentarios | `comments` | textarea | ❌ No | Máximo 500 caracteres |

#### Consentimiento

| Campo | ID | Tipo | Obligatorio |
|-------|----|------|-------------|
| Política de privacidad | `privacy` | checkbox | ✅ Sí |

### 4.2 Reglas de Validación por Campo

#### Nombre de la Empresa (`companyName`)

```javascript
// Longitud mínima: 2 caracteres
// Longitud máxima: 100 caracteres
// Trim aplicado antes de validar
value.trim().length >= 2
```

**Mensaje de error:** "El nombre de la empresa debe tener al menos 2 caracteres"

#### Persona de Contacto (`contactPerson`)

```javascript
// Debe contener al menos 2 palabras
// Separador: espacios en blanco
const words = value.split(/\s+/).filter(w => w.length > 0);
words.length >= 2
```

**Mensaje de error:** "Ingresa nombre y apellido del contacto"

#### Email Corporativo (`email`)

```javascript
// Regex para validación de email
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
emailRegex.test(value)
```

**Mensaje de error:** "Ingresa un email corporativo válido (ejemplo: nombre@empresa.com)"

#### Teléfono (`phone`)

```javascript
// Formato internacional requerido
// Debe comenzar con + seguido de código de país
const phoneRegex = /^\+[0-9]{1,3}[-\s./0-9]{5,20}$/;
phoneRegex.test(value)
```

**Mensaje de error:** "El teléfono debe incluir código de país (ejemplo: +1 213 555 0147)"

**Ejemplos válidos:**
- `+1 213 555 0147` (EE.UU.)
- `+34 612 345 678` (España)
- `+52 55 1234 5678` (México)

#### Sitio Web (`website`)

```javascript
// Campo opcional
// Si se ingresa, debe ser URL válida con protocolo http o https
try {
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Invalid protocol');
  }
  return true;
} catch (_) {
  return false;
}
```

**Mensaje de error:** "Si incluyes sitio web, debe ser una URL válida"

#### País de Operación (`country`)

```javascript
// Debe seleccionar una opción válida
// Opciones: "Estados Unidos", "España", "Ambos", "Otro"
value !== ""
```

**Mensaje de error:** "Selecciona el país de operación principal"

#### Tipo de Producto (`productType`)

```javascript
// Debe seleccionar una opción válida
// Opciones: "Moda", "Electrónica", "Cosmética", "Alimentación", "Otro"
value !== ""
```

**Mensaje de error:** "Selecciona el tipo de producto que manejas"

#### Volumen Mensual (`monthlyVolume`)

```javascript
// Debe seleccionar un rango
// Opciones: "0-100", "101-500", "501-2000", "2000+", "no-estoy-seguro"
value !== ""

// Lógica especial: si selected === "0-100"
// Se muestra alerta de volumen bajo
```

**Mensaje de error:** "Selecciona el volumen mensual estimado"

**Restricción de negocio para volúmenes de 0-100 envíos mensuales:**

Cuando se selecciona el rango "0 – 100 envíos/mes", se muestra una alerta visual:

> ⚠️ **Volumen reducido**
> 
> Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?

Esta restricción permite filtrar leads que no se ajustan al perfil de cliente ideal de TrackFlow.

#### 3PL Actual (`has3pl`)

```javascript
// Al menos un radio button debe estar seleccionado
// Opciones: "si", "no", "evaluando"
const checked = Array.from(fields.has3pl).some(r => r.checked);
checked
```

**Mensaje de error:** "Indica si actualmente trabajas con otro proveedor logístico"

#### Servicios de Interés (`services`)

```javascript
// Al menos un checkbox debe estar marcado
// Opciones: "almacenaje", "ultima-milla", "logistica-inversa"
const checked = Array.from(fields.services).some(cb => cb.checked);
checked
```

**Mensaje de error:** "Selecciona al menos un servicio de interés"

#### Comentarios (`comments`)

```javascript
// Campo opcional
// Longitud máxima: 500 caracteres
// Contador en tiempo real
value.length <= 500
```

**Características especiales:**
- Contador de caracteres visible (`0/500`)
- Contador de caracteres restantes en mensaje de error
- Validación al perder foco (`blur`)

**Mensaje de error:** "Los comentarios no pueden exceder 500 caracteres (quedan X)"

#### Política de Privacidad (`privacy`)

```javascript
// Checkbox debe estar marcado
fields.privacy.checked
```

**Mensaje de error:** "Debes aceptar la política de privacidad para continuar"

### 4.3 Comportamiento de Validación

#### Eventos de Validación

| Tipo de campo | Eventos | Descripción |
|---------------|---------|-------------|
| Text inputs | `blur`, `input` | Validación al perder foco y mientras se escribe |
| Selects | `change` | Validación al cambiar selección |
| Radio buttons | `change` | Validación al seleccionar opción |
| Checkboxes | `change` | Validación al marcar/desmarcar |
| Textarea | `blur`, `input` | Validación al perder foco y contador en tiempo real |

#### Estados Visuales

| Estado | Clase CSS | Estilo |
|--------|-----------|--------|
| Válido | `.input-success` | Borde verde (#22c55e), fondo verde claro (#f0fdf4) |
| Inválido | `.input-error` | Borde rojo (#ef4444), fondo rojo claro (#fef2f2) |
| Neutral | Sin clase | Borde slate-300, fondo blanco |

#### Flujo de Envío

1. Usuario hace clic en "Enviar solicitud"
2. Se ejecuta `validateAll()` que valida todos los campos
3. Si hay errores:
   - Se muestran mensajes de error
   - Se enfoca el primer campo con error
4. Si es válido:
   - El botón muestra "Enviando..." con spinner
   - Se deshabilita el botón
   - Simulación de envío (1.5 segundos)
   - Se muestra mensaje de éxito
   - Se resetea el formulario
   - Se hace scroll al mensaje de éxito

---

## 5. Accesibilidad, SEO y Schema.org

### 5.1 Accesibilidad (a11y)

#### Etiquetas HTML Semánticas

El sitio utiliza etiquetas semánticas HTML5 para mejorar la accesibilidad y el SEO:

| Etiqueta | Uso |
|----------|-----|
| `<header>` | Encabezado del sitio con navegación |
| `<nav>` | Navegación principal |
| `<main>` | Contenido principal de la página |
| `<section>` | Secciones temáticas (hero, servicios, contacto, etc.) |
| `<article>` | Tarjetas de servicios (cada servicio es un `<article>`) |
| `<footer>` | Pie de página |
| `<fieldset>` | Agrupación de campos del formulario |
| `<legend>` | Título descriptivo para cada fieldset |

#### Atributos ARIA

| Atributo | Ejemplo | Propósito |
|----------|---------|-----------|
| `aria-label` | `aria-label="Navegación principal"` | Describe el propósito de elementos no textuales |
| `aria-hidden="true"` | En iconos SVG | Oculta elementos decorativos de lectores de pantalla |
| `aria-expanded` | `aria-expanded="false"` | Indica estado de menú móvil (abierto/cerrado) |
| `aria-controls` | `aria-controls="mobile-menu"` | Vincula botón con el elemento que controla |
| `aria-describedby` | `aria-describedby="err-companyName"` | Vincula campo con su mensaje de error |
| `aria-live="polite"` | `aria-live="polite"` en mensajes de error | Notifica cambios dinámicos a lectores de pantalla |
| `role="alert"` | `role="alert"` en mensajes de éxito/error | Marca contenido importante para alertas |
| `role="radiogroup"` | `role="radiogroup"` en grupo de radios | Agrupa opciones de radio relacionadas |
| `role="list"` | `role="list"` en navegación | Define lista de navegación |

#### Skip Link

El sitio incluye un enlace de saltar al contenido principal:

```html
<a href="#main-content" class="skip-link">
  Saltar al contenido principal
</a>
```

Esto permite a usuarios de teclado y lectores de pantalla navegar directamente al contenido principal sin pasar por la navegación.

#### Foco Accesible

```css
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}
```

Todos los elementos interactivos tienen un indicador de foco visible y accesible.

### 5.2 SEO (Search Engine Optimization)

#### Meta Tags

**`index.html`:**

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="TrackFlow - Gestión de almacenes, entregas de última milla y logística inversa en Estados Unidos y España. Más de 15 años optimizando la logística de tu e-commerce." />
<meta name="keywords" content="logística, almacenes, última milla, logística inversa, e-commerce, TrackFlow, Los Ángeles, Zaragoza" />
<meta name="author" content="TrackFlow Tech" />
```

**Open Graph (redes sociales):**

```html
<meta property="og:title" content="TrackFlow — Logística que escala con tu e-commerce" />
<meta property="og:description" content="Gestión de almacenes, entregas de última milla y logística inversa en Estados Unidos y España." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.trackflow.com" />
```

**Twitter Card:**

```html
<meta name="twitter:card" content="summary_large_image" />
```

**Canonical URL:**

```html
<link rel="canonical" href="https://www.trackflow.com" />
```

**`application.html`:**

```html
<meta name="description" content="Solicita información sobre los servicios de logística de TrackFlow. Gestión de almacenes, última milla y logística inversa en EE.UU. y España." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://www.trackflow.com/application.html" />
```

### 5.3 Schema.org (JSON-LD)

#### Estructura del Marcado

Ambas páginas incluyen marcado JSON-LD de tipo `Organization`:

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

#### Campos Incluidos

| Campo | Valor | Descripción |
|-------|-------|-------------|
| `@type` | Organization | Tipo de entidad Schema.org |
| `name` | TrackFlow | Nombre de la empresa |
| `description` | Gestión de almacenes... | Descripción del negocio |
| `url` | https://trackflow.com | Sitio web oficial |
| `foundingDate` | 2009 | Año de fundación |
| `address` | Array con 2 direcciones | Sedes en Los Ángeles y Zaragoza |
| `contactPoint` | Objeto ContactPoint | Información de contacto comercial |
| `sameAs` | Array | Perfiles en redes sociales (LinkedIn) |
| `areaServed` | Array | Países donde opera (EE.UU. y España) |

#### Beneficios SEO del Schema.org

1. **Rich Snippets:** Mejora la apariencia en resultados de búsqueda
2. **Knowledge Graph:** Puede aparecer en el panel de conocimiento de Google
3. **Comprensión semántica:** Ayuda a los motores de búsqueda a entender la estructura del negocio
4. **Información de contacto:** Muestra teléfono y ubicaciones directamente en resultados

---

## Anexos

### Anexo A: Resumen de Archivos

| Archivo | Tamaño | Propósito |
|---------|--------|-----------|
| `index.html` | ~800 líneas | Landing page principal |
| `application.html` | ~450 líneas | Formulario de leads |
| `styles.css` | ~150 líneas | Estilos complementarios |
| `validation.js` | ~500 líneas | Validación del formulario |

### Anexo B: Dependencias

| Recurso | Versión | Tipo |
|---------|---------|------|
| Tailwind CSS | CDN (última versión) | Framework CSS |
| Google Fonts (Inter) | 400-800 | Tipografía |

### Anexo C: Compatibilidad

El sitio está diseñado para ser compatible con:

- ✅ Chrome (últimas 3 versiones)
- ✅ Firefox (últimas 3 versiones)
- ✅ Safari (últimas 3 versiones)
- ✅ Edge (últimas 3 versiones)
- ✅ Dispositivos móviles (iOS y Android)
- ✅ Tablets

---

**Documento generado para el Hito 1 del proyecto TrackFlow**  
**Estado:** ✅ Completo y listo para revisión
