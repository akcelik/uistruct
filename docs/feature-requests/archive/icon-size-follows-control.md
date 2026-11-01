# An icon the size of the control it sits in

> **SHIPPED in 6.3.0**, measured in Chrome on the showcase:
>
> |                              | before                           | after                |
> | ---------------------------- | -------------------------------- | -------------------- |
> | icon in a `size="sm"` button | 14px in 13 places, **16px in 7** | **14px**, everywhere |
> | icon in a `size="md"` button | 14px                             | **16px**             |
> | icon in a `size="lg"` button | 14px — the same as a small one's | **18px**             |
>
> - **FR-64-01** — `strct-icon`'s `size` is `input<number | undefined>(undefined)`.
>   The icon's width and height come from `--icon-size` in CSS, which a
>   control sets beside its `--control-h`; an icon that states a size writes
>   the same property on itself, which is nearer, so it still wins. New
>   tokens: `--icon-size-sm` (14px), `--icon-size-md` (16px), `--icon-size-lg`
>   (18px) and `--icon-size`. The count bubble's font size moved into CSS with
>   it (`max(9px, calc(var(--icon-size, 16px) * 0.58))`), since the size is no
>   longer a number TypeScript holds.
> - **FR-64-02** — 51 hand-written sizes came out of the showcase and 7 out of
>   the library's own buttons (the datagrid's sync and column-chooser, the log
>   viewer's jump-to-bottom, the time-range trigger, the transfer lists'
>   arrows). A diff that mostly deletes, as the report asked for.
> - **Gate** — `scripts/control-height.mjs` measures the icons too: **162
>   boxes** across three palettes instead of 144, each against the token its
>   control's size names. An icon that states a size is skipped, because the
>   point is that it wins.
>
> **Left alone, deliberately:** a component's own affordances — a select's
> caret, a combobox chip's 10px close, a checkbox's tick, a searchbox's
> magnifier, the datagrid's sort and filter marks. They are parts of the
> control rather than content inside it, each sized for its spot, and they
> keep their sizes through the same rule that lets any explicit size win.
>
> **Not revisited:** whether `strokeWidth` should scale with the size. 1.4 was
> drawn for 16px and a 14px icon at the same stroke reads a little heavier;
> the question is one layer down and nothing measured here needed it.

Filed 2026-11-01 by the maintainer, out of **FR-63-03**. The control-height
work (v6.2.0) gave every single-line control one height per size and closed
the rest of that report; this is the sentence it could not close, written up
on its own because the way in is a change to `strct-icon`, not to the
controls.

## What was measured

Chrome, 1500×1000, across nine showcase routes — every `strct-icon` inside a
button, a searchbox or a field, by the size of the control holding it:

| control              | icon drawn | places |
| -------------------- | ---------- | ------ |
| `button` **sm**      | **14px**   | 13     |
| `button` **sm**      | **16px**   | 7      |
| `button` md          | 14px       | 2      |
| `button` lg          | 14px       | 2      |
| field md             | 14px       | 7      |
| `strct-searchbox` md | 14px       | 18     |

Two numbers matter. **The same small button carries a 14px icon in thirteen
places and a 16px icon in seven** — nobody chose that; each call site picked
a number. And a **large button's icon is 14px, the same as a small one's**:
the control grew from 26px to 38px and the icon it holds did not move.

The library's own showcase writes the number by hand at every one of those
49 call sites, which is the clearest evidence that the icon has no way to
know.

## Why it was left out of 6.2.0

`strct-icon`'s size is `input(16)` — a default, not an unset state. A button
reading it back cannot tell a 16 the author asked for from the 16 nobody
asked for, so a button that imposed its own size would silently overrule
`[size]="14"` wherever a consumer had chosen it. That is the kind of quiet
override the library files dev warnings about, so 6.2.0 shipped the heights
without it. Nothing depends on it: an icon cannot change a control's height
any more, whatever size it is.

## FR-64-01 — `size` becomes "unset by default", and a control can answer

```ts
readonly size = input<number | undefined>(undefined);
```

The icon draws `size() ?? inherited ?? 16`, where `inherited` reads a CSS
custom property set by whatever contains it:

```scss
--icon-size: 16px; /* the default, beside --control-h */
.strct-btn--sm {
  --icon-size: 14px;
}
.strct-btn--lg {
  --icon-size: 18px;
}
```

An icon with no `size` is the size its surroundings ask for; an icon with one
is exactly that, as today. Nothing that states a size changes, which is what
makes this safe to ship in a minor.

Two details worth deciding before writing it:

- **The property, or an injected token?** A custom property costs nothing and
  works through content projection, where DI through `@ContentChild` would
  not. But the icon renders width/height as style bindings in px, so it has
  to resolve the property itself (`getComputedStyle` on first render, or
  `width: var(--icon-size, 16px)` in CSS and drop the px bindings). The CSS
  route is cheaper and has no measurement in it; it needs the SVG's
  `width`/`height` attributes to give way to the stylesheet, which is worth
  checking against the sprite markup.
- **`strokeWidth` at 1.4 was drawn for 16px.** A 14px icon at the same stroke
  reads heavier per pixel. Whether the stroke should scale with the size is
  the same question one layer down, and the answer may be "leave it".

## FR-64-02 — the showcase stops writing the number

Once an icon can be told by its surroundings, the 49 hand-written sizes in
the showcase come out, which is both the migration example and the proof:
a diff that only deletes is the point.

## What it would retire

Every `<strct-icon [size]="14" />` inside a control, in this repo and in
consumers'. HyperStruct writes the number at every call site too.

## Gate

`scripts/control-height.mjs` already walks every control in every size on
`/foundations/controls`. The same page and the same walk can assert the icon
inside each control is the size that control's size asks for — one more
column in the measurement that is already there, rather than a new gate.
