# FR-48-13 … 17 — Headings and text

> **SHIPPED in 4.5.0 (2026-09-29)** — all five. `strct-section-header` is new; `strct-card-header`
> gained `heading` / `appearance` and the meta / note / actions slots; `strct-page-header` gained
> `level` / `size` / `icon` and `[strctPageHeaderTitleMeta]`; the four text utilities sit next to
> `.strct-mono`, with the caption slot on both `strct-toolbar` and the datagrid action bar; and
> `[strctCode]` styles inline code, with `copyable` composing the existing `strct-copy`.
>
> The acceptance that needed measuring: the tones clear AA in all six schemes — muted on `--bg-1`
> is 4.65–4.83:1 and overline 5.55–6.15:1, measured in Chrome with the translucent `--t2`/`--t3`
> tokens composited over their ground (reading the token colours alone reports nonsense).

**From:** HyperStruct · **Version:** 4.4.0. Part of [hyperstruct-hand-built-audit.md](hyperstruct-hand-built-audit.md).

These five are the largest source of hand-written CSS in the app: about 60 uppercase "eyebrow" rules in 40 files, and
147 inline muted paragraphs. Each is small; together they are why no two HyperStruct pages type the same.

---

## FR-48-13 — `strct-section-header` (new)

### Rule

**A page is made of titled sections, and a section title is a heading at the right level.** It has an optional one-line
description and optional actions at its end. `strct-page-header` is the page's `h1`; `strct-card-header` needs a card.
The section between the two has no component.

### What the app does today

- **Administration.** `src/styles.scss:67–77` defines `.adm-sec`, a 12px, 600-weight, uppercase `--t2` `h3`. It is used
  36 times in 18 files (backup, proxy, HA, recovery, update ×3, health ×3, time, network, logging, certificates ×6 …).
  The same thing is written locally as:
  - `.isf-sec-title` (identity-sources ×5) and `.whf-sec-title` (webhooks ×3), both with a bottom rule;
  - `.hpf-sec-h` (host-profiles), with an Add button at its end;
  - `.cdv-h`, `.up-det h4`, `.rl-detail-head`, `.as-guardrails-h` and `h5.px-sub`.
- **Object pages:**
  - object-detail.html:113 ("Contents" plus a count badge), :238, :340, :378, :422, :457 and :514, as inline 15px
    `h3`s;
  - mpp- and mvs-configuration-view `.cc-h / .cc-sub` and `.mc-h / .mc-sub`;
  - timeline-view.ts:78, vm-backup-card.ts:55 and vm-replication-panel.ts:79, as the same uppercase h3 plus lede
    copied three times;
  - object-updates.ts `.h3`;
  - dashboard.ts `.sub-h` ×3.
- **Grid titles.** vm-cluster-placement.ts:148 puts an eyebrow into a datagrid's action bar, because the grid has no
  title of its own (see FR-48-26).

### Proposed API

```html
<strct-section-header
  heading="Proxy"
  description="How the appliance reaches the internet."
  [level]="3"
>
  <strct-badge strctSectionHeaderMeta status="success">Tested</strct-badge>
  <button strct-button strctSectionHeaderActions size="sm" variant="outline">Edit proxy…</button>
</strct-section-header>
```

```ts
readonly heading = input.required<string>();
readonly description = input('');
readonly level = input<2 | 3 | 4 | 5 | 6>(2);
/** 'title' — sentence case, --text-md/600; 'overline' — uppercase, --text-xs/600, letter-spaced, --t2. */
readonly appearance = input<'title' | 'overline'>('title');
readonly divider = input(false, { transform: booleanAttribute });   // hairline under, like strct-page-header
```

- **Structure.** `level` sets the element (`h2`–`h6`). Appearance is independent of level, so the outline stays right
  whatever the look.
- **Slots.** `[strctSectionHeaderMeta]` follows the heading on its line. `[strctSectionHeaderActions]` goes to the end,
  following the `strctPageHeaderActions` precedent.
- **Spacing.** `--space-5` above, `--space-2` below, and the description under the heading in `--t3`.

### Accessibility

A real heading element at `level`, and the description as a paragraph. It must not use `role=separator`, which is why
`strct-divider` with a label does not fit.

### Acceptance

`appearance="overline" [level]="3"` renders an `h3` that looks like today's `.adm-sec`. `title` looks like the object
page's h3s. Actions sit at the end of the heading row and wrap under it on narrow screens.

---

## FR-48-14 — `strct-card-header`: heading, meta and actions slots

### Rule

**A card's header row is its name, a status, and what you can do with the card, in that order.** All three have fixed
places, so every card in an app lines up.

### What the app does today

`StrctCardHeader` has `icon` and one projected slot. Consumers therefore restyle whatever spans they project:

- object-detail/overview-board.css:58–115 styles `strct-card-header .title` (12px uppercase `--t2`), `.act` (a
  right-aligned, ellipsised note), `.grow`, and the Customize controls `.ctl` and `.handle`. They are used on every
  Overview card (overview-board.ts:151–204).
- csv-panel.ts:85, :139 and :205 put a hand-built uppercase header row inside `strct-card-block` (Capacity, Identity,
  Redirected access), with a badge or Rename button.
- administration/admin-summary.ts:98–107 puts `.sm-top` / `.sm-name` (title plus badge) and `.sm-go` (button) inside
  the block.
- host-profiles.ts `.hpf-sec-h` and assistant-settings.ts `.as-guardrails-h` are card headers without the card.

### Proposed API

```html
<strct-card>
  <strct-card-header icon="storage" heading="Capacity" appearance="overline">
    <strct-badge strctCardHeaderMeta status="warning">92% used</strct-badge>
    <span strctCardHeaderNote>read 2 min ago</span>
    <button strct-button strctCardHeaderActions size="mini" variant="flat">Rename…</button>
  </strct-card-header>
  <strct-card-block>…</strct-card-block>
</strct-card>
```

```ts
// strct-card-header (additions)
readonly heading = input('');
readonly appearance = input<'title' | 'overline'>('title');   // same meaning as FR-48-13
```

**Order:** icon · heading · `[strctCardHeaderMeta]` · flexible space · `[strctCardHeaderNote]` (`--t3`, ellipsised) ·
`[strctCardHeaderActions]`. With `heading` empty, the default slot renders as today.

### Acceptance

The Overview card header (eyebrow title, note, actions) renders from these slots with no consumer CSS. Existing headers
that project content are unchanged.

---

## FR-48-15 — `strct-page-header`: level, icon, and a slot beside the title

### Rule

**A page header can be the page's h1 or a pane's h2, and it can carry what kind of object the page is about and its
state.** Today it is always an `h1` at `--text-2xl`/700, with nowhere beside the title.

### What the app does today

- object-detail/object-detail.html:7–10 draws the object page's own 24px `h1` with the object-kind icon before it.
  `strct-page-header` has no icon.
- administration/admin-page.ts:124–131 draws every Administration page's header as an 18px `h2` with a state badge
  beside the title (all 31 pages). `strct-page-header` is an h1, and its actions slot goes to the far end.

### Proposed API

```ts
readonly level = input<1 | 2 | 3>(1);
readonly size = input<'page' | 'pane'>('page');   // pane: --text-lg/600
readonly icon = input('');
```

`[strctPageHeaderTitleMeta]` is projected right after the title, on its baseline.

### Acceptance

`level=2 size="pane"` renders an `h2` at 18px, and a projected badge sits beside the title. `icon="host"` renders the
icon before the title at the title's cap height. Defaults are unchanged.

---

## FR-48-16 — Text utilities: muted, hint, overline

### Rule

**A library that owns colour and type owns the three text tones every screen uses:**

- the explanation under a thing (muted);
- a small aside (hint);
- the label of a group (overline).

`.strct-mono` is the only text utility today. Every consumer therefore writes the other three.

### What the app does today

- **Muted paragraphs.** 147 inline `style="font-size:12.5px;color:var(--t3)"` occurrences in 36 files
  (host-configuration-view ×46, object-detail.html ×24), plus class copies (`.n`, `.nv-hint`, `.vc-dim`, `*-note`,
  `*-lede`).
- **Captions in datagrid action bars:**
  - domain-services.ts:145 `.ds-when`;
  - appliance-update.ts:226 `.up-usage`;
  - certificates.ts:488 `.ct-pki-hint`;
  - about 16 inline muted spans.
- **Overline labels** inside content:
  - "Summary" in seven wizard review boxes;
  - estate-overview `.stat .k`;
  - host-monitor `.mon-tile-k`.
- **Monospace.** 24 local copies of what `.strct-mono` already does. The app will remove them; this is not part of the
  FR.

### Proposed API

Global classes in the library's base styles, next to `.strct-mono`:

```scss
.strct-text-muted {
  color: var(--t3);
}
.strct-text-hint {
  color: var(--t3);
  font-size: var(--text-sm);
  line-height: 1.5;
}
.strct-text-overline {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--t2);
}
.strct-text-lede {
  color: var(--t2);
  font-size: var(--text-md);
  line-height: 1.55;
  max-width: 72ch;
}
```

The datagrid action bar and `strct-toolbar` get a `[strctToolbarCaption]` slot: muted and ellipsised, placed before the
spacer.

### Acceptance

The classes exist in all six schemes at AA contrast (`--t3` on `--bg-1`). The action bar caption sits on the button
row's baseline and ellipsises before the buttons wrap.

---

## FR-48-17 — An inline code token

### Rule

**A command, a path or an identifier in a sentence is set as code.** `strct-code` is a block, and `strct-kbd` means a
key on the keyboard.

### What the app does today

Hand-styled `<code>` (mono, `--bg-1` or `--bg-0`, padding, 4–5px radius) appears in:

- appliance-recovery.ts:89 `code.rc-cmd` and :132;
- appliance-backup.ts:304 and assistant-settings.ts:450;
- host-configuration-view.ts:3499 (`.hc-apply-note code`);
- object ids in cells: config-history.ts:77, scheduled-tasks-manager.ts:195, timeline-view.ts:181, and
  object-detail.html:169, :411 and :605.

### Proposed API

```html
Run <code strctCode>hyperstructctl doctor</code> on the appliance.
<code strctCode copyable>host-01m3e2e0000000000000000001</code>
```

A `[strctCode]` attribute directive styles an inline `<code>` (`--mono`, `--text-sm`, `--bg-2`, `--radius-sm`,
`0 .35em`). `copyable` adds a hover copy button reusing `strct-copy`.

### Acceptance

Inline code sits on the text baseline without changing line height. `copyable` copies the text and announces it with
the existing `strct-copy` feedback.
