# FR-71-01 — Network diagrams: draw the cable, not the box

> **CLOSED, 2026-11-04.** Shipped in **v7.7.0**.

**Filed by:** the maintainer, 2026-11-04, against **7.6.1**, as a reference screenshot of a Network
Health screen (cluster PROD-CL01: four hosts, two top-of-rack switches, eight links, four of which
disagree) with one line: _"UIStruct should be able to draw network diagrams like this, and better."_

> **SHIPPED in v7.7.0** as a new component, `strct-wiring`, with
> `scripts/wiring-map.mjs` (**49 checks**, two widths × both palettes) wired
> into CI, 15 specs, and two visual baselines.

## What was actually missing

The reference is a **wiring map**, and the library had no way to draw one.

`strct-flow`'s `fan-out` / `tree` already draws boxes in columns with connectors measured from the
rendered DOM, and that is the right component for a topology whose endpoints are whole devices — a
blast radius, a replication chain, a switch's members. But every question a fabric review actually
starts from has a **port** at each end:

| The question                                  | The two endpoints                               |
| --------------------------------------------- | ----------------------------------------------- |
| Is the storage network cabled symmetrically?  | host NIC port ↔ switch port, as LLDP heard them |
| Why does this LUN only have two paths?        | initiator port ↔ target port                    |
| Which patch did the field engineer get wrong? | panel A port ↔ panel B port                     |
| Is this SET team split across both switches?  | vNIC ↔ pNIC ↔ switch port                       |
| Why is this leaf's uplink one-legged?         | leaf uplink ↔ spine port                        |

A box-level diagram cannot answer any of them. In `strct-flow` every edge leaves its node's vertical
centre, so eight cables between two 2-port hosts and two 4-port switches collapse into two lines.
Measured on the shipped 7.6.1 geometry, anchoring a cable on the card instead of the port puts it
**63.25px** away from the port it is supposed to land on in the case this was filed against.

## What shipped

`strct-wiring` — columns of devices, each device's ports in order, one cubic per cable drawn between
the two **port rows**. It leaves the device card's inline edge at the port's own centre line and
arrives at the other port's, with both control points on those centre lines, so the cable leaves and
arrives level instead of stabbing the card.

Measured in Chrome, on the filed case (6 devices, 16 ports, 8 cables), at 1600px light and 1240px
dark:

|                                             | Measured                                  |
| ------------------------------------------- | ----------------------------------------- |
| \|cable end y − port centre y\|             | **0.00px**, worst of 16 endpoints         |
| \|cable end x − device card edge\|          | **0.00px**                                |
| rise over the first and last 6px of a cable | **0.06px** (1600px) · **0.19px** (1240px) |
| label pairs overlapping                     | **0** of 6                                |
| labels drawn over a device                  | **0** of 6, across both maps              |
| label centre to its own curve               | **< 1px**, all 6                          |

## Where it goes past the reference

Six things, each of them a defect in the reference read as a specification.

1. **The labels are placed, not positioned.** In the reference the four pills are hand-placed, and
   two of them nearly touch. Here each label is measured at its rendered size and slid along its own
   cable until it clears every label already placed — worst severity first, so a critical label keeps
   the middle of its run and an agreeing one moves. The gate asserts **0** overlapping pairs.

2. **A label never covers a device.** The devices occupy bands of x; what is left between them are
   clear strips, and a label lives in the widest strip its own cable crosses. This matters most for a
   cable that _skips_ a column — a host cabled straight into a spine — whose midpoint is a device
   card. Placed at the midpoint, that label covers the leaf by **388px²** at 1600px and **1124px²** at
   1240px; placed in its strip, by 0.

3. **A label is bounded by the run it lives in**, the same rule a bar chart's label follows for its
   band since 7.6.1: it ends in an ellipsis inside its strip (full text on hover and in both ports'
   accessible text) rather than spilling, and below 44px of room it is not drawn at all.

4. **Selecting a cable isolates it.** The reference tints the two port rows and leaves the other
   seven cables at full strength, which is why the selected one is hard to find. Here the unselected
   cables drop to **0.3** and their dots to 0.4 while the selection keeps full strength and a thicker
   stroke. Isolation acts on the drawing and **never on the words**: a first attempt dimmed the labels
   and port rows to 0.78/0.72 and the gate caught a warning label at **3.31:1** against a light
   surface, under the 4.5:1 it needs. Every label and every port reading now measures ≥ **4.5:1** in
   both palettes while another cable is selected (worst: 4.62:1).

5. **Both ends are marked on the edge the cable uses.** The left column's port gets its rail on its
   inline end, the right column's on its inline start, so the two rails and the curve between them
   read as one gesture rather than three marks.

6. **The keyboard follows the cable.** The reference's map is a picture. Here the map is one tab
   stop: ↑ / ↓ walk a column's ports, **→ and ← follow the cable to the port at its far end** — which
   is the question the picture exists to answer — Home / End jump to the column's ends, and Enter or
   Space selects the link the port is on. Clicking the line does the same thing and is a redundant
   pointer affordance, so the paths take a pointer but never a tab stop and the `<svg>` stays
   `aria-hidden`; each port carries the sentence the picture was drawing ("→ tor-b Eth1/14, critical —
   PFC 3 ≠ 4", or "not wired"). A link naming a port that is not on the map is neither drawn nor
   announced.

Two more things fell out of doing it properly: **N columns**, with a device in a middle column
anchoring its downlinks on one edge and its uplinks on the other; and **columns derived from the
cabling** when no device declares one, so hosts → leaf → spine comes out of the links.

## What the gate measures, and what it caught

`scripts/wiring-map.mjs` reads everything back from what Chrome drew — endpoints from
`getPointAtLength` on the rendered `<path>`, boxes from `getBoundingClientRect`, dimming from
`getComputedStyle`, the keyboard from real key events — at two widths and in both palettes, because
one width cannot tell a measurement from a constant that happens to fit and one palette cannot tell a
contrast failure from a token.

It failed four times during the work, and two of the four were the gate's own fault, which is worth
recording:

- **Real.** Dimming the labels put a warning tone at **3.31:1** in the light palette. The rule
  changed: isolation recedes the lines, not the words.
- **Real.** A label on a cable that skips a column covered the device in between, by up to
  **1124px²**. Placement moved from "the middle of the cable" to "the middle of a clear strip the
  cable crosses".
- **The gate's own.** "4.0px off its own cable" was the sampling grid, not the label: 41 samples of a
  600px curve sit 15px apart, so a label exactly on the curve reads as up to 7.5px off it. It now
  measures distance to the segments between samples.
- **The gate's own.** An element's `opacity` composites the whole layer, glyphs included, over what is
  behind it; reading the text as composited over its own already-dimmed background folds the backdrop
  into the ink twice and understated every ratio.

## Deliberately not done

- **The checks-by-node matrix** in the reference's lower half — a categorical status grid with
  "not judged" and "not on a node" states. `strct-heatmap` is a numeric density ramp and is the wrong
  component for it. It is not a diagram, so it is not part of this ask; if it is wanted it should be
  filed as its own.
- **Bundling LAG members into one cable.** Four links between the same two devices are four cables
  today. Worth doing when a real screen has enough of them to be unreadable; nothing has yet.
