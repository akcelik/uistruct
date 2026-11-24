/**
 * The tree's state axes: an inventory object is in four states at once, and
 * they are four different questions.
 *
 * The tree had one badge slot, so the signals took turns. HyperStruct's own
 * mapping says it out loud — "the signals take turns (health outranks
 * lifecycle)" — which means an alarmed VM lost its power state, and a host
 * nobody could reach was drawn with the power-off mark: "switched off" and
 * "not answering" were the same picture. Everything that did not fit went
 * into the label text ("esx01 (Maintenance Mode)"), which is the one string
 * the type-ahead matches. And the mode an operator CHOSE was drawn as a
 * near-black tile at 12.43:1 against the page, beside a critical alarm the
 * system REPORTED at 4.42:1 — the emphasis was upside down.
 *
 * So: reach on the row, mode in the icon's top corner, power in its bottom
 * one, health at the row's end, and nothing at all for an object that is
 * reachable, on and quiet. Every number here is read back from what Chrome
 * laid out — the weights, the recession, the alignment, the two marks told
 * apart with the hue taken away, and what the accessibility tree says.
 *
 *   node scripts/tree-state.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4719;
const CDP = 9419;
/** WCAG 1.4.3 for text. */
const AA = 4.5;
/** WCAG 1.4.11 for a graphic that carries meaning. */
const GRAPHIC = 3;
/** How far from a disc an alarm's outline must stay: the shape it must not become. */
const NOT_A_DISC = 20;
/** The row the tree has always had — the glyph grew inside it, not past it. */
const ROW = 27.5;
/** No state mark may be smaller than this: an 8px dot on a 1920x1080 screen
 *  is a smudge, which is what sent this back to the drawing board. */
const MARK = 11;
/** What the old single-slot model measured, before the axes. */
const BEFORE = { tile: 12.43, critical: 4.42 };

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

/** Every row of the demo, with what it draws and where. */
const ROWS = `(() => {
  const box = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {
      left: +(b.left + scrollX).toFixed(2), right: +(b.right + scrollX).toFixed(2),
      top: +(b.top + scrollY).toFixed(2), bottom: +(b.bottom + scrollY).toFixed(2),
      w: +b.width.toFixed(2), h: +b.height.toFixed(2),
    };
  };
  const read = (sel) =>
    [...document.querySelectorAll(sel + ' .strct-tnode__row')].map((row) => {
      const label = row.querySelector('.strct-tnode__label');
      const icon = row.querySelector('.strct-tnode__icon');
      const badges = [...row.querySelectorAll('.strct-icon__badge')];
      const health = badges.find((el) =>
        /--(success|warning|critical|info|inherit|unknown)/.test(el.className),
      );
      const life = badges.find((el) => /--(running|paused|off)/.test(el.className));
      const badge = health ?? life ?? null;
      const mode = row.querySelector('.strct-icon__mode');
      const mark = row.querySelector('.strct-tnode__rollup');
      const page = (() => {
        for (let p = row; p; p = p.parentElement) {
          const bg = getComputedStyle(p).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
        }
        return 'rgb(255,255,255)';
      })();
      return {
        label: label.textContent.trim(),
        h: +row.getBoundingClientRect().height.toFixed(2),
        unreachable: row.classList.contains('strct-tnode__row--unreachable'),
        orphaned: row.classList.contains('strct-tnode__row--orphaned'),
        stale: row.classList.contains('strct-tnode__row--stale'),
        labelInk: getComputedStyle(label).color,
        iconOpacity: icon?.querySelector('svg')
          ? +getComputedStyle(icon.querySelector('svg')).opacity
          : null,
        cut: icon ? getComputedStyle(icon, '::after').content !== 'none' : false,
        badge: badge ? badge.className.split('--')[1] : null,
        mode: mode ? mode.className.split('--')[1] : null,
        modeBg: mode ? getComputedStyle(mode).backgroundColor : null,
        modeBox: box(mode),
        modeBorder: mode ? getComputedStyle(mode).borderTopColor : null,
        health: health
          ? {
              kind: health.className.split('--')[1],
              border: getComputedStyle(health).borderTopColor,
              borderWidth: getComputedStyle(health).borderTopWidth,
              tone: health.className.includes('critical') ? 'critical' : health.className.includes('warning') ? 'warning' : 'other',
              ink: getComputedStyle(health).backgroundColor,
              box: box(health),
            }
          : null,
        life: life ? { kind: life.className.split('--')[1], box: box(life) } : null,
        mark: mark
          ? {
              tone: mark.className.includes('critical') ? 'critical' : 'warning',
              ink: getComputedStyle(mark).color,
              count: mark.textContent.trim(),
              box: box(mark),
            }
          : null,
        labelBox: box(label),
        icon: box(icon),
        modeBoxOuter: box(mode),
        marks: [health, life, mode, mark].filter(Boolean).length,
        described: row.getAttribute('aria-description'),
        name: row.textContent.replace(/\\s+/g, ' ').trim(),
        page,
        box: box(row),
      };
    });
  const tree = document.querySelector('[data-ti="stale"] .strct-tree');
  const caption = document.querySelector('[data-ti="stale"] .strct-tree__stale');
  return {
    open: read('#tree-state .ts-demo__col:first-child'),
    closed: read('#tree-state .ts-demo__col:last-child'),
    live: read('[data-ti="live"]'),
    staleTree: read('[data-ti="stale"]'),
    captions: document.querySelectorAll('[data-ti="stale"] .strct-tree__stale').length,
    caption: caption
      ? { text: caption.textContent.trim(), hidden: caption.getAttribute('aria-hidden'), box: box(caption) }
      : null,
    treeDescribed: tree ? tree.getAttribute('aria-description') : null,
    liveDescribed: document.querySelector('[data-ti="live"] .strct-tree')?.getAttribute('aria-description') ?? null,
  };
})()`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
const parse = (c) => {
  const n = (c.match(/[0-9.]+(?:e[-+]?\d+)?/g) ?? [0, 0, 0, 1]).map(Number);
  const v = /^color\(/.test(c) ? n.map((x, i) => (i < 3 ? x * 255 : x)) : n;
  return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1];
};
const over = (fg, bg) => {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
};
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
const on = (ink, page) => contrast(over(parse(ink), parse(page)), parse(page));
let up = false;

/**
 * A mark's ink, as a shape and as a mass. Contrast alone is the wrong measure
 * of emphasis: a 9px outline at 6:1 and a 10px filled diamond at 4.2:1 are not
 * the same weight to an eye, because one of them is mostly surface. So the
 * mass is how much ink is actually painted, times how far that ink is from
 * the surface it sits on.
 */
/**
 * Does the mark have a hole in it?
 *
 * Every health mark the set already draws is solid — a disc, a triangle, a
 * diamond — so "there is a slot here and nothing in it" can only be said by
 * an outline. That is a shape fact, not a colour one, so it is counted as
 * shape: the mark's box is captured, ink is everything that differs from the
 * surface, and a hole is background the flood from the box's own edge cannot
 * reach. It survives greyscale, which is the whole point of using it.
 */
async function hole(send, box) {
  const pad = 2;
  const clip = {
    x: Math.round(box.left) - pad,
    y: Math.round(box.top) - pad,
    width: Math.round(box.w) + pad * 2,
    height: Math.round(box.h) + pad * 2,
    scale: 6,
  };
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip });
  const png = PNG.sync.read(Buffer.from(data, 'base64'));
  const bg = [png.data[0], png.data[1], png.data[2]];
  const w = png.width,
    h = png.height;
  const open = new Uint8Array(w * h);
  for (let i = 0, q = 0; i < png.data.length; i += 4, q++) {
    const d =
      Math.abs(png.data[i] - bg[0]) +
      Math.abs(png.data[i + 1] - bg[1]) +
      Math.abs(png.data[i + 2] - bg[2]);
    if (d <= 40) open[q] = 1;
  }
  const outside = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const q = y * w + x;
    if (x < 0 || y < 0 || x >= w || y >= h || !open[q] || outside[q]) return;
    outside[q] = 1;
    stack.push(q);
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
    const x = q % w,
      y = (q / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  let enclosed = 0;
  for (let q = 0; q < open.length; q++) if (open[q] && !outside[q]) enclosed++;
  // As a share of the mark's own box, so a 6x render and a 1x one agree.
  return (enclosed / (w * h)) * 100;
}

/**
 * How much a mark's outline disagrees with a disc drawn in the same box, as
 * a share of that box. A real disc is 0; the further from 0, the more the
 * mark is its own shape. It is the measure that matches the claim, where
 * "how much of its box it fills" does not: a fillet takes area away inside a
 * fixed box, so a rounder shape fills LESS and would pass a fill test while
 * looking rounder.
 */
async function discDiff(send, box) {
  const clip = {
    x: Math.round(box.left),
    y: Math.round(box.top),
    width: Math.max(1, Math.round(box.w)),
    height: Math.max(1, Math.round(box.h)),
    scale: 6,
  };
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip });
  const png = PNG.sync.read(Buffer.from(data, 'base64'));
  const { width: w, height: h } = png;
  const bg = [png.data[0], png.data[1], png.data[2]];
  let differ = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const d =
        Math.abs(png.data[i] - bg[0]) +
        Math.abs(png.data[i + 1] - bg[1]) +
        Math.abs(png.data[i + 2] - bg[2]);
      const ink = d > 40;
      const nx = ((x + 0.5) / w) * 2 - 1;
      const ny = ((y + 0.5) / h) * 2 - 1;
      if (ink !== nx * nx + ny * ny <= 1) differ++;
    }
  }
  return (differ / (w * h)) * 100;
}

async function centroid(send, box) {
  const pad = 1;
  const clip = {
    x: Math.round(box.left) - pad,
    y: Math.round(box.top) - pad,
    width: Math.round(box.w) + pad * 2,
    height: Math.round(box.h) + pad * 2,
    scale: 6,
  };
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip });
  const png = PNG.sync.read(Buffer.from(data, 'base64'));
  // The corner pixel is the page; ink is everything that differs from it.
  const bg = [png.data[0], png.data[1], png.data[2]];
  let sum = 0,
    weight = 0,
    ink = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (y * png.width + x) * 4;
      const px = [png.data[i], png.data[i + 1], png.data[i + 2]];
      const d = Math.abs(px[0] - bg[0]) + Math.abs(px[1] - bg[1]) + Math.abs(px[2] - bg[2]);
      if (d > 40) {
        sum += y;
        weight += 1;
        ink += contrast(px, bg);
      }
    }
  }
  // Per rendered pixel of the box, so a 6x render and a 1x one agree.
  const area = png.width * png.height;
  return { y: weight ? sum / weight / png.height : 0, px: weight, mass: ink / area };
}

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Accessibility.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1500,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  });
  up = true;

  const load = async () => {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/tree` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.querySelector('#tree-state .strct-tnode__row')`)) break;
      await sleep(200);
    }
    await evaluate(
      send,
      `document.querySelector('#tree-state .ts-demo').scrollIntoView({ block: 'center' })`,
    );
    await sleep(600);
    return evaluate(send, ROWS);
  };

  let t = await load();
  const rows = t.open;
  const by = (label) => rows.find((r) => r.label === label);
  check(
    'the case is on the page',
    rows.length >= 10 && t.closed.length === 5 && !!by('vm-07') && !!by('HV-NODE-02'),
    `${rows.length} rows open and ${t.closed.length} closed nodes beside them`,
  );

  // ── Nothing for the normal case ────────────────────────────────────────
  const quiet = ['HV-NODE-01', 'vm-11'].map(by);
  check(
    'a reachable, running, quiet object draws nothing at all',
    quiet.every((r) => r.marks === 0 && !r.unreachable && r.described === null),
    `${quiet.map((r) => `"${r.label}"`).join(' and ')} carry 0 marks and no description — in a tree of 2000 rows, the normal ones are silent`,
  );

  // ── The four axes, at once ─────────────────────────────────────────────
  const vm7 = by('vm-07');
  const hv2 = by('HV-NODE-02');
  check(
    'an object that is off, alarmed and out of reach says all three',
    vm7.unreachable && vm7.cut && vm7.life?.kind === 'off' && vm7.health?.tone === 'critical',
    `"vm-07": the row recedes and its glyph is cut (reach), its bottom corner carries ${vm7.life?.kind} (power) and its top corner a ${vm7.health?.tone} mark (health) — all three on the glyph, where the single slot could show one of them`,
  );
  check(
    'a host in maintenance with an open alarm says both',
    hv2.mode === 'maintenance' && hv2.health?.tone === 'warning' && !hv2.unreachable,
    `"HV-NODE-02": the barrier tile in the glyph's bottom corner and a ${hv2.health?.tone} mark in its top one`,
  );

  // ── The weights, the right way round ───────────────────────────────────
  const tileWeight = on(hv2.modeBorder, hv2.page);
  const critWeight = on(vm7.health.ink, vm7.page);
  const warnWeight = on(hv2.health.ink, hv2.page);
  const tileMass = await centroid(send, hv2.modeBoxOuter);
  const critMass = await centroid(send, vm7.health.box);
  // Prominence is how much ink a mark puts on the row and how far that ink is
  // from the surface — not how dark one edge of it is. A mark that is bigger
  // IS louder, so the mass is not normalised away.
  const tileInk = tileMass.mass * hv2.modeBoxOuter.w * hv2.modeBoxOuter.h;
  const critInk = critMass.mass * vm7.health.box.w * vm7.health.box.h;
  check(
    'a mode an operator chose no longer outweighs a fault the system reported',
    critInk >= tileInk * 0.9 && critWeight >= 3 && warnWeight >= 3,
    `the alarm carries ${critInk.toFixed(0)} of ink-weight against the maintenance tile's ${tileInk.toFixed(0)} — ${((critInk / tileInk) * 100).toFixed(0)}% of it, where the near-black tile it replaces measured ${BEFORE.tile}:1 at the edge beside a ${BEFORE.critical}:1 alarm (now ${tileWeight.toFixed(2)}:1 and ${critWeight.toFixed(2)}:1)`,
  );

  // ── Receded, but still readable ────────────────────────────────────────
  const dim = rows.filter((r) => r.unreachable);
  const normal = by('HV-NODE-01');
  const dimRatios = dim.map((r) => on(r.labelInk, r.page));
  const normalRatio = on(normal.labelInk, normal.page);
  check(
    'an object out of reach recedes without going under AA',
    dim.length >= 3 &&
      dimRatios.every((x) => x >= AA) &&
      Math.min(...dimRatios) < normalRatio - 1 &&
      dim.every((r) => r.iconOpacity !== null && r.iconOpacity < 1 && r.cut),
    `${dim.length} rows at ${Math.min(...dimRatios).toFixed(2)}:1 against ${normalRatio.toFixed(2)}:1 for a row that is answering, with the glyph at ${dim[0].iconOpacity} and cut — while the marks on it keep their full weight (floor ${AA})`,
  );

  // ── On the glyph, and big enough to read on a 1920x1080 screen ────────
  const all = rows.flatMap((r) =>
    [r.health, r.life, r.mark, r.modeBoxOuter ? { box: r.modeBoxOuter } : null]
      .filter(Boolean)
      .map((m) => ({ row: r, box: m.box })),
  );
  const apart = all.filter(
    (m) => m.box.left > m.row.icon.right + 1 || m.box.right < m.row.icon.left - 1,
  );
  const small = all.filter((m) => Math.min(m.box.w, m.box.h) < MARK);
  check(
    'every mark sits on the glyph, and none is too small to read',
    all.length >= 6 && apart.length === 0 && small.length === 0,
    `${all.length} marks over ${rows.length} rows, all of them on an ${rows[1].icon.w}px glyph (none standing off it), the smallest ${Math.min(...all.map((m) => Math.min(m.box.w, m.box.h))).toFixed(1)}px against a floor of ${MARK}px — they were 8-11px on a 16px glyph`,
  );

  // ── Told apart with the hue taken away ─────────────────────────────────
  const warnShape = await centroid(send, hv2.health.box);
  const critShape = await centroid(send, vm7.health.box);
  check(
    'warning and critical are two shapes, not two hues',
    Math.abs(warnShape.y - critShape.y) >= 0.06 && warnShape.px > 20 && critShape.px > 20,
    `in a 6x render the triangle's ink sits at ${(warnShape.y * 100).toFixed(1)}% of its box and the diamond's at ${(critShape.y * 100).toFixed(1)}% — ${(Math.abs(warnShape.y - critShape.y) * 100).toFixed(1)} points apart with no colour involved`,
  );

  // ── A fillet must not turn a shape into another shape ──────────────────
  // The centroid check above says where a mark's ink sits; it cannot see an
  // alarm bulging into the disc that success and info use, which is what
  // softening corners risks. So the outline is compared against a disc drawn
  // in the mark's own box.
  //
  // Filleting as it is done here does NOT drift that way, and the first
  // version of this check assumed it did: clipping a corner takes area away
  // inside a fixed box, so a rounder diamond moves AWAY from a disc
  // (measured: sharp 28.4%, the shipped r16 30.6%, r26 34.0%, r40 41.2%).
  // What looked disc-like while this was being drawn was a variant that grew
  // the shape to fill the box, not one that rounded it. The check is kept
  // pointed at that: anything that bulges toward a disc fails it.
  const warnDisc = await discDiff(send, hv2.health.box);
  const critDisc = await discDiff(send, vm7.health.box);
  check(
    'the alarms keep their own outline, and no corner is rounded into a disc',
    critDisc >= NOT_A_DISC && warnDisc >= NOT_A_DISC,
    `against a disc drawn in its own box the triangle differs by ${warnDisc.toFixed(1)}% and the diamond by ${critDisc.toFixed(1)}%, floor ${NOT_A_DISC}% — a real disc is 0%`,
  );

  // ── What a closed node carries ─────────────────────────────────────────
  const closed = t.closed;
  check(
    'a closed node brings up the worst of what is under it, and how many',
    closed[0].mark?.tone === 'critical' &&
      closed[0].mark.count === '2' &&
      closed[1].mark?.tone === 'warning' &&
      closed[1].mark.count === '3' &&
      closed[2].mark === null,
    `"${closed[0].label}" ${closed[0].mark?.tone} ${closed[0].mark?.count}, "${closed[1].label}" ${closed[1].mark?.tone} ${closed[1].mark?.count}, "${closed[2].label}" nothing`,
  );
  // FR-82-01: a host is a container too, and a closed host is the normal case.
  const hv7 = closed.find((r) => r.label === 'HV-NODE-07');
  const hv8 = closed.find((r) => r.label === 'HV-NODE-08');
  check(
    'a closed node keeps its own marks and still says what is under it',
    hv7?.mode === 'maintenance' &&
      hv7.mark?.tone === 'critical' &&
      hv7.mark.count === '2' &&
      hv8?.health?.tone === 'warning' &&
      hv8.mark?.tone === 'warning' &&
      hv8.mark.count === '1',
    `"HV-NODE-07" keeps its barrier tile and carries ${hv7?.mark?.count} critical under it; "HV-NODE-08" keeps its own ${hv8?.health?.tone} badge and carries ${hv8?.mark?.count} — the count used to take the glyph and erase both`,
  );
  const gaps = closed
    .filter((r) => r.mark)
    .map((r) => ({
      label: r.label,
      toName: r.mark.box.left - r.labelBox.right,
      toEdge: r.box.right - r.mark.box.right,
    }));
  check(
    'the rollup stays with the name, and never crosses the row to find it',
    gaps.length >= 4 && gaps.every((g) => g.toName <= 16 && g.toEdge > 40),
    `${gaps.length} closed nodes: the count sits ${Math.min(...gaps.map((g) => g.toName)).toFixed(1)}–${Math.max(...gaps.map((g) => g.toName)).toFixed(1)}px after the name and ${Math.min(...gaps.map((g) => g.toEdge)).toFixed(0)}px short of the row's end`,
  );
  // And why it is not a third corner of the glyph: mirror the alarm into the
  // opposite top corner, with the overhang it actually uses, and see where it
  // lands. Measured, not assumed.
  const own = hv8.health.box.w;
  const overhang = hv8.health.box.right - hv8.icon.right;
  const mirrorRight = hv8.icon.left - overhang + own;
  const overlap = mirrorRight - hv8.health.box.left;
  check(
    'a third corner was measured, not assumed — and it does not fit',
    overlap > 0,
    `a ${own.toFixed(1)}px alarm overhanging an ${hv8.icon.w}px glyph by ${overhang.toFixed(1)}px leaves its opposite top corner ${(own - overlap).toFixed(1)}px of room: the same mark there would overlap it by ${overlap.toFixed(1)}px, so the rollup goes beside the name instead`,
  );

  check(
    'an open node stops repeating its children',
    by('cluster-01').mark === null,
    'the open cluster carries no rollup — its children are saying their own',
  );

  // ── The sentence, and the name ─────────────────────────────────────────
  const { root } = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: '#tree-state .ts-demo__col:first-child [aria-description]',
  });
  const ax = nodeId
    ? await send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })
    : { nodes: [] };
  const node = ax.nodes[0];
  const axName = node?.name?.value ?? '';
  const axDesc = node?.description?.value ?? '';
  check(
    'the state is said in words, and the name is still the name',
    vm7.described === 'Not reachable, Off, Critical' &&
      axName === 'HV-NODE-02' &&
      axDesc === 'In maintenance, Warning',
    `Chrome names the first marked row "${axName}" and describes it as "${axDesc}"; "vm-07" is described as "${vm7.described}" — no state inside the label the type-ahead matches`,
  );

  // ── Nothing got taller ─────────────────────────────────────────────────
  const heights = [...new Set(rows.map((r) => r.h))];
  check(
    'the glyph grew inside the row, not past it',
    heights.every((h) => Math.abs(h - ROW) <= 0.5) && rows[1].icon.w === 18,
    `an ${rows[1].icon.w}px glyph (16px before) in a ${heights.join(', ')}px row — the ${ROW}px the tree has always had, so an inventory shows the same number of objects`,
  );

  // ══ FR-83: what is not known, and what is not current ═════════════════
  // The shots below are clipped in page coordinates, and a clip outside the
  // viewport comes back blank — which reads as "no hole" for every mark at
  // once. Bring the case into view first.
  await evaluate(
    send,
    `document.querySelector('#tree-integrity .ts-demo').scrollIntoView({ block: 'center' })`,
  );
  await sleep(500);
  t = await evaluate(send, ROWS);
  const live = t.live;
  const byLive = (label) => live.find((r) => r.label === label);
  const quietRow = byLive('HV-NODE-11');
  const unread = byLive('HV-NODE-12');
  const old = byLive('HV-NODE-13');
  const alarmed = byLive('HV-NODE-14');
  const oldAlarm = byLive('HV-NODE-15');
  const goneUnread = byLive('HV-NODE-16');
  const closedUnread = live.find((r) => r.label === 'cluster-05');
  check(
    'the FR-83 case is on the page',
    live.length >= 7 &&
      !!unread &&
      !!old &&
      !!alarmed &&
      !!oldAlarm &&
      !!goneUnread &&
      !!closedUnread,
    `${live.length} rows: one silent, one unread, one not current, one alarmed, one alarmed and not current, one unreachable and unread, and a closed node holding both`,
  );

  // A ring is the only health mark with a hole in it.
  const holes = {};
  for (const r of [unread, alarmed, oldAlarm, goneUnread]) {
    if (r?.health) holes[r.label] = await hole(send, r.health.box);
  }
  check(
    'not known is drawn, and is the only health mark with a hole in it',
    quietRow.marks === 0 &&
      unread.health?.kind === 'unknown' &&
      holes['HV-NODE-12'] > 3 &&
      holes['HV-NODE-14'] < 0.5 &&
      holes['HV-NODE-15'] < 0.5,
    `"HV-NODE-11" carries nothing; "HV-NODE-12" carries a ring whose enclosed background is ${holes['HV-NODE-12'].toFixed(1)}% of its own box, against ${holes['HV-NODE-14'].toFixed(1)}% for the warning triangle and ${holes['HV-NODE-15'].toFixed(1)}% for the critical diamond — a shape fact, so it survives greyscale`,
  );
  check(
    'not read is never drawn as a fault',
    unread.health.ink !== alarmed.health.ink &&
      on(unread.health.border, unread.page) >= GRAPHIC &&
      unread.described === 'Health unknown',
    `the ring takes the neutral tone at ${on(unread.health.border, unread.page).toFixed(2)}:1 against the row (floor ${GRAPHIC}) — not the alarm's hue — and the row is described "${unread.described}"`,
  );

  // Stale: receded, but nothing cut.
  const normalLabel = on(quietRow.labelInk, quietRow.page);
  const staleLabel = on(old.labelInk, old.page);
  const goneLabel = on(goneUnread.labelInk, goneUnread.page);
  check(
    'a reading that is not current recedes, below unreachable, and nothing cuts it',
    old.stale &&
      !old.unreachable &&
      !old.cut &&
      goneUnread.cut &&
      staleLabel < normalLabel &&
      staleLabel > goneLabel &&
      staleLabel >= AA,
    `"HV-NODE-13" at ${staleLabel.toFixed(2)}:1 sits between a live row (${normalLabel.toFixed(2)}:1) and one nobody can reach (${goneLabel.toFixed(2)}:1), floor ${AA} — and its glyph is not cut, because nobody is saying it is down`,
  );
  check(
    'an alarm that is not current is still an alarm',
    oldAlarm.stale &&
      oldAlarm.health.tone === 'critical' &&
      oldAlarm.health.ink === by('vm-07').health.ink &&
      on(oldAlarm.health.ink, oldAlarm.page) >= GRAPHIC &&
      on(oldAlarm.labelInk, oldAlarm.page) < normalLabel,
    `"HV-NODE-15" keeps the critical diamond at ${on(oldAlarm.health.ink, oldAlarm.page).toFixed(2)}:1 while its label recedes to ${on(oldAlarm.labelInk, oldAlarm.page).toFixed(2)}:1 — twenty minutes old is still an alarm, and the row is what says how old`,
  );
  check(
    'unreachable still wins over not current',
    goneUnread.unreachable && goneUnread.cut && goneUnread.health?.kind === 'unknown',
    `"HV-NODE-16" is drawn as unreachable (cut glyph, ${goneLabel.toFixed(2)}:1) and still carries the ring — the axes do not take each other's turn`,
  );

  // A closed node counts the unread in words, never as a chip.
  check(
    'what is unread under a closed node is said, not counted beside the name',
    closedUnread.mark?.count === '1' &&
      closedUnread.mark.tone === 'critical' &&
      /3 health unknown/i.test(closedUnread.described ?? ''),
    `"cluster-05" wears ${closedUnread.mark?.count} critical beside its name and says "${closedUnread.described}" — the 3 nobody has read are words, because a number there would read as three more alarms`,
  );

  // The whole tree, said once.
  const st = t.staleTree;
  check(
    'a tree that is out of date says so once, not once per row',
    t.captions === 1 &&
      t.caption?.hidden === 'true' &&
      t.treeDescribed === 'Not current since 14:02' &&
      t.liveDescribed === null &&
      st.length === live.length &&
      st.every((r) => r.stale) &&
      st.every((r) => r.described !== 'Not current since 14:02'),
    `${t.captions} caption ("${t.caption?.text}") out of the a11y tree, the sentence on the tree itself as aria-description, and all ${st.length} rows receded without one of them repeating it — a reader walking 2000 rows hears it once`,
  );
  check(
    'the axes keep their last value under a stale tree',
    st.find((r) => r.label === 'HV-NODE-14')?.health?.tone === 'warning' &&
      st.find((r) => r.label === 'HV-NODE-12')?.health?.kind === 'unknown' &&
      st.find((r) => r.label === 'cluster-05')?.mark?.count === '1',
    `the warning, the ring and the rollup are all still drawn — the tree is old, not empty`,
  );

  // ── Every palette ──────────────────────────────────────────────────────
  const sweep = [];
  for (const palette of ['arctic', 'ember', 'sage']) {
    for (const theme of ['light', 'dark']) {
      await evaluate(
        send,
        `document.documentElement.setAttribute('data-palette', '${palette}');` +
          `document.documentElement.setAttribute('data-theme', '${theme}')`,
      );
      await sleep(350);
      const p = await evaluate(send, ROWS);
      for (const r of p.open) {
        if (r.health)
          sweep.push({
            where: `${palette} ${theme} ${r.health.tone}`,
            ratio: on(r.health.ink, r.page),
          });
        if (r.unreachable)
          sweep.push({ where: `${palette} ${theme} receded`, ratio: on(r.labelInk, r.page) });
      }
      // FR-83's two new readings: a row that is only out of date still has to
      // be legible, and the ring has to be visible as a graphic.
      for (const r of [...p.live, ...p.staleTree]) {
        if (r.stale)
          sweep.push({ where: `${palette} ${theme} not current`, ratio: on(r.labelInk, r.page) });
        if (r.health?.kind === 'unknown')
          sweep.push({ where: `${palette} ${theme} ring`, ratio: on(r.health.border, r.page) });
      }
    }
  }
  const worst = [...sweep].sort((a, b) => a.ratio - b.ratio)[0];
  check(
    'the marks and the receded rows read in all six palettes',
    sweep.length > 0 && sweep.every((x) => x.ratio >= 3),
    `${sweep.length} readings — weakest ${worst.ratio.toFixed(2)}:1 (${worst.where}); every receded label clears ${AA} and every mark 3:1 as a graphic`,
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
  console.error(`\n✗ ${failed.length} of ${checks.length} tree-state checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} tree-state checks passed.`);
