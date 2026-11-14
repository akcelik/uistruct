# FR-80-02 — `strct-steps appearance="rail"`: a run's steps as one flat rail

**Filed by:** HyperStruct, 2026-11-12, against **7.14.0**. The operator chose this look for the host
update run card (O507, "pick A") over pills, dots and a stage matrix, after the pills read as
overlapping (BUG-80-01). HyperStruct draws it by hand until this ships, marked in
`remediation-run.ts`.

## What a reader sees today

`appearance="pills"` gives each step an outlined chip of its own width. Five chips of five widths in
five colours read as five objects of equal weight, the sequence only in the connector; at `dense`
they sit 4px apart. In a run of several hosts the chips of one row do not line up with the next,
so "which host is at which step" cannot be read down a column. `dots` lines up but drops the names.

## Ask

A third look for the same `steps` input:

- **The rail.** One segment per step, equal widths, a small fixed gap between segments (no
  connector), one flat height (about 6px); rounded only at the rail's two ends. The state is the
  segment's fill: `done` the success tone, `active` the accent (with a texture that tells it from
  `done` without colour — the house rule that colours told apart also differ in more than hue),
  `failed` critical, `blocked` warning, `pending`/`planned` the track, `skipped` a dashed track.
  The active step's emphasis stays inside its segment: nothing scales or grows past it.
- **Names under the rail**, one per segment, ellipsised, in the state's text tone (`active` and
  `failed` heavier). A `names` input: `under` (default) | `none` — `none` for a rail that sits under
  a shared row of names.
- **A names-only row** for that shared heading — e.g. `appearance="rail" names="only"`, or a
  separate `strct-steps-header` — laid out on the same grid, so the names stand exactly over a
  column of rails below it.
- Every step stays a list item with its name and state for assistive tech (what `pills` says
  today), and a step's `description` stays its tooltip.

## Acceptance

- Five steps in a 600px cell: five equal segments, gaps equal, no painted pixel of a segment inside
  its neighbour's box at 1×, 1.25× and 2×.
- A names-only row over three rails: each name's box spans exactly its segment's column (±0.5px).
- `active` and `done` are told apart in a greyscale render.
- The list's accessible name and each step's "name: state" read as they do for `pills`.
