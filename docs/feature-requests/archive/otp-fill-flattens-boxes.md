# BUG-80-03 — `strct-input-otp fill` flattens the boxes into wide tiles

**Filed by:** HyperStruct, 2026-11-12, against **7.14.0**. Seen on the sign-in page's
two-factor step (`<strct-input-otp fill [length]="6" [groupSize]="3">` in `strct-login`'s form).
The operator's reading, as a creative director: the six boxes "are misshapen, as if they had been
squashed". HyperStruct has dropped `fill` until this is fixed.

## Measured

Computed from the shipped stylesheet of 7.14.0, not from a browser:

| rule                               | value                                                            |
| ---------------------------------- | ---------------------------------------------------------------- |
| `.strct-otp__box`                  | `width: 40px; height: 46px; border-radius: var(--radius-lg)`     |
| `.strct-otp--fill .strct-otp__box` | `flex: 1; min-width: 0` — the width grows, the height does not   |
| `.strct-otp` `gap`                 | `8px`; `.strct-otp__sep` adds its glyph and `margin-inline: 3px` |

Six boxes and one separator in a row of width `W` get `(W − 48 − ~18) / 6` px each, at 46px high:

| form width | box     | width : height                   |
| ---------- | ------- | -------------------------------- |
| 300px      | 39 × 46 | 0.85 — the designed portrait box |
| 360px      | 49 × 46 | 1.07 — square                    |
| 420px      | 59 × 46 | 1.28 — a landscape tile          |
| 480px      | 69 × 46 | 1.50                             |

A digit cell reads as a cell because it is upright; past square it reads as a short text field,
and the large radius on a wide, low box makes it look pressed flat. The wider the sign-in card, the
worse it gets — which is the case `fill` exists for.

## Ask

`fill` spreads the **boxes**, not their width:

- the boxes keep their designed size (or grow with their height, keeping the portrait ratio), and
  the row's spare width goes into the gaps — `justify-content: space-between` within each group and
  between the groups — so the first and the last box line up with a full-width button's edges; or
- if the boxes must grow, their height grows with them (an `aspect-ratio` on the box), capped at a
  size the font still fills.

A `size` (`md` | `lg`) would let a sign-in page draw larger cells without stretching them.

## Acceptance

- With `fill` in a 300px, 420px and 560px row: every box's width ÷ height stays between 0.8 and 1.0,
  and the first box's left edge and the last box's right edge sit at the row's edges (±1px).
- Without `fill`, nothing changes.

## Shipped in 7.15.0 (2026-11-14)

`fill` grows a cell with the row to a cap of **48px** (**58px** at
`size="lg"`), keeping its ratio the whole way, and puts the width past the cap
into the gaps. Every number below is read back from what Chrome laid out, by
`scripts/otp-row.mjs` (13 checks, the three widths the bug was filed at, and
the shape claims again at 1.25× and 2×).

### Against the acceptance

| asked                                                                 | measured                                                                         |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `fill` at 300px, 420px, 560px: every cell's width ÷ height in 0.8–1.0 | **0.87** at all three — 40×46, 48×55.19, 48×55.19 (was 0.85, **1.28**, **1.72**) |
| the first cell's left and the last cell's right at the row's edges    | **0.00px** and **0.00px**, at all three widths and with `align="center"` on top  |
| without `fill`, nothing changes                                       | **40×46** at 18px, a **306.05px** row starting **0.00px** into its 420px field   |

Also measured: the cap holds (a 300px row keeps the designed **40px**, 420px
and 560px both stop at **48px**); the gaps are even to **0.0px** of spread and
grow **8.0 → 20.0 → 43.3px** with the row; the ratio stays **0.87** and the
edges stay flush at **1.25×** and **2×**; a digit still covers **23%** of the
widest cell (floor 20%); and `size="lg"` is **48×56** at 22px, **0.86**.

### What the report did not have

- **The two options in the ask are not alternatives — the fix is both.**
  Spreading the gaps alone (option 1) leaves six 40px cells **51px** apart in a
  560px row: a code that reads as six separate fields rather than one. Growing
  the cells alone (option 2) has no stopping point — at 560px a cell would be
  **79px** wide holding a 10.8px digit, **14%** of its own width, which is the
  same complaint from the other side. So the cells grow to a cap and the gaps
  take the rest, and the gate measures both halves.
- **The separator is one of the row's children, and it was spacing itself.**
  Its `margin-inline: 3px` made the two gaps beside it 6px wider than the other
  four, so a "spread evenly" row would not have been even. Under `fill` the
  margin is 0 and the gap property does the placing; the measured spread across
  all six gaps is **0.0px**.
- **The filed arithmetic counted five gaps; there are six.** `(W − 48 − ~18)/6`
  treats the separator as free-standing, but it is a flex child, so a grouped
  six-box row has six gaps: 6×40 + 6×8 + 12.05 = **300.05px**. That is why the
  300px row in the acceptance neither grows nor shrinks — it is the width the
  row already was, which the report's "39×46" nearly caught.
- **One existing drawing moved.** The showcase's own 320px `fill` demo now has
  **43.3×49.8** cells instead of 42.3×46: at that width the cells are still
  under the cap, so they grow. That is the change the bug asked for, and it is
  in the new `otp-row` visual baseline.
