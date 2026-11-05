# BUG-73-01 — A fan-out edge that skips a column runs behind the boxes of the column it crosses

> **CLOSED, 2026-11-05.** Fixed in **v7.9.1**, by ask 1: the skip is routed around the column.
> Reproduced first on the showcase's own blast-radius drawing — **232 of 401** sampled points of
> `hv-01 → sql-vm-02` inside `hv-02`, **140px** of line hidden — then fixed to **0**.
>
> The report found one case; sampling found a second. The cluster's-last-member drawing puts two
> boxes at the **same height** with a column between them that holds only its note, and a level
> edge was exempt from routing entirely: **141px** of it ran through "no other member". A column
> that holds only its note now occupies its own band, so it splits the strip the way a box would,
> and a level edge routes like any other.
>
> Headings and empty-column notes are obstacles on both counts — they bound the strips, and no run
> crosses them. Where no gutter is wide enough, the diagram reserves a **24px** channel under
> itself rather than drawing through something; the decision is taken from the boxes, not from the
> room already reserved, so it settles in one pass.
>
> `scripts/flow-topology.mjs` (**30 checks**) samples every edge of both diagrams 401 times against
> every box, heading and note. Ask 2 — warning in dev mode and documenting the limit — was not
> needed.

**Filed by:** HyperStruct, 2026-11-05, against **7.8.1**, while adopting edge labels on Host ▸ Overview ▸
"Where they would land" (HyperStruct O459). Measured in Chrome, not seen on a real cluster: the
drawing was taken out before shipping.

## What happened

The blast-radius drawing has three columns: **This host** (0) → **Lands on** (1) → **Stays down** (2).
Adding the edge `{ from: 'source', to: 'stays', status: 'critical', style: 'dashed', label: '3 VMs · 288 GB' }`
— column 0 straight to column 2 — gave a line that:

- leaves the source box, climbs to the top of column 1 and runs **behind the first box in "Lands on"**
  (`PDASHPVGENC201`, 208 × 171px). It comes out of that box's right edge and goes on to "Nowhere".
  Sampled every 1/60 of `getTotalLength()`, the points fall inside that box from its left edge to its
  right edge. That is about 207px of the line hidden;
- carries its label in the strip between columns 0 and 1, so the word sits beside the first member's
  path;
- **reads as passing through that member**: "the stranded VMs go via 201 to Nowhere". In a failover
  drawing that is the one statement it must never make.

The two edges between adjacent columns (0 → 1) are perfect: 7 lanes, 0.0px drawn twice, labels clear
of every box. Only the skip is wrong.

## Why it matters

A fan-out whose columns are stages can always have an edge that skips one: the source to an outcome
with no intermediate (here "Nowhere"), a host straight to a fabric that has no ToR, a VM straight to
an uplink when there is no port group. Today the consumer cannot draw that edge at all without the
drawing saying something false. HyperStruct drops the edge and leaves "Nowhere" unconnected.

## Ask (either is enough)

1. **Route the skip around the column it crosses.** Take the edge through the clear gutter between
   two boxes of that column, or above the first box or below the last. Keep a lane of its own as 7.8
   does for trunks, and put its label in the first strip it turns in. No point of the path may fall
   inside a box it does not end on. The `flow-topology.mjs` gate can check that the same way it
   checks the 0.00px endpoint distance.
2. **Or refuse it visibly.** In dev mode, warn when an edge's columns are not adjacent, and document
   that `fan-out` edges join adjacent columns only. This is less useful, but at least nobody ships a
   line through a box.

## Repro

```html
<strct-flow
  layout="fan-out"
  [columns]="['This host', 'Lands on', 'Stays down']"
  [nodes]="[
    { id: 'source', label: 'HV-02', column: 0 },
    { id: 't0', label: 'HV-01', column: 1 },
    { id: 't1', label: 'HV-04', column: 1 },
    { id: 'stays', label: 'Nowhere', column: 2, status: 'critical', emphasis: 'surface' }
  ]"
  [edges]="[
    { from: 'source', to: 't0', status: 'success', label: '12 VMs · 104 GB' },
    { from: 'source', to: 't1', status: 'success', label: '16 VMs · 88 GB' },
    { from: 'source', to: 'stays', status: 'critical', style: 'dashed', label: '3 VMs · 288 GB' }
  ]"
/>
```

Give the boxes some height (HyperStruct's are 171px tall), then sample the third path's points
against the `[data-flow-node="t0"]` rectangle.
