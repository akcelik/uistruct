# UIStruct v1.5.x — gaps found adopting 1.5.0 in HyperStruct (2026-07-21)

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
