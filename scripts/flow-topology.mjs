/**
 * FR-72-03: an edge leaves from where it goes.
 *
 * A fan-out's claim is that the lines carry the structure. It cannot, while
 * every edge off one node starts at the same pixel and every trunk between
 * two columns runs down the same x: on 7.7.0 the topology drew 11.7px of line
 * twice, one stretch of it a healthy uplink over a dead one. So each edge now
 * gets its own anchor on the box, its own lane in the clear strip between the
 * columns, and — when it carries one — its own word, placed in that strip and
 * never over a box.
 *
 * None of that is assertable from the component's own arithmetic, so every
 * number here is read back from what Chrome drew: the paths are sampled with
 * `getPointAtLength`, the boxes and labels come from `getBoundingClientRect`,
 * the dimming from `getComputedStyle`, and the keyboard from real key events.
 * Read at two widths, because one width cannot tell a measurement from a
 * constant that happens to fit, and in both palettes, because one palette
 * cannot tell a contrast failure from a token.
 *
 *   node scripts/flow-topology.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4710;
const CDP = 9410;
const ROUTE = '/components/flow';
/** A width and the palette it is read in: the geometry is theme-blind, the
 *  contrast is not. */
const RUNS = [
  { width: 1600, theme: 'light' },
  { width: 1240, theme: 'dark' },
];
/** How close an endpoint must be to the box edge it is supposed to leave. */
const LAND = 1;
/** The width a column keeps however much strip the labels ask for. */
const MIN_COL = 112;
/** WCAG AA for the words on the lines. */
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
 * Everything the checks read, from one fan. The paths are sampled rather than
 * parsed: what matters is the curve Chrome drew, not the string that asked
 * for it.
 */
const READ = (sel) => `(() => {
  const host = document.querySelector('${sel}');
  if (!host) return null;
  const fan = host.querySelector('.strct-flow__fan');
  if (!fan) return null;
  const base = fan.getBoundingClientRect();
  const rel = (r) => ({ l: r.left - base.left, t: r.top - base.top, r: r.right - base.left, b: r.bottom - base.top });

  const boxes = {};
  for (const el of fan.querySelectorAll('[data-flow-node]')) {
    const id = el.getAttribute('data-flow-node');
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    boxes[id] = { ...rel(r), mid: r.top + r.height / 2 - base.top, opacity: Number(cs.opacity), color: cs.color };
  }
  const cols = [...fan.querySelectorAll('.strct-flow__col')].map((c) => Math.round(c.getBoundingClientRect().width));

  const edges = [...fan.querySelectorAll('.strct-flow__edge')].map((p, order) => {
    const len = p.getTotalLength();
    const pts = [];
    for (let i = 0; i <= 400; i++) pts.push(p.getPointAtLength((len * i) / 400));
    const a = pts[0];
    const z = pts[pts.length - 1];
    // The trunk is the vertical run: the x the path holds through its middle.
    const trunkX = pts[200].x;
    const on = pts.filter((q) => Math.abs(q.x - trunkX) < 0.6).map((q) => q.y);
    const cs = getComputedStyle(p);
    return {
      order,
      a: { x: a.x, y: a.y },
      z: { x: z.x, y: z.y },
      trunkX,
      y0: on.length ? Math.min(...on) : a.y,
      y1: on.length ? Math.max(...on) : a.y,
      tone: (p.getAttribute('class').match(/edge--(neutral|accent|success|warning|critical)/) ?? [])[1] ?? 'neutral',
      on: p.classList.contains('strct-flow__edge--on'),
      opacity: Number(cs.opacity),
      // stroke-width built from a token computes to "calc(2.5px)", which
      // parseFloat reads as NaN — take the number out of whatever it is.
      width: Number((cs.strokeWidth.match(/[0-9.]+/) ?? [0])[0]),
    };
  });

  const anchors = [...fan.querySelectorAll('.strct-flow__anchor')].map((c) => ({
    x: Number(c.getAttribute('cx')), y: Number(c.getAttribute('cy')), opacity: Number(getComputedStyle(c).opacity),
  }));

  const tags = [...fan.querySelectorAll('[data-flow-tag]')].map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      key: el.getAttribute('data-flow-tag'),
      text: el.textContent.trim(),
      ...rel(r),
      clipped: el.scrollWidth > el.clientWidth + 1,
      opacity: Number(cs.opacity),
      color: cs.color,
      bg: cs.backgroundColor,
      on: el.classList.contains('strct-flow__tag--on'),
    };
  });

  return {
    base: { w: base.width, h: base.height },
    isolated: host.classList.contains('strct-flow--isolated'),
    surface: getComputedStyle(fan.closest('.demo__stage') ?? document.body).backgroundColor,
    boxes, cols, edges, anchors, tags,
  };
})()`;

/** The topology demo's own wiring, as the page declares it. */
const EDGES = [
  ['pp-mgmt', 'mvs', ''],
  ['pp-vm', 'mvs', ''],
  ['mvs', 'hv-01', ''],
  ['mvs', 'hv-02', ''],
  ['hv-01', 'u1', 'LACP · 25G'],
  ['hv-01', 'u2', 'LACP · 25G'],
  ['hv-02', 'u3', 'down 2 d'],
];

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
const area = (a, b) =>
  Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) *
  Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));

/**
 * Each declared edge matched to a drawn path by nearest endpoints —
 * assignment, not a threshold, so an edge that has drifted off its box is
 * still identified and the number reported is how far it drifted.
 */
function matchEdges(r, declared) {
  const taken = [...r.edges];
  const out = new Map();
  for (const [from, to, label] of declared) {
    const a = r.boxes[from];
    const b = r.boxes[to];
    if (!a || !b) continue;
    let best = null;
    let cost = Infinity;
    for (const e of taken) {
      const c =
        Math.abs(e.a.x - a.r) +
        Math.abs(e.z.x - b.l) +
        Math.abs(e.a.y - a.mid) / 8 +
        Math.abs(e.z.y - b.mid) / 8;
      if (c < cost) {
        cost = c;
        best = e;
      }
    }
    if (best) taken.splice(taken.indexOf(best), 1);
    out.set(`${from}>${to}`, { edge: best, a, b, label });
  }
  return out;
}

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
      if (await evaluate(send, `!!document.querySelector('#flow-topology .strct-flow__edge')`))
        break;
      await sleep(200);
    }
    await evaluate(send, `document.documentElement.setAttribute('data-theme', '${theme}')`);
    await sleep(900);
    const r = await evaluate(send, READ('#flow-topology strct-flow'));
    const at = `${width}px ${theme}`;

    check(
      `${at}: the case is on the page`,
      !!r && Object.keys(r.boxes).length === 8 && r.edges.length === 7 && r.tags.length === 3,
      r
        ? `${Object.keys(r.boxes).length} boxes, ${r.edges.length} edges, ${r.tags.length} labels, fan ${Math.round(r.base.w)}×${Math.round(r.base.h)}`
        : 'no #flow-topology fan — every check below would read nothing',
    );
    if (!r || r.edges.length !== 7) break;
    runWidths.push(Math.round(r.base.w));
    const m = matchEdges(r, EDGES);

    // 1. An edge leaves its own point on the box, and arrives at its own.
    const land = [...m.values()]
      .filter((e) => e.edge)
      .map((e) => ({
        head: Math.abs(e.edge.a.x - e.a.r),
        tail: Math.abs(e.edge.z.x - e.b.l),
        inA: e.edge.a.y >= e.a.t - 1 && e.edge.a.y <= e.a.b + 1,
        inB: e.edge.z.y >= e.b.t - 1 && e.edge.z.y <= e.b.b + 1,
      }));
    check(
      `${at}: every edge starts on its source's edge and ends on its target's`,
      land.length === EDGES.length &&
        land.every((l) => l.head <= LAND && l.tail <= LAND && l.inA && l.inB),
      `worst |x − box edge| ${Math.max(...land.map((l) => Math.max(l.head, l.tail))).toFixed(2)}px, ${land.filter((l) => l.inA && l.inB).length}/${land.length} within the box's own height`,
    );

    // 2. No two edges leave or arrive at one pixel.
    const key = (p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const starts = r.edges.map((e) => key(e.a));
    const ends = r.edges.map((e) => key(e.z));
    const dupStart = starts.filter((s, i) => starts.indexOf(s) !== i);
    const dupEnd = ends.filter((s, i) => ends.indexOf(s) !== i);
    check(
      `${at}: no two edges share an anchor`,
      dupStart.length === 0 && dupEnd.length === 0,
      `${new Set(starts).size} distinct starts and ${new Set(ends).size} distinct ends for ${r.edges.length} edges`,
    );

    // 3. No stretch of line is drawn twice.
    let doubled = 0;
    let pairs = 0;
    const worst = [];
    for (let i = 0; i < r.edges.length; i++)
      for (let j = i + 1; j < r.edges.length; j++) {
        const p = r.edges[i];
        const q = r.edges[j];
        if (Math.abs(p.trunkX - q.trunkX) > 1) continue;
        const ov = Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0);
        if (ov > 0.5) {
          pairs += 1;
          doubled += ov;
          worst.push(`${p.tone}/${q.tone} ${ov.toFixed(1)}px`);
        }
      }
    check(
      `${at}: no trunk is drawn over another`,
      pairs === 0,
      pairs === 0
        ? `${r.edges.length} trunks on ${new Set(r.edges.map((e) => e.trunkX.toFixed(1))).size} distinct lanes, 0px doubled`
        : `${pairs} collinear pairs, ${doubled.toFixed(1)}px doubled: ${worst.join(', ')}`,
    );

    // 4. Two edges off one node do not cross each other at the node.
    let crossings = 0;
    for (const id of new Set(EDGES.map((e) => e[0]))) {
      const off = EDGES.filter((e) => e[0] === id)
        .map((e) => m.get(`${e[0]}>${e[1]}`))
        .filter((e) => e?.edge);
      if (off.length < 2) continue;
      const byAnchor = [...off].sort((p, q) => p.edge.a.y - q.edge.a.y);
      const byTarget = [...off].sort((p, q) => p.b.mid - q.b.mid);
      if (byAnchor.some((e, i) => e !== byTarget[i])) crossings += 1;
    }
    check(
      `${at}: the anchors are in the order of the far ends`,
      crossings === 0,
      crossings === 0
        ? 'no node sends its edges out crossed'
        : `${crossings} node(s) cross their own edges`,
    );

    // 5. A word is in a strip, not on a box, and not on another word.
    const onBox = [];
    for (const t of r.tags)
      for (const [id, b] of Object.entries(r.boxes)) {
        const a = area(t, b);
        if (a > 0) onBox.push(`"${t.text}" over ${id} by ${Math.round(a)}px²`);
      }
    check(
      `${at}: no label is drawn over a box`,
      onBox.length === 0,
      onBox.length === 0
        ? `${r.tags.length} labels, 0px² over any of the ${Object.keys(r.boxes).length} boxes`
        : onBox.join('; '),
    );
    const onTag = [];
    for (let i = 0; i < r.tags.length; i++)
      for (let j = i + 1; j < r.tags.length; j++) {
        const a = area(r.tags[i], r.tags[j]);
        if (a > 0) onTag.push(`"${r.tags[i].text}" / "${r.tags[j].text}" ${Math.round(a)}px²`);
      }
    check(
      `${at}: no label is drawn over another`,
      onTag.length === 0,
      onTag.length === 0
        ? `0 overlapping pairs of ${(r.tags.length * (r.tags.length - 1)) / 2}`
        : onTag.join('; '),
    );
    const clipped = r.tags.filter((t) => t.clipped).length;
    const atFloor = r.cols.every((c) => c <= MIN_COL + 1);
    check(
      `${at}: a label is only ellipsised where the strip could not hold it`,
      clipped === 0 || atFloor,
      clipped === 0
        ? `${r.tags.length} labels, none clipped`
        : `${clipped} of ${r.tags.length} clipped, with the columns at their ${MIN_COL}px floor (${r.cols.join('/')}) — the full text stays in each node's description`,
    );

    // 6. The strip the labels asked for did not starve the columns.
    check(
      `${at}: the labels' strip left the columns their width`,
      r.cols.every((c) => c >= MIN_COL),
      `columns ${r.cols.join(' / ')}px (floor ${MIN_COL})`,
    );
  }

  // ── Picking a node: what recedes, and what must not.
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1400,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` });
  for (let i = 0; i < 120; i++) {
    if (await evaluate(send, `!!document.querySelector('#flow-topology .strct-flow__edge')`)) break;
    await sleep(200);
  }
  await evaluate(send, `document.documentElement.setAttribute('data-theme', 'light')`);
  await sleep(900);
  const before = await evaluate(send, READ('#flow-topology strct-flow'));
  await evaluate(
    send,
    `(() => {
      const el = [...document.querySelectorAll('#flow-topology [data-flow-node]')]
        .find((n) => n.getAttribute('data-flow-node') === 'hv-01');
      el.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    })()`,
  );
  // The selection is a signal: the marks appear on the next render, not in
  // the same turn the key was dispatched.
  await sleep(300);
  const picked = await evaluate(send, READ('#flow-topology strct-flow'));

  check(
    'Enter on a node picks it',
    picked.isolated,
    picked.isolated ? 'the fan is isolated' : 'nothing was picked',
  );
  const lit = picked.edges.filter((e) => e.on);
  const dim = picked.edges.filter((e) => !e.on);
  // hv-01 is on three edges: its two uplinks out, and the switch in.
  check(
    'picking lets the other edges recede',
    lit.length === 3 && dim.every((e) => e.opacity <= Math.min(...lit.map((l) => l.opacity)) - 0.5),
    `${lit.length} edges lit at ${[...new Set(lit.map((e) => e.opacity))].join('/')}, ${dim.length} at ${[...new Set(dim.map((e) => e.opacity))].join('/')}`,
  );
  check(
    'the picked edge is drawn heavier, not only brighter',
    lit.every((e) => e.width > Math.max(...dim.map((d) => d.width))),
    `picked ${[...new Set(lit.map((e) => e.width))].join('/')}px against ${[...new Set(dim.map((e) => e.width))].join('/')}px`,
  );
  check(
    'isolating recedes the lines, never the words',
    picked.tags.every((t) => t.opacity === 1) &&
      Object.values(picked.boxes).every((b) => b.opacity === 1),
    `label opacities ${[...new Set(picked.tags.map((t) => t.opacity))].join('/')}, box opacities ${[...new Set(Object.values(picked.boxes).map((b) => b.opacity))].join('/')}`,
  );
  const surface = parse(picked.surface);
  const worstTag = picked.tags
    .map((t) => {
      // An element's `opacity` composites the whole layer — glyphs and all —
      // over what is behind it, so the text ends at o·colour + (1−o)·surface,
      // not over its own dimmed background.
      const o = t.opacity;
      return {
        text: t.text,
        ratio: contrast(
          over(parse(t.color), o * (parse(t.color)[3] ?? 1), surface),
          over(parse(t.bg), o * (parse(t.bg)[3] ?? 1), surface),
        ),
      };
    })
    .sort((a, b) => a.ratio - b.ratio)[0];
  check(
    'every word on a line is readable while another node is picked',
    !!worstTag && worstTag.ratio >= AA,
    worstTag
      ? `worst of ${picked.tags.length}: "${worstTag.text}" ${worstTag.ratio.toFixed(2)}:1 (AA ${AA})`
      : 'no label',
  );
  // Not the position: a picked label is set in a heavier weight, so it is
  // measured and placed again. The colour is the thing that must not move.
  check(
    'picking never restates a word in another colour',
    JSON.stringify(picked.tags.map((t) => t.color).sort()) ===
      JSON.stringify(before.tags.map((t) => t.color).sort()),
    `${before.tags.length} labels, same colours before and after`,
  );

  // Picking it again clears it: a diagram can always be read whole.
  await evaluate(
    send,
    `(() => {
      const el = [...document.querySelectorAll('#flow-topology [data-flow-node]')]
        .find((n) => n.getAttribute('data-flow-node') === 'hv-01');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    })()`,
  );
  await sleep(300);
  check(
    'picking the picked node clears it',
    !(await evaluate(
      send,
      `document.querySelector('#flow-topology strct-flow').classList.contains('strct-flow--isolated')`,
    )),
    'the fan is whole again',
  );

  // ── The arrow keys still follow the edge, not the column.
  const walked = await evaluate(
    send,
    `(() => {
      const at = (id) => [...document.querySelectorAll('#flow-topology [data-flow-node]')]
        .find((n) => n.getAttribute('data-flow-node') === id);
      const a = at('hv-01');
      a.focus();
      a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      return document.activeElement?.getAttribute('data-flow-node') ?? 'nothing';
    })()`,
  );
  check(
    '→ follows the edge to the far end',
    walked === 'u1',
    `from hv-01 → ${walked} (expected u1, its first uplink)`,
  );

  // ── The second diagram on the page: the same geometry, no labels.
  const tree = await evaluate(send, READ('#flow-fanout strct-flow[layout="tree"]'));
  if (tree) {
    const starts = tree.edges.map((e) => `${e.a.x.toFixed(1)},${e.a.y.toFixed(1)}`);
    let doubled = 0;
    for (let i = 0; i < tree.edges.length; i++)
      for (let j = i + 1; j < tree.edges.length; j++) {
        const p = tree.edges[i];
        const q = tree.edges[j];
        if (Math.abs(p.trunkX - q.trunkX) > 1) continue;
        doubled += Math.max(0, Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0));
      }
    check(
      'the tree on the same page draws no line twice either',
      doubled < 0.5 && new Set(starts).size === starts.length,
      `${tree.edges.length} edges, ${new Set(starts).size} distinct starts, ${doubled.toFixed(1)}px doubled`,
    );
  } else {
    check('the tree on the same page draws no line twice either', false, 'no tree fan found');
  }

  // ── Narrow: the columns stack, and the connectors say nothing, so they go.
  await send('Emulation.setDeviceMetricsOverride', {
    width: 430,
    height: 1400,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(900);
  const narrow = await evaluate(
    send,
    `(() => {
      const fan = document.querySelector('#flow-topology .strct-flow__fan');
      if (!fan) return null;
      return {
        dir: getComputedStyle(fan).flexDirection,
        edges: getComputedStyle(fan.querySelector('.strct-flow__edges')).display,
        tags: fan.querySelector('.strct-flow__tags')
          ? getComputedStyle(fan.querySelector('.strct-flow__tags')).display
          : 'not drawn',
      };
    })()`,
  );
  check(
    'narrow: the columns stack and the drawing stands down',
    !!narrow &&
      narrow.dir === 'column' &&
      narrow.edges === 'none' &&
      (narrow.tags === 'none' || narrow.tags === 'not drawn'),
    narrow
      ? `flex-direction ${narrow.dir}, edges ${narrow.edges}, labels ${narrow.tags}`
      : 'no fan',
  );

  check(
    'the two widths drew two different diagrams',
    new Set(runWidths).size === RUNS.length,
    `fan widths: ${runWidths.join(', ')}px`,
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
  console.error(`\n✗ ${failed.length} of ${checks.length} flow-topology checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} flow-topology checks passed.`);
