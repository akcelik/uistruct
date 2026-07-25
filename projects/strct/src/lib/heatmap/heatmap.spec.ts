import { TestBed } from '@angular/core/testing';
import { StrctHeatmap, StrctHeatmapCell } from './heatmap';

const DATA: StrctHeatmapCell[] = [
  { row: 'web-1', col: '10:00', value: 5 },
  { row: 'web-1', col: '11:00', value: 10 },
  { row: 'web-1', col: '12:00', value: 2 },
  { row: 'db-1', col: '10:00', value: 1 },
  { row: 'db-1', col: '11:00', value: 4 },
  { row: 'db-1', col: '12:00', value: 7 },
];

function create(data: StrctHeatmapCell[] = DATA) {
  const fixture = TestBed.createComponent(StrctHeatmap);
  fixture.componentRef.setInput('data', data);
  fixture.detectChanges();
  return fixture;
}

function cells(fixture: { nativeElement: HTMLElement }): NodeListOf<SVGRectElement> {
  return fixture.nativeElement.querySelectorAll('.strct-heatmap__cell');
}

describe('StrctHeatmap', () => {
  it('renders a rect per row × column intersection', () => {
    const fixture = create();
    expect(cells(fixture).length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('.strct-heatmap__label--row').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.strct-heatmap__label--col').length).toBe(3);
  });

  it('maps value intensity onto a color-mix ramp against the data maximum', () => {
    const fixture = create();
    const rects = cells(fixture);
    // web-1 × 11:00 holds the max (10) → full intensity.
    expect(rects[1].getAttribute('fill')).toBe('color-mix(in srgb, var(--acc) 100%, var(--bg-1))');
    // 5 of 10 → halfway up the 8–100% ramp.
    expect(rects[0].getAttribute('fill')).toBe('color-mix(in srgb, var(--acc) 54%, var(--bg-1))');
  });

  it('honours an explicit max as the scale ceiling', () => {
    const fixture = create([
      { row: 'a', col: 'x', value: 10 },
      { row: 'a', col: 'y', value: 30 },
    ]);
    fixture.componentRef.setInput('max', 20);
    fixture.detectChanges();
    const rects = cells(fixture);
    expect(rects[0].getAttribute('fill')).toBe('color-mix(in srgb, var(--acc) 54%, var(--bg-1))');
    // Values past the ceiling clamp to full intensity.
    expect(rects[1].getAttribute('fill')).toBe('color-mix(in srgb, var(--acc) 100%, var(--bg-1))');
  });

  it('follows explicit rows/cols ordering and renders gaps as empty cells', () => {
    const fixture = create([
      { row: 'a', col: 'x', value: 3 },
      { row: 'b', col: 'y', value: 9 },
    ]);
    fixture.componentRef.setInput('rows', ['b', 'a']);
    fixture.componentRef.setInput('cols', ['y', 'x']);
    fixture.detectChanges();

    const rowLabels: NodeListOf<SVGTextElement> = fixture.nativeElement.querySelectorAll(
      '.strct-heatmap__label--row',
    );
    expect(rowLabels[0].textContent!.trim()).toBe('b');
    expect(rowLabels[1].textContent!.trim()).toBe('a');

    const rects = cells(fixture);
    // b × y has data; b × x (explicit col with no data point) is an empty cell.
    expect(rects[0].getAttribute('fill')).toBe('color-mix(in srgb, var(--acc) 100%, var(--bg-1))');
    expect(rects[1].classList).toContain('strct-heatmap__cell--empty');
    expect(rects[1].getAttribute('fill')).toBe('var(--bg-2)');
    expect(rects[1].querySelector('title')).toBeNull();
  });

  it('puts a value tooltip on cells that have data', () => {
    const fixture = create();
    const first = cells(fixture)[0];
    expect(first.querySelector('title')!.textContent).toBe('web-1 × 10:00: 5');
  });

  it('exposes a role="img" svg with a default English summary', () => {
    const fixture = create();
    const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Heatmap, 2 rows by 3 columns. Min 1, max 10');
  });

  it('uses summaryFormat and ariaLabel when provided', () => {
    const fixture = create();
    fixture.componentRef.setInput('ariaLabel', 'Request density');
    fixture.detectChanges();
    let svg: SVGSVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-label')).toContain('Request density, 2 rows by 3 columns');

    fixture.componentRef.setInput(
      'summaryFormat',
      (info: { rows: number; cols: number }) => `${info.rows}x${info.cols} grid`,
    );
    fixture.detectChanges();
    svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-label')).toBe('2x3 grid');
  });

  it('uses the status token as the ramp base color', () => {
    const fixture = create();
    fixture.componentRef.setInput('status', 'critical');
    fixture.detectChanges();
    expect(cells(fixture)[1].getAttribute('fill')).toBe(
      'color-mix(in srgb, var(--critical) 100%, var(--bg-1))',
    );
  });

  it('shows the empty state instead of the svg when there is no data', () => {
    const fixture = create([]);
    fixture.componentRef.setInput('emptyText', 'Nothing to show');
    fixture.detectChanges();
    const empty: HTMLElement = fixture.nativeElement.querySelector('.strct-heatmap__empty');
    expect(empty.textContent).toContain('Nothing to show');
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
  });
});
