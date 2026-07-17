# Performance

Measured, reproducible numbers — not claims. Everything below comes from a
scripted benchmark that lives in this repository, so any fork can re-run it and
hold the same bar.

## Datagrid — 20,000 rows, virtual scroll

The live demo (["Virtual scroll — 20.000 rows"](https://akcelik.github.io/uistruct/components/datagrid#datagrid-virtual))
renders a 20,000-row host inventory with `virtual`, a frozen (`sticky`) first
column, a sticky header, selection, resizing and a column chooser.

Latest run (2026-07-17 · headless Chrome, Linux, default desktop hardware):

| Metric                                       | Result       |
| -------------------------------------------- | ------------ |
| Docs page ready (navigate → grid rendered)   | **315 ms**   |
| `<tr>` elements in the DOM (of 20,000 rows)  | **22**       |
| Total DOM nodes inside the grid              | **438**      |
| Deep-scroll window swap (avg of 5 far jumps) | **30.8 ms**  |
| Client-side sort of all 20,000 rows          | **115.6 ms** |

What the numbers mean:

- **DOM stays constant** regardless of data size — the virtual window keeps
  ~viewport + overscan rows mounted, so 20k or 200k rows cost the same to
  render and to change-detect.
- **A "far jump" is the worst case** for windowed rendering (every visible row
  is replaced); ~31 ms is under two frames at 60 Hz.
- **Sorting is a full client-side pass** over 20,000 rows (comparator +
  re-window). For larger sets, `lazy` mode moves sorting/paging to the server
  and the grid's cost stops depending on total size entirely.

## Reproduce it

```bash
npm ci
npx ng build showcase
node scripts/perf-grid.mjs
```

The script serves the built showcase, drives the real demo page in headless
Chrome over the DevTools protocol (no test doubles), and prints the table
above plus a machine-readable JSON line. Chrome/Chromium is auto-detected;
override with `CHROME_BIN=/path/to/chrome`.

## Methodology notes

- Timings use `performance.now()` inside the page and settle on a double
  `requestAnimationFrame`, so they include Angular's change detection and the
  browser's style/layout pass for the swapped window.
- Numbers vary with hardware; the shape of the result is the point — constant
  DOM, near-frame-budget window swaps, and linear-but-fast client sorting.
- The a11y story is verified the same way: `scripts/a11y-smoke.mjs` runs
  axe-core over eight key routes in CI and fails on serious/critical findings.
