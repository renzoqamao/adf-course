# UC1 — Repaso de Angular moderno

> 🏠 [Índice](00-INDICE.md) · [README](README.md)

**Objetivo:** reactivar los conceptos que vas a usar en TODA la extensión:
componentes standalone, data binding, signals, `inject()` y RxJS básico.

**Rama sugerida:** `uc1-angular-refresher`

> Este UC es un *warm-up* genérico. El proyecto "Quick Note" arranca en UC2.

## Conceptos (recordatorio)

### 1. Componente standalone
En Angular moderno no hace falta `NgModule`. Marcás `standalone: true` e importás
lo que use el template.

### 2. Data binding (4 tipos)
- Interpolación: `{{ count() }}` → muestra un valor
- Property binding: `[disabled]="count() === 0"` → setea una propiedad del DOM
- Event binding: `(click)="increment()"` → escucha un evento
- Two-way: `[(ngModel)]="x"` (lo verás en UC6)

### 3. Signals (variables reactivas)
```ts
count = signal(0);          // crear
count();                    // LEER → ¡con paréntesis, es una función!
count.update(n => n + 1);   // actualizar
double = computed(() => count() * 2);  // derivado, se recalcula solo
```

### 4. inject() — Inyección de dependencias
`private readonly logger = inject(LoggerService);` — DI sin constructor.

**¿Qué es el "contexto de DI" (injection context)?**
DI = *Dependency Injection*. En vez de crear vos las dependencias con `new`,
Angular tiene un **inyector** que las construye y te las entrega. El **contexto de
DI** es el momento/lugar donde ese inyector está "activo" y `inject()` puede pedirle
cosas. Angular lo activa, por ejemplo, **mientras construye un componente o
servicio**, en factory functions de providers, etc.

- ✅ Dentro de ese contexto → `inject(LoggerService)` funciona.
- ❌ Fuera de él (p. ej. si hacés `new MiComponente()` a mano, o lo llamás dentro
  de un callback random) → lanza **`NG0203: inject() must be called from an
  injection context`**.

Por eso en los tests se usa `TestBed.createComponent(...)` (que crea el componente
*dentro* del contexto) y no `new`. Si necesitás usar `inject()` fuera de timing,
existe `runInInjectionContext(injector, () => inject(...))`.

### 5. RxJS básico
`Observable` = flujo de valores que llegan **a lo largo del tiempo** (no un valor
único como un signal, sino varios, uno tras otro).

**Qué hace `seconds$` en el contador:**
```ts
readonly seconds$: Observable<number> = interval(1000).pipe(map((n) => n + 1));
```
- `interval(1000)` crea un Observable que **emite** un número cada 1000 ms: `0, 1, 2, 3...`
- `.pipe(map(n => n + 1))` transforma cada valor → `1, 2, 3, 4...` (para empezar en 1).
- La convención `$` al final del nombre (`seconds$`) indica "esto es un Observable".
- Ojo: un Observable es **perezoso**: no emite nada hasta que alguien se **suscribe**.

**Qué hace `| async` en el template:**
```html
<p>Segundos en la página: {{ seconds$ | async }}</p>
```
El pipe `async`:
1. **Se suscribe** por vos al Observable `seconds$` (por eso empieza a emitir).
2. Cada vez que llega un valor nuevo, **lo muestra** y dispara el render (verás
   1, 2, 3... cambiando solo).
3. Cuando el componente se destruye, **se desuscribe automáticamente** → evita
   *memory leaks*. Sin `async`, tendrías que hacer `subscribe()` y `unsubscribe()`
   a mano.

> Regla práctica: si en el template necesitás el valor actual de un Observable,
> usá `| async` en vez de suscribirte a mano en el `.ts`.

### 6. `computed` y su relación con `update` (a fondo)

En el contador hay dos signals de naturaleza distinta:
```ts
readonly count  = signal(0);                        // ① WRITABLE: lo cambiás vos
readonly double = computed(() => this.count() * 2); // ② COMPUTED: derivado, solo lectura
```
- **`count`** es *escribible*: tiene `.set()` y `.update()`.
- **`double`** es *computado*: su valor no se asigna a mano, lo calcula la función
  `() => this.count() * 2`. **No** tiene `.set()` ni `.update()`.

**Cómo se relacionan con `update`:** un `computed` *observa* qué signals lee
adentro. Como `double` llama a `this.count()`, Angular registra automáticamente
que **`double` depende de `count`**. El ciclo al hacer clic en **+**:
```
increment()
  → this.count.update(n => n + 1)   // count: 0 → 1  (escribís SOLO count)
  → count cambió → double queda "invalidado"
  → al LEER double() (el template), se recalcula: 1 * 2 = 2
```
Vos nunca tocás `double`: se recalcula solo porque depende de `count`. Esa es la
relación.

> `update` vs `set`:
> - `count.set(5)` → fija un valor sin mirar el anterior.
> - `count.update(n => n + 1)` → calcula el nuevo **a partir del actual** (`n` es el
>   valor previo). Por eso "+1" usa `update`.

Dos propiedades clave de `computed`:
1. **Lazy (perezoso):** no recalcula cuando cambia `count`, sino cuando alguien
   **lee** `double()` (p. ej. el template al renderizar). Si nadie lo lee, no gasta CPU.
2. **Memoizado:** si lo leés varias veces y `count` no cambió, devuelve el valor
   cacheado sin recalcular.

**Mini-regla:**
- ¿Dato "fuente" que vas a modificar? → `signal` + `set`/`update`.
- ¿Dato que se **calcula** a partir de otros signals? → `computed` (nunca lo escribas a mano).

---

## Paso a paso (seguilo para desarrollar)

### 0. Crear la rama
```bash
git checkout main
git checkout -b uc1-angular-refresher
```

### 1. Crear la carpeta del ejercicio
```
projects/aca-content/quick-note/learning-uc1/
```

### 2. Crear el servicio — `learning-uc1/logger.service.ts`
```ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(message: string): void {
    console.log('[UC1]', message);
  }
}
```

### 3. Crear el componente — `learning-uc1/counter.component.ts`
```ts
import { Component, computed, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { interval, map, Observable } from 'rxjs';
import { LoggerService } from './logger.service';

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './counter.component.html'
})
export class CounterComponent {
  private readonly logger = inject(LoggerService);

  readonly count = signal(0);
  readonly double = computed(() => this.count() * 2);
  readonly seconds$: Observable<number> = interval(1000).pipe(map((n) => n + 1));

  increment(): void {
    this.count.update((n) => n + 1);
    this.logger.log(`count = ${this.count()}`);
  }

  decrement(): void {
    this.count.update((n) => n - 1);
    this.logger.log(`count = ${this.count()}`);
  }
}
```

### 4. Crear el template — `learning-uc1/counter.component.html`
```html
<h3>Contador: {{ count() }} (doble: {{ double() }})</h3>
<button (click)="decrement()" [disabled]="count() === 0">−</button>
<button (click)="increment()">+</button>
<p>Segundos en la página: {{ seconds$ | async }}</p>
```

### 5. (Opcional) Verificar con un test — `learning-uc1/counter.component.spec.ts`
```ts
/// <reference types="jasmine" />
import { TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CounterComponent]   // standalone → va en `imports`
    });
  });

  it('incrementa y nunca baja de 0', () => {
    const fixture = TestBed.createComponent(CounterComponent);
    const c = fixture.componentInstance;

    c.increment();
    expect(c.count()).toBe(1);
    expect(c.double()).toBe(2);

    c.decrement();
    expect(c.count()).toBe(0);
  });
});
```

**Qué hace cada línea:**

| Línea | Qué hace |
|-------|----------|
| `/// <reference types="jasmine" />` | Directiva (no se ejecuta): hace que TS/VS Code carguen los tipos de Jasmine → reconoce `describe/it/expect`. |
| `import { TestBed } ...` | Utilidad de testing de Angular: arma un mini-entorno con **contexto de DI** y crea componentes como la app real. |
| `import { CounterComponent } ...` | Importa el componente a probar (`./` = mismo directorio). |
| `describe('CounterComponent', () => {` | Agrupa los tests relacionados bajo un nombre ("suite"). Solo organiza. |
| `beforeEach(() => {` | Corre **antes de cada `it`** → deja un estado limpio en cada test. |
| `TestBed.configureTestingModule({...})` | Configura qué necesita Angular para crear el componente. |
| `imports: [CounterComponent]` | Como es **standalone**, va en `imports`. `LoggerService` no se declara: es `providedIn: 'root'`. |
| `it('incrementa y nunca baja de 0', () => {` | Define **un** test. Patrón AAA: *Arrange → Act → Assert*. |
| `const fixture = TestBed.createComponent(...)` | Crea el componente **dentro del contexto de DI** (acá `inject()` ya funciona). Devuelve un *fixture* (envoltorio con la instancia, el HTML, utilidades). |
| `const c = fixture.componentInstance` | La instancia real de la clase: por `c` llamás métodos y leés signals. |
| `c.increment()` | **Act:** ejecuta la acción → `count` pasa a 1. |
| `expect(c.count()).toBe(1)` | **Assert:** `expect(valor).toBe(esperado)` verifica igualdad estricta (`===`). Ojo: el signal se lee con paréntesis `c.count()`. |
| `expect(c.double()).toBe(2)` | `double` es `computed` y depende de `count` → `1 * 2 = 2`. |
| `c.decrement(); expect(c.count()).toBe(0)` | Baja a 0 y lo verifica. |

> `toBe` usa `===` (números, strings, booleanos o misma referencia). Para comparar
> objetos/arrays por **contenido** se usa `toEqual`.
Correr: `npx nx test aca-content` (el runner es **Karma + Jasmine**).

**Correr SOLO este spec** (sin ejecutar toda la suite): usá la opción `--include`
del builder de Karma, que compila y carga únicamente los specs que matchean el glob:
```bash
npx nx test aca-content --watch=false --include="**/counter.component.spec.ts"
# si nx no reenvía el flag, usá el separador --:
npx nx test aca-content --watch=false -- --include="**/counter.component.spec.ts"
# o por carpeta:
npx nx test aca-content --watch=false --include="quick-note/**/*.spec.ts"
```
El glob es relativo a la raíz del proyecto (`projects/aca-content`), igual que el
`include` de `tsconfig.spec.json`.

> Alternativa rápida: `fit(...)` / `fdescribe(...)` enfocan un test, pero **igual
> compilan todos los specs**; `--include` es mejor porque ni carga los demás.
> (Si usás `fit`/`fdescribe`, acordate de sacarlos después.)

> ⚠️ **No** instancies el componente con `new CounterComponent()`: como usa
> `inject(LoggerService)`, fuera del contexto de DI lanza
> *NG0203: inject() must be called from an injection context*. Por eso se usa
> `TestBed`, que crea ese contexto.

> ℹ️ Si VS Code marca `Cannot find name 'describe'/'it'/'expect'`, es porque la
> carpeta nueva queda fuera del `tsconfig` de tests. La línea
> `/// <reference types="jasmine" />` arriba lo soluciona en el editor. El test
> igual corre bien con `nx test aca-content`.

### 6. Ver el contador en el navegador 🌐

Para verlo en una URL real, agregalo como **ruta** de nivel superior en la app
(igual que `/login`):

1. Asegurate de que la carpeta se llame `learning-uc1` (sin la doble n).
2. Editá `app/src/app/app.routes.ts` y agregá la ruta (carga *lazy*):
   ```ts
   export const APP_ROUTES = [
     {
       path: 'login',
       component: AppLoginComponent,
       data: { title: 'APP.SIGN_IN' }
     },
     {
       path: 'uc1',
       loadComponent: () =>
         import('../../../projects/aca-content/quick-note/learning-uc1/counter.component')
           .then((m) => m.CounterComponent),
       data: { title: 'UC1' }
     }
   ];
   ```
3. Arrancá la app:
   ```powershell
   $env:BASE_URL = "https://tu-backend-alfresco"; npm start   # PowerShell
   ```
   ```bash
   BASE_URL=https://tu-backend-alfresco npm start              # bash
   ```
4. Abrí **http://localhost:4200/#/uc1** → deberías ver el contador funcionando.
   - Es una ruta de nivel superior (como `/login`), se muestra **sin el shell** de ACA.
   - Si te redirige a login, iniciá sesión (`admin`/`admin`) y volvé a `/#/uc1`.

> 💡 Si el build se queja de que el archivo no está incluido en la compilación,
> mové la carpeta a `app/src/app/learning-uc1/` (queda dentro del scope de la app)
> y cambiá el import a `./learning-uc1/counter.component`.

### 7. Commit y merge a main
```bash
git add .
git commit -m "UC1: repaso Angular (signals, inject, RxJS)"
```

## Criterios de "lo hiciste bien"
- Leés el signal SIEMPRE con paréntesis: `count()`, nunca `count`.
- No usás `subscribe()` manual para `seconds$`: lo maneja el `async` pipe.
- El servicio se inyecta con `inject()`.

---
🏠 [Índice](00-INDICE.md) · **Siguiente:** [UC2 — Config + i18n →](UC2-config-i18n.md)
