# FR-72-01 — Checks by node: a matrix of judgements, not numbers

> **OPEN.** Filed 2026-11-05 against **7.7.0**.

**Filed by:** the maintainer, from the lower-left card of the same Network Health reference
screenshot [FR-71-01](archive/wiring-map.md) was filed from. That FR shipped the wiring map and
closed with this explicitly left out — _"`strct-heatmap` is a numeric density ramp and is the wrong
component for it. It is not a diagram, so it is not part of this ask; if it is wanted it should be
filed as its own."_ This is its own.

## What the card does

**CHECKS BY NODE** — 17 checks × (4 nodes + a Cluster column) = **85 cells**, each holding one of
six states. Counted off the filed screenshot:

| State         | Cells  | What it means                               |
| ------------- | ------ | ------------------------------------------- |
| passed        | **62** | judged, agrees                              |
| warning       | **4**  | judged, differs and can wait                |
| critical      | **1**  | judged, differs and cannot                  |
| note          | **1**  | judged, worth knowing, not a fault          |
| not judged    | **3**  | the check applies here, there is no reading |
| not on a node | **14** | the check has no meaning for this subject   |

The three "not judged" agree with the header tile above the card (_"3 min ago · 3 checks not
judged"_), which is the only place on the screen that the number appears twice.

Two things in that table are the whole point of the ask. The question the card answers is not _how
much_ but _where_: one critical cell among 85. And **the two blanks are not the same blank** — a
gap in the capture is an operational fact about the fleet, a check that does not apply to a node is
a fact about the check. The reference draws them as two shades of nothing.

The row ids are a catalogue's, not the grid's: **H2 … H17 and H19** — no H1, no H18. A component
that renumbers rows would break the one thing an operator carries between screens.

## Why nothing in the library draws it today

`strct-heatmap` is the nearest thing and is the wrong component, by its own definition. Its cell is
`{ row: string; col: string; value: number }` and its fill is an intensity ramp — `color-mix` from
8% of one status hue at the smallest non-zero value to full at `max`, or, with `thresholds`, a hue
per band with an ascending intensity inside it (`FR-44-02`). Three consequences:

- **Six categorical states are not a ramp.** Putting them on a number line invents an order between
  "note" and "warning", and puts "passed" and "not judged" at the two ends of one scale as though
  one were more of the other.
- **A cell is present or absent.** There is no way to say _absent because nothing was read_ apart
  from _absent because the question does not apply_, and an absent cell is drawn as nothing at all.
- **The grid is one `role="img"`** with a generated summary sentence. 85 judgements are not a
  sentence.

The build that works today is `strct-table` with a `strct-status-dot` per cell, and an app can ship
that now. What it costs: `StrctStatus` is five tones (`neutral · accent · success · warning ·
critical`) and **neither absence is a tone**; there is no roll-up on either axis; there is no
keyboard across two axes, because a table's arrow keys are a table's; and every app that wants the
view rebuilds the same grid.

## What the reference gets wrong, measured

Read from the filed PNG (2880 × 3452 at @2x, so every length below is CSS px), each colour the
median of a 9 × 9 patch, each contrast by WCAG relative luminance against the card surface
`rgb(20, 22, 29)`.

**1 — Both absences, and the most common state, sit under the floor for a graphic.**

| Mark                     | Contrast vs the card |
| ------------------------ | -------------------- |
| "not on a node" outline  | **1.15 : 1**         |
| "not judged" hatch       | **1.52 : 1**         |
| "passed" fill (62 cells) | **2.88 : 1**         |
| "critical" fill (1 cell) | 5.68 : 1             |
| "warning" fill (4 cells) | 8.15 : 1             |

WCAG 1.4.11 asks 3:1 of a graphical object you must see to understand the content, and all six of
these carry a distinct meaning. The two that are hardest to see are the two the operator is least
able to guess.

**2 — The state is carried by hue alone.** ΔE2000 between the fills, then again after a Machado
(2009) severity-1.0 colour-vision simulation:

| Pair               | Normal | Deuteranopia | Protanopia | Luminance contrast |
| ------------------ | ------ | ------------ | ---------- | ------------------ |
| warning / critical | 28.7   | **12.1**     | 17.3       | **1.44 : 1**       |
| passed / critical  | 41.0   | 22.2         | **15.5**   | 1.97 : 1           |
| passed / warning   | 33.7   | 32.9         | 29.8       | 2.83 : 1           |

warning against critical is the pair that decides whether someone is paged tonight. Its luminance
contrast is 1.44:1, so **nothing but hue separates them** — and hue is the one channel a deuteranope
does not have, where the pair falls to ΔE00 12.1 on a 26 × 14 px pill with no text in it.

**3 — The cell is a mark, not a target.** 26 × 14 px, no label, no tooltip, no focus, no accessible
name. 85 silent marks in a picture; the single critical cell is found by scanning.

**4 — A label that wraps drags its row's marks off the row.** H2 (_"Team members alike, same on
every node"_) is the only label that wraps to two lines. Its marks sit **13.0px** above the row's
centre line against a constant **4.5px** for the other sixteen rows — **8.5px** of drift caused by
the wrap alone, because the mark is aligned to the label's first line instead of to the row. This is
the same defect class as BUG-70-01, where a bar's category label was at a different pitch from its
bar.

**5 — No roll-up on either axis.** The header strip above the card already says "1 critical ·
4 warnings" for the whole cluster. Neither the row ("is this check clean across the fleet?") nor the
column ("is this node clean?") says it, and those are the two questions a matrix exists to answer
faster than a list.

**6 — The Cluster column is a different kind of subject in the same axis.** Four nodes and one
aggregate, same header style, nothing marking the fifth as a roll-up of the first four. Six rows are
"not on a node" everywhere except Cluster and two (H16, H17) exist only there — the structure of the
data, drawn as though it were an accident of the data.

## Proposed shape

`strct-status-matrix`, to sit beside `strct-status-dot` and `status.ts`. (`strct-matrix` alone says
nothing about what is in it; `strct-check-grid` names one caller's vocabulary.)

```ts
/** The five canonical tones, plus the two absences a judgement grid needs. */
export type StrctMatrixState = StrctStatus | 'unjudged' | 'off-subject';

export interface StrctMatrixAxis {
  /** The catalogue's own id — 'H19' — gaps and all. Never renumbered. */
  id: string;
  label: string;
  /** 'cross-node rows in Cluster' */
  hint?: string;
  /** A 'summary' axis entry is a roll-up of the subjects, not another subject. */
  kind?: 'subject' | 'summary';
}

export interface StrctMatrixCell {
  row: string;
  col: string;
  state: StrctMatrixState;
  /** 'PFC 3 · policy and adapter ≠ 4 · LLDP and link peer' */
  detail?: string;
}
```

Inputs `rows`, `cols`, `cells`, `label`, `emptyText`, `navigable`, `rollup` (`'none' | 'row' | 'col'
| 'both'`), `selected` (model); output `cellActivate`.

What the component owes, numbered against the defects above:

1. **Every state ≥ 3:1** against its surface in both palettes, the two absences included.
2. **A shape per state, not only a hue** — the glyph vocabulary the library already gates with
   `glyph-distinct`. No two states separable by hue alone, measured under a CVD simulation.
3. **One tab stop, `role="grid"`**, roving tabindex, arrows on both axes, Home/End for the line and
   Ctrl+Home/End for the grid, Enter to open the cell. Every cell names itself: _"H9 Priority flow
   control, HV-PRD-03: critical — PFC 3 ≠ 4."_ This is the rule FR-71-01 settled for the wiring map:
   the picture must say out loud the sentence it was drawing.
4. **A mark is centred on its row** whatever its label does — ≤ 1px, including a wrapped label.
5. **An optional roll-up row and column**, each the worst state in its line, marked as a roll-up.
6. **A `summary` axis entry reads as a different kind of subject** from the ones it summarises.
7. **Narrow width**: below the width where the columns stop fitting, the fallback `strct-wiring`
   takes — stack by subject and keep the words, never scroll the meaning off-screen.

## What the gate would have to measure

`scripts/status-matrix.mjs`, two widths × both palettes, everything read back from Chrome, the way
`wiring-map.mjs` does:

- every state's contrast against its own surface ≥ 3:1 (reference: 1.15 and 1.52);
- pairwise ΔE2000 after deuteranopia and protanopia simulation **plus** a shape difference, so no
  pair of states is separable by hue alone (reference: 12.1);
- `|mark centre − row centre| ≤ 1px`, with at least one wrapped label in the fixture (reference:
  8.5px of drift);
- the arrows reach all R × C cells, Enter activates, and the grid is one tab stop;
- every cell's accessible name carries its row, its column and its state;
- a roll-up equals the worst state in its line, recomputed when the data changes.

## Out of scope, and open questions

- **Filtering from the legend.** `strct-legend` exists; whether clicking a swatch filters the grid is
  a separate ask and not filed here.
- **Row grouping.** The data has groups (H2 … H15 are per-node, H16 / H17 are cluster-only) and the
  reference does not draw them. Deferred until a real screen needs them.
- **Density.** 17 × 5 fits on a card. 60 × 40 does not, and at that size this is a different
  component with virtualisation. The ask here is tens of rows, not thousands.
