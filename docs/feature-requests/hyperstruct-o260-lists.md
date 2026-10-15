# HyperStruct inventory lists → FR-51-01 … 04

**From:** HyperStruct (O260) · **Version:** 5.6.0 · **Date:** 2026-10-02

HyperStruct rebuilt its inventory lists on vCenter's columns: a VM list shows State, Status, Provisioned Space, Host CPU
and Host Mem by default, and about fifteen more columns are in the chooser. Its biggest lists are paged on the server
(`lazy`). The client-side grids it keeps (CSVs, migrate and clone pickers, storage pods, Tasks & Events) hit four gaps.
Each one has a workaround in HyperStruct, and the workaround says which FR it waits for.

Every item was checked against `projects/strct/src/lib/datagrid/datagrid.ts` at the lines given (read, not measured).

> **FR-51-01 … 04 SHIPPED in 5.9.0 (2026-10-15)** — every item in this document.
>
> - **01** `columns[].sortValue` and `columns[].comparator`, and `null`/`''` sort last in both
>   directions. Measured in a spec: a Size column sorts 900 GB before 1.5 TB by its bytes, and the
>   unread row stays last ascending and descending.
> - **02** `columns[].hidden` is the default for a column no persisted or bound state mentions; the
>   chooser lists it unticked. No reaching into `strct-dg:<stateKey>`.
> - **03** both exports use the user's order, `columns[].exportValue` says what to write, and a CSV
>   cell opening with `=`, `+`, `-` or `@` is prefixed with an apostrophe.
> - **04** `sortKey` / `sortDir` travel with the column state, so the sort survives a visit.

---

### FR-51-01 — A per-column sort value, and unread values last

**Where.** `datagrid.ts` 3331, `compare()`. Two numbers are subtracted; anything else is compared with
`String(a ?? '').localeCompare(String(b ?? ''), …, { numeric: true })`. Two problems follow.

1. **A formatted cell sorts as text.** A column whose row value is "1.5 TB" sorts it before "900 GB". Dates written by
   `toLocaleString()` sort across days and AM/PM by their text. A consumer has two options today:
   - put the raw number in the row and draw the text in a `strctCell` template. This works, but it fills templates
     that exist only to format a value, and an export writes the raw number ("1610612736") rather than what was shown;
   - pre-format and accept the wrong order.
2. **A missing value sorts first.** `null` becomes `''`, which is the smallest string. An unread fact ("—") lands at the
   top of an ascending sort, above every real value. HyperStruct's rule, and vCenter's behaviour, is that an unread
   value is neither the smallest nor the largest, so it goes last in both directions.

**Proposed:**

- `StrctDatagridColumn.sortValue?: (row) => unknown`, or a `comparator?: (a, b) => number`, applied in both sort paths
  (2574 and 2604).
- `null`/`undefined` always last, whatever the direction.

### FR-51-02 — Optional columns hidden by default

**Where.** `StrctDatagridColumn` has no hidden flag. `StrctDatagridColumnState.hidden` (177) is the only way to hide a
column, and it is persisted state. A list that shows vCenter's defaults and keeps the rest in the chooser must:

- seed `[columnState]` with `{ hidden: [...] }`;
- seed it only when `localStorage['strct-dg:<stateKey>']` is empty, so an operator's own choice wins.

The second step makes the consumer reach into the library's storage key.

**Proposed:** `StrctDatagridColumn.hidden?: boolean`, the default for a column that no persisted or bound state
mentions. The chooser lists it unticked.

### FR-51-03 — Export what is shown, in the user's order, guarded

**Where.** `toCSV()` 3053 and `toXLSX()` 3072.

- **Order:** `toCSV()` uses the declared column order (`this.columns()`), while `toXLSX()` uses the user's
  (`orderedColumns()`). The same grid exports its columns in two different orders.
- **Values:** both write the raw row value (`r[c.key]`), not what the cell shows. For a templated cell (FR-51-01's
  workaround), that is seconds, bytes, `true`, or an enum code like `vm` or `in_sync`.
- **Formula injection:** a CSV cell that starts with `=`, `+`, `-` or `@` is not guarded. A VM named `=HYPERLINK(…)`
  is a formula when the export is opened in Excel (OWASP "CSV Injection").

**Proposed:**

- both exports in the user's order;
- `StrctDatagridColumn.exportValue?: (row) => unknown`, defaulting to the raw value;
- a leading `'` on CSV text cells that start with one of the four characters.

### FR-51-04 — Remember the sort

**Where.** `stateKey` persists widths, hidden columns and order (3032), but not the sort. A list that an operator
sorts by Host CPU opens sorted by name again on the next visit, and a `lazy` list asks the server for the wrong order
first.

**Proposed:** `sortKey` and `sortDir` in `StrctDatagridColumnState`, restored before the first `(lazyLoad)`.
