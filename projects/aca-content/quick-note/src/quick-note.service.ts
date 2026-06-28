import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '@alfresco/adf-core';
import { Node } from '@alfresco/js-api';
import { filter, switchMap } from 'rxjs/operators';
import { NoteDialogComponent } from './dialogs/note-dialog/note-dialog.component';
import { QuickNoteConfigService } from './quick-note-config.service';
import { QuickNoteApiService } from './quick-note-api.service';

@Injectable({ providedIn: 'root' })
export class QuickNoteService {
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly config = inject(QuickNoteConfigService);
  private readonly api = inject(QuickNoteApiService);

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
}
