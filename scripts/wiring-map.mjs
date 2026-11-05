/**
 * FR-71-01: a cable lands on a port.
 *
 * A wiring map's whole claim is that the line is drawn between the two
 * *ports*, not the two boxes, and that it says so to an eye: it leaves the
 * device's edge on the port's own centre line, arrives horizontally at the
 * other one, carries its label on itself, and gets out of the way when
 * another cable is the one being read.
 *
 * None of that is assertable from the component's own arithmetic, so every
 * number here is read back from what Chrome drew: the path's endpoints come
 * from `getPointAtLength` on the rendered `<path>`, the ports and cards from
 * `getBoundingClientRect`, the dimming from `getComputedStyle`, and the
 * keyboard from real key events. Read at two widths, because one width cannot
 * tell a measurement from a constant that happens to fit.
 *
 *   node scripts/wiring-map.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4709;
const CDP = 9409;
const ROUTE = '/components/wiring';
/** A width and the palette it is read in: the geometry is theme-blind, the
 *  contrast is not. */
const RUNS = [
  { width: 1600, theme: 'light' },
  { width: 1240, theme: 'dark' },
];
/** A cable must land within this of the port's centre line. */
const LAND = 1;
/** How level the first and last 6px of a cable must be. */
const LEVEL = 0.6;
/** WCAG AA for the body text a dimmed label still has to be. */
const AA = 4.5;

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
 * Everything the checks read, taken from the first map on the page. The
 * endpoints and the tangents come off the rendered path itself, so the gate
 * never re-derives the arithmetic it is checking.
 */
const READ = (sel) => `(() => {
  const host = document.querySelector('${sel} strct-wiring');
  if (!host) return null;
  const map = host.querySelector('.strct-wiring__map');
  const base = map.getBoundingClientRect();
  const rel = (r) => ({ l: r.left - base.left, t: r.top - base.top, r: r.right - base.left, b: r.bottom - base.top });

  const ports = {};
  for (const el of map.querySelectorAll('[data-wiring-port]')) {
    const id = el.getAttribute('data-wiring-port');
    const r = el.getBoundingClientRect();
    const card = el.closest('.strct-wiring__node').getBoundingClientRect();
    ports[id] = { box: rel(r), mid: r.top + r.height / 2 - base.top, card: rel(card) };
  }
  const cards = [...map.querySelectorAll('.strct-wiring__node')].map((c) => rel(c.getBoundingClientRect()));

  const paints = [...map.querySelectorAll('.strct-wiring__link')];
  const links = paints.map((p, order) => {
    const len = p.getTotalLength();
    const a = p.getPointAtLength(0);
    const a2 = p.getPointAtLength(Math.min(6, len / 4));
    const b = p.getPointAtLength(len);
    const b2 = p.getPointAtLength(Math.max(len - 6, (len * 3) / 4));
    const cs = getComputedStyle(p);
    const samples = [];
    for (let i = 0; i <= 40; i++) samples.push(p.getPointAtLength((len * i) / 40));
    return {
      order,
      cls: p.getAttribute('class'),
      on: p.classList.contains('strct-wiring__link--on'),
      tone: (p.getAttribute('class').match(/strct-wiring__link--(neutral|accent|success|warning|critical)/) ?? [])[1] ?? 'neutral',
      opacity: Number(cs.opacity),
      dash: cs.strokeDasharray,
      a: { x: a.x, y: a.y },
      b: { x: b.x, y: b.y },
      headSlope: { dx: a2.x - a.x, dy: a2.y - a.y },
      tailSlope: { dx: b.x - b2.x, dy: b.y - b2.y },
      samples: samples.map((s) => ({ x: s.x, y: s.y })),
    };
  });

  // What is painted over what: the DOM order of the <path>s is the paint order.
  const tags = [...map.querySelectorAll('[data-wiring-tag]')].map((t) => {
    const cs = getComputedStyle(t);
    return {
      id: t.getAttribute('data-wiring-tag'),
      text: t.textContent.trim(),
      box: rel(t.getBoundingClientRect()),
      opacity: Number(cs.opacity),
      color: cs.color,
      bg: cs.backgroundColor,
      on: t.classList.contains('strct-wiring__tag--on'),
    };
  });

  // The surface the tags are composited over: the nearest painting ancestor.
  let surface = 'rgb(255, 255, 255)';
  for (let el = map; el; el = el.parentElement) {
    const c = getComputedStyle(el).backgroundColor;
    const m = c.match(/[\\d.]+/g);
    if (m && (m.length < 4 || Number(m[3]) > 0.99)) { surface = c; break; }
  }

  // The quietest text in the map: a port's reading, already a muted tone
  // before anything dims it.
  const metas = [...map.querySelectorAll('.strct-wiring__portmeta')].map((m) => {
    const row = m.closest('.strct-wiring__port');
    const cs = getComputedStyle(m);
    return {
      text: m.textContent.trim(),
      color: cs.color,
      rowOpacity: Number(getComputedStyle(row).opacity),
      on: row.classList.contains('strct-wiring__port--on'),
    };
  });
  const cardBg = getComputedStyle(map.querySelector('.strct-wiring__node')).backgroundColor;

  const selectedPorts = [...map.querySelectorAll('.strct-wiring__port--on')].map((p) => ({
    id: p.getAttribute('data-wiring-port'),
    side: p.classList.contains('strct-wiring__port--on-start') ? 'start'
        : p.classList.contains('strct-wiring__port--on-end') ? 'end' : null,
  }));

  // BUG-72-03: a device's name against its reading, measured on the head.
  const heads = [...map.querySelectorAll('.strct-wiring__node')].map((node) => {
    const head = node.querySelector('.strct-wiring__nodehead');
    const lab = head.querySelector('.strct-wiring__nodelabel');
    const sub = head.querySelector('.strct-wiring__nodesub');
    const box = (el) => (el ? { w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height } : null);
    return {
      id: node.getAttribute('data-wiring-node'),
      text: lab ? lab.textContent.trim() : '',
      title: lab ? lab.getAttribute('title') : null,
      line: lab ? Number.parseFloat(getComputedStyle(lab).lineHeight) : 0,
      label: box(lab),
      sub: box(sub),
      head: box(head),
      clipped: lab ? lab.scrollWidth > lab.clientWidth + 1 : false,
    };
  });

  return {
    base: { w: base.width, h: base.height },
    ports, cards, links, tags, surface, selectedPorts, metas, cardBg, heads,
    portCount: Object.keys(ports).length,
    deviceCount: cards.length,
    svgHidden: map.querySelector('.strct-wiring__links').getAttribute('aria-hidden') === 'true',
  };
})()`;

/** The wiring the demo declares, so the checks know which cable is which. */
const WIRES = [
  ['l1', 'hv1p1', 'a11', 'success'],
  ['l2', 'hv1p2', 'b11', 'neutral'],
  ['l3', 'hv2p1', 'a12', 'warning'],
  ['l4', 'hv2p2', 'b12', 'success'],
  ['l5', 'hv3p1', 'a13', 'success'],
  ['l6', 'hv3p2', 'b14', 'critical'],
  ['l7', 'hv4p1', 'a16', 'success'],
  ['l8', 'hv4p2', 'b16', 'warning'],
];
const LABELLED = {
  l2: 'not heard for 2 d',
  l3: '6 flaps in 1 h',
  l6: 'PFC 3 ≠ 4',
  l8: 'VLAN 712 missing',
};

const parse = (c) => (c.match(/[\d.]+/g) ?? [0, 0, 0, 1]).map(Number);
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
/**
 * Distance from a point to the polyline through the samples. Measured against
 * the segments, not the sample points: 41 samples of a 600px cable sit 15px
 * apart, so a label exactly on the curve reads as up to 7.5px off it if the
 * grid itself is what gets measured.
 */
const segDist = (p, a, b) => {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2)) : 0;
  return Math.hypot(a.x + t * vx - p.x, a.y + t * vy - p.y);
};
const curveDist = (p, samples) => {
  let best = Infinity;
  for (let i = 1; i < samples.length; i++)
    best = Math.min(best, segDist(p, samples[i - 1], samples[i]));
  return best;
};

const overlapArea = (a, b) => {
  const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
  const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
  return w > 0 && h > 0 ? w * h : 0;
};

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
let up = false;
const runWidths = [];

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  up = true;

  for (const { width, theme } of RUNS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1400,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.querySelector('#wiring .strct-wiring__link')`)) break;
      await sleep(200);
    }
    await evaluate(send, `document.documentElement.setAttribute('data-theme', '${theme}')`);
    await sleep(900);
    const r = await evaluate(send, READ('#wiring'));
    const at = `${width}px ${theme}`;

    check(
      `${at}: the case is on the page`,
      !!r &&
        r.deviceCount === 6 &&
        r.portCount === 16 &&
        r.links.length === 8 &&
        r.tags.length === 4,
      r
        ? `${r.deviceCount} devices, ${r.portCount} ports, ${r.links.length} cables, ${r.tags.length} labels, map ${Math.round(r.base.w)}×${Math.round(r.base.h)}`
        : 'no #wiring map — every check below would read nothing',
    );
    if (!r || r.links.length !== 8) break;
    runWidths.push(Math.round(r.base.w));

    // The cables, matched to the wiring by nearest endpoints — assignment,
    // not a threshold, so a cable that has drifted is still identified and
    // the number reported is how far it drifted rather than "not found".
    const byEnds = new Map();
    const unclaimed = [...r.links];
    for (const [id, from, to] of WIRES) {
      const a = r.ports[from];
      const b = r.ports[to];
      if (!a || !b) continue;
      let best = null;
      let bestCost = Infinity;
      for (const l of unclaimed) {
        const cost = Math.abs(l.a.y - a.mid) + Math.abs(l.b.y - b.mid);
        if (cost < bestCost) {
          bestCost = cost;
          best = l;
        }
      }
      if (best) unclaimed.splice(unclaimed.indexOf(best), 1);
      byEnds.set(id, { link: best, from: a, to: b });
    }

    // 1. It lands on the port, at both ends.
    const landings = [];
    for (const [id, from, to] of WIRES) {
      const e = byEnds.get(id);
      if (!e?.link) {
        landings.push({ id, miss: 'no path' });
        continue;
      }
      landings.push({
        id,
        head: Math.abs(e.link.a.y - e.from.mid),
        tail: Math.abs(e.link.b.y - e.to.mid),
        headX: Math.abs(e.link.a.x - e.from.card.r),
        tailX: Math.abs(e.link.b.x - e.to.card.l),
      });
    }
    const worstLand = landings.reduce((m, l) => Math.max(m, l.head ?? 99, l.tail ?? 99), 0);
    check(
      `${at}: every cable lands on its port's centre line`,
      landings.every((l) => l.head !== undefined && l.head < LAND && l.tail < LAND),
      `worst |y − port centre| = ${worstLand.toFixed(2)}px over ${landings.length} cables`,
    );

    const worstEdge = landings.reduce((m, l) => Math.max(m, l.headX ?? 99, l.tailX ?? 99), 0);
    check(
      `${at}: it leaves the device's edge, not the row's`,
      landings.every((l) => l.headX !== undefined && l.headX < LAND && l.tailX < LAND),
      `worst |x − card edge| = ${worstEdge.toFixed(2)}px`,
    );

    // 2. It leaves and arrives level, so it reads as a cable.
    const slopes = r.links.map((l) => Math.max(Math.abs(l.headSlope.dy), Math.abs(l.tailSlope.dy)));
    check(
      `${at}: a cable leaves and arrives level`,
      slopes.every((s) => s < LEVEL),
      `worst rise over the first/last 6px = ${Math.max(...slopes).toFixed(2)}px`,
    );

    // 3. The labels: on their own cable, clear of each other and of the cards.
    const tagPairs = [];
    for (let i = 0; i < r.tags.length; i++)
      for (let j = i + 1; j < r.tags.length; j++)
        tagPairs.push({
          a: r.tags[i].text,
          b: r.tags[j].text,
          area: overlapArea(r.tags[i].box, r.tags[j].box),
        });
    const collide = tagPairs.filter((p) => p.area > 0);
    check(
      `${at}: no two labels overlap`,
      collide.length === 0,
      collide.length
        ? collide.map((c) => `"${c.a}" × "${c.b}" = ${c.area.toFixed(0)}px²`).join(', ')
        : `${tagPairs.length} pairs, 0 overlapping`,
    );

    const onCard = [];
    for (const t of r.tags)
      for (const c of r.cards) {
        const a = overlapArea(t.box, c);
        if (a > 0) onCard.push(`"${t.text}" ${a.toFixed(0)}px²`);
      }
    check(
      `${at}: no label is drawn over a device`,
      onCard.length === 0,
      onCard.length ? onCard.join(', ') : `${r.tags.length} labels, all in the run`,
    );

    const outside = r.tags.filter(
      (t) =>
        t.box.l < -0.5 || t.box.t < -0.5 || t.box.r > r.base.w + 0.5 || t.box.b > r.base.h + 0.5,
    );
    check(
      `${at}: every label is inside the map`,
      outside.length === 0,
      outside.length
        ? outside.map((t) => `"${t.text}"`).join(', ')
        : `map ${Math.round(r.base.w)}px wide`,
    );

    const offLine = [];
    for (const [id, text] of Object.entries(LABELLED)) {
      const t = r.tags.find((q) => q.id === id);
      const e = byEnds.get(id);
      if (!t || !e?.link) {
        offLine.push(`${id}: not drawn`);
        continue;
      }
      const cx = (t.box.l + t.box.r) / 2;
      const cy = (t.box.t + t.box.b) / 2;
      const d = curveDist({ x: cx, y: cy }, e.link.samples);
      if (d > 1) offLine.push(`"${text}" ${d.toFixed(2)}px off its own cable`);
    }
    check(
      `${at}: every label sits on the cable it describes`,
      offLine.length === 0,
      offLine.length ? offLine.join(', ') : 'all 4 within 1px of their own curve',
    );

    // 4. Paint order: a problem is never under a line that agrees.
    const weight = { neutral: 0, success: 1, accent: 2, warning: 3, critical: 4 };
    const painted = r.links.map((l) => ({ tone: l.tone, on: l.on, order: l.order }));
    const crit = painted.find((p) => p.tone === 'critical');
    const quietAbove = painted.filter((p) => weight[p.tone] < 3 && crit && p.order > crit.order);
    check(
      `${at}: a problem is painted over the lines that agree`,
      !!crit && quietAbove.length === 0,
      crit
        ? `critical at paint index ${crit.order} of ${painted.length}; ${quietAbove.length} quiet lines above it`
        : 'no critical cable found',
    );
    const last = painted[painted.length - 1];
    check(
      `${at}: the selected cable is painted last`,
      !!last?.on,
      `last painted is ${last?.tone}${last?.on ? ', selected' : ', not the selection'}`,
    );

    // 5. Isolate lifts one cable without making the words unreadable.
    const onLink = r.links.find((l) => l.on);
    const offLinks = r.links.filter((l) => !l.on);
    check(
      `${at}: a selection lets the other cables recede`,
      !!onLink && offLinks.every((l) => l.opacity <= onLink.opacity - 0.5),
      `selected ${onLink?.opacity}, others ${[...new Set(offLinks.map((l) => l.opacity))].join('/')}`,
    );
    check(
      `${at}: isolating recedes the lines, not the words`,
      r.tags.every((t) => t.opacity === 1) && r.metas.every((m) => m.rowOpacity === 1),
      `label opacities ${[...new Set(r.tags.map((t) => t.opacity))].join('/')}, port rows ${[
        ...new Set(r.metas.map((m) => m.rowOpacity)),
      ].join('/')}`,
    );

    const surface = parse(r.surface);
    const worstTag = r.tags
      .map((t) => {
        // An element's `opacity` composites the whole layer — glyphs and all
        // — over what is behind it. The glyph covers the element's own
        // background inside that layer, so the text ends up at
        // o·colour + (1−o)·surface, not over the dimmed background. Reading
        // it the other way folds the backdrop into the ink twice.
        const o = t.opacity;
        const bg = over(parse(t.bg), o * (parse(t.bg)[3] ?? 1), surface);
        const fg = over(parse(t.color), o * (parse(t.color)[3] ?? 1), surface);
        return { text: t.text, ratio: contrast(fg, bg) };
      })
      .sort((a, b) => a.ratio - b.ratio)[0];
    check(
      `${at}: every label on the map is readable`,
      !!worstTag && worstTag.ratio >= AA,
      worstTag
        ? `worst of ${r.tags.length}: "${worstTag.text}" ${worstTag.ratio.toFixed(2)}:1 (AA ${AA})`
        : 'no label',
    );

    const cardBg = parse(r.cardBg);
    const worstMeta = r.metas
      .map((m) => {
        const o = m.rowOpacity;
        const bg = over(cardBg, o * (cardBg[3] ?? 1), surface);
        const fg = over(parse(m.color), o * (parse(m.color)[3] ?? 1), surface);
        return { text: m.text, ratio: contrast(fg, bg) };
      })
      .sort((a, b) => a.ratio - b.ratio)[0];
    check(
      `${at}: a port's reading stays readable while another cable is selected`,
      !!worstMeta && worstMeta.ratio >= AA,
      worstMeta
        ? `worst of ${r.metas.length}: "${worstMeta.text}" ${worstMeta.ratio.toFixed(2)}:1`
        : 'no port reading',
    );

    // 6. Both ends of the selection are marked, on the edge the cable uses.
    check(
      `${at}: both ends of the selected cable are marked, each on its own edge`,
      r.selectedPorts.length === 2 &&
        r.selectedPorts.some((p) => p.id === 'hv3p2' && p.side === 'end') &&
        r.selectedPorts.some((p) => p.id === 'b14' && p.side === 'start'),
      r.selectedPorts.map((p) => `${p.id}:${p.side}`).join(' ') || 'nothing marked',
    );

    check(`${at}: the cables are hidden from assistive tech`, r.svgHidden, 'svg aria-hidden');

    // 7. The keyboard: → follows the cable, ↓ walks the column.
    const KEY = (key) => `(() => {
      const el = document.activeElement;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: '${key}', bubbles: true }));
      return document.activeElement?.getAttribute('data-wiring-port') ?? null;
    })()`;
    await evaluate(send, `document.querySelector('#wiring [data-wiring-port="hv1p1"]').focus()`);
    const right = await evaluate(send, KEY('ArrowRight'));
    check(
      `${at}: → follows the cable to the port at its far end`,
      right === 'a11',
      `hv1p1 → ${right ?? 'nothing'} (expected a11, which is what hv1p1 is cabled to)`,
    );
    const down = await evaluate(send, KEY('ArrowDown'));
    check(
      `${at}: ↓ walks the column it is in`,
      down === 'a12',
      `a11 ↓ ${down ?? 'nothing'} (expected a12)`,
    );
    const back = await evaluate(send, KEY('ArrowLeft'));
    check(
      `${at}: ← follows the cable back`,
      back === 'hv2p1',
      `a12 ← ${back ?? 'nothing'} (expected hv2p1)`,
    );

    // 8. The three-tier map: derived columns, a device wired on both edges,
    //    and a run short enough that a label has to be kept off the cards.
    const t = await evaluate(send, READ('#wiring-tiers'));
    check(
      `${at} tiers: the second case is on the page`,
      !!t && t.deviceCount === 5 && t.links.length === 5 && t.tags.length === 2,
      t
        ? `${t.deviceCount} devices, ${t.links.length} cables, ${t.tags.length} labels, map ${Math.round(t.base.w)}px`
        : 'no #wiring-tiers map',
    );
    if (t && t.links.length === 5) {
      const onCards = [];
      for (const tag of t.tags)
        for (const c of t.cards) {
          const a = overlapArea(tag.box, c);
          if (a > 0) onCards.push(`"${tag.text}" ${a.toFixed(0)}px²`);
        }
      check(
        `${at} tiers: no label is drawn over a device`,
        onCards.length === 0,
        onCards.length
          ? onCards.join(', ')
          : `${t.tags.length} labels, ${t.cards.length} devices, 0 overlaps`,
      );

      // A leaf is wired on both of its edges: its access ports take cables in
      // on one side and its uplinks send them out of the other.
      const leafCard = t.ports['ld1']?.card;
      const inbound = t.links.filter((l) => leafCard && Math.abs(l.b.x - leafCard.l) < 1);
      const outbound = t.links.filter((l) => leafCard && Math.abs(l.a.x - leafCard.r) < 1);
      check(
        `${at} tiers: a middle device anchors its downlinks and uplinks on opposite edges`,
        !!leafCard && inbound.length === 2 && outbound.length === 2,
        leafCard
          ? `${inbound.length} cables arrive at its inline start, ${outbound.length} leave its inline end`
          : 'no leaf card',
      );

      // BUG-72-03 (HyperStruct, against 7.7.0): the name is the device's
      // identity. With the name breakable at any glyph and a nowrap sublabel
      // that could not shrink, flex took the whole head from the name and
      // ran a 14-character host name down the card one letter a line —
      // 12.09 x 273px, and the map 712px instead of 481px.
      const squeezed = t.heads.filter((h) => h.label && h.label.h > h.line * 1.5);
      check(
        `${at} tiers: a long reading never breaks the device's name`,
        squeezed.length === 0,
        squeezed.length
          ? squeezed
              .map((h) => `${h.text}: ${h.label.w.toFixed(1)}x${h.label.h.toFixed(0)}px`)
              .join(', ')
          : `${t.heads.length} devices, every name on one line (longest "${
              t.heads.reduce((m, h) => (h.text.length > m.text.length ? h : m), t.heads[0]).text
            }" at ${t.heads
              .reduce((m, h) => (h.text.length > m.text.length ? h : m), t.heads[0])
              .label.w.toFixed(1)}px)`,
      );
      const long = t.heads.find((h) => h.text === 'PDASHPVGENC201');
      check(
        `${at} tiers: the filed case is on the page, whole`,
        !!long && !long.clipped && long.title === 'PDASHPVGENC201' && long.head.h < long.line * 4,
        long
          ? `name ${long.label.w.toFixed(1)}x${long.label.h.toFixed(0)}px, head ${long.head.h.toFixed(0)}px, reading ${long.sub ? long.sub.w.toFixed(0) : 0}px on its own line, ${long.clipped ? 'ellipsised' : 'not ellipsised'}`
          : 'the 14-character host name is not on the page',
      );

      // The tiers were never declared: they come out of the links.
      const xs = ['hva1', 'ld1', 'sp1a'].map((id) => t.ports[id]?.card.l ?? -1);
      check(
        `${at} tiers: the columns come out of the cabling`,
        xs.every((x, i) => x >= 0 && (i === 0 || x > xs[i - 1])),
        `host ${Math.round(xs[0])}px · leaf ${Math.round(xs[1])}px · spine ${Math.round(xs[2])}px`,
      );
    }

    // 9. Enter on a port selects the cable it is on.
    await evaluate(
      send,
      `(() => {
        const el = document.querySelector('#wiring [data-wiring-port="hv2p1"]');
        el.focus();
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      })()`,
    );
    // The selection is a signal; the marks appear on the next render, not in
    // the same turn the key was dispatched.
    await sleep(250);
    const picked = await evaluate(
      send,
      `[...document.querySelectorAll('#wiring .strct-wiring__port--on')]
        .map((p) => p.getAttribute('data-wiring-port')).sort().join(',')`,
    );
    check(
      `${at}: Enter on a port selects the cable it is on`,
      picked === 'a12,hv2p1',
      `marked: ${picked || 'nothing'} (expected a12,hv2p1)`,
    );
  }

  check(
    'the two widths drew two different maps',
    new Set(runWidths).size === RUNS.length,
    `map widths: ${runWidths.join(', ')}px`,
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
  console.error(`\n✗ ${failed.length} of ${checks.length} wiring-map checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} wiring-map checks passed.`);
