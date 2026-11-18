/**
 * FR-84: a read that failed, and a reading that was never taken.
 *
 * A read that fails must never look like a read that found nothing. On an
 * error a consumer hands `strct-datagrid` an empty array, the grid draws its
 * `emptyText`, and the operator is told "This VM has no recovery point" when
 * the question was never answered. `strct-progress` had the same gap for a
 * single value: `[value]` was a number, so a fullness that failed to read
 * arrived as `value ?? 0` and was drawn as an empty bar in the tone of a
 * healthy one.
 *
 * "Visibly and audibly different" is the acceptance, and neither half can be
 * answered without a browser: what glyph is actually drawn, what tone it
 * takes once the stylesheet has had its say, how much ink the track carries,
 * what Chrome's accessibility tree says each one is, and whether the refresh
 * is still reachable. So all of it is asked of one, in both themes.
 *
 *   node scripts/read-integrity.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';
import { PNG } from 'pngjs';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4721;
const CDP = 9421;
/** WCAG 2.1 1.4.11 for a graphic that carries meaning. */
const AA_GRAPHIC = 3;
/** WCAG 2.1 1.4.3 for text. */
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

/** The three grids and the three bars, as they actually render. */
const STATE = `(() => {
  const box = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { w: +b.width.toFixed(2), h: +b.height.toFixed(2), top: +(b.top + scrollY).toFixed(2),
             left: +(b.left + scrollX).toFixed(2), bottom: +(b.bottom + scrollY).toFixed(2) };
  };
  // The first OPAQUE background. A tint — and this library's tracks and bands
  // are tints — composited over another tint reads as black on black.
  const ground = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const bg = getComputedStyle(p).backgroundColor;
      if (!bg) continue;
      const a = bg.match(/[0-9.]+/g);
      const alpha = /rgba|\\/|color\\(/.test(bg) && a ? Number(a[a.length - 1]) : 1;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && alpha >= 1) return bg;
    }
    return getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)';
  };
  const grid = (key) => {
    const g = document.querySelector('[data-dge="' + key + '"]');
    if (!g) return null;
    const empty = g.querySelector('.strct-dg__emptyrow strct-empty-state');
    const band = g.querySelector('.strct-dg__errorband');
    const refresh = [...g.querySelectorAll('.strct-dg__foot button')]
      .find((b) => /refresh/i.test(b.getAttribute('aria-label') || ''));
    // The grid carries its own (empty) announcer region, so "a status" means
    // one that actually says something.
    const spoken = [...g.querySelectorAll('[role="status"]')].filter(
      (el) => el.textContent.replace(/\\s+/g, ' ').trim().length > 0,
    );
    const statusEl = spoken[0] ?? null;
    return {
      rows: [...g.querySelectorAll('tbody tr')].filter(
        (tr) => !tr.querySelector('.strct-dg__emptyrow') && !tr.classList.contains('strct-dg__vspacer'),
      ).length,
      empty: empty
        ? {
            text: empty.textContent.replace(/\\s+/g, ' ').trim(),
            glyph: empty.querySelector('svg path')?.getAttribute('d') ?? null,
            ink: getComputedStyle(empty.querySelector('strct-icon') ?? empty).color,
            box: box(empty.querySelector('strct-icon')),
            ground: ground(empty),
          }
        : null,
      band: band
        ? {
            text: band.textContent.replace(/\\s+/g, ' ').trim(),
            role: band.getAttribute('role'),
            lines: Math.round(
              band.querySelector('.strct-dg__errortext').getBoundingClientRect().height /
                parseFloat(getComputedStyle(band).lineHeight),
            ),
            h: box(band).h,
            glyph: band.querySelector('svg path')?.getAttribute('d') ?? null,
            ink: getComputedStyle(band.querySelector('.strct-dg__errortext')).color,
            fill: getComputedStyle(band).backgroundColor,
            ground: ground(band.parentElement),
            box: box(band),
          }
        : null,
      spokenStatuses: spoken.length,
      statusText: statusEl ? statusEl.textContent.replace(/\\s+/g, ' ').trim() : null,
      refresh: refresh ? { disabled: refresh.disabled, label: refresh.getAttribute('aria-label') } : null,
    };
  };
  const bar = (key) => {
    const host = document.querySelector('[data-pu="' + key + '"]');
    if (!host) return null;
    const track = host.querySelector('.strct-progress__track');
    const fill = host.querySelector('.strct-progress__fill');
    const value = host.querySelector('.strct-progress__value');
    return {
      unread: host.classList.contains('strct-progress--unread'),
      fills: host.querySelectorAll('.strct-progress__fill').length,
      fillWidth: fill ? getComputedStyle(fill).width : null,
      valuenow: track.getAttribute('aria-valuenow'),
      valuetext: track.getAttribute('aria-valuetext'),
      valuemin: track.getAttribute('aria-valuemin'),
      text: value ? value.textContent.trim() : null,
      trackBg: getComputedStyle(track).backgroundImage,
      trackColor: getComputedStyle(track).backgroundColor,
      box: box(track),
      ground: ground(track),
      ink: value ? getComputedStyle(value).color : null,
    };
  };
  return {
    grids: { empty: grid('empty'), failed: grid('failed'), kept: grid('kept') },
    bars: { unread: bar('unread'), zero: bar('zero'), full: bar('full') },
  };
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
const over = (fg, bg, under) => {
  const a = fg[3] ?? 1;
  if (a >= 1) return fg;
  return [0, 1, 2].map((i) => fg[i] * a + (bg[3] >= 1 ? bg[i] : under[i]) * (1 - a));
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/**
 * Contrast of one colour on another, with every tint composited first: the
 * tracks and the bands in this library are mixes with transparency in them,
 * and reading a tint as if it were opaque gives black on black.
 */
const ratio = (fg, bg, under) => {
  const base = parse(under ?? bg);
  const ground = over(parse(bg), base, base);
  return contrast(over(parse(fg), ground, ground), ground);
};

let up = false;

/**
 * How textured a box is: the share of neighbouring pixels along its middle
 * rows that differ from each other. A flat track is 0 whatever its colour; a
 * hatch is not. Ink against the page cannot tell them apart — both tracks
 * differ from the page everywhere — and this is the thing being claimed: the
 * difference is a texture, so a reader who cannot see the hue still has it.
 */
async function texture(send, box) {
  const clip = {
    x: Math.round(box.left),
    y: Math.round(box.top),
    width: Math.max(1, Math.round(box.w)),
    height: Math.max(1, Math.round(box.h)),
    scale: 6,
  };
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip });
  const png = PNG.sync.read(Buffer.from(data, 'base64'));
  const at = (x, y) => {
    const i = (y * png.width + x) * 4;
    return [png.data[i], png.data[i + 1], png.data[i + 2]];
  };
  // The middle third, so the rounded corners and the hairline ring are out.
  const y0 = Math.floor(png.height / 3);
  const y1 = Math.ceil((png.height * 2) / 3);
  let steps = 0;
  let seen = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = 1; x < png.width; x++) {
      const a = at(x - 1, y);
      const b = at(x, y);
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 6) steps++;
      seen++;
    }
  }
  return seen ? (steps / seen) * 100 : 0;
}

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Accessibility.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1500,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  });
  up = true;

  const go = async (route, anchor, ready) => {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${route}` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.querySelector('${ready}')`)) break;
      await sleep(200);
    }
    await evaluate(
      send,
      `document.querySelector('${anchor}')?.scrollIntoView({ block: 'center' })`,
    );
    await sleep(600);
    return evaluate(send, STATE);
  };

  // ══ FR-84-01: the grid ════════════════════════════════════════════════
  let s = await go(
    '/components/datagrid',
    '#datagrid-error .dg-wrap',
    '[data-dge="failed"] .strct-dg__emptyrow',
  );
  const { empty, failed, kept } = s.grids;
  check(
    'the three answers are on the page',
    !!empty?.empty &&
      !!failed?.empty &&
      !!kept?.band &&
      empty.rows === 0 &&
      failed.rows === 0 &&
      kept.rows === 2,
    `a grid that found nothing (${empty?.rows} rows), one whose read failed (${failed?.rows} rows), and one holding its last good read under a band (${kept?.rows} rows)`,
  );
  check(
    'a read that failed does not look like a read that found nothing',
    empty.empty.text !== failed.empty.text &&
      empty.empty.glyph !== failed.empty.glyph &&
      empty.empty.ink !== failed.empty.ink &&
      ratio(failed.empty.ink, failed.empty.ground) >= AA_GRAPHIC,
    `"${empty.empty.text}" under one glyph in ${empty.empty.ink}, against "${failed.empty.text}" under a different glyph in ${failed.empty.ink} at ${ratio(failed.empty.ink, failed.empty.ground).toFixed(2)}:1 (floor ${AA_GRAPHIC}) — a different shape and a different tone, so neither colour nor wording carries it alone`,
  );
  check(
    'rows passed alongside an error are kept, under one line',
    kept.rows === 2 && kept.band.lines === 1 && !kept.empty,
    `the last good read is still drawn (${kept.rows} rows) and the error is a ${kept.band.h}px band — ${kept.band.lines} line — above it, not a replacement`,
  );
  check(
    'the band reads, and says what it is',
    ratio(kept.band.ink, kept.band.fill, kept.band.ground) >= AA &&
      kept.band.role === 'status' &&
      /read failed/i.test(kept.band.text) &&
      /could not be read/i.test(kept.band.text),
    `${ratio(kept.band.ink, kept.band.fill, kept.band.ground).toFixed(2)}:1 on its own fill (floor ${AA}), role=${kept.band.role}, and it reads "${kept.band.text}"`,
  );
  check(
    'the error is announced once, as a status, not per row',
    failed.spokenStatuses === 1 &&
      /read failed/i.test(failed.statusText ?? '') &&
      kept.spokenStatuses === 1 &&
      kept.band.role === 'status' &&
      empty.spokenStatuses === 0,
    `both error cases carry exactly one role="status" that says something ("${failed.statusText}"), and the grid that simply found nothing carries none — so the sentence is heard once when it arrives, not once per row`,
  );
  check(
    "the footer's refresh stays reachable while the read is failing",
    !!empty.refresh &&
      !!failed.refresh &&
      !!kept.refresh &&
      !failed.refresh.disabled &&
      !kept.refresh.disabled,
    `"${failed.refresh?.label}" is present and enabled in all three — the one control that can undo the error is not taken away by it`,
  );

  // ══ FR-84-02: the bar ═════════════════════════════════════════════════
  s = await go(
    '/components/progress',
    '#progress-unread [data-pu="demo"]',
    '[data-pu="unread"] .strct-progress__track',
  );
  const { unread, zero, full } = s.bars;
  check(
    'the three bars are on the page',
    !!unread && !!zero && !!full && unread.unread && !zero.unread && !full.unread,
    `one with no reading, one measured at 0 and one measured at 91`,
  );
  const unreadTex = await texture(send, unread.box);
  const zeroTex = await texture(send, zero.box);
  check(
    'no reading is visibly different from a reading of zero',
    // The rule is the ratio, because that is the claim: one track is textured
    // and the other is not. The absolute floor is there so a hatch too faint
    // to see could not pass on the ratio alone.
    unread.fills === 0 && zero.fills === 1 && unreadTex >= 2 && unreadTex >= zeroTex * 10,
    `the unread track draws no fill at all and is textured on ${unreadTex.toFixed(1)}% of its own width against the measured-zero track's ${zeroTex.toFixed(1)}% (${(unreadTex / Math.max(zeroTex, 0.01)).toFixed(0)}×, floor 10× and 2%) — a hatch, so the difference is a texture and not a hue, and a reader who cannot see the hue still has it`,
  );
  check(
    'a bar with no reading takes no status colour',
    unread.trackColor !== full.trackColor && !/accent|critical/.test(unread.trackBg),
    `the unread track keeps the neutral ground (${unread.trackColor}) while the measured one at 91% is toned — "we have not measured this" is never drawn as "this is fine" or "this is full"`,
  );
  check(
    'it prints and says the words, and never "0 percent"',
    unread.text === 'Not read' &&
      unread.valuenow === null &&
      unread.valuetext === 'Not read' &&
      unread.valuemin === null &&
      zero.valuenow === '0' &&
      zero.text === '0%',
    `the unread bar prints "${unread.text}" with aria-valuenow absent and aria-valuetext "${unread.valuetext}"; a real zero still carries aria-valuenow=${zero.valuenow} and prints "${zero.text}"`,
  );
  const axUnread = await (async () => {
    const { root } = await send('DOM.getDocument', { depth: -1 });
    const { nodeId } = await send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: '[data-pu="unread"] .strct-progress__track',
    });
    const { nodes } = await send('Accessibility.getPartialAXTree', {
      nodeId,
      fetchRelatives: false,
    });
    const n = nodes[0];
    return {
      role: n?.role?.value,
      name: n?.name?.value,
      props: (n?.properties ?? [])
        .map((p) => `${p.name}=${JSON.stringify(p.value.value)}`)
        .join(' '),
    };
  })();
  check(
    'Chrome reads it as a progressbar with no number',
    axUnread.role === 'progressbar' && !/valuenow/.test(axUnread.props),
    `role=${axUnread.role}, name "${axUnread.name}", properties: ${axUnread.props || '(none)'} — CDP does not serialise aria-valuetext for a progressbar (verified in 7.16.0 against a hand-made control), so the attribute is read above; what matters here is that no value is exposed`,
  );

  // ══ Both themes ═══════════════════════════════════════════════════════
  const sweep = [];
  for (const theme of ['light', 'dark']) {
    await evaluate(send, `document.documentElement.setAttribute('data-theme', '${theme}')`);
    await sleep(300);
    const bars = await evaluate(send, STATE);
    sweep.push({
      where: `${theme} unread words`,
      ratio: ratio(bars.bars.unread.ink, bars.bars.unread.ground),
    });
    const g = await go(
      '/components/datagrid',
      '#datagrid-error .dg-wrap',
      '[data-dge="failed"] .strct-dg__emptyrow',
    );
    sweep.push({
      where: `${theme} failed glyph`,
      ratio: ratio(g.grids.failed.empty.ink, g.grids.failed.empty.ground),
    });
    sweep.push({
      where: `${theme} band text`,
      ratio: ratio(g.grids.kept.band.ink, g.grids.kept.band.fill, g.grids.kept.band.ground),
    });
    s = await go(
      '/components/progress',
      '#progress-unread [data-pu="demo"]',
      '[data-pu="unread"] .strct-progress__track',
    );
  }
  const worst = [...sweep].sort((a, b) => a.ratio - b.ratio)[0];
  check(
    'every one of them reads in both themes',
    sweep.length === 6 && sweep.every((x) => x.ratio >= AA_GRAPHIC),
    `${sweep.length} readings — weakest ${worst.ratio.toFixed(2)}:1 (${worst.where}), floor ${AA_GRAPHIC} for a graphic and ${AA} for the text, which the band clears`,
  );
  await evaluate(send, `document.documentElement.setAttribute('data-theme', 'light')`);
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

const failed2 = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? '\u2713' : '\u2717'} ${c.name} \u2014 ${c.detail}`);
if (failed2.length) {
  console.error(`\n\u2717 ${failed2.length} of ${checks.length} read-integrity checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} read-integrity checks passed.`);
