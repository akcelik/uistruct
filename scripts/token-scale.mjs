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
 * Sizes the scale cannot yet express, by file and value. Keyed by count rather
 * than by line so the list does not rot every time a rule moves. Shrink it;
 * never grow it. FR-67-01 and FR-67-03 empty it.
 */
const allowed = {
  'avatar/avatar.ts': { 'font-size': { '17px': 1 } },
  'code/code.ts': { 'font-size': { '10px': 1, '12.5px': 1 } },
  'combobox/combobox.ts': { 'font-size': { '11px': 2 } },
  'command-palette/command-palette.ts': { 'font-size': { '15px': 1 } },
  'datagrid/datagrid.css': { 'font-size': { '12.5px': 1 } },
  'diff/diff.ts': { 'font-size': { '10px': 1, '11px': 3, '12.5px': 1 } },
  'drawer/drawer.ts': { 'font-size': { '15px': 1 } },
  'empty-state/empty-state.ts': { 'border-radius': { '7px': 1 } },
  'forms/toggle.ts': { 'border-radius': { '5px': 1 } },
  'heatmap/heatmap.ts': { 'font-size': { '10px': 1 } },
  'hotkeys/hotkeys.ts': {
    'border-radius': { '5px': 1 },
    'font-size': { '10.5px': 1, '12.5px': 2, '13.5px': 1 },
  },
  'input-otp/input-otp.ts': { 'font-size': { '18px': 1 } },
  'knob/knob.ts': { 'font-size': { '18px': 1 } },
  'layout/login.ts': { 'font-size': { '11.5px': 1 } },
  'layout/page-header.ts': { 'font-size': { '18px': 1 } },
  'layout/rail.ts': { 'font-size': { '12.5px': 1, '13.5px': 1 } },
  'log-viewer/log-viewer.ts': { 'font-size': { '11px': 1, '12.5px': 2 } },
  'menubar/menubar.ts': { 'font-size': { '12.5px': 2 } },
  'notification-center/notification-center.ts': { 'font-size': { '10px': 1 } },
  'searchbox/searchbox.ts': { 'font-size': { '10px': 1, '12.5px': 1 } },
  'steps/steps.ts': { 'font-size': { '11px': 1 } },
  'time-range/time-range.ts': { 'font-size': { '10.5px': 1, '11.5px': 2, '12.5px': 1 } },
  'tour/tour.ts': { 'font-size': { '10.5px': 1, '12.5px': 1, '13.5px': 1 } },
  'transfer/transfer.ts': { 'font-size': { '11px': 1, '12.5px': 2 } },
  'tree/tree.ts': { 'font-size': { '11px': 2 } },
  'wizard/wizard.ts': { 'font-size': { '10.5px': 1, '11px': 1, '12.5px': 1, '15px': 1 } },
};

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
      if (count < budget) stale.push(`${file}: ${prop}: ${value} — ${count} left, \`allowed\` still says ${budget}`);
    }
  }
}

// The scale lives on :root, once.
const tokens = readFileSync(TOKENS, 'utf8');
const rootBlock = tokens.match(/^:root \{$([\s\S]*?)^\}$/m)?.[1] ?? '';
for (const name of SCALE) {
  const declarations = [...tokens.matchAll(new RegExp(`^\\s*${name}:`, 'gm'))].length;
  if (declarations === 0) problems.push(`${name} is not declared`);
  else if (declarations > 1)
    problems.push(`${name} is declared ${declarations} times — the scale belongs on :root, once`);
  else if (!new RegExp(`^\\s*${name}:`, 'm').test(rootBlock))
    problems.push(`${name} is declared outside :root`);
}

for (const line of stale) console.log(`  stale  ${line}`);
if (problems.length) {
  console.error(`\n✗ ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`);
  for (const line of problems) console.error(`  ${line}`);
  console.error('');
  process.exit(1);
}
if (stale.length) {
  console.error(`\n✗ ${stale.length} stale entr${stale.length === 1 ? 'y' : 'ies'} in \`allowed\` — remove them.\n`);
  process.exit(1);
}
console.log(
  `✓ ${SCALE.length} scale tokens on :root, declared once; ` +
    `${literals} literal size${literals === 1 ? '' : 's'} left, all of them listed.`,
);
