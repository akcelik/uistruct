/**
 * Fails when the showcase logs a `[strct]` diagnostic anywhere.
 *
 * The library warns in dev mode about attributes a component does not have
 * (FR-48-42) and about combinations it cannot honour. Those warnings are for
 * consumers — so the library's own showcase must never trigger one, and this
 * makes that a standing check rather than a habit.
 *
 * It runs against the DEVELOPMENT build on purpose: production compiles the
 * diagnostics out, which would make the check vacuous.
 *
 * Usage: node scripts/dev-warnings.mjs [distDir]
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { execSync, spawn } from 'node:child_process';

const ROOT = process.argv[2] ?? 'dist/showcase/browser';
const PORT = 4179;
const CDP = 9226;
const ROUTES = [
  '/',
  '/foundations/icons',
  '/foundations/theming',
  '/components/button',
  '/components/datagrid',
  '/components/alert',
  '/components/tag',
  '/components/status-dot',
  '/components/window',
  '/components/chat',
  '/components/qr',
  '/components/login',
  '/patterns',
  '/scenarios/dashboard',
];

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
    f = join(ROOT, 'index.html');
  }
  res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
  createReadStream(f).pipe(res);
}).listen(PORT);

const chromeBin =
  process.env.CHROME_BIN ??
  ['google-chrome', 'chromium', 'chromium-browser']
    .map((bin) => {
      try {
        return execSync(`command -v ${bin}`, { encoding: 'utf8' }).trim();
      } catch {
        return '';
      }
    })
    .find(Boolean);
const chrome = spawn(
  chromeBin,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${CDP}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      /* retry until Chrome is up */
    }
    await sleep(250);
  }
  throw new Error(
    `CDP endpoint unavailable: Chrome did not answer on port ${CDP} within 30s — ` +
      `a launch failure, not a warning (binary: ${chromeBin}).`,
  );
}

const page = await target();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let id = 0;
const pending = new Map();
const found = [];
/** Flat inputs the showcase still passes — the 6.0 readiness list. */
const deprecated = new Set();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
    return;
  }
  if (m.method === 'Runtime.consoleAPICalled') {
    const text = (m.params.args ?? [])
      .map((a) => a.value ?? a.description ?? '')
      .join(' ')
      .trim();
    if (text.includes('[strct]')) found.push(text);
    // A deprecation notice is not misuse: it is the 6.0 readiness signal.
    // Every flat input the showcase still uses is named once per app run, so
    // the lines collected here are the work left before the major.
    if (text.includes('removed in 6.0')) {
      for (const line of text.split('\n')) {
        const moved = line.match(/^\s{2}(\S+) → (\S+)/);
        if (moved) deprecated.add(`${moved[1]} → ${moved[2]}`);
      }
    }
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

await send('Page.enable');
await send('Runtime.enable');
for (const route of ROUTES) {
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${route}` });
  await sleep(2200);
  console.log(`· ${route}`);
}
chrome.kill();
server.close();

if (found.length) {
  console.error(`\n✗ ${found.length} [strct] diagnostic(s) from the showcase itself:`);
  for (const f of new Set(found)) console.error(`   ${f}`);
  process.exit(1);
}
console.log('\nNo [strct] diagnostics. The showcase uses the library as documented.');
if (deprecated.size) {
  console.log(
    `\n⚠ ${deprecated.size} input(s) the showcase still passes flat; 6.0 removes them:`,
  );
  for (const line of [...deprecated].sort()) console.log(`   ${line}`);
  console.log('   (see docs/migration-6.md — this list must be empty before 6.0)');
} else {
  console.log('\n✓ Nothing deprecated left in the showcase: ready for 6.0.');
}
process.exit(0);
