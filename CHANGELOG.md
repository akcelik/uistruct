# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.0] - 2026-06-12

### Added

- **`strct-section-menu`** — a two-level navigation menu (categories → items; not a
  tree). Categories are `collapsible` with chevrons (default) or render as static
  uppercase section labels; category / item icons can be hidden with `showIcons`;
  the active item gets a soft accent tint. Two-way `activeId`, `select` output.
  Standalone, token-themed. Component count: 59.

## [0.10.1] - 2026-06-09

### Changed

- **Reworked the modal size scale.** The old `sm` (380px) sat too close to `md`, so
  the two are merged: `sm` is now **480px** and the rest shift up one step —
  **md 640 · lg 860** — with a new, larger **xl 1080**. The default stays `sm`
  (480px = the previous default width), so untouched modals look the same; explicit
  `size="md" | "lg" | "xl"` now render one step wider.

## [0.10.0] - 2026-06-09

### Changed — behavior

- **Modals no longer close on a backdrop click or the Escape key by default.** A
  modal now closes only through its X button or an explicit action button, so a
  stray click outside (or an accidental Escape) can't discard in-progress work.
  The `dismissible` input (default now `false`) opts a modal back into backdrop /
  Escape dismissal for lightweight, transient dialogs.

  **Migration:** if you relied on click-outside / Escape to close a modal, add the
  `dismissible` attribute to that `<strct-modal>`.

## [0.9.2] - 2026-06-08

### Changed

- **Modal sizes are now a fixed 4-step scale.** `size` accepts `'sm' | 'md' | 'lg' | 'xl'`
  with set widths — **sm 380 · md 480 · lg 640 · xl 860 px** — so dialogs stay
  consistent (no arbitrary widths). Adds `xl` and rounds the existing presets
  (was sm 360 / md 460 / lg 720). Backward compatible; `sm`/`md`/`lg` still valid.

## [0.9.1] - 2026-06-08

### Changed

- **Tree rows are more compact.** Reduced tree-node row vertical padding (7px → 4px)
  and gap (7px → 6px), bringing row height from ~34px to ~28px for a denser
  navigation list. Legibility and click target preserved. Visual only; no API change.

## [0.9.0] - 2026-06-08

### Added — new components (development round, phase 1 of 5)

- **`strct-metric-tile`** — a dense KPI tile for dashboards: a label, a large value
  (+ unit), an optional change indicator (`delta` — its sign drives the arrow and
  colour; `invertDelta` for metrics where up is bad) and an inline sparkline.
- **`strct-empty-state`** — a centered zero / permission / error state with preset
  `variant`s (`empty` / `denied` / `error` / `notfound`), an icon, a title, an
  optional description and a projected call-to-action slot.

Component count: 58. Both are standalone, token-themed and backward compatible.

## [0.8.1] - 2026-06-08

### Changed

- **Accordion is now a unified stack.** Panels were previously detached cards
  separated by gaps; they now form one cohesive surface — a single rounded border
  with hairline dividers between consecutive panels and no gaps. Independent
  expand/collapse behaviour is unchanged. Visual only; no API change.

## [0.8.0] - 2026-06-08

### Added — Visual comfort & accessibility (eye-health round II)

Continuing the eye-strain work from 0.7.2, this round respects the user's
environment and their operating-system accessibility settings. Why each change:

- **OS-aware theming.** `StrctThemeService` now follows the operating system's
  `prefers-color-scheme` when the user has not made an explicit choice, and keeps
  following it live. An explicit selection still wins and is persisted. Reason: a
  user working at night or in a dim room should not be forced onto a bright screen
  on first load (high luminance + melanopic / blue-light load suppresses melatonin
  and shifts circadian phase). The showcase resolves the same preference before
  paint to avoid a flash.
- **High-contrast support (`prefers-contrast: more`).** When the OS asks for more
  contrast (low-vision users, bright ambient light), borders and secondary /
  tertiary text are strengthened and the focus ring becomes a solid 3px accent
  outline. It is active **only** when the OS requests it — the default look is
  unchanged.

### Changed

- **Type-size floor raised to 12px.** Every piece of readable text that previously
  sat at 11px (hints, captions, labels and metadata across components) is now
  ≥ 12px, and the default body line-height is 1.5. Reason: 11px sustained reading
  is below the comfortable acuity threshold for all-day console work; together
  with the 0.7.2 contrast fix this removes the remaining small-text strain. No
  layout regressions.

Backward compatible — no API or token-name changes. (`prefers-reduced-motion`
continues to be honoured by the base stylesheet.)

## [0.7.2] - 2026-06-08

### Changed — Visual comfort & eye health

These token tweaks come from a vision-science / WCAG review of the theme, aimed at
**reducing eye strain during long, all-day operations-console sessions**. Why each
change was made:

- **Tertiary text (`--t3`) now meets WCAG AA (≥ 4.5:1) in all six schemes.** It
  previously measured only ~2.4:1 (dark) and ~3.0:1 (light) — below the AA
  threshold — yet it is used for hints, captions, placeholders and metadata. Text
  that faint forces the eye into sustained accommodation to decode it, and on dark
  backgrounds off-axis halation lowers the effective contrast even further. `--t3`
  now measures **4.65–4.77:1** everywhere.
- **Secondary text (`--t2`) raised in the ember & sage palettes (to ~6:1).** Two
  reasons: (1) raising `--t3` would otherwise have inverted the text hierarchy, so
  `--t2` had to stay above it (the intended order is `--t1` > `--t2` > `--t3`); and
  (2) `--t2` itself was already slightly below AA (~4.2–4.4:1) in the ember/sage
  light schemes.
- **Light arctic surface (`--bg-1`) softened from pure `#ffffff` to `#fbfcfd`.**
  A pure-white surface produces discomfort glare (high luminance + high melanopic /
  blue-light load) in dim datacenter rooms and creates a harsh near-black-on-white
  contrast that triggers halation. A ~5% off-white reduces both while staying well
  within AA.

Values only — **no API or token-name changes, fully backward compatible.** The
`--t1` > `--t2` > `--t3` legibility hierarchy is preserved across every palette and
mode. (`prefers-reduced-motion` was already honoured in the base stylesheet.)

## [0.7.1] - 2026-06-08

### Changed

- **Trash icon** — redesigned the `trash` glyph as a clearer waste-bin (lid bar + handle + tapered rounded body + three vertical ridges) so it reads unmistakably as delete at small sizes.

## [0.7.0] - 2026-06-08

### Added

- **`strct-rail`** — collapsible, data-driven primary navigation rail for an application shell. Items are icon + label + optional status badge (`StrctRailItem`); collapsing shrinks it to an icon-only rail where badges become dots and labels become tooltips. Two-way `activeId` / `collapsed`, `select` output.
- **`strct-drawer`** — edge-anchored slide-out overlay panel (`side` = start/end/top/bottom, `size` = sm/md/lg) for inspector / edit flows without losing the underlying list's scroll or selection. Two-way `open`, backdrop + Escape dismiss, `strctDrawerFooter` slot.

### Notes

- These were identified as the highest-value gaps for infrastructure consoles (alongside the existing shell, vertical-nav and stack/property views). Component count: 56.

## [0.6.0] - 2026-06-08

### Added

- **Datagrid row actions** — set `[rowActions]="(row) => StrctMenuItem[]"` to give every row a trailing actions column with a vertical-dots (kebab) button that opens that row's data-driven, body-portaled menu. A new `(rowAction)` output emits `{ row, item }` on selection.
- **`StrctMenuService`** — imperatively open the data-driven menu panel at viewport coordinates; shared by the `[strctContextMenu]` directive and the datagrid kebab.

### Changed

- The `[strctContextMenu]` directive now delegates to `StrctMenuService` (no behavioral change).

## [0.5.31] - 2026-06-07

### Changed

- **Switch icon** — redesigned the `switch` glyph as a network switch front-panel view (chassis + two status LEDs + a row of RJ45 ports) instead of the previous box-with-legs shape that read as an insect.

## [0.5.27] - 2026-06-06

### Changed

- **Maintenance badge icon** — refined the badge SVG to closer match the classic hand-holding-wrench silhouette (open wrench head + fingers gripping the handle).

## [0.5.26] - 2026-06-06

### Changed

- **Maintenance badge icon** — refined the badge SVG to read as a hand holding a wrench for a more universal "under maintenance" meaning.
- **Maintenance badge size** — slightly enlarged so the hand+wrench detail is readable at small icon sizes.

## [0.5.25] - 2026-06-06

### Changed

- **Maintenance badge icon** — replaced the single-wrench SVG with a crossed wrench + screwdriver glyph to match classic maintenance/tooling iconography.
- **Icon badges** — all status badges (success, critical, off, info, warning, maintenance) are now slightly larger and positioned a bit further outside the glyph for better visibility.
- **Showcase footer version** — footer version is now bound to `App.version` so it stays in sync with releases.

## [0.5.24] - 2026-06-06

### Added

- **Icon maintenance badge** — new `badge="maintenance"` overlay renders a small wrench icon on a yellow badge, perfect for host/cluster/vm maintenance states.
- **Showcase icons page** — added `Maintenance` to the interactive state buttons and updated static state examples to use the new maintenance badge.

## [0.5.23] - 2026-06-06

### Changed

- **Icon warning badge** — enlarged the warning triangle badge (up to 14px) and added a black exclamation mark inside it so degraded states are much more readable at a glance.

## [0.5.22] - 2026-06-06

### Added

- **Showcase icons page** — new "Interactive object states" demo where you can click state buttons (Running / Maint / Critical / Stopped) to update the badge on Cluster, Host and VM icons in real time.
- **Object states gallery** — expanded the static state grid to cover every state for Cluster, Host and VM.

## [0.5.21] - 2026-06-06

### Changed

- **Icon badges** — the `warning` badge overlay is now a yellow triangle instead of a solid circle, making degraded/warning states more recognizable at a glance.
- **Showcase icons page** — added a "Cluster · degraded" state example so the new warning triangle badge is demonstrated on the cluster icon.

## [0.5.20] - 2026-06-06

### Changed

- **Icon set** — redesigned the `cluster` glyph as a group of three vertical server/rack units (center unit prominent, side units behind) with small indicator dots, inspired by classic datacenter cluster iconography.

## [0.5.19] - 2026-06-06

### Changed

- **Icon set** — redesigned the `cluster` glyph as a clearer 2×2 grid of connected nodes so it reads as a cluster/group at small sizes.

## [0.5.18] - 2026-06-06

### Changed

- **Showcase icons page** — vendor marks in the Vendors demo are now rendered as uppercase text labels (HPE, DELL, CISCO, VMWARE, KAYTUS) instead of abstract SVG glyphs.
- **Showcase data page** — Table and Datagrid demos now display cluster rows (`Cluster / Type / Hosts / Status`) instead of generic service rows, matching the datacenter theme.

## [0.5.11] - 2026-06-06

### Changed

- **Datagrid column chooser** — moved back to the left side of the footer, keeping the `strct-button` neutral small style.

### Fixed

- **Showcase app** — restored the component library documentation structure (landing page, component browser, sidebar categories) that was accidentally replaced by an appliance management app.

## [0.5.9] - 2026-06-06

### Changed

- **Datagrid column chooser placement** — the column visibility toggle has moved from the left side of the footer to the far right, next to pagination.
- **Datagrid column chooser button style** — the settings button now uses the standard `strct-button` component with `size="sm"` and `variant="neutral"` instead of a custom styled icon button.
- **Datagrid dropdown alignment** — the column chooser dropdown menu is now right-aligned so it no longer overflows the grid boundary.

### Added

- **Datagrid docs** — added missing API entries for `columnChooser`, `resizable` and `loading` inputs in the showcase registry.
- **Datagrid test** — added a unit test covering column chooser open/close and column visibility toggling.

## [0.5.0] - 2026-06-05

Major framework-quality release. Consolidates semantics, expands the icon set, introduces a scalable token system, loading states, responsive behaviours and accessibility improvements.

### Added

- **Expanded icon set** — 17 foundational action icons (`plus`, `minus`, `pencil`, `trash`, `refresh`, `filter`, `settings`, `user`, `logout`, `undo`, `redo`, `arrowUp`, `arrowDown`, `arrowLeft`, `arrowRight`, `externalLink`) plus 14 modern infrastructure icons (`pod`, `deployment`, `service`, `node`, `ingress`, `cloud`, `container`, `firewall`, `shield`, `certificate`, `key`, `metrics`, `logs`, `trace`).
- **Composite off icons** — `eyeOff` and `bellOff` now reuse their base glyph plus a slash overlay, eliminating duplicated SVG paths.
- **Design token expansion** — new `--space-*`, `--radius-*`, `--shadow-*`, `--text-*`, `--leading-*` and `--disabled-opacity` tokens across all six palettes/modes.
- **Loading states** — `StrctDatagrid`, `StrctTable` and `StrctCombobox` now accept a `[loading]` input and render skeleton placeholders.
- **Responsive breakpoint system** — new `--bp-sm/md/lg/xl` tokens plus mobile drawer for `StrctShell`, horizontal scroll for `StrctDatagrid`, scrollable tabs, responsive modal sizing and viewport-safe dropdowns.
- ** prefers-reduced-motion support** — global CSS reset disables animations and transitions when the user prefers reduced motion.
- **Icon accessibility** — `<strct-icon>` now accepts an `ariaLabel` input and exposes `role="img"` / `aria-hidden` accordingly.
- **Toast assertive announcements** — `critical` toasts now use `aria-live="assertive"` by default; other types remain `polite`.
- **CI pipeline** — GitHub Actions workflow runs lint, test and build on every push/PR.
- **Pre-commit hooks** — Husky + lint-staged run ESLint --fix and Prettier on staged files.
- **Bundle analysis** — `npm run bundle:analyze` generates a production build with source-map-explorer output.

### Changed

- **Unified semantic naming** — `danger` → `critical`, `ok` → `success`, `warn` → `warning`, `crt` → `critical` throughout types, CSS tokens, component APIs and documentation.
- `StrctModal.dismissable` renamed to `dismissible`.
- `ellipsis` icon removed (duplicate of `dots`).
- Production component-style budgets raised to 8 kB warning / 12 kB error.

### Added (tooling)

- ESLint with `@angular-eslint`, including template accessibility rules.
- 127 unit tests across 56 spec files (up from 9 spec files / 17 tests).
- JSDoc/TSDoc comments on all public APIs.

## [0.4.0] - 2026-06-04

Third feedback round. All additions are **backward-compatible**.

### Added

- **Per-node tree context menu** — `<strct-tree [nodeMenu]="fn">` takes a resolver
  `(node) => StrctMenuItem[]` and wires a `[strctContextMenu]` trigger on every node
  row; a new `(nodeMenuSelect)` output emits `{ node, item }`. Nodes whose resolver
  returns an empty array open no menu.

### Changed

- **Combobox** no longer caps its width at 280px (fills its container) and drops the
  dead absolute-position menu CSS that `StrctOverlay` already overrode.

### Fixed

- `StrctMenuItem.label` is now optional — a `divider` entry no longer needs a
  meaningless placeholder label.

## [0.3.0] - 2026-06-04

Second feedback round (SHOULD-FIX) — all additions are **backward-compatible**.

### Added

- **`strct-field`** — a form-field wrapper with label, required marker, hint and error
  message that auto-wires `aria-describedby` and `aria-invalid` on the projected control.
- **Self-hosted fonts** — DM Sans and JetBrains Mono (OFL) now ship as `woff2` under
  `styles/fonts/` and are referenced by `@font-face` in the theme, so the library renders
  in its intended type with no external request.
- **Icons** — added `folder`, `template`, `tag`, `resourcePool` and `portGroup` glyphs.

### Changed

- **Modal** now locks body scroll while open (reference-counted for nested modals) and
  restores it on close / destroy.
- **Overlay** flips horizontally (`left` / `right` placements) when it would overflow the
  viewport edge, instead of only clamping.
- **Submenu** flips to the left near the right edge and can be opened via click / tap and
  the keyboard (Enter / Space / →, closed with ← / Esc), not hover only.

## [0.2.0] - 2026-06-04

Feedback-driven release — all additions are **backward-compatible**.

### Added

- **Datagrid / Table cell templates** — a `*strctCell="key"` template per column for
  custom cell content (status pills, links, action buttons). Context exposes
  `let-row`, `let-value="value"` and `let-column="column"`.
- **Datagrid `rowId`** — a stable row identity (property key or function) so selection,
  expansion and the active detail row survive live data re-fetches that replace the row
  objects. `selectionChange` now emits fresh row objects resolved by id.
- **Data-driven tree** — `<strct-tree [nodes]>` self-recurses over a `StrctTreeNodeData[]`
  of any depth, with a new `(nodeActivated)` output and a per-node `badge` input for object
  state on the node.
- **Data-driven context menu** — a new `[strctContextMenu]="items"` directive that portals
  into `<body>` (no overflow / transform clipping), positions by its real measured size,
  supports full keyboard navigation (↑/↓/→/←/Enter/Esc with roving tabindex) and nested
  submenus, and runs each item's `action`.
- **Wizard step validation** — a per-step `[canAdvance]` gate for Next / Finish, plus wizard
  `[submitting]`, `[cancelable]`, `[finishLabel]` inputs and `(cancelled)`, `(stepChange)`
  outputs.

## [0.1.1] - 2026-06-04

### Added

- Published documentation & demo site on GitHub Pages: <https://akcelik.github.io/uistruct/>.
- Link to the live documentation site in the package README.

_No component API changes in this release._

## [0.1.0] - 2026-06-04

### Added

- Initial public release of `@akcelik/strct`.
- **53 standalone, signal-based Angular components** across eight categories — Controls,
  Forms, Surfaces, Navigation, Data, Charts, Feedback and Patterns.
- **Tokenised theme system**: three palettes (Arctic, Ember, Sage) × light/dark, driven
  entirely by CSS custom properties bound to `[data-palette][data-theme]` on the document root.
- **Datacenter-flavoured stroke icon set** with object-state badges (running / stopped /
  maintenance / off) layered via the icon `badge` input, plus generic vendor marks.
- **ControlValueAccessor** support on every form control (input, checkbox, toggle, radio,
  slider, combobox, datepicker, password, file, color picker, cascade select, rating, chips,
  OTP, knob, input mask).
- Dependency-free SVG charts (sparkline, line / area / bar, donut, gauge).
- Overlay-safe dropdowns, tooltips and menus; accessible modal with focus trap.
- Zoneless, `OnPush` change detection throughout. MIT licensed.

[0.4.0]: https://github.com/akcelik/uistruct/releases/tag/v0.4.0
[0.3.0]: https://github.com/akcelik/uistruct/releases/tag/v0.3.0
[0.2.0]: https://github.com/akcelik/uistruct/releases/tag/v0.2.0
[0.1.1]: https://github.com/akcelik/uistruct/releases/tag/v0.1.1
[0.1.0]: https://github.com/akcelik/uistruct/releases/tag/v0.1.0
