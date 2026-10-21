# Migrating to 6.0

6.0 removes inputs; it adds nothing and changes no behaviour. Everything it
removes already has a replacement in **5.30.0**, and the flat inputs keep
working for the whole 5.x line — so a consumer moves one screen at a time and
upgrades when every screen is moved.

Dev mode tells you what is left: a grid given a flat input prints one line per
input, once per app run, naming the object it has moved into.

## `strct-datagrid`: 54 inputs become 27 and seven objects

The component grew past what a template can read. Each cluster of related
inputs is now one object.

**What stays flat, on purpose:**

- the two-way state — `selectedIds`, `selectedId`, `activeRowId`, `filters`,
  `quickFilter`, `columnState`, `collapsedGroups` — because `[(…)]` cannot
  bind through a property of an object;
- the grid's core: `columns`, `rows`, `rowId`, `labels`;
- the look flags: `compact`, `singleLine`, `flush`, `caption`, `emptyText`,
  `loading`, `editHint`, `resizable`, `reorderable`, `columnChooser`,
  `expandable`, `rowActions`, `interactionMode`, `footerActionsDisabled`.

### `[selection]`

| was                        | now                                   |
| -------------------------- | ------------------------------------- |
| `selectable`               | `[selection]="{ enabled: true }"`     |
| `selectionMode="single"`   | `[selection]="{ mode: 'single' }"`    |
| `selectionColumn="none"`   | `[selection]="{ column: 'none' }"`    |
| `[rowSelectable]="fn"`     | `[selection]="{ rowSelectable: fn }"` |
| `groupSelect`              | `[selection]="{ groupSelect: true }"` |
| `[initialSelection]="ids"` | `[selection]="{ initial: ids }"`      |

`[(selectedIds)]` and `[(selectedId)]` do not move.

### `[paging]`

`[paging]="'more'"` still takes the mode on its own; the object carries the
rest.

| was                         | now                                          |
| --------------------------- | -------------------------------------------- |
| `[pageSize]="25"`           | `[paging]="{ pageSize: 25 }"`                |
| `paging="more"` + `hasMore` | `[paging]="{ mode: 'more', hasMore: true }"` |
| `loadingMore`               | `[paging]="{ loadingMore: true }"`           |
| `[moreTotal]="n"`           | `[paging]="{ moreTotal: n }"`                |
| `lazy` + `[total]="n"`      | `[paging]="{ lazy: true, total: n }"`        |

### `[pane]`

`pane` on its own (a bare attribute) turns the pane on, as `detailPane` did.

| was                         | now                               |
| --------------------------- | --------------------------------- |
| `detailPane`                | `pane`                            |
| `paneListWidth="40%"`       | `[pane]="{ listWidth: '40%' }"`   |
| `[paneTakeoverWidth]="700"` | `[pane]="{ takeoverWidth: 700 }"` |

### `[virtual]`

`virtual` on its own still turns virtual scrolling on.

| was                      | now                                   |
| ------------------------ | ------------------------------------- |
| `[viewportHeight]="520"` | `[virtual]="{ viewportHeight: 520 }"` |
| `[rowHeight]="32"`       | `[virtual]="{ rowHeight: 32 }"`       |
| `[maxHeight]="400"`      | `[virtual]="{ maxHeight: 400 }"`      |

`maxHeight` caps a grid that is not virtual too; it lives here because it is
the same measurement.

### `[grouping]`

| was                      | now                                        |
| ------------------------ | ------------------------------------------ |
| `groupBy="state"`        | `[grouping]="{ by: 'state' }"`             |
| `[groups]="groups"`      | `[grouping]="{ groups }"`                  |
| `showEmptyGroups`        | `[grouping]="{ showEmpty: true }"`         |
| `childrenKey="children"` | `[grouping]="{ childrenKey: 'children' }"` |

`[(collapsedGroups)]` does not move.

### `[filtering]`

| was                              | now                                  |
| -------------------------------- | ------------------------------------ |
| `quickFilterable`                | `[filtering]="{ quick: true }"`      |
| `[quickFilterFields]="['name']"` | `[filtering]="{ fields: ['name'] }"` |
| `quickFilterAlign="start"`       | `[filtering]="{ align: 'start' }"`   |

`[(quickFilter)]` and `[(filters)]` do not move.

### `[state]`

| was                | now                          |
| ------------------ | ---------------------------- |
| `stateKey="hosts"` | `[state]="{ key: 'hosts' }"` |
| `sync`             | `[state]="{ sync: true }"`   |

`[(columnState)]` does not move.

## `strct-icon`

| was                   | now                           |
| --------------------- | ----------------------------- |
| `badge="maintenance"` | `mode="maintenance"` (5.29.0) |

An amber disc was the same silhouette and hue as `paused` at 16 px, and it
took the one badge slot away from health.

## Removed in 6.0 with no replacement

- `.strct-badge--warninging`, a class alias kept since the original typo. Use
  `.strct-badge--warning`.
- `<strct-context-menu>`, the projected component. Use the data-driven
  `[strctContextMenu]` directive.

## How to check a screen is ready

1. Run it in a development build.
2. The console names every flat input still in use, once per app run.
3. When it says nothing, the screen is ready for 6.0.
