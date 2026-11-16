/**
 * The tree's state axes: an inventory object is in four states at once, and
 * they are four different questions.
 *
 * The tree had one badge slot, so the signals took turns. HyperStruct's own
 * mapping says it out loud — "the signals take turns (health outranks
 * lifecycle)" — which means an alarmed VM lost its power state, and a host
 * nobody could reach was drawn with the power-off mark: "switched off" and
 * "not answering" were the same picture. Everything that did not fit went
 * into the label text ("esx01 (Maintenance Mode)"), which is the one string
 * the type-ahead matches. And the mode an operator CHOSE was drawn as a
 * near-black tile at 12.43:1 against the page, beside a critical alarm the
 * system REPORTED at 4.42:1 — the emphasis was upside down.
 *
 * So: reach on the row, mode in the icon's top corner, power in its bottom
 * one, health at the row's end, and nothing at all for an object that is
 * reachable, on and quiet. Every number here is read back from what Chrome
 * laid out — the weights, the recession, the alignment, the two marks told
 * apart with the hue taken away, and what the accessibility tree says.
 *
 *   node scripts/tree-state.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4719;
const CDP = 9419;
/** WCAG 1.4.3 for text. */
const AA = 4.5;
/** The row the tree has always had — the glyph grew inside it, not past it. */
const ROW = 27.5;
/** No state mark may be smaller than this: an 8px dot on a 1920x1080 screen
 *  is a smudge, which is what sent this back to the drawing board. */
const MARK = 11;
/** What the old single-slot model measured, before the axes. */
const BEFORE = { tile: 12.43, critical: 4.42 };

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

import { PNG } from 'pngjs';

/** Every row of the demo, with what it draws and where. */
const ROWS = `(() => {
  const box = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {
      left: +(b.left + scrollX).toFixed(2), right: +(b.right + scrollX).toFixed(2),
      top: +(b.top + scrollY).toFixed(2), bottom: +(b.bottom + scrollY).toFixed(2),
      w: +b.width.toFixed(2), h: +b.height.toFixed(2),
    };
  };
  const read = (sel) =>
    [...document.querySelectorAll(sel + ' .strct-tnode__row')].map((row) => {
      const label = row.querySelector('.strct-tnode__label');
      const icon = row.querySelector('.strct-tnode__icon');
      const badges = [...row.querySelectorAll('.strct-icon__badge')];
      const health = badges.find((el) =>
        /--(success|warning|critical|info|inherit)/.test(el.className),
      );
      const life = badges.find((el) => /--(running|paused|off)/.test(el.className));
      const badge = health ?? life ?? null;
      const mode = row.querySelector('.strct-icon__mode');
      const mark = row.querySelector('.strct-icon__count');
      const page = (() => {
        for (let p = row; p; p = p.parentElement) {
          const bg = getComputedStyle(p).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
        }
        return 'rgb(255,255,255)';
      })();
      return {
        label: label.textContent.trim(),
        h: +row.getBoundingClientRect().height.toFixed(2),
        unreachable: row.classList.contains('strct-tnode__row--unreachable'),
        orphaned: row.classList.contains('strct-tnode__row--orphaned'),
        labelInk: getComputedStyle(label).color,
        iconOpacity: icon?.querySelector('svg')
          ? +getComputedStyle(icon.querySelector('svg')).opacity
          : null,
        cut: icon ? getComputedStyle(icon, '::after').content !== 'none' : false,
        badge: badge ? badge.className.split('--')[1] : null,
        mode: mode ? mode.className.split('--')[1] : null,
        modeBg: mode ? getComputedStyle(mode).backgroundColor : null,
        modeBox: box(mode),
        modeBorder: mode ? getComputedStyle(mode).borderTopColor : null,
        health: health
          ? {
              tone: health.className.includes('critical') ? 'critical' : health.className.includes('warning') ? 'warning' : 'other',
              ink: getComputedStyle(health).backgroundColor,
              box: box(health),
            }
          : null,
        life: life ? { kind: life.className.split('--')[1], box: box(life) } : null,
        mark: mark
          ? {
              tone: mark.className.includes('critical') ? 'critical' : 'warning',
              ink: getComputedStyle(mark).backgroundColor,
              count: mark.textContent.trim(),
              box: box(mark),
            }
          : null,
        icon: box(icon),
        modeBoxOuter: box(mode),
        marks: [health, life, mode, mark].filter(Boolean).length,
        described: row.getAttribute('aria-description'),
        name: row.textContent.replace(/\\s+/g, ' ').trim(),
        page,
        box: box(row),
      };
    });
  return { open: read('#tree-state .ts-demo__col:first-child'), closed: read('#tree-state .ts-demo__col:last-child') };
})()`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
const parse = (c) => {
  const n = (c.match(/[0-9.]+(?:e[-+]?\d+)?/g) ?? [0, 0, 0, 1]).map(Number);
  const v = /^color\(/.test(c) ? n.map((x, i) => (i < 3 ? x * 255 : x)) : n;
  return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1];
};
const over = (fg, bg) => {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
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
const on = (ink, page) => contrast(over(parse(ink), parse(page)), parse(page));
let up = false;

/**
 * A mark's ink, as a shape and as a mass. Contrast alone is the wrong measure
 * of emphasis: a 9px outline at 6:1 and a 10px filled diamond at 4.2:1 are not
 * the same weight to an eye, because one of them is mostly surface. So the
 * mass is how much ink is actually painted, times how far that ink is from
 * the surface it sits on.
 */
async function centroid(send, box) {
  const pad = 1;
  const clip = {
    x: Math.round(box.left) - pad, y: Math.round(box.top) - pad,
    width: Math.round(box.w) + pad * 2, height: Math.round(box.h) + pad * 2, scale: 6,
  };
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip });
  const png = PNG.sync.read(Buffer.from(data, 'base64'));
  // The corner pixel is the page; ink is everything that differs from it.
  const bg = [png.data[0], png.data[1], png.data[2]];
  let sum = 0, weight = 0, ink = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (y * png.width + x) * 4;
      const px = [png.data[i], png.data[i + 1], png.data[i + 2]];
      const d = Math.abs(px[0] - bg[0]) + Math.abs(px[1] - bg[1]) + Math.abs(px[2] - bg[2]);
      if (d > 40) {
        sum += y;
        weight += 1;
        ink += contrast(px, bg);
      }
    }
  }
  // Per rendered pixel of the box, so a 6x render and a 1x one agree.
  const area = png.width * png.height;
  return { y: weight ? sum / weight / png.height : 0, px: weight, mass: ink / area };
}

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Accessibility.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1200, deviceScaleFactor: 1, mobile: false });
  up = true;

  const load = async () => {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/tree` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.querySelector('#tree-state .strct-tnode__row')`)) break;
      await sleep(200);
    }
    await evaluate(send, `document.querySelector('#tree-state .ts-demo').scrollIntoView({ block: 'center' })`);
    await sleep(600);
    return evaluate(send, ROWS);
  };

  let t = await load();
  const rows = t.open;
  const by = (label) => rows.find((r) => r.label === label);
  check(
    'the case is on the page',
    rows.length >= 10 && t.closed.length === 3 && !!by('vm-07') && !!by('HV-NODE-02'),
    `${rows.length} rows open and ${t.closed.length} closed clusters beside them`,
  );

  // ── Nothing for the normal case ────────────────────────────────────────
  const quiet = ['HV-NODE-01', 'vm-11'].map(by);
  check(
    'a reachable, running, quiet object draws nothing at all',
    quiet.every((r) => r.marks === 0 && !r.unreachable && r.described === null),
    `${quiet.map((r) => `"${r.label}"`).join(' and ')} carry 0 marks and no description — in a tree of 2000 rows, the normal ones are silent`,
  );

  // ── The four axes, at once ─────────────────────────────────────────────
  const vm7 = by('vm-07');
  const hv2 = by('HV-NODE-02');
  check(
    'an object that is off, alarmed and out of reach says all three',
    vm7.unreachable && vm7.cut && vm7.life?.kind === 'off' && vm7.health?.tone === 'critical',
    `"vm-07": the row recedes and its glyph is cut (reach), its bottom corner carries ${vm7.life?.kind} (power) and its top corner a ${vm7.health?.tone} mark (health) — all three on the glyph, where the single slot could show one of them`,
  );
  check(
    'a host in maintenance with an open alarm says both',
    hv2.mode === 'maintenance' && hv2.health?.tone === 'warning' && !hv2.unreachable,
    `"HV-NODE-02": the barrier tile in the glyph's bottom corner and a ${hv2.health?.tone} mark in its top one`,
  );

  // ── The weights, the right way round ───────────────────────────────────
  const tileWeight = on(hv2.modeBorder, hv2.page);
  const critWeight = on(vm7.health.ink, vm7.page);
  const warnWeight = on(hv2.health.ink, hv2.page);
  const tileMass = await centroid(send, hv2.modeBoxOuter);
  const critMass = await centroid(send, vm7.health.box);
  // Prominence is how much ink a mark puts on the row and how far that ink is
  // from the surface — not how dark one edge of it is. A mark that is bigger
  // IS louder, so the mass is not normalised away.
  const tileInk = tileMass.mass * hv2.modeBoxOuter.w * hv2.modeBoxOuter.h;
  const critInk = critMass.mass * vm7.health.box.w * vm7.health.box.h;
  check(
    'a mode an operator chose no longer outweighs a fault the system reported',
    critInk >= tileInk * 0.9 && critWeight >= 3 && warnWeight >= 3,
    `the alarm carries ${critInk.toFixed(0)} of ink-weight against the maintenance tile's ${tileInk.toFixed(0)} — ${((critInk / tileInk) * 100).toFixed(0)}% of it, where the near-black tile it replaces measured ${BEFORE.tile}:1 at the edge beside a ${BEFORE.critical}:1 alarm (now ${tileWeight.toFixed(2)}:1 and ${critWeight.toFixed(2)}:1)`,
  );

  // ── Receded, but still readable ────────────────────────────────────────
  const dim = rows.filter((r) => r.unreachable);
  const normal = by('HV-NODE-01');
  const dimRatios = dim.map((r) => on(r.labelInk, r.page));
  const normalRatio = on(normal.labelInk, normal.page);
  check(
    'an object out of reach recedes without going under AA',
    dim.length >= 3 &&
      dimRatios.every((x) => x >= AA) &&
      Math.min(...dimRatios) < normalRatio - 1 &&
      dim.every((r) => r.iconOpacity !== null && r.iconOpacity < 1 && r.cut),
    `${dim.length} rows at ${Math.min(...dimRatios).toFixed(2)}:1 against ${normalRatio.toFixed(2)}:1 for a row that is answering, with the glyph at ${dim[0].iconOpacity} and cut — while the marks on it keep their full weight (floor ${AA})`,
  );

  // ── On the glyph, and big enough to read on a 1920x1080 screen ────────
  const all = rows.flatMap((r) =>
    [r.health, r.life, r.mark, r.modeBoxOuter ? { box: r.modeBoxOuter } : null]
      .filter(Boolean)
      .map((m) => ({ row: r, box: m.box })),
  );
  const apart = all.filter(
    (m) => m.box.left > m.row.icon.right + 1 || m.box.right < m.row.icon.left - 1,
  );
  const small = all.filter((m) => Math.min(m.box.w, m.box.h) < MARK);
  check(
    'every mark sits on the glyph, and none is too small to read',
    all.length >= 6 && apart.length === 0 && small.length === 0,
    `${all.length} marks over ${rows.length} rows, all of them on an ${rows[1].icon.w}px glyph (none standing off it), the smallest ${Math.min(...all.map((m) => Math.min(m.box.w, m.box.h))).toFixed(1)}px against a floor of ${MARK}px — they were 8-11px on a 16px glyph`,
  );

  // ── Told apart with the hue taken away ─────────────────────────────────
  const warnShape = await centroid(send, hv2.health.box);
  const critShape = await centroid(send, vm7.health.box);
  check(
    'warning and critical are two shapes, not two hues',
    Math.abs(warnShape.y - critShape.y) >= 0.06 && warnShape.px > 20 && critShape.px > 20,
    `in a 6x render the triangle's ink sits at ${(warnShape.y * 100).toFixed(1)}% of its box and the diamond's at ${(critShape.y * 100).toFixed(1)}% — ${(Math.abs(warnShape.y - critShape.y) * 100).toFixed(1)} points apart with no colour involved`,
  );

  // ── What a closed node carries ─────────────────────────────────────────
  const closed = t.closed;
  check(
    'a closed node brings up the worst of what is under it, and how many',
    closed[0].mark?.tone === 'critical' &&
      closed[0].mark.count === '2' &&
      closed[1].mark?.tone === 'warning' &&
      closed[1].mark.count === '3' &&
      closed[2].mark === null,
    `"${closed[0].label}" ${closed[0].mark?.tone} ${closed[0].mark?.count}, "${closed[1].label}" ${closed[1].mark?.tone} ${closed[1].mark?.count}, "${closed[2].label}" nothing`,
  );
  check(
    'an open node stops repeating its children',
    by('cluster-01').mark === null,
    'the open cluster carries no rollup — its children are saying their own',
  );

  // ── The sentence, and the name ─────────────────────────────────────────
  const { root } = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: '#tree-state .ts-demo__col:first-child [aria-description]',
  });
  const ax = nodeId
    ? await send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })
    : { nodes: [] };
  const node = ax.nodes[0];
  const axName = node?.name?.value ?? '';
  const axDesc = node?.description?.value ?? '';
  check(
    'the state is said in words, and the name is still the name',
    vm7.described === 'Not reachable, Off, Critical' &&
      axName === 'HV-NODE-02' &&
      axDesc === 'In maintenance, Warning',
    `Chrome names the first marked row "${axName}" and describes it as "${axDesc}"; "vm-07" is described as "${vm7.described}" — no state inside the label the type-ahead matches`,
  );

  // ── Nothing got taller ─────────────────────────────────────────────────
  const heights = [...new Set(rows.map((r) => r.h))];
  check(
    'the glyph grew inside the row, not past it',
    heights.every((h) => Math.abs(h - ROW) <= 0.5) && rows[1].icon.w === 18,
    `an ${rows[1].icon.w}px glyph (16px before) in a ${heights.join(', ')}px row — the ${ROW}px the tree has always had, so an inventory shows the same number of objects`,
  );

  // ── Every palette ──────────────────────────────────────────────────────
  const sweep = [];
  for (const palette of ['arctic', 'ember', 'sage']) {
    for (const theme of ['light', 'dark']) {
      await evaluate(
        send,
        `document.documentElement.setAttribute('data-palette', '${palette}');` +
          `document.documentElement.setAttribute('data-theme', '${theme}')`,
      );
      await sleep(350);
      const p = await evaluate(send, ROWS);
      for (const r of p.open) {
        if (r.health)
          sweep.push({ where: `${palette} ${theme} ${r.health.tone}`, ratio: on(r.health.ink, r.page) });
        if (r.unreachable) sweep.push({ where: `${palette} ${theme} receded`, ratio: on(r.labelInk, r.page) });
      }
    }
  }
  const worst = [...sweep].sort((a, b) => a.ratio - b.ratio)[0];
  check(
    'the marks and the receded rows read in all six palettes',
    sweep.length > 0 && sweep.every((x) => x.ratio >= 3),
    `${sweep.length} readings — weakest ${worst.ratio.toFixed(2)}:1 (${worst.where}); every receded label clears ${AA} and every mark 3:1 as a graphic`,
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
  console.error(`\n✗ ${failed.length} of ${checks.length} tree-state checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} tree-state checks passed.`);
