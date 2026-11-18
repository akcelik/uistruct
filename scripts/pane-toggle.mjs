/**
 * The detail pane's own button, both ways.
 *
 * The grid has had a detail pane since 5.x: the » button in the row's first
 * utility cell collapses the table to one column and opens the row's pane
 * beside it. Clicking it again has always closed the pane — the demo said so
 * — but the button never said so itself. It drew the same right-pointing
 * double chevron whether the pane was shut or open, and told assistive tech
 * "Open detail" either way, so the one control that both opens and closes the
 * pane looked like it only opened it, and the arrow pointed at a pane that
 * was already there.
 *
 * In a console (`interactionMode="grid"`) it was worse than cosmetic: a row
 * click opens that row's pane, and the button's click reached the row too, so
 * the toggle closed the pane and the row re-opened it in the same event. The
 * pane could be opened from the button and never closed from it.
 *
 * None of that can be answered without a browser: which glyph is actually
 * drawn, which way it points once the stylesheet has had its say, where the
 * pane lands relative to the list, what a real click does when it bubbles,
 * and whether the keyboard's place survives the round trip. So all of it is
 * asked of one, with real mouse and key events, in both writing directions.
 *
 *   node scripts/pane-toggle.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4720;
const CDP = 9420;
/** WCAG 2.1 1.4.11 for a graphic that carries meaning. */
const AA_GRAPHIC = 3;

/**
 * The two glyphs, read out of the library rather than copied, so the gate
 * cannot drift from what `strct-icon` actually draws.
 */
const ICON_SRC = readFileSync('projects/strct/src/lib/icon/icon.ts', 'utf8');
const iconPath = (name) => {
  const m = ICON_SRC.match(new RegExp(`^\\s*${name}:\\s*'([^']+)'`, 'm'));
  if (!m) throw new Error(`icon.ts has no ${name}`);
  const d = m[1].match(/\sd="([^"]+)"/);
  if (!d) throw new Error(`${name} is not a single path`);
  return d[1];
};
const RIGHT = iconPath('chevronDoubleRight');
const LEFT = iconPath('chevronDoubleLeft');

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

/**
 * One grid as it stands: its rows' » buttons, the glyph each one draws, which
 * way that glyph points on screen, and the pane if there is one.
 *
 * "Which way it points" is measured, not inferred from the name. The glyph is
 * sampled along its own path, every point mapped to screen coordinates
 * through `getScreenCTM` (so a CSS transform on it counts), and the tip is
 * the end that converges: in the outer sixth of the glyph's width, the side
 * whose vertical spread is the smaller one is the side the arrow points at.
 * That reading survives both the glyph being swapped and the glyph being
 * mirrored, which is the whole point.
 */
const STATE = (which) => `(() => {
  const grid = document.querySelector('[data-dp="${which}"]');
  const box = (el) => {
    const b = el.getBoundingClientRect();
    return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
             left: +b.left.toFixed(2), right: +b.right.toFixed(2), top: +b.top.toFixed(2), bottom: +b.bottom.toFixed(2) };
  };
  const aim = (path) => {
    const n = path.getTotalLength();
    const m = path.getScreenCTM();
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const q = path.getPointAtLength((n * i) / 240);
      pts.push({ x: q.x * m.a + q.y * m.c + m.e, y: q.x * m.b + q.y * m.d + m.f });
    }
    const xs = pts.map((p) => p.x);
    const lo = Math.min(...xs), hi = Math.max(...xs);
    const band = (hi - lo) / 6;
    const spread = (sel) => {
      const ys = sel.map((p) => p.y);
      return ys.length ? Math.max(...ys) - Math.min(...ys) : Infinity;
    };
    const leftSpread = spread(pts.filter((p) => p.x <= lo + band));
    const rightSpread = spread(pts.filter((p) => p.x >= hi - band));
    return {
      points: rightSpread < leftSpread ? 'right' : 'left',
      leftSpread: +leftSpread.toFixed(2),
      rightSpread: +rightSpread.toFixed(2),
      width: +(hi - lo).toFixed(2),
    };
  };
  const rows = [...grid.querySelectorAll('tbody tr')].map((tr) => {
    const btn = tr.querySelector('.strct-dg__detailbtn');
    const path = btn && btn.querySelector('svg path');
    return {
      text: tr.textContent.replace(/\\s+/g, ' ').trim().slice(0, 40),
      active: tr.classList.contains('strct-dg__row--active'),
      btn: btn
        ? {
            d: path ? path.getAttribute('d') : null,
            label: btn.getAttribute('aria-label'),
            expanded: btn.getAttribute('aria-expanded'),
            on: btn.classList.contains('strct-dg__detailbtn--active'),
            focused: btn === document.activeElement,
            box: box(btn),
            aim: path ? aim(path) : null,
            ink: getComputedStyle(btn).color,
            fill: getComputedStyle(btn).backgroundColor,
          }
        : null,
    };
  });
  const pane = grid.querySelector('.strct-dg__pane');
  const list = grid.querySelector('.strct-dg__scroll');
  const layout = grid.querySelector('.strct-dg__layout');
  const a = document.activeElement;
  return {
    rows,
    cols: grid.querySelectorAll('thead th').length,
    pane: pane ? { box: box(pane), title: pane.querySelector('.strct-dg__pane-title')?.textContent.trim() ?? '' } : null,
    list: list ? box(list) : null,
    listShown: list ? getComputedStyle(list).display !== 'none' : false,
    hostW: grid.clientWidth,
    takeover: !!layout && layout.classList.contains('strct-dg__layout--panetakeover'),
    dir: getComputedStyle(grid).direction,
    focus: a ? (a.tagName.toLowerCase() + (a.className ? '.' + String(a.className).trim().split(/\\s+/).join('.') : '')) : null,
  };
})()`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
/** Name the glyph that was actually drawn, so a failure says which one it is. */
const nameOf = (d) =>
  d === RIGHT ? 'chevronDoubleRight' : d === LEFT ? 'chevronDoubleLeft' : `an unknown path (${d})`;
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
const over = (fg, bg, under) => {
  const a = fg[3] ?? 1;
  if (a >= 1) return fg;
  return [0, 1, 2].map((i) => fg[i] * a + (bg[3] >= 1 ? bg[i] : under[i]) * (1 - a));
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
let up = false;

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  up = true;

  const click = async (box) => {
    const x = Math.round(box.left + box.w / 2);
    const y = Math.round(box.top + box.h / 2);
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await sleep(260);
  };
  const read = (which) => evaluate(send, STATE(which));
  const press = async (key, code, windowsVirtualKeyCode) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
  };
  /** Bring one grid fully into view before clicking in it, then re-measure. */
  const show = async (which) => {
    await evaluate(
      send,
      `document.querySelector('[data-dp="${which}"]').scrollIntoView({ block: 'center' })`,
    );
    await sleep(350);
    return read(which);
  };

  const open = async (dir = 'ltr') => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/detailpane` });
    for (let i = 0; i < 120; i++) {
      if (
        await evaluate(send, `!!document.querySelector('[data-dp="table"] .strct-dg__detailbtn')`)
      )
        break;
      await sleep(200);
    }
    await evaluate(send, `document.documentElement.setAttribute('dir', '${dir}')`);
    await sleep(500);
  };

  await open();
  let t = await show('table');
  let c = await read('console');
  check(
    'both cases are on the page, and no pane is open at rest',
    t.rows.length >= 4 &&
      c.rows.length >= 4 &&
      t.rows.every((r) => r.btn) &&
      c.rows.every((r) => r.btn) &&
      !t.pane &&
      !c.pane &&
      t.cols > 2,
    `a table grid of ${t.rows.length} rows (${t.hostW}px wide) and a console grid of ${c.rows.length} (${c.hostW}px), every row with a » button, ${t.cols} columns and ${t.pane || c.pane ? 'a pane already open' : 'no pane'} before anything is clicked`,
  );

  // ── Shut: the arrow points at the pane that is not there yet ───────────
  const shut = t.rows[1].btn;
  check(
    'shut, the button draws the right-pointing double chevron and says it opens',
    shut.d === RIGHT &&
      shut.aim.points === 'right' &&
      shut.label === 'Open detail' &&
      shut.expanded === 'false' &&
      !shut.on,
    `path=${nameOf(shut.d)}, measured aim=${shut.aim.points} (converges to ${shut.aim.rightSpread}px at the right end against ${shut.aim.leftSpread}px at the left, over ${shut.aim.width}px of glyph), aria-label="${shut.label}", aria-expanded=${shut.expanded}`,
  );

  // ── One click opens it ─────────────────────────────────────────────────
  await click(shut.box);
  t = await read('table');
  const opened = t.rows[1].btn;
  check(
    'one click opens the pane beside the list',
    !!t.pane &&
      t.cols === 2 &&
      t.rows[1].active &&
      t.listShown &&
      t.pane.box.left > t.list.right - 1,
    `pane=${t.pane ? 'open' : 'none'} on ${t.rows.filter((r) => r.active).length} active row(s), ${t.cols} header cells left (the » column and the first data column), list ${t.listShown ? `ending at ${t.list.right}` : 'hidden (takeover)'}, pane starting at ${t.pane?.box.left}`,
  );
  check(
    'open, the same button draws the left-pointing chevron and says it closes',
    opened.d === LEFT &&
      opened.aim.points === 'left' &&
      opened.label === 'Close detail' &&
      opened.expanded === 'true' &&
      opened.on,
    `path=${nameOf(opened.d)}, measured aim=${opened.aim.points} (converges to ${opened.aim.leftSpread}px at the left end against ${opened.aim.rightSpread}px at the right), aria-label="${opened.label}", aria-expanded=${opened.expanded}`,
  );
  check(
    'the click leaves the keyboard on the button it was on',
    opened.focused,
    `focus is on ${t.focus} — ${opened.focused ? 'the button that opened the pane, so the next Enter closes it' : 'not the button'}`,
  );

  // ── And the next click closes it ───────────────────────────────────────
  await click(opened.box);
  t = await read('table');
  const closed = t.rows[1].btn;
  check(
    'the next click on that button closes the pane again',
    !t.pane && t.cols > 2 && !t.rows.some((r) => r.active),
    `pane=${t.pane ? 'still open' : 'closed'}, ${t.cols} columns back, ${t.rows.filter((r) => r.active).length} active row(s)`,
  );
  check(
    'and the arrow turns back',
    closed.d === RIGHT &&
      closed.aim.points === 'right' &&
      closed.label === 'Open detail' &&
      closed.focused,
    `path=${nameOf(closed.d)}, aim=${closed.aim.points}, aria-label="${closed.label}", focus on ${t.focus}`,
  );

  // ── The console, where a row click opens the pane too ──────────────────
  c = await show('console');
  await click(c.rows[1].btn.box);
  const consoleOpen = await read('console');
  await click(consoleOpen.rows[1].btn.box);
  const consoleShut = await read('console');
  check(
    'in a console the button still closes what it opened',
    !!consoleOpen.pane &&
      consoleOpen.rows[1].btn.d === LEFT &&
      !consoleShut.pane &&
      consoleShut.rows[1].btn.d === RIGHT,
    `interactionMode="grid" opens a row's pane on a row click as well; one click on the » button → ${consoleOpen.pane ? `"${consoleOpen.pane.title}" open, ${nameOf(consoleOpen.rows[1].btn.d)}` : 'nothing opened'}, a second click → ${consoleShut.pane ? `still "${consoleShut.pane.title}", ${nameOf(consoleShut.rows[1].btn.d)}` : `closed, ${nameOf(consoleShut.rows[1].btn.d)}`}`,
  );

  // ── Keyboard, from the row itself ──────────────────────────────────────
  await show('table');
  await evaluate(send, `document.querySelector('[data-dp="table"] tbody tr[tabindex]').focus()`);
  await press('Enter', 'Enter', 13);
  await sleep(300);
  const byKey = await read('table');
  check(
    'Enter on the row opens the pane, and that row’s own button agrees',
    !!byKey.pane && byKey.rows[0].btn.d === LEFT && byKey.rows[0].btn.expanded === 'true',
    `Enter on the first row → ${byKey.pane ? `"${byKey.pane.title}" open` : 'nothing'}, its button now ${nameOf(byKey.rows[0].btn.d)} with aria-expanded=${byKey.rows[0].btn.expanded} — the two controls cannot disagree`,
  );
  await press('Escape', 'Escape', 27);
  await sleep(300);
  const byEsc = await read('table');
  check(
    'Escape closes it and the button turns back with it',
    !byEsc.pane && byEsc.rows[0].btn.d === RIGHT,
    `pane=${byEsc.pane ? 'open' : 'closed'}, button=${nameOf(byEsc.rows[0].btn.d)} — closed from the keyboard, with no click involved`,
  );

  // ── Right to left, where the pane opens on the other side ─────────────
  await open('rtl');
  const r0 = await show('table');
  const rShut = r0.rows[1].btn;
  await click(rShut.box);
  const r1 = await read('table');
  const rOpen = r1.rows[1].btn;
  check(
    'right to left, the pane opens on the other side and both arrows follow it',
    r0.dir === 'rtl' &&
      !!r1.pane &&
      r1.listShown &&
      r1.pane.box.right < r1.list.left + 1 &&
      rShut.aim.points === 'left' &&
      rOpen.aim.points === 'right',
    `direction=${r0.dir}: the list ${r1.listShown ? `starts at ${r1.list.left}` : 'is hidden'} and the pane ends at ${r1.pane?.box.right}; shut arrow aim=${rShut.aim.points}, open arrow aim=${rOpen.aim.points} (mirrored by CSS, so each still points where the click sends the pane)`,
  );
  await click(rOpen.box);
  const r2 = await read('table');
  check(
    'and it closes from there too',
    !r2.pane && r2.rows[1].btn.aim.points === 'left',
    `pane=${r2.pane ? 'open' : 'closed'}, arrow aim=${r2.rows[1].btn.aim.points}`,
  );
  await evaluate(send, `document.documentElement.setAttribute('dir', 'ltr')`);

  // ── The open button's own contrast, over 3 palettes x 2 themes ────────
  const sweep = [];
  for (const palette of ['arctic', 'ember', 'sage']) {
    for (const theme of ['light', 'dark']) {
      await evaluate(
        send,
        `document.documentElement.setAttribute('data-palette', '${palette}');` +
          `document.documentElement.setAttribute('data-theme', '${theme}')`,
      );
      await sleep(200);
      const now = await show('table');
      const shutBtn = now.rows[1].btn;
      await click(shutBtn.box);
      const on = await read('table');
      const onBtn = on.rows[1].btn;
      const page = parse(await evaluate(send, `getComputedStyle(document.body).backgroundColor`));
      const row = parse(
        await evaluate(
          send,
          `getComputedStyle(document.querySelector('[data-dp="table"] tbody tr td')).backgroundColor`,
        ),
      );
      const under = row[3] >= 1 ? row : page;
      sweep.push({
        where: `${palette} ${theme}`,
        shut: contrast(over(parse(shutBtn.ink), parse(shutBtn.fill), under), under),
        open: contrast(
          over(parse(onBtn.ink), parse(onBtn.fill), under),
          over(parse(onBtn.fill), under, under),
        ),
      });
      await click(onBtn.box);
    }
  }
  const worst = [...sweep].sort((a, b) => Math.min(a.shut, a.open) - Math.min(b.shut, b.open))[0];
  check(
    'the arrow reads in both states, in every palette and theme',
    sweep.length === 6 && sweep.every((x) => x.shut >= AA_GRAPHIC && x.open >= AA_GRAPHIC),
    `${sweep.length * 2} readings — weakest ${Math.min(worst.shut, worst.open).toFixed(2)}:1 (${worst.where}: shut ${worst.shut.toFixed(2)}, open ${worst.open.toFixed(2)} against its own accent fill), floor ${AA_GRAPHIC}`,
  );
  await evaluate(
    send,
    `document.documentElement.setAttribute('data-palette', 'arctic');` +
      `document.documentElement.setAttribute('data-theme', 'light')`,
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
  console.error(`\n✗ ${failed.length} of ${checks.length} pane-toggle checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} pane-toggle checks passed.`);
