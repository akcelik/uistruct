/**
 * FR-72-01: a matrix of judgements, not of numbers.
 *
 * The card this was filed from draws 85 categorical cells and loses the two
 * things that matter most about them. Measured off the reference PNG: the
 * "not on a node" outline reads 1.15:1 against the card and the "not judged"
 * hatch 1.52:1, both under the 3:1 WCAG 1.4.11 asks of a graphic that carries
 * meaning; and warning against critical is 1.44:1 in luminance — nothing but
 * hue separates the pair that decides whether anyone is paged, and under a
 * deuteranopia simulation it falls to dE00 12.1 on a 26 x 14px pill with no
 * text in it.
 *
 * So this measures the replacement, from what Chrome drew: the ink of every
 * state against its own ground, the shape each state draws, where each mark
 * sits in its row, what every cell says out loud, and whether the roll-ups
 * agree with the lines they summarise. Two widths, both palettes.
 *
 *   node scripts/status-matrix.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { PNG } from 'pngjs';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4711;
const CDP = 9411;
const ROUTE = '/components/status-matrix';
const RUNS = [
  { width: 1600, theme: 'light' },
  { width: 1240, theme: 'dark' },
];
/** WCAG 1.4.11 for a graphic you must see to understand the content. */
const AANT = 3;
/** How far a mark may sit off its row's centre line. */
const CENTRE = 1;
/**
 * How much of a mark must differ from every other mark once the colour is
 * taken out of it. The house precedent is scripts/glyph-distinct.mjs: the
 * closest accepted pair in the icon set is lock/unlock at 2.28%, and new work
 * is held to twice the set's own worst case.
 */
const SHAPE = 4.56;

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

/** Everything the checks read, from the grid the showcase draws. */
const READ = `(() => {
  const host = document.querySelector('#status-matrix strct-status-matrix');
  if (!host) return null;
  const grid = host.querySelector('.strct-status-matrix__grid');
  if (!grid) return null;
  const surface = getComputedStyle(host.closest('.demo__stage') ?? document.body).backgroundColor;

  const stateOf = (el) =>
    (el.getAttribute('class').match(/__mark--([a-z-]+)/) ?? [])[1] ?? 'unknown';

  const cells = [...grid.querySelectorAll('[data-matrix-cell]')].map((td) => {
    const mark = td.querySelector('.strct-status-matrix__mark');
    const svg = mark.querySelector('svg path, svg circle, svg line, svg polyline, svg polygon');
    const mb = mark.getBoundingClientRect();
    const row = td.closest('tr');
    const head = row.querySelector('.strct-status-matrix__rowhead');
    const rb = row.getBoundingClientRect();
    const hb = head.getBoundingClientRect();
    const cs = getComputedStyle(mark);
    return {
      key: td.getAttribute('data-matrix-cell'),
      state: stateOf(mark),
      says: td.querySelector('.strct-status-matrix__sr').textContent.trim(),
      ink: cs.color,
      ground: cs.backgroundColor,
      border: cs.borderTopColor,
      borderStyle: cs.borderTopStyle,
      borderWidth: Number.parseFloat(cs.borderTopWidth) || 0,
      shape: svg ? (svg.getAttribute('d') ?? svg.tagName + ':' + [...svg.attributes].map((a) => a.name + a.value).join(',')) : null,
      markBox: {
        x: Math.round(mb.left + scrollX),
        y: Math.round(mb.top + scrollY),
        w: Math.round(mb.width),
        h: Math.round(mb.height),
      },
      markMid: mb.top + mb.height / 2,
      rowMid: rb.top + rb.height / 2,
      headLines: Math.max(1, Math.round(hb.height / (Number.parseFloat(getComputedStyle(head).lineHeight) || 20))),
      headH: hb.height,
      tabindex: td.getAttribute('tabindex'),
      srVisible: getComputedStyle(td.querySelector('.strct-status-matrix__sr')).position === 'static',
    };
  });

  const legend = [...host.querySelectorAll('.strct-status-matrix__key')].map((li) => li.textContent.trim());
  return {
    surface,
    cells,
    legend,
    rows: grid.querySelectorAll('tbody tr').length,
    cols: grid.querySelectorAll('thead th').length - 1,
    role: grid.getAttribute('role'),
    gridLabel: grid.getAttribute('aria-label'),
    stacked: getComputedStyle(grid.querySelector('tbody tr')).display === 'block',
    summaryCols: [...grid.querySelectorAll('thead th')].filter(
      (th) => Number.parseFloat(getComputedStyle(th).borderLeftWidth) > 0,
    ).length,
  };
})()`;

/** The fixture, as the showcase declares it: p w c n u . per row, 4 nodes + Cluster. */
const CHECKS = [
  ['H2', 'ppppp'],
  ['H3', 'npppp'],
  ['H4', 'pwpp.'],
  ['H5', 'ppup.'],
  ['H6', 'wppp.'],
  ['H7', 'uppwp'],
  ['H8', 'ppppp'],
  ['H9', 'ppcpp'],
  ['H10', 'ppppp'],
  ['H11', 'pppup'],
  ['H12', 'pppw.'],
  ['H13', 'pppp.'],
  ['H14', 'ppppp'],
  ['H15', 'pppp.'],
  ['H16', '....p'],
  ['H17', '....p'],
  ['H19', 'ppppp'],
];
const CODE = {
  p: 'success',
  w: 'warning',
  c: 'critical',
  n: 'accent',
  u: 'unjudged',
  '.': 'off-subject',
};
const COLS = ['n1', 'n2', 'n3', 'n4', 'cl'];
/** The order a roll-up uses: an unread check beats a note and a pass. */
const RANK = {
  critical: 6,
  warning: 5,
  unjudged: 4,
  accent: 3,
  success: 2,
  neutral: 1,
  'off-subject': 0,
};
const worst = (states) => states.reduce((m, s) => (RANK[s] > RANK[m] ? s : m), 'off-subject');

const parse = (c) => (c.match(/[0-9.]+/g) ?? [0, 0, 0, 1]).map(Number);
const over = (fg, a, bg) => fg.map((v, i) => v * a + bg[i] * (1 - a));
const lum = ([r, g, b]) => {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** The ground a mark is actually read against: its own fill over the card. */
const groundOf = (cell, surface) => {
  const g = parse(cell.ground);
  const alpha = g.length > 3 ? g[3] : 1;
  return alpha > 0 ? over(g.slice(0, 3), alpha, surface) : surface;
};

/** Machado (2009) severity-1.0 colour-vision simulation, on linear RGB. */
const M = {
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
};
const linOf = (v) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const unlin = (c) => {
  const v = Math.max(0, Math.min(1, c));
  return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
};
const sim = (rgb, m) => {
  const v = rgb.map(linOf);
  return [0, 1, 2].map((i) => unlin(m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2]));
};
const lab = (rgb) => {
  const [r, g, b] = rgb.map(linOf);
  const X = 0.4124 * r + 0.3576 * g + 0.1805 * b;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = 0.0193 * r + 0.1192 * g + 0.9505 * b;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const fx = f(X / 0.95047);
  const fy = f(Y);
  const fz = f(Z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};
/** CIEDE2000, so the separation figure is the one a colour scientist would quote. */
function de00(c1, c2) {
  const [L1, a1, b1] = lab(c1);
  const [L2, a2, b2] = lab(c2);
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)) || 0);
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1 = ((Math.atan2(b1, a1p) * 180) / Math.PI + 360) % 360;
  const h2 = ((Math.atan2(b2, a2p) * 180) / Math.PI + 360) % 360;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dh = h2 - h1;
  if (C1p * C2p === 0) dh = 0;
  else if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh * Math.PI) / 360);
  const Lb = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp;
  if (C1p * C2p === 0) hbp = h1 + h2;
  else if (Math.abs(h1 - h2) <= 180) hbp = (h1 + h2) / 2;
  else hbp = h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
  const rad = (d) => (d * Math.PI) / 180;
  const T =
    1 -
    0.17 * Math.cos(rad(hbp - 30)) +
    0.24 * Math.cos(rad(2 * hbp)) +
    0.32 * Math.cos(rad(3 * hbp + 6)) -
    0.2 * Math.cos(rad(4 * hbp - 63));
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt =
    -Math.sin(rad(60 * Math.exp(-(((hbp - 275) / 25) ** 2)))) *
    2 *
    Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh),
  );
}

/** One mark, rendered at 4x and reduced to luminance. */
async function greyShot(send, box) {
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 4 },
  });
  const png = PNG.sync.read(Buffer.from(shot.data, 'base64'));
  const grey = new Uint8Array(png.width * png.height);
  for (let i = 0; i < grey.length; i++)
    grey[i] = Math.round(
      0.299 * png.data[i * 4] + 0.587 * png.data[i * 4 + 1] + 0.114 * png.data[i * 4 + 2],
    );
  return { grey, w: png.width, h: png.height };
}

/** The share of pixels two marks disagree on, once both are only luminance. */
function greyDiff(a, b) {
  const n = Math.min(a.grey.length, b.grey.length);
  let differ = 0;
  for (let i = 0; i < n; i++) if (Math.abs(a.grey[i] - b.grey[i]) > 16) differ += 1;
  return (differ / n) * 100;
}

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
let up = false;

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  up = true;

  for (const { width, theme } of RUNS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 2200,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.querySelector('#status-matrix [data-matrix-cell]')`))
        break;
      await sleep(200);
    }
    await evaluate(send, `document.documentElement.setAttribute('data-theme', '${theme}')`);
    await sleep(700);
    const r = await evaluate(send, READ);
    const at = `${width}px ${theme}`;

    check(
      `${at}: the filed case is on the page`,
      !!r && r.role === 'grid' && r.rows === 18 && r.cols === 6 && r.cells.length === 108,
      r
        ? `role=${r.role}, ${r.rows} rows (17 checks + roll-up), ${r.cols} columns (4 nodes + Cluster + roll-up), ${r.cells.length} cells, legend: ${r.legend.join(' · ')}`
        : 'no grid — every check below would read nothing',
    );
    if (!r || r.cells.length !== 108) break;
    const surface = parse(r.surface).slice(0, 3);
    const byState = new Map();
    for (const c of r.cells) if (!byState.has(c.state)) byState.set(c.state, c);

    // 1. Every state's mark is visible against the ground it is read on.
    const inks = [...byState.entries()].map(([state, c]) => {
      const ground = groundOf(c, surface);
      // The mark that carries the meaning: the glyph for the states that have
      // one, the outline for the state whose absence IS the shape.
      const ratio = c.shape
        ? contrast(parse(c.ink).slice(0, 3), ground)
        : contrast(parse(c.border).slice(0, 3), surface);
      return { state, ratio, via: c.shape ? 'glyph on its own ground' : 'outline on the card' };
    });
    const worstInk = inks.sort((a, b) => a.ratio - b.ratio)[0];
    check(
      `${at}: every state is visible against what it is drawn on`,
      inks.every((i) => i.ratio >= AANT),
      `worst of ${inks.length}: ${worstInk.state} ${worstInk.ratio.toFixed(2)}:1 (${worstInk.via}, floor ${AANT}) · ${inks.map((i) => `${i.state} ${i.ratio.toFixed(2)}`).join(', ')}`,
    );

    // 2. With the colour taken out of them, the marks still differ. This is
    //    the claim the whole component rests on, so it is measured the way
    //    glyph-distinct measures a glyph: render it, strip the hue, and count
    //    the pixels that disagree.
    const grey = new Map();
    for (const [state, c] of byState) grey.set(state, await greyShot(send, c.markBox));
    const names = [...grey.keys()];
    const pairs = [];
    for (let i = 0; i < names.length; i++)
      for (let j = i + 1; j < names.length; j++)
        pairs.push({
          a: names[i],
          b: names[j],
          pct: greyDiff(grey.get(names[i]), grey.get(names[j])),
        });
    const closest = pairs.sort((x, y) => x.pct - y.pct)[0];
    check(
      `${at}: no two states are told apart by hue alone`,
      pairs.every((p) => p.pct >= SHAPE),
      `${pairs.length} pairs in greyscale, closest ${closest.a}/${closest.b} at ${closest.pct.toFixed(2)}% (floor ${SHAPE}%, twice the icon set's own worst accepted pair)`,
    );

    const pair = (a, b) => {
      const ca = parse(byState.get(a).ink).slice(0, 3);
      const cb = parse(byState.get(b).ink).slice(0, 3);
      return {
        lum: contrast(ca, cb),
        normal: de00(ca, cb),
        deuter: de00(sim(ca, M.deuteranopia), sim(cb, M.deuteranopia)),
        protan: de00(sim(ca, M.protanopia), sim(cb, M.protanopia)),
      };
    };
    const wc = pair('warning', 'critical');
    check(
      `${at}: the pair that decides a page-out is told apart by more than hue`,
      byState.get('warning').shape !== byState.get('critical').shape,
      `warning/critical ink: ${wc.lum.toFixed(2)}:1 in luminance, dE00 ${wc.normal.toFixed(1)} normal / ${wc.deuter.toFixed(1)} deuteranopia / ${wc.protan.toFixed(1)} protanopia — separated by a triangle against a ring, not by the hue`,
    );

    // 3. A mark sits on its row's centre line, whatever the label does.
    const off = r.cells.map((c) => Math.abs(c.markMid - c.rowMid));
    const wrapped = r.cells.filter((c) => c.headLines > 1);
    check(
      `${at}: every mark is on its row's centre line`,
      Math.max(...off) <= CENTRE,
      `worst ${Math.max(...off).toFixed(2)}px of ${off.length} cells (floor ${CENTRE}px), ${wrapped.length ? `${wrapped.length / r.cols} row(s) with a label over one line, worst there ${Math.max(...wrapped.map((c) => Math.abs(c.markMid - c.rowMid))).toFixed(2)}px` : 'no label wrapped at this width'}`,
    );

    // 4. Every cell says the whole sentence it is drawing.
    const words = {
      success: 'passed',
      warning: 'warning',
      critical: 'critical',
      accent: 'note',
      unjudged: 'not judged',
      'off-subject': 'not on this subject',
    };
    const mute = r.cells.filter((c) => {
      const [rowId, colId] = c.key.split('/');
      if (rowId === '__strct_rollup__' || colId === '__strct_rollup__') return false;
      return !(c.says.startsWith(`${rowId} `) && c.says.includes(words[c.state]));
    });
    check(
      `${at}: every cell says its row, its subject and its state`,
      mute.length === 0,
      mute.length
        ? `${mute.length} silent: ${mute
            .slice(0, 2)
            .map((c) => `${c.key} "${c.says}"`)
            .join('; ')}`
        : `e.g. "${r.cells.find((c) => c.key === 'H9/n3').says}"`,
    );

    // 5. The roll-ups agree with the lines they summarise.
    const declared = new Map();
    for (const [id, codes] of CHECKS)
      [...codes].forEach((code, i) => declared.set(`${id}/${COLS[i]}`, CODE[code]));
    const bad = [];
    for (const [id] of CHECKS) {
      const want = worst(COLS.map((c) => declared.get(`${id}/${c}`)));
      const got = r.cells.find((c) => c.key === `${id}/__strct_rollup__`)?.state;
      if (got !== want) bad.push(`${id} row: ${got} ≠ ${want}`);
    }
    for (const col of COLS) {
      const want = worst(CHECKS.map(([id]) => declared.get(`${id}/${col}`)));
      const got = r.cells.find((c) => c.key === `__strct_rollup__/${col}`)?.state;
      if (got !== want) bad.push(`${col} column: ${got} ≠ ${want}`);
    }
    check(
      `${at}: every roll-up is the worst of its own line`,
      bad.length === 0,
      bad.length
        ? bad.join('; ')
        : `${CHECKS.length} rows and ${COLS.length} columns rolled up independently and agreed`,
    );

    // 6. The summary column is ruled off from the subjects it summarises.
    check(
      `${at}: a summary column reads as a different kind of subject`,
      r.summaryCols === 2,
      `${r.summaryCols} of ${r.cols} column heads ruled off (Cluster and the roll-up)`,
    );
  }

  // ── The keyboard.
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 2200,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` });
  for (let i = 0; i < 120; i++) {
    if (await evaluate(send, `!!document.querySelector('#status-matrix [data-matrix-cell]')`))
      break;
    await sleep(200);
  }
  await sleep(700);

  const stops = await evaluate(
    send,
    `[...document.querySelectorAll('#status-matrix [data-matrix-cell]')].filter((c) => c.getAttribute('tabindex') === '0').length`,
  );
  check('the grid is one tab stop, not 108', stops === 1, `${stops} cell(s) in the tab order`);

  const walk = await evaluate(
    send,
    `(() => {
      const at = (k) => [...document.querySelectorAll('#status-matrix [data-matrix-cell]')]
        .find((c) => c.getAttribute('data-matrix-cell') === k);
      const key = (el, k, opts = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts }));
      const start = at('H2/n1');
      start.focus();
      key(start, 'ArrowDown');
      const down = document.activeElement.getAttribute('data-matrix-cell');
      key(document.activeElement, 'ArrowRight');
      const right = document.activeElement.getAttribute('data-matrix-cell');
      key(document.activeElement, 'End');
      const end = document.activeElement.getAttribute('data-matrix-cell');
      key(document.activeElement, 'End', { ctrlKey: true });
      const corner = document.activeElement.getAttribute('data-matrix-cell');
      key(document.activeElement, 'Home', { ctrlKey: true });
      const home = document.activeElement.getAttribute('data-matrix-cell');
      return { down, right, end, corner, home };
    })()`,
  );
  check(
    'the arrow keys move a cell on both axes, and the corners are two keys away',
    walk.down === 'H3/n1' &&
      walk.right === 'H3/n2' &&
      walk.end === 'H3/__strct_rollup__' &&
      walk.corner === '__strct_rollup__/__strct_rollup__' &&
      walk.home === 'H2/n1',
    `↓ ${walk.down} · → ${walk.right} · End ${walk.end} · Ctrl+End ${walk.corner} · Ctrl+Home ${walk.home}`,
  );

  await evaluate(
    send,
    `(() => {
      const el = [...document.querySelectorAll('#status-matrix [data-matrix-cell]')]
        .find((c) => c.getAttribute('data-matrix-cell') === 'H9/n3');
      el.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    })()`,
  );
  // The selection is a signal: the mark appears on the next render.
  await sleep(300);
  const picked = await evaluate(
    send,
    `[...document.querySelectorAll('#status-matrix .strct-status-matrix__cell--picked')]
      .map((c) => c.getAttribute('data-matrix-cell')).join(',')`,
  );
  check('Enter picks the cell it is on', picked === 'H9/n3', `picked: ${picked || 'nothing'}`);

  // ── Narrow: the grid stacks and the sentences come out.
  await send('Emulation.setDeviceMetricsOverride', {
    width: 430,
    height: 2200,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(800);
  const narrow = await evaluate(send, READ);
  check(
    'narrow: the grid stacks and every cell shows the sentence it was drawing',
    !!narrow && narrow.stacked && narrow.cells.every((c) => c.srVisible),
    narrow
      ? `stacked ${narrow.stacked}, ${narrow.cells.filter((c) => c.srVisible).length}/${narrow.cells.length} sentences visible`
      : 'no grid',
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
  console.error(`\n✗ ${failed.length} of ${checks.length} status-matrix checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} status-matrix checks passed.`);
