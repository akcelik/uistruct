# BUG-66-01: a utility column measured before its rows arrive stays clipped

> **FIXED in 6.4.1**, measured in Chrome on a showcase grid built to the shape
> in this report — `compact singleLine`, single selection, stated widths, rows
> set after the first draw:
>
> |               | 6.4.0         | 6.4.1          |
> | ------------- | ------------- | -------------- |
> | `@sel` column | **22px**      | **40px**       |
> | radio visible | **6 of 15px** | **15 of 15px** |
>
> Both halves of the report are taken:
>
> - **A floor.** `UTIL_W` gained `actions: 44` beside the `sel: 40` and
>   `detail`/`expand: 36` it already held, and a utility column is never
>   narrower than it — whatever the sweep measured. `utilTotal` uses the same
>   numbers, so the data columns' shares still add up to the row.
> - **A sighting taken with no rows is not kept.** `sweepHeaderWidths` records
>   `naturalWidths` only while the grid has rows, so the width that is frozen
>   is the one the column really needs. That also answers the last note in the
>   report: a data column stating no width no longer freezes the width of its
>   header alone.
> - **`text-overflow: clip`** on the selection, expand and action cells under
>   `singleLine`: the affordance fits the cell but not its content box, and the
>   ellipsis drew a speck of dots beside it.
>
> Two specs cover the plumbing and both fail on 6.4.0 with the reported
> `22px`. The browser half is two more checks in `scripts/grid-layout.mjs`
> (13 now, from 11), reading the radio against its cell on a demo whose rows
> arrive after the first draw.
>
> The workaround in `web/hyperstruct-ui/src/styles.scss` can go, including its
> `text-overflow: clip`.

**Filed by:** HyperStruct, 2026-11-02, on strct 6.4.0
**Reach:** 49 HyperStruct source files have both a single-selection grid and a stated width (a grep, not a count of broken grids)
**Introduced:** the inline `utilWidth` in 6.1.0, the first-sighting `naturalWidths` in 6.4.0

## What the operator sees

In a single-selection grid the radio in the first column is cut in half.

## Measured

Chrome, real HyperStruct screen and API, 1600 px wide, `compact singleLine`, one row, columns stating
widths. The rows come from a request, so the first draw has none.

|                     | grid with no stated width | grid stating a width  |
| ------------------- | ------------------------- | --------------------- |
| layout              | auto                      | fixed                 |
| `@sel` header style | none                      | `width: 22px`         |
| `@sel` cell         | 45 px                     | **22 px**             |
| radio               | starts at 16, 15 wide     | starts at 16, 15 wide |
| radio visible       | 15 px                     | **6 px**              |

## Cause

1. `sweepHeaderWidths()` runs after the first render and stores each column's width in `naturalWidths`
   the first time it sees it, and never again ("from the first sighting", `utilTotal`).
2. In single mode the `@sel` header holds only an `.strct-sr-only` span. With no rows yet, nothing in
   that column has a width, so it measures its padding: 11 + 11 = 22 (13 + 13 = 26 when not compact).
3. `utilWidth('@sel')` writes that as the header's inline width. Under `table-layout: fixed` with
   `box-sizing: border-box`, it is the whole column.
4. The radio has the browser's default margin (5 px at the start), so it begins at 16 px. `singleLine`
   cells have `overflow: hidden`, which cuts it at 22 px. Without `singleLine` it spills under the
   next cell's opaque background instead.

Multiple selection escapes because its header holds a checkbox, which measures 47 px with no rows.

`@detail` freezes the same way (measured: inline `width: 22px`, its button starts at 11 and is 19 wide).
By the same reasoning, and not measured: `@expand` (sr-only header) and `@actions` (empty header), which
would lose its kebab.

Also by the same reasoning: a data column that states no width freezes the natural width of its header
alone, so its share ignores its content.

## Reproduce

```html
<strct-datagrid
  compact
  singleLine
  [selection]="{ mode: 'single' }"
  [columns]="columns"
  [rows]="rows()"
/>
```

with `columns` stating a `width` and `rows` set to a non-empty array after the first render.

## What a fix has to hold

- Utility columns have a floor whatever was measured, or are not measured at all. `UTIL_W` already
  holds the widths (`sel: 40`, `detail` and `expand: 36`) and `.strct-dg-host--sticky` already uses them;
  `@actions` has none yet.
- `utilTotal` uses the same numbers, so the shares of the data columns still add up.
- The first measurement is not final if it was taken with no rows.
- A spec cannot catch this under jsdom (no layout). It needs the Chrome measurement, in the order above.

## HyperStruct's workaround

`web/hyperstruct-ui/src/styles.scss`, marked with this id. It writes 40 px (single selection) and 36 px
(`@detail`, `@expand`) over the inline widths with `!important`. HyperStruct uses no `rowActions`, so
`@actions` is left alone. It also sets `text-overflow: clip` on those cells: a 15 px radio with its
browser margin, or the 19 px detail button, fits the cell but not its content box, so `singleLine` drew
a speck of ellipsis beside it. A fix at these widths has to handle that too. Measured on the grid
above: radio 15 of 15 px visible in a 40 px cell, no sideways scroll. To be removed when this ships.
