import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppConfigService, NotificationService } from '@alfresco/adf-core';

@Component({
  selector: 'app-uc2-demo',
  standalone: true,
  imports: [TranslateModule],            // habilita el pipe `translate`
  template: `
    <div style="padding: 24px; font-family: sans-serif;">
      <h2>{{ 'QUICK_NOTE.DIALOG.TITLE' | translate }}</h2>
      <p>{{ 'QUICK_NOTE.DIALOG.PLACEHOLDER' | translate }}</p>
      <p>maxLength (de app.config.json): <b>{{ maxLength }}</b></p>
      <button (click)="notify()">{{ 'QUICK_NOTE.DIALOG.SAVE' | translate }}</button>
    </div>
  `
})
export class Uc2DemoComponent {
  private readonly appConfig = inject(AppConfigService);
  private readonly notification = inject(NotificationService);

  readonly maxLength = this.appConfig.get<number>('quickNote.maxLength', 200);

  notify(): void {
    this.notification.showInfo('QUICK_NOTE.MESSAGES.SAVED');  // snackbar traducido
  }
}
