import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctLogLine, StrctLogViewer, parseAnsi } from './log-viewer';

@Component({
  imports: [StrctLogViewer],
  template: `<strct-log-viewer
    [lines]="lines()"
    [(follow)]="follow"
    [(wrapMode)]="wrap"
    [live]="live()"
    [height]="200"
  />`,
})
class HostComponent {
  lines = signal<(string | StrctLogLine)[]>([]);
  follow = signal(true);
  wrap = signal(false);
  live = signal(true);
}

function setup(lines: (string | StrctLogLine)[]) {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.lines.set(lines);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

describe('parseAnsi', () => {
  it('passes plain text through as a single default segment', () => {
    expect(parseAnsi('hello [INFO] world')).toEqual([{ text: 'hello [INFO] world', cls: 'c37' }]);
  });

  it('splits SGR-colored text into class-tagged segments and resets on 0', () => {
    const segs = parseAnsi('ok [31mFAIL[0m done');
    expect(segs.map((s) => s.text)).toEqual(['ok ', 'FAIL', ' done']);
    expect(segs[1].cls).toBe('c31');
    expect(segs[2].cls).toBe('c37');
  });

  it('stacks bold with color and lets a new color replace the old', () => {
    const segs = parseAnsi('[1;32mup[33mwarn[0m');
    expect(segs[0].cls.split(' strct-lv__seg-').sort()).toEqual(['b', 'c32']);
    expect(segs[1].cls).toContain('c33');
    expect(segs[1].cls).not.toContain('c32');
  });

  it('strips non-SGR CSI sequences (erase-in-line, cursor moves)', () => {
    const segs = parseAnsi('[2K\r[1Aok [31mFAIL[0m[K');
    expect(segs.map((s) => s.text)).toEqual(['\rok ', 'FAIL']);
    expect(segs[1].cls).toBe('c31');
  });
});

describe('StrctLogViewer', () => {
  it('virtualizes: 10k lines render only a window of rows', () => {
    const { el } = setup(Array.from({ length: 10_000 }, (_, i) => `line ${i}`));
    const rows = el.querySelectorAll('.strct-lv__line');
    expect(rows.length).toBeLessThan(60);
    expect(el.querySelector('.strct-lv__count')?.textContent).toContain('10000');
    const spacer = el.querySelector<HTMLElement>('.strct-lv__spacer')!;
    expect(parseInt(spacer.style.height)).toBe(10_000 * 20);
  });

  it('tints by explicit level and auto-detects tokens on plain strings', () => {
    const { el } = setup([
      { text: 'disk failure', level: 'error' },
      'WARN something odd',
      'plain line',
    ]);
    expect(el.querySelector('.strct-lv__line--error')?.textContent).toContain('disk failure');
    expect(el.querySelector('.strct-lv__line--warn')?.textContent).toContain('WARN');
  });

  it('renders the log region with role="log" and a focusable scroll area', () => {
    const { el } = setup(['a']);
    const region = el.querySelector('.strct-lv__scroll')!;
    expect(region.getAttribute('role')).toBe('log');
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('follow toggle reflects and flips the two-way model', () => {
    const { fixture, host, el } = setup(['a', 'b']);
    const btn = [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent!.includes('Follow'),
    )!;
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    btn.click();
    fixture.detectChanges();
    expect(host.follow()).toBe(false);
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('wrap toggle switches the window into soft-wrap mode', () => {
    const { fixture, el } = setup(['x'.repeat(500)]);
    expect(el.querySelector('.strct-lv__window--wrap')).toBeNull();
    [...el.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent!.includes('Wrap'))!
      .click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-lv__window--wrap')).toBeTruthy();
  });

  it('wrap mode disables virtualization and renders all lines', () => {
    const { fixture, host, el } = setup(
      Array.from({ length: 500 }, (_, i) => `line ${i} ` + 'x'.repeat(300)),
    );
    host.wrap.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.strct-lv__window--wrap')).toBeTruthy();
    // Unvirtualized: every line is in the DOM, the spacer carries no fixed
    // height and the window sits at offset 0 — scrolling uses real content.
    expect(el.querySelectorAll('.strct-lv__line').length).toBe(500);
    const spacer = el.querySelector<HTMLElement>('.strct-lv__spacer')!;
    expect(spacer.style.height).toBe('');
    const win = el.querySelector<HTMLElement>('.strct-lv__window')!;
    expect(win.style.transform).toBe('translateY(0px)');
  });

  it('wrap mode past the line cap falls back to virtualized nowrap', () => {
    const { fixture, host, el } = setup(Array.from({ length: 10_001 }, (_, i) => `line ${i}`));
    host.wrap.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.strct-lv__window--wrap')).toBeNull();
    expect(el.querySelectorAll('.strct-lv__line').length).toBeLessThan(60);
    const spacer = el.querySelector<HTMLElement>('.strct-lv__spacer')!;
    expect(parseInt(spacer.style.height)).toBe(10_001 * 20);
    const wrapBtn = [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent!.includes('Wrap'),
    )!;
    expect(wrapBtn.getAttribute('title')).toContain('wrapping disabled');
  });

  it('exposes aria-live="off" only when live is false', () => {
    const { fixture, host, el } = setup(['a']);
    const region = el.querySelector('.strct-lv__scroll')!;
    expect(region.getAttribute('aria-live')).toBeNull();
    host.live.set(false);
    fixture.detectChanges();
    expect(region.getAttribute('aria-live')).toBe('off');
  });
});
