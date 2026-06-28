# UC9 — Agregar nota a varios nodos (extensión aditiva)

> 🏠 [Índice](00-INDICE.md) · [README](README.md)

**Objetivo:** **agregar** la capacidad de aplicar "Agregar nota" sobre **varios
nodos** seleccionados, **sin tocar ni borrar** lo de UC1–UC8. El flujo de un solo
nodo sigue funcionando igual; sumamos un flujo paralelo para la selección múltiple,
reusando el **diálogo**, el **api** y la **config** que ya tenés.

**Rama sugerida:** `uc9-multiple-nodes`

> 🧱 **Proyecto:** Quick Note ahora soporta lote, **además** del modo de un nodo.
> Asume UC1–UC8 completos. **Regla de oro de este UC: solo se AGREGA código.**

## Panorama

Lo que **ya tenés** (queda intacto):
```
ADD_NOTE → AddNoteAction(node) → addNote$ → service.addNote(node)  → 1 diálogo → saveNote
```
Lo que **agregamos** (nuevo, en paralelo):
```
ADD_NOTE_TO_SELECTION → AddNoteToSelectionAction(nodes) → addNoteToSelection$
   → service.addNoteToSelection(nodes) → 1 diálogo → forkJoin(saveNote x N)
```

## Qué se agrega (nada se reemplaza)

| Archivo | Acción | Qué se **agrega** |
|---------|--------|-------------------|
| `assets/quick-note.plugin.json` | ➕ agregar | una **action** nueva + un **item** de toolbar/contextMenu |
| `src/quick-note.actions.ts` | ➕ agregar | clase `AddNoteToSelectionAction` (queda `AddNoteAction`) |
| `src/quick-note.rules.ts` | ➕ agregar | `canAddNoteToSelection` (queda `canAddNote`) |
| `src/quick-note.effects.ts` | ➕ agregar | effect `addNoteToSelection$` (queda `addNote$`) |
| `src/quick-note.service.ts` | ➕ agregar | método `addNoteToSelection(nodes)` (queda `addNote(node)`) |
| `src/quick-note.providers.ts` | ➕ editar (sumar) | registrar el nuevo evaluator en el mapa |
| `assets/i18n/{es,en}.json` | ➕ agregar | claves nuevas (label + resumen) |
| `src/quick-note-api.service.ts` | ⛔ sin cambios | `saveNote(id, text)` ya sirve por nodo |
| `src/dialogs/.../note-dialog.*` | ➕ (solo si hiciste UC7 c) | se **reusa**; sumá un guard para el caso **sin `nodeId`** (lote = sin precarga) |

---

## Paso a paso

### 1. `quick-note.actions.ts` — agregar la acción nueva
Dejá `AddNoteAction` como está y **sumá** abajo:
```ts
import { NodeEntry } from '@alfresco/js-api';

export const ADD_NOTE_TO_SELECTION_ACTION = 'ADD_NOTE_TO_SELECTION';

export class AddNoteToSelectionAction implements Action {
  readonly type = ADD_NOTE_TO_SELECTION_ACTION;
  constructor(public payload: NodeEntry[]) {}
}
```

### 2. `quick-note.rules.ts` — agregar la regla multi
Dejá `canAddNote` como está y **sumá**:
```ts
/** Visible si hay 2+ nodos y todos son editables. */
export function canAddNoteToSelection(context: RuleContext): boolean {
  const nodes = context.selection?.nodes ?? [];
  return nodes.length > 1 && nodes.every((n) => context.permissions.check(n.entry, ['update']));
}
```

### 3. `quick-note.service.ts` — agregar el método en lote
**No toques** `addNote(node)`. Agregá un método nuevo (reusa diálogo/api/config):
```ts
import { Store, createAction } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { NodeEntry } from '@alfresco/js-api';
import { forkJoin, of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

// (sumá estas inyecciones si no estaban)
private readonly store = inject(Store);
private readonly translate = inject(TranslateService);

/** Acción del host ACA para refrescar la lista de documentos. */
private static readonly reloadDocumentList = createAction('RELOAD_DOCUMENT_LIST');

/** NUEVO: aplica una misma nota a TODOS los nodos seleccionados. */
addNoteToSelection(nodes: NodeEntry[]): void {
  if (!nodes?.length) {
    return;
  }
  this.dialog
    .open(NoteDialogComponent, {
      data: { maxLength: this.config.getMaxLength(), count: nodes.length },
      minWidth: '420px',
      restoreFocus: true
    })
    .afterClosed()
    .pipe(
      filter((text): text is string => !!text),
      // una llamada por nodo, en paralelo; si una falla, NO corta el lote
      switchMap((text) =>
        forkJoin(
          nodes.map((n) =>
            this.api.saveNote(n.entry.id, text).pipe(
              map(() => true),
              catchError(() => of(false))
            )
          )
        )
      )
    )
    .subscribe((results) => {
      const ok = results.filter(Boolean).length;
      const failed = results.length - ok;
      this.store.dispatch(QuickNoteService.reloadDocumentList());
      if (failed === 0) {
        this.notification.showInfo(this.translate.instant('QUICK_NOTE.MESSAGES.SAVED_MANY', { count: ok }));
      } else {
        this.notification.showWarning(this.translate.instant('QUICK_NOTE.MESSAGES.SAVED_PARTIAL', { ok, failed }));
      }
    });
}
```
Qué aporta:
- **Un solo diálogo** para toda la selección (buena UX).
- **`forkJoin`**: guarda en todos **en paralelo** y avisa al final.
- **`catchError` por nodo**: un fallo aislado no aborta el resto.
- **`reloadDocumentList`**: refresca la lista del host.
- **Notificación resumen** (total o parcial).

> 🔗 **Si hiciste la precarga/spinner de UC7 (c)** — donde el diálogo hace
> `getNote(data.nodeId)` en `ngOnInit` — acá abrimos el diálogo **sin `nodeId`**
> (no hay una "nota previa" única para N nodos). Hacé que el diálogo **tolere** la
> ausencia de `nodeId` para abrir en blanco y sin spinner:
> ```ts
> ngOnInit(): void {
>   if (!this.data.nodeId) {      // modo lote: sin precarga
>     this.loading = false;
>     return;
>   }
>   this.api.getNote(this.data.nodeId).subscribe((current) => {
>     this.text = current;
>     this.loading = false;
>   });
> }
> ```
> Así el mismo diálogo sirve para ambos: **un nodo** precarga la nota (con spinner) y
> **lote** abre en blanco. (Si NO hiciste UC7 (c), el diálogo ya abre en blanco y no
> hay nada que tocar.)

### 4. `quick-note.effects.ts` — agregar el segundo effect
Dejá `addNote$` y **sumá** otro en la misma clase:
```ts
import {
  ADD_NOTE_TO_SELECTION_ACTION,
  AddNoteToSelectionAction
} from './quick-note.actions';

addNoteToSelection$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType<AddNoteToSelectionAction>(ADD_NOTE_TO_SELECTION_ACTION),
      map((action) => this.service.addNoteToSelection(action.payload))
    ),
  { dispatch: false }
);
```

### 5. `quick-note.providers.ts` — registrar el nuevo evaluator
En el `provideExtensions({ evaluators: { ... } })`, **sumá** una entrada
(sin quitar la existente):
```ts
import { canAddNote, canAddNoteToSelection } from './quick-note.rules'; // <- agregas canAddNoteToSelection

provideExtensions({
  evaluators: {
    'quick-note.canAddNote': canAddNote,                       // ya estaba
    'quick-note.canAddNoteToSelection': canAddNoteToSelection  // ← nuevo
  }
})
```
(El `provideEffects(QuickNoteEffects)` ya registra la clase entera, así que el
segundo effect entra solo.)

### 6. `quick-note.plugin.json` — agregar la acción y el botón
**Sumá** una entrada a `actions` (sin borrar la de un nodo):
```json
{
  "id": "quick-note.actions.addToSelection",
  "type": "ADD_NOTE_TO_SELECTION",
  "payload": "$(context.selection.nodes)"
}
```
Y **sumá** el item al `toolbar`/`contextMenu` (junto al existente):
```json
{
  "id": "quick-note.toolbar.addToSelection",
  "order": 701,
  "icon": "playlist_add",
  "title": "QUICK_NOTE.ACTIONS.ADD_TO_SELECTION",
  "actions": { "click": "quick-note.actions.addToSelection" },
  "rules": { "visible": ["quick-note.canAddNoteToSelection"] }
}
```

### 7. `i18n` — agregar claves nuevas
En `assets/i18n/es.json` (y su par en `en.json`), **sumá** dentro de `QUICK_NOTE`:
```json
"ACTIONS": { "ADD": "Agregar nota", "ADD_TO_SELECTION": "Agregar nota a la selección" },
"MESSAGES": {
  "SAVED": "Nota guardada",
  "ERROR": "No se pudo guardar la nota",
  "SAVED_MANY": "Nota guardada en {{ count }} elemento(s)",
  "SAVED_PARTIAL": "Guardada en {{ ok }}; fallaron {{ failed }}"
}
```
(`{{ count }}`, `{{ ok }}`, `{{ failed }}` se interpolan con el 2º arg de
`translate.instant(clave, { ... })`.)

### 8. Probar
`npm start` → seleccioná **2+** nodos → aparece **"Agregar nota a la selección"** →
escribís la nota una vez → se guarda en todos → la lista se refresca → una
notificación resumen. Con un solo nodo seguís viendo el botón original "Agregar
nota" (intacto).

### 9. Commit
```bash
git add .
git commit -m "UC9: agregar Agregar nota a la selección (lote con forkJoin)"
```

## Criterios
- El flujo de **un nodo** (UC1–UC8) **no cambió**: solo se agregó código.
- Con 2+ nodos: un diálogo, guardado en todos, un fallo no aborta el resto, lista
  refrescada y una notificación resumen.

## Para profundizar
- `forkJoin` (paralelo, espera a todos) vs `concatMap` (secuencial) vs `mergeMap`
  con concurrencia limitada.
- Sin `catchError` por nodo, un fallo haría que `forkJoin` emita `error` y se pierda
  el resto. Atrapando por nodo, guardás "lo que se pueda" y reportás el saldo.
- Para selecciones grandes: procesar por lotes (chunks) y mostrar progreso.

---
[🏠 Índice](00-INDICE.md) · [README](README.md)
