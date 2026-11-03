/**
 * Weight carries rank: the four claims of FR-67-04, -05, -06 and -08, read
 * from the rendered page rather than asserted.
 *
 *   ng build showcase && node scripts/weight-ladder.mjs
 *
 * Each check fails on 6.5.0, which is the point of writing them:
 *
 *   actions   a primary and a critical are filled and heavier; outline and
 *             flat are not; a disabled action's edge is quieter than a
 *             neutral's. Before 7.0 every variant was a 1px outline at the
 *             same height and radius, only the text colour changed, and the
 *             disabled one was the only fill on the row.
 *   field     a field at rest is a recess: no border, and a fill at least
 *             1.07:1 from the surface behind it. Focus gives it an accent
 *             edge back. Before 7.0 a field and a button were the same box.
 *   severity  the four alert tones do not share one surface, and the rails
 *             step 3 / 4 / 5px. Before 7.0 all four were --bg-1 behind 3px.
 *   card      a composed card draws four border edges, not eight.
 *
 * jsdom has no layout and no computed colour, so this is the only place the
 * claims can be checked. Exits non-zero naming each one that failed.
 */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4705;
const CDP = 9405;
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
const chrome = spawn(
  chromeBin,
  [
    '--headless=new',
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

/** The palettes are `[data-palette][data-theme]` pairs on <html>. */
/** Relative luminance, for "is this fill actually a step from that one". */
const srgbToLinear = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => srgbToLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [luminance(a) + 0.05, luminance(b) + 0.05];
  return Math.max(x, y) / Math.min(x, y);
}
const parse = (css) => (css.match(/[\d.]+/g) ?? []).slice(0, 4).map(Number);
/** A border token is an rgba over the surface, so compare what is painted. */
const over = (css, surface) => {
  const f = parse(css);
  const b = parse(surface);
  const a = f[3] ?? 1;
  return [0, 1, 2].map((i) => f[i] * a + (b[i] ?? 255) * (1 - a));
};
const opaque = (css) => {
  const p = parse(css);
  return p.length >= 3 && (p[3] ?? 1) > 0.02;
};

/** The nearest ancestor that actually paints, which is what the eye compares to. */
const PAINTED = `((el) => { let n = el.parentElement;
  while (n) { const b = getComputedStyle(n).backgroundColor;
    if (b && !/, ?0\\)$/.test(b) && b !== 'transparent') return b; n = n.parentElement; }
  return getComputedStyle(document.body).backgroundColor; })`;

const THEMES = [
  ['arctic', 'light'],
  ['arctic', 'dark'],
];
const problems = [];
let checks = 0;
const check = (ok, line) => {
  checks++;
  if (!ok) problems.push(line);
};

try {
  const target = await cdpTarget();
  const { send } = await connect(target.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  // Without this a headless page never has document focus, so :focus matches
  // nothing however the element is focused and every focus style reads as
  // its resting value.
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  });

  for (const [palette, theme] of THEMES) {
    const open = async (route, ready) => {
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${route}` });
      for (let i = 0; i < 120; i++) {
        if (await evaluate(send, `!!document.querySelector(${JSON.stringify(ready)})`)) break;
        await sleep(200);
      }
      await evaluate(
        send,
        `document.documentElement.setAttribute('data-palette', ${JSON.stringify(palette)}),
         document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)})`,
      );
      await sleep(400);
    };
    const where = `${palette}/${theme}`;

    // ── actions ──────────────────────────────────────────────────────────
    await open('/components/button', '.doc__examples .strct-btn');
    const actions = await evaluate(
      send,
      `(() => {
        const row = document.querySelector('.doc__examples');
        const pick = (sel) => row.querySelector(sel);
        const read = (el) => el && {
          bg: getComputedStyle(el).backgroundColor,
          border: getComputedStyle(el).borderTopColor,
          weight: getComputedStyle(el).fontWeight,
        };
        return {
          surface: ${PAINTED}(row.querySelector('.strct-btn')),
          primary: read(pick('.strct-btn--primary')),
          critical: read(pick('.strct-btn--critical')),
          outline: read(pick('.strct-btn--outline')),
          flat: read(pick('.strct-btn--flat')),
          disabled: read(pick('.strct-btn:disabled')),
          neutral: read(pick('.strct-btn:not([class*="strct-btn--"])')),
        };
      })()`,
    );
    for (const name of ['primary', 'critical']) {
      const v = actions[name];
      check(v && opaque(v.bg), `${where}: a ${name} action is not filled (background ${v?.bg})`);
      check(
        v && Number(v.weight) >= 600,
        `${where}: a ${name} action is not heavier than the row (font-weight ${v?.weight})`,
      );
    }
    for (const name of ['outline', 'flat']) {
      check(
        actions[name] && !opaque(actions[name].bg),
        `${where}: ${name} carries a fill (${actions[name]?.bg}) — only primary and critical do`,
      );
    }
    check(
      actions.disabled && !opaque(actions.disabled.bg),
      `${where}: a disabled action is filled (${actions.disabled?.bg}) — it is the lightest thing in the row, not the heaviest`,
    );
    if (actions.disabled && actions.neutral) {
      const surface = parse(actions.surface);
      const quiet = contrast(over(actions.disabled.border, actions.surface), surface);
      const loud = contrast(over(actions.neutral.border, actions.surface), surface);
      check(
        quiet < loud,
        `${where}: a disabled action's edge is ${quiet.toFixed(3)}:1 from the surface and a ` +
          `neutral's is ${loud.toFixed(3)}:1 — the disabled one has to be the quieter`,
      );
    }

    // ── field ────────────────────────────────────────────────────────────
    await open('/components/input', '.doc__examples .strct-control');
    const field = await evaluate(
      send,
      `(async () => {
        const el = document.querySelector('.doc__examples .strct-control:not(:disabled)');
        const surface = ${PAINTED}(el);
        const rest = { bg: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderTopColor };
        el.focus();
        await new Promise((r) => setTimeout(r, 300));
        const focused = { border: getComputedStyle(el).borderTopColor };
        el.blur();
        return { rest, focused, surface,
                 accent: getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() };
      })()`,
      true,
    );
    check(
      !opaque(field.rest.border),
      `${where}: a field still draws a border at rest (${field.rest.border}) — it should read as a recess`,
    );
    const step = contrast(parse(field.rest.bg), parse(field.surface));
    check(
      step >= 1.07,
      `${where}: a field's fill is ${step.toFixed(3)}:1 from the surface behind it, under 1.07:1`,
    );
    check(
      field.focused.border !== field.rest.border && opaque(field.focused.border),
      `${where}: focus does not give the field an edge back (${field.focused.border})`,
    );

    // ── severity ─────────────────────────────────────────────────────────
    await open('/components/alert', '.doc__examples .strct-alert');
    const alerts = await evaluate(
      send,
      `(() => {
        const read = (sel) => { const el = document.querySelector('.doc__examples ' + sel);
          return el && { bg: getComputedStyle(el).backgroundColor, rail: getComputedStyle(el).borderInlineStartWidth }; };
        return { info: read('.strct-alert:not([class*="--"])') ?? read('.strct-alert--info'),
                 success: read('.strct-alert--success'),
                 warning: read('.strct-alert--warning'),
                 critical: read('.strct-alert--critical') };
      })()`,
    );
    const tones = Object.entries(alerts).filter(([, v]) => v);
    const surfaces = new Set(tones.map(([, v]) => v.bg));
    check(
      surfaces.size > 1,
      `${where}: all ${tones.length} alert tones share one surface (${[...surfaces][0]}) — severity cannot be hue alone`,
    );
    const rail = (n) => parseFloat(alerts[n]?.rail ?? 'NaN');
    check(
      rail('warning') > rail('info') && rail('critical') > rail('warning'),
      `${where}: the rails do not step with severity (info ${alerts.info?.rail}, warning ${alerts.warning?.rail}, critical ${alerts.critical?.rail})`,
    );

    // ── card ─────────────────────────────────────────────────────────────
    await open('/components/card', '.doc__examples .strct-card');
    const edges = await evaluate(
      send,
      `(() => {
        const card = document.querySelector('.doc__examples .strct-card');
        const sides = ['Top', 'Right', 'Bottom', 'Left'];
        const drawn = (el) => { const s = getComputedStyle(el);
          return sides.filter((d) => s['border' + d + 'Width'] !== '0px'
            && s['border' + d + 'Style'] !== 'none'
            && !/, 0\\)$/.test(s['border' + d + 'Color'])).length; };
        let total = drawn(card);
        for (const el of card.querySelectorAll('.strct-card__header, .strct-card__block, .strct-card__footer')) total += drawn(el);
        return total;
      })()`,
    );
    check(
      edges <= 4,
      `${where}: a composed card draws ${edges} border edges — a card groups by tone, not by a second fence`,
    );
  }
} finally {
  chrome.kill();
  server.close();
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} of ${checks} checks failed:\n`);
  for (const line of problems) console.error(`  ${line}`);
  console.error('');
  process.exit(1);
}
console.log(
  `✓ ${checks} checks: weight carries rank, a field is a recess, severity rides on surface, a card groups by tone.`,
);
