# HyperStruct on 5.7.0 → BUG-57-01, BUG-57-02

**From:** HyperStruct · **Version:** 5.7.0 · **Date:** 2026-10-15 · **HyperStruct decision:** O325

HyperStruct adopted 5.7.0 and retired the workarounds for BUG-50-01 … 03, 05, BUG-53-01 and BUG-54-01: its
`styles.scss` separate-mode rule and backdrop hide, `app-nav-backdrop`, the single-mode pick filters, the dialogs
hoisted out of the header, the a11y-baseline `empty-table-header` entries, its local sr-only rule. They hold in
HyperStruct's screens. Two things stay, not as workarounds:

- The VM console keeps its own shade rather than `closeOnOutside` (BUG-50-04 is fixed). `closeOnOutside` draws no
  shade, and the click that minimises the window also reaches the page under it (measured): a different behaviour, not
  a bug.
- Two `multiple`-mode pickers hand the grid only the picks their rows hold. They keep picks the grid cannot list, and
  the grid counts every id it is given ("1 selected" with nothing ticked, measured). That is consistent with lazy
  paging, so it is not filed.

Two of the datagrid changes do not finish the job. Both are measured.

"Measured" means headless Chrome 155 (Linux, Skia, DPR 1), arctic palette: `strct-datagrid`s rendered by the installed
package (5.6.1 and 5.7.0) in HyperStruct's test environment, their DOM and every component stylesheet saved as static
HTML with the theme compiled from `styles/theme.scss`; pixels read from element screenshots. Δ is luminance (0–255)
against the resting cell.

Suggested order: **BUG-57-01** (selection is invisible in every dark theme), then BUG-57-02.

> **BUG-57-01 and BUG-57-02 FIXED in 5.12.0 (2026-10-15)** — every item in this document.
>
> All three row tints (hover, selected, the pane's active row) are composited over the cell's own
> surface now, as the sticky-column rules already were. Measured in arctic against a resting cell of
> (35, 40, 47): a selected cell reads **(46, 55, 66), Δ +14.5** in dark and **(237, 240, 244),
> Δ −15.3** in light — both within a pixel of this document's designed figures — and hovering a dark
> row lightens it (Δ +6.8) where it used to darken it (Δ −7.7). Hovering a selected row stacks both
> tints (Δ +20.4), so it never reads as less selected than leaving it alone.
>
> `singleLine` has its own rule with the separate borders alone, so it keeps the table's
> `overflow: hidden`; the sticky, virtual and bounded hosts keep theirs. The corner is rounded again
> and the row line stays **+11.3 dark / −13.0 light**.

---

### BUG-57-01 — the selected fill (BUG-54-02) is composited over the table, so a selected row is invisible in dark

**Where.** `datagrid/datagrid.ts` styles: `.strct-dg tbody .strct-dg__row--selected td { background: var(--acc-m) }`
(5.7.0). The cell's own opaque surface (`--bg-1` light, `--bg-3` dark) is _replaced_ by the translucent `--acc-m`, so
what shows through is the table's `--bg-2` — the same mechanism as BUG-54-01's row lines.

**Measured** (a `selectionMode="single"` grid and a `selectable` one, same result):

| arctic | resting cell    | selected, 5.7.0 | Δ luminance | `--acc-m` over the cell (designed) | Δ     |
| ------ | --------------- | --------------- | ----------- | ---------------------------------- | ----- |
| dark   | (35, 40, 47)    | (34, 40, 52)    | **+0.9**    | (46, 54, 65)                       | +13.8 |
| light  | (255, 255, 255) | (227, 232, 237) | −23.7       | (237, 240, 244)                    | −15.4 |

In dark the selected row differs from its neighbours by a slight blue cast only: it reads as unselected, and the
checkbox carries the state alone — what BUG-54-02 set out to end. Computed from the tokens, ember dark gives +1.3 and
sage dark +0.6. In light the fill shows, about 1.5× heavier than `--acc-m` over white. 5.6.1 drew no fill at all, so
this is not a regression; the fix is half-way.

The sticky variant already composites the right way:
`.strct-dg-host--sticky tbody .strct-dg__row--selected .strct-dg__cell--sticky { background: linear-gradient(var(--acc-m), var(--acc-m)) var(--bg-1) }`
(and `var(--bg-3)` in dark). `.strct-dg__row--active td` and the hover rule (`--acc-s`) likely share the plain form —
hover was measured in O317 at dark (27, 32, 42) against a resting (35, 40, 47), i.e. hovering _darkens_ a dark row.

**Fix (proposed).** Paint the fill over the cell's own surface, as the sticky rule does:
`background: linear-gradient(var(--acc-m), var(--acc-m)) var(--bg-1)` and its `[data-theme='dark']` twin with
`var(--bg-3)`; the same for the active and hover fills.

**Acceptance.** In arctic dark a selected cell reads about (46, 54, 65) (Δ ≈ +14), in light about (237, 240, 244);
hover lightens a dark row instead of darkening it.

**HyperStruct workaround:** none. Its grids look like the showcase here, which is its rule (O317).

### BUG-57-02 — `singleLine` now squares the corners of a grid without a toolbar or a footer

**Where.** `datagrid/datagrid.ts` styles (5.7.0):

```css
.strct-dg-host--singleline .strct-dg,
.strct-dg-host--sticky .strct-dg,
.strct-dg-host--virtual .strct-dg,
.strct-dg-host--bounded .strct-dg {
  border-collapse: separate;
  border-spacing: 0;
  overflow: visible;
  border-radius: 0;
}
```

BUG-54-01's fix joined `singleLine` to this rule, so a `singleLine` table also lost its `overflow: hidden`. Its 9 px
corners stay where the host has no toolbar or no footer (`.strct-dg-host:not(:has(.strct-dg__toolbar)) .strct-dg`,
`:not(:has(.strct-dg__foot))`, which out-specify `border-radius: 0`), but nothing clips the cells to them any more.

**What happens.** The header cells (top) and the last row's cells (bottom) paint square over the host's rounded 1 px
border. Measured on a `singleLine [pageSize]="0"` grid with no toolbar, 5.6.1 → 5.7.0: the six
pixel rows at each top corner change (8, 4, 4, 2, 2, 2 px per corner row), likewise at the bottom; max channel
difference 23 (dark) / 32 (light). The rounded border is cut off at all four corners; a grid with a toolbar and a
footer is unchanged. In HyperStruct this is every `singleLine` picker or property grid without a quick filter, an
action bar or a pager.

**Fix (proposed).** Keep the clip for a host that only is `singleLine`, e.g.
`.strct-dg-host--singleline:not(.strct-dg-host--sticky):not(.strct-dg-host--virtual):not(.strct-dg-host--bounded) .strct-dg { overflow: hidden }`
— measured: lines stay +11.2 / −13.0 and the corners are pixel-identical to 5.6.1. (Sticky, virtual and bounded hosts
need the visible overflow for their scrolling and sticky cells; whether they show the same corners was not measured.)
Alternatively round the four corner cells themselves.

**Acceptance.** A `singleLine` grid without a toolbar / footer keeps its rounded corners, pixel-identical to a plain
grid's, and its row lines stay the plain grid's.

**HyperStruct workaround:** exactly the rule above in `styles.scss`, marked BUG-57-02, with a guard spec that fails when
the library's `singleLine` table no longer overflows.
