# FR-48-01 … 04 — Selection and choice

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](hyperstruct-hand-built-audit.md),
which also covers how these proposals follow the library's conventions.

---

## FR-48-01 — `strct-datagrid`: single selection, a per-row lock, and select-all on a group

### Rule

**A grid a user picks from is the grid's own selection, whatever the number of picks.** Picking exactly one row, and
rows that may not be picked, are grid behaviour. They should not be a column of radios the consumer builds and wires
by hand.

### What the app does today

`selectable` is a boolean and always means multiple selection. So every "choose one" grid in HyperStruct wraps the
datagrid in a `strct-radio-group` and draws a `strctCell="pick"` column holding a `strct-radio`:

- shell/migrate-dialog.ts:183 (target host), :267 (target volume)
- shell/clone-dialog.ts:157 (folder), :186 (host), :243 (volume)
- shell/add-node-wizard.ts:177 (cluster)
- object-detail/object-detail.html:925 (deploy target host; `[disabled]="!row.deployable"`)

Row locking is done by hand as well:

- the wizard's server list (add-node-wizard.ts:214) uses a checkbox column in which some rows cannot join;
- the file browser (object-detail.html:1683) is a clickable `<div>` list with an inline selected background, no role
  and no keyboard access.

The roles editor (administration/roles.ts:199) builds its privilege picker as a bordered scroll box. Its category rows
carry a select-all checkbox and an "N selected" count, because datagrid group headers have no checkbox. The code never
sets `indeterminate`, so a half-selected category looks unselected.

What goes wrong with the workaround:

- Keyboard: arrows move within the radio group, not along the grid's rows.
- Clicking a row does not select it; only the radio does.
- The footer's "N selected" count and `(selectionChange)` do not apply.
- A locked row gives no reason.

### Proposed API

```ts
// strct-datagrid
/** 'multiple' (today's `selectable`) or 'single'. `selectable` stays as the boolean for 'multiple'. */
readonly selectionMode = input<'none' | 'multiple' | 'single'>('none');
/** Two-way single selection: the row id, or null. Pairs with selectionMode="single". */
readonly selectedId = model<string | number | null>(null);
/**
 * Whether a row may be selected. Return false to lock it, or a string to lock it and give the reason (shown as the
 * row's tooltip and in aria-description).
 */
readonly rowSelectable = input<((row: StrctRow) => boolean | string) | null>(null);
/** With groupBy and multiple selection: a tri-state checkbox on each group header. */
readonly groupSelect = input(false, { transform: booleanAttribute });
```

- **`selectionMode="single"`.** Draws a radio column: a native `input type=radio`, one `name` per grid. Clicking the row
  or pressing Space selects it. `selectedId` and `(selectionChange)` both fire, the latter with a one-element array, so
  existing listeners keep working. The footer count is hidden.
- **A locked row.** Its control is disabled and the row is not selectable by click or keyboard. It keeps its normal
  colours (a locked candidate is still worth reading), and its reason is a native `title` plus `aria-description`,
  following the FR-42-01 hint convention.
- **`groupSelect`.** Puts a checkbox in the group header row. It is checked when all selectable rows are selected,
  indeterminate when some are, and it ignores locked rows.

### Accessibility

- Single mode: the grid is `role="grid"` with `aria-multiselectable="false"`, and rows carry `aria-selected`.
- A locked row is `aria-disabled="true"` and stays reachable, so its reason can be read.
- The group checkbox is labelled "Select all in {group}" (a localizable `labels` entry).

### Acceptance

1. `selectionMode="single" [(selectedId)]`: clicking a row selects it and deselects the previous one. Arrow keys move,
   Space selects, and `selectedId` updates.
2. `rowSelectable` returning `'Agent too old'` renders that row disabled, with that text as its title. Clicking it
   changes nothing.
3. `groupBy="category" selectionMode="multiple" groupSelect`: the header checkbox selects every unlocked row of the
   group and is indeterminate when some are selected.
4. Defaults render exactly as 4.4.0.

### Retires in HyperStruct

Eight radio-column grids, the hand-drawn file list, the roles privilege picker, and assistant-settings.ts:173's
hand-built checkbox column.

---

## FR-48-02 — `strct-radio`: a card variant with a description

### Rule

**A choice between a few kinds of thing, each needing a sentence to explain, is a set of radio cards.** It has radio
semantics and a card look. A radio's label has no place for the explanation, and `strct-card [interactive][selected]`
has the look but not the semantics; the typings call the card "style-only".

### What the app does today

- administration/identity-sources.ts:144: `button.isf-type` provider tiles. Each has an icon, a name and a
  description; the selected tile gets an accent border and a `color-mix` tint.
- object-detail/mvs-hosts-wizard.ts:116: raw `<button>` cards. The selected one gets an accent border.
- object-detail/updates/remediate-wizard.ts:252: the plain fallback. A `strct-radio` whose projected label is a bold
  title plus a muted sentence.

The tiles are buttons, so screen readers hear two unrelated buttons and not one choice. Arrow keys do nothing.

### Proposed API

```html
<strct-radio-group [(value)]="kind" variant="card">
  <strct-radio value="ldap" icon="users" description="Active Directory or any LDAP v3 directory."
    >LDAP</strct-radio
  >
  <strct-radio
    value="oidc"
    icon="shield"
    description="Entra ID, Okta, Keycloak — any OpenID Connect provider."
    >OpenID Connect</strct-radio
  >
</strct-radio-group>
```

```ts
// strct-radio-group
readonly variant = input<'default' | 'card'>('default');
// strct-radio
readonly description = input('');   // secondary line, card or default variant
readonly icon = input('');          // card variant only
```

- **The card variant.** Each radio becomes a `strct-card`-like tile: `--bg-1`, `--b2`, `--radius-md`. The selected tile
  gets an `--acc` border and an `--acc-s` fill, and the native radio stays visible at the tile's start.
- **The grid.** Tiles lay out in an auto-fit grid, with a `--strct-radio-card-min` token set to 220px.
- **`description` without cards.** It also works on the default variant as a muted second line (see FR-48-04).

### Accessibility

The markup stays a native radio group: `role="radiogroup"`, arrow keys, and one tab stop. `description` is linked with
`aria-describedby`.

### Acceptance

Two card radios render side by side at ≥ 460px and stack below that. Arrow keys move the selection, the selected tile
shows the accent border, and the defaults are unchanged.

---

## FR-48-03 — `strct-tag`: an interactive body, a pill shape, a leading slot, mono

### Rule

**A tag is also the natural control for a thing you can reopen, and removing it is a separate act.** A minimised
window, a suggested prompt and a VM in a list are all short labelled things. The body opens the thing; the × removes
it. They should look like the library's tags, not like three hand-made pills.

### What the app does today

`strct-tag`'s body is a plain `<span>`, so it cannot be clicked, and its only output is `removed`. The app therefore
builds its own pills:

| Where                             | What                                                                           | Built from                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| shell/console-chips.ts:31         | A minimised console: status dot + monitor icon + VM name opens it; × closes it | `span.cc-chip` with two raw `<button>`s, 999px radius, own hover and focus ring |
| shell/ai-assistant.ts:64          | A suggested question the user can send                                         | `button.ai-chip`, 16px radius, hover lift                                       |
| object-detail/host-failover.ts:28 | VM names that would move or stay down; "stranded" is critical, "+ N" neutral   | `span.chip`, mono, `--bg-3`                                                     |
| object-detail/tags-card.ts:74     | Remove a tag from an object                                                    | raw `button.rm` "✕" beside the name                                             |

### Proposed API

```ts
// strct-tag (additions)
/** The body is a button: pointer, hover, focus ring, and (activated) on click / Enter / Space. */
readonly interactive = input(false, { transform: booleanAttribute });
readonly activated = output<void>();
readonly shape = input<'default' | 'pill'>('default');
readonly mono = input(false, { transform: booleanAttribute });
```

```html
<strct-tag
  interactive
  removable
  shape="pill"
  (activated)="restore(c)"
  (removed)="close(c)"
  removeLabel="Close the console of APP01"
>
  <strct-status-dot strctTagLeading status="success" size="sm" label="Connected" />
  <strct-icon strictName="monitor" [size]="13" strctTagLeading />
  APP01
</strct-tag>
```

- **Rendering with `interactive`.** The text part becomes a `<button type="button" class="strct-tag__body">` wrapping
  the leading content and the text. The remove button stays a sibling, so there are two tab stops and two clear
  targets.
- **Slot.** `[strctTagLeading]` projects before the text.
- **`shape="pill"`.** Uses `--radius-full` (or 999px if there is no token).
- **`mono`.** Uses `--mono`.

### Accessibility

- The body button's accessible name is the tag text. `removeLabel` already names the ×.
- Focus rings are visible on both.
- `disabled` disables both.

### Acceptance

1. `interactive`: click, Enter and Space emit `activated`, and a click on × emits only `removed`.
2. With a leading status dot and `shape="pill"`, the tag renders as today's console chip does, from tokens only.
3. Defaults are unchanged: body a `<span>`, 4px radius.

---

## FR-48-04 — A description line on `strct-checkbox`, `strct-toggle` and `strct-radio`

### Rule

**An option whose consequence needs a sentence carries that sentence as its description, tied to it for assistive
technology.** Today the sentence sits beside the control as loose text.

### What the app does today

The components project only their label, so the app wraps them in an outer `<label>` with a flex column and a muted
span. That nests a `<label>` inside the component's own `<label>`, which is invalid HTML and doubles the accessible
name. There are 42 such wrappers; the largest groups:

- host-configuration-view.ts ×10;
- object-detail.html ×5;
- cluster-formation-wizard.html ×4;
- add-node-wizard.ts ×3, clone-dialog.ts ×3, users-groups.ts ×3;
- validate-cluster-dialog.ts ×2 (category checkboxes with Microsoft's one-line description of each).

mvs-hosts-wizard.ts:278/296/301 attaches the reason a host cannot be chosen, and nothing links it to the checkbox.

### Proposed API

```ts
readonly description = input('');   // strct-checkbox, strct-toggle, strct-radio
```

```html
<strct-checkbox
  [(checked)]="network"
  description="The cluster networks, IP addresses and Windows Firewall."
  >Network</strct-checkbox
>
```

- **Rendering.** A muted (`--t3`, `--text-sm`) second line under the label, inside the component's own `<label>`.
- **Projected alternative.** An element marked `[strctControlDescription]` for rich text.

### Accessibility

`aria-describedby` points at the description. The label stays the accessible name.

### Acceptance

The description renders under the label, and clicking it toggles the control (it is inside the label). Axe reports no
nested-label issue, and the defaults are unchanged.
