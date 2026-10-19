import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctMarkdown, StrctMarkdownToken } from './markdown';
import {
  STRCT_MD_LIMITS,
  strctClassifyHref,
  strctParseMarkdown,
  parseInlines,
} from './markdown-parser';

describe('strctParseMarkdown — the reader', () => {
  it('reads paragraphs, headings, rules and quotes', () => {
    const blocks = strctParseMarkdown('# Title\n\nA line.\n\n---\n\n> quoted\n> still');
    expect(blocks.map((b) => b.kind)).toEqual(['heading', 'p', 'rule', 'quote']);
    expect(blocks[0]).toMatchObject({ level: 1 });
    const quote = blocks[3] as { blocks: { kind: string }[] };
    expect(quote.blocks[0].kind).toBe('p');
  });

  it('reads a fence, and an unterminated one is still code', () => {
    const closed = strctParseMarkdown('```ts\nconst a = 1;\n```');
    expect(closed[0]).toMatchObject({ kind: 'code', lang: 'ts', closed: true });
    expect((closed[0] as { text: string }).text).toBe('const a = 1;');

    // A reply streaming code is a code block from its first line.
    const open = strctParseMarkdown('```sh\nhyperstructctl doctor', { streaming: true });
    expect(open[0]).toMatchObject({ kind: 'code', lang: 'sh', closed: false });
  });

  it('reads lists, keeping their kind and start', () => {
    const blocks = strctParseMarkdown('- one\n- two\n\n3. three\n4. four');
    expect(blocks[0]).toMatchObject({ kind: 'list', ordered: false });
    expect((blocks[0] as { items: unknown[] }).items.length).toBe(2);
    expect(blocks[1]).toMatchObject({ kind: 'list', ordered: true, start: 3 });
  });

  it('reads a GFM table with its alignment', () => {
    const blocks = strctParseMarkdown('| Host | CPU |\n| :--- | ---: |\n| hv-01 | 92% |');
    const table = blocks[0] as { kind: string; align: unknown[]; rows: unknown[] };
    expect(table.kind).toBe('table');
    expect(table.align).toEqual(['start', 'end']);
    expect(table.rows.length).toBe(1);
  });

  it('bounds its work on hostile input', () => {
    const started = Date.now();
    // Deep nesting, a huge delimiter run and a very long line.
    strctParseMarkdown('>'.repeat(400) + ' x\n' + '*'.repeat(20000) + '\n' + 'a'.repeat(300000));
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe('parseInlines — emphasis, code and links', () => {
  const kinds = (s: string) => parseInlines(s).map((n) => n.kind);

  it('reads strong, em, strikethrough and code spans', () => {
    expect(kinds('**bold** and *thin* and ~~gone~~ and `code`')).toEqual([
      'strong',
      'text',
      'em',
      'text',
      'del',
      'text',
      'code',
    ]);
  });

  it('a code span is literal: its content is never read as markup', () => {
    const nodes = parseInlines('`**not bold**`');
    expect(nodes).toEqual([{ kind: 'code', text: '**not bold**' }]);
  });

  it('an unmatched delimiter stays the character it is', () => {
    expect(parseInlines('2 * 3 * 4')).toEqual([{ kind: 'text', text: '2 * 3 * 4' }]);
  });

  it('reads links and autolinks, and an image is only its alt text', () => {
    const link = parseInlines('see [the host](/hosts/hv-01)')[1];
    expect(link).toMatchObject({ kind: 'link', href: '/hosts/hv-01' });
    expect(parseInlines('<https://example.com>')[0]).toMatchObject({ kind: 'link' });
    // No request is ever made for an image.
    expect(parseInlines('![a diagram](https://x/y.png)')).toEqual([
      { kind: 'text', text: 'a diagram' },
    ]);
  });

  it('hands claimed runs to the consumer, and drops overlapping claims', () => {
    const nodes = parseInlines('vm-01 is slow', {
      tokenize: (text) =>
        text.startsWith('vm-01')
          ? [
              { start: 0, length: 5, token: 'object', data: { url: '/vms/1' } },
              { start: 2, length: 3, token: 'object' },
            ]
          : [],
    });
    expect(nodes[0]).toMatchObject({ kind: 'token', token: 'object', text: 'vm-01' });
    expect(nodes[1]).toMatchObject({ kind: 'text', text: ' is slow' });
  });

  it('survives a tokenizer that throws', () => {
    expect(
      parseInlines('plain', {
        tokenize: () => {
          throw new Error('no');
        },
      }),
    ).toEqual([{ kind: 'text', text: 'plain' }]);
  });
});

describe('strctClassifyHref — what a link may do', () => {
  it('follows http(s) and in-app paths, and nothing else', () => {
    expect(strctClassifyHref('https://example.com/x')).toBe('external');
    expect(strctClassifyHref('http://example.com')).toBe('external');
    expect(strctClassifyHref('/hosts/hv-01')).toBe('internal');
    // mailto: opens a mail client with a subject and body the model wrote —
    // an app says yes to that, it is not the default.
    expect(strctClassifyHref('mailto:ops@example.com')).toBeNull();
    expect(strctClassifyHref('mailto:ops@example.com', { mailto: true })).toBe('external');

    for (const bad of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD4=',
      '//evil.example.com',
      'vbscript:x',
      'relative/path',
      'java\nscript:alert(1)',
      // A browser reads a backslash as a slash: a middle-click on this one
      // left the app for https://evil.example/.
      '/\\evil.example',
      '/%5cevil.example',
      '/%5Cevil.example',
      '',
    ]) {
      expect(strctClassifyHref(bad)).toBeNull();
    }
  });
});

describe('StrctMarkdown — the view', () => {
  @Component({
    imports: [StrctMarkdown, StrctMarkdownToken],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-markdown
        [source]="src()"
        [streaming]="busy()"
        [tokens]="tokens"
        (navigate)="routed.push($event)"
      >
        <ng-template strctMarkdownToken="object" let-text let-data="data">
          <span class="chip" [attr.data-url]="data?.url">{{ text }}</span>
        </ng-template>
      </strct-markdown>
    `,
  })
  class Host {
    src = signal('');
    busy = signal(false);
    routed: string[] = [];
    tokens = (text: string) => {
      const at = text.indexOf('vm-01');
      return at === -1 ? [] : [{ start: at, length: 5, token: 'object', data: { url: '/vms/1' } }];
    };
  }

  function render(src: string, busy = false) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.src.set(src);
    fixture.componentInstance.busy.set(busy);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('draws blocks as elements, with the headings pulled down', () => {
    const { el } = render('# Findings\n\nThe host is **busy**.');
    expect(el.querySelector('h3')!.textContent!.trim()).toBe('Findings');
    expect(el.querySelector('h1')).toBeNull();
    expect(el.querySelector('strong')!.textContent).toBe('busy');
  });

  it('never builds HTML from the source', () => {
    const { el } = render('<img src=x onerror="alert(1)"> and <b>bold</b>');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('b')).toBeNull();
    // The characters are shown, as written.
    expect(el.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(el.textContent).toContain('<b>bold</b>');
  });

  it('leaves a javascript: link as text and routes an in-app one', () => {
    const danger = render('[click](javascript:alert(1))');
    expect(danger.el.querySelector('a')).toBeNull();
    expect(danger.el.textContent).toContain('click');

    const inApp = render('[the host](/hosts/hv-01)');
    const a = inApp.el.querySelector('a') as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe('/hosts/hv-01');
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    inApp.fixture.detectChanges();
    expect(inApp.fixture.componentInstance.routed).toEqual(['/hosts/hv-01']);
  });

  it('opens an external link in a new tab, with the rel that needs', () => {
    const { el } = render('[docs](https://example.com)');
    const a = el.querySelector('a')!;
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('draws a fence as strct-code and a table as a table', () => {
    const { el } = render('```sh\nls -la\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
    expect(el.querySelector('strct-code')).toBeTruthy();
    expect(el.querySelectorAll('.strct-md__table th').length).toBe(2);
    expect(el.querySelectorAll('.strct-md__table td').length).toBe(2);
  });

  it('draws a claimed run with the consumer’s template', () => {
    const { el } = render('vm-01 is slow');
    const chip = el.querySelector('.chip')!;
    expect(chip.textContent).toBe('vm-01');
    expect(chip.getAttribute('data-url')).toBe('/vms/1');
  });

  it('puts the caret at the end of the last run while streaming', () => {
    const quiet = render('one\n\ntwo');
    expect(quiet.el.querySelector('.strct-md__caret')).toBeNull();

    const live = render('one\n\ntwo', true);
    const carets = live.el.querySelectorAll('.strct-md__caret');
    expect(carets.length).toBe(1);
    // In the last paragraph, not after the last block.
    expect(live.el.querySelectorAll('.strct-md__p')[1].contains(carets[0])).toBe(true);
  });

  it('re-reads a growing source without losing what is there', () => {
    const { fixture, el } = render('# Title\n\npart', true);
    expect(el.querySelectorAll('.strct-md__p').length).toBe(1);
    fixture.componentInstance.src.set('# Title\n\npart one\n\npart two');
    fixture.detectChanges();
    expect(el.querySelectorAll('.strct-md__p').length).toBe(2);
    expect(el.querySelector('h3')!.textContent!.trim()).toBe('Title');
  });
});

// BUG-58-08 / BUG-58-09 / FR-58-03 — what the reader links, reads and costs.
describe('strctParseMarkdown — the reader after the parity report', () => {
  it('leaves an underscore inside a word alone', () => {
    // `list_inventory for vm_cpu_usage` became `list<em>inventory for vm</em>cpu_usage`.
    expect(parseInlines('list_inventory for vm_cpu_usage')).toEqual([
      { kind: 'text', text: 'list_inventory for vm_cpu_usage' },
    ]);
    expect(parseInlines('window.__x stays')).toEqual([{ kind: 'text', text: 'window.__x stays' }]);
    // Emphasis around a word still works.
    expect(parseInlines('_really_ down').map((n) => n.kind)).toEqual(['em', 'text']);
  });

  it('links a bare URL and leaves the sentence its punctuation', () => {
    const nodes = parseInlines('see https://example.com/x, then stop');
    expect(nodes[1]).toMatchObject({ kind: 'link', href: 'https://example.com/x' });
    expect(nodes[2]).toMatchObject({ kind: 'text', text: ', then stop' });
    // A closing bracket the address opened is part of it.
    expect(parseInlines('(https://example.com/a(b))')[1]).toMatchObject({
      href: 'https://example.com/a(b)',
    });
  });

  it('reads a single newline as a break only when asked', () => {
    expect(parseInlines('Host: X\nCPU: 40 %').map((n) => n.kind)).toEqual(['text', 'text', 'text']);
    expect(parseInlines('Host: X\nCPU: 40 %', { breaks: true }).map((n) => n.kind)).toEqual([
      'text',
      'break',
      'text',
    ]);
  });

  it('looks for a closer within a window, not to the end of the reply', () => {
    // The mechanism, asserted without a clock: a closer beyond the window is
    // not a closer, so the opener stays the character it is.
    const far = '*' + 'a'.repeat(STRCT_MD_LIMITS.scan + 50) + '*';
    expect(parseInlines(far)[0].kind).toBe('text');
    const near = '*' + 'a'.repeat(50) + '*';
    expect(parseInlines(near)[0].kind).toBe('em');
  });

  it('stays well inside a second on the shapes that used to cost several', () => {
    // Measured before: "*a " x 64 KiB 1.6 s, "**a " 755 ms, "[" x 200 KiB
    // 2.1 s; after: 156 / 78 / 48 ms. The budget is loose on purpose — this
    // runs beside 115 other files — but it still catches the old behaviour.
    const cases = ['*a '.repeat(22000), '**a '.repeat(16000), '['.repeat(200000)];
    for (const source of cases) {
      const started = Date.now();
      strctParseMarkdown(source);
      expect(Date.now() - started, source.slice(0, 3)).toBeLessThan(1500);
    }
  });
});

describe('StrctMarkdown — tokens, breaks and the external link', () => {
  @Component({
    imports: [StrctMarkdown, StrctMarkdownToken],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-markdown [source]="src" [tokens]="tokens">
        <ng-template strctMarkdownToken="object" let-text>
          <span class="chip">{{ text }}</span>
        </ng-template>
      </strct-markdown>
    `,
  })
  class Host {
    src = '- HV-NODE-01 is down\n\n> HV-NODE-01 again\n\nHV-NODE-01 in a paragraph';
    tokens = (text: string) => {
      const at = text.indexOf('HV-NODE-01');
      return at === -1 ? [] : [{ start: at, length: 10, token: 'object' }];
    };
  }

  it('draws a claimed run in a list item and a quote, not only in a paragraph', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // One chip per block: the nested view had no templates and drew text.
    expect(el.querySelectorAll('.chip').length).toBe(3);
    expect(el.querySelector('li .chip')).toBeTruthy();
    expect(el.querySelector('blockquote .chip')).toBeTruthy();
  });

  it('tells a screen reader that an external link opens a new tab', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.src = '[docs](https://example.com)';
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector('a')!;
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.textContent).toContain('opens in a new tab');
  });
});
