# Feature Request: StrctDatagrid — reveal the full value of a `singleLine`-truncated cell

**Component:** `StrctDatagrid` — `projects/strct/src/lib/datagrid/datagrid.ts` (selector `strct-datagrid`)
**Type:** enhancement (additive; no API change required for the baseline fix)
**Severity:** medium — `singleLine` silently hides data with no way to read it
**Reported from:** HyperStruct (a consumer app), 2026-07-19

## Need

`singleLine` makes every row exactly one line tall by clipping cell content:

```ts
readonly singleLine = input(false, { transform: booleanAttribute });   // datagrid.ts:1067
'[class.strct-dg-host--singleline]': 'singleLine()',                   // datagrid.ts:486
```

```css
/* datagrid.ts:699 */
.strct-dg-host--singleline .strct-dg tbody tr:not(.strct-dg__detailrow) > td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}
```

The layout win is real, but the clipped text becomes **unreachable**: the cell renders
either a plain interpolation or a projected template

```html
<!-- datagrid.ts:338–356 -->
<td …>
  @if (cellTemplate(col.key); as tpl) { <ng-container [ngTemplateOutlet]="tpl" … /> } @else { {{
  row[col.key] }} }
</td>
```

and **nothing sets `title` or a tooltip anywhere in the grid**. So an ellipsis is a dead
end — no hover, no keyboard path, no reveal. The value is simply gone from the UI.

The practical consequence for a consumer: `singleLine` can't be applied uniformly.
HyperStruct wanted one datagrid configuration app-wide (a house rule: one component,
configured one way everywhere) but had to **carve out 7 grids across 4 files** —
audit-log entries, event descriptions, editable-settings values, certificate
subject/issuer/PEM — precisely the grids where the text is long _and_ the grid is the
only place it's shown. That inconsistency is the thing the rule exists to prevent.

## Desired behavior

When `singleLine` is on and a cell's content is **actually clipped**, hovering it reveals
the full text. Cells that fit are untouched (no redundant tooltip on every cell).

Must work for **both** cell kinds — plain interpolation _and_ `strctCell` templates.
Reading the rendered `textContent` satisfies both for free; reading `row[col.key]` would
not (a templated cell may render something quite different from the raw value).

## Proposed implementation (baseline — lazy, one delegated listener)

No new input needed; it's implied by `singleLine`. Measure on hover so render cost stays
zero and large/virtualised grids don't pay for cells nobody looks at:

```ts
// bind once on <tbody>: (mouseover)="revealIfClipped($event)"
protected revealIfClipped(ev: Event): void {
  if (!this.singleLine()) return;
  const td = (ev.target as HTMLElement | null)?.closest('td');
  if (!td) return;
  if (td.scrollWidth > td.clientWidth) {
    // textContent covers templated cells too — it's what the user actually sees
    const full = (td.textContent ?? '').trim();
    if (full && td.getAttribute('title') !== full) td.setAttribute('title', full);
  } else {
    td.removeAttribute('title');   // column resized wider / value changed
  }
}
```

One listener per grid, O(1) per hover, and it self-corrects when a column is resized.

### Alternative (richer, more consistent with the library)

The library already ships `[strctTooltip]` (`lib/tooltip/tooltip.ts`). Routing the reveal
through it instead of the native `title` gives themed styling, touch support, and a
keyboard-reachable path — `title` is not exposed to keyboard users and screen-reader
support is inconsistent. If the tooltip directive can be attached imperatively (or the
`<td>` can host it conditionally), that is the better long-term shape; `title` is the
pragmatic 80% fix that unblocks consumers today.

## Acceptance criteria

- With `singleLine`, hovering a **clipped** cell reveals its full text.
- A cell that fits gets **no** tooltip/title.
- Works for default cells and `strctCell`-templated cells alike.
- No measurement work at render time (hover-lazy), and it stays correct after a column resize.
- `singleLine` off ⇒ behavior completely unchanged.

## Consumer note (HyperStruct)

77 grids across 39 files already run `singleLine`; the 4 files above are excluded solely
because of this gap. Once this ships we drop the exceptions and go 82/82 uniform.
