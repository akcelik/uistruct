# RTL / i18n audit

Status of UIStruct under `dir="rtl"`, from a full static sweep of the library
styles plus rendered verification of the showcase (dashboard, forms, tree,
navigation) with the document root set to RTL. Last audit: **2026-07-17**.

## Summary

- **Text, spacing and borders are fully logical.** The static sweep found
  **zero** uses of `margin/padding/border-left|right` or
  `text-align: left|right` in the library — everything uses logical properties
  (`*-inline-start/end`, `text-align: start`), so layout mirrors for free.
- **Strings are overridable.** User-visible strings are inputs (e.g.
  `StrctDatagridLabels`, modal/palette/tree labels), so localization needs no
  forks.
- **Directional behavior fixed in this audit:**
  - `strct-toggle` — the thumb now travels toward inline-end in RTL.
  - `strct-drawer` — `start`/`end` sides anchor with logical insets and the
    slide-in animation mirrors.
  - `strct-nav` (mobile) — the off-canvas panel anchors inline-start and
    slides in from the correct edge.
  - Icon status badges and rail dots/badges — anchored with
    `inset-inline-end`, so state markers follow reading order.
  - Datagrid column-resize grip and chooser alignment — logical insets.

## Physical-by-design (not bugs)

These intentionally stay physical and behave correctly in RTL:

- **Overlay positioning** (dropdown, context menu, tooltip, signpost,
  combobox, datepicker popovers): coordinates are computed at runtime from
  `getBoundingClientRect()`, which is direction-agnostic — the popover opens
  where the anchor actually is.
- **Charts and sparklines**: data axes read left→right by convention in every
  locale (time flows the same way); axis labels and tooltips are unaffected.
- **Flow diagrams**: node/edge geometry is explicit caller data.

## Known caveats (tracked for 1.0)

- ~~**Datagrid sticky columns** compute physical `left` offsets~~ — resolved:
  offsets are logical (`inset-inline-start`); frozen columns pin to the
  reading start in RTL (verified under RTL horizontal scroll).
- **Column resize drag math** treats rightward movement as widening; in RTL
  the gesture is inverted (cosmetic — resizing still works).
- **Decorative motion** (card loading bar sweep, toast entrance nudge) keeps
  its LTR direction; purely cosmetic.

## How to re-verify

```bash
npx ng build showcase
# serve dist/showcase and open any page, then in devtools:
document.documentElement.dir = 'rtl'
```

The showcase mirrors instantly — navigation, tree indentation, forms, cards
and the datagrid all follow the document direction.
