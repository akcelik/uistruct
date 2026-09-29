# FR-48-05 … 08 — Forms

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](hyperstruct-hand-built-audit.md).

---

## FR-48-05 — `strct-field`: side-by-side (label column) layout

### Rule

**A long settings form reads as two columns: what the setting is, and its value.** The label and its hint sit in a
fixed-width column, and the control sits beside them. Stacked fields suit short dialogs; a VM's forty-five settings
need the column.

### What the app does today

vm-settings.ts (VM ▸ Edit Settings) builds 45 rows from `.f / .f__l / .f__n / .f__h / .f__c / .f__val`, starting at
:479:

- a 220px label column holding the name, with a muted hint under it;
- the control on the right: range, toggle, select, number or read-only value;
- `.f--top` when the control is taller than one line.

`strct-field` only stacks label → control → hint (checked in `forms/field`), so none of these rows can use it. Its
`required`, `error` and `validationState` behaviour is therefore also lost.

### Proposed API

```ts
// strct-field
readonly layout = input<'stacked' | 'inline'>('stacked');
```

- **`inline`.** A CSS grid: `grid-template-columns: var(--strct-field-label-w, 220px) 1fr`.
  - The first column holds the label, the required mark and the hint under the label.
  - The second column holds the control and the error under it.
  - The control is centred on the label's first line, and `align-items: start` applies when the control is taller.
- **Narrow widths.** Below `--strct-field-inline-min` (a container query, 480px) it falls back to stacked.
- **Consecutive fields.** Inline fields in a row get a hairline between them (`--b1`). `[strctFieldGroup]` on a wrapper
  opts out.

### Accessibility

Unchanged: the label stays the `<label for>` of the control, and the hint and error stay in `aria-describedby`.

### Acceptance

Forty-five `strct-field layout="inline"` rows align their controls on one vertical line at 1200px and stack at 400px.
Error text appears under the control, not under the label.

---

## FR-48-06 — `strct-field`: prefix and suffix addons

### Rule

**A unit belongs to its value's box.** "MB", "%" and "s" read as part of the field, and so does a send button in a
message box.

### What the app does today

- object-detail/editable-settings.ts:266–278 puts a number input and then a muted `<span>` with the unit beside it,
  outside the box.
- shell/ai-assistant.ts:158 `.ai-input-row` / `.ai-send` draws its own bordered box around a textarea and a send
  button, because `strct-field` has no trailing slot.

### Proposed API

```html
<strct-field label="Minimum memory">
  <input strctInput type="number" [(ngModel)]="minMb" />
  <span strctFieldSuffix>MB</span>
</strct-field>

<strct-field label="Ask">
  <textarea strctInput rows="1" [(ngModel)]="text"></textarea>
  <button strct-button strctFieldSuffix variant="primary" iconOnly aria-label="Send">
    <strct-icon strictName="upload" />
  </button>
</strct-field>
```

- **Slots.** `[strctFieldPrefix]` and `[strctFieldSuffix]` render inside the control's border.
- **Box ownership.** The field takes over the border, radius and focus ring from the input (`:focus-within`). The inner
  control is borderless.
- **Text addons** use `--t3`; **button addons** keep their own look.

### Accessibility

A text suffix is joined to the input's description (`aria-describedby`), so a screen reader hears "Minimum memory,
MB". A button suffix is its own tab stop.

### Acceptance

The suffix sits inside the box, one focus ring covers input and suffix, and a textarea with a button suffix grows while
the button stays at the end. Fields without addons are unchanged.

---

## FR-48-07 — `strct-field`: a projected (rich) hint

### Rule

**A hint may name a thing in bold, or link to where to fix it.** `hint` is a string, so rich hints end up as loose
paragraphs that no longer belong to the field.

### What the app does today

- object-detail/object-detail.html:1071–1076 puts a muted `<p>` under the field with a negative top margin, so it looks
  like the field's hint while holding `<strong>`.
- mvs-hosts-wizard.ts:159–164 does the same.

Neither paragraph is in `aria-describedby`.

### Proposed API

```html
<strct-field label="Switch name">
  <input strctInput formControlName="name" />
  <ng-template strctFieldHint
    >Hosts that already have a switch named <strong>{{ name }}</strong> join it.</ng-template
  >
</strct-field>
```

A `[strctFieldHint]` template takes precedence over `hint`. It is rendered where `hint` renders and gets the same id
for `aria-describedby`.

### Acceptance

The projected hint renders in the hint's place and style and is announced as the control's description. A string
`hint` still works.

---

## FR-48-08 — `strct-datagrid`: select and number editors for editable columns

### Rule

**Rows of structured settings are edited in the grid.** A column whose value is one of a set is edited with a select,
not a free-text box.

### What the app does today

`StrctDatagridColumn.editable` is a text input only. host-profiles.ts:158–196 and :209–234 therefore build their rule
lists by hand:

- `.hpf-row` grids of raw `<select class="hpf-in">`, three per firewall row and two per service row;
- a raw "×" button per row;
- an Add button under the list.

The rows get no sorting and no keyboard model, and they look like no other list in the app.

### Proposed API

```ts
interface StrctDatagridColumn {
  // …
  editable?: boolean;
  /** Editor for an editable column. Default 'text' (today's behaviour). */
  editor?: 'text' | 'number' | 'select';
  /** Options for editor 'select'. */
  editorOptions?: { value: unknown; label: string }[];
}
```

- **`select`.** Renders `strct-select` in the cell while editing.
- **`number`.** Renders `strct-number`.
- **Commit and cancel.** The existing `(cellEdit)` output and the Enter / Escape behaviour are unchanged.

### Acceptance

A column with `editor: 'select'` shows the option's label at rest and a `strct-select` while editing, and commits on
choose. Text-editable columns are unchanged.
