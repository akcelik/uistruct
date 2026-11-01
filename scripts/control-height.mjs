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
    for (const strip of row.querySelectorAll('.ch__strip')) {
      const via = strip.hasAttribute('strctControlSize') ? 'container' : 'size';
      for (const el of strip.children) {
        // The control's own box — a custom element's host is the control.
        const h = Math.round(el.getBoundingClientRect().height * 100) / 100;
        rows.push({
          size,
          via,
          what: (el.tagName.toLowerCase() + ' ' + (el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 18))).trim(),
          want,
          got: h,
        });
      }
    }
  }
  return rows;
})()`;

const bad = [];
let measured = 0;

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
  }
} finally {
  chrome.kill();
  server.close();
}

console.log(`Measured ${measured} control boxes across ${THEMES.length} themes.`);
if (bad.length) {
  console.error(`\n${bad.length} are not the height their size asks for:\n`);
  for (const b of bad.slice(0, 40))
    console.error(
      `  ${b.theme}  ${b.size ?? ''} ${b.via ?? ''}  ${b.what}: wanted ${b.want}px, drew ${b.got}px`,
    );
  process.exit(1);
}
console.log('Every control is exactly the height its size asks for.');
