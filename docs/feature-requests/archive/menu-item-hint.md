# FR-42-01 — A menu item can say why it is disabled, without putting it in its label

> **RESOLVED in 4.2.0 (2026-09-22).** `StrctMenuItem.hint` ships as proposed, and in every
> renderer — the context menu (and so tree / datagrid row menus) and its submenus,
> `strct-menubar` and its submenus, `strct-split-button`, plus a `hint` input on
> `strct-dropdown-item` for declarative menus. Accessibility, decided in the same change:
> disabled entries use `aria-disabled`; one WITH a hint is keyboard-reachable so its reason
> is announced, one without is skipped as before (no change for menus without hints).
> The description is `aria-describedby` to a hidden node (wider support than
> `aria-description`). Two deviations from the sketch: the tooltip sits on the button, not
> `.strct-menu__wrap` — the wrapper also holds the submenu, whose entries would inherit the
> title; and since the button is no longer natively disabled, it receives the pointer
> itself. Verified in Chrome: the accessibility tree reports the hint as the description,
> and the menu measures 191px with or without the hint nodes. HyperStruct can retire the
> label-appending adapter.

**From:** HyperStruct (VM / host context menus, object action bars) · **Version:** 4.1.0 ·
**Severity:** medium — every disabled entry in a real menu carries its reason in its label
("Clone — VM must be powered off to clone.", "Unregister — VM must be powered off to
unregister."), which makes the menu two or three times as wide and hard to scan. The operator
asked for the reason as a tooltip instead.

## Rule the change should encode

**A menu shows actions; why an action is unavailable is shown on demand.** An entry's label
stays its name. Its explanation — above all, why it is disabled — appears when the pointer
rests on it and is announced by assistive technology, and never widens the menu.

## Why the app puts the reason in the label today

`StrctMenuItem` has no slot for it (`label` is plain interpolated text), and a disabled entry
with no explanation is worse than a wide one: HyperStruct once shipped a "Drain Node" entry
that looked like a real, merely unavailable action. So its menu adapter appends the reason to
the label (`${label} — ${reason}`) — the only place the operator can read it. That adapter is
the workaround this FR retires.

## Proposed API

```ts
interface StrctMenuItem {
  // …
  /**
   * A short explanation shown as the entry's tooltip and given to assistive technology as
   * its description — typically why a disabled entry is unavailable. Never rendered inline.
   */
  hint?: string;
}
```

## Proposed rendering (menu.ts)

The entry is a `<button [disabled]>` inside `.strct-menu__wrap`. A disabled button does not
receive pointer events in every browser, so the tooltip belongs on the wrapper, which does:

```html
<div
  class="strct-menu__wrap"
  [attr.title]="item.hint || null"
  (mouseenter)="onHover(i)"
  (mouseleave)="onLeave(i)"
>
  <button … [attr.aria-description]="item.hint || null"></button>
</div>
```

A native `title` is enough here — it is what the operator asked for, it needs no positioning,
and it does not interfere with the menu's own hover / submenu handling. (A styled tooltip
would be welcome later; the API does not change.)

### Accessibility — worth deciding in the same change

A `disabled` menu item is skipped by the keyboard (`onKeydown` / the active-index logic treat
it as absent), so a keyboard or screen-reader user never reaches the entry or its hint. The
WAI-ARIA Authoring Practices keep disabled menu items focusable and mark them
`aria-disabled="true"` instead, so they can be discovered and their reason read. If that is
adopted, `disabled` should still block `action` and the click, exactly as now.

## Acceptance

1. `{ label: 'Clone', disabled: true, hint: 'VM must be powered off to clone.' }` renders the
   label `Clone` only; resting the pointer on the entry shows the hint.
2. The same on an enabled entry (a hint is not only for disabled ones).
3. The button exposes the hint as its accessible description (`aria-description`, or a
   visually hidden element referenced by `aria-describedby`).
4. No hint → no `title` / `aria-description` attribute at all (not an empty one).
5. Works inside a submenu panel.
6. The menu's width is unchanged by a hint.

## What HyperStruct does once it ships

`strct-menu.adapter.ts` stops appending the reason: `label` stays the action's name and
`hint` carries the reason (and "not available on this screen" for an entry this surface does
not wire). The adapter's spec changes from "the reason is in the label" to "the reason is the
hint, the label is the name".
