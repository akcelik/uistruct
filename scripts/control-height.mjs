/**
 * One height per size: every single-line control, in every size, with and
 * without an icon, disabled, loading, in both themes — each measured against
 * the token it is supposed to be.
 *
 *   ng build showcase && node scripts/control-height.mjs
 *
 * jsdom has no layout, so this is the only place the claim can be checked
 * (FR-63-04). It reads /foundations/controls, where every control stands in
 * a row per size. Exits non-zero with the controls that were the wrong
 * height.
 */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4703;
const CDP = 9403;
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

if (!existsSync(ROOT)) {
  console.error(`Missing ${ROOT} — run: npx ng build showcase`);
  process.exit(1);
}

const server = createServer((req, res) => {
  // The request path is attacker-shaped: decode it safely and refuse anything
  // that resolves outside ROOT (`/../../etc/passwd`, `%2e%2e%2f…`).
  let rel;
  try {
    rel = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    res.statusCode = 400;
    return res.end();
  }
  let p = resolve(ROOT, `.${rel}`);
  if (p !== ROOT && !p.startsWith(ROOT + sep)) {
    res.statusCode = 403;
    return res.end();
  }
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(ROOT, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  createReadStream(p).pipe(res);
}).listen(PORT, '127.0.0.1'); // loopback only — never expose the build on the LAN

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
const chrome = spawn(
  chromeBin,
  [
    '--headless=new',
    `--remote-debugging-port=${CDP}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,1000',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      /* retry until Chrome is up */
    }
    await sleep(200);
  }
  throw new Error('CDP endpoint unavailable');
}

function connect(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  return new Promise((resolve) => (ws.onopen = () => resolve({ ws, send })));
}

async function evaluate(send, expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

/** The palettes are `[data-palette][data-theme]` pairs on <html>. */
const THEMES = [
  ['arctic', 'light'],
  ['arctic', 'dark'],
  ['ember', 'light'],
];

const MEASURE = `(() => {
  const token = (name) =>
    Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)));
  const rows = [];
  for (const row of document.querySelectorAll('.ch__row')) {
    const size = row.dataset.size;
    const want = token('--control-h-' + size);
    const wantIcon = token('--icon-size-' + size);
    for (const strip of row.querySelectorAll('.ch__strip')) {
      const via = strip.hasAttribute('strctControlSize') ? 'container' : 'size';
      for (const el of strip.children) {
        // The control's own box — a custom element's host is the control.
        const h = Math.round(el.getBoundingClientRect().height * 100) / 100;
        const what = (
          el.tagName.toLowerCase() +
          ' ' +
          (el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 18))
        ).trim();
        rows.push({ size, via, what, want, got: h });
        // FR-64-01: and the icon it holds is the size that goes with it,
        // unless it was given one of its own.
        for (const icon of el.querySelectorAll('strct-icon')) {
          if (icon.style.getPropertyValue('--icon-size')) continue;
          const svg = icon.querySelector('svg');
          if (!svg) continue;
          rows.push({
            size,
            via,
            what: what + ' › icon',
            want: wantIcon,
            got: Math.round(svg.getBoundingClientRect().height * 100) / 100,
          });
        }
      }
    }
  }
  return rows;
})()`;

const bad = [];
let measured = 0;
let icons = 0;
const pen = new Set();

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  });

  for (const [palette, theme] of THEMES) {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/foundations/controls` });
    for (let i = 0; i < 80; i++) {
      if (await evaluate(send, `!!document.querySelector('.ch__strip > *')`)) break;
      await sleep(200);
    }
    await evaluate(
      send,
      `(() => { const r = document.documentElement; r.dataset.palette = '${palette}'; r.dataset.theme = '${theme}'; })()`,
    );
    await sleep(400);
    const rows = await evaluate(send, MEASURE);
    if (!rows.length) {
      bad.push({
        theme: palette + '/' + theme,
        what: 'the page',
        want: '—',
        got: 'no controls found',
      });
      continue;
    }
    measured += rows.length;
    for (const r of rows) {
      // A whole number of pixels, and the number the token names.
      if (r.got !== r.want) bad.push({ theme: palette + '/' + theme, ...r });
    }

    // One pen, at every size (FR-68-01). A stroke width is in user units, so
    // the 16-unit glyph scaled it with the icon: the library's own default of
    // 1.4 painted 1.23px in a small button and 2.28px in a 26px icon, and 50
    // call sites across 34 components picked their own number besides. The
    // glyph carries vector-effect="non-scaling-stroke" now, so the number is
    // the painted thickness. The 12-unit mode badge is out of scope on
    // purpose: it is a 7-9px mark tuned by eye for FR-61-01.
    const pens = await evaluate(
      send,
      `(() => {
        const seen = {};
        for (const svg of document.querySelectorAll('strct-icon > svg')) {
          const box = (svg.getAttribute('viewBox') ?? '').split(/\\s+/);
          const units = Number(box[2]);
          if (units !== 16) continue;
          const w = svg.getBoundingClientRect().width;
          if (!w) continue;
          const n = Number(svg.getAttribute('stroke-width') ?? 1.4);
          // vector-effect is not inherited, so it has to be read off a shape
          // that draws, not off the <svg> that holds them.
          const shape = svg.querySelector('path, circle, rect, line, polyline, polygon');
          const painted =
            shape && getComputedStyle(shape).vectorEffect === 'non-scaling-stroke'
              ? n
              : n * (w / units);
          const k = (Math.round(painted * 100) / 100).toFixed(2);
          seen[k] = (seen[k] ?? 0) + 1;
        }
        return seen;
      })()`,
    );
    const widths = Object.keys(pens);
    icons += Object.values(pens).reduce((a, b) => a + b, 0);
    if (widths.length > 1)
      bad.push({
        theme: palette + '/' + theme,
        what: 'the icon pen',
        want: 'one width',
        got: widths.map((w) => `${w}px×${pens[w]}`).join(', '),
      });
    else if (widths.length === 1) pen.add(widths[0]);
  }
} finally {
  chrome.kill();
  server.close();
}

console.log(
  `Measured ${measured} control and icon boxes across ${THEMES.length} themes, ` +
    `and the pen on ${icons} icons.`,
);
if (pen.size > 1)
  bad.push({
    theme: 'across themes',
    what: 'the icon pen',
    want: 'one width',
    got: [...pen].join(', '),
  });
if (bad.length) {
  console.error(`\n${bad.length} are not what their token asks for:\n`);
  for (const b of bad.slice(0, 40))
    console.error(
      `  ${b.theme}  ${b.size ?? ''} ${b.via ?? ''}  ${b.what}: wanted ${b.want}, drew ${b.got}`,
    );
  process.exit(1);
}
console.log(
  `Every control, and every icon in one, is exactly the size it should be, ` +
    `and every glyph is drawn with the same ${[...pen][0]}px pen.`,
);
