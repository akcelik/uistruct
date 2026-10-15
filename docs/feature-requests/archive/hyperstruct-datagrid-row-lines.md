# `singleLine` datagrids lose their row lines (dark) or draw them too heavy (light) → BUG-54-01, BUG-54-02

**From:** HyperStruct · **Version:** 5.6.1 · **Date:** 2026-10-14 · **HyperStruct decision:** O317

HyperStruct's operator sent a photo of one monitor, both pages in arctic dark: the showcase's datagrid has clear lines
between rows, HyperStruct's VM ▸ Permissions grid has none — "almost most" of its grids. Same library, same theme, same
computed `border-bottom` on every body cell (`1px solid rgba(255,255,255,.055)`), same `--b1`. The difference is the
`singleLine` input: 256 of HyperStruct's 308 datagrids use it, the showcase's main example does not. The showcase's own
**"Single-line rows"** demo (`#datagrid` page, the checkbox starts ticked) shows the same defect.

"Measured" means headless Chrome 155 (Linux, Skia) against the published showcase build (`dist/showcase/browser`,
5.6.1) and HyperStruct's production build, with the pixels read from device-scale screenshots. Δ is the luminance
(0–255) of the pixel on the row line minus the cell colour above it.

Suggested order: **BUG-54-01** (half of every consumer's grids are affected the moment they use `singleLine`), then
BUG-54-02.

> **BUG-54-01 and BUG-54-02 FIXED in 5.7.0 (2026-10-15).**
>
> - **01** `singleLine` grids draw in separate mode, joining the sticky / virtual / bounded hosts —
>   exactly the rule this document proposed. Measured in headless Chrome against the plain grid's
>   designed line: **+11.2 dark, −13.0 light**, where `singleLine` had been **−2.6** (invisible) and
>   **−22.3** (1.7× heavy). HyperStruct's `styles.scss` workaround and its guard spec can go.
> - **02** the selected and active fills are raised above the themed body-cell rules. Measured: a
>   selected cell reads `--acc-m` in both themes, against the resting colour before.

---

### BUG-54-01 — `singleLine` + `border-collapse: collapse`: the row line is composited over the table, not the cell

**Where.** `datagrid/datagrid.ts` styles (read; measured):

```css
.strct-dg {
  border-collapse: collapse;
  overflow: hidden;
  background: var(--bg-2);
}
.strct-dg th,
.strct-dg td {
  border-bottom: 1px solid var(--b1);
}
.strct-dg tbody td {
  background: var(--bg-1);
}
[data-theme='dark'] .strct-dg tbody td {
  background: var(--bg-3);
}
.strct-dg-host--singleline .strct-dg tbody tr:not(.strct-dg__detailrow) > td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}
```

**What happens.** In a collapsed table Chrome paints a cell whose overflow is clipped (`hidden` or `clip`) with its
background inside its padding box only. The one-device-pixel band under each collapsed row line is then not covered by
either cell; the table's own background (`--bg-2`) shows there, and the translucent `--b1` is composited over `--bg-2`
instead of over the cell colour:

| arctic | cell             | `--bg-2` | `--b1`      | line pixel, plain grid (showcase) | line pixel, `singleLine` grid       | Δ plain   | Δ `singleLine` |
| ------ | ---------------- | -------- | ----------- | --------------------------------- | ----------------------------------- | --------- | -------------- |
| dark   | `--bg-3` #23282f | #161920  | white 5.5 % | (47, 51, 58)                      | (34, 37, 44) = `--b1` over `--bg-2` | **+11.2** | **−2.6**       |
| light  | `--bg-1` #ffffff | #f4f6f8  | black 5 %   | #f2f2f2                           | #e7e9eb = `--b1` over `--bg-2`      | **−13.0** | **−22.3**      |

In dark, `--bg-2` + 5.5 % white is almost exactly `--bg-3`, so the line disappears (it is even 2.6 levels _darker_ than
the cell, not lighter). In light it is 1.7× heavier than designed. Measured at every scale tried — browser zoom / Windows
display scaling emulated as device scale factor 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2 — and at row positions shifted by
0, ¼, ½ and ¾ px: the band is there every time; it is not a sub-pixel rounding effect. At 2× (HiDPI) the dark line is
exactly invisible (Δ −2.6 on every boundary).

Controls (measured, each one isolates the cause):

- The showcase's "Single-line rows" demo: ticked (default) dark Δ −2.6 / light −22.3; unticked +11.2 / −13.0.
- The same `singleLine` grid with `overflow: visible` forced on its cells: +11.2 / −13.0 (the showcase's look).
- The same grid with `border-collapse: separate; border-spacing: 0`: +11.2 / −13.0, with `overflow: hidden` kept.
- `singleLine` grids that are `virtual` or bounded (`maxHeight`) already run in separate mode (the sticky-header rule)
  and have correct lines — HyperStruct's Tasks & Events grid is one (Δ +11.2 / −13.0 before any change).
- `overflow: clip`, `overflow: clip` + `overflow-clip-margin: 1px`, `overflow-x: hidden`, `position: relative`: still
  −2.6. `contain: paint` instead: −14.6 (the band shows bare `--bg-2`).

**Fix (proposed).** Draw `singleLine` tables in separate mode, as the library already does for sticky / virtual /
bounded hosts — its own comment there says "per-cell bottom borders keep the visuals identical", and they do:

```css
.strct-dg-host--singleline .strct-dg {
  border-collapse: separate;
  border-spacing: 0;
}
```

Keep `overflow: hidden` and the radius on the table (unlike the sticky rule, nothing here needs `overflow: visible`).
Measured with exactly this rule: line pixels equal the showcase's in both themes and at every scale above (within
anti-aliasing at fractional scales); table and host heights unchanged (329.25 / 427.25 px for a 7-row grid); the header
row gains 0.5 px and the last row loses 0.5 px (the halves of collapsed borders become whole borders); hover colour
unchanged (`--acc-s` is composited over the table's `--bg-2` in both modes: dark (27, 32, 42), light (235, 238, 242)).

An alternative that also works would be to move the ellipsis to an inner wrapper so cells never clip — larger, and it
changes every custom cell template's DOM.

**Acceptance.** In a `singleLine` grid, the pixel on each row line equals the plain grid's in both themes at 1× and 2×;
a spec asserts `border-collapse: separate` on `.strct-dg-host--singleline .strct-dg` (jsdom cannot see paint).

**HyperStruct workaround:** `styles.scss` carries exactly the rule above (BUG-54-01); its guard
`core/ui/datagrid-row-lines.spec.ts` also asserts that the library still clips `singleLine` cells in a collapsed table,
so it fails — and says to retire the workaround — once this is fixed.

### BUG-54-02 — selected rows have no fill: `.strct-dg__row--selected td` loses to the themed body-cell rule

**Where.** `datagrid/datagrid.ts` styles (read; measured on the showcase's first datagrid, whose two pre-checked rows
carry `strct-dg__row--selected` and `aria-selected="true"`).

**What happens.** `.strct-dg__row--selected td { background: var(--acc-m) }` has specificity (0,1,1);
`.strct-dg tbody td { background: var(--bg-1) }` is (0,1,2) and `[data-theme='dark'] .strct-dg tbody td` (0,2,2). The
selected rows' cells compute to the resting colour — showcase dark `rgb(35, 40, 47)`, light `rgb(255, 255, 255)`, the
same as unselected rows — so selection is shown by the checkbox alone. `.strct-dg__row--active td` (detail pane) has the
same specificity and likely the same result (read only). Hover works because its selector is (0,3,3).

**Fix (proposed).** Raise the selected / active selectors above the themed body rule, e.g.
`.strct-dg tbody tr.strct-dg__row--selected > td` and a dark-theme twin if the fill should differ, keeping the sticky
variants (which already use `.strct-dg-host--sticky tbody .strct-dg__row--selected .strct-dg__cell--sticky`) in step.

**HyperStruct workaround:** none — HyperStruct's grids look exactly like the showcase here, which is the rule; noted so
it is not mistaken for intent.
