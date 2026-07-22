# UIStruct v0.11.x — Build prompts for the missing components

Implementation-ready specs for the gaps found while building HyperStruct's admin
System pages (see `uistruct-v0.11-gaps.md`). Hand each section to a developer / AI
to add the component to `@akcelik/strct`.

**House conventions to follow (match the existing library):**

- Standalone Angular components, **signal inputs** (`input<T>()`,
  `input.required<T>()`), two-way via `model<T>()`, events via `output<T>()`.
- Selector style: element `strct-*` for components; attribute `[strctXxx]` for
  directives and named content slots.
- Shared status union (reuse it, do not invent a new one):
  `type StrctStatus = 'neutral' | 'accent' | 'success' | 'warning' | 'critical'`
  (this is what `StrctBadge`, `StrctMetricTile` already use; `StrctProgress`/`Gauge`
  use `'accent' | 'success' | 'warning' | 'critical'`).
- **Theming via design tokens only** — no hard-coded colors. Use the existing
  palette CSS custom properties / `StrctThemeService` the other components use
  (e.g. text `--strct-...`, surface, border, and the status palette). Support
  light/dark automatically like the rest of the library.
- Form controls implement **ControlValueAccessor** so `formControlName` and
  `[(ngModel)]` both work.
- Accessibility: roles, `aria-*`, keyboard support, and respect
  `prefers-reduced-motion` for anything animated.
- Ship: component + types exported from the public API, unit tests, and a docs/demo
  story consistent with existing components.

---

## A1 — `StrctHero` (status summary banner) ★ highest demand

**Selector:** `strct-hero`
**Purpose:** A prominent, page-level status summary: a tone-colored banner with a
leading icon, a heading, a description, and optional right-aligned metadata and/or
actions. Distinct from `StrctAlert` (a dismissible inline _notification_) and
`StrctSignpost` (a popover). This is the single most-repeated thing apps hand-roll
("Protected", "All systems healthy", "Clock synchronized").

**Inputs**

- `status: StrctStatus = 'neutral'` — tone (drives border/bg tint + icon chip color).
- `icon?: string` — leading icon name (StrctIcon set). If omitted, derive a default
  per status (success → check, warning/critical → alert-triangle, accent/neutral → info).
- `heading: string` — the headline (required in practice).
- `dense?: boolean` — tighter padding for secondary placements.

**Content / named slots**

- Default projection → the description line(s).
- `[strctHeroMeta]` → right-aligned metadata cluster (e.g. version / uptime, or a
  `StrctBadge`). Wraps below on narrow widths.
- `[strctHeroActions]` → right-aligned action buttons.

**Behavior**

- Icon sits in a filled circular chip colored by `status`.
- Layout: `icon | (heading + description) | meta/actions`; meta+actions collapse
  under the text on small screens (responsive, container-query friendly).

**A11y:** `role="status"` (or `role="alert"` only when `status==='critical'`),
heading exposed as the accessible name.

**Example (HyperStruct HA + Health)**

```html
<strct-hero status="success" icon="shield-check" heading="Protected — high availability is on">
  The standby node has a live, up-to-the-second copy and can take over if this one fails.
  <div strctHeroMeta>
    <strct-badge status="success">HA ON</strct-badge>
  </div>
  <div strctHeroActions>
    <button strct-button size="sm" variant="neutral">Switch over</button>
  </div>
</strct-hero>

<strct-hero status="success" icon="check-circle" heading="All systems healthy">
  All services are responding and resources are within limits.
  <div strctHeroMeta>
    <strct-metric-tile label="Version" value="1.4.2" />
    <strct-metric-tile label="Uptime" value="6d 4h" />
  </div>
</strct-hero>
```

**Acceptance:** renders all four statuses with correct tokened tints; meta + actions
slots optional and responsive; no hard-coded colors; reduced-motion safe (no
animation needed here).

---

## A2 — `StrctFlow` / `StrctDataFlow` (animated relationship) ★ only true blocker

**Selector:** `strct-flow`
**Purpose:** Show a connection between two (or N) endpoints with an optional animated
"flow" (moving dots / gradient) representing live data movement — replication, sync,
a pipeline. No equivalent exists today (no flow/topology/sankey component).

**Inputs**

- `nodes: StrctFlowNode[]` — ordered endpoints. `interface StrctFlowNode { id: string;
label: string; sublabel?: string; role?: string; status?: StrctStatus }`.
  (For the common 2-node case, `[from]`/`[to]` convenience inputs may wrap this.)
- `live: boolean = false` — animate the flow (dots travel along the connector).
- `direction: 'forward' | 'reverse' | 'both' = 'forward'`.
- `label?: string` — caption under the connector (e.g. "live replication", "0 lag").
- `status: StrctStatus = 'accent'` — connector + dot color.
- `orientation: 'horizontal' | 'vertical' = 'horizontal'`.

**Behavior**

- Endpoints render as labeled terminals (label + optional sublabel/role badge); the
  connector is a line that, when `live`, animates 2–3 dots along it.
- `prefers-reduced-motion` → show a static gradient/arrow instead of moving dots.
- Degrades to a single terminal + "no connection" caption when only one node.

**A11y:** `role="img"` with an `aria-label` summarizing the flow
(e.g. "Replication from hyperstruct01 to hyperstruct02, live").

**Example (HyperStruct Cluster (HA))**

```html
<strct-flow
  [nodes]="[
    { id: 'a', label: 'hyperstruct01', role: 'ACTIVE', status: 'success' },
    { id: 'b', label: 'hyperstruct02', role: 'STANDBY', status: 'accent' }
  ]"
  [live]="flowing()"
  label="live replication · 0 lag"
  status="success"
/>
```

**Acceptance:** smooth animation when `live`, static + accessible when not / reduced
motion; tokened colors; handles 2..N nodes; horizontal + vertical.

---

## A3 — `StrctDescriptionList` (label → value) + inline stat strip

**Selector:** `strct-description-list` (and an `inline` variant for a stat strip)
**Purpose:** A compact definition list: aligned `label : value` rows with an optional
trailing badge/slot. The horizontal `inline` variant is the "stat strip"
(label-value pairs in a row). Replaces the `<dl>` + flex everyone hand-rolls.

**Inputs**

- `items?: StrctDescItem[]` — `interface StrctDescItem { label: string; value?: string |
number; mono?: boolean; muted?: boolean }`. (Or use projected rows, below.)
- `inline: boolean = false` — horizontal stat-strip layout vs stacked rows.
- `align: 'between' | 'start' = 'between'` — value alignment in stacked mode.

**Content (alternative to `items`)**

- Projected `<strct-desc label="…">value or rich content</strct-desc>` children, so a
  value can host a `StrctBadge`, icon, etc.

**Example (HyperStruct Network "current addressing" + HA access strip)**

```html
<strct-description-list>
  <strct-desc label="IPv4"><span class="mono">172.16.75.100/24</span></strct-desc>
  <strct-desc label="Gateway"><span class="mono">172.16.75.2</span></strct-desc>
  <strct-desc label="IPv6"><strct-badge status="success">Enabled</strct-badge></strct-desc>
</strct-description-list>

<strct-description-list inline>
  <strct-desc label="Access · VIP"
    ><strct-badge status="accent" solid>172.16.75.250</strct-badge></strct-desc
  >
  <strct-desc label="Viewing"><strct-badge status="neutral">hyperstruct01</strct-badge></strct-desc>
</strct-description-list>
```

**Acceptance:** stacked + inline layouts; `items` API and projected `strct-desc`
both work; values can host arbitrary content; tokened, responsive.

---

## A4 — `StrctSegmented` (single-select segmented control)

**Selector:** `strct-segmented`
**Purpose:** One-of-N selection rendered as a joined segment with managed selected
state — distinct from `StrctTabs` (panel switching) and `StrctButtonGroup` (visual
cluster only). For mode pickers and list filters.

**Inputs / model**

- `options: StrctOption[]` (`{ value, label, icon?, disabled? }`).
- `model value` via `model<unknown>()` + **ControlValueAccessor**
  (`formControlName` / `[(ngModel)]`).
- `size: 'sm' | 'md' = 'md'`; `block?: boolean` (full width).

**A11y:** `role="radiogroup"`; arrow-key navigation; `aria-checked`.

**Example (HyperStruct Time NTP mode / Recent Tasks filter)**

```html
<strct-segmented
  [options]="[
  { value: false, label: 'Disabled' },
  { value: true,  label: 'Enabled' }
]"
  [(ngModel)]="ntpEnabled"
/>

<strct-segmented
  [options]="[
  { value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'failed', label: 'Failed' }
]"
  [(ngModel)]="filter"
  size="sm"
/>
```

**Acceptance:** works with reactive + template forms; keyboard accessible; disabled
options; sm/md; tokened.

---

## B1 — Thresholds on `StrctProgress` / `StrctGauge` (enhancement)

Add an optional `thresholds` input so the component picks its own `status` from the
value, instead of callers computing it for every disk/memory meter.

```ts
// new input
thresholds = input<{ warning?: number; critical?: number } | null>(null);
// when set, status is derived: value >= critical → 'critical', >= warning → 'warning', else the given status (default 'success')
```

**Example**

```html
<strct-progress [value]="disk.used_pct" [thresholds]="{ warning: 80, critical: 90 }" />
```

**Acceptance:** explicit `status` still wins when no thresholds set; back-compatible.

---

## B2 — Async-validation state for `StrctInput` + datagrid cells (enhancement)

A first-class "validating… → ok / warning / error (reason)" affordance, so apps stop
composing `StrctSpinner` + `StrctBadge` by hand (e.g. live NTP-server reachability
checks while typing/adding).

**Option 1 — input state:** add `validationState` to `StrctField`/`StrctInput`:
`type StrctValidationState = { status: 'idle' | 'checking' | 'ok' | 'warning' | 'error'; message?: string }`
rendered as a trailing adornment (spinner / check / warning) + the message in the
field's hint/error slot.

**Option 2 — a `[strctCellStatus]` helper** for `StrctDatagrid` cells that renders
the same checking/ok/warning affordance from a small model, for list-building flows.

**Example (HyperStruct Time — NTP server validation)**

```html
<strct-field label="NTP server" [validationState]="probe()">
  <input strctInput [(ngModel)]="server" />
</strct-field>
<!-- probe(): { status: 'checking' } → { status: 'ok', message: 'stratum 3' } | { status:'warning', message:'unreachable' } -->
```

**Acceptance:** non-blocking; composable in both inputs and datagrid cells; tokened;
a11y `aria-live` for the status message.

---

## Priority for HyperStruct

1. **A2 `StrctFlow`** — the only object we still render with bespoke CSS.
2. **A1 `StrctHero`** — currently approximated with `StrctAlert` + `StrctMetricTile`.
3. A3 / A4 / B1 / B2 — remove the last layout glue + standardize patterns.

Shipping A1 + A2 takes HyperStruct's System pages to **zero bespoke render**.
