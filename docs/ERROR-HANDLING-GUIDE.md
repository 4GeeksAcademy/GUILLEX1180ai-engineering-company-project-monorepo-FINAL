# Guía de Manejo de Errores - TrackFlow Monorepo

## 📋 Resumen de Cambios Implementados

Esta documentación describe las mejoras implementadas en el manejo de errores a través de todo el monorepo, siguiendo las mejores prácticas de arquitectura resiliente.

---

## 🎯 Frontend (Next.js / TypeScript)

### 1. Bloques try/catch específicos

**Estado anterior:**
- Algunas llamadas fetch no tenían manejo de errores específico
- Errores técnicos se exponían directamente al usuario

**Estado actual:**
- ✅ Todas las llamadas `fetch` tienen bloques `try/catch` específicos
- ✅ Los hooks de mutación (`updateRate`, `updateStatus`, `remove`) ahora capturan errores
- ✅ Los errores se propagan correctamente para manejo en componentes

**Ejemplo implementado:**
```typescript
const updateRate = useCallback(
  async (tarifa: number): Promise<Supplier | null> => {
    if (!supplier) return null;
    try {
      const updated = await updateSupplierRate(supplier.id, tarifa);
      setSupplier(updated);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar tarifa";
      throw new Error(msg);
    }
  },
  [supplier]
);
```

### 2. Patrón de 3 estados en UI

**Implementación:**
- ✅ **Cargando**: `LoadingSpinner` con mensajes descriptivos
- ✅ **Éxito**: Datos visibles con información relevante
- ✅ **Error**: `ErrorMessage` con título, mensaje descriptivo y CTA

**Archivos actualizados:**
- `uis/application/src/app/suppliers/page.tsx`
- `uis/backoffice/src/app/suppliers/page.tsx`
- `uis/talent-pipeline-tracker/src/app/page.tsx`
- `uis/backoffice/src/app/incidents/page.tsx`

### 3. Mensajes de usuario limpios

**Cambio en `fetchAPI`:**
```typescript
function getHumanReadableError(status: number, detail: string): string {
  const baseMessage = detail || "Ocurrió un error inesperado";
  
  switch (status) {
    case 400:
      return `Solicitud inválida: ${baseMessage}`;
    case 401:
      return "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.";
    case 403:
      return "No tienes permisos para realizar esta acción.";
    case 404:
      return "El recurso solicitado no fue encontrado.";
    case 500:
      return "Error interno del servidor. Por favor, intenta de nuevo más tarde.";
    // ... más casos
  }
}
```

**Archivos actualizados:**
- `uis/application/src/lib/api.ts`
- `uis/backoffice/src/lib/api.ts`
- `uis/talent-pipeline-tracker/src/lib/api.ts`

### 4. Llamadas a la acción (CTA)

**Componente `ErrorMessage` mejorado:**
```typescript
interface ErrorMessageProps {
  title?: string;
  message: string;
  showBack?: boolean;
  retryAction?: () => void;  // ← Nuevo prop
}
```

**Características:**
- ✅ Botón "Reintegrar" cuando se proporciona `retryAction`
- ✅ Enlace "Volver al listado" con `showBack`
- ✅ Mensajes descriptivos y amigables

### 5. Optional Chaining y Fallbacks

**Implementado en:**
- Acceso a propiedades anidadas de proveedores y candidatos
- Manejo de datos potencialmente undefined/null
- Renderizado seguro de valores opcionales

### 6. Bloques finally

**Implementado en operaciones de mutación:**
```typescript
const handleRateSubmit = async (e: FormEvent) => {
  e.preventDefault();
  // ...
  setRateSubmitting(true);
  try {
    await updateRate(tarifaNum);
    setEditingRate(false);
  } catch (err) {
    setRateError(err instanceof Error ? err.message : "Error");
  } finally {
    setRateSubmitting(false);  // ← Siempre se ejecuta
  }
};
```

---

## 🔧 Backend (Python / FastAPI)

### 1. Ámbito de excepciones correcto

**Estado anterior:**
- Handler global que exponía tipo de excepción y mensaje
- Posible fuga de información sensible

**Estado actual:**
```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log interno para debugging (no se expone al cliente)
    import logging
    logger = logging.getLogger(__name__)
    logger.error(
        f"Excepción no controlada en {request.method} {request.url.path}: "
        f"{type(exc).__name__}: {exc}"
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor. Por favor, intenta de nuevo más tarde.",
        },
    )
```

### 2. Respuestas HTTP estructuradas

**Códigos HTTP utilizados:**
- `400`: Solicitud inválida (datos faltantes, formato incorrecto)
- `401`: No autenticado
- `403`: No autorizado
- `404`: Recurso no encontrado
- `409`: Conflicto (email duplicado, etc.)
- `422`: Error de validación (Pydantic)
- `500`: Error interno del servidor

**Ejemplo:**
```python
@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int):
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return _doc_to_response(doc)
```

### 3. Seguridad y privacidad

**Cambios implementados:**
- ✅ Mensajes de error genéricos para errores 500
- ✅ Logging interno sin exponer al cliente
- ✅ No se exponen rutas internas del servidor
- ✅ No se exponen cadenas de conexión o claves secretas

### 4. APIs externas

**Manejo robusto implementado en:**
- `uis/backoffice/src/hooks/useIncidents.ts`:
  ```typescript
  try {
    res = await fetch(`${API_BASE}/incidents/analyze`, { ... });
  } catch (networkErr) {
    const msg = networkErr instanceof TypeError
      ? `Error de red — No se pudo conectar con el servidor`
      : `Error de conexión: ${networkErr}`;
    throw new Error(msg);
  }
  ```

---

## 📜 Scripts (Python)

### 1. E/S de archivos y CSV

**`scripts/analyze.py` mejorado:**
```python
try:
    with open(ruta_csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        # ... procesamiento
except UnicodeDecodeError:
    print("Error: El archivo no está codificado en UTF-8.", file=sys.stderr)
    sys.exit(1)
except csv.Error as e:
    print(f"Error: Error al parsear el archivo CSV: {e}", file=sys.stderr)
    sys.exit(1)
except OSError as e:
    print(f"Error: No se pudo leer el archivo '{ruta_csv}': {e}", file=sys.stderr)
    sys.exit(1)
```

### 2. Salidas con código de error

**Todos los scripts terminan con código distinto de cero en caso de error:**
```python
if len(sys.argv) < 2:
    print("Uso: python analyze.py <archivo.csv>", file=sys.stderr)
    sys.exit(1)
```

### 3. Validación defensiva

**Implementada en:**
- Validación de argumentos CLI
- Verificación de existencia de archivos
- Validación de formato CSV
- Verificación de columnas requeridas

### 4. Exportación con manejo de errores

```python
def exportar_csv(...) -> bool:
    """Exporta las métricas a un CSV.
    
    Returns:
        True si la exportación fue exitosa, False en caso de error.
    """
    try:
        with open(ruta_salida, "w", newline="", encoding="utf-8") as f:
            # ... escritura
        return True
    except OSError as e:
        print(f"  ❌  Error al escribir el archivo '{ruta_salida}': {e}", file=sys.stderr)
        return False
```

---

## 🧹 Limpieza de Logs

### Eliminación de información sensible

**Antes:**
```typescript
throw new Error(`HTTP ${res.status} — ${res.statusText}${body ? `: ${body}` : ""}`);
```

**Ahora:**
```typescript
// Sanitizar mensaje de error: no exponer detalles técnicos al usuario
let detail = "";
try {
  const parsed = JSON.parse(body);
  detail = parsed?.detail ?? "";
} catch {
  // Si no es JSON, no incluir el body en el mensaje de error
}

const userMessage = getHumanReadableError(res.status, detail);
throw new Error(userMessage);
```

---

## 📁 Archivos Modificados

### Frontend (Next.js / TypeScript)
1. `uis/application/src/lib/api.ts`
2. `uis/application/src/hooks/useSuppliers.ts`
3. `uis/application/src/app/suppliers/page.tsx`
4. `uis/application/src/app/suppliers/[id]/page.tsx`
5. `uis/application/src/components/ErrorMessage.tsx`
6. `uis/backoffice/src/lib/api.ts`
7. `uis/backoffice/src/hooks/useSuppliers.ts`
8. `uis/backoffice/src/hooks/useLead.ts`
9. `uis/backoffice/src/hooks/useLeads.ts`
10. `uis/backoffice/src/app/suppliers/page.tsx`
11. `uis/backoffice/src/app/incidents/page.tsx`
12. `uis/backoffice/src/components/ErrorMessage.tsx`
13. `uis/talent-pipeline-tracker/src/lib/api.ts`
14. `uis/talent-pipeline-tracker/src/hooks/useCandidate.ts`
15. `uis/talent-pipeline-tracker/src/app/page.tsx`
16. `uis/talent-pipeline-tracker/src/components/ErrorMessage.tsx`

### Backend (Python / FastAPI)
1. `services/api/main.py`

### Scripts (Python)
1. `scripts/analyze.py`

---

## ✅ Checklist de Validación

### Frontend
- [x] Todas las llamadas fetch tienen try/catch
- [x] Patrón de 3 estados implementado (cargando/éxito/error)
- [x] Mensajes de error amigables para el usuario
- [x] CTAs en estados de error (reintentar, volver)
- [x] Optional chaining en propiedades anidadas
- [x] Bloques finally para limpiar estados de carga

### Backend
- [x] Excepciones capturadas en ámbito correcto
- [x] Respuestas HTTP estructuradas con códigos adecuados
- [x] Sin tracebacks expuestos al cliente
- [x] Mensajes de error no exponen información sensible
- [x] Manejo robusto de errores en llamadas externas

### Scripts
- [x] Operaciones de E/S en bloques try/except
- [x] Mensajes informativos en stderr
- [x] Códigos de salida distintos de cero en errores
- [x] Validación defensiva de datos de entrada

### General
- [x] Logs limpios sin información sensible
- [x] Mensajes de error consistentes en todo el monorepo
- [x] Documentación actualizada

---

## 🚀 Próximos Pasos Recomendados

1. **Monitoreo de errores**: Implementar un servicio de monitoreo (Sentry, LogRocket)
2. **Métricas de error**: Trackear frecuencia de errores por tipo
3. **Pruebas de error**: Agregar tests unitarios para escenarios de error
4. **Rate limiting**: Implementar rate limiting en el backend
5. **Circuit breaker**: Patrón circuit breaker para llamadas a APIs externas

---

*Documento generado como parte de la refactorización de manejo de errores del monorepo TrackFlow.*
*Fecha: 2026-09-22*
