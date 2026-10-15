# An accordion of results: a badge in the panel header, the whole card header as the toggle → FR-55-01, FR-55-02

**From:** HyperStruct · **Version:** 5.6.1 · **Date:** 2026-10-15 · **HyperStruct decision:** O322

The operator asked for HyperStruct's cluster validation results as an accordion. Each failed or warned test is one entry,
closed until opened, with its result ("Failed", "Warning", "Passed") in the entry's header, so the whole run reads at a
glance.

- `strct-accordion-panel` cannot carry the result: its header renders `heading` text only.
- `strct-card collapsible` can carry it, through `strctCardHeaderMeta` and `strctCardHeaderNote`. HyperStruct uses that
  today. But only the chevron button toggles a collapsible card, while the operator clicks the title.

Suggested order: FR-55-02 (a small, opt-in behaviour), then FR-55-01.

> **FR-55-01 and FR-55-02 SHIPPED in 5.16.0 (2026-10-15)** — every item in this document.
>
> - `[strctAccordionPanelMeta]` projects badges and tags into the panel's header, outside its
>   button, and the button points at them with `aria-describedby`: its own name stays the heading.
>   `strct-accordion-panel [status]` draws the card's tone rail on the leading edge.
> - `strct-card [headerToggles]` folds the card from a click anywhere on its header. Interactive
>   descendants keep their own click, and so does the chevron — the double-toggle HyperStruct's
>   own handler had to guard against is guarded here, with a test that fails if it returns.
>   `.vr-acc-head { cursor: pointer }` and the local handler can go.

---

### FR-55-01 — `strct-accordion-panel`: a meta slot in the header

**Today.** The header is a `<button>` with the chevron and `{{ heading() }}`; nothing else is projected into it.

**Asked.**

- **`[strctAccordionPanelMeta]` content:** badges and tags, after the title, inside the header row. Projected into the
  header but kept **outside** its button, so the button's accessible name stays the heading. Alternatively, an
  `aria-describedby` from the button to the meta.
- **Optional `status` input:** a tone rail on the leading edge, as `strct-card [status]` has.

**Why not just use cards.** An accordion is one bordered group with dividers. A stack of cards is a different surface,
and the showcase shows accordions for exactly this "list of sections" pattern.

### FR-55-02 — `strct-card collapsible`: the whole header toggles (opt-in)

**Today.** `card.toggle()` is called only by the header's chevron button (`.strct-card__collapse`).

**Asked.** An opt-in, e.g. `<strct-card collapsible headerToggles>`. A click anywhere on `strct-card-header` toggles the
card, except a click on an interactive descendant (button, link, form control, `[role=button]`), which keeps its own click.

- **The chevron button stays the keyboard control,** with `aria-expanded` and the expand/collapse labels.
- **The header shows `cursor: pointer`** when the option is on.

**HyperStruct's workaround until then.** `shell/validation-results.ts` binds `(click)` on `strct-card-header`. The handler
ignores clicks whose target is inside a button, link or form control, then flips its own open state. Without that guard
the chevron's click also bubbled to the header and toggled twice: the card looked closed while the consumer's state said
open. The next click then seemed to do nothing. A test caught it. When FR-55-02 ships, HyperStruct deletes the handler
and its `.vr-acc-head { cursor: pointer }` rule.
