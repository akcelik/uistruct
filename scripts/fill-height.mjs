/**
 * FR-69-02: a grid that takes the height left in its pane.
 *
 * The ask's acceptance is four statements about geometry, so this reads
 * geometry — at two window heights, because "a fixed number is right for one
 * window height and wrong for every other" is the whole point of the item.
 *
 *   node scripts/fill-height.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4707;
const CDP = 9407;
const ROUTE = '/scenarios/fill-height';
/** The two the ask named. */
const HEIGHTS = [1000, 760];

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
    '--window-size=1280,1000',
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

const READ = `(() => {
  const read = (id) => {
    const pane = document.getElementById(id);
    if (!pane) return null;
    const grids = [...pane.querySelectorAll('strct-datagrid')];
    const cs = getComputedStyle(pane);
    return {
      // Does the pane itself have to scroll? That is the symptom the ask is about.
      paneScrolls: pane.scrollHeight > pane.clientHeight + 1,
      paneInner: Math.round(pane.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)),
      grids: grids.map((g) => {
        const scroll = g.querySelector('.strct-dg__scroll');
        const paneEl = g.querySelector('.strct-dg__pane');
        return {
          bounded: g.classList.contains('strct-dg-host--bounded'),
          cap: scroll ? Math.round(parseFloat(getComputedStyle(scroll).maxHeight) || 0) : 0,
          // Do the rows scroll inside their frame?
          rowsScroll: scroll ? scroll.scrollHeight > scroll.clientHeight + 1 : false,
          scrollH: scroll ? Math.round(scroll.getBoundingClientRect().height) : 0,
          hostH: Math.round(g.getBoundingClientRect().height),
          paneH: paneEl ? Math.round(paneEl.getBoundingClientRect().height) : null,
        };
      }),
    };
  };
  return {
    tall: read('fill-tall'),
    short: read('fill-short'),
    stacked: read('fill-stacked'),
    paned: read('fill-paned'),
    docScrolls: document.documentElement.scrollHeight > window.innerHeight + 1,
  };
})()`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
let up = false;

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  up = true;

  for (const height of HEIGHTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.getElementById('fill-paned')`)) break;
      await sleep(200);
    }
    // One frame for the ResizeObserver, one for the layout it causes.
    await sleep(900);
    const r = await evaluate(send, READ);
    const at = `${height}px`;

    const tall = r.tall?.grids?.[0];
    check(
      `${at}: the harness found every case on the page`,
      !!(r.tall && r.short && r.stacked && r.paned && tall),
      r.tall ? 'all four panes read' : 'the scenario page did not render',
    );
    if (!tall) break;

    // 1. A fill grid ends where its pane ends: the pane does not scroll, the rows do.
    check(
      `${at}: a fill grid does not make its pane scroll`,
      !r.tall.paneScrolls,
      `pane inner ${r.tall.paneInner}px, grid ${tall.hostH}px, cap ${tall.cap}px`,
    );
    check(
      `${at}: and its rows scroll instead`,
      tall.rowsScroll && tall.bounded,
      `rowsScroll=${tall.rowsScroll} bounded=${tall.bounded}`,
    );
    // The cap has to answer to the window, or a fixed number would have done.
    check(
      `${at}: the cap is a measurement, not a constant`,
      tall.cap > 0 && tall.cap <= r.tall.paneInner,
      `cap ${tall.cap}px inside ${r.tall.paneInner}px`,
    );

    // 2. A short grid draws as it always did.
    const short = r.short.grids[0];
    check(
      `${at}: a short grid still draws its own height`,
      !short.rowsScroll,
      `${short.hostH}px tall, cap ${short.cap}px, rowsScroll=${short.rowsScroll}`,
    );

    // 3. Two fill grids in one pane each get at least the floor.
    const floors = r.stacked.grids.map((g) => g.cap);
    check(
      `${at}: two stacked fill grids each get at least their floor`,
      floors.length === 2 && floors.every((c) => c >= 200),
      `caps ${floors.join(' / ')}px against a 200px floor`,
    );

    // 4. An open detail pane does not stretch a bounded list.
    const paned = r.paned.grids[0];
    check(
      `${at}: an open detail pane does not stretch the grid past its cap`,
      paned.paneH !== null && paned.paneH <= paned.cap + 2,
      `pane ${paned.paneH}px against a ${paned.cap}px cap`,
    );
  }

  // The two heights must not have produced the same answer, or nothing here
  // measured what the item is about.
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` });
  await sleep(1400);
  const a = (await evaluate(send, READ)).tall.grids[0].cap;
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 760,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(1200);
  const b = (await evaluate(send, READ)).tall.grids[0].cap;
  check(
    'a window resize moves the cap without a reload',
    a !== b,
    `${a}px at 1000px, ${b}px at 760px after a live resize`,
  );
} finally {
  if (up) await closeChrome();
  else {
    chrome.kill('SIGTERM');
    await sleep(500);
    dropProfile();
  }
  server.close();
}

for (const c of checks) console.log(`${c.pass ? '✓' : '✗'} ${c.name}\n    ${c.detail}`);
const failed = checks.filter((c) => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} of ${checks.length} fill-height checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} fill-height checks passed.`);
