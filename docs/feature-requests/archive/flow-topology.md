# FR-72-03 — A fan-out's lines have to be told apart

> **CLOSED, 2026-11-05.** Shipped in **v7.8.0**.

**Filed by:** the maintainer, 2026-11-05, against **7.7.0**, in one line: _"improve the topology on
the Flow page the way the wiring map was improved — let us show switch and uplink structures more
legibly and more distinguishably."_

> **SHIPPED in v7.8.0** on `strct-flow`, with `scripts/flow-topology.mjs` (**29 checks**, two widths
> × both palettes) wired into CI and 6 new specs.

## What was wrong, measured on 7.7.0

`strct-flow`'s `fan-out` / `tree` measured its connectors from the boxes' real positions, which is
the right instinct, and then threw the result away at both ends: every edge left its source's
**vertical centre**, arrived at its target's **vertical centre**, and turned at the **midpoint**
between the two columns. Three edges between the same two columns therefore turned on the same x.

Read from Chrome on the showcase's own topology (`/components/flow`, 8 boxes, 7 edges):

| Measured on 7.7.0                       |                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| edges sharing one start point           | `mvs-01` ×2 at (236, 62.30) · `hv-01` ×2 at (378, 51.80)                     |
| edges sharing one end point             | `mvs-01` ×2 at (142, 62.30)                                                  |
| collinear trunks, topology              | 2 pairs, **11.7px** of line drawn twice                                      |
| of which                                | one pair **neutral over critical/dashed** — a healthy uplink over a dead one |
| collinear trunks, the tree on that page | 1 pair, **10.5px**, **accent over warning/dashed**                           |
| a word on a line                        | no such thing in the API                                                     |

So the picture could not answer the question an uplink view exists for — _is this host dual-homed,
and which of its links is the one that is down_ — because at the node and in the gap the lines were
the same line.

## What shipped

**An anchor per edge.** A node carrying more than one edge on a side spreads them across that side,
ordered by the far end so two of them never cross on the way out, and a tick marks each attachment
clear of the card. One edge still keeps the centre.

**A lane per edge.** The boxes occupy bands of x; what is left between them are clear strips, and
every trunk in a strip gets an x of its own — the rule the wiring map's labels already followed, now
carrying the lines too. The turns are quarter-arcs, which is what makes three lanes side by side
followable.

**A word on the line.** `StrctFlowEdge.label` — "LACP · 25G", "down 2 d", "trunk 200–209". It lives
in the same strip its edge turns in, bounded by it on **both** axes, placed from its own rendered
size worst-first so no two labels touch, and repeated in its source node's description so it is
heard as well as seen. **Only the strip that carries a word is widened**, by a margin on the column
after it, and only until a column would fall under 112px; under that floor the labels ellipsise in
place rather than squeeze the boxes.

**One path at a time.** `[(selected)]` and `isolate` (on by default): picking a node lets the edges
it is not on recede to 0.22 and draws its own path a pixel heavier. Picking it again lets the whole
diagram back, so the picture can always be read whole without reaching for a control outside it.
Isolation acts on the drawing and **never** on the words — the rule FR-71-01 arrived at the hard
way, when a dimmed warning label measured 3.31:1.

Measured after, at 1600px light and 1240px dark:

|                                                   | Measured                                               |
| ------------------------------------------------- | ------------------------------------------------------ |
| \|edge end − its box's edge\|                     | **0.00px**, worst of 14 endpoints                      |
| endpoints inside their own box's height           | **7 / 7**                                              |
| distinct lanes for 7 trunks                       | **7** · **0.0px** drawn twice                          |
| nodes sending their edges out crossed             | **0**                                                  |
| label over a box                                  | **0px²**, across 3 labels and 8 boxes                  |
| label over a label                                | **0** pairs                                            |
| columns, 1600px / 1240px                          | 165px / 115px each (floor 112), no label clipped       |
| picked path                                       | 3 edges at opacity 1 and 2.5px, 4 at 0.22, 1.5px       |
| words dimmed while a node is picked               | **0** — every label and box opacity stays 1            |
| worst label contrast while another node is picked | **4.74 : 1** (AA 4.5)                                  |
| → from `hv-01`                                    | lands on its first uplink, not the next column         |
| at 430px                                          | columns stack, edges `display: none`, labels not drawn |

## What the gate caught, and what it got wrong itself

`scripts/flow-topology.mjs` reads everything back from what Chrome drew — the paths sampled with
`getPointAtLength`, the boxes and labels from `getBoundingClientRect`, the dimming from
`getComputedStyle`, the keyboard from real key events.

**Real, three:**

- **A label centred on its lane spilled onto the box beside it** — "down 2 d" covered ToR-B by
  **94px²** and ToR-A · 1/0/8 by **49px²**. Bounding a label by the strip's _width_ is not the same
  as bounding it _inside_ the strip; it is now clamped on both axes.
- **Reserving the strip from a fixed width starved the columns**, to **67px** each, and pushed a
  box's own words outside its card. Two things were wrong: the room was taken from every gap though
  one strip carried all three labels, and nothing stopped it being taken. The reservation is now
  per-strip — a margin on the column after the strip that needs it — and capped so no column falls
  under 112px, with `overflow-wrap: anywhere` on the box as the backstop. Uniform, the columns came
  out at the 112px floor with all three labels ellipsised at 1240px; per-strip they are 115px with
  none.
- **`scrollWidth` is an integer and the border sits outside it**, so a label measured at 72 and
  given 74 came out a subpixel short and ellipsised inside a strip built to fit it.

**The gate's own, two:**

- `stroke-width` built from a token computes to the string **`"calc(2.5px)"`**, which `parseFloat`
  reads as `NaN`; the check for a heavier picked edge reported "picked px against px" and would have
  reported nothing useful either way.
- The narrow check read the fan's own `display` when the label overlay was **absent** — but an
  absent overlay is the overlay not being drawn, which is exactly the result the check was looking
  for.

Two expectations in the gate were also simply wrong and were corrected against the component rather
than the other way round: `hv-01` is on **three** edges (two uplinks out, the switch in), not two;
and a picked label is set in a heavier weight, so it is measured and placed again — its colour is
the thing that must not move, not its position.

## Deliberately not done

- **Bundling LAG members into one line.** Four edges between the same two boxes are four lines, each
  now in its own lane. Still worth doing when a real screen has enough of them to be unreadable;
  FR-71-01 deferred it for the same reason and nothing has changed that.
- **A label on a `chain` flow.** The chain connector has one line and a caption under it already.
