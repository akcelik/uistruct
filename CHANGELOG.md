# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-07-20

### Added — `strct-searchbox`

The docs-header search pattern as a component: a compact pill with a leading
search icon, a label / input and an optional keyboard-hint chip.

- **Input mode** (default): a real search field — two-way `value` (CVA-
  compatible), Enter emits `(search)`, Escape / the labeled × clears, the
  hint chip hides while typing. `role="searchbox"`, fully labeled.
- **`trigger` mode**: a button that only emits `(activated)` — the classic
  "search pill that opens the command palette" header pattern; show the
  palette hotkey via `hint="⌘K"`.
- Public `focus()` / `clear()` methods; localizable labels.
- Dogfooded: the docs site's own header search now runs on it.

## [1.3.0] - 2026-07-19

### Added — categorical chart palette `--chart-1..8` (FR-CHART-15)

- **Theme tokens** `--chart-1..8` in every palette × mode: a categorical data
  palette with a **fixed, colorblind-validated slot order per palette** (the
  CVD-safety mechanism). Slot 1 tracks the theme's accent hue at data-grade
  chroma, so a primary series feels on-theme without the muted UI `--acc`.
  Every set was run through the dataviz palette validator against its `--bg-0`
  surface — results and design rules in `docs/chart-palette.md`.
- **`StrctChartSeries.color`** — accepts a semantic status _or_ a categorical
  slot `'chart-1'..'chart-8'` (new `StrctChartColor` / `StrctChartSlot`
  types). Semantic statuses stay reserved for health; existing callers are
  untouched.

## [1.2.1] - 2026-07-19

### Fixed — `strct-chart` tooltip edge clamp (FR-CHART-14)

The hover tooltip now **edge-flips** instead of centering blindly: near the
left edge it left-aligns, near the right edge it right-aligns (single, multi
and gap tips alike), so the **first and last point's values are never
clipped** by an `overflow: hidden` ancestor (cards, scroll panes). The
crosshair stays on the true point-X — only the balloon shifts; mid-chart
hovers are unchanged. The y-axis value chip is likewise clamped into the
plot box.

## [1.2.0] - 2026-07-17

### Added — `strct-chart` advanced axes & composition (all additive)

- **`stacked`** — multi-series values stack cumulatively: each series draws
  at the running total and fills a solid layer band down to the series below;
  tooltips keep the original per-series values; nulls break the stack.
- **`times`** — per-point timestamps (`number | Date`): x positions map to
  real time, so uneven sampling renders honestly; hover snaps to the nearest
  point by pixel distance; labels/annotations/zoom all follow.
- **`scale="log"`** — logarithmic y-axis with equal decade spacing and decade
  ticks; the floor is the smallest positive visible value (or an explicit
  positive `min`).

## [1.1.0] - 2026-07-17

### Added — `strct-datagrid` power features (all additive)

- **Column drag-reorder** — `reorderable`: drag headers to rearrange data
  columns; the order persists through `columnState` / `stateKey` (new
  `order` field on `StrctDatagridColumnState`).
- **Row grouping** — `groupBy`: a collapsible header row per distinct value
  with a count chip; the current sort applies within groups. Paging is
  bypassed while grouped; not combinable with `virtual`.
- **Excel export** — `toXLSX()` / `downloadXLSX(filename)`: a real `.xlsx`
  workbook built with an in-house, **dependency-free** SpreadsheetML + ZIP
  writer (stored entries, correct CRC32). Numeric cells stay numeric; opens
  in Excel, LibreOffice and Google Sheets.

## [1.0.0] - 2026-07-17

**UIStruct is stable.** Every 1.0 criterion in [ROADMAP.md](ROADMAP.md) is
met: RTL/i18n audit (with fixes), strict APG datepicker grid, a visual
regression gate in CI, a full API review (327 signal members — the surface
freezes as-is, taxonomy in [docs/api-review.md](docs/api-review.md)), and
published reproducible benchmarks. From here on the
[semver contract](ROADMAP.md#after-10--semver-contract) applies: patches fix,
minors add, majors migrate — deprecations live for at least one minor first.

### Infrastructure — visual regression gate

- New `visual-regression` CI job: `scripts/visual-regression.mjs` screenshots
  key routes (dark + light) in headless Chrome and compares them against
  committed baselines (`tests/visual/baseline/`), failing on >0.5% pixel
  drift; diff images upload as artifacts. Animations/transitions are frozen
  and the showcase now **self-hosts DM Sans / JetBrains Mono** (fontsource),
  making rendering deterministic across machines — and giving every visitor
  the intended typography instead of a system-font fallback.

### Changed — 1.0 hardening

- **`strct-datagrid` sticky columns are RTL-correct** — frozen-column offsets
  use logical `inset-inline-start`, so they pin to the reading start under
  `dir="rtl"`; the edge shadow mirrors.
- **`strct-datepicker` implements the strict APG date-grid pattern** — real
  ARIA grid semantics (`grid` / `row` / `columnheader` / labeled `gridcell`s),
  roving focus on the day cells, `Home`/`End` (week edges),
  `Shift+PageUp/PageDown` (year), `aria-selected` / `aria-current="date"`,
  and focus returns to the input on close.

## [0.31.1] - 2026-07-17

### Fixed — RTL audit outcomes

Full `dir="rtl"` audit (static sweep + rendered verification — see
`docs/rtl-audit.md`). Text/spacing/borders were already fully logical; these
directional behaviors are now correct in RTL too:

- **`strct-toggle`** — the thumb travels toward inline-end
  (`:host-context([dir='rtl'])` — the component uses emulated encapsulation).
- **`strct-drawer`** — `start`/`end` anchor with logical insets; the slide-in
  animation mirrors.
- **`strct-nav`** — the mobile off-canvas panel anchors inline-start and
  slides from the correct edge.
- **Icon badges & rail dots** — anchored with `inset-inline-end`.
- **Datagrid** — column-resize grip and chooser alignment use logical insets.

Known caveat (tracked in ROADMAP): datagrid sticky-column offsets remain
physical-left; keep wide frozen grids in an LTR container for now.

## [0.31.0] - 2026-07-17

### Added — `strct-datagrid` enterprise pack (all additive)

- **Virtual scrolling** — `virtual` + `viewportHeight` + `rowHeight`: only the
  viewport rows (plus a small overscan) are in the DOM, with a sticky header —
  20k+ rows scroll smoothly. Assumes uniform row height; not combinable with
  `expandable`.
- **Server-side data** — `lazy` + `total` + `(lazyLoad)`: the grid never sorts
  or slices `rows` itself; it emits `{ page, pageSize, sortKey, sortDir }` on
  init and whenever the user pages or sorts, and shows rows as given. `total`
  drives the pager and footer count.
- **Sticky (frozen) columns** — `StrctDatagridColumn.sticky` pins leading
  columns (utility columns freeze automatically alongside) with exact
  cumulative offsets, opaque grounds and an edge shadow on the last frozen
  column. Give sticky columns an explicit px `width`.
- **Column state persistence** — two-way `columnState` (widths from resize +
  hidden from the chooser) and `stateKey` for built-in localStorage
  persistence (`strct-dg:<key>`), restored before first render.
- **CSV export** — public `toCSV()` / `downloadCSV(filename)` with proper
  quoting: header labels + every non-hidden column, all rows in the current
  order (full sorted set in client mode, as-given in lazy mode).

## [0.30.0] - 2026-07-17

### Added — navigation gaps (FR-NAV-01 / FR-NAV-02, all additive)

**`strct-rail`** (`StrctRailItem`):

- **`placement: 'bottom'`** — pins an item to the foot of the rail under a
  divider (vCenter-style Administration), in declaration order. The top group
  scrolls; the bottom group stays put.
- **`routerLink` / `href`** — the item renders as a real `<a>`: middle-click,
  ⌘/Ctrl-click and "open in new tab" work like a real link; `(select)` still
  fires on plain activation, and modified clicks never touch `activeId`. With
  `routerLink`, the router's own active state drives highlighting when no
  explicit `activeId` is provided (explicit wins).
- **`dot` + `dotStatus`, `trailingIcon`** — the same trailing vocabulary as the
  section menu (below), so the two nav objects stay consistent.

**`strct-section-menu`** (`StrctMenuLink`):

- **`badge` + `badgeStatus`** — trailing count/label chip (e.g. deviations).
- **`dot` + `dotStatus`** — small trailing status dot ("unsaved changes").
- **`trailingIcon`** — muted trailing glyph ("restart required"), rendered
  after the label and before any badge / dot.

Both share the `StrctRailStatus` tone union — no new status vocabulary. Items
without the new fields render identically to 0.29.0.

### Changed

- `@angular/router` is now a peer dependency (used by `strct-rail` link items).

## [0.29.0] - 2026-07-16

### Added — `strct-chart` monitoring suite (FR-CHART-08..13, all additive)

- **Data gaps** — `data` / `series.data` accept `(number | null)[]`; a `null`
  (or `NaN`) breaks the line into disjoint segments, so an outage never reads
  as a flat line. The gap keeps its x-slot; hovering it says `gapText`
  ("no data"); area fills drop to the baseline at gap edges.
- **Synced crosshairs** — new `(hoverIndex)` output + `[activeIndex]` input:
  wire one chart's hover into a sibling's crosshair for a vCenter-style
  multi-chart dashboard. A local pointer always wins.
- **Annotations** — `annotations: { index; label?; status?; dashed? }[]` draws
  vertical event markers ("alarm raised", "reboot") behind the data; the label
  joins the tooltip at that index.
- **Min–max band** — per-series `lower` / `upper` bounds fill a soft envelope
  behind the avg line, so downsampled spikes stay visible; the tooltip shows
  `avg (min–max)`.
- **Brush + zoom** — `brush` drag-selects a range and emits
  `(brushChange) [start, end]`; `zoom` **zooms the chart into the selection**
  (y rescales to the visible window) with a ⟲ reset chip — double-click or
  Escape zooms back out, emitting `null`.
- **Export** — public `toSVG()` / `toPNG(scale)` methods return the rendered
  chart with theme colors resolved, background and axis text baked in.

All defaults reproduce the previous behavior exactly; keyboard access extends
to the new surface (Escape unwinds brush → zoom → crosshair).

## [0.28.0] - 2026-07-16

### Added — `running` icon badge (vCenter lifecycle language)

Lifecycle states now speak vCenter's media-transport language, as glyphs
inside the badge disc: **green disc ▶ `running`** (new) · **amber disc ⏸
`paused`** · **grey disc ■ `off`**. Health states keep their silhouette
coding (circle ✓ / triangle ! / diamond × / circle i / wrench). `success`
now reads as _healthy_; use `running` for power state.

### Changed

- `paused` badge: grey → amber disc (lifecycle family).
- `off` badge: square – → neutral grey disc with a stop square ■.

## [0.27.0] - 2026-07-16

### Changed — icon badges: silhouette coding (CVD-safe at any size)

Badge states now differ by **outline silhouette**, not just hue + inner glyph,
so they stay distinguishable for color-blind users even at 16px where the
inner glyph is too small to read: circle ✓ success · triangle ! warning ·
**diamond × critical** (new shape) · **square – off** (new shape) ·
circle i info · wrench maintenance.

### Added — `paused` icon badge

New `StrctIconBadge` value for lifecycle states: a circle with two pause
bars (⏸), distinct from `off` — a paused VM no longer has to render as
powered-off.

## [0.26.0] - 2026-07-15

### Changed — `strct-datagrid` enclosed chrome

The action bar, grid and footer now share **one enclosing frame** (border +
radius + shadow on the host), separated by interior hairlines — the whole
component reads as a single object on the page instead of three floating
pieces. The table rounds only the frame corners it actually touches (no
toolbar above / no footer below). No API change.

## [0.25.0] - 2026-07-15

### Added — `strct-modal` draggable + styling hooks

- **`draggable`** — reposition the dialog by dragging its header (Pointer
  Events: mouse + touch). Clamped to the viewport, never starts from the close
  button or header controls, re-centers on every open. Keyboard/AT flows
  unchanged.
- **`panelClass` / `backdropClass`** — append custom class(es) to the dialog
  panel / backdrop, so consumers style modals from app-global CSS instead of
  piercing internal class names with `::ng-deep`.
- **`variant="glass"`** — built-in theme-aware frosted preset (translucent
  panel + blurred, tinted backdrop).

### Added — `strct-datagrid` single-line rows

- **`singleLine`** — keep every row exactly one line tall: cell content never
  wraps, long values truncate with an ellipsis (detail rows exempt), so tall
  content can't distort the grid.

## [0.24.0] - 2026-07-14

### Added — `strct-tree` density

- **`density`** input on `strct-tree` (`'compact' | 'comfortable'`, default
  `compact`). `comfortable` relaxes rows to 14px text / 18px icons with taller
  rows and wider indent — for touch-friendly or low-density consoles. The
  compact default renders pixel-identical to before.

## [0.23.0] - 2026-07-14

### Changed — `strct-card` grows rich, opt-in states

All backward-compatible; a plain composed card renders exactly as before.

- **`status`** — tone rail on the leading edge (same language as alert / hero).
- **`interactive`** — hover lift + accent border for clickable cards.
- **`selected`** — accent ring for card-picker layouts.
- **`dense`** — tighter paddings across header / block / footer.
- **`loading`** — indeterminate top bar + `aria-busy`; body and footer dim and
  ignore input. Reduced-motion collapses the bar to a static strip.
- **`collapsible` + two-way `collapsed`** — the header grows a labeled chevron
  toggle (`aria-expanded`); block and footer hide while collapsed.
- **`strct-card-header`** gains an `icon` input and localizable
  `collapseLabel` / `expandLabel`.

## [0.22.0] - 2026-07-14

### Added — `strct-command-palette` + `strct-kbd`

- **`strct-command-palette`** — a ⌘/Ctrl-K spotlight over app commands or pages.
  `items` (`{ id; label; group?; icon?; hint?; keywords?; data? }[]`), two-way
  `open`, built-in `hotkey`, ranked filtering (label prefix > word start >
  substring > keywords), `(picked)` output. ARIA combobox/listbox pattern with
  `aria-activedescendant`, full keyboard support, focus restore on close,
  reduced-motion safe, localizable strings. The docs site's own ⌘K now runs on
  it (dogfooded — and the wrapper shrank from 287 to ~60 lines).
- **`strct-kbd`** — inline keyboard-key chip for shortcut hints.

### Changed — overlay a11y audit outcomes

- Audit result: `strct-combobox`, `strct-context-menu` and `strct-cascade-select`
  already follow their APG patterns (combobox/listbox, menu/menuitem) — no
  changes needed. `strct-datepicker` uses a labeled dialog with button day cells
  and arrow-key focus; a strict APG grid refinement is noted for later.
- **`strct-tree`** — chevron toggles now have a 24×24px hit target
  (WCAG 2.5.8) without changing visual density, and their rotation honours
  `prefers-reduced-motion`.

## [0.21.2] - 2026-07-14

### Fixed — axe-core smoke findings

The new CI a11y gate (axe-core over eight key routes) caught and we fixed:

- **`strct-tree`** — expand/collapse chevrons were unnamed `role="button"`
  elements; they now expose "Expand/Collapse <label>".
- **`strct-progress`** — bars had no accessible name; new `label` input
  (falls back to "Progress").
- **`strct-table` / `strct-datagrid`** — horizontal scroll containers are now
  keyboard-focusable named regions (WCAG scrollable-region-focusable).

### Infrastructure

- **vitest 3 → 4** — resolves the `@angular/build` peer conflict; the lockfile is
  back in sync and `npm ci` works without `--legacy-peer-deps` (CI updated).
- **CI is green again** — fixed the stale showcase footer assertion that had
  failed every run since June 12.
- **New `a11y-smoke` CI job** — axe-core over key routes (fails on
  serious/critical) + per-page screenshots uploaded as artifacts.
- **New `Publish to npm` workflow** — pushing a `v*` tag builds, tests and
  publishes `@akcelik/strct` with provenance (requires the `NPM_TOKEN` secret).
  npm's latest was stuck at 0.11.0.
- **README** — real screenshots (dashboard, theming) and up-to-date counts.

## [0.21.1] - 2026-07-19

### Changed — "16 Native" icon render policy

- **Object / semantic glyphs now render at the grid's native 16px** instead of
  13–15px (a fractional downscale that blurred hairlines). 16 call sites updated
  across alert, toast, tree, datagrid (settings/refresh), context menu, section
  menu, field/validation adornments, segmented, metric-tile, datepicker,
  password and theme-switcher. Simple single-stroke glyphs (chevrons, close,
  check, dots, sort arrows) stay at 11–14px by design — the policy is documented
  in the icon source. This matches the 16px-grid convention of Octicons, Carbon,
  Fluent and Clarity.

### Fixed

- **`ellipsis` icon added** — `strct-pagination`'s gap indicator referenced an
  unregistered name and silently rendered nothing; the "…" between page numbers
  is now visible.

## [0.21.0] - 2026-07-19

### Icons — coverage, variants & small-size legibility (142 → 178 glyphs)

- **Added — time & communication:** `clock`, `history`, `timer`, `hourglass`,
  `mail`, `chat` (an NTP settings page finally has its clock).
- **Added — general UI:** `help`, `home`, `link`, `globe`, `star`, `pin`, `share`,
  `archive`, `zoomIn`/`zoomOut`, `fullscreen`/`exitFullscreen`, `listView`,
  `dragHandle`.
- **Added — direction set completed:** `chevronUp` (was missing!) and
  `chevronDoubleLeft/Up/Down`.
- **Added — infrastructure & identity:** `dns`, `vpn`, `api`, `bolt`, `queue`,
  `users`, `login`, `unlock`, `ban`.
- **Added — off-state composites & aliases:** `wifiOff`, `cloudOff`, `linkOff`
  (slash composites); `unlink` → `linkOff`, `webhook` → `bolt`.
- **Legibility repairs (verified at 14px, the real usage size):** 13 dense glyphs
  redrawn so parallel details keep ≥ 1.5px gaps on the 16-grid — `nic` and `hba`
  are now clearly distinct (one large square port vs two round ports), and
  `memory`, `ethernet`, `switch`, `portGroup`, `keyboard`, `motherboard`, `psu`,
  `gpu`, `sdCard`, `usb` no longer smudge; `braille` dots enlarged. The tree
  chevron stroke is standardized to the 1.3–1.5 guideline, and a **detail-budget
  rule** is documented in the icon source.

## [0.20.0] - 2026-07-19

### Accessibility & design-system hardening

A tri-lens audit (visual arts · HCI · vision science) of the whole library,
implemented end to end. All changes are backward-compatible; deprecations noted.

#### Fixed — contrast (WCAG AA, computed)

- **Light-mode semantic tones darkened** across all three palettes so colored
  _text_ meets AA ≥ 4.5:1 (previously: warning ≈ 3.4:1, success ≈ 3.9:1,
  accent ≈ 4.1:1). Matching translucent tints updated. Dark mode unchanged.
- **Text on solid status fills** now uses the new rule `color: var(--inv)` instead
  of hard-coded `#fff` (solid badges, hero chips, solid buttons, checkbox check,
  datepicker selected day, speed-dial, toggle thumb). Previously _every_ dark-mode
  solid badge failed AA (2.2–3.5:1); now ≥ 5:1 in both modes. No hard-coded colors
  remain in the library; header-anchored UI uses the new `--hdr-fg` token.
- **`strct-badge`**: the misspelled public class `strct-badge--warninging` is fixed
  to `strct-badge--warning`; the old class is still emitted as a deprecated alias.

#### Fixed — motion & typography

- `prefers-reduced-motion` now also disables the modal, drawer and toast entrance
  animations; charts track the OS setting _live_ instead of reading it once.
- **12px type floor restored**: chart axis/tooltip annotations, flow role tags,
  datepicker weekday header, section-menu category labels and metric-tile deltas
  (10–11.5px) are all ≥ 12px. Display sizes are tokenized: new `--text-2xl` (22px)
  and `--text-3xl` (26px) used by gauge, donut and metric-tile.

#### Added — keyboard & screen-reader access

- **`strct-tree`** implements the ARIA tree pattern: roving tabindex (one tab stop
  per tree instead of one per row), ArrowUp/Down/Left/Right + Home/End navigation,
  `aria-level`, and a visible `:focus-visible` ring on rows.
- **`strct-chart`** is now exposed to AT: `role="img"` with a generated data
  summary, keyboard-focusable crosshair (arrows / Home / End / Escape) and an
  `aria-live` announcement of the selected point. X-axis labels are positioned at
  their datapoint's real x (an honest axis under `xTicks` subsampling); overlays
  are anchored to the plot so the legend can't shift them.
- **`strct-donut`**: `role="img"` summary naming every slice; legend rows are
  keyboard-focusable and drive the center readout.
- **`strct-modal`**: the backdrop is no longer an unnamed `role="button"` phantom
  tab stop (keyboard dismissal is Escape, unchanged).

#### Added — color-vision safety

- Icon status badges are **shape-coded**: ✓ success · × critical · i info · – off
  (warning already had its ! triangle), so object state never relies on hue alone.
- **`strct-chart` series** accept `dash` (boolean or dasharray) as a second visual
  channel; the legend swatch mirrors the pattern.
- The donut fallback palette's translucent 5th color is replaced with an opaque
  accent mix.

#### Added — internationalization & RTL

- Every user-visible / assistive string is now an input: `strct-datagrid`
  `[labels]` (row/rows/selected + all aria labels), `strct-alert` `dismissLabel`,
  `strct-modal` `closeLabel`, `strct-spinner` `label`, toast outlet `regionLabel`,
  pagination `prevLabel/nextLabel/regionLabel`, wizard `backLabel/nextLabel`,
  chart `agoFormat`.
- Library styles converted to **CSS logical properties**
  (margin/padding/border-inline, text-align start/end) for RTL-readiness.

#### Added — API consistency

- **`strct-tabs`** `selectedIndex` and **`strct-wizard`** `current` are now
  two-way `model()`s, completing the controlled-state pattern alongside the tree's
  `expandedIds` and the datagrid's `initialSelection`.

## [0.19.0] - 2026-07-14

### Added

- **`strct-datagrid`** — `initialSelection` input seeds the checked rows (values are
  row ids matching `rowId`; requires `selectable`). Assigning a new array re-seeds —
  e.g. open a picker dialog with the current members already checked — while the
  user's later toggles are preserved until it changes. Additive; defaults to `null`
  (no selection), so existing grids are unchanged.

## [0.18.0] - 2026-07-14

### Added — `strct-tree` stable identity + observable / controlled expansion

All additive and backward-compatible:

- **Stable node identity** — `StrctTreeNodeData.id` gives each node a stable key,
  used for `trackBy`, expansion state and a `data-node-id` DOM attribute. Falls back
  to `label` when absent.
- **Observable expansion** — `(expandedChange)` emits the full set of expanded ids on
  every toggle; `(nodeToggled)` emits `{ node, expanded }` per toggle.
- **Controlled expansion** — `[(expandedIds)]` (two-way) makes the parent the single
  source of truth, so persisting/restoring which nodes are open is a one-liner. When
  null (default), expansion stays uncontrolled, seeded from each node's `expanded`
  flag exactly as before.

With no `id`, no `expandedIds` and no listeners, the tree behaves exactly as today.

## [0.17.1] - 2026-07-04

### Fixed

- **`strct-modal`** — a **dismissible** modal no longer closes when you press
  **Space** (or Enter) while typing in a field inside it. The keyboard-close
  handlers on the backdrop now ignore events that bubbled up from a child, and only
  act on a real backdrop click or Enter/Space while the backdrop itself is focused.
  No API change.

## [0.17.0] - 2026-06-25

### Added

- **`file`** — a plain document glyph (a file with a dog-ear fold, no field / text
  lines) for file-browser and file-list UIs, distinct from `template` (lined) and
  `form` (form fields).
- **`clipboard`** — a clipboard with a checklist, for "task list" semantics
  (distinct from `logs`, which reads as a stream). Icon count: 142.

## [0.16.0] - 2026-06-25

### Added — `strct-chart` gaps (all additive, back-compatible)

- **Multi-series** — new `series` input (`{ data; label?; status?; area?; curve? }[]`)
  draws several colored lines that share the x/y domain, with a per-series hover
  tooltip. Falls back to `data` when unset. Shorter series are right-aligned.
- **Legend** — `legend` renders a swatch + label per labeled series.
- **Persistent y-axis** — `yAxis` (+ `yTicks`, `axisFormat`) shows value labels
  aligned to the gridlines; a left gutter is reserved so the plot never overlaps.
- **Thresholds** — `thresholds` (`{ value; label?; status?; dashed? }[]`) draws
  horizontal reference lines (dashed by default) with an optional right-edge tag.
- **Y-axis floor** — `min` pins the baseline (defaults to 0, i.e. today's behavior).
- **Empty state** — `emptyText` (default "No data") renders a centered message at
  the normal height when there are no points, instead of an empty SVG.
- **X-axis tick control** — `xTicks` subsamples labels to ~N evenly spaced ticks and
  `xFormat` reformats them.

Every new input defaults to today's behavior, so existing single-series usage is
unchanged.

## [0.15.0] - 2026-06-25

### Added — 27 new icons

The datacenter icon set grows from 113 to 140 glyphs, in four new gallery groups:

- **Storage & media** — `opticalDisc` (CD/DVD), `ssd`, `usb`, `sdCard`, `tape`.
- **Hardware** — `gpu`, `psu`, `fan`, `battery`, `ups`, `motherboard`, `sensor`,
  `thermometer`.
- **AI** — `sparkles`, `brain`, `robot`, `neuralNetwork`, `aiChip`, `wand`, `model`.
- **Peripherals & network** — `router`, `loadBalancer`, `wifi`, `bluetooth`,
  `monitor`, `keyboard`, `printer`.

All are stroke glyphs on the shared 16×16 grid, so size, color and status badges
work as for every other icon.

## [0.14.1] - 2026-06-25

### Changed

- **`strct-donut`** — removed the glow on the hovered slice; the focus effect is now
  just the slice growing while the others dim (cleaner, flatter).

## [0.14.0] - 2026-06-25

### Changed — `strct-donut` is now interactive

- **Hover to focus** — hovering a slice (or its legend row) highlights it (it grows)
  while the others dim, and the center reads out that slice's value, label and
  share. `interactive` (default on) toggles this.
- **Legend** — new `legend` input renders a `color · label · value · %` list beside
  the ring, hover-linked to the slices in both directions.
- **Modern slices** — rounded caps with gaps between slices (new `gap`, in degrees)
  and a sweep-in entrance animation (honours `prefers-reduced-motion`).
- Back-compatible: existing `segments` / `size` / `thickness` / `centerValue` /
  `centerLabel` usage is unchanged.

## [0.13.0] - 2026-06-25

### Changed — `strct-chart` line chart overhaul

A ground-up rework of the line / area chart for trends and live telemetry:

- **Smooth curves** — lines now use monotone-cubic interpolation by default
  (curves that never overshoot the data). New `curve` input: `'smooth' | 'linear' |
'step'`.
- **Area toggle** — `area` is now an independent boolean (a soft vertical
  gradient), separate from `type`. `type="area"` still works.
- **Live streaming** — `live` scrolls the window left as new points arrive (a
  conveyor slide), with a pulsing head at the leading edge and a one-time draw-on.
  `interval` drives the scroll duration.
- **Ambient glow** — `glow` adds a layered neon glow to the line and head dot.
- **Hover crosshair + tooltip** — `interactive` (default on) shows a vertical +
  horizontal crosshair, a value chip on the y-axis edge, the highlighted x label,
  and a tooltip with the value, the ▲/▼ delta from the previous point, and the time
  (`Xs ago` while live).
- **Crisp at any size** — the SVG is now measured (1:1 coordinates via
  `ResizeObserver`) instead of stretched, so dots, the head and the glow stay
  perfectly round and sharp.
- New `strokeWidth`, `grid` and `dots` inputs. All animations honour
  `prefers-reduced-motion`.

## [0.12.0] - 2026-06-24

### Added

- **`strct-hero`** — a page-level status summary banner: a tone-colored surface with
  a leading icon chip, a heading, a description and optional right-aligned metadata
  (`[strctHeroMeta]`) / actions (`[strctHeroActions]`). `role="status"` (or `alert`
  when `status="critical"`), with the heading as the accessible name.
- **`strct-flow`** — an animated relationship between two (or N) endpoints: packets
  travel along the connector when `live`, with `direction` (`forward` / `reverse` /
  `both`) and horizontal / vertical orientation. Degrades to a static gradient +
  arrow when idle or under `prefers-reduced-motion`; `role="img"` with a summary
  label.
- **`strct-description-list` + `strct-desc`** — a compact `label → value` definition
  list, driven by an `items` input or projected `<strct-desc>` rows (so a value can
  host a badge or icon). Stacked rows plus an `inline` stat-strip variant.
- **`strct-segmented`** — a single-select segmented control with managed selected
  state, `ControlValueAccessor`-compatible. `role="radiogroup"` with roving tabindex
  and arrow-key navigation; `sm` / `md` sizes and a `block` width.
- **`strct-cell-status`** — a small "checking → ok / warning / error (reason)"
  affordance (spinner / icon + message, `aria-live`) for datagrid cells.
- Shared **`StrctStatus`** and **`StrctThresholds`** types in the public API.

  Component count: 63.

### Changed

- **`strct-progress` / `strct-gauge`** gained an optional `thresholds` input
  (`{ warning?, critical? }`). When set, the meter derives its own status from the
  value (≥ critical → critical, ≥ warning → warning, else the healthy base), so
  callers stop computing status for every disk / memory meter. Back-compatible: an
  explicit `status` still wins when no thresholds are given.
- **`strct-field`** gained a `validationState` input
  (`{ status: 'idle' | 'checking' | 'ok' | 'warning' | 'error'; message? }`),
  rendered as a trailing spinner / check / warning adornment plus the message in the
  hint / error slot (`aria-live`). An explicit `error` still takes precedence.

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
