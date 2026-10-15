# A results page grouped by what to do: datagrid groups, the detail pane, a ring status, counts → FR-56-01 … FR-56-05

**From:** HyperStruct · **Version:** 5.6.1 · **Date:** 2026-10-15 · **HyperStruct decision:** O322 (redesign)

HyperStruct's cluster Validation tab shows Microsoft's cluster validation, 76 tests per run.

- **The operator's verdict on today's screen:** a stack of collapsible cards with three or four coloured tags each was
  "far worse than an enterprise product should be".
- **The redesign** (proposal: https://claude.ai/artifact/BQFapwtLNU2Xk8KpaXhz8B) keeps everything in UIStruct:
  - a verdict band with counters;
  - an ordered "What to do next" grid;
  - one results datagrid **grouped by what the operator must do** (Needs your decision · Inconclusive · Accepted ·
    To review · Passed · Not applicable), with a **detail pane** for the selected test;
  - a Setting | Value grid of the run's facts.
- **Five gaps.** Each is something a results/triage page needs and the library cannot do yet.

Suggested order: FR-56-01 and FR-56-02 (the page stands on them), then FR-56-03, FR-56-04, FR-56-05.

FR-55-01/02 (`hyperstruct-collapsible-header.md`) remain valid for the components they name. The Validation tab no
longer depends on them once these ship.

> **FR-56-01 … 05 SHIPPED in 5.10.0 (2026-10-15)** — every item in this document.
>
> - **01** `groups` (order, label, status, note, collapsed, count), `showEmptyGroups`, two-way
>   `[(collapsedGroups)]` and `<ng-template strctGroupHeader>`.
> - **02** `paneListWidth`, `columns[].keepInPane`, two-way `[(activeRowId)]`, the three header
>   slots, the mail-client keyboard (Enter/Space opens, arrows move the active row, Escape closes)
>   and a narrow takeover at `paneTakeoverWidth` measured against the grid's own width.
> - **03** `strct-status-dot [variant="ring"]`.
> - **04** `options[].count`, `countStatus` and `countLabel` on `strct-segmented`.
> - **05** `strct-metric-tile [pressed]` (three-state, so a non-toggle tile never claims
>   `aria-pressed`) and `size="sm"`.

---

### FR-56-01 — `strct-datagrid`: groups the consumer defines (order, label, tone, note, initial state)

**Today.** `groupBy` makes one collapsible header row per distinct value of a column, with the value and a count.

- The consumer cannot set the groups' order.
- A group has no label other than its raw value.
- A group cannot start collapsed.
- A group cannot carry a tone or a one-line note.

**Asked.** An optional `groups` input beside `groupBy`:

```ts
interface StrctDatagridGroup {
  value: unknown; // the groupBy column's value this group holds
  label?: string; // shown instead of the raw value
  status?: StrctStatus; // tints the label and the count chip
  note?: string; // one muted line after the count ("Blocks the join until …")
  collapsed?: boolean; // initial state (default: expanded)
  count?: number; // shown instead of the row count (server totals)
}
```

- **Order:** groups render in array order. Rows whose value is not listed go last, in today's behaviour.
- **Empty groups:** a group with no rows is hidden, or kept with `showEmptyGroups`.
- **Open state:** `[(collapsedGroups)]` (values) is two-way, so a page can open a group from elsewhere, e.g. a summary
  counter that jumps to its group.
- **Optional `ng-template strctGroupHeader let-group let-count`** for a fully custom header row. The button, its
  `aria-expanded` and the keyboard stay the library's.

**Why.** A triage page orders groups by urgency, not alphabetically, and "Passed (59)" must start folded. Today
HyperStruct would have to sort the values with prefixes ("1-needs", "2-inconclusive") and accept raw labels.

### FR-56-02 — `strct-datagrid detailPane`: a usable master–detail

**Today.**

- `detailPane` collapses the grid to one 260px column and opens the pane for the clicked row.
- The active row is internal (`activeRow` is protected), so a page cannot open a row's pane itself.
- The pane's header cannot carry the row's status or actions.

**Asked.**

1. **List width and kept columns.**
   - `paneListWidth` (px or %, default 260).
   - A column flag `keepInPane: true`: those columns stay visible while the pane is open. A results list keeps Status
     and Test (with its `descriptionKey` line); Where, Cause and Category hide.
2. **Two-way `[(activeRowId)]`.**
   - A page opens a row's pane from elsewhere: a "What to do next" chip opens the finding it settles; a URL fragment
     deep-links to a test.
   - `null` closes the pane.
3. **Pane header slots:** `strctDetailPaneTitle`, `strctDetailPaneMeta` (status, category, nodes) and
   `strctDetailPaneActions`. The close button stays the library's.
4. **Keyboard.**
   - Enter or Space on a focused row opens its pane.
   - Escape inside the pane closes it and returns focus to that row.
   - Arrow Up/Down in the list moves the active row while the pane is open, as in a mail client.
5. **Works with `groupBy`.** Group header rows stay in the list column; collapsing the active row's group closes the
   pane.
6. **Narrow containers** (container width, not viewport, below a threshold such as 900px): the pane replaces the list,
   with a "Back to the list" control in its header.

**Why.** This is the standard enterprise triage layout (vCenter, Azure portal): the list stays visible, the selected
item's evidence beside it. Today the 260px single column cuts a test name like "Validate Switch Enabled Teaming
Configurations" in half and hides the status.

### FR-56-03 — `strct-status-dot`: a ring variant for states that are not a result

**Today.** A filled dot in the status colour.

**Asked.** `variant: 'solid' | 'ring'`. The ring is a 2px outline in the status colour with a transparent centre.

**Why.**

- "Inconclusive" (a failure read under the wrong identity), "Not applicable" and "Unknown" are not outcomes. They must
  not look like Warning or Passed with only the colour to tell them apart (WCAG 1.4.1).
- A different shape carries that difference without colour.
- HyperStruct's rule "unread is not passed" (O236) uses the same distinction in every Overview.

### FR-56-04 — `strct-segmented`: a count on an option

**Today.** `StrctSegmentedOption` has `value`, `label`, `icon` and `disabled`.

**Asked.**

- `count?: number`: drawn after the label as a muted tabular number. The selected option keeps it muted.
- `countStatus?: StrctStatus`, for a count that is itself the news ("Design exceptions 1" in accent, "Failed 3" in
  critical).
- The option's accessible name includes the count: "History, 14 runs" via an optional `countLabel`.

**Why.** View switches on a results page say how much is behind each view: "Result · History 14 · Design
exceptions 1".

### FR-56-05 — `strct-metric-tile interactive`: a pressed state and a compact size

**Today.** An `interactive` tile emits `activated`. It has no selected state, and its size suits a dashboard, not a
verdict band of six counters.

**Asked.**

- **`pressed` (boolean):** sets `aria-pressed` and draws the tile selected (accent border, `--acc-m` fill), for tiles
  used as filters.
- **`size: 'sm'`:** caption 12px, value 16px, padding 6px 10px. Six tiles fit beside a one-line verdict at 1440px.

**Why.** The verdict band's counters (Needs your decision 1 · Inconclusive 3 · Accepted 1 · To review 1 · Passed 59 ·
Not applicable 11) jump to and filter the results. The operator needs to see which one is on.

---

**HyperStruct's plan.** The tab is built with today's components where they suffice: `groupBy`, `detailPane` and
`strct-status-dot`. The gaps are marked in its code with these ids, as with earlier FRs, and the workarounds are
removed when the FRs ship.
