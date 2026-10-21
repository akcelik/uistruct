# A maintenance mode an operator can see at tree size → FR-61-01, FR-61-02

**From:** HyperStruct · **Version:** 5.28.0 · **Date:** 2026-10-21 · **HyperStruct decision:** O353

HyperStruct's operator: "When I put a host or a CSV into maintenance (drain), their icons don't change." For the host
the app does set `badge="maintenance"` in the inventory tree; for the CSV it did not (an app gap, fixed in O353). Even
where the badge is set, it does not do its job at 16 px:

- **It reads as `paused`.** `.strct-icon__badge--maintenance` keeps the base badge's `border-radius: 50%` and fills
  with `var(--warning)` — the same silhouette and the same hue as `paused` (the amber disc of 0.28.0). The only
  difference is the inner glyph: a 1.5-stroke path in a 16-unit box scaled to ~8 px, i.e. a ~0.7 px line. At 1× it
  is a smudge (rendered: `o353-preview-1x.png`, rows "host, badge=maintenance" vs "VM, badge=paused"). The 0.27.0
  promise — "states differ by outline silhouette … distinguishable for color-blind users even at 16px where the
  inner glyph is too small to read" — no longer holds for this pair since 0.28.0 moved `paused` to an amber disc.
- **It shares the one badge slot with health.** An object in maintenance with any open alarm, or an unreachable
  host, can show only one of the two. Maintenance is a _mode_ the operator chose (the object takes no new work);
  an alarm is _health_. Both are true at once, and the common case is exactly that: a host drained for patching
  that also has a disk-space warning.
- **It has no words.** The tree's icon is `aria-hidden` and the badge carries no text, so a screen-reader user gets
  no state at all — maintenance, alarm or power.

The previews below are the shipped 5.28.0 CSS (extracted from `fesm2022/akcelik-strct.mjs`) next to the proposal,
rendered in Chrome at the tree's 16 px icon, arctic light/dark plus a strip for all six schemes. They are kept with
HyperStruct's decision: `HyperStruct/docs/decisions/O353-preview-1x.png` (1×), `O353-preview-3x.png` (3×),
`O353-1x-pixels.png` (1× pixels enlarged) and the generator `O353-preview-gen.js` (Playwright + Chrome, the
library's CSS and tokens read from the package).

Suggested order: FR-61-01, then FR-61-02.

---

### FR-61-01 — `strct-icon [mode]`: a mode tile in its own corner (maintenance, entering maintenance)

**Seen.** As above: `badge="maintenance"` is an amber disc indistinguishable from `paused` at tree size, and it
competes with health for the single bottom-end slot. vCenter's convention for a host in maintenance mode is a mark on
the host glyph plus "(Maintenance Mode)" after the name; HyperStruct does the words itself (below) and asks the
library for a mark that reads at 16 px in both themes and does not displace health.

**Asked.**

1. **API.**

   ```ts
   export type StrctIconMode = 'none' | 'maintenance' | 'maintenanceEntering';
   // strct-icon
   readonly mode = input<StrctIconMode>('none');
   // StrctTreeNodeData
   mode?: StrctIconMode;   // passed to the node's icon like `badge`
   ```

   `maintenance` = the object is out of service on purpose (drained, takes no new work). `maintenanceEntering` = the
   operator asked for maintenance and the object is still being drained/evacuated.

2. **Slot.** Top-end corner: `position: absolute; inset-inline-end: -3px; top: -3px`. The health/lifecycle badge
   keeps the bottom-end corner, so the two never overlap at any size and **neither hides the other** — no
   precedence rule between mode and badge. (The `count` bubble also sits top-end; it is for glyphs like the bell,
   not objects. If both are set, `count` wins and dev mode warns once, as for an unknown icon name.)

3. **Shape and size.** A rounded **square tile** — the one silhouette no badge uses since 0.28.0 retired the
   square `off`. Side = 56 % of the icon size, `min 9px`, `max 12px` (16 px icon → 9 px, comfortable 18 px → 10 px,
   24 px → 12 px); corner radius ≈ 22 % of the side (2 px at 9 px). Ring `box-shadow: 0 0 0 1.5px var(--bg-1)`, like
   every badge, so it separates from the glyph it overlaps.

4. **Glyph.** Two parallel diagonal stripes, bottom-start → top-end (45°), butt caps — the "barrier/hatched" mark
   for _out of service_. In a 12-unit box: `M1.2 7.4L7.4 1.2M4.6 10.8L10.8 4.6`, stroke 1.25 units (≈1 px at 9 px,
   crisp at 1×). Rejected, rendered in the preview: a bar (reads as "remove"), a wrench (a smudge at 9 px — today's
   problem again).

5. **Colour — neutral, not a semantic hue.**
   - `maintenance`: fill `color-mix(in srgb, var(--t1), var(--bg-1) 10%)` (opaque — `--t1` is translucent and would
     show the glyph through the tile), stripes `var(--inv)`.
   - `maintenanceEntering`: the same tile **outlined**: fill `var(--bg-1)`, 1.5 px border and stripes in the same
     neutral. Hollow = "not there yet"; filled = "in".
   - Why not `--warning`: that is `warning` and `paused`. Why not `--acc`: in **ember** the accent (`#c49a6c` dark)
     sits beside `--warning` (`#c4b060`), in **sage** beside `--success` — the preview's last column shows it.
     The neutral is the one tone distinct from every semantic hue in all six schemes.
   - Measured contrast (WCAG 1.4.11 asks ≥ 3:1), tile vs `--bg-1` / stripe vs tile: arctic dark 11.1 / 13.0 ·
     arctic light 13.2 / 13.2 · ember dark 9.7 / 11.1 · ember light 8.2 / 8.0 · sage dark 9.2 / 10.7 · sage light
     8.0 / 7.8.
   - The tree's active row recolours the glyph to `--acc`; the tile keeps its neutral (badges do too).
   - Maybe a token: `--mode` / `--mode-ink` per scheme, defaulting to the values above, if you prefer a name over the
     mix.

6. **`badge="maintenance"` (back-compat).** Keep the value; draw it as `mode="maintenance"` (the tile, top-end)
   and leave the bottom-end slot to nothing, so existing consumers get the readable mark without a change. Document
   it as deprecated in favour of `mode`; remove in the next major.

7. **Text alternative.** When the icon is named (`ariaLabel` set), the mode's words join its name: "Host, in
   maintenance" / "Host, entering maintenance" (defaults overridable with `modeLabel` for i18n). In the tree, see
   FR-61-02.

**Acceptance.**

- At a 16 px icon in all six schemes: the tile is a square, top-end, 9 px, contrast ≥ 3:1 against `--bg-1` and its
  stripes ≥ 3:1 against the tile; filled vs outlined is distinguishable at 1×.
- `mode` + `badge="critical"` / `"warning"` / `"off"` / `"paused"` draws both, without overlap, at 14/16/18/24 px.
- `badge="maintenance"` draws the tile top-end and nothing bottom-end.
- `StrctTreeNodeData.mode` reaches the node's icon (data mode and content mode `<strct-tree-node mode>`).
- RTL mirrors the corner (`inset-inline-end`).
- Showcase: the Icons page's "Object state" group gets Maintenance / Entering maintenance next to the badges, and a
  tree example with a host that is in maintenance _and_ alarmed.

**Tests (suggested).**

- `icon.spec`: `mode="maintenance"` renders `.strct-icon__mode--maintenance`, not inside `.strct-icon__badge`;
  `mode` + `badge` render two elements; `badge="maintenance"` renders the mode element and no badge element;
  `count` + `mode` renders the count only and warns once in dev mode; `ariaLabel="Host"` + mode → accessible name
  "Host, in maintenance"; `modeLabel` overrides.
- `tree.spec`: a data node with `mode` and `badge` puts both on its icon.
- A style guard: the mode element's computed `border-radius` is not 50 % (the silhouette is the point).

**HyperStruct today.** The inventory tree maps a host in a maintenance window, a paused cluster node and (since O353)
a CSV in maintenance to `badge="maintenance"` — the closest value — under the same one-slot precedence as before
(alarm → unreachable → agent down → maintenance → power), and says it in the label: "HV-NODE-02 (Maintenance Mode)",
"Volume1 (Maintenance Mode)", "HV-NODE-03 (Node paused)", marked FR-61-01 in `shell/tree-node-state.ts`. When this
ships, maintenance moves to `mode` (and `maintenanceEntering` once the server reports the draining/evacuating phase),
leaves the badge precedence, and the label words go if FR-61-02 ships too.

---

### FR-61-02 — the tree says a node's state in words (badge and mode)

**Seen.** `strct-tree-node` renders `<strct-icon … [badge]>` without `ariaLabel`, so the icon and its badge are
`aria-hidden`. A treeitem's accessible name is its label alone: a running VM, a host with a critical alarm and a host
in maintenance all read the same. HyperStruct puts a few states into the visible label ("(Not reachable)",
"(Reboot required)", "(Maintenance Mode)"), which works but costs width in a narrow tree and cannot cover the badge's
health or power states.

**Asked.** The treeitem gets `aria-description` (it leaves the name — and type-ahead — untouched) built from its
icon's state: the mode's words, then the badge's: `maintenance` "In maintenance", `maintenanceEntering` "Entering
maintenance", `critical` "Critical", `warning` "Warning", `success` "Healthy", `info` "Information", `running`
"Running", `paused` "Paused", `off` "Off" (comma-joined: "In maintenance, Warning"). Defaults overridable per node:
`StrctTreeNodeData.stateLabel?: string` (`''` = say nothing, for a consumer that already puts the words in the label).
The same words as a `title` on the icon are optional (a hover hint for sighted users).

**Acceptance / tests.** A node with `badge="critical"` and `mode="maintenance"` has
`aria-description="In maintenance, Critical"` and an unchanged accessible name; `stateLabel: ''` removes the
attribute; a node with neither has none; axe passes on the showcase tree.

**HyperStruct today.** The label words above (marked FR-61-01). With FR-61-02 the tree can drop them, or keep only
"(Maintenance Mode)" because vCenter's operators expect it — HyperStruct's call, not the library's.
