# Feature Request: StrctChart — hover tooltip must stay in-bounds at the edges

**Component:** `StrctChart` — `projects/strct/src/lib/charts/chart.ts` (selector `strct-chart`)
**Type:** enhancement (additive; default output for mid-chart hovers is unchanged)
**Severity:** medium — the first and last data point's values are unreadable
**Reported from:** HyperStruct (a consumer app), 2026-07-19
**Context:** follow-up to `strct-chart-monitoring.md` (FR-CHART-08..13). This is **FR-CHART-14**.
**Audience:** an AI/code agent implementing directly against the source.

## FR-CHART-14 — Tooltip edge clamp / flip

### Problem

The hover tooltip (`.strct-chart__tip`, `.strct-chart__tip--multi`, `.strct-chart__tip--gap`)
is positioned on the hovered point and horizontally centered:

```html
<div class="strct-chart__tip strct-chart__tip--multi" [style.left.px]="hoverX()">…</div>
```

```css
.strct-chart__tip--multi {
  transform: translate(-50%, 0);
}
```

`hoverX() = xOf(i)` is the pixel-X of the data point inside the plot. `translate(-50%)`
centers the balloon over the point — so at the **first** point (`i=0`, `x≈0`) the balloon's
left half extends **past the left edge** of the plot box, and at the **last** point its
right half extends past the right edge.

`.strct-chart` / `.strct-chart__plot` don't themselves set `overflow:hidden`, but a chart
almost always lives inside a clipping ancestor — `.strct-card { overflow:hidden }`, a
scroll-pane, a grid cell. Result: **the values of the very first and very last data point
can never be shown** — precisely the endpoints a monitoring user cares about most (first /
latest measurement).

This is **not** a consumer-side CSS issue: the balloon leaves the chart's _own_ box, so no
matter what wraps it (even if the consumer sets the card to `overflow:visible`, the next
grid/scroll ancestor clips). The fix has to be inside the chart.

### Desired behavior

The tooltip must always stay **within the plot bounds**. When the point is near the left
edge it left-aligns, near the right edge it right-aligns, otherwise it stays centered
(edge-flip) — **or** its `left` is clamped to `[tipW/2, plotW − tipW/2]`. The vertical
cursor line (`__cursor`) must stay at the true point-X; only the **balloon** shifts.

Applies to the single tip (`.strct-chart__tip`), multi tip (`--multi`) and gap tip
(`--gap`); the value-axis chip (`.strct-chart__axis-y`) should likewise stay in-plot.

### Proposed implementation (flip approach — no tip-width measurement)

Bind `transform` dynamically off `hoverX()` relative to plot width (`this.width()`):

```ts
/** Keep the tooltip inside the plot: flip alignment when the point is near an edge. */
protected readonly tipShift = computed<string>(() => {
  const x = this.hoverX();
  const w = this.width();
  if (x == null || !w) return 'translate(-50%, 0)';
  const pad = 8; // edge gap (px)
  if (x < w * 0.12) return `translate(${pad}px, 0)`;                 // left-align
  if (x > w * 0.88) return `translate(calc(-100% - ${pad}px), 0)`;  // right-align
  return 'translate(-50%, 0)';                                       // centered
});
```

```html
<div
  class="strct-chart__tip strct-chart__tip--multi"
  [style.left.px]="hoverX()"
  [style.transform]="tipShift()"
>
  …
</div>
```

(Remove the hard-coded `transform: translate(-50%,0)` from the tip CSS; `tipShift()` now
owns it.) For pixel-exact placement the balloon `clientWidth` can be measured via a
`viewChild` + `afterRenderEffect` and `left` truly clamped — but the threshold-flip is
visually sufficient and costs no measurement/reflow.

### Acceptance criteria

- Hovering the **first** and **last** data point shows the full tooltip, never clipped.
- Mid-chart hovers are unchanged (still centered).
- Works for `--multi`, single and `--gap` tips.
- Not clipped even inside an `overflow:hidden` ancestor (e.g. `StrctCard`).

### Back-compat

Additive: mid-chart output is byte-identical (still `translate(-50%,0)`); only the ~12%
edge zones flip. No new inputs; no API surface change.

### Consumer note (HyperStruct)

Host / Cluster / VM ▸ Monitor cards each place `<strct-chart>` inside a `<strct-card>`
(`overflow:hidden`). No consumer change needed once this ships.
