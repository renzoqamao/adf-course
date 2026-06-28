# UC3 — El sistema de extensiones: agregar un botón al toolbar

> 🏠 [Índice](00-INDICE.md) · [README](README.md)

**Objetivo:** entender el corazón de ACA — cómo un `plugin.json` agrega botones
sin tocar el código del host — y dejar la extensión **registrada y visible**.

**Rama sugerida:** `uc3-toolbar-button`

> 🧱 **Proyecto:** nace el botón **"Agregar nota"** y se conecta la extensión a la app.

## Concepto

ACA, al arrancar, lee todos los `*.plugin.json` registrados y arma la UI a partir
de ellos. Un plugin puede agregar items a `features` (toolbar, contextMenu,
sidebar, viewer...) y declarar `actions`. Es **declarativo**: vos describís **QUÉ**
querés (un botón con tal icono y tal título), no **cómo** dibujarlo.

Cuando se clickea un botón:
```
botón → action.id → action.type ("ADD_NOTE") → ACA despacha una acción al store
```
La acción queda "emitida" en la app. **Quién responde a esa acción y ejecuta la
lógica se conecta más adelante** — en este UC solo nos importa que el botón
aparezca y esté bien declarado.

Claves de un item de `features`:
- **`order`** → posición relativa.
- **`icon`** → nombre de Material Icons (`sticky_note_2`, `edit`, `delete`...).
- **`title`** → clave de i18n (las creaste antes), no texto literal.
- **`actions.click`** → el `id` de la acción a despachar.
- **`rules`** → (opcional) condiciones para mostrar/habilitar; lo dejamos para más
  adelante, así ahora el botón se ve siempre y lo podés probar.

---

## Paso a paso

### 1. Crear el manifiesto — `projects/aca-content/quick-note/assets/quick-note.plugin.json`
```json
{
  "$schema": "../../../../extension.schema.json",
  "$id": "quick-note-extension",
  "$version": "1.0.0",
  "$name": "Quick Note",
  "$description": "Agrega una nota al nodo seleccionado",
  "actions": [
    {
      "id": "quick-note.actions.add",
      "type": "ADD_NOTE",
      "payload": "$(context.selection.first.entry)"
    }
  ],
  "features": {
    "toolbar": [
      {
        "id": "app.toolbar.more",
        "children": [
          {
            "id": "quick-note.toolbar.add",
            "order": 700,
            "icon": "sticky_note_2",
            "title": "QUICK_NOTE.ACTIONS.ADD",
            "actions": { "click": "quick-note.actions.add" }
          }
        ]
      }
    ],
    "contextMenu": [
      {
        "id": "quick-note.context.add",
        "order": 700,
        "icon": "sticky_note_2",
        "title": "QUICK_NOTE.ACTIONS.ADD",
        "actions": { "click": "quick-note.actions.add" }
      }
    ]
  }
}
```
> Lo agregamos al toolbar (menú **"More"** ⋮) y al **menú contextual** (clic
> derecho) para poder verlo de las dos formas. Sin bloque `rules`, el botón se
> muestra siempre que haya una selección.

**Qué significa cada clave:**

*Metadatos del plugin* (los que empiezan con `$` son campos reservados de la extensión):

| Clave | Para qué sirve |
|-------|----------------|
| `$schema` | Ruta al JSON Schema que valida el manifiesto. Te da **autocompletado y validación** en el editor. No afecta el runtime. |
| `$id` | **Identificador único** de la extensión (evita choques con otros plugins). |
| `$version` | Versión del plugin. |
| `$name` | Nombre legible de la extensión. |
| `$description` | Descripción de qué hace. |

*`actions`* — lista de **acciones declaradas**, reutilizables por los `features`:

| Clave | Para qué sirve |
|-------|----------------|
| `id` | Identificador único de la acción. Es lo que referencian los `actions.click` de los botones. |
| `type` | El **tipo** de acción que ACA **despacha al store (ngrx)** cuando se dispara. Es el "puente" hacia la lógica. |
| `payload` | Datos que viajan con la acción. `$(...)` es una **expresión que ACA evalúa en runtime**: `context.selection.first.entry` = el primer nodo seleccionado. |

*`features`* — **contribuciones a la UI**:

| Clave | Para qué sirve |
|-------|----------------|
| `toolbar` | Array de items para la **barra de herramientas**. |
| `toolbar[].id: "app.toolbar.more"` | Acá **no** es un item nuevo: es el `id` de un **grupo ya existente** de ACA (el menú "More" ⋮). Al reusar ese `id`, te "colgás" de ese menú. |
| `toolbar[].children` | Los items **hijos** que agregás dentro de ese grupo. |
| `children[].id` | `id` único del item. |
| `children[].order` | Posición relativa (números menores = más arriba/izquierda). |
| `children[].icon` | Nombre de **Material Icons** que se muestra. |
| `children[].title` | **Clave de i18n** del texto (se traduce; no es texto literal). |
| `children[].actions.click` | El `id` de la acción a **despachar** al hacer click. |
| `contextMenu` | Array de items del **menú contextual** (clic derecho). Usa los mismos campos (`id`, `order`, `icon`, `title`, `actions`). |

> 💡 La idea clave: el `plugin.json` **conecta UI con acciones por `id`/`type`**, sin
> que la extensión toque el código del host. El botón referencia una acción por su
> `id`; esa acción despacha un `type`; y la lógica que escucha ese `type` se enchufa
> aparte.

### 2. Crear el provider de la extensión — `projects/aca-content/quick-note/src/quick-note.providers.ts`
```ts
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
```

**¿Para qué un archivo "provider"?** `provideQuickNote()` es el **punto de entrada
público** de la extensión: una función que devuelve **todos los providers** que la
app necesita para activar Quick Note (registrar el `plugin.json`, las traducciones,
y más cosas que se sumen). Así el host la habilita en **una sola línea**
(`...provideQuickNote()`) sin conocer los detalles internos: si mañana agregás más
piezas, las metés acá y el host no cambia. Es el mismo patrón de las demás
extensiones de ACA (`provideAboutExtension()`, etc.).

### 3. Crear el barrel — `projects/aca-content/quick-note/src/public-api.ts`
```ts
export * from './quick-note.providers';
```

**¿Para qué el "barrel" (`public-api.ts`)?** Es la **puerta de entrada** de la
librería: re-exporta lo que la extensión expone hacia afuera (`export * from ...`).
El alias del `tsconfig` (paso 4) apunta **a este archivo**, así que quien importe
`@alfresco/aca-content/quick-note` obtiene exactamente lo que el barrel exporta; el
resto de los archivos quedan "privados" y los podés refactorizar sin romper a los
consumidores. (Cada lib de ADF/ACA tiene su `public-api.ts`.)

### 4. Mapear el alias en TypeScript — `tsconfig.json` y `tsconfig.adf.json`
En `compilerOptions.paths` agregá (junto a las otras `@alfresco/aca-content/*`):
```json
"@alfresco/aca-content/quick-note": ["projects/aca-content/quick-note/src/public-api.ts"],
```
**¿Qué es un "alias"?** Un mapeo de un nombre de import "lindo"
(`@alfresco/aca-content/quick-note`) a una **ruta real** de archivo
(`projects/aca-content/quick-note/src/public-api.ts`). TypeScript y el bundler lo
resuelven, así escribís imports cortos y estables en vez de rutas relativas frágiles
(`../../../projects/...`).

**¿Por qué en DOS archivos? Diferencia entre `tsconfig.json` y `tsconfig.adf.json`:**
Ambos comparten las mismas opciones del compilador y los alias de
`@alfresco/aca-content/*`. La diferencia está en **de dónde sale ADF**:
- **`tsconfig.json`** (modo normal, día a día): las libs de ADF (`@alfresco/adf-core`,
  `adf-content-services`, `adf-extensions`, `js-api`...) se resuelven desde
  **`node_modules`** → las versiones **publicadas en npm**.
- **`tsconfig.adf.json`** (modo "ADF linkeado"): remapea esas mismas libs a un
  **checkout hermano del código fuente de ADF** (`../alfresco-ng2-components/lib/...`).
  Sirve para desarrollar/depurar ACA **contra el código de ADF** antes de que se
  publique a npm.

Por eso el alias de tu extensión va en **los dos**: así resuelve sin importar en qué
modo compiles. Si lo pusieras en uno solo, el otro build no encontraría
`@alfresco/aca-content/quick-note`.

### 5. Copiar el `plugin.json` en el build — `app/project.json`
En `targets.build.options.assets`, además del glob de `assets/quick-note` que ya
tenías, agregá el del manifiesto (ACA busca los plugins en `assets/plugins`):
```json
{ "glob": "quick-note.plugin.json", "input": "projects/aca-content/quick-note/assets", "output": "./assets/plugins" }
```

### 6. Enganchar la extensión — `app/src/app/extensions.module.ts`
Reemplazá el registro suelto de traducciones por el provider de la extensión:
```ts
import { provideQuickNote } from '@alfresco/aca-content/quick-note';
// ...
export function provideApplicationExtensions() {
  return [
    ...provideAboutExtension(),
    ...provideQuickNote(),          // ← registra plugin.json + traducciones
    // ...resto
  ];
}
```
> 🔁 Si antes habías agregado una línea suelta `provideTranslations('quick-note', ...)`
> en este archivo, **quitala**: ahora vive dentro de `provideQuickNote()`. Si no, la
> registrarías dos veces.

### 7. Ver en acción 🌐
```powershell
$env:BASE_URL = "https://tu-backend-alfresco"; npm start
```
1. Entrá a tus archivos (p. ej. **Personal Files**) y **seleccioná un archivo o carpeta**.
2. Abrí el menú **"More"** (⋮) del toolbar → debería aparecer **"Agregar nota"** con
   el icono de la nota.
3. Probá también el **clic derecho** sobre el item → el menú contextual lo muestra.
4. Si tenés la app en español, el texto sale como **"Agregar nota"**; en inglés,
   **"Add note"** → eso confirma que el `plugin.json` cargó y que las traducciones
   resuelven.

Esto valida que la extensión quedó **registrada, servida y visible**. (El botón
todavía no "hace" nada al clickearlo: la lógica de respuesta se conecta más adelante.)

> Si **no aparece**: revisá que el `plugin.json` se haya copiado a `assets/plugins`
> (paso 5), que el alias del `tsconfig` esté bien escrito (paso 4) y mirá la consola
> del navegador por errores de carga del plugin.

### 8. Commit
```bash
git add .
git commit -m "UC3: botón Agregar nota + registro de la extensión Quick Note"
```

## Criterios
- El botón aparece en el menú "More" (y en el contextual) al seleccionar un item.
- El texto sale traducido (no la clave `QUICK_NOTE.ACTIONS.ADD` cruda).
- Entendés que `plugin.json` es **declarativo**: describe QUÉ, no CÓMO.

## Para explorar
`extension.schema.json` (raíz del repo) lista TODOS los puntos de extensión.

---
[← UC2 — Config + i18n](UC2-config-i18n.md) · 🏠 [Índice](00-INDICE.md) · **Siguiente:** [UC4 — Reglas de visibilidad →](UC4-evaluators-rules.md)
