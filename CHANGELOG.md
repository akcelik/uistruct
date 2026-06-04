# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.0]: https://github.com/akcelik/uistruct/releases/tag/v0.2.0
[0.1.1]: https://github.com/akcelik/uistruct/releases/tag/v0.1.1
[0.1.0]: https://github.com/akcelik/uistruct/releases/tag/v0.1.0
