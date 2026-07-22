# Fix Request: StrctModal closes on Space/Enter typed inside a field

**Component:** `StrctModal` — `projects/strct/src/lib/modal/modal.ts` (selector `strct-modal`)
**Type:** bug fix
**Severity:** high — makes dismissible modals unusable for text entry (any space closes them)
**Reported from:** HyperStruct (a consumer app), 2026-07-04

## Symptom

In a **dismissible** modal, pressing **Space** (or Enter) while typing in a form field
**closes the modal**. E.g. typing an alarm/tag name with a space in it dismisses the dialog
mid-entry.

## Root cause

The overlay element carries keyboard close handlers:

```html
<div
  class="strct-modal__overlay"
  role="button"
  tabindex="0"
  (click)="onBackdrop()"
  (keydown.enter)="onBackdrop()"
  (keydown.space)="onBackdrop()"
></div>
```

`keydown.space` / `keydown.enter` fire on events that **bubble up from a child** (an
`<input>`/`<textarea>` inside the dialog). The dialog stops **click** propagation
(`(click)="$event.stopPropagation()"`) but NOT keydown propagation, so a space typed in a
field bubbles to the overlay and triggers `onBackdrop()` → `close()` (for a dismissible
modal). The handlers were intended only for when the **backdrop itself** is focused
(keyboard-activating the backdrop-as-button), not for bubbled field input.

## Proposed fix

Guard `onBackdrop` on the event target so it only acts when the interaction originated on
the overlay itself (a real backdrop click, or Enter/Space while the backdrop is focused):

```ts
// template — pass the event:
(click)="onBackdrop($event)"
(keydown.enter)="onBackdrop($event)"
(keydown.space)="onBackdrop($event)"

// component:
protected onBackdrop(event?: Event): void {
  if (event && event.target !== event.currentTarget) return; // ignore bubbled child events
  if (this.dismissible()) this.close();
}
```

(For clicks this is already effectively true — the dialog stops click propagation — so the
guard only changes keydown behavior.)

## Acceptance criteria

1. Typing a space (or Enter) in an input/textarea inside a **dismissible** modal no longer
   closes it; the space is typed normally.
2. A click on the backdrop still closes a dismissible modal.
3. Pressing Space/Enter while the **backdrop** (overlay) itself is focused still closes a
   dismissible modal (backdrop-as-button accessibility preserved).
4. A non-dismissible modal is unaffected (never closes on backdrop/keyboard).
5. Escape still closes per existing behavior.

## Notes

Additive, backward-compatible; no API change. This was verified as the exact fix against
0.17.0 in the consumer app before being filed here.
