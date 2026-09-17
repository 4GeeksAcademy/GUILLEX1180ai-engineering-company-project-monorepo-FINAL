# Stack Restrictions — Restricciones del Stack Tecnológico

> **Regla:** `.agents/rules/stack-restrictions.md`  
> **Propósito:** Definir el stack tecnológico permitido y prohibido en el monorepo.

---

## 1. Stack Permitido

### Frontend

| Tecnología | Versión | ¿Obligatorio? | Notas |
|------------|---------|:-------------:|-------|
| Next.js | 15.x | ✅ (apps nuevas) | App Router obligatorio |
| React | 19.x | ✅ | Server & Client Components |
| TypeScript | 5.7+ | ✅ | Strict mode |
| Tailwind CSS | 3.x+ | ✅ | Único framework de estilos |
| PostCSS | 8.x | ✅ | Para procesar Tailwind |

### Backend (futuro)

| Tecnología | Versión | Notas |
|------------|---------|-------|
| FastAPI | (latest) | Backend centralizado en `/services/` |
| Python | 3.11+ | Lenguaje del backend |

### Lógica Pura / Librerías

| Tecnología | Notas |
|------------|-------|
| TypeScript | Paquetes reutilizables en `packages/*/` |
| Node.js 20 | Entorno de ejecución |

---

## 2. Stack PROHIBIDO

| Tecnología | Alternativa Permitida | Razón |
|------------|----------------------|-------|
| ❌ Redux, Zustand, Jotai, etc. | `useState` / `useReducer` | No necesitamos estado global complejo |
| ❌ axios | `fetch` nativo | Dependencia innecesaria, fetch es suficiente |
| ❌ React Router | Next.js App Router (file-based) | El routing lo gestiona Next.js |
| ❌ styled-components, CSS-in-JS | Tailwind CSS + CSS Modules | Consistencia, rendimiento |
| ❌ React Query / SWR | `useEffect` + `useState` | Suficiente para el volumen actual |
| ❌ Formik / React Hook Form | useState + validación manual | Control total, sin dependencias extra |
| ❌ Next.js Pages Router | App Router | File-based, Server Components nativos |
| ❌ Bootstrap, Material UI | Tailwind CSS | Consistencia visual, personalización |

---

## 3. API y Comunicación

### Permitido
- `fetch()` nativo del navegador
- `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Headers: `Content-Type: application/json`

### Prohibido
- `axios` o cualquier cliente HTTP externo
- WebSockets (a menos que se requiera explícitamente en hitos futuros)
- GraphQL (API REST suficiente)

---

## 4. Gestión de Estado

| Tipo de Estado | Solución | Ejemplo |
|----------------|----------|---------|
| Estado local de componente | `useState` | Input de formulario |
| Estado derivado | `useMemo` | Lista filtrada |
| Efectos secundarios | `useEffect` | Fetch inicial de datos |
| Estado compartido simple | Props drilling (máx. 3 niveles) | Datos de candidato |
| Estado compartido complejo | `useReducer` + Context | Formulario multi-paso |

---

## 5. Estructura de Proyecto Next.js

Cada app en `uis/*/` debe seguir esta estructura:

```
uis/mi-app/
├── .env.local                 # Variables de entorno
├── next.config.js             # Configuración de Next.js
├── package.json               # Dependencias
├── postcss.config.js          # Configuración de PostCSS
├── tailwind.config.ts         # Configuración de Tailwind
├── tsconfig.json              # TypeScript config
└── src/
    ├── app/                   # App Router pages
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── ...
    ├── components/            # Componentes React
    ├── hooks/                 # Custom hooks
    └── lib/                   # Utilidades, API, tipos
        ├── api.ts
        └── types.ts
```

---

## 6. Dependencias Externas

### Regla General
> **Antes de instalar cualquier dependencia, preguntar: ¿realmente la necesito? ¿Puedo hacerlo con las herramientas que ya tengo?**

### Proceso de Aprobación
1. ¿La funcionalidad se puede implementar con el stack actual? → No instalar
2. ¿La dependencia añade valor significativo? → Evaluar
3. ¿Mantiene compatibilidad con Next.js 15 / React 19? → Verificar
4. ¿Aumenta el bundle size significativamente? → Reconsiderar

---

*Fin de las restricciones de stack.*