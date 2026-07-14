import { TestBed } from '@angular/core/testing';
import { StrctDonut } from './donut';

function build(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(StrctDonut);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

const SEGS = [
  { value: 36, label: 'Running' },
  { value: 8, label: 'Stopped' },
  { value: 4, label: 'Error' },
];

describe('StrctDonut', () => {
  it('applies the base host class', () => {
    const el = build({ segments: [{ value: 1 }] }).nativeElement as HTMLElement;
    expect(el.classList).toContain('strct-donut');
  });

  it('renders one arc per segment', () => {
    const el = build({ segments: SEGS }).nativeElement as HTMLElement;
    expect(el.querySelectorAll('.strct-donut__arc').length).toBe(3);
  });

  it('renders the legend with label, value and percent when enabled', () => {
    const el = build({ segments: SEGS, legend: true }).nativeElement as HTMLElement;
    const rows = el.querySelectorAll('.strct-donut__leg');
    expect(rows.length).toBe(3);
    expect(rows[0].querySelector('.strct-donut__leg-label')?.textContent).toContain('Running');
    expect(rows[0].querySelector('.strct-donut__leg-val')?.textContent).toContain('36');
    // 36 / 48 = 75%
    expect(rows[0].querySelector('.strct-donut__leg-pct')?.textContent).toContain('75');
  });

  it('shows the center default until a slice is hovered, then the slice readout', () => {
    const fixture = build({ segments: SEGS, centerValue: 48, centerLabel: 'VMs' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-donut__value')?.textContent).toContain('48');
    expect(el.querySelector('.strct-donut__label')?.textContent).toContain('VMs');

    (fixture.componentInstance as unknown as { enter(i: number): void }).enter(0);
    fixture.detectChanges();
    expect(el.querySelector('.strct-donut__value')?.textContent).toContain('36');
    expect(el.querySelector('.strct-donut__label')?.textContent).toContain('Running');
    expect(el.querySelector('.strct-donut__label')?.textContent).toContain('75%');
  });

  it('does not highlight on hover when interactive is false', () => {
    const fixture = build({ segments: SEGS, interactive: false, centerValue: 48 });
    (fixture.componentInstance as unknown as { enter(i: number): void }).enter(0);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-donut__value')?.textContent).toContain('48');
  });

  it('exposes a role="img" summary naming every slice', () => {
    const el = build({ segments: SEGS }).nativeElement as HTMLElement;
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    const label = svg.getAttribute('aria-label') ?? '';
    expect(label).toContain('Running 36 (75%)');
  });

  it('legend rows are keyboard-focusable and drive the center readout', () => {
    const fixture = build({ segments: SEGS, legend: true, centerValue: 48 });
    const el = fixture.nativeElement as HTMLElement;
    const row = el.querySelector('.strct-donut__leg') as HTMLElement;
    expect(row.getAttribute('tabindex')).toBe('0');
    row.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(el.querySelector('.strct-donut__value')?.textContent).toContain('36');
  });
});
