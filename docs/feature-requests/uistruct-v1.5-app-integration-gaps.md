# UIStruct v1.5.x — gaps found adopting 1.5.0 in HyperStruct (2026-07-21)

> **RESOLVED in 1.10.2 (2026-07-22).** All three FRs below shipped: `strct-dropdown`
> gained `popover`, `strct-command-palette` gained `filter`, `strct-code` gained `wrap`,
> and a `StrctIconName` type now exists. HyperStruct adopted `popover` (deleting the
> hand-rolled strctOverlay workaround on two pages) and re-enabled `wrap` on the CSR blocks.
>
> **One follow-up remains** — see the icon note at the bottom: `StrctIconName` is
> `keyof … | (string & {})`, so a wrong name (e.g. `shieldCheck`) still compiles. The
> ask was for a wrong name to be a COMPILE error, which needs the union WITHOUT the
> `string` escape hatch (or a separate strict type). Filed as FR-16-01 below.

Written after sweeping the whole 1.5.0 surface (104 components) against HyperStruct's
hand-rolled UI and adopting everything that already fit. **1.5.0 closed two of our
long-standing local components outright** — `strct-copy` and `strct-code` replaced
`app-copy` and `app-code`, both of which had been written with UIStruct-shaped APIs
specifically so they could be upstreamed. They are now deleted from the app.

What follows is only what did **not** fit. Every claim below was checked against
`@akcelik/strct/types/akcelik-strct.d.ts` and the built `fesm2022` bundle at v1.5.0,
not against memory — including the two places where I expected a gap and found none.

**House conventions assumed** (unchanged from the v0.29 FR): standalone components,
signal inputs (`input<T>()`), two-way via `model<T>()`, events via `output<T>()`;
element selectors `strct-*`, slot/directive selectors `[strctXxx]`; design tokens only;
every new input optional with a default that reproduces today's behaviour.

---

## FR-15-01 — `StrctDropdown`: a popover mode that does not close on inner clicks ★ cost us a bug

**What happened.** We built a filter panel — a couple of selects and a text input — behind a
`strct-dropdown` trigger. Choosing a severity **closed the panel before the value registered**.
The panel template binds `(click)="close()"`, which is exactly right for a menu of
`strct-dropdown-item`s and exactly wrong for anything with a form control in it.

There is no way to opt out: `StrctDropdown`'s only input is `align`.

**What we had to do instead.** Drop to `[strctOverlay]` and hand-roll the rest: an open
signal, a backdrop element positioned as a _sibling_ of the panel (so an inner click can never
reach the closing handler), an Escape binding, and the aria wiring. That is ~25 lines of
template plus a signal, repeated per page, to get a popover — while the library already owns
the positioning, the flip-near-viewport-edge logic and the trigger.

**Asked for:**

```html
<strct-dropdown popover>
  <!-- or: [closeOnSelect]="false" -->
  <button strct-button strctDropdownTrigger>Filters</button>
  <strct-field label="Severity">…</strct-field>
</strct-dropdown>
```

- `popover` (or `closeOnSelect`, defaulting to today's behaviour) suppresses the
  close-on-inner-click only. Outside click and Escape still close.
- Ideally the menu semantics follow: `role="menu"` today, `role="dialog"` in popover mode,
  since a panel holding form controls is not a menu to a screen reader either.

**Why the library and not the app:** every consumer that wants a filter/settings popover hits
this, and the workaround silently loses the aria treatment the component already gets right.

---

## FR-15-02 — `StrctCommandPalette`: expose the query so it can back onto a server ★ blocks adoption entirely

**What happened.** `strct-command-palette` is exactly the shape of HyperStruct's global
inventory search — ⌘/Ctrl-K, ARIA combobox/listbox, arrow keys, focus restore. We could not
use it, and wrote the panel by hand instead.

The blocker: the palette **owns its query internally** (`protected readonly query`) and filters
the `items` array itself. There is no input, output or model for the text. So it can only ever
search a list the caller has already loaded.

Our search is server-side and RBAC-filtered: results depend on who is asking, the corpus is
thousands of objects, and the query has to reach the API. There is no version of "pass it
`items`" that works.

**Asked for:** make the query two-way, so a consumer can serve results asynchronously.

```html
<strct-command-palette
  [(open)]="paletteOpen"
  [(query)]="q"          <!-- NEW: model<string>() -->
  [items]="results()"    <!-- caller supplies, already filtered -->
  [filter]="false"       <!-- NEW: opt out of internal filtering -->
  (picked)="go($event)" />
```

- `query` as `model<string>('')` — the palette still owns typing and keyboard behaviour; the
  consumer just gets to see the text.
- `filter` (default `true`) so the existing static-list use is untouched; `false` means "render
  `items` in the order given, I have already filtered them".
- With both, a server-backed palette is ~15 lines and the library keeps the accessibility.

**Note on `maxResults`:** with `filter: false` it should still cap rendering, not selection.

---

## FR-15-03 — `StrctCode`: soft-wrap for long unbroken technical text

**What happened.** `strct-code` replaced our `app-code` cleanly except for one input we had and
it does not: `wrap`. The component sets `white-space: nowrap`.

Our use is PEM / CSR blocks inside a modal. PEM breaks at 64 characters so it mostly survives,
but a single-line CSR, a base64 thumbprint or a long command becomes a horizontal scroll inside
a dialog — the one place horizontal scrolling is most painful, because the dialog itself does
not scroll with it.

**Asked for:** `wrap` (default `false`, i.e. today's behaviour).

```html
<strct-code [code]="csr.csr_pem" copyable wrap />
```

Implementation is `white-space: pre-wrap; overflow-wrap: anywhere;` on the `pre`. `anywhere`
rather than `break-all` so ordinary prose in a code block still breaks at spaces.

---

## Checked and NOT a gap (recorded so nobody re-investigates)

- **`StrctFilterBar`** — fits our use exactly. Adopted on two pages; the bar rendering state and
  announcing intent, with the consumer owning the filtering, is the right split. No changes wanted.
- **`StrctSearchbox`** — replaced ~40 lines of local CSS (pill, leading icon, clear button, hint
  chip) with no loss. The `hint` input covering the ⌘K chip was the detail that made it a drop-in.
- **`StrctInputOtp`** — used for both the sign-in code and enrolment confirmation. Paste handling
  and per-box navigation out of the box; nothing missing.
- **`StrctOverlay`** — correct as a primitive. FR-15-01 is not a complaint about it; it is that
  every consumer should not have to descend to it for a common pattern.
- **`StrctPageHeader`** — new in 1.5.0 and it does cover our six hand-styled `<h2>` headers. Not
  an FR: an adoption task on our side.

---

## Icon-set note (not an FR, a docs request)

`shieldCheck` does not exist and we used it — it rendered nothing, in the one state the UI
existed to show ("two-factor authentication is on"). An invented icon name fails silently, which
makes it look like a styling quirk rather than a bug.

Two things would help consumers:

1. A published, greppable list of icon names in the docs (or an exported `STRCT_ICON_NAMES`
   union type, so a wrong name is a **compile** error rather than an empty box).
2. In dev mode, `strct-icon` warning once on an unknown name.

The type-level version is the strong one: it moves the whole class of mistake to build time.

---

## FR-16-01 — `StrctIconName`: make a wrong icon name a compile error (follow-up)

1.10.2 added `StrctIconName` and typed `StrctIcon.name` as `StrctIconName | (string & {})`.
The `(string & {})` half preserves autocomplete while still accepting any string, which is a
reasonable default — but it means the original problem is only half solved. `shieldCheck` (a name
that does not exist) still compiles and renders nothing, exactly as before.

**Asked for:** a way to opt into strictness, so an unknown name fails the build.

Either:

- a second, strict overload / input (`[strictName]`) typed as `StrctIconName` alone, or
- export the bare `StrctIconName` union so consumers can annotate their own icon constants with it
  and get the error at their call site.

The escape hatch is the right default for the component; consumers who want the guarantee just need
a way to ask for it. HyperStruct would use it on every `strct-icon` — an invented name silently
rendering nothing cost us a bug (the two-factor status shield) that a compile error would have
caught instantly.

---

## Adoption note — `StrctLogViewer` deliberately NOT adopted (2026-07-22)

Evaluated during the 1.10.2 sweep and left unused, recorded so it is not re-investigated.

`StrctLogViewer` is a virtualized plain-text log tail (`lines: string[]`, follow mode). Its value is
100k-line virtualization + follow. HyperStruct has no surface that shape:

- The only multi-line log (cluster rolling-update **Activity log**) is STRUCTURED — timestamp +
  level badge + message per row. Rendering it as `string[]` would drop the badges, which are the
  point.
- The other "raw" fields (host patch `fc.raw`) are a few words — a result code like `dism=ok` /
  `wusa=3010`, not a stream. Virtualization is irrelevant.

We do NOT stream raw DISM/WUA output to the UI at all today; the agent returns only the summary
code. If that changes (surfacing full patch output for diagnosis), `StrctLogViewer` becomes the
right component and this note should flip to an adoption task. Until a real long-log need exists,
inventing one just to use the component would be backwards.

---

## FR-16-02 — `StrctDatagrid`: a global quick-filter box (all columns, one input)

**Found:** 2026-07-22, adding "quick search" to the inventory grids (Hosts / VMs / Port
groups / Datastores) and the Permissions grid.

1.10.2's `StrctDatagrid` has excellent **per-column** filtering (`[filters]`, the
per-column popover: contains-text / option-set). What it lacks is the console-standard
**single quick-filter input** — one box that substring-matches across every visible
column at once, the "filter this list fast" affordance vCenter/Grafana/every admin table
has at the top of the grid.

Per-column filtering answers "show me rows where _Type_ = host"; the quick filter answers
"show me anything matching `db-prod`" without the operator first deciding which column.
They're complementary, and consoles ship both.

**Asked for:** a first-class quick filter owned by the grid. Feeding the grid a
pre-filtered `[rows]` (the stopgap below) _does_ keep paging and the footer count correct —
the grid pages whatever array it's given. What the external approach can't do:

- **every consumer re-implements it** — the searchbox, the substring match, the
  column-scan choice, the placement in the action bar. A `[quickFilter]` collapses that
  to one input.
- **no "filtered from N total" indicator** — the grid only sees the filtered array, so it
  can't show "12 of 480". The built-in, filtering _after_ it receives full rows, can.
- **selection identity across filter changes** — swapping the `[rows]` array churns the
  grid's selection/expansion bookkeeping; a term the grid owns filters the view without
  replacing the row set.

Concretely, either:

- an input `[quickFilter]="q()"` (two-way `quickFilterChange`) that the grid applies before
  paging in client-side modes, plus an opt-in built-in searchbox slot
  (`[quickFilterable]`) rendered in the action bar; or
- expose the existing `filteredRows` pipeline to accept a free-text term alongside the
  per-column `filters`, with `matchesFilters` OR-ing across columns for that term.

A `quickFilterFields?: string[]` (default: all columns' `key`) would let a consumer restrict
which columns the term scans (e.g. skip a base64 `moref`).

**Stopgap in HyperStruct meanwhile:** a `StrctSearchbox` in the `[strctDatagridActionBar]`
slot driving a `filteredRows` computed that substring-matches the visible columns, feeding
`[rows]`. Paging/footer stay correct (the grid pages the filtered array), but it's the same
~10 lines copied onto every grid, with no "filtered from N" count and a selection reset on
each keystroke — the ergonomics the built-in would own.

---

## FR-16-03 — `StrctTimeRangePicker`: a `[size]` input to match `size="sm"` toolbars

**Found:** 2026-07-22, placing the picker in the Monitor toolbar next to two
`strct-button size="sm"` controls (Live, Refresh).

The picker's trigger is a hard-coded `<button strct-button variant="neutral">` with **no
`size`** — so it always renders at the default button height. In a toolbar of `size="sm"`
buttons it stands ~4–6px taller, breaking the "one strip of equal-height controls" line.

Consoles put this picker _in_ a dense toolbar (that's its whole habitat), so it needs to
size with its neighbours. **Asked for:** a `[size]` input (`'sm' | 'md'`, default `'md'`)
forwarded to the trigger `strct-button`'s `size`, so `<strct-time-range size="sm" />` lines
up with `size="sm"` buttons.

**Workaround meanwhile:** dropped `size="sm"` from the surrounding buttons so all three sit
at the default height — consistent, but forces the whole toolbar up a size instead of the
picker down to sm.

---

## FR-16-04 — `StrctDatagrid`: quick-filter placement in the toolbar (align end)

**Found:** 2026-07-22, right after spreading `quickFilterable` across HyperStruct's grids.

The built-in quick-filter box renders **first** in `.strct-dg__toolbar`, so on any grid
with a projected action bar (Add / Edit / Delete / Revoke…) the search box sits LEFT of
the action buttons. Console convention is the opposite: action verbs lead on the left,
view controls (search/filter) sit at the far right — vCenter, Grafana and GitHub lists
all do this, and it keeps the box in a stable position across grids whose button sets
differ.

**Asked for:** either flip the default (box at the end: `order`/`margin-inline-start:auto`
on `.strct-dg__quickfilter` + note), or a `quickFilterAlign: 'start' | 'end'` input
(default `'end'`) if someone depends on the current order.

**Workaround meanwhile (app-global CSS):**

```css
.strct-dg__toolbar .strct-dg__quickfilter {
  order: 2;
  margin-inline-start: auto;
}
.strct-dg__toolbar .strct-dg__filternote {
  order: 3;
}
```

Works, but it re-styles framework internals by class name — exactly the coupling the
design tokens are meant to avoid; a version that renames those classes silently breaks it.

---

## FR-16-05 — `StrctInputOtp`: `autofocus` + a public `focus()`

**Found:** 2026-07-22, on the login second-factor step.

When the OTP step appears (password accepted → code asked), the operator's next action is
always the same: type the 6 digits. Today the first box must be CLICKED first — the
component keeps `focusBox` private and exposes no `autofocus` input, so a consumer can't
put the caret there without reaching into the DOM
(`el.querySelector('input')?.focus()` from a `viewChild(..., {read: ElementRef})`), which
is what HyperStruct's login now does as a workaround.

**Asked for:**

- `autofocus` (default `false`): focus box 0 on first render — covers the "step just
  appeared" case declaratively.
- public `focus(index = 0)`: for programmatic refocus — e.g. after a rejected code the
  consumer clears the value and wants the caret back on box 0 for the fresh attempt.

Both are a few lines around the existing private `focusBox`; the DOM-reach workaround
breaks silently if the component's internal markup changes.

---

## FR-16-06 — `StrctInputOtp`: digit grouping (`nnn – nnn`)

**Found:** 2026-07-22, styling the login second-factor step.

Six identical boxes in a row read as one undifferentiated blob; authenticator apps
display the code as TWO groups of three, so the operator transcribes it in threes.
A `groupSize` (or `groups`) input that splits the boxes with a small gap + separator
glyph would mirror what the operator sees on their phone.

**Asked for:** `groupSize?: number` (default 0 = no grouping): every `groupSize` boxes,
insert a visual separator (gap + an en-dash span, `aria-hidden`). Layout knobs stay the
consumer's (the host is display:inline-flex today; a `block`/full-width mode could ride
along or stay CSS).

**Workaround meanwhile (app-global CSS, login-scoped):** flex + `justify-content:
space-between; width:100%` on `.strct-otp`, extra `margin-inline-start` on box 4, and an
absolutely-centered `::after { content: "–" }` dash. Breaks silently if the internal
class names change — same caveat as every internals-coupled override.

---

## FR-16-07 — `StrctDatagrid`: the loading skeleton is invisible on the dark theme

**Found:** 2026-07-22, after wiring `[loading]` across all of HyperStruct's grids — the
operator's report was literally "I see 5–6 EMPTY rows while it loads", which is the
skeleton rendering without reading as one.

`.strct-dg__skeleton-block` is `background: var(--bg-3)` with an opacity pulse. On the
dark theme `--bg-3` (#23282f) sits ~one step from the cell background, so the bars are
near-invisible and the five skeleton rows look like blank rows — the state reads as
"broken/empty", the opposite of its purpose.

**Asked for** (★ operator explicitly asked for this to be a FRAMEWORK feature, not an
app override): make the default skeleton unmistakably a loading state.

Concretely:

- **Default sweep**: `.strct-dg__skeleton-block` becomes a moving gradient —
  `linear-gradient(90deg, var(--bg-3) 25%, var(--skeleton-hi, var(--acc18)) 50%,
var(--bg-3) 75%)`, `background-size: 200% 100%`, `background-position` animated
  ~1.1s linear infinite. A new `--skeleton-hi` token (default `--acc18`) lets themes
  tune the highlight without a CSS override.
- **`prefers-reduced-motion: reduce`**: no animation, static `--skeleton-hi` bar —
  still clearly distinct from an empty row.
- Same treatment for `strct-table`'s skeleton rows and the standalone
  `strct-skeleton` component, so "loading" looks identical across the three surfaces.
- No API change: `[loading]` semantics untouched; this is purely the default visual.

**Workaround meanwhile (app-global CSS in HyperStruct):** exactly that sweep, overriding
`.strct-dg__skeleton-block` — internals-coupled like every such override; deleted the
release this ships.
