# HyperStruct — adopting 6.3.0

> **SHIPPED in 6.4.0.** All three, measured in Chrome on the showcase:
>
> |                                                      | before                               | after                                                 |
> | ---------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
> | BUG-65-01 a toolbar with `toolbarSize="sm"`          | filter **32px** beside 26px buttons  | **26 / 26 / 26**                                      |
> | BUG-65-02 a handle with nothing measured             | `aria-valuenow` absent               | the column's stated width, else **40**                |
> | BUG-65-03 four columns stating 1000px in a 518px box | **1000px, 482px of sideways scroll** | **518px in 518px**, in the 30/30/20/20 they asked for |
>
> - **BUG-65-01** — a `toolbarSize` input. The quick filter and whatever is
>   projected into `[strctDatagridActionBar]` share that row in the DOM, so
>   sizing the row sizes both.
> - **BUG-65-02** — `separatorValue()` returns a number now: the width the
>   column states, or the resize floor of 40 that a drag could not go below
>   anyway. A spec covers it; it failed on 6.3.0.
> - **BUG-65-03** — **a stated width is the column's share of the row again.**
>   Before anything is dragged the grid emits percentages in the stated
>   proportions, so it fits its container at any size and re-lays itself out
>   when that size changes — a percentage is not a frozen width. Once a
>   column has been dragged, that column is exact and the others hold what
>   they were drawing, which is what BUG-62-01 asked for; only then may the
>   table be wider than its container, and then it scrolls.
>
>   A grid that states no width and has not been dragged is content-laid-out,
>   as it was before 6.1.0: there is nothing yet to be exact about, and that
>   is the layout that fits any container.
>
>   Measured on the way: a fixed table honours `30%` and `calc(100% * 0.3)`
>   (180px of 600), and silently drops `min(300px, 30%)` and
>   `calc((100% - 91px) * 0.3)`, splitting the row equally instead. That is
>   why the affordance columns' pixels are taken off in the arithmetic rather
>   than in the CSS.
>
> The app's three workarounds can go: the `--control-h` override on
> `strct-datagrid`, the `offsetWidth` stub in its accessibility gate, and the
> `240px` on Recent Tasks' Details column.
>
> `scripts/grid-layout.mjs` grew from 8 checks to 11: the two new ones measure
> that over-stated widths still fit and keep their proportions, and that a
> sized toolbar row is one height.

Filed 2026-11-01 while adopting 6.3.0. FR-63 and FR-64 did what they promised: over 142 screens of the app,
mismatched rows of side-by-side controls went from 25 to 1, every control measuring 26 or 32 px.
Two small things remain.

## BUG-65-01 — a grid's quick filter does not follow its action bar

`strct-datagrid` draws its `strct-searchbox` in `.strct-dg__toolbar` with no size, so it stands at md (32 px) in the
same row as an action bar of `size="sm"` buttons and fields (26 px). HyperStruct has 218 action bars.

**Expected.** One way to give the toolbar a size, which the quick filter and the projected action bar both take: a
`toolbarSize` input on the grid, or the grid honouring `[strctControlSize]` on `[strctDatagridActionBar]`.

**App workaround, to delete when this ships.** `web/hyperstruct-ui/src/styles.scss` sets `--control-h` and
`--icon-size` to the sm tokens on `strct-datagrid`, which also takes the rows and the footer with it.

## BUG-65-02 — a resize handle has no value until the first measurement

Since 6.1.0 `separatorValue()` is `null` until the header is swept, so `role="separator"` with `tabindex` has no
`aria-valuenow`. axe reports `aria-required-attr`, critical. In Chrome this does not happen: 975 handles measured over
142 screens, none without a value. It shows wherever nothing has a width: a consumer's jsdom accessibility gate fails
on every resizable grid (HyperStruct: 22 findings on 3 screens), and a grid in a hidden tab has the same state.

**Expected.** Until there is a value, the handle does not claim to be a focusable separator, or it falls back to the
column's declared or minimum width, 40.

**App workaround, to delete when this ships.** `web/hyperstruct-ui/src/testing/a11y.spec.ts` stubs `offsetWidth` so
the grid measures.

## BUG-65-03 — **blocks this adoption**: widths written as hints became exact, and the rest froze

Since 6.1.0 a grid that is `resizable` or states any `width` draws `table-layout: fixed` from those widths, and sweeps the
others once at their first measurement. A stated width used to be a hint the table could scale. The app's widths were
written that way, so they do not add up to its containers, and nothing brings them back.

**Measured in Chrome at 1600×1000, `scrollWidth` against `clientWidth` of `.strct-dg__scroll`:**

| Grid                                | Table in its container | What it looks like                                                                                           |
| ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Host Update Manager ▸ Compliance    | **1407 in 1189**       | sideways scrollbar, the last column cut, host names cut to `o304-r…` while `Target CU` has 184 px of nothing |
| Recent Tasks, Details with no width | 1370 in 1285           | 85 px sideways, and in 1540 Details freezes at 460 beside a 70 px empty filler                               |
| Audit                               | 1239 in 1219           | sideways scrollbar                                                                                           |
| Alarms, High Availability           | 1239 in 1229           | sideways scrollbar; 10 px is probably a vertical scrollbar appearing after the sweep (not proven)            |
| New role dialog                     | 824 in 814             | sideways scrollbar                                                                                           |

Fourteen column sets in the app state 1000 px or more, the largest 2040 (`vm-network-adapters`), and 28 grids are
`resizable`. Fixing them one by one means choosing widths for a container nobody knows: a tree dragged wider or a smaller
screen breaks them again.

**Expected.**

- **Until someone drags, the grid fits its container.** A stated width is the column's share: with all of them stated the
  browser scales them, which 6.1.0 removed because it made a dragged width inexact. Only a _dragged_ column needs to be exact.
- **A column with no width stays without one**, so it takes the remainder at any container width, and is never frozen.
- **The first sweep is not final:** a container that changes size re-lays out every column nobody has dragged.
- **A grid wider than its container only when the operator made it so**, by dragging. Then it scrolls.

**App workaround to delete when this ships.** `web/hyperstruct-ui/src/app/shell/recent-tasks.ts` states `240px` for Details.
