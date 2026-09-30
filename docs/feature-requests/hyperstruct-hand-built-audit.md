# HyperStruct's hand-built UI → FR-48-01 … FR-48-42

> **COMPLETE (2026-09-30).** All 42 FRs (45 asks) shipped across releases 4.5.0 → 4.25.0. Each
> document records what was measured, and the eleven of them now live in
> [`archive/`](archive/):
>
> | Document                        | Asks          | Shipped in               |
> | ------------------------------- | ------------- | ------------------------ |
> | `headings-and-text.md`          | FR-48-13 … 17 | 4.5.0                    |
> | `meters-status-and-feedback.md` | FR-48-18 … 23 | 4.6.0 · 4.14.0 · 4.15.0  |
> | `lists-and-data.md`             | FR-48-24 … 29 | 4.7.0 · 4.16.0 · 4.17.0  |
> | `selection-and-choice.md`       | FR-48-01 … 04 | 4.8.0 · 4.11.0           |
> | `forms.md`                      | FR-48-05 … 08 | 4.9.0 · 4.10.0           |
> | `buttons-links-menus.md`        | FR-48-09 … 12 | 4.12.0 · 4.13.0          |
> | `diagrams-and-steps.md`         | FR-48-30 … 32 | 4.18.0 · 4.19.0          |
> | `surfaces-windows-layout.md`    | FR-48-33 … 38 | 4.20.0 · 4.21.0 · 4.22.0 |
> | `assistant-chat.md`             | FR-48-39      | 4.23.0                   |
> | `login-and-misc.md`             | FR-48-40 … 41 | 4.24.0                   |
> | `silent-misuse.md`              | FR-48-42      | 4.25.0                   |
>
> Three of the proposals were answered differently from the way they were written, and each
> document says why: a `role="button"` body instead of a `<button>` where content is projected
> (list, tag, breadcrumb); a stated `interactive` instead of inferring a bound output, which
> Angular's API does not expose; and `keepEmpty` defaulting to true on the donut, because the
> library already kept the zero row that the app's own legend dropped.

**From:** HyperStruct (every screen) · **Version:** 4.4.0 · **Date:** 2026-09-29

The owner's rule for HyperStruct is that every UI object is a strct object. An audit found where the app broke it:
all ~290 source files under `web/hyperstruct-ui/src/app`, plus `src/styles.scss` and the four component `.css` files,
read in full, template by template and styles block by styles block.

Every element the app draws itself was compared with the 4.4.0 API in `types/akcelik-strct.d.ts` and, where the typings
were not enough, the source in `projects/strct/src/lib`. Each element was sorted into one of two groups:

- **The app should have used strct.** strct already does the job, and the app will migrate. These need no FR; they are
  listed at the end of this document so the maintainer can see the whole picture.
- **strct cannot do it yet.** Each gap is one FR below: 42 in all, grouped into ten documents. A gap is filed only when
  the app has a real, shipped screen that needs it. Every FR names those screens (`file:line` in HyperStruct) and the
  workaround it would retire.

## How the proposals fit the library

Each proposal follows [CONTRIBUTING.md](../../CONTRIBUTING.md) ("House conventions") and [api-review.md](../api-review.md).
The whole point of this batch is that the result feels like strct, not like HyperStruct:

- **Extend first.** A gap is closed by extending the component the app reached for (`strct-tag`, `strct-progress`,
  `strct-field`, `strct-datagrid` …) with optional inputs whose defaults render exactly as 4.4.0 does. A new component is
  proposed only where no existing one owns the job (list, section header, stepper, window, legend, chat).
- **The same words as the library:**
  - tones use `StrctStatus` (`neutral | accent | success | warning | critical`);
  - sizes use `sm | md`;
  - density uses `dense`;
  - clickability uses `interactive` + `selected` (as `strct-card`);
  - item picks are `select` / `activated`;
  - state streams are `<state>Change` or `model()`;
  - lifecycle events are past tense (`closed`, `removed`).
- **The same mechanics as the library:**
  - booleans carry `booleanAttribute`;
  - every user-facing string is an input with an English default, or part of a labels object;
  - slots are `[strctXxx]` directives, following the precedent of `strctHeroActions`, `strctPageHeaderActions` and
    `strctDatagridActionBar`.
- **Styles:** tokens only, `ViewEncapsulation.None`, BEM-ish classes, logical properties, `prefers-reduced-motion`
  guards.
- **Accessibility:** every FR says what the element is to assistive technology and how the keyboard reaches it.

## The FRs

| FR       | Title                                                                                             | Document                                                               |
| -------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| FR-48-01 | `strct-datagrid`: single selection, per-row lock, group select-all                                | [selection-and-choice.md](archive/selection-and-choice.md)             |
| FR-48-02 | `strct-radio`: card variant with a description                                                    | 〃                                                                     |
| FR-48-03 | `strct-tag`: an interactive body, pill shape, leading slot, mono                                  | 〃                                                                     |
| FR-48-04 | `strct-checkbox` / `strct-toggle` / `strct-radio`: a description line                             | 〃                                                                     |
| FR-48-05 | `strct-field`: side-by-side (label column) layout                                                 | [forms.md](archive/forms.md)                                           |
| FR-48-06 | `strct-field`: prefix / suffix addons                                                             | 〃                                                                     |
| FR-48-07 | `strct-field`: a projected (rich) hint                                                            | 〃                                                                     |
| FR-48-08 | `strct-datagrid`: select and number editors for editable columns                                  | 〃                                                                     |
| FR-48-09 | `strct-button` `variant="link"`; clickable breadcrumb items                                       | [buttons-links-menus.md](archive/buttons-links-menus.md)               |
| FR-48-10 | `StrctMenuService.open`: anchor, placement, flip                                                  | 〃                                                                     |
| FR-48-11 | `strct-dropdown-item`: a trailing secondary action                                                | 〃                                                                     |
| FR-48-12 | `strct-icon`: a count badge                                                                       | 〃                                                                     |
| FR-48-13 | `strct-section-header` (new)                                                                      | [headings-and-text.md](archive/headings-and-text.md)                   |
| FR-48-14 | `strct-card-header`: heading, meta and actions slots                                              | 〃                                                                     |
| FR-48-15 | `strct-page-header`: level, icon, a slot beside the title                                         | 〃                                                                     |
| FR-48-16 | Text utilities: muted, hint, overline                                                             | 〃                                                                     |
| FR-48-17 | Inline code token                                                                                 | 〃                                                                     |
| FR-48-18 | `strct-progress`: meter mode (visible label / value / caption, indeterminate, neutral, segments)  | [meters-status-and-feedback.md](archive/meters-status-and-feedback.md) |
| FR-48-19 | `strct-status-dot` `pulse`, and a live / last-updated indicator                                   | 〃                                                                     |
| FR-48-20 | `strct-spinner` visible caption; `strct-empty-state` compact size and loading variant             | 〃                                                                     |
| FR-48-21 | `strct-metric-tile`: interactive / link, caption tone, meter slot                                 | 〃                                                                     |
| FR-48-22 | `strct-alert`: `icon` override, and a layout that survives a host `display`                       | 〃                                                                     |
| FR-48-23 | `strct-legend` (new); `strct-donut` legend below and zero rows                                    | 〃                                                                     |
| FR-48-24 | `strct-list` + `strct-list-item` (new)                                                            | [lists-and-data.md](archive/lists-and-data.md)                         |
| FR-48-25 | `strct-description-list`: aligned grid; leading status / icon and a note line on `strct-desc`     | 〃                                                                     |
| FR-48-26 | `strct-datagrid`: flush, caption, column `mono` / `muted` / `numeric` / `emptyText` / second line | 〃                                                                     |
| FR-48-27 | `strct-datagrid`: cursor paging ("Load more")                                                     | 〃                                                                     |
| FR-48-28 | `strct-tree`: a framed, height-bounded variant                                                    | 〃                                                                     |
| FR-48-29 | `strct-avatar`: icon, shape, tone                                                                 | 〃                                                                     |
| FR-48-30 | `strct-steps` (new): read-only status stepper                                                     | [diagrams-and-steps.md](archive/diagrams-and-steps.md)                 |
| FR-48-31 | `strct-flow`: fan-out layout and node templates                                                   | 〃                                                                     |
| FR-48-32 | A value change ("from → to")                                                                      | 〃                                                                     |
| FR-48-33 | `strct-window` (new): non-modal, draggable, resizable, minimisable                                | [surfaces-windows-layout.md](archive/surfaces-windows-layout.md)       |
| FR-48-34 | `strct-media-frame` (new): fixed-ratio frame with placeholder states                              | 〃                                                                     |
| FR-48-35 | `strct-splitter` pixel bounds + collapsible pane; `[strctResizeHandle]`                           | 〃                                                                     |
| FR-48-36 | `strctReorder`: connected lists and a drag handle                                                 | 〃                                                                     |
| FR-48-37 | A skip link                                                                                       | 〃                                                                     |
| FR-48-38 | `strct-accordion-panel`: quiet (inline) variant                                                   | 〃                                                                     |
| FR-48-39 | Chat: thread, message, typing indicator, composer (new)                                           | [assistant-chat.md](archive/assistant-chat.md)                         |
| FR-48-40 | `strct-login`: the showcase's art as a built-in aside                                             | [login-and-misc.md](archive/login-and-misc.md)                         |
| FR-48-41 | `strct-qr` (new)                                                                                  | 〃                                                                     |
| FR-48-42 | Dev-mode diagnostics for attributes a component does not have                                     | [silent-misuse.md](archive/silent-misuse.md)                           |

Suggested order, by how many screens each one frees: **13, 18, 24, 01, 20, 05, 03, 16, 26, 09**; then the rest.

## What HyperStruct migrates itself (no FR)

These are the app's debt, not the library's. They are listed so the maintainer knows they were looked at.

- **Surfaces:**
  - bordered boxes → `strct-card` (+ header / block / footer, `dense`, `status` rail): ~25 places;
  - verdict bands → `strct-hero` (0 uses today; 4 bands);
  - callouts and coloured sentences → `strct-alert`: ~40.
- **Data:**
  - key–value lists → `strct-description-list`: ~33;
  - fact strips → `inline`;
  - KPI tiles → `strct-metric-tile`;
  - raw `<table>` → `strct-table`;
  - `<pre>` → `strct-code` / `strct-log-viewer`;
  - stage lists → `strct-timeline`;
  - hand-drawn donut legend → `strct-donut legend`.
- **Controls:**
  - ~113 raw inputs, selects and textareas → `strctInput`, `strct-select`, `strct-number`, `strct-password`,
    `strct-input-otp`, `strct-chips`, `strct-input-mask`, `strct-file`;
  - 42 `<label>`s wrapped around `strct-checkbox` / `strct-toggle` → projected label;
  - raw buttons → `strct-button`;
  - hand-built popovers → `strct-popover` / `strct-dropdown popover`;
  - user menu → `strct-avatar`, `strct-theme-switcher`, `strct-dropdown-item`;
  - `<details>` → `strct-accordion-panel` / `strct-code collapsible`;
  - boot-order list → `strctReorder`.
- **Misuse the app is fixing:**
  - `strct-alert variant="…"` ×9 (the input is `type`);
  - `strct-badge size="sm"` ×2 (no such input);
  - `<input strct-input>` ×1;
  - 124 inline `display:block` on `strct-alert` (the icon drops above the text);
  - 24 local copies of `.strct-mono`.

FR-48-42 exists because none of this misuse produced a warning.
