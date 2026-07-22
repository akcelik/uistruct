# Feature Request: StrctChart — monitoring / time-series gaps

**Component:** `StrctChart` — `projects/strct/src/lib/charts/chart.ts` (selector `strct-chart`)
**Type:** enhancement (all items are **additive / backward-compatible** — every new
`input()`/`output()` defaults to a value that reproduces today's behavior).
**Audience:** an AI/code agent implementing directly against the source.
**Context:** follow-up to `strct-chart.md` (FR-CHART-01..07, all shipped by 0.28 —
multi-series, y-axis, thresholds, min, legend, empty state, x-ticks). These are the
next set, surfaced while building HyperStruct's vCenter-style Host/VM/Cluster
performance charts. Each is independent; implement any subset.

## Current API (as-is, verified against 0.28)

Inputs: `data`, `series: StrctChartSeries[]|null`, `type`, `curve`, `area`, `glow`,
`live`, `interval`, `interactive` (hover crosshair+tooltip), `strokeWidth`, `grid`,
`dots`, `legend`, `labels: string[]`, `xTicks`, `xFormat`, `status`, `height`,
`max`, `min`, `yAxis`, `yTicks`, `axisFormat`, `thresholds: StrctChartThreshold[]`,
`emptyText`, `agoFormat`. **No `@Output()`s.** `data`/`series.data` are `number[]`
(no nulls). Thresholds are horizontal only.

---

## FR-CHART-08 — Data gaps (nullable points; break the line)

**Problem.** `data`/`series.data` are `number[]`, so a missing sample (host offline,
agent gap, a bucket with no data) cannot be represented — callers must either drop
it (shifting the x-axis) or fill it (a fake value / a straight line bridging the
gap). On a time-series that misrepresents reality: a flat line across an outage
reads as "steady", not "no data".

**Proposed API (additive):**

```ts
// widen the accepted element type; existing number[] callers unaffected
data: input<(number | null)[]>([]);
// StrctChartSeries.data likewise: (number | null)[]
```

**Rendering.** A `null` (or `NaN`) point is a break: the line/area path splits into
segments (`M`…`L`… restarts after the gap), no interpolation across it. Grid, axes,
x-labels and the hover layer keep the null index's x-slot (so time stays aligned);
hovering a null shows "no data". Area fill drops to baseline only at real points on
either side of the gap, not across it.

**Acceptance:** `[data]="[10,20,null,null,40]"` renders two disjoint segments (0–1
and 4), not a line from 20→40. **Back-compat:** all-number arrays render identically.

---

## FR-CHART-09 — Hover output event (cross-chart synchronized crosshair)

**Problem.** A performance dashboard stacks several charts sharing one time axis
(CPU, memory, network, disk). vCenter (and every good monitoring UI) moves the
crosshair on **all** of them together as you hover **one**, so you read every metric
at the same instant. `interactive` today owns the crosshair privately — there is no
way to observe or drive it, so cross-chart sync is impossible.

**Proposed API (additive):**

```ts
/** Emits the hovered point index (or null on leave). */
hoverIndex = output<number | null>();
/** Drive the crosshair externally (e.g. mirror a sibling chart's hover). null hides it. */
activeIndex = input<number | null>(null);
```

**Rendering.** `interactive` hover emits `hoverIndex` on move/leave (debounced to
animation frame). When `activeIndex` is set, the chart draws the crosshair + tooltip
at that index even without a local pointer (a "driven" crosshair). Local pointer
still wins while the pointer is over this chart. Purely presentational — no data change.

**Acceptance:** two charts with `(hoverIndex)="peer.activeIndex.set($event)"` both
show a crosshair at the same x while hovering either. **Back-compat:** no listener +
`activeIndex=null` ⇒ current behavior.

---

## FR-CHART-10 — Event / annotation markers (vertical reference lines)

**Problem.** `thresholds` draws **horizontal** reference lines (a value). Time-series
monitoring also needs **vertical** ones anchored to a point in time — "alarm raised",
"host rebooted", "config applied", "deploy". Today an operator can't see _when_
something happened against the metric.

**Proposed API (additive):**

```ts
export interface StrctChartAnnotation {
  index: number; // x position (data index)
  label?: string; // shown on hover / near the top
  status?: StrctChartStatus; // line color; default 'accent'
  dashed?: boolean; // default true
}
annotations = input<StrctChartAnnotation[]>([]);
```

**Rendering.** For each annotation, a vertical line at that x across the plot, with a
small top cap/label; included in the hover tooltip when the crosshair is near it.
Behind the data path, above the grid.

**Acceptance:** `[annotations]="[{index:120,status:'critical',label:'alarm'}]"` draws
a dashed red vertical at index 120. **Back-compat:** empty array ⇒ unchanged.

---

## FR-CHART-11 — Range/band series (min–max envelope around a line)

**Problem.** Downsampling a dense series to ~N buckets (we average each bucket) hides
the within-bucket spikes — a 100% CPU blip inside a 60s bucket averages away. The
standard fix is to send **avg + min + max per bucket** and shade the min–max band
behind the avg line, so peaks stay visible without shipping raw density. StrctChart
can't render a filled band between two bounds (per-series `area` only fills to
baseline).

**Proposed API (additive):**

```ts
export interface StrctChartSeries {
  // …existing…
  /** Optional per-point lower/upper bound; when set, a soft band is filled between them. */
  lower?: (number | null)[];
  upper?: (number | null)[];
}
```

**Rendering.** When `lower`+`upper` are present, fill a low-opacity band (series
color) between them behind the `data` line; the line itself is the avg. Band respects
nulls (FR-CHART-08) and the value axis. Tooltip may show `avg (min–max)`.

**Acceptance:** a series with `data` (avg), `lower` (min), `upper` (max) shows a
shaded envelope hugging the line. **Back-compat:** no lower/upper ⇒ plain line.

---

## FR-CHART-12 — Zoom / brush time selection

**Problem.** On a wide window (24h/7d/30d) operators want to drag-select a sub-range
to inspect it. No built-in brush today; callers can't even observe a selection to
re-query at finer resolution.

**Proposed API (additive):**

```ts
brush = input<boolean, unknown>(false, { transform: booleanAttribute });
/** Emits the selected [startIndex, endIndex] inclusive, or null when cleared. */
brushChange = output<[number, number] | null>();
```

**Rendering.** With `brush`, pointer-drag paints a translucent selection rectangle
over the plot; on release emits `brushChange`. The host app decides what to do
(re-fetch that range at a finer tier, or clamp the view). Double-click / Esc clears
and emits `null`. Coexists with `interactive` (brush is drag, crosshair is hover).

**Acceptance:** dragging across the plot emits `[start,end]`; the app narrows its
window. **Back-compat:** `brush=false` ⇒ no selection behavior.

---

## FR-CHART-13 — Export the rendered chart (PNG / SVG)

**Problem.** Operators want to drop a perf chart into a ticket / report. The chart is
already an SVG; there's no public way to get it out as an image.

**Proposed API (additive):** a public method on the component instance —

```ts
/** Returns the current chart as an SVG string, or a PNG data URL. */
toSVG(): string;
toPNG(scale?: number): Promise<string>;
```

(No template change; callers use a `@ViewChild(StrctChart)` ref, or a small
`exportChart` directive if preferred.)
**Acceptance:** `chartRef.toPNG(2)` resolves to a `data:image/png` at 2× scale that
matches the on-screen chart (theme colors baked in). **Back-compat:** additive method.

---

## Priority (HyperStruct's order of need)

1. **FR-CHART-08 (gaps)** — correctness: outages must not read as flat lines.
2. **FR-CHART-09 (hover sync)** — the single biggest "feels like vCenter" win on a
   multi-chart dashboard.
3. **FR-CHART-10 (annotations)** — correlate metrics with alarms/events.
4. **FR-CHART-11 (min–max band)** — keep spikes visible under downsampling.
5. **FR-CHART-12 (brush)** / **FR-CHART-13 (export)** — nice-to-have.
