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
