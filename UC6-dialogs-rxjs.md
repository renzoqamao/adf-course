# UC6 — Diálogos Material + RxJS (afterClosed, filter, switchMap)

> 🏠 [Índice](00-INDICE.md) · [README](README.md)

**Objetivo:** abrir un diálogo donde el usuario escribe la nota y encadenar el
guardado de forma reactiva.

**Rama sugerida:** `uc6-dialogs`

> 🧱 **Proyecto:** el diálogo para escribir la nota.

## Concepto

`MatDialog.open()` devuelve un `dialogRef`; `dialogRef.afterClosed()` es un
Observable que emite el resultado al cerrar.
- `filter(...)`: descarta cuando el usuario cancela (`undefined`).
- `switchMap(fn)`: encadena OTRO Observable (el guardado). Usá `switchMap`, no
  `map`, cuando lo siguiente devuelve un Observable.

---

## Paso a paso

### 1. Crear el componente del diálogo — `projects/aca-content/quick-note/src/dialogs/note-dialog/note-dialog.component.ts`
```ts
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'aca-note-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './note-dialog.component.html'
})
export class NoteDialogComponent {
  private readonly ref = inject(MatDialogRef<NoteDialogComponent>);
  readonly data = inject<{ maxLength: number }>(MAT_DIALOG_DATA);
  text = '';

  save(): void {
    this.ref.close(this.text.trim());   // emite en afterClosed()
  }
  cancel(): void {
    this.ref.close();                   // emite undefined
  }
}
```

### 2. Crear el template — `.../note-dialog/note-dialog.component.html`
```html
<h2 mat-dialog-title>{{ 'QUICK_NOTE.DIALOG.TITLE' | translate }}</h2>
<mat-dialog-content>
  <mat-form-field appearance="outline" style="width: 100%">
    <textarea matInput rows="4"
              [(ngModel)]="text"
              [maxlength]="data.maxLength"
              [placeholder]="'QUICK_NOTE.DIALOG.PLACEHOLDER' | translate"></textarea>
  </mat-form-field>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button (click)="cancel()">{{ 'QUICK_NOTE.DIALOG.CANCEL' | translate }}</button>
  <button mat-raised-button color="primary" (click)="save()" [disabled]="!text.trim()">
    {{ 'QUICK_NOTE.DIALOG.SAVE' | translate }}
  </button>
</mat-dialog-actions>
```

### 3. Conectar el diálogo en el servicio — editar `quick-note.service.ts` (de UC5)
```ts
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '@alfresco/adf-core';
import { Node } from '@alfresco/js-api';
import { of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { NoteDialogComponent } from './dialogs/note-dialog/note-dialog.component';
import { QuickNoteConfigService } from './quick-note-config.service';

@Injectable({ providedIn: 'root' })
export class QuickNoteService {
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly config = inject(QuickNoteConfigService);

  addNote(node: Node): void {
    if (!node) {
      return;
    }
    this.dialog
      .open(NoteDialogComponent, {
        data: { maxLength: this.config.getMaxLength() },
        minWidth: '420px',
        restoreFocus: true
      })
      .afterClosed()
      .pipe(
        filter((text): text is string => !!text),
        switchMap((text) => this.saveNote(node, text))   // UC7: guardado real
      )
      .subscribe({
        next: () => this.notification.showInfo('QUICK_NOTE.MESSAGES.SAVED'),
        error: () => this.notification.showError('QUICK_NOTE.MESSAGES.ERROR')
      });
  }

  /** Provisional: en UC7 lo reemplazamos por la llamada a js-api. */
  private saveNote(node: Node, text: string) {
    console.log('TODO UC7: guardar', text, 'en', node.id);
    return of(true);
  }
}
```

### 4. Probar
`npm start` → "Agregar nota" abre el diálogo; escribís y "Guardar" muestra la
notificación de éxito; "Cancelar" no hace nada.

### 5. Commit
```bash
git add .
git commit -m "UC6: diálogo para escribir la nota (MatDialog + RxJS)"
```

## Criterios
- Distinguís "canceló" (undefined) de "confirmó" con `filter`.
- Usás `switchMap` (no `map`) porque lo siguiente es otro Observable.

---
[← UC5 — Estado con ngrx](UC5-ngrx-action-effect-service.md) · 🏠 [Índice](00-INDICE.md) · **Siguiente:** [UC7 — Integración con el repo →](UC7-jsapi-nodes.md)
