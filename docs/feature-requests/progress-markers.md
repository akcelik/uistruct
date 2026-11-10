# FR-78-01 — `strct-progress`: markers on the track (a threshold, a limit)

**Filed by:** HyperStruct, 2026-11-10, against **7.12.0**. Cluster ▸ Configuration ▸ Load Balancing (O492 §14,
the operator's pick A) draws each host's CPU and memory as a bar **against the threshold the balancer
decides at** (70% CPU, 80% memory). The threshold is the point of the bar: a host over it is relieved
first. `strct-progress` has no way to draw it, so HyperStruct lays a 2px tick over the bar itself (marked
workaround in `src/app/object-detail/cluster-load-balancing-view.ts`, `.lbx-meter` / `.lbx-tick`).

## Reach

Any capacity bar with a line that means something: the balancer's thresholds (here), the cluster's N+1
line on capacity bars, a storage reservation, a vCPU ratio limit, a quota.

## What a reader sees today

`thresholds` only recolours the fill (`warning` past one value, `critical` past another). A bar at 74%
coloured `warning` says "too much", not "4 points past the line" — the line itself is not on the
screen, and a screen reader is told nothing about it. The `segments` input (now + leaving/arriving) is
there and works well with this; only the marker is missing.

## Measured

HyperStruct's workaround: a 2px element at `left: <threshold>%`, `top/bottom: -3px` around the track,
`var(--t1)` at 0.6 opacity. It has to wrap the component in a positioned span and assumes the track
is the component's full width — which is why HyperStruct uses the bar there without `showValue`,
`visibleLabel` or `caption` and prints the value under it itself: with any of those the track no longer
spans the host, and a tick placed by the host's width would miss the track's value (not measured — the
workaround avoids the case rather than measuring it). Screenshot of the workaround in place (Chrome,
1600 and 1920 px): the tick sits on the threshold of each bar, and on a `segments` bar (now + leaving).

## Ask

1. `markers: { value: number; label: string; status?: StrctProgressStatus }[]` — each drawn as a thin
   line across the track at `value` (clamped 0–100), in the track's own coordinates whatever
   `showValue`, `valuePosition`, `visibleLabel` or `caption` do.
2. Each marker's `label` joins the bar's accessible text ("CPU 74%, threshold 70%").
3. A marker's `status` tints its line (default: the text colour at reduced opacity), so a limit can be
   `critical` and a target `accent`.

## Acceptance

- The marker sits on the track's `value`% (±1px) with `valuePosition` `end` and `top`, in a 120px table
  cell and at full width — measured in Chrome.
- It reaches 3px above and below the track at the default height, and is visible on `segments` fills
  in both palettes at ≥ 3:1 against the fill it crosses.
- The accessible name names every marker; no new tab stop.
