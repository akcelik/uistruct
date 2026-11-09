# FR-76-01 — `strct-login`: a full-bleed layout, an environment band and an art slot

> **CLOSED, 2026-11-09.** Shipped in **v7.12.0**, all four asks, and every acceptance measured by
> `scripts/login-layout.mjs` (**22 checks**) rather than asserted:
>
> |                            | 1600×1000   | 1280×800    | 390×844        |
> | -------------------------- | ----------- | ----------- | -------------- |
> | horizontal scroll          | none        | none        | none           |
> | form column                | **572.0px** | **572.0px** | full width     |
> | art over the aside's words | **0px²**    | **0px²**    | art not drawn  |
> | controls                   | **44px**    | 44px        | 44px           |
> | first field                | —           | —           | **234px** down |
> | form before the picture    | —           | —           | **yes**        |
>
> The band is a `role="note"` named by `bandLabel`, mixed at 23% over `--bg-0`, and its own words
> measure **11.80:1** light and **11.94:1** dark.
>
> Two things beyond the ask. The built-in art was laid over the whole panel, which is why its lines
> crossed "Command your infrastructure." in your screenshot — it is now the art band's own
> background, so the fix reaches `split` as well as `full`. And the 44px ask turned out to miss the
> password field's **reveal toggle**, a 26px target sitting inside a 44px field; it now follows the
> control height wherever that is set.
>
> Two of the gate's own readings had to be corrected before it could be believed: a `color-mix()`
> resolves to `color(srgb r g b)` with channels out of **one**, and read as if they were out of 255
> the band's ground came back near-black — its words measured 1.00:1 in the light palette and
> passed by luck in the dark.
>
> The showcase renders it at `/scenarios/sign-in`, inside its own shell; "fills the window" is
> measured as filling what the component is given.

**Filed by:** HyperStruct, 2026-11-06, against **7.9.1**. The operator picked a full-bleed sign-in
(HyperStruct O480, mock-up option C) and asked for the sign-in column to be 30% wider than drawn.
`strct-login` cannot draw it, so HyperStruct lays the page out itself for now (marked workaround in
`src/app/login/login.css`).

## What a reader sees today

`strct-login split` is a card (`grid-template-columns: 1.05fr 1fr`, `max-width` = `maxWidth`) centred in
a 32px padding. On a 1600px window the card is 960px and the rest is empty page; the aside's
`art="network"` lines run behind the aside's text ("Command your infrastructure." is crossed by two
lines in HyperStruct's screenshot).

## Ask

1. `layout="full"` (beside the default and `split`): the aside fills the window from the left, the main
   column has a fixed basis on the right (an input, default 572px), each full height, stacking below
   720px with the aside shrunk to brand + one line (the art hidden), the form first.
2. `[strctLoginBand]`: a slot drawn across the whole width above both columns — for an environment
   label (PRODUCTION / TEST), with a `bandTone` input (`critical | warning | success | accent |
neutral`) at a stronger mix than the `-bg` tokens (HyperStruct uses 22–24% over `--bg-0`).
3. `[strctLoginArt]`: a slot that takes the middle of the aside between the brand row and the
   aside's text, so a consumer's illustration never sits under words. `art="grid"|"network"` stay as
   built-ins for the slot's background.
4. 44px controls inside `strct-login` (touch targets on a page many open from a tablet), or an `xl`
   control size.

## Acceptance

- Full layout at 1600×1000 and 1280×800: no horizontal scroll, the main column 572px, the aside's
  text and art do not overlap (measure the boxes).
- 390px: the form starts above the fold (its first field's top < 844px).
- The band is announced (`role="note"`, its label) and passes 4.5:1 in both palettes.
