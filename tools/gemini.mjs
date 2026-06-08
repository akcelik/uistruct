#!/usr/bin/env node
/**
 * Minimal Gemini (Google Generative Language) CLI.
 *
 * Used to pre-process / reformat prompts before the main agent acts on them. The
 * API key is read from the GEMINI_API_KEY env var or a gitignored `.gemini.key`
 * file at the repo root — it is never committed and never hard-coded here. The key
 * is sent in the `x-goog-api-key` header (not the URL) so it never lands in logs.
 *
 * Usage:
 *   node tools/gemini.mjs --list-models
 *   echo "Reformat this request…" | node tools/gemini.mjs --system "You are a prompt clarifier."
 *   node tools/gemini.mjs --model gemini-2.5-pro --max-tokens 4000 < prompt.txt
 *
 * Output: the model's text goes to stdout; token usage goes to stderr.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (
  process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'
).replace(/\/+$/, '');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const has = (name) => args.includes(name);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};

function getKey() {
  if (process.env.GEMINI_API_KEY?.trim()) return process.env.GEMINI_API_KEY.trim();
  try {
    return readFileSync(join(ROOT, '.gemini.key'), 'utf8').trim();
  } catch {
    console.error(
      'No GEMINI API key found. Set GEMINI_API_KEY or create a .gemini.key file at the repo root (gitignored).',
    );
    process.exit(2);
  }
}

const key = getKey();

async function main() {
  if (has('--list-models')) {
    const r = await fetch(`${BASE}/models`, { headers: { 'x-goog-api-key': key } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('Gemini /models error', r.status, JSON.stringify(j));
      process.exitCode = 1;
      return;
    }
    console.log(
      (j.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''))
        .join('\n'),
    );
    return;
  }

  const model = opt('--model', process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  const system = opt('--system', '');
  const temperature = Number(opt('--temp', '0.3'));
  const maxTokens = Number(opt('--max-tokens', '8192'));

  let prompt = opt('--prompt', null);
  if (prompt == null) prompt = readFileSync(0, 'utf8'); // stdin
  if (!prompt.trim()) {
    console.error('Empty prompt. Pass text via stdin or --prompt "…".');
    process.exit(2);
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };
  if (system) body.system_instruction = { parts: [{ text: system }] };

  const r = await fetch(`${BASE}/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('Gemini error', r.status, JSON.stringify(data));
    process.exitCode = 1;
    return;
  }
  if (has('--raw')) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text || '').join('');
  process.stdout.write(text);
  if (!text && cand?.finishReason) {
    console.error(`\n[gemini] no text — finishReason=${cand.finishReason}`);
  }
  const u = data.usageMetadata;
  if (u) {
    console.error(
      `\n[gemini usage] prompt=${u.promptTokenCount} output=${u.candidatesTokenCount ?? 0} total=${u.totalTokenCount} model=${model}`,
    );
  }
}

main().catch((e) => {
  console.error('Gemini request failed:', e.message);
  process.exitCode = 1;
});
