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
