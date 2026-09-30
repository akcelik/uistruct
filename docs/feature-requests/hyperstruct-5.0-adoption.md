# HyperStruct on 5.0.0 → BUG-49-01 … 11, FR-49-01 … 20

> **BUG-49-01, 02, 03, 05 and 06 FIXED in 5.0.1 (2026-09-30)** — the set this document put first.
>
> - **01** `strctCheckHostDisplay` now waits for the host to be in the document, and re-checks when
>   it arrives, so an alert inside a closed modal or an unshown tab says nothing — and no longer
>   spends the deduplication key that a real override later on the page needs.
> - **02** the captioned spinner's host gives up its box, border and animation to become a row, and
>   the ring moved to `__ring`. Measured: host `animation: none`, `border: 0px`, the ring spinning
>   on its own and the caption beside it on the same line.
> - **03** `size="sm"` is the row the proposal described. Measured: padding 40px 24px → **12px**, a
>   56px icon chip → **16px** inline with a 13px title, and the block's height **260px → 66px**, so
>   it fits the 240px card it was written for.
> - **05** `strctDesc` gained the `div[strctDesc]` selector alias, the way `StrctInput` gained
>   `strct-input`, and the showcase's own rows use it. Measured with axe on the showcase page:
>   **definition-list (3 nodes) and dlitem (18 nodes), both serious, are gone.** That page is now in
>   `scripts/a11y-smoke.mjs` — it was not covered, which is how this shipped.
> - **06** an effect follows `selectedId` in single mode and checks the row it names, writing the
>   selection directly so an external write emits no `selectionChange`, while a user's own pick
>   still does.
>
> Still open: **FR-49-05, 06, 13, 14, 15, 16, 18, 19, 20**.
>
> **FR-49-10, 11 and 12 SHIPPED in 5.3.0 (2026-09-30)** — the form-and-note set.
>
> - **10** all three: `strct-number [ariaLabel]` (measured in the accessibility tree: `spinbutton`
>   named "vCPUs"), `[strctInput] [mono]` with the `.strct-control--mono` class (measured:
>   JetBrains Mono + `tabular-nums`, against DM Sans for a plain control), and
>   `strct-range [valueFormat]` (measured: the same slider reads "4 GB" while the model stays 4).
> - **11** `[strctAlertActions]`, at the end of the alert's row. Measured: `order: 2` after the
>   body, 13px from the alert's end, on the body's first line, before the dismiss button; an empty
>   slot draws nothing.
> - **12** `[strctFieldValue]`. Measured with a Range over the text, not the box: without it the
>   value's first line sits **8.3px above** the label's — the 9px the report gave — and with it
>   **0.5px**, which is the two line-heights differing.
>
> **FR-49-02, 03 and 04 SHIPPED in 5.2.0 (2026-09-30)** — the datagrid set.
>
> - **02** the editable cells of a grid are one roving tab stop: arrows move, Enter or F2 opens with
>   the text selected, Escape closes, focus returns to the cell, and Tab commits and opens the next
>   cell. Measured in Chrome with nothing but key events: vCPU→↓→→→↑ walks to Memory, Enter opens,
>   typing **replaces** (16 → 64), Enter commits and the consumer hears
>   "web-01: Memory (GiB) 16 → 64", Shift+Tab reopens the previous cell. `editHint` draws the
>   pencil (measured opacity 1 on the focused cell).
> - **03** `[(selectedIds)]`, following the BUG-49-06 fix: writing it checks the rows and fires no
>   `selectionChange`; the user's picks write back in pick order.
> - **04** all three: "more" takes the pager's place and leaves the count, the chooser and the sync
>   button (measured: no pager, Load more present, 2 footer buttons, "Showing the latest 6 of 24",
>   all on one row) and no longer slices a cursor feed; the action-bar caption draws the toolbar on
>   its own; and `maxHeight` bounds any grid (measured 608px → **222px**, scrolls, header sticky).
>
> **FR-49-01, 07, 08, 09 and 17 SHIPPED in 5.1.0 (2026-09-30)** — the text-and-surface set.
>
> - **01** `wrap` on `strct-list` (every row) and on `strct-list-item` (one row). Measured: a
>   two-line row grows **51px → 69px**, the leading marker sits exactly on the title's first line
>   (offset 0), and a `dense` one-line row is still **32px**.
> - **07** `activateLabel` names what activating an interactive tag does. Measured in the
>   accessibility tree: role `button`, name **"Show the console of APP01"**, from the attribute.
> - **08** `level` (2…6) renders the real heading element — measured `H3` in the outline — `wrap`
>   keeps a long title whole (at 250px it is clipped without and whole with), and
>   `[strctCardHeaderLeading]` projects before the title (measured: first child of the header row).
> - **09** `fill`. Measured on three cards with very different bodies: footers share one y
>   (**1102px**) and the cards one height (224px).
> - **17** `.strct-text-success | -warning | -critical | -accent`, from the badges' own tokens.
>   `scripts/a11y-smoke.mjs` now gates all four on `--bg-1` in the six schemes, as it gated `--acc`:
>   worst **4.59** (critical, sage/dark), all above AA.
>
> **BUG-49-04, 07, 08, 09, 10 and 11 FIXED in 5.0.2 (2026-09-30)** — the rest of the bug list.
>
> - **04** the pane header's title is 18px/600, the acceptance FR-48-15 wrote. Measured in Chrome on
>   the showcase's new pane demo: `h2` at **18px/600**, beside the page header's 22px. The variant
>   had no demo at all, which is how the 14px shipped; it has one now.
> - **07** an effect prunes the selection to the ids the current rows account for and emits
>   `selectionChange` only when the pruning removed something. A lazy grid is left alone: it cannot
>   tell a deleted row from one on another page.
> - **08** `closeOnOutside` is read. A pointerdown beside the window minimises it — the listener is
>   added outside the zone, one frame after opening, so the click that opened it cannot close it.
>   Measured: outside click → frame gone, dock chip **"APP01 · console"**; with `none` and with a
>   click _inside_ the frame, the window stays. The showcase demo carries the toggle.
> - **09** a disabled list drops the tab stop, `aria-roledescription`, `aria-keyshortcuts`,
>   `aria-posinset`/`setsize` and `aria-describedby`; the drag states ship their styles. Measured:
>   at rest `cursor: grab` (the handle's, where there is a handle — the row stays `auto`), dragging
>   `opacity .6` + `var(--shh)` + `grabbing`, target `inset 0 0 0 2px var(--acc50)`, and the
>   display-only list `draggable="false"`, no tabindex, no roledescription, `cursor: auto`. The
>   showcase's own copies of those two rules are deleted.
> - **10** the copy button takes a `value` when given and otherwise follows the element's text
>   through a `MutationObserver`; `wrap` lets a long id break. Measured by intercepting the
>   clipboard on the showcase: a span that resolves 600ms late copies **the resolved path**, and a
>   shortened thumbprint `AB:1F:9C:04…5E:08` copies **all 20 octets**.
> - **11** the thread watches its list with a `ResizeObserver`. Measured: growing the last message
>   by ~1300px scrolled to the end (`scrollTop` 0 → 1277, exactly `scrollHeight - clientHeight`),
>   and after the reader scrolled up, the next growth left them where they were.

**From:** HyperStruct (every screen) · **Version:** 5.0.0 · **Date:** 2026-09-30

HyperStruct moved from 4.4.0 to 5.0.0 and adopted FR-48-01 … 42 across the whole app: about 90 files, every screen.
With no app change, 5.0.0 was a drop-in (1230/1230 specs), and FR-44-01's surface roles needed no app fix.

This document is what that adoption found in the library. **Every BUG below was checked in `projects/strct/src/lib`**
(file and line given), not taken from a symptom. Every FR names the shipped HyperStruct screen that needs it and
the workaround in place, which is deleted when the item ships. The conventions are the ones FR-48 followed
(`hyperstruct-hand-built-audit.md` § "How the proposals fit the library").

Suggested order: the four BUGs that make a shipped feature unusable or unsafe first (**01, 05, 06, 02/03**), then
**FR-49-01** (list wrap — hit by four areas), **FR-49-02** (keyboard editing — it is why three grids did not adopt
FR-48-08), then the rest.

---

## Bugs

### BUG-49-01 — The host-display check fires on hosts that are not in the document

`util/host-check.ts` `strctCheckHostDisplay` runs in `afterNextRender`. A component inside a closed `strct-modal`,
or inside a tab panel that is not shown, is not connected yet, so `getComputedStyle(host).display` is `''` and the
warning reads:

> `[strct] <strct-alert> needs display: block, but it computes to .`

- **Measured.** 69 of HyperStruct's 129 screens logged it in the development build. A probe that wrapped
  `getComputedStyle` found every one on a disconnected host: `strct-alert < form` inside modal content, and
  `app-integration-policy-view < div.cf-content` inside a tab that had not been shown.
- **Why it matters beyond noise.** `strctDevWarn` deduplicates by key (`host-display:strct-alert`), so the false
  positive on the first detached alert **masks a real override later on the same page**.
- **Fix.** Skip when `!host.isConnected`, and check again the first time the host is connected, for example from a
  one-shot `ResizeObserver` or on the next `afterRender` while it is still unchecked.
- **Acceptance.** No warning for an alert inside a closed modal or a hidden tab. Opening the modal or tab with a real
  `style="display:flex"` still warns.

### BUG-49-02 — `strct-spinner [caption]` ships without CSS

`spinner/spinner.ts:14–27` adds `.strct-spinner--captioned`, `__ring` and `__caption`, but its `styles` have no rule
for any of them. The host keeps `width: 22px; border…; animation: strct-spin`, so the caption text sits **inside the
rotating ring** and turns with it.

- **Fix.** For `--captioned`: the host becomes `inline-flex`, `gap: var(--space-2)`, and loses the border, size and
  animation. The ring rules move to `__ring`.
- **Acceptance.** A captioned spinner shows a 22px ring beside still text; a spinner without a caption is
  pixel-identical to 4.5.
- **HyperStruct workaround:** a bare `strct-spinner size="sm"` beside a `.strct-text-hint` span, commented at each
  site.

### BUG-49-03 — `strct-empty-state size="sm"` ships without CSS

`empty-state/empty-state.ts:56` adds `.strct-empty--sm`, but there is no rule for it. The small state keeps 40px
padding, the 56px icon chip and the 15px `h3`.

- **Fix.** Implement the row FR-48-20 described: a 16px icon inline with the title, the description under it,
  padding `var(--space-3)`.
- **HyperStruct workaround:** `.strct-text-hint` paragraphs where a small empty state was meant (vm-settings ×4,
  vm-groups, storage-pods, overview parts).

### BUG-49-04 — `strct-page-header size="pane"` titles are 14px; FR-48-15's acceptance is 18px

`layout/page-header.ts:127` sets the pane title to `var(--text-lg)`, which is 14px in `_tokens.scss:117`.
FR-48-15's acceptance says "`level=2 size="pane"` renders an `h2` at 18px", and the pane icon is already 18
(`page-header.ts:47`). The proposal's own comment (`--text-lg/600`) was wrong about the token's value; the acceptance
is the intent.

- **HyperStruct workaround:** `src/styles.scss`, scoped to `app-admin-page-header .strct-ph--pane .strct-ph__title`,
  marked BUG-49-04.

### BUG-49-05 — `strct-desc` breaks the `<dl>` content model

`strct-description-list` renders `<dl>` and projects `<strct-desc>`, whose template is `<dt>…</dt><dd>…</dd>`
(`description-list/description-list.ts:207`). The custom element therefore sits between `<dl>` and its `dt` / `dd`.
HTML allows only `dt` / `dd` groups, or `<div>` wrappers, directly in a `<dl>`.

- **Measured.** axe-core reports **definition-list** (serious) on the `<dl>` and **dlitem** (serious) on every
  `dt` / `dd`: 4 + 12 on HyperStruct's Home alone.
- **Contrast.** The `[items]` path is already right: it wraps each pair in a `<div class="strct-desc">`.
- **Fix, keeping the API.** Either:
  - add the selector alias `div[strctDesc]`, the way `StrctInput` gained `strct-input`, and document `<div strctDesc>`
    as the form to use inside a list; or
  - give the host `role="group"` and make the list's `dl` a `div role="list"` of `role="listitem"` pairs.

  The first keeps native `dl` semantics and is the smaller change.

- **Acceptance.** axe reports no definition-list or dlitem findings on the showcase's description-list page.
- **Library CI.** Add that page to `scripts/a11y-smoke.mjs`. It is not covered today, which is how this shipped.
- **HyperStruct workaround:** a documented entry in its a11y baseline (Home), removed when this ships.

### BUG-49-06 — `strct-datagrid [selectedId]` does not select the row it names

`selectedId` is a `model()` (`datagrid/datagrid.ts:1726`), and the grid sets it when the user picks
(`:2614`). But the checked state is `isSelected(row) = this.selected().has(id)` (`:2945`), and `selected` is seeded
only from `initialSelection` (`:2691`). A consumer that binds `[(selectedId)]` and sets it itself — a host dropped
onto the dialog, a pick restored from an earlier step — never sees that row checked.

- **Fix.** An effect that follows `selectedId` in single mode and sets `selected` to `{id}` (or to empty for null),
  guarded so that a user pick does not loop.
- **Acceptance.** Setting `selectedId` from outside checks the row's radio and fires no `selectionChange`.
- **HyperStruct workaround:** `[initialSelection]` fed from the same signal at 7 sites (add-node-wizard.ts:204, :228;
  migrate-dialog.ts:223, :303; clone-dialog.ts ×3). It passes `null` until the rows exist, so the "none of which
  matches" dev warning stays quiet.

### BUG-49-07 — A selection outlives its rows

`selectedCount` is `selected().size` (`datagrid.ts:1882`), and nothing removes ids whose rows are gone. After a
delete, the footer still says "2 selected" and `selectionChange` consumers still hold the dead ids.

- **Fix.** Prune `selected` to the ids present in `rows()` whenever the rows change, emitting `selectionChange` only
  when the pruning removed something. For lazy grids, prune only ids the current rows can prove gone, or document
  that the consumer does it.
- **HyperStruct workaround:** host-configuration-view re-seeds `initialSelection` after a delete (lockdown
  exceptions); the other grids there show the stale count.

### BUG-49-08 — `strct-window closeOnOutside` is declared and never read

`window/window.ts:316` declares `closeOnOutside = input<'none' | 'minimize'>('none')`, but nothing reads
`closeOnOutside()`.

- **HyperStruct workaround:** the console keeps its own shade that minimises on an outside click
  (vm-console-live.ts:117, commented).

### BUG-49-09 — `strctReorderItem`: a disabled list still announces itself, and drag states have no style

`reorder/reorder.ts:242–259` gives every item `tabindex="0"` and `aria-roledescription="sortable"` even when the list
is `reorderDisabled`. The classes `.strct-reorder--dragging` / `--over` (`:243–244`) are bound, but no stylesheet in
`lib/` or `styles/` defines them.

- **Fix.** When disabled, drop the item's `tabindex` (unless the consumer set one), `aria-roledescription` and
  `aria-keyshortcuts`. Ship token-based styles for the two states: a lifted `--shh` on the dragged item and an
  accent inset on the target.
- **HyperStruct workarounds:**
  - overview-board.ts puts a static `tabindex="-1"` and empty `instructions` on its items at rest;
  - new-vm-group-wizard.ts defines the two drag-state rules itself.

### BUG-49-10 — `code[strctCode] copyable` copies the text it had at first render

`code/code-inline.ts:41–46` reads `el.textContent` once, in `afterNextRender`, into the copy button's `text`. A code
span bound to a value that changes (a path, a thumbprint that loads later) copies the **old** value.

- **Fix.** Take the text from a `value` input when given, otherwise re-read it with a `MutationObserver` on the host.
  A `value` input also lets a span show a shortened thumbprint and copy the full one.
- **HyperStruct workaround:** a `strct-copy [text]` beside the span (certificate-detail, certificates).

### BUG-49-11 — `strct-chat-thread` stays put when a message arrives

`chat/chat.ts:132–135`: the auto-scroll effect tracks only `busy()`. A new message, or streamed text growing the
last one, does not scroll the thread even when the reader is at the end.

- **Fix.** Also follow a `ResizeObserver` on the log's content (or the projected messages' count), keeping the
  existing "only if at the end" rule.
- **HyperStruct workaround:** `ai-assistant.ts:324` calls `scrollToEnd()` itself after each chunk.

---

## Feature requests

### FR-49-01 — `strct-list-item`: wrap the title and description

`list/list.ts:153–167` makes both one line with an ellipsis. HyperStruct's rows often carry a **sentence**: why a VM
stays down, what a check found, why a host is blocked. Four areas hit this independently:

- overview-parts.ts `OverviewFindings` (~~:130) and the estate cluster rows (~~:420);
- mvs-overview-cards.ts:87;
- host-configuration-view.ts `.hc-stmt` rows;
- remediate-wizard / remediation-run host rows and the optimization moves, which became datagrids instead.

```ts
readonly wrap = input(false, { transform: booleanAttribute });   // on strct-list (all rows) and strct-list-item
```

**Acceptance:**

- a wrapping row grows in height and keeps its leading marker top-aligned with the title's first line;
- `dense` still means 32px for a one-line row;
- the default is unchanged.

### FR-49-02 — `strct-datagrid`: keyboard access to editable cells

An editable cell opens only on `(dblclick)` (`datagrid.ts:588`). There is no focusable cell, no Enter / F2, and
nothing to show that a new blank row can be edited. So the FR-48-08 editors could not be adopted where keyboard
users edit rules:

- port-acl-editor.ts:62ff (ACL rules);
- mvs-traffic-classes.ts:193ff;
- host-profiles.ts ~160–235.

Those grids keep in-cell strct controls.

**Proposed:**

- editable cells take part in a grid-level roving focus (`role="grid"` semantics already fit);
- Enter or F2 starts editing and Escape cancels, as today;
- Tab commits and moves to the next editable cell;
- an optional `editHint` (e.g. a pencil on hover and focus) shows that a cell is editable.

**Acceptance:** without a mouse, a user can reach, edit and commit every editable cell of the demo grid.

### FR-49-03 — `strct-datagrid`: a two-way selection model in multiple mode

Single mode has `[(selectedId)]`. Multiple mode has only `initialSelection` plus `(selectionChange)`. A consumer that
also removes picks elsewhere cannot tell the grid:

- the VM group's boot-order list un-ticks members;
- Add Node keeps its pick order.

**Proposed:** `selectedIds = model<readonly unknown[]>([])`, following the BUG-49-06 fix.

**Acceptance:** writing `selectedIds` updates the checkboxes and the footer count and fires no `selectionChange`.

**Retires:** the checkbox lists in new-vm-group-wizard.ts and new-storage-pod-wizard.ts, which could then become
grids.

### FR-49-04 — `strct-datagrid`: footer and chrome combinations

1. **`paging="more"` replaces the whole footer** (`datagrid.ts:744`). The sync (refresh) icon and the column chooser
   go with it, and with `pageSize > 0` rows past the first page become unreachable. The "Load more" control should
   take the pager's place only, and leave the rest of the footer. _Retires:_ audit-log.ts `.al-foot` and
   events-history's own Load more.
2. **`[strctDatagridActionBarCaption]` renders only when the grid also has an action bar or `quickFilterable`**
   (`:258`). A read-only grid with a note needs an empty action-bar element today (appliance-network.ts ~108).
3. **A grouped grid has no bounded height.** `viewportHeight` applies only to `virtual`. The roles privilege picker
   lost its 320px scroll box. _Proposed:_ `maxHeight`, like the tree's, with a sticky header.

### FR-49-05 — `strct-progress`: a name apart from the label, a toned caption, an inline value

1. **Name.** In meter mode the visible `label` is also the `aria-label` (`progress/progress.ts:50`). A column of
   per-cluster memory bars would all be named "Memory". _Proposed:_ `ariaLabel`, defaulting to `label`. _Retires:_
   the hand-built label row in overview-parts.ts `.cl .mem`.
2. **Caption tone.** A critical capacity line's note ("2 GB left after the tightest node") should read critical, not
   `--t3`. _Proposed:_ `captionStatus`, as `strct-metric-tile` has.
3. **Inline value.** `showValue` puts the value on a row above the track. A cell bar wants it beside the track: Recent
   Tasks, the host-status cell. _Proposed:_ `valuePosition: 'top' | 'end'`.

### FR-49-06 — `strct-window`: the rest of what a console window needs

1. **Control labels.** The minimise, maximise and close buttons take no `title`. The console's minimise button says
   "stays connected", which today fits only in its aria-label. _Proposed:_ extend the `labels` object with
   per-control tooltips.
2. **Leading icon.** An icon before the heading, as `strct-page-header [icon]` has.
3. **Move clamping.** The title bar can leave the viewport. Clamp so at least the title bar stays reachable, as the
   app does itself.
4. **Double-click.** Double-click on the title maximises. A consumer whose content has a real full screen (a console)
   wants to choose: `titleDblclick: 'maximize' | 'none'` plus an output.
5. **Dock items.** `strct-window-dock` cannot show a status dot or icon per window, and its restore bypasses a
   consumer's "one open window at a time" rule. _Proposed:_ a `strctWindowDockItem` template, and a `(restoreRequest)`
   output the consumer answers.

   _Retires:_ console-chips.ts (strct-tag chips in the Recent Tasks bar) and the app's own clamping in
   vm-console-live.ts.

### FR-49-07 — `strct-tag interactive`: say what activating does

The body's accessible name is its text plus the leading slot: "Connected APP02". It cannot say "Show the console of
APP02". _Proposed:_ `activateLabel`, applied to the body's `role="button"`, with the × keeping `removeLabel`.

### FR-49-08 — `strct-card-header`: a heading that is a heading, that can wrap, and a leading slot

1. **Semantics.** `heading` renders as a `<span class="strct-card__htitle">` (`card/card.ts:191`), so no card title is
   in the page outline. HyperStruct's a11y gate then saw an `h2` followed directly by an `h4` (Home). _Proposed:_
   `level: 2…6 | null`, rendering `hN` when set.
2. **Wrap.** `.strct-card__htitle` is `white-space: nowrap` with an ellipsis (`:250`). Beside a badge, "Host Update
   Manager" reads "Host Update M…" in a 270px card. _Proposed:_ wrap by default when a `[strctCardHeaderMeta]` is
   present, or a `wrap` input. _Workaround:_ admin-summary.ts, marked FR-49-08.
3. **Leading slot.** Projected content always follows `heading`, so a drag grip cannot lead the title
   (overview-board uses `icon` plus the whole header as the handle). _Proposed:_ `[strctCardHeaderLeading]`.

### FR-49-09 — `strct-card fill`: equal-height cards with the footer on the bottom edge

`.strct-card` is `display: block` (`card.ts:52`). In a grid row the cards stretch, but each footer sits straight under
its body, so the "Open …" buttons of a row of cards land at four different heights.

_Proposed:_ `fill` (boolean): the card becomes a flex column, `strct-card-block` grows, and the footer is pinned to
the bottom.

_Workaround:_ admin-summary.ts `.sm-cards > strct-card { display: flex … }`, marked FR-49-09.

### FR-49-10 — Form controls: a name, mono text, a formatted range value

1. **`strct-number ariaLabel`.** In a grid cell, outside `strct-field`, the value input has no name
   (port-acl-editor.ts:84, mvs-traffic-classes.ts:193).
2. **`strctInput` mono.** PEM blocks and `group=Role` mappings want the mono face: `[strctInput][mono]` or a
   `.strct-control--mono` modifier. Three files keep `font-family: var(--mono)`.
3. **`strct-range` value format.** `showValue` prints the raw number. Memory is "4 GB" and weight is "20%".
   _Proposed:_ `valueFormat: (v: number) => string`. _Retires:_ `.vms-num` in vm-settings.ts (~505–590).

### FR-49-11 — `strct-alert`: an actions slot

A warning that carries its own fix — "3 VMs differ from the policy · **Remediate**" — needs a button at the alert's
end. _Proposed:_ `[strctAlertActions]`, aligned to the end of the inner row that 4.14.0 introduced.

_Retires:_ the flex `.bar` in vm-integration-panel.ts:57.

### FR-49-12 — `strct-field layout="inline"`: a read-only value in the control column

A settings form mixes editable rows with values that are read-only here: a name, a badge, a switch that shows state.
Placed in the control column, text sits 9px off the label's line, because the column centres on the 34px control
height.

_Proposed:_ `[strctFieldValue]` (or `readonly` on the field) aligning projected content to the label's first line.

_Retires:_ `.vms-val` in vm-settings.ts (:499, :511, :524, :557, :576).

### FR-49-13 — `strct-legend`: an item that cannot be switched on, and a picker mode

In the Monitor's counter picker (host-monitor-view.ts ~262), some counters are not collected on this host: they must
show why and must not toggle. And a catalogue picker is not a legend of what is drawn: an "off" row there is not
struck through, it is simply not picked.

_Proposed:_

- `items[].disabled` plus `items[].reason` (title and `aria-description`);
- `appearance: 'legend' | 'picker'`, where `picker` shows off rows plainly with a check on the on ones.

### FR-49-14 — `strct-metric-tile`: status on the whole tile, and in-app navigation

1. **Status.** Only the value takes a tone. The Monitor's critical tile lost its red edge. _Proposed:_ `status`
   draws the leading rail `strct-card` has.
2. **Navigation.** `href` renders a plain `<a [href]>` (`metric-tile/metric-tile.ts:73–74`), which reloads the whole
   single-page app. _Proposed:_ an `(activated)` output fired on a plain primary click (with `preventDefault`), while
   modified clicks keep the native behaviour; or support for a `routerLink`-style callback.

   _Retires:_ `followTile()` in dashboard.ts:712.

### FR-49-15 — `strct-flow`: an empty column, and a toned node

1. A column is drawn only when a node sits in it. "Lands on: no other member" needs the column's heading with an empty
   note in it. _Proposed:_ `columns[].emptyText`.
2. A node's `status` tints only its border. The blast radius's "Nowhere" box was a critical surface. _Proposed:_
   `nodes[].emphasis: 'border' | 'surface'`.

### FR-49-16 — `strct-steps`: a planned state, a name, wrapping pills

1. **"What will happen" is not "pending".** A plan shown before anything runs looks greyed out with `pending`.
   _Proposed:_ state `planned`: `--t1` text, a numbered neutral marker.
2. **Name.** The `<ol>` has no accessible name. _Proposed:_ a `label` input. HyperStruct adds `role="group"` and an
   `aria-label` on the host.
3. **Wrapping.** Pill labels ellipsize ("Back in service"). Let them wrap at narrow widths.

### FR-49-17 — Status text utilities

A status word inside a grid cell ("blocked", "fits") needs its tone without a badge. _Proposed:_
`.strct-text-success | -warning | -critical | -accent`, AA-checked on `--bg-1` like the other text utilities.

_Retires:_ `[style.color]` in migrate-dialog.ts (:231, :265, :347) and clone-dialog.ts (:229).

### FR-49-18 — Header, popover and dropdown

1. **Header buttons.** `strct-header` does not re-tone projected `strct-button`s, and no button variant fits the dark
   header, so the six header triggers stay native buttons with `color: inherit`. _Proposed:_ `.strct-header`
   re-tones `flat` buttons inside it, or a `tone="header"` variant.
2. **Theme switcher outside the header.** `strct-theme-switcher` reads only on `--hdr`. It should also work on a
   raised surface (a user menu).
3. **Dropdown menu mode and Tab.** Menu mode closes on Tab, so a control inside it (the theme switcher) is out of
   keyboard reach, while popover mode sets its items to `tabindex="-1"`. _Proposed:_ items in popover mode stay
   tabbable when `[focusable]` is set.
4. **Popover width.** `strct-popover` has a fixed 320px max width and no input. The alarm bell and drift panels want
   340–360px. _Proposed:_ `maxWidth`.

### FR-49-19 — Login and OTP

1. **Login brand meta.** The brand row (`brandIcon`, `brandName`) has no slot for a product-edition pill
   ("APPLIANCE"). _Proposed:_ `[strctLoginBrandMeta]`.
2. **OTP fill.** `strct-input-otp` cannot fill its row. HyperStruct's styles.scss reaches into `.strct-otp` to
   justify the boxes under a full-width Verify button. _Proposed:_ `fill` (boolean).

### FR-49-20 — Small ones

1. **`strct-media-frame fit`.** It only covers. A console thumbnail must not crop the guest's screen. _Proposed:_
   `fit: 'cover' | 'contain'`. _Retires:_ vm-console.ts:172.
2. **`strct-chat-composer`.** `disabled` also stops typing; a user drafting the next question while a reply streams
   is blocked. _Proposed:_ `sendDisabled`.
3. **`strct-empty-state` title level.** The title is always an `h3`, so a loading state adds a heading to the
   outline. _Proposed:_ `titleLevel: 2…6 | null`, where `null` renders a `<p>`.
4. **`code[strctCode] wrap`.** It is `white-space: nowrap`, so long ids overflow a narrow card. _Proposed:_ `wrap`.
   _Retires:_ the inline `white-space: normal` on the timeline source id, the SHA-256 thumbprint and the enroll
   command.
5. **`strct-toolbar` roving.** Its arrow-key roving takes keys from a `strct-select` inside a popover inside the
   toolbar. It should skip events whose target is inside an open overlay. _Retires:_ the VM console toolbar's plain
   `div role="toolbar"`.
6. **`strct-hero` announcement.** It becomes `role="alert"` when critical, so every critical Overview is announced on
   load. Pages that render a verdict on navigation want `role="status"`. _Proposed:_ `live: 'assertive' | 'polite'`,
   defaulting to the current behaviour.
