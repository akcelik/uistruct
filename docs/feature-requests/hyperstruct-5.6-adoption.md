# HyperStruct on 5.6.0 → BUG-50-01 … 06, FR-50-01 … 13

**From:** HyperStruct · **Version:** 5.6.0 · **Date:** 2026-10-01

HyperStruct adopted every item of `hyperstruct-5.0-adoption.md` (BUG-49-01 … 11, FR-49-01 … 20) and deleted the
workaround each one replaced. Almost all of them went in as written.

This document holds what the adoption found:

- two regressions in the selection model that 5.0.1 / 5.0.2 introduced;
- two places where a 5.x fix reaches further than intended;
- the remainder of an old HyperStruct accessibility list that was never filed here;
- small gaps that surfaced while every new API met a real screen.

Each item is checked against `projects/strct/src/lib` at the line given. "Measured" means a running probe or spec;
"read" means source only.

Suggested order: **BUG-50-01, 02, 04, 05** first. Each one breaks something a consumer does by following the docs.

> **BUG-50-01 … 06 FIXED in 5.7.0 (2026-10-15)** — the set this document put first.
>
> - **01** `null` is "not driven" until `selectedId` has once been non-null, so a single-mode grid
>   that only seeds with `initialSelection` keeps its pick; binding it still wins, and a null after
>   a binding still clears.
> - **02** the prune skips an empty `rows` array and skips while `loading()` — an empty array proves
>   nothing was deleted — and the single-mode effect follows `rows()`, so a pick whose row returns is
>   checked again. A real delete still prunes and still emits once.
> - **03** the detail, expand and single-select columns carry hidden names from new labels, and
>   every header cell declares `scope="col"`.
> - **04** anything stacked at or above the window is the window's own, so a menu, a modal or a
>   toast opened from inside it no longer minimises it; `(outsidePointer)` fires first and
>   `cancel()` vetoes. Measured with a z-indexed overlay at the document root.
> - **05** the header re-tone stops at overlay surfaces. Measured: the same flat button reads
>   `rgb(255 255 255 / 0.65)` in the header and `rgba(0, 0, 0, 0.62)` inside a dialog rendered there.
> - **06** the handle's `grab` is gated on the item's `draggable`; measured `auto` on a disabled list.
>
> Still open: **FR-50-01 … 13**.

---

## Bugs

### BUG-50-01 — An unbound `selectedId` clears the selection `initialSelection` seeded

**Where.** `datagrid/datagrid.ts` ~2950, the single-mode effect added for BUG-49-06:
`const next = id == null ? new Set() : new Set([id])`.

**What happens.** A single-mode grid that seeds its pick with `initialSelection` and never binds `selectedId` — the
documented 4.8 pattern — has its seed wiped on the first effect run, because an unbound `selectedId` is `null`.

**Measured.** HyperStruct's Clone dialog folder grid lost its seeded pick on the 5.6.0 install and its spec failed. The
app now binds `[selectedId]` everywhere, which is right, but 4.x consumers break silently.

**Fix.** Treat `null` as "not driven" until `selectedId` has once been non-null, as `selectedIds` already does for
multiple mode. Alternatively, seed `selectedId` from `initialSelection` in single mode.

**Acceptance.**

- A single-mode grid with only `initialSelection` shows its seed checked.
- Binding `[selectedId]` still wins.

### BUG-50-02 — Pruning a selection (BUG-49-07) loses picks the rows will hold again

**Where.**

- The prune effect, ~2913, goes through `commitSelection` (~3321).
- `commitSelection` writes back `selectedIds` in multiple mode, but **never `selectedId` in single mode**.

**What happens.**

1. **Single mode.** A row that leaves and comes back stays unchecked. `selected` was cleared, `selectedId` still holds
   the id, and the `selectedId` effect never re-runs because the signal did not change. The consumer's model says X;
   the radio says nothing.
2. **Both modes.** A transient empty `rows` re-emit wipes the whole selection and emits `selectionChange([])`. A poll
   that replaces the array, or a reload that blanks it, are examples. A consumer listening to `selectionChange` then
   clears its own state.

**Measured** with a probe spec: 2 of 3 scenarios fail.

- `rows` empty, then the row arrives: an inventory poll.
- The row leaves, then returns: switch host, then switch back.

These are real flows: Migrate dropped on a host while the host table loads; Clone's host folder after switching hosts.

**Fix.**

- In single mode, prune `selected` but keep re-applying `selectedId` when its row reappears. Run the `selectedId`
  effect on `rows()` too.
- Do not prune while `loading()` is true, nor on an empty re-emit that follows a non-empty one within the same tick.
  At minimum, do not emit `selectionChange` for a prune caused by an empty array.

**Acceptance.**

- The two scenarios above keep the pick checked.
- A real delete still prunes and still emits once.

**HyperStruct workaround:** it hands a grid only the picks its current rows hold (`pickIn`, `memberIds`, `hostPick`),
pinned by two specs.

### BUG-50-03 — Utility columns have empty header cells

**Where.** `datagrid.ts` ~305–316.

- The detail and expand columns render `<th class="strct-dg__expandcol"></th>` with no name. The action column has
  `aria-label` (~430).
- The single-mode selection `<th>` is empty too, because only multiple mode puts a checkbox there.

**Measured.** axe `empty-table-header` on every grid with a row detail. HyperStruct carries it as baseline debt on two
surfaces (inventory, roles).

**Fix.**

- Visually hidden header text from the labels object: `detailColumn`, `expandColumn`, `selectColumn`.
- `scope="col"`.

### BUG-50-04 — `strct-window closeOnOutside` treats the window's own overlays as "outside"

**Where.** `window/window.ts` ~390–396: `frame.contains(target)` is the only test.

**What happens.** A menu opened from a control inside the window is appended to `<body>` (`context-menu/menu.ts`
~568), as are modals and toasts. With `closeOnOutside="minimize"`, these all minimise the window the operator is
using:

- choosing an entry in such a menu;
- confirming a modal opened from the window;
- clicking a toast.

**Measured** with the real `StrctMenuService`. A pointerdown inside the frame does not minimise; a pointerdown on a
menu item does (`minimized = true`).

**Fix.** Ignore targets inside any open strct overlay stacked above the window: `--z-*` at or above `--z-window`, or a
registry the overlay services already have. Also emit a cancellable `(outsidePointer)` so a consumer can veto.

**HyperStruct.** BUG-49-08 is **not adopted**. The console keeps its own shade, which sits under those overlays.

### BUG-50-05 — The header re-tone (FR-49-18) reaches into modals rendered inside the header

**Where.** `layout/layout.ts` ~152–160, `.strct-header .strct-btn--flat { color: … --hdr-fg … }`, a plain descendant
selector. `strct-modal` renders in place (`modal/modal.ts` ~70), and `strct-wizard`'s Back / Cancel are `flat`
(`wizard/wizard.ts` 177, 184).

**What happens.** A wizard in a modal owned by a header component gets light Back / Cancel on the dialog's light
surface. HyperStruct's two-factor wizard was opened from the user menu in the header.

**Measured.** The buttons read near-white on white in the light schemes.

**Fix.** Stop the selector at overlay surfaces, e.g. `.strct-header .strct-btn--flat:not(.strct-modal *, .strct-popover *, …)`.
Better: re-tone only the header's direct toolbar region, e.g. `.strct-header > * > .strct-btn--flat`, or a
`[strctHeaderAction]` marker.

**HyperStruct workaround:** the user menu's three dialogs moved to the shell root.

### BUG-50-06 — A reorder handle still shows `grab` when the list is disabled

**Where.** `styles/_base.scss` 196–198: `.strct-reorder__handle { cursor: grab }` is not gated. The item rule beside
it is gated on `[draggable='true']`.

**Fix.** Gate the handle on the item's `draggable`, e.g. `[strctReorderItem][draggable='true'] .strct-reorder__handle`.

---

## Feature requests

### FR-50-01 — `strct-select [ariaLabel]`

The trigger is a `<button role="combobox">`, and ARIA does not let a combobox take its name from its content. Outside a
`strct-field` the control has no name: two filter selects on HyperStruct's Anomalies page are axe `button-name`
baseline debt since 2.0.1. `strct-checkbox` and now `strct-number` have `ariaLabel`; the select needs the same.

### FR-50-02 — `[strctFieldValue]` for controls, not only text

**Where.** `forms/field.ts` ~297–308 (read): the slot adds a 9px top padding to put text on the label's line. That is
right for text, a badge or a toggle, but wrong for a 31px segmented control (about 8px low) or a 28px small button
(about 6px).

**Proposed:** `[strctFieldValue]` aligns to the label's first line by its **own** box (`align-self: start`, with the
padding derived from `--strct-field-control-h` minus the content height), or `[strctFieldValue="control"]` for
control-height content.

### FR-50-03 — A footer when there is something to count

**Where.** `datagrid.ts` ~2621 (`showFooter`): a non-virtual grid with no pager has no footer, so no "N selected".
HyperStruct's two member pickers went `virtual` only to get the count.

**Proposed:** show the footer whenever `selectedCount() > 0` in multiple mode.

### FR-50-04 — Name the copy button of `code[strctCode] copyable`

**Where.** `code/code-inline.ts` ~63–81 sets only `text`, so every button is named "Copy". HyperStruct's certificate
drawer has two, both "Copy"; they were "Copy thumbprint" and "Copy serial number".

**Proposed:** `copyLabel`, passed to `strct-copy`'s label.

### FR-50-05 — `copyable` that can change

**Where.** `code-inline.ts` ~61 reads `copyable` once, in `afterNextRender`. A copy button that depends on state
needs two `@if` branches today.

**Proposed:** an effect on `copyable()` that creates or destroys the button.

### FR-50-06 — Per-row editor options

**Where.** `datagrid.ts` ~139: `editorOptions` is per column. HyperStruct's host-profile rules show a held value the
host no longer reports as "X (not discovered)", for that row only. With per-column options, every row's picker lists
every other row's undiscovered value.

**Proposed:** `editorOptions: StrctOption[] | ((row) => StrctOption[])`.

### FR-50-07 — `strct-list wrap` should break long tokens

**Where.** `list/list.ts` ~155 sets only `white-space: normal` (read). A path or GUID in a description still
overflows.

**Proposed:** add `overflow-wrap: anywhere` under `wrap`. HyperStruct keeps it as glue on identity-sources.

### FR-50-08 — `strct-window-dock`: a restore label and the window's data

**Where.** `window/window.ts` ~705–727.

- The dock has `closeLabel` but no restore label, so FR-49-07's "Show the console of APP02" cannot be given.
- The `[strctWindowDockItem]` context is only the `StrctWindow`, which carries no id or data, so the app keeps its own
  window → session index.

**Proposed:**

- `restoreLabel: (w) => string`;
- `strct-window [data]`, exposed in the dock item context.

### FR-50-09 — `strct-progress valuePosition="end"`: a fixed value width

**Where.** `progress/progress.ts` ~144–149 (read): the end value has no width, so a column of bars ends ragged
("5%" against "100%"). HyperStruct's old span was 34px.

**Proposed:** `--strct-progress-value-w` (default `4ch`, with `tabular-nums`).

### FR-50-10 — Name the datagrid's number editor

**Where.** `datagrid.ts` ~653: the `strct-number` editor has no name, while the text editor gets an `aria-label` and the
select gets `listLabel`. Pass `[ariaLabel]` (FR-49-10 added it) from the column label.

### FR-50-11 — `strct-legend items[].description`

**Where.** `legend/legend.ts` ~63. `reason` is documented as disabled-only, but it renders as `title` and
`aria-description` on every row. A picker's enabled rows need a description ("vm.cpu.wait — CPU ready (written by the
agent)"), and borrowing `reason` for it blurs the two meanings.

**Proposed:** `items[].description` for any row; `reason` stays the why-not of a disabled one.

### FR-50-12 — `strct-toggle [ariaLabel]`

`forms/toggle.ts` has no `ariaLabel`; `strct-checkbox` does (`forms/checkbox.ts` 156). A toggle in a grid cell has no
name (HyperStruct's ACL "Stateful").

### FR-50-13 — `strct-list flush`

**Where.** `list/list.ts` ~80 (read): `strct-list-item` has a fixed `padding-inline: var(--space-3)`, so a statement
list sits 12px inside the paragraphs around it.

**Proposed:** `flush` on the list, with zero inline padding and the leading marker on the text's edge.
