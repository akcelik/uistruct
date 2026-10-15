# HyperStruct's search across products and its shell on a phone → BUG-53-01, FR-53-01 … 09

**From:** HyperStruct · **Version:** 5.6.1 · **Date:** 2026-10-13

HyperStruct is three products in one single-page application — Manager, Backup, Site Recovery — on a shared platform
(Administration), with a product switcher in the header (HyperStruct O314, UIStruct FR-52-01 … 06). Its follow-up
(HyperStruct O315) did two things this document is about:

1. **Global search across the products.** `strct-command-palette` now lists the inventory's objects (Manager), Backup's
   policies, Repository Nodes and VMs' backups, Site Recovery's recovery plans and replicated VMs, and Administration's
   pages — grouped by product, the product you are in first. The palette has no sections or badges, so the grouping is
   carried by order and by a product name at the start of each result's tag (FR-53-01 … 03).
2. **The shell on a phone.** At a 390 px viewport HyperStruct's header needed ~580 px. It now fits (measured in Chrome:
   `document.documentElement.scrollWidth` 390 at 390 px, light and dark): strct's own drawer toggle and off-canvas
   `strct-vertical-nav` carry the sidebar — and one bug in it blocked every tap (BUG-53-01); the rest is header density
   and an overflow menu the app had to draw (FR-53-04 … 09).

Each item names HyperStruct's workaround, which is marked in its code with the id. "Measured" means a running probe,
Chrome or a spec; "read" means source only.

Suggested order: **BUG-53-01** (a drawer whose own backdrop swallows its taps is unusable), then **FR-53-01** (sections
make a multi-source palette readable), **FR-53-06** (the header's overflow, which every app with more than four header
icons will need on a phone).

> **BUG-53-01 FIXED in 5.7.0 (2026-10-15).** The backdrop is drawn by `strct-shell`, which owns the
> open state, so it is no longer a fixed child of the transformed drawer. Measured in Chrome at
> 390px: the backdrop covers the whole 390×780 viewport, it is a child of `strct-shell` rather than
> of the nav, and a tap at the centre of a menu entry hits **the entry**, not the backdrop.
> HyperStruct's `.strct-vnav__backdrop` hide rule and its `app-nav-backdrop` can go.
>
> Still open: **FR-53-04, FR-53-06, FR-53-07, FR-53-09**.
>
> **FR-53-01, FR-53-02, FR-53-03, FR-53-05 and FR-53-08 SHIPPED in 5.13.0 (2026-10-15).**
>
> - Palette sections are `role="group"` + `aria-labelledby`, with `sectionOrder` for the product
>   you are in first; headings are not options and the arrows still cross every section. An item
>   takes a `badge` (`{ label, status?, tone? }`) before its tag and a `description` second line.
> - The tag yields its room to the label: measured at 390 px, the label draws whole (130 px) and
>   the tag ellipsises (61 px of 87) — it was the label that was cut.
> - `--strct-header-gap` / `--strct-header-pad`, with a 4 px / 6 px default below 600 px. Measured
>   at 390 px: the header stays 56 px and the page does not scroll sideways.
> - `strct-dropdown-group [label]` names a group of rows (`role="group"`, the label skipped by the
>   arrows).

---

### BUG-53-01 — `strct-vertical-nav`: on a phone the backdrop covers the drawer, not the page, and takes its taps

**Where.** `layout/nav.ts` (read; measured in Chrome 2026-10-13 at 390 px). Below 769 px `.strct-vnav` is
`position: fixed` with `transform: translateX(…)`, and its template renders `.strct-vnav__backdrop` (`position: fixed;
inset: 0; z-index: calc(var(--z-nav) - 1)`) **inside** the nav.

**What happens.** A transformed element is the containing block of its fixed descendants, so the backdrop's `inset: 0`
is the drawer's box, not the viewport; and inside the drawer's stacking context a positive z-index puts it above the
drawer's own (unpositioned) content. Result: the drawer is dimmed, the page beside it is not, and every tap on the rail
or the menu lands on the backdrop and closes the drawer. Playwright: `<div class="strct-vnav__backdrop"> intercepts
pointer events` for a click on a section-menu entry inside the open drawer.

**Fix.** Render the backdrop as a sibling of the nav (e.g. from `strct-shell`, which owns `mobileNavOpen`), or move the
transform to an inner wrapper so the nav itself is not a containing block for fixed children.

**HyperStruct workaround:** `styles.scss` hides `.strct-vnav__backdrop` below 769 px; `app-nav-backdrop`
(`shell/close-nav-on-navigate.ts`) draws one beside the drawer from `StrctShellService.mobileNavOpen` (BUG-53-01).

### FR-53-01 — `strct-command-palette`: sections

**Where.** `command-palette/command-palette.ts` (read): one flat `role="listbox"` of `role="option"` buttons; `group`
is a right-aligned tag on each item.

**Need.** A palette fed from several sources — a product's objects, another product's, the platform's pages — reads as one
undifferentiated list. Spotlight, VS Code's quick open, GitHub's command palette and vCenter's search all head each
group.

**Proposed.** `StrctCommandItem.section?: string` (or `sections: { id, label, items }[]`): items rendered in section
order under a heading; the listbox gets `role="group"` per section with `aria-labelledby` its heading; arrow keys still
move through every option across sections; headings are not options (never active, never picked); an optional
`sectionOrder` input.

**Acceptance.** A screen reader hears the group's name when the active option enters it; Home/End/arrows unchanged.

**HyperStruct workaround:** results ordered by product (`core/product/product-search.ts` `groupOrder`, the product you
are in first) and each tag starting with its product's name when the results span more than one product
(`paletteItems`) (FR-53-01).

### FR-53-02 — `strct-command-palette`: an item badge

**Need.** The product a result belongs to is HyperStruct's most important distinction in search (the same VM is three
results: its page in Manager, its backups, its replication). A tinted badge before the tag says it at a glance — the
product's tone, as `strct-badge` with an accent (FR-52-04).

**Proposed.** `StrctCommandItem.badge?: { label: string; status?: StrctBadgeStatus; tone?: string /* a colour token */ }`,
drawn before the group tag, `aria-hidden` with the label also in the option's accessible name.

**HyperStruct workaround:** the product's name as the tag's first word (FR-53-02).

### FR-53-03 — `strct-command-palette`: the tag must not take the label's room

**Where.** `.strct-cmdp__group { flex-shrink: 0 }` (read; measured at 390 px).

**Need.** A long tag ("Site Recovery · Recovery plan · PROD → DR") on a narrow palette leaves the label "Paym…" — the
name, the thing searched for, is the part cut. Either the tag shrinks (ellipsis) before the label does, or the item
gets a second line (`description`) the tag can move to.

**Proposed.** `.strct-cmdp__group { flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis;
max-width: 55% }`, and `StrctCommandItem.description?: string` drawn as a muted second line.

**HyperStruct workaround:** below 601 px the tags keep only the kind (no location, no detail) (FR-53-03).

### FR-53-04 — `strct-shell`: close the mobile nav when a choice in it navigates

**Where.** `layout/layout.ts` `StrctShellService.mobileNavOpen` (read).

**Need.** On a phone the drawer holds the navigation; choosing an entry opens a page — behind the drawer, which stays
open. Every app with a router writes the same subscription.

**Proposed.** `strct-shell [closeNavOnNavigate]` (default true when a Router is present), or `StrctShellService.closeNav()`
plus documentation of the pattern.

**HyperStruct workaround:** `CloseNavOnNavigate` directive inside `strct-shell` (`shell/close-nav-on-navigate.ts`)
closing on every `NavigationEnd` (FR-53-04).

### FR-53-05 — `strct-header`: density below a width

**Where.** `.strct-header { gap: 14px; padding: 0 18px }` (read).

**Need.** Seven 32–36 px triggers fit 390 px only with a tighter gap and padding. A breakpoint density (or tokens
`--strct-header-gap`, `--strct-header-pad`) keeps apps from overriding the library's selector.

**HyperStruct workaround:** `shell.css`, `strct-header.shell-hdr { gap: 4px; padding: 0 6px }` below 601 px (FR-53-05).

### FR-53-06 — `strct-header`: actions that move into an overflow menu on a phone

**Need.** A console header carries more icons than a phone has room for (HyperStruct: Create, Search, Assistant, Drift,
Alarms, Account). The ones that are menus or simple commands can move into a "More" menu below a width; the ones that
open their own popover (drift, alarms, account) stay. Today every app draws two copies and toggles them with media
queries.

**Proposed.** A `strctHeaderAction` directive with `overflow="never" | "phone"` and a label, and a header "More" menu the
header renders below a breakpoint holding the `phone` actions as `strct-dropdown-item`s.

**HyperStruct workaround:** `shell.html` draws the Create menu and the assistant twice — `.shell-wide` items and a
`.shell-narrow` "More" `strct-dropdown` — toggled in `shell.css` at 600 px; the account button hides its name and
chevron (`shell/user-menu.ts`) (FR-53-06).

### FR-53-07 — `strct-vertical-nav` as a drawer: width, focus, a close control

**Where.** `layout/nav.ts` (read).

**Need.** (1) The drawer takes the nav's width, which an app sets for the desktop (HyperStruct's is resizable up to
600 px); on a phone it must not exceed the viewport less a margin to tap away. (2) Opening it does not move focus into
it, and closing does not return focus to the toggle; there is no `aria-modal` and no focus containment. (3) It has no
close control of its own (Escape and the backdrop only).

**Proposed.** A `drawerMaxWidth` (default `calc(100vw - 48px)`) applied only in drawer mode; focus the first focusable
on open and the toggle on close (`keepTabInside` already exists); an optional close button at the drawer's top.

**HyperStruct workaround:** the nav's width bound as `min(<width>px, calc(100vw - 48px))` (`Shell.navWidth`) (FR-53-07).
Focus and the close control are not worked around.

### FR-53-08 — `strct-dropdown`: a group label

**Need.** A menu holding two kinds of items (HyperStruct's phone "More": the product's create actions, then the
assistant) can only separate them with a divider. A non-interactive label (`role="presentation"` heading text, or
`role="group"` + `aria-label`) says what a group is.

**Proposed.** `<strct-dropdown-group label="Create">…</strct-dropdown-group>`.

**HyperStruct workaround:** the create items carry their own verb ("New backup policy…") in the phone menu
(`CreateAction.overflowLabel`) (FR-53-08).

### FR-53-09 — product switcher (FR-52-01): a short label below a width

**Need.** FR-52-01 proposed that the chip's label collapses to its icon below a width. Measured on a phone, the icon
alone does not say where you are — "Site Recovery" and "Backup" icons are not self-evident — while a short word fits
(the chip at 110–128 px: "Manager", "Backup", "Recovery", "Admin").

**Proposed.** Items take `shortLabel`; the chip shows it below the breakpoint, the full label staying in the accessible
name.

**HyperStruct workaround:** `shell/product-switcher.ts` draws `.ps-chip-label` and `.ps-chip-short` and toggles them at
600 px (FR-53-09).
