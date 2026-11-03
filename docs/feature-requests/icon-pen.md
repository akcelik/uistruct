# FR-68-01: one pen for the glyph

**Filed by:** internal review of the data components, 2026-11-03, on strct 7.1.1
**Reach:** every `strct-icon` in the library — 50 call sites across 34 components
**Shape:** this is FR-63 / FR-64 one property over. Those made a control's
height, and then its icon's size, follow a token instead of a number each call
site picked. The pen the glyph is drawn with was left behind.

## What a reader sees

The same icon is a different drawing depending on where it is. A 32px icon
looks drawn with a marker; the 12px one beside it looks drawn with a needle;
and three 16px icons on one screen are drawn at three different weights.

## Measured

`stroke-width` in SVG is in **user units**, and the glyph's viewBox is
`0 0 16 16`. So a stroke of 1.4 paints `1.4 × size / 16` device pixels — the
pen grows with the icon. On top of that, 50 call sites set their own number.

Read from the rendered page, 380 icons across twelve routes:

| rendered size | stroke numbers in use | painted                    |
| ------------- | --------------------- | -------------------------- |
| 11px          | 1.6, 2.0              | 1.10px, 1.38px             |
| 13px          | 1.7, 1.4              | 1.38px, 1.14px             |
| 14px          | 1.4, 1.6              | 1.23px, 1.40px             |
| **16px**      | **1.3, 1.4, 1.5**     | **1.30px, 1.40px, 1.50px** |
| 22px          | 1.4                   | 1.93px                     |
| 26px          | 1.4                   | 2.28px                     |

`scripts/control-height.mjs` reads the same thing on one page and finds six
painted widths in a single view: **1.05, 1.22, 1.40, 1.49, 1.58 and 1.92px**.

Two things follow:

- **At one size, three pens.** 16px is the library's default and its most
  common icon; it is drawn at 1.30, 1.40 and 1.50px on the same screens.
- **Across sizes, a 2.1× range**, and it runs the wrong way: everyone writes
  ~1.4 regardless, so the bigger the icon the heavier its line.

The component's own docstring said _"Keep strokes at 1.3–1.5 for crispness."_
**24 of the 50 call sites were outside that range** — the file documented a
rule the library broke.

## Asked

The pen is one number, in one place, and it is a painted pixel rather than a
user unit. `strokeWidth` stays as an input for a glyph that genuinely needs a
different pen; it stops being the thing every call site has to set.

## Acceptance

- `scripts/control-height.mjs` asserts every 16-unit glyph on the page paints
  the same width, in all three palettes. It fails on 7.1.1 with the six widths
  above.
- `scripts/token-scale.mjs` asserts no library component sets
  `[strokeWidth]` — the rendered check reads one route, so the source check
  covers the rest.
- A clipped `icon-pen` baseline on the sizes row. Nothing else in the visual
  suite can see this change: thin and everywhere, it moves 0.026% of a page's
  pixels against a 0.5% threshold. Clipped to the row it moves **0.66%**.

## What this does not cover

The 12-unit **mode badge** inside the icon — the out-of-service stripes drawn
at 7–9px on a tree tile. It has its own viewBox and its weight was tuned by eye
for FR-61-01, so the pen rule is not applied to it and the gate skips it on
purpose.
