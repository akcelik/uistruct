# RTL / i18n audit

Status of UIStruct under `dir="rtl"`, from a full static sweep of the library
styles plus rendered verification of the showcase (dashboard, forms, tree,
navigation) with the document root set to RTL. Last audit: **2026-07-25**.

## Summary

- **Text, spacing and borders are logical.** Layout uses logical properties
  (`*-inline-start/end`, `text-align: start`), so it mirrors for free. The
  previous audit's "zero physical left/right properties" claim did not survive
  contact with reality — a fresh sweep converted the stragglers (below), and
  the physical declarations that remain are enumerated under
  "Physical-by-design".
- **Strings are overridable.** User-visible strings are inputs (e.g.
  `StrctDatagridLabels`, modal/palette/tree labels), so localization needs no
  forks.
- **Directional behavior fixed in this sweep:**
  - Fly-out menus — context-menu/submenu/menubar panels open toward the
    inline end and their carets/arrows point the right way
    (`[dir='rtl']` overrides in `menu.ts`, `submenu.ts`, `menubar.ts`).
  - `strct-cascade-select` — nested fly-outs flip to the inline-end side.
  - Directional glyphs — accordion/tree chevrons and the transfer shuttle
    icons mirror under RTL.
  - Form controls — combobox, password, datepicker, field, segmented, tabs
    and button group converted to logical insets/padding; the range input
    fills in the reading direction.
  - Feedback & misc — alert, toast outlet, avatar, badge, tag, datagrid
    (sticky-column edge shadow), splitter and tree indentation use logical
    properties.
  - Overlay `start`/`end` placements — `StrctOverlay` reads the anchor's
    computed direction and mirrors the anchored horizontal edge under RTL
    (`overlay.ts`), so `bottom-start` popovers hang off the inline-start
    edge in every direction. `left`/`right` placements stay physical by
    design.
- **Fixed in earlier audits, still verified:**
  - `strct-toggle` — the thumb travels toward inline-end in RTL.
  - `strct-drawer` — `start`/`end` sides anchor with logical insets and the
    slide-in animation mirrors.
  - `strct-nav` (mobile) — the off-canvas panel anchors inline-start and
    slides in from the correct edge.
  - Icon status badges and rail dots/badges — anchored with
    `inset-inline-end`, so state markers follow reading order.
  - Datagrid column-resize grip and chooser alignment — logical insets.

## Physical-by-design (not bugs)

These intentionally stay physical and behave correctly in RTL:

- **Runtime overlay coordinates** (`overlay.ts`, `tooltip.ts`, `tour.ts`):
  positions are computed at runtime from `getBoundingClientRect()`, which
  returns viewport-physical pixels. The popover base CSS (`left: 0` in
  `color-picker.ts:125`, `cascade-select.ts:216`, `dropdown.ts:82`,
  `signpost.ts:100`) is only a pre-position fallback — `StrctOverlay`
  overrides it with inline styles on open.
- **Centered geometry** — `left: 50%` paired with `translate(-50%, …)` for
  viewport or track centering: hotkeys palette (`hotkeys.ts:180`), speed-dial
  up/down (`speed-dial.ts:95,101`), wizard rail connector (`wizard.ts:549`),
  vertical flow variant (`flow.ts:248,282`). Symmetric — identical in both
  directions.
- **CSS-drawn glyphs** — the wizard "done" checkmark is a rotated box drawn
  with `border-left` + `border-bottom` (`wizard.ts:467`); that is the glyph's
  shape, not layout.
- **Explicit physical placements** — speed-dial `left`/`right`
  (`speed-dial.ts:106,112`) and signpost `--left`/`--right`
  (`signpost.ts:116-133`) are caller-chosen physical sides; the names promise
  a physical side, so they keep it in every locale.
- **Full-width spans** — top/bottom drawers stretch with `left: 0; right: 0`
  (`drawer.ts:146-147`); direction-neutral.
- **Charts and sparklines** (`chart.ts:769,816,828,840`): data axes read
  left→right by convention in every locale (time flows the same way); the
  y-axis gutter and the reset button stay physical.
- **Flow diagrams** (`flow.ts:237-327`): node/edge geometry is explicit
  caller data — arrowheads and travelling-packet keyframes are physical along
  the edge.
- **Diff split view** — `left`/`right` are pane names in the data model
  (`diff.ts:42-43`), not CSS.

## Residual hazards

None currently known — the previous overlay `start`/`end` hazard was fixed by
making the horizontal offset direction-aware (see "Directional behavior fixed
in this sweep").

## Known caveats (tracked for 1.0)

- **Column resize drag math** treats rightward movement as widening; in RTL
  the gesture is inverted (cosmetic — resizing still works).
- **Decorative motion** (card loading bar sweep at `card.ts:111`, toast
  entrance nudge) keeps its LTR direction; purely cosmetic.

## How to re-verify

```bash
npx ng build showcase
# serve dist/showcase and open any page, then in devtools:
document.documentElement.dir = 'rtl'
```

The showcase mirrors instantly — navigation, tree indentation, forms, cards
and the datagrid all follow the document direction.

When adding or adjusting directional styles, match the encapsulation of the
component:

- **Emulated encapsulation** — use `:host-context([dir='rtl']) …` so the
  override is scoped to the component (see `toggle.ts:89`).
- **`ViewEncapsulation.None`** — styles are global, so use a plain
  `[dir='rtl'] …` selector (see `accordion.ts:91`, `range.ts:65`);
  `:host-context` has no host to match against there.

For unit tests, set `document.documentElement.dir = 'rtl'` in the spec
(restore it in `afterEach`) and assert the mirrored behavior — e.g. the
toggle thumb transform, the drawer slide-in animation name, or chevron
rotation classes — rather than hard-coded pixel values.
