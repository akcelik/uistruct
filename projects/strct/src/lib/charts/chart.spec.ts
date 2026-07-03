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

  // FR-CHART-01 + 05: multi-series + legend
  it('draws one line per series and a legend when series is provided', () => {
    const el = build({
      series: [
        { data: [1, 2, 3], label: 'In', status: 'accent' },
        { data: [3, 2, 1], label: 'Out', status: 'success' },
      ],
      legend: true,
    });
    expect(el.querySelectorAll('.strct-chart__line').length).toBe(2);
    const legs = el.querySelectorAll('.strct-chart__leg');
    expect(legs.length).toBe(2);
    expect(legs[0].textContent).toContain('In');
    expect(legs[1].textContent).toContain('Out');
  });

  it('shows a multi-row tooltip listing each series value at the hovered index', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('series', [
      { data: [10, 20, 30], label: 'In' },
      { data: [5, 15, 25], label: 'Out' },
    ]);
    fixture.detectChanges();
    (fixture.componentInstance as unknown as { hoverIdx: { set(i: number): void } }).hoverIdx.set(
      1,
    );
    fixture.detectChanges();
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('.strct-chart__tip-row');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('20');
    expect(rows[1].textContent).toContain('15');
  });

  it('renders no legend when series are unlabeled or legend is false', () => {
    const noLabel = build({ series: [{ data: [1, 2] }, { data: [2, 1] }], legend: true });
    expect(noLabel.querySelectorAll('.strct-chart__leg').length).toBe(0);
    const off = build({ series: [{ data: [1, 2], label: 'A' }], legend: false });
    expect(off.querySelector('.strct-chart__legend')).toBeNull();
  });

  // FR-CHART-02: persistent y-axis labels
  it('renders y-axis scale labels when yAxis is on', () => {
    const el = build({
      data: [0, 50, 100],
      max: 100,
      yAxis: true,
      yTicks: 3,
      axisFormat: (v: number) => v.toFixed(0) + '%',
    });
    const ticks = [...el.querySelectorAll('.strct-chart__ytick')].map((t) => t.textContent?.trim());
    expect(ticks).toContain('0%');
    expect(ticks).toContain('100%');
    expect(build({ data: [1, 2, 3] }).querySelector('.strct-chart__ytick')).toBeNull();
  });

  // FR-CHART-03: threshold lines
  it('draws a threshold line + label', () => {
    const el = build({
      data: [10, 50, 95],
      max: 100,
      thresholds: [{ value: 90, status: 'critical', label: 'crit' }],
    });
    expect(el.querySelector('.strct-chart__threshold')).toBeTruthy();
    expect(el.querySelector('.strct-chart__thr')?.textContent).toContain('crit');
    expect(build({ data: [1, 2, 3] }).querySelector('.strct-chart__threshold')).toBeNull();
  });

  // FR-CHART-04: y-axis min
  it('accepts a min floor without crashing', () => {
    const el = build({ data: [82, 90, 95], min: 80, max: 100 });
    expect(el.querySelector('.strct-chart__line')).toBeTruthy();
  });

  // FR-CHART-06: empty state
  it('shows an empty state for no data', () => {
    const el = build({ data: [] });
    expect(el.querySelector('.strct-chart__empty')?.textContent).toContain('No data');
    expect(el.querySelector('svg')).toBeNull();
    const custom = build({ data: [], emptyText: 'Nothing here' });
    expect(custom.querySelector('.strct-chart__empty')?.textContent).toContain('Nothing here');
  });

  // FR-CHART-07: x-axis tick control
  it('subsamples x labels to ~xTicks', () => {
    const labels = Array.from({ length: 60 }, (_, i) => String(i));
    const el = build({ data: labels.map(Number), labels, xTicks: 6 });
    const shown = el.querySelectorAll('.strct-chart__labels span').length;
    expect(shown).toBeLessThanOrEqual(6);
    expect(shown).toBeGreaterThan(2);
    // null keeps every label
    const all = build({ data: labels.map(Number), labels });
    expect(all.querySelectorAll('.strct-chart__labels span').length).toBe(60);
  });
});
