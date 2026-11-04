# FR-69-04: glyphs a backup product cannot do without

**Filed by:** HyperStruct, 2026-11-04, on strct **7.4.0**, while redesigning HyperStruct Backup ▸ Jobs and
Repositories (decision O449, mockups first)
**Reach:** HyperStruct Backup's navigation, its Jobs, Restores, Repositories and Policies pages, and Site
Recovery's copies. Any consumer that protects data needs most of these.
**Shape:** new glyphs in the 16-unit set, drawn with the one pen (FR-68-01), each with a name a call site
can guess.

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
