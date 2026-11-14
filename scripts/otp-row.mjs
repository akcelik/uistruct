/**
 * BUG-80-03 / FR-80-06: the shape of a code row, and where it sits.
 *
 * `fill` exists so the six boxes line up with the full-width Verify button
 * under them. It did that by widening the boxes and nothing else: the height
 * stayed at 46px, so the designed 40x46 portrait cell became 49x46 in a 360px
 * sign-in card, 59x46 in a 420px one and 79x46 in a 560px one — a landscape
 * tile whose 10px radius read as pressed flat, and the wider the card, the
 * worse, which is the case `fill` is for. The row had no alignment either: the
 * host is an inline element, so on a card whose title, button and recovery
 * link are centred, the code sat at the left edge with 114px of air to its
 * right.
 *
 * Both are geometry, so nothing here is asserted from the stylesheet: Chrome
 * lays the fixtures out at the three widths the FRs were filed at and this
 * reads back every cell's box, the gaps between them, the row's two edges
 * against its field's, the cap the cells stop growing at, and how much of a
 * cell the glyph still covers once it has. The claims that are about shape
 * are re-read at 1.25x and 2x.
 *
 *   node scripts/otp-row.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4715;
const CDP = 9415;
/** The cell's designed size, and the cap `fill` may grow it to. */
const BOX = { md: { w: 40, h: 46, max: 48, font: 18 }, lg: { w: 48, h: 56, max: 58, font: 22 } };
/** A cell reads as a cell while it is upright: BUG-80-03's own window. */
const RATIO = [0.8, 1.0];
/** What a filled row measured before the change, at the widths it was filed with. */
const BEFORE = { 'fill-300': [39, 0.85], 'fill-420': [59, 1.28], 'fill-560': [79, 1.72] };
/** The share of the cell the glyph itself must still cover at the cap. */
const INK = 0.2;
/** A pixel of slack: Chrome lays out in subpixels and the FR asks for +-1px. */
const EPS = 1;

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
// Chrome clears its own scoped profile only when it exits by itself, and this
// script kills it. Hand it a directory we own and wait for it to be gone.
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
    '--window-size=1600,1400',
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
 * Every fixture on the page, read from what Chrome laid out: the row against
 * the field it sits in, every cell's box, the gaps between the row's own
 * children (the separator is one of them), and the advance width of a digit
 * in the cell's own face, so "the glyph still fills the cell" is a measurement
 * and not a guess about the font.
 */
const ROWS = `(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return {
    w: +b.width.toFixed(2), h: +b.height.toFixed(2),
    left: +b.left.toFixed(2), right: +b.right.toFixed(2) }; };
  const read = (wrap) => {
    const host = wrap.querySelector('strct-input-otp');
    const row = wrap.querySelector('.strct-otp');
    const boxes = [...wrap.querySelectorAll('.strct-otp__box')];
    const sep = wrap.querySelector('.strct-otp__sep');
    // The field's control column where there is one, the host otherwise:
    // the box the row is placed inside.
    const field = wrap.querySelector('.strct-field__control') ?? host;
    const cs = getComputedStyle(boxes[0]);
    const kids = [...row.children].map(r);
    const canvas = document.createElement('canvas').getContext('2d');
    canvas.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    return {
      host: r(host),
      field: r(field),
      row: r(row),
      boxes: boxes.map(r),
      gaps: kids.slice(1).map((b, i) => +(b.left - kids[i].right).toFixed(2)),
      font: parseFloat(cs.fontSize),
      radius: parseFloat(cs.borderTopLeftRadius),
      glyph: +canvas.measureText('8').width.toFixed(2),
      hasButton: !!wrap.querySelector('button'),
      tabbable: wrap.querySelectorAll(
        'input:not([disabled]), button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      ).length,
      otpInputs: boxes.filter((el) => el.autocomplete === 'one-time-code' && el.maxLength === 1)
        .length,
      seps: wrap.querySelectorAll('.strct-otp__sep').length,
      sepHidden: sep ? sep.getAttribute('aria-hidden') === 'true' : null,
      fill: row.classList.contains('strct-otp--fill'),
      lg: row.classList.contains('strct-otp--lg'),
      align: host.getAttribute('data-align'),
    };
  };
  const out = {};
  for (const wrap of document.querySelectorAll('[data-otp]')) out[wrap.dataset.otp] = read(wrap);
  return out;
})()`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
const ratio = (b) => b.w / b.h;
const span = (xs) => Math.max(...xs) - Math.min(...xs);
const FILLED = ['fill-300', 'fill-420', 'fill-560'];
let up = false;

async function readPage(send, scale) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1400,
    deviceScaleFactor: scale,
    mobile: false,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/otp` });
  for (let i = 0; i < 120; i++) {
    if (await evaluate(send, `!!document.querySelector('[data-otp="fill-560"] .strct-otp__box')`))
      break;
    await sleep(200);
  }
  await sleep(500);
  return evaluate(send, ROWS);
}

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  up = true;

  const r = await readPage(send, 1);
  const keys = Object.keys(r);
  check(
    'the three widths and the four placements are on the page',
    keys.length === 8 &&
      keys.every((k) => r[k].boxes.length === 6 && r[k].seps === 1) &&
      FILLED.every((k) => r[k].fill),
    `${keys.length} fixtures (${keys.join(', ')}), six cells and one separator each`,
  );

  // ── BUG-80-03: the cell keeps its shape at every width ──────────────────
  const shapes = FILLED.map((k) => ({
    k,
    w: r[k].boxes[0].w,
    h: r[k].boxes[0].h,
    ratio: ratio(r[k].boxes[0]),
    spread: span(r[k].boxes.map((b) => b.w)),
  }));
  const worst = [...shapes].sort((a, b) => b.ratio - a.ratio)[0];
  check(
    'a filled row keeps its cells upright at 300, 420 and 560px',
    shapes.every((s) => s.ratio >= RATIO[0] && s.ratio <= RATIO[1] && s.spread <= 0.6),
    shapes
      .map(
        (s) =>
          `${s.k.slice(5)}px ${s.w}x${s.h} = ${s.ratio.toFixed(2)} (was ${BEFORE[s.k][0]}x${BOX.md.h} = ${BEFORE[s.k][1]})`,
      )
      .join('; ') + ` — window ${RATIO[0]}-${RATIO[1]}, widest ${worst.ratio.toFixed(2)}`,
  );

  // The row still does the job `fill` exists for: both edges.
  const edges = [...FILLED, 'fill-center-420'].map((k) => ({
    k,
    left: r[k].boxes[0].left - r[k].host.left,
    right: r[k].host.right - r[k].boxes[5].right,
  }));
  check(
    'a filled row still reaches both edges of its field',
    edges.every((e) => Math.abs(e.left) <= EPS && Math.abs(e.right) <= EPS),
    edges
      .map((e) => `${e.k}: ${e.left.toFixed(2)}px / ${e.right.toFixed(2)}px`)
      .join('; ') + ` from the field's edges (asked ${EPS}px)`,
  );

  // The cap, and what happens to the width past it.
  const caps = FILLED.map((k) => ({ k, w: Math.max(...r[k].boxes.map((b) => b.w)) }));
  check(
    'the cells grow to the cap and no further',
    caps.every((c) => c.w <= BOX.md.max + 0.5) &&
      Math.abs(caps[0].w - BOX.md.w) <= 1 &&
      Math.abs(caps[1].w - BOX.md.max) <= 0.5 &&
      Math.abs(caps[2].w - BOX.md.max) <= 0.5,
    caps.map((c) => `${c.k.slice(5)}px → ${c.w}px`).join(', ') +
      ` (designed ${BOX.md.w}px, cap ${BOX.md.max}px)`,
  );
  const gaps = FILLED.map((k) => ({ k, g: r[k].gaps, spread: span(r[k].gaps) }));
  check(
    'the width past the cap goes into the gaps, evenly',
    gaps.every((g) => g.spread <= 0.6 && Math.min(...g.g) >= 8 - 0.5) &&
      gaps[2].g[0] > gaps[1].g[0] &&
      gaps[1].g[0] > gaps[0].g[0],
    gaps
      .map((g) => `${g.k.slice(5)}px: ${Math.min(...g.g).toFixed(1)}–${Math.max(...g.g).toFixed(1)}px`)
      .join('; ') + ' between every pair of the row’s own children, the separator among them',
  );

  // ── FR-80-06: where an unfilled row sits ────────────────────────────────
  const s0 = r['start-420'];
  check(
    'an unfilled row is the cell it always was, at the start',
    Math.abs(s0.boxes[0].w - BOX.md.w) <= 0.5 &&
      Math.abs(s0.boxes[0].h - BOX.md.h) <= 0.5 &&
      s0.font === BOX.md.font &&
      Math.abs(s0.row.left - s0.field.left) <= EPS,
    `${s0.boxes[0].w}x${s0.boxes[0].h} at ${s0.font}px, row ${s0.row.w}px starting ${(s0.row.left - s0.field.left).toFixed(2)}px into a ${s0.field.w}px field — the default moves nothing`,
  );
  const place = (k) => {
    const x = r[k];
    return { left: x.row.left - x.field.left, right: x.field.right - x.row.right };
  };
  const c = place('center-420');
  check(
    'align="center" puts the row in the middle of its field',
    Math.abs(c.left - c.right) <= EPS && c.left > EPS && c.right > EPS,
    `${c.left.toFixed(2)}px to its left and ${c.right.toFixed(2)}px to its right in a ${r['center-420'].field.w}px field (was ${place('start-420').left.toFixed(0)}px / ${place('start-420').right.toFixed(0)}px)`,
  );
  const e = place('end-420');
  check(
    'align="end" puts it at the end',
    Math.abs(e.right) <= EPS && e.left > EPS,
    `${e.left.toFixed(2)}px to its left, ${e.right.toFixed(2)}px to its right`,
  );
  const fc = place('fill-center-420');
  check(
    'with fill, align has nothing left to place',
    Math.abs(fc.left) <= EPS &&
      Math.abs(fc.right) <= EPS &&
      Math.abs(r['fill-center-420'].row.w - r['fill-center-420'].field.w) <= EPS,
    `fill with align="center": ${fc.left.toFixed(2)}px / ${fc.right.toFixed(2)}px — the row spans its ${r['fill-center-420'].field.w}px field either way`,
  );

  // ── The bigger cell asked for beside the fix ────────────────────────────
  const lg = r['lg-420'];
  const lgPlace = place('lg-420');
  check(
    'size="lg" is a bigger cell, not a stretched one',
    Math.abs(lg.boxes[0].w - BOX.lg.w) <= 0.5 &&
      Math.abs(lg.boxes[0].h - BOX.lg.h) <= 0.5 &&
      lg.font === BOX.lg.font &&
      ratio(lg.boxes[0]) >= RATIO[0] &&
      ratio(lg.boxes[0]) <= RATIO[1] &&
      Math.abs(lgPlace.left - lgPlace.right) <= EPS,
    `${lg.boxes[0].w}x${lg.boxes[0].h} = ${ratio(lg.boxes[0]).toFixed(2)} at ${lg.font}px, centred ${lgPlace.left.toFixed(2)}px / ${lgPlace.right.toFixed(2)}px`,
  );

  // A cell the glyph no longer fills is the same complaint from the other side.
  const ink = keys.map((k) => ({
    k,
    share: r[k].glyph / Math.max(...r[k].boxes.map((b) => b.w)),
  }));
  const thinnest = [...ink].sort((a, b) => a.share - b.share)[0];
  check(
    'the glyph still fills the cell at the cap',
    ink.every((i) => i.share >= INK),
    `thinnest ${(thinnest.share * 100).toFixed(0)}% of the cell's width (${thinnest.k}, a ${r[thinnest.k].glyph}px digit in a ${Math.max(...r[thinnest.k].boxes.map((b) => b.w))}px cell), floor ${INK * 100}%`,
  );

  // Nothing of the control itself changed.
  check(
    'the row is still six one-time-code boxes and a separator nobody hears',
    keys.every(
      (k) =>
        r[k].otpInputs === 6 &&
        r[k].sepHidden === true &&
        r[k].tabbable === 6 + (r[k].hasButton ? 1 : 0),
    ),
    `six boxes with autocomplete="one-time-code" and maxlength 1 in each of ${keys.length} fixtures, one aria-hidden separator each, and ${keys.filter((k) => !r[k].hasButton).length} rows with exactly six tab stops`,
  );

  // ── The same shape at 1.25x and 2x ─────────────────────────────────────
  const zoomed = [];
  for (const scale of [1.25, 2]) {
    const z = await readPage(send, scale);
    for (const k of [...FILLED, 'lg-420']) {
      for (const b of z[k].boxes) zoomed.push({ at: `${scale}x`, k, ratio: ratio(b) });
    }
    zoomed.push({
      at: `${scale}x`,
      k: 'edges',
      edge: Math.max(
        ...FILLED.map((k) =>
          Math.max(
            Math.abs(z[k].boxes[0].left - z[k].host.left),
            Math.abs(z[k].host.right - z[k].boxes[5].right),
          ),
        ),
      ),
    });
  }
  const zr = zoomed.filter((z) => z.ratio !== undefined);
  const ze = zoomed.filter((z) => z.edge !== undefined);
  const zworst = [...zr].sort((a, b) => b.ratio - a.ratio)[0];
  check(
    'the cell stays upright, and the row flush, at 1.25x and 2x',
    zr.every((z) => z.ratio >= RATIO[0] && z.ratio <= RATIO[1]) &&
      ze.every((z) => z.edge <= EPS),
    `${zr.length} cells over two scales — widest ${zworst.ratio.toFixed(2)} (${zworst.k} at ${zworst.at}); worst edge ${Math.max(...ze.map((z) => z.edge)).toFixed(2)}px`,
  );
} catch (err) {
  check('the gate ran', false, String(err));
} finally {
  if (up) await closeChrome();
  else {
    chrome.kill('SIGKILL');
    dropProfile();
  }
  server.close();
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? '✓' : '✗'} ${c.name} — ${c.detail}`);
if (failed.length) {
  console.error(`\n✗ ${failed.length} of ${checks.length} otp-row checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} otp-row checks passed.`);
