# UIStruct v0.11.0 — Gap list (driven by the HyperStruct admin UI)

Findings from building Administration ▸ System (Health, Network, Cluster (HA),
Time). **Decision: no raw CSS — every UI object uses UIStruct.** Most of what these
pages need already exists in v0.11.0; the items below are the genuine gaps + a few
enhancements that, once added, let us drop the last hand-rolled CSS.

Method: each gap was validated against the real component API in
`@akcelik/strct/types/akcelik-strct.d.ts` (v0.11.0), not assumptions.

## What already covers our needs (no gap — just use them)

- **Datagrid**: `StrctDatagrid` is rich — `selectable`, `expandable`, `detailPane`,
  `loading` (skeleton), `emptyText`, `columnChooser`, `sync`, `rowId`, `compact`,
  `resizable`, `pageSize`, `strctDatagridActionBar`, `strctCell` templates. The NTP
  table + action bar + selection + empty state = 100% this. (Pattern reference:
  `identity-sources.ts`.)
- **Linear meters** (disk/memory %) → `StrctProgress` (`value` + `status`).
- **Radial gauge** → `StrctGauge`. **Stat tiles** (cert count, version/uptime) →
  `StrctMetricTile` (label/value/unit/icon/status/delta/caption/sparkline).
- **Status pills** → `StrctBadge [status] [solid]`. **Selects** → `StrctCombobox`.
  **Boolean enable** → `StrctToggle`. **Forms** → `StrctField` + `StrctInput`/
  `StrctCheckbox`/`StrctRadio`. **Buttons** → `StrctButton`/`StrctButtonGroup`.
  **Notifications** → `StrctAlert`/`StrctToastService`. **Empty** → `StrctEmptyState`.
  **Spinner** → `StrctSpinner`. Modals/drawers/tabs/wizard/tree/timeline all exist.

---

## A. Missing components (highest value)

### A1. `StrctHero` / `StrctStatusBanner` — prominent status summary banner

A tone-colored (success / warning / danger / info) summary block: leading icon +
headline + description, optional right-side metadata and/or actions. This is the
single most-repeated thing we hand-rolled.

- **Where:** HA "🛡️ Protected / Not protected", Health "✓ All systems healthy /
  ⚠ Degraded", Time "Clock synchronized / not".
- **Why not existing:** `StrctAlert` is a _dismissible inline notification_ (wrong
  semantics + a close button); `StrctSignpost` is a _popover_; `StrctMetricTile` is a
  _single metric_. None give a page-level status hero.
- **Proposed API:** `status` (success|warning|danger|info|neutral), `icon`,
  `heading`, projected description content, optional `[strctHeroMeta]` and
  `[strctHeroActions]` slots.

### A2. `StrctFlow` / `StrctDataFlow` — animated relationship / flow between nodes

A connector between two (or N) entities with an optional animated "flow" (moving
dots/gradient) to show live data movement — replication, sync, pipeline.

- **Where:** Cluster (HA) Active↔Standby replication animation.
- **Why not existing:** no flow/topology/sankey/relationship component in v0.11.0.
- **Proposed API:** `from`/`to` (or a small node model), `active` (animate),
  `direction`, `label`, `status`. Even a minimal horizontal "A ●→→→● B" with a
  `live` input would remove our custom `@keyframes`.

### A3. `StrctDescriptionList` / `StrctKeyValue` — label→value summary rows

A compact definition-list primitive (aligned `label : value`, optional trailing
badge), and a horizontal "stat strip" variant.

- **Where:** the per-node KV (IPv4/Gateway/DNS), the VIP / "you are here" access
  strip, sync Source/Stratum/Offset metadata, revision/applied rows.
- **Why not existing:** no description-list / key-value component; we hand-rolled
  `<dl>` + flex each time.
- **Proposed API:** items `{ label, value, badge? }[]` or projected rows; `inline`
  (strip) vs `stacked` layout.

### A4. `StrctSegmented` — single-select segmented control

One-of-N selection rendered as a joined segment (selected state managed), distinct
from `StrctTabs` (panel switching) and `StrctButtonGroup` (visual cluster only).

- **Where:** NTP "Enabled | Disabled" (boolean works with `StrctToggle`, but a
  3-mode case e.g. DHCP/Static/Disabled needs this); list filters (All/Active/Failed
  in Recent Tasks).
- **Proposed API:** `options`, `[(ngModel)]`, `size`.

---

## B. Enhancements to existing components

### B1. Thresholds on `StrctProgress` / `StrctGauge`

Auto-pick `status` from the value (e.g. `[thresholds]="{warning:80, danger:90}"`)
instead of the caller computing it. Disk/memory meters do this everywhere.

### B2. Async-validation state for `StrctInput` + datagrid cells

A first-class "validating… → ok / warning / error (reason)" affordance for inputs
and `strctCell`. We compose `StrctSpinner` + `StrctBadge` by hand for the NTP
reachability probe; a `StrctValidationState` directive or an input `status` +
`hint` slot would standardise it.

### B3. Inline add / edit row in `StrctDatagrid` (optional)

Today the established pattern is "Add" in the action bar → modal (e.g.
`identity-sources.ts` `openAdd()`). An optional inline add-row / editable cell would
suit list-building flows (NTP servers) but is not a blocker.

---

## C. Net

v0.11.0 is broad and high quality; the real gaps are **A1 (status hero)** and **A2
(flow animation)** — both recurring across HyperStruct's status pages — plus the
smaller A3/A4 primitives and the B-series enhancements. Shipping A1–A4 lets the
System pages (and the rest of the app) be 100% UIStruct with zero bespoke CSS.

Next step in HyperStruct: refactor the System panels onto the existing components
(StrctDatagrid + action bar, StrctCombobox, StrctToggle, StrctProgress, StrctBadge,
StrctMetricTile, StrctEmptyState), temporarily keeping only A1/A2 as the last
custom pieces until those components land in UIStruct.
