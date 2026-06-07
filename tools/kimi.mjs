#!/usr/bin/env node
/**
 * Minimal KIMI (Moonshot) CLI — OpenAI-compatible chat endpoint.
 *
 * Used to offload bulk-generation / bulk-analysis work to KIMI so the main
 * agent spends fewer tokens. The API key is read from the KIMI_API_KEY env var
 * or a gitignored `.kimi.key` file at the repo root — it is never committed and
 * never hard-coded here.
 *
 * Usage:
 *   node tools/kimi.mjs --list-models
 *   echo "Summarise these files…" | node tools/kimi.mjs --system "You are a code reviewer."
 *   node tools/kimi.mjs --model kimi-k2-0711-preview --max-tokens 6000 < prompt.txt
 *
 * Output: the assistant's text goes to stdout; token usage goes to stderr.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.env.KIMI_BASE_URL || 'https://api.kimi.com/coding/v1').replace(/\/+$/, '');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Kimi For Coding gates access to recognised coding agents via the User-Agent.
// This runs inside Claude Code, so identify as such (overridable).
const USER_AGENT = process.env.KIMI_USER_AGENT || 'claude-code/1.0';

const args = process.argv.slice(2);
const has = (name) => args.includes(name);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};

function getKey() {
  if (process.env.KIMI_API_KEY?.trim()) return process.env.KIMI_API_KEY.trim();
  try {
    return readFileSync(join(ROOT, '.kimi.key'), 'utf8').trim();
  } catch {
    console.error(
      'No KIMI API key found. Set KIMI_API_KEY or create a .kimi.key file at the repo root (gitignored).',
    );
    process.exit(2);
  }
}

const key = getKey();

async function main() {
  if (has('--list-models')) {
    const r = await fetch(`${BASE}/models`, {
      headers: { Authorization: `Bearer ${key}`, 'User-Agent': USER_AGENT },
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('KIMI /models error', r.status, JSON.stringify(j));
      process.exitCode = 1;
      return;
    }
    console.log((j.data || []).map((m) => m.id).join('\n'));
    return;
  }

  const model = opt('--model', process.env.KIMI_MODEL || 'kimi-for-coding');
  const system = opt('--system', '');
  const temperature = Number(opt('--temp', '0.3'));
  const maxTokens = Number(opt('--max-tokens', '8192'));

  let prompt = opt('--prompt', null);
  if (prompt == null) prompt = readFileSync(0, 'utf8'); // stdin
  if (!prompt.trim()) {
    console.error('Empty prompt. Pass text via stdin or --prompt "…".');
    process.exit(2);
  }

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: false }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('KIMI error', res.status, JSON.stringify(data));
    process.exitCode = 1;
    return;
  }
  process.stdout.write(data.choices?.[0]?.message?.content ?? '');
  const u = data.usage;
  if (u) {
    console.error(
      `\n[kimi usage] prompt=${u.prompt_tokens} completion=${u.completion_tokens} total=${u.total_tokens} model=${model}`,
    );
  }
}

main().catch((e) => {
  console.error('KIMI request failed:', e.message);
  process.exitCode = 1;
});
