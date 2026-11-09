/**
 * Weight carries rank: the claims of FR-67-04, -05, -06, -07 and -08, read
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
 *   list      every title in a list starts at the same x and every meta at
 *             the same one, however wide each row's leading marker is.
 *             Before 7.1 three titles began at x 395, 401 and 375.
 *
 * Every check runs in all six palettes. Before 7.1.1 it ran in two, which is
 * how a palette could have drifted without anything saying so: the pages are
 * loaded once each and the six schemes are applied to the loaded page, so six
 * palettes cost barely more than two did.
 *
 * jsdom has no layout and no computed colour, so this is the only place the
 * claims can be checked. Exits non-zero naming each one that failed.
 */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
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
/** What a disabled label must still read at, once its own opacity is in it.
 *  WCAG exempts an inactive control, but an operator still has to be able to
 *  tell Next from Finish (BUG-77-01). */
const DISABLED_LABEL = 3;
const parse = (css) => (css.match(/[\d.]+/g) ?? []).slice(0, 4).map(Number);
/** A border token is an rgba over the surface, so compare what is painted. */
const over = (css, surface) => {
  const f = parse(css);
  const b = parse(surface);
  const a = f[3] ?? 1;
  return [0, 1, 2].map((i) => f[i] * a + (b[i] ?? 255) * (1 - a));
};
/** Same as `over`, but onto a surface already resolved to channels. */
const onto = (css, rgb) => {
  const f = parse(css);
  const a = f[3] ?? 1;
  return [0, 1, 2].map((i) => f[i] * a + rgb[i] * (1 - a));
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

/**
 * What an element actually paints: its own background colour, then every solid
 * colour layer in background-image, composited over the nearest painting
 * ancestor. A tone laid on top of a component's own surface arrives as a
 * two-stop gradient, and `backgroundColor` alone cannot see it — reading only
 * that reports a tinted hero as identical to a quiet one.
 */
const SURFACE = `((el) => {
  const nums = (css) => (String(css).match(/[\\d.]+/g) ?? []).map(Number);
  const mix = (fg, bg) => {
    const f = nums(fg);
    const a = f.length > 3 ? f[3] : 1;
    return [0, 1, 2].map((i) => (f[i] ?? 0) * a + bg[i] * (1 - a));
  };
  const cs = getComputedStyle(el);
  let rgb = nums(${PAINTED}(el)).slice(0, 3);
  if (rgb.length < 3) rgb = [255, 255, 255];
  rgb = mix(cs.backgroundColor, rgb);
  for (const layer of (cs.backgroundImage || '').split(/,(?![^(]*\\))/)) {
    const stops = layer.match(/rgba?\\([^)]*\\)/g);
    if (stops && stops.every((s) => s === stops[0])) rgb = mix(stops[0], rgb);
  }
  return 'rgb(' + rgb.map((v) => Math.round(v)).join(', ') + ')';
})`;

const PALETTES = [
  ['arctic', 'light'],
  ['arctic', 'dark'],
  ['ember', 'light'],
  ['ember', 'dark'],
  ['sage', 'light'],
  ['sage', 'dark'],
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

  /** Load a route once; the palettes are then applied to the loaded page. */
  const open = async (route, ready) => {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${route}` });
    for (let i = 0; i < 120; i++) {
      if (await evaluate(send, `!!document.querySelector(${JSON.stringify(ready)})`)) break;
      await sleep(200);
    }
    await sleep(400);
  };
  const wear = async (palette, theme) => {
    await evaluate(
      send,
      `document.documentElement.setAttribute('data-palette', ${JSON.stringify(palette)}),
       document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)})`,
    );
    await sleep(220);
  };

  // ── the harness checks itself first ────────────────────────────────────
  // Applying six schemes to one loaded page is fast, and a fast green is
  // worth distrusting: if the attribute swap stopped working, every check
  // below would pass six times over on one palette and say nothing.
  await open('/components/button', '.doc__examples .strct-btn');
  const seen = new Map();
  for (const [palette, theme] of PALETTES) {
    await wear(palette, theme);
    seen.set(
      `${palette}/${theme}`,
      await evaluate(
        send,
        `getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() + ' ' +
         getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim()`,
      ),
    );
  }
  check(
    new Set(seen.values()).size === PALETTES.length,
    `the six schemes did not produce six different palettes — ` +
      [...seen].map(([k, v]) => `${k} ${v}`).join(', '),
  );

  // ── actions ────────────────────────────────────────────────────────────
  const READ_ACTIONS = `(() => {
    const row = document.querySelector('.doc__examples');
    const pick = (sel) => row.querySelector(sel);
    const read = (el) => el && {
      bg: getComputedStyle(el).backgroundColor,
      border: getComputedStyle(el).borderTopColor,
      weight: getComputedStyle(el).fontWeight,
      color: getComputedStyle(el).color,
      opacity: Number(getComputedStyle(el).opacity),
      text: el.textContent.trim().slice(0, 16),
    };
    return {
      surface: ${PAINTED}(row.querySelector('.strct-btn')),
      primary: read(pick('.strct-btn--primary')),
      critical: read(pick('.strct-btn--critical')),
      outline: read(pick('.strct-btn--outline')),
      flat: read(pick('.strct-btn--flat')),
      disabled: read(pick('.strct-btn:disabled')),
      // BUG-77-01: a disabled button took the fill away and left the
      // variant's ink behind, so a primary kept --inv on nothing.
      disabledPrimary: read(pick('.strct-btn--primary:disabled')),
      disabledLink: read(pick('.strct-btn--link:disabled')),
      neutral: read(pick('.strct-btn:not([class*="strct-btn--"])')),
      // BUG-76-03: solid is an opt-in fill for a NEUTRAL. On a variant that
      // is filled already it must change nothing — it used to win on source
      // order and paint a primary --bg-3, the same grey as a solid neutral.
      solidPrimary: read(pick('.strct-btn--primary.strct-btn--solid')),
      solidCritical: read(pick('.strct-btn--critical.strct-btn--solid')),
      solidNeutral: read(
        pick('.strct-btn--solid:not(.strct-btn--primary):not(.strct-btn--critical)'),
      ),
    };
  })()`;
  for (const [palette, theme] of PALETTES) {
    await wear(palette, theme);
    const where = `${palette}/${theme}`;
    const actions = await evaluate(send, READ_ACTIONS);
    for (const name of ['primary', 'critical']) {
      const v = actions[name];
      check(v && opaque(v.bg), `${where}: a ${name} action is not filled (background ${v?.bg})`);
      check(
        v && Number(v.weight) >= 600,
        `${where}: a ${name} action is not heavier than the row (font-weight ${v?.weight})`,
      );
    }
    for (const name of ['primary', 'critical']) {
      const plain = actions[name];
      const solid = actions[`solid${name[0].toUpperCase()}${name.slice(1)}`];
      check(
        solid && plain && solid.bg === plain.bg && solid.color === plain.color,
        `${where}: solid turns a ${name} into something else (${solid?.bg} against ${plain?.bg}) — it fills a neutral and is a no-op on a variant that is filled already`,
      );
      check(
        solid && actions.solidNeutral && solid.bg !== actions.solidNeutral.bg,
        `${where}: a solid ${name} is the same colour as a solid neutral (${solid?.bg}) — the action a page exists for reads as the quiet one`,
      );
    }
    // A disabled action is the quietest thing in the row, but it still has
    // to say what it is: a wizard whose Next cannot be read is a wizard the
    // operator cannot tell is waiting on them.
    for (const name of ['disabled', 'disabledPrimary', 'disabledLink']) {
      const v = actions[name];
      if (!v) continue;
      const surface = parse(actions.surface);
      const ink = over(v.color, actions.surface).map(
        (c, i) => c * v.opacity + surface[i] * (1 - v.opacity),
      );
      const ratio = contrast(ink, surface);
      check(
        ratio >= DISABLED_LABEL,
        `${where}: a ${name} button's label is ${ratio.toFixed(2)}:1 against its surface (floor ${DISABLED_LABEL}) — "${v.text}" at opacity ${v.opacity}`,
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
  }

  // ── field ──────────────────────────────────────────────────────────────
  await open('/components/input', '.doc__examples .strct-control');
  const READ_FIELD = `(async () => {
    const el = document.querySelector('.doc__examples .strct-control:not(:disabled)');
    const surface = ${PAINTED}(el);
    const rest = { bg: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderTopColor };
    el.focus();
    await new Promise((r) => setTimeout(r, 300));
    const focused = { border: getComputedStyle(el).borderTopColor };
    el.blur();
    return { rest, focused, surface };
  })()`;
  for (const [palette, theme] of PALETTES) {
    await wear(palette, theme);
    const where = `${palette}/${theme}`;
    const field = await evaluate(send, READ_FIELD, true);
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
  }

  // ── severity ───────────────────────────────────────────────────────────
  // Severity has to survive a screenshot with the hue taken out, so each tone
  // is read three ways: the surface it paints, the width of its rail and the
  // weight of its body. "A different colour" is too weak a yardstick on its
  // own — a 12% tone that *replaces* a component's own --bg-1 composites over
  // the page instead of over the component, and in a dark palette that lands
  // within 1.05:1 of the page, so the loudest thing on the screen reads as a
  // hole in it. Every tone is therefore held to a real step against the quiet
  // one beside it, and its text to AA on the surface it ends up with.
  const STEP = 1.07;

  const tones = async (label, route, ready, reader, quietKey, loud) => {
    await open(route, ready);
    for (const [palette, theme] of PALETTES) {
      await wear(palette, theme);
      const where = `${palette}/${theme}`;
      const read = await evaluate(send, reader);
      const have = Object.keys(read ?? {}).filter((k) => read[k]);
      check(
        have.length === Object.keys(read ?? {}).length && have.includes(quietKey),
        `${where}: the ${label} page shows ${have.join(', ') || 'nothing'} — these checks would read nothing`,
      );
      if (!read?.[quietKey]) continue;

      const quiet = parse(read[quietKey].paint).slice(0, 3);
      for (const tone of loud) {
        if (!read[tone]) continue;
        const paint = parse(read[tone].paint).slice(0, 3);
        const step = contrast(paint, quiet);
        check(
          step >= STEP,
          `${where}: a ${tone} ${label} paints ${step.toFixed(3)}:1 against a quiet one — its tone is landing on the page, not on the ${label}`,
        );
        const ink = contrast(onto(read[tone].ink, paint), paint);
        check(
          ink >= 4.5,
          `${where}: a ${tone} ${label}'s text clears only ${ink.toFixed(2)}:1 on its own tinted surface`,
        );
      }
      const rails = Object.fromEntries(
        Object.entries(read).map(([k, v]) => [k, v && parseFloat(v.rail)]),
      );
      check(
        rails[quietKey] < rails[loud[0]] && rails[loud[0]] < rails[loud[1]],
        `${where}: the ${label} rails do not step with severity (${Object.entries(rails)
          .map(([k, v]) => `${k} ${v}px`)
          .join(', ')})`,
      );
      if (read[loud[1]]?.body != null) {
        check(
          read[loud[1]].body > read[quietKey].body,
          `${where}: a ${loud[1]} ${label}'s body is set in ${read[loud[1]].body}, the same as a quiet one — the weight step is missing`,
        );
      }
    }
  };

  const READ_ALERTS = `(() => {
    const read = (sel) => {
      const el = document.querySelector('.doc__examples ' + sel);
      if (!el) return null;
      const body = el.querySelector('.strct-alert__body') ?? el;
      return {
        paint: ${SURFACE}(el),
        ink: getComputedStyle(body).color,
        rail: getComputedStyle(el).borderInlineStartWidth,
        body: parseInt(getComputedStyle(body).fontWeight, 10),
      };
    };
    return {
      info: read('.strct-alert:not([class*="--"])') ?? read('.strct-alert--info'),
      warning: read('.strct-alert--warning'),
      critical: read('.strct-alert--critical'),
    };
  })()`;
  await tones('alert', '/components/alert', '.doc__examples .strct-alert', READ_ALERTS, 'info', [
    'warning',
    'critical',
  ]);

  // A card is a 400px object, not a banner: a flooded one shouts where the
  // point was to be read first, so the tone is its header's and the weight
  // step is its body's.
  const READ_CARDS = `(() => {
    const read = (sel) => {
      const card = document.querySelector('.doc__examples ' + sel);
      if (!card) return null;
      const header = card.querySelector('.strct-card__header');
      const block = card.querySelector('.strct-card__block');
      return {
        paint: ${SURFACE}(header ?? card),
        ink: getComputedStyle(header ?? card).color,
        rail: getComputedStyle(card).borderInlineStartWidth,
        body: block ? parseInt(getComputedStyle(block).fontWeight, 10) : null,
      };
    };
    return {
      success: read('.strct-card--success'),
      warning: read('.strct-card--warning'),
      critical: read('.strct-card--critical'),
    };
  })()`;
  await tones(
    'card',
    '/components/card',
    '.doc__examples .strct-card--critical',
    READ_CARDS,
    'success',
    ['warning', 'critical'],
  );

  const READ_HEROES = `(() => {
    const read = (sel) => {
      const hero = document.querySelector('.doc__examples ' + sel);
      if (!hero) return null;
      const cs = getComputedStyle(hero);
      return { paint: ${SURFACE}(hero), ink: cs.color, rail: cs.borderInlineStartWidth };
    };
    return {
      success: read('.strct-hero--success'),
      warning: read('.strct-hero--warning'),
      critical: read('.strct-hero--critical'),
    };
  })()`;
  await tones(
    'hero',
    '/components/hero',
    '.doc__examples .strct-hero--critical',
    READ_HEROES,
    'success',
    ['warning', 'critical'],
  );

  // ── list ───────────────────────────────────────────────────────────────
  await open('/components/list', '.doc__examples .strct-li');
  const READ_LISTS = `(() => {
    const out = [];
    for (const list of document.querySelectorAll('.doc__examples .strct-list')) {
      const titles = [...list.querySelectorAll('.strct-li__title')];
      const leads = [...list.querySelectorAll('.strct-li__leading')].filter((e) => e.textContent.trim());
      // Only a list whose leading words differ in LENGTH can show the defect.
      // Their rendered widths cannot be the filter: once the fix is in they
      // share a track, so the test would stop testing.
      if (titles.length < 2 || leads.length < 2) continue;
      const words = new Set(leads.map((e) => e.textContent.trim().length));
      if (words.size < 2) continue;
      const x = (els) => els.map((e) => Math.round(e.getBoundingClientRect().left));
      const metas = [...list.querySelectorAll('.strct-li__meta')].filter((e) => e.textContent.trim());
      const spread = (v) => (v.length ? Math.max(...v) - Math.min(...v) : 0);
      out.push({ rows: titles.length, titles: spread(x(titles)), metas: spread(x(metas)) });
    }
    return out;
  })()`;
  for (const [palette, theme] of PALETTES) {
    await wear(palette, theme);
    const where = `${palette}/${theme}`;
    const spreads = await evaluate(send, READ_LISTS);
    check(
      spreads.length > 0,
      `${where}: no list on the page has leading markers of differing width, so the alignment cannot be read`,
    );
    for (const { rows, titles, metas } of spreads) {
      check(
        titles === 0,
        `${where}: a ${rows}-row list's titles start ${titles}px apart — a list is a table that hides its header`,
      );
      check(metas === 0, `${where}: a ${rows}-row list's metas start ${metas}px apart`);
    }
  }
} finally {
  await closeChrome();
  server.close();
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} of ${checks} checks failed:\n`);
  for (const line of problems) console.error(`  ${line}`);
  console.error('');
  process.exit(1);
}
console.log(
  `✓ ${checks} checks in ${PALETTES.length} palettes: weight carries rank, a field is a recess, ` +
    `severity rides on surface, a card groups by tone, a list aligns down its columns.`,
);
