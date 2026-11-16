# The detail pane's » button, both ways

**Asked for:** 2026-11-16, directly, against **7.19.0**. Not a filed FR — a request in the
working session, recorded here so the measurements live with the change.

> datagrid detail pane chevronDoubleRight ikonuna tıklayınca detail pane açılmalı,
> chevronDoubleRight ikonu chevronDoubleLeft'e dönüşmeli, chevronDoubleLeft'e tıklayınca
> da detail pane kapanmalı ve chevronDoubleLeft chevronDoubleRight ikonuna dönüşmeli.

## The case

The grid has had a detail pane since 5.x. The `»` button in each row's first utility cell
collapses the table to one column and opens that row's pane beside it, and clicking it again
closed the pane — the demo said so in words. The button did not.

It drew `chevronDoubleRight` whether the pane was shut or open, and told assistive technology
`openDetail` ("Open detail") either way, while `aria-expanded` quietly flipped to `true`. So the
one control that both opens and closes the pane looked like it only opened it, and its arrow
pointed at a pane that was already there. `closeDetail` had been in the label set since the pane
shipped and only the `×` in the pane head ever reached it.

In a console (`interactionMode="grid"`) it was worse than cosmetic. A click on the row opens that
row's pane, and the button sits inside the row, so the button's click closed the pane and the row
re-opened it in the same event: **the pane could be opened from the button and never closed from
it.**

## Ask

1. A click on `»` opens the pane.
2. The `»` becomes `«`.
3. A click on `«` closes the pane.
4. The `«` becomes `»`.

## Shipped in 7.20.0 (2026-11-16)

One control, both ways. The arrow points where the click will send the pane; the name and
`aria-expanded` move with it; the click stops at the button; and `[dir='rtl']` mirrors both
arrows, because there the pane opens on the other side of the list.

Measured in Chrome by `scripts/pane-toggle.mjs` (13 checks, real mouse and key events) and held
by six specs. **5 of the 13 checks and 4 of the 6 specs fail on 7.19.0** with the same fixtures.

### Against the acceptance

| asked                          | measured                                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a click on `»` opens the pane  | one click → the pane at x=574 with the list ending at 574, 2 header cells left, 1 active row                                                                                           |
| the `»` becomes `«`            | the drawn path swaps to the library's own `chevronDoubleLeft`, and the glyph is **measured** pointing left: it converges to **2.56px** at its left end against **7.31px** at its right |
| a click on `«` closes the pane | the pane closes, 6 columns return, 0 active rows — and in a console too, where before the row underneath re-opened it in the same event                                                |
| the `«` becomes `»`            | `chevronDoubleRight` again, converging to **2.56px** at its right end, with focus still on the button                                                                                  |

### What the ask did not have, and this change does

- **The name follows the arrow.** Shut: `aria-label="Open detail"`, `aria-expanded="false"`.
  Open: `aria-label="Close detail"`, `aria-expanded="true"`. Both halves come from the grid's own
  label set, so a translated grid no longer says "Open detail" on the control that closes.
- **The click stops where it was aimed.** `openDetail(row, event?)` calls `stopPropagation()`.
  This is the console fix; `event` is optional because the method is public API.
- **Right to left.** The pane opens on the other side there (measured: the list starts at 1026
  and the pane ends at 1026), so both arrows are mirrored in CSS — shut points left, open points
  right — and each still points where the click will send the pane.
- **The other two ways in agree.** Enter on the row opens the pane and that row's button turns
  around with it; Escape closes it and the arrow follows. The row and the button cannot disagree,
  because both read the same `activeRowId`.
- **The arrow still reads.** 12 contrast readings over 3 palettes × 2 themes, weakest **4.45:1**
  (sage light, the open button against its own accent fill) against a 3:1 floor for a meaningful
  graphic.

### What the report did not have

- **The demo never showed the layout it describes.** The showcase column is **840px** and the
  pane's default `takeoverWidth` is **900**, so the pane was replacing the list rather than
  opening beside it — and in that mode the `»` button is not on screen at all, so the toggle this
  request is about could not be seen. Both fixtures now set `takeoverWidth: 560`. The takeover
  itself is unchanged, and still carries its own way back.
- **Two visual baselines, which did not exist.** `detailpane-shut` and `detailpane-open` crop the
  grid itself; the open one holds both states at once — the active row's `«` and every other
  row's `»`. 7.19.0 had no crop of this demo at all, so no baseline could have caught this.
- **The trailing caret on the active row is unchanged.** It points at the pane, and now points
  the opposite way to the button at the row's other end. They say different things: the caret is
  the tie between row and pane, the button is the control. It was left alone.
