# FR-48-24 … 29 — Lists and data

> **FR-48-24 SHIPPED in 4.7.0 (2026-09-29)** — `strct-list` + `strct-list-item`, with the leading /
> description / meta / trailing slots, `interactive` + `activated`, `selected`, `status`, `dense`,
> `dividers` and `emptyText`.
>
> One deviation from the proposal: the row is a `role="button"` target rather than a `<button>`
> element. A template can project the same content into only one place, so branching the markup on
> `interactive` would drop the projected content in the unrendered branch; `strct-tree` rows already
> use the role. Keyboard behaviour is the one the FR asked for — Tab reaches the row, then its
> trailing control, verified in Chrome.
>
> **FR-48-25, 28 and 29 SHIPPED in 4.16.0 (2026-09-29)** — `align="grid"` with `labelWidth`, plus
> `status` / `icon` / `note` on `strct-desc`; the tree's `framed` and `maxHeight`; the avatar's
> `icon`, `shape` and `tone`.
>
> Measured in Chrome: the grid list's label column takes the longest label (129.45px) and every
> value starts at the same x (458), `labelWidth="150px"` makes it exactly 150px, the rows are
> `display: contents` so their `dt` / `dd` are the grid's own items, and a note sits under its value
> in `--t3`. The framed tree draws a 1px `--b2` border at `--radius-md` over `--bg-1` with
> `overflow: auto`; bounded to 80px against 173px of content, the arrow keys scroll the **frame** to
> 91px with the focused row still inside it and the page not moving. The avatars render as a 6px
> square, a translucent `accent-soft` circle, a filled accent square and a critical circle, with the
> icon scaling 13 / 17 / 22px by size — and an `src` image still wins over an icon.
>
> **FR-48-26 and FR-48-27 SHIPPED in 4.17.0 (2026-09-29)** — `flush`, `caption` and the column
> flags `mono` / `muted` / `numeric` / `emptyText` / `emptyLabel` / `descriptionKey`; plus
> `paging="more"` with `hasMore`, `loadingMore`, `moreTotal` and `(loadMore)`.
>
> Measured in Chrome: `flush` leaves `border: 0px`, `border-radius: 0px` and no shadow; the caption
> reads "Recent tasks" and is the table's `aria-labelledby`; a mono cell resolves to JetBrains Mono,
> a numeric one to `text-align: end` with `tabular-nums` (its header too), a muted one to `--t3`, a
> blank one to "—" in `--t3` carrying `aria-label="not assigned"`, and a `descriptionKey` line sits
> under the value as a block in `--t3`. The feed pages 6 → 12 → 18 → **24**, the button waits
> disabled with a spinner while a slice arrives, the count follows, the scroll position is kept, and
> the button **disappears** when `hasMore` goes false.
>
> The muted flag needed scoping through the table: `.strct-dg td` already declares a colour, so a
> bare `.strct-dg__cell--muted` lost to it — the first reading showed the cell still at `--t1`.
>
> **Every ask in this document has shipped.**

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](../hyperstruct-hand-built-audit.md).

---

## FR-48-24 — `strct-list` + `strct-list-item` (new)

### Rule

**Short lists of things with a status are lists, not tables.** An alarm, a finding or a cluster in a summary has a
leading marker, a title, a secondary line and something at the end. A table needs a header row and columns; a timeline
implies time order; an alert per item is too heavy. strct has no list, so each screen invents rows.

### What the app does today

Ten hand-built row patterns, each with its own hairlines, hover and spacing:

| Where                                                                 | Row                                                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| shell/alarms-bell.ts:67 `.ab-row`                                     | severity badge · alarm name + object · time · Acknowledge                  |
| shell/drift-indicator.ts:58 `.di-row`                                 | badge · object + what drifted · Open                                       |
| dashboard.ts:503, :637 and :675 `.rows / .row / .main / .sub / .when` | Home's alarms, activity and hot spots                                      |
| object-detail/overview-parts.ts:138–180 `.finding / .ftext`           | an Overview check that failed: severity + title + detail                   |
| overview-parts.ts:513–557 `.cl`                                       | cluster: status dot · link · meta · meter; reflows under a container query |
| overview-parts.ts:878–895 `.vol`                                      | volume: name · meter · free                                                |
| mvs-overview-cards.ts:84 `.member`                                    | a switch member host                                                       |
| updates/remediate-wizard.ts:198 `.hosts`                              | a host to remediate, with warning or blocker lines                         |
| updates/remediation-run.ts:263 `.host`                                | a host's run row                                                           |
| host-overview-cards.ts:146 `.findings / .finding--row`                | a VM that would strand, with memory and reason                             |

### Proposed API

```html
<strct-list [dense]="true" dividers>
  @for (a of alarms(); track a.id) {
  <strct-list-item interactive (activated)="open(a)">
    <strct-badge strctListItemLeading [status]="a.tone">{{ a.severity }}</strct-badge>
    {{ a.name }}
    <span strctListItemDescription>{{ a.object }}</span>
    <span strctListItemMeta>{{ a.when | relativeTime }}</span>
    <button strctListItemTrailing strct-button size="mini" variant="flat">Acknowledge</button>
  </strct-list-item>
  }
</strct-list>
```

```ts
// strct-list
readonly dense = input(false, { transform: booleanAttribute });
readonly dividers = input(true, { transform: booleanAttribute });
readonly emptyText = input('');
readonly label = input('');                 // accessible name of the list
// strct-list-item
readonly interactive = input(false, { transform: booleanAttribute });
readonly selected = input(false, { transform: booleanAttribute });
readonly status = input<StrctStatus | null>(null);   // an optional leading rail, as strct-card [status]
readonly activated = output<void>();
```

- **Layout.** The item is a grid: `leading | title / description | meta | trailing`.
- **Narrow widths.** Below `--strct-list-narrow` (a 360px container query), meta moves under the description.
- **Tokens.** Hover `--bg-2`, selected `--acc-s`, dividers `--b1`.

### Accessibility

- The list is `role="list"` and items are `role="listitem"`.
- An `interactive` item's primary area is a button, with trailing controls as separate tab stops (the same model as
  FR-48-03).
- `selected` sets `aria-current="true"`.

### Acceptance

All ten patterns above render from `strct-list` without consumer CSS beyond layout. `dense` gives 32px rows and the
default gives 44px. Keyboard Tab reaches each item's button, then its trailing control.

---

## FR-48-25 — `strct-description-list`: an aligned grid; leading status and a note on `strct-desc`

### Rule

**A list of facts lines its values up.** A fact may carry its state and a short note: "Agent · connected · last seen
12 s ago".

### What the app does today

- **Alignment.** `align="between"` pushes values to the far edge, and `align="start"` leaves the value column ragged.
  So about 33 key–value lists stay hand-built, each an `auto 1fr` grid. Examples: vm-specs.ts:44 `.vs-grid`,
  mvs-configuration-view.ts:134 `.mc-grid`, validate-cluster-dialog.ts:212 `.vc-review`,
  add-node-wizard.ts `.an-review`, and self-healing.ts:91.
- **State and note.** dashboard.ts:705 and :720 `.lines / .line` put a dot, label, value and a note line in one row.
  `strct-desc` has a plain-string label and no place for either.

### Proposed API

```ts
type StrctDescAlign = 'start' | 'between' | 'grid';   // 'grid' — one label column sized to the longest label
// strct-description-list
readonly labelWidth = input<string | null>(null);     // e.g. '160px'; overrides 'grid' auto sizing
// strct-desc (additions)
readonly status = input<StrctStatus | null>(null);    // a status dot before the label
readonly icon = input('');
readonly note = input('');                            // a --t3 line under the value
```

### Acceptance

`align="grid"` aligns all values on one vertical line. `status="success" note="last seen 12 s ago"` renders a dot and a
second line. Existing alignments are unchanged.

---

## FR-48-26 — `strct-datagrid` presentation: flush, caption, column `mono` / `muted` / `numeric` / `emptyText` / second line

### Rule

**The look of a cell is column metadata, not a cell template.** Examples: a GUID column is monospace, a counter is
right-aligned with tabular figures, and an unread value is an em dash in `--t3`. A grid inside a panel that already has
a border has none of its own. A grid's title belongs to the grid.

### What the app does today

- **Borders.** shell/recent-tasks.ts:339 strips the grid's border, radius and shadow with
  `.rt-body .strct-dg-host { … }` — reaching into the library's internals.
- **Monospace, muted and dash cells** hand-written as templates: host-configuration-view.ts:620, :770 and :991;
  cluster-storage-view.ts:209 and :239; host-monitor-view.ts:387.
- **Two-line cells** (a name with a muted hint under it): editable-settings.ts:250, host-configuration-view.ts:476 and
  :1734.
- **Grid titles.** vm-cluster-placement.ts:148 puts an eyebrow title into the action bar, and many grids are preceded
  by a hand-written h3 (FR-48-13).

### Proposed API

```ts
// strct-datagrid (additions)
readonly flush = input(false, { transform: booleanAttribute });   // no outer border, radius or shadow
readonly caption = input('');                                     // rendered as <caption> / the grid's accessible name, --text-sm/600 above the header
interface StrctDatagridColumn {
  // …
  mono?: boolean;
  muted?: boolean;
  numeric?: boolean;          // align end + font-variant-numeric: tabular-nums
  emptyText?: string;         // shown in --t3 for null / undefined / ''; default none (today's blank)
  descriptionKey?: string;    // a --t3 second line from row[descriptionKey]
}
```

### Accessibility

`caption` names the grid (`aria-labelledby`). `emptyText` is read as is ("—" should be paired with a visually hidden
"not read"; offer `emptyLabel` for that).

### Acceptance

The Recent Tasks grid renders borderless with `flush`. A column `{ key:'guid', mono:true, emptyText:'—' }` needs no
template. `descriptionKey` shows two lines per cell in the same row height as `singleLine` + 1 line. Defaults are
unchanged.

---

## FR-48-27 — `strct-datagrid`: cursor paging ("Load more")

### Rule

**Feeds that page by cursor load more at the end.** An event log is one example. `lazy` + `lazyLoad` speaks page
numbers, which a cursor API cannot answer.

### What the app does today

- administration/audit-log.ts:165–183 `.al-foot`: "Showing the latest N of M", a Load more button and the verify
  result under the grid (offset paging).
- events-history.ts:200 `.eh-more`: cursor paging. It keeps its own accumulated rows and button.

### Proposed API

```ts
readonly paging = input<'pages' | 'more'>('pages');
readonly hasMore = input(false, { transform: booleanAttribute });
readonly loadingMore = input(false, { transform: booleanAttribute });
readonly loadMore = output<void>();                       // request output, like lazyLoad
// labels: loadMore: 'Load more', showing: (n, total?) => …
```

With `paging="more"` the footer shows the count and a Load more button (a spinner while `loadingMore`). The consumer
appends rows.

### Acceptance

A grid with `paging="more" [hasMore]="true"` emits `loadMore` on click and keeps scroll position when rows append. The
button disappears when `hasMore` is false.

---

## FR-48-28 — `strct-tree`: a framed, height-bounded variant

### Rule

**A tree used as a picker inside a dialog sits in a frame and scrolls inside it.**

### What the app does today

shell/object-tree.html:132, the Move dialog's "Destination folder" field, wraps `strct-tree` in an inline-styled
`<div>`: a `--b1` border, radius 6, `--bg-0`, `max-height:320px` and scrolling. The dark-theme fallback colours are
hard-coded.

### Proposed API

```ts
readonly framed = input(false, { transform: booleanAttribute });   // --b2 border, --radius-md, --bg-1
readonly maxHeight = input<number | null>(null);                    // px; scrolls inside the frame
```

### Acceptance

`framed [maxHeight]="260"` renders the frame, and keyboard navigation scrolls the focused node into view inside it.

---

## FR-48-29 — `strct-avatar`: icon, shape, tone

### Rule

**Not every avatar is a person with initials.** A group is a square, and an assistant is an icon.

### What the app does today

- **People** (these will migrate to `strct-avatar [name]`): shell/user-menu.ts:40 and :56 `.um-avatar` (26px and 34px
  accent circles with initials computed in TypeScript); administration/users-groups.ts:158 `.ug-av`.
- **Groups:** users-groups.ts `.ug-av--group`, a 7px-radius square on `--bg-2`.
- **Assistant:** shell/ai-assistant.ts:72 `.ai-avatar` and `.ai-empty-avatar`, round icon avatars.
- **Brand mark:** login.html:22 `.auth-brand__mark`, an icon tile with radius 9 on `--acc-m`.

### Proposed API

```ts
readonly icon = input('');                               // renders the icon instead of initials / image
readonly shape = input<'circle' | 'square'>('circle');   // square: --radius-md
readonly tone = input<StrctStatus | 'accent-soft'>('accent');
```

### Acceptance

`<strct-avatar icon="users" shape="square" tone="neutral">` renders the group avatar, and `icon="sparkle"` the
assistant's. `name` and `src` behave as today.
