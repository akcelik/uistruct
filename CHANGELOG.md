# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.3.0] - 2026-09-30

### Added

- **`[strctAlertActions]`** (FR-49-11). A warning that carries its own fix —
  _"3 VMs differ from the policy · **Remediate**"_ — puts the control at the end
  of the alert's row, on the body's first line and before the dismiss button.
  Measured: `order: 2` after the body, 13px from the alert's end, first line,
  and an empty slot draws nothing.
- **`[strctFieldValue]`** (FR-49-12). A settings form mixes editable rows with
  values that are read-only _here_ — a name, a badge, a switch that only shows
  state. Placed in an inline field's control column, such text sat **8.3px
  above the label's line**, because the column centres on a 34px control; the
  new slot puts it on the label's own line (measured: 0.5px). It stacks with
  the rest below 480px.
- **`strct-number [ariaLabel]`** (FR-49-10). The spinbutton had no name where
  the control is not inside a `strct-field` — in a grid cell, or beside a label
  it does not own. Measured in the accessibility tree: `spinbutton` named
  _"vCPUs"_.
- **`[strctInput] [mono]`** and `.strct-control--mono` (FR-49-10). A PEM block,
  a `key=value` mapping or an identifier reads as code: the monospace face with
  the tabular figures the rest of the library uses for data. Measured:
  JetBrains Mono with `tabular-nums`, against DM Sans for a plain control.
- **`strct-range [valueFormat]`** (FR-49-10). `showValue` printed the raw
  number; memory is "4 GB" and a weight is "20%". The format shapes the label
  only — the model stays the number.

## [5.2.0] - 2026-09-30

### Added

- **Keyboard access to editable cells** (FR-49-02). An editable cell opened
  only on `dblclick`, so a keyboard user could not reach one at all — which is
  why three of the reporting app's grids kept in-cell controls instead of
  adopting the editors. A grid's editable cells are now **one roving tab stop**:
  Tab reaches the grid, the arrow keys move between cells (along the row and
  down the column), **Enter or F2** opens the editor with its text selected,
  **Escape** closes it — focus returning to the cell either way — and while an
  editor is open **Tab commits it and opens the next cell**, the way a
  spreadsheet fills a row. The cells carry `aria-describedby` pointing at one
  hidden line of instructions (`editCellInstructions`, localizable), and the
  new **`editHint`** puts a pencil on an editable cell when it is hovered or
  focused.
- **`strct-datagrid [(selectedIds)]`** (FR-49-03). Multiple mode had only
  `initialSelection` plus `(selectionChange)`, so a consumer that also removes
  picks elsewhere on the screen could not tell the grid. `selectedIds` is what
  `selectedId` is for single mode: writing it checks those rows and counts
  them, **firing no `selectionChange`**, and the user's own picks write back in
  the order they were made. `null` (the default) means the consumer does not
  drive the selection, so a grid that only seeds is unchanged.
- **`strct-datagrid [maxHeight]`** (FR-49-04). What `viewportHeight` does for
  `virtual`, for every other grid, grouped or not: a bounded scroll box with a
  sticky header. Measured: a grouped grid goes 608px → 222px, scrolls, and its
  header stays put.

### Fixed

- **`paging="more"` replaced the whole footer** (FR-49-04). The column chooser
  and the sync button went with the pager, and with `pageSize > 0` every row
  past the first page became unreachable behind a pager that "more" does not
  draw. "Load more" now takes the **pager's** place only; the count, the
  chooser and the sync button are the footer's and stay. A cursor feed is no
  longer sliced client-side.
- **`[strctDatagridActionBarCaption]` rendered only alongside an action bar or
  `quickFilterable`** (FR-49-04), so a read-only grid with a note needed an
  empty action-bar element. The caption alone now draws the toolbar.
- A footer exists wherever it has something to hold: a grid with a
  `columnChooser` or `sync` but no pager had nowhere to put them.

## [5.1.0] - 2026-09-30

### Added

- **`strct-list` / `strct-list-item [wrap]`** (FR-49-01). Rows often carry a
  _sentence_ — why a VM stays down, what a check found — and both lines were
  one line with an ellipsis. `wrap` on the list turns it on for every row, on a
  row for that row: the title and description wrap, the row grows, and **the
  leading marker stays on the title's first line** instead of centring itself on
  a three-line row. Measured: a two-line row grows 51px → 69px with the marker
  exactly on the first line's centre, and `dense` still means **32px** for a
  one-line row.
- **`strct-tag [activateLabel]`** (FR-49-07). An interactive tag's body was
  named by its own text — _"Connected APP02"_, which says what the tag **is**,
  not what pressing it does. `activateLabel` names the action; the × keeps
  `removeLabel`. Measured in the accessibility tree: `button` named
  _"Show the console of APP01"_.
- **`strct-card-header [level] [wrap]` and `[strctCardHeaderLeading]`**
  (FR-49-08). `heading` rendered as a span, so no card title was in the page
  outline — a consumer's a11y gate saw an `h2` followed by an `h4`. `level`
  (2…6) renders the real heading element, `null` keeps the span. `wrap` lets a
  long title keep its words: at 250px, _"Host Update Manager"_ is clipped
  without it and whole with it. The new leading slot puts a drag grip or a
  status dot **before** the title.
- **`strct-card [fill]`** (FR-49-09). The card becomes a column inside the
  height its grid cell already gives it: the block takes the slack and the
  footer sits on the bottom edge. Measured on a row of three cards with very
  different bodies: the footers share one y (1102px) and the cards one height.
- **Status text utilities** — `.strct-text-success`, `.strct-text-warning`,
  `.strct-text-critical`, `.strct-text-accent` (FR-49-17). A status word inside
  a grid cell ("blocked", "fits") needs its tone without the box a badge draws.
  They use the badges' own tokens, so the vocabulary stays one vocabulary, and
  `scripts/a11y-smoke.mjs` now gates **all four** on `--bg-1` across the six
  schemes, as it did `--acc` alone: the worst reading is **4.59** (critical,
  sage/dark), all above AA.

### Changed

- `scripts/a11y-smoke.mjs` also drives `/components/card` and `/components/list`
  — the pages these demos live on.

## [5.0.2] - 2026-09-30

### Fixed

- **`strct-page-header size="pane"` titles were 14px** (BUG-49-04). FR-48-15's
  acceptance says 18px and the pane icon is already 18; the implementation used
  `--text-lg`, which is 14. The pane title is now **18px/600**. The variant had
  no showcase demo at all — which is how the wrong size shipped — so it has one
  now, beside the page header it is measured against.
- **A selection outlived its rows** (BUG-49-07). Nothing removed ids whose rows
  were gone, so after a delete the footer still said _"2 selected"_ and
  `selectionChange` consumers still held the dead ids. The grid now prunes the
  selection to the ids the current rows account for, emitting
  `selectionChange` **only when the pruning removed something**. A `lazy` grid is
  left alone: it cannot tell a deleted row from one on another page.
- **`strct-window [closeOnOutside]` was declared and never read** (BUG-49-08).
  `closeOnOutside="minimize"` now sends the window to the dock when the operator
  clicks the page beside it. The listener is added outside the zone one frame
  after opening, so the click that opened the window cannot close it, and a
  click _inside_ the frame never does. A window is still never dismissed by an
  outside click — only set aside.
- **A display-only reorder list still announced itself, and the drag states had
  no styles** (BUG-49-09). With `reorderDisabled`, items now drop the tab stop,
  `aria-roledescription="sortable"`, `aria-keyshortcuts`, `aria-posinset` /
  `aria-setsize` and `aria-describedby` — a list you cannot sort no longer tells
  a screen-reader user how to sort it. `.strct-reorder--dragging` and `--over`
  ship their styles from the tokens (`opacity .6` + `var(--shh)` on the dragged
  row, `inset 0 0 0 2px var(--acc50)` on the target), and the affordance comes
  with them: a draggable row shows `grab`, a row that delegates to a
  `[strctReorderHandle]` leaves the cursor to the handle, and a disabled row
  shows neither. Your own `.row.strct-reorder--dragging` still wins.
- **`code[strctCode] copyable` copied the text it had at first render**
  (BUG-49-10). A span bound to a value that resolves later — a path, a
  thumbprint — copied the placeholder. It now follows the element's text through
  a `MutationObserver`, and the new **`value`** input gives the button something
  else to copy, so a span can show `AB:1F:9C:04…5E:08` and copy all 20 octets.
  **`wrap`** lets a long id break instead of overflowing a narrow card.
- **`strct-chat-thread` stayed put when a message arrived** (BUG-49-11). The
  auto-scroll effect tracked only `busy()`, so a new message — or a streamed one
  growing — left the reader looking at the message before last. The thread now
  watches its list with a `ResizeObserver`, keeping the existing rule: it follows
  only while the reader is at the end, and never yanks them back down.

## [5.0.1] - 2026-09-30

### Fixed

- **A dev warning fired for hosts that are not in the document** (BUG-49-01). A
  component inside a closed modal or an unshown tab is not connected, so
  `getComputedStyle` reports `''` — and `strctCheckHostDisplay` read that as an
  override: _"needs display: block, but it computes to ."_ It fired on 69 of the
  reporting app's 129 screens, and because the warning deduplicates by key, each
  false positive **masked a real override later on the same page**. It now waits
  for the host to be connected and checks then.
- **`strct-spinner [caption]` shipped without its CSS** (BUG-49-02). The template
  emitted `__ring` and `__caption` while the host kept the ring's box, border and
  animation, so the caption sat _inside the rotating circle_ and turned with it.
  The captioned host is now a row and the ring is its own element; a spinner
  without a caption is unchanged.
- **`strct-empty-state size="sm"` shipped without its CSS** (BUG-49-03). It kept
  40px padding, the 56px icon chip and the 15px title. It is now the row the
  proposal described — 12px padding, a 16px icon inline with a 13px title —
  which takes the block from **260px to 66px** and fits the card it was written
  for.
- **`strct-desc` broke the `<dl>` content model** (BUG-49-05). A custom element
  between `<dl>` and its `dt` / `dd` is invalid, and axe reported
  **definition-list** and **dlitem** (both serious) on every list. `strctDesc`
  now also answers to **`div[strctDesc]`** — the way `StrctInput` gained
  `strct-input` — and that is the form to use inside a list. The showcase's own
  rows moved to it, and its page joined `scripts/a11y-smoke.mjs`: it was not
  covered, which is how this shipped.
- **`strct-datagrid [selectedId]` did not select the row it named** (BUG-49-06).
  The grid wrote `selectedId` when the user picked but never read it back, so a
  consumer restoring a pick saw no radio checked. It now follows `selectedId` in
  single mode — and an external write emits no `selectionChange`, while a user's
  own pick still does.

## [5.0.0] - 2026-09-30

A major for one reason: **FR-44-01 changes how every card looks.** Nothing else in
the API moved, and no input, output or selector was removed.

### Changed

- **One edge instead of two.** `--sh` no longer carries a `0 0 0 1px var(--b1)`
  ring, so a card is its 1px border and a soft drop shadow rather than a border
  plus a second ring — which at 2× read as two lines, and on a page of ten cards
  as ten double outlines. `--shh` (the raised/hover shadow) keeps its ring,
  because a raised state is a different one.
- **A surface step, in the same direction in both themes.** The surface tokens
  now carry **roles** rather than a single lightness direction:
  `--bg-0` is the page ground, `--bg-1` the **raised** surface (card, menu,
  window, modal), `--bg-2` the **recessed** fill (input, track, chip, table
  header), `--bg-3` / `--bg-h` / `--bg-a` the rest / hover / active fills. The
  three dark schemes had `--bg-1` _darker_ than `--bg-2`, so a card read as sunk
  into the page; their values are swapped. The light schemes keep their
  direction with a wider step — the card is now the palette's white.

  Measured in Chrome, a card against its ground: arctic **1.026 → 1.083** in
  light, and **sunk → raised** in dark; the same in ember and sage. Nested
  surfaces now agree between themes as well: a card header is recessed against
  its card, and a grid's cells sit above its frame, which sits above the page.
  Every text tone stays at or above AA on all three surfaces in all six schemes
  (worst: `--t3` on the raised surface in sage dark, 4.51).

- **`strct-shell` paints `--bg-0`**, the ladder's page ground, instead of
  `--bg-2`.
- **`strct-segmented`'s moving pill keeps a hairline of its own.** It had no
  border and took its definition from `--sh`'s ring, so it was given one
  explicitly.

### Fixed

- **The visual-regression gate could not see a palette change.** `pixelmatch`'s
  0.15 threshold tolerates antialiasing, which also means a few levels per
  channel across a whole page count as **zero** differing pixels: this change
  moved every surface and the gate reported every page as matching. It now also
  measures the **mean per-channel drift** and fails above 0.6/255. Against the
  old baselines this change measures 8.0–12.7, so it is caught; two consecutive
  runs of identical renders measure 0.00, so it is not flaky. The twelve
  baselines are refreshed to record the new surfaces.

### Migration

- If you painted a **raised** panel with `--bg-2`, switch it to `--bg-1`; if you
  painted a **recessed** fill with `--bg-1`, switch it to `--bg-2`. In the light
  schemes both keep their direction, so only dark-scheme work is affected.
- If something of yours relied on `--sh` for its **only** edge, give it a border
  (or add `0 0 0 1px var(--b1)` to its own shadow, as `strct-segmented` does).
- If you painted your page ground with `--bg-2` to match the shell, switch to
  `--bg-0`.

## [4.25.0] - 2026-09-30

### Added

- **Dev-mode diagnostics for attributes a component does not have** (FR-48-42).
  Writing a component the way a sibling component is written must not fail
  silently: `<strct-alert variant="warning">` compiles, because a static
  attribute is just an HTML attribute to Angular, renders the info-blue default,
  and nobody finds out — it shipped nine times in the audited app. Each of
  `strct-alert`, `strct-badge`, `strct-tag` and `strct-status-dot` now checks its
  host once, after first render, against a **closed** list of input names that
  exist on other strct components, and names the input that actually takes the
  value written. Ordinary HTML, ARIA, `class`, `style` and `data-*` are never
  flagged. `strct-alert` also warns when a consumer's `display` overrides the one
  its layout depends on.

  Every call site is guarded inline with `ngDevMode`, so production drops the
  calls and tree-shakes the diagnostics away with them: the production bundle
  contains no `[strct]` strings at all.

- **`StrctInput` answers to `strct-input` as well as `strctInput`** (FR-48-42).
  `<button strct-button>` is kebab-case, so that is what a consumer writes by
  analogy — and an unstyled browser input is the silent failure that follows. The
  alias is kinder than a warning and costs nothing.

- **CI asserts the showcase logs no `[strct]` diagnostics**
  (`scripts/dev-warnings.mjs`). The warnings are for consumers, so the library's
  own showcase must never trigger one. It runs against the **development** build,
  since production compiles the diagnostics out.

## [4.24.0] - 2026-09-30

### Added

- **`strct-login`: the showcase's aside, built in** (FR-48-40). What the library
  shows as its login screen, a consumer can have by asking for it: `art="network"`
  renders the glow, the dot grid and the pulsing node diagram — **palette tokens
  only**, so it follows all six schemes, decorative for assistive tech, and still
  under `prefers-reduced-motion`. `art="grid"` keeps the glow and grid alone.
  `brandIcon` / `brandName` put the icon tile and product name at the top,
  `tagline` is the kicker above your own copy, and `[strctLoginStatus]` is
  projected at the aside's foot.
- **`strct-qr`** (FR-48-41): a QR code **the library draws**, with the quiet zone
  and contrast a scanner needs in every theme — not an image the consumer frames
  on a hard-coded white box. The encoder ships with the library and has no
  dependencies (byte mode, versions 1–10, all four correction levels), and it is
  verified rather than assumed: the Reed–Solomon parity matches the published
  vector, and a reader written from the spec reads every code back — format bits,
  mask, zig-zag, de-interleaved blocks with zero syndromes, and the original
  text. Dark modules on a light quiet zone in every scheme is a deliberate
  exception to "tokens only", because a themed QR code is an unscannable one.

## [4.23.0] - 2026-09-30

### Added

- **Chat: `strct-chat-thread`, `strct-chat-message`, `strct-chat-composer`**
  (FR-48-39). An assistant panel is built from the library, like every other
  panel. The thread is a `role="log"` with `aria-live="polite"`, so a streaming
  reply is announced **once, when it finishes** rather than token by token;
  `busy` shows the typing indicator, and the newest message stays in view unless
  the reader has scrolled up. Each message is an `article` named by its author,
  with an icon avatar, a bubble drawn from tokens — no blur, no gradient — and
  room for a `[strctChatAttachment]` card under it, for the action the user must
  approve. The composer grows with the text to `maxRows`, sends on Enter, breaks
  a line on Shift+Enter, and **never sends mid-composition**, so an IME's Enter
  commits the candidate instead of the message. The caret and the typing dots
  hold still under `prefers-reduced-motion`.

## [4.22.0] - 2026-09-30

### Added

- **`strct-window` and `strct-window-dock`** (FR-48-33). Some work lives in a
  window beside the page: a VM console stays open while the operator browses. It
  can be moved (by the title bar, or Alt+arrows on it), resized from focusable
  corner grips (arrows 16px, Shift+arrows 64px), minimised to the dock and
  brought back from it — and it **does not block the page**, because a modal does
  that and a drawer is pinned to an edge.

  It is a `role="dialog"` with `aria-modal="false"` on a new **`--z-window`**
  layer (500), between the tour and the modal, so a modal opened from inside a
  window still comes up over it; the active window is raised above its
  neighbours. Focus moves to the title bar on open and returns to the opener on
  close, and **Escape minimises** rather than closing, because a window is not
  dismissed like a modal. `bounds` is two-way, so a window's place can be
  persisted; `palette="dark"` forces the dark scheme inside while keeping the
  palette in force outside — what a console wants.

## [4.21.0] - 2026-09-30

### Added

- **`strct-splitter`: pixel bounds and a collapsible pane** (FR-48-35). A sidebar
  is 280px, not 22%: `unit="px"` sizes and drags the start pane in pixels, with
  `minSize` / `maxSize` bounding it in the same unit, and `collapsible` lets
  Enter on the gutter fold the pane away and bring it back (`collapsed` is
  two-way, and the gutter says which with `aria-expanded`). Percent mode is
  unchanged.
- **`[strctResizeHandle]`** (FR-48-35): the same gutter, standalone, for a
  layout the splitter does not own — a shell grid, a docked panel. It draws the
  grip and brings the separator semantics with it: `role="separator"`, a tab
  stop, arrows that step (Shift × 4), Home / End for the bounds, Enter to
  collapse. The consumer owns the size, so it can be persisted or animated.
- **`[strctReorderGroup]` and `[strctReorderHandle]`** (FR-48-36). A dashboard's
  cards move within a column and between columns: the group connects the lists
  and emits `(moved) { item, fromList, toList, fromIndex, toIndex }`, while a
  handle — when an item has one — is the only place a drag may start, so text
  selection or a chart brush inside a card cannot begin a move. From the
  keyboard, Alt+ArrowLeft / Alt+ArrowRight move to the neighbouring list at the
  same index, and the live region names the column it landed in. A single list
  is unchanged.

## [4.20.0] - 2026-09-30

### Added

- **`strct-media-frame`** (FR-48-34): a live picture — a console thumbnail, a
  camera — sits in a fixed-ratio frame, and when there is no picture yet, or
  none at all, the frame says why **in its own small space**, because an empty
  state is too large for a 240px card. `state` covers content, loading, empty,
  `off` (black, because that reads as a screen) and error; `interactive` makes
  the whole frame one tab stop, so the thumbnail is the button that opens the
  console.
- **`strct-shell [skipLinkTarget]`** (FR-48-37): "Skip to main content" as the
  shell's first focusable element, invisible until focused. It moves **focus**
  (applying `tabindex="-1"` when needed), not only the scroll position, so the
  next Tab resumes inside the content. Without a target nothing is rendered.
  This site's own shell now carries one — press Tab.
- **`strct-accordion-panel appearance="quiet"`** (FR-48-38): "How this works" is
  a quiet fold in running text — a one-line, link-looking summary that opens in
  place — not a boxed accordion. It reads like the 17 raw `<details>` folds it
  replaces, while keeping the button + region semantics they never had.

## [4.19.0] - 2026-09-29

### Added

- **`strct-flow`: a fan-out layout, edges and node templates** (FR-48-31).
  Infrastructure diagrams fan out — one host lands its VMs on several others,
  one switch has several hosts each with its own uplinks — and a diagram node
  carries more than one line. `layout="fan-out"` places the nodes in columns and
  draws the **`edges`** between them as orthogonal connectors, measured from the
  boxes' real positions and re-measured on resize; `layout="tree"` derives those
  columns from each node's depth in the edge list. `columns` names each column,
  `nodes[].data` carries whatever an `<ng-template strctFlowNode>` needs, and an
  edge takes a `status`, a dashed `style` and an `animated` dash that holds still
  under `prefers-reduced-motion`. `chain` — the straight A → B connector — is
  unchanged.

  The diagram is described **structurally**: each column is a labelled group,
  each node says where it leads ("→ hv-02, hv-03"), and the SVG edges are
  `aria-hidden`. Below 480px the columns stack and the connectors become a
  leading rail, because orthogonal edges between stacked columns say nothing.

### Fixed

- **The a11y smoke no longer fails when Chrome is slow to start.** It now waits
  on the same 30s deadline the visual-regression script uses (after the same
  flake) and says that a launch failure is not an accessibility finding.

## [4.18.0] - 2026-09-29

### Added

- **`strct-steps`** (FR-48-30): a read-only status stepper for a process the
  user _watches_ rather than drives — an update run per host, or a numbered
  method on a landing page. A wizard's rail is the wrong control (the user did
  not start each step and cannot go back to one) and a timeline implies history;
  neither can say **skipped** or **blocked**. Six states with their own tones,
  each also said in words for assistive tech ("Install, in progress"), the
  active step pulsing its own edge and holding still under
  `prefers-reduced-motion`. Three appearances — `pills`, `dots` for a long run,
  `cards` for the numbered method with a description and a per-step
  `[strctStepAction]` template — plus `orientation`, `numbered` and `dense`.
- **`strct-change`** (FR-48-32): a value change as one phrase — the old value
  muted, the arrow the library's, the new one emphasised — read as "from v10.27
  to v10.28" rather than as an arrow glyph, with `mono` for versions and a
  localisable `label`.

## [4.17.0] - 2026-09-29

### Added

- **`strct-datagrid`: presentation as column metadata** (FR-48-26). The look of a
  cell is column metadata, not a cell template: **`mono`** for a GUID column,
  **`muted`** for a note, **`numeric`** for a counter (end-aligned with tabular
  figures, header included), **`emptyText`** for what a blank cell shows (in
  `--t3`) with **`emptyLabel`** for what assistive tech hears instead of the
  glyph, and **`descriptionKey`** for a quiet second line from the row. Plus
  **`caption`**, which gives the grid its own title and names the table
  (`aria-labelledby`), and **`flush`**, which drops the outer border, radius and
  shadow for a grid inside a panel that already has them — instead of a consumer
  stylesheet reaching into `.strct-dg-host`.
- **`strct-datagrid paging="more"`** (FR-48-27), with `hasMore`, `loadingMore`,
  `moreTotal` and `(loadMore)`. A feed that pages by cursor loads more at the
  end: `lazy` speaks page numbers, which a cursor API cannot answer. The footer
  becomes a count and a Load more button — a spinner while the slice arrives, no
  button once `hasMore` is false — and the consumer appends the rows, so the
  scroll position is kept.

## [4.16.0] - 2026-09-29

### Added

- **`strct-description-list align="grid"`, with `labelWidth`** (FR-48-25). A list
  of facts lines its values up: one label column sized to the longest label, so
  every value starts on the same vertical line — what about 33 hand-built
  `auto 1fr` grids in the audited app are for. The rows go `display: contents`,
  so their `dt` / `dd` become the grid's own items and the hairline moves with
  them.
- **`strct-desc`: `status`, `statusLabel`, `icon` and `note`** (FR-48-25). A fact
  can carry its state and a short note — "Agent · connected · last seen 12 s
  ago" is one row rather than a dot, a label, a value and a caption assembled by
  hand.
- **`strct-tree`: `framed` and `maxHeight`** (FR-48-28). A tree used as a picker
  inside a dialog sits in a frame and scrolls inside it, drawn from tokens
  instead of an inline-styled wrapper whose dark-theme colours are hard-coded.
  Keyboard navigation scrolls the focused node into view **inside the frame**,
  not the page.
- **`strct-avatar`: `icon`, `shape` and `tone`** (FR-48-29). Not every avatar is
  a person with initials: a group is a square, an assistant is an icon, a brand
  mark is an accent tile. An `src` image still wins over an icon, and the icon
  scales with the avatar (13 / 17 / 22px).

## [4.15.0] - 2026-09-29

### Added

- **`strct-legend`** (FR-48-23). A chart's key is a component: the same swatch ·
  label · value rows serve a line chart's series picker, a diagram's edge styles
  and a donut's categories, instead of 9px squares with inline backgrounds
  written per screen. The swatch takes a `shape` (`square`, `dot`, `line`,
  `dash`), a `status` tone or an explicit palette `color`; a category with
  nothing in it keeps its row, muted, because "0 failed" is information. With
  `interactive` each row is a toggle button carrying `aria-pressed`, so a
  switched-off series is announced rather than only dimmed.
- **`strct-donut`: `legendPosition` and `keepEmpty`** (FR-48-23). The legend can
  sit under the ring, for a card narrower than ring + key, and a zero-value
  category's row is muted rather than silently normal. `keepEmpty` defaults to
  `true` — the row already stayed — so it is the opt-out for the rare case where
  the noise is not worth it.

## [4.14.0] - 2026-09-29

### Added

- **`strct-status-dot pulse` and the new `strct-live-indicator`** (FR-48-19).
  Something happening now pulses once a second; something that should be live
  and is not says so. `pulse` animates the dot's **halo**, never its size, so a
  column of dots does not jitter — and under `prefers-reduced-motion` the halo
  is a static ring. `strct-live-indicator` makes "Live · updates every 5 s",
  "Connecting…", "Reconnecting…", "Paused" and "Last updated 3 min ago" states
  of one indicator rather than three captions beside three hand-rolled dots: it
  picks the wording and the tone from `state`, re-renders its relative time
  every 30 s, takes every string through `labels`, and is a polite
  `role="status"` so a change is announced once and a tick never is.
- **`strct-metric-tile`: `href`, `interactive`, `captionStatus` and
  `[strctMetricMeter]`** (FR-48-21). A KPI you can drill into is a link — the
  hit area covers the whole tile, border included, carries the tile's own focus
  ring and is named "<label>: <value>", instead of an anchor wrapped around the
  tile by hand. `captionStatus` tints only the caption, because "2 down" is the
  warning and the 14 nodes above it are not. A projected meter sits under the
  value and above the caption, for a number shown over its bar.
- **`strct-alert [icon]`** (FR-48-22) overrides the icon derived from `type` — a
  lock for a locked setting, a shield for a security note — when the tone alone
  does not say what kind of note it is.

### Fixed

- **`strct-alert` keeps its layout when a consumer sets the host's `display`.**
  The flex row moved to an inner element and the host is `display: block`, so
  the `style="display:block; margin…"` an app adds for spacing no longer puts
  the icon on its own line above the text.

## [4.13.0] - 2026-09-29

### Added

- **`StrctMenuService.open({ anchor, placement, offset })`** (FR-48-10). A menu
  opened from a control never covers it. Pass the control (an `Element` or a
  `DOMRect`) instead of `x` / `y`: the menu is measured after it renders and
  placed against the anchor — `bottom-start` by default, `bottom-end` to align
  the end edges, `top-*`, `right-start`, `left-start` — flipping to the other
  side when the preferred one has no room and clamping on the cross axis. It
  stays `visibility: hidden` for the frame it is being measured in, so it never
  appears in the wrong place first, and focus returns to the anchor on close.
  Callers that pass `x` / `y` are unchanged; consumers no longer have to guess
  the menu's width or estimate its height from a row count.
- **`[strctDropdownItemAction]`** (FR-48-11): a second action at the end of a
  menu item — "delete this saved view" beside "open it". Its click stays with
  it, so the item is not activated and the menu stays open, and it keeps out of
  the Tab order: the right arrow reaches it from its item, the left arrow
  returns, and Delete on the item triggers it, as the WAI-ARIA pattern for a
  secondary action does. Items without the slot are unchanged.

## [4.12.0] - 2026-09-29

### Added

- **`strct-button variant="link"`** (FR-48-09). An action inside running text
  looks like a link and behaves like a button — "Show all", a folder name in a
  cell, "Use another method". No padding, border or background; `--acc` text
  underlined on hover and on focus; `size` scales only the font; a disabled one
  goes `--t4` with no underline. It stays a real `<button>` (or an `<a href>`),
  unlike the `<a>` with a click handler and no `href` that no keyboard can
  reach.
- **`strct-breadcrumb-item interactive` + `(activated)`** (FR-48-09). A trail
  that does not route — a folder path inside a view — gets crumbs that are
  themselves the control: a tab stop answering Enter and Space. `interactive` is
  stated rather than inferred from the output having a listener, which Angular's
  output API does not expose.
- **`strct-icon [count]`**, with `countMax`, `countStatus` and `countLabel`
  (FR-48-12). A bell with seven alarms says 7. `badge` draws a status dot, so it
  can say that something is wrong but never how many. The count sits on the
  icon's top end corner, caps at `countMax` ("99+"), draws nothing for `0` or
  `null`, and replaces the status badge — an icon says one thing at a time. It
  is `aria-hidden`; `countLabel` folds it into the icon's own accessible name
  ("Alarms, 7 new"), so a decorative icon stays decorative and the count belongs
  to the button around it.

### Changed

- The a11y smoke now **gates accent-on-background contrast** in all six schemes,
  since `variant="link"` paints `--acc` straight onto the page. Measured:
  arctic 6.34 / 5.39, ember 6.96 / 5.78, sage 6.77 / 5.37 — all above AA.

## [4.11.0] - 2026-09-29

### Added

- **`strct-radio-group variant="card"`** (FR-48-02). A choice between a few kinds
  of thing, each needing a sentence to explain, is a set of radio cards: radio
  semantics with a card look. Each option becomes a tile with room for an `icon`
  and a `description`, the tiles lay out as many `--strct-radio-card-min` (220px)
  columns as fit and stack below that, and the selected tile takes the accent
  border and fill. The markup stays a native radio group — one `name`, arrow keys
  — rather than the buttons apps build, where screen readers hear unrelated
  buttons instead of one choice.
- **`strct-tag`: `interactive`, `shape="pill"`, `mono` and `[strctTagLeading]`**
  (FR-48-03). A tag is also the natural control for a thing you can reopen — a
  minimised console, a suggested question — and removing it is a separate act.
  `interactive` makes the body activate on click, Enter or Space and emit
  `activated`, while the × stays its own tab stop: two targets, two things to
  say. The body carries `role="button"` rather than being a `<button>`, because
  a template can project the same content into only one place, so branching the
  markup on `interactive` would drop it in the other branch — the shape
  `strct-list-item` and `strct-tree` rows use.
- **`description` on `strct-checkbox`, `strct-toggle` and `strct-radio`**
  (FR-48-04), plus `[strctControlDescription]` for one with markup in it. An
  option whose consequence needs a sentence carries that sentence as its
  description: rendered inside the control's own `<label>`, so clicking it still
  toggles the option, and linked with `aria-describedby`. Because the sentence
  shares the `<label>`, the accessible name is pinned to the label text — the
  accessibility tree reads name "Network", description "The cluster networks, IP
  addresses and Windows Firewall.", not the two run together. This replaces
  wrapping the control in an outer `<label>`, which nests a label inside the
  component's own.

## [4.10.0] - 2026-09-29

### Added

- **`strct-datagrid`: select and number editors for editable columns**
  (FR-48-08). Rows of structured settings — firewall rules, service bindings —
  are edited in the grid, and a value that is one of a set is chosen, not typed.
  - **`editor: 'select'`** with **`editorOptions`** (the library's own
    `StrctOption` shape) renders `strct-select` in the cell. The cell reads as
    the option's **label** at rest, and choosing is the commit.
  - **`editor: 'number'`** renders `strct-number` with **`editorMin`**,
    **`editorMax`** and **`editorStep`**, committing on Enter or blur. The
    bounds reach assistive tech as the spinbutton's `aria-valuemin` /
    `aria-valuemax`, and the grid **clamps a commit to them** — `strct-number`
    alone clamps only on blur, so Enter would otherwise commit an out-of-range
    value.
  - Focus lands on the field rather than on the stepper button beside it, and a
    stepper click keeps the editor open: only focus that actually leaves the
    editor is a blur.
  - `editor` defaults to `'text'`, so an `editable` column without it is
    unchanged.

### Changed

- `(cellEdit)` now also carries **`typedValue`** — the number a `number` editor
  holds, or the option's `value` a `select` editor chose. `value` stays the text
  form, so a handler written against `value: string` keeps compiling.

## [4.9.0] - 2026-09-29

### Added

- **`strct-field`: a label column, addons inside the box, and a hint with markup
  in it** (FR-48-05, FR-48-06, FR-48-07).
  - **`layout="inline"`** reads a long settings form as two columns: the label
    and its hint in a fixed-width column (`--strct-field-label-w`, 220px), the
    control beside them, a hairline between consecutive settings, and the error
    under the control rather than under the label. Below 480px of field width it
    falls back to stacked, so the same form works in a drawer. `[strctFieldGroup]`
    on a wrapper drops the hairlines for settings that read as one block.
    Stacked remains the default. The breakpoint is a literal rather than a custom
    property because a container query cannot read one.
  - **`[strctFieldPrefix]` / `[strctFieldSuffix]`** render inside the control's
    border: the field takes the border, radius and focus ring over from the
    input, so one ring covers the value and its unit, and a message box with a
    send button stops being a box drawn by hand. A text addon joins the control's
    description — a screen reader hears "Minimum memory, MB" — while an addon
    holding its own control stays its own tab stop and is left out of it.
  - **`<ng-template strctFieldHint>`** renders where the string `hint` renders,
    in the same style, and carries the same id, so a hint that names a thing in
    bold is still the control's description instead of a loose paragraph under
    the field. It takes precedence over `hint`.

  Measured in Chrome: five inline settings align every control on one line with
  the label's first line 0.5px off the control's centre; at 400px of field width
  they stack; an out-of-range value puts the error in the control's column; the
  input inside an addon box measures `border: 0px` with the ring on the box.

## [4.8.0] - 2026-09-29

### Added

- **`strct-datagrid`: single selection, per-row locks, and select-all on a
  group** (FR-48-01). A grid a user picks from is the grid's own selection,
  whatever the number of picks — it should not be a column of radios the
  consumer builds and wires outside the grid, where the arrow keys move within
  the radio group instead of along the rows, clicking a row does nothing, and
  `(selectionChange)` never fires.
  - **`selectionMode="single"`** with two-way **`selectedId`**. The column is a
    native radio group, one `name` per grid, so the arrow keys move between
    rows and Space picks without the grid inventing its own keyboarding.
    Clicking anywhere on the row picks it, `(selectionChange)` still fires with
    a one-element array so existing listeners keep working, and the footer count
    is hidden. `selectable` remains the boolean spelling of `multiple`.
  - **`rowSelectable`** returns `false` to lock a row, or a string to lock it
    and say why: the reason becomes the row's `title` and the control's
    `aria-description`. A locked row keeps its normal colours — a locked
    candidate is still worth reading — is skipped by `toggleRow` and by
    select-all, and stays reachable so its reason can be read.
  - **`groupSelect`** puts a tri-state checkbox on each group header: checked
    when every selectable row of the group is selected, indeterminate when only
    some are, and it ignores locked rows.

  Rows carry `aria-selected` whenever a selection mode is on, and a locked row
  is `aria-disabled`. Measured in Chrome: the arrow keys walk the radio group
  and skip the locked row (0 → 2 → 3), `selectedId` follows, and clicking a
  locked row changes nothing.

## [4.7.0] - 2026-09-29

### Added

- **`strct-list` + `strct-list-item` (new)** (FR-48-24). Short lists of things
  with a status are lists, not tables: a leading marker, a title, a secondary
  line, a quiet meta and a control at the end. A table needs a header row and
  columns, a timeline implies time order, and an alert per item is too heavy —
  so without a list every screen invents its own rows (ten hand-built patterns
  in the app this came from).

  `interactive` makes the row itself activate on click, Enter or Space and emit
  `activated`, while `[strctListItemTrailing]` stays a **separate tab stop**, so
  "open this alarm" and "acknowledge it" are two targets rather than one.
  `selected` sets `aria-current`, `status` draws the rail `strct-card` uses,
  `dense` gives 32px rows, `dividers` and `emptyText` cover the rest. Below a
  360px container the meta drops under the description instead of squeezing the
  title.

  The row carries `role="button"` rather than being a `<button>` element: a
  template can project the same content into only one place, so branching the
  markup on `interactive` would silently drop it in the other branch.
  `strct-tree` rows already work this way.

  Measured in Chrome: `list` / `listitem` roles, the slots in order across the
  row, the trailing control outside the activatable area, Tab reaching the row
  and then its button, and 32px dense rows against 44px default single-line ones.

## [4.6.0] - 2026-09-29

### Added

- **`strct-progress` meter mode** (FR-48-18). A capacity bar now says what it
  measures and how much, next to the bar: `visibleLabel` puts `label` at the
  start of a row above the track, `showValue` puts `valueText` (default
  `${value}%`) at its end, and `caption` adds a quiet line under it.
  `segments` stacks more than one fill — what a host runs now plus what would
  arrive if its neighbour failed — each with its own tone, with widths clamped
  so the total can never overflow the track and their labels joined into
  `aria-valuetext` ("Used 61%, Arriving 22%"). `indeterminate` is a task that
  is running but reports no percentage: a sweeping fill, no `aria-valuenow`,
  and a static striped fill under `prefers-reduced-motion`. `status` gained
  `neutral` for queued / idle / unknown. Everything is off by default.
- **`strct-spinner` `caption`** (FR-48-20). Visible text beside the ring, which
  also becomes the accessible name, so a spinner is not announced as "Loading"
  while it says "Reading…". Without a caption the host is still the ring itself,
  so every existing spinner is byte-identical.
- **`strct-empty-state` `size="sm"` and `variant="loading"`** (FR-48-20). `sm`
  is the inline row a small frame wants — a 16px icon with the title on one
  line — instead of a 56px chip and 40px of padding. `loading` swaps the icon
  chip for a spinner and marks the region `aria-busy`.

Measured in Chrome with the motion preference emulated both ways: the
indeterminate bar sweeps at 35% width with `prefers-reduced-motion:
no-preference` and becomes a static striped full-width fill under `reduce`,
and it never carries `aria-valuenow`.

## [4.5.0] - 2026-09-29

### Added

Headings and text (FR-48-13 … 17), the largest source of hand-written CSS in
the app this batch came from: ~60 uppercase "eyebrow" rules across 40 files and
147 inline muted paragraphs.

- **`strct-section-header` (new).** A page is made of titled sections, and a
  section title is a heading at the right level. `strct-page-header` is the
  page's `h1` and `strct-card-header` needs a card; the piece between them had
  no component. `level` (2–6) picks the element and `appearance`
  (`title` | `overline`) picks the look, so the document outline stays right
  whatever the section is styled like. `[strctSectionHeaderMeta]` follows the
  heading on its line, `[strctSectionHeaderActions]` goes to the end.
- **`strct-card-header`: `heading`, `appearance`, and meta / note / actions
  slots.** The header row is now name · status · what you can do with the card,
  in fixed places, so every card in an app lines up. A header that only projects
  content renders exactly as before.
- **`strct-page-header`: `level`, `size`, `icon` and `[strctPageHeaderTitleMeta]`.**
  A header can be a page's `h1` or a pane's `h2`, carry the kind of object the
  page is about, and hold a state badge beside the title. Defaults unchanged.
- **Text utilities** next to `.strct-mono`: `.strct-text-muted`,
  `.strct-text-hint`, `.strct-text-overline`, `.strct-text-lede`. Measured in
  Chrome in all six schemes: muted on `--bg-1` is 4.65–4.83:1 and overline
  5.55–6.15:1, so every tone clears AA. A `[strctToolbarCaption]` slot on
  `strct-toolbar` and `[strctDatagridActionBarCaption]` on the grid's action bar
  carry the same muted note on a button row.
- **`[strctCode]` (new directive)** for a command, a path or an identifier
  inside a sentence — `strct-code` is a block and `strct-kbd` means a key.
  Padding is horizontal only and the line-height is inherited, so a code span
  never changes a paragraph's leading. `copyable` appends the library's own
  `strct-copy` button rather than re-implementing the clipboard.

## [4.4.1] - 2026-09-29

### Fixed

- **`strct-progress`: the track stays visible on the surface it sits on**
  (FR-47-01). The track painted `--bg-3`, which is exactly a datagrid row's
  ground in the dark theme — so inside a row the track disappeared and only the
  fill was left: 37% read as a short dash with nothing to measure it against,
  93% as a line that could have been 100%. It now paints a translucent tint of
  the FOREGROUND, which steps off any surface the library places a bar on, plus
  a hairline inset ring so the full length reads even where the tint is subtle.
  `--strct-progress-track` overrides the colour.

  Measured in Chrome inside a datagrid row: dark, the row is `rgb(35, 40, 47)`
  and the old track was `#23282f` — the same colour, contrast 1.00. The track is
  now `rgb(59, 63, 70)`, contrast 1.40. Light goes 1.11 → 1.27. The showcase
  datagrid demo has a CPU column of progress bars, and the visual-regression
  gate covers it in both themes (its routes can now aim at an anchor, so a case
  below the fold can be pinned).

- **`strct-heatmap` `thresholds`: intensity no longer falls as the value rises**
  (FR-44-02). 4.3.0 scaled intensity inside each band and restarted every band
  at the same floor, so a cell just past a threshold came out PALER than the one
  just below it: with `{ warning: 85, critical: 95 }`, 84% mixed at ~99% and 86%
  at ~50%. Pale squares sat between dark ones and read as the quiet hours when
  they were the busiest. The bands now own ascending, non-overlapping intensity
  ranges (accent 8–80%, warning 80–92%, critical 92–100%; a warning band with no
  critical bound owns 80–100%). Crossing a threshold changes the hue and never
  lowers the strength, and a band still darkens with the value inside it.

  Verified in Chrome over 93 cells of the showcase grid: zero steps where
  luminance rose as the value rose.

## [4.4.0] - 2026-09-26

### Added

- **Drag and drop in `strct-tree`** (FR-43-04). Operators expect vCenter's
  gestures in an inventory tree — drag a VM into a folder, back out onto its
  datacenter, onto another host to migrate it. The tree had no API for it, so the
  consumer grafted one onto the rendered DOM (matching rows to data by
  `data-node-id`, re-scanning on every mutation and every 2s) and the operator
  still reported "drag-and-drop does not work in the trees".

  The tree now owns the gesture, the feedback and the identity of the two nodes;
  the consumer owns the rule:
  - **`canDrag`** — which nodes can be picked up. Default none, so a tree
    without it behaves exactly as before. Asked again whenever `nodes` changes,
    because a refresh can make a node movable.
  - **`canDrop(source, target)`** — asked during `dragover`, with both nodes. A
    browser does not let `dragover` read the drag's data, which is precisely the
    part a consumer cannot do cleanly from outside, so the tree keeps the source.
    Without this input nothing accepts a drop.
  - **`(nodeDrop)`** — `{ source, target, position: 'into' }`, for an accepted
    drop only. `position` exists so before/after reordering can be added later
    without changing the event's shape.
  - **Built in whatever `canDrop` returns:** a node is never dropped on itself,
    and never into its own subtree — a folder into its own subfolder is a cycle.
  - **Feedback in the library's tokens:** the source row dims, an accepting row
    is outlined, a refusing one keeps the browser's "not allowed" cursor (its
    `dragover` is not prevented). The highlight clears on `dragleave`, `drop`
    and `dragend`, including when the drop lands outside the tree.
  - **Reaching a target that is not visible:** hovering a collapsed node for
    `dragExpandDelay` (700ms) expands it, and holding near the top or bottom
    edge of a scrolling ancestor scrolls it. Without these, a collapsed
    thousand-VM inventory has no reachable targets at all.
  - **Announcements:** "Dragging <label>" and "Dropped <label> on <target>" in
    the polite live region. Rows stay `treeitem`s with their roving tabindex, so
    the keyboard routes the consumer already has (Move to Folder…, Migrate…) are
    untouched.

  Measured in Chrome on the new showcase demo: `draggable` only on the nodes
  `canDrag` accepts, the source at `opacity: 0.45`, an accepting target with a
  1px outline and a prevented `dragover`, a refusing one with neither, a
  collapsed folder still closed at 400ms and open at 850ms, a scrolling
  container moving 0 → 228px while a drag hovers its bottom edge and stopping at
  `dragend`, and the dropped node actually moved.

  HyperStruct can delete `tree-drag-drop.directive.ts` and its spec.

## [4.3.0] - 2026-09-26

### Added

- **`strct-heatmap` for a monitoring grid** (FR-43-01..03). Three things an
  operator reads a host × hour utilisation grid for were impossible or needed a
  workaround:
  - **`colLabelEvery` and `colLabel`** — 24 hourly columns in a 700px card leave
    ~26px per label, so "14:00" overlapped and consumers were forced down to
    "14", which reads as a number rather than a time. Label every n-th column
    and format the text, keying columns by something unique (an ISO time) and
    labelling them readably. Every cell is still drawn; only the labels thin out.
    Labels are now tracked by index, so a repeat is legitimate data — the DST
    fall-back really does have two 02s, and a thinned axis repeats the empty
    string. Before, that was a duplicate track key (NG0955).
  - **`valueFormat`** — the cell tooltip was fixed to `row × col: value`, which
    for a CPU grid reads `hv-05 × 14: 47` with no unit. `summaryFormat` existed
    for the aria summary but nothing for cells.
  - **`thresholds`** (the same `StrctThresholds` the gauge takes) — one hue
    answers "how much more than the others", not "is it past 80, past 95". A cell
    now takes its hue from its band and its intensity from the value's position
    inside that band, floored at 45% so a band reads as itself and a pale cell is
    never mistaken for no-data. Unset: today's single-hue ramp, unchanged.

  Verified in Chrome at 1280×900 on the showcase demo: 8 labels across 24 hourly
  columns with zero overlapping label boxes, 96 cells still drawn, the tooltip
  reading `hv-01 · 14:00 — 81% CPU`, and all three band hues present.

  HyperStruct can drop its `"HH"`-with-a-prime column labels, the "Hourly
  average, 0–100% · hover a square for its value" line above the grid, and the
  single `status="accent"` hue for both CPU and memory.

## [4.2.1] - 2026-09-26

### Fixed

- **A tall step no longer pushes the wizard footer out of a chromeless dialog**
  (BUG-41-01). Back / Next / Finish / Cancel stay on screen whatever a step
  renders; the step's content pane scrolls instead. The height chain broke in
  two places: the chromeless modal body sized to its content instead of growing
  inside the dialog's flex column, and the vertical wizard's grid had no bounded
  row track, so it grew to the step and the dialog's `overflow: hidden` cut the
  footer off the bottom. `overflow-y: auto` was already on the content pane — it
  just never received a bounded height. The horizontal layout gets the same
  guarantee when it is hosted in a height-capped surface (`flush`); an inline
  wizard still sizes to its content and keeps its block flow.

  Measured in Chrome at 1280×720 with a 1400px step: the footer's bottom sits at
  695px against the dialog's 696px and the pane scrolls; with the fix removed at
  runtime the footer jumps to 1645px, well past the dialog. jsdom cannot lay out,
  so the unit tests pin the chain (every `min-height: 0`, the `minmax(0, 1fr)`
  row track, the body's `flex-grow`) against a silent regression.

  HyperStruct can drop the "footer must never leave the dialog (O178)" block from
  its `styles.scss`, including the `.strct-modal__body { flex: 1; min-height: 0 }`
  half it carried as an upstream gap.

## [4.2.0] - 2026-09-22

### Added

- **`StrctMenuItem.hint` — a menu entry can say why it is disabled without
  putting it in its label** (FR-42-01). The label stays the action's name
  ("Clone"); the reason ("VM must be powered off to clone.") is the entry's
  tooltip and its accessible description (`aria-describedby` to a hidden
  node — kept out of the accessible name). It is never rendered inline, so
  the menu keeps its width: measured in Chrome at 191px with the hints and
  191px with the hint nodes removed. Works on enabled entries too, and in
  every place a `StrctMenuItem` renders — `[strctContextMenu]` (and so tree
  and datagrid row menus), its submenus, `strct-menubar` and its submenus,
  and `strct-split-button`. Adding it to only one would have left the others
  ignoring it silently.
- **`strct-dropdown-item` `hint` input**, the same thing for declarative
  menus (`strct-dropdown`, `strct-context-menu`, `strct-submenu`).

### Changed

- **Disabled menu entries use `aria-disabled`, not the native attribute**,
  in the context menu and menubar. A natively disabled button takes no focus
  and, in some browsers, no pointer — so neither the keyboard nor the hint's
  tooltip could reach it. Activation is still blocked, by click, Enter and
  Space alike.
- **A disabled entry WITH a hint is keyboard-reachable** so its reason can
  be announced — Chrome's accessibility tree reports it as a focusable,
  disabled menuitem whose description is the hint. A disabled entry WITHOUT
  a hint is skipped exactly as before, so nothing changes for menus that do
  not use hints. Menus still open on the first enabled entry.

### Fixed

- **Context menu: the arrow keys could strand focus on a disabled entry.**
  They moved the active index onto it, but `focus()` on a natively disabled
  button is a no-op, so focus stayed behind while Enter acted on the
  invisible "active" entry — i.e. did nothing. Unhinted disabled entries are
  now skipped, hinted ones really take focus.
- **A disabled parent entry opened its submenu on hover** (and, in the
  context menu, on ArrowRight). It no longer does.
- **Keyboard order in menus is DOM order in every DOM implementation.** The
  roving lists were built from comma-separated selectors, which browsers
  return in document order but jsdom does not — scrambling arrow-key order in
  tests. They now query one selector and filter (or sort explicitly).

## [4.1.0] - 2026-09-18

Implements HyperStruct's "silent failures" report: where a component is used
in a combination it cannot honour, it now says so instead of doing something
plausible and wrong. Every diagnostic is dev-mode only (`ngDevMode`), fires once
per condition, and names what was ignored and what to do instead. Each is guarded
inline, so a production build drops it entirely — checked: none of the
messages appear in the production showcase bundle. All
additive — no default or behaviour changes.

### Added

- **`<ng-template strctModalContent>` — a lazily rendered modal body.** Plain
  projected content is created by the parent along with the parent's own
  view, so a closed modal still instantiated everything inside it (four
  datagrids in one consumer dialog pushed unrelated specs past their render
  budget). Content in this template is built only while the modal is open and
  destroyed on close.
- **`let-row="row"` works in `strctCell` and `strctRowDetail` templates.**
  The row was only the implicit value, so the named spelling bound
  `undefined` without an error — and because `value` and `column` _are_
  named, it looked right. The context now carries `row` as well. The
  consumer that reported this hit it twice, months apart.
- **Dev-mode diagnostics:**
  - `strct-datagrid`: `rowId` resolving to the same value for several rows
    (they behave as one); `rowId` not resolving for some rows (they fall
    back to object identity, so their selection won't survive a refresh);
    `initialSelection` matching no row at all (the pre-selection is
    silently empty — skipped in lazy mode, where ids may be on other pages).
  - `strct-modal`: `size` set alongside `chromeless`, where it has no
    effect.
  - `strct-wizard`: `title` set on the horizontal layout, which has no
    title band — the usual cause is a test that omits the app's
    `provideStrctWizardDefaults({ vertical: true })`; and
    `--strct-wiz-content-min` set on the wizard inside a chromeless dialog,
    where the dialog cannot see it.

  Crawled all 115 showcase routes on a development build: no false positives.
  The one warning that fired was correct — the showcase's own wizard-dialog
  demo passed `size="xl"` to a chromeless modal. That demo is fixed.

### Fixed

- **Showcase: three icons rendered empty.** The route crawl surfaced the existing
  `strct-icon` warning for names that do not exist: `options` (the VM
  settings "General" section, now `settings`), `display` (the "DVD Drive"
  option, now `opticalDisc`) and `database` (storage and pools nav items,
  now `storage`). A development-build crawl of all 115 routes is now free of
  warnings.
- **Docs:** the chromeless modal description still said the dialog is
  `fit-content` and that `size` caps it; neither has been true since 4.0.
  It now documents the real width lever and where to set it.
- **4.0.0 migration note** showed `--strct-wiz-content-min` on
  `strct-wizard`. Measured in Chrome, that leaves a chromeless dialog at the
  new width; it has to be set on the `strct-modal` or an ancestor.

## [4.0.0] - 2026-09-18

The vertical wizard's content area is 80% wider. A visual change to a
default, so a major per the versioning policy. No API changed.

### Changed — BREAKING (visual)

- **`strct-wizard` content column: 480px → 864px.** The default of
  `--strct-wiz-content-min` rises 80%. A chromeless wizard dialog now
  measures 1098px (1378px with the summary aside) instead of 714px (994px),
  and the form keeps the same width whether or not the aside is shown.
- **Layout breakpoints follow the new geometry.** The aside yields below a
  1376px container (was 980px), and below 1096px the content column now
  shrinks instead of holding its minimum. It used to hold it and overflow the
  card, where `overflow: hidden` clipped the form (a 700–712px sliver in
  3.x, which the wider default would have widened to 700–1096px). The rail
  still compacts only below 700px.
- **`strct-modal chromeless` is capped only by the viewport**, not by its
  `size` class. Its width is derived from the wizard's geometry, and the
  `size="xl"` cap (1080px) would otherwise have squeezed the new 1098px
  dialog.

Measured in Chrome across 600–1920px viewports: 864px content wherever it
fits, graceful narrowing below, and no clipping at any width.

### Migration

To keep the 3.x width, set the token back — **on the `strct-modal` (or an
ancestor), not on the `strct-wizard`**. A chromeless dialog reads the
variable on itself; set on the wizard inside, it never reaches the dialog.
(This note originally showed `strct-wizard` as the selector, which does not
work for the dialog case — corrected in 4.1.0.)

```css
strct-modal,
strct-wizard {
  --strct-wiz-content-min: 480px;
}
```

Container-query conditions cannot read custom properties, so the breakpoints
stay tuned to 864px. With the override, the aside hides below a 1376px
container rather than 980px. The form is never clipped either way.

## [3.1.1] - 2026-09-18

### Fixed

- **`strct-datagrid` merged rows whose `rowId` field was missing.** When
  `rowId` named a field a row did not have (or a `rowId` function returned
  null/undefined), every such row resolved to the same `undefined` identity.
  Ticking one row's checkbox checked them all, lit up select-all, and
  `selectionChange` emitted every unkeyed row. Row identity now falls back to
  the row object — the same identity used when no `rowId` is given — so rows
  can never merge. `0` and `''` remain valid ids.

  The same identity drives more than selection, so the fix also closes:
  expanding one row's detail expanded its siblings; double-clicking a cell
  opened an inline editor in every sibling; and `detailPane` never opened for
  an unkeyed row at all, since a null identity reads as "nothing open".
  Reported by HyperStruct; its `_key` workaround keeps working but is no
  longer needed.

## [3.1.0] - 2026-08-28

### Added

- **`strct-datagrid` — Shift-click range selection.** Shift-clicking a row
  checkbox applies that box's new state to every row between it and the
  last one toggled on its own: Shift-click selects a block, and
  Shift-clicking an already-checked box clears one. The anchor stays where
  it was set, so successive Shift-clicks re-project the range from the same
  origin rather than walking it along.

  Purely additive — an unmodified click is still a plain toggle, and
  `toggleRow()` called programmatically is unaffected. The range spans the
  rows the user can actually see (the current page, or every row under the
  expanded groups), and degrades to a plain toggle if the anchor has since
  been paged or filtered away.

## [3.0.0] - 2026-08-28

Angular 22 adoption. No component API changed — the public surface is
byte-for-byte the same as 2.0.1. The major is the peer-dependency bump
alone, per the versioning policy ("majors are reserved for Angular major
adoptions").

### Changed — BREAKING

- **Angular 22 is now required.** `peerDependencies` moved from
  `^21.2.0` to `^22.0.0` for `@angular/common`, `core`, `forms`,
  `platform-browser` and `router`. The package is compiled in partial mode
  by ng-packagr 22, so an Angular 21 application cannot link it — consumers
  must update to Angular 22 first (`ng update @angular/core@22
@angular/cli@22`).
- **Node ^22.22.3 / ^24.15.0 / >=26 is now required** to build the
  workspace, per Angular 22's own engine range. Declared in `engines` and
  pinned in CI.

### Fixed

- **`strct-menubar` submenu** — dropped a redundant `?? []` in the
  submenu `@for`; Angular 22's sharper template narrowing proves
  `item.children` non-null inside the guarding `@if` (NG8102).

### Internal

- TypeScript 5.9 → 6.0, ng-packagr 21 → 22, angular-eslint 21 → 22.
- Angular's OnPush-by-default migration marked 41 spec host components
  across 38 files `ChangeDetectionStrategy.Eager` to preserve their pre-v22
  behavior. Only library _test hosts_ were affected — all 112 shipped
  components already declared `OnPush` explicitly, so the new default is a
  no-op for consumers.
- `npm test` now runs both projects (`strct` and `showcase`). It previously
  resolved to a single project and ran only the showcase's 2 tests, leaving
  the library's 783 tests out of CI and out of the pre-publish gate.

## [2.0.1] - 2026-07-25

### Fixed

- **Typography tokens scoped to arctic/dark** — `--font` and `--mono`
  were declared only inside `[data-palette='arctic'][data-theme='dark']`,
  so every light theme (and the ember/sage palettes) lost the bundled
  typeface and fell back to the browser default on theme switch. Both
  tokens now live in the scheme-independent `:root` block.

## [2.0.0] - 2026-07-25

A full-library UI/UX audit, applied: ~40 functional bugs fixed, a shared
focus-lifecycle helper rolled out to every transient surface, an RTL
sweep, a localization pass, ARIA-semantics corrections, design-token
consolidation — and ten new components.

### Added — new components

- **`strct-number`** — numeric stepper input (± buttons, Arrow/PageUp/Down,
  Home/End, min/max clamp, `role="spinbutton"`). CVA.
- **`strct-status-dot`** — status primitive whose state is never
  color-only (visually-hidden label, per-status defaults).
- **`strct-popover` + `[strctPopoverTrigger]`** — public anchored-overlay
  primitive: `[(open)]`, `placement`, optional focus `trap`, full focus
  lifecycle.
- **`strct-confirm-outlet` + `StrctConfirmService`** — promise-based
  confirmation (`confirm({...}): Promise<boolean>`) on top of the modal;
  initial focus on Cancel.
- **`strct-tree-select`** — hierarchical picker: the existing `strct-tree`
  in an anchored panel, label-path trigger, `clearable`. CVA.
- **`strct-datetime-picker`** — date + time in one control composing the
  datepicker; ISO local `YYYY-MM-DDTHH:mm`, `minuteStep`, calendar
  localization pass-through. CVA.
- **`strct-toolbar` (+ spacer)** — action bar with selection chip and
  `(cleared)` output; APG toolbar arrow roving.
- **`strct-inline-edit`** — click-to-edit text; Enter/blur commit, Escape
  cancel, committed value announced via the announcer. CVA.
- **`strct-notification-center`** — bell + history panel over the toast
  service's new shared history (`StrctToastService.history`,
  `unreadCount`, `markAllRead`, `clearHistory`).
- **`strct-heatmap`** — SVG density grid (`{row, col, value}` cells,
  luminance ramp, `role="img"` summary).
- **`overlay/focus.ts`** (public) — `saveFocusedElement`, `restoreFocus`,
  `focusFirstIn`, `keepTabInside`; **`overlay/scroll-lock.ts`** — the
  refcounted body scroll-lock extracted from the modal.

### Added — capabilities

- Datepicker localization: `monthNames`, `weekdayNames`,
  `weekdayNamesFull`, `weekStart`, `prevMonthLabel`/`nextMonthLabel`.
- `compareWith` on combobox/select/cascade-select (object values).
- Static `disabled` input on every CVA control, OR-merged with
  `setDisabledState` (no more clobbering).
- Tabs `keepAlive`; tree typeahead + `aria-owns`/`setsize`/`posinset`;
  datagrid treegrid row keyboard (arrows + expand/collapse); chart bar
  keyboard access; rating rebuilt as a radiogroup; password manager
  support (`autocomplete` input) + strength-meter live region.
- Localization inputs across file/password/breadcrumb/table/code/tree/
  rail/layout/theme-switcher/chart/toast/validation/metric-tile/pagination.
- Design tokens: `--z-*` ladder and `--backdrop`; all radii/spacing
  consolidated to tokens; arbitrary control width caps removed.

### Fixed — selected bugs

- Hotkeys: `shift+<printable>` combos never matched and shadowed their
  unshifted twins (register `shift+?` for the help overlay now).
- Log-viewer wrap mode broke virtualization (scroll/follow); ANSI
  non-SGR sequences leaked as garbage; `live` opt-out added.
- Drawer Escape was dead code; drawer now has focus trap/restore and
  scroll-lock. Cascade-select nested options were keyboard-unreachable —
  rebuilt on the menu pattern. Legacy context menu rebuilt (keyboard,
  misclick tolerance, real clamping) and deprecated in favor of the menu
  service.
- Datagrid: group-mode select-all under-selected; lazy cross-page
  selection payload/count disagreement; resize listener leak; per-row
  selection labels.
- Modal: one Escape closed every stacked modal. Wizard: focus dropped
  when Next swapped to Finish. Tooltip: leaked into `<body>` on host
  removal, no `role`/Escape/`aria-describedby`. Signpost: double-toggle
  with its own demo markup — trigger directive rewired. Splitter: stuck
  dragging state (zoneless), no touch drag, listener leak. File: same
  file couldn't be re-picked. Checkbox indeterminate had no visual. OTP
  `masked` and six other boolean inputs missed `booleanAttribute`.
- Escape no longer leaks from popups into a hosting modal/drawer
  (combobox, select, datepicker, color-picker, cascade, drawer, tour,
  speed-dial, signpost, datagrid popups, menubar, menus).
- RTL sweep: physical `left/right` converted to logical properties
  across ~25 components; overlay `start`/`end` placements are now
  direction-aware.

### Changed — possibly breaking

- Hero no longer implicitly announces on mount: `role="status"` is now
  opt-in via `live`; critical stays `role="alert"`. The accessible-name
  element is now a real `h2`.
- Alert/toast escalate `critical` to `role="alert"` (assertive).
- Donut legend rows are no longer focusable (they had no action).
- `StrctCascadeNode` (internal implementation detail) removed.
- Checkbox `isDisabled` is now a read-only computed (was a model).
- Width caps removed from password/range/input-mask/chips/file/
  datepicker/cascade-select — controls are full-width like combobox.
- Radii standardized to tokens (7px→`--radius-md`, 9/10px→`--radius-lg`)
  and backdrops unified to `--backdrop` (0.44/0.45→0.5).

## [1.22.0] - 2026-07-25

### Added — combobox: rich options and free-form values

- **`StrctOption.icon`** — a leading icon in the option row (and on the
  chip in `multiple` mode).
- **`StrctOption.description`** — a secondary, muted line under the label
  for pickers where the name alone is not enough.
- **`allowCustomValue`** — while the typed query has no exact label match,
  a `Use "…"` row pinned to the list end (Enter or click) commits the raw
  text as a free-form value; in `multiple` mode it is appended to the
  array and already-picked text is suppressed. The row joins the
  arrow-key order and carries `aria-activedescendant` like any option.
  The verb is localizable via the new `customText` input.
- A committed custom value no longer blanks on close — the raw text is
  echoed when it matches no option label.

## [1.21.0] - 2026-07-25

### Added — combobox expansion

The combobox catches up with the v1.19/1.20 select ergonomics and gains
variants:

- **Select ergonomics parity** — aligned ✓ lead slot on the current
  choice, opening (or clicking the focused input) highlights it, 9px
  option rows, list-padding clicks never blur or discard, Home/End jump.
- **`StrctOption.disabled` honoured** — grayed out, skipped by arrows,
  not committable. **`StrctOption.group`** renders group headers.
- **Match emphasis** — the typed query is bolded inside each label.
- **`clearable`** — an × resets the selection (null, or [] when
  multiple).
- **`multiple`** — the value becomes an array: picks render as
  removable chips in the control, the list stays open while picking,
  Backspace on an empty query removes the last chip;
  `aria-multiselectable` listbox semantics.
- Localizable `emptyText`, `clearLabel`, `removeLabel` inputs.

Defaults reproduce the previous single-select behaviour.

## [1.20.0] - 2026-07-25

### Added — `strct-select`: a real select component

"Select" used to mean a strctInput-styled native `<select>` — the option
popup was OS-drawn and matched neither the theme nor the v1.19 select
ergonomics. The native form stays supported; `strct-select` is the new
default recommendation:

- **APG select-only combobox** — a real button trigger wearing the
  shared `.strct-control` skin opens a token-styled listbox
  (overlay-positioned, width-matched to the trigger).
- **v1.19 select ergonomics carried over** — leading ✓ in an aligned
  lead slot on the current choice, reopening highlights it, clicks on
  list padding never discard the interaction, 9px option rows.
- **Full keyboard parity with the native select** — ArrowDown/Up and
  Enter/Space open, arrows move (skipping disabled options, wrapping),
  Home/End jump, **typeahead** (typed prefix jumps to the matching
  label; repeating a letter cycles its matches), Enter/Space commit,
  Escape/Tab close without committing; aria-activedescendant keeps
  focus on the trigger.
- **CVA-compatible** (ngModel / reactive forms) and wired for
  `strct-field` via the `strctField` marker — label `for`,
  `aria-describedby` and `aria-invalid` link automatically.
- `StrctOption` gained an optional `disabled` flag (grayed out, skipped
  by keyboard navigation) — additive for the combobox.
- Localizable `placeholder`, `listLabel`, `emptyText` inputs.

## [1.19.0] - 2026-07-25

### Added — dropdown select ergonomics

Driven by a hands-on behavioral analysis ("changing a selection after
reopening is hard"): the difficulty was a compound of near-miss clicks
silently discarding the menu, no visible current choice, and a dead
keyboard path. All four fixed:

- **A click closes the menu ONLY on a real item activation** — menu
  padding and divider clicks keep it open, so a 2px miss no longer throws
  the whole interaction away. (Menu-mode panels should project
  `strct-dropdown-item`s; arbitrary content belongs in `popover` mode.)
- **`strct-dropdown-item [selected]`** — bind it for select-like menus:
  the item becomes a `menuitemradio` with `aria-checked`, a leading ✓ in
  an aligned lead slot marks the current choice, and reopening focuses it.
- **Full APG menu keyboarding** — ArrowDown on the trigger opens with
  focus inside; arrows rove (skipping disabled, wrapping), Home/End jump,
  Enter/Space activate, Tab closes; Escape and selection restore focus to
  the trigger.
- **Bigger hit targets** — item rows 7→9px vertical padding (~31px).

## [1.18.1] - 2026-07-24

### Fixed

- **FR-18-01 — the header band reads as one line across both columns**: the
  rail's progress line and the content header's divider used to sit ~33px
  apart (and the gap was content-dependent — a step with a description
  shifted it further). The rail title band and the content header now share
  one height (**`--strct-wiz-header-h`**, default 64px) with the progress
  line bottom-aligned inside it, so both hairlines land on the SAME
  baseline whether the step has a description or not. A long lede truncates
  with an ellipsis rather than growing the band out of alignment; the
  compact narrow rail is unaffected.

## [1.18.0] - 2026-07-24

### Added — content header names the active step (vertical wizard)

- The content pane now opens with the active step's `label` as a heading
  and its `description` as the lede — the piece of the approved design the
  vertical mode was still missing, and in the compact narrow rail the only
  visible step name. Follows Back/Next/rail navigation. On by default for
  vertical mode; `[contentHeader]="false"` opts out. Horizontal mode is
  untouched.

## [1.17.0] - 2026-07-24

### Added — aside never squeezes the form (FR-17-03)

- **`--strct-wiz-content-min` token** (default `480px`) — the vertical
  wizard's content column now has a guaranteed minimum width the aside can
  never encroach on.
- **Chromeless dialogs size to the wizard's geometry** — width derives from
  rail + content-min (+ aside) explicitly (an inline-size container cannot
  size its own host intrinsically), so adding a summary aside GROWS the
  dialog by exactly the aside width while the step form keeps the identical
  width. `strct-modal size` only caps; when the cap bites, the wizard's
  container queries degrade gracefully (aside yields, rail compacts).
- Container-query thresholds gained tolerance for the host's borders
  (aside yields ≤980px of component width, rail compacts ≤700px).
- Acceptance held in-browser: content column 480px with AND without the
  aside; dialog width differs by exactly 280px.

## [1.16.0] - 2026-07-24

### Fixed

- **BUG-17-00 — empty aside broke every aside-less vertical wizard**: the
  `<aside>` rendered unconditionally while the grid only reserved two
  columns, so the empty element wrapped onto an implicit row and took a
  share of the height — the footer floated mid-dialog with dead space
  below. The aside now renders only when `strctWizardAside` content is
  projected (also removing a stray landmark), and its CSS reveal is scoped
  to the `--aside` modifier.

### Added — wizard as the dialog surface (FR-17-01/02)

- **`strct-wizard` aside padding** — the aside ships a default inset
  (`20px 18px`, same family as the rail) instead of every consumer
  re-padding a slot the component otherwise fully styles.
- **`strct-wizard flush`** — the wizard IS the surface: drops the vertical
  card (border/radius/background) and fills its host.
- **`strct-modal chromeless`** — wizard-hosting mode: no head, no body
  padding, no footer; `title` still names the dialog via `aria-label`.
  The natural composition is now first-class:
  `<strct-modal chromeless><strct-wizard vertical flush cancelable …>` —
  the rail reaches the dialog edges and the wizard's footer is the dialog
  footer. Keep `cancelable`: the head's X is gone.
- Docs carry the gotcha the FR hit: size the wizard host with width/height
  only — overriding its `display` silently breaks the grid layout.

## [1.15.0] - 2026-07-22

### Added

- **`provideStrctWizardDefaults({ vertical: true })`** — flip the wizard's
  default app-wide, for the house rule "steps are always vertical". A bound
  `[vertical]` on an instance still wins (so `[vertical]="false"` remains
  the explicit opt-out), and without the provider the default stays
  horizontal — the semver contract holds.

## [1.14.0] - 2026-07-22

### Added — vertical wizard

- **`strct-wizard vertical`** — steps become a left rail, per the approved
  design: dashed-ring states (idle ⊙ / active ●⊙ / done ✓ in success green),
  a rail `title`, a progress bar with an "n/N completed" counter (furthest
  step reached, remembered across back-navigation), per-step `description`
  sublabels revealed on the active step, and click-back navigation to
  visited steps (`goTo(index)` public; forward moves still gate through
  Next / `canAdvance`).
- **`strctWizardAside`** — an optional right column beside the vertical
  wizard for live summaries / impact meters; hides first as the component
  narrows.
- **Never flips horizontal** — container queries collapse the rail to a
  56px compact vertical ring column (with connector line) under ~720px of
  component width; the aside yields at ~800px.
- Localizable strings completed: `cancelLabel`, `submittingLabel`,
  `progressLabel`, `stepsLabel` (Cancel / "Submitting…" were hard-coded).
- The horizontal default is visually and behaviorally untouched.

## [1.13.0] - 2026-07-22

### Added — consumer-reported gaps (FR-16-04…07)

- **`strct-datagrid` `quickFilterAlign`** — the built-in quick-filter box
  now sits at the toolbar's END by default (action verbs lead on the left,
  view controls right — the vCenter/Grafana/GitHub convention, and a stable
  position across grids whose button sets differ). `'start'` restores the
  old order.
- **`strct-input-otp` `autofocus` + `focus(index = 0)`** — focus box 0
  declaratively when the second-factor step appears, and refocus
  programmatically after a rejected code — no more DOM-reach workarounds.
- **`strct-input-otp` `groupSize`** — a separator every N boxes
  (`groupSize=3` ⇒ `nnn – nnn`), mirroring how authenticator apps display
  the code. Separators are `aria-hidden`; keyboarding is untouched.
- **Loading skeletons read as loading** — the opacity pulse on `--bg-3` was
  near-invisible on dark themes ("I see 5–6 EMPTY rows while it loads").
  `strct-datagrid`, `strct-table` and `strct-skeleton` now share one moving
  sweep with a `--skeleton-hi` highlight token (default `--acc18`);
  `prefers-reduced-motion` gets a static highlight bar instead. No API
  change.

### Docs

- `docs/feature-requests/` gained an `archive/` (13 fully-shipped FR
  documents moved in) and a status ledger README mapping every FR to the
  release that shipped it.

## [1.12.0] - 2026-07-22

### Added — consumer-reported gaps (FR-16-01 + singleLine reveal)

- **`strct-icon` `strictName`** — the compile-time opt-in the icon note asked
  for: typed as the bare `StrctIconName` union, so a mistyped built-in name
  (`strictName="sheildCheck"`) fails the BUILD under strict templates. Wins
  over `name` when both are set; `name` (now optional, unchanged behavior)
  stays the escape hatch for runtime-registered custom icons.
- **`strct-datagrid` singleLine truncation reveal** — hovering (or keyboard-
  focusing into) a cell whose content is actually clipped reveals the full
  text as a native `title`. Hover-lazy: one delegated tbody listener, zero
  render cost, so virtual grids pay nothing for unhovered cells. Covers
  plain and `strctCell`-templated cells alike via `textContent`, clears the
  title again after a column resize, and cells that fit get none.
  `singleLine` off ⇒ behavior completely unchanged.

## [1.11.0] - 2026-07-22

### Added — consumer-reported gaps (FR-16-02 / FR-16-03)

- **`strct-datagrid` global quick filter** — the console-standard "filter
  this list fast" box, owned by the grid: two-way `quickFilter` OR-substring-
  matches one term across every column (`quickFilterFields` restricts the
  scan — skip opaque ids), ANDs with the per-column `filters`, resets paging
  and rides on `(lazyLoad)` in server mode. Opt-in `quickFilterable` renders
  the built-in toolbar searchbox with a "filtered / total" count, and the
  grid-owned term keeps selection/expansion identity across keystrokes —
  the three things the feed-it-filtered-rows stopgap could not do. Works in
  tree mode too (matches keep their ancestors, force-expanded).
- **`strct-time-range` `size`** — `'sm' | 'md'` (default `'md'`) forwarded
  to the trigger button, so the picker lines up inside `size="sm"` toolbars
  next to Live / Refresh buttons.

## [1.10.2] - 2026-07-22

### Fixed

- **`strct-dropdown` popover-attribute collision** — the static `popover`
  attribute collides with the native HTML Popover API, so the UA styled the
  host (Canvas background, medium border): the white frame around
  `strct-time-range`'s trigger in dark themes. The component now strips the
  DOM attribute after Angular reads the input — same API, no UA styling.
- **`strct-split-button` segment misalignment** — the chevron lives inside
  the dropdown's trigger wrapper and didn't stretch, rendering 4px shorter
  than the main segment (stepped, broken join). Both wrapper layers now
  stretch; segments join seamlessly in outline and solid looks.

### Added

- **`rocket` glyph** (deploy/launch — 181 icons). The split-button demo
  referenced it before it existed; the icon set's own dev warning flagged it.

## [1.10.1] - 2026-07-22

### Fixed

- **Native widgets now follow the theme** — the token layer declares
  `color-scheme: dark/light` on `[data-theme]`, so datetime/date fields,
  their popup calendars, select dropdowns, scrollbars and autofill render in
  the theme's scheme. Previously the page darkened via CSS while Chromium
  kept painting native UI in the light system scheme — the white fields the
  time-range picker showed in dark mode. `strct-time-range`'s inputs now
  inherit the root scheme instead of a local `light dark`.

## [1.10.0] - 2026-07-21

### Added — platform DX (Material / Blueprint infrastructure)

- **`StrctAnnouncer`** — screen-reader live announcements as a root service
  (Material's LiveAnnouncer pattern): hidden polite/assertive regions,
  clear-then-set so identical messages re-announce, 10s stale wipe.
- **`StrctHotkeysService` + `<strct-hotkeys-help/>`** — centrally registered
  application hotkeys (Blueprint pattern): `mod+k`-style combos (mod =
  Ctrl/⌘), plain keys suppressed while typing, dispose-function
  unregistration — plus the `?` cheatsheet overlay listing everything,
  grouped. The docs site dogfoods it (`?` anywhere).
- **`[strctReorder]` / `[strctReorderItem]`** — list drag-reorder primitive:
  HTML5 drag plus Alt+↑/↓ keyboard moves; emits `(reordered) { from, to }`
  and never touches the consumer's array; styling hooks via
  `--dragging`/`--over` classes.

The theme playground (palette generator + CSS token export) requested with
this package already shipped earlier — see /theme-playground on the docs
site.

## [1.9.0] - 2026-07-21

### Added — component tour (Ant / Carbon / Fluent / Blueprint gaps)

Six new components; the set is now 79:

- **`strct-splitter`** — two resizable panes with a draggable gutter
  (`strctPaneStart` / `strctPaneEnd`, two-way `split` %, `min`/`max` clamps,
  `vertical`); the gutter is a keyboard `role="separator"` with
  aria-valuenow/min/max, arrow nudge and Home/End.
- **`strct-transfer`** — dual-list picklist ("assign hosts to the cluster"):
  checkbox multi-select, per-side searchboxes, move buttons, two-way
  `assigned` id set, `(moved)` events.
- **`strct-split-button`** — main action + chevron of variants
  (`StrctMenuItem[]` with icons/dividers/critical); `(action)` / `(picked)`;
  outline and `solid` looks.
- **`strct-menubar`** — the "VM · Host · Cluster" application-menu strip:
  APG menubar keyboarding (roving tabindex, Left/Right switch the open
  menu), labeled `role="menu"` panels, `(picked)` with `{ menu, item }`.
- **`strct-tour`** — coach marks over live UI: CSS-selector targets get an
  accent spotlight ring + anchored dialog card (viewport-aware placement,
  `target: null` centers), Escape/skip vs. `finished` semantics.
- **`strct-watermark`** — pointer-transparent repeating diagonal text
  overlay for compliance consoles; XML-escaped, aria-hidden, content stays
  interactive.

Also: `strct-segmented` (already shipped) and `strct-metric-tile`'s
delta/trend covered the "content switcher" and "statistic" items of this
package — no duplicates added.

## [1.8.0] - 2026-07-21

### Added — Datagrid Pro

The Clarity / MUI X-tier grid features, additively:

- **Per-column filters** — `columns[].filterable` opens a contains-text
  popover in the header; `columns[].filterOptions` renders a checkbox value
  set instead. Filters AND together, are two-way via `[(filters)]`
  (`StrctDatagridFilters`), reset paging, and in `lazy` mode ride on the
  `(lazyLoad)` state instead of filtering client-side.
- **Tree grid** — `childrenKey` renders hierarchical rows (the vCenter
  inventory shape): indentation + carets, per-sibling-level sorting,
  `role="treegrid"` with `aria-level` / `aria-expanded`; an active filter
  shows matches with their ancestors, force-expanded. Works with paging and
  virtual mode over the flattened visible set.
- **Inline cell editing** — `columns[].editable` opens an input on
  double-click; Enter / blur commit via `(cellEdit)` `{ row, column, value,
previous }`, Escape cancels, unchanged commits don't emit. The grid never
  mutates rows — the consumer's store stays the single source of truth.

### Fixed

- Tree rows announce correctly: `aria-expanded`/`aria-level` are emitted
  under a `treegrid` role, not on plain table rows (axe
  `aria-conditional-attr`).

## [1.7.0] - 2026-07-21

### Added — the ops suite (monitoring-console trio + units)

Grafana / Blueprint-inspired components no general-purpose library ships
together, under a new **Ops** docs category:

- **`strct-time-range`** — the "Last 1 hour ▾" control charts hang off:
  Grafana-conventional quick ranges (15m…30d, customizable via `presets`)
  plus an absolute from/to editor, in one dialog popover (dogfoods
  `strct-dropdown`'s popover mode). Two-way `range`, `applied` output,
  `presetId` stamping and a `refresh()` method to re-resolve "last X"
  against now from your auto-refresh tick.
- **`strct-log-viewer`** — a virtualized log tail (`kubectl logs -f` as a
  component): only the visible window is in the DOM (5k lines ⇒ ~24 rows),
  two-way `follow` that sticks to the tail, pauses on scroll-up and resumes
  at the bottom, ANSI SGR colors (16-color + bold) parsed into safe spans
  mapped onto theme tokens, severity tinting from `StrctLogLine.level` or
  auto-detected ERROR/WARN tokens, and a wrap toggle. `role="log"`,
  keyboard-focusable scroll region.
- **`strct-diff`** — LCS line diff for change-approval screens: unified or
  side-by-side `split`, +/− symbol marking (never color alone), add/del
  counts, collapsible unchanged runs with expanders, copy-new-version
  button. `strctComputeDiff()` exported for programmatic "anything
  changed?" gating.
- **Unit formatting** — `strctFormatBytes` (binary KiB default / decimal
  opt-in), `strctFormatRate` (bit/s), `strctFormatDuration` ("2h 14m"),
  `strctFormatSi` ("12.4k IOPS") plus the matching `strctBytes` /
  `strctRate` / `strctDuration` / `strctSi` pipes.

### Fixed

- **`strct-dropdown` nested-interactive violation** (axe serious): the
  trigger wrapper was a `role="button"` around the consumer's real button.
  The wrapper is now inert; the new `StrctDropdownTrigger` directive
  (same `strctDropdownTrigger` attribute — import it to activate) carries
  `aria-haspopup` / `aria-expanded` on the actual trigger element.

## [1.6.0] - 2026-07-21

App-integration gaps found by a consumer adopting 1.5.0 (FR-15), plus icon-set
hardening.

### Added

- **`strct-dropdown` popover mode** (FR-15-01) — `popover` turns the panel
  into a home for form controls: inner clicks / Enter / Space no longer close
  it (only outside click and Escape do), and semantics switch from
  `role="menu"` to a labeled `role="dialog"` (`popoverLabel`, default
  "Filters"). The trigger now exposes `aria-haspopup` (menu/dialog) +
  `aria-expanded` in both modes. Filter/settings panels no longer need to
  hand-roll `strctOverlay`.
- **`strct-command-palette` server-backed search** (FR-15-02) — `query` is
  now a two-way `model<string>` (still resets on open), and `[filter]="false"`
  opts out of internal ranking: items render in the order given, for
  RBAC-filtered / API-served corpora. `maxResults` still caps rendering, not
  selection. Bonus: `loading` + `loadingText` render a spinner "Searching…"
  row while results are in flight, and the active option is clamped when async
  results shrink under the cursor.
- **`strct-code` `wrap`** (FR-15-03) — soft-wraps long unbroken text
  (PEM/CSR blocks, base64 thumbprints, one-liner commands) via
  `white-space: pre-wrap; overflow-wrap: anywhere`, so dialogs never scroll
  horizontally. `wrap` takes precedence over `lineNumbers` (wrapping would
  break the gutter's line alignment).
- **`StrctIconName` union + `STRCT_ICON_NAMES`** — every built-in icon name
  as a compile-time union type and a greppable sorted array; `STRCT_ICON_GROUPS`
  is now typed against the union, and the `strct-icon` `name` input
  autocompletes built-ins while still accepting runtime-registered names.
- **`shieldCheck` glyph** — the "protection on" state (2FA enabled, verified),
  sharing the `shield` silhouette; icon set is now 180 glyphs.
- **Dev-mode unknown-icon warning** — `strct-icon` warns once per unknown
  name (an invented name used to fail silently as an empty box).

## [1.5.0] - 2026-07-21

### Added — console patterns quartet

Four proven showcase/consumer patterns extracted into components:

- **`strct-copy`** — click-to-copy chip with ✓ "Copied" feedback (polite
  live-region announcement); for UUIDs, IPs, serials.
- **`strct-code`** — copyable mono code / rendered-config block: title +
  language tag + copy header, optional uncopyable line-number gutter,
  `maxHeight` scroll region, `collapsible` fold — the `<details><pre>`
  pattern, componentized.
- **`strct-page-header`** — breadcrumb slot + h1 title/subtitle + end-aligned
  actions + projected meta strip; the docs pages now run on it (dogfood).
- **`strct-filter-bar`** — `strct-searchbox` + removable filter chips +
  clear-all + live result count; presentation-only, intent via outputs.

## [1.4.0] - 2026-07-20

### Added — `strct-searchbox`

The docs-header search pattern as a component: a compact pill with a leading
search icon, a label / input and an optional keyboard-hint chip.

- **Input mode** (default): a real search field — two-way `value` (CVA-
  compatible), Enter emits `(search)`, Escape / the labeled × clears, the
  hint chip hides while typing. `role="searchbox"`, fully labeled.
- **`trigger` mode**: a button that only emits `(activated)` — the classic
  "search pill that opens the command palette" header pattern; show the
  palette hotkey via `hint="⌘K"`.
- Public `focus()` / `clear()` methods; localizable labels.
- Dogfooded: the docs site's own header search now runs on it.

## [1.3.0] - 2026-07-19

### Added — categorical chart palette `--chart-1..8` (FR-CHART-15)

- **Theme tokens** `--chart-1..8` in every palette × mode: a categorical data
  palette with a **fixed, colorblind-validated slot order per palette** (the
  CVD-safety mechanism). Slot 1 tracks the theme's accent hue at data-grade
  chroma, so a primary series feels on-theme without the muted UI `--acc`.
  Every set was run through the dataviz palette validator against its `--bg-0`
  surface — results and design rules in `docs/chart-palette.md`.
- **`StrctChartSeries.color`** — accepts a semantic status _or_ a categorical
  slot `'chart-1'..'chart-8'` (new `StrctChartColor` / `StrctChartSlot`
  types). Semantic statuses stay reserved for health; existing callers are
  untouched.

## [1.2.1] - 2026-07-19

### Fixed — `strct-chart` tooltip edge clamp (FR-CHART-14)

The hover tooltip now **edge-flips** instead of centering blindly: near the
left edge it left-aligns, near the right edge it right-aligns (single, multi
and gap tips alike), so the **first and last point's values are never
clipped** by an `overflow: hidden` ancestor (cards, scroll panes). The
crosshair stays on the true point-X — only the balloon shifts; mid-chart
hovers are unchanged. The y-axis value chip is likewise clamped into the
plot box.

## [1.2.0] - 2026-07-17

### Added — `strct-chart` advanced axes & composition (all additive)

- **`stacked`** — multi-series values stack cumulatively: each series draws
  at the running total and fills a solid layer band down to the series below;
  tooltips keep the original per-series values; nulls break the stack.
- **`times`** — per-point timestamps (`number | Date`): x positions map to
  real time, so uneven sampling renders honestly; hover snaps to the nearest
  point by pixel distance; labels/annotations/zoom all follow.
- **`scale="log"`** — logarithmic y-axis with equal decade spacing and decade
  ticks; the floor is the smallest positive visible value (or an explicit
  positive `min`).

## [1.1.0] - 2026-07-17

### Added — `strct-datagrid` power features (all additive)

- **Column drag-reorder** — `reorderable`: drag headers to rearrange data
  columns; the order persists through `columnState` / `stateKey` (new
  `order` field on `StrctDatagridColumnState`).
- **Row grouping** — `groupBy`: a collapsible header row per distinct value
  with a count chip; the current sort applies within groups. Paging is
  bypassed while grouped; not combinable with `virtual`.
- **Excel export** — `toXLSX()` / `downloadXLSX(filename)`: a real `.xlsx`
  workbook built with an in-house, **dependency-free** SpreadsheetML + ZIP
  writer (stored entries, correct CRC32). Numeric cells stay numeric; opens
  in Excel, LibreOffice and Google Sheets.

## [1.0.0] - 2026-07-17

**UIStruct is stable.** Every 1.0 criterion in [ROADMAP.md](ROADMAP.md) is
met: RTL/i18n audit (with fixes), strict APG datepicker grid, a visual
regression gate in CI, a full API review (327 signal members — the surface
freezes as-is, taxonomy in [docs/api-review.md](docs/api-review.md)), and
published reproducible benchmarks. From here on the
[semver contract](ROADMAP.md#after-10--semver-contract) applies: patches fix,
minors add, majors migrate — deprecations live for at least one minor first.

### Infrastructure — visual regression gate

- New `visual-regression` CI job: `scripts/visual-regression.mjs` screenshots
  key routes (dark + light) in headless Chrome and compares them against
  committed baselines (`tests/visual/baseline/`), failing on >0.5% pixel
  drift; diff images upload as artifacts. Animations/transitions are frozen
  and the showcase now **self-hosts DM Sans / JetBrains Mono** (fontsource),
  making rendering deterministic across machines — and giving every visitor
  the intended typography instead of a system-font fallback.

### Changed — 1.0 hardening

- **`strct-datagrid` sticky columns are RTL-correct** — frozen-column offsets
  use logical `inset-inline-start`, so they pin to the reading start under
  `dir="rtl"`; the edge shadow mirrors.
- **`strct-datepicker` implements the strict APG date-grid pattern** — real
  ARIA grid semantics (`grid` / `row` / `columnheader` / labeled `gridcell`s),
  roving focus on the day cells, `Home`/`End` (week edges),
  `Shift+PageUp/PageDown` (year), `aria-selected` / `aria-current="date"`,
  and focus returns to the input on close.

## [0.31.1] - 2026-07-17

### Fixed — RTL audit outcomes

Full `dir="rtl"` audit (static sweep + rendered verification — see
`docs/rtl-audit.md`). Text/spacing/borders were already fully logical; these
directional behaviors are now correct in RTL too:

- **`strct-toggle`** — the thumb travels toward inline-end
  (`:host-context([dir='rtl'])` — the component uses emulated encapsulation).
- **`strct-drawer`** — `start`/`end` anchor with logical insets; the slide-in
  animation mirrors.
- **`strct-nav`** — the mobile off-canvas panel anchors inline-start and
  slides from the correct edge.
- **Icon badges & rail dots** — anchored with `inset-inline-end`.
- **Datagrid** — column-resize grip and chooser alignment use logical insets.

Known caveat (tracked in ROADMAP): datagrid sticky-column offsets remain
physical-left; keep wide frozen grids in an LTR container for now.

## [0.31.0] - 2026-07-17

### Added — `strct-datagrid` enterprise pack (all additive)

- **Virtual scrolling** — `virtual` + `viewportHeight` + `rowHeight`: only the
  viewport rows (plus a small overscan) are in the DOM, with a sticky header —
  20k+ rows scroll smoothly. Assumes uniform row height; not combinable with
  `expandable`.
- **Server-side data** — `lazy` + `total` + `(lazyLoad)`: the grid never sorts
  or slices `rows` itself; it emits `{ page, pageSize, sortKey, sortDir }` on
  init and whenever the user pages or sorts, and shows rows as given. `total`
  drives the pager and footer count.
- **Sticky (frozen) columns** — `StrctDatagridColumn.sticky` pins leading
  columns (utility columns freeze automatically alongside) with exact
  cumulative offsets, opaque grounds and an edge shadow on the last frozen
  column. Give sticky columns an explicit px `width`.
- **Column state persistence** — two-way `columnState` (widths from resize +
  hidden from the chooser) and `stateKey` for built-in localStorage
  persistence (`strct-dg:<key>`), restored before first render.
- **CSV export** — public `toCSV()` / `downloadCSV(filename)` with proper
  quoting: header labels + every non-hidden column, all rows in the current
  order (full sorted set in client mode, as-given in lazy mode).

## [0.30.0] - 2026-07-17

### Added — navigation gaps (FR-NAV-01 / FR-NAV-02, all additive)

**`strct-rail`** (`StrctRailItem`):

- **`placement: 'bottom'`** — pins an item to the foot of the rail under a
  divider (vCenter-style Administration), in declaration order. The top group
  scrolls; the bottom group stays put.
- **`routerLink` / `href`** — the item renders as a real `<a>`: middle-click,
  ⌘/Ctrl-click and "open in new tab" work like a real link; `(select)` still
  fires on plain activation, and modified clicks never touch `activeId`. With
  `routerLink`, the router's own active state drives highlighting when no
  explicit `activeId` is provided (explicit wins).
- **`dot` + `dotStatus`, `trailingIcon`** — the same trailing vocabulary as the
  section menu (below), so the two nav objects stay consistent.

**`strct-section-menu`** (`StrctMenuLink`):

- **`badge` + `badgeStatus`** — trailing count/label chip (e.g. deviations).
- **`dot` + `dotStatus`** — small trailing status dot ("unsaved changes").
- **`trailingIcon`** — muted trailing glyph ("restart required"), rendered
  after the label and before any badge / dot.

Both share the `StrctRailStatus` tone union — no new status vocabulary. Items
without the new fields render identically to 0.29.0.

### Changed

- `@angular/router` is now a peer dependency (used by `strct-rail` link items).

## [0.29.0] - 2026-07-16

### Added — `strct-chart` monitoring suite (FR-CHART-08..13, all additive)

- **Data gaps** — `data` / `series.data` accept `(number | null)[]`; a `null`
  (or `NaN`) breaks the line into disjoint segments, so an outage never reads
  as a flat line. The gap keeps its x-slot; hovering it says `gapText`
  ("no data"); area fills drop to the baseline at gap edges.
- **Synced crosshairs** — new `(hoverIndex)` output + `[activeIndex]` input:
  wire one chart's hover into a sibling's crosshair for a vCenter-style
  multi-chart dashboard. A local pointer always wins.
- **Annotations** — `annotations: { index; label?; status?; dashed? }[]` draws
  vertical event markers ("alarm raised", "reboot") behind the data; the label
  joins the tooltip at that index.
- **Min–max band** — per-series `lower` / `upper` bounds fill a soft envelope
  behind the avg line, so downsampled spikes stay visible; the tooltip shows
  `avg (min–max)`.
- **Brush + zoom** — `brush` drag-selects a range and emits
  `(brushChange) [start, end]`; `zoom` **zooms the chart into the selection**
  (y rescales to the visible window) with a ⟲ reset chip — double-click or
  Escape zooms back out, emitting `null`.
- **Export** — public `toSVG()` / `toPNG(scale)` methods return the rendered
  chart with theme colors resolved, background and axis text baked in.

All defaults reproduce the previous behavior exactly; keyboard access extends
to the new surface (Escape unwinds brush → zoom → crosshair).

## [0.28.0] - 2026-07-16

### Added — `running` icon badge (vCenter lifecycle language)

Lifecycle states now speak vCenter's media-transport language, as glyphs
inside the badge disc: **green disc ▶ `running`** (new) · **amber disc ⏸
`paused`** · **grey disc ■ `off`**. Health states keep their silhouette
coding (circle ✓ / triangle ! / diamond × / circle i / wrench). `success`
now reads as _healthy_; use `running` for power state.

### Changed

- `paused` badge: grey → amber disc (lifecycle family).
- `off` badge: square – → neutral grey disc with a stop square ■.

## [0.27.0] - 2026-07-16

### Changed — icon badges: silhouette coding (CVD-safe at any size)

Badge states now differ by **outline silhouette**, not just hue + inner glyph,
so they stay distinguishable for color-blind users even at 16px where the
inner glyph is too small to read: circle ✓ success · triangle ! warning ·
**diamond × critical** (new shape) · **square – off** (new shape) ·
circle i info · wrench maintenance.

### Added — `paused` icon badge

New `StrctIconBadge` value for lifecycle states: a circle with two pause
bars (⏸), distinct from `off` — a paused VM no longer has to render as
powered-off.

## [0.26.0] - 2026-07-15

### Changed — `strct-datagrid` enclosed chrome

The action bar, grid and footer now share **one enclosing frame** (border +
radius + shadow on the host), separated by interior hairlines — the whole
component reads as a single object on the page instead of three floating
pieces. The table rounds only the frame corners it actually touches (no
toolbar above / no footer below). No API change.

## [0.25.0] - 2026-07-15

### Added — `strct-modal` draggable + styling hooks

- **`draggable`** — reposition the dialog by dragging its header (Pointer
  Events: mouse + touch). Clamped to the viewport, never starts from the close
  button or header controls, re-centers on every open. Keyboard/AT flows
  unchanged.
- **`panelClass` / `backdropClass`** — append custom class(es) to the dialog
  panel / backdrop, so consumers style modals from app-global CSS instead of
  piercing internal class names with `::ng-deep`.
- **`variant="glass"`** — built-in theme-aware frosted preset (translucent
  panel + blurred, tinted backdrop).

### Added — `strct-datagrid` single-line rows

- **`singleLine`** — keep every row exactly one line tall: cell content never
  wraps, long values truncate with an ellipsis (detail rows exempt), so tall
  content can't distort the grid.

## [0.24.0] - 2026-07-14

### Added — `strct-tree` density

- **`density`** input on `strct-tree` (`'compact' | 'comfortable'`, default
  `compact`). `comfortable` relaxes rows to 14px text / 18px icons with taller
  rows and wider indent — for touch-friendly or low-density consoles. The
  compact default renders pixel-identical to before.

## [0.23.0] - 2026-07-14

### Changed — `strct-card` grows rich, opt-in states

All backward-compatible; a plain composed card renders exactly as before.

- **`status`** — tone rail on the leading edge (same language as alert / hero).
- **`interactive`** — hover lift + accent border for clickable cards.
- **`selected`** — accent ring for card-picker layouts.
- **`dense`** — tighter paddings across header / block / footer.
- **`loading`** — indeterminate top bar + `aria-busy`; body and footer dim and
  ignore input. Reduced-motion collapses the bar to a static strip.
- **`collapsible` + two-way `collapsed`** — the header grows a labeled chevron
  toggle (`aria-expanded`); block and footer hide while collapsed.
- **`strct-card-header`** gains an `icon` input and localizable
  `collapseLabel` / `expandLabel`.

## [0.22.0] - 2026-07-14

### Added — `strct-command-palette` + `strct-kbd`

- **`strct-command-palette`** — a ⌘/Ctrl-K spotlight over app commands or pages.
  `items` (`{ id; label; group?; icon?; hint?; keywords?; data? }[]`), two-way
  `open`, built-in `hotkey`, ranked filtering (label prefix > word start >
  substring > keywords), `(picked)` output. ARIA combobox/listbox pattern with
  `aria-activedescendant`, full keyboard support, focus restore on close,
  reduced-motion safe, localizable strings. The docs site's own ⌘K now runs on
  it (dogfooded — and the wrapper shrank from 287 to ~60 lines).
- **`strct-kbd`** — inline keyboard-key chip for shortcut hints.

### Changed — overlay a11y audit outcomes

- Audit result: `strct-combobox`, `strct-context-menu` and `strct-cascade-select`
  already follow their APG patterns (combobox/listbox, menu/menuitem) — no
  changes needed. `strct-datepicker` uses a labeled dialog with button day cells
  and arrow-key focus; a strict APG grid refinement is noted for later.
- **`strct-tree`** — chevron toggles now have a 24×24px hit target
  (WCAG 2.5.8) without changing visual density, and their rotation honours
  `prefers-reduced-motion`.

## [0.21.2] - 2026-07-14

### Fixed — axe-core smoke findings

The new CI a11y gate (axe-core over eight key routes) caught and we fixed:

- **`strct-tree`** — expand/collapse chevrons were unnamed `role="button"`
  elements; they now expose "Expand/Collapse <label>".
- **`strct-progress`** — bars had no accessible name; new `label` input
  (falls back to "Progress").
- **`strct-table` / `strct-datagrid`** — horizontal scroll containers are now
  keyboard-focusable named regions (WCAG scrollable-region-focusable).

### Infrastructure

- **vitest 3 → 4** — resolves the `@angular/build` peer conflict; the lockfile is
  back in sync and `npm ci` works without `--legacy-peer-deps` (CI updated).
- **CI is green again** — fixed the stale showcase footer assertion that had
  failed every run since June 12.
- **New `a11y-smoke` CI job** — axe-core over key routes (fails on
  serious/critical) + per-page screenshots uploaded as artifacts.
- **New `Publish to npm` workflow** — pushing a `v*` tag builds, tests and
  publishes `@akcelik/strct` with provenance (requires the `NPM_TOKEN` secret).
  npm's latest was stuck at 0.11.0.
- **README** — real screenshots (dashboard, theming) and up-to-date counts.

## [0.21.1] - 2026-07-19

### Changed — "16 Native" icon render policy

- **Object / semantic glyphs now render at the grid's native 16px** instead of
  13–15px (a fractional downscale that blurred hairlines). 16 call sites updated
  across alert, toast, tree, datagrid (settings/refresh), context menu, section
  menu, field/validation adornments, segmented, metric-tile, datepicker,
  password and theme-switcher. Simple single-stroke glyphs (chevrons, close,
  check, dots, sort arrows) stay at 11–14px by design — the policy is documented
  in the icon source. This matches the 16px-grid convention of Octicons, Carbon,
  Fluent and Clarity.

### Fixed

- **`ellipsis` icon added** — `strct-pagination`'s gap indicator referenced an
  unregistered name and silently rendered nothing; the "…" between page numbers
  is now visible.

## [0.21.0] - 2026-07-19

### Icons — coverage, variants & small-size legibility (142 → 178 glyphs)

- **Added — time & communication:** `clock`, `history`, `timer`, `hourglass`,
  `mail`, `chat` (an NTP settings page finally has its clock).
- **Added — general UI:** `help`, `home`, `link`, `globe`, `star`, `pin`, `share`,
  `archive`, `zoomIn`/`zoomOut`, `fullscreen`/`exitFullscreen`, `listView`,
  `dragHandle`.
- **Added — direction set completed:** `chevronUp` (was missing!) and
  `chevronDoubleLeft/Up/Down`.
- **Added — infrastructure & identity:** `dns`, `vpn`, `api`, `bolt`, `queue`,
  `users`, `login`, `unlock`, `ban`.
- **Added — off-state composites & aliases:** `wifiOff`, `cloudOff`, `linkOff`
  (slash composites); `unlink` → `linkOff`, `webhook` → `bolt`.
- **Legibility repairs (verified at 14px, the real usage size):** 13 dense glyphs
  redrawn so parallel details keep ≥ 1.5px gaps on the 16-grid — `nic` and `hba`
  are now clearly distinct (one large square port vs two round ports), and
  `memory`, `ethernet`, `switch`, `portGroup`, `keyboard`, `motherboard`, `psu`,
  `gpu`, `sdCard`, `usb` no longer smudge; `braille` dots enlarged. The tree
  chevron stroke is standardized to the 1.3–1.5 guideline, and a **detail-budget
  rule** is documented in the icon source.

## [0.20.0] - 2026-07-19

### Accessibility & design-system hardening

A tri-lens audit (visual arts · HCI · vision science) of the whole library,
implemented end to end. All changes are backward-compatible; deprecations noted.

#### Fixed — contrast (WCAG AA, computed)

- **Light-mode semantic tones darkened** across all three palettes so colored
  _text_ meets AA ≥ 4.5:1 (previously: warning ≈ 3.4:1, success ≈ 3.9:1,
  accent ≈ 4.1:1). Matching translucent tints updated. Dark mode unchanged.
- **Text on solid status fills** now uses the new rule `color: var(--inv)` instead
  of hard-coded `#fff` (solid badges, hero chips, solid buttons, checkbox check,
  datepicker selected day, speed-dial, toggle thumb). Previously _every_ dark-mode
  solid badge failed AA (2.2–3.5:1); now ≥ 5:1 in both modes. No hard-coded colors
  remain in the library; header-anchored UI uses the new `--hdr-fg` token.
- **`strct-badge`**: the misspelled public class `strct-badge--warninging` is fixed
  to `strct-badge--warning`; the old class is still emitted as a deprecated alias.

#### Fixed — motion & typography

- `prefers-reduced-motion` now also disables the modal, drawer and toast entrance
  animations; charts track the OS setting _live_ instead of reading it once.
- **12px type floor restored**: chart axis/tooltip annotations, flow role tags,
  datepicker weekday header, section-menu category labels and metric-tile deltas
  (10–11.5px) are all ≥ 12px. Display sizes are tokenized: new `--text-2xl` (22px)
  and `--text-3xl` (26px) used by gauge, donut and metric-tile.

#### Added — keyboard & screen-reader access

- **`strct-tree`** implements the ARIA tree pattern: roving tabindex (one tab stop
  per tree instead of one per row), ArrowUp/Down/Left/Right + Home/End navigation,
  `aria-level`, and a visible `:focus-visible` ring on rows.
- **`strct-chart`** is now exposed to AT: `role="img"` with a generated data
  summary, keyboard-focusable crosshair (arrows / Home / End / Escape) and an
  `aria-live` announcement of the selected point. X-axis labels are positioned at
  their datapoint's real x (an honest axis under `xTicks` subsampling); overlays
  are anchored to the plot so the legend can't shift them.
- **`strct-donut`**: `role="img"` summary naming every slice; legend rows are
  keyboard-focusable and drive the center readout.
- **`strct-modal`**: the backdrop is no longer an unnamed `role="button"` phantom
  tab stop (keyboard dismissal is Escape, unchanged).

#### Added — color-vision safety

- Icon status badges are **shape-coded**: ✓ success · × critical · i info · – off
  (warning already had its ! triangle), so object state never relies on hue alone.
- **`strct-chart` series** accept `dash` (boolean or dasharray) as a second visual
  channel; the legend swatch mirrors the pattern.
- The donut fallback palette's translucent 5th color is replaced with an opaque
  accent mix.

#### Added — internationalization & RTL

- Every user-visible / assistive string is now an input: `strct-datagrid`
  `[labels]` (row/rows/selected + all aria labels), `strct-alert` `dismissLabel`,
  `strct-modal` `closeLabel`, `strct-spinner` `label`, toast outlet `regionLabel`,
  pagination `prevLabel/nextLabel/regionLabel`, wizard `backLabel/nextLabel`,
  chart `agoFormat`.
- Library styles converted to **CSS logical properties**
  (margin/padding/border-inline, text-align start/end) for RTL-readiness.

#### Added — API consistency

- **`strct-tabs`** `selectedIndex` and **`strct-wizard`** `current` are now
  two-way `model()`s, completing the controlled-state pattern alongside the tree's
  `expandedIds` and the datagrid's `initialSelection`.

## [0.19.0] - 2026-07-14

### Added

- **`strct-datagrid`** — `initialSelection` input seeds the checked rows (values are
  row ids matching `rowId`; requires `selectable`). Assigning a new array re-seeds —
  e.g. open a picker dialog with the current members already checked — while the
  user's later toggles are preserved until it changes. Additive; defaults to `null`
  (no selection), so existing grids are unchanged.

## [0.18.0] - 2026-07-14

### Added — `strct-tree` stable identity + observable / controlled expansion

All additive and backward-compatible:

- **Stable node identity** — `StrctTreeNodeData.id` gives each node a stable key,
  used for `trackBy`, expansion state and a `data-node-id` DOM attribute. Falls back
  to `label` when absent.
- **Observable expansion** — `(expandedChange)` emits the full set of expanded ids on
  every toggle; `(nodeToggled)` emits `{ node, expanded }` per toggle.
- **Controlled expansion** — `[(expandedIds)]` (two-way) makes the parent the single
  source of truth, so persisting/restoring which nodes are open is a one-liner. When
  null (default), expansion stays uncontrolled, seeded from each node's `expanded`
  flag exactly as before.

With no `id`, no `expandedIds` and no listeners, the tree behaves exactly as today.

## [0.17.1] - 2026-07-04

### Fixed

- **`strct-modal`** — a **dismissible** modal no longer closes when you press
  **Space** (or Enter) while typing in a field inside it. The keyboard-close
  handlers on the backdrop now ignore events that bubbled up from a child, and only
  act on a real backdrop click or Enter/Space while the backdrop itself is focused.
  No API change.

## [0.17.0] - 2026-06-25

### Added

- **`file`** — a plain document glyph (a file with a dog-ear fold, no field / text
  lines) for file-browser and file-list UIs, distinct from `template` (lined) and
  `form` (form fields).
- **`clipboard`** — a clipboard with a checklist, for "task list" semantics
  (distinct from `logs`, which reads as a stream). Icon count: 142.

## [0.16.0] - 2026-06-25

### Added — `strct-chart` gaps (all additive, back-compatible)

- **Multi-series** — new `series` input (`{ data; label?; status?; area?; curve? }[]`)
  draws several colored lines that share the x/y domain, with a per-series hover
  tooltip. Falls back to `data` when unset. Shorter series are right-aligned.
- **Legend** — `legend` renders a swatch + label per labeled series.
- **Persistent y-axis** — `yAxis` (+ `yTicks`, `axisFormat`) shows value labels
  aligned to the gridlines; a left gutter is reserved so the plot never overlaps.
- **Thresholds** — `thresholds` (`{ value; label?; status?; dashed? }[]`) draws
  horizontal reference lines (dashed by default) with an optional right-edge tag.
- **Y-axis floor** — `min` pins the baseline (defaults to 0, i.e. today's behavior).
- **Empty state** — `emptyText` (default "No data") renders a centered message at
  the normal height when there are no points, instead of an empty SVG.
- **X-axis tick control** — `xTicks` subsamples labels to ~N evenly spaced ticks and
  `xFormat` reformats them.

Every new input defaults to today's behavior, so existing single-series usage is
unchanged.

## [0.15.0] - 2026-06-25

### Added — 27 new icons

The datacenter icon set grows from 113 to 140 glyphs, in four new gallery groups:

- **Storage & media** — `opticalDisc` (CD/DVD), `ssd`, `usb`, `sdCard`, `tape`.
- **Hardware** — `gpu`, `psu`, `fan`, `battery`, `ups`, `motherboard`, `sensor`,
  `thermometer`.
- **AI** — `sparkles`, `brain`, `robot`, `neuralNetwork`, `aiChip`, `wand`, `model`.
- **Peripherals & network** — `router`, `loadBalancer`, `wifi`, `bluetooth`,
  `monitor`, `keyboard`, `printer`.

All are stroke glyphs on the shared 16×16 grid, so size, color and status badges
work as for every other icon.

## [0.14.1] - 2026-06-25

### Changed

- **`strct-donut`** — removed the glow on the hovered slice; the focus effect is now
  just the slice growing while the others dim (cleaner, flatter).

## [0.14.0] - 2026-06-25

### Changed — `strct-donut` is now interactive

- **Hover to focus** — hovering a slice (or its legend row) highlights it (it grows)
  while the others dim, and the center reads out that slice's value, label and
  share. `interactive` (default on) toggles this.
- **Legend** — new `legend` input renders a `color · label · value · %` list beside
  the ring, hover-linked to the slices in both directions.
- **Modern slices** — rounded caps with gaps between slices (new `gap`, in degrees)
  and a sweep-in entrance animation (honours `prefers-reduced-motion`).
- Back-compatible: existing `segments` / `size` / `thickness` / `centerValue` /
  `centerLabel` usage is unchanged.

## [0.13.0] - 2026-06-25

### Changed — `strct-chart` line chart overhaul

A ground-up rework of the line / area chart for trends and live telemetry:

- **Smooth curves** — lines now use monotone-cubic interpolation by default
  (curves that never overshoot the data). New `curve` input: `'smooth' | 'linear' |
'step'`.
- **Area toggle** — `area` is now an independent boolean (a soft vertical
  gradient), separate from `type`. `type="area"` still works.
- **Live streaming** — `live` scrolls the window left as new points arrive (a
  conveyor slide), with a pulsing head at the leading edge and a one-time draw-on.
  `interval` drives the scroll duration.
- **Ambient glow** — `glow` adds a layered neon glow to the line and head dot.
- **Hover crosshair + tooltip** — `interactive` (default on) shows a vertical +
  horizontal crosshair, a value chip on the y-axis edge, the highlighted x label,
  and a tooltip with the value, the ▲/▼ delta from the previous point, and the time
  (`Xs ago` while live).
- **Crisp at any size** — the SVG is now measured (1:1 coordinates via
  `ResizeObserver`) instead of stretched, so dots, the head and the glow stay
  perfectly round and sharp.
- New `strokeWidth`, `grid` and `dots` inputs. All animations honour
  `prefers-reduced-motion`.

## [0.12.0] - 2026-06-24

### Added

- **`strct-hero`** — a page-level status summary banner: a tone-colored surface with
  a leading icon chip, a heading, a description and optional right-aligned metadata
  (`[strctHeroMeta]`) / actions (`[strctHeroActions]`). `role="status"` (or `alert`
  when `status="critical"`), with the heading as the accessible name.
- **`strct-flow`** — an animated relationship between two (or N) endpoints: packets
  travel along the connector when `live`, with `direction` (`forward` / `reverse` /
  `both`) and horizontal / vertical orientation. Degrades to a static gradient +
  arrow when idle or under `prefers-reduced-motion`; `role="img"` with a summary
  label.
- **`strct-description-list` + `strct-desc`** — a compact `label → value` definition
  list, driven by an `items` input or projected `<strct-desc>` rows (so a value can
  host a badge or icon). Stacked rows plus an `inline` stat-strip variant.
- **`strct-segmented`** — a single-select segmented control with managed selected
  state, `ControlValueAccessor`-compatible. `role="radiogroup"` with roving tabindex
  and arrow-key navigation; `sm` / `md` sizes and a `block` width.
- **`strct-cell-status`** — a small "checking → ok / warning / error (reason)"
  affordance (spinner / icon + message, `aria-live`) for datagrid cells.
- Shared **`StrctStatus`** and **`StrctThresholds`** types in the public API.

  Component count: 63.

### Changed

- **`strct-progress` / `strct-gauge`** gained an optional `thresholds` input
  (`{ warning?, critical? }`). When set, the meter derives its own status from the
  value (≥ critical → critical, ≥ warning → warning, else the healthy base), so
  callers stop computing status for every disk / memory meter. Back-compatible: an
  explicit `status` still wins when no thresholds are given.
- **`strct-field`** gained a `validationState` input
  (`{ status: 'idle' | 'checking' | 'ok' | 'warning' | 'error'; message? }`),
  rendered as a trailing spinner / check / warning adornment plus the message in the
  hint / error slot (`aria-live`). An explicit `error` still takes precedence.

## [0.11.0] - 2026-06-12

### Added

- **`strct-section-menu`** — a two-level navigation menu (categories → items; not a
  tree). Categories are `collapsible` with chevrons (default) or render as static
  uppercase section labels; category / item icons can be hidden with `showIcons`;
  the active item gets a soft accent tint. Two-way `activeId`, `select` output.
  Standalone, token-themed. Component count: 59.

## [0.10.1] - 2026-06-09

### Changed

- **Reworked the modal size scale.** The old `sm` (380px) sat too close to `md`, so
  the two are merged: `sm` is now **480px** and the rest shift up one step —
  **md 640 · lg 860** — with a new, larger **xl 1080**. The default stays `sm`
  (480px = the previous default width), so untouched modals look the same; explicit
  `size="md" | "lg" | "xl"` now render one step wider.

## [0.10.0] - 2026-06-09

### Changed — behavior

- **Modals no longer close on a backdrop click or the Escape key by default.** A
  modal now closes only through its X button or an explicit action button, so a
  stray click outside (or an accidental Escape) can't discard in-progress work.
  The `dismissible` input (default now `false`) opts a modal back into backdrop /
  Escape dismissal for lightweight, transient dialogs.

  **Migration:** if you relied on click-outside / Escape to close a modal, add the
  `dismissible` attribute to that `<strct-modal>`.

## [0.9.2] - 2026-06-08

### Changed

- **Modal sizes are now a fixed 4-step scale.** `size` accepts `'sm' | 'md' | 'lg' | 'xl'`
  with set widths — **sm 380 · md 480 · lg 640 · xl 860 px** — so dialogs stay
  consistent (no arbitrary widths). Adds `xl` and rounds the existing presets
  (was sm 360 / md 460 / lg 720). Backward compatible; `sm`/`md`/`lg` still valid.

## [0.9.1] - 2026-06-08

### Changed

- **Tree rows are more compact.** Reduced tree-node row vertical padding (7px → 4px)
  and gap (7px → 6px), bringing row height from ~34px to ~28px for a denser
  navigation list. Legibility and click target preserved. Visual only; no API change.

## [0.9.0] - 2026-06-08

### Added — new components (development round, phase 1 of 5)

- **`strct-metric-tile`** — a dense KPI tile for dashboards: a label, a large value
  (+ unit), an optional change indicator (`delta` — its sign drives the arrow and
  colour; `invertDelta` for metrics where up is bad) and an inline sparkline.
- **`strct-empty-state`** — a centered zero / permission / error state with preset
  `variant`s (`empty` / `denied` / `error` / `notfound`), an icon, a title, an
  optional description and a projected call-to-action slot.

Component count: 58. Both are standalone, token-themed and backward compatible.

## [0.8.1] - 2026-06-08

### Changed

- **Accordion is now a unified stack.** Panels were previously detached cards
  separated by gaps; they now form one cohesive surface — a single rounded border
  with hairline dividers between consecutive panels and no gaps. Independent
  expand/collapse behaviour is unchanged. Visual only; no API change.

## [0.8.0] - 2026-06-08

### Added — Visual comfort & accessibility (eye-health round II)

Continuing the eye-strain work from 0.7.2, this round respects the user's
environment and their operating-system accessibility settings. Why each change:

- **OS-aware theming.** `StrctThemeService` now follows the operating system's
  `prefers-color-scheme` when the user has not made an explicit choice, and keeps
  following it live. An explicit selection still wins and is persisted. Reason: a
  user working at night or in a dim room should not be forced onto a bright screen
  on first load (high luminance + melanopic / blue-light load suppresses melatonin
  and shifts circadian phase). The showcase resolves the same preference before
  paint to avoid a flash.
- **High-contrast support (`prefers-contrast: more`).** When the OS asks for more
  contrast (low-vision users, bright ambient light), borders and secondary /
  tertiary text are strengthened and the focus ring becomes a solid 3px accent
  outline. It is active **only** when the OS requests it — the default look is
  unchanged.

### Changed

- **Type-size floor raised to 12px.** Every piece of readable text that previously
  sat at 11px (hints, captions, labels and metadata across components) is now
  ≥ 12px, and the default body line-height is 1.5. Reason: 11px sustained reading
  is below the comfortable acuity threshold for all-day console work; together
  with the 0.7.2 contrast fix this removes the remaining small-text strain. No
  layout regressions.

Backward compatible — no API or token-name changes. (`prefers-reduced-motion`
continues to be honoured by the base stylesheet.)

## [0.7.2] - 2026-06-08

### Changed — Visual comfort & eye health

These token tweaks come from a vision-science / WCAG review of the theme, aimed at
**reducing eye strain during long, all-day operations-console sessions**. Why each
change was made:

- **Tertiary text (`--t3`) now meets WCAG AA (≥ 4.5:1) in all six schemes.** It
  previously measured only ~2.4:1 (dark) and ~3.0:1 (light) — below the AA
  threshold — yet it is used for hints, captions, placeholders and metadata. Text
  that faint forces the eye into sustained accommodation to decode it, and on dark
  backgrounds off-axis halation lowers the effective contrast even further. `--t3`
  now measures **4.65–4.77:1** everywhere.
- **Secondary text (`--t2`) raised in the ember & sage palettes (to ~6:1).** Two
  reasons: (1) raising `--t3` would otherwise have inverted the text hierarchy, so
  `--t2` had to stay above it (the intended order is `--t1` > `--t2` > `--t3`); and
  (2) `--t2` itself was already slightly below AA (~4.2–4.4:1) in the ember/sage
  light schemes.
- **Light arctic surface (`--bg-1`) softened from pure `#ffffff` to `#fbfcfd`.**
  A pure-white surface produces discomfort glare (high luminance + high melanopic /
  blue-light load) in dim datacenter rooms and creates a harsh near-black-on-white
  contrast that triggers halation. A ~5% off-white reduces both while staying well
  within AA.

Values only — **no API or token-name changes, fully backward compatible.** The
`--t1` > `--t2` > `--t3` legibility hierarchy is preserved across every palette and
mode. (`prefers-reduced-motion` was already honoured in the base stylesheet.)

## [0.7.1] - 2026-06-08

### Changed

- **Trash icon** — redesigned the `trash` glyph as a clearer waste-bin (lid bar + handle + tapered rounded body + three vertical ridges) so it reads unmistakably as delete at small sizes.

## [0.7.0] - 2026-06-08

### Added

- **`strct-rail`** — collapsible, data-driven primary navigation rail for an application shell. Items are icon + label + optional status badge (`StrctRailItem`); collapsing shrinks it to an icon-only rail where badges become dots and labels become tooltips. Two-way `activeId` / `collapsed`, `select` output.
- **`strct-drawer`** — edge-anchored slide-out overlay panel (`side` = start/end/top/bottom, `size` = sm/md/lg) for inspector / edit flows without losing the underlying list's scroll or selection. Two-way `open`, backdrop + Escape dismiss, `strctDrawerFooter` slot.

### Notes

- These were identified as the highest-value gaps for infrastructure consoles (alongside the existing shell, vertical-nav and stack/property views). Component count: 56.

## [0.6.0] - 2026-06-08

### Added

- **Datagrid row actions** — set `[rowActions]="(row) => StrctMenuItem[]"` to give every row a trailing actions column with a vertical-dots (kebab) button that opens that row's data-driven, body-portaled menu. A new `(rowAction)` output emits `{ row, item }` on selection.
- **`StrctMenuService`** — imperatively open the data-driven menu panel at viewport coordinates; shared by the `[strctContextMenu]` directive and the datagrid kebab.

### Changed

- The `[strctContextMenu]` directive now delegates to `StrctMenuService` (no behavioral change).

## [0.5.31] - 2026-06-07

### Changed

- **Switch icon** — redesigned the `switch` glyph as a network switch front-panel view (chassis + two status LEDs + a row of RJ45 ports) instead of the previous box-with-legs shape that read as an insect.

## [0.5.27] - 2026-06-06

### Changed

- **Maintenance badge icon** — refined the badge SVG to closer match the classic hand-holding-wrench silhouette (open wrench head + fingers gripping the handle).

## [0.5.26] - 2026-06-06

### Changed

- **Maintenance badge icon** — refined the badge SVG to read as a hand holding a wrench for a more universal "under maintenance" meaning.
- **Maintenance badge size** — slightly enlarged so the hand+wrench detail is readable at small icon sizes.

## [0.5.25] - 2026-06-06

### Changed

- **Maintenance badge icon** — replaced the single-wrench SVG with a crossed wrench + screwdriver glyph to match classic maintenance/tooling iconography.
- **Icon badges** — all status badges (success, critical, off, info, warning, maintenance) are now slightly larger and positioned a bit further outside the glyph for better visibility.
- **Showcase footer version** — footer version is now bound to `App.version` so it stays in sync with releases.

## [0.5.24] - 2026-06-06

### Added

- **Icon maintenance badge** — new `badge="maintenance"` overlay renders a small wrench icon on a yellow badge, perfect for host/cluster/vm maintenance states.
- **Showcase icons page** — added `Maintenance` to the interactive state buttons and updated static state examples to use the new maintenance badge.

## [0.5.23] - 2026-06-06

### Changed

- **Icon warning badge** — enlarged the warning triangle badge (up to 14px) and added a black exclamation mark inside it so degraded states are much more readable at a glance.

## [0.5.22] - 2026-06-06

### Added

- **Showcase icons page** — new "Interactive object states" demo where you can click state buttons (Running / Maint / Critical / Stopped) to update the badge on Cluster, Host and VM icons in real time.
- **Object states gallery** — expanded the static state grid to cover every state for Cluster, Host and VM.

## [0.5.21] - 2026-06-06

### Changed

- **Icon badges** — the `warning` badge overlay is now a yellow triangle instead of a solid circle, making degraded/warning states more recognizable at a glance.
- **Showcase icons page** — added a "Cluster · degraded" state example so the new warning triangle badge is demonstrated on the cluster icon.

## [0.5.20] - 2026-06-06

### Changed

- **Icon set** — redesigned the `cluster` glyph as a group of three vertical server/rack units (center unit prominent, side units behind) with small indicator dots, inspired by classic datacenter cluster iconography.

## [0.5.19] - 2026-06-06

### Changed

- **Icon set** — redesigned the `cluster` glyph as a clearer 2×2 grid of connected nodes so it reads as a cluster/group at small sizes.

## [0.5.18] - 2026-06-06

### Changed

- **Showcase icons page** — vendor marks in the Vendors demo are now rendered as uppercase text labels (HPE, DELL, CISCO, VMWARE, KAYTUS) instead of abstract SVG glyphs.
- **Showcase data page** — Table and Datagrid demos now display cluster rows (`Cluster / Type / Hosts / Status`) instead of generic service rows, matching the datacenter theme.

## [0.5.11] - 2026-06-06

### Changed

- **Datagrid column chooser** — moved back to the left side of the footer, keeping the `strct-button` neutral small style.

### Fixed

- **Showcase app** — restored the component library documentation structure (landing page, component browser, sidebar categories) that was accidentally replaced by an appliance management app.

## [0.5.9] - 2026-06-06

### Changed

- **Datagrid column chooser placement** — the column visibility toggle has moved from the left side of the footer to the far right, next to pagination.
- **Datagrid column chooser button style** — the settings button now uses the standard `strct-button` component with `size="sm"` and `variant="neutral"` instead of a custom styled icon button.
- **Datagrid dropdown alignment** — the column chooser dropdown menu is now right-aligned so it no longer overflows the grid boundary.

### Added

- **Datagrid docs** — added missing API entries for `columnChooser`, `resizable` and `loading` inputs in the showcase registry.
- **Datagrid test** — added a unit test covering column chooser open/close and column visibility toggling.

## [0.5.0] - 2026-06-05

Major framework-quality release. Consolidates semantics, expands the icon set, introduces a scalable token system, loading states, responsive behaviours and accessibility improvements.

### Added

- **Expanded icon set** — 17 foundational action icons (`plus`, `minus`, `pencil`, `trash`, `refresh`, `filter`, `settings`, `user`, `logout`, `undo`, `redo`, `arrowUp`, `arrowDown`, `arrowLeft`, `arrowRight`, `externalLink`) plus 14 modern infrastructure icons (`pod`, `deployment`, `service`, `node`, `ingress`, `cloud`, `container`, `firewall`, `shield`, `certificate`, `key`, `metrics`, `logs`, `trace`).
- **Composite off icons** — `eyeOff` and `bellOff` now reuse their base glyph plus a slash overlay, eliminating duplicated SVG paths.
- **Design token expansion** — new `--space-*`, `--radius-*`, `--shadow-*`, `--text-*`, `--leading-*` and `--disabled-opacity` tokens across all six palettes/modes.
- **Loading states** — `StrctDatagrid`, `StrctTable` and `StrctCombobox` now accept a `[loading]` input and render skeleton placeholders.
- **Responsive breakpoint system** — new `--bp-sm/md/lg/xl` tokens plus mobile drawer for `StrctShell`, horizontal scroll for `StrctDatagrid`, scrollable tabs, responsive modal sizing and viewport-safe dropdowns.
- ** prefers-reduced-motion support** — global CSS reset disables animations and transitions when the user prefers reduced motion.
- **Icon accessibility** — `<strct-icon>` now accepts an `ariaLabel` input and exposes `role="img"` / `aria-hidden` accordingly.
- **Toast assertive announcements** — `critical` toasts now use `aria-live="assertive"` by default; other types remain `polite`.
- **CI pipeline** — GitHub Actions workflow runs lint, test and build on every push/PR.
- **Pre-commit hooks** — Husky + lint-staged run ESLint --fix and Prettier on staged files.
- **Bundle analysis** — `npm run bundle:analyze` generates a production build with source-map-explorer output.

### Changed

- **Unified semantic naming** — `danger` → `critical`, `ok` → `success`, `warn` → `warning`, `crt` → `critical` throughout types, CSS tokens, component APIs and documentation.
- `StrctModal.dismissable` renamed to `dismissible`.
- `ellipsis` icon removed (duplicate of `dots`).
- Production component-style budgets raised to 8 kB warning / 12 kB error.

### Added (tooling)

- ESLint with `@angular-eslint`, including template accessibility rules.
- 127 unit tests across 56 spec files (up from 9 spec files / 17 tests).
- JSDoc/TSDoc comments on all public APIs.

## [0.4.0] - 2026-06-04

Third feedback round. All additions are **backward-compatible**.

### Added

- **Per-node tree context menu** — `<strct-tree [nodeMenu]="fn">` takes a resolver
  `(node) => StrctMenuItem[]` and wires a `[strctContextMenu]` trigger on every node
  row; a new `(nodeMenuSelect)` output emits `{ node, item }`. Nodes whose resolver
  returns an empty array open no menu.

### Changed

- **Combobox** no longer caps its width at 280px (fills its container) and drops the
  dead absolute-position menu CSS that `StrctOverlay` already overrode.

### Fixed

- `StrctMenuItem.label` is now optional — a `divider` entry no longer needs a
  meaningless placeholder label.

## [0.3.0] - 2026-06-04

Second feedback round (SHOULD-FIX) — all additions are **backward-compatible**.

### Added

- **`strct-field`** — a form-field wrapper with label, required marker, hint and error
  message that auto-wires `aria-describedby` and `aria-invalid` on the projected control.
- **Self-hosted fonts** — DM Sans and JetBrains Mono (OFL) now ship as `woff2` under
  `styles/fonts/` and are referenced by `@font-face` in the theme, so the library renders
  in its intended type with no external request.
- **Icons** — added `folder`, `template`, `tag`, `resourcePool` and `portGroup` glyphs.

### Changed

- **Modal** now locks body scroll while open (reference-counted for nested modals) and
  restores it on close / destroy.
- **Overlay** flips horizontally (`left` / `right` placements) when it would overflow the
  viewport edge, instead of only clamping.
- **Submenu** flips to the left near the right edge and can be opened via click / tap and
  the keyboard (Enter / Space / →, closed with ← / Esc), not hover only.

## [0.2.0] - 2026-06-04

Feedback-driven release — all additions are **backward-compatible**.

### Added

- **Datagrid / Table cell templates** — a `*strctCell="key"` template per column for
  custom cell content (status pills, links, action buttons). Context exposes
  `let-row`, `let-value="value"` and `let-column="column"`.
- **Datagrid `rowId`** — a stable row identity (property key or function) so selection,
  expansion and the active detail row survive live data re-fetches that replace the row
  objects. `selectionChange` now emits fresh row objects resolved by id.
- **Data-driven tree** — `<strct-tree [nodes]>` self-recurses over a `StrctTreeNodeData[]`
  of any depth, with a new `(nodeActivated)` output and a per-node `badge` input for object
  state on the node.
- **Data-driven context menu** — a new `[strctContextMenu]="items"` directive that portals
  into `<body>` (no overflow / transform clipping), positions by its real measured size,
  supports full keyboard navigation (↑/↓/→/←/Enter/Esc with roving tabindex) and nested
  submenus, and runs each item's `action`.
- **Wizard step validation** — a per-step `[canAdvance]` gate for Next / Finish, plus wizard
  `[submitting]`, `[cancelable]`, `[finishLabel]` inputs and `(cancelled)`, `(stepChange)`
  outputs.

## [0.1.1] - 2026-06-04

### Added

- Published documentation & demo site on GitHub Pages: <https://akcelik.github.io/uistruct/>.
- Link to the live documentation site in the package README.

_No component API changes in this release._

## [0.1.0] - 2026-06-04

### Added

- Initial public release of `@akcelik/strct`.
- **53 standalone, signal-based Angular components** across eight categories — Controls,
  Forms, Surfaces, Navigation, Data, Charts, Feedback and Patterns.
- **Tokenised theme system**: three palettes (Arctic, Ember, Sage) × light/dark, driven
  entirely by CSS custom properties bound to `[data-palette][data-theme]` on the document root.
- **Datacenter-flavoured stroke icon set** with object-state badges (running / stopped /
  maintenance / off) layered via the icon `badge` input, plus generic vendor marks.
- **ControlValueAccessor** support on every form control (input, checkbox, toggle, radio,
  slider, combobox, datepicker, password, file, color picker, cascade select, rating, chips,
  OTP, knob, input mask).
- Dependency-free SVG charts (sparkline, line / area / bar, donut, gauge).
- Overlay-safe dropdowns, tooltips and menus; accessible modal with focus trap.
- Zoneless, `OnPush` change detection throughout. MIT licensed.

[0.4.0]: https://github.com/akcelik/uistruct/releases/tag/v0.4.0
[0.3.0]: https://github.com/akcelik/uistruct/releases/tag/v0.3.0
[0.2.0]: https://github.com/akcelik/uistruct/releases/tag/v0.2.0
[0.1.1]: https://github.com/akcelik/uistruct/releases/tag/v0.1.1
[0.1.0]: https://github.com/akcelik/uistruct/releases/tag/v0.1.0
