# HyperStruct — a resizable single-line grid (6.0.0)

> **SHIPPED in 6.1.0.** Both halves of BUG-62-01 are closed, measured in
> Chrome on the showcase's own grids:
>
> |                                                     | before                                                           | after                                  |
> | --------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------- |
> | dragging a 195px column 120px left                  | 85px, and every other column grew (type 113→142, status 182→227) | **75px**, every other column unchanged |
> | dragging it 300px further                           | 85px — nothing moved, the column had hit its content             | **40px**, the resize floor             |
> | a single-line row holding a `variant="link"` button | 58px against 39px for its neighbours                             | **39px**, cut with an ellipsis         |
>
> `table-layout: fixed` with `box-sizing: border-box` once a grid is
> `resizable` or a column states a width, the leftover width parked in a
> presentational filler cell at the end of each row, and a link button that
> takes its cell's `white-space` inside a single-line row.
> `scripts/grid-layout.mjs` keeps all of it measured in CI.
>
> The app's `.rt-cell` / `.rt-link` / `.rt-ellip` workaround can go.

Filed 2026-10-27 from HyperStruct's Recent Tasks pane (`resizable` + `singleLine` + `compact`, `[state]`
key for the widths). Measured in Chrome with strct 6.0.0.

## BUG-62-01 — `resizable` widens a column but never narrows it below its content; the grid overflows its container

**Measured.** The pane is 1185 px wide. The Target column holds a link button with a name in it. Before the
app's workaround:

- Dragging Target's handle 120 px to the left: the header stays **284 px → 284 px**.
- The table is **1499 px** in the 1185 px pane, so the pane scrolls sideways and Duration is cut at its edge.
- A column's `width: '220px'` is a hint, not a width: Target drew at 284 px because its content was 284 px.

**Why.** The table is laid out by content (`table-layout: auto`). Under `singleLine` a cell is `white-space:
nowrap; overflow: hidden; max-width: 360px`, so in an auto layout its text, up to 360 px, is the column's
minimum width. A stated or dragged width below that minimum is ignored. The handle can only widen. The
ellipsis appears only at the 360 px cap, never at the width the operator chose.

A second, smaller part: `variant="link"` buttons are `display: inline; white-space: normal`. Inside a
`singleLine` cell they still wrap to several lines, because the cell's `nowrap` reaches the text, not a
button that resets it. Recent Tasks' task and target names wrapped to four lines.

**Expected.**

- Once a grid is `resizable`, or once a column has a width (stated or dragged), that is the column's width.
  The content is cut with an ellipsis at that width, and the table fits its container. `table-layout: fixed`
  under `resizable`, or cell content that sets no minimum, would both do it.
- Under `singleLine`, a cell's link button stays on one line and ends with an ellipsis like the text beside it.

**App workaround, to delete when this ships.** `web/hyperstruct-ui/src/app/shell/recent-tasks.ts`:

- `.rt-cell { width: 0; min-width: 100% }` wraps the long cells, so their content sets no minimum.
- `.rt-link` makes the link `inline-flex; max-width: 100%; nowrap`, with `.rt-ellip` cutting its label.

After the workaround the same drag goes **172 → 88 px** and the table is **1185 px in 1185 px**.
