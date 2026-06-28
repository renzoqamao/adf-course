# UC8 — Testing (unit tests de reglas y servicios)

> 🏠 [Índice](00-INDICE.md) · [README](README.md)

**Objetivo:** cubrir la extensión con tests, empezando por los evaluators puros.

**Rama sugerida:** `uc8-testing`

> 🧱 **Proyecto:** Quick Note queda con tests.

## Concepto

ACA usa **Karma + Jasmine** (no Jest). Un test unitario aísla una unidad, le da
entradas controladas (mocks) y verifica la salida con `expect(...)`. Las reglas
(funciones puras de UC4) son lo más fácil: no necesitan `TestBed`, solo un
`context` falso.

- Dobles de prueba en Jasmine: `jasmine.createSpy('nombre')` y, para que devuelva
  algo, `.and.returnValue(...)`. Aserción de llamada: `expect(spy).toHaveBeenCalledWith(...)`.
- ⚠️ **Tip del editor:** como `quick-note/` es una carpeta nueva fuera de `src/`,
  VS Code puede no encontrar los tipos de test (`describe/it/expect`). Agregá como
  primera línea de cada spec:
  ```ts
  /// <reference types="jasmine" />
  ```
  El test igual corre bien con `nx test aca-content` (ahí se usa `tsconfig.spec.json`).

---

## Paso a paso

### 1. Test del evaluator — `projects/aca-content/quick-note/src/quick-note.rules.spec.ts`
```ts
/// <reference types="jasmine" />
import { canAddNote } from './quick-note.rules';

describe('canAddNote', () => {
  it('false cuando no hay selección', () => {
    const context = { selection: { count: 0 } } as any;
    expect(canAddNote(context)).toBe(false);
  });

  it('true para un nodo con permiso de update', () => {
    const context = {
      selection: { count: 1, first: { entry: { id: '1', name: 'X' } } },
      permissions: { check: () => true }
    } as any;
    expect(canAddNote(context)).toBe(true);
  });

  it('false sin permiso de update', () => {
    const context = {
      selection: { count: 1, first: { entry: { id: '1' } } },
      permissions: { check: () => false }
    } as any;
    expect(canAddNote(context)).toBe(false);
  });

  it('false con varios seleccionados', () => {
    const context = { selection: { count: 2 } } as any;
    expect(canAddNote(context)).toBe(false);
  });
});
```

### 2. Test del servicio de API — `projects/aca-content/quick-note/src/quick-note-api.service.spec.ts`
```ts
/// <reference types="jasmine" />
import { TestBed } from '@angular/core/testing';
import { AlfrescoApiService } from '@alfresco/adf-content-services';
import { QuickNoteApiService } from './quick-note-api.service';

describe('QuickNoteApiService', () => {
  // El servicio usa inject(AlfrescoApiService) en un field initializer, así que NO
  // se puede crear con `new` (daría NG0203). Lo creamos con TestBed (contexto de DI)
  // y mockeamos AlfrescoApiService; luego reemplazamos el getter `nodesApi`.
  function createService(nodesApiDouble: any): QuickNoteApiService {
    TestBed.configureTestingModule({
      providers: [
        QuickNoteApiService,
        { provide: AlfrescoApiService, useValue: { getInstance: () => ({}) } }
      ]
    });
    const service = TestBed.inject(QuickNoteApiService);
    Object.defineProperty(service, 'nodesApi', { get: () => nodesApiDouble });
    return service;
  }

  it('saveNote llama a updateNode con cm:description', (done) => {
    const updateNode = jasmine.createSpy('updateNode').and.returnValue(Promise.resolve({}));
    const service = createService({ updateNode });

    service.saveNote('node-1', 'hola').subscribe(() => {
      expect(updateNode).toHaveBeenCalledWith('node-1', { properties: { 'cm:description': 'hola' } });
      done();
    });
  });

  it('getNote devuelve cm:description del nodo', (done) => {
    const getNode = jasmine.createSpy('getNode').and.returnValue(
      Promise.resolve({ entry: { properties: { 'cm:description': 'hola' } } })
    );
    const service = createService({ getNode });

    service.getNote('node-1').subscribe((text) => {
      expect(getNode).toHaveBeenCalledWith('node-1', { include: ['properties'] });
      expect(text).toBe('hola');
      done();
    });
  });

  it('getNote devuelve "" cuando el nodo no tiene nota', (done) => {
    const getNode = jasmine.createSpy('getNode').and.returnValue(
      Promise.resolve({ entry: { properties: {} } })
    );
    const service = createService({ getNode });

    service.getNote('node-1').subscribe((text) => {
      expect(text).toBe('');
      done();
    });
  });
});
```
> ⚠️ **No** uses `new QuickNoteApiService()`: como usa `inject(AlfrescoApiService)` en
> un field initializer, fuera del contexto de DI lanza *NG0203*. Por eso se crea con
> `TestBed.inject(...)` y se mockea `AlfrescoApiService`. El `Object.defineProperty`
> reemplaza el getter `nodesApi` por el doble (no se instancia el cliente real de js-api).

> 🔗 **Precarga del diálogo (UC7 c):** si el diálogo hace `getNote(data.nodeId)` en
> `ngOnInit`, lo testeás con `TestBed` mockeando `QuickNoteApiService`: verificás que
> con `nodeId` el textarea queda con la nota (`text`) y `loading=false`, y que **sin**
> `nodeId` (modo lote) no llama a `getNote` y abre en blanco.

### 3. Correr los tests
```bash
npx nx test aca-content
# correr SOLO los specs de Quick Note (Karma filtra por ARCHIVO con --include):
npx nx test aca-content --watch=false --code-coverage=false --include="**/quick-note*.spec.ts"
```
> El runner es **Karma + Jasmine** (`@angular-devkit/build-angular:karma`). Karma
> **no** tiene `--test-name-pattern` (eso es de Jest); se filtra por archivo con
> `--include` (glob relativo a `projects/aca-content`). El `test.ts` no hace
> `require.context`, así que `--include`/`--exclude` controlan qué specs se cargan.
>
> 💡 **`--code-coverage=false` al correr un subset:** la cobertura global tiene
> umbrales (en `karma.conf.js`). Con pocos specs no se alcanzan y el run falla con
> `ERROR [coverage]` aunque los tests pasen. La cobertura completa se mide corriendo
> **toda** la suite.

### 4. Commit
```bash
git add .
git commit -m "UC8: tests de la extensión Quick Note"
```

## Criterios
- Cada `it` prueba UNA cosa con nombre descriptivo.
- Los mocks son mínimos: solo lo que la función realmente toca.
- Tests verdes y deterministas. Patrón AAA: Arrange / Act / Assert.


---
[← UC7 — Integración con el repo](UC7-jsapi-nodes.md) · 🏠 [Índice](00-INDICE.md) · [README](README.md)