# TrackFlow Source Code

TypeScript utilities and models for the TrackFlow logistics platform.

## Estructura del Proyecto

```
src/
├── types/
│   └── models.ts          # Interfaces y tipos de dominio
├── utils/
│   ├── collections.ts     # Funciones para arrays y colecciones
│   ├── search.ts          # Algoritmos de búsqueda (lineal, binaria, fuzzy)
│   ├── transformations.ts # Transformaciones y reportes de datos
│   └── validations.ts     # Validaciones de negocio del formulario
├── index.html             # Página de prueba (opcional)
├── index.ts               # Punto de entrada principal
├── package.json           # Configuración del paquete
├── tsconfig.json          # Configuración de TypeScript
└── README.md              # Este archivo
```

## Instalación

```bash
# Navegar al directorio src
cd src

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Observar cambios en tiempo real
npm run watch
```

## Uso

### Importar tipos

```typescript
import { LeadFormData, Country, ProductType } from './types/models';
```

### Usar utilidades de colecciones

```typescript
import { groupBy, countBy, unique } from './utils/collections';

const leads = [
  { country: 'España', productType: 'Moda' },
  { country: 'Estados Unidos', productType: 'Electrónica' },
  { country: 'España', productType: 'Cosmética' }
];

// Agrupar por país
const grouped = groupBy(leads, lead => lead.country);

// Contar por tipo de producto
const productCounts = countBy(leads, lead => lead.productType);
```

### Usar algoritmos de búsqueda

```typescript
import { linearSearch, binarySearch, fuzzySearch } from './utils/search';

// Búsqueda lineal
const results = linearSearch(leads, lead => lead.country === 'España');

// Búsqueda binaria (requiere array ordenado)
const sortedNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const found = binarySearch(sortedNumbers, 5, (a, b) => a - b);

// Búsqueda difusa
const fuzzyResults = fuzzySearch(
  leads,
  'moda',
  lead => lead.productType,
  { threshold: 0.3 }
);
```

### Usar validaciones

```typescript
import { validateForm, validateEmail } from './utils/validations';

// Validar email individual
const emailResult = validateEmail('test@trackflow.com');

// Validar formulario completo
const formData: LeadFormData = {
  companyName: 'TrackFlow',
  contactPerson: 'Miguel Torres',
  email: 'miguel@trackflow.com',
  phone: '+1 213 555 0147',
  country: 'Estados Unidos',
  productType: 'Electrónica',
  monthlyVolume: '501-2000',
  has3pl: 'no',
  services: ['almacenaje', 'ultima-milla'],
  privacy: true
};

const formResult = validateForm(formData);
if (formResult.isValid) {
  console.log('Formulario válido');
} else {
  console.log('Errores:', formResult.errors);
}
```

### Usar transformaciones de datos

```typescript
import { 
  generateMonthlyReport, 
  calculateLeadStatistics,
  transformForChart 
} from './utils/transformations';

// Generar reporte mensual
const report = generateMonthlyReport(leads, 'Septiembre', 2026);

// Calcular estadísticas
const stats = calculateLeadStatistics(leads);

// Transformar datos para gráficos
const chartData = transformForChart(leads, 'country');
```

## Funcionalidades Incluidas

### Tipos (`types/models.ts`)

- **Company**: Interfaz para empresas clientes
- **Contact**: Interfaz para contactos
- **LeadFormData**: Datos del formulario de leads
- **ValidationResult**: Resultado de validaciones
- **MonthlyReport**: Reporte mensual
- **LeadStatistics**: Estadísticas de leads
- **SearchResult**: Resultado de búsquedas

### Utilidades de Colecciones (`utils/collections.ts`)

- `groupBy`: Agrupar elementos por criterio
- `unique`: Eliminar duplicados
- `chunk`: Dividir arrays en partes
- `flatten` / `deepFlatten`: Aplanar arrays
- `intersection` / `difference`: Operaciones entre arrays
- `partition`: Dividir array según predicado
- `sum` / `average`: Operaciones matemáticas
- `min` / `max`: Encontrar valores extremos
- `sortBy`: Ordenar por múltiples criterios
- `countBy` / `keyBy`: Contear y indexar
- `take` / `takeRight`: Tomar elementos
- `compact`: Eliminar valores falsy

### Algoritmos de Búsqueda (`utils/search.ts`)

- `linearSearch`: Búsqueda secuencial O(n)
- `binarySearch`: Búsqueda binaria O(log n)
- `binarySearchInsertionPoint`: Punto de inserción
- `fuzzySearch`: Búsqueda difusa con puntuación
- `multiCriteriaSearch`: Búsqueda multicriterio
- `searchByDateRange`: Búsqueda por rango de fechas
- `paginatedSearch`: Búsqueda paginada

### Transformaciones (`utils/transformations.ts`)

- `generateMonthlyReport`: Generar reporte mensual
- `calculateLeadStatistics`: Calcular estadísticas
- `transformForChart`: Transformar datos para gráficos
- `calculateConversionFunnel`: Métricas de conversión
- `generateGeographicReport`: Reporte geográfico
- `generateServiceReport`: Reporte de servicios
- `aggregateByTimePeriod`: Agrupar por período
- `calculateGrowthRate`: Calcular tasa de crecimiento
- `movingAverage`: Media móvil
- `normalize`: Normalizar datos

### Validaciones (`utils/validations.ts`)

- `validateCompanyName`: Validar nombre de empresa
- `validateContactPerson`: Validar nombre de contacto
- `validateEmail`: Validar email corporativo
- `validatePhone`: Validar teléfono internacional
- `validateWebsite`: Validar URL de sitio web
- `validateCountry`: Validar selección de país
- `validateProductType`: Validar tipo de producto
- `validateMonthlyVolume`: Validar volumen mensual
- `validateHas3pl`: Validar estado de 3PL
- `validateServices`: Validar selección de servicios
- `validateComments`: Validar comentarios
- `validatePrivacy`: Validar aceptación de privacidad
- `validateForm`: Validar formulario completo
- `getFieldError`: Obtener error de campo específico
- `hasWarning` / `getWarningMessage`: Manejar advertencias

## Pruebas

### Página de Prueba

El archivo `index.html` incluye una interfaz gráfica para probar las funcionalidades:

```bash
# Abrir en navegador
open index.html

# O usar un servidor local
python3 -m http.server 8000
```

### Pruebas Unitarias

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch
```

## Configuración de Desarrollo

### TypeScript

El archivo `tsconfig.json` está configurado con:

- **Target**: ES2020
- **Module**: CommonJS
- **Strict mode**: Habilitado
- **Source maps**: Habilitados
- **Declarations**: Habilitadas

### ESLint

Configuración recomendada para TypeScript:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

## Contribución

1. Crear una rama para nuevas funcionalidades
2. Escribir pruebas para código nuevo
3. Asegurar que todas las pruebas pasen
4. Actualizar documentación si es necesario
5. Crear pull request

## Licencia

MIT License - TrackFlow Tech © 2026
