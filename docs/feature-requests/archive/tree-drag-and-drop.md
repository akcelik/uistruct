# FR-43-04 — drag-and-drop in `strct-tree` (data-driven mode)

> **RESOLVED in 4.4.0 (2026-09-26).** Everything under "What the consumer needs" ships:
> `canDrag` (re-asked when `nodes` changes), `canDrop(source, target)` asked during `dragover`
> with the tree keeping the source, `(nodeDrop)` for accepted drops only, the self/subtree
> guards, token feedback, hover-expand (`dragExpandDelay`, 700ms) and edge auto-scroll, and
> the two polite announcements. `position: 'into'` is on the event, as the FR suggested, so
> before/after reordering can arrive without changing its shape. Touch and multi-node drag
> are still out, as agreed.
>
> Cycle detection is by node identity (`id`, falling back to `label`), not DOM containment —
> a collapsed subtree has no DOM to contain anything, which is the case the consumer's
> directive could not see. Verified in Chrome; the numbers are in the CHANGELOG entry.
> HyperStruct can delete `tree-drag-drop.directive.ts` and its spec.

**From:** HyperStruct (the inventory tree in the side navigation, O235) · **Version:** 4.2.0 ·
**Severity:** medium. Operators expect vCenter's gestures in an inventory tree: drag a VM into
a folder, drag it back out onto its datacenter, drag a VM onto another host to migrate it.
`strct-tree` has no drag-and-drop API, so the consumer grafts it onto the rendered DOM. The
operator reported the result as "drag-and-drop does not work in the trees".

## What the consumer needs

Moving things around is the consumer's business, and so are the rules. The tree provides the
gesture, the feedback and the identity of the two nodes involved.

1. **Which nodes can be picked up:** `canDrag: (node: StrctTreeNodeData) => boolean`. The
   default is none, which is today's behaviour. The answer changes with the data (a refresh
   can make a node movable), so it is asked again whenever `nodes` changes, not once.
2. **Where the dragged node may land:**
   `canDrop: (source: StrctTreeNodeData, target: StrctTreeNodeData) => boolean`. It is asked
   during `dragover`. A browser does not let `dragover` read the drag's data, so the tree must
   keep the source node itself. That is the part a consumer cannot do cleanly from outside.
3. **The result:** `(nodeDrop)` emitting `{ source: StrctTreeNodeData; target: StrctTreeNodeData }`,
   and only for a target `canDrop` accepted.
4. **Built in, whatever `canDrop` says:**
   - a node is never dropped on itself;
   - a node is never dropped into its own subtree (a folder into its own subfolder is a cycle).
5. **Feedback, in the library's tokens:**
   - the source row is dimmed while it is being dragged;
   - an accepting target row is highlighted; a refusing one shows the "not allowed" cursor
     (no `preventDefault` in `dragover`);
   - the highlight clears on `dragleave`, `drop` and `dragend`, including when the drop lands
     outside the tree.
6. **Moving through a large tree while dragging:**
   - hovering a collapsed node for about 700 ms expands it;
   - holding the pointer near the top or bottom edge of a scrolling container scrolls it.

   Without these, a target that is not already visible cannot be reached. In the consumer's
   tree that is the normal case: thousands of VMs, folders collapsed by default.

## Not needed now (worth deciding in the design)

- **Positional drops** (`before` / `after` / `into`). The consumer only drops _into_ a node.
  An inventory is sorted, not hand-ordered. A `position` field on the event would leave room
  for it later.
- **Touch.** HTML5 drag-and-drop does not fire on touch screens. A pointer-events
  implementation would cover touch too, but the consumer does not depend on it.
- **Multi-node drag.** The tree has no multi-select.

## Accessibility

Drag-and-drop is a pointer shortcut. In the consumer, every drop has a keyboard route (Move to
Folder…, Migrate… in the node's context menu), so the tree does not need a keyboard drag mode.
It should:

- announce "Dragging _label_" and "Dropped _label_ on _target_" in a polite live region;
- keep `role="treeitem"` rows focusable and operable exactly as today.

## What the consumer does today (remove when this ships)

`web/hyperstruct-ui/src/app/shell/tree-drag-drop.directive.ts`, an attribute directive on
`<strct-tree>`:

- **Finding the nodes:** it matches each `<strct-tree-node>` to its bound node by the
  `data-node-id` attribute (from `StrctTreeNodeData.id`). It takes the row as the node's own
  `:scope > [role="treeitem"]` child. It re-scans on every DOM mutation and every 2 s, because
  rows appear and disappear as subtrees expand.
- **Making rows draggable:** it sets `draggable="true"` and `user-select: text` inline on every
  row `canDrag` accepts. It is not known whether the `user-select` override is needed in every
  browser.
- **Tracking the drag:** it keeps the dragged node in its own state for `dragover`. It checks
  for a cycle by DOM containment (`sourceNode.contains(targetNode)`).
- **Feedback:** it adds the consumer's own `drag-source` / `drag-target-active` classes and sets
  a `grabbing` cursor on `<body>` during the drag.
- **Guarding strct upgrades:** a spec (`tree-drag-drop.directive.spec.ts`) runs the directive
  against the real `strct-tree`, so a strct change to that DOM fails the consumer's test suite.

The first version of this directive paired the DOM with the data by walking both trees in the
same order. It also hard-coded its own rule: only VMs and folders could be dragged, and only
onto folders, whatever the tree showed. So in the default "Hosts & Clusters" view a host or a
cluster could never be dragged into its folder, and a VM dropped on a host folder went to the
server only to be refused. An object in a folder could not be dragged back out, because a
datacenter was never a target. With the tree owning the gesture and the consumer owning the
rule, the gesture code would have had no rule to get wrong.
