/**
 * A11y smoke: serves the built showcase, drives headless Chrome over raw CDP
 * (no puppeteer dependency — Node 22's built-in WebSocket), injects axe-core on
 * key routes and fails on serious/critical violations. Also saves a screenshot
 * per route (uploaded as CI artifacts for a visual paper trail).
 *
 * Usage: node scripts/a11y-smoke.mjs [distDir]
 */
import { createServer } from 'node:http';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { extname, join } from 'node:path';
import { execSync, spawn } from 'node:child_process';

const ROOT = process.argv[2] ?? 'dist/showcase/browser';
const PORT = 4173;
const ROUTES = [
  '/',
  '/foundations/theming',
  '/foundations/icons',
  '/components/button',
  '/components/line',
  '/components/tree',
  '/components/datagrid',
  '/components/time-range',
  '/scenarios/dashboard',
];
const OUT = 'a11y-artifacts';
mkdirSync(OUT, { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};
const server = createServer((req, res) => {
  let f = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(f) || statSync(f).isDirectory()) {
    if (extname(req.url)) {
      res.writeHead(404);
      return res.end();
    }
    f = join(ROOT, 'index.html'); // SPA fallback
  }
  res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
  createReadStream(f).pipe(res);
}).listen(PORT);

const chromeBin =
  process.env.CHROME_BIN ??
  ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'].find((c) => {
    try {
      execSync(`command -v ${c}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });
if (!chromeBin) {
  console.error('No Chrome/Chromium binary found (set CHROME_BIN).');
  process.exit(2);
}

const chrome = spawn(
  chromeBin,
  ['--headless=new', '--disable-gpu', '--no-sandbox', '--remote-debugging-port=9222', 'about:blank'],
  { stdio: 'ignore' },
);
const axeSource = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch('http://localhost:9222/json/list')).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return new WebSocket(page.webSocketDebuggerUrl);
    } catch {
      /* chrome not up yet */
    }
    await sleep(300);
  }
  throw new Error('CDP endpoint unavailable');
}

const ws = await connect();
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
await send('Page.enable');
await send('Runtime.enable');

let failures = 0;
for (const route of ROUTES) {
  await send('Page.navigate', { url: `http://localhost:${PORT}${route}` });
  await sleep(2500);
  await send('Runtime.evaluate', { expression: axeSource });
  const { result } = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `axe.run(document, { resultTypes: ['violations'] }).then(r =>
      JSON.stringify(r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }))))`,
  });
  const violations = JSON.parse(result?.value ?? '[]');
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

  const slug = route === '/' ? '_home' : route.replaceAll('/', '_');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, `${slug}.png`), Buffer.from(shot.data, 'base64'));
  writeFileSync(join(OUT, `${slug}.json`), JSON.stringify(violations, null, 2));

  console.log(
    `${serious.length ? '✗' : '✓'} ${route} — ${violations.length} finding(s), ${serious.length} serious/critical`,
  );
  for (const v of serious) console.log(`   [${v.impact}] ${v.id}: ${v.help} (${v.nodes} node(s))`);
  failures += serious.length;
}

chrome.kill();
server.close();
if (failures > 0) {
  console.error(`\n${failures} serious/critical a11y violation(s).`);
  process.exit(1);
}
console.log('\nA11y smoke passed.');
process.exit(0);
