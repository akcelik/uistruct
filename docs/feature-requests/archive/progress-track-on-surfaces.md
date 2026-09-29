# FR-47-01 — `strct-progress`: the track must stay visible on the surface it sits on

> **RESOLVED in 4.4.1 (2026-09-29).** Both asks. The track is a translucent tint of the
> foreground rather than a fixed surface token, so it steps off every surface the library
> places it on instead of matching one of them, and it carries a hairline inset ring so the
> length reads without relying on fill contrast. `--strct-progress-track` overrides the
> colour. The regression case exists: the showcase datagrid demo renders a CPU column of
> bars, and the visual gate now screenshots it in both themes (routes can aim at an anchor,
> so a case below the fold can be pinned). Measured in Chrome: dark went from contrast 1.00
> — the track was the row colour exactly — to 1.40; light 1.11 → 1.27.

**From:** HyperStruct O247 (2026-09-27). Every host list now shows CPU as a `strct-progress` bar inside a
`strct-datagrid` cell.

## What happens

`.strct-progress__track` paints `var(--bg-3)`. Inside a datagrid row in the dark theme, the row's own ground is
the same colour, so the track disappears. Only the fill is left: 37 % reads as a short green dash with nothing to
measure it against, and 93 % reads as a line that could be 100 %.

The colours were measured in Chrome, on a host list in HyperStruct, using the first ancestor with a background:

| Theme | Track                | Behind it            |
| ----- | -------------------- | -------------------- |
| light | `rgb(238, 240, 243)` | `rgb(251, 252, 253)` |
| dark  | `rgb(35, 40, 47)`    | `rgb(35, 40, 47)`    |

In the light theme the track is barely visible: its luminance is only slightly lower than the row behind it.

## Asked

- Give the track a colour that differs from every surface the library places it on (card, datagrid row, row
  hover, modal) in both themes. One option is a dedicated token (`--strct-progress-track`); another is a hairline
  border (`inset 0 0 0 1px var(--b1)`) so the length reads without relying on fill contrast.
- Add a playground/regression case that renders the bar inside a datagrid row in dark mode.

## Workaround in HyperStruct

None. The percentage is printed beside every bar, so the value is never lost; only the at-a-glance length is.
