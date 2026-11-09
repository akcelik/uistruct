/**
 * FR-76-01: a sign-in page is the one screen with nothing else on it.
 *
 * A centred 960px card leaves a 1600px window two thirds empty, so `full`
 * takes the two panels to the edges of whatever it is given: the aside takes
 * what is left of the width and the form is a column of its own on the end.
 * The operator's measurements are the acceptance, so they are read back from
 * what Chrome laid out rather than asserted — the column's width, the page's
 * scroll width against its client width, the boxes of the art and of the
 * words beside it, and, on a phone, whether the first field is above the fold
 * with the form before the picture.
 *
 * The band gets the same treatment: it is mixed at 23% rather than taken from
 * a -bg token because it has to be read from across a room, and that only
 * means anything if the words on it are measured against it.
 *
 *   node scripts/login-layout.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4712;
const CDP = 9412;
const ROUTE = '/scenarios/sign-in';
/** The sizes the ask names, plus the phone it names separately. */
const DESKTOP = [
  { width: 1600, height: 1000 },
  { width: 1280, height: 800 },
];
const PHONE = { width: 390, height: 844 };
/** The form column's width in `full`. */
const MAIN = 572;
/** A control on a page many people open from a tablet. */
const TOUCH = 44;
/** WCAG AA for the words on the band. */
const AA = 4.5;

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
    '--window-size=1600,1400',
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

/** Everything the checks read, from the page the component lays out. */
const READ = `(() => {
  const login = document.querySelector('strct-login');
  if (!login) return null;
  const box = (sel) => {
    const el = typeof sel === 'string' ? login.querySelector(sel) : sel;
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { l: b.left, t: b.top, w: b.width, h: b.height };
  };
  const overlap = (a, b) =>
    a && b
      ? Math.max(0, Math.min(a.l + a.w, b.l + b.w) - Math.max(a.l, b.l)) *
        Math.max(0, Math.min(a.t + a.h, b.t + b.h) - Math.max(a.t, b.t))
      : 0;
  const art = box('.strct-login__artslot');
  const body = box('.strct-login__asidebody');
  const brand = box('.strct-login__brand');
  const bandEl = login.querySelector('.strct-login__band');
  const bandShown = bandEl && getComputedStyle(bandEl).display !== 'none';
  const field = login.querySelector('.strct-login__main input');
  const controls = [...login.querySelectorAll('.strct-login__main input, .strct-login__main button')];
  const aside = login.querySelector('.strct-login__aside');
  const main = login.querySelector('.strct-login__main');
  return {
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    host: box(login),
    card: box('.strct-login__card--full'),
    aside: box(aside),
    main: box(main),
    art,
    body,
    artOverWords: overlap(art, body) + overlap(art, brand),
    band: bandShown ? box(bandEl) : null,
    bandRole: bandEl ? bandEl.getAttribute('role') : null,
    bandLabel: bandEl ? bandEl.getAttribute('aria-label') : null,
    bandText: bandEl ? bandEl.textContent.trim() : '',
    bandInk: bandEl ? getComputedStyle(bandEl).color : null,
    bandGround: bandEl ? getComputedStyle(bandEl).backgroundColor : null,
    pageGround: getComputedStyle(document.body).backgroundColor,
    firstFieldTop: field ? field.getBoundingClientRect().top : null,
    controlHeights: [...new Set(controls.map((c) => Math.round(c.getBoundingClientRect().height)))],
    formBeforeAside:
      main && aside ? main.getBoundingClientRect().top <= aside.getBoundingClientRect().top : null,
    artShown: art ? art.w > 0 && art.h > 0 : false,
  };
})()`;

/**
 * A computed colour, as channels out of 255. A `color-mix()` resolves to
 * `color(srgb r g b)` with channels out of ONE, and read as if they were out
 * of 255 the band's own ground came back near-black — which made its words
 * measure 1.00:1 against it in the light palette and pass by luck in the
 * dark.
 */
const parse = (c) => {
  const n = (c.match(/[0-9.]+(?:e[-+]?\d+)?/g) ?? [0, 0, 0, 1]).map(Number);
  return /^color\(/.test(c) ? n.map((v, i) => (i < 3 ? v * 255 : v)) : n;
};
const over = (fg, a, bg) => fg.map((v, i) => v * a + bg[i] * (1 - a));
const lum = ([r, g, b]) => {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
let up = false;

async function load(send, width, height, theme) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${ROUTE}` });
  for (let i = 0; i < 120; i++) {
    if (await evaluate(send, `!!document.querySelector('.strct-login__card--full')`)) break;
    await sleep(200);
  }
  if (theme)
    await evaluate(send, `document.documentElement.setAttribute('data-theme', '${theme}')`);
  await sleep(700);
  return evaluate(send, READ);
}

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  up = true;

  for (const { width, height } of DESKTOP) {
    const r = await load(send, width, height, 'light');
    const at = `${width}×${height}`;
    if (!r || !r.card) {
      check(`${at}: the full sign-in is on the page`, false, 'no full-bleed login');
      continue;
    }

    check(
      `${at}: nothing is pushed off the side`,
      r.scrollW <= r.clientW,
      `document scrolls ${r.scrollW}px in ${r.clientW}px of viewport`,
    );
    check(
      `${at}: the form column is the width it was asked for`,
      Math.abs(r.main.w - MAIN) <= 0.5,
      `${r.main.w.toFixed(1)}px (asked ${MAIN})`,
    );
    check(
      `${at}: the aside takes what is left, to the edge`,
      Math.abs(r.aside.w + r.main.w - r.card.w) <= 0.5 &&
        Math.abs(r.card.w - r.host.w) <= 0.5 &&
        Math.abs(r.aside.l - r.host.l) <= 0.5,
      `aside ${r.aside.w.toFixed(0)}px + form ${r.main.w.toFixed(0)}px = ${r.card.w.toFixed(0)}px, the whole of what it was given`,
    );
    check(
      `${at}: both columns run the full height`,
      Math.abs(r.aside.h - r.card.h) <= 0.5 && Math.abs(r.main.h - r.card.h) <= 0.5,
      `aside ${r.aside.h.toFixed(0)}px, form ${r.main.h.toFixed(0)}px, card ${r.card.h.toFixed(0)}px`,
    );
    // The filed complaint: the node diagram's lines ran through the words.
    check(
      `${at}: the art does not sit under the aside's words`,
      r.artOverWords === 0,
      r.artOverWords === 0
        ? `art ${r.art.w.toFixed(0)}×${r.art.h.toFixed(0)}px in its own band, 0px² over the brand row or the copy`
        : `${Math.round(r.artOverWords)}px² of art over the words`,
    );
    check(
      `${at}: the controls are a touch target`,
      r.controlHeights.length === 1 && r.controlHeights[0] === TOUCH,
      `control heights: ${r.controlHeights.join(', ')}px (asked ${TOUCH})`,
    );

    // The band, across both columns and above them.
    check(
      `${at}: the band runs across both columns`,
      !!r.band && Math.abs(r.band.w - r.card.w) <= 0.5 && r.band.t + r.band.h <= r.card.t + 0.5,
      r.band
        ? `${r.band.w.toFixed(0)}px wide against the card's ${r.card.w.toFixed(0)}px, ending ${(r.card.t - r.band.t - r.band.h).toFixed(0)}px above it`
        : 'no band drawn',
    );
    check(
      `${at}: the band says what it is`,
      r.bandRole === 'note' && !!r.bandLabel && !!r.bandText,
      `role=${r.bandRole}, aria-label="${r.bandLabel}", reading "${r.bandText}"`,
    );
  }

  // The band's words, in both palettes — it is mixed stronger than a -bg
  // token precisely so it is read, which only counts if it is readable.
  for (const theme of ['light', 'dark']) {
    const r = await load(send, 1600, 1000, theme);
    if (!r?.band) {
      check(`${theme}: the band's words are readable`, false, 'no band');
      continue;
    }
    const page = parse(r.pageGround).slice(0, 3);
    const ground = over(parse(r.bandGround).slice(0, 3), parse(r.bandGround)[3] ?? 1, page);
    const ink = over(parse(r.bandInk).slice(0, 3), parse(r.bandInk)[3] ?? 1, ground);
    const ratio = contrast(ink, ground);
    check(
      `${theme}: the band's words are readable on it`,
      ratio >= AA,
      `"${r.bandText}" at ${ratio.toFixed(2)}:1 (AA ${AA})`,
    );
  }

  // The phone: the form first, and its first field above the fold.
  const p = await load(send, PHONE.width, PHONE.height, 'light');
  if (p) {
    check(
      `${PHONE.width}×${PHONE.height}: nothing is pushed off the side`,
      p.scrollW <= p.clientW,
      `document scrolls ${p.scrollW}px in ${p.clientW}px of viewport`,
    );
    check(
      `${PHONE.width}×${PHONE.height}: the form comes before the picture`,
      p.formBeforeAside === true,
      p.formBeforeAside ? 'the form is the first of the two' : 'the aside is drawn first',
    );
    check(
      `${PHONE.width}×${PHONE.height}: the first field is above the fold`,
      p.firstFieldTop !== null && p.firstFieldTop < PHONE.height,
      `first field ${p.firstFieldTop?.toFixed(0)}px down a ${PHONE.height}px screen`,
    );
    check(
      `${PHONE.width}×${PHONE.height}: the aside is cut to brand and a line`,
      p.artShown === false,
      p.artShown ? 'the art is still drawn' : 'the art is not drawn',
    );
  } else {
    check(`${PHONE.width}×${PHONE.height}: the full sign-in is on the page`, false, 'no login');
  }
} catch (err) {
  check('the gate ran', false, String(err));
} finally {
  if (up) await closeChrome();
  else {
    chrome.kill('SIGKILL');
    dropProfile();
  }
  server.close();
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? '✓' : '✗'} ${c.name} — ${c.detail}`);
if (failed.length) {
  console.error(`\n✗ ${failed.length} of ${checks.length} login-layout checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} login-layout checks passed.`);
