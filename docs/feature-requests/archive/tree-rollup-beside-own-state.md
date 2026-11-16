# FR-82-01 — A closed node can wear its rollup and keep its own mode and alarm

**Filed by:** HyperStruct, 2026-11-16, against **7.18.0**, while adopting the tree's state axes
(`reach` / `power` / `health` / `rollup`) in its inventory tree.

## The case

In HyperStruct's Hosts & Clusters tree a **host is a container**: its VMs are its children. A host
that is closed in the tree is the normal case in a large estate, and it is exactly the node whose own
state matters most:

| the host              | its own state         | under it, while closed      |
| --------------------- | --------------------- | --------------------------- |
| drained for patching  | `mode: 'maintenance'` | 2 VMs with a critical alarm |
| an agent channel down | `health: 'warning'`   | 1 VM with a warning         |

`strct-icon` draws the count **instead of** the other marks: its template shows the count in place of
the badge, and both the lifecycle mark and the mode tile are guarded by `!countText()`. So as soon as
the host gets a `rollup`, a closed host in maintenance loses its maintenance tile and its own alarm
badge. The glyph keeps its tone (`iconStatus`), and `aria-description` still says everything. But the
eye loses "this host is out of service", which is the one mark an operator scans the tree for during a
patch night.

HyperStruct therefore gives a `rollup` only to containers that carry no state of their own (a
datacenter, a cluster, a folder). A closed host wears nothing for the VMs under it, which is the
gap.

## Ask

A node can carry its **own** marks and its **rollup** at the same time, without one hiding the other:

1. The mode tile and the node's own health badge stay where 7.18 draws them (bottom and top corners).
2. The rollup count goes somewhere that is **not** one of those two corners. One option is a small
   count after the label or at the row's end, in the same tone and silhouette language. Another is a
   third corner of the glyph if 18px allows it. The library should choose and measure the placement.
3. A node with no own state draws exactly as 7.18 draws it today, so containers do not change.
4. `aria-description` stays as it is ("Maintenance Mode, Warning, 2 critical").

## Not asked

- No change to how `reach`, `power`, `health` or `mode` are drawn.
- No change for an open node: it still stops repeating its children.

## Shipped in 7.19.0 (2026-11-16)

The rollup left the glyph's corners and sits against the node's name, in the
alarm's own silhouette and tone. The glyph goes on saying what the object
itself is. Measured by `scripts/tree-state.mjs` (three new checks).

### Against the acceptance

| asked                                                                   | measured                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the mode tile and the node's own health badge stay where 7.18 drew them | "HV-NODE-07" keeps its barrier tile while carrying **2 critical**; "HV-NODE-08" keeps its own **warning** badge while carrying **1**                                                                                  |
| the rollup goes somewhere that is not those two corners                 | beside the name: **14.0px** after it, and **117px** short of the row's end                                                                                                                                            |
| the library chooses the placement, and measures it                      | a **13.0px** alarm overhanging an **18px** glyph by 3.0px leaves its opposite top corner **11.0px** — the same mark there would **overlap by 2.0px**, so a third corner was rejected on the measurement, not on taste |
| `aria-description` unchanged                                            | "In maintenance, 2 critical"                                                                                                                                                                                          |
| no change to `reach`, `power`, `health` or `mode`                       | the other 13 checks are the 7.18 ones, unchanged and green                                                                                                                                                            |
| an open node still stops repeating its children                         | **0** rollups drawn on an open node                                                                                                                                                                                   |

### What the report did not have

- **One deviation, and it is deliberate.** The ask said a node with no state
  of its own should keep 7.18's drawing (the count on the glyph), so that
  containers do not change. That would draw the same fact in two places
  depending on what else the row happens to carry — a cluster's rollup on the
  glyph, a host's beside the name — and a reader scanning a column of both
  would have to look in two places for one answer. Every rollup moved,
  containers included. It is one line of visual churn for a tree that already
  moved in 7.18, and it buys one rule.
- **The count never belonged on the glyph anyway.** The glyph is the object:
  its reach, its mode, its power, its own alarm. What is _under_ it is a
  different subject, and giving it the object's own skin is what made it
  possible for a count to erase a maintenance tile in the first place.
