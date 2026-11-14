/**
 * FR-80-05: a step the path left out, and focus after a move the wizard did
 * not make.
 *
 * An Add Node run whose servers are already nodes goes Prerequisites → Ready
 * to add, and one that joins without validating goes Scope → Ready to add.
 * The rail marked every step below the furthest one reached as done, so the
 * wizard showed a check on Validate and on Decide for a run that validated
 * nothing: the rail said a validation was made that was not. And a button
 * inside a step's content that sets `current` itself — "Back to the scope" —
 * goes away with the content it sits in, so focus fell to <body> and the next
 * Tab started from the top of the document.
 *
 * Both are things only a browser can answer, so both are asked of one: the
 * rail's state and its disabled buttons from the layout, the step's name from
 * Chrome's own accessibility tree, and where focus actually lands from
 * document.activeElement after a real click.
 *
 *   node scripts/wizard-skipped.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execSync } from 'node:child_process';

const ROOT = resolve('dist/showcase/browser');
const PORT = 4717;
const CDP = 9417;
/** The steps the Add Node path leaves out, and the one it goes back to. */
const SKIPPED = ['Validate', 'Decide'];
const BACK_TO = 'Scope';

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

/** The rail, the content title, and where focus is. */
const STATE = `(() => {
  const wrap = document.querySelector('[data-wiz="skip"]');
  if (!wrap) return null;
  const rail = [...wrap.querySelectorAll('.strct-wiz__vstep')].map((el) => ({
    label: el.querySelector('.strct-wiz__vlabel').textContent.trim(),
    done: el.classList.contains('strct-wiz__vstep--done'),
    active: el.classList.contains('strct-wiz__vstep--active'),
    skipped: el.classList.contains('strct-wiz__vstep--skipped'),
    disabled: el.disabled === true,
    ariaCurrent: el.getAttribute('aria-current'),
    struck: getComputedStyle(el.querySelector('.strct-wiz__vlabel')).textDecorationLine,
  }));
  const active = document.activeElement;
  return {
    rail,
    title: wrap.querySelector('.strct-wiz__ctitle')?.textContent.trim() ?? null,
    focus: active
      ? {
          tag: active.tagName.toLowerCase(),
          cls: active.className,
          text: (active.textContent ?? '').replace(/\\s+/g, ' ').trim().slice(0, 40),
          isTitle: active.classList.contains('strct-wiz__ctitle'),
          isBody: active === document.body,
        }
      : null,
    tabbable: wrap.querySelectorAll(
      '.strct-wiz__vstep:not(:disabled), .strct-wiz__foot button:not(:disabled)',
    ).length,
  };
})()`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
let up = false;

/** Chrome's own accessible name for one element. */
async function axName(send, selector) {
  const { root } = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) return null;
  const { nodes } = await send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return nodes.find((n) => n.name?.value)?.name?.value ?? null;
}

async function load(send) {
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/components/wizard` });
  for (let i = 0; i < 120; i++) {
    if (await evaluate(send, `!!document.querySelector('[data-wiz="skip"] .strct-wiz__vstep')`))
      break;
    await sleep(200);
  }
  await evaluate(
    send,
    `document.querySelector('#wizard-skipped')?.scrollIntoView({ block: 'start' })`,
  );
  await sleep(500);
  return evaluate(send, STATE);
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

  let s = await load(send);
  check(
    'the case is on the page',
    !!s &&
      s.rail.length === 6 &&
      s.rail.filter((r) => r.skipped).length === SKIPPED.length &&
      s.rail.at(-1).active,
    s
      ? `${s.rail.length} steps, ${s.rail.filter((r) => r.skipped).map((r) => r.label).join(' and ')} skipped, the wizard on "${s.rail.find((r) => r.active)?.label}"`
      : 'no [data-wiz="skip"] fixture',
  );

  const skipped = s.rail.filter((r) => SKIPPED.includes(r.label));
  const names = [];
  for (const label of SKIPPED) {
    const i = s.rail.findIndex((r) => r.label === label);
    names.push(
      await axName(send, `[data-wiz="skip"] .strct-wiz__vstep:nth-of-type(${i + 1})`),
    );
  }
  check(
    'a step the path left out is not drawn done',
    skipped.length === SKIPPED.length &&
      skipped.every((r) => !r.done && r.skipped && !r.active && r.struck.includes('line-through')),
    `${skipped.map((r) => `"${r.label}" done=${r.done} struck=${r.struck}`).join(', ')} — the rail used to show a check on both`,
  );
  check(
    'it is not a destination, and it says why',
    skipped.every((r) => r.disabled) && names.every((n, i) => n === `${SKIPPED[i]}, skipped`),
    `both rail buttons disabled; Chrome computes ${names.map((n) => `"${n}"`).join(' and ')}`,
  );

  const walked = s.rail.filter((r) => !SKIPPED.includes(r.label) && !r.active);
  check(
    'the steps actually walked still read as done',
    walked.filter((r) => r.done).length === 3 && walked.every((r) => !r.skipped),
    `${walked.filter((r) => r.done).map((r) => r.label).join(', ')} done, none of them marked skipped`,
  );

  // A disabled rail button is not a way in, by click or by keyboard.
  const before = s.rail.findIndex((r) => r.active);
  await evaluate(
    send,
    `document.querySelectorAll('[data-wiz="skip"] .strct-wiz__vstep')[3].click()`,
  );
  await sleep(300);
  s = await evaluate(send, STATE);
  check(
    'clicking a skipped step changes nothing',
    s.rail.findIndex((r) => r.active) === before && s.tabbable === 6,
    `the wizard stayed on "${s.rail.find((r) => r.active)?.label}"; ${s.tabbable} things to tab to in the fixture, the two skipped buttons not among them`,
  );

  // ── Focus, after a step the app changed from inside the content ────────
  await evaluate(
    send,
    `(() => { const b = document.querySelector('[data-wiz="skip"] .ws-demo__back'); b.focus(); b.click(); })()`,
  );
  await sleep(400);
  s = await evaluate(send, STATE);
  check(
    'focus lands on the new step, not on <body>',
    s.title === BACK_TO && s.focus?.isTitle === true && s.focus?.text === BACK_TO,
    `after "Back to the scope": the content header reads "${s.title}" and document.activeElement is ${s.focus?.isBody ? '<body>' : `.${s.focus?.cls} ("${s.focus?.text}")`}`,
  );

  // ── And a move the wizard makes itself leaves focus alone ──────────────
  s = await load(send);
  await evaluate(
    send,
    `(() => {
       const b = [...document.querySelectorAll('[data-wiz="skip"] .strct-wiz__foot button')].at(-1);
       b.focus();
       b.click();
     })()`,
  );
  await sleep(400);
  const after = await evaluate(send, STATE);
  check(
    'a move the wizard makes itself keeps focus on the control pressed',
    after.focus?.tag === 'button' && !after.focus?.isTitle && !after.focus?.isBody,
    `focus is still the ${after.focus?.tag} reading "${after.focus?.text}"`,
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
  console.error(`\n✗ ${failed.length} of ${checks.length} wizard-skipped checks failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} wizard-skipped checks passed.`);
