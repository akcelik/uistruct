# FR-80-05 — `strct-wizard`: a step skipped is not "done", and focus follows a step change it did not make

**Filed by:** HyperStruct, 2026-11-12, against **7.14.0**. HyperStruct's Add Node wizard (O509) has six
steps — Servers, Prerequisites, Scope, Validate, Decide, Ready to add — and two paths that leave steps
out: servers that are already nodes go Prerequisites → Ready to add, and a join without validation goes
Scope → Ready to add.

## 1. A step skipped reads as done

The rail marks every step below `maxVisited` with `strct-wiz__vstep--done` (a check). On a skipped path
the wizard reaches Ready to add (`maxVisited` = 5), and Validate and Decide show as done although
nothing ran there. The rail then says a validation was made that was not.

**Ask:** `StrctStep.skipped` (input, boolean): a skipped step is drawn neither done nor current — a
plain or struck-through ring, its label quieter — is not a `goTo` target, and is said as "skipped" to a
screen reader (`aria-label` of its rail button, e.g. "Validate, skipped").

**Acceptance:** with `[skipped]="true"` on steps 3 and 4 and `current` = 5, steps 3–4 carry no done
class, their rail buttons are disabled, and their accessible names end in "skipped".

## 2. Focus is lost when the app changes the step

The wizard keeps focus on Next/Back when they change the step (the one-button note in the template).
When the app changes `current` itself — a "Back to the scope" or "Validate again…" button inside a
step's content — the pressed button goes with the step's content (`@if (active())`) and focus falls to
`<body>`. HyperStruct focuses the step's `h2.strct-wiz__ctitle` itself, after render, by its text.

**Ask:** when `current` changes from outside (not by the wizard's own Next/Back/rail), and focus was
inside the content that went away, move focus to the new step's title (made focusable with
`tabindex="-1"`). Or expose `focusCurrentTitle()` for the app to call.

**Acceptance:** `current` set by the app while a button in the old step had focus leaves
`document.activeElement` on the new step's title.
