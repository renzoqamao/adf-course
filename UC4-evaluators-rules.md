# UC4 — Reglas de visibilidad (evaluators / `RuleContext`)

> 🏠 [Índice](00-INDICE.md) · [README](README.md)

**Objetivo:** que el botón "Agregar nota" se vea SOLO si hay un nodo seleccionado
y el usuario puede editarlo.

**Rama sugerida:** `uc4-evaluators`

> 🧱 **Proyecto:** la regla `quick-note.canAddNote` que referencia el `plugin.json`.

## Concepto

Un evaluator es una **función pura** `(context: RuleContext) => boolean`. El
`plugin.json` la referencia por nombre en `rules.visible`. Lo importante del
contexto:
```ts
context.selection.count    // cuántos items
context.selection.first    // el primer item seleccionado
context.permissions.check(node.entry, ['update'])  // ¿puede el user?
```

### Qué trae el `RuleContext`

El contexto trae bastante más que selección y permisos (ACA lo extiende):

**`context.selection`** — la selección actual:
| Campo | Qué es |
|-------|--------|
| `count` | cuántos items seleccionados |
| `isEmpty` | `true` si no hay nada seleccionado |
| `nodes` | **todos** los nodos seleccionados (array) |
| `first` / `last` | el primero / último seleccionado |
| `file` | el archivo seleccionado (si hay uno) |
| `folder` | la carpeta seleccionada (si hay una) |
| `library` | el sitio/biblioteca seleccionada (si aplica) |

**`context.permissions`** — permisos del usuario sobre un nodo:
```ts
context.permissions.check(node.entry, ['update'])   // 'update' | 'delete' | 'create' | ...
```

**`context.profile`** — el usuario logueado: `isAdmin`, `id`.

**`context.repository`** — info del backend Alfresco: `version`, `status`, `edition`
(útil para habilitar acciones según versión/edición).

**`context.appConfig`** — leer `app.config.json` desde la regla:
```ts
context.appConfig.get('plugins.someFlag', false)   // como AppConfigService, en la regla
```

**`context.navigation`** — info de la ruta actual (carpeta/URL), para mostrar
acciones solo en ciertas vistas.

> 📚 **Catálogo de ejemplos reales:**
> [`projects/aca-shared/rules/src/app.rules.ts`](../alfresco-content-app/projects/aca-shared/rules/src/app.rules.ts)
> — los evaluators de ACA (`canDelete`, `isAdmin`, `canEditFolder`, etc.) usando
> todos estos campos. Es la mejor referencia para copiar o reutilizar reglas.

### Tipos de reglas en el `plugin.json`

En el manifiesto, "rules" aparece en **dos lugares**.

**1) El bloque `rules` de un item** (toolbar, contextMenu, etc.) — además de
`visible`, existe `enabled`:
```json
"rules": {
  "visible": ["quick-note.canAddNote"],
  "enabled": ["quick-note.canAddNote"]
}
```

| Regla | Qué controla |
|-------|--------------|
| **`visible`** | Si el item **se muestra**. `false` → el botón **desaparece**. |
| **`enabled`** | Si el item está **habilitado**. `false` → **se ve pero gris/no clickeable**. |

> Diferencia: `visible:false` no está; `enabled:false` está pero apagado (útil para
> dar feedback visual). Cada una toma un **array de evaluators** que se evalúa como
> **AND**: pasa solo si **todos** dan `true`.
> Ej.: `"visible": ["app.selection.file", "quick-note.canAddNote"]`.

**2) La sección top-level `rules`** — definir reglas **compuestas y reutilizables**
combinando evaluators con operadores lógicos y un `id`:
```json
"rules": [
  {
    "id": "quick-note.canAddNoteToFile",
    "type": "core.every",
    "parameters": [
      { "type": "rule", "value": "app.selection.file" },
      { "type": "rule", "value": "quick-note.canAddNote" }
    ]
  }
]
```
Operadores built-in de ADF:

| `type` | Significado |
|--------|-------------|
| **`core.every`** | AND — todos los sub-rules en `true` |
| **`core.some`** | OR — al menos uno en `true` |
| **`core.not`** | NOT — niega el resultado |

Después usás ese `id` compuesto en cualquier item
(`"visible": ["quick-note.canAddNoteToFile"]`), sin repetir lógica.

---

## Paso a paso

### 1. Crear las reglas — `projects/aca-content/quick-note/src/quick-note.rules.ts`
```ts
import { RuleContext } from '@alfresco/adf-extensions';

/** Devuelve el único nodo seleccionado, o undefined. */
const getSingleNode = (context: RuleContext) =>
  context?.selection?.count === 1 ? context.selection.first : undefined;

/**
 * Visible si hay UN nodo seleccionado y el usuario puede actualizarlo.
 * Ref JSON: `quick-note.canAddNote`
 */
export function canAddNote(context: RuleContext): boolean {
  const node = getSingleNode(context);
  return !!node && context.permissions.check(node.entry, ['update']);
}
```

### 2. Registrar el evaluator — editar `quick-note.providers.ts` (de UC3)
```ts
import { provideExtensionConfig, provideExtensions } from '@alfresco/adf-extensions';
import { canAddNote } from './quick-note.rules';

export function provideQuickNote() {
  return [
    provideExtensionConfig(['quick-note.plugin.json']),
    provideTranslations('quick-note', 'assets/quick-note'),
    provideExtensions({
      evaluators: {
        'quick-note.canAddNote': canAddNote   // nombre JSON → función TS
      }
    })
  ];
}
```

### 3. Usar la regla en el manifiesto — `assets/quick-note.plugin.json`
Asegurate de que el item del toolbar tenga:
```json
"rules": { "visible": ["quick-note.canAddNote"] }
```

### 4. Probar
`npm start` → con NADA seleccionado el botón no aparece; al seleccionar **un**
nodo editable, aparece; con varios seleccionados, no.

### 5. Commit
```bash
git add .
git commit -m "UC4: evaluator canAddNote para Quick Note"
```

## Criterios
- La función es pura (sin HTTP ni estado externo) y maneja selección vacía (`?.`).
- El nombre en `evaluators: {}` coincide EXACTO con el de `rules.visible`.

## Reto extra
Combiná con un built-in: `"visible": ["app.selection.file", "quick-note.canAddNote"]`
(es un AND: solo archivos).

---
[← UC3 — Botón en toolbar](UC3-extension-toolbar-button.md) · 🏠 [Índice](00-INDICE.md) · **Siguiente:** [UC5 — Estado con ngrx →](UC5-ngrx-action-effect-service.md)
