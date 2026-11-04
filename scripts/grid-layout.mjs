/**
 * The grid's geometry, which only a browser can answer: a column is the width
 * it was given, the table stays inside its container, and a single-line row
 * is one line tall whatever it holds.
 *
 *   ng build showcase && node scripts/grid-layout.mjs
 *
 * jsdom has no layout, so the specs can only check the plumbing — these are
 * the claims BUG-62-01 was filed about, and they regress silently in CSS.
 * Exits non-zero with the measurement that failed.
 */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4702;
const CDP = 9402;
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
// Chrome writes its profile into a scoped_dir under the user config directory
// and clears it only when it exits by itself. These scripts kill it, so every
// run used to leak a ~185MB profile. Hand it a directory we own, and wait for
// the process to be gone before removing it: a SIGTERMed Chrome keeps flushing
// for a moment and re-creates whatever is deleted underneath it.
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
// A throw on the way to closeChrome must not leave the profile behind either.
// SIGKILL skips the flush, so nothing is left running to re-create it.
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

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });

/** Drag a column handle by dx, as a mouse would. */
const DRAG = (key, dx) => `(() => {
  const th = document.querySelector('strct-datagrid thead th[data-col="${key}"]');
  const handle = th && th.querySelector('.strct-dg__resize');
  if (!handle) return 'no handle on ${key}';
  const r = handle.getBoundingClientRect();
  const y = r.top + r.height / 2;
  const x = r.left + r.width / 2;
  const at = (cx) => ({ bubbles: true, clientX: cx, clientY: y, button: 0 });
  handle.dispatchEvent(new MouseEvent('mousedown', at(x)));
  document.dispatchEvent(new MouseEvent('mousemove', at(x + ${dx})));
  document.dispatchEvent(new MouseEvent('mouseup', at(x + ${dx})));
  return 'dragged';
})()`;

const GRID = (sel) => `(() => {
  const host = document.querySelector('${sel}');
  if (!host) return null;
  const table = host.querySelector('table');
  const box = host.querySelector('.strct-dg__scroll') ?? host.querySelector('.strct-dg__layout') ?? host;
  return {
    layout: getComputedStyle(table).tableLayout,
    container: Math.round(box.clientWidth),
    table: Math.round(table.getBoundingClientRect().width),
    overflow: box.scrollWidth - box.clientWidth,
    widths: Object.fromEntries(
      [...table.querySelectorAll('thead th[data-col]')].map((th) => [
        th.dataset.col,
        Math.round(th.getBoundingClientRect().width),
      ]),
    ),
  };
})()`;

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // ── A resizable grid: the width you drag to is the width you get ─────────
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/scenarios/inventory` });
  for (let i = 0; i < 80; i++) {
    if (await evaluate(send, `!!document.querySelector('strct-datagrid thead th[data-col]')`))
      break;
    await sleep(200);
  }
  await sleep(600);

  const before = await evaluate(send, GRID('strct-datagrid'));
  check(
    'the table fits its container before any drag',
    before.overflow === 0 && Math.abs(before.table - before.container) <= 1,
    `table ${before.table}px in ${before.container}px, overflow ${before.overflow}px`,
  );

  const dx = -120;
  const asked = before.widths['name'] + dx;
  await evaluate(send, DRAG('name', dx));
  await sleep(300);
  const after = await evaluate(send, GRID('strct-datagrid'));
  check(
    'a dragged column is the width it was dragged to',
    after.widths['name'] === asked,
    `asked ${asked}px, drew ${after.widths['name']}px (from ${before.widths['name']}px)`,
  );
  check(
    'no other column pays for it',
    Object.entries(after.widths).every(([k, w]) => k === 'name' || w === before.widths[k]),
    Object.entries(after.widths)
      .filter(([k, w]) => k !== 'name' && w !== before.widths[k])
      .map(([k, w]) => `${k} ${before.widths[k]}→${w}`)
      .join(', ') || 'every other column kept its width',
  );
  check('the table still fits its container', after.overflow === 0, `overflow ${after.overflow}px`);
  check(
    'and the widths are in charge once one is worth being exact about',
    after.layout === 'fixed',
    `table-layout: ${after.layout}`,
  );

  // ── BUG-65-03: widths that do not add up are shares, not overflow ────────
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/datagrid` });
  for (let i = 0; i < 80; i++) {
    if (
      await evaluate(send, `!!document.querySelector('#datagrid-widths strct-datagrid thead th')`)
    )
      break;
    await sleep(200);
  }
  await sleep(600);
  const wide = await evaluate(send, GRID('#datagrid-widths strct-datagrid'));
  const stated = { name: 300, owner: 300, cu: 200, state: 200 };
  const statedTotal = Object.values(stated).reduce((a, b) => a + b, 0);
  check(
    'columns stating more than the grid is wide still fit it',
    wide.overflow === 0 && Math.abs(wide.table - wide.container) <= 1,
    `they ask for ${statedTotal}px; the table is ${wide.table}px in ${wide.container}px`,
  );
  const drawn = Object.keys(stated).reduce((a, k) => a + wide.widths[k], 0);
  const off = Object.entries(stated).filter(
    ([k, w]) => Math.abs(wide.widths[k] / drawn - w / statedTotal) > 0.01,
  );
  check(
    'and keep the proportions they asked for',
    off.length === 0,
    Object.entries(stated)
      .map(
        ([k, w]) =>
          `${k} ${Math.round((w / statedTotal) * 100)}%→${Math.round((wide.widths[k] / drawn) * 100)}%`,
      )
      .join('  '),
  );

  // ── BUG-66-01: a column measured before its rows arrived ─────────────────
  const late = await evaluate(
    send,
    `(() => {
       const host = document.querySelector('#datagrid-late-rows strct-datagrid');
       if (!host) return null;
       const th = host.querySelector('thead th[data-col="@sel"]');
       const radio = host.querySelector('tbody .strct-dg__sel input, tbody .strct-dg__sel .strct-dg__radio');
       if (!th || !radio) return { rows: host.querySelectorAll('tbody tr').length };
       const cell = radio.closest('td');
       const c = cell.getBoundingClientRect(), r = radio.getBoundingClientRect();
       return {
         rows: host.querySelectorAll('tbody tr').length,
         column: Math.round(c.width),
         radio: Math.round(r.width),
         // How much of the radio the cell actually shows.
         visible: Math.round(Math.max(0, Math.min(c.right, r.right) - Math.max(c.left, r.left))),
       };
     })()`,
  );
  if (!late || late.column == null)
    check(
      'a selection column holds its radio when the rows arrive late',
      false,
      `no single-selection grid with late rows on /components/datagrid (rows: ${late?.rows ?? 'none'})`,
    );
  else {
    check(
      'a selection column holds its radio when the rows arrive late',
      late.visible >= late.radio,
      `the radio is ${late.radio}px and ${late.visible}px of it shows, in a ${late.column}px column`,
    );
    check(
      'and that column is never narrower than the affordance in it',
      late.column >= 40,
      `${late.column}px against a floor of 40`,
    );
  }

  // ── BUG-65-01: the toolbar row agrees with itself ────────────────────────
  const toolbar = await evaluate(
    send,
    `(() => {
       const tb = [...document.querySelectorAll('.strct-dg__toolbar')].find((t) => t.querySelector('strct-searchbox'));
       if (!tb) return null;
       return [...tb.querySelectorAll('strct-searchbox, button.strct-btn')].map((el) => ({
         what: el.tagName.toLowerCase(),
         h: Math.round(el.getBoundingClientRect().height * 100) / 100,
       }));
     })()`,
  );
  if (!toolbar)
    check('a sized toolbar row is one height', false, 'no toolbar with a quick filter found');
  else
    check(
      'a sized toolbar row is one height, quick filter and action bar alike',
      new Set(toolbar.map((t) => t.h)).size === 1,
      toolbar.map((t) => `${t.what}=${t.h}px`).join('  '),
    );

  // ── A single-line row is one line tall, link button or not ───────────────
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/datagrid` });
  for (let i = 0; i < 80; i++) {
    if (await evaluate(send, `!!document.querySelector('strct-datagrid tbody .strct-btn--link')`))
      break;
    await sleep(200);
  }
  await sleep(600);
  const rows = await evaluate(
    send,
    `(() => {
       const link = document.querySelector('.strct-dg-host--singleline tbody .strct-btn--link');
       if (!link) return null;
       const host = link.closest('strct-datagrid');
       const cs = getComputedStyle(link);
       const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
       return {
         link: Math.round(link.getBoundingClientRect().height),
         lineH: Math.round(lineH),
         rows: [...host.querySelectorAll('tbody tr')].map((r) => Math.round(r.getBoundingClientRect().height)),
         clipped: link.scrollWidth > link.clientWidth + 1,
       };
     })()`,
  );
  if (!rows)
    check(
      'a link button in a single-line cell stays on one line',
      false,
      'no single-line grid with a link cell on /components/datagrid',
    );
  else {
    // Two lines of it would stand about twice its line-height tall; this is
    // what wrapped before, taking its row with it.
    check(
      'a link button in a single-line cell stays on one line',
      rows.link < rows.lineH * 1.6,
      `the button is ${rows.link}px tall against a ${rows.lineH}px line`,
    );
    check(
      'and every row of the grid is the same height',
      Math.max(...rows.rows) - Math.min(...rows.rows) <= 2,
      `rows ${rows.rows.join('/')}px`,
    );
    check('and the label is cut with an ellipsis', rows.clipped, `clipped: ${rows.clipped}`);
  }
} finally {
  await closeChrome();
  server.close();
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? '✓' : '✗'} ${c.name}\n    ${c.detail}`);
if (failed.length) {
  console.error(`\n${failed.length} of ${checks.length} grid-layout checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} grid-layout checks passed.`);
