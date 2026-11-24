# strct-icons — a host / VM icon family, reviewed and partly adopted

**Arrived:** 2026-11-24, as a folder (`strct-icons/`) rather than a markdown request: an Angular
component, component-tier tokens, 36 generated SVGs and a build script, with a README whose
instruction was "copy `src/lib/icon/` into the strct library and export it from `public-api.ts`".
The folder is kept at [`archive/strct-icons/`](strct-icons/) as the source of the idea.

## The verdict

**The idea was adopted. The package could not be.** Following the README would have broken every
consumer:

| collision                   | where it already lives                                                                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selector: 'strct-icon'`    | `icon.ts` — the same selector; importing both into one component does not compile                                                                                                         |
| `export type StrctIconName` | `icon.ts` — already the 190-name union; re-exporting a 6-name one is a duplicate export, and if it resolved it would silently narrow every call site                                      |
| `--strct-icon-color`        | written by `strct-icon`'s host binding, read by `tree.ts` — the drop redefines it on `:root`, which would pin one colour globally and kill the alarm tone the tree has carried since 7.18 |

Three deeper problems, beyond the names:

- **A third state model.** The drop's `state` (`running | off | suspended | error`) merges power
  and health into one slot. That is the single-slot problem 7.18.0 was filed to fix — an alarmed
  VM lost its power state — and `tree-state.mjs` exists to keep it fixed.
- **A silhouette already spoken for.** The drop draws `off` as a hollow ring. Six days earlier
  7.22.0 shipped the hollow ring as `health: 'unknown'` — "not read". Two meanings, one shape.
- **Sizes that do not reach the places these icons are used.** The state disc measures **4.8px**
  at 16px and **8.8px** at 24px, against this library's measured floor of **11px** for a state
  mark. And the tree draws an **18px** glyph in a 27.5px row; 18 is not in the drop's
  `16 | 24 | 32 | 48`.

## What was taken, in 7.24.0

**"Identity in the frame"** — the drop's central rule, and a good one. Drawn in this set's own
16-unit grid instead of the drop's 36-unit one:

- `host` is untouched, so `cluster` goes on being three of it (7.21.0).
- `vm` is that same chassis **inside a dashed frame**. It was a monitor before, which says "a
  screen", not "a machine that is not physical".
- `vmTemplate`, `vmSnapshot`, `vmClone`, `vmMigration` put a kind mark in the glyph's
  **bottom-start** corner and open the dashed frame to make room for it — not a mask, for the
  reason the drop's own README gives: a mask's soft edge leaves the dash ends half translucent
  and browsers draw ghosts.

The corner is chosen, not merely free: health owns the glyph's top end and power/mode its bottom
one, so a VM template can still be alarmed and still be off. The drop made the derived objects a
_state_, which would have cost exactly that.

### Measured

`scripts/glyph-distinct.mjs`, eight new pairs, at 14px against a **4.56%** floor (twice
`lock`/`unlock`, the weakest pair the set accepts):

| pair                         |                                       |
| ---------------------------- | ------------------------------------- |
| `vm` / `host`                | **44.08%** stroke, **42.86%** outline |
| `vm` / `vmTemplate`          | 19.75%                                |
| `vmTemplate` / `vmClone`     | 9.45%                                 |
| `vmTemplate` / `vmMigration` | 9.38%                                 |
| `vmClone` / `vmMigration`    | 8.93%                                 |
| `vmSnapshot` / `vmMigration` | 7.39%                                 |
| `vmTemplate` / `vmSnapshot`  | 6.77%                                 |
| `vmSnapshot` / `vmClone`     | 6.64%                                 |

### What the measurement changed, twice

- **My eye was wrong about small sizes.** The derived marks looked like mush at 14px, so they
  were simplified once; measuring then showed **five of the six pairs already cleared the floor
  at 14px**. Only one did not.
- **That one pair could not be fixed by drawing better.** `vmTemplate` / `vmSnapshot` measured
  3.57–4.27% at **every** size — a square and a disc of similar mass in the same corner, which is
  a shape problem, not a resolution one. Adding interior strokes only moved it onto the line
  (7.37% ✓, 6.76% ✗, 6.52% ✓, 5.88% ✗ across sizes), which is the "over the line by four
  hundredths" case this gate's own notes reject. It was settled by changing **aspect ratio** —
  a sheet standing up against a round clock — after which the weakest pair in the whole family
  sits at 6.64–8.61%, comfortably clear at every size.

## Not taken

The component, the type names, the `--strct-icon-color` redefinition, the `state` input, the
36-unit grid and the size-dependent stroke. State stays where 7.18–7.22 put it: `reach`, `power`,
`health`, `mode`, `rollup` on the tree, and `badge` / `status` / `lifecycle` on the icon.
