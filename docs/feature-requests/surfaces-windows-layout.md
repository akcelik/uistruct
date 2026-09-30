# FR-48-33 … 38 — Surfaces, windows, layout

> **FR-48-34, 37 and 38 SHIPPED in 4.20.0 (2026-09-30)** — the new `strct-media-frame`, the shell's
> skip link, and the accordion's quiet appearance.
>
> Measured in Chrome: the **first Tab** on the docs site lands on "Skip to main content", which
> becomes visible (`transform: none`) and, on Enter, moves focus to `<main id="main-content">` with
> `tabindex="-1"` applied — focus, not only scroll, so the next Tab resumes inside the content. The
> showcase's own shell now carries it, so the site is the demo. The quiet fold is still a `<button>`
> with `aria-expanded` over a `role="region"` body labelled by it, at 12px / weight 400 in `--t2`
> with no borders and a 12px indent, against the boxed header's 13px / 11px 14px. The frames hold a
> 1.33 ratio (4 / 3) at every state, `off` goes black, `loading` spins, the others show an icon with
> their line, and the interactive hit area covers the frame exactly (border included) under one
> accessible name.
>
> **Still open here: FR-48-33** (`strct-window` + dock), **35** (splitter px bounds, collapsible
> pane, `[strctResizeHandle]`), **36** (connected reorder lists and a drag handle).

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](hyperstruct-hand-built-audit.md).

---

## FR-48-33 — `strct-window` (new): non-modal, draggable, resizable, minimisable

### Rule

**Some work lives in a window beside the page.** A VM's console stays open while the operator browses. It can be moved,
resized and minimised, it survives navigation, and it comes back from a chip. A modal blocks the page; a drawer is
pinned to an edge. Neither is a window.

### What the app does today

object-detail/vm-console-live.ts and shell/console-windows.ts implement a whole window system by hand:

- **Backdrop.** `.cl-backdrop` (85): a click beside the window minimises it.
- **Frame.** `.cl-window` (86–255): 12px radius, `--shh`-like shadow, `--b2` border, and a forced dark palette for the
  console.
- **Title bar.** `.cl-title` (98–123) is the drag area, with the name, a power pill, the host and cluster, and the
  window controls.
- **Resize.** `.cl-rz` (251–254): four corner handles.
- **Status bar.** `.cl-status` (231–248), with the connection state and the keyboard-layout menu (FR-48-10).
- **Minimising.** Minimised windows become chips in the Recent Tasks bar (shell/console-chips.ts, FR-48-03). Up to four
  sessions exist, one shown at a time.
- **Focus and keyboard** are hand-managed: keys go to the VM only while its screen has focus.

`strct-modal draggable chromeless` gives the drag and nothing else: no resize, no minimise, no fullscreen, and it
blocks the page.

### Proposed API

```html
<strct-window
  [(open)]="open"
  [(minimized)]="min"
  [(bounds)]="rect"
  heading="APP01"
  [resizable]="true"
  palette="dark"
>
  <ng-container strctWindowTitleMeta
    ><strct-badge status="success">Running</strct-badge></ng-container
  >
  <ng-container strctWindowActions>…</ng-container>
  …content…
  <ng-container strctWindowStatus>…</ng-container>
</strct-window>
<strct-window-dock />
<!-- renders minimised windows as FR-48-03 tags; place it in a toolbar -->
```

```ts
readonly open = model(false);
readonly minimized = model(false);
readonly maximized = model(false);           // fills the viewport (not browser fullscreen)
readonly bounds = model<{ x: number; y: number; width: number; height: number } | null>(null);
readonly heading = input('');
readonly resizable = input(true, { transform: booleanAttribute });
readonly minWidth = input(480);
readonly minHeight = input(320);
readonly palette = input<'inherit' | 'dark' | 'light'>('inherit');
readonly closeOnOutside = input<'none' | 'minimize'>('none');
readonly closed = output<void>();
// labels: minimize, maximize, restore, close
```

- **Stacking.** Windows stack on a new `--z-window` layer (for example 500), between `--z-tour` (400) and `--z-modal`
  (1000). A modal opened from inside a window therefore still comes up over it. The active window is raised.
- **Dock.** `strct-window-dock` lists minimised windows by `heading`. Activating a tag restores the window; its ×
  closes it.

### Accessibility

- The window is `role="dialog"` with `aria-modal="false"`.
- **Focus.** It moves in on open and is restored on minimise and close (overlay/focus helpers). Escape minimises, since
  a window is not dismissed like a modal.
- **Resizing.** Resize handles are focusable: arrows resize by 16px, Shift+arrows by 64px.
- **Moving.** The title bar moves with Alt+arrows.

### Acceptance

A window opens over the page without blocking it. It can be dragged, resized from a corner, minimised to the dock,
restored from the dock, and its bounds persist through `bounds`. Focus returns to the opener on close. It works in all
six schemes, and `palette="dark"` forces dark inside.

---

## FR-48-34 — `strct-media-frame` (new): a fixed-ratio frame with placeholder states

### Rule

**A live picture, such as a console thumbnail or a camera, sits in a fixed-ratio frame.** When there is no picture yet,
or none at all, the frame says why in its own small space.

### What the app does today

object-detail/vm-console.ts:49–79 `.vc-frame`: `--bg-3` or black, a border, 6px radius and a 4:3 ratio. The
`.vc-empty` and `.vc-off` placeholders sit on the VM Overview's verdict card at 240px wide. `strct-empty-state` is too
large for that space (FR-48-20).

### Proposed API

```ts
readonly ratio = input('4 / 3');
readonly state = input<'content' | 'loading' | 'empty' | 'off' | 'error'>('content');
readonly message = input('');                 // placeholder text
readonly icon = input('');
readonly interactive = input(false, { transform: booleanAttribute });   // the whole frame is a button (open the console)
readonly activated = output<void>();
```

### Acceptance

A 240px frame shows the projected image at 4:3. `state="off" message="The VM is off"` shows an icon and one line
centred in it. `interactive` makes the whole frame one tab stop.

---

## FR-48-35 — `strct-splitter` pixel bounds and a collapsible pane; `[strctResizeHandle]`

### Rule

**Panes are sized in pixels, remembered, collapsible, and resizable from the keyboard.** A sidebar is 280px, not 22%.
A bottom task panel's height is dragged by its top edge.

### What the app does today

- shell/shell.html:107 `.sb-resizer / .sb-resizer__grip`: the navigation sidebar's width. It is a 1px rule with a
  3×34px grip that turns accent on hover, and pixel min and max are enforced in TypeScript.
- shell/recent-tasks.ts:93 `.rt-grip`: the Recent Tasks panel's height, a 5px ns-resize bar.
- Neither can be moved with the keyboard.
- object-detail.html:1671 (the file browser dialog) fixes its left pane at 240px.

`strct-splitter` splits by percent, wraps both panes itself, and cannot collapse a pane.

### Proposed API

```ts
// strct-splitter (additions)
readonly unit = input<'percent' | 'px'>('percent');
readonly minSize = input<number | null>(null);         // in `unit`, for the first pane
readonly maxSize = input<number | null>(null);
readonly collapsible = input(false, { transform: booleanAttribute });
readonly collapsed = model(false);
```

```html
<!-- a handle for layouts the splitter does not own (shell grids, a docked panel) -->
<div
  [strctResizeHandle]="'y'"
  [(size)]="panelHeight"
  [min]="120"
  [max]="600"
  aria-label="Resize the task panel"
></div>
```

`[strctResizeHandle]` renders the library's grip and has the `role="separator"` and keyboard model of the splitter's
gutter: arrows step, Home and End go to min and max, and Enter collapses when `collapsible`.

### Acceptance

The sidebar handle and the task-panel handle can be replaced by `strctResizeHandle`, each reachable with Tab and moved
with arrows. `unit="px" [minSize]="200"` keeps the first pane at 200px or more. Percent mode is unchanged.

---

## FR-48-36 — `strctReorder`: connected lists and a drag handle

### Rule

**A dashboard's cards move within a column and between columns, by their handle.** Content that is itself draggable,
such as text selection or a chart brush, must not start a move.

### What the app does today

object-detail/overview-board.ts:151–204 plus overview-board.css:28, :52 and :116 implement Customize on every Overview:

- **Moving.** HTML5 drag-and-drop of `strct-card`s between two rails, with a `.handle` grip as the only drag source.
- **Drop feedback.** Dashed outlines mark the drop target and editing state.
- **Controls.** Up, down, move to the other column and hide buttons (`.ctl`, raw icon buttons the app will move to
  `strct-button iconOnly`).
- **Keyboard.** None for moving between rails.

`strctReorder` reorders siblings in one container; there is no handle and no cross-list move. The Alt+arrow keyboard
model it already has is exactly what the board lacks.

### Proposed API

```html
<div strctReorderGroup (moved)="onMove($event)">
  <!-- { item, fromList, toList, fromIndex, toIndex } -->
  <div strctReorder listId="left">
    @for (c of left; track c.id) {
    <strct-card strctReorderItem>…<span strctReorderHandle></span>…</strct-card> }
  </div>
  <div strctReorder listId="right">…</div>
</div>
```

- **Group.** `strctReorderGroup` connects lists and emits `moved` across them.
- **Handle.** When an item contains `[strctReorderHandle]`, only the handle starts a drag.
- **Keyboard.** Alt+arrow up and down moves within a list; Alt+arrow left and right moves to the neighbouring list at
  the same index.
- **Announcements.** Uses the existing live-region `announcement`, extended with the list name.

### Acceptance

Two connected lists move cards between them by handle and by Alt+arrow keys, and each move is announced ("Capacity,
moved to column 2, position 1 of 4"). Single-list reorder is unchanged.

---

## FR-48-37 — A skip link

### Rule

**Every app shell has "Skip to main content" as its first focusable element.** It is invisible until focused.

### What the app does today

shell/shell.html:5 `.skip-link`: an off-screen link that appears on focus with an accent background and radius
`0 0 6 0`. The code comment already cites the app's own FR-UI-A11Y-01.

### Proposed API

```ts
// strct-shell (additions)
readonly skipLinkTarget = input<string | null>(null);   // id of the main region; null = no link (today)
readonly skipLinkLabel = input('Skip to main content');
```

It renders as the shell's first child, focuses the target (with `tabindex="-1"` applied if needed) and scrolls it into
view.

### Acceptance

The first Tab on a page shows the link, and Enter moves focus to the main region. Without `skipLinkTarget`, nothing
changes.

---

## FR-48-38 — `strct-accordion-panel`: a quiet (inline) variant

### Rule

**"How this works" is a quiet fold in running text,** a one-line link-looking summary that opens in place. It is not a
boxed accordion.

### What the app does today

There are 17 raw `<details><summary>` folds in 16 Administration pages (appliance-backup:160, vm-console-account:176,
alarms-view:159, webhooks-view:128, gitops-view:175, appliance-proxy:95 and :240, elevation-view:129, audit-log:185,
appliance-ha:209, …) plus remediation-run.ts:296. Each summary is a 12.5px `--t2` link-looking line, sometimes with a
top rule.

`strct-accordion-panel` works but draws a boxed header; there is no quiet appearance.

### Proposed API

```ts
readonly appearance = input<'boxed' | 'quiet'>('boxed');   // strct-accordion-panel
```

- **Quiet appearance.** No border or background. The heading is `--text-sm`, `--t2`, with a chevron. The body is
  indented by `--space-3`.
- **Keyboard and ARIA.** Unchanged (button + region).

### Acceptance

`<strct-accordion-panel appearance="quiet" heading="How backup works">` reads like today's `<details>` folds, with the
accordion's button and region semantics.
