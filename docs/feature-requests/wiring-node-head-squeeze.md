# BUG-72-03 — A long device sublabel squeezes the device's name to one letter a line

**Filed by:** HyperStruct, 2026-11-05, against **7.7.0**. Seen by the operator on a real cluster on the
first day (Cluster ▸ Network Health, HyperStruct O458), then reproduced and measured in Chrome.

## What the operator saw

A host card in `strct-wiring` whose name ran **down the card one letter a line** — `P D A S H P V G E N
C 2 0 1` — beside its sublabel on one line, and the map 2.4× taller than its content (1289px against
528px once the sublabel is gone).

The case: node `PDASHPVGENC201`, sublabel `SET DC2.mVS.Prd.Int.Mng.1, SET DC2.mVS.Prd.Int.Gen.1` (the
node's two SET teams). Nothing unusual about either: bank host names are 14 characters, and a
switch's sublabel can be a model plus an FQDN.

## Measured (Chrome, 1600px and 1100px, same numbers at both)

|                            | 7.7.0                               |
| -------------------------- | ----------------------------------- |
| `.strct-wiring__nodehead`  | 338px wide                          |
| `.strct-wiring__nodesub`   | **294px**, one line                 |
| `.strct-wiring__nodelabel` | **0 × 273px** — one glyph a line    |
| map height                 | 1289px (528px without the sublabel) |

## Why

```css
.strct-wiring__nodelabel {
  min-width: 0;
  overflow-wrap: anywhere;
} /* min-content: one glyph */
.strct-wiring__nodesub {
  margin-inline-start: auto;
  white-space: nowrap;
} /* min-width: auto */
```

The sublabel is `nowrap` with the default `min-width: auto`, so it cannot shrink below its full
width. The label has `min-width: 0` and `overflow-wrap: anywhere`, so its min-content is a single
glyph. When the head runs out of room, flex takes all of it from the label. The column's own cap
(`--strct-wiring-col-max`, 340px) makes this the normal case, not an edge case.

## Ask

The name is the device's identity and must win over its sublabel:

- the label never shrinks below its own words (e.g. `flex: 0 1 auto` with `overflow-wrap: normal`,
  ellipsis as a last resort), and
- the sublabel gives way first — either it wraps to its own line under the label (`flex-wrap: wrap`
  on the head) or it ends in an ellipsis with the full text in `title`.

A gate case with a 14-character node name and a ~50-character sublabel at the column cap would catch
it; the 49 checks of `wiring-map.mjs` all use short sublabels ("SETswitch", "Nexus 93180 · LLDP").

## HyperStruct meanwhile

Sets no `sublabel` on any device (the SET teams are shown under Selected link). Will restore the
team names once this ships.
