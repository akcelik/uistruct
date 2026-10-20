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

// FR-59-05: an install has a "to" and no "from"; a removal the other way round.
describe('StrctChange — one side', () => {
  const make = (inputs: Record<string, unknown>) => {
    const fixture = TestBed.createComponent(StrctChange);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      el,
      from: el.querySelector('.strct-change__from'),
      to: el.querySelector('.strct-change__to'),
      gone: el.querySelector('.strct-change__gone'),
      sentence: el.querySelector('.strct-change__sr')!.textContent!.trim(),
    };
  };

  it('an added value draws only the arrow and the new value', () => {
    const r = make({ to: '1.4.2' });
    expect(r.from).toBeNull();
    expect(r.to!.textContent!.trim()).toBe('1.4.2');
    expect(r.sentence).toBe('set to 1.4.2');
  });

  it('a removed value draws the mark, and says so', () => {
    const r = make({ from: '1.4.1' });
    expect(r.from!.textContent!.trim()).toBe('1.4.1');
    expect(r.to).toBeNull();
    expect(r.gone!.textContent!.trim()).toBe('—');
    expect(r.sentence).toBe('1.4.1 removed');
  });

  it('both sides read as before, and all three sentences are localisable', () => {
    expect(make({ from: 'v10.27', to: 'v10.28' }).sentence).toBe('from v10.27 to v10.28');
    expect(make({ to: '2', addedLabel: (to: string) => `${to} olarak ayarlandı` }).sentence).toBe(
      '2 olarak ayarlandı',
    );
    expect(
      make({ from: '2', removedLabel: (from: string) => `${from} kaldırıldı`, removedMark: '·' })
        .sentence,
    ).toBe('2 kaldırıldı');
    expect(make({ from: '2', removedMark: '·' }).gone!.textContent!.trim()).toBe('·');
  });
});
