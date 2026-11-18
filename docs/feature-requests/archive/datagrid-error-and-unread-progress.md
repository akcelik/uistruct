# FR-84 — A grid that failed to read, and a bar with no reading

**Filed by:** HyperStruct, 2026-11-17, against **7.20.0**, from its avionics-grade review (O519,
findings UI-N4 and UI-N9: display integrity).

## The case

A read that fails must never look like a read that found nothing. HyperStruct found screens where
it did:

| screen                        | the read failed, the screen said |
| ----------------------------- | -------------------------------- |
| Migrate ▸ what blocks a move  | "Nothing blocks a move"          |
| Restore ▸ recovery points     | "This VM has no recovery point." |
| a port profile ▸ its adapters | "none on this profile"           |

Same cause each time: on an error the consumer hands `strct-datagrid` an empty array and the grid
draws its `emptyText`. Of 429 datagrids in HyperStruct, 26 switched `emptyText` by hand; the rest
could not tell the two apart. `strct-progress` had the same gap for a single value: `[value]` was a
number, so a fullness that was not read arrived as `value ?? 0` and was drawn as an empty bar.

## Shipped in 7.23.0 (2026-11-18)

### Against the acceptance

| asked                                                       | measured                                                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| an errored grid and an empty grid are visibly different     | a different glyph **and** a different tone — the error reads **4.74:1** against the surface, the empty one is the neutral folder                 |
| …and audibly different                                      | the error carries exactly **1** `role="status"` that says something; a grid that simply found nothing carries **0**                              |
| rows passed alongside an error stay visible under a band    | **2** rows kept, the band **1** line tall (30px), text at **14.21:1** on its own fill                                                            |
| the footer's refresh stays available                        | "Refresh data" present and **enabled** in all three cases — the one control that can undo the error is not taken away by it                      |
| announced once, as a status, not per row                    | one region, one sentence, named by `labels.readFailed`                                                                                           |
| `strct-progress` with `null` is visibly different from `0`  | the unread track draws **0** fills and is textured on **4.9%** of its own width against **0.2%** for a measured zero — **24×**, floor 10× and 2% |
| …and never takes the status colour                          | `resolvedStatus` returns `neutral` for an unread bar even with `status="critical"` set                                                           |
| `aria-valuenow` omitted, `aria-valuetext` carrying the text | `aria-valuenow` / `valuemin` / `valuemax` all absent, `aria-valuetext="Not read"`; a real zero keeps `aria-valuenow="0"` and prints `0%`         |
| existing consumers see no change                            | 1448 specs green; `value` still takes a number, `emptyText` still draws when there is no error                                                   |

Measured by `scripts/read-integrity.mjs` (**12** checks, both themes) and held by **11** specs.

### Two things measured differently than expected

- **The hatch is measured as a texture, not as ink.** The first attempt counted pixels differing
  from the page and got **99.7% for both** tracks — of course: a track differs from the page
  everywhere, whatever is drawn in it. The measurement that matches the claim counts
  pixel-to-pixel transitions along the track's middle: a flat track has none, a hatched one does.
  That is also the reason for the hatch: a reader who cannot see the hue still has the difference.
- **Every tint is composited before its contrast is read.** The band's fill and the track's ground
  are `color-mix(…, transparent)`, and reading them as opaque gave 4.43:1 for a band that actually
  measures **14.21:1**, and 1.00:1 for text on its own ground.

### What the report did not have

- **The threshold for the hatch is the ratio, not an invented number.** The claim is that one
  track is textured and the other is not, so the rule is **10×** with a 2% floor — the floor only
  so that a hatch too faint to see could not pass on the ratio alone.
- **CDP does not serialise `aria-valuetext` for a `progressbar`** (verified in 7.16.0 against a
  hand-made control div), so the gate reads the attribute and asks the accessibility tree only
  whether a _value_ is exposed. It is not.
