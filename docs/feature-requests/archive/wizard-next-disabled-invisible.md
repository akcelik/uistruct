# BUG-77-01 — a disabled primary button loses its label: the wizard's Next is an empty box

> **CLOSED, 2026-11-09.** Fixed in **v7.10.1**, by the second of the two offered readings: the fill
> goes and the ink goes with it. Your figures reproduced exactly — **1.06:1** light, **1.03:1**
> dark — and a disabled `link` carried the same shape of the mistake at **1.17:1**, which was not in
> the report. Now **4.97:1 – 5.65:1** across all six palettes.
>
> One thing had to change beyond the ask. The acceptance is 3:1, and **it cannot be met while the
> blanket `--disabled-opacity` stays**: the opacity halves the label along with everything else, and
> near-black ink at 0.5 tops out at **2.63:1** on a light surface — which is where a disabled
> _neutral_ already was, so this was never only a primary problem. The button's disabled state is
> now carried by tokens instead: no fill, a hairline border, normal weight and `--t3`. It is the
> rule the wiring map arrived at one component over — text taken out of contrast is not
> de-emphasised, it is unreadable.
>
> The other four components that use `--disabled-opacity` (`segmented`, `number`,
> `datetime-picker`, `chat`) are untouched. None of them paints a label over its own fill, and
> nothing has been filed against them; if one turns out to have the same shape of it, it is its own
> report.
>
> `scripts/weight-ladder.mjs` checks every disabled variant's label in six palettes: **18 of its 259
> checks fail on 7.10.0.**

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
