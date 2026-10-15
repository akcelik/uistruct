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
import {
  existsSync,
  statSync,
  createReadStream,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
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
/**
 * Mean per-channel drift, in levels out of 255, that still counts as the same
 * screenshot. A palette change moves every pixel a little and no pixel much,
 * so the pixel count above cannot see it; this can.
 */
const MAX_MEAN_DRIFT = 0.6;

const UPDATE = process.argv.includes('--update');

/**
 * [name, route, anchor?, prepare?, selector?] — the shot is the viewport at
 * the top of the page, or at `anchor` when one is given, for a case that
 * lives below the fold.
 *
 * `prepare` is a JS expression run before the shot, for a state the page does
 * not load in: a checked row, an open panel. `selector` crops the shot to one
 * element (padded, at 4x), because a 17px control is 0.002% of a 1280x900
 * page — far under any sane threshold, so a full-page shot can never see it
 * move. Both exist because a broken indeterminate checkbox shipped past a
 * gate that only ever saw whole pages at rest.
 */
const ROUTES = [
  ['home', '/'],
  ['button', '/components/button'],
  ['datagrid', '/components/datagrid'],
  // FR-47-01: a progress bar inside a datagrid row — the case where the track
  // used to be the exact colour of the row behind it in the dark theme.
  ['datagrid-progress', '/components/datagrid', '#datagrid'],
  ['line', '/components/line'],
  ['tree', '/components/tree'],
  // The select-all checkbox in its three states. The indeterminate one is the
  // reason this gate learned to prepare a state: its dash was squeezed to 3px
  // and pushed 5px off centre, and no screenshot of a page at rest showed it.
  [
    'datagrid-selectall',
    '/components/datagrid',
    '#datagrid',
    `(() => {
       const grid = [...document.querySelectorAll('strct-datagrid')]
         .find((g) => g.querySelector('thead strct-checkbox'));
       if (!grid) return;
       const boxes = [...grid.querySelectorAll('tbody strct-checkbox input')];
       boxes.filter((b) => b.checked).forEach((b) => b.click());
       boxes[0]?.click();
     })()`,
    'thead strct-checkbox',
  ],
  // A palette fed from four products: the headings, the tinted badges and the
  // tag that has to yield its room to the label before the label is cut.
  [
    'command-palette-sections',
    '/components/command-palette',
    undefined,
    `(() => {
       const btn = [...document.querySelectorAll('button')]
         .find((b) => /Search across products/.test(b.textContent || ''));
       btn?.click();
     })()`,
    '.strct-cmdp',
  ],
  // A menu with named groups and a second line under a row's label.
  [
    'dropdown-groups',
    '/components/dropdown',
    undefined,
    `(() => {
       const demo = document.getElementById('dropdown-groups');
       const btn = [...(demo?.closest('section') ?? document).querySelectorAll('button')]
         .find((b) => /Products/.test(b.textContent || ''));
       btn?.click();
     })()`,
    '.strct-dd__menu',
  ],
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

/**
 * Wait for Chrome's DevTools endpoint. The budget is 30s, not the 10s this
 * used to allow: a cold CI runner regularly needs longer, and when it did the
 * gate failed before it had compared a single pixel — four times, once on a
 * main build. A slow start is not a visual regression, so it must not read as
 * one.
 */
/** Mean absolute per-channel difference between two RGBA buffers, in levels. */
function meanDrift(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i += 4) {
    total += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  }
  return total / ((a.length / 4) * 3);
}

async function cdpTarget() {
  const deadline = Date.now() + 30_000;
  for (let i = 0; Date.now() < deadline; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      /* retry until Chrome is up */
    }
    await sleep(200);
  }
  throw new Error(
    `CDP endpoint unavailable: Chrome did not answer on port ${CDP} within 30s. ` +
      `This is a launch failure, not a visual difference — check the browser binary (${chromeBin}).`,
  );
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
  let pinned = null;
  for (const [schemeName, palette, mode] of SCHEMES) {
    // One scheme at a time: these scripts share the page's global scope and
    // every one of them runs on every new document, so the second scheme's
    // script used to redeclare `const s`, throw, and never reach its own
    // localStorage lines — every "light" shot was the dark theme again, and
    // the two baselines were byte-identical. Remove the last one, and keep
    // the body inside an IIFE so nothing leaks into the page's scope.
    if (pinned) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: pinned });
    const added = await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        (() => {
          localStorage.setItem('strct-palette', '${palette}');
          localStorage.setItem('strct-theme', '${mode}');
          const s = document.createElement('style');
          s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
          document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
        })();
      `,
    });
    pinned = added?.identifier ?? null;
    for (const [routeName, route, anchor, prepare, selector] of ROUTES) {
      const name = `${routeName}--${schemeName}`;
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${route}` });
      await sleep(2600);
      await send('Runtime.evaluate', {
        expression: anchor
          ? `(() => { const el = document.querySelector('${anchor}'); if (el) el.scrollIntoView({ block: 'start' }); })()`
          : 'window.scrollTo(0,0)',
      });
      if (prepare) {
        await send('Runtime.evaluate', { expression: prepare });
        await sleep(400);
      }
      await sleep(300);
      let clip = { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 };
      if (selector) {
        const { result } = await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `(() => {
            const el = document.querySelector('${selector}');
            if (!el) return null;
            const b = el.getBoundingClientRect();
            const p = 6;
            return { x: Math.round(b.x) - p, y: Math.round(b.y) - p,
                     width: Math.round(b.width) + p * 2, height: Math.round(b.height) + p * 2 };
          })()`,
        });
        if (!result?.value) {
          rows.push([name, `FAIL ${selector} not found`]);
          failures += 1;
          continue;
        }
        clip = { ...result.value, scale: 4 };
      }
      const shot = await send('Page.captureScreenshot', { format: 'png', clip });
      const current = Buffer.from(shot.data, 'base64');
      const basePath = join(BASE_DIR, `${name}.png`);
      if (UPDATE || !existsSync(basePath)) {
        writeFileSync(basePath, current);
        rows.push([
          name,
          existsSync(basePath) && !UPDATE ? 'baseline created' : 'baseline updated',
        ]);
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
      // pixelmatch's threshold tolerates antialiasing, which also makes it
      // blind to a palette shift: a few levels per channel across the whole
      // page counts as zero differing pixels. The mean drift catches exactly
      // that, and is unmoved by text rendering.
      const drift = meanDrift(a.data, b.data);
      const failedPixels = ratio > MAX_DIFF_RATIO;
      const failedDrift = drift > MAX_MEAN_DRIFT;
      if (failedPixels || failedDrift) {
        failures++;
        writeFileSync(join(OUT_DIR, `${name}.current.png`), current);
        writeFileSync(join(OUT_DIR, `${name}.diff.png`), PNG.sync.write(diff));
        rows.push([
          name,
          failedPixels
            ? `FAIL ${(ratio * 100).toFixed(2)}% pixels differ`
            : `FAIL mean colour drift ${drift.toFixed(2)}/255 (surfaces moved)`,
        ]);
      } else {
        rows.push([name, `ok (${(ratio * 100).toFixed(3)}%, drift ${drift.toFixed(2)})`]);
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
