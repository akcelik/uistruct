# BUG-41-01 — A tall wizard step pushes the footer out of a chromeless dialog

> **RESOLVED in 4.2.1 (2026-09-26).** The proposed CSS ships as written, plus the same
> guarantee for the horizontal layout when it is `flush` (the height-capped case); an
> inline horizontal wizard keeps its block flow, so its margins are untouched.
> Both suggested tests exist in the form the tools allow: the computed-style contract as
> unit tests (jsdom does resolve these properties), and the real-layout check measured in
> Chrome at 1280×720 with the 1400px step from the reproduction — footer bottom 695px vs
> the dialog's 696px, content pane scrolling. Removing the fix at runtime in the same
> session put the footer back at 1645px, which is what makes it a regression test rather
> than a claim. HyperStruct can drop its O178 style block.

**From:** HyperStruct (MVS ▸ Add & Manage Hosts, Summary step) · **Version:** 4.1.0 ·
**Severity:** high — the operator loses Back / Next / Finish and cannot complete or
leave the wizard except with Esc (and only when the dialog is dismissible).

## Rule the fix should encode

**The wizard footer is never clipped.** Whatever a step renders, Back / Next /
Finish / Cancel stay on screen; the step's content pane scrolls instead. This is a
layout guarantee of the component, not something each consumer has to rebuild.

## Reproduction

```html
<strct-modal [open]="true" chromeless panelClass="my-wizard">
  <ng-template strctModalContent>
    <strct-wizard flush title="Tall step">
      <strct-step label="One">
        <div style="height: 1400px">tall content</div>
      </strct-step>
    </strct-wizard>
  </ng-template>
</strct-modal>
```

Vertical wizard (`provideStrctWizardDefaults({ vertical: true })`), viewport
1280×720. Expected: the content pane scrolls, the footer sits at the bottom of the
dialog. Actual: the footer is below the dialog's bottom edge and invisible.

Also reproduces with a pinned dialog height (`.my-wizard { height: 680px }`).

## Cause (measured in Chrome)

The height chain breaks at the wizard:

| Element                                               | Relevant CSS                                                                                       | Effect                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `.strct-modal__dialog`                                | `max-height: calc(100vh - 48px); overflow: hidden; display: flex; column`                          | caps and clips                                      |
| `.strct-modal__dialog--chromeless .strct-modal__body` | `overflow: hidden; display: flex; column` — but **no `flex: 1; min-height: 0`** on the body itself | body is content-sized inside the dialog             |
| `.strct-modal__body > *` (the `strct-wizard` host)    | `flex: 1; min-height: 0`                                                                           | fine, but…                                          |
| `.strct-wiz` (host)                                   | `display: block`                                                                                   | …a block host doesn't pass a height to its child    |
| `.strct-wiz__layout--v`                               | grid, `overflow: hidden`, **no row track limit, no `min-height: 0`**                               | the grid grows to its content                       |
| `.strct-wiz__content`                                 | `flex: 1; overflow-y: auto`                                                                        | never scrolls — its parent is never shorter than it |

So the grid grows to the step's content height, the dialog clips it, and the
footer (the last thing in `.strct-wiz__main`) is what gets cut. `overflow-y:auto`
on the content pane is already there; it just never receives a bounded height.

## Proposed fix

```css
/* modal: the chromeless body grows inside the dialog's flex column */
.strct-modal__dialog--chromeless .strct-modal__body {
  flex: 1;
  min-height: 0;
}

/* wizard: continue the chain down to the content pane */
.strct-wiz--vertical {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.strct-wiz__layout--v {
  flex: 1;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr);
}
.strct-wiz__layout--v .strct-wiz__main,
.strct-wiz__layout--v .strct-wiz__content {
  min-height: 0;
}
```

`height: 100%` on the host only matters when the parent has a definite height
(the chromeless body); a wizard used inline still sizes to content.

The horizontal layout should get the same guarantee when it is hosted in a
height-capped container (the footer is the last child there too).

## Tests to add

jsdom does no layout, so a unit test cannot see this. Suggested:

1. **Computed-style contract** (jsdom is enough): in a chromeless dialog,
   `.strct-wiz__layout--v` has `min-height: 0` and a `minmax(0, 1fr)` row track;
   `.strct-modal__body` has `flex-grow: 1`. Pins the chain so it can't silently
   regress.
2. **Real layout** (showcase e2e / Playwright): the reproduction above at 1280×720
   → the footer's `getBoundingClientRect().bottom` ≤ the dialog's, and the content
   pane's `scrollHeight > clientHeight`.

## Consumer workaround (HyperStruct, until this ships)

`web/hyperstruct-ui/src/styles.scss`, block commented "The footer must never leave
the dialog (O178)" — the CSS above scoped to `.strct-wizard-modal`. It will be
removed when this ships. Note HyperStruct also already carries the
`.strct-modal__body { flex: 1; min-height: 0 }` half of the fix, described in its
comment as an upstream gap.
