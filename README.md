# ADF Course — Construcción de una extensión para Alfresco Content App

Curso práctico de **ADF (Alfresco Digital Framework)** sobre **Angular**: aprendé a
desarrollar extensiones para **Alfresco Content App (ACA)** paso a paso, una rama por
caso de uso.

## 🎯 Qué vas a construir

A lo largo de los casos de uso (UC2 → UC8) construís una **extensión ADF funcional**
llamada **"Quick Note"**: un botón "Agregar nota" que aparece al seleccionar un nodo,
abre un diálogo para escribir una nota y la guarda en el nodo (propiedad
`cm:description`) usando la API de Alfresco. UC1 es el repaso de Angular que sienta
las bases.

## ✅ Requisitos

### Conocimientos
- Angular básico (componentes, servicios, DI). El UC1 repasa lo esencial.
- TypeScript y nociones de RxJS (también se repasan a medida que aparecen).
- Git básico (ramas, commit, merge).

### Software
| Herramienta | Versión / nota |
|-------------|----------------|
| **Node.js** | **18.20.5** (confirmado funcionando). Esta ACA usa **Angular 19.2**, que soporta Node `18.19+`, `20.11+` o `22.x`. ⚠️ **Node 24 NO sirve** (Angular 19 no lo soporta), aunque `.nvmrc` diga `24.13.0` — ese valor está adelantado/inconsistente para este snapshot. |
| **npm** | el que viene con Node 18.20 |
| **Git** | cualquier versión reciente |
| **Backend Alfresco (ACS)** | una instancia accesible (local con Docker o un servidor de pruebas). Para local, login por defecto `admin` / `admin`. |
| **Navegador** | Chrome / Edge / Firefox actual |
| **Editor** | VS Code recomendado |

## 🚀 Cómo iniciar el proyecto Angular (host: Alfresco Content App)

> La extensión se desarrolla *dentro* de Alfresco Content App, que es la app Angular
> anfitriona. Estos pasos la levantan en tu máquina.

```bash
# 1. Clonar el repo del curso
git clone https://github.com/renzoqamao/adf-course.git
cd adf-course

# 2. Usar la versión de Node correcta (NO uses la de .nvmrc; está mal para Angular 19)
nvm install 18.20.5
nvm use 18.20.5
node -v             # debe imprimir v18.20.5

# 3. Instalar dependencias (instalación limpia)
npm ci

# 4. Apuntar al backend de Alfresco y arrancar
#    BASE_URL es el host de tu ACS (lo usa el proxy en app/proxy.conf.js)
BASE_URL=https://tu-backend-alfresco npm start
```

- La app queda en **http://localhost:4200**.
- `npm start` ejecuta `nx serve content-ce`.
- En Windows (PowerShell), seteá la variable antes de arrancar:
  ```powershell
  $env:BASE_URL = "https://tu-backend-alfresco"; npm start
  ```

### Comandos útiles
```bash
npm start          # servir en desarrollo (nx serve content-ce)
npm run build      # build de producción (nx build content-ce)
npm test           # tests unitarios (nx test)
```

## 📚 Índice de casos de uso

| UC | Tema | Concepto central | Aporta al proyecto |
|----|------|------------------|--------------------|
| [UC1](UC1-angular-refresher.md) | Repaso Angular moderno | signals, inject, binding, RxJS | bases (warm-up) |
| [UC2](UC2-config-i18n.md) | Config + i18n | `AppConfigService`, `provideTranslations` | textos y config de la extensión |
| [UC3](UC3-extension-toolbar-button.md) | Botón en toolbar | sistema de extensiones (`plugin.json`) | el botón "Agregar nota" |
| [UC4](UC4-evaluators-rules.md) | Reglas de visibilidad | evaluators, `RuleContext`, permisos | mostrar el botón solo cuando aplica |
| [UC5](UC5-ngrx-action-effect-service.md) | Estado con ngrx | Action → Effect → Service | conectar el click a la lógica |
| [UC6](UC6-dialogs-rxjs.md) | Diálogos + RxJS | `MatDialog`, `afterClosed`, `switchMap` | el diálogo para escribir la nota |
| [UC7](UC7-jsapi-nodes.md) | Integración con el repo | `js-api`, nodos, propiedades | guardar la nota en el nodo |
| [UC8](UC8-testing.md) | Testing | specs, mocks de `RuleContext` | tests de la extensión |
| [UC9](UC9-multiple-nodes.md) | Varios nodos (extra) | `forkJoin`, multi-selección, errores parciales | aplicar la nota en lote (aditivo) |

Ver también el [índice extendido](00-INDICE.md) con el modelo mental de ACA/ADF.

