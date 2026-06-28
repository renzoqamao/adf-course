import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '@alfresco/adf-core';
import { Node, NodeEntry  } from '@alfresco/js-api';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { NoteDialogComponent } from './dialogs/note-dialog/note-dialog.component';
import { QuickNoteConfigService } from './quick-note-config.service';
import { QuickNoteApiService } from './quick-note-api.service';
import { forkJoin, of } from 'rxjs';
import { Store, createAction } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class QuickNoteService {
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly config = inject(QuickNoteConfigService);
  private readonly api = inject(QuickNoteApiService);
  private readonly store = inject(Store);
  private readonly translate = inject(TranslateService);
  /** Acción del host ACA para refrescar la lista de documentos. */
  private static readonly reloadDocumentList = createAction('RELOAD_DOCUMENT_LIST');

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

  /** Provisional: en UC7 lo reemplazamos por la llamada a js-api. */
  /*private saveNote(node: Node, text: string) {
    console.log('TODO UC7: guardar', text, 'en', node.id);
    return of(true);
  }*/

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
}
