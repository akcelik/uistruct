# Vertical wizard hosted in a modal — chrome + padding gaps

From HyperStruct, against **v1.15.0**, after converting all nine app wizards to
`<strct-wizard>` with `provideStrctWizardDefaults({ vertical: true })`.

The vertical wizard is excellent — the rail/pane/aside layout is exactly right.
Both items below are about the **most common host** for it: a modal.

---

## FR-17-01 — Aside slot has no padding

`.strct-wiz__layout--v .strct-wiz__aside` sets `display/background/border-inline-start/overflow-y`
but **no padding**, so projected summary content sits flat against the divider and
the dialog edge:

```
.strct-wiz__layout--v .strct-wiz__aside{display:block;background:var(--bg-2);
  border-inline-start:1px solid var(--b1);overflow-y:auto}
```

Every consumer of `strctWizardAside` will need the same inset, and the rail
already ships one (`.strct-wiz__rail{padding:20px 18px 16px}`). Asking each app
to re-pad a slot the component otherwise fully styles is a papercut that reads
as a bug the first time you see it.

**Request:** give the aside a default inset in the same family as the rail —
e.g. `padding: 20px 18px`. If some consumer wants an edge-to-edge aside (a table
or image flush to the border), a modifier input or a documented `padding: 0`
override is a cleaner opt-out than making everyone opt in.

**Workaround in HyperStruct today:** app-global
`.strct-wizard-modal .strct-wiz__aside { padding: 18px 20px; }`.

---

## BUG-17-00 — Empty aside wraps the vertical layout onto a second row

**Severity: this breaks every aside-less vertical wizard, in or out of a modal.**

The template renders the aside unconditionally:

```html
<aside class="strct-wiz__aside"><ng-content select="[strctWizardAside]" /></aside>
```

Only the _modifier_ is conditional (`[class.strct-wiz__layout--aside]="vertical() && asideDef()"`).
But the CSS turns the aside on for the whole vertical layout:

```css
.strct-wiz__aside {
  display: none;
}
.strct-wiz__layout--v .strct-wiz__aside {
  display: block;
} /* ← not scoped to --aside */
```

So with **no** `strctWizardAside` projected, the layout is still
`grid-template-columns: 232px minmax(0,1fr)` (2 tracks) but has **3 grid items**
(rail, main, empty aside). The aside wraps to an implicit second row, and
`align-content: normal` (= stretch) hands that empty row a share of the height.

Measured in HyperStruct (1080px dialog, 619px available):

|                           | before            | after   |
| ------------------------- | ----------------- | ------- |
| `grid-template-rows`      | `470.5px 148.5px` | `619px` |
| `.strct-wiz__main` height | 470.5px           | 619px   |

`__main` is squeezed to ~76% of the layout, so `__content`'s `flex:1` stops at
470px and the footer floats mid-dialog with ~150px of dead space beneath it.
It looks exactly like "the buttons aren't at the bottom".

**Fix:** scope the reveal to the modifier —

```css
.strct-wiz__layout--v.strct-wiz__layout--aside .strct-wiz__aside {
  display: block;
}
```

— or don't render the `<aside>` element at all when `asideDef()` is absent
(`@if (asideDef()) { <aside>…</aside> }`), which also drops a stray landmark
from the a11y tree.

**Workaround in HyperStruct today:**
`.strct-wiz__layout--v:not(.strct-wiz__layout--aside) .strct-wiz__aside{display:none}`

---

## FR-17-02 — A wizard in a modal renders two cards

`.strct-wiz__layout--v` draws its own card: `border: 1px solid var(--b2);
border-radius: 12px; background: var(--bg-1)`. That is right for a wizard placed
on a page. Inside `<strct-modal>` it collides with the dialog's own frame:

- `.strct-modal__head` repeats the wizard's `title` next to the X;
- `.strct-modal__body` padding insets the wizard card inside the dialog card, so
  the rail can't reach the dialog edges (the rail reading edge-to-edge, full
  height, is what makes the vertical design work);
- `.strct-modal__foot` is dead weight — the wizard brings Back/Next/Finish/Cancel.

So the natural composition (`<strct-modal><strct-wizard vertical>`) does not
produce the intended look, and every app has to discover the same CSS.

**Request:** a first-class way to say "this wizard IS the dialog". Options, in
our order of preference:

1. A `surface` (or `flush`) input on `strct-wizard` that drops its own
   border/radius and fills its host — so a modal only has to hide its head/foot.
2. A modal input (e.g. `bare` / `chromeless`) that suppresses head + body padding
   - footer, documented as the wizard-hosting mode.
3. Failing either, document the composition + the exact CSS in the wizard docs.

**Workaround in HyperStruct today** — an app-global class passed via `panelClass`,
with `hideFooter`, the title moved onto the wizard, and `cancelable` mandatory
(hiding the head removes the only X):

```scss
.strct-modal__dialog.strct-wizard-modal {
  height: min(680px, calc(100vh - 96px));
  overflow: hidden;
}
.strct-wizard-modal .strct-modal__head {
  display: none;
}
.strct-wizard-modal .strct-modal__body {
  padding: 0;
  height: 100%;
  overflow: hidden;
}
.strct-wizard-modal .strct-wiz,
.strct-wizard-modal .strct-wiz--vertical {
  height: 100%;
}
.strct-wizard-modal .strct-wiz__layout--v {
  height: 100%;
  border: 0;
  border-radius: 0;
}
```

### Gotcha worth a doc line either way

`.strct-wiz{display:block}` and the layout is a CSS **grid**. Our first attempt
set `display:flex` on the `<strct-wizard>` host to make it fill the dialog; that
turned the grid into a content-sized flex item and left a ~270px dead column on
the right of an `xl` dialog. Sizing the host with `height`/`width` only is
correct, but the failure mode is silent and looks like a wizard bug. A note in
the wizard docs ("size the host with width/height; do not override `display`")
would save the next consumer the same hunt.
