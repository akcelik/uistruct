# HyperStruct on 5.24.0 (the 5.17–5.24 adoption) → BUG-59-01 … 04, FR-59-01 … 08

**From:** HyperStruct · **Version:** 5.24.0 · **Date:** 2026-10-20 · **HyperStruct decision:** O351

HyperStruct moved from 5.16.0 to 5.24.0 and adopted what 5.19–5.24 shipped for its 5.16 report
(`hyperstruct-5.16-adoption.md`, every item of which is closed): the datagrid's grid interaction model with
`selectionColumn="none"` and `(rowActivate)` (FR-58-01, FR-58-04 — the Validation results and the CSV file browser),
the library's group header with its tone and note (BUG-58-01), `strct-tag [href]` with a leading icon for the
assistant's object chips (BUG-58-02, BUG-58-07), the lazy tree node with `loadingLabel`, its `meta` and `tag`
(FR-58-05, FR-58-06), `stateKey` restoring by itself (BUG-58-13, BUG-58-14 — the app's `savedColumnState` helper and
its request coalescing are gone), the modal's own Escape rules (BUG-58-05), the palette's whole name on a phone
(BUG-58-11), the tree's active row on `--bg-2` (BUG-58-17). The corners (5.17.0) and the `--t3` alphas (5.24.0) went in
untouched: the app writes radii only through the tokens.

Some fixes could not be taken as they are, and new defects came with the upgrade. Each is measured the same way as
before: the installed 5.24.0 in HyperStruct's vitest/jsdom suite (a probe spec, or the app's own spec), the app's a11y
gate (axe-core over 31 rendered surfaces), and the rendered DOM with every component stylesheet and the app's built
global CSS drawn in headless Chrome (1440 px, DPR 1, arctic light and dark).

The 5.18.0 sortable-header `button` and the 5.20.0 empty states changed what HyperStruct's specs clicked and counted
(five sort specs clicked the `th`; four "no page title" specs met the grid's new `h3`). Those were the app's to adapt
and are not filed.

Suggested order: BUG-59-01 (every empty grid adds a heading), BUG-59-04 (every grid's header row in two cases),
BUG-59-02 (two current pages), FR-59-07, BUG-59-03, then the rest.

---

### BUG-59-01 — An empty `strct-datagrid` adds an `<h3>` to the page outline (5.20.0)

**Seen.** The empty row is now `<strct-empty-state size="sm" [title]="emptyText()" />` (and the filtered branch the
same with `noMatches`). `strct-empty-state`'s `titleLevel` defaults to `3`, so every empty grid on a page draws
`<h3 class="strct-empty__title">` inside a table cell:

- HyperStruct's a11y gate failed on the Updates page — `heading-order` (moderate): the page header's `h1`, then the
  empty Hosts grid's `h3`. Before 5.20 the row was `<td class="strct-dg__empty">{{ emptyText() }}</td>`.
- Three Administration pages' empty grids (Audit log, Customization specs, Webhooks) each added an `h3` where their
  specs assert the page has no title of its own; and, from the source, an `emptyText=""` grid draws an **empty**
  `<h3></h3>`.
- A page's heading list now names its empty grids ("No web certificate yet — Generate default creates one…" became a
  heading of the Certificates page).

`strct-empty-state`'s own comment already says the rule: "a loading state inside a card is not [a heading]".

**Asked.** The grid's empty row passes `[titleLevel]="null"` in both branches (a `<p>`); an empty title draws no
title element at all. A spec on the grid's empty row (no `h1`–`h6` inside `tbody`), and the a11y gate over an empty
grid under an `h1`.

**HyperStruct today.** The gate's baseline carries one library-owned entry, `updates / heading-order 1`, with this id
and "delete when it ships"; the four specs skip `h3.strct-empty__title` when they look for a page title. Marked
BUG-59-01.

### BUG-59-02 — A `routerLink` entry under an explicit `activeId` marks every prefix of the page as current (5.23.0)

**Seen.** The BUG-58-06 fix puts `ariaCurrentWhenActive="page"` on the entry's `routerLinkActive`. That directive
matches by prefix (`exact: false`) and writes or removes `aria-current` itself on every navigation, whatever
`activeId` says. HyperStruct's Backup sidebar (`strct-section-menu`, `activeId="backup-vms"`, entries `/backup`,
`/backup/vms`, `/backup/policies`, …) on `/backup/vms/vm-1`: **two** entries carry `aria-current="page"` — "Protection
overview" (`/backup`) and "Protected VMs" (`/backup/vms`); only the second is styled active. Measured with the app's shell spec
(`entries.filter(a => a.getAttribute('aria-current') === 'page').length` is 2).

`[routerLinkActiveOptions]="{ exact: true }"` alone is not the answer: on `/backup/vms/vm-1` the "Protected VMs"
entry is then not router-active, and `RouterLinkActive` removes the `aria-current` the template bound from `activeId`
— BUG-58-06 again.

**Asked.** When `activeId` is set it is the only source: render the entry without `routerLinkActive` (or without
`ariaCurrentWhenActive`, and with `aria-current` from a host binding the directive cannot clear); with no `activeId`
the router decides, as now. A spec: `activeId` on a child entry while the URL is under it and a parent entry's path is
its prefix → exactly one `aria-current`. `strct-rail` took the same change and should get the same spec.

**HyperStruct today.** Its sidebar menus keep `href` entries and route a plain click themselves (the BUG-58-06
workaround, kept). Marked BUG-59-02.

### BUG-59-03 — `strct-markdown`'s reader is still 14–17× a linear reader on emphasis-heavy input

**Seen.** 5.22.0 bounded the reader (BUG-58-09). Measured in HyperStruct's vitest (node, jsdom), mean of three reads
after a warm-up, `strctParseMarkdown` against the assistant's own reader (`parseMarkdown`, linear delimiter stack):

| Input                                                | HyperStruct's reader | `strctParseMarkdown` |
| ---------------------------------------------------- | -------------------- | -------------------- |
| `"*a "` × 64 KiB                                     | 9.9 ms               | **142.5 ms**         |
| `"**a "` × 64 KiB                                    | 3.8 ms               | **63.6 ms**          |
| `"["` × 64 KiB                                       | 157.1 ms             | 41.0 ms              |
| a normal 35 KB reply (bold, code, list, table) × 400 | 6.7 ms               | 7.8 ms               |

A streamed reply is read again on every token, so a hostile (prompt-injected) reply of unmatched `*` costs ~140 ms
per token where the app's reader costs ~10. (The bracket case is the other way round: there HyperStruct's reader is the slow
one, which is its own to fix.)

**Asked.** Emphasis matched with CommonMark's delimiter stack and `openers_bottom` (each delimiter visited a bounded
number of times), so `"*a "` and `"**a "` stay within ~2× a linear reader; a timing spec in the library's suite.

**HyperStruct today.** The assistant keeps its own renderer. Every other gap O327 found is closed (its parity spec now
holds `strct-markdown` to the app's behaviour); this is one of the reasons the swap waits. Marked BUG-59-03.

### BUG-59-04 — A sortable header loses the header's uppercase and letter-spacing (5.18.0)

**Seen.** `.strct-dg th` sets `text-transform: uppercase; letter-spacing: 0.4px`. Since 5.18.0 a sortable header's
text is inside `<button class="strct-dg__sortbtn">`, whose rule sets `font: inherit` — but `text-transform` and
`letter-spacing` are not part of the `font` shorthand, and the browser's own button style resets them (`none`,
`normal`). In Chrome every header row with both kinds of column draws them in two cases: HyperStruct's CSV file list
reads "Name ↑ Kind Size Modified USED BY" (four sortable columns, one plain). (The showcase may not show it if
its demo grids sort every column.)

**Asked.** `text-transform: inherit; letter-spacing: inherit;` on `.strct-dg__sortbtn` (and whatever else the `th`
sets that a button resets); the visual gate with a grid that has a sortable and a plain column side by side.

**HyperStruct today.** That rule in its `styles.scss`, marked, with a guard spec that fails when the library carries
it. Marked BUG-59-04.

### FR-59-01 — `strct-datagrid` group header: the count with the grid's noun

**Seen.** The 5.21.0 header reads "Inconclusive, 3. Read under a local account…". HyperStruct's own header read
"Inconclusive, 3 tests. Read under…" — a bare number after a label is ambiguous (3 what?), and the grid already
knows its noun (`labels.row` / `labels.rows`, used by the footer count).

**Asked.** The announcer after the count says the noun: ", 3 tests." (singular for one), from `labels`; visible
chip unchanged.

**HyperStruct today.** The library's header as it is (the app's template went). Not marked.

### FR-59-02 — A status phrase: icon + words in a status tone, accent included, no live region

**Seen.** `strct-cell-status` has `ok` / `warning` / `error`, a fixed icon per state and an `aria-live` message. A
line that states a fact in a grid cell — HyperStruct's VM Updates line, an `arrowUp` and "an update is available" in
the accent tone — needs an accent or info tone, a chosen icon and no live region (it is not a change being
announced).

**Asked.** `strct-cell-status` (or a `strct-status-text`) with `status: 'accent' | 'info' | …`, an `icon` input and
a static mode without `aria-live`.

**HyperStruct today.** A `strct-badge` with a `strct-icon` inside (O338). Not marked.

### FR-59-03 — `strct-button [disabledReason]`

**Seen.** A disabled action owes its reason. `strct-list-item` and datagrid rows have `disabledReason`; a button does
not, so the reason lives elsewhere (an action bar caption, a `strctTooltip` the disabled button cannot receive focus
for).

**Asked.** `disabledReason` on `strct-button`: when disabled, a tooltip on hover/focus and `aria-describedby`; keep
the button focusable (`aria-disabled` instead of `disabled`) so a keyboard user can reach the reason.

**HyperStruct today.** The datagrid action bar's caption carries the reason (O338). Not marked.

### FR-59-04 — `strct-product-switcher`: the product's accent on its row, and a hook per row

**Seen.** 5.23.0 closed BUG-58-10 and FR-58-02; HyperStruct still could not take the component: its menu marks the
checked row in **that product's** accent (`[data-accent]` on the row, which the library's tints follow since 5.15),
and its specs find each row by product. `StrctProductItem` has `tone` (the icon) and `headerTone` (the chip), nothing
for the row's checked fill, and the row carries no attribute naming its item.

**Asked.** `StrctProductItem.accent?: string` written as `data-accent` on the row (and the chip, if useful), and
`data-item="<id>"` on every row. A spec with two products of different accents.

**HyperStruct today.** Its own chip and `strct-dropdown` menu, built from strct parts. Marked FR-59-04.

### FR-59-05 — `strct-change` with one side

**Seen.** `from` and `to` are both required. An install has a "to" and no "from"; a removal the other way round.

**Asked.** An empty `from` draws "→ to" and an empty `to` "from → ?" (or "removed"), with the same assistive
sentence ("set to …", "… removed").

**HyperStruct today.** The grid falls back to the plain value (O338). Not marked.

### FR-59-06 — `strct-desc`: the value as a link

**Seen.** A description-list value that is a destination (HyperStruct's "Now" row on a VM's updates) is wrapped in
a hand-made `<a>` inside the value slot.

**Asked.** `StrctDesc` `href` / `routerLink` (+ `target`): the whole value is the link, with the library's link and
focus style.

**HyperStruct today.** An `<a>` in the value (O338). Not marked.

### FR-59-07 — `strct-tree`: refusing a drop with a reason

**Seen.** `canDrop` returns a boolean. A drop the product refuses for a reason the operator should read ("A resource
pool cannot be moved into another cluster", "Not a folder of this datacenter") either looks valid until the drop and
is then explained by a toast, or shows the no-drop state with nothing said.

**Asked.** `canDrop` may return `true | false | string`: a string is a refusal with its reason — the target shows the
no-drop state, the reason appears beside the pointer (and is announced politely once per target), `nodeDrop` is not
emitted. Or a `(dropRefused)` output with the reason. A spec with a refused and an accepted target.

**HyperStruct today.** `treeDropRefusal` sentences shown as a toast after the drop (O349). Not marked.

### FR-59-08 — `strct-topology`: a small node/edge diagram

**Seen.** A virtual switch's topology — port profiles → the switch → its members and their uplinks → the ToR ports —
is drawn as linked datagrids, because the library has no diagram (`strct-flow` animates a pipeline; it has no columns,
edges or per-node focus).

**Asked.** `strct-topology`: left-to-right columns of nodes (the consumer gives columns, nodes and edges), nodes in a
status tone with an icon, a label and a meta line, edges drawn between columns, one tab stop with arrow-key movement
across nodes and edges, `(nodeActivate)`, and a datagrid (or list) fallback the screen reader gets.

**HyperStruct today.** Linked datagrids on the MVS Topology tab (O344). Not marked.
