# BUG-76-03 — `variant="primary" solid` draws a grey button

> **CLOSED, 2026-11-09.** Fixed in **v7.10.1**, by the first of the two offered readings: `solid`
> applies only where the variant is not filled already. Reproduced first — `rgb(229, 231, 234)` in
> the light palette and `rgb(35, 40, 47)` in the dark, **pixel for pixel the same grey as the solid
> neutral beside it** — then measured at `--acc` in both, matching a plain primary exactly.
>
> The rule was written unscoped and sat after `--primary` and `--critical` at the same specificity.
> Its own comment already said `solid` was a no-op on those two; only the selector did not. It is
> excluded rather than reordered, so the order of the variant rules among themselves stays free to
> change.
>
> The report named `primary`. The gate found `critical` was grey too — `rgb(160, 99, 92)` expected,
> `rgb(229, 231, 234)` drawn — which nobody had reported.
>
> `scripts/weight-ladder.mjs` now checks both, in six palettes: **24 of its 259 checks fail on
> 7.10.0.**

**Filed by:** HyperStruct, 2026-11-06, against **7.9.1**. Seen on the sign-in page (O480): the main
action read as disabled — grey `--bg-3` with light text — on a page whose only job is that button.

## What happens

`.strct-btn--solid { background: var(--bg-3); color: var(--t1) }` comes after
`.strct-btn--primary { background: var(--acc); color: var(--inv) }` at the same specificity, so
`solid` wins and a primary button loses its accent. HyperStruct has `variant="primary" solid` in
**287** places (counted with grep: dialog Save buttons, Add buttons in action bars), all grey; on the
sign-in page it was removed.

## Ask

`solid` should not undo a coloured variant: either it applies only to `neutral`/`flat`, or
`primary`/`critical` keep their fill with it. If `solid` on `primary` has a meaning, document it.

## Acceptance

`variant="primary" solid` and `variant="primary"` render with `--acc` background in both palettes.
