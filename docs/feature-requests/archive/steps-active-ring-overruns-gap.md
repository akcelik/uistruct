# BUG-80-01 — `strct-steps`: the active step's pulse ring runs into its neighbours

**Filed by:** HyperStruct, 2026-11-12, against **7.14.0**. Seen in the host update run card
(`strct-steps dense wrap` in a datagrid cell: Check · Download · Install · Restart · Verify). The
operator's first reading of a photo of the screen was "the objects sit on top of each other": the
pills read as overlapping, not as a sequence.

## Measured

Computed from the shipped stylesheet of 7.14.0 (`fesm2022/akcelik-strct.mjs`), not from a browser:

| rule                                                         | value                                         |
| ------------------------------------------------------------ | --------------------------------------------- |
| `.strct-steps__list` `gap`                                   | `6px 4px` — **4px between two pills**         |
| `.strct-steps__step[data-state=active]:after`                | `inset: -1px`, `border: 1px solid var(--acc)` |
| `@keyframes strct-steps-pulse` `to`                          | `transform: scale(1.06)`, `opacity: 0`        |
| `.strct-steps__step + .strct-steps__step:before` (connector) | `inset-inline-start: -5px; width: 5px`        |

The ring is the step's box grown by 1px, then scaled about its centre by 1.06. For a step `w` px
wide it reaches `1 + 0.03 × (w + 2)` px past the step's border on each side:

| step width               | ring past the border | left of the 4px gap                   |
| ------------------------ | -------------------- | ------------------------------------- |
| 62px ("Install", dense)  | 2.92px               | 1.08px                                |
| 76px ("Download", dense) | 3.34px               | 0.66px                                |
| 98px                     | 4.00px               | 0 — touches the neighbour             |
| 120px ("Wait for drain") | 4.66px               | −0.66px — over the neighbour's border |

So at its widest the ring is never more than about a pixel from the next pill, and past ~98px it
draws over it — moving, beside a still neighbour. The connector adds to the reading: 5px wide in a
4px gap, it spans the gap edge to edge and crosses the step's own 1px border, so the pills read as
links of one chain whose ends collide.

## Ask

The active step's emphasis stays inside the space the step owns:

- the ring is drawn inside the step's box (an inset ring, or `outline` with a negative offset), or
  pulses by opacity alone, with no scale; **or**
- the list's gap is at least the ring's furthest reach, for the widest step it can hold.

## Acceptance

- At 1×, 1.25× and 2×, in dense and default, no painted pixel of an active step's ring falls inside
  a neighbouring step's border box, at any point of the animation, for labels up to 160px.
- `prefers-reduced-motion` keeps the static ring it has today.
- The connector touches neither pill's border, or the gap is wide enough that it reads as a line
  between two separate objects.

## Fixed in 7.16.0 (2026-11-14)

Nothing scales any more: the ring is the step's own box (`inset: 0`), it
breathes by opacity alone, the list's gap is 6px, and the connector is a 2px
line in the middle of it. Measured by `scripts/steps-rail.mjs`, which finds
the ring's painted pixels by taking the same shot twice — once as it renders,
once with the ring suppressed — and diffing them.

### Against the acceptance

| asked                                                                          | measured                                                                                                                                  |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| at 1×, 1.25× and 2×, dense and default, no ring pixel inside a neighbour's box | **0** of them, over **18** captures (three scales × two densities × three points of the pulse)                                            |
| at any point of the animation, for labels up to 160px                          | the fixture's active label is **"Wait for drain and reboot"**; the ring paints 352–1514 pixels and reaches **0.00px** past its own border |
| `prefers-reduced-motion` keeps the static ring it has today                    | `animation: none`, `opacity: 0.5`, **400** pixels of ring, none past the border                                                           |
| the connector touches neither pill's border                                    | a **2px** line in a **6px** gap: **2.0px** of daylight before it and **2.0px** after, **6** painted pixels, **0** on a pill               |

### What the report did not have

- **The gap alone would not have been enough.** The report offers widening the
  list's gap to the ring's furthest reach as an alternative. For the 120px
  step it measures, that is a 4.66px ring in a gap that would have to be about
  10px to clear it on both sides — and the reach grows with the label, so any
  number chosen would be wrong for the next longer one. Holding the ring
  inside the box is the only version that does not depend on how wide a step
  happens to be.
- **The ring was not the only thing crossing the gap.** The 5px connector in a
  4px gap spanned it edge to edge and lapped 1px onto the previous pill's
  border, which is half of why the pills read as links of one chain whose ends
  collide. It is now 2px with 2.0px of daylight on each side, measured the
  same way as the ring.
