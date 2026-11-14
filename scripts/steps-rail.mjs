/**
 * BUG-80-01 / FR-80-02: a step's emphasis stays inside the step, and a run of
 * hosts can be read down a column.
 *
 * The active pill said "now" by growing its own box by 1px and scaling it to
 * 1.06 about its centre, which reaches 1 + 0.03 x (w + 2) px past the border
 * on each side: 2.92px for a 62px pill, 4.66px for a 120px one — into a 4px
 * gap that also held a 5px connector. Past about 98px the ring drew over the
 * neighbour's border, moving, beside a still neighbour, which is why a
 * photograph of the update run card read as objects sitting on top of each
 * other. And five pills of five widths line up with nothing, so a run of
 * several hosts could not be read down a column at all.
 *
 * Nothing here is taken from the stylesheet. The ring's painted pixels are
 * found by taking the same shot twice — once as it renders, once with the
 * ring suppressed — and diffing them, so "no painted pixel of the ring falls
 * inside a neighbour" is measured rather than reasoned about, at three scales
 * and three points of the pulse. The rail's segments, its gaps, and the names
 * standing over their own columns are read from the layout; done and active
 * are told apart in a greyscale render of the rail itself.
 *
 *   node scripts/steps-rail.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4716;
const CDP = 9416;
/** The cell a run is drawn in, and the steps in it. */
const CELL = 600;
const SEGMENTS = 5;
/** Subpixel slack: the FR asks for equal columns and +-0.5px alignment. */
const EPS = 0.5;
/** The scales every claim about shape is re-read at. */
const SCALES = [1, 1.25, 2];
/** Points of the 1.4s pulse the ring is caught at. */
const PHASES = [-0.1, -0.5, -1.2];

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

import { PNG } from 'pngjs';

/** Every fixture's geometry, in document coordinates. */
const LAYOUT = `(() => {
  const r = (el) => {
    const b = el.getBoundingClientRect();
    return {
      left: +(b.left + scrollX).toFixed(2),
      right: +(b.right + scrollX).toFixed(2),
      top: +(b.top + scrollY).toFixed(2),
      bottom: +(b.bottom + scrollY).toFixed(2),
      w: +b.width.toFixed(2),
      h: +b.height.toFixed(2),
    };
  };
  const step = (el) => ({
    state: el.dataset.state,
    label: el.querySelector('.strct-steps__label')?.textContent.trim() ?? null,
    text: el.textContent.replace(/\\s+/g, ' ').trim(),
    box: r(el),
    bar: el.querySelector('.strct-steps__bar') ? r(el.querySelector('.strct-steps__bar')) : null,
    name: el.querySelector('.strct-steps__label') ? r(el.querySelector('.strct-steps__label')) : null,
  });
  const rail = (el) =>
    el ? { box: r(el), steps: [...el.querySelectorAll('.strct-steps__step')].map(step) } : null;
  const pills = (key) => {
    const wrap = document.querySelector('[data-rail="' + key + '"]');
    if (!wrap) return null;
    const list = wrap.querySelector('.strct-steps__list');
    const steps = [...wrap.querySelectorAll('.strct-steps__step')];
    const before = getComputedStyle(steps[1], '::before');
    const after = getComputedStyle(steps.find((s) => s.dataset.state === 'active'), '::after');
    return {
      list: r(list),
      steps: steps.map(step),
      gap: parseFloat(getComputedStyle(list).columnGap),
      connector: { left: parseFloat(before.left), width: parseFloat(before.width) },
      ring: {
        animation: after.animationName,
        transform: after.transform,
        inset: parseFloat(after.left),
      },
    };
  };
  const column = document.querySelector('[data-rail="column"]');
  return {
    heading: rail(column?.querySelector('.strct-steps--rail-names')),
    hosts: [...(column?.querySelectorAll('[data-rail-row]') ?? [])].map((el) => ({
      id: el.getAttribute('data-rail-row'),
      ...rail(el),
    })),
    under: rail(document.querySelector('[data-rail="under"] .strct-steps')),
    pills: pills('pills'),
    dense: pills('pills-dense'),
  };
})()`;

/** The same steps as pills, for the sentence a reader is handed. */
const SPOKEN = `(() => {
  const read = (sel) =>
    [...document.querySelectorAll(sel + ' .strct-steps__step')].map((el) =>
      el.textContent.replace(/\\s+/g, ' ').trim(),
    );
  return {
    rail: read('[data-rail="under"] .strct-steps'),
    pills: read('[data-rail="pills"] .strct-steps'),
    listLabel: document
      .querySelector('[data-rail="under"] .strct-steps__list')
      ?.getAttribute('aria-label'),
  };
})()`;

/** Chrome's own accessible name for one element. */
async function axName(send, selector) {
  const { root } = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) return null;
  const { nodes } = await send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return nodes.find((n) => n.name?.value)?.name?.value ?? null;
}

/** The text runs Chrome would hand a reader for one element's subtree. */
async function axRuns(send, selector) {
  const { root } = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) return [];
  // queryAXTree walks the node's own subtree; getPartialAXTree returns the
  // node and its ancestors, which for a list item is no text at all.
  const { nodes } = await send('Accessibility.queryAXTree', { nodeId, role: 'StaticText' });
  return nodes.filter((n) => n.name?.value?.trim()).map((n) => n.name.value.trim());
}

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
const span = (xs) => Math.max(...xs) - Math.min(...xs);
let up = false;

/** A clip of the page, as pixels, with the factor between CSS px and them. */
async function shot(send, box, pad = 8) {
  const clip = {
    x: Math.round(box.left) - pad,
    y: Math.round(box.top) - pad,
    width: Math.round(box.w) + pad * 2,
    height: Math.round(box.h) + pad * 2,
    scale: 1,
  };
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip });
  const png = PNG.sync.read(Buffer.from(data, 'base64'));
  return { png, clip, k: png.width / clip.width };
}

/** The pixels one shot has and the other does not — what that layer paints. */
function painted(a, b) {
  const out = [];
  const n = Math.min(a.png.data.length, b.png.data.length);
  for (let i = 0; i < n; i += 4) {
    const d =
      Math.abs(a.png.data[i] - b.png.data[i]) +
      Math.abs(a.png.data[i + 1] - b.png.data[i + 1]) +
      Math.abs(a.png.data[i + 2] - b.png.data[i + 2]);
    if (d > 8) {
      const p = i / 4;
      const px = p % a.png.width;
      const py = Math.floor(p / a.png.width);
      // Back to CSS pixels, in document coordinates.
      out.push([a.clip.x + px / a.k, a.clip.y + py / a.k]);
    }
  }
  return out;
}

const inside = (x, y, b) => x >= b.left && x < b.right && y >= b.top && y < b.bottom;
/** How far outside a box a point is (0 when it is inside). */
const outside = (x, y, b) =>
  Math.max(0, b.left - x, x - b.right, b.top - y, y - b.bottom);

async function style(send, css) {
  await evaluate(
    send,
    `(() => {
       let el = document.getElementById('gate-style');
       if (!el) { el = document.createElement('style'); el.id = 'gate-style'; document.head.append(el); }
       el.textContent = ${JSON.stringify(css)};
     })()`,
  );
  await sleep(120);
}

async function open(send, scale) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1500,
    height: 1200,
    deviceScaleFactor: scale,
    mobile: false,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/steps` });
  for (let i = 0; i < 120; i++) {
    if (await evaluate(send, `!!document.querySelector('[data-rail="column"] .strct-steps__bar')`))
      break;
    await sleep(200);
  }
  await evaluate(
    send,
    `document.querySelector('#steps-rail')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -40)`,
  );
  await sleep(500);
  return evaluate(send, LAYOUT);
}

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Accessibility.enable');
  up = true;

  const L = await open(send, 1);
  check(
    'the case is on the page',
    !!L.heading &&
      L.hosts.length === 3 &&
      L.heading.steps.length === SEGMENTS &&
      L.hosts.every((h) => h.steps.length === SEGMENTS) &&
      Math.abs(L.hosts[0].box.w - CELL) <= 1 &&
      !!L.pills?.steps.length,
    `a names-only row over ${L.hosts.length} rails of ${SEGMENTS} segments in a ${L.hosts[0]?.box.w}px cell, plus ${L.pills?.steps.length} pills and ${L.dense?.steps.length} dense ones`,
  );

  // ── FR-80-02: equal segments, equal gaps, nothing inside its neighbour ──
  const widths = L.hosts.flatMap((h) => h.steps.map((s) => s.bar.w));
  const gaps = L.hosts.flatMap((h) =>
    h.steps.slice(1).map((s, i) => +(s.bar.left - h.steps[i].bar.right).toFixed(2)),
  );
  const overlaps = L.hosts.flatMap((h) =>
    h.steps.slice(1).filter((s, i) => s.bar.left < h.steps[i].bar.right - 0.01),
  );
  check(
    'a rail is equal segments with equal gaps',
    span(widths) <= EPS && span(gaps) <= EPS && overlaps.length === 0,
    `${widths.length} segments of ${Math.min(...widths).toFixed(2)}–${Math.max(...widths).toFixed(2)}px in a ${CELL}px cell, gaps ${Math.min(...gaps).toFixed(2)}–${Math.max(...gaps).toFixed(2)}px, ${overlaps.length} overlapping`,
  );

  // The shared row of names stands over the columns of every rail under it.
  const offsets = [];
  for (const host of L.hosts) {
    host.steps.forEach((s, i) => {
      const name = L.heading.steps[i].name;
      offsets.push(Math.abs(name.left - s.bar.left), Math.abs(name.right - s.bar.right));
    });
  }
  check(
    'every name in the shared row stands over its own column',
    offsets.every((d) => d <= EPS),
    `${offsets.length} edges checked over ${L.hosts.length} rails — worst ${Math.max(...offsets).toFixed(2)}px (asked ${EPS}px)`,
  );

  // The sentence a reader is handed is the one pills hand them — asked of
  // Chrome's own accessibility tree, not of the markup we wrote.
  const spoken = await evaluate(send, SPOKEN);
  const railRuns = await axRuns(send, '[data-rail="under"] .strct-steps__step[data-state="active"]');
  const pillRuns = await axRuns(send, '[data-rail="pills"] .strct-steps__step[data-state="active"]');
  const railList = await axName(send, '[data-rail="under"] .strct-steps__list');
  check(
    'a rail says what the pills say',
    spoken.rail.length === SEGMENTS &&
      railRuns.length > 0 &&
      railRuns.join(' | ') === pillRuns.join(' | ').replace('Wait for drain and reboot', railRuns[0]) &&
      railList === 'hv-04 update',
    `Chrome reads the running step as ${railRuns.map((t) => `"${t}"`).join(' then ')} in the rail and ${pillRuns.map((t) => `"${t}"`).join(' then ')} in the pills — the same runs, in a list it names "${railList}"`,
  );

  // ── Done and active, with the hue taken away ───────────────────────────
  const hv02 = L.hosts.find((h) => h.id === 'hv-02');
  const railShot = await shot(send, hv02.box, 2);
  const grey = (box) => {
    const vals = [];
    for (let y = Math.ceil(box.top); y < box.bottom - 0.5; y++) {
      for (let x = Math.ceil(box.left); x < box.right - 0.5; x++) {
        const px = Math.round((x - railShot.clip.x) * railShot.k);
        const py = Math.round((y - railShot.clip.y) * railShot.k);
        if (px < 0 || py < 0 || px >= railShot.png.width || py >= railShot.png.height) continue;
        const i = (py * railShot.png.width + px) * 4;
        vals.push(
          0.2126 * railShot.png.data[i] +
            0.7152 * railShot.png.data[i + 1] +
            0.0722 * railShot.png.data[i + 2],
        );
      }
    }
    const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
    const sd = Math.sqrt(
      vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, vals.length),
    );
    return { mean, sd, n: vals.length };
  };
  const done = grey(hv02.steps.find((s) => s.state === 'done').bar);
  const active = grey(hv02.steps.find((s) => s.state === 'active').bar);
  check(
    'active and done are told apart without the hue',
    done.n > 50 && active.n > 50 && (Math.abs(done.mean - active.mean) >= 10 || active.sd - done.sd >= 6),
    `greyscale: done ${done.mean.toFixed(1)} ± ${done.sd.toFixed(1)}, active ${active.mean.toFixed(1)} ± ${active.sd.toFixed(1)} over ${done.n} and ${active.n} pixels — the stripe is ${(active.sd - done.sd).toFixed(1)} of spread the flat fill has not`,
  );

  // ── BUG-80-01: the ring's painted pixels, at three scales and three
  //    points of the pulse ───────────────────────────────────────────────
  const reaches = [];
  const intrusions = [];
  for (const scale of SCALES) {
    const S = scale === 1 ? L : await open(send, scale);
    for (const key of ['pills', 'dense']) {
      const row = S[key];
      const act = row.steps.find((s) => s.state === 'active');
      const others = row.steps.filter((s) => s !== act);
      for (const phase of PHASES) {
        await style(
          send,
          `.strct-steps__step[data-state='active']::after {` +
            ` animation-delay: ${phase}s !important; animation-play-state: paused !important; }`,
        );
        const withRing = await shot(send, row.list, 10);
        await style(
          send,
          `.strct-steps__step[data-state='active']::after {` +
            ` animation-delay: ${phase}s !important; animation-play-state: paused !important;` +
            ` display: none !important; }`,
        );
        const without = await shot(send, row.list, 10);
        await style(send, '');
        const ink = painted(withRing, without);
        const out = ink.map(([x, y]) => outside(x, y, act.box));
        reaches.push({
          at: `${scale}x ${key} t=${Math.abs(phase)}s`,
          px: ink.length,
          reach: ink.length ? Math.max(...out) : 0,
        });
        intrusions.push({
          at: `${scale}x ${key} t=${Math.abs(phase)}s`,
          n: ink.filter(([x, y]) => others.some((o) => inside(x, y, o.box))).length,
        });
      }
    }
  }
  const worstReach = [...reaches].sort((a, b) => b.reach - a.reach)[0];
  const painting = reaches.filter((r) => r.px > 0);
  check(
    "the active step's ring never leaves the step that owns it",
    intrusions.every((i) => i.n === 0) && worstReach.reach <= EPS && painting.length === reaches.length,
    `${reaches.length} shots over ${SCALES.join('x, ')}x, dense and default, at ${PHASES.length} points of the pulse: the ring paints ${Math.min(...reaches.map((r) => r.px))}–${Math.max(...reaches.map((r) => r.px))} pixels and reaches ${worstReach.reach.toFixed(2)}px past its own border (${worstReach.at}); ${intrusions.reduce((n, i) => n + i.n, 0)} of them inside a neighbour — the 120px pill in the fixture used to carry 4.66px of ring into a 4px gap`,
  );

  // ── The connector, and the daylight on both sides of it ────────────────
  const L1 = await open(send, 1);
  const row = L1.pills;
  const beforeGap = row.gap + row.connector.left;
  const afterGap = -(row.connector.left + row.connector.width);
  const second = row.steps[1];
  const first = row.steps[0];
  // The ring is paused for both shots: an animation running between them
  // would land in the diff as if the connector had painted it.
  const hold = `.strct-steps__step[data-state='active']::after { animation-delay: -0.4s !important; animation-play-state: paused !important; }`;
  await style(send, hold);
  const withConn = await shot(send, row.list, 10);
  await style(
    send,
    hold + ` .strct-steps__step + .strct-steps__step::before { display: none !important; }`,
  );
  const withoutConn = await shot(send, row.list, 10);
  await style(send, '');
  const connInk = painted(withConn, withoutConn);
  const touching = connInk.filter(
    ([x, y]) => inside(x, y, first.box) || inside(x, y, second.box),
  ).length;
  check(
    'the connector sits in the gap and touches neither pill',
    beforeGap > 0 && afterGap > 0 && touching === 0 && connInk.length > 0,
    `a ${row.connector.width}px line in a ${row.gap}px gap: ${beforeGap.toFixed(1)}px of daylight before it and ${afterGap.toFixed(1)}px after, ${connInk.length} painted pixels, ${touching} of them on a pill (it was a 5px line in a 4px gap, over the border on both sides)`,
  );

  // ── Reduced motion keeps the ring it has today ─────────────────────────
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await sleep(300);
  const reduced = await evaluate(
    send,
    `(() => {
       const el = document.querySelector('[data-rail="pills"] .strct-steps__step[data-state="active"]');
       const cs = getComputedStyle(el, '::after');
       return { animation: cs.animationName, opacity: cs.opacity, transform: cs.transform };
     })()`,
  );
  const rowRm = (await evaluate(send, LAYOUT)).pills;
  const rmWith = await shot(send, rowRm.list, 10);
  await style(send, `.strct-steps__step[data-state='active']::after { display: none !important; }`);
  const rmWithout = await shot(send, rowRm.list, 10);
  await style(send, '');
  const rmInk = painted(rmWith, rmWithout);
  const rmAct = rowRm.steps.find((s) => s.state === 'active');
  check(
    'prefers-reduced-motion keeps a still ring, and it stays inside too',
    reduced.animation === 'none' &&
      rmInk.length > 0 &&
      Math.max(...rmInk.map(([x, y]) => outside(x, y, rmAct.box))) <= EPS,
    `animation ${reduced.animation}, opacity ${reduced.opacity}, transform ${reduced.transform} — ${rmInk.length} pixels of ring, none past the step's border`,
  );
  await send('Emulation.setEmulatedMedia', { features: [] });
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
  console.error(`\n✗ ${failed.length} of ${checks.length} steps-rail checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} steps-rail checks passed.`);
