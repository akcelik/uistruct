# A datacenter is a building, and a cluster is several machines

**Asked for:** 2026-11-18, directly, against **7.20.0**. Not a filed FR — two questions in the
working session:

> datacenter ikonu bir bina ikonu olmalı değil mi? ayrıca cluster ikonu da sunucuların bir arada
> gösterildiği bir ikon olmalı değil mi?

## The case

`datacenter`, `cluster`, `host` and `rack` are rungs of one tree, which means each is read beside
the one above and below it.

**`datacenter` was a card.** A rounded box with three rules and a dot — which is exactly how
`node` is built, one rung away in the same product. The existing distinctness gate measured them
**31.54%** apart stroke for stroke and passed them, because a pixel metric cannot see that two
marks depict the same kind of object. Nothing about the mark said "a place that holds the rest of
this tree".

**`cluster` was one striped block.** Three tall bars at `x=3..6`, `6.5..9.5`, `10..13` — gaps of
0.5 user units, crossed by a 1.4-wide stroke, so each pair of bodies **overlapped by 0.9 user
units**. They were never three bodies, at any size. Measured in the browser at the size a toolbar
reads a glyph at: **0 of the 2 clear lanes** three machines need.

## Shipped in 7.21.0 (2026-11-18)

- **`datacenter` is a building** — a facade on a ground line, four windows and a door. No detail
  to lose at 14px, and nothing else in the set is a building.
- **`cluster` is three of the chassis `host` is drawn from**, stepped, each with its own lamp. It
  is built from the rung below it, which is what a cluster is.

### Measured

`scripts/glyph-distinct.mjs`, which gained two measurements for this change.

|                                           | 7.20.0               | 7.21.0                   |
| ----------------------------------------- | -------------------- | ------------------------ |
| `cluster` — clear lanes at 14px (needs 2) | **0**, widest 0.00px | **2**, widest **1.25px** |
| `datacenter` / `node` — stroke            | 31.54%               | **45.81%**               |
| `datacenter` / `node` — outline           | 14.56%               | **20.59%**               |
| `cluster` / `host`                        | 29.79%               | **39.00%**               |
| `cluster` / `rack`                        | 35.44%               | 33.97%                   |
| `cluster` / `layers`                      | 26.10%               | **34.68%**               |
| `datacenter` / `rack`                     | 40.11%               | 20.46%                   |

The floor is **4.56%** — twice `lock`/`unlock` (2.28%), the weakest pair the set already accepts.
Every pair clears it before and after.

**Two new measurements, because the old one could not see either complaint:**

- **Clear lanes.** Along the axis a glyph lays its units out, the number of maximal runs of rows
  or columns carrying no ink at all, strictly inside the glyph's own extent. A mark whose content
  is "three machines" has to show three, and it only does if background runs between them. This
  is what fails on 7.20.0's `cluster`, and nothing else did.
- **Outline.** Ink flood-filled from the frame; whatever the fill cannot reach is the mark's
  silhouette, compared on its own. It guards against a new glyph borrowing another's outline.

### What the report did not have

- **The `datacenter` complaint is not measurable, and is not presented as if it were.** Neither
  the stroke metric (31.54%) nor the outline metric (14.56%) flagged it on 7.20.0, and both would
  have passed it forever: a rounded box with lines sits far from another rounded box with lines.
  What was wrong is what the mark depicted, which is a judgement — the user's. The one hard fact
  on that side is structural and comes from the source rather than a gate: `datacenter` and
  `node` were the same construction, a rect plus horizontal rules plus one dot, differing only in
  how many rules.
- **`datacenter`/`rack` fell from 40.11% to 20.46%**, and `cluster`/`rack` from 35.44% to 33.97%.
  Both are far above the 4.56% floor, and both are expected: a building and a cabinet are now
  both tall, and a stack of chassis and a cabinet of shelves are both stacks. Stated rather than
  left to be found.
- **No page baseline moved enough to notice.** A 14px glyph inside a 1280×900 page shot is far
  under the gate's threshold — the pages that carry these glyphs moved 0.10–0.15%, inside the
  same band as run-to-run antialiasing noise elsewhere (`line`, `fabric`, 0.03–0.08% with no
  icon on them). Refreshing them would bake in noise, so they were left alone and a crop of the
  ladder itself was added instead: `glyph-inventory`, the six rungs at 14px and 24px.
