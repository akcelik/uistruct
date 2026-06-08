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
