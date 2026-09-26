# FR-43-01..03 — `strct-heatmap` for a monitoring grid (hours × hosts)

> **RESOLVED in 4.3.0 (2026-09-26).** All three ship. FR-43-01: labels are tracked by index
> (row labels too) and both `colLabelEvery` and `colLabel` exist — the FR offered either/or,
> but they answer different halves (how many labels, and what they say), and the useful
> combination is keying a column by an ISO time while labelling every third one "14:00".
> FR-43-02: `valueFormat`. FR-43-03: `thresholds`, with intensity scaled inside the band
> and floored at 45% — the FR noted a pale cell is hard to tell from an empty one, and a
> band whose low end is nearly colourless would have kept that problem.
> Measured in Chrome on the showcase demo: zero overlapping column labels across 24 hourly
> columns, all 96 cells drawn, and all three band hues present.

**From:** HyperStruct (Home ▸ "Load · last 24 hours", O225) · **Version:** 4.2.0 ·
**Severity:** medium — the grid is usable, but three things an operator reads it for
are either impossible or need a workaround in the consumer.

The consumer draws one row per host and one column per hour of the last day, value =
the hour's average CPU (or memory) use in percent, `max = 100`. That is the canonical
monitoring heat map (vROps, Grafana, Prism all have one), and it is where the three
gaps below show.

## FR-43-01 — column labels on a stride (`colLabelEvery` or `colLabel` formatter)

Every column gets a label, and labels are tracked by their text
(`@for (l of colLabels(); track l.text)`).

- 24 hourly columns in a 700 px card leave ~26 px per label: `"14:00"` overlaps its
  neighbours, so the consumer is forced down to `"14"`, which reads as a number, not a time.
- Labelling every third hour is the readable form, but blank labels are impossible:
  `""` repeated is a duplicate track key (NG0955 in dev), so the consumer cannot thin
  the labels itself.
- A repeated label is also real data: at the DST fall-back the hour `02` occurs twice.
  The consumer currently appends `′` to keep the keys distinct.

**Ask:** track labels by index, and add `colLabelEvery: number` (default 1 — today's
behaviour) and/or `colLabel: (col: string, index: number) => string` so a consumer can
key columns by an ISO time and show `"14:00"` every third column.

## FR-43-02 — value formatting in the cell tooltip (`valueFormat`)

The tooltip is fixed to `` `${row} × ${col}: ${value}` `` — for a CPU grid that reads
`hv-ist-p05 × 14: 47`, with no unit. `summaryFormat` exists for the aria summary but
not for cells.

**Ask:** `valueFormat: (value: number, row: string, col: string) => string`, used by
the cell `<title>`, e.g. `hv-ist-p05 · 14:00 — 47% CPU`.

## FR-43-03 — a threshold ramp (`thresholds`), not only one hue

The ramp is one status hue from 8% to 100% intensity. For utilisation the question
is not "how much more than the others" but "is it past 80 %, past 95 %?": a 90 % hour
and a 60 % hour differ only by shade of the same colour, and a pale 30 % cell is hard
to tell from an empty one in the light theme.

**Ask:** an optional `thresholds: { warning: number; critical: number }` (same shape
as the `StrctThresholds` other charts take) that colours a cell `accent` below
`warning`, `warning` from there, `critical` from `critical` — intensity still scaled by
value within each band. Without `thresholds`, today's single-hue ramp.

## What the consumer does today (to be removed when these ship)

- column labels `"HH"` with a `′` suffix for a repeated hour (`dashboard.ts` `heatCols`);
- a line of text above the grid: "Hourly average, 0–100% · hover a square for its value";
- one hue (`status="accent"`) for both CPU and memory.
