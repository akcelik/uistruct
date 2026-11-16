# The inventory tree's state, reviewed — and the axes that came out of it

**Internal review, 2026-11-16**, asked for from four seats: the creative
direction, a vSphere engineer, a senior system administrator and a senior
operations administrator. It is not a consumer FR; it is the review HyperStruct's
inventory tree had been asking for in its own code comments.

## What was there, measured

Read back from what Chrome laid out, on the showcase's own `tree-state`
fixture, before anything was changed:

|           |                                                                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Row       | **27.5px**, label **13px**, and the same ink on every row — nothing receded, nothing lifted                                                                                                                                                |
| Marks     | icon **16px**, health badge **8–11px**, mode tile **9×9px**; the glyph inside the badge disc is `clamp(6px, 68%, 10px)` — about **6px**                                                                                                    |
| Weight    | maintenance tile **12.43:1** against the page, critical badge **4.42:1** — a mode an operator _chose_ outweighed a fault the system _reported_ by **2.8×**; the "entering maintenance" tile measured **1.07:1**, readable only by its ring |
| Slots     | **one** badge. HyperStruct's own mapping: _"strct draws ONE badge per icon, so the signals take turns (health outranks lifecycle)"_                                                                                                        |
| So        | an alarmed VM lost its power state, and an unreachable host was drawn `badge="off"` — **"switched off" and "not answering" were the same mark**                                                                                            |
| Overflow  | what did not fit went into the label: `esx01 (Maintenance Mode)`, `vm (Not reachable)`, `(Not managed)`, `(Reboot required)` — the one string the type-ahead matches                                                                       |
| Collapsed | a cluster with a critical child carried **no mark at all**                                                                                                                                                                                 |
| Heard     | `aria-description` was already right ("In maintenance, Warning") — the words existed for the ear, not for the eye                                                                                                                          |

## The four seats

- **Creative direction.** All of the state lived in two corners of a 16px
  glyph, in 6px glyphs, and the hierarchy was upside down. Nothing reached the
  row, so scanning 300 rows meant hunting 8px corners rather than reading rows.
- **vSphere engineer.** State is not one axis. Reachability (connected / not
  responding / disconnected / orphaned / inaccessible), administrative mode
  (maintenance / standby / quarantine / lockdown), power (on / off /
  suspended) and health (alarms) are orthogonal, and a single slot makes them
  queue. vCenter's own answer is at the row level: an object it cannot reach
  is greyed, and its alarm overlay stays.
- **System administrator.** A closed parent hid everything under it. "Why is
  this marked?" had no answer on the row. And writing state into the label
  broke search, type-ahead and copy-paste.
- **Operations administrator.** At 02:00 the exception is what matters, and
  the normal case was the noisiest thing on the screen: every healthy running
  VM drew a green badge. An object in three states could only show one of them.

## Three alternatives, drawn

1. **Three axes + row tone** — reach on the row, mode and power in the icon's
   two corners, health at the row's end; the normal case draws nothing.
2. **A state strip** — a kind-only icon and every axis in a fixed, aligned
   column at the row's end, scannable straight down.
3. **An exception word** — no marks at all; every row that is not nominal
   carries one plain word, with a filter and a legend.

The operator picked **1**, with the note that the symbols and icon shapes could
change — which is what the weight fix below is.

## Shipped in 7.18.0 (2026-11-16)

`StrctTreeNodeData.reach | power | health | rollup`, the state marks redrawn
on the glyph, and `strct-icon` given the structure Clarity's `cds-icon` has.

### The two references

- **VMware Clarity (`cds-icon`).** Read from its own API page and source:
  `shape`, `size` (`xs|sm|md|lg|xl|xxl` or a number), `direction`, `flip`,
  `solid`, `status` (`neutral|info|success|warning|danger` — it colours the
  glyph's own fills and outlines), `inverse`, and one `badge`
  (`…|inherit|warning-triangle|inherit-triangle`) drawn in the **top-right**
  corner, with `--color` and `--badge-color` as its CSS hooks. What this
  library lacked was the first-class one: `status`. It has it now, plus
  `badge="inherit"` and the t-shirt sizes, under this library's own prefix
  (`--strct-icon-color`). `solid` is not adopted: the set is a stroke set and
  has no filled variants to switch to, and claiming the attribute without
  them would be a lie.
- **The vCenter inventory tree.** Its rule is the one the first draft broke:
  **the state is on the object, not beside it.** A mark at the row's end
  aligns beautifully in a gate and reads as a separate column to an operator.
  Everything moved onto the glyph — health in the top corner, power and mode
  in the bottom one, the rollup as a count on the parent's own glyph.

### Against the review

| asked                                  | measured                                                                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| the axes stop taking turns             | a VM that is **off**, **critical** and on a host **nobody can reach** draws all three at once, all on its glyph                              |
| the normal case is silent              | a reachable, running, quiet object carries **0** marks and no description                                                                    |
| legible on a 1920×1080 screen          | no mark below **11px** on an **18px** glyph (they were 8–11px on a 16px one), ringed in 2px of the surface, with nothing written inside them |
| the marks belong to the object         | **0** of them stand off the glyph                                                                                                            |
| a receded row is still readable        | **5.13:1** against **17.49:1**, the glyph at **0.5** and cut, while its marks keep full weight                                               |
| told apart without hue                 | triangle ink at **61.0%** of its box, diamond at **52.3%**                                                                                   |
| the mode no longer outweighs the fault | the alarm carries **93%** of the tile's ink-weight; the tile's edge is **5.13:1** where it was **12.43:1**                                   |
| a closed node says what is under it    | `critical 2` and `warning 3` on its own glyph; the open one stops repeating its children                                                     |
| the name is still the name             | Chrome names the row "HV-NODE-02" and _describes_ it "In maintenance, Warning"                                                               |
| no less of the inventory on screen     | the row is still **27.5px** — the glyph grew inside it, not past it                                                                          |

### What the review did not have

- **"Prominence" is not contrast.** The first gate compared edge contrast and
  called the weight fixed at 5.97:1 against 4.22:1 — which still said the mode
  was louder. What an eye weighs is how much ink a mark puts on the row _and_
  how far that ink sits from the surface, so the gate measures ink-weight over
  the mark's own box.
- **A tree is drawn on a pane, and the fixture was not.** The barrier tile is
  filled so the glyph beneath does not bleed through it; on the showcase's
  page surface that fill counted as ink and made the tile look three times
  louder than it is in an app. The fixture now puts the tree in the pane a
  real inventory has.
- **The first draft put the alarm at the row's end** — one aligned column, the
  easiest thing in the world to scan and the wrong place for it. An operator
  reads an object, not a column: the mark has to be on the thing it describes.
  That came back as "the symbols must not stand apart from the icons, you
  should have taken the vCenter tree as the reference", and it was right.
- **Nothing was written inside the marks.** A tick, a `!` or a `×` inside an
  8px disc is three strokes in six pixels; at 1920×1080, viewed from a normal
  distance, it is a smudge. The silhouettes — circle, triangle, diamond —
  carry the state on their own, which is also what survives a greyscale render.
- **`reach` dims the glyph, not the marks on it.** An alarm on an object
  nobody can reach is the loudest thing on the row; dimming the badge with the
  drawing underneath it would bury the news with the box.
- **Nothing of the old model was removed.** An explicit `badge` still wins,
  still draws where it drew, and suppresses the new power mark, so a tree
  written against the single slot keeps working.
