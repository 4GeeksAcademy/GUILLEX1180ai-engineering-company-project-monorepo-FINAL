# Git Protocol — Protocolo de Commits y Ramas

> **Regla:** `.agents/rules/git-protocol.md`  
> **Propósito:** Definir el flujo de trabajo con Git para mantener un historial limpio y trazable.

---

## 1. Ramas

### Convención de Nombres

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Feature | `feat/<hito>-<descripcion>` | `feat/hito3-candidate-filters` |
| Fix | `fix/<hito>-<descripcion>` | `fix/hito2-binary-search` |
| Docs | `docs/<descripcion>` | `docs/agents-protocol` |
| Refactor | `refactor/<area>` | `refactor/tracker-core-types` |
| Chore | `chore/<descripcion>` | `chore/setup-eslint` |

### Ramas Principales

| Rama | Propósito | ¿Se hace commit directo? |
|------|-----------|:------------------------:|
| `main` | Producción — código estable y revisado | ❌ Solo vía PR |
| `develop` | Integración de features en desarrollo | ❌ Solo vía PR |
| `feat/*` | Features activas | ✅ |

---

## 2. Commits

### Formato

```
[HitoN] tipo(área): mensaje breve en imperativo

- Detalle opcional del cambio
- Contexto o justificación si es necesario
```

### Reglas

1. **Mensajes en español o inglés** (consistente en todo el repo)
2. **Máximo 72 caracteres** en la primera línea
3. **Imperativo**: "Corrige" no "Corregido" ni "Corrección"
4. **Un cambio lógico por commit** (no commits gigantes)

### Ejemplos

```
[Hito1] feat: formulario de leads con validación en tiempo real

- 12 campos implementados con sus reglas de validación
- Contador de caracteres para comentarios
- Alerta de volumen bajo (0-100 envíos/mes)
```

```
[Hito2] fix: corrige binarySearchNumber con left/right mid

- Cambia left = mid + 1 por right = mid - 1 al encontrar no-números
- Los no-números están al final en array ordenado asc
```

```
[Hito3] feat: StatusStageControl con actualización optimista

- PATCH al cambiar status o stage
- Reversión al valor anterior en caso de error HTTP
- Spinner individual por campo
```

---

## 3. Proceso de Pull Request

### Checklist Pre-PR

- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Pruebas existentes pasan (si las hay)
- [ ] Código sigue las convenciones (`code-conventions.md`)
- [ ] No hay `any` en el código nuevo
- [ ] No hay dependencias externas nuevas (a menos que sea necesario)
- [ ] Los nombres de entidades reflejan el contexto de TrackFlow
- [ ] La funcionalidad está documentada (si aplica)

### Template de PR

```markdown
## Descripción
[Resumen del cambio]

## Hito relacionado
[Hito X]

## Cambios realizados
- [Cambio 1]
- [Cambio 2]

## Cómo probar
[Instrucciones]

## Checklist
- [ ] TypeScript válido (tsc --noEmit)
- [ ] Pruebas pasan
- [ ] Sin any
- [ ] Código sigue convenciones
```

---

## 4. Tags y Versiones

```bash
# Formato: v<hito>.<versión>
git tag v1.0.0   # Hito 1 completo
git tag v2.0.0   # Hito 2 completo
git tag v3.0.0   # Hito 3 completo
```

---

*Fin del protocolo Git.*