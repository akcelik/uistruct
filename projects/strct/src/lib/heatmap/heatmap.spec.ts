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

describe('StrctHeatmap — monitoring readability (FR-43-01..03)', () => {
  /** 24 hourly columns keyed by ISO time, one host row — the consumer's grid. */
  const HOURS = Array.from({ length: 24 }, (_, i) => `2026-09-26T${String(i).padStart(2, '0')}:00`);
  const LOAD: StrctHeatmapCell[] = HOURS.map((col, i) => ({ row: 'hv-05', col, value: i * 4 }));

  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctHeatmap);
    fixture.componentRef.setInput('data', LOAD);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture;
  }
  const colText = (f: { nativeElement: HTMLElement }) =>
    [...f.nativeElement.querySelectorAll('.strct-heatmap__label--col')].map((t) =>
      t.textContent!.trim(),
    );

  it('labels every n-th column, formatted — and a repeated label is not a duplicate key', () => {
    const hour = (col: string) => col.slice(11, 16);
    const fixture = make({ colLabelEvery: 3, colLabel: hour });
    expect(colText(fixture)).toEqual([
      '00:00',
      '03:00',
      '06:00',
      '09:00',
      '12:00',
      '15:00',
      '18:00',
      '21:00',
    ]);
    // All 24 cells are still drawn; only the labels are thinned.
    expect(fixture.nativeElement.querySelectorAll('.strct-heatmap__cell').length).toBe(24);

    // The DST fall-back repeats an hour: two identical labels must both render.
    const twice = make({ colLabel: () => '02' });
    expect(colText(twice).length).toBe(24);
    expect(new Set(colText(twice))).toEqual(new Set(['02']));
  });

  it('a formatter returning empty drops that label; default is every column, unformatted', () => {
    expect(
      colText(make({ colLabel: (_c: string, i: number) => (i % 12 ? '' : 'noon-ish') })),
    ).toEqual(['noon-ish', 'noon-ish']);
    expect(colText(make({})).length).toBe(24);
    expect(colText(make({}))[0]).toBe(HOURS[0]);
    expect(colText(make({ colLabelEvery: 0 })).length).toBe(24); // guards against a zero stride
  });

  it('valueFormat writes the cell tooltip, with its unit', () => {
    const fixture = make({
      colLabel: (c: string) => c.slice(11, 16),
      valueFormat: (v: number, row: string, col: string) =>
        `${row} · ${col.slice(11, 16)} — ${v}% CPU`,
    });
    const titles = [...fixture.nativeElement.querySelectorAll('.strct-heatmap__cell title')].map(
      (t) => t.textContent,
    );
    expect(titles[12]).toBe('hv-05 · 12:00 — 48% CPU');
    // Without it, the old row × col: value form.
    const plain = make({});
    expect(plain.nativeElement.querySelector('.strct-heatmap__cell title')!.textContent).toBe(
      `hv-05 × ${HOURS[0]}: 0`,
    );
  });

  it('thresholds colour a cell by band, with intensity scaled inside the band', () => {
    // values are index * 4, so the grid runs 0…92.
    const fixture = make({ max: 100, thresholds: { warning: 40, critical: 80 } });
    const fill = (i: number) =>
      fixture.nativeElement.querySelectorAll('.strct-heatmap__cell')[i].getAttribute('fill');
    const hue = (i: number) => fill(i)!.match(/var\(--[a-z]+\)/)![0];
    const pct = (i: number) => Number(fill(i)!.match(/ (\d+)%/)![1]);

    // 20 (index 5) is below warning → the status hue; 60 → warning; 92 → critical.
    expect([hue(5), hue(15), hue(23)]).toEqual(['var(--acc)', 'var(--warning)', 'var(--critical)']);
    // Within the warning band (40–80): 44 is paler than 76, and both sit at or
    // above the 45% floor, so neither can be mistaken for an empty cell.
    expect(pct(11)).toBeLessThan(pct(19));
    expect(pct(11)).toBeGreaterThanOrEqual(45);
    // A 92% and a 60% hour no longer differ only by shade of one colour.
    expect(hue(23)).not.toBe(hue(15));
  });

  it('without thresholds the single-hue ramp is unchanged', () => {
    const fixture = make({ max: 100 });
    const fills = [...fixture.nativeElement.querySelectorAll('.strct-heatmap__cell')].map((c) =>
      c.getAttribute('fill'),
    );
    expect(fills[24 - 1]).toBe('color-mix(in srgb, var(--acc) 93%, var(--bg-1))'); // 92 of 100
    expect(fills.every((f) => f!.includes('var(--acc)') || f === 'var(--bg-2)')).toBe(true);
  });

  it('thresholds without a critical bound keep the warning band open to the ceiling', () => {
    const fixture = make({ max: 100, thresholds: { warning: 40 } });
    const rects = fixture.nativeElement.querySelectorAll('.strct-heatmap__cell');
    expect(rects[23].getAttribute('fill')).toContain('var(--warning)'); // 92
    expect(rects[5].getAttribute('fill')).toContain('var(--acc)'); // 20
  });
});
