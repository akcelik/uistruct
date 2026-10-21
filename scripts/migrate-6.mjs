#!/usr/bin/env node
/**
 * Rewrites `<strct-datagrid>` templates from the flat inputs to the feature
 * objects 5.30.0 introduced — the work 6.0 requires, done by machine.
 *
 *   node scripts/migrate-6.mjs                    # dry run over the repo
 *   node scripts/migrate-6.mjs --write            # apply
 *   node scripts/migrate-6.mjs src --write        # only under src/
 *
 * It reads `.html` files and the inline `template:` of `.ts` files, finds each
 * `<strct-datagrid …>` opening tag, and folds the flat attributes into
 * `[selection]`, `[paging]`, `[pane]`, `[virtual]`, `[grouping]`,
 * `[filtering]` and `[state]`. Everything else on the element is left where it
 * is — including the two-way state (`[(selectedIds)]`, `[(filters)]`,
 * `[(columnState)]`, `[(collapsedGroups)]`, `[(quickFilter)]`,
 * `[(activeRowId)]`, `[(selectedId)]`), which does not move: `[(…)]` cannot
 * bind through a property of an object.
 *
 * It is deliberately conservative. An attribute whose name it does not know
 * stays; an element it cannot parse is reported and skipped; an object the
 * element already has is extended rather than replaced. Run it, then run your
 * formatter and your tests.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/** flat attribute → [object, property]. */
const MOVES = {
  selectable: ['selection', 'enabled'],
  selectionMode: ['selection', 'mode'],
  selectionColumn: ['selection', 'column'],
  rowSelectable: ['selection', 'rowSelectable'],
  groupSelect: ['selection', 'groupSelect'],
  initialSelection: ['selection', 'initial'],
  pageSize: ['paging', 'pageSize'],
  hasMore: ['paging', 'hasMore'],
  loadingMore: ['paging', 'loadingMore'],
  moreTotal: ['paging', 'moreTotal'],
  lazy: ['paging', 'lazy'],
  total: ['paging', 'total'],
  detailPane: ['pane', 'enabled'],
  paneListWidth: ['pane', 'listWidth'],
  paneTakeoverWidth: ['pane', 'takeoverWidth'],
  viewportHeight: ['virtual', 'viewportHeight'],
  rowHeight: ['virtual', 'rowHeight'],
  maxHeight: ['virtual', 'maxHeight'],
  groupBy: ['grouping', 'by'],
  groups: ['grouping', 'groups'],
  showEmptyGroups: ['grouping', 'showEmpty'],
  childrenKey: ['grouping', 'childrenKey'],
  quickFilterable: ['filtering', 'quick'],
  quickFilterFields: ['filtering', 'fields'],
  quickFilterAlign: ['filtering', 'align'],
  stateKey: ['state', 'key'],
  sync: ['state', 'sync'],
};
/** `virtual` and `pane` already name their object: a bare one means enabled. */
const FLAGS = { virtual: 'virtual', detailPane: 'pane' };
/** `paging="more"` is still valid on its own; it only folds in beside others. */
const MODE_ONLY = { paging: ['paging', 'mode'] };

const args = process.argv.slice(2);
const write = args.includes('--write');
const roots = args.filter((a) => !a.startsWith('--'));
const SKIP = new Set(['node_modules', 'dist', '.git', '.angular', 'coverage']);

/** Every file worth reading under `dir` — or `dir` itself, when it is a file. */
function* walk(dir) {
  if (!statSync(dir).isDirectory()) {
    yield dir;
    return;
  }
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    const s = statSync(path);
    if (s.isDirectory()) yield* walk(path);
    else if (['.html', '.ts'].includes(extname(path)) && !path.endsWith('.spec.ts')) yield path;
  }
}

/**
 * Whether the match at `at` sits inside a quoted attribute value rather than
 * in the markup — a code sample stored in an attribute, say. Read from the
 * start of the line: an odd number of quotes before it means it is inside
 * one. (A value that spans lines is not detected; such a sample is rare, and
 * a wrong rewrite inside a string is worse than a missed one.)
 */
function insideAttributeValue(text, at) {
  const line = text.slice(text.lastIndexOf('\n', at) + 1, at);
  const odd = (q) => (line.split(q).length - 1) % 2 === 1;
  return odd('"') || odd("'");
}

/** The index just past the `>` that closes the tag starting at `from`. */
function endOfTag(text, from) {
  let quote = null;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '>') return i;
  }
  return -1;
}

/** The attributes of one opening tag, with where each sits in the source. */
function attributes(tag) {
  const out = [];
  const re = /(\[?\(?[\w.$-]+\)?\]?)(\s*=\s*(["'])([\s\S]*?)\3)?/g;
  let m;
  // skip the element name itself
  re.lastIndex = tag.indexOf('strct-datagrid') + 'strct-datagrid'.length;
  while ((m = re.exec(tag))) {
    if (!m[1].trim()) continue;
    out.push({ raw: m[0], name: m[1], value: m[4], bound: m[1].startsWith('['), at: m.index });
  }
  return out;
}

/** The property's value as it should read inside the object literal. */
function valueFor(attr) {
  if (attr.value === undefined) return 'true'; // a bare attribute
  if (attr.bound) return attr.value.trim(); // an expression, verbatim
  if (attr.value === '') return 'true';
  if (/^(true|false|-?\d+(\.\d+)?)$/.test(attr.value.trim())) return attr.value.trim();
  return `'${attr.value.replace(/'/g, "\\'")}'`; // a literal string
}

function migrateTag(tag) {
  const attrs = attributes(tag);
  const byName = new Map(attrs.map((a) => [a.name.replace(/^\[|\]$/g, ''), a]));
  /** object → { prop: value } collected from the flat attributes. */
  const objects = new Map();
  const consumed = [];

  for (const attr of attrs) {
    const plain = attr.name.replace(/^\[|\]$/g, '');
    if (attr.name.startsWith('[(')) continue; // two-way state never moves
    const move = MOVES[plain];
    if (!move) continue;
    const [obj, prop] = move;
    if (!objects.has(obj)) objects.set(obj, {});
    objects.get(obj)[prop] = valueFor(attr);
    consumed.push(attr);
  }
  // `virtual` / `pane` fold in only when their object is being written anyway.
  for (const [flag, obj] of Object.entries(FLAGS)) {
    const attr = byName.get(flag);
    if (attr && objects.has(obj) && !consumed.includes(attr)) consumed.push(attr);
  }
  // `paging="more"` joins the object when other paging inputs are moving.
  for (const [flat, [obj, prop]] of Object.entries(MODE_ONLY)) {
    const attr = byName.get(flat);
    if (attr && objects.has(obj) && !attr.bound) {
      objects.get(obj)[prop] = valueFor(attr);
      consumed.push(attr);
    }
  }
  if (!objects.size) return null;

  // Build the new attributes, then splice: the first consumed attribute's
  // place is where the objects go, and the rest are removed.
  const written = [...objects]
    .map(([obj, props]) => {
      const body = Object.entries(props)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      return `[${obj}]="{ ${body} }"`;
    })
    .join(' ');

  let out = tag;
  for (const attr of [...consumed].sort((a, b) => b.at - a.at)) {
    out = out.slice(0, attr.at) + out.slice(attr.at + attr.raw.length);
  }
  const first = Math.min(...consumed.map((a) => a.at));
  out = out.slice(0, first) + written + out.slice(first);
  // What the removals left behind: blank lines, and runs of spaces where an
  // attribute used to be.
  out = out
    .split('\n')
    .filter((line, i) => i === 0 || line.trim() !== '')
    .join('\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/ {2,}(?=\[|\(|[\w-]+=)/g, ' ');
  return { tag: out, objects: [...objects.keys()], attrs: consumed.length };
}

let files = 0;
let elements = 0;
let moved = 0;
const touched = [];
for (const root of roots.length ? roots : ['.']) {
  for (const file of walk(root)) {
    const src = readFileSync(file, 'utf8');
    if (!src.includes('<strct-datagrid')) continue;
    let out = src;
    let changedHere = 0;
    for (let i = out.indexOf('<strct-datagrid'); i !== -1; i = out.indexOf('<strct-datagrid', i + 1)) {
      const end = endOfTag(out, i);
      if (end === -1) {
        console.warn(`  ! ${file}: an unterminated <strct-datagrid> was skipped`);
        continue;
      }
      if (insideAttributeValue(out, i)) continue;
      const tag = out.slice(i, end);
      const result = migrateTag(tag);
      if (!result) continue;
      out = out.slice(0, i) + result.tag + out.slice(end);
      elements++;
      moved += result.attrs;
      changedHere++;
      i += result.tag.length - tag.length;
    }
    if (changedHere) {
      files++;
      touched.push(`${file} (${changedHere} grid${changedHere > 1 ? 's' : ''})`);
      if (write) writeFileSync(file, out);
    }
  }
}

console.log(
  `\n${write ? 'Rewrote' : 'Would rewrite'} ${moved} flat input(s) on ${elements} grid(s) in ${files} file(s):`,
);
for (const t of touched) console.log(`  ${t}`);
if (!write) console.log('\nNothing was written. Run again with --write.');
else console.log('\nRun your formatter and your tests.');
