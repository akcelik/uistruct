# Categorical chart palette — `--chart-1..8`

Theme tokens for **categorical** multi-series charts (N distinct entities:
per-node CPU, per-datastore latency). The four semantic statuses
(`accent/success/warning/critical`) stay reserved for health/threshold meaning
— reusing them as "series 3" is a category error.

Opt in per series: `{ data, label, color: 'chart-1' }` → `var(--chart-N)`.

## Design rules (from the dataviz method)

- **Fixed slot order per palette** — this is the CVD-safety mechanism. Never
  cycle: a 9th series folds into "Other", facets, or direct-labels.
- **Slot 1 tracks the theme's accent hue at data-grade chroma** (OKLCH C ≥
  0.10), so a primary series feels on-theme without using the muted UI `--acc`.
- **Two-directional pairs are not categorical** — network in/out, disk
  read/write share _one_ hue and differ by `dash`.
- **All-pairs forms** (scatter-like): only the first 4 slots validate under
  `--pairs all`, in the 6–8 CVD band → cap at 4 series _and_ keep secondary
  encoding (labels/legend), or facet.

## The sets (validator-passed, 2026-07-19)

Order per palette (slot 1 → 8):

| Palette               | Order                                                          |
| --------------------- | -------------------------------------------------------------- |
| **arctic** (blue-led) | blue · green · magenta · yellow · aqua · orange · violet · red |
| **ember** (amber-led) | amber · magenta · green · blue · aqua · orange · violet · red  |
| **sage** (green-led)  | green · blue · magenta · yellow · aqua · orange · violet · red |

Hex steps are shared across palettes (light-mode and dark-mode step sets); the
per-palette _order_ is what changes. See `_tokens.scss` for the values.

## Validation

Every palette × mode set was run through the dataviz palette validator
(six checks: lightness band, chroma floor, adjacent-pair CVD ΔE ≥ 8,
normal-vision ΔE ≥ 15, contrast) against that theme's `--bg-0` surface:

| Set                      | Result                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| arctic dark (`#0e1015`)  | PASS — worst adjacent CVD ΔE 8.4                                 |
| arctic light (`#f3f4f6`) | PASS + contrast WARN (relief: legend/labels/hover ship built-in) |
| ember dark (`#12100d`)   | PASS — worst adjacent CVD ΔE 9.4                                 |
| ember light (`#f5f2ee`)  | PASS + contrast WARN (relief as above)                           |
| sage dark (`#0d1210`)    | PASS — worst adjacent CVD ΔE 8.4                                 |
| sage light (`#f2f5f3`)   | PASS + contrast WARN (relief as above)                           |

Note on ember: the naive derivation (swap amber into slot 1, keep the rest)
failed the dark-mode CVD gate at the amber↔green adjacency (ΔE 6.9); the
passing fix was re-ordering (amber · magenta · green · blue …), not
re-stepping. The light-mode contrast WARNs affect the same mid-tone slots as
the reference palette; `strct-chart` always renders a legend for ≥2 series and
ships hover values, which satisfies the relief rule.

Changing any value requires re-running the validator for that palette × mode —
the palette is computed, not eyeballed.
