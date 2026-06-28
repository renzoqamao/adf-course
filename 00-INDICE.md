# Curso: Angular + Alfresco ADF

> 🏠 [Volver al README](README.md)

Material de aprendizaje basado en el repo real `alfresco-content-app`, para
aprender a desarrollar extensiones sobre Angular + ADF mediante casos de uso.

## Proyecto del curso: extensión "Quick Note"

A lo largo de UC2→UC8 vas a construir, paso a paso, una **extensión ADF funcional**:
un botón "Agregar nota" que aparece al seleccionar un nodo, abre un diálogo para
escribir una nota y la guarda en el nodo (propiedad `cm:description`) usando la API
de Alfresco. UC1 es el repaso de Angular que sienta las bases. Al final tenés una
app/extensión completa, de la UI hasta el repositorio.

## Cómo usar este material
- Cada caso de uso (UC) es una lección autocontenida con: **conceptos**, **recordatorios**
  de Angular y una **tarea** que escribís vos.
- la rama main queda con la version inicial del proyecto.
- Metodología de revisión: **una rama git por UC** (cada rama tiene los cambios progresivos):
  ```bash
  git checkout main
  git checkout -b uc1-angular-refresher
  ```


## El modelo mental (cómo encaja todo)

```
ACA (Alfresco Content App) = app Angular
  └─ usa librerías ADF (@alfresco/adf-*)
       · adf-core         → AppConfigService, i18n, NotificationService
       · adf-content-services → nodos, document list, viewer, AlfrescoApiService
       · adf-extensions   → sistema de plugins (plugin.json, evaluators)
  └─ una extensión se "engancha" con un provider en los providers de la app
                        │ js-api (HTTP)
                        ▼
         Repositorio Alfresco (backend, web scripts)
```

## Ruta de aprendizaje

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

Empezá por [UC1](UC1-angular-refresher.md) y avanzá en orden. ¡Éxitos!
