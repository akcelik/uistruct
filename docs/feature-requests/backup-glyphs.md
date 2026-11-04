# FR-69-04: glyphs a backup product cannot do without

**Filed by:** HyperStruct, 2026-11-04, on strct **7.4.0**, while redesigning HyperStruct Backup ▸ Jobs and
Repositories (decision O449, mockups first)
**Reach:** HyperStruct Backup's navigation, its Jobs, Restores, Repositories and Policies pages, and Site
Recovery's copies. Any consumer that protects data needs most of these.
**Shape:** new glyphs in the 16-unit set, drawn with the one pen (FR-68-01), each with a name a call site
can guess.

> **SHIPPED in v7.5.0.** All ten, plus the optional `scrub`. 194 glyphs → 205,
> each grouped beside its nearest neighbour on the icon page as asked, and
> gathered again in a 14px row (`#data-protection`) because that is the size
> the question "can these two be told apart" has to be answered at.
>
> **`database` was not added**, and the ask's own condition is why: it offered
> it "if `storage` is not already one". It is — `storage` is an ellipse over a
> cylinder body. One glyph per meaning.
>
> **The acceptance about telling a pair apart needed a new instrument.** "It
> looks different" is the `surfaces.size > 1` mistake of 7.4.0 one domain over,
> so `scripts/glyph-distinct.mjs` renders each glyph alone at 14px at a 4×
> device scale and compares it with the one it has to differ from.
>
> The floor is not invented, and it is not the weakest thing already in the set
> either. The closest accepted pair is `lock`/`unlock` at **2.28%**, and it is
> the closest for a reason: those two differ by a rotated shackle and nothing
> else. A **new** pair is held to twice it, **4.56%**.
>
> That rule exists because of what happened first. The first `backup`/`restore`
> put the arrow inside the box's upper half, so flipping it moved the head 3.5
> units: **2.32%**. With the floor at the weakest accepted pair the gate
> _passed_ it, by four hundredths of a percent. Reading the number was what
> rejected the drawing, not the gate — so the drawing was redone (the arrow now
> spans the whole body: **5.26%**, the band of `eye`/`eyeOff` at 6.38%) and the
> floor was doubled, so the gate rejects it too. Verified by putting the first
> drawing back: it exits 1 and names the number.
>
> Two guard pairs were added at the same time, because an arrow-over-a-box could
> have collapsed into `download`/`upload`; measured, it does not (30.33% and
> 27.61%).
>
> The pen holds: `control-height.mjs` reads **639** rendered glyphs, up from
> 606, every one at **1.40px**.

## What a reader sees today

HyperStruct Backup borrows glyphs that mean something else:

| Where                                                         | Today      | Reads as                                        |
| ------------------------------------------------------------- | ---------- | ----------------------------------------------- |
| Restores (nav, "Restore VM…")                                 | `undo`     | undo the last edit                              |
| Jobs (nav, "Back up now")                                     | `queue`    | a task queue                                    |
| Repositories (nav)                                            | `rack`     | a server rack, which is the host, not the store |
| Policies (nav, a backup window)                               | `calendar` | a date, with no time of day                     |
| The lock on a recovery point ("30 days, cannot be shortened") | `lock`     | any lock, the same as a locked account          |

The lock is the most important fact on a bank's backup screen, and today it looks like a login lock.

## Ask (in order of use)

| Name            | Drawing                                                                        | Used for                                                             |
| --------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `backup`        | an archive box with an arrow going in                                          | Jobs; "Back up now"; a backup run                                    |
| `restore`       | the same box with an arrow coming out (or a counter-clockwise arrow out of it) | Restores; "Restore VM…"; a restore session                           |
| `lockTimed`     | a padlock with a small clock on its body                                       | an immutable recovery point, the retention lock, WORM                |
| `calendarClock` | a calendar with a clock at its corner                                          | a backup window, a schedule, "Next window"                           |
| `skip`          | skip-forward: a triangle and a bar                                             | "Skip" on a failed session; a skipped step                           |
| `dedup`         | two offset blocks merging into one                                             | deduplication on/off                                                 |
| `compress`      | a box with arrows pointing inward                                              | compression level                                                    |
| `fingerprint`   | a fingerprint                                                                  | a certificate pin, a key's fingerprint (the key register lists them) |
| `dualControl`   | two people and a check                                                         | "needs a second person": early deletion, four-eyes approval          |
| `replicate`     | two stores with an arrow between them                                          | a copy at the secondary site                                         |

**Optional:**

- `scrub`, a store with a magnifier, for "Last scrub" and a pool verify.
- `database`, a cylinder, if `storage` is not already one. HyperStruct could not tell from the type
  file alone.

## Acceptance

- Each glyph is on the icon page beside its nearest neighbour (`backup`/`restore` beside `archive`;
  `lockTimed` beside `lock`; `calendarClock` beside `calendar`).
- Each passes the pen gate (1.40px at every size) and stays legible at 14px, the size used in the
  `sm` toolbar.
- `restore` and `backup` are told apart by the arrow alone, not by colour.
- `lockTimed` stays distinct from `lock` at 14px.

## HyperStruct meanwhile

The mockups use the borrowed glyphs above. Nothing will be hand-drawn in the app: once the glyphs ship,
HyperStruct swaps the names in `product-nav.ts` and on the buttons.
