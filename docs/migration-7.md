# Migrating to 7.0

7.0 removes nothing and renames nothing. **No public API changed**: no input,
no output, no exported name, no class name. Every template that compiled
against 6.5.0 compiles against 7.0.0 unchanged.

What changed is the look. 7.0 is the token layer of
[FR-67](feature-requests/archive/visual-language-2026-11.md): a type scale whose steps
are steps, a surface ramp that separates without a line drawn on it, and a
radius scale wide enough to tell its own steps apart. Every screen in a
consuming app will look different, which is why it is a major.

If you need the old look while you work through your screens, there is a flag
for it — see [The 6.x flag](#the-6x-flag) below.

## What moved

### The type scale

`--text-xs` and `--text-sm` were both `12px`: two names for one value, so a
caption could never recede below the text it captioned. The upper half could
not carry a number — across fifteen component pages the largest size the
library actually used was 14px.

| token        | 6.5.0 | 7.0.0    |
| ------------ | ----- | -------- |
| `--text-xs`  | 12px  | **11px** |
| `--text-sm`  | 12px  | 12px     |
| `--text-md`  | 13px  | 13px     |
| `--text-lg`  | 14px  | **15px** |
| `--text-xl`  | 16px  | **18px** |
| `--text-2xl` | 22px  | 22px     |
| `--text-3xl` | 26px  | **28px** |

`--text-md` is the body and data size and does not move; the library is built
on it. The practical effect is at the ends: a label can now sit under a value
without competing with it, and a number can be the loudest thing on a screen.

**What this does to your layout:** anything sized `--text-xs` gets 1px smaller,
so a dense list of captions gets slightly shorter. Anything at `--text-lg` or
above gets larger. If you have a fixed-height row holding `--text-xl` text,
check it.

### The radius scale

Four steps spanning 4px, which at a 32px control height is 6% to 19% of the
height — at arm's length every corner was a right angle.

| token           | 6.5.0 | 7.0.0    |
| --------------- | ----- | -------- |
| `--radius-xs`   | 1px   | **2px**  |
| `--radius-sm`   | 2px   | **4px**  |
| `--radius-md`   | 3px   | **6px**  |
| `--radius-lg`   | 4px   | **10px** |
| `--radius-xl`   | 6px   | **14px** |
| `--radius-pill` | 999px | 999px    |

A button is `--radius-md` and goes from 3px to 6px; a small or mini button is
`--radius-sm` and goes from 2px to 4px; a card is `--radius-lg` and goes from 4px
to 10px.

### The surface ramp

Six surface tokens spanned 1.142:1 end to end in light, and two of them — the
app canvas `--bg-0` and the subtle fill `--bg-2` — were the same colour to the
eye (1.016:1 in Arctic, **1.001:1 in Ember**, 1.002:1 in Sage). A surface could
not group anything on its own, so every region in the library was fenced with a
hairline instead.

The light palettes were re-laddered against `--bg-1`; the dark ones only needed
`--bg-2` deepened, because their ramp already worked.

| palette · theme | `--bg-0`              | `--bg-2`              | `--bg-3`              | `--bg-h`              | `--bg-a`              |
| --------------- | --------------------- | --------------------- | --------------------- | --------------------- | --------------------- |
| arctic · light  | `#f3f4f6` → `#ebecee` | `#f4f6f8` → `#f0f2f4` | `#eef0f3` → `#e5e7ea` | `#f0f1f4` → `#dedfe2` | `#e6e8ec` → `#d4d6d9` |
| ember · light   | `#f5f2ee` → `#eeebe7` | `#f5f2ed` → `#f4f1ec` | `#f0ece7` → `#e9e5e0` | `#eee9e3` → `#e3ded8` | `#e5e0d8` → `#d9d4cd` |
| sage · light    | `#f2f5f3` → `#eaecea` | `#f1f5f2` → `#eff3f0` | `#eaf0ec` → `#e2e8e4` | `#e8eeea` → `#dbe0dc` | `#dfe6e1` → `#d0d7d2` |
| arctic · dark   | `#0e1015` → `#0c0e12` | `#161920` → `#14161d` | —                     | —                     | —                     |
| ember · dark    | `#12100d` → `#0d0b09` | `#1a1714` → `#171411` | —                     | —                     | —                     |
| sage · dark     | `#0d1210` → `#0a0e0d` | `#141a17` → `#121714` | —                     | —                     | —                     |

Afterwards, in every palette: `--bg-1` against `--bg-2` is at least 1.10:1,
`--bg-2` against `--bg-3` at least 1.07:1, and `--bg-0` against `--bg-2` at
least 1.04:1. `scripts/token-scale.mjs` asserts all three on every build.

One pre-existing bug fell out of this. In Arctic light, `--bg-h` was _lighter_
than `--bg-3`, so a solid button got lighter when you hovered it — the hover
receded instead of advancing. The new ladder puts `--bg-h` one step beyond
`--bg-3` in every palette.

### `--t3` got darker, in light only

Deepening `--bg-3` would have pushed muted text to 4.44–4.51:1 on it, under the
4.5:1 AA floor. `--t3` moves with it:

| palette        | 6.5.0                     | 7.0.0                     |
| -------------- | ------------------------- | ------------------------- |
| arctic · light | `rgba(0, 0, 0, 0.55)`     | `rgba(0, 0, 0, 0.57)`     |
| ember · light  | `rgba(70, 50, 30, 0.715)` | `rgba(70, 50, 30, 0.765)` |
| sage · light   | `rgba(30, 60, 42, 0.71)`  | `rgba(30, 60, 42, 0.76)`  |

Muted text now clears **4.6:1 on all six light surfaces**, better than before on
every one of them.

## The component weights

Four components changed what they look like. None of them changed an input, an
output or a class name, so there is nothing in your templates to edit — but
these are the changes a screenshot test or a hand-written override will notice.

### A row of actions now has a primary

| variant             | was                             | now                                                     |
| ------------------- | ------------------------------- | ------------------------------------------------------- |
| `primary`           | accent border + accent text     | **filled `--acc`, `--inv` text, weight 600**            |
| `critical`          | critical border + critical text | **filled `--critical`, weight 600**                     |
| `neutral` (default) | transparent on `--b3`           | **`--bg-1` on `--b3`**                                  |
| `outline`           | `--b3` border, `--t1` text      | transparent on **`--b2`**, `--t2` text                  |
| `flat`              | transparent, `--t2` text        | transparent, **accent text**, tighter inline padding    |
| disabled            | `opacity: 0.45`                 | transparent on `--b1`, weight 400, `--disabled-opacity` |

`solid` still fills a neutral. On a primary or a critical it is now what the
variant already is, and is kept so templates written before 7.0 still compile.

**If you relied on a primary being an outline**, that is the change to look at.
The nearest thing to the old primary is `variant="outline"`.

### A field reads as a recess

`.strct-control` takes `--bg-3` with a transparent border and a 1px inset
shadow; focus gives it a full `--acc` edge (it was `--acc50`). Disabled
flattens to `--bg-2`. Nothing about its size or spacing moved.

### Severity is not only a hue

A warning alert takes `--warning-bg` and a 4px rail; a critical takes
`--critical-bg`, a 5px rail and a 500-weight body. Info and success are
unchanged. The `--*-bg` tokens were already in every palette; the alert simply
never used them.

### A card groups by tone

`strct-card-header` no longer draws a bottom rule and `strct-card-footer` no
longer draws a top one. The footer keeps its `--bg-2` fill, which now reads on
its own. **If you had added your own divider inside a card to compensate for
these, remove it.**

## 7.1: a list aligns down its columns

`strct-list` became one grid, with the rows and their main areas as subgrids of
it, so every title in a list starts at the same x and every meta ends at the
same one however wide each row's leading marker is. Nothing in your templates
changes.

What to look at:

- **A list of two or three rows whose leading markers differ a lot in width**
  now reserves the widest of them for all of them. That is the alignment; it is
  also the one case where a list gets visibly wider in its first column.
- **If you styled `.strct-li__main` yourself** — a `gap`, a `flex` property, an
  order — it is a grid now, not a flex row. The row's spacing moved out of
  `gap` and onto `.strct-li__leading`, `.strct-li__meta` and
  `.strct-li__trailing`, each of which collapses when empty.
- **A meta is right-aligned and set in tabular figures.** If you were
  right-aligning it yourself, you can stop.
- **`strct-list` needs `grid-template-columns: subgrid`** — Chrome 117, Safari
  16, Firefox 71. That is the same baseline as the `container-type` the
  component already relied on, so if the list worked before, it works now.

## 7.4: severity on a card and a hero, and a tone that stays on its own surface

`strct-card [status]` and `strct-hero [status]` now say severity the way
`strct-alert` does. Nothing in your templates changes.

- **A `warning` or `critical` card tints its header** — not the whole card —
  and its rail steps to 4px and 5px. `accent` and `success` keep the plain 3px
  rail. A `critical` card's body is set in 500.
- **A `warning` or `critical` hero takes the tone fill whole**, with the same
  4 / 5px rails.
- **A tone now layers over the component's `--bg-1` instead of replacing it.**
  This is a fix to the alert as it shipped in 7.0.0: `--warning-bg` and
  `--critical-bg` are 12% tones, so replacing `--bg-1` with one composited it
  over whatever is behind the alert. In the dark palettes a critical alert
  painted 1.045:1 against the page and read as a hole in it rather than as an
  alert. It is now 1.17:1 from a quiet one.

What to look at:

- **If you set your own background on an alert, a card or a hero**, the tone
  used to land on yours and now lands on the component's `--bg-1`. Set
  `--bg-1` on the component instead of `background`, or set `background-color`
  specifically — `background` resets `background-image`, which is where the
  tone now lives, and will remove the tint.
- **If you were compensating for a dark critical alert being invisible** —
  a border, a heavier shadow, your own tint — you can take it out.

## 7.6: a grid can fill its pane

Additive — nothing changes unless you ask for it.

- **`[maxHeight]="'fill'"`** bounds the grid's scroll frame to the space left
  in its nearest scrolling ancestor, recomputed as that ancestor or the window
  changes size. `[fillMin]` (default 280px) is the floor under which the page
  scrolls instead.
- **`provideStrctDatagridDefaults({ maxHeight: 'fill' })`** states the policy
  once for an app. A per-grid `[maxHeight]` still wins, and
  **`[maxHeight]="null"` opts one grid out** of the policy.

What to look at:

- **`maxHeight`'s default is now `undefined`, not `null`.** It behaves exactly
  as before — no provider, no cap — and the distinction only matters once you
  state a policy: `undefined` means "use the policy", `null` means "no cap
  here". If you were binding `[maxHeight]="someNumber ?? null"`, that still
  reads as "no cap" and will now override a policy, which is what it says.
- **If you measured this yourself**, you can stop. A directive that read
  `.strct-dg__scroll` or `.strct-dg__layout` to find where the rows start and
  where the footer begins is doing the component's arithmetic from outside it.
- **An open detail pane is now bound to the same height** and scrolls inside
  it. Before, a pane taller than a bounded list stretched the grid past its own
  cap.

## The 6.x flag

Set `data-visual="6"` on the same element that carries `data-palette` and
`data-theme`:

```html
<html data-palette="arctic" data-theme="light" data-visual="6"></html>
```

That hands back 6.5.0's type scale, radius scale and surfaces, so you can
upgrade the package today and move your screens when it suits you.

Three things it deliberately does **not** do:

- It does not restore `--t3`. That change is an accessibility fix and the flag
  does not undo one.
- It restores tokens only. The component weight changes that land alongside it
  in 7.0 — a filled primary action, a field that reads as a recess, severity
  carried on surface as well as hue, a card that groups by tone — are not
  reverted by it.
- It is not permanent. The flag is removed in 8.0.

## Nothing else to do

There is no codemod, because there is nothing in your source to change. The
checklist is short:

1. Upgrade. Your app compiles.
2. Look at a dense screen and a form screen in both themes.
3. If anything needs time, add `data-visual="6"` and come back to it.
4. Check any fixed-height container holding `--text-xl` or larger text, and any
   place you hard-coded a radius to match a UIStruct one.

If you had overridden a scale token on `:root`, it now wins. Before 7.0 the
palette block's own copy beat it on specificity, so your override was being
ignored — the tokens moved to `:root` in 6.5.0 and this is the first release
where that is visible.
