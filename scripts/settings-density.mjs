/**
 * FR-79-01..03: a compact settings window.
 *
 * A VM's settings are sixteen sections beside a form, in a 760px window.
 * Two things stopped that window being drawn with the components it is made
 * of. A menu line said a section's NAME and had no way to say what it is set
 * to — `badge` was the only trailing text and it is a coloured chip, so
 * sixteen values read as sixteen alerts — and at 31px a line, sixteen
 * sections and two heads took 560px before a single setting was drawn. And
 * an inline field row cost 63-87px: 24px of margin plus padding between two
 * rows, and a hint that wrapped to a second and a third line under the label
 * whenever it was wider than the label column.
 *
 * So every number here is read back from what Chrome laid out: the step of
 * both menu densities and what the whole menu then costs; a line carrying a
 * value, a dot and a trailing icon at once, in a 236px menu, with the
 * accessible name taken from Chrome's own accessibility tree rather than
 * from the attribute this library wrote; what the value measures against the
 * surface it sits on, composited, in both palettes and in the active tone;
 * the pitch between two compact rows and between two comfortable ones; and
 * where a hint too wide for the label column ends up — with the control it
 * describes still pointing at it.
 *
 *   node scripts/settings-density.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4714;
const CDP = 9414;
/** The width the settings window gives the menu. */
const MENU_W = 236;
/** FR-79-02: the compact step, and the step it replaces. */
const COMPACT_ITEM = 26;
const COMPACT_HEAD = 22;
const COMFY_ITEM = 31;
const COMFY_HEAD = 34;
/** FR-79-03: what a row with a 28-34px control and a one-line hint may cost. */
const PITCH = 44;
/** The comfortable pitches, measured before the change: these must not move. */
const COMFY_PITCH = [72.8, 85.8];
/** WCAG 1.4.3 for text. */
const AA = 4.5;
/** The characters the label keeps before anything ellipsises. */
const KEEP = 8;

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
 * The menu, at both densities. Every background up the tree is collected,
 * because the active line's own is `--acc-m`, which is translucent: the
 * colour the value is really read against is the composite, not the first
 * non-transparent ancestor.
 */
const MENU = `(() => {
  const stack = (el) => {
    const out = [];
    for (let p = el; p; p = p.parentElement) {
      const bg = getComputedStyle(p).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') out.push(bg);
    }
    return out;
  };
  const read = (d) => {
    const panel = document.querySelector('#section-menu-settings [data-density="' + d + '"]');
    if (!panel) return null;
    const nav = panel.querySelector('.strct-sm');
    const items = [...panel.querySelectorAll('.strct-sm__item')].map((el) => {
      const label = el.querySelector('.strct-sm__item-label');
      const val = el.querySelector('.strct-sm__value');
      const dot = el.querySelector('.strct-sm__dot');
      const trail = el.querySelector('.strct-sm__trailing');
      const text = label.textContent.trim();
      const r = document.createRange();
      r.selectNodeContents(label);
      return {
        label: text,
        h: +el.getBoundingClientRect().height.toFixed(2),
        labelW: +label.getBoundingClientRect().width.toFixed(2),
        // One character's width in the label's own face, so "eight
        // characters" is a measurement and not an assumption about the font.
        charW: +(r.getBoundingClientRect().width / Math.max(1, text.length)).toFixed(3),
        labelClipped: label.scrollWidth > label.clientWidth + 0.5,
        value: val ? val.textContent.trim() : null,
        valueClipped: val ? val.scrollWidth > val.clientWidth + 0.5 : null,
        valueInk: val ? getComputedStyle(val).color : null,
        valueOn: val ? stack(val) : null,
        dotVisible: !!dot && dot.getBoundingClientRect().width > 0,
        trailVisible: !!trail && trail.getBoundingClientRect().width > 0,
        active: el.classList.contains('strct-sm__item--active'),
        disabled: el.disabled === true,
      };
    });
    const heads = [...panel.querySelectorAll('.strct-sm__cat-static, .strct-sm__cat')].map((el) => ({
      label: el.textContent.trim(),
      h: +el.getBoundingClientRect().height.toFixed(2),
    }));
    return {
      navW: +nav.getBoundingClientRect().width.toFixed(1),
      total: +nav.getBoundingClientRect().height.toFixed(1),
      items,
      heads,
    };
  };
  // Scoped to the menus themselves: the demo wrapper around them has a copy
  // button and a tab strip of its own, which are not the menu's tab stops.
  const menus = [...document.querySelectorAll('#section-menu-settings [data-density] .strct-sm')];
  return {
    comfortable: read('comfortable'),
    compact: read('compact'),
    focusable: menus.reduce(
      (n, el) =>
        n +
        el.querySelectorAll(
          'a[href], button:not(:disabled), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ).length,
      0,
    ),
  };
})()`;

/** The settings form, at both densities. */
const FIELDS = `(() => {
  const read = (d) => {
    const form = document.querySelector('#field-compact [data-density="' + d + '"]');
    if (!form) return null;
    const rows = [...form.querySelectorAll('.strct-field')].map((el) => {
      const b = el.getBoundingClientRect();
      const label = el.querySelector('.strct-field__label');
      const hint = el.querySelector('.strct-field__msg--hint');
      const ctl = el.querySelector('.strct-control, .strct-field__value');
      const input = el.querySelector('input, select, textarea');
      const lb = label.getBoundingClientRect();
      const hb = hint ? hint.getBoundingClientRect() : null;
      const lh = hint ? parseFloat(getComputedStyle(hint).lineHeight) || 16 : 0;
      return {
        label: label.textContent.trim(),
        h: +b.height.toFixed(2),
        top: +b.top.toFixed(2),
        ctlH: ctl ? +ctl.getBoundingClientRect().height.toFixed(2) : null,
        hint: !!hint,
        hintLines: hint ? Math.round(hb.height / lh) : 0,
        // Does the hint start inside the label's column? That is the wrap
        // the FR is about: three lines under the label, pushing the row.
        hintUnderLabel: hint ? hb.left < lb.right - 1 : null,
        hintWide: el.classList.contains('strct-field--hintwide'),
        describesHint: !!(
          input &&
          hint &&
          (input.getAttribute('aria-describedby') || '').split(' ').includes(hint.id)
        ),
      };
    });
    return { rows, pitch: rows.slice(1).map((r, i) => +(r.top - rows[i].top).toFixed(2)) };
  };
  const forms = [...document.querySelectorAll('#field-compact [data-density]')];
  return {
    comfortable: read('comfortable'),
    compact: read('compact'),
    focusable: forms.reduce(
      (n, el) =>
        n +
        el.querySelectorAll(
          'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])',
        ).length,
      0,
    ),
  };
})()`;

/** Just the values' ink and the stack behind each, for the palette sweep. */
const VALUES = `(() => {
  const stack = (el) => {
    const out = [];
    for (let p = el; p; p = p.parentElement) {
      const bg = getComputedStyle(p).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') out.push(bg);
    }
    return out;
  };
  return [...document.querySelectorAll('#section-menu-settings .strct-sm__value')].map((el) => ({
    text: el.textContent.trim(),
    active: !!el.closest('.strct-sm__item--active'),
    disabled: el.closest('.strct-sm__item')?.disabled === true,
    ink: getComputedStyle(el).color,
    on: stack(el),
  }));
})()`;

/** Chrome's own accessible name for one element — not the attribute we wrote. */
async function axName(send, selector) {
  const { root } = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) return null;
  const { nodes } = await send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  const self = nodes.find((n) => n.backendDOMNodeId !== undefined && n.name) ?? nodes[0];
  return self?.name?.value ?? null;
}

const parse = (c) => {
  const n = (c.match(/[0-9.]+(?:e[-+]?\d+)?/g) ?? [0, 0, 0, 1]).map(Number);
  // color(srgb r g b / a) states its channels out of one, rgb() out of 255.
  const v = /^color\(/.test(c) ? n.map((x, i) => (i < 3 ? x * 255 : x)) : n;
  return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1];
};
/** Lay a translucent colour over what is behind it. */
const over = (fg, bg) => {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
};
/** The colour an element is really read against: the stack, composited. */
const composite = (layers) => {
  let out = [255, 255, 255, 1];
  for (const c of [...layers].reverse()) out = over(parse(c), out);
  return out;
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

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
let up = false;

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Accessibility.enable');
  up = true;

  for (const theme of ['light', 'dark']) {
    // ── The menu ───────────────────────────────────────────────────────────
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1400,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/section-menu` });
    for (let i = 0; i < 120; i++) {
      if (
        await evaluate(send, `!!document.querySelector('#section-menu-settings .strct-sm__value')`)
      )
        break;
      await sleep(200);
    }
    await evaluate(send, `document.documentElement.setAttribute('data-theme', '${theme}')`);
    await sleep(600);
    const m = await evaluate(send, MENU);
    if (!m?.compact || !m?.comfortable) {
      check(`${theme}: the settings menu is on the page`, false, 'no #section-menu-settings');
      break;
    }

    const cx = m.compact;
    const cy = m.comfortable;
    check(
      `${theme}: the case is on the page`,
      cx.items.length === 16 &&
        cx.heads.length === 2 &&
        Math.abs(cx.navW - MENU_W) <= 1 &&
        cx.items.every((i) => i.value),
      `${cx.items.length} sections and ${cx.heads.length} heads in a ${cx.navW}px menu, every one of them saying its value`,
    );

    // FR-79-01: a value, a dot and a trailing icon on one line, all visible.
    const three = cx.items.find((i) => i.value && i.dotVisible && i.trailVisible);
    check(
      `${theme}: a line carries its value, its dot and its icon at once`,
      !!three,
      three
        ? `"${three.label}" — value "${three.value}", dot and trailing icon all drawn, on one ${three.h}px line`
        : 'no line in the fixture carries all three',
    );

    // The name a screen reader is handed, from Chrome's own AX tree.
    const name = await axName(
      send,
      '#section-menu-settings [data-density="compact"] .strct-sm__item',
    );
    const first = cx.items[0];
    check(
      `${theme}: the value is part of the line's name`,
      name === `${first.label}, ${first.value}`,
      `Chrome computes "${name}" (label "${first.label}", value "${first.value}")`,
    );

    // The value ellipsises first, and the label keeps eight characters.
    const clipped = cx.items.filter((i) => i.valueClipped);
    const keep = cx.items.map((i) => ({
      label: i.label,
      chars: i.labelW / i.charW,
      cut: i.labelClipped,
    }));
    const tightest = keep.sort((a, b) => a.chars - b.chars)[0];
    check(
      `${theme}: the value gives way before the label does`,
      clipped.length > 0 &&
        clipped.every((i) => !i.labelClipped) &&
        keep.every((k) => k.chars >= KEEP),
      `${clipped.length} values ellipsised in a ${cx.navW}px menu, no label with them; the shortest label still shows ${tightest.chars.toFixed(1)} characters ("${tightest.label}", floor ${KEEP})`,
    );

    // The value is text, so 4.5:1 — including on the active line, whose own
    // background is translucent.
    const inked = cx.items.filter((i) => i.valueInk && !i.disabled);
    const ratios = inked.map((i) => ({
      label: i.label,
      active: i.active,
      ratio: contrast(parse(i.valueInk), composite(i.valueOn)),
    }));
    const weakest = ratios.sort((a, b) => a.ratio - b.ratio)[0];
    const activeOne = ratios.find((r) => r.active);
    check(
      `${theme}: the value reads against the surface it is on`,
      ratios.length > 0 && ratios.every((r) => r.ratio >= AA),
      `weakest ${weakest.ratio.toFixed(2)}:1 on "${weakest.label}"${activeOne ? `, active line ${activeOne.ratio.toFixed(2)}:1` : ''} of ${ratios.length} values (floor ${AA})`,
    );

    // FR-79-02: the step, and what it buys.
    const ch = [...new Set(cx.items.map((i) => i.h))];
    const chh = [...new Set(cx.heads.map((h) => h.h))];
    check(
      `${theme}: compact is a 26px line and a 22px head`,
      cx.items.every((i) => Math.abs(i.h - COMPACT_ITEM) <= 1) &&
        cx.heads.every((h) => Math.abs(h.h - COMPACT_HEAD) <= 1),
      `items ${ch.join(', ')}px (asked ${COMPACT_ITEM} ± 1), heads ${chh.join(', ')}px (asked ${COMPACT_HEAD} ± 1)`,
    );
    check(
      `${theme}: comfortable did not move`,
      cy.items.every((i) => Math.abs(i.h - COMFY_ITEM) <= 1) &&
        cy.heads.every((h) => Math.abs(h.h - COMFY_HEAD) <= 1),
      `items ${[...new Set(cy.items.map((i) => i.h))].join(', ')}px and heads ${[...new Set(cy.heads.map((h) => h.h))].join(', ')}px, as before the change (${COMFY_ITEM} / ${COMFY_HEAD})`,
    );
    check(
      `${theme}: the whole menu fits beside the form`,
      cx.total < cy.total,
      `${cy.total}px of a 760px window becomes ${cx.total}px — ${(cy.total - cx.total).toFixed(0)}px back for the settings themselves`,
    );
    check(
      `${theme}: a value is not a second thing to find`,
      m.focusable ===
        cx.items.filter((i) => !i.disabled).length + cy.items.filter((i) => !i.disabled).length,
      `${m.focusable} focusable things for ${cx.items.length + cy.items.length} lines, ${cx.items.filter((i) => i.disabled).length * 2} of them disabled — one per enabled line and nothing else`,
    );

    // ── The form ───────────────────────────────────────────────────────────
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/field` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.querySelector('#field-compact .strct-field--compact')`))
        break;
      await sleep(200);
    }
    await evaluate(send, `document.documentElement.setAttribute('data-theme', '${theme}')`);
    await sleep(600);
    const f = await evaluate(send, FIELDS);
    if (!f?.compact) {
      check(`${theme}: the compact form is on the page`, false, 'no #field-compact');
      break;
    }

    // FR-79-03: two rows with a one-line hint, and what they cost.
    const hinted = f.compact.rows.filter((r) => r.hint && r.hintLines === 1 && !r.hintWide);
    const pitches = f.compact.rows
      .map((r, i) => ({
        from: f.compact.rows[i - 1],
        to: r,
        pitch: i ? r.top - f.compact.rows[i - 1].top : null,
      }))
      .filter((p) => p.from && p.from.hint && p.from.hintLines === 1 && !p.from.hintWide);
    const worst = pitches.sort((a, b) => b.pitch - a.pitch)[0];
    check(
      `${theme}: a compact row with a one-line hint costs 44px or less`,
      pitches.length > 0 && pitches.every((p) => p.pitch <= PITCH),
      pitches.length
        ? `worst ${worst.pitch.toFixed(1)}px from "${worst.from.label}" (a ${worst.from.ctlH}px control and one line of hint, row ${worst.from.h}px) to "${worst.to.label}" — floor ${PITCH}px, and ${COMFY_PITCH[0]}px before the change`
        : 'no two consecutive one-line-hint rows in the fixture',
    );
    check(
      `${theme}: comfortable rows did not move`,
      f.comfortable.pitch.length === COMFY_PITCH.length &&
        f.comfortable.pitch.every((p, i) => Math.abs(p - COMFY_PITCH[i]) <= 0.6),
      `${f.comfortable.pitch.join(', ')}px, measured ${COMFY_PITCH.join(', ')}px before the change`,
    );

    // A hint wider than the label column goes under the control.
    const wide = f.compact.rows.filter((r) => r.hintWide);
    const narrow = f.compact.rows.filter((r) => r.hint && !r.hintWide);
    check(
      `${theme}: a hint too wide for the label column leaves it`,
      wide.length > 0 &&
        wide.every((r) => r.hintUnderLabel === false) &&
        narrow.length > 0 &&
        narrow.every((r) => r.hintUnderLabel === true),
      `${wide.length} wide hint(s) under the control ("${wide[0]?.label}", ${wide[0]?.hintLines} lines), ${narrow.length} that fit still under the label`,
    );
    check(
      `${theme}: the hint still describes its control wherever it lands`,
      f.compact.rows.filter((r) => r.hint).every((r) => r.describesHint) &&
        f.comfortable.rows.filter((r) => r.hint).every((r) => r.describesHint),
      `${f.compact.rows.filter((r) => r.hint).length} compact hints and ${f.comfortable.rows.filter((r) => r.hint).length} comfortable ones named by their control's aria-describedby, the moved one among them`,
    );
    check(
      `${theme}: compact adds nothing to tab through`,
      f.focusable ===
        f.compact.rows.filter((r) => r.ctlH !== null).length - 1 + f.comfortable.rows.length,
      `${f.focusable} focusable controls for ${f.compact.rows.length} compact and ${f.comfortable.rows.length} comfortable rows (one of the compact rows is a read-only value)`,
    );
  }
  // ── Every palette ──────────────────────────────────────────────────────
  // The value is --t2, and on the active line it is --acc on a translucent
  // --acc-m: 4.85:1 in arctic light is close enough to the floor that one
  // palette is not an answer for six.
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/section-menu` });
  for (let i = 0; i < 120; i++) {
    if (await evaluate(send, `!!document.querySelector('#section-menu-settings .strct-sm__value')`))
      break;
    await sleep(200);
  }
  const sweep = [];
  for (const palette of ['arctic', 'ember', 'sage']) {
    for (const theme of ['light', 'dark']) {
      await evaluate(
        send,
        `document.documentElement.setAttribute('data-palette', '${palette}');` +
          `document.documentElement.setAttribute('data-theme', '${theme}')`,
      );
      await sleep(400);
      for (const v of await evaluate(send, VALUES)) {
        if (v.disabled) continue;
        sweep.push({
          where: `${palette} ${theme}${v.active ? ' active' : ''}`,
          ratio: contrast(parse(v.ink), composite(v.on)),
        });
      }
    }
  }
  const low = sweep.sort((a, b) => a.ratio - b.ratio)[0];
  const lowActive = sweep
    .filter((x) => x.where.endsWith('active'))
    .sort((a, b) => a.ratio - b.ratio)[0];
  check(
    'the value reads in all six palettes',
    sweep.length > 0 && sweep.every((x) => x.ratio >= AA),
    `${sweep.length} readings over 3 palettes × 2 themes — weakest ${low.ratio.toFixed(2)}:1 (${low.where}), weakest active line ${lowActive.ratio.toFixed(2)}:1 (${lowActive.where}), floor ${AA}`,
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
  console.error(`\n✗ ${failed.length} of ${checks.length} settings-density checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} settings-density checks passed.`);
