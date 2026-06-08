# @akcelik/strct

**[Live documentation & demo →](https://akcelik.github.io/uistruct/)**

A standalone Angular component library built around a **tokenised, multi-palette
theme system**. Everything is driven by CSS custom properties, so a single
attribute swap re-skins the whole library.

- **3 palettes** — Arctic, Ember, Sage
- **2 modes** — Dark, Light
- Standalone components, signal inputs, `OnPush` everywhere
- `ControlValueAccessor` support on every form control
- No runtime CSS framework dependency
- WCAG-AA text contrast · OS-aware theming · `prefers-contrast` / `prefers-reduced-motion` honoured

## Install

```bash
npm install @akcelik/strct
```

`@angular/core`, `@angular/common`, `@angular/forms` and
`@angular/platform-browser` are peer dependencies (Angular 21.2+).

> **Consuming a local build?** Install the packed tarball
> (`ng build strct && npm pack dist/strct`, then `npm i ../akcelik-strct-x.y.z.tgz`)
> rather than a `file:` symlink — a symlinked dependency resolves its own copy of
> `@angular/core`, which can trip an `InputSignal` brand mismatch (TS2551) across
> Angular patch versions.

## Theme setup

Import the theme once in your global stylesheet (ships tokens + base reset +
form-control styles):

```scss
// styles.scss
@use '@akcelik/strct/styles/theme';
```

The theme **self-hosts its fonts** (DM Sans + JetBrains Mono, OFL) — they ship as
`woff2` under `styles/fonts/` and are referenced by `@font-face`, so there is no
external request and nothing else to load.

Set the scheme on the document root (or let `StrctThemeService` manage it):

```html
<html data-palette="arctic" data-theme="dark"></html>
```

```ts
import { StrctThemeService } from '@akcelik/strct';

const theme = inject(StrctThemeService);
theme.setPalette('ember'); // 'arctic' | 'ember' | 'sage'
theme.setMode('light'); // 'dark' | 'light'  (persisted to localStorage)
theme.toggleMode();
```

By default `StrctThemeService` follows the operating system's light/dark
preference (`prefers-color-scheme`) — and tracks it live — until the user makes an
explicit choice, which is then persisted and wins.

Drop the ready-made switcher anywhere:

```html
<strct-theme-switcher />
```

## Components

Import only what you use — every component is standalone.

| Area        | Components                                                                                                                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout      | `strct-shell`, `strct-header`, `strct-footer`, `strct-vertical-nav`, `strct-nav` / `strct-nav-item`, `strct-rail` (collapsible icon nav), `strct-login`                                                                                                                                                    |
| Controls    | `button[strct-button]`, `strct-button-group`, `strct-speed-dial`, `strct-badge`, `strct-tag`, `strct-avatar`, `strct-progress`, `strct-spinner`, `strct-skeleton`                                                                                                                                          |
| Surfaces    | `strct-card` (+ header/block/footer), `strct-accordion`, `strct-tabs`, `strct-tree`, `strct-modal`, `strct-drawer` (edge-anchored panel), `strct-dropdown`, `strct-context-menu` (+ `strct-submenu`), `strct-wizard`, `strct-divider`                                                                      |
| Navigation  | `strct-breadcrumb` / `strct-breadcrumb-item`, `strct-pagination`                                                                                                                                                                                                                                           |
| Forms       | `strctInput`, `strct-checkbox`, `strct-toggle`, `strct-radio-group` / `strct-radio`, `strct-range`, `strct-combobox`, `strct-cascade-select`, `strct-datepicker`, `strct-password`, `strct-file`, `strct-color-picker`, `strct-rating`, `strct-chips`, `strct-input-otp`, `strct-knob`, `strct-input-mask` |
| Data        | `strct-table`, `strct-datagrid` (sort / select / expandable rows / detail pane / batch bar / per-row kebab menu / resizable / column chooser), `strct-timeline` / `strct-timeline-item`, `strct-stack` / `strct-stack-item`                                                                                |
| Charts      | `strct-sparkline`, `strct-chart` (line / area / bar), `strct-donut`, `strct-gauge`                                                                                                                                                                                                                         |
| Feedback    | `strct-alert`, `strctTooltip`, `strct-signpost`, `strct-toast-outlet` + `StrctToastService`                                                                                                                                                                                                                |
| Foundations | `strct-icon` (datacenter icon set + status `badge`), `strct-theme-switcher`                                                                                                                                                                                                                                |

### Examples

```html
<button strct-button variant="primary">Save</button>
<button strct-button variant="outline" size="sm">Cancel</button>

<strct-badge status="success">Active</strct-badge>

<strct-modal [(open)]="show" title="Confirm">
  Body…
  <ng-container strctModalFooter>
    <button strct-button (click)="show = false">Cancel</button>
    <button strct-button variant="primary" (click)="show = false">OK</button>
  </ng-container>
</strct-modal>

<input strctInput placeholder="Name" [(ngModel)]="name" />
<strct-checkbox [(ngModel)]="agree">I agree</strct-checkbox>
```

## Design tokens

Components reference these CSS variables only — never hard-coded colors:

`--bg-0..--bg-a` surfaces · `--hdr` header · `--b1/--b2/--b3` borders ·
`--t1..--t4` text · `--inv` inverse · `--acc` (+ `--acc-m/-s/50/30/18`) accent ·
`--success / --warning / --critical` semantic (+ `*-bg`) · `--sh / --shh` shadows · `--sb` scrollbar.

## Accessibility & eye comfort

Reviewed against WCAG and display-ergonomics / vision science to limit eye strain
in long, all-day console sessions:

- **WCAG AA text contrast** — `--t1/--t2/--t3` all meet AA (≥ 4.5:1) in every
  palette and mode, with a preserved `t1 > t2 > t3` hierarchy.
- **OS-aware theming** — follows `prefers-color-scheme` until an explicit choice.
- **`prefers-contrast: more`** — stronger borders, text and focus ring on request.
- **`prefers-reduced-motion`** — animations collapse to instant state changes.
- **12px type-size floor**, 1.5 body line-height, softened (non-pure-white) light surfaces.

## License

[MIT](./LICENSE) © Serkan Akcelik
