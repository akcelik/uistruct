# HyperStruct — one control height (6.0.2)

> **SHIPPED in 6.2.0**, measured in Chrome on the showcase (the heights below
> were re-measured in this repo before the change and match the report):
>
> | control                                                       | before      | after (md / sm) |
> | ------------------------------------------------------------- | ----------- | --------------- |
> | `strctInput`, `strct-select` and the rest of `.strct-control` | 34.9px      | **32 / 26**     |
> | `strct-button` md · sm                                        | 31 · 22px   | **32 / 26**     |
> | `strct-button` icon-only md · sm                              | 33 · 24px   | **32 / 26**     |
> | `strct-searchbox`                                             | 28 and 30px | **32 / 26**     |
> | `strct-segmented` md · sm                                     | 31 · 26px   | **32 / 26**     |
>
> - **FR-63-01** — `--control-h-sm: 26px`, `--control-h-md: 32px`,
>   `--control-h-lg: 38px` and `--control-h`, in `_tokens.scss`. Every
>   single-line control draws `height: var(--control-h)` with
>   `box-sizing: border-box` and no vertical padding.
> - **FR-63-02** — `StrctControlSize` (`sm | md | lg`) and a `size` input on
>   twelve controls, plus `[strctControlSize]`, which sets the height for
>   everything inside it. A control states nothing until it is given a size,
>   so the container wins unless the control says otherwise.
>   `StrctSegmentedSize` is an alias of the shared type now;
>   `StrctButtonSize` is the shared type plus the button's own `mini`.
> - **FR-63-03** — follows from the fixed height: an icon, a spinner, a badge,
>   `loading` or a longer label leaves the height alone. The button already
>   had `white-space: nowrap`.
> - **FR-63-04** — `scripts/control-height.mjs`, run in CI: **144 control
>   boxes** across three palettes, each measured against the token its size
>   names. Removing the one height rule turns 63 of them red.
>
> **Not done, deliberately:** the icon inside a button does not resize with
> the control (FR-63-03's second sentence). `strct-icon`'s `size` has a
> default rather than an unset state, so the button cannot tell an icon the
> author sized from one that took the default — forcing 16px would silently
> override an explicit `[size]="14"` wherever a consumer had chosen it. The
> heights do not depend on it: an icon cannot change a control's height any
> more. Filing a separate FR for an inheriting icon size would be the way in.
>
> Row targets like `strct-toolbar` and `strct-filter-bar` take no `size` of
> their own; `[strctControlSize]` on them does the same job, which is why
> FR-63-02 proposed it.

Filed 2026-11-01 by HyperStruct. The operator: buttons and input boxes standing side by side have very
different heights on many pages, and it damages the visual unity of the product. Measured in Chrome (2× DPR,
1600×1000) with strct 6.0.2 by reading `getBoundingClientRect` of every control on 135 screens of the app: 173
distinct rows of side-by-side controls, **25 rows with mismatched heights, up to 12.9 px apart**. The app has
1 132 `strct-button`s, 618 of them `size="sm"`.

The app cannot fix this from its side. There is no height to agree on.

## What was measured

| Control                                                                               | Height today            | Why                                                                                       |
| ------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| `strctInput`, `strct-select`, `strct-combobox`, `strct-number`, `<select strctInput>` | **34.9 px**             | `.strct-control`: `13px × line-height 1.3` + `padding 8+8` + border. No `size`.           |
| `strct-button` md                                                                     | **31 px**               | `13px × line-height 1` + `padding 8+8` + border                                           |
| `strct-button` md, loading/with a larger child                                        | **32 px**               | the content sets the height (`Cancel` 31 beside `Send to support` 32 in one modal footer) |
| `strct-button` md, `icon`                                                             | **34 px**               | 16 px icon + `padding 8+8` + border                                                       |
| `strct-button` sm                                                                     | **22 px**               | `12px × 1` + `padding 4+4` + border                                                       |
| `strct-button` sm with an icon                                                        | **23, 24, 25 or 26 px** | the same padding around a 13–16 px icon                                                   |
| `strct-searchbox`                                                                     | **28 px**               | its own `padding 5px 8px`                                                                 |
| `strct-segmented` md / sm                                                             | **31 / 26 px**          | its own padding, plus 2 px of track                                                       |

Rows from the app, heights in px, left to right:

| Screen          | Controls                                        | Heights                   |
| --------------- | ----------------------------------------------- | ------------------------- |
| Monitor ▸ views | `Views` · input `Name this view…` · `Save view` | **24 · 34.9 · 22**        |
| VM Groups       | input `New group name` · `Create group`         | **34.9 · 22**             |
| Conversations   | input · input · `Search` · `Open transcript`    | **34.9 · 34.9 · 22 · 22** |
| Anomalies       | select · select · `Acknowledge`                 | **34.9 · 34.9 · 22**      |
| Edit time       | input · `Add` · `Test all` · `Remove`           | **34.9 · 24 · 24 · 24**   |
| Dual control    | segmented · `Request…` · `Approve…` · `Reject…` | **26 · 22 · 22 · 22**     |
| Events          | `Filters` · searchbox                           | **24 · 28**               |
| Host ▸ Health   | `Live` · `Last 6 hours` · `Refresh`             | **22 · 23 · 25**          |
| Site Recovery   | `New plan…` · `Edit…` · `Delete…`               | **24 · 22 · 22**          |

## Why

1. **No shared measure.** Each control derives its height from its own padding, line-height and content.
2. **`size` exists on two controls.** Only `strct-button` and `strct-segmented` have it. A `size="sm"` button
   beside a field is 13 px shorter, and nothing can make the field match.
3. **Content sets the height.** An icon adds 1–4 px to a small button, so two buttons of one size differ.
4. **34.9 is not a pixel count.** `line-height: 1.3` on 13 px gives a fractional box, whose edges land between
   device pixels at 1× DPR.

## FR-63-01 — one height token per size, for every single-line control

```scss
// _tokens.scss
--control-h-sm: 26px;
--control-h-md: 32px;
--control-h-lg: 38px;
--control-h: var(--control-h-md); // what a control without a size uses
```

Each single-line control draws `height: var(--control-h)` with `box-sizing: border-box`, vertical padding 0 and
its content centred, so **height comes from the token and from nothing else**. 26 is what `strct-segmented` sm
already is; 32 is one pixel from today's md button and is a whole number. Both are the proposal: any values do,
provided there is one per size.

**Covers:** `button[strct-button]` (every variant except `link`), `icon` buttons (square: width = height),
`strct-split-button`, `strct-button-group`, `strctInput` on `input` and `select`, `strct-password`,
`strct-input-mask`, `strct-select`, `strct-combobox`, `strct-cascade-select`, `strct-tree-select`, `strct-number`,
`strct-searchbox`, `strct-datepicker`, `strct-datetime-picker`, `strct-color-picker`'s trigger, `strct-segmented`
(the track is the height; its options fill it), and the time-range trigger.

**Does not cover:** `textarea`, `variant="link"` buttons, chips and tags, menu items, tree rows, grid rows.

## FR-63-02 — `size` on every control, and on a container

- `size: 'sm' | 'md' | 'lg'` on each control above, with one type, `StrctControlSize`. `StrctButtonSize` and
  `StrctSegmentedSize` become aliases.
- Because the height is a custom property, a container can set it for everything inside:

```html
<div strctControlSize="sm">
  <!-- sets --control-h: var(--control-h-sm) -->
  <input strctInput /> <strct-select /> <button strct-button>Apply</button>
</div>
```

`strct-toolbar`, `strct-filter-bar`, `strct-datagrid`'s action bar and `strct-modal`'s footer take `size` and pass
it on the same way. An explicit `size` on a control beats its container. Font size and horizontal padding follow
the size too, so a small field and a small button also read alike: 12 px at sm, 13 px at md.

## FR-63-03 — content cannot change a control's height

Follows from FR-63-01, stated because it is the part that regresses: an icon, a spinner, a badge, a longer label
or `loading` leaves the height as it was. Inside a button the icon's size follows the control's size (14 px at sm,
16 px at md), and a larger child is clipped or centred rather than growing the box. A label that wraps is
`white-space: nowrap` with an ellipsis.

## FR-63-04 — a gate, so it stays fixed

A Chrome test over the showcase that mounts **every control × every size × with and without an icon × disabled ×
loading × both themes** and asserts `getBoundingClientRect().height === token`, in whole pixels. jsdom has no
layout, so this has to be a real browser; the a11y run already drives one.

The showcase gets one page that sets all of them side by side per size, which is also the fastest way to see a
regression.

## Not asked

- Vertical alignment of a labelled field and a button in one row. With equal heights, the app's existing
  `align-items: flex-end` lines them up. A field's hint or error below it is a separate matter if it shows up.
- Changing the type scale, the radii or anything else visual.

## Compatibility

Every control changes height by a few pixels, so this is a visible change: md fields go 34.9 → 32, small buttons
22 → 26, md buttons 31 → 32. A form or toolbar laid out around today's numbers shifts slightly. The API only
gains. An app that wants another density overrides the tokens in one place.

## What HyperStruct does when it ships

Sets its fields and buttons to matching sizes in every row found in this audit, deletes nothing (it has no
workaround: there was nothing to work around with), and re-runs the audit, whose target is **0 mismatched rows**.
