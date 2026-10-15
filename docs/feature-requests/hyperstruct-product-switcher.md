# HyperStruct's product switcher on 5.6.1 → FR-52-01 … 06

**From:** HyperStruct · **Version:** 5.6.1 · **Date:** 2026-10-13

HyperStruct is now three products in one single-page application — HyperStruct Manager, HyperStruct Backup and
HyperStruct Site Recovery — on a shared platform (Administration) (HyperStruct decision O314, the operator's "option A":
a product switcher in the header). The header shows the product you are in as a chip beside the logo; the chip opens
the products you may use, each with a one-line health summary, and Administration after a divider; a thin line under
the header takes the product's colour; the rail and the sidebar menu are the product's. Products have their own accent,
independent of the operator's palette.

strct carried most of it — `strct-header`, `strct-dropdown` (menu semantics, roving arrows, Escape, focus return,
`menuitemradio` for the current product), `strct-rail`, `strct-section-menu`, `strct-badge`, `strct-status-dot`. The
items below are what the app had to write itself.

Each item names the local workaround, which is marked in HyperStruct's code with the FR id. "Measured" means a running
probe or spec; "read" means source only.

Suggested order: **FR-52-01** (the pattern itself), then **FR-52-03** (the token question every multi-product app hits)
and **FR-52-04** (smallest, most reused).

---

### FR-52-01 — `strct-header`: a product (app) switcher

**Where.** `layout/layout.ts` ~117–185 (read): the header is a flex row with a drawer toggle and one default slot.

**Need.** Every multi-product console — vCenter's Menu ▾, Nutanix Prism Central's app switcher, Microsoft 365, Atlassian —
puts "where am I, and where else can I go" next to the logo. HyperStruct builds it from `strct-dropdown` and a flat
`strct-button`: a chip (icon in the product's tone, the product's short name, a chevron) whose menu lists the products
(icon, full name, a status dot and one line of health), a divider, and the platform's entry. A person offered one
product sees a plain chip, not a menu of one.

**Proposed.** `strct-product-switcher` (or `strct-header-switcher`), projected into `strct-header`:

- inputs: `items: { id, label, name, icon, description?, status?, href?/routerLink? }[]`, `current: id`, `footerItems`
  (after a divider — the platform), `single` behaviour (plain chip when one item);
- the chip takes the current item's tone (FR-52-03) and keeps its label in the accessible name ("Backup — switch
  product"), the label collapsing to the icon below a width;
- rows are `menuitemradio`s (the current one checked), items are real links (middle-click, open in new tab);
- an `(opened)` output so the app reads the health lines lazily — the menu never waits for them.

**Acceptance.** Keyboard: Enter/Space/ArrowDown open, arrows rove, Home/End jump, Escape closes and returns focus to the
chip; a screen reader hears "menu", each product with its line, which one is checked.

**HyperStruct workaround:** `shell/product-switcher.ts` (FR-52-01), with its spec `shell/product-switcher.spec.ts`.

### FR-52-02 — `strct-header`: an accent line

**Where.** `layout/layout.ts` `.strct-header` (read): `border-bottom: 1px solid var(--b2)`; no input for a tone.

**Need.** The product you are in is said three ways: its name, its icon, and a thin line in its colour under the header.
The line has to keep the header's height (an extra border changes the layout under it).

**Proposed.** `strct-header [accent]` taking a colour token (or `--strct-header-accent`), drawn as a 3 px inset line at
the header's foot; none = today's border.

**HyperStruct workaround:** `shell/shell.css`, `strct-header.shell-hdr { box-shadow: inset 0 -3px 0 var(--prod-acc-hdr) }`
(FR-52-02).

### FR-52-03 — Secondary accents: product tones beside the palette

**Where.** `styles/_tokens.scss` (read): one `--acc` per palette × theme; `--hdr` is dark in all six.

**Need.** A product's tone must be independent of the operator's palette (arctic / ember / sage × light / dark): Manager
keeps the palette's accent, Backup is a green-teal, Site Recovery a violet. Each needs two shades — one for text and
badges on the page surfaces, one for the header. **Measured:** the palette's light-theme `--acc` is 2.67–2.85:1 on its
own `--hdr` (arctic `#4a6b8f` on `#1c2330` = 2.85:1), below the 3:1 a graphical object needs, so even Manager's header
tone has to be the palette's dark accent. And sage's accent is green, so a teal product tone has to shift towards cyan in
that palette to stay distinguishable (hue 191° against 145°).

**Proposed.** A documented way to declare named secondary accents (`--acc-<name>`, `--acc-<name>-hdr`, `-soft`, `-30`)
per palette × theme, with the library's contrast check (the one that guards `--acc`) run on them: ≥ 4.5:1 on `--bg-0/1/2`,
≥ 3:1 (better 4.5:1) on `--hdr`. Optionally `[data-accent="<name>"]` on any element remaps `--acc` and its derivatives
for that subtree, so every accent-toned component (badge, check mark, link, focus ring) follows without a cycle.

**HyperStruct workaround:** `src/styles.scss`, the O314 block — `--prod-*` tokens per palette × theme with their measured
contrast, and `[data-product]` subtrees mapping `--prod-acc` (FR-52-03).

### FR-52-04 — `strct-badge`: a custom tone

**Where.** `badge/badge.ts` ~20–95 (read): `status` is the five-tone union; the accent badge reads `--acc` and `--acc30`.

**Need.** Recent Tasks rows and triggered alarms carry a small product badge (Manager / Backup / Site Recovery) in the
product's tone — not a status: green, amber and red mean something else.

**Proposed.** `strct-badge [tone]` taking a colour token (text and border derived as for `accent`), or documented
`--strct-badge-fg` / `--strct-badge-border` custom properties.

**HyperStruct workaround:** the global `.product-badge` rule in `src/styles.scss` sets `--acc` / `--acc30` on an accent
badge; `shell/product-badge.ts` (FR-52-04).

### FR-52-05 — `strct-dropdown-item`: a description line

**Where.** `dropdown/dropdown.ts` ~327–465 (read): the item is a flex row with one default slot; `hint` is a tooltip.
`strct-combobox`'s `StrctOption` already has `description` (a secondary line under the label).

**Need.** A product row is "HyperStruct Backup" with "● 2 VMs past RPO" under it — two lines, the second quieter. The app
draws the two spans and their typography itself.

**Proposed.** `[strctDropdownItemDescription]` slot (or a `description` input) rendered under the label, `--text-sm`,
`--t2`, included in the item's accessible name after the label; a leading-icon slot that takes a tone.

**HyperStruct workaround:** `shell/product-switcher.ts`, `.ps-text` / `.ps-name` / `.ps-health` (FR-52-05).

### FR-52-06 — `strct-section-menu`: items that are real links

**Where.** `section-menu/section-menu.ts` (read): `StrctMenuLink` has `id`, `label`, `icon`, badges and dots; selection is
an output. `StrctRailItem` already has `routerLink` / `href` (real links: middle-click, open in a new tab).

**Need.** Backup's and Site Recovery's sidebar menus list the product's pages by name. Each is a page with its own
address; today a click emits `select` and the app navigates, so the entries cannot be opened in a new tab or copied as
links — the rail beside them can.

**Proposed.** `routerLink` / `href` on `StrctMenuLink`, rendered as an `<a>` with the menu's styling and `aria-current`
on the active one, `(select)` still emitted on plain activation — the rail's contract.

**HyperStruct workaround:** `shell/shell.ts` `goProductPage()` navigates on `(select)` (FR-52-06).
