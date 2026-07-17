/**
 * Visual regression gate: screenshots key showcase routes across theme schemes
 * in headless Chrome and compares them pixel-by-pixel against the committed
 * baselines in tests/visual/baseline/.
 *
 *   ng build showcase && node scripts/visual-regression.mjs           # compare
 *   ng build showcase && node scripts/visual-regression.mjs --update  # rebaseline
 *
 * Animations/transitions/carets are frozen for determinism. A page fails when
 * more than MAX_DIFF_RATIO of its pixels differ (anti-aliasing tolerance via
 * pixelmatch's threshold); diffs land in visual-artifacts/.
 */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ROOT = 'dist/showcase/browser';
const BASE_DIR = 'tests/visual/baseline';
const OUT_DIR = 'visual-artifacts';
const PORT = 4698;
const CDP = 9398;
const WIDTH = 1280;
const HEIGHT = 900;
/** Fail when more than this fraction of pixels differ. */
const MAX_DIFF_RATIO = 0.005;

const UPDATE = process.argv.includes('--update');

const ROUTES = [
  ['home', '/'],
  ['button', '/components/button'],
  ['datagrid', '/components/datagrid'],
  ['line', '/components/line'],
  ['tree', '/components/tree'],
];
const SCHEMES = [
  ['arctic-dark', 'arctic', 'dark'],
  ['arctic-light', 'arctic', 'light'],
];

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
mkdirSync(BASE_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const server = createServer((req, res) => {
  let p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(ROOT, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  createReadStream(p).pipe(res);
}).listen(PORT);

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
    '--force-device-scale-factor=1',
    '--hide-scrollbars',
    `--window-size=${WIDTH},${HEIGHT}`,
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
  return new Promise((resolve) => (ws.onopen = () => resolve({ send })));
}

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  // Freeze motion + carets before any app code runs; pin the scheme via the
  // theme service's own storage keys.
  let failures = 0;
  const rows = [];
  for (const [schemeName, palette, mode] of SCHEMES) {
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        localStorage.setItem('strct-palette', '${palette}');
        localStorage.setItem('strct-theme', '${mode}');
        const s = document.createElement('style');
        s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
        document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
      `,
    });
    for (const [routeName, route] of ROUTES) {
      const name = `${routeName}--${schemeName}`;
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${route}` });
      await sleep(2600);
      await send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
      await sleep(300);
      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 },
      });
      const current = Buffer.from(shot.data, 'base64');
      const basePath = join(BASE_DIR, `${name}.png`);
      if (UPDATE || !existsSync(basePath)) {
        writeFileSync(basePath, current);
        rows.push([name, existsSync(basePath) && !UPDATE ? 'baseline created' : 'baseline updated']);
        continue;
      }
      const a = PNG.sync.read(readFileSync(basePath));
      const b = PNG.sync.read(current);
      if (a.width !== b.width || a.height !== b.height) {
        rows.push([name, `FAIL size ${a.width}x${a.height} → ${b.width}x${b.height}`]);
        failures++;
        writeFileSync(join(OUT_DIR, `${name}.current.png`), current);
        continue;
      }
      const diff = new PNG({ width: a.width, height: a.height });
      const differing = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
        threshold: 0.15,
      });
      const ratio = differing / (a.width * a.height);
      if (ratio > MAX_DIFF_RATIO) {
        failures++;
        writeFileSync(join(OUT_DIR, `${name}.current.png`), current);
        writeFileSync(join(OUT_DIR, `${name}.diff.png`), PNG.sync.write(diff));
        rows.push([name, `FAIL ${(ratio * 100).toFixed(2)}% pixels differ`]);
      } else {
        rows.push([name, `ok (${(ratio * 100).toFixed(3)}%)`]);
      }
    }
  }
  console.log('\nVisual regression — ' + (UPDATE ? 'baseline update' : 'compare'));
  console.log('─'.repeat(56));
  for (const [n, s] of rows) console.log(`${n.padEnd(28)} ${s}`);
  console.log('─'.repeat(56));
  if (failures) {
    console.error(`${failures} page(s) differ — inspect ${OUT_DIR}/*.diff.png`);
    process.exitCode = 1;
  } else {
    console.log(UPDATE ? 'Baselines written.' : 'All pages match the baselines.');
  }
} finally {
  chrome.kill();
  server.close();
}
