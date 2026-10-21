# HyperStruct on 5.16.0 (the redesigned Validation tab; the 5.8–5.16 adoption) → BUG-58-01 … 14, FR-58-01 … 03

**From:** HyperStruct · **Version:** 5.16.0 · **Date:** 2026-10-16 · **HyperStruct decision:** O326

HyperStruct built its redesigned cluster Validation tab on FR-56-01 … 05 (5.10.0) and FR-55-01/02 (5.16.0): a verdict
band of `strct-metric-tile size="sm" [pressed]` counters, a `strct-datagrid` grouped by what the operator must do
(`groups`, `[(collapsedGroups)]`), its `detailPane` (`keepInPane`, `[(activeRowId)]`, the header slots, the keyboard),
`strct-status-dot variant="ring"`, `strct-segmented` counts. They carry the page. Five things did not, each measured.

"Measured" means the installed 5.16.0 package rendered in HyperStruct's vitest/jsdom suite, and its DOM with every
component stylesheet saved as static HTML and drawn in headless Chrome (Linux, DPR 1, arctic palette) with the theme
compiled from `styles/theme.scss`.

Suggested order: BUG-58-02 (silently drops content), BUG-58-03, BUG-58-04, BUG-58-01, FR-58-01.

---

### BUG-58-01 — `strct-datagrid` `groups[].status` tints nothing, and `note` is drawn as the label

**Seen.** FR-56-01's header renders `strct-dg__grouplabel--{status}`, `strct-dg__groupcount--{status}` and
`strct-dg__groupnote`, but the component's stylesheet has a rule for none of them (only `.strct-dg__groupcount`,
the accent chip, and the button). In Chrome, with `status: 'critical'`, `'warning'`, `'success'` and `'neutral'`:

- every label computes `rgba(255, 255, 255, 0.9)` 12.5 px / 600 (dark), every count chip `rgb(123, 158, 200)` on
  `--acc` at 12 % — the four groups look the same; the group's tone is not drawn anywhere;
- the note computes the button's 12.5 px / 600 / `rgba(255, 255, 255, 0.9)`, the same weight and colour as the label it
  follows ("Needs your decision 1 Blocks the join until fixed or accepted by name" reads as one bold heading);
- the button's 12.5 px is off the library's own type scale (12/13/14/16/22; the filter note's 11.5 px likewise).

The datagrid spec checks the class name is there (`toContain('strct-dg__grouplabel--critical')`), not that it
draws.

**Asked.** Rules for the classes the template already writes: the label in the status colour (`--critical`,
`--warning`, `--success`, `--acc`, `--t2` for neutral), the count chip in the status's wash and colour (as
`strct-badge [status]`), the note 12 px, weight 400, `--t3`, one line with an ellipsis when the list is narrow (a
paned list is 520 px). The button's text 12 px. A visual baseline with a toned group.

**HyperStruct today.** `<ng-template strctGroupHeader>` with the library's own parts: the label, a
`strct-badge [status]` count (`aria-hidden`), a screen-reader sentence (below), and the note as `strct-text-hint`.
Marked BUG-58-01; it goes when this ships.

**Also (accessibility).** The default header's button is named by its content, and its text is
"Needs your decision1Blocks the join until fixed or accepted by name" (measured `textContent`): the label, the count and
the note are inline spans with no separator, so the name runs them together. A visually hidden ", 1 test. " between
them reads it as a sentence.

### BUG-58-02 — `strct-tag` drops `[strctTagLeading]` content unless it has an `href`

**Seen.** Since 5.11.0 (`strct-tag [href]`, FR-51-04) the template has two branches, each with
`<ng-content select="[strctTagLeading]">`. The compiled `ngContentSelectors` are
`["[strctTagLeading]", "*", "[strctTagLeading]", "*"]`: a leading node is projected into the first slot — the `href`
branch's — and the `<span>` branch, every tag without `href`, never shows it. Measured (jsdom, the installed bundle):

| Tag                       | Leading icon rendered |
| ------------------------- | --------------------- |
| `<strct-tag>`             | no                    |
| `<strct-tag interactive>` | no                    |
| `<strct-tag href="/x">`   | yes                   |

The tag spec has no test of the leading slot. HyperStruct lost the kind icon of every object chip in its assistant on
the upgrade (its spec caught it), and a chip's status dot in the Validation tab.

**Asked.** Project the content once (an `<ng-template>` holding both `ng-content`s, drawn by `ngTemplateOutlet` in
whichever branch renders), and a spec per branch.

**HyperStruct today.** The icon and the dot ride in the default slot, before the text. Marked BUG-58-02.

### BUG-58-03 — `detailPane`: a percentage `paneListWidth` sizes the table to a percentage of the list, and the paned rules reach a grid inside the pane

**Seen.** `.strct-dg__layout--paned .strct-dg__scroll` and `.strct-dg__layout--paned .strct-dg` both take
`width / min-width / max-width: var(--strct-dg-pane-list-w)`.

- With `paneListWidth="40%"` the scroll is 40 % of the layout, and the table 40 % of the scroll. Measured at a
  1406 px layout: list 562 px, **table 281 px**; the Test column was cut to a word per line.
- The rule is a descendant selector, so it also matches a `strct-datagrid` drawn inside the pane (a test's evidence
  tables): measured, a 4-column grid in an 809 px pane was held to 509 px and clipped two of its columns.

**Asked.** The width on the scroll alone, the table `width: 100%` of it; the paned rules scoped with child
combinators (`.strct-dg__layout--paned > .strct-dg__scroll > .strct-dg`) so a grid in the pane is a grid like any
other. A spec with a percentage and one with a grid in the pane.

**HyperStruct today.** `paneListWidth="520px"`, and the evidence drawn with `strct-table`. Marked BUG-58-03.

### FR-58-01 — `strct-datagrid detailPane`: a click on a row opens its pane

**Today.** In `selectionMode="none"` a row opens its pane from its » button and from the keyboard (Enter / Space);
a click anywhere else on the row does nothing (measured: `activeRowIdChange` does not fire, no pane). The approved
design — and every triage list the operators know (vCenter's, a mail client) — opens the item the row is.
`.strct-dg__row--clickable { cursor: pointer }` is in the stylesheet but nothing sets the class.

**Asked.** With `detailPane` (and no selection mode that owns the click), a primary click on a row's cell opens its
pane, or closes it when it is the open one; a click on a button, link or form control in the row keeps its own;
selecting text is not a click; the row gets `strct-dg__row--clickable`. The » button stays the row's named control.

**HyperStruct today.** A click handler on the grid that finds the row's id in its status cell and sets
`activeRowId`. Marked FR-58-01.

### BUG-58-04 — `--t3` is under AA on the library's own surfaces: a dark datagrid cell, a light page

**Seen.** axe-core's `color-contrast` rule run in Chrome over the page (jsdom cannot compute it), arctic:

| Where                                                                                                   | Foreground       | Background                          | Ratio (AA for 12–13 px: 4.5) |
| ------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------- | ---------------------------- |
| Dark: `.strct-dg__celldesc`, `.strct-dg__cell--muted`, `strct-text-hint` / `strct-text-muted` in a cell | `--t3` → #8a8d91 | `--bg-3` (a dark body cell) #23282f | **4.44**                     |
| Light: `strct-section-header` description on the page                                                   | `--t3` → #737373 | `--bg-2` #f4f6f8                    | **4.37**                     |

`--t3` passes on `--bg-1` (the pane, a card); it is the darker cell surface (dark) and the page tone (light) that
take it under. The datagrid's own `descriptionKey` line and `muted` columns are the first case, so every grid that
uses them in dark falls short.

**Asked.** A `--t3` that clears 4.5 : 1 on `--bg-3` (dark) and `--bg-2` (light) in all six schemes, checked by the
contrast gate the showcase already runs for `--acc` (5.15.0).

**HyperStruct today.** Its secondary lines in the Validation tab's grids use `--t2` (the mockup's tone for them,
6.3 : 1); the section-header description stays the library's (4.37 in light). Marked BUG-58-04.

---

## Added by HyperStruct O327 (adopting 5.8.0 … 5.16.0) → BUG-58-05 … 12, FR-58-02, FR-58-03

**Date:** 2026-10-16 · **HyperStruct decision:** O327

HyperStruct adopted what 5.8.0 … 5.16.0 shipped for its own requests (FR-50, FR-51, FR-52, FR-53) and deleted the
workaround behind each. Most went in as written: the command palette's sections, badges and description, the header's
`*strctHeaderAction` overflow and density, `strct-shell [closeNavOnNavigate]`, the drawer's width, focus and close
control, `strct-header [accent]`, `strct-badge [tone]`, the `[data-accent]` tints, the dropdown row's label /
description / icon slots and `a[strctDropdownItem]`, the composer's Stop, `[strctChatMessageActions]`,
`strct-modal [closeOnEscape]`, `strct-list-item [disabledReason]`, and all thirteen FR-50 items. 5.12.0's two
datagrid fixes were measured again in Chrome after the app's BUG-57-02 rule went: the corners round and the selected
row fills (Δ +13.7 dark / −15.3 light), pixel-identical to the app's rule.

What did not go in, or went in with a guard, is below — each measured the same way as the items above (the installed
5.16.0 in HyperStruct's vitest/jsdom suite; Chrome on its DOM with every component stylesheet, arctic, DPR 1).

Suggested order: BUG-58-07 (a link with no text), BUG-58-06 (the current page lost to a screen reader), BUG-58-10,
BUG-58-08, BUG-58-09, BUG-58-05, BUG-58-11, BUG-58-12, then the two FRs.

### BUG-58-05 — `strct-modal [closeOnEscape]` closes on an Escape that something inside it, or on top of it, used

**Seen.** `onEscape` leaves alone an event that is `defaultPrevented` and yields to a `strct-modal` on top. Three
uses of Escape are neither, so the same keystroke also closes the modal (each measured with a spec in jsdom, the
assistant window open with `[closeOnEscape]="true"` and `dismissible` off):

- `strct-searchbox` clears its text on Escape (`(keydown.escape)="clear()"`) and does not prevent the default —
  `onEscape`'s own comment says "a searchbox that clears" marks the event handled; it does not;
- an IME composition: Escape cancels the composition, and `onEscape` does not look at `isComposing`;
- an overlay on top that is not a `strct-modal` — `strct-command-palette` opened over the modal (Ctrl-K), with the
  focus in its input: `isTopmostModal` only knows modals, so Escape closes the palette **and** the modal.

**Asked.** `strct-searchbox` calls `preventDefault()` when Escape clears a value; `onEscape` returns on
`event.isComposing`; an Escape whose target is outside the modal's dialog (the focus is elsewhere — another surface
has it) is not the modal's.

**HyperStruct today.** A capture-phase listener marks those three Escapes handled before the modal sees them
(`ai-assistant.ts` `keepEscape`). Marked BUG-58-05.

### BUG-58-06 — A `routerLink` entry of `strct-section-menu` and `strct-rail` loses its `aria-current`

**Seen.** Both templates put `routerLinkActive #rla` and `[attr.aria-current]="isActive(item, rla.isActive) ? 'page'
: null"` on the same `<a>`. Angular's `RouterLinkActive.update()` runs after each navigation (and after first render)
and, with no `ariaCurrentWhenActive`, **removes** `aria-current` from its element. The template binding only writes
when its value changes, so the attribute is gone (measured, probe spec, `activeId` set and the router on the entry's
URL):

| Moment                          | rail `/b`                   | menu `/b`                   | button entries (no link) |
| ------------------------------- | --------------------------- | --------------------------- | ------------------------ |
| first render                    | `page`                      | `page`                      | `page`                   |
| after the first stable turn     | **null** (still `--active`) | **null** (still `--active`) | `page`                   |
| navigate to `/a`                | `/a` `page`                 | `/a` `page`                 | `page`                   |
| navigate within `/a` (`/a?x=1`) | **null**                    | **null**                    | `page`                   |

The highlight stays; what a screen reader is told is the current page goes.

**Asked.** `ariaCurrentWhenActive="page"` with the router's state, or the attribute from a host binding the
directive does not touch — keeping the explicit `activeId` authoritative, as documented. A spec that reads
`aria-current` after a navigation.

**HyperStruct today.** Its sidebar menus pass `href` entries (that branch has no `routerLinkActive`) and route a
plain click itself (`select` + `preventDefault` on the host); the entries stay real links. Marked BUG-58-06. Its rail
has the same loss and no workaround.

### BUG-58-07 — `strct-tag [href]` draws an empty link: its text is projected into the other branch

**Seen.** The cause of BUG-58-02 again, from the other side. Each `@if` branch declares
`<ng-content select="[strctTagLeading]" />` and `<ng-content />`. Angular projects a selector match into the
**first** matching slot and default content into the **last** wildcard slot, so the link branch receives the leading
content and the `<span>` branch the text. Measured: `<strct-tag href="/objects/x">HV-NODE-01</strct-tag>` renders
`<a href="/objects/x">` with `textContent` `""` — FR-51-04, as shipped, gives a chip with no name.

**Asked.** Project once (both `ng-content`s in one `<ng-template>` drawn by `ngTemplateOutlet` in whichever branch
renders) — the fix BUG-58-02 asks for — and a spec of the text inside the link.

**HyperStruct today.** The object chip keeps its own anchor around a plain `strct-tag`. Marked BUG-58-07.

### BUG-58-08 — `strct-markdown`'s default link rule links `/\host` and `mailto:`

**Seen.** `strctClassifyHref` returns `internal` for anything that starts with `/` and not `//`. A browser reads a
backslash as a slash, so `[x](/\evil.example)` is drawn as `<a href="/\evil.example">`: a plain click is handed to
`(navigate)`, but a middle- or Ctrl-click (or "open in new tab") goes to `https://evil.example/`. `mailto:` is
`external`. Measured with HyperStruct's eleven unsafe destinations (its `markdown.spec.ts`): these two become links,
the other nine stay text. Nothing on the path builds HTML — the rest of the reader is as safe as HyperStruct's.

**Asked.** Refuse a backslash (and an encoded one) in an in-app path, as HyperStruct's rule does; make `mailto:` an
opt-in of `linkPolicy`, not the default.

**HyperStruct today.** Keeps its own renderer (O312); `strct-markdown-parity.spec.ts` runs its XSS and link cases
against both, and with HyperStruct's rule as `linkPolicy` the two link exactly the same set.

### BUG-58-09 — `strct-markdown`'s reader: tokens lost in lists and quotes, `snake_case` read as emphasis, unbounded work

**Seen** (each a spec in `strct-markdown-parity.spec.ts`, timings from the same suite):

- **Token templates do not reach nested blocks.** `blockRun` draws a list item or a quote with a nested
  `<strct-markdown [tree]>`, which has no `tokenDefs` — a claimed run (an object chip) is drawn as plain text in
  `- HV-NODE-01 is down` and `> HV-NODE-01 …`, and inside a paragraph as the chip. An assistant lists objects in lists.
- **An underscore inside a word opens emphasis.** The flanking test only looks at the next character, so
  `list_inventory for vm_cpu_usage` becomes `list<em>inventory for vm</em>cpu_usage`: tool names and counter codes
  lose their underscores, and so does raw HTML shown as text (`window.__x` → `window.x`). CommonMark's rule for `_`
  is that an intraword underscore neither opens nor closes.
- **Not bounded the way the comment says.** Each nested `parseInlines` call gets a fresh delimiter budget, and the
  closer and bracket searches scan to the end of the source. Measured, per read: `"*a "` × 64 KiB **1,622 ms**
  (× 200 KiB 5,332 ms), `"**a "` × 64 KiB 755 ms, `[` × 200 KiB 2,059 ms — HyperStruct's reader: 9.5, 12.6 and 229 ms.
  A streamed reply is read again on every token.

**Asked.** Pass the token templates (or the parent) to nested blocks; CommonMark's intraword rule for `_`; one
budget per document and scans bounded by it (or by a window).

### BUG-58-10 — `strct-product-switcher`'s rows lose their label, description and icon slots

**Seen.** The rows draw their content with `<ng-container *ngTemplateOutlet="rowBody">`. Projection matches the
top-level node — the `ng-container` — so `[strctDropdownItemLabel]`, `[strctDropdownItemDescription]` and
`[strctDropdownItemIcon]` all fall into the item's default slot. Measured in Chrome with HyperStruct's three products
and their health lines: the health line is drawn **beside** the name, on the label's line ("HyperStruct Manager
● 2 clusters · 1 host needs attention": the description box starts at x 210, level with the label; a 442 px menu),
the icon of the row without a line does not line up with the others', and at 390 px "Administration" is cut to
"Administr…" while "HyperStruct Manager" and its line wrap into a 57 px row. The `:has(.strct-dd__itemdesc)` column
rule never applies. (HyperStruct's pictures: `variant-switcher-*-1440.png`, `variant-phone-switcher-*-390.png`.)

**Asked.** Draw the row's parts directly in each branch (or project once, as BUG-58-07), and a visual baseline of
the open menu with descriptions.

**HyperStruct today.** Its own chip and menu, built from `a[strctDropdownItem]` (real links), the three row slots and
`data-accent` per row — the parts work when projected directly. Marked BUG-58-10.

### BUG-58-11 — `strct-command-palette`: a long tag still takes the last letters of a short name

**Seen.** 5.13.0 makes the tag yield by giving it a shrink factor of 20 against the label's 1. Shrinking is shared
by factor × base size, so the label still gives up its share: at 390 px, with a product badge and a tag of
"Virtual machines · DC-IST / CL-PROD-03 / HV-NODE-0012", the label "web-01" is drawn 47 px of its 49 and shows
"web-…" in three of six rows. The name is the thing searched for.

**Asked.** The label does not shrink while the tag has room to give (`flex-shrink: 0` on the label up to its content,
the tag `min-width: 0`), with the label ellipsising only once the tag is gone.

**HyperStruct today.** On a phone it moves the kind and the detail to the item's `description`, so the name and the
badge are drawn whole (the second line, 5.13.0 — a better phone layout than its old one, which dropped the detail).
Marked BUG-58-11.

### BUG-58-12 — Two more places where `--t3` is under AA (with BUG-58-04)

- The palette's active row (dark): the tag and the new description line, `--t3` #8d9197 on #272f3b — **4.26 : 1**.
- `strct-copy`'s label on a `variant="glass"` modal (light): #666666 on #e2e2e2 — **4.43 : 1**.

Measured with axe in Chrome; both were there before O327 and are the library's own colours. The success badge in the
same glass modal (light) is 3.85 : 1.

### FR-58-02 — `strct-product-switcher`: a header shade for the chip

**Need.** The chip sits on `--hdr`, dark in every scheme; the menu rows on `--bg-1`. `items[].tone` is one colour for
both. Measured (WCAG, HyperStruct's product tones): its page tones on the light `--hdr` are **2.45 – 2.93 : 1**, its
header tones on the light menu **2.48 – 2.78 : 1** — one tone fails 3 : 1 as a graphical object on one of the two
surfaces. 5.15.0's own token note says a header shade is a second value.

**Proposed.** `items[].headerTone` (the chip's icon), falling back to `tone`.

### FR-58-03 — `strct-markdown`: line breaks, bare URLs, and "opens in a new tab"

What HyperStruct's renderer does that `strct-markdown` does not (each a spec in `strct-markdown-parity.spec.ts`):

- a `breaks` input — a single newline as a line break, GitHub's comment style: a model writes "Host: X\nCPU: 40 %"
  meaning two lines;
- bare `https://` URLs as links (with trailing punctuation left out), not only `<…>` autolinks;
- an external link that says so to a screen reader (a visually hidden " (opens in a new tab)"), not only an
  `aria-hidden` icon.

## Added by HyperStruct O328 (adopting 5.9.0's list features) → BUG-58-13, BUG-58-14

**Date:** 2026-10-16 · **HyperStruct decision:** O328

O327 adopted 5.8 … 5.16 but missed the four items of `archive/hyperstruct-o260-lists.md`, because their workarounds
carried no marker. **A note on ids:** that document numbered its items FR-51-01 … 04 on its own, while
`archive/hyperstruct-assistant-chat.md` (O312) numbers FR-51-01 … 06 — two different FR-51-01s. HyperStruct now writes
the list items as "o260 FR-51-0x"; a future document should take its number from the README ledger.

HyperStruct adopted all four: `columns[].hidden` on its inventory lists and its VM network adapters (the
`strct-dg:<key>` seeds are gone), `sortValue` on every client-sorted size, percentage, time and duration column it
had formatted through a template (eighteen format-only templates deleted), unread values as `null` with `emptyText`, and
`exportValue` on its one exporting grid. The order of both exports and the CSV formula guard hold as described
(specs: the operator's column order, `"'=HYPERLINK(…)"`, `'@SUM(…)`, `'+cmd`). The remembered sort and "a saved
arrangement wins" do not, because nothing is restored — below. Measured as for the items above (the installed 5.16.0
in HyperStruct's vitest/jsdom suite).

Suggested order: BUG-58-13 (it loses what an operator saved, on every `stateKey` grid), then BUG-58-14.

### BUG-58-13 — `stateKey` restores nothing: the persisted state is read before the input is bound, then overwritten

**Seen.** `readPersistedState()` runs in `StrctDatagrid`'s constructor (`datagrid.ts` 3348, since 2026-07-17). A
signal input is bound after construction, so `this.stateKey()` there is still `null` for any grid whose `stateKey`
comes from a template — every real use. With `localStorage['strct-dg:k']` =
`{"widths":{},"hidden":[],"sortKey":"size","sortDir":"desc"}` set before
`<strct-datagrid [stateKey]="'k'" lazy [columns]="…">` (one column `hidden: true`) is created:

|                                               | Expected (5.9.0's CHANGELOG)       | Measured                                                         |
| --------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| The `hidden: true` column the operator showed | shown ("a persisted … state wins") | hidden                                                           |
| The first `(lazyLoad)`                        | `sortKey: 'size', sortDir: 'desc'` | `sortKey: null, sortDir: 'asc'`                                  |
| `strct-dg:k` afterwards                       | unchanged                          | `{"widths":{},"hidden":["note"],"sortKey":null,"sortDir":"asc"}` |

The persistence effect writes the defaults over what the operator saved, so it is lost, not only unapplied. This
predates 5.9 for widths, hidden columns and order: HyperStruct has sixteen `stateKey` grids and none has ever restored.
Its inventory lists showed it in the field: O260's seed (columns hidden only while the key was empty) held on the first
visit, and from the second visit on the VMs list showed all 26 columns (measured: the seed saw the key and stood back,
the library restored nothing and stored `hidden: []`). The 5.9.0 spec "remembers the sort with the rest of the column
state" binds `[columnState]` rather than reading storage, and "a column can start hidden" has no persisted state.

**Asked.** Read the persisted state where the input exists — the first run of an effect (or `ngOnInit`) — before the
declared-hidden, lazy and persistence effects act, and do not persist until it has been read. A spec that seeds
`localStorage` before the grid is created from a host template with a bound `stateKey`, and checks the hidden set, the
sort, the first `(lazyLoad)`, and that the key is unchanged.

**HyperStruct today.** `core/ui/datagrid-saved-state.ts` `savedColumnState(stateKey)` reads `strct-dg:<key>` once and
binds it as `[columnState]` on the two grids that declare hidden columns (the inventory lists and the VM network
adapters). Marked BUG-58-13; a guard spec asserts the library alone still restores nothing and fails when this ships.

### BUG-58-14 — A bound `columnState`'s sort reaches `(lazyLoad)` second, after an unsorted first ask

**Seen.** `<strct-datagrid lazy [columnState]="{ hidden: [], sortKey: 'size', sortDir: 'desc' }">` emits `(lazyLoad)`
twice on its first pass: `sortKey: null`, then `sortKey: 'size', sortDir: 'desc'`. The lazy effect is registered before
the `columnState` effect, so it announces the page before the bound sort is applied. A consumer that requests on
every ask sends the server an unsorted request first (then cancels it); 5.9.0's "restored before the first
`(lazyLoad)`" does not hold for a bound state either.

**Asked.** Apply a bound `columnState` before the first lazy announcement (register its effect first, or let the lazy
effect wait until state has been applied once); a spec on the emitted asks.

**HyperStruct today.** Its object lists coalesce the grid's asks of one turn (a microtask; the last ask wins), so the
first request carries the sort. Marked BUG-58-14.

**Also noted (not a bug).** The CSV guard prefixes any cell opening with `-`, so a negative number exports as `'-5`
(text). OWASP accepts the trade-off; HyperStruct exports no negative numbers today. A `numeric` column could be left
unguarded when its value is a finite `number` — worth a line in the export's documentation either way.

## Added by HyperStruct O329 (the CSV Files browser) → BUG-58-15 … 17, FR-58-04 … 06

**Date:** 2026-10-16 · **HyperStruct decision:** O329

HyperStruct rebuilt a volume's Files tab as a Finder-like browser on 5.16.0: `strct-toolbar` (Back · Forward ·
Enclosing folder), `strct-breadcrumb` with `interactive` crumbs, `strct-searchbox`, a data-mode `strct-tree` with
`[(expandedIds)]` and `(nodeToggled)` for the folders, `strct-list` for a quick list, `strct-datagrid` for the folder's
contents (comparators keep folders on top in both directions, read from a bound `columnState`), and a Get Info
inspector of `strct-section-header`, `strct-list-item`, `strct-progress` (meter mode), `strct-description-list` and
`strct-copy`. They carry the screen. Six things did not, each measured as for the items above (the installed 5.16.0 in
HyperStruct's vitest/jsdom suite; the DOM drawn in headless Chrome, arctic, with axe's `color-contrast`).

Suggested order: FR-58-04 (a file browser's core gesture), BUG-58-15, FR-58-06, BUG-58-17, FR-58-05, BUG-58-16.

### FR-58-04 — `strct-datagrid`: a row that activates (double-click, Enter), and single selection without a radio column

**Seen.** A file list selects on a click and opens on a double-click or Enter (Finder, Explorer, vCenter's datastore
browser). `selectionMode="single"` draws a radio in every row (`tbody input[type=radio]`: 2 of 2 rows) and the rows
carry no `tabindex`; there is no output for a double-click or for Enter on a row (`selectionChange`, `rowAction`,
`syncChange` … none is "activate"). `detailPane` has the row keyboard (`onPaneRowKeydown`: Enter opens the pane) but
collapses the list and binds Enter to the pane.

**Asked.** `selectionMode="single"` with `selectionColumn="none"` (or a `rowSelect` mode): the row is the control —
one roving tab stop, ↑/↓ move the selection (`aria-selected` on the row, `role="grid"` semantics), Home/End — and a
`(rowActivate)` output for a double-click and for Enter on the focused row, with the row. A spec for both.

**HyperStruct today.** `selectionMode="single"` (the radios are its keyboard path: ↑/↓ move the selection); its own
container turns a double-click on a row, and Enter on a row's radio, into "open" — folders only; files stay selected.
The row is found from a `[data-entry]` in the name cell. Marked FR-58-04 in `csv-files-view.ts`.

### FR-58-05 — `strct-tree` data mode: a trailing tag on a node

**Seen.** The content-mode node projects `[strctTreeTrailing]`; a data-mode node (`<strct-tree [nodes]>`) recurses
internally and has nowhere to put one. The browser's mockup tags a VM's own folder "VM" at the end of its row.

**Asked.** `StrctTreeNodeData.meta?: string` (quiet trailing text) or `tag?: { label; status? }`, drawn where
`[strctTreeTrailing]` is.

**HyperStruct today.** A VM's own folder takes the `vm` icon instead of `folder`. Marked FR-58-05.

### FR-58-06 — `strct-tree`: a lazy node ("has children, not loaded yet") and its loading state

**Seen.** `hasChildren` is `children.length > 0`; a node with `children: []` has no chevron and no `aria-expanded`
(measured), so a folder whose listing has not been asked for cannot be opened, and there is no "Reading…" row.

**Asked.** `StrctTreeNodeData.hasChildren?: boolean` (chevron and `aria-expanded` before `children` arrive; expanding
emits `nodeToggled` as now) and `loading?: boolean` (a spinner row under it, `aria-busy`), with a node that turns out
to be empty losing its chevron. A spec for both.

**HyperStruct today.** A folder not listed yet carries one placeholder child ("Not read yet" / "Reading…" / "Could not
be read", no `data`), replaced by its folders when the listing arrives. Marked FR-58-06.

### BUG-58-15 — `strct-toolbar` takes ← and → from a text field inside it

**Seen.** `<strct-toolbar><button id="a">…<input type="text">…<button id="b">…</strct-toolbar>`: with the caret inside
the field, ArrowLeft moved focus to `#a` (measured) instead of the caret. `onKeydown` roves across every focusable
control (`FOCUSABLE_SELECTOR`) and only skips one with `aria-expanded="true"` or inside a listbox, menu, dialog, tree
or grid. The APG toolbar pattern lets a text field keep its arrow keys.

**Asked.** Skip the roving when the event's target is a text-entry control (`input` other than button-like types,
`textarea`, `[contenteditable]`), or move only from the field's ends; a spec with a searchbox in the bar.

**HyperStruct today.** The searchbox sits beside the toolbar, not in it. Marked BUG-58-15.

### BUG-58-16 — `strct-empty-state`'s title is 15 px, off the type scale

**Seen.** `.strct-empty__title { font-size: 15px }` (`size="md"`). The library's text tokens are 12/13/14/16/22
(`--text-xs` … `--text-2xl`); 15 px is none of them, and HyperStruct's screens hold to that scale (its Chrome check
lists every size in use: the empty state's title is the only 15).

**Asked.** `--text-lg` (14) or `--text-xl` (16).

**HyperStruct today.** Left as the library draws it (the folder that could not be read). Marked BUG-58-16.

### BUG-58-17 — `strct-tree`'s active row is under AA on `--bg-2` (light)

**Seen.** axe `color-contrast` in Chrome, arctic light: `.strct-tnode__row--active > .strct-tnode__label` — `--acc`
#4a6b8f on `--acc-m` over `--bg-2` (#e3e8ed) — **4.49 : 1** at 13 px. On `--bg-1` the same row is 4.66 : 1. A tree in a
sidebar on `--bg-2` (the browser's mockup, a common layout) fails.

**Asked.** An active-row fill/label pair that clears 4.5 : 1 over `--bg-1`, `--bg-2` and `--bg-3` in all six schemes,
in the showcase's contrast gate.

**HyperStruct today.** The browser's folder pane is `--bg-1` instead of the mockup's `--bg-2`. Marked BUG-58-17.
