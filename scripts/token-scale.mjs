/**
 * The scale gate: a component stylesheet may not invent a size.
 *
 * FR-67-00. The census behind FR-67 counted, in the library's own CSS, 190
 * literal `font-size` declarations against 75 that went through a token, and
 * 108 literal `border-radius` against 87. The literals were not the token
 * values either — `font-size` appeared as 10, 10.5, 11, 11.5, 12, 12.5, 13,
 * 13.5, 14, 15, 16, 17 and 18px, four of them half-pixels and eight of them
 * sizes the scale does not have. So the finding was not that the scale was too
 * narrow; it was that there was no scale in force.
 *
 * This gate holds the line. It fails when a stylesheet writes a literal
 * `font-size` or `border-radius` that is not in `allowed`, and it fails when
 * `allowed` promises more literals than a file still has — the list only
 * ratchets down. Every entry in it is a size the scale does not yet have and
 * is the worklist for FR-67-01 and FR-67-03, which retune the scale and can
 * then round these onto it; rounding them now would move pixels, and stage 1
 * is the stage that moves none.
 *
 * It also asserts the scale itself is declared exactly once, on `:root`:
 * type, radius, space, control height and icon size are palette- and
 * theme-independent, and holding six identical copies is how they drifted out
 * of use in the first place.
 *
 * Usage: node scripts/token-scale.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const LIB = resolve('projects/strct/src/lib');
const STYLES = resolve('projects/strct/src/styles');
const TOKENS = join(STYLES, '_tokens.scss');

/** The scale: declared once, on :root, because it is palette-independent. */
const SCALE = [
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--control-h-sm',
  '--control-h-md',
  '--control-h-lg',
  '--control-h',
  '--icon-size-sm',
  '--icon-size-md',
  '--icon-size-lg',
  '--icon-size',
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-pill',
  '--text-xs',
  '--text-sm',
  '--text-md',
  '--text-lg',
  '--text-xl',
  '--text-2xl',
  '--text-3xl',
  '--leading-tight',
  '--leading-normal',
  '--leading-loose',
  '--disabled-opacity',
];

/**
 * Sizes the scale cannot express, by file and value, keyed by count rather than
 * by line so the list does not rot every time a rule moves. 6.5.0 left 52 here
 * because rounding them would have moved pixels; 7.0.0 retuned the scale and
 * rounded every one of them onto it, so the list is empty and must stay empty.
 */
const allowed = {};

/** Every .ts/.css/.scss under a root, except the token sheet itself. */
function sheets(root) {
  const out = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) out.push(...sheets(path));
    else if (/\.(ts|css|scss)$/.test(name) && path !== TOKENS) out.push(path);
  }
  return out;
}

const LITERAL = /(font-size|border(?:-[a-z]+)*-radius): ([0-9.]+px);/g;
const found = new Map(); // "dir/file.ts" -> prop -> value -> count

for (const path of [...sheets(LIB), ...sheets(STYLES)]) {
  const key = relative(LIB, path).startsWith('..')
    ? relative(STYLES, path)
    : relative(LIB, path).split(sep).join('/');
  const src = readFileSync(path, 'utf8');
  for (const [, prop, value] of src.matchAll(LITERAL)) {
    const byProp = found.get(key) ?? new Map();
    const byValue = byProp.get(prop) ?? new Map();
    byValue.set(value, (byValue.get(value) ?? 0) + 1);
    byProp.set(prop, byValue);
    found.set(key, byProp);
  }
}

const problems = [];
const stale = [];
let literals = 0;

for (const [file, byProp] of found) {
  for (const [prop, byValue] of byProp) {
    for (const [value, count] of byValue) {
      literals += count;
      const budget = allowed[file]?.[prop]?.[value] ?? 0;
      if (count > budget) {
        problems.push(
          budget === 0
            ? `${file}: ${prop}: ${value} — write it as a token, or add it to \`allowed\` with the reason`
            : `${file}: ${prop}: ${value} appears ${count} times, \`allowed\` permits ${budget}`,
        );
      }
    }
  }
}

// The list only ratchets down: a promise nobody keeps any more is a stale entry.
for (const [file, byProp] of Object.entries(allowed)) {
  for (const [prop, byValue] of Object.entries(byProp)) {
    for (const [value, budget] of Object.entries(byValue)) {
      const count = found.get(file)?.get(prop)?.get(value) ?? 0;
      if (count < budget)
        stale.push(`${file}: ${prop}: ${value} — ${count} left, \`allowed\` still says ${budget}`);
    }
  }
}

// The scale lives on :root, once — plus, for one major, once more inside the
// [data-visual='6'] shim that hands an app back the 6.x values.
const tokens = readFileSync(TOKENS, 'utf8');
const rootBlock = tokens.match(/^:root \{$([\s\S]*?)^\}$/m)?.[1] ?? '';
const shim = tokens.match(/^\[data-visual='6'\] \{$([\s\S]*?)^\}$/m)?.[1] ?? '';
const live = tokens.replace(/^\[data-visual='6'\] \{$[\s\S]*?^\}$/m, '');
for (const name of SCALE) {
  const declarations = [...live.matchAll(new RegExp(`^\\s*${name}:`, 'gm'))].length;
  if (declarations === 0) problems.push(`${name} is not declared`);
  else if (declarations > 1)
    problems.push(`${name} is declared ${declarations} times — the scale belongs on :root, once`);
  else if (!new RegExp(`^\\s*${name}:`, 'm').test(rootBlock))
    problems.push(`${name} is declared outside :root`);
}

/** The shape of the scale, which is what FR-67-01 and -03 are about. */
const px = (block, name) =>
  Number(block.match(new RegExp(`^\\s*${name}: ([0-9.]+)px;`, 'm'))?.[1] ?? NaN);

const type = [
  '--text-xs',
  '--text-sm',
  '--text-md',
  '--text-lg',
  '--text-xl',
  '--text-2xl',
  '--text-3xl',
];
for (let i = 1; i < type.length; i++) {
  const below = px(rootBlock, type[i - 1]);
  const here = px(rootBlock, type[i]);
  if (!(here / below >= 1.08))
    problems.push(
      `${type[i]} (${here}px) is only ${(here / below).toFixed(3)}x ${type[i - 1]} (${below}px) — ` +
        `a step the eye cannot see is not a step`,
    );
}

const radius = ['--radius-xs', '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl'];
for (let i = 1; i < radius.length; i++) {
  const below = px(rootBlock, radius[i - 1]);
  const here = px(rootBlock, radius[i]);
  if (!(here / below >= 1.4))
    problems.push(
      `${radius[i]} (${here}px) is only ${(here / below).toFixed(2)}x ${radius[i - 1]} (${below}px) — ` +
        `the radius steps must be distinguishable`,
    );
}

/** The surface ramp has to separate without a line drawn on it, and the text
    has to stay readable on every surface the ramp moves. */
const srgbToLinear = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => srgbToLinear(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [luminance(a) + 0.05, luminance(b) + 0.05];
  return Math.max(x, y) / Math.min(x, y);
}
/** An rgba text token painted over an opaque surface. */
function composite(css, surface) {
  const m = css.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  const a = Number(m[4] ?? 1);
  const fg = [1, 2, 3].map((i) => Number(m[i]));
  const bg = [1, 3, 5].map((i) => parseInt(surface.slice(i, i + 2), 16));
  return fg.map((v, i) => v * a + bg[i] * (1 - a));
}
function contrastRgb(a, b) {
  const lum = (rgb) => {
    const [r, g, bl] = rgb.map((v) => srgbToLinear(v / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a) + 0.05, lum(b) + 0.05];
  return Math.max(x, y) / Math.min(x, y);
}

const RAMP = [
  ['--bg-1', '--bg-2', 1.1, 'a fill on a surface'],
  ['--bg-2', '--bg-3', 1.07, 'a deeper fill on a fill'],
  ['--bg-0', '--bg-2', 1.04, 'the canvas against a fill'],
];
for (const [, palette, theme, body] of tokens.matchAll(
  /\[data-palette='([a-z]+)'\]\[data-theme='([a-z]+)'\] \{([\s\S]*?)\n\}/g,
)) {
  if (!body || /data-visual/.test(palette ?? '')) continue;
  const hex = (name) => body.match(new RegExp(`^\\s*${name}: (#[0-9a-f]{6});`, 'm'))?.[1];
  for (const [a, b, floor, what] of RAMP) {
    const [x, y] = [hex(a), hex(b)];
    if (!x || !y) continue;
    const got = contrast(x, y);
    if (got < floor)
      problems.push(
        `${palette}/${theme}: ${a} against ${b} is ${got.toFixed(3)}:1, under ${floor}:1 — ` +
          `${what} has to read without a border`,
      );
  }

  // Text on every surface it can land on. Nothing guarded this before 7.1.1:
  // 7.0.0 deepened --bg-3 and had to darken --t3 to keep AA, and it was a
  // hand calculation that noticed, not a gate.
  const rgba = (name) => body.match(new RegExp(`^\\s*${name}: (rgba?\\([^;]+\\));`, 'm'))?.[1];
  for (const t of ['--t1', '--t2', '--t3']) {
    for (const s of ['--bg-0', '--bg-1', '--bg-2', '--bg-3']) {
      const [fg, surface] = [rgba(t), hex(s)];
      if (!fg || !surface) continue;
      const painted = composite(fg, surface);
      if (!painted) continue;
      const got = contrastRgb(
        painted,
        [1, 3, 5].map((i) => parseInt(surface.slice(i, i + 2), 16)),
      );
      if (got < 4.5)
        problems.push(
          `${palette}/${theme}: ${t} on ${s} is ${got.toFixed(3)}:1, under the 4.5:1 AA floor`,
        );
    }
  }
}

for (const line of stale) console.log(`  stale  ${line}`);
if (problems.length) {
  console.error(`\n✗ ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`);
  for (const line of problems) console.error(`  ${line}`);
  console.error('');
  process.exit(1);
}
if (stale.length) {
  console.error(
    `\n✗ ${stale.length} stale entr${stale.length === 1 ? 'y' : 'ies'} in \`allowed\` — remove them.\n`,
  );
  process.exit(1);
}
console.log(
  `✓ ${SCALE.length} scale tokens on :root, declared once, each step a step; ` +
    `the ramp separates and text clears AA on it in all six palettes; ` +
    (literals === 0
      ? 'every size in the library comes from the scale.'
      : `${literals} literal size${literals === 1 ? '' : 's'} left, all of them listed.`),
);
