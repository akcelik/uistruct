# UIStruct

A standalone Angular workspace containing a reusable UI component library and a
showcase application that documents it. Independent of any other project.

The design system is **token-first**: one set of CSS custom properties, three
palettes (**Arctic / Ember / Sage**) each in **dark** and **light** — six surface
schemes in total. Every component reads from the token layer, so switching the
palette or theme re-skins the whole library instantly.

## Workspace layout

```
projects/
├─ strct/        # the component library (selector prefix: strct)
│  └─ src/
│     ├─ styles/ # theme entry + tokens / base reset / form-control styles
│     └─ lib/    # components, grouped by area
└─ showcase/     # demo app — one documented page per component area
```

## Develop

```bash
npm install
ng serve showcase        # run the showcase at http://localhost:4200
```

The showcase consumes the library straight from source (TypeScript path
mapping), so edits to `projects/strct` hot-reload without a separate build step.

## Build & test

```bash
ng build strct           # package the library (ng-packagr -> dist/strct)
ng build showcase        # build the demo app
ng test strct            # library unit tests
ng test showcase         # showcase unit tests
```

## The library

See [`projects/strct/README.md`](projects/strct/README.md) for the full component
list, theming setup and usage examples. In short:

- **Layout** — shell, header, footer, vertical nav, icon nav, login
- **Controls** — button, badge, tag, avatar, progress, spinner, skeleton
- **Surfaces** — card, accordion, tabs, tree, modal, dropdown, context menu (+ submenu), wizard, divider
- **Navigation** — breadcrumb, pagination
- **Forms** — input directive, checkbox, toggle, radio group, slider, combobox, cascade select, date picker, password, file upload, color picker (all CVA-compatible)
- **Data** — table, datagrid (sort / select / expandable detail rows / batch action bar / compact / paginate / resizable / column chooser), timeline, stack view
- **Charts** — sparkline, line/area/bar chart, donut, gauge (dependency-free SVG)
- **Feedback** — alert, tooltip, signpost, toast service + outlet
- **Foundations** — icon (datacenter icon set with status badges + generic vendor marks), theme service + switcher

## Conventions

- Component selectors and the library package use the `strct` prefix; class names
  use `Strct…`.
- Components never hard-code colors — only theme tokens (`var(--…)`).
- Standalone components, signal inputs/outputs, `OnPush` change detection.
