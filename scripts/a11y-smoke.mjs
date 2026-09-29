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

// ── Accent-on-background contrast, all six schemes ────────────────────────
// `variant="link"` paints --acc text straight onto the page, with no border or
// fill to help it, so accent-on-background is a text contrast pair now.
const SCHEMES = ['arctic', 'ember', 'sage'].flatMap((palette) =>
  ['dark', 'light'].map((mode) => ({ palette, mode })),
);
await send('Page.navigate', { url: `http://localhost:${PORT}/components/button` });
await sleep(2500);
const { result: contrastResult } = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    // Tokens come as #rgb, #rrggbb(aa) or rgb()/rgba() — all three, or the
    // reading is silently wrong.
    const parse = (raw) => {
      const c = raw.trim();
      if (c.startsWith('#')) {
        const h = c.slice(1);
        const full =
          h.length === 3 || h.length === 4
            ? [...h].map((x) => x + x).join('')
            : h;
        const n = (i) => parseInt(full.slice(i, i + 2), 16);
        return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) / 255 : 1 };
      }
      const m = c.match(/[\d.]+/g);
      if (!m) throw new Error('unreadable colour: ' + raw);
      const v = m.map(Number);
      return { r: v[0], g: v[1], b: v[2], a: v[3] ?? 1 };
    };
    // A translucent token is what you see over its ground, not its own value.
    const over = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    const lum = ({ r, g, b }) =>
      [r, g, b]
        .map((v) => v / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
        .reduce((acc, c, i) => acc + [0.2126, 0.7152, 0.0722][i] * c, 0);
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const root = document.documentElement;
    const before = [root.getAttribute('data-palette'), root.getAttribute('data-theme')];
    const out = [];
    for (const palette of ['arctic', 'ember', 'sage']) {
      for (const mode of ['dark', 'light']) {
        root.setAttribute('data-palette', palette);
        root.setAttribute('data-theme', mode);
        const cs = getComputedStyle(root);
        const bg = parse(cs.getPropertyValue('--bg-1'));
        const acc = over(parse(cs.getPropertyValue('--acc')), bg);
        out.push({ scheme: palette + '/' + mode, ratio: +ratio(acc, bg).toFixed(2) });
      }
    }
    if (before[0]) root.setAttribute('data-palette', before[0]); else root.removeAttribute('data-palette');
    if (before[1]) root.setAttribute('data-theme', before[1]); else root.removeAttribute('data-theme');
    return out;
  })()`,
});
const contrasts = contrastResult?.value ?? [];
const AA = 4.5;
const belowAA = contrasts.filter((c) => c.ratio < AA);
console.log(
  `\n${belowAA.length ? '✗' : '✓'} --acc on --bg-1: ` +
    contrasts.map((c) => `${c.scheme} ${c.ratio}`).join(' · '),
);
failures += belowAA.length;
if (!contrasts.length) {
  console.log('✗ contrast check produced no readings');
  failures += 1;
}
writeFileSync(join(OUT, '_contrast.json'), JSON.stringify(contrasts, null, 2));

chrome.kill();
server.close();
if (failures > 0) {
  console.error(`\n${failures} a11y failure(s) — serious/critical violations or contrast below AA.`);
  process.exit(1);
}
console.log('\nA11y smoke passed.');
process.exit(0);
