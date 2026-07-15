# Feature Request: StrctModal `draggable` (reposition by header)

**Component:** `StrctModal` — `projects/strct/src/lib/modal/modal.ts` (selector `strct-modal`)
**Type:** feature
**Priority:** medium — lets users move a modal aside to see the content behind it
**Reported from:** HyperStruct (a consumer app), 2026-07-15

## Motivation

HyperStruct's assistant is a large (`lg`) modal chat surface. Operators wanted to **drag it
aside** to read the inventory/dashboard behind it while chatting — but `StrctModal` is fixed,
centered, and cannot be moved. A common pattern for tool/assistant dialogs is a draggable
window.

## Proposed API

```ts
/** When set, the dialog can be dragged by its header to reposition it on screen. */
readonly draggable = input(false, { transform: booleanAttribute });
```

### Behavior

- With `draggable`, the header (`.strct-modal__head`) is the **drag handle**
  (`cursor: move`); the body/footer are not.
- Pointer drag (mouse + touch via Pointer Events) translates the dialog; it stays **clamped
  within the viewport** (never fully off-screen).
- **Does not** start a drag when the pointer goes down on the close button or any interactive
  header control — only on empty header space.
- **Resets to centered** each time the modal opens (position is per-open, not persisted).
- Text selection is disabled while dragging; a drag doesn't trigger the backdrop-close.
- Respects `prefers-reduced-motion` only insofar as there's no drag inertia/animation anyway.

### Sketch

- Track an offset `{x,y}` (signal) applied as `transform: translate(x, y)` on the dialog.
- `pointerdown` on the head (guarded against the close button) → record start pointer +
  current offset, `setPointerCapture`; `pointermove` → update offset (clamped to viewport);
  `pointerup`/`lostpointercapture` → end.
- On `open` true → reset offset to `{0,0}`.

### Accessibility

- Dragging is a pointer enhancement; keyboard/AT users are unaffected (dialog stays reachable,
  focus trap unchanged). No keyboard move is required for v1.

## Optional follow-on

- `resizable` input (drag a corner/edge to resize) — separate FR; not needed for v1.

## Acceptance criteria

- `draggable` false/absent → **no behavior change** (still fixed + centered).
- With `draggable`, the operator can drag the dialog by its header; it can't be dragged fully
  off-screen; closing + reopening re-centers it.
- Dragging never closes a dismissible modal, and clicking the close button still closes it.
- Works with mouse and touch.
