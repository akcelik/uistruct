# BUG-69-01, FR-69-02, BUG-69-03: the grid's height, and ellipses where there is no text

**Filed by:** HyperStruct (its decision O448), 2026-11-04, on strct **7.4.0**
**Reach:** every `singleLine` grid with a selection, expand or action column (BUG-69-01); every grid whose
rows can outgrow the page (FR-69-02, 365 of HyperStruct's 399 grids); a `singleLine` grid's empty row
(BUG-69-03)
**App workarounds:** BUG-69-01 has one global rule in HyperStruct's `styles.scss`, and FR-69-02 has a
measuring directive (`FillHeight`). Both are marked to go when the release ships. BUG-69-03 has none.

---

## BUG-69-01 — "..." beside every row's checkbox

> **SHIPPED in v7.4.1.** The specificity reading in this report is exactly
> right, and the browser agreed: **9 of 9** utility cells on the datagrid page
> computed `text-overflow: ellipsis`, the selection cell's content box measured
> **18px**, and its inline content ran **17px** past that box. The exception now
> carries the rule's own `tr:not(.strct-dg__detailrow) >` shape, which makes it
> (0,4,3) against (0,3,3).
>
> The second half of the ask — giving the selection cell a content box its
> control fits — was **not** done. With `clip` in force there is nothing to mark,
> so the 18px box is no longer a defect, and widening the cell moves every
> single-line grid's first column. If a cell ever needs the room for another
> reason it should be asked for on its own terms, not as a side effect of this.

### What a reader sees

In a `singleLine` grid with `[selection]`, every **body** row draws two or three dots just right of
its checkbox. The header row's checkbox has none. The operator's words were "if a row has a checkbox
or an icon, '..' appears next to it, for some reason".

### Measured

The measurement was taken in Chrome on HyperStruct ▸ Updates (a host grid with multi-select) at 100%,
125% and 150%, and every scale gave the same numbers:

|                                     |                                                           |
| ----------------------------------- | --------------------------------------------------------- |
| `td.strct-dg__sel` width            | 40px, padding 11px + 11px, so the **content box is 18px** |
| the control inside it               | **25px**                                                  |
| inline content past the content box | **7px**                                                   |
| computed `text-overflow`            | **`ellipsis`**                                            |

A 7px overflow on a cell that has `text-overflow: ellipsis` makes Chrome draw the ellipsis.

### Cause: the exception loses on specificity

```css
/* (0,3,3) */
.strct-dg-host--singleline .strct-dg tbody tr:not(.strct-dg__detailrow) > td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}
/* (0,3,2) */
.strct-dg-host--singleline
  .strct-dg
  tbody
  td:is(.strct-dg__sel, .strct-dg__expandcell, .strct-dg__actioncell) {
  text-overflow: clip;
}
```

The `:not(.strct-dg__detailrow)` in the first rule adds one class to its specificity. The second rule
is the one 6.4.1 shipped for BUG-66-01 ("no ellipsis in the utility cells"), and it never applies.
HyperStruct removed its own BUG-66-01 rule when it adopted 7.1.0, trusting that line of the changelog,
and the dots came back. The cascade was not re-measured at the time: the same lesson as 7.4.0's "two
strings differ" check.

### Ask

- **Make the exception win.** Give it the same shape plus the `:is()`, for example
  `… tbody tr:not(.strct-dg__detailrow) > td:is(.strct-dg__sel, .strct-dg__expandcell, .strct-dg__actioncell)`,
  which is (0,4,3).
- **Consider giving the selection cell a content box its control fits.** Today the control relies on
  the padding to fit, which is why there is any overflow to mark in the first place.

### Acceptance

A rendered check over a `singleLine` grid with single selection, multi-selection, an expand column
and row actions: no `tbody td` has a computed `text-overflow: ellipsis` while its inline content runs
past its content box. Assert the **computed** value, not that a rule exists.

HyperStruct's rule, which goes when this ships:
`.strct-dg-host--singleline .strct-dg tbody tr:not(.strct-dg__detailrow) > td:is(.strct-dg__sel, .strct-dg__expandcell, .strct-dg__actioncell) { text-overflow: clip; }`

---

## FR-69-02 — a grid that takes the space left in its pane

> **OPEN.** This is a feature and goes in its own release; the two defects
> above shipped first as **v7.4.1** so HyperStruct can drop its `styles.scss`
> rule now. The `FillHeight` directive stays until it ships.

### What a consumer needs

A list page whose grid takes the height left under it in the page's scroll pane and scrolls inside
that. The header and the pager stay in view, and the page itself does not run down. The operator's
words: "the grid runs down the page; I don't want that. Give it a fixed height and let its content
scroll; fix the similar cases too."

Today the only tools are `[maxHeight]` and `[virtual].viewportHeight`, and **both are a pixel count
fixed by the caller.** A fixed number is right for one window height and wrong for every other. So
HyperStruct had **365 of its 399 grids unbounded**, plus 21 virtual and 13 with a fixed `maxHeight`.
Its events page measured its own number by hand.

### What HyperStruct does meanwhile (a directive, `FillHeight`)

The directive computes, for `[maxHeight]`:

- **The base:** the pane's height
- **minus** its bottom padding
- **minus** where the rows start (the top of `.strct-dg__scroll`, in the pane's content coordinates)
- **minus** the grid's footer (from the bottom of `.strct-dg__layout` to the host's bottom)
- **minus** what the page has after the grid (read from the page's own box: `scrollHeight` is never
  less than the pane, so a short page counted the empty space under it, measured at 201px of nothing)
- **with a floor:** never under 280px.

It recomputes on a `ResizeObserver` over the grid, its parent and the pane, and on window resize.

Measured on HyperStruct ▸ Migrate ▸ VMs (120 rows, 50 per page):

| Window height | Rows' cap | Page scroll |
| ------------- | --------- | ----------- |
| 1000px        | 453px     | none        |
| 760px         | 356px     | none        |

It reads two class names of the library's (`.strct-dg__scroll`, `.strct-dg__layout`) to find where
the rows start and where the footer begins. That is the part it should not have to know.

### Ask

- **`[maxHeight]="'fill'"`, or a `fill` input.** The grid bounds its scroll frame to the space left in
  its nearest scrolling ancestor (or one it is given), less its own toolbar and footer, recomputed as
  that ancestor or the window changes size. It takes a floor (`fillMin`, a pixel count) under which the
  page scrolls instead.
- **Bound the detail pane to the same height.** This was read from the CSS, not measured:
  `.strct-dg__layout` is `align-items: flex-start` and the pane is `align-self: stretch`, so an open pane
  taller than a bounded list would make the grid taller than its cap.
- **A provider-level default**, as `provideStrctWizardDefaults` does for the wizard, so an app can state
  the policy once instead of on 266 grids. HyperStruct's sweep put the directive on 266.

### Acceptance

- A `fill` grid in a 1000px and in a 760px window ends where its pane ends: the page does not scroll,
  and the rows do.
- A short grid draws exactly as it does today.
- Two `fill` grids stacked on one page each get at least the floor.
- An open detail pane does not stretch a bounded list.

---

## BUG-69-03 — the empty row's message is cut with an ellipsis

> **SHIPPED in v7.4.1**, as asked: `.strct-dg__emptyrow` joins the detail row in
> the rule's exclusion, so the message wraps. Measured after: computed
> `white-space` is `normal` on the empty row and `nowrap` on every other body
> cell.

### What a reader sees

At 125% and 150% (1280 and 1067 CSS px wide), a narrow grid's empty-state message is cut with "…".
The empty row is a `tbody td` (`td.strct-dg__emptyrow`, with an icon), so it falls under the same
`singleLine` nowrap + ellipsis rule as a data cell.

### Measured

Counted cells, at 150%:

- HyperStruct ▸ Cluster ▸ Network Health: 2
- VM ▸ CSVs: 1
- Updates ▸ Depot: 1

### Ask

Let the empty row wrap: exclude `.strct-dg__emptyrow` from the `singleLine` cell rule. A message is not
a value to be truncated.

---

## What let BUG-69-01 live for three minor versions

Three things lined up, and this report's own remark — "the cascade was not
re-measured at the time: the same lesson as 7.4.0's two-strings-differ check" —
names the first of them.

- **The gate for the related bug measures something else.** BUG-66-01's browser
  check reads how much of the radio its column shows. That is a width question;
  nothing anywhere asserted a computed `text-overflow`.
- **No spec covered the exception.** It could be written, shipped and silently
  overridden without a single failure.
- **The showcase never rendered the cells.** In single-line mode the datagrid
  page had a selection cell and nothing else — no expand cell, no action cell,
  no empty row. Even a correct check would have read nothing. `v7.4.1` adds
  `#datagrid-utility-cells` for exactly that reason, and the first of the four
  new checks asserts the page renders all four kinds, so a green result cannot
  mean "found nothing to look at".
