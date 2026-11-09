# BUG-77-01 — a disabled primary button loses its label: the wizard's Next is an empty box

**Filed by:** HyperStruct, 2026-11-09, against **7.9.1**. Seen in every `strct-wizard` the app has
(Add Host, New Cluster, New Managed Virtual Switch, Deploy VM): until a step can advance, the footer's
right-hand button is a blank outlined box beside a greyed "Back" — the operator cannot read that it
is "Next", or "Finish", or the `finishLabel` the wizard set.

## Measured

Chrome 142, light palette, New Cluster wizard on its first step (`canAdvance` false), computed style
of `.strct-wiz__foot button.strct-btn--primary`:

| property                       | value                                        |
| ------------------------------ | -------------------------------------------- |
| `disabled`                     | `true`                                       |
| `color` (button and its label) | `rgb(255, 255, 255)` — `--inv`               |
| `background-color`             | `rgba(0, 0, 0, 0)` — the accent fill is gone |
| `opacity`                      | `0.5`                                        |

White text, no fill, on the white footer: the label is there (`innerText` "Next") and cannot be
seen. The same holds for any `strct-btn--primary` outside a wizard once it is `disabled`.

## Ask

A disabled primary button keeps a readable label: either it keeps a (muted) accent fill with its
`--inv` text, or it drops the fill **and** takes a text colour that reads on the surface (`--t2`/`--t3`,
as a disabled neutral does). Whichever — the label stays legible at the disabled opacity.

## Acceptance

In both palettes, a disabled `variant="primary"` button (and the wizard's Next/Finish while
`canAdvance` is false) shows its label with at least 3:1 contrast against the surface it sits on.
