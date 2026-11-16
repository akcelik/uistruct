/**
 * FR-81-01: the card behind a port, on hover and on focus.
 *
 * A port carries a label and one reading — "SLOT 3 Port 1 · 25 GbE · up".
 * What the operator asks next is the card behind it: the adapter's model, its
 * MAC, its driver, the switch port heard on it. That was a click and a page
 * away, and the click is already taken — `portActivate` opens the port's own
 * page — so the card is hover and focus, which puts it squarely under WCAG
 * 2.1 1.4.13: the pointer must be able to travel into it, Escape must dismiss
 * it, and it must stay while it is hovered or focused.
 *
 * All three are things only a browser can answer, so all three are asked of
 * one, with real pointer and key events rather than synthetic DOM events: the
 * delay before it appears, the journey from the port into the card, Escape
 * from a keyboard that is nowhere near it, the arrow keys the map already
 * has, where the card lands against the viewport and against the cable it
 * describes, what Chrome's accessibility tree says the port is described by,
 * and what the stacked layout writes where there is no hover at all.
 *
 *   node scripts/wiring-detail.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4718;
const CDP = 9418;
/** FR-81-01: the rest the pointer must make before the card appears. */
const DELAY = 300;
/** Where the card may not go: this far inside the viewport, and no closer. */
const EDGE = 8;
/** WCAG 1.4.3 for text. */
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

/** The card as it stands right now, and where everything is. */
const STATE = `(() => {
  const map = document.querySelector('[data-wd="map"]');
  const card = document.querySelector('[data-wd="map"] .strct-wiring__card');
  const box = (el) => {
    const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
             left: +b.left.toFixed(2), right: +b.right.toFixed(2), top: +b.top.toFixed(2), bottom: +b.bottom.toFixed(2) };
  };
  const ports = [...map.querySelectorAll('[data-wiring-port]')].map((el) => ({
    id: el.getAttribute('data-wiring-port'),
    label: el.querySelector('.strct-wiring__portlabel').textContent.trim(),
    describedby: el.getAttribute('aria-describedby'),
    box: box(el),
  }));
  const copies = [...map.querySelectorAll('.strct-wiring__detailsr')].map((el) => ({
    id: el.id || null,
    text: el.textContent.replace(/\\s+/g, ' ').trim(),
    shown: getComputedStyle(el).position === 'static',
  }));
  return {
    cards: map.querySelectorAll('.strct-wiring__card').length,
    card: card
      ? {
          placed: card.classList.contains('strct-wiring__card--placed'),
          hidden: card.getAttribute('aria-hidden'),
          visibility: getComputedStyle(card).visibility,
          title: card.querySelector('.strct-wiring__cardhead').textContent.trim(),
          rows: [...card.querySelectorAll('.strct-wiring__cardlabel')].map((el, i) => ({
            label: el.textContent.trim(),
            value: card.querySelectorAll('.strct-wiring__cardvalue')[i].textContent.trim(),
          })),
          note: card.querySelector('.strct-wiring__cardnote')?.textContent.trim() ?? '',
          box: box(card),
          ink: getComputedStyle(card.querySelector('.strct-wiring__cardvalue')).color,
          quiet: getComputedStyle(card.querySelector('.strct-wiring__cardlabel')).color,
          bg: getComputedStyle(card).backgroundColor,
        }
      : null,
    ports,
    copies,
    selected: [...map.querySelectorAll('.strct-wiring__link--on')].length,
    echo: map.querySelector('.echo')?.textContent.trim() ?? '',
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
})()`;

/** The cable this port is an end of, sampled as points in viewport space. */
const CABLE = (portId) => `(() => {
  const map = document.querySelector('[data-wd="map"]');
  const svg = map.querySelector('svg.strct-wiring__links');
  const paths = [...svg.querySelectorAll('path.strct-wiring__link')];
  const b = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const sx = b.width / (vb.width || 1);
  const sy = b.height / (vb.height || 1);
  // Which path belongs to this port: the one whose end is nearest the port.
  const port = map.querySelector('[data-wiring-port="${portId}"]').getBoundingClientRect();
  const mid = { x: port.left + port.width / 2, y: port.top + port.height / 2 };
  let best = null;
  for (const p of paths) {
    const n = p.getTotalLength();
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const q = p.getPointAtLength((n * i) / 40);
      pts.push({ x: b.left + q.x * sx, y: b.top + q.y * sy });
    }
    const d = Math.min(...pts.map((q) => Math.hypot(q.x - mid.x, q.y - mid.y)));
    if (!best || d < best.d) best = { d, pts };
  }
  return best;
})()`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
const parse = (c) => {
  const n = (c.match(/[0-9.]+(?:e[-+]?\d+)?/g) ?? [0, 0, 0, 1]).map(Number);
  const v = /^color\(/.test(c) ? n.map((x, i) => (i < 3 ? x * 255 : x)) : n;
  return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1];
};
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
const inside = (p, box) => p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom;
let up = false;

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Accessibility.enable');
  up = true;

  const mouseTo = async (x, y) =>
    send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x), y: Math.round(y), button: 'none' });
  const press = async (key, code, windowsVirtualKeyCode) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
  };
  const read = () => evaluate(send, STATE);
  const over = async (port) => {
    await mouseTo(port.box.left + port.box.w / 2, port.box.top + port.box.h / 2);
  };
  const away = async () => {
    await mouseTo(5, 5);
    await sleep(400);
  };

  const open = async (width = 1600) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/wiring` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.querySelector('[data-wd="map"] [data-wiring-port]')`))
        break;
      await sleep(200);
    }
    await evaluate(
      send,
      `document.querySelector('#wiring-detail')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -20)`,
    );
    await sleep(700);
    return read();
  };

  let s = await open();
  const withDetail = s.ports.filter((p) => p.describedby);
  check(
    'the case is on the page, and nothing is open at rest',
    s.ports.length >= 6 &&
      withDetail.length === s.ports.length &&
      s.copies.length > s.ports.length &&
      s.cards === 0,
    `${s.ports.length} ports, every one of them described by its own copy, ${s.copies.length - s.ports.length} device head(s) with a card too, and ${s.cards} cards drawn before anything is hovered`,
  );

  // ── The rest before it appears ─────────────────────────────────────────
  const p1 = s.ports.find((p) => p.label === 'SLOT 3 Port 1');
  await over(p1);
  await sleep(150);
  const early = await read();
  await sleep(300);
  const late = await read();
  check(
    'a card waits for the pointer to rest',
    early.cards === 0 && late.cards === 1 && late.card.placed && late.card.visibility === 'visible',
    `nothing at 150ms, one card at 450ms (asked ~${DELAY}ms), drawn only once it had been placed`,
  );
  check(
    'it says what the port says it says',
    late.card.title === 'SLOT 3 Port 1 · ConnectX-4 Lx' &&
      late.card.rows.length === 6 &&
      late.card.rows[1].label === 'MAC' &&
      late.card.rows[1].value === '0c:42:a1:3b:77:04' &&
      late.card.note === 'Click to open it in Physical adapters.',
    `"${late.card.title}" with ${late.card.rows.length} rows (${late.card.rows.map((r) => r.label).join(', ')}) and a note`,
  );

  // ── Hoverable: the pointer can travel into it ──────────────────────────
  const card = late.card.box;
  await mouseTo(card.left + card.w / 2, card.top + card.h / 2);
  await sleep(600);
  const held = await read();
  check(
    'the pointer can travel into the card (WCAG 1.4.13, hoverable)',
    held.cards === 1,
    `still open 600ms after the pointer left the port for the card, which no grace period of ours covers`,
  );

  // ── Persistent ─────────────────────────────────────────────────────────
  await sleep(2000);
  const kept = await read();
  check(
    'it stays while it is hovered (persistent)',
    kept.cards === 1,
    'open after a further 2s with the pointer on it — nothing times it out',
  );

  // ── Dismissible, from a keyboard that is nowhere near it ───────────────
  await press('Escape', 'Escape', 27);
  await sleep(200);
  const dismissed = await read();
  check(
    'Escape dismisses it without moving the pointer (dismissible)',
    dismissed.cards === 0,
    'the pointer never left the card; Escape closed it',
  );

  // ── Focus, and the arrow keys the map already has ──────────────────────
  await away();
  await evaluate(send, `document.querySelector('[data-wd="map"] [data-wiring-port]').focus()`);
  await sleep(200);
  const focused = await read();
  await press('ArrowDown', 'ArrowDown', 40);
  await sleep(250);
  const moved = await read();
  check(
    'focus opens it at once, and the arrow keys bring it along',
    focused.cards === 1 &&
      focused.card.title.includes('vEthernet (Management)') &&
      moved.cards === 1 &&
      moved.card.title.includes('vEthernet (Storage)'),
    `focus → "${focused.card?.title}" with no delay; ArrowDown → "${moved.card?.title}"`,
  );

  // ── One at a time ──────────────────────────────────────────────────────
  await away();
  s = await read();
  const a11 = s.ports.find((p) => p.label === 'Eth1/11');
  const vmgmt = s.ports.find((p) => p.label === 'vEthernet (Management)');
  await over(vmgmt);
  await sleep(450);
  const first = await read();
  await over(a11);
  await sleep(450);
  const one = await read();
  check(
    'one card at a time',
    first.cards === 1 &&
      first.card.title === 'vEthernet (Management)' &&
      one.cards === 1 &&
      one.card.title === 'tor-a Eth1/11',
    `"${first.card?.title}" gives way to "${one.card?.title}" — ${one.cards} card drawn after hovering two ports in a row`,
  );

  // ── Where it lands: inside the viewport, off its own cable ────────────
  const places = [];
  for (const label of ['vEthernet (Management)', 'SLOT 3 Port 1', 'Eth1/11']) {
    await away();
    const now = await read();
    const port = now.ports.find((p) => p.label === label);
    await over(port);
    await sleep(500);
    const open1 = await read();
    if (!open1.card) {
      places.push({ label, ok: false, why: 'no card' });
      continue;
    }
    const cable = await evaluate(send, CABLE(port.id));
    const box = open1.card.box;
    const onCable = (cable?.pts ?? []).filter((q) => inside(q, box)).length;
    places.push({
      label,
      box,
      onCable,
      inView:
        box.left >= EDGE - 0.5 &&
        box.top >= EDGE - 0.5 &&
        box.right <= open1.viewport.w - EDGE + 0.5 &&
        box.bottom <= open1.viewport.h - EDGE + 0.5,
      side: box.right <= port.box.left ? 'left' : box.left >= port.box.right ? 'right' : 'over',
      ok: true,
    });
  }
  const outside = places.filter((p) => !p.inView);
  check(
    'the card stays inside the viewport',
    places.every((p) => p.ok) && outside.length === 0,
    places
      .map((p) => `${p.label}: ${p.box?.left}–${p.box?.right}px of ${1600}`)
      .join('; ') + ` — none closer than ${EDGE}px to an edge`,
  );
  // The first column's cables all leave to the right, so its card goes left.
  const firstCol = places.find((p) => p.label === 'vEthernet (Management)');
  const lastCol = places.find((p) => p.label === 'Eth1/11');
  check(
    'it is placed off the cable it describes',
    firstCol.side === 'left' &&
      firstCol.onCable === 0 &&
      lastCol.side === 'right' &&
      lastCol.onCable === 0,
    `a host adapter's card goes ${firstCol.side} (its cable leaves right), a switch port's goes ${lastCol.side}; 0 of 41 sampled points of either cable fall inside the card`,
  );

  // A port cabled both ways has no side its cables do not leave by. The card
  // takes the side with more room, which is a run — so this measures what it
  // actually does rather than claiming a clearance it cannot have.
  await away();
  const mid = (await read()).ports.find((p) => p.label === 'SLOT 3 Port 1');
  await over(mid);
  await sleep(500);
  const midOpen = await read();
  const midCable = await evaluate(send, CABLE(mid.id));
  const midBox = midOpen.card.box;
  const crossing = (midCable?.pts ?? []).filter((q) => inside(q, midBox)).length;
  check(
    'a port cabled both ways gets the side with more room, and never its own port',
    midOpen.cards === 1 &&
      midBox.left >= EDGE &&
      midBox.right <= midOpen.viewport.w - EDGE &&
      !(midBox.left < mid.box.right && midBox.right > mid.box.left),
    `the card goes ${midBox.left >= mid.box.right ? 'right' : 'left'} of a port whose cables leave both ways, clear of the port itself; ${crossing} of 41 sampled points of one of its two cables fall under it, which no side could avoid`,
  );

  // ── What a reader is handed, without hovering anything ────────────────
  const { root } = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: '[data-wd="map"] [data-wiring-port="slot3p1"]',
  });
  const ax = await send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  const node = ax.nodes[0];
  const description = node?.description?.value ?? '';
  check(
    'the port carries its card as a description, hover or no hover',
    description.includes('0c:42:a1:3b:77:04') &&
      description.includes('mlx5_core') &&
      description.includes('tor-a Eth1/11'),
    `Chrome describes the port as "${description.slice(0, 96)}…" — ${description.length} characters, none of which needs a pointer`,
  );

  // ── Nothing else about the port changed ───────────────────────────────
  await away();
  const before = await read();
  // A port with one cable *is* that cable: that is what selecting it means.
  const hit = before.ports.find((p) => p.label === 'Eth1/11');
  const cx = Math.round(hit.box.left + hit.box.w / 2);
  const cy = Math.round(hit.box.top + hit.box.h / 2);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x: cx, y: cy, button: 'left', clickCount: 1 });
  }
  await sleep(300);
  const clicked = await read();
  check(
    'a click still means what it meant',
    clicked.echo.includes('Eth1/11') && clicked.selected > 0,
    `the port reported "${clicked.echo}" and ${clicked.selected} cable is drawn as the selected one — the card took nothing from the click`,
  );

  // ── A map that sets no detail ─────────────────────────────────────────
  const plain = await evaluate(
    send,
    `(() => {
       const demo = document.querySelector('#wiring .wiring-demo');
       return {
         cards: demo.querySelectorAll('.strct-wiring__card').length,
         copies: demo.querySelectorAll('.strct-wiring__detailsr').length,
         described: [...demo.querySelectorAll('[data-wiring-port]')].filter((el) =>
           el.hasAttribute('aria-describedby'),
         ).length,
         ports: demo.querySelectorAll('[data-wiring-port]').length,
       };
     })()`,
  );
  check(
    'a map that sets no detail is the map it was',
    plain.cards === 0 && plain.copies === 0 && plain.described === 0 && plain.ports > 0,
    `${plain.ports} ports in the map next to it: ${plain.cards} cards, ${plain.copies} copies, ${plain.described} described — nothing added`,
  );

  // ── The card is a new surface, so its text has to read on it ──────────
  const sweep = [];
  for (const palette of ['arctic', 'ember', 'sage']) {
    for (const theme of ['light', 'dark']) {
      await evaluate(
        send,
        `document.documentElement.setAttribute('data-palette', '${palette}');` +
          `document.documentElement.setAttribute('data-theme', '${theme}')`,
      );
      await away();
      const now = await read();
      const port = now.ports.find((p) => p.label === 'SLOT 3 Port 1');
      await over(port);
      await sleep(450);
      const shown = await read();
      if (!shown.card) continue;
      const bg = parse(shown.card.bg);
      sweep.push({
        where: `${palette} ${theme}`,
        value: contrast(parse(shown.card.ink), bg),
        label: contrast(parse(shown.card.quiet), bg),
      });
    }
  }
  const worst = [...sweep].sort((a, b) => Math.min(a.value, a.label) - Math.min(b.value, b.label))[0];
  check(
    "the card's own text reads on the card",
    sweep.length === 6 && sweep.every((x) => x.value >= AA && x.label >= AA),
    `${sweep.length * 2} readings over 3 palettes × 2 themes — weakest ${Math.min(worst.value, worst.label).toFixed(2)}:1 (${worst.where}: value ${worst.value.toFixed(2)}, label ${worst.label.toFixed(2)}), floor ${AA}`,
  );
  await evaluate(
    send,
    `document.documentElement.setAttribute('data-palette', 'arctic');` +
      `document.documentElement.setAttribute('data-theme', 'light')`,
  );

  // ── Stacked, where there is no hover at all ───────────────────────────
  const stacked = await open(430);
  const visible = stacked.copies.filter((c) => c.shown);
  check(
    'stacked, the rows are written under the port instead',
    visible.length === stacked.copies.length && stacked.cards === 0,
    `at 430px every one of the ${stacked.copies.length} copies is laid out as text under its port (e.g. "${visible[0]?.text.slice(0, 60)}…"), and no card is drawn`,
  );
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
  console.error(`\n✗ ${failed.length} of ${checks.length} wiring-detail checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} wiring-detail checks passed.`);
