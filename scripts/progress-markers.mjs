/**
 * FR-78-01: a line on the track that means something.
 *
 * `thresholds` recolours the fill; a bar at 74% tinted warning says "too
 * much", not "four points past the line". The line itself is the point of a
 * capacity bar drawn against a threshold, so it has to land on its value —
 * in the TRACK's coordinates, not the component's, because `visibleLabel`,
 * `caption` and `valuePosition="end"` all take width away from the track.
 * HyperStruct's workaround placed a tick by the host's width and had to
 * avoid every one of those cases.
 *
 * So every number here is read back from what Chrome laid out: the marker's
 * own box against the track's, at full width and inside a 120px table cell,
 * with the value above the track and beside it; how far it reaches past the
 * track; what it measures against the fill it crosses, in both palettes; and
 * whether the bar says it out loud without adding a tab stop.
 *
 *   node scripts/progress-markers.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4713;
const CDP = 9413;
const ROUTE = '/components/progress';
/** How far the marker may sit from the value it names, in px. */
const LAND = 1;
/** How far it must reach past the track, top and bottom. */
const REACH = 3;
/** WCAG 1.4.11 for a graphic that carries meaning. */
const AANT = 3;

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

/** Every bar in the demo, with its track, its fills and its markers. */
const READ = `(() => {
  const demo = document.querySelector('#progress-markers');
  if (!demo) return null;
  const bars = [...demo.querySelectorAll('strct-progress')].map((bar, i) => {
    const track = bar.querySelector('.strct-progress__track');
    const tb = track.getBoundingClientRect();
    const fills = [...bar.querySelectorAll('.strct-progress__fill')].map((f) => {
      const b = f.getBoundingClientRect();
      return { l: b.left - tb.left, w: b.width, bg: getComputedStyle(f).backgroundColor };
    });
    const marks = [...bar.querySelectorAll('.strct-progress__marker')].map((m) => {
      const b = m.getBoundingClientRect();
      const cs = getComputedStyle(m);
      return {
        label: m.getAttribute('data-marker'),
        // The centre of the line, in the track's own coordinates.
        at: b.left + b.width / 2 - tb.left,
        w: b.width,
        above: tb.top - b.top,
        below: b.bottom - tb.bottom,
        ink: cs.backgroundColor,
        // The hairline either side of the core is part of the mark: it is
        // what makes a tinted line findable on a fill of a near tone.
        halo: cs.boxShadow,
        hidden: m.getAttribute('aria-hidden') === 'true',
        tabbable: m.hasAttribute('tabindex'),
      };
    });
    return {
      i,
      label: bar.querySelector('.strct-progress__label')?.textContent.trim() ?? '',
      ariaLabel: track.getAttribute('aria-label'),
      valueText: track.getAttribute('aria-valuetext'),
      endValue: bar.classList.contains('strct-progress--endvalue'),
      inCell: !!bar.closest('td'),
      track: { w: tb.width, h: tb.height },
      host: bar.getBoundingClientRect().width,
      fills,
      marks,
    };
  });
  return { bars, tabStops: demo.querySelectorAll('[tabindex]:not([tabindex="-1"]), a, button, input').length };
})()`;

/** Where the demo says each bar's marker belongs, as a share of the track. */
const saidAt = (valueText, label) => {
  const safe = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(safe + '\\s+([0-9.]+)%').exec(valueText ?? '');
  return m ? Number(m[1]) : null;
};
/** The first colour in a box-shadow, which is the hairline's. */
const haloInk = (shadow) => {
  const m = /(rgba?\([^)]+\)|#[0-9a-f]{3,8}|color\([^)]+\))/i.exec(shadow ?? '');
  return m ? m[1] : null;
};

const parse = (c) => {
  const n = (c.match(/[0-9.]+(?:e[-+]?\d+)?/g) ?? [0, 0, 0, 1]).map(Number);
  return /^color\(/.test(c) ? n.map((v, i) => (i < 3 ? v * 255 : v)) : n;
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
/** The fill a marker crosses, if any: the one whose span contains it. */
const fillUnder = (bar, mark) => {
  for (const f of bar.fills) if (mark.at >= f.l - 0.5 && mark.at <= f.l + f.w + 0.5) return f;
  return null;
};

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
let up = false;

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  up = true;

  for (const theme of ['light', 'dark']) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1400,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` });
    for (let i = 0; i < 120; i++) {
      if (
        await evaluate(
          send,
          `!!document.querySelector('#progress-markers .strct-progress__marker')`,
        )
      )
        break;
      await sleep(200);
    }
    await evaluate(send, `document.documentElement.setAttribute('data-theme', '${theme}')`);
    await sleep(700);
    const r = await evaluate(send, READ);
    if (!r) {
      check(`${theme}: the demo is on the page`, false, 'no #progress-markers');
      break;
    }
    const marked = r.bars.filter((b) => b.marks.length);

    check(
      `${theme}: the case is on the page`,
      marked.length === 6 &&
        marked.some((b) => b.inCell && b.endValue) &&
        marked.some((b) => !b.inCell && !b.endValue) &&
        marked.some((b) => b.fills.length > 1),
      `${marked.length} bars with a marker — ${marked.filter((b) => b.inCell).length} in a 120px cell with the value beside the track, ${marked.filter((b) => b.fills.length > 1).length} stacked`,
    );
    if (marked.length !== 6) break;

    // 1. It lands on its value, in the TRACK's coordinates — which is the
    //    thing the workaround could not do once the track stopped spanning
    //    the component.
    const off = marked.map((b) => ({
      where: `${b.inCell ? 'cell' : 'full'}${b.endValue ? '/end' : '/top'}`,
      track: b.track.w,
      host: b.host,
      said: saidAt(b.valueText, b.marks[0].label),
      miss: (() => {
        const said = saidAt(b.valueText, b.marks[0].label);
        return said === null ? Infinity : Math.abs(b.marks[0].at - (b.track.w * said) / 100);
      })(),
    }));
    const worst = off.sort((a, b) => b.miss - a.miss)[0];
    check(
      `${theme}: every marker lands on its value`,
      off.every((o) => o.miss <= LAND),
      `worst ${worst.miss.toFixed(2)}px of ${off.length} bars, at ${[...new Set(off.map((o) => o.said))].join('% and ')}% (floor ${LAND}px) — ${[...new Set(off.map((o) => `${o.where} track ${o.track.toFixed(0)}px in ${o.host.toFixed(0)}px`))].join(', ')}`,
    );

    // 2. It reaches past the track on both sides.
    const reach = marked.flatMap((b) => b.marks.map((m) => ({ above: m.above, below: m.below })));
    check(
      `${theme}: every marker reaches past the track`,
      reach.every((m) => m.above >= REACH - 0.5 && m.below >= REACH - 0.5),
      `least ${Math.min(...reach.map((m) => Math.min(m.above, m.below))).toFixed(1)}px above and below a ${marked[0].track.h}px track (asked ${REACH})`,
    );

    // 3. It is told apart from the fill it crosses.
    const crossing = marked
      .map((b) => ({ bar: b, m: b.marks[0], f: fillUnder(b, b.marks[0]) }))
      .filter((x) => x.f && x.f.w > 0);
    // The mark is a tinted core between two hairlines, and either may be the
    // thing that separates it: a critical line over a warning fill measures
    // 1.06:1 on its core alone, which is what the hairlines are for.
    const ratios = crossing.map((x) => {
      const fill = parse(x.f.bg).slice(0, 3);
      const core = contrast(parse(x.m.ink).slice(0, 3), fill);
      const halo = haloInk(x.m.halo);
      const edge = halo ? contrast(parse(halo).slice(0, 3), fill) : 0;
      return { label: x.bar.label || x.bar.ariaLabel, core, edge, ratio: Math.max(core, edge) };
    });
    const weakest = ratios.sort((a, b) => a.ratio - b.ratio)[0];
    check(
      `${theme}: a marker is told apart from the fill it crosses`,
      crossing.length > 0 && ratios.every((x) => x.ratio >= AANT),
      crossing.length
        ? `${ratios.length} markers over a fill, weakest ${weakest.ratio.toFixed(2)}:1 on "${weakest.label}" (core ${weakest.core.toFixed(2)}, hairline ${weakest.edge.toFixed(2)}, floor ${AANT})`
        : 'no marker crosses a fill in the fixture',
    );

    // 4. It is said, and it is not a thing to tab to.
    const spoken = marked.filter((b) =>
      b.marks.every((m) => saidAt(b.valueText, m.label) !== null),
    );
    check(
      `${theme}: every bar says the line it carries`,
      spoken.length === marked.length,
      `${spoken.length}/${marked.length} — e.g. "${marked[0].valueText}"`,
    );
    check(
      `${theme}: a marker is not a second thing to find`,
      marked.every((b) => b.marks.every((m) => m.hidden && !m.tabbable)),
      `${marked.flatMap((b) => b.marks).length} markers, all aria-hidden and none in the tab order`,
    );
  }
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
  console.error(`\n✗ ${failed.length} of ${checks.length} progress-marker checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} progress-marker checks passed.`);
