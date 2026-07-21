import { TestBed } from '@angular/core/testing';
import { StrctCode } from './code';

describe('StrctCode', () => {
  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctCode);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, cmp: fixture.componentInstance };
  }

  it('renders the code verbatim in a focusable region with title + language tag', () => {
    const { el } = make({ code: 'a: 1\nb: 2', title: 'cloud-init', language: 'yaml' });
    expect(el.querySelector('.strct-code__code')?.textContent).toBe('a: 1\nb: 2');
    const region = el.querySelector('.strct-code__scroll')!;
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(el.querySelector('.strct-code__title')?.textContent).toBe('cloud-init');
    expect(el.querySelector('.strct-code__lang')?.textContent).toBe('yaml');
    expect(el.querySelector('strct-copy')).toBeTruthy();
  });

  it('collapsible hides the body (the details/pre pattern) with aria-expanded', () => {
    const { fixture, el } = make({ code: 'x', title: 'cfg', collapsible: true, collapsed: true });
    expect(el.querySelector('.strct-code__scroll')).toBeNull();
    const toggle = el.querySelector<HTMLButtonElement>('.strct-code__toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-code__scroll')).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('line numbers render one per line in an uncopyable gutter', () => {
    const { el } = make({ code: 'one\ntwo\nthree', lineNumbers: true });
    const gutter = el.querySelector('.strct-code__gutter')!;
    expect(gutter.querySelectorAll('.strct-code__ln').length).toBe(3);
    expect(gutter.getAttribute('aria-hidden')).toBe('true');
  });

  it('wrap applies the soft-wrap class (default stays nowrap)', () => {
    const { el } = make({ code: 'x'.repeat(500) });
    expect(el.querySelector('.strct-code__scroll--wrap')).toBeNull();
    const wrapped = make({ code: 'x'.repeat(500), wrap: true });
    expect(wrapped.el.querySelector('.strct-code__scroll--wrap')).toBeTruthy();
  });

  it('wrap takes precedence over the line-number gutter (alignment would lie)', () => {
    const { el } = make({ code: 'one\ntwo', lineNumbers: true, wrap: true });
    expect(el.querySelector('.strct-code__gutter')).toBeNull();
    expect(el.querySelector('.strct-code__scroll--wrap')).toBeTruthy();
  });
});
