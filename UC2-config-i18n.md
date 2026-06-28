# UC2 — Configuración (`AppConfigService`) + Internacionalización (i18n)

> 🏠 [Índice](00-INDICE.md) · [README](README.md)

**Objetivo:** preparar la base de la extensión "Quick Note": textos traducidos
(en/es) y un valor de config leído en runtime.

**Rama sugerida:** `uc2-config-i18n`

> 🧱 **Proyecto:** acá creás las traducciones y la config que el resto de la
> extensión va a reutilizar.

## Conceptos

### AppConfigService (`@alfresco/adf-core`)
Lee `app.config.json` en runtime: `appConfig.get<number>('quickNote.maxLength', 200)`
(el 2º argumento es el default).

### i18n (`@ngx-translate`)
Se registran las traducciones de la extensión con
`provideTranslations('quick-note', 'assets/quick-note')`, que carga
`assets/quick-note/i18n/{en,es}.json`. Las claves se usan en templates
(`{{ 'QUICK_NOTE.ACTIONS.ADD' | translate }}`), en el `plugin.json` y en TS
(`translate.instant(...)`).

### NotificationService (`@alfresco/adf-core`)
`notification.showInfo('QUICK_NOTE.MESSAGES.SAVED')` / `showError(...)`.

---

## Paso a paso

### 1. Crear las traducciones
Archivo `projects/aca-content/quick-note/assets/i18n/es.json`:
```json
{
  "QUICK_NOTE": {
    "ACTIONS": { "ADD": "Agregar nota" },
    "DIALOG": {
      "TITLE": "Nueva nota",
      "PLACEHOLDER": "Escribí tu nota...",
      "SAVE": "Guardar",
      "CANCEL": "Cancelar"
    },
    "MESSAGES": { "SAVED": "Nota guardada", "ERROR": "No se pudo guardar la nota" }
  }
}
```
Archivo `projects/aca-content/quick-note/assets/i18n/en.json`:
```json
{
  "QUICK_NOTE": {
    "ACTIONS": { "ADD": "Add note" },
    "DIALOG": {
      "TITLE": "New note",
      "PLACEHOLDER": "Write your note...",
      "SAVE": "Save",
      "CANCEL": "Cancel"
    },
    "MESSAGES": { "SAVED": "Note saved", "ERROR": "Could not save the note" }
  }
}
```

### 2. Crear el servicio de config — `projects/aca-content/quick-note/src/quick-note-config.service.ts`
```ts
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
```

### 3. (Opcional) Probar el config en `app/src/app.config.json`
Agregá en la raíz del JSON:
```json
"quickNote": { "maxLength": 120 }
```
`getMaxLength()` debería devolver `120` sin recompilar.

### 4. Registrar las traducciones (para que el `translate` encuentre las claves)
`provideTranslations(...)` solo funciona si las traducciones se **cargan al iniciar
la app** y los JSON están **servidos**. Dos cositas:

**4a. Que el build copie los JSON** — en `app/project.json`, dentro de
`targets.build.options.assets`, agregá:
```json
{ "glob": "**/*", "input": "projects/aca-content/quick-note/assets", "output": "./assets/quick-note" }
```
Eso publica tus `i18n/*.json` en `assets/quick-note/i18n/` del sitio servido.

Cada entrada de `assets` tiene 3 campos:
- **`input`** → carpeta de origen (de dónde copiar).
- **`output`** → carpeta de destino dentro de `dist/` (a dónde copiar).
- **`glob`** → qué archivos del `input` copiar, como **patrón** (no una ruta fija).

**¿Qué significa `glob: "**/*"`?** Es un patrón de archivos ("glob"):
- `*` = cualquier nombre de archivo (en un nivel).
- `**` = cualquier cantidad de subcarpetas (recursivo).
- Entonces `**/*` = **todos los archivos, en todas las subcarpetas**.

Otros ejemplos: `*.json` = solo los `.json` de la carpeta raíz; `**/*.json` = todos
los `.json` recursivamente; `i18n/*.json` = los `.json` dentro de `i18n/`.

**¿Por qué en `app/project.json`?** Este archivo es la **configuración del proyecto
en Nx** para la app host (`content-ce`): declara sus *targets* (`build`, `serve`,
`test`, `lint`), cada uno con su *executor* y opciones. Es el equivalente
"por-proyecto" de `angular.json`. Nx lo lee para saber **cómo** construir/servir la app.

**¿Por qué bajo `targets.build.options.assets`?** El array `assets` lista los
archivos **estáticos** que el *build* copia **tal cual** (sin compilar ni bundlear)
a la carpeta de salida (`dist/`). Tus traducciones se cargan **en runtime por HTTP**
(el loader de ngx-translate hace `GET assets/quick-note/i18n/es.json`), así que el
JSON **tiene que existir como archivo servido**. Si fuera un `import` de TS se
bundlearía; pero como es config que se *fetchea*, va sí o sí en `assets`. (Lo mismo
aplica a cualquier otro archivo estático, como un manifiesto `plugin.json`.)

**4b. Registrar el provider** — en `app/src/app/extensions.module.ts`, importá y
agregá `provideTranslations` dentro de `provideApplicationExtensions()`:
```ts
import { provideTranslations } from '@alfresco/adf-core';
// ...
export function provideApplicationExtensions() {
  return [
    ...provideAboutExtension(),
    provideTranslations('quick-note', 'assets/quick-note'),   // ← agregar
    // ...resto
  ];
}
```
**¿Por qué en `extensions.module.ts`?** Su función `provideApplicationExtensions()`
es donde la app host **junta todos los providers** que se inyectan en el **injector
raíz** al arrancar (es lo que se pasa al bootstrap, vía `AppConfig`). La
`TranslateService`/`TranslationService` de ADF es **singleton de la app** y lee sus
traducciones del injector raíz **al iniciar**. Por eso `provideTranslations(...)`
tiene que estar a nivel app (acá): si lo pusieras en los `providers` de una ruta
*lazy*, el servicio de traducciones ya existiría y **no vería** ese set nuevo → las
claves no resolverían.

> Más adelante este registro se centraliza en un único provider de la extensión;
> por ahora va directo acá para poder verlo funcionar ya.

### 5. Crear un componente demo — `projects/aca-content/quick-note/learning-uc2/uc2-demo.component.ts`
```ts
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
```

### 6. Agregar la ruta — `app/src/app/app.routes.ts`
Sumá al array `APP_ROUTES`:
```ts
{
  path: 'uc2',
  loadComponent: () =>
    import('../../../projects/aca-content/quick-note/learning-uc2/uc2-demo.component')
      .then((m) => m.Uc2DemoComponent),
  data: { title: 'UC2' }
}
```

### 7. Ver en acción 🌐
```powershell
$env:BASE_URL = "https://tu-backend-alfresco"; npm start
```
Abrí **http://localhost:4200/#/uc2** (¡con `#/`!). Deberías ver:
- el título y el placeholder **traducidos** (según el idioma del usuario/navegador),
- `maxLength` = **120** (el valor de `app.config.json`; si borrás esa clave, vuelve a 200),
- al hacer clic en **Guardar**, un *snackbar* "Nota guardada" / "Note saved".

**Cómo validar el i18n:** cambiá el idioma de la app (selector de idioma en el
perfil, o el `locale` del navegador) entre español e inglés → los textos cambian
sin tocar código. Eso prueba que las claves resuelven desde tus JSON.

### 8. Commit
```bash
git add .
git commit -m "UC2: i18n (en/es) + config + demo visible en /uc2"
```

## Criterios
- Los textos visibles NO están hardcodeados: son claves de i18n.
- El default de `appConfig.get(...)` evita romper si falta la clave.

---
[← UC1 — Repaso Angular](UC1-angular-refresher.md) · 🏠 [Índice](00-INDICE.md) · **Siguiente:** [UC3 — Botón en toolbar →](UC3-extension-toolbar-button.md)
