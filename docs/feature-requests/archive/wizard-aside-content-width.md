# Wizard summary aside — content column must not shrink

**Status:** proposed · from HyperStruct
**Component:** `StrctWizard` (+ `strctWizardAside`), interaction with `StrctModal`
**Follows:** `archive/wizard-as-dialog-surface.md` (BUG-17-00 empty-aside wrap, FR-17-01
aside padding, FR-17-02 wizard flush + modal chromeless — shipped v1.16.0)

---

## FR-17-03 — Adding a summary aside must not narrow the step content

### Problem

When a `<aside strctWizardAside>` is added to a `strct-wizard`, the aside takes its
width **out of the content (step) column** instead of widening the wizard. The step
form visibly shrinks the moment an aside appears.

Today the only workaround in the consuming app is to **manually bump the host
`strct-modal` size** (e.g. `size="lg"` → `size="xl"`) so the content column reclaims
its original width. That is fragile and unenforceable:

- Every wizard author must _remember_ to widen the modal whenever they add an aside,
  and to pick the _right_ larger size.
- Two wizards with an aside can end up at different sizes → the content column width
  is inconsistent across the app.
- Removing the aside later leaves the modal over-wide; adding one to an `md`/`sm`
  wizard silently squeezes the form with no signal.

Concrete case: HyperStruct's cluster-create wizard runs at `size="xl"` (chosen by
trial so the aside fits), while a new Port Profile wizard was authored at `size="lg"`;
adding the same summary aside squeezed its form until it too was forced to `xl`. The
correct width became tribal knowledge, not a guarantee.

### Desired behaviour

A wizard's **step content column keeps the same width whether or not an aside is
present** — the aside is laid out _beside_ a full-width content column, not carved out
of it. The consuming app should not have to change the modal `size` to accommodate an
aside.

Two acceptable shapes (implementer's choice):

1. **Intrinsic-width wizard.** When an aside is present, the wizard requests its
   natural width = content-column width + aside width (+ gap), and the chromeless
   wizard-modal surface grows to fit it. The modal `size` then only caps/among a
   maximum, it doesn't dictate the content width.
2. **Guaranteed content minimum.** Define a standard minimum content-column width for
   `strct-wizard` (e.g. a token like `--strct-wizard-content-min`, ~480px) that the
   aside can never encroach on; the aside gets its own fixed track next to it.

Either way the outcome is the same: **aside presence changes total wizard width, never
content width.**

### Acceptance

- A wizard rendered with vs. without an aside shows an **identical step-content column
  width** (measure the form area; it must not change).
- No consumer needs to set or change `strct-modal size` because an aside was added or
  removed.
- The empty-aside case stays correct (no regression of BUG-17-00): no aside → no
  reserved track, content spans full width.
- Works under the shipped chromeless + `flush` wizard-modal combo (FR-17-02).

### Why framework, not app

This is a layout invariant of "wizard + summary aside", not a per-screen decision. Put
it in `StrctWizard` and every wizard inherits the same, non-negotiable geometry — no
app-side `size` juggling, no drift between screens. HyperStruct will drop its manual
`xl` overrides once this ships.
