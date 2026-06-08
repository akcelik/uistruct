import { TestBed } from '@angular/core/testing';
import { StrctMetricTile } from './metric-tile';

function make(inputs: Record<string, unknown>) {
  const f = TestBed.createComponent(StrctMetricTile);
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f;
}

describe('StrctMetricTile', () => {
  it('renders label, value and unit', () => {
    const host = make({ label: 'CPU', value: 62, unit: '%' }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__label')?.textContent).toContain('CPU');
    expect(host.querySelector('.strct-mt__value')?.textContent).toContain('62');
    expect(host.querySelector('.strct-mt__unit')?.textContent).toContain('%');
  });

  it('shows a positive delta with the up tone', () => {
    const host = make({ label: 'X', value: 1, delta: 5 }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__delta--up')).not.toBeNull();
  });

  it('inverts the delta tone when invertDelta is set', () => {
    const host = make({ label: 'Errors', value: 3, delta: 5, invertDelta: true })
      .nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__delta--down')).not.toBeNull();
  });

  it('hides the sparkline when data is empty', () => {
    const host = make({ label: 'X', value: 1 }).nativeElement as HTMLElement;
    expect(host.querySelector('.strct-mt__spark')).toBeNull();
  });
});
