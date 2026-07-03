# Feature Request: StrctChart gaps

**Component:** `StrctChart` — `projects/strct/src/lib/charts/chart.ts` (selector `strct-chart`)
**Type:** enhancement (all items are **additive / backward-compatible** — defaults must preserve today's behavior)
**Audience:** an AI/code agent implementing directly against the source.

## How to use this doc

Each `FR-CHART-xx` is independent and self-contained: problem → proposed API (exact
signatures) → rendering behavior → acceptance criteria → example → back-compat note.
Implement any subset. Do not break existing callers: every new `input()` defaults to
a value that reproduces current output.

## Current API (as-is, verified)

Single-series only. Inputs:
`data = input.required<number[]>()`, `type: 'line'|'area'|'bar'`, `curve: 'smooth'|'linear'|'step'`,
`area`, `glow`, `live`, `interval`, `interactive`, `strokeWidth`, `grid`, `dots`,
`labels: string[]` (x-axis, caller-precomputed), `status: StrctChartStatus`, `height`,
`max: number|null`, `valueFormat: ((v:number)=>string)|null`.
Rendering: one SVG path; horizontal gridlines when `grid`; **no persistent y-axis value
labels** (only a hover flag at `.strct-chart__axis-y`, shown while hovering); x-axis
labels rendered one-per-`labels[]`; hover tooltip shows value (via `valueFormat`) + delta

- meta line.

---

## FR-CHART-01 — Multi-series (highest priority)

**Problem.** `data` is a single `number[]`. Callers that need to show two related
signals (e.g. network **in** vs **out**, read vs write IOPS) are forced to **sum** them
into one line, losing per-series detail. This is a real information loss in the
HyperStruct host/VM performance panels today.

**Proposed API (additive, keep `data` working):**

```ts
export interface StrctChartSeries {
  data: number[];
  label?: string;                 // legend + tooltip name
  status?: StrctChartStatus;      // per-series color; falls back to `status`
  area?: boolean;                 // per-series area fill
  curve?: StrctChartCurve;
}
// New input; when provided it takes precedence over `data`.
readonly series = input<StrctChartSeries[] | null>(null);
```

- When `series` is null, behave exactly as today using `data`.
- All series share the x domain (`labels`) and the y domain (union min/max, respecting `max`/`min`).
- Hover tooltip lists each series' value at the hovered index, colored per series.

**Acceptance:**

- `[data]` unchanged renders identically to today.
- `[series]="[{data:inArr,label:'In'},{data:outArr,label:'Out'}]"` draws two colored
  lines, a legend (see FR-CHART-05), and a multi-row tooltip.
- Mismatched series lengths are right-aligned/tolerated (no crash).

---

## FR-CHART-02 — Persistent Y-axis scale labels

**Problem.** The value scale is invisible unless you hover — the chart draws gridlines
but no numbers on them, so an operator can't read "what is this line worth?" at a glance.

**Proposed API:**

```ts
readonly yAxis = input(false, { transform: booleanAttribute });   // show y tick labels
readonly yTicks = input(3);                                       // approx tick count
readonly axisFormat = input<((v:number)=>string) | null>(null);   // y label formatter; falls back to valueFormat
```

- When `yAxis` is true, render `~yTicks` value labels aligned to the gridlines (min…max
  of the y domain), formatted with `axisFormat ?? valueFormat ?? String`.
- Reserve left padding for the labels so the plot doesn't overlap them.

**Acceptance:** `[yAxis]="true" [axisFormat]="v=>v.toFixed(0)+'%'"` shows e.g. `0% / 50% / 100%`
down the left edge; default (`yAxis=false`) is unchanged.

---

## FR-CHART-03 — Threshold / reference lines

**Problem.** No way to mark a meaningful level (warning 75%, critical 90%, an SLA, a
capacity ceiling). Today callers approximate this by recoloring the whole line via
`status`, which is coarse and can't show more than one level.

**Proposed API:**

```ts
export interface StrctChartThreshold {
  value: number;
  label?: string;
  status?: StrctChartStatus;       // color, default 'warning'
  dashed?: boolean;                // default true
}
readonly thresholds = input<StrctChartThreshold[]>([]);
```

- Draw a horizontal line at each `value` (clamped to the y domain) in the status color,
  dashed by default, with an optional right-aligned label.

**Acceptance:** `[thresholds]="[{value:90,status:'critical',label:'crit'}]"` draws a red
dashed line at y=90 with a "crit" tag; empty array = no change.

---

## FR-CHART-04 — Y-axis `min` (floor)

**Problem.** Only `max` can be overridden. Some metrics read better with a fixed floor
(e.g. always start at 0, or zoom into a 80–100% band).

**Proposed API:**

```ts
readonly min = input<number | null>(null);   // default null = data min (current behavior)
```

- y domain becomes `[min ?? dataMin, max ?? dataMax]` with the existing headroom logic
  applied to the top only.

**Acceptance:** `[min]="0"` pins the baseline to zero; null preserves today's auto-min.

---

## FR-CHART-05 — Legend (pairs with FR-CHART-01)

**Problem.** Multi-series is unreadable without a legend.

**Proposed API:**

```ts
readonly legend = input(false, { transform: booleanAttribute });  // default false
```

- When true and `series` has ≥1 labeled entry, render a compact legend (swatch + label
  per series) above or below the plot, colored to match the lines.

**Acceptance:** `[series]=... [legend]="true"` shows one swatch+label per series; no
legend when false or when series are unlabeled.

---

## FR-CHART-06 — Built-in empty / no-data state

**Problem.** The component renders nothing meaningful for empty `data`, so every caller
reimplements an external "No data" placeholder (HyperStruct does this in 3+ views).

**Proposed API:**

```ts
readonly emptyText = input<string>('No data');   // shown when data/series is empty
```

- When there are no points, render a centered muted `emptyText` at the chart's height
  instead of an empty/broken SVG. Keep the reserved height stable (no layout jump).

**Acceptance:** `[data]="[]"` shows a centered "No data" (or custom text) at the normal
height; non-empty data is unchanged.

---

## FR-CHART-07 — X-axis tick control

**Problem.** `labels` must be a pre-thinned string array — callers manually downsample to
~6 ticks (HostMonitorView `axisLabels()`) to avoid label pile-up, and there's no
formatter. The chart should own tick spacing.

**Proposed API:**

```ts
readonly xTicks = input<number | null>(null);          // target tick count; null = today's behavior (render all labels)
readonly xFormat = input<((label: string, index: number) => string) | null>(null);
```

- When `xTicks` is set, evenly subsample `labels` to ~`xTicks` entries; apply `xFormat`
  when present.

**Acceptance:** `[xTicks]="6"` on a 300-point series shows ~6 evenly spaced x labels;
null keeps current one-per-label rendering.

---

## Cross-cutting acceptance

- No visual change for any existing usage that doesn't opt into a new input.
- No new required inputs; `data` stays the only required one (or `series` as its
  alternative).
- Dependency-free SVG + design tokens preserved (no new runtime deps).
- Update `chart.spec.ts` with a case per FR; bump the package minor version.

## Priority

1. FR-CHART-01 (multi-series) + FR-CHART-05 (legend) — real information loss today.
2. FR-CHART-02 (y-axis labels) + FR-CHART-03 (thresholds) — readability.
3. FR-CHART-06 (empty state) — removes per-caller boilerplate.
4. FR-CHART-04 (min), FR-CHART-07 (x ticks) — polish.

## Already shipped (context, do not re-implement)

- `valueFormat` (v0.15.0): formats the hover tooltip value, y-axis hover flag, and delta.
  FR-CHART-02's `axisFormat` should fall back to it.
