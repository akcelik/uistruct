import { TestBed } from '@angular/core/testing';
import { StrctChart } from './chart';

function build(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(StrctChart);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('StrctChart', () => {
  it('applies the base host class', () => {
    const el = build({ data: [1, 2, 3] });
    expect(el.classList).toContain('strct-chart');
  });

  it('renders a smooth (cubic) line path by default', () => {
    const el = build({ data: [4, 8, 2, 9, 5] });
    const d = el.querySelector('.strct-chart__line')?.getAttribute('d') ?? '';
    expect(d.startsWith('M')).toBe(true);
    expect(d).toContain('C'); // cubic bezier segments
  });

  it('renders a straight line path for curve="linear"', () => {
    const el = build({ data: [4, 8, 2, 9, 5], curve: 'linear' });
    const d = el.querySelector('.strct-chart__line')?.getAttribute('d') ?? '';
    expect(d).toContain('L');
    expect(d).not.toContain('C');
  });

  it('renders a step path for curve="step"', () => {
    const el = build({ data: [4, 8, 2], curve: 'step' });
    const d = el.querySelector('.strct-chart__line')?.getAttribute('d') ?? '';
    expect(d).toContain('L');
    expect(d).not.toContain('C');
  });

  it('shows the gradient area only when area (or type="area") is set', () => {
    expect(build({ data: [1, 2, 3] }).querySelector('.strct-chart__area')).toBeNull();
    expect(build({ data: [1, 2, 3], area: true }).querySelector('.strct-chart__area')).toBeTruthy();
    expect(
      build({ data: [1, 2, 3], type: 'area' }).querySelector('.strct-chart__area'),
    ).toBeTruthy();
  });

  it('hides per-point dots by default and shows them when dots is set', () => {
    expect(build({ data: [1, 2, 3] }).querySelectorAll('.strct-chart__dot').length).toBe(0);
    expect(
      build({ data: [1, 2, 3], dots: true }).querySelectorAll('.strct-chart__dot').length,
    ).toBe(3);
  });

  it('renders a pulsing head only in live mode', () => {
    expect(build({ data: [1, 2, 3] }).querySelector('.strct-chart__head')).toBeNull();
    const live = build({ data: [1, 2, 3], live: true });
    expect(live.querySelector('.strct-chart__head')).toBeTruthy();
    expect(live.querySelector('.strct-chart__pulse')).toBeTruthy();
  });

  it('toggles the ambient glow host class', () => {
    expect(build({ data: [1, 2, 3] }).classList).not.toContain('strct-chart--glow');
    expect(build({ data: [1, 2, 3], glow: true }).classList).toContain('strct-chart--glow');
  });

  it('applies the strokeWidth to the line', () => {
    const el = build({ data: [1, 2, 3], strokeWidth: 3 });
    expect(el.querySelector('.strct-chart__line')?.getAttribute('stroke-width')).toBe('3');
  });

  it('renders a crosshair + value tooltip when a point is hovered', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('data', [10, 20, 30]);
    fixture.componentRef.setInput('labels', ['a', 'b', 'c']);
    fixture.detectChanges();
    // Simulate the hover state the pointer handler would set.
    (fixture.componentInstance as unknown as { hoverIdx: { set(i: number): void } }).hoverIdx.set(
      1,
    );
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-chart__cross')).toBeTruthy();
    expect(el.querySelector('.strct-chart__hoverdot')).toBeTruthy();
    const tip = el.querySelector('.strct-chart__tip');
    expect(tip?.querySelector('.strct-chart__tip-v')?.textContent).toContain('20');
    expect(tip?.querySelector('.strct-chart__tip-l')?.textContent).toContain('b');
  });

  it('still renders bars for type="bar"', () => {
    const el = build({ data: [1, 2, 3], type: 'bar' });
    expect(el.querySelectorAll('.strct-chart__bar').length).toBe(3);
    expect(el.querySelector('.strct-chart__line')).toBeNull();
  });
});
