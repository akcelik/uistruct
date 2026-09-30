import { TestBed } from '@angular/core/testing';
import { StrctEmptyState } from './empty-state';

function make(inputs: Record<string, unknown>) {
  const f = TestBed.createComponent(StrctEmptyState);
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f;
}

describe('StrctEmptyState', () => {
  it('renders the title with the default (neutral) tone', () => {
    const host = make({ title: 'No data' }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-empty__title')?.textContent).toContain('No data');
    expect(host.querySelector('.strct-empty__icon--neutral')).not.toBeNull();
  });

  it('applies the variant tone (denied -> warning)', () => {
    const host = make({ title: 'Denied', variant: 'denied' }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-empty__icon--warning')).not.toBeNull();
  });

  it('omits the description when not provided', () => {
    const host = make({ title: 'X' }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-empty__desc')).toBeNull();
  });
});

describe('StrctEmptyState — compact size and loading variant (FR-48-20)', () => {
  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctEmptyState);
    fixture.componentRef.setInput('title', 'No alarms');
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('sm is an inline row; md is unchanged', () => {
    expect(make({ size: 'sm' }).classList).toContain('strct-empty--sm');
    expect(make({}).classList).not.toContain('strct-empty--sm');
  });

  it('the loading variant swaps the icon chip for a spinner and marks the region busy', () => {
    const el = make({ variant: 'loading', title: 'Reading…' });
    expect(el.querySelector('strct-spinner')).toBeTruthy();
    expect(el.querySelector('.strct-empty__icon strct-icon')).toBeNull();
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.strct-empty__title')!.textContent!.trim()).toBe('Reading…');
  });

  it('a normal variant is not busy and still draws its icon', () => {
    const el = make({ variant: 'denied' });
    expect(el.hasAttribute('aria-busy')).toBe(false);
    expect(el.querySelector('.strct-empty__icon strct-icon')).toBeTruthy();
  });
});

// FR-49-20 — a loading state inside a card should not add a heading.
describe('StrctEmptyState — titleLevel', () => {
  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctEmptyState);
    fixture.componentRef.setInput('title', 'Loading hosts');
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('.strct-empty__title')!;
  }

  it('is an h3 by default, any level on request, and a p for null', () => {
    expect(make().tagName).toBe('H3');
    for (const level of [2, 3, 4, 5, 6] as const) {
      expect(make({ titleLevel: level }).tagName).toBe('H' + level);
    }
    const plain = make({ titleLevel: null });
    expect(plain.tagName).toBe('P');
    expect(plain.textContent!.trim()).toBe('Loading hosts');
  });
});
