/**
 * BUG-70-01: a bar chart's category label belongs under its band.
 *
 * A bar chart puts n categories in n slots; a line's n points make n−1
 * intervals. The bars read one and the labels read the other, so they stepped
 * by `chartW / n` and `chartW / (n−1)` — 183.5px and 244.7px in the 784px
 * chart this was filed against — and only a two-category chart could line up.
 *
 * The ask names the measurement, so this is it: for every category,
 * |label centre − band centre| < 1px, at two widths, and no label past the
 * chart's box. Read at two widths because a single one cannot tell a
 * measurement from a constant that happens to fit.
 *
 *   node scripts/chart-bands.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4708;
const CDP = 9408;
const ROUTE = '/components/bar';
/** One of them is the width the bug was filed at. */
const WIDTHS = [1600, 1100];
/** The ask's own tolerance. */
const TOLERANCE = 1;

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
    '--window-size=1600,1000',
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
 * The band centre is derived from the bars that *are* drawn, not from the
 * component's own arithmetic — a check that recomputes the thing it is
 * checking agrees with a bug. Two bars give the pitch and the origin, and
 * every band follows; a null category has no bar and is exactly the case that
 * needs the derivation.
 */
const READ = `(() => {
  const host = document.querySelector('#bar-categories-chart strct-chart');
  if (!host) return null;
  const hr = host.getBoundingClientRect();
  const bars = [...host.querySelectorAll('.strct-chart__bar')].map((b) => {
    const r = b.getBoundingClientRect();
    return r.left + r.width / 2;
  });
  const labels = [...host.querySelectorAll('.strct-chart__labels span')].map((s) => {
    const r = s.getBoundingClientRect();
    return {
      text: s.textContent.trim(),
      centre: r.left + r.width / 2,
      right: r.right,
      left: r.left,
      clipped: s.scrollWidth > s.clientWidth + 1,
    };
  });
  return {
    host: { left: hr.left, right: hr.right, width: Math.round(hr.width) },
    bars,
    labels,
  };
})()`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
let up = false;
const widths = [];

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  up = true;

  for (const width of WIDTHS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.querySelector('#bar-categories-chart strct-chart')`))
        break;
      await sleep(200);
    }
    await sleep(700);
    const r = await evaluate(send, READ);
    const at = `${width}px window`;

    check(
      `${at}: the filed case is on the page`,
      !!r && r.bars.length >= 2 && r.labels.length > r.bars.length,
      r
        ? `chart ${r.host.width}px, ${r.bars.length} bars, ${r.labels.length} labels`
        : 'no #bar-categories-chart — these checks would read nothing',
    );
    if (!r || r.bars.length < 2 || r.labels.length <= r.bars.length) break;
    widths.push(r.host.width);

    // The pitch and origin the drawn bars actually have.
    const pitch = (r.bars[r.bars.length - 1] - r.bars[0]) / (r.bars.length - 1);
    const bandOf = (i) => r.bars[0] + i * pitch;

    const drift = r.labels.map((l, i) => ({
      text: l.text,
      off: Math.abs(l.centre - bandOf(i)),
    }));
    const worst = drift.reduce((a, b) => (b.off > a.off ? b : a));
    check(
      `${at}: every category label is centred on its band`,
      worst.off < TOLERANCE,
      `worst ${worst.off.toFixed(2)}px on "${worst.text}" (bars ${pitch.toFixed(1)}px apart)`,
    );

    // The one the bars cannot anchor: a null category still has a slot.
    const nulls = r.labels.length - r.bars.length;
    const lastDrift = drift[drift.length - 1];
    check(
      `${at}: a category with no value still gets its slot`,
      nulls > 0 && lastDrift.off < TOLERANCE,
      `${nulls} band(s) without a bar; "${lastDrift.text}" is ${lastDrift.off.toFixed(2)}px off its band`,
    );

    const past = r.labels
      .map((l) => ({ text: l.text, over: Math.max(l.right - r.host.right, r.host.left - l.left) }))
      .filter((l) => l.over > 0.5);
    check(
      `${at}: no label is drawn outside the chart's box`,
      past.length === 0,
      past.length
        ? `"${past[0].text}" runs ${past[0].over.toFixed(0)}px past the edge`
        : `all ${r.labels.length} inside ${r.host.width}px`,
    );
  }

  check(
    'the two widths gave two different charts',
    widths.length === 2 && widths[0] !== widths[1],
    `chart widths ${widths.join(' / ')}px — a single width cannot tell a measurement from a constant`,
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
  console.error(`\n${failed.length} of ${checks.length} chart-band checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} chart-band checks passed.`);
