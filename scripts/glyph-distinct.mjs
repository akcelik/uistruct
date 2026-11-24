/**
 * Glyph distinctness at the size it is read at.
 *
 * FR-69-04 asked for glyphs whose whole job is to be told apart from the one
 * they sit beside: `backup` from `restore` by the arrow alone, `lockTimed`
 * from `lock`. "It looks different" is the `surfaces.size > 1` mistake of
 * 7.4.0 one domain over, so this measures it: each glyph is rendered at 14px
 * with a 4x device scale, captured, and compared pixel for pixel against the
 * one it has to differ from.
 *
 * The threshold is not invented, and it is not the weakest thing already in
 * the set either. The closest accepted pair is `lock`/`unlock`, and it is the
 * closest for a reason: the two differ by a rotated shackle and nothing else.
 * Holding new work to exactly that is holding it to the set's worst case, so a
 * NEW pair is held to twice it. The first `backup`/`restore` drawing is why
 * this is written down: it measured 2.32% against a 2.28% weakest pair — over
 * the line by four hundredths of a percent, and not a difference a reader would
 * find. Twice the weakest rejects it; the redrawing measures 5.26%.
 *
 *   node scripts/glyph-distinct.mjs
 */
import { createServer } from 'node:http';
import {
  createReadStream,
  existsSync,
  statSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { PNG } from 'pngjs';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4706;
const CDP = 9406;
/**
 * How far two outlines must stand apart, as a share of the frame. It is the
 * ask's own size that sets the scale: a 14px glyph is 196px², so 6% is about
 * 12 pixels of outline that belong to one mark and not the other — the least
 * that changes what a reader takes the mark to be.
 */
const SILHOUETTE_FLOOR = 6;

/** The size the `sm` toolbar renders a glyph at, which is the ask's own size. */
const SIZE = 14;
const SCALE = 4;

/** Pairs that must be told apart, and what tells them apart. */
const MUST_DIFFER = [
  ['backup', 'restore', 'the arrow alone'],
  ['lockTimed', 'lock', 'a clock on the body'],
  ['calendarClock', 'calendar', 'a clock in the corner'],
  ['dedup', 'copy', 'blocks that merge, not blocks that overlap'],
  ['fingerprint', 'wifi', 'whorls, not broadcast arcs'],
  ['replicate', 'dedup', 'two stores, not three blocks'],
  ['scrub', 'search', 'a store behind the magnifier'],
  ['skip', 'chevronDoubleRight', 'a bar after the triangle'],
  // The arrow-in-a-box reading must not collapse into the arrow-over-a-line
  // one the set already has.
  ['backup', 'download', 'a store, not a baseline'],
  ['restore', 'upload', 'a store, not a baseline'],
  // The inventory ladder: a site, a group of machines, one machine, a
  // cabinet. Each is the row above or below the other in the same tree, so
  // each has to be read on its own. `datacenter` used to be a rounded box
  // with three lines and a dot, which is what `node` is.
  ['datacenter', 'node', 'a building, not a box of lines'],
  ['datacenter', 'rack', 'a site, not a cabinet'],
  ['cluster', 'host', 'a stack of several machines, not one of two units'],
  ['cluster', 'rack', 'machines stacked, not shelves in a cabinet'],
  ['cluster', 'layers', 'server units, not sheets'],
  // The VM family. Identity is in the frame — a host is a chassis, a VM is
  // that chassis inside a dashed one — and the four derived objects each put
  // a mark in the glyph's bottom-start corner, which no badge uses. They are
  // read in one column of an inventory, so each has to separate from the
  // other three and not only from `vm`.
  ['vm', 'host', 'a dashed frame around the same chassis'],
  ['vm', 'vmTemplate', 'the frame opens for a kind mark'],
  ['vmTemplate', 'vmSnapshot', 'a sheet standing up, not a clock'],
  ['vmTemplate', 'vmClone', 'one sheet, not two squares'],
  ['vmTemplate', 'vmMigration', 'a sheet, not an arrow'],
  ['vmSnapshot', 'vmClone', 'a clock, not two squares'],
  ['vmSnapshot', 'vmMigration', 'a clock, not an arrow'],
  ['vmClone', 'vmMigration', 'two squares, not an arrow'],
];

/**
 * Pairs that must not share an outline.
 *
 * Two marks can sit far apart on the stroke-level distance above and still be
 * the same kind of object: `datacenter` was a rounded box with lines and a
 * dot, and so is `node` — 31% apart stroke for stroke, and the same card at a
 * glance. What tells a reader what a mark *is* before they read its detail is
 * its silhouette, so that is measured on its own: the ink is flood-filled
 * from the frame, and whatever the fill cannot reach is the glyph's outline.
 */
const SILHOUETTE = [
  ['datacenter', 'node', 'a site is not a box of lines'],
  ['cluster', 'rack', 'a stack of machines is not one cabinet'],
  ['host', 'rack', 'a chassis is not a cabinet'],
  ['vm', 'host', 'virtual is not physical, and the frame is what says so'],
];

/**
 * Glyphs whose whole content is "several of the same thing", and how many
 * clear lanes of background must cross them for the count to be readable.
 *
 * Distance measures how far two glyphs are apart. This measures whether one
 * glyph still says what it depicts: a mark whose content is "three machines"
 * has to show three machines at 14px, and it only does that if background
 * actually runs between them. When the strokes meet, the reader gets one
 * striped block — and no pixel-distance check can see that, because a striped
 * block is still very far from everything else in the set.
 *
 * `axis` is the direction the units are laid out in: 'y' for units stacked up
 * the glyph (the lanes are rows), 'x' for units side by side (columns).
 */
const SEPARATED = [
  ['cluster', 'y', 2, 'three machines, stacked'],
  ['host', 'y', 1, 'two units in one chassis'],
  ['grid', 'x', 1, 'two columns of tiles'],
];

/**
 * Pairs already in the set that a reader is expected to tell apart. The
 * smallest distance among these is the floor every new pair must clear.
 */
const CALIBRATION = [
  ['lock', 'unlock'],
  ['bell', 'bellOff'],
  ['eye', 'eyeOff'],
  ['arrowUp', 'arrowDown'],
  ['chevronUp', 'chevronDown'],
  ['upload', 'download'],
];

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

const server = createServer((req, res) => {
  // The request path is attacker-shaped: decode it safely and refuse anything
  // that resolves outside ROOT.
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  let p = resolve(join(ROOT, rel));
  if (p !== ROOT && !p.startsWith(ROOT + sep)) {
    res.writeHead(403).end();
    return;
  }
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(ROOT, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  createReadStream(p).pipe(res);
}).listen(PORT, '127.0.0.1'); // loopback only

const chromeBin =
  process.env.CHROME_BIN ??
  ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'].find((b) => {
    try {
      execSync(`command -v ${b}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });
if (!chromeBin) {
  console.error('No Chrome/Chromium binary found (set CHROME_BIN).');
  process.exit(1);
}
// Chrome writes its profile into a scoped_dir under the user config directory
// and clears it only when it exits by itself. This script kills it, so give it
// a directory we own and wait for it to be gone before removing it.
const profileDir = mkdtempSync(join(tmpdir(), 'strct-gate-'));
const dropProfile = () => {
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    /* best effort — a stray temp directory must not fail a gate */
  }
};
async function closeChrome() {
  const gone = new Promise((r) => chrome.once('exit', r));
  chrome.kill('SIGTERM');
  await Promise.race([gone, sleep(5000)]);
  dropProfile();
}
process.on('exit', () => {
  chrome.kill('SIGKILL');
  dropProfile();
});

const chrome = spawn(
  chromeBin,
  [
    '--headless=new',
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${CDP}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    `--force-device-scale-factor=${SCALE}`,
    '--window-size=1280,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpTarget() {
  for (let i = 0; i < 120; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      /* retry until Chrome is up */
    }
    await sleep(250);
  }
  throw new Error('Chrome never exposed a page target.');
}

function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  let i = 0;
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const id = ++i;
      pending.set(id, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });
  return new Promise((res) => (ws.onopen = () => res({ send })));
}

async function evaluate(send, expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

/**
 * Render one glyph alone at SIZE and capture it. The tile the icon page draws
 * is 22px and carries its name under it, so the glyph is lifted out of the
 * page into a bare box: the measurement is of the drawing, not of a tile.
 */
async function shoot(send, name) {
  const ok = await evaluate(
    send,
    `(() => {
       const tile = [...document.querySelectorAll('.ig-tile')]
         .find((t) => t.querySelector('.ig-name')?.textContent?.trim() === ${JSON.stringify(name)});
       const svg = tile?.querySelector('svg');
       if (!svg) return false;
       let stage = document.getElementById('glyph-stage');
       if (!stage) {
         stage = document.createElement('div');
         stage.id = 'glyph-stage';
         stage.style.cssText =
           'position:fixed;left:0;top:0;z-index:99999;width:${SIZE}px;height:${SIZE}px;' +
           'background:#fff;color:#000;display:block;overflow:hidden';
         document.body.appendChild(stage);
       }
       const copy = svg.cloneNode(true);
       copy.setAttribute('width', '${SIZE}');
       copy.setAttribute('height', '${SIZE}');
       copy.style.cssText = 'display:block;width:${SIZE}px;height:${SIZE}px';
       stage.replaceChildren(copy);
       return true;
     })()`,
  );
  if (!ok) return null;
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: SIZE, height: SIZE, scale: SCALE },
  });
  return PNG.sync.read(Buffer.from(data, 'base64'));
}

/** Fraction of pixels whose ink differs, as a percentage of the box. */
function distance(a, b) {
  if (a.width !== b.width || a.height !== b.height) return 100;
  let differ = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    // The stage is black on white, so one channel is the whole signal.
    if (Math.abs(a.data[i] - b.data[i]) > 24) differ++;
  }
  return (differ / (a.width * a.height)) * 100;
}

/**
 * The glyph's outline: every pixel the background cannot reach from the frame
 * without crossing ink. A rounded card and a rounded card with other lines in
 * it have the same one; a building and a card do not.
 */
function silhouette(png) {
  const { width: w, height: h, data } = png;
  const open = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) if (data[i] >= 232) open[p] = 1;
  const outside = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const p = y * w + x;
    if (open[p] && !outside[p]) {
      outside[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const q = stack.pop();
    const x = q % w;
    const y = (q / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  const sil = new Uint8Array(w * h);
  for (let p = 0; p < sil.length; p++) sil[p] = outside[p] ? 0 : 1;
  return { w, h, sil };
}

/** How much of the two outlines does not overlap, as a share of the frame. */
function silhouetteDistance(a, b) {
  const A = silhouette(a);
  const B = silhouette(b);
  if (A.w !== B.w || A.h !== B.h) return 100;
  let differ = 0;
  for (let p = 0; p < A.sil.length; p++) if (A.sil[p] !== B.sil[p]) differ++;
  return (differ / (A.w * A.h)) * 100;
}

/**
 * Clear lanes of background crossing a glyph, along one axis, strictly inside
 * its own ink: the number of maximal runs of rows (or columns) that carry no
 * ink at all. One lane between two units is what makes them two units.
 *
 * Ink is thresholded at the same level `distance` uses. A lane is counted at
 * one line or wider, which is the least that can read as a gap.
 */
function lanes(png, axis) {
  const { width: w, height: h, data } = png;
  const n = axis === 'y' ? h : w;
  const m = axis === 'y' ? w : h;
  const inked = [];
  for (let i = 0; i < n; i++) {
    let any = false;
    for (let j = 0; j < m && !any; j++) {
      const x = axis === 'y' ? j : i;
      const y = axis === 'y' ? i : j;
      if (data[(y * w + x) * 4] < 232) any = true;
    }
    inked.push(any);
  }
  const first = inked.indexOf(true);
  const last = inked.lastIndexOf(true);
  if (first < 0) return { lanes: 0, widest: 0 };
  let count = 0;
  let run = 0;
  let widest = 0;
  for (let i = first; i <= last; i++) {
    if (inked[i]) {
      if (run) {
        count++;
        widest = Math.max(widest, run);
      }
      run = 0;
    } else run++;
  }
  if (run) {
    count++;
    widest = Math.max(widest, run);
  }
  return { lanes: count, widest };
}

const problems = [];
let chrome_ok = false;

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/foundations/icons` });
  for (let i = 0; i < 120; i++) {
    if (await evaluate(send, `document.querySelectorAll('.ig-tile').length > 100`)) break;
    await sleep(200);
  }
  await sleep(600);
  chrome_ok = true;

  const shots = new Map();
  const want = [
    ...new Set([
      ...MUST_DIFFER.flatMap(([a, b]) => [a, b]),
      ...CALIBRATION.flat(),
      ...SEPARATED.map(([n]) => n),
      ...SILHOUETTE.flatMap(([a, b]) => [a, b]),
    ]),
  ];
  for (const name of want) {
    const png = await shoot(send, name);
    if (!png) {
      problems.push(`${name}: not on the icon page — nothing to measure`);
      continue;
    }
    shots.set(name, png);
  }

  // A glyph compared with itself must be 0, or the harness is measuring noise
  // rather than drawing.
  const self = distance(shots.get('lock'), await shoot(send, 'lock'));
  if (self > 0.01) problems.push(`the harness is not stable: lock vs lock is ${self.toFixed(2)}%`);

  const calibrated = CALIBRATION.filter(([a, b]) => shots.has(a) && shots.has(b)).map(([a, b]) => ({
    pair: `${a}/${b}`,
    d: distance(shots.get(a), shots.get(b)),
  }));
  calibrated.sort((x, y) => x.d - y.d);
  const weakest = calibrated[0];
  /** Twice the set's worst accepted case — see the note at the top. */
  const floor = (weakest?.d ?? 0) * 2;

  console.log(`Glyph distinctness at ${SIZE}px, ${SCALE}x — ${shots.size} glyphs read\n`);
  console.log('Pairs the set already ships, closest first:');
  for (const c of calibrated) console.log(`  ${c.pair.padEnd(26)} ${c.d.toFixed(2)}%`);
  console.log(
    `\nFloor: ${floor.toFixed(2)}% — twice ${weakest?.pair} (${weakest?.d.toFixed(2)}%), the weakest the set accepts\n`,
  );

  console.log('Pairs this release has to keep apart:');
  for (const [a, b, how] of MUST_DIFFER) {
    if (!shots.has(a) || !shots.has(b)) continue;
    const d = distance(shots.get(a), shots.get(b));
    const pass = d >= floor;
    console.log(`  ${pass ? '✓' : '✗'} ${`${a}/${b}`.padEnd(26)} ${d.toFixed(2)}%   ${how}`);
    if (!pass)
      problems.push(
        `${a} and ${b} are ${d.toFixed(2)}% apart at ${SIZE}px, under the ${floor.toFixed(2)}% floor (twice ${weakest.pair}) — ${how} is not enough`,
      );
  }

  console.log('\nPairs that must not share an outline:');
  for (const [a, b, how] of SILHOUETTE) {
    if (!shots.has(a) || !shots.has(b)) continue;
    const d = silhouetteDistance(shots.get(a), shots.get(b));
    const stroke = distance(shots.get(a), shots.get(b));
    const pass = d >= SILHOUETTE_FLOOR;
    console.log(
      `  ${pass ? '\u2713' : '\u2717'} ${`${a}/${b}`.padEnd(26)} ${d.toFixed(2)}% outline (${stroke.toFixed(2)}% stroke)   ${how}`,
    );
    if (!pass)
      problems.push(
        `${a} and ${b} share ${(100 - d).toFixed(2)}% of their outline at ${SIZE}px (only ${d.toFixed(2)}% apart, against a ${SILHOUETTE_FLOOR}% floor) \u2014 ${how}, and the two read as the same object however their strokes differ`,
      );
  }

  console.log('\nGlyphs that have to stay countable at 14px:');
  for (const [name, axis, want, what] of SEPARATED) {
    if (!shots.has(name)) continue;
    const { lanes: got, widest } = lanes(shots.get(name), axis);
    const pass = got >= want;
    console.log(
      `  ${pass ? '\u2713' : '\u2717'} ${name.padEnd(26)} ${got} of ${want} lane(s), widest ${(widest / SCALE).toFixed(2)}px   ${what}`,
    );
    if (!pass)
      problems.push(
        `${name} shows ${got} clear lane(s) at ${SIZE}px where ${what} needs ${want} \u2014 the units' strokes meet, so the count cannot be read`,
      );
  }

  // Ink coverage: a glyph that draws almost nothing at 14px is not legible,
  // whatever it is next to.
  console.log('\nInk at 14px:');
  const inked = [];
  for (const [name, png] of shots) {
    let ink = 0;
    for (let i = 0; i < png.data.length; i += 4) if (png.data[i] < 232) ink++;
    const pct = (ink / (png.width * png.height)) * 100;
    inked.push({ name, pct });
  }
  inked.sort((a, b) => a.pct - b.pct);
  for (const g of inked.slice(0, 5)) console.log(`  ${g.name.padEnd(20)} ${g.pct.toFixed(1)}%`);
  const faint = inked.filter((g) => g.pct < 4);
  for (const g of faint)
    problems.push(`${g.name} draws only ${g.pct.toFixed(1)}% ink at ${SIZE}px`);

  writeFileSync(
    'glyph-distinct.json',
    JSON.stringify({ size: SIZE, floor, calibrated, inked }, null, 2),
  );
} finally {
  if (chrome_ok) await closeChrome();
  else {
    chrome.kill('SIGTERM');
    await sleep(500);
    dropProfile();
  }
  server.close();
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `\n✓ every pair clears twice the set's weakest accepted pair, and no glyph is faint at ${SIZE}px.`,
);
