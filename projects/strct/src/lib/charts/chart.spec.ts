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

  // A11y: role="img" + generated summary, keyboard crosshair, CVD dash channel
  it('exposes the chart as role="img" with a data summary', () => {
    const el = build({ data: [10, 30, 20] });
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    const label = svg.getAttribute('aria-label') ?? '';
    expect(label).toContain('3 points');
    expect(label).toContain('30');
  });

  it('is keyboard-focusable and arrows move the crosshair point', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('data', [10, 20, 30]);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('tabindex')).toBe('0');
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-chart__tip')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.strct-chart__sr')?.textContent).toContain('10');
  });

  it('renders a dashed line + dashed legend swatch for dash series', () => {
    const el = build({
      series: [
        { data: [1, 2], label: 'A' },
        { data: [2, 1], label: 'B', dash: true },
      ],
      legend: true,
    });
    const lines = el.querySelectorAll('.strct-chart__line');
    expect(lines[0].getAttribute('stroke-dasharray')).toBeNull();
    expect(lines[1].getAttribute('stroke-dasharray')).toBe('5 4');
  });

  it('positions x labels at their datapoint x (honest axis)', () => {
    const el = build({ data: [1, 2, 3], labels: ['a', 'b', 'c'] });
    const spans = [...el.querySelectorAll('.strct-chart__labels span')] as HTMLElement[];
    expect(spans.length).toBe(3);
    expect(spans.every((sp) => sp.style.left !== '')).toBe(true);
  });

  // FR-CHART-08: data gaps
  it('breaks the line at null points into disjoint segments', () => {
    const el = build({ data: [10, 20, null, null, 40], curve: 'linear' });
    const d = el.querySelector('.strct-chart__line')?.getAttribute('d') ?? '';
    expect(d.split('M').filter(Boolean).length).toBe(2); // two sub-paths
    // all-number arrays are unaffected
    const solid = build({ data: [10, 20, 30, 20, 40], curve: 'linear' });
    const ds = solid.querySelector('.strct-chart__line')?.getAttribute('d') ?? '';
    expect(ds.split('M').filter(Boolean).length).toBe(1);
  });

  it('announces "no data" when a gap point is selected', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('data', [10, null, 30]);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-chart__tip--gap')?.textContent).toContain('no data');
    expect(el.querySelector('.strct-chart__sr')?.textContent).toContain('no data');
  });

  // FR-CHART-09: hover output + driven crosshair
  it('emits hoverIndex on keyboard hover and clears it on Escape', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('data', [10, 20, 30]);
    fixture.detectChanges();
    const emitted: (number | null)[] = [];
    fixture.componentInstance.hoverIndex.subscribe((i) => emitted.push(i));
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(emitted).toEqual([0, null]);
  });

  it('activeIndex drives the crosshair without a local pointer', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('data', [10, 20, 30]);
    fixture.componentRef.setInput('activeIndex', 1);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-chart__cross')).toBeTruthy();
    expect(el.querySelector('.strct-chart__tip-v')?.textContent).toContain('20');
  });

  // FR-CHART-10: annotations
  it('draws a vertical annotation line with its label', () => {
    const el = build({
      data: [1, 2, 3, 4, 5],
      annotations: [{ index: 2, label: 'alarm', status: 'critical' }],
    });
    const line = el.querySelector('.strct-chart__ann');
    expect(line).toBeTruthy();
    expect(line?.getAttribute('stroke')).toBe('var(--critical)');
    expect(el.querySelector('.strct-chart__ann-label')?.textContent).toContain('alarm');
  });

  // FR-CHART-11: min–max band
  it('fills a band between lower and upper bounds', () => {
    const el = build({
      series: [{ data: [5, 6, 5], lower: [3, 4, 3], upper: [8, 9, 8], label: 'cpu' }],
    });
    const band = el.querySelector('.strct-chart__band');
    expect(band).toBeTruthy();
    expect(band?.getAttribute('d')).toContain('Z');
    // no bounds → no band
    const plain = build({ series: [{ data: [5, 6, 5], label: 'cpu' }] });
    expect(plain.querySelector('.strct-chart__band')).toBeNull();
  });

  // FR-CHART-12 (+ zoom): brush selection
  it('brush drag emits the selected range; zoom narrows the window and reset clears it', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('data', [1, 2, 3, 4, 5, 6, 7, 8]);
    fixture.componentRef.setInput('labels', ['0', '1', '2', '3', '4', '5', '6', '7']);
    fixture.componentRef.setInput('zoom', true);
    fixture.detectChanges();
    const emitted: ([number, number] | null)[] = [];
    fixture.componentInstance.brushChange.subscribe((r) => emitted.push(r));
    // Simulate the drag the pointer handlers would produce.
    const cmp = fixture.componentInstance as unknown as {
      brushDrag: { set(v: { a: number; b: number } | null): void };
      onUp(): void;
    };
    cmp.brushDrag.set({ a: 2, b: 5 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-chart__brush')).toBeTruthy();
    cmp.onUp();
    fixture.detectChanges();
    expect(emitted).toEqual([[2, 5]]);
    // zoomed: only the selected window's labels remain, reset chip appears
    const el = fixture.nativeElement as HTMLElement;
    const shown = [...el.querySelectorAll('.strct-chart__labels span')].map((s) => s.textContent);
    expect(shown).toEqual(['2', '3', '4', '5']);
    const reset = el.querySelector('.strct-chart__reset') as HTMLButtonElement;
    expect(reset).toBeTruthy();
    reset.click();
    fixture.detectChanges();
    expect(emitted).toEqual([[2, 5], null]);
    expect(el.querySelectorAll('.strct-chart__labels span').length).toBe(8);
  });

  // v1.2: stacked series
  it('stacked series draw cumulative lines with solid stack bands', () => {
    const el = build({
      series: [
        { data: [10, 10, 10], label: 'A' },
        { data: [5, 5, 5], label: 'B' },
      ],
      stacked: true,
      curve: 'linear',
      max: 20,
      height: 120,
    });
    const bands = el.querySelectorAll('.strct-chart__band--stack');
    expect(bands.length).toBe(2);
    const lines = el.querySelectorAll('.strct-chart__line');
    // B rides on A: its line sits at 15 of 20 → strictly above A's 10 of 20
    const yOfPath = (d: string) => parseFloat(d.slice(1).split(',')[1]);
    const yA = yOfPath(lines[0].getAttribute('d')!);
    const yB = yOfPath(lines[1].getAttribute('d')!);
    expect(yB).toBeLessThan(yA); // smaller y = higher on screen
  });

  // v1.2: time axis
  it('times maps x positions to real timestamps (uneven spacing)', () => {
    const el = build({
      data: [1, 2, 3],
      times: [0, 1000, 4000], // second gap is 3× the first
      curve: 'linear',
    });
    const d = el.querySelector('.strct-chart__line')!.getAttribute('d')!;
    const xs = [...d.matchAll(/[ML]([\d.]+),/g)].map((m) => parseFloat(m[1]));
    const gap1 = xs[1] - xs[0];
    const gap2 = xs[2] - xs[1];
    expect(gap2 / gap1).toBeCloseTo(3, 1);
  });

  // v1.2: log scale
  it('scale="log" spaces decades equally and renders decade ticks', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('data', [1, 10, 100]);
    fixture.componentRef.setInput('scale', 'log');
    fixture.componentRef.setInput('yAxis', true);
    fixture.componentRef.setInput('max', 100);
    fixture.componentRef.setInput('min', 1);
    fixture.componentRef.setInput('curve', 'linear');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const d = el.querySelector('.strct-chart__line')!.getAttribute('d')!;
    const ys = [...d.matchAll(/[ML][\d.]+,([\d.]+)/g)].map((m) => parseFloat(m[1]));
    // 1 → 10 → 100 are equidistant on a log axis
    expect(ys[0] - ys[1]).toBeCloseTo(ys[1] - ys[2], 0);
    const ticks = [...el.querySelectorAll('.strct-chart__ytick')].map((t) => t.textContent?.trim());
    expect(ticks).toContain('1');
    expect(ticks).toContain('10');
    expect(ticks).toContain('100');
  });

  // FR-CHART-13: export
  it('toSVG returns a standalone SVG string with resolved presentation', () => {
    const fixture = TestBed.createComponent(StrctChart);
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.componentRef.setInput('labels', ['a', 'b', 'c']);
    fixture.detectChanges();
    const s = fixture.componentInstance.toSVG();
    expect(s).toContain('<svg');
    expect(s).toContain('xmlns');
    expect(s).not.toContain('class=');
  });
});
