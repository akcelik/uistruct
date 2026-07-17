# UIStruct v0.29.x — Navigation gaps (driven by the HyperStruct structural-consistency sweep)

Implementation-ready FRs for the two genuine gaps found while normalizing HyperStruct's
UI to "one object used identically everywhere" (2026-07-17). Both were validated against
the real component API in `@akcelik/strct/types/akcelik-strct.d.ts` (v0.29.0), not
assumptions. Each was a place we WANTED the house component but had to keep a bespoke
version (or a workaround) because the component couldn't express what the spot needed.

**House conventions to follow (match the existing library):**

- Standalone Angular components, **signal inputs** (`input<T>()` / `input.required<T>()`),
  two-way via `model<T>()`, events via `output<T>()`.
- Selectors: element `strct-*`; directives/slots `[strctXxx]`.
- Reuse the shared status union `StrctRailStatus` / `StrctStatus` — do NOT invent a new one.
- Theming via design tokens only (light/dark automatic). Accessibility: roles, `aria-*`,
  keyboard, `prefers-reduced-motion`.
- **Backwards compatible**: every new input is optional with a default that reproduces
  today's behavior. No existing call site should change meaning.
- Ship: component + exported types + unit tests + a docs/demo story.

---

## FR-NAV-01 — `StrctRail`: bottom-pinned items + per-item routing ★ blocks the app's primary nav

**Why:** `shell.html` builds the app's primary category switcher (Compute / VMs / Network /
Storage, with **Administration pinned to the bottom**) as raw `<a routerLink>` anchors +
custom CSS, because `StrctRail` today can't (a) pin an item to the bottom of the rail, and
(b) act as real navigation links (routerLink / href — so middle-click, ⌘-click and
open-in-new-tab work). This is the single remaining hand-rolled nav in the app; everything
else now uses the house objects. We deliberately did NOT force it into `StrctRail` (lossy),
and filed this instead.

**Current API (unchanged parts):** `[items] [(activeId)] [(collapsed)] [collapsible]
ariaLabel (select)`; `StrctRailItem { id, label, icon, badge?, badgeStatus?, disabled? }`.

**Additions**

1. **Per-item placement** — `StrctRailItem.placement?: 'top' | 'bottom'` (default `'top'`).
   Items with `placement: 'bottom'` render pinned to the bottom of the rail, in declaration
   order, separated from the top group by the rail's normal spacing (a subtle divider is
   fine). No new input needed — it's a field on the existing item model.

2. **Per-item routing (optional)** — `StrctRailItem.routerLink?: string | any[]` and
   `StrctRailItem.href?: string`. When `routerLink` (or `href`) is set, the item renders as
   an `<a>` (with `routerLink`/`routerLinkActive` or `href`), so keyboard/middle/⌘-click and
   open-in-new-tab work like a real link. `(select)` still fires on activation for callers
   that also want to run logic. When neither is set, the item stays a `<button>` and only
   `(select)` fires (today's behavior — unchanged).
   - If `routerLink` is set, the rail may use `routerLinkActive` to drive the active state
     automatically; `activeId` remains authoritative when provided (explicit wins).

**Acceptance**

- `[items]` with a `placement:'bottom'` item renders it pinned to the bottom in both
  expanded and collapsed states; tooltip on collapse still works.
- A `routerLink` item is a real `<a>`: right-click → "Open in new tab" works; ⌘/Ctrl-click
  opens a new tab without triggering the SPA handler; `(select)` still emits on plain click.
- Existing call sites (no `placement`, no `routerLink`) behave exactly as v0.29.0.

**HyperStruct adoption after ship:** replace the `shell.html` `.category-tabs` `<div>`/`<a>`
block with a single `<strct-rail [items]="categoryRailItems" [(activeId)]="railActive"
[(collapsed)]="railCollapsed" (select)="onRailSelect($event)" />`, where `categoryRailItems`
is `[{id:'compute',label:'Compute',icon:'host',routerLink:'/compute'}, …,
{id:'administration',label:'Administration',icon:'settings',routerLink:'/administration',placement:'bottom'}]`.
Delete `.tab-item` / `.tab-item--bottom` / `.category-tabs` CSS.

---

## FR-NAV-02 — `StrctSectionMenu` / `StrctMenuLink`: per-item badge + trailing indicator

**Why:** VM Settings' section rail (now `StrctSectionMenu`) needed two per-item cues that
`StrctMenuLink` can't express, so we lost/【worked around】them:

- an **"unsaved changes" dot** per section (worked around by appending a `•` to the label —
  a hack), and
- a **"restart required" trailing icon** per section (dropped; only the panel header shows it).

`StrctRailItem` already has `badge` + `badgeStatus`; `StrctMenuLink` should get the same
vocabulary so the two nav objects are consistent (which is the whole point).

**Current API (unchanged parts):** `[sections] [(activeId)] [collapsible] [showIcons]
ariaLabel (select)`; `StrctMenuLink { id, label, icon?, disabled? }`.

**Additions to `StrctMenuLink`** (all optional, default = today's render)

1. `badge?: string | number` — trailing count/label chip (e.g. a deviation count).
2. `badgeStatus?: StrctRailStatus` — badge tone; when the value is empty/undefined but a
   `dot` is desired, see (3).
3. `dot?: boolean` + `dotStatus?: StrctRailStatus` — a small trailing status dot with no
   text (our "unsaved changes" indicator). Reuse `StrctRailStatus` so Rail and SectionMenu
   share one status vocabulary.
4. `trailingIcon?: string` — an optional trailing icon name (our "restart required" glyph),
   rendered muted, after the label and before any badge/dot.

Rendering order in a row: `[leading icon?] label … [trailingIcon?] [badge? | dot?]`. Active
and disabled states style these consistently with the existing item states.

**Acceptance**

- A `StrctMenuLink` with `dot:true, dotStatus:'warning'` shows a small trailing warning dot;
  no layout shift vs a plain item.
- `badge:3, badgeStatus:'critical'` shows a trailing critical chip.
- `trailingIcon:'sync'` shows a muted trailing icon.
- Items with none of these render byte-identically to v0.29.0.

**HyperStruct adoption after ship:** in `vm-settings.ts` `navSections`, drop the `•`
label hack and set `dot: this.sectionChanged(s)` + `dotStatus:'warning'`, and
`trailingIcon: s.restart ? 'sync' : undefined`. In `host-configuration-view.ts` the
profile-drift count could move onto the section item's `badge`.

---

## Not in scope (already fine, or deliberately left custom)

- Datagrid density (compact vs full) is a HyperStruct usage decision, not a UIStruct gap.
- No-code/`<pre>` rendered-config remains the one documented `<details><pre>` exception.
