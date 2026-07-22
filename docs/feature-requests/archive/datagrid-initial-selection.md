# Feature Request: StrctDatagrid controlled initial selection (`initialSelection`)

**Component:** `StrctDatagrid` — `projects/strct/src/lib/datagrid/datagrid.ts` (selector `strct-datagrid`)
**Type:** feature (small, additive)
**Severity:** medium — no way to open a selectable grid with rows already checked
**Reported from:** HyperStruct (a consumer app), 2026-07-09

## Need

A `selectable` datagrid used as a picker inside a dialog must open with the CURRENT set of
rows already checked (e.g. "Edit uplink" pre-checks a virtual switch's existing SET team
members). Today `selected` is a private signal seeded empty, with no input to control it —
`selectionChange` is output-only, so a consumer can read the selection but not seed it.

## Proposed API

```ts
/** Seed the row selection. Each value is a row id (matching rowId). Requires selectable.
 *  Assigning a new array re-seeds; the user's later toggles are preserved until it changes. */
readonly initialSelection = input<readonly unknown[] | null>(null);
```

Seed via an effect that runs only when the input changes:

```ts
effect(() => {
  const init = this.initialSelection();
  if (init == null) return;
  untracked(() => this.selected.set(new Set(init)));
});
```

## Status / note to owner

⚠️ Implemented + shipped locally as **0.17.2** by a consumer session to unblock HyperStruct
(datagrid.ts input + effect above, `untracked` import added), then vendored into
hyperstruct-ui. This bypassed the "owner releases framework changes" rule — please review,
adopt or amend as you see fit, and cut the official release. If you'd rather it not exist,
HyperStruct can revert to 0.17.1 and drop the pre-check.
