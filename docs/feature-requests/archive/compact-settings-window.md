# FR-79-01…03 — a compact settings window: a menu line that carries its value, and a dense field row

**Filed by:** HyperStruct, 2026-11-11, against **7.13.0**. VM ▸ Edit Settings (O497 §"Seçim A", the
operator's pick) is a `strct-section-menu` beside a column of `strct-field layout="inline"` rows, in a
`strct-modal size="lg"`. The operator chose a compact form of it: every menu line says its value, the way
a hypervisor's own settings tree does ("Processor — 8 vCPU", "Memory — 64 GB static", "Hard drives —
2 · 628 GB"), and a row of settings takes about one line. Neither is reachable with the inputs the two
components have today. No app-side workaround is in place: the window ships without menu values until
FR-79-01 lands.

## Reach

Any master/detail settings surface: VM settings, host configuration, cluster configuration (all three in
HyperStruct use `strct-section-menu`), and every long form of inline fields — the settings dialogs are
where an operator compares many values at once.

## What a reader sees today

- **The menu says names, not values.** To see a VM's processor count, memory and disks the operator
  opens three sections one by one. `StrctMenuLink.badge` is the only trailing text, and it is a coloured
  chip (`accent`, `success`, `warning`, `critical`): sixteen accent chips down a menu would read as
  sixteen alerts. And `badge` and `dot` exclude each other (`@if badge … @else if dot`), so a line
  cannot carry its value _and_ the "unsaved" dot.
- **A menu line is 31px.** Sixteen sections plus two category heads take ~560px of a 760px window.
- **An inline field row is 63–87px.** The separator between two inline fields is `margin + padding`
  of `--space-3` each (24px), and the hint sits in the label column under the label, so a hint longer
  than the label column wraps to a second and third line.

## Measured

Chrome, 1600 × 1000, dark palette, `strct-modal size="lg"`, HyperStruct's VM Settings with a faked API:

|                                        | measured                                     |
| -------------------------------------- | -------------------------------------------- |
| `.strct-sm__item` height               | **31px** (7px padding each side)             |
| inline field height (Security section) | **63, 74, 69, 69, 69, 87, 69px**             |
| pitch between two inline fields        | **75–99px**                                  |
| label `padding-block-start`            | 9px                                          |
| `--strct-field-label-w` (set to 190px) | honoured — the one density lever that exists |

With every hint shortened to fit one line of a 190px label column, the rows are still 63px+: the 24px
separator and the label/hint stack set the floor.

## Ask

1. **FR-79-01 — `StrctMenuLink.value?: string`.** Muted trailing text (`--t2`, tabular figures), after
   the label and before `trailingIcon` / `badge` / `dot`, ellipsised before the label is. It **coexists**
   with `dot` and with `trailingIcon` (a line can say "8 vCPU", carry the lock of "greyed until the VM is
   off" and the dot of "unsaved"). An active item shows it in the active tone. It is part of the item's
   accessible name ("Processor, 8 vCPU").
2. **FR-79-02 — `strct-section-menu` `density: 'comfortable' | 'compact'`** (default `comfortable`,
   unchanged). `compact`: 26px items, 22px category heads.
3. **FR-79-03 — `strct-field` inline `density: 'comfortable' | 'compact'`** (or a provider default, as
   `provideStrctDatagridDefaults` does), `compact` meaning: the separator between two inline fields is
   one `--space-2` (8px) in total, the label sits on the control's baseline, and the hint — when it
   does not fit the label column on one line — goes to the value column under the control instead of
   wrapping under the label. A row with a 28–34px control and a one-line hint is then ≤ 44px.

## Acceptance

- A `value` beside a `dot` and a `trailingIcon` on one line, all three visible, in a 236px menu, measured
  in Chrome; the value never pushes the label to fewer than 8 characters before both ellipsise.
- Contrast of `value` ≥ 4.5:1 on the menu's surface in both palettes, and in the active tone.
- `density="compact"`: item height 26px ± 1, in both palettes; no change for `comfortable`.
- Inline `strct-field` `compact`: pitch between two fields with a 34px control and a one-line hint ≤ 44px;
  a long hint never wraps under the label; `aria-describedby` still names the hint.
- No new tab stops.

---

## Shipped in 7.14.0 (2026-11-12)

`StrctMenuLink.value`, `strct-section-menu [density]`, `strct-field [density]`
and `provideStrctFieldDefaults`. Every number below is read back from what
Chrome laid out, by `scripts/settings-density.mjs` (29 checks, both palettes,
and the contrast sweep over all six).

### Against the acceptance

| asked                                                               | measured                                                                                            |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `value` + `dot` + `trailingIcon` on one line, in a 236px menu       | all three drawn on one **26px** line in a **236px** menu ("Processor")                              |
| the value never cuts the label below 8 characters                   | the value ellipsises, no label with it; shortest label still shows **11.4 characters**              |
| `value` ≥ 4.5:1 on the menu's surface, both palettes, active tone   | **4.82:1** at its weakest of **180** readings (3 palettes × 2 themes), weakest case the active line |
| `density="compact"`: 26px items, ±1, both palettes                  | **26px** items and **22px** heads, exactly, in both                                                 |
| no change for `comfortable`                                         | **31px** items, **34px** heads, **72.8 / 85.8px** pitch — the numbers measured before the change    |
| inline `compact`: pitch ≤ 44px with a 28–34px control + 1-line hint | **42px** and **43px** (a 32px control, a 35px row) — **72.8px** before                              |
| a long hint never wraps under the label                             | moved to the control's column (2 lines there); the hints that fit stay under the label              |
| `aria-describedby` still names the hint                             | 3 compact hints and 3 comfortable ones, the moved one among them                                    |
| no new tab stops                                                    | **30** for 30 enabled menu lines, **7** for 7 controls — one each and nothing else                  |

Also measured: the accessible name is taken from **Chrome's own accessibility
tree**, not from the attribute the library writes, and it computes
**"Processor, 8 vCPU"**. The whole menu goes from **565px to 461px** — the
104px the window needed.

### What the report did not have

- **The separator is not what makes the row.** Cutting the 24px separator to
  8px and flattening the label pad got the pitch from **72.8px to 59px** and
  no further: the row itself was still **50px**, because the hint is a grid
  **row** of its own, so a row was the control _plus_ the hint _plus_ the
  gap, and the label column's "stack" was never a stack. Spanning the control
  across both rows is what takes the row to **34px** and the pitch to
  **42px**. Two of the ask's three causes were the same cause.
- **The label cannot be on the control's baseline in a hinted compact row.**
  A 9px pad makes the label+hint stack 43px and the row 51px, over the 44px
  the same ask asks for. So a row with a hint top-aligns its label and a row
  without one keeps the pad. Flagged rather than silently dropped.
- **`badge` and `dot` still take each other's place.** The report notes it as
  part of why `badge` could not carry a value; with a real `value` the case is
  gone, so the `@else if` was left alone rather than changed for its own sake.
