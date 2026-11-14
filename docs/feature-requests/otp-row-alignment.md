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
