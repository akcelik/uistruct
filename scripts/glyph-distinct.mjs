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
  const want = [...new Set([...MUST_DIFFER.flatMap(([a, b]) => [a, b]), ...CALIBRATION.flat()])];
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
