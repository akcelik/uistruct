# Bug: StrctDatagrid merges rows whose `rowId` field is missing

> **RESOLVED in 3.1.1 (2026-09-18).** `idOf` now falls back to the row object when
> `rowId` resolves to null/undefined, exactly as proposed below. The blast radius
> was wider than reported: `idOf` also keys the `@for` track, tree metadata, the
> roving tabindex and the inline-edit target, so unkeyed rows also opened an editor
> in every sibling — and `detailPane` never opened at all (`activeRow` treats a
> null id as "nothing open"). All are covered by the same fix and by tests. The
> HyperStruct `_key` workaround can stay but is no longer necessary.

**Component:** `StrctDatagrid` — `projects/strct/src/lib/datagrid/datagrid.ts` (selector `strct-datagrid`)
**Type:** bug (small, contained)
**Severity:** high — silent wrong selection; the user checks one row and gets several
**Reported from:** HyperStruct (a consumer app), 2026-09-18
**Affects:** selection (`selectable`) and expansion (`expandable` / `detailPane`)

---

## Symptom

An operator ticks one row's checkbox. Another row — sometimes every other row —
becomes checked too. `selectionChange` emits all of them. The "select all" box
also lights up.

Reproduced in a consumer app's test (jsdom, Angular 21, strct 2.0.1):

```ts
// rowId="id", and the rows genuinely have no `id` field
rows = [
  { name: 'Intel X710', connection_name: 'pnic0' },
  { name: 'Intel X710', connection_name: 'pnic1' },
];
// one click on the FIRST row's checkbox:
//   checkboxes -> [true(select-all), true, true]
//   selectionChange -> [pnic0, pnic1]
// the same data WITH ids -> only the clicked row. Correct.
```

---

## Root cause

`datagrid.ts`, line ~2144:

```ts
/** Resolve a row's stable identity (defaults to the row object itself). */
private idOf(row: StrctRow): unknown {
  const id = this.rowId();
  if (id == null) return row;
  return typeof id === 'function' ? id(row) : row[id];   // <-- may be undefined
}
```

Selection is a `Set<unknown>` keyed on `idOf(row)`. When `rowId` names a field
the row does not have, `row[id]` is `undefined` for EVERY such row — and a Set
holds `undefined` once. So all of those rows share one identity:

- `toggleRow` adds a single `undefined` and `isSelected` then answers **true for
  all of them** (line ~2430);
- `allPageSelected` (line ~2135) sees the page as fully selected;
- `selectionChange` emits every row that resolves to `undefined`.

`expandedRows` uses the same `idOf` (line ~2434), so `expandable` / `detailPane`
has the same defect: opening one row's detail opens the others'.

### The component already knows this can happen

`rowIdentifier`, twenty lines below, guards the exact case — for the accessible
label only:

```ts
private rowIdentifier(row: StrctRow): string {
  if (this.rowId() != null) {
    const id = this.idOf(row);
    if (typeof id === 'string' || typeof id === 'number') return String(id);
  }
  return String(this.rows().indexOf(row) + 1);   // <-- falls back
}
```

So an unresolvable id produces a correct aria-label and a wrong selection. The
fallback that already exists for the label is the one the identity needs.

`idOf`'s own doc comment says _"defaults to the row object itself"_ — which is
true only when `rowId` is absent. When `rowId` is present but unresolvable, it
defaults to `undefined` instead, and that is the bug.

---

## Proposed fix

Fall back to the row object — the same identity used when `rowId` is not given at
all. Object identity is unique per row, so rows can never merge.

```diff
 /** Resolve a row's stable identity (defaults to the row object itself). */
 private idOf(row: StrctRow): unknown {
   const id = this.rowId();
   if (id == null) return row;
-  return typeof id === 'function' ? id(row) : row[id];
+  const resolved = typeof id === 'function' ? id(row) : row[id];
+  // An unresolvable id must NOT collapse rows onto one another: a Set holds
+  // `undefined` once, so every row missing the field would share one identity
+  // and selecting one would select them all. Fall back to the row object, the
+  // same identity used when no rowId is given.
+  return resolved ?? row;
 }
```

`??` (not `||`) on purpose: `0` and `''` are legitimate ids and must keep working.

---

## Why this is safe

- **`rowId` absent** — untouched, already returned `row`.
- **`rowId` resolves** — untouched, same value as before.
- **`rowId` unresolvable** — previously merged rows; now each row is distinct.
  No consumer can be relying on the old behaviour: it produced a selection the
  user did not make.
- **`initialSelection`** — a seed value can no longer match an unresolvable row.
  It could not meaningfully match before either (it would have had to contain
  `undefined`, which selected every unkeyed row at once).
- **Range select / expansion** — both key on `idOf`; both stop merging too.

---

## Suggested tests

```ts
it('does not merge rows whose rowId field is missing', () => {
  // grid: rowId="id", rows without an `id`
  // click row 0's checkbox -> selectionChange emits exactly one row
});

it('keeps 0 and "" as usable row ids', () => {
  // rows [{id: 0}, {id: ''}, {id: 1}] -> three distinct identities,
  // clicking each selects exactly one
});

it('does not expand sibling rows when rowId is unresolvable', () => {
  // expandable grid, rows without an `id` -> opening one detail opens one
});
```

---

## Consumer-side note

HyperStruct worked around this by building a guaranteed-distinct `_key` on every
row (several fields plus the row's position) and pointing `rowId` at it. That
workaround is fine to keep — it also documents the row's identity — but it should
not be _necessary_, and other consumers are unlikely to discover the failure
mode: it only appears when a field is missing, which is exactly when nobody is
looking.
