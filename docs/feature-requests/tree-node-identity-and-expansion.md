# Feature Request: StrctTree stable node identity + observable/controlled expansion

**Component:** `StrctTree` / `StrctTreeNode` — `projects/strct/src/lib/tree/tree.ts` (selectors `strct-tree`, `strct-tree-node`)
**Type:** feature (additive, backward-compatible)
**Severity:** high — no supported way to persist/restore or externally control the tree's expanded state
**Reported from:** HyperStruct (a consumer app), 2026-07-14 · against `@akcelik/strct@0.17.2`

## Need

HyperStruct's sidebar inventory tree must return to the **user's last state** on page
reload — which nodes are expanded, plus the selected node. Selection is already solvable
(the consumer drives it from the route), but **expansion is not observable or controllable**
through the current `strct-tree` API, so there is no first-class way to save/restore it.

The container (`StrctTree`) exposes only `[nodes]`, `[nodeMenu]`, `(nodeActivated)`,
`(nodeMenuSelect)`. In data mode a node's expansion lives in a **private** `dataExpanded`
signal inside `StrctTreeNode`, seeded once from `node.expanded` and thereafter owned
internally; `toggle()` mutates it but **emits nothing**. So a consumer cannot:

1. **Observe** expand/collapse (no `(expandedChange)` / `(nodeToggled)` output), and
2. **Control** expansion as the single source of truth (`node.expanded` only _seeds_ the
   first render — re-passing `[nodes]` with updated `expanded` does not re-sync once the
   user has toggled), and
3. **Identify** a node — `StrctTreeNodeData` has no `id`/key, the container's
   `@for (n of ns; track $index)` tracks by index, and nothing renders a stable
   `data-*` attribute, so there is no way to correlate a DOM node back to its data either.

### The workaround we were forced into (please make it unnecessary)

To persist expansion we ran a `MutationObserver` on `aria-expanded` and mapped the mutated
DOM row back to a node via `window.ng.getComponent(el)`. That global is the **Angular
devtools API and is stripped from production builds**, so the save path was a silent no-op
when deployed — the tree collapsed to defaults on every reload. We replaced the `window.ng`
call with reconstructing each node's **rendered label-path** (root → node) and mapping that
to a moref — functional, but fragile (breaks on duplicate sibling labels, and couples to the
`.strct-tnode__label` DOM structure). A supported API removes all of this.

## Proposed API

### 1. Stable node identity

```ts
export interface StrctTreeNodeData {
  /** Stable unique key. Used for trackBy, expansion state, and a data-node-id DOM attribute.
   *  Falls back to label when absent (current behavior). */
  id?: string;
  label: string;
  // …unchanged…
}
```

- Container `@for` → `track n.id ?? n.label` (stable component identity across rebuilds; today
  `track $index` can bind a node's internal state to the wrong item when the list reorders).
- Render it on the node host so external/e2e code can find a node without devtools:
  `host: { '[attr.data-node-id]': 'node()?.id ?? null' }`.

### 2. Observable expansion (output)

```ts
// StrctTree (container)
readonly expandedChange = output<string[]>();          // full set of expanded ids, on every change
// and/or, per-toggle:
readonly nodeToggled = output<{ node: StrctTreeNodeData; expanded: boolean }>();
```

`StrctTreeNode.toggle()` (data mode) should emit up to the container so it can surface these.

### 3. Controlled expansion (input, ideally two-way)

```ts
// StrctTree (container)
readonly expandedIds = model<string[] | null>(null);   // when non-null, it is the source of truth
```

When `expandedIds` is provided, `StrctTreeNode.isOpen` derives from it
(`expandedIds.includes(node.id)`) instead of the private `dataExpanded`, and `toggle()`
writes back through the model. This makes the parent authoritative, so persistence becomes a
one-liner:

```html
<strct-tree [nodes]="nodes()" [(expandedIds)]="expandedIds" />
```

```ts
constructor() {
  effect(() => localStorage.setItem('tree-expanded', JSON.stringify(this.expandedIds())));
}
```

## Behavior / compatibility

- All three additions are **optional**. With no `id`, no `expandedIds`, and no listeners, the
  component behaves exactly as today (label fallback, data-seeded expansion).
- `expandedIds` (controlled) should take precedence over `node.expanded` (seed) when both are
  present; keep `node.expanded` as the uncontrolled seed for consumers that don't want control.
- Expanding a node to reveal an active/selected descendant (programmatic expand) should also
  reflect into `expandedIds` so it round-trips.

## Status / note to owner

Not implemented in the framework — reported only. HyperStruct currently ships the label-path
workaround in its own `object-tree.ts` (no framework change this time). Once this API lands,
HyperStruct will drop the `MutationObserver`/label-path code and switch to `[(expandedIds)]` +
`(expandedChange)`. Please adopt/amend as you see fit and cut the release; see the sibling FR
`datagrid-initial-selection.md` for the same controlled-state pattern on `StrctDatagrid`.
