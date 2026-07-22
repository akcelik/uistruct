# Feature Request: StrctChart — theme-provided categorical data palette (`--chart-1..8`)

**Component:** `StrctChart` — `projects/strct/src/lib/charts/chart.ts` (selector `strct-chart`) + token theme `styles/_tokens.scss`
**Type:** enhancement (additive; opt-in via a new `status` value / `color` role)
**Severity:** medium — multi-series charts have no theme-driven categorical colors
**Reported from:** HyperStruct (a consumer app), 2026-07-19
**Context:** sibling to `strct-chart-monitoring.md`. This is **FR-CHART-15**.
**Audience:** an AI/code agent implementing directly against the source + the theme.

## FR-CHART-15 — Categorical data palette per theme

### Problem

`StrctChart` colours a series from exactly four semantic status tokens:

```ts
const COLOR: Record<StrctChartStatus, string> = {
  accent: 'var(--acc)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  critical: 'var(--critical)',
};
```

That is correct for **single-series / health** charts (accent line, or green→amber→red
by threshold). But it has two gaps for **categorical multi-series** charts (N distinct
entities: per-node CPU, per-datastore latency, per-VM throughput):

1. **No categorical palette.** Beyond the 4 semantic tokens there are no theme colours,
   so a 3rd/4th series must reuse `success`/`warning` — which then _read as_ "healthy /
   warning" when they only mean "series 3". Semantic tokens are reserved; reusing them
   for identity is a category error (and looks wrong).
2. **The semantic tokens aren't tuned for data lines.** In the **arctic** palette
   `--acc` is `#7b9ec8` (dark) — a low-chroma "steel" (OKLCH C ≈ 0.089, **below the 0.10
   chroma floor** a data mark needs to not read as gray). It's a fine UI accent but a
   washed-out chart line. A consumer building an arctic-theme chart sees lines that
   don't feel like they belong to the theme — the reported symptom.

### Desired behavior

Ship a **categorical data palette** as theme tokens `--chart-1 … --chart-8`, defined per
palette (arctic / ember / sage) × mode (light / dark), and let a series opt into it.

- **Slot order is fixed** (the CVD-safety mechanism) and **slot 1 leads with the theme's
  accent hue** (so a single-series or primary series still "matches" the app accent —
  but at a **data-grade chroma**, not the muted UI `--acc`).
- Semantic `accent/success/warning/critical` stay exactly as they are (health/threshold
  work is unchanged and still reserved).

### Proposed API

Add a categorical role to the series color resolution. Two equivalent shapes — pick one:

```ts
// (a) numeric slot on the series
readonly seriesIndex = input<number | null>(null); // 1..8 -> var(--chart-N)

// (b) or extend the color union the series already accepts
// StrctChartSeries.color: 'chart-1' | … | 'chart-8'  (in addition to the 4 status names)
```

`StrctChartSeries.color` already exists ("Per-series color; falls back to the chart's
`status`") — the cleanest path is to let it accept `'chart-1'..'chart-8'` and map them to
`var(--chart-N)`. No behavior change for existing callers (they pass a status name or a
raw color).

### The palette — validated reference instance

Use the dataviz **validated default** (blue-led, fixed order, colorblind-safe). It clears
every hard gate on both arctic surfaces (verified with the palette validator, OKLab ×100):

| slot | hue     | light `#` | dark `#`  |
| ---- | ------- | --------- | --------- |
| 1    | blue    | `#2a78d6` | `#3987e5` |
| 2    | green   | `#008300` | `#008300` |
| 3    | magenta | `#e87ba4` | `#d55181` |
| 4    | yellow  | `#eda100` | `#c98500` |
| 5    | aqua    | `#1baf7a` | `#199e70` |
| 6    | orange  | `#eb6834` | `#d95926` |
| 7    | violet  | `#4a3aa7` | `#9085e9` |
| 8    | red     | `#e34948` | `#e66767` |

Verified on **arctic** surfaces (`--bg-0` dark `#0e1015`, light `#f3f4f6`):

- **dark:** lightness band PASS, chroma PASS, CVD adjacent worst ΔE **8.4** (≥8), normal-vision worst **19.3** (≥15), contrast ≥3:1 PASS.
- **light:** all PASS except a contrast WARN on 4 mid-tone slots (2.0–2.9:1) → **relief required**: those charts must carry visible labels or a table view (StrctChart already ships legend + direct labels + hover, so relief is satisfied).

**Per-palette tuning (ember / sage):** keep the same 8-slot _order_ and re-step **slot 1**
to that palette's accent hue at data-grade chroma (ember → amber-led, sage → green-led),
then **re-run the validator** for each palette × mode and snap any failing slot to the
nearest passing step. Don't ship an un-validated set — the whole point of the palette is
that it's computed, not eyeballed. (Validator: `dataviz/scripts/validate_palette.js`,
`--mode dark --surface <bg-0>` per palette.)

### Non-goals / guidance for consumers

- **Two-directional pairs are NOT categorical.** Network in/out, disk read/write are one
  metric with two directions — colour both from **one hue** (the accent) and separate
  them with `dash` (already supported), not two palette slots. HyperStruct does this.
- **>8 series:** fold into "Other", facet (small multiples), or direct-label — never
  cycle the palette (slot 9 ≠ a generated hue).
- **All-pairs forms** (scatter / bubble / choropleth): only the **first 4 slots** validate
  under `--pairs all`; cap those forms at 4 series or facet.

### Acceptance criteria

- `var(--chart-1..8)` exist in every palette × mode and each set passes the validator
  (adjacent pairlist) for its surface.
- A series can opt into a slot; the 4 semantic statuses are unchanged.
- Slot 1 tracks the theme accent hue (single/primary series feels on-theme) at C ≥ 0.10.

### Consumer note (HyperStruct)

Monitoring throughput charts already use one-hue + dash (in solid, out dashed) so they're
theme-cohesive without this FR. This FR unblocks **genuinely categorical** charts we don't
build yet (per-node CPU comparison, per-datastore latency) — those will use `--chart-1..N`.
