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
