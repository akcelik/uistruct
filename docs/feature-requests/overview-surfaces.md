# FR-44-01..02 — card surface and heat-map band intensity

> **FR-44-02 RESOLVED in 4.4.1 (2026-09-29)**: threshold intensity is monotonic across bands
> (accent 8–80%, warning 80–92%, critical 92–100%), so a cell past a threshold is never paler
> than the one below it. The FR offered a `bandFloor` input as the alternative; ascending band
> ranges need no new input and cannot be configured into the broken state.
>
> **FR-44-01 RESOLVED in 5.0.0 (2026-09-30)**, on the owner's approval: it changes how every card
> looks, which the versioning policy makes a major.
>
> **One edge.** `--sh` lost its `0 0 0 1px var(--b1)` ring in all six schemes; the card keeps its
> border, and `--shh` keeps its own ring because a raised state is a different one. Measured: the
> card's computed shadow is now `rgba(0,0,0,.06) 0px 1px 3px` with **zero** `0 0 0 1px` components.
> `strct-segmented`'s moving pill had no border of its own, so it was given one explicitly rather
> than losing its definition.
>
> **A surface step, the same direction in both themes.** The tokens now carry roles rather than one
> lightness direction: `--bg-0` is the page ground, `--bg-1` the raised surface (card, menu,
> window), `--bg-2` the recessed fill (input, track, chip). The three dark schemes had them the
> other way round — a card was _darker_ than its ground, i.e. sunk — so their values were swapped;
> the light schemes kept the direction and widened the step (the card is now white, or the
> palette's white).
>
> Measured in Chrome, card against its ground:
>
> | Scheme       | vs the page (`--bg-0`) | vs a `--bg-2` container | raised?               |
> | ------------ | ---------------------- | ----------------------- | --------------------- |
> | arctic dark  | 1.166                  | 1.078                   | was **sunk** → raised |
> | arctic light | 1.101                  | 1.083                   | raised (was 1.026)    |
> | ember dark   | 1.144                  | 1.075                   | was **sunk** → raised |
> | ember light  | 1.107                  | 1.108                   | raised (was 1.043)    |
> | sage dark    | 1.152                  | 1.076                   | was **sunk** → raised |
> | sage light   | 1.093                  | 1.096                   | raised (was 1.038)    |
>
> Nested surfaces now read the same way in both themes too: a card header is recessed against its
> card, and a grid's cells sit above its frame, which sits above the page. Every text tone stays at
> or above AA on all three surfaces in all six schemes — the worst is `--t3` on the raised surface
> in sage dark, at 4.51.

**From:** HyperStruct (every Overview page and Home, O239) · **Version:** 4.4.0 ·
**Severity:** low–medium. Both are visible on every Overview. Neither blocks a feature, and
the consumer can't fix either one cleanly from outside the component.

HyperStruct redesigned its Overview pages (O239): two rails of `strct-card`s, a verdict band,
and five type sizes from strct's scale. After that pass, these two are the only visual defects
left on those pages that come from the library rather than from the consumer. Both were
measured in Chrome with the `arctic` palette.

## FR-44-01 — `strct-card`: one edge, and a surface that differs from its ground

Measured on a HyperStruct Overview (`strct-card` inside `strct-shell`):

| Theme | Card background                 | Ground (`strct-shell`)          | Border                            | Box-shadow ring                    |
| ----- | ------------------------------- | ------------------------------- | --------------------------------- | ---------------------------------- |
| light | `rgb(251, 252, 253)` (`--bg-1`) | `rgb(248, 249, 251)` (`--bg-2`) | `1px solid rgba(0,0,0,.09)`       | `0 0 0 1px rgba(0,0,0,.05)`        |
| dark  | `rgb(22, 25, 32)` (`--bg-1`)    | `rgb(28, 32, 40)` (`--bg-2`)    | `1px solid rgba(255,255,255,.09)` | `0 0 0 1px rgba(255,255,255,.055)` |

Two things show:

1. **Two edges.** The card has a 1 px border (`--b2`), and `--sh` adds a second 1 px ring
   (`0 0 0 1px var(--b1)`) outside it. At 1× zoom the result reads as one soft 2 px edge; at
   2× it is two lines. Each is fine on its own. Together they make every card heavier than
   the design needs, and a page of ten cards is ten double outlines.
2. **No surface step in the light theme.** The card and its ground differ by 3 levels per
   channel (contrast 1.03:1), so the edge alone separates the card from the page. In the
   dark theme the card is darker than its ground: it reads as sunk into the page, not as
   raised above it.

**Ask:**

- **One edge.** Keep the border and drop the `0 0 0 1px` ring from `--sh`, or the other way
  round. `--shh` (the raised/hover shadow) can keep its ring; it is a different state.
- **A surface step.** A card should read as one step off its ground in both themes. In the
  light theme, either a ground a little darker than `--bg-2`, or a card at white.
- **The same direction in both themes.** Dark: raised, i.e. lighter than its ground.
- Consumers read these as tokens (`--bg-1` / `--bg-2` / `--sh`), so a token-level change
  reaches every card at once, which is the point.

## FR-44-02 — `strct-heatmap` `thresholds`: intensity that never goes down as the value goes up

4.3.0 (FR-43-03) scales intensity _within_ each band and floors every band at 45 %:

```ts
const pos = (value - from) / (to - from);
const pct = 45 + Math.round(pos * 55); // every band restarts at 45 %
return `color-mix(in srgb, ${color} ${pct}%, var(--bg-1))`;
```

With HyperStruct's CPU bands (`warning: 85`, `critical: 95`):

| Value | Band     | Mix    | Reads as                                 |
| ----- | -------- | ------ | ---------------------------------------- |
| 84 %  | accent   | ≈ 99 % | dark blue: the strongest cell on the row |
| 86 %  | warning  | ≈ 50 % | pale olive, close to beige               |
| 94 %  | warning  | ≈ 95 % | dark olive                               |
| 96 %  | critical | ≈ 50 % | pale rose                                |

So a cell just past a threshold is **paler** than the cell just below it. On Home's
"Load · last 24 hours", beige and pale-rose squares sit between dark blue ones, and the
eye reads them as the quieter hours. They are the busiest.

The 45 % floor was chosen so a band's low end is never mistaken for empty (see the
FR-43-03 resolution note). That concern is right for the accent band, which starts at
zero. It is wrong for the warning and critical bands, which start where the accent band
is already at full strength.

**Ask:** intensity that is monotonic in the value across bands. One of:

- floor the warning and critical bands at the accent band's top (for example 80 % → 100 %),
  so crossing a threshold changes the hue and never lowers the strength; or
- a `bandFloor` input (default: today's 45 %, so nothing moves for a consumer who does not
  ask), which HyperStruct would set to about 0.8.

Either keeps FR-43-03's point that a 96 % cell reads darker than an 81 % one, and stops an
86 % cell reading lighter than an 84 % one.

## What the consumer does today

Nothing. It could override `--sh` locally, but that would split one card look into two. For
the heat map it could pass its own colours, but the band rule lives inside the component.
Both are left as the library draws them until these ship.
