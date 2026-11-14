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

## Shipped in 7.16.0 (2026-11-14)

`StrctStep.skipped`, `StrctWizard.skippedLabel` and
`StrctWizard.focusCurrentTitle()`. Measured by `scripts/wizard-skipped.mjs` in
Chrome, on the six-step Add Node path with Validate and Decide left out.

### Against the acceptance

| asked                                                                                                                     | measured                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| steps 3–4 carry no done class                                                                                             | `done=false` on both, `--skipped` instead, label `line-through`                                                      |
| their rail buttons are disabled                                                                                           | both disabled; the fixture has **6** things to tab to and neither is among them                                      |
| their accessible names end in "skipped"                                                                                   | Chrome computes **"Validate, skipped"** and **"Decide, skipped"**                                                    |
| the steps actually walked still read as done                                                                              | Servers, Prerequisites and Scope **done**, none marked skipped                                                       |
| `current` set by the app while a button in the old step had focus leaves `document.activeElement` on the new step's title | after "Back to the scope": the content header reads **"Scope"** and `document.activeElement` is `.strct-wiz__ctitle` |

Also measured: a move the wizard makes itself (Next) leaves focus on the
button that was pressed, and clicking a skipped step changes nothing.

### What the report did not have

- **"Not a `goTo` target" has to hold for the call as well as the click.** The
  rail button is disabled, but `goTo(3)` is public and an app with its own
  navigation would have walked straight into the skipped step. It is refused
  in the method too.
- **The focus move needs to know who moved the step.** Next, Back and the rail
  leave focus on the control that was pressed — it is still there, and moving
  focus off it would be its own bug. So the wizard marks its own moves and
  only takes focus when the change came from outside _and_ the focused element
  was inside the content that went away. `focusCurrentTitle()` is public for
  every other case.
- **The title had to become focusable.** `h2` is not, so the heading takes
  `tabindex="-1"`, and the content pane takes one too, for a wizard with
  `[contentHeader]="false"` where there is no heading to land on.
