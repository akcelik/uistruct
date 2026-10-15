/**
 * A Markdown reader that produces plain objects — never HTML.
 *
 * A model's reply is Markdown, and an app that reaches for a Markdown library
 * ends up handing the browser a string of HTML (`innerHTML` plus a sanitiser),
 * which a sealed, reviewed build cannot accept. This reader returns a tree the
 * templates draw with ordinary bindings, so every word reaches the page as a
 * text node and raw HTML is shown as the characters it is.
 *
 * It is deliberately a subset of CommonMark + GFM: paragraphs, ATX headings,
 * fenced code, lists (nested), block quotes, thematic breaks, tables with
 * alignment, and inline emphasis / strong / strikethrough / code / links /
 * autolinks. Everything else is text.
 *
 * Every loop is bounded, because the input is a remote model's output.
 */

/** Hard limits, so hostile input costs a known amount of work. */
export const STRCT_MD_LIMITS = {
  /** Characters of source read at all. */
  source: 256 * 1024,
  /** Lines read at all. */
  lines: 20000,
  /** How deep lists and quotes may nest. */
  depth: 8,
  /** Inline delimiter runs considered per text span. */
  delimiters: 2000,
} as const;

export type StrctMdAlign = 'start' | 'center' | 'end' | null;

export type StrctMdInline =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: StrctMdInline[] }
  | { kind: 'em'; children: StrctMdInline[] }
  | { kind: 'del'; children: StrctMdInline[] }
  | { kind: 'link'; href: string; children: StrctMdInline[] }
  | { kind: 'break' }
  /** A span the consumer claimed through `tokens` — an object chip, a mention. */
  | { kind: 'token'; token: string; text: string; data?: unknown };

export type StrctMdBlock =
  | { kind: 'p'; inlines: StrctMdInline[] }
  | { kind: 'heading'; level: number; inlines: StrctMdInline[] }
  | { kind: 'code'; text: string; lang: string; closed: boolean }
  | { kind: 'list'; ordered: boolean; start: number; items: StrctMdBlock[][] }
  | { kind: 'quote'; blocks: StrctMdBlock[] }
  | { kind: 'rule' }
  | {
      kind: 'table';
      head: StrctMdInline[][];
      rows: StrctMdInline[][][];
      align: StrctMdAlign[];
    };

/** What a consumer's `tokens` function returns for one run of text. */
export interface StrctMdToken {
  /** Where the token starts in the text it was found in. */
  start: number;
  /** How many characters it covers. */
  length: number;
  /** Which template draws it. */
  token: string;
  /** Anything the template needs. */
  data?: unknown;
}

export type StrctMdTokenizer = (text: string) => StrctMdToken[];

const RULE = /^ {0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/;
const ATX = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^`]*)$/;
const UL = /^(\s*)([-*+])\s+(.*)$/;
const OL = /^(\s*)(\d{1,9})[.)]\s+(.*)$/;
const QUOTE = /^ {0,3}>\s?(.*)$/;
const TABLE_DELIM = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

/**
 * Read Markdown into blocks.
 *
 * `streaming` says the source may be cut mid-token: an unterminated fence is
 * still a code block, so a reply that streams code looks like code from its
 * first line rather than flashing as a paragraph and then becoming one.
 */
export function strctParseMarkdown(
  source: string,
  options: { streaming?: boolean; tokenize?: StrctMdTokenizer } = {},
): StrctMdBlock[] {
  const text =
    source.length > STRCT_MD_LIMITS.source ? source.slice(0, STRCT_MD_LIMITS.source) : source;
  const lines = text.replace(/\r\n?/g, '\n').split('\n').slice(0, STRCT_MD_LIMITS.lines);
  return parseBlocks(lines, 0, options);
}

function parseBlocks(
  lines: string[],
  depth: number,
  options: { streaming?: boolean; tokenize?: StrctMdTokenizer },
): StrctMdBlock[] {
  const out: StrctMdBlock[] = [];
  let i = 0;
  const paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    out.push({ kind: 'p', inlines: parseInlines(paragraph.join('\n'), options) });
    paragraph.length = 0;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Blank line: ends a paragraph, nothing else.
    if (!line.trim()) {
      flushParagraph();
      i++;
      continue;
    }

    // Fenced code. An unclosed fence is still code while streaming.
    const fence = FENCE.exec(line);
    if (fence) {
      flushParagraph();
      const marker = fence[1][0];
      const width = fence[1].length;
      const lang = fence[2].trim();
      const body: string[] = [];
      let closed = false;
      i++;
      while (i < lines.length) {
        const candidate = lines[i];
        const end = new RegExp(`^ {0,3}${marker === '`' ? '`' : '~'}{${width},}\\s*$`).test(
          candidate,
        );
        if (end) {
          closed = true;
          i++;
          break;
        }
        body.push(candidate);
        i++;
      }
      out.push({ kind: 'code', text: body.join('\n'), lang, closed });
      continue;
    }

    // Thematic break.
    if (RULE.test(line)) {
      flushParagraph();
      out.push({ kind: 'rule' });
      i++;
      continue;
    }

    // ATX heading.
    const atx = ATX.exec(line);
    if (atx) {
      flushParagraph();
      out.push({
        kind: 'heading',
        level: atx[1].length,
        inlines: parseInlines(atx[2], options),
      });
      i++;
      continue;
    }

    // Block quote: take the run of quoted lines and read them as blocks.
    const quote = QUOTE.exec(line);
    if (quote && depth < STRCT_MD_LIMITS.depth) {
      flushParagraph();
      const inner: string[] = [];
      while (i < lines.length) {
        const m = QUOTE.exec(lines[i]);
        if (m) {
          inner.push(m[1]);
          i++;
        } else if (lines[i].trim() && inner.length) {
          // A lazy continuation line belongs to the quote's last paragraph.
          inner.push(lines[i]);
          i++;
        } else break;
      }
      out.push({ kind: 'quote', blocks: parseBlocks(inner, depth + 1, options) });
      continue;
    }

    // Table: a header row followed by a delimiter row.
    if (line.includes('|') && i + 1 < lines.length && TABLE_DELIM.test(lines[i + 1])) {
      flushParagraph();
      const head = splitRow(lines[i]).map((c) => parseInlines(c, options));
      const align = splitRow(lines[i + 1]).map(toAlign);
      const rows: StrctMdInline[][][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitRow(lines[i]).map((c) => parseInlines(c, options)));
        i++;
      }
      out.push({ kind: 'table', head, align, rows });
      continue;
    }

    // Lists.
    const item = UL.exec(line) ?? OL.exec(line);
    if (item && depth < STRCT_MD_LIMITS.depth) {
      flushParagraph();
      const ordered = !UL.test(line);
      const start = ordered ? Number(OL.exec(line)![2]) : 1;
      const items: StrctMdBlock[][] = [];
      const baseIndent = item[1].length;
      while (i < lines.length) {
        const m = UL.exec(lines[i]) ?? OL.exec(lines[i]);
        const sameKind = m && !UL.test(lines[i]) === ordered;
        if (!m || !sameKind || m[1].length < baseIndent) break;
        if (m[1].length > baseIndent) break; // a deeper list is the item's own
        const buffer: string[] = [m[3]];
        i++;
        // Continuation lines: anything indented past the marker, and blanks
        // between them, belong to this item.
        while (i < lines.length) {
          const next = lines[i];
          if (!next.trim()) {
            const after = lines[i + 1] ?? '';
            if (after.trim() && /^\s{2,}/.test(after)) {
              buffer.push('');
              i++;
              continue;
            }
            break;
          }
          if (/^\s{2,}/.test(next) && !UL.test(next.slice(baseIndent)) === false) {
            buffer.push(
              next.slice(Math.min(baseIndent + 2, next.length - next.trimStart().length)),
            );
            i++;
            continue;
          }
          if (/^\s{2,}/.test(next)) {
            buffer.push(next.trimStart());
            i++;
            continue;
          }
          break;
        }
        items.push(parseBlocks(buffer, depth + 1, options));
      }
      out.push({ kind: 'list', ordered, start, items });
      continue;
    }

    paragraph.push(line);
    i++;
  }
  flushParagraph();
  return out;
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let cur = '';
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '\\' && trimmed[i + 1] === '|') {
      cur += '|';
      i++;
      continue;
    }
    if (ch === '|') {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function toAlign(cell: string): StrctMdAlign {
  const c = cell.trim();
  const left = c.startsWith(':');
  const right = c.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'end';
  if (left) return 'start';
  return null;
}

/**
 * Inline reading. Code spans win over everything (their content is literal),
 * then links, then the emphasis delimiters — each bounded.
 */
export function parseInlines(
  source: string,
  options: { tokenize?: StrctMdTokenizer } = {},
): StrctMdInline[] {
  const out: StrctMdInline[] = [];
  let buf = '';
  let i = 0;
  let budget = STRCT_MD_LIMITS.delimiters;

  const flush = () => {
    if (!buf) return;
    out.push(...applyTokens(buf, options.tokenize));
    buf = '';
  };

  while (i < source.length) {
    const ch = source[i];

    // A backslash escapes the next punctuation character.
    if (ch === '\\' && i + 1 < source.length && /[\\`*_{}[\]()#+\-.!|~>]/.test(source[i + 1])) {
      buf += source[i + 1];
      i += 2;
      continue;
    }

    // Code span: the longest run of backticks closes it.
    if (ch === '`') {
      const run = /^`+/.exec(source.slice(i))![0];
      const close = source.indexOf(run, i + run.length);
      if (close !== -1) {
        flush();
        out.push({ kind: 'code', text: source.slice(i + run.length, close).trim() });
        i = close + run.length;
        continue;
      }
    }

    // Hard break: two spaces at the end of a line, or a backslash.
    if (ch === '\n') {
      const hard = buf.endsWith('  ') || buf.endsWith('\\');
      buf = buf.replace(/( {2,}|\\)$/, '');
      flush();
      out.push(hard ? { kind: 'break' } : { kind: 'text', text: ' ' });
      i++;
      continue;
    }

    // Autolink.
    if (ch === '<') {
      const auto = /^<((?:https?:\/\/|mailto:)[^ >]+)>/.exec(source.slice(i));
      if (auto) {
        flush();
        out.push({ kind: 'link', href: auto[1], children: [{ kind: 'text', text: auto[1] }] });
        i += auto[0].length;
        continue;
      }
    }

    // Link. An image is read as a link's text — nothing is ever loaded.
    if ((ch === '[' || (ch === '!' && source[i + 1] === '[')) && budget-- > 0) {
      const at = ch === '!' ? i + 1 : i;
      const close = matchBracket(source, at);
      if (close !== -1 && source[close + 1] === '(') {
        const end = source.indexOf(')', close + 2);
        if (end !== -1) {
          const label = source.slice(at + 1, close);
          const href = source
            .slice(close + 2, end)
            .trim()
            .split(/\s+/)[0];
          flush();
          if (ch === '!') {
            // An image's alt text is all a reader gets: no request is made.
            out.push({ kind: 'text', text: label });
          } else {
            out.push({ kind: 'link', href, children: parseInlines(label, options) });
          }
          i = end + 1;
          continue;
        }
      }
    }

    // Emphasis, strong, strikethrough. A delimiter only opens when something
    // follows it immediately and only closes when something precedes it —
    // the flanking rule, which is what keeps "2 * 3 * 4" arithmetic.
    if ((ch === '*' || ch === '_' || ch === '~') && budget-- > 0) {
      const run = new RegExp(`^\\${ch}+`).exec(source.slice(i))![0];
      const len = ch === '~' ? (run.length >= 2 ? 2 : 0) : Math.min(run.length, 2);
      const opens = !/^\s|^$/.test(source.slice(i + run.length, i + run.length + 1) || '');
      if (len && opens) {
        const marker = ch.repeat(len);
        const close = findCloser(source, marker, i + len);
        if (close !== -1 && close > i + len) {
          const inner = source.slice(i + len, close);
          flush();
          const children = parseInlines(inner, options);
          out.push(
            ch === '~'
              ? { kind: 'del', children }
              : len === 2
                ? { kind: 'strong', children }
                : { kind: 'em', children },
          );
          i = close + len;
          continue;
        }
      }
    }

    buf += ch;
    i++;
  }
  flush();
  return out;
}

/**
 * The next closing delimiter: one with a non-space before it. An opener with
 * no such closer is not a delimiter at all, it is the character written.
 */
function findCloser(source: string, marker: string, from: number): number {
  let at = source.indexOf(marker, from);
  while (at !== -1) {
    const before = source[at - 1];
    if (before && !/\s/.test(before)) return at;
    at = source.indexOf(marker, at + marker.length);
  }
  return -1;
}

/** The index of the `]` matching the `[` at `from`, or -1. */
function matchBracket(source: string, from: number): number {
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    if (source[i] === '\\') {
      i++;
      continue;
    }
    if (source[i] === '[') depth++;
    else if (source[i] === ']') {
      depth--;
      if (!depth) return i;
    }
  }
  return -1;
}

/** Hand a run of plain text to the consumer's tokenizer, if it gave one. */
function applyTokens(text: string, tokenize?: StrctMdTokenizer): StrctMdInline[] {
  if (!tokenize) return [{ kind: 'text', text }];
  let found: StrctMdToken[];
  try {
    found = tokenize(text) ?? [];
  } catch {
    return [{ kind: 'text', text }];
  }
  const valid = found
    .filter((t) => t && t.length > 0 && t.start >= 0 && t.start + t.length <= text.length)
    .sort((a, b) => a.start - b.start);
  const out: StrctMdInline[] = [];
  let at = 0;
  for (const t of valid) {
    if (t.start < at) continue; // overlapping claims are dropped
    if (t.start > at) out.push({ kind: 'text', text: text.slice(at, t.start) });
    out.push({
      kind: 'token',
      token: t.token,
      text: text.slice(t.start, t.start + t.length),
      data: t.data,
    });
    at = t.start + t.length;
  }
  if (at < text.length) out.push({ kind: 'text', text: text.slice(at) });
  return out.length ? out : [{ kind: 'text', text }];
}

/**
 * What a link may do. Anything that is not plainly safe stays the text the
 * model wrote: `javascript:`, `data:`, a protocol-relative `//host`, or
 * anything this does not recognise.
 */
export function strctClassifyHref(href: string): 'external' | 'internal' | null {
  const raw = (href ?? '').trim();
  if (!raw) return null;
  // Control characters and whitespace inside a URL are a smuggling trick.
  if (/[\u0000-\u001f\u007f\s]/.test(raw)) return null;
  if (/^https?:\/\/[^/]/i.test(raw)) return 'external';
  if (/^mailto:[^@\s]+@[^@\s]+$/i.test(raw)) return 'external';
  if (raw.startsWith('//')) return null;
  if (raw.startsWith('/')) return 'internal';
  return null;
}
