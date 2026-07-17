import { TestBed } from '@angular/core/testing';
import {
  StrctDatagrid,
  StrctDatagridColumn,
  StrctDatagridColumnState,
  StrctDatagridLazyState,
} from './datagrid';
import { StrctRow } from '../table/table';

const COLS: StrctDatagridColumn[] = [{ key: 'n', label: 'N', sortable: true }];
const ROWS: StrctRow[] = [{ n: 'gamma' }, { n: 'alpha' }, { n: 'beta' }];

describe('StrctDatagrid', () => {
  function cells(fixture: ReturnType<typeof TestBed.createComponent<StrctDatagrid>>): string[] {
    return [...fixture.nativeElement.querySelectorAll('tbody td')].map((td) =>
      (td as HTMLElement).textContent!.trim(),
    );
  }

  it('cycles a sortable column ascending → descending → unsorted', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    cmp.sortBy('n');
    fixture.detectChanges();
    expect(cells(fixture)).toEqual(['alpha', 'beta', 'gamma']);

    cmp.sortBy('n');
    fixture.detectChanges();
    expect(cells(fixture)).toEqual(['gamma', 'beta', 'alpha']);

    cmp.sortBy('n');
    fixture.detectChanges();
    expect(cells(fixture)).toEqual(['gamma', 'alpha', 'beta']);
  });

  it('virtual mode renders only the viewport window plus spacers (20k rows)', () => {
    const rows = Array.from({ length: 20000 }, (_, i) => ({ n: `row-${i}`, v: i }));
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [
      { key: 'n', label: 'N' },
      { key: 'v', label: 'V' },
    ] satisfies StrctDatagridColumn[]);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('virtual', true);
    fixture.componentRef.setInput('viewportHeight', 380);
    fixture.componentRef.setInput('rowHeight', 38);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const rendered = host.querySelectorAll('tbody tr:not(.strct-dg__vspacer)').length;
    expect(rendered).toBeLessThan(40); // ~viewport + overscan, never 20k
    expect(host.querySelector('tbody tr:first-child td')?.textContent).toContain('row-0');
    // scrolled deep: window moves, top spacer grows
    const scroller = host.querySelector('.strct-dg__scroll') as HTMLElement;
    Object.defineProperty(scroller, 'scrollTop', { value: 380000, configurable: true });
    scroller.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    const spacer = host.querySelector('.strct-dg__vspacer td') as HTMLElement;
    expect(parseInt(spacer.style.height, 10)).toBeGreaterThan(300000);
    expect(host.textContent).toContain('row-10000');
  });

  it('lazy mode never sorts/slices rows itself and emits lazyLoad on init + sort + page', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('total', 500);
    fixture.componentRef.setInput('pageSize', 3);
    const emitted: StrctDatagridLazyState[] = [];
    fixture.componentInstance.lazyLoad.subscribe((s) => emitted.push(s));
    fixture.detectChanges();
    // initial request
    expect(emitted).toEqual([{ page: 1, pageSize: 3, sortKey: null, sortDir: 'asc' }]);
    // rows shown as given (no client sort even after clicking sort)
    fixture.componentInstance.sortBy('n');
    fixture.detectChanges();
    expect(cells(fixture)).toEqual(['gamma', 'alpha', 'beta']);
    expect(emitted[1]).toEqual({ page: 1, pageSize: 3, sortKey: 'n', sortDir: 'asc' });
    // pager reflects the server total, page change emits
    fixture.componentInstance.page.set(2);
    fixture.detectChanges();
    expect(emitted[2].page).toBe(2);
  });

  it('sticky columns get the frozen class and cumulative left offsets', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [
      { key: 'a', label: 'A', sticky: true, width: '100px' },
      { key: 'b', label: 'B', sticky: true, width: '80px' },
      { key: 'c', label: 'C' },
    ] satisfies StrctDatagridColumn[]);
    fixture.componentRef.setInput('rows', [{ a: 1, b: 2, c: 3 }]);
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('strct-dg-host--sticky');
    const ths = [...host.querySelectorAll('thead th')] as HTMLElement[];
    // select util col frozen at 0; A after the 40px select col; B after A.
    // Offsets are logical (inset-inline-start), so RTL pins to the reading start.
    const inlineStart = (el: HTMLElement) => el.style.getPropertyValue('inset-inline-start');
    expect(ths[0].classList).toContain('strct-dg__cell--sticky');
    expect(inlineStart(ths[0])).toBe('0px');
    expect(inlineStart(ths[1])).toBe('40px');
    expect(inlineStart(ths[2])).toBe('140px'); // 40 (select) + 100 (A)
    expect(ths[2].classList).toContain('strct-dg__cell--sticky-last');
    expect(ths[3].classList).not.toContain('strct-dg__cell--sticky');
  });

  it('columnState round-trips: applying hides columns, chooser changes emit', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [
      { key: 'n', label: 'N' },
      { key: 'x', label: 'X' },
    ] satisfies StrctDatagridColumn[]);
    fixture.componentRef.setInput('rows', [{ n: 1, x: 2 }]);
    fixture.componentRef.setInput('columnState', { hidden: ['x'] });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect([...host.querySelectorAll('thead th')].map((t) => t.textContent?.trim())).toEqual(['N']);
    const states: (StrctDatagridColumnState | null)[] = [];
    fixture.componentInstance.columnState.subscribe((s) => states.push(s));
    fixture.componentInstance.toggleColumn('x', true);
    fixture.detectChanges();
    expect(states.at(-1)?.hidden).toEqual([]);
  });

  it('toCSV exports visible columns with escaping, in the current sort order', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [
      { key: 'n', label: 'Name' },
      { key: 'd', label: 'Desc' },
    ] satisfies StrctDatagridColumn[]);
    fixture.componentRef.setInput('rows', [
      { n: 'a', d: 'plain' },
      { n: 'b', d: 'has, comma "and quotes"' },
    ]);
    fixture.detectChanges();
    const csv = fixture.componentInstance.toCSV();
    expect(csv.split('\n')[0]).toBe('Name,Desc');
    expect(csv).toContain('"has, comma ""and quotes"""');
  });

  it('singleLine toggles the host modifier class (off by default)', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).not.toContain('strct-dg-host--singleline');

    fixture.componentRef.setInput('singleLine', true);
    fixture.detectChanges();
    expect(host.classList).toContain('strct-dg-host--singleline');
  });

  it('emits the selected rows', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    let emitted: StrctRow[] = [];
    cmp.selectionChange.subscribe((rows) => (emitted = rows));
    cmp.toggleRow(ROWS[0]);
    expect(emitted).toEqual([ROWS[0]]);
    cmp.toggleRow(ROWS[0]);
    expect(emitted).toEqual([]);
  });

  it('seeds the selection from initialSelection and re-seeds when it changes', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('rowId', 'n');
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('initialSelection', ['alpha', 'beta']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.strct-dg__row--selected').length).toBe(2);

    // Assigning a new array re-seeds.
    fixture.componentRef.setInput('initialSelection', ['gamma']);
    fixture.detectChanges();
    const sel = [...fixture.nativeElement.querySelectorAll('.strct-dg__row--selected')].map((r) =>
      (r as HTMLElement).textContent!.trim(),
    );
    expect(sel).toEqual(['gamma']);
  });

  it('toggles column visibility via the column chooser', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
    ]);
    fixture.componentRef.setInput('rows', [{ a: '1', b: '2' }]);
    fixture.componentRef.setInput('columnChooser', true);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.strct-dg__actions button');
    expect(btn).toBeTruthy();

    btn.click();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('.strct-dg__chooser-menu');
    expect(menu).toBeTruthy();

    const checkboxes = fixture.nativeElement.querySelectorAll(
      '.strct-dg__chooser-item strct-checkbox',
    );
    expect(checkboxes.length).toBe(2);

    // Hide column 'b'
    fixture.componentInstance.toggleColumn('b', false);
    fixture.detectChanges();

    const ths = fixture.nativeElement.querySelectorAll('thead th');
    expect(ths.length).toBe(1);
    expect(ths[0].textContent!.trim()).toBe('A');
  });
});
