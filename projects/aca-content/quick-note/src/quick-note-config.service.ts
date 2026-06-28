import { Injectable, inject } from '@angular/core';
import { AppConfigService } from '@alfresco/adf-core';

@Injectable({ providedIn: 'root' })
export class QuickNoteConfigService {
  private readonly appConfig = inject(AppConfigService);

  /** Largo máximo de la nota. Configurable vía `quickNote.maxLength` en app.config.json. */
  getMaxLength(): number {
    return this.appConfig.get<number>('quickNote.maxLength', 200);
  }
}
