# FR-83 — The tree can say "not known" and "not current"

**Filed by:** HyperStruct, 2026-11-17, against **7.20.0**, from its avionics-grade review (O519,
findings UI-N1 and UI-N7: display integrity).

## The case

HyperStruct's inventory tree draws each host and VM with the 7.18 state axes. Two things the
appliance knows could not be drawn, so the tree said more than it knew:

| what the appliance knows                                 | what the tree could draw             | what the operator read |
| -------------------------------------------------------- | ------------------------------------ | ---------------------- |
| the alarms of a host were never read, or the read failed | `health: 'ok'` (no mark)             | "healthy"              |
| the host's last reading is 20 minutes old                | `reach: 'ok'` (row drawn normally)   | "reachable now"        |
| the browser lost the appliance 3 minutes ago             | every node as last read, fully drawn | "this is live"         |

In an avionics display a value that is not current must look not current, and a value that is not
known must look not known; neither may look normal.

## Shipped in 7.22.0 (2026-11-18)

### Against the acceptance

| asked                                                                          | measured                                                                                                                                                         |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unknown` is visibly different from no mark and from both alarm shapes at 18px | the ring's enclosed background is **16.3%** of its own box, against **0.0%** for the warning triangle and **0.0%** for the critical diamond — a shape, not a hue |
| it meets the same contrast as the other health marks                           | **5.13:1** against the row (floor 3:1 for a graphic), in all six palettes                                                                                        |
| rollups do not count `unknown` as a warning                                    | "cluster-05" wears **1** critical beside its name and says "1 critical, 3 health unknown" — the three unread are words, never a chip                             |
| a `stale` row is muted, less than `unreachable`, and still readable            | **6.20:1**, between a live row (**17.49:1**) and one nobody can reach (**5.13:1**), floor 4.5 — and its glyph is **not** cut                                     |
| `unreachable` and `orphaned` win over `stale`                                  | "HV-NODE-16" is drawn unreachable (cut glyph) and still carries the ring                                                                                         |
| a tree under `[stale]` is muted and keeps focus and selection                  | all 8 rows receded, the warning, the ring and the rollup all still drawn — the tree is old, not empty                                                            |
| the caption is read once, not per node                                         | **1** caption, `aria-hidden`, and the sentence once on the tree as `aria-description`; **no** row repeats it                                                     |
| `stateWords` and `aria-description` carry the new words                        | `stale: 'Not current'`, `unknown: 'Health unknown'`, both translatable — a spec sets Turkish and reads "Güncel değil, Durumu bilinmiyor"                         |
| existing consumers see no change                                               | the 16 checks from 7.18/7.19 are unchanged and green; `health: 'ok'` still draws nothing                                                                         |

Measured by `scripts/tree-state.mjs` (16 → **25** checks) and held by **11** new specs.

### One decision the ask left open, made and stated

**A stale alarm keeps its tone.** `unreachable` neutralises the glyph, because what its alarms said
is last known and nobody can confirm it. `stale` does not: the object answered, and an alarm twenty
minutes old is still an alarm. The receded row is what says how old it is. Measured: "HV-NODE-15"
keeps the critical diamond at **4.74:1** while its label recedes to **6.20:1**.

### What the report did not have

- **Under `[stale]`, a row with its own `reach: 'stale'` is no longer distinguishable** from a
  normal one — both are receded, because the whole tree is equally out of date. That is correct and
  deliberate: there is nothing to tell apart when every reading has the same age.
- **The hole is measured as a shape, not inferred from the CSS.** The mark's box is captured at 6×,
  ink is everything that differs from the surface, and the hole is background the flood from the
  box's edge cannot reach — so it survives greyscale, which is the whole reason the ring was chosen
  over a second hue.
- **The first run of that measurement returned 0.0% for every mark**, including the ring. The clip
  was outside the viewport, and a clip outside the viewport comes back blank — which reads as "no
  hole" for everything at once. The gate now scrolls the case into view first.
