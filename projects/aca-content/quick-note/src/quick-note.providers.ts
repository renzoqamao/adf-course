import { EnvironmentProviders, Provider } from '@angular/core';
import { provideExtensionConfig } from '@alfresco/adf-extensions';
import { provideTranslations } from '@alfresco/adf-core';

/** Registra el manifiesto y las traducciones de Quick Note. */
export function provideQuickNote(): (Provider | EnvironmentProviders)[] {
  return [
    provideExtensionConfig(['quick-note.plugin.json']),
    provideTranslations('quick-note', 'assets/quick-note')
  ];
}
