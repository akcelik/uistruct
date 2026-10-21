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

`maxHeight` does **not** move. It caps a grid that is not virtual, and every
property of `[virtual]` turns virtual scrolling on — a grid given a height cap
would have lost its grouping with it. It stays an input of its own.

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

## One thing to know: an object replaces, it does not merge

`[selection]`, `[paging]` and the rest are ordinary inputs, so a second
binding replaces the first — there is no per-property merge:

```html
<!-- the second one wins; `by` is gone -->
<strct-datagrid [grouping]="{ by: 'state' }" [grouping]="{ groups }" />
```

That matters wherever a grid's inputs are layered — a wrapper component with
defaults, a test helper that sets a base and then applies a caller's record.
Merge them yourself:

```ts
const grouping = { by: 'state', ...(overrides.grouping ?? {}) };
```

The flat inputs never had this problem, because each was its own input. It is
the price of the smaller surface, and it is worth saying out loud before the
upgrade rather than after.

## The codemod

`scripts/migrate-6.mjs` does the rewriting. It reads `.html` files and the
inline `template:` of `.ts` files, finds each `<strct-datagrid …>` and folds
the flat attributes into the objects.

```
node scripts/migrate-6.mjs                 # dry run over the repo
node scripts/migrate-6.mjs src --write     # apply, under src/
```

It is deliberately conservative:

- an attribute it does not know stays where it is;
- the two-way state is never touched;
- an element inside a quoted attribute value — a code sample stored in a
  string — is skipped, because a wrong rewrite inside a string is worse than
  a missed one;
- an element it cannot parse is reported and skipped.

Run your formatter afterwards: removing attributes leaves the tag's line
breaks to the formatter, not to the tool.

It was written against this repo's own showcase: **34 inputs on 14 grids in
3 files**, after which the readiness check below prints nothing.

## How to check a screen is ready

1. Run it in a development build.
2. The console names every flat input still in use, once per app run.
3. When it says nothing, the screen is ready for 6.0.
