import { EnvironmentProviders, Provider } from '@angular/core';
import { provideExtensionConfig, provideExtensions} from '@alfresco/adf-extensions';
import { provideTranslations } from '@alfresco/adf-core';
import { canAddNote } from './quick-note.rules';
import { provideEffects } from '@ngrx/effects';
import { QuickNoteEffects } from './quick-note.effects';

/** Registra el manifiesto y las traducciones de Quick Note. */
export function provideQuickNote(): (Provider | EnvironmentProviders)[] {
  return [
    provideExtensionConfig(['quick-note.plugin.json']),
    provideTranslations('quick-note', 'assets/quick-note'),
    provideEffects(QuickNoteEffects),
    provideExtensions({
      evaluators: {
        'quick-note.canAddNote': canAddNote   // nombre JSON → función TS
      }
    })
  ];
}
