# BUG-76-03 — `variant="primary" solid` draws a grey button

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
