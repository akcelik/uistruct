# FR-80-06 — `strct-input-otp` has no alignment: the boxes sit at the start of their field

**Filed by:** HyperStruct, 2026-11-14, against **7.14.0**. The operator, reading the sign-in page's
two-factor step and the "Confirm it's you" dialog: the code boxes "must be in the middle of the
container they are in". HyperStruct centres every row with one global rule until this ships, marked
in `src/styles.scss` and guarded by `otp-centred.spec.ts`.

## What a reader sees today

`strct-input-otp` sets no display on its host, which is an inline element. Its row, `.strct-otp`, is
`display: inline-flex`. Inside a `strct-field`, whose `.strct-field__control` is a column flex box,
the host stretches to the field's width, but the row inside it starts at the left edge:

| form width | row (6 boxes, groupSize 3) | space left of the row | space right of the row |
| ---------- | -------------------------- | --------------------- | ---------------------- |
| 300px      | ~306px                     | 0                     | 0                      |
| 420px      | ~306px                     | 0                     | ~114px                 |
| 560px      | ~306px                     | 0                     | ~254px                 |

The row is 6 × 40px boxes, plus five 8px gaps, plus the separator (~12px glyph + 6px margin), ≈ 306px.

Everything else on a sign-in card is either full-width or centred: the title, the block-wide
primary button, and the "Lost your phone? Use a recovery code" link. The boxes are the one element
hung on the left, so they read as misplaced. `fill` is not the answer, because it flattens the
boxes (BUG-80-03).

## Ask

- **`align: 'start' | 'center' | 'end'`** on `strct-input-otp` (default `'start'`, so nothing that
  exists moves). The host becomes a block-level flex row, and `align` sets its
  `justify-content`.
- Or, as the library's own choice: centre by default, because a code entry is a single control that
  people expect in the middle. Note in the changelog that rows move.

## Acceptance

- `<strct-input-otp align="center">` in a 420px `strct-field`: the gap from the field's left edge to
  the first box equals the gap from the last box to the field's right edge (±1px).
- With `fill`, `align` has no effect: the row already spans the field.
- Without `align`, nothing changes.

## Shipped in 7.15.0 (2026-11-14)

`strct-input-otp [align]` — `start` (the default) | `center` | `end`. Measured
by `scripts/otp-row.mjs` in the 420px field the FR was filed against.

### Against the acceptance

| asked                                                        | measured                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `align="center"` in a 420px field: the two gaps equal (±1px) | **56.97px** to its left and **56.98px** to its right (was 0px / 113.95px) |
| with `fill`, `align` has no effect                           | **0.00px / 0.00px** — the row spans its 420px field either way            |
| without `align`, nothing changes                             | the row starts **0.00px** into the field, cells **40×46** at 18px         |

Also measured: `align="end"` is **113.95px / 0.00px**; the natural row is
**306.05px** wide, as the report had it (≈306px).

### What the report did not have

- **The library did not take the second option, and the reason is the host.**
  Centring by default means making an inline host a block-level flex row for
  every consumer: a code row inside a line of text, or beside a label in a
  grid, would change the flow it sits in, and every row that exists would
  move. `align` is opt-in and `start` leaves the host inline, so nothing that
  exists moves; the docs say to centre the row on a centred card, and the
  showcase shows all four placements side by side.
- **`align` lives on the host, not on the row.** The row is what `fill`
  stretches, so putting `justify-content` there would have made the two inputs
  fight over one property. On the host they compose: `fill` + `align` is a
  spanning row, which is why the acceptance's "no effect" case is true by
  construction rather than by a special case in the code.
