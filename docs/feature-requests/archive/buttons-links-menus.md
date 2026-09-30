# FR-48-09 … 12 — Buttons, links, menus

> **FR-48-09 and FR-48-12 SHIPPED in 4.12.0 (2026-09-29)** — `variant="link"` (with `interactive`
> crumbs) and the icon count badge.
>
> Measured in Chrome: the link variant has no padding, no border and no background, keeps `--acc`
> text, is a real `<button>` in the tab order, underlines on hover **and** on keyboard focus
> (`:focus-visible` matched after a Tab), and goes `--t4` with no underline when disabled. The FR's
> contrast ask is now a CI gate rather than a claim: the a11y smoke sets each of the six schemes on
> the root and measures `--acc` composited over `--bg-1` — **arctic 6.34 / 5.39 · ember 6.96 / 5.78
> · sage 6.77 / 5.37**, all above AA's 4.5. It failed correctly while the reading was empty, before
> the colour parser learned hex.
>
> The count badge reads 7, caps 120 at "99+" (or at any `countMax`, measured with 9 → "5+"), draws
> nothing for 0, sits on the top end corner at 14px, and replaces the status dot — an icon says one
> thing at a time. It is `aria-hidden`, and `countLabel` puts it in the icon's own name instead:
> "Alarms, 7 new". A decorative icon stays decorative.
>
> A crumb takes `interactive` rather than the FR's "when `(activated)` is bound": Angular's output
> API does not expose whether an output has a listener, so the intent is stated — the way
> `strct-list-item` and `strct-tag` already read.
>
> **FR-48-10 and FR-48-11 SHIPPED in 4.13.0 (2026-09-29)** — `anchor` / `placement` / `offset` on
> `StrctMenuService.open`, and `[strctDropdownItemAction]`.
>
> Measured in Chrome at a 700px viewport: a button 32px from the bottom asks for `bottom-start` and
> gets its menu **above** — panel bottom 640 against anchor top 646, a 6px gap, start-aligned,
> entirely in the viewport and not touching the button. `bottom-end` aligns the end edges,
> `right-start` puts the panel's left edge 6px past the anchor's right with their tops level, and
> Escape returns focus to the anchor. The panel is `visibility: hidden` for the frame it is being
> measured in, so it never appears in the wrong place first; the unit tests pin the four acceptance
> points against a mocked panel size, including that `x` / `y` calls are untouched.
>
> The dropdown action: the × deletes without opening the item and **the menu stays open** (3 items
> → 2, echo "deleted CPU pressure"), it sits at the item's end with `tabindex="-1"`, the right
> arrow moves focus to it, the left arrow returns to the item, and Delete on the item triggers it.
> An item without the slot is untouched.
>
> **Every ask in this document has shipped.**

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](../hyperstruct-hand-built-audit.md).

---

## FR-48-09 — `strct-button variant="link"`; clickable breadcrumb items

### Rule

**An action inside running text looks like a link and behaves like a button.** Examples are "Show all", a folder name
in a file list, "Use another method" and "Open the view". A `flat` button is too heavy inline, and a bare `<a>` with
`(click)` and no `href` cannot be reached with Tab.

### What the app does today

The app writes eleven variants of `background:none; border:0; color:var(--acc); text-decoration:underline on hover`:

- **Folder navigation (object-detail/csv-files-view.ts):**
  - :113 `.cf-crumb`: a raw `<button>` inside `strct-breadcrumb-item`, because the item styles only a projected `<a>`
    and has no click output for crumbs that do not route;
  - :145 `.cf-dir`: a folder name in a cell.
- **Other screens:**
  - object-detail/host-monitor-view.ts:280 `.mon-viewopen`;
  - login.html:124 `.auth-alt`;
  - shell/recent-tasks.ts:95 `.rt-toggle`;
  - dashboard.ts:740 and :743 `.foot-link`.
- **`strct-button` restyled into a link:** administration/admin-summary.ts:131 `.sm-link` and appliance-proxy.ts:182
  `.px-link`.
- **Keyboard-unreachable links** (`<a>` with `(click)` and no `href`): shell/recent-tasks.ts:143 and :152, and
  updates.ts:178.

### Proposed API

```ts
type StrctButtonVariant = 'primary' | 'critical' | 'outline' | 'flat' | 'neutral' | 'link';
```

**`variant="link"`:**

- no padding, border or background, and inline height;
- `--acc` text, underlined on hover and on focus-visible;
- `size` scales only the font;
- disabled uses `--t4` and has no underline.

It works on `button` and on `a` (with `href` / `routerLink`), like the other variants.

**Breadcrumbs:**

```ts
// strct-breadcrumb-item
readonly activated = output<void>();   // when bound and there is no <a>, the item renders its text as a link-variant button
```

### Accessibility

The variant is still a `<button>` (or a real `<a href>`), so it keeps a tab stop and Enter / Space. The contrast of
`--acc` on `--bg-1` meets AA in all six schemes; add a test for that.

### Acceptance

`<button strct-button variant="link">Show all</button>` sits on the text baseline with no box. A breadcrumb item with
`(activated)` and plain text is a focusable link-looking button. Existing variants are unchanged.

---

## FR-48-10 — `StrctMenuService.open`: anchor, placement, flip

### Rule

**A menu opened from a control never covers it.** It opens below or above the control, aligned to its start or end,
and flips when there is no room. Only the library knows the menu's size, so only the library can do this correctly.

### What the app does today

`StrctMenuOpenOptions` takes `x` and `y` (the menu's top-left corner), and the panel is clamped to the viewport without
flipping. HyperStruct's console window has two menus that need an anchor, and both guess sizes:

```ts
// object-detail/vm-console-live.ts:872 — Actions, end-aligned under its button: assumes a 260px wide menu
this.menus.open({ x: Math.max(8, r.right - 260), y: r.bottom + 6, items: this.menu() });
// :890 — Keyboard, above its button in the status bar: estimates the height (31px per row, 9 per divider)
const height = rows * 31 + (items.length - rows) * 9 + 10;
this.menus.open({ x: r.left, y: Math.max(8, r.top - 4 - height), items });
```

Before the estimate, the keyboard menu was clamped down over its own button. The pointer, left on "Other layouts",
then opened that submenu by itself.

### Proposed API

```ts
interface StrctMenuOpenOptions {
  x?: number; // now optional: either x/y or anchor
  y?: number;
  /** Element (or rect) the menu belongs to. */
  anchor?: Element | DOMRect;
  /** Preferred side and alignment relative to the anchor; flipped when it does not fit. Default 'bottom-start'. */
  placement?:
    'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'left-start';
  /** Gap between anchor and menu in px (default 4). */
  offset?: number;
  // items, data, onSelect — unchanged
}
```

The menu is measured after it renders, before it is shown (`visibility:hidden` for one frame), so placement and flip
use its real size. Submenus already place themselves; they are unchanged.

### Accessibility

Focus returns to the anchor on close. That is already the case with `restoreTo`; with `anchor` it becomes explicit.

### Acceptance

1. A menu with `anchor` and `placement: 'top-start'`, opened from a button 20px above the viewport bottom, opens above
   the button with its bottom edge `offset` above it.
2. The same menu, opened from a button at the top edge, flips to below.
3. `bottom-end` aligns the menu's end edge with the anchor's.
4. Calls with `x` / `y` are unchanged.

---

## FR-48-11 — `strct-dropdown-item`: a trailing secondary action

### Rule

**A saved item in a menu can be removed from the menu.** Saved views and recent searches need an "open" and a
"delete" in one row, with two targets.

### What the app does today

object-detail/host-monitor-view.ts:277–298 builds the Saved views list inside `strct-dropdown popover` from its own
rows:

- `.mon-viewrow`, with a link-looking open button (`.mon-viewopen`) and a ✕ (`.mon-x`);
- hover and keyboard behaviour written by hand.

`strct-dropdown-item` offers only `selected`, `critical`, `disabled` and `hint`.

### Proposed API

```html
<strct-dropdown-item (click)="open(v)">
  {{ v.name }}
  <button
    strctDropdownItemAction
    strct-button
    variant="flat"
    size="mini"
    iconOnly
    aria-label="Delete view"
    (click)="remove(v)"
  >
    <strct-icon strictName="close" [size]="12" />
  </button>
</strct-dropdown-item>
```

- **The slot.** `[strctDropdownItemAction]` renders at the item's end.
- **Clicks.** A click on the action does not activate the item and does not close the menu.
- **Keyboard.** The action is reached with the right arrow from its item, and left returns to the item. The action also
  answers to Delete, as in the WAI-ARIA menu pattern for secondary actions.

### Acceptance

Clicking the ✕ deletes without opening and the menu stays open. Right arrow moves focus to the ✕ and Enter deletes.
Items without the slot are unchanged.

---

## FR-48-12 — `strct-icon`: a count badge

### Rule

**A bell with seven alarms says 7.** `badge` draws a status dot only, so it cannot say how many.

### What the app does today

- shell/alarms-bell.ts:50 `.ab-count` (plus `.ab-crit`) and shell/drift-indicator.ts:34 `.di-count`: an absolutely
  positioned 15px pill with a warning or critical background and a white 10px bold number.
- `strct-notification-center` has a count but is tied to toast history, so it can hold neither alarms nor drift.

### Proposed API

```ts
// strct-icon (additions)
readonly count = input<number | null>(null);          // null/0 = no badge
readonly countMax = input(99);                         // renders "99+"
readonly countStatus = input<StrctStatus>('critical');
readonly countLabel = input<(n: number) => string>((n) => `${n} new`);   // accessible text, localizable
```

- **Placement.** The badge sits on the icon's top end corner and renders instead of `badge`.
- **Sizing.** Its height is 1.2em of the icon size, with a minimum of 14px.
- **Colours.** `status` → `--{tone}` background and `--inv` text.

### Accessibility

The count is exposed as the icon's `aria-label` suffix via `countLabel`, or on the host button when the icon is
decorative.

### Acceptance

`<strct-icon strictName="bell" [count]="7" />` renders a critical "7" badge. `[count]="120"` renders "99+".
`[count]="0"` renders none. `badge` still works.
