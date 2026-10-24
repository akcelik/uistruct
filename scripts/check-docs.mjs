/**
 * Docs integrity gate: the showcase registry must describe the library that
 * actually ships.
 *
 * - every component id is unique (it is a route: /components/:id);
 * - every name in a page's `importNames` is exported from the package's
 *   public API — the import line on each docs page is copied verbatim into
 *   consumers' code, so a stale name there is a compile error for them
 *   (6.0.1 found `StrctContextMenu` still listed after 6.0 removed it).
 *
 * Reads `projects/strct/src/public-api.ts`, follows its `export *` chain and
 * collects every exported declaration name (classes, interfaces, types,
 * consts, functions, enums, and `export { … }` lists). The registry is loaded
 * as TypeScript through Node's type stripping (Node ≥ 22.18).
 *
 * Usage: node scripts/check-docs.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PUBLIC_API = resolve('projects/strct/src/public-api.ts');
const REGISTRY = resolve('projects/showcase/src/app/docs/registry.ts');

/** Every name the package exports, following `export * from` recursively. */
function exportedNames(file, seen = new Set()) {
  const names = new Set();
  if (seen.has(file)) return names;
  seen.add(file);
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/^export \* from '(.+?)';/gm)) {
    let target = resolve(dirname(file), m[1]);
    if (!target.endsWith('.ts')) target += '.ts';
    if (!existsSync(target)) throw new Error(`${file}: export * from '${m[1]}' does not resolve`);
    for (const n of exportedNames(target, seen)) names.add(n);
  }
  const decl =
    /^export\s+(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|const|let|var|function\*?|enum)\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of src.matchAll(decl)) names.add(m[1]);
  for (const m of src.matchAll(/^export\s+(?:type\s+)?\{([^}]*)\}/gm)) {
    for (const part of m[1].split(',')) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) names.add(name.replace(/^type\s+/, ''));
    }
  }
  return names;
}

const api = exportedNames(PUBLIC_API);
const { ALL_COMPONENTS } = await import(REGISTRY);

const problems = [];
const ids = new Map();
for (const c of ALL_COMPONENTS) {
  if (ids.has(c.id)) problems.push(`duplicate id "${c.id}" (${ids.get(c.id)} and ${c.title})`);
  ids.set(c.id, c.title);
  for (const name of c.importNames) {
    if (!api.has(name))
      problems.push(`${c.id}: importNames lists "${name}", which the package does not export`);
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length} docs problem(s):`);
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}
console.log(
  `✓ ${ALL_COMPONENTS.length} docs pages, unique ids, every import name exported (${api.size} public names).`,
);
