# FR-83 — The tree can say "not known" and "not current"

**Filed by:** HyperStruct, 2026-11-17, against **7.20.0**, from its avionics-grade review (O519,
findings UI-N1 and UI-N7: display integrity).

## The case

HyperStruct's inventory tree draws each host and VM with the 7.18 state axes. Two things the
appliance knows cannot be drawn today, so the tree says more than it knows:

| what the appliance knows                                    | what the tree can draw today         | what the operator reads |
| ----------------------------------------------------------- | ------------------------------------ | ----------------------- |
| the alarms of a host were never read, or the read failed    | `health: 'ok'` (no mark)             | "healthy"               |
| the host's last reading is 20 minutes old (`stale`)         | `reach: 'ok'` (row drawn normally)   | "reachable now"         |
| the browser lost the appliance 3 minutes ago (no new reads) | every node as last read, fully drawn | "this is live"          |

In an avionics display the rule is that a value that is not current must look not current, and a
value that is not known must look not known; neither may look normal. HyperStruct already says this
in its grids ("Not read", "Unknown"), but the tree, the screen an operator scans first, cannot.

## Ask

### FR-83-01 — `health: 'unknown'`

`StrctTreeHealth` gains `'unknown'`: the object's health could not be judged. Drawn as a mark in
the glyph's health corner that is neither the warning nor the critical shape (for example a hollow
or question mark in the neutral tone), so it can never be mistaken for `ok` (no mark) nor for an
alarm. `stateWords` gains its word ("Health unknown"), and `aria-description` says it.

Rollups do not count `unknown` as a warning; a closed node may say how many children are unknown in
its description.

### FR-83-02 — `reach: 'stale'`

`StrctTreeReach` gains `'stale'`: the object was reachable at its last reading, but that reading is
older than the consumer's threshold. Drawn like `unreachable` in strength order below it: the row is
muted (less than `unreachable`), the glyph keeps its other axes, and the description says
"Not current". `unreachable` and `orphaned` win over `stale`.

### FR-83-03 — a tree-wide "not current" state

`strct-tree` gains an input, for example `[stale]="'Not current since 14:02'"` (a string or null).
When set, every row is muted the way `reach: 'stale'` mutes one, the axes keep their last value, and
the caption is shown once at the top of the tree (and read once by a screen reader, not per node).
HyperStruct sets it when it has had no successful inventory read for longer than its threshold;
a band in the shell says the same thing for the whole page.

## Acceptance

- `unknown` health is visibly different from no mark and from both alarm shapes, at 18px, in light
  and dark themes, and meets the same contrast as the other health marks.
- A `stale` row and a tree under `[stale]` are visibly muted but still readable (the operator must
  still find the object), and keep focus and selection behaviour.
- `stateWords` and `aria-description` carry the new words; existing consumers that never set the new
  values see no change.
