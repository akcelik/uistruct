/**
 * Reproducible datagrid benchmark: serves the built showcase, drives the
 * 20k-row virtual-scroll demo in headless Chrome over raw CDP and prints
 * the numbers cited in docs/performance.md.
 *
 *   ng build showcase && node scripts/perf-grid.mjs
 */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn, execSync } from 'node:child_process';

const ROOT = 'dist/showcase/browser';
const PORT = 4699;
const CDP = 9399;
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

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');

  const t0 = Date.now();
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/datagrid` });
  // Wait for the virtual grid to appear.
  for (let i = 0; i < 60; i++) {
    const ready = await evaluate(
      send,
      `!!document.querySelector('.strct-dg-host--virtual tbody tr')`,
    );
    if (ready) break;
    await sleep(200);
  }
  const pageMs = Date.now() - t0;

  const result = await evaluate(
    send,
    `(async () => {
      const grid = [...document.querySelectorAll('strct-datagrid')]
        .find((g) => g.classList.contains('strct-dg-host--virtual'));
      const scroller = grid.querySelector('.strct-dg__scroll');
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const domRows = grid.querySelectorAll('tbody tr:not(.strct-dg__vspacer)').length;
      const domNodes = grid.querySelectorAll('*').length;

      // Deep-scroll re-render: jump to 5 far-apart offsets, time each window swap.
      const offsets = [100000, 380000, 40000, 600000, 220000];
      const times = [];
      for (const off of offsets) {
        const t = performance.now();
        scroller.scrollTop = off;
        scroller.dispatchEvent(new Event('scroll'));
        await frame();
        times.push(performance.now() - t);
      }
      const scrollMs = times.reduce((a, b) => a + b, 0) / times.length;

      // Client-side sort of the full 20k set (click the Host header).
      const th = grid.querySelector('.strct-dg__th--sortable');
      const t2 = performance.now();
      th.click();
      await frame();
      const sortMs = performance.now() - t2;
      th.click(); await frame(); th.click(); await frame(); // back to unsorted

      return { domRows, domNodes, scrollMs: +scrollMs.toFixed(1), sortMs: +sortMs.toFixed(1) };
    })()`,
    true,
  );

  console.log('\nUIStruct datagrid benchmark — 20,000 rows, virtual scroll');
  console.log('─'.repeat(60));
  console.log(`Docs page ready (navigate → grid rendered)   ${pageMs} ms`);
  console.log(`<tr> elements in the DOM                     ${result.domRows}`);
  console.log(`Total DOM nodes inside the grid              ${result.domNodes}`);
  console.log(`Deep-scroll window swap (avg of 5 jumps)     ${result.scrollMs} ms`);
  console.log(`Client-side sort of all 20,000 rows          ${result.sortMs} ms`);
  console.log('─'.repeat(60));
  console.log(JSON.stringify({ pageMs, ...result }));
} finally {
  chrome.kill();
  server.close();
}
