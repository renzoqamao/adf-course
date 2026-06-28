# UC7 — Integración con el repositorio Alfresco (`js-api`)

> 🏠 [Índice](00-INDICE.md) · [README](README.md)

**Objetivo:** guardar la nota de verdad en el nodo (propiedad `cm:description`).

**Rama sugerida:** `uc7-jsapi`

> 🧱 **Proyecto:** la nota se persiste en el repositorio Alfresco.

## Concepto

- Todo en Alfresco es un **nodo** con `id`, `name`, `properties`, `aspectNames`.
- `AlfrescoApiService` te da el cliente js-api ya autenticado.
- `NodesApi.updateNode(id, { properties })` hace un PATCH del nodo.
- `from(promise)` convierte la Promise de js-api en Observable (para `switchMap`).

---

## Paso a paso

### 1. Crear el servicio de API — `projects/aca-content/quick-note/src/quick-note-api.service.ts`
```ts
import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NodesApi } from '@alfresco/js-api';
import { AlfrescoApiService } from '@alfresco/adf-content-services';

@Injectable({ providedIn: 'root' })
export class QuickNoteApiService {
  private readonly apiService = inject(AlfrescoApiService);
  private get nodesApi() {
    return new NodesApi(this.apiService.getInstance());
  }

  /** Guarda la nota en cm:description del nodo. */
  saveNote(nodeId: string, text: string): Observable<unknown> {
    return from(
      this.nodesApi.updateNode(nodeId, { properties: { 'cm:description': text } })
    );
  }

  /** Lee la nota actual (si existe). */
  getNote(nodeId: string): Observable<string> {
    return from(this.nodesApi.getNode(nodeId, { include: ['properties'] })).pipe(
      map(({ entry }) => (entry.properties?.['cm:description'] as string) ?? '')
    );
  }
}
```

### 2. Usar la API en el servicio — editar `quick-note.service.ts` (de UC6)
Inyectá el nuevo servicio y reemplazá el `saveNote` provisional:
```ts
import { QuickNoteApiService } from './quick-note-api.service';
// ...
export class QuickNoteService {
  // ...inyecciones previas...
  private readonly api = inject(QuickNoteApiService);

  // dentro del switchMap:
  //   switchMap((text) => this.api.saveNote(node.id, text))

  // y borrá el método privado saveNote() con of(true)
}
```
El bloque queda así:
```ts
.pipe(
  filter((text): text is string => !!text),
  switchMap((text) => this.api.saveNote(node.id, text))
)
```

### 3. Probar y commit (guardado base)
`npm start` → escribí una nota y guardá. Verificá en el panel de detalles del nodo
(o vía API) que `cm:description` quedó con tu texto.
```bash
git add .
git commit -m "UC7: guarda la nota en cm:description via js-api"
```

### 4. (Opcional) Precargar la nota existente

Por defecto el diálogo abre **vacío**. Si querés que muestre la nota que el nodo ya
tiene (modo "editar" en vez de "crear"), leé `cm:description` con `getNote(node.id)`
y pasá ese texto al diálogo.

**a) En el servicio** — encadená `getNote` ANTES de abrir el diálogo:
```ts
addNote(node: Node): void {
  if (!node) {
    return;
  }
  this.api
    .getNote(node.id)                                    // 1) leer la nota actual
    .pipe(
      switchMap((current) =>
        this.dialog
          .open(NoteDialogComponent, {
            data: { maxLength: this.config.getMaxLength(), text: current },  // 2) pasarla
            minWidth: '420px',
            restoreFocus: true
          })
          .afterClosed()
      ),
      filter((text): text is string => !!text),
      switchMap((text) => this.api.saveNote(node.id, text))                  // 3) guardar
    )
    .subscribe({
      next: () => this.notification.showInfo('QUICK_NOTE.MESSAGES.SAVED'),
      error: () => this.notification.showError('QUICK_NOTE.MESSAGES.ERROR')
    });
}
```

**b) En el diálogo** (`note-dialog.component.ts`) — inicializá el textarea con ese texto:
```ts
readonly data = inject<{ maxLength: number; text?: string }>(MAT_DIALOG_DATA);
text = this.data.text ?? '';   // antes: text = '';
```

**¿En qué afecta?**
- **Una llamada HTTP extra** (`GET` del nodo) **antes** de abrir el diálogo → tarda
  un poquito más en aparecer (si querés, mostrás un spinner mientras).
- El flujo pasa a estar **encadenado**: `getNote → diálogo → saveNote` (todo con
  `switchMap`), en lugar de abrir el diálogo directo.
- Cambia la **UX a "editar"**: el usuario ve y modifica la nota existente en vez de
  partir de un campo vacío.
- El diálogo ahora **lee** un `text` opcional de su `data`. No rompe el caso sin
  precarga: si no llega, queda `''` (`getNote` devuelve `''` cuando el nodo no tiene
  nota).

Commit de este incremento:
```bash
git add .
git commit -m "UC7: precarga la descripción existente"
```

### 5. (Opcional) Spinner: abrir el diálogo ya y cargar adentro

El problema de (a) es que el `getNote` corre con el diálogo **cerrado**, así que
tarda en aparecer. Alternativa: abrir el diálogo **al instante** y cargar la nota
**adentro**, mostrando un spinner mientras llega.

Servicio (más simple: NO hace `getNote` antes; solo pasa el `nodeId`):
```ts
addNote(node: Node): void {
  if (!node) {
    return;
  }
  this.dialog
    .open(NoteDialogComponent, {
      data: { maxLength: this.config.getMaxLength(), nodeId: node.id },
      minWidth: '420px',
      restoreFocus: true
    })
    .afterClosed()
    .pipe(
      filter((text): text is string => !!text),
      switchMap((text) => this.api.saveNote(node.id, text))
    )
    .subscribe({
      next: () => this.notification.showInfo('QUICK_NOTE.MESSAGES.SAVED'),
      error: () => this.notification.showError('QUICK_NOTE.MESSAGES.ERROR')
    });
}
```

Diálogo (`note-dialog.component.ts`) — carga la nota en `ngOnInit` con un flag `loading`:
```ts
import { Component, OnInit, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuickNoteApiService } from '../../quick-note-api.service';

// en @Component → imports: [..., MatProgressSpinnerModule]
export class NoteDialogComponent implements OnInit {
  private readonly api = inject(QuickNoteApiService);
  readonly data = inject<{ maxLength: number; nodeId: string }>(MAT_DIALOG_DATA);

  loading = true;
  text = '';

  ngOnInit(): void {
    this.api.getNote(this.data.nodeId).subscribe((current) => {
      this.text = current;
      this.loading = false;
    });
  }
  // ...save() / cancel() igual que antes
}
```

Template — spinner mientras carga, y el textarea cuando ya está:
```html
<mat-dialog-content>
  <mat-spinner *ngIf="loading" diameter="32"></mat-spinner>

  <mat-form-field *ngIf="!loading" appearance="outline" style="width: 100%">
    <textarea matInput rows="4" [(ngModel)]="text" [maxlength]="data.maxLength"></textarea>
  </mat-form-field>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button (click)="cancel()">{{ 'QUICK_NOTE.DIALOG.CANCEL' | translate }}</button>
  <button mat-raised-button color="primary" (click)="save()" [disabled]="loading || !text.trim()">
    {{ 'QUICK_NOTE.DIALOG.SAVE' | translate }}
  </button>
</mat-dialog-actions>
```

**Diferencia con (a):** el `getNote` se **mueve al diálogo**; el diálogo abre al
instante y muestra el spinner hasta tener la nota. El botón Guardar queda
deshabilitado mientras `loading`. Mejor *performance percibida* (el usuario ve algo
de inmediato).

Commit de este incremento:
```bash
git add .
git commit -m "UC7: spinner"
```

## Criterios
- Usás la sesión de `AlfrescoApiService` (no credenciales propias).
- Convertís Promises a Observables con `from()`.
- Pedís `include: ['properties']` cuando necesités las propiedades.

---
[← UC6 — Diálogos + RxJS](UC6-dialogs-rxjs.md) · 🏠 [Índice](00-INDICE.md) · **Siguiente:** [UC8 — Testing →](UC8-testing.md)
