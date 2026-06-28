# UC5 — Estado con ngrx: Action → Effect → Service

> 🏠 [Índice](00-INDICE.md) · [README](README.md)

**Objetivo:** conectar el click del botón a la lógica. ACA despacha una *acción*;
un *effect* la escucha y llama a un *servicio*.

**Rama sugerida:** `uc5-ngrx`

> 🧱 **Proyecto:** al clickear "Agregar nota" se ejecuta tu código.

## Concepto

```
dispatch(action) → Store → Effect (ofType) → Service (lógica)
```
- `actions$`: Observable de TODAS las acciones de la app.
- `ofType(TYPE)`: filtra solo las de ese type.
- El `type` string es el puente con el `plugin.json` (UC3).

### Para qué sirve cada archivo

| Archivo | Rol | ¿Lógica? |
|---------|-----|----------|
| `quick-note.actions.ts` (**Action**) | El **mensaje**: objeto con un `type` único y un `payload`. Es lo que se **despacha al store** al clickear. El `type` matchea el del `plugin.json`. | ❌ Solo datos |
| `quick-note.effects.ts` (**Effect**) | El **escucha**: observa `actions$`, **filtra** con `ofType(ADD_NOTE)` y **llama al servicio**. Es el puente acción → lógica. | ⚠️ Orquesta |
| `quick-note.service.ts` (**Service**) | La **lógica real** (notificar y, más adelante, diálogo/guardado). El effect delega acá. | ✅ Sí |

Así el manifiesto solo despacha un `type`, el effect queda delgado, y la lógica del
service queda **aislada y testeable**.

---

## Paso a paso

### 1. Crear la acción — `projects/aca-content/quick-note/src/quick-note.actions.ts`
```ts
import { Action } from '@ngrx/store';
import { Node } from '@alfresco/js-api';

export const ADD_NOTE_ACTION = 'ADD_NOTE';   // == el "type" del plugin.json

export class AddNoteAction implements Action {
  readonly type = ADD_NOTE_ACTION;
  constructor(public payload: Node) {}
}
```

### 2. Crear el servicio (primera versión) — `projects/aca-content/quick-note/src/quick-note.service.ts`
```ts
import { Injectable, inject } from '@angular/core';
import { NotificationService } from '@alfresco/adf-core';
import { Node } from '@alfresco/js-api';

@Injectable({ providedIn: 'root' })
export class QuickNoteService {
  private readonly notification = inject(NotificationService);

  /** En UC6 abrimos el diálogo; en UC7 guardamos de verdad. */
  addNote(node: Node): void {
    if (!node) {
      return;
    }
    this.notification.showInfo(`Quick Note sobre: ${node.name}`);
  }
}
```

### 3. Crear el effect — `projects/aca-content/quick-note/src/quick-note.effects.ts`
```ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { ADD_NOTE_ACTION, AddNoteAction } from './quick-note.actions';
import { QuickNoteService } from './quick-note.service';

@Injectable()
export class QuickNoteEffects {
  private readonly actions$ = inject(Actions);
  private readonly service = inject(QuickNoteService);

  addNote$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<AddNoteAction>(ADD_NOTE_ACTION),
        map((action) => this.service.addNote(action.payload))
      ),
    { dispatch: false }   // no devolvemos otra acción
  );
}
```

### 4. Registrar el effect — editar `quick-note.providers.ts`
```ts
import { provideEffects } from '@ngrx/effects';
import { QuickNoteEffects } from './quick-note.effects';

export function provideQuickNote() {
  return [
    provideExtensionConfig(['quick-note.plugin.json']),
    provideTranslations('quick-note', 'assets/quick-note'),
    provideEffects(QuickNoteEffects),                 // ← agregar
    provideExtensions({ evaluators: { 'quick-note.canAddNote': canAddNote } })
  ];
}
```

### 5. Probar
`npm start` → seleccioná un nodo → "Agregar nota" → debería salir una
notificación con el nombre del nodo. ¡Flujo completo de ACA funcionando!

### 6. Commit
```bash
git add .
git commit -m "UC5: ngrx Action/Effect/Service para Quick Note"
```

## Criterios
- El `type` de la acción coincide EXACTO con el del `plugin.json`.
- El effect delega TODO al servicio (no tiene lógica de negocio).

---
[← UC4 — Reglas de visibilidad](UC4-evaluators-rules.md) · 🏠 [Índice](00-INDICE.md) · **Siguiente:** [UC6 — Diálogos + RxJS →](UC6-dialogs-rxjs.md)
