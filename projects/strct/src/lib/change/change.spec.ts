import { TestBed } from '@angular/core/testing';
import { StrctChange } from './change';

function build(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StrctChange);
  fixture.componentRef.setInput('from', 'v10.27');
  fixture.componentRef.setInput('to', 'v10.28');
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('StrctChange', () => {
  it('renders from → to with the arrow, and reads as a sentence', () => {
    const el = build();
    expect(el.querySelector('.strct-change__from')?.textContent).toBe('v10.27');
    expect(el.querySelector('.strct-change__to')?.textContent).toBe('v10.28');
    expect(el.querySelector('strct-icon')).toBeTruthy();
    expect(el.querySelector('.strct-change__sr')?.textContent).toBe('from v10.27 to v10.28');
  });

  it('keeps the glyphs away from assistive tech', () => {
    const el = build();
    expect(el.querySelector('.strct-change__from')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.strct-change__to')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.strct-change__arrow')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes a localised sentence and a mono face', () => {
    const el = build({
      mono: true,
      label: (f: string, t: string) => `${f} sürümünden ${t} sürümüne`,
    });
    expect(el.classList).toContain('strct-change--mono');
    expect(el.querySelector('.strct-change__sr')?.textContent).toBe(
      'v10.27 sürümünden v10.28 sürümüne',
    );
  });
});
