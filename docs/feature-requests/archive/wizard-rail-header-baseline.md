# Vertical wizard — align the rail progress line with the content-header divider

**Status:** proposed · from HyperStruct
**Component:** `StrctWizard` (vertical mode + content header)
**Follows:** v1.18 content header (`archive`/wizard content-header), FR-17-03 aside width

---

## FR-18-01 — Rail progress line and content-header divider must share a baseline

### Problem

In a vertical wizard the two horizontal lines that frame the top of the panel sit
at **different heights**, so the header band reads as broken across the two columns:

- **Rail (left):** `.strct-wiz__vtitle` is one line, then `.strct-wiz__pbar` (the
  progress line) immediately below it → the progress line lands at roughly
  `titleHeight + margin` (~33px from the band top).
- **Main (center):** `.strct-wiz__chead` stacks `ctitle` + `clede` (two lines) with
  `padding-top:18px` / `padding-bottom:13px`, and closes with its `border-bottom`
  → that divider lands at roughly ~66px.

So the progress line (left) and the content-header divider (center) are ~33px apart
vertically. Worse, the content-header height is **content-dependent** — a step with
no `description` is one line, with a `description` it's two — so no fixed app-side
offset can keep them aligned. It has to be a layout guarantee inside the wizard.

Screenshot (New Port Profile wizard, VLAN step): the left "1/4 completed" progress
bar sits well above the "VLAN / Tagging and isolation" header's bottom hairline.

### Desired behaviour

The rail's **title band** (`vtitle` + `pbar` + `pcount`) and the main pane's
**`chead`** should occupy the **same vertical extent**, so the progress line and the
content-header's `border-bottom` land on the **same baseline** — the header reads as
one continuous band across both columns.

Implementer's choice on the mechanism; a couple of shapes that work:

1. **Shared header-band height.** Give the rail title band and `chead` a common
   min-height (a token, e.g. `--strct-wiz-header-h`), and bottom-align the progress
   line within the rail band so it meets `chead`'s divider. Works whether the step
   has a description or not (the band is sized once, not per-step).
2. **Divider from the same row.** Lay the header (rail band + chead) as one grid row
   and draw a single hairline across both columns at the row's bottom edge, instead
   of a rail-local `pbar` position and a chead-local `border-bottom` that drift apart.

Either way: **one horizontal line across the top of the wizard**, not two at
different heights.

### Acceptance

- The rail progress line and the content-header `border-bottom` share the same Y.
- Holds for steps **with and without** a `description` (1- vs 2-line header) — the
  alignment is not sensitive to content height.
- No consumer CSS needed; wizards inherit the aligned band.

### Why framework, not app

This is wizard chrome geometry, identical for every wizard — a per-app CSS offset
would be a fragile px-hack tied to current font metrics and would break on the next
type-scale change. Owning it in `StrctWizard` keeps every wizard's header band
visually unified. HyperStruct will pick it up on the next release.
