# BUG-70-01 — Bar chart: category labels are not under their bars, and the last one is cut

> **CLOSED, 2026-11-04.** Shipped in **v7.6.1**.

**Filed by:** HyperStruct, 2026-11-04, against **7.6.0**.
**Seen on:** Volume Group ▸ Overview, "Volumes" card (O454). The card is two thirds of a 3-column board,
so the chart is 784px wide. Before O454 the same chart sat in a full-width card, where the drift was
smaller and the last label still fitted.

> **SHIPPED in v7.6.1**, all three asks. Reproduced at the filed width first:
> the bars 183.5px apart, the labels 244.7px, and the fourth label ending
> **34px** past the chart's right edge — this report's numbers exactly.
>
> The cause is one layer below where it shows. A bar chart puts _n_ categories
> in _n_ slots and a line chart's _n_ points make _n−1_ intervals; the bars read
> `chartW / n` and the labels read `chartW / (n−1)`, because the geometry was
> computed in two places. There is now one `bandSlot()` / `bandOf()` that both
> read, so they cannot drift apart again. Measured after: every label is
> **0.00px** off its band, at both widths, and the null band keeps its slot.
>
> Each bar label is bounded by its own band and ellipsises inside the chart, so
> ask 2 holds for a name of any length rather than only for these four. Line
> charts are untouched and a spec says so.
>
> **One correction.** This report says "the label is under its bar only for the
> first category". Measured, the first is the **worst** — 92px off, as is the
> fourth; the middle two are 30px. Nothing lined up, which the report's own
> table shows.
>
> The gate asked for is `scripts/chart-bands.mjs`: |label centre − band centre|
> < 1px for every category and no label outside the box, at two widths, with
> the band derived from the bars that are actually drawn rather than from the
> component's own arithmetic. **6 of its 9 checks fail on 7.6.0.**

## What a reader sees

Four volumes, one bar each (the fourth was not read, so it has no bar). The labels do not line up with
the bars, and the last label is cut at the card's edge: "CSV-PROD-" instead of "CSV-PROD-04".

## Measured (Chrome, 1600×1000, light theme)

The usage is plain: `<strct-chart type="bar" [data]="[78, 61, 54, null]" [labels]="[…4 names]" [min]="0" [max]="100" [height]="200" yAxis grid [thresholds]="[{ value: 75, label: 'Placement limit 75%', status: 'warning' }]" />`

|                                          | left → right (px, viewport)                                           |
| ---------------------------------------- | --------------------------------------------------------------------- |
| chart host                               | 352 → 1136 (784 wide; the svg is `width="784" viewBox="0 0 784 200"`) |
| bar 1 / 2 / 3                            | 431–541 · 614–724 · 798–908 (centres 486, 669, 853; 183.5 apart)      |
| band 4 (null, no bar)                    | centre ≈ 1036, from the bars' pitch                                   |
| label 1 / 2 / 3 / 4 (`span`)             | 354–434 · 597–680 · 842–925 · **1087–1170**                           |
| threshold label (`div.strct-chart__thr`) | 1011–1134                                                             |

- **The pitch differs.** The bars are 183.5px apart; the labels are 245px apart. The bars sit in the plot
  area (the width less the y axis), while the labels seem to be spaced over the whole width at a
  different step. The label is under its bar only for the first category.
- **The last label leaves the box.** Label 4 ends at 1170, 34px past the chart's right edge (1136). The
  card clips it.
- **A null category has no label anchor.** Band 4 has no bar, so nothing on screen says which column
  the label belongs to. With the drift, its label lands on nothing.

## Ask

1. Centre each category label under its band, at the same pitch as the bars, in the plot area. For a
   `null` value the band still takes its slot, and the label sits under that empty slot.
2. Never draw a label outside the chart's box. Ellipsis or wrap, the library's choice; a cut word is
   neither.
3. A gate like `grid-layout.mjs`: for each category, |label centre − band centre| < 1px at two widths
   (one of them about 780px), and no label's right edge past the host's right edge.

## Not asked

The threshold label at the right ("Placement limit 75%") is fine where it is; it overlaps no bar here.
