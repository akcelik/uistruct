import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import {
  StrctDatagrid,
  StrctDatagridColumn,
  StrctDatagridColumnState,
  StrctDatagridLazyState,
  StrctRowDetailDef,
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
    expect(emitted).toEqual([
      { filters: {}, quickFilter: '', page: 1, pageSize: 3, sortKey: null, sortDir: 'asc' },
    ]);
    // rows shown as given (no client sort even after clicking sort)
    fixture.componentInstance.sortBy('n');
    fixture.detectChanges();
    expect(cells(fixture)).toEqual(['gamma', 'alpha', 'beta']);
    expect(emitted[1]).toEqual({
      filters: {},
      quickFilter: '',
      page: 1,
      pageSize: 3,
      sortKey: 'n',
      sortDir: 'asc',
    });
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

  it('groupBy renders collapsible group headers with counts, respecting sort', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [
      { key: 'vm', label: 'VM' },
      { key: 'owner', label: 'Owner' },
    ] satisfies StrctDatagridColumn[]);
    fixture.componentRef.setInput('rows', [
      { vm: 'a', owner: 'ops' },
      { vm: 'b', owner: 'dev' },
      { vm: 'c', owner: 'ops' },
    ]);
    fixture.componentRef.setInput('groupBy', 'owner');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const headers = [...host.querySelectorAll('.strct-dg__groupbtn')];
    expect(headers.length).toBe(2);
    expect(headers[0].textContent).toContain('ops');
    expect(headers[0].querySelector('.strct-dg__groupcount')?.textContent?.trim()).toBe('2');
    expect(host.querySelectorAll('tbody tr:not(.strct-dg__grouprow)').length).toBe(3);
    // collapse the first group → its 2 rows disappear
    (headers[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('tbody tr:not(.strct-dg__grouprow)').length).toBe(1);
    expect(headers.length).toBe(2);
  });

  it('drag-reordering columns updates the order and round-trips through columnState', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C' },
    ] satisfies StrctDatagridColumn[]);
    fixture.componentRef.setInput('rows', [{ a: 1, b: 2, c: 3 }]);
    fixture.componentRef.setInput('reorderable', true);
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as {
      onColDragStart(k: string, e: DragEvent): void;
      onColDrop(k: string): void;
    };
    cmp.onColDragStart('c', new Event('dragstart') as DragEvent); // jsdom lacks DragEvent
    cmp.onColDrop('a'); // move C before A
    fixture.detectChanges();
    const heads = [...(fixture.nativeElement as HTMLElement).querySelectorAll('thead th')].map(
      (t) => t.textContent?.trim(),
    );
    expect(heads).toEqual(['C', 'A', 'B']);
    expect(fixture.componentInstance.columnState()?.order).toEqual(['c', 'a', 'b']);
    // applying the order via columnState reproduces it (persistence path)
    const f2 = TestBed.createComponent(StrctDatagrid);
    f2.componentRef.setInput('columns', [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C' },
    ] satisfies StrctDatagridColumn[]);
    f2.componentRef.setInput('rows', [{ a: 1, b: 2, c: 3 }]);
    f2.componentRef.setInput('columnState', { order: ['c', 'a', 'b'] });
    f2.detectChanges();
    const heads2 = [...(f2.nativeElement as HTMLElement).querySelectorAll('thead th')].map((t) =>
      t.textContent?.trim(),
    );
    expect(heads2).toEqual(['C', 'A', 'B']);
  });

  it('toXLSX produces a valid stored ZIP with the sheet data inline', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [
      { key: 'n', label: 'Name' },
      { key: 'v', label: 'Value' },
    ] satisfies StrctDatagridColumn[]);
    fixture.componentRef.setInput('rows', [
      { n: 'alpha', v: 42 },
      { n: 'be<ta>', v: 7 },
    ]);
    fixture.detectChanges();
    const bytes = fixture.componentInstance.toXLSX();
    // ZIP magic + end-of-central-directory present
    expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('[Content_Types].xml');
    expect(text).toContain('xl/worksheets/sheet1.xml');
    expect(text).toContain('<t xml:space="preserve">alpha</t>'); // inline string
    expect(text).toContain('<v>42</v>'); // numeric cell stays numeric
    expect(text).toContain('be&lt;ta&gt;'); // XML-escaped
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

describe('StrctDatagrid column filters', () => {
  const cols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Name', filterable: true },
    { key: 'state', label: 'State', filterOptions: ['running', 'stopped'] },
  ];
  const rows: StrctRow[] = [
    { name: 'web-01', state: 'running' },
    { name: 'web-02', state: 'stopped' },
    { name: 'db-01', state: 'running' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture;
  }
  const bodyNames = (f: ReturnType<typeof make>) =>
    [...f.nativeElement.querySelectorAll('tbody tr td:first-child')].map((td) =>
      (td as HTMLElement).textContent!.trim(),
    );

  it('text filter narrows rows case-insensitively (contains)', () => {
    const fixture = make({ filters: { name: 'WEB' } });
    expect(bodyNames(fixture)).toEqual(['web-01', 'web-02']);
  });

  it('value-set filter keeps only checked values; both filters AND together', () => {
    const fixture = make({ filters: { state: ['running'] } });
    expect(bodyNames(fixture)).toEqual(['web-01', 'db-01']);
    fixture.componentRef.setInput('filters', { state: ['running'], name: 'db' });
    fixture.detectChanges();
    expect(bodyNames(fixture)).toEqual(['db-01']);
  });

  it('opens the header filter popover, types, marks the button active, clears', () => {
    const fixture = make();
    const btn = fixture.nativeElement.querySelector('.strct-dg__filterbtn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.strct-dg__filterinput') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = 'web';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(bodyNames(fixture)).toEqual(['web-01', 'web-02']);
    expect(btn.classList).toContain('strct-dg__filterbtn--active');
    (fixture.nativeElement.querySelector('.strct-dg__filterclear') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(bodyNames(fixture).length).toBe(3);
  });

  it('moves focus into the filter input on open and back to the button on Escape', async () => {
    const fixture = make();
    const btn = fixture.nativeElement.querySelector('.strct-dg__filterbtn') as HTMLButtonElement;
    btn.focus();
    btn.click();
    fixture.detectChanges();
    // Focus moves once the panel has rendered (setTimeout in toggleFilterPanel).
    await new Promise((r) => setTimeout(r, 0));
    const input = fixture.nativeElement.querySelector('.strct-dg__filterinput') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.strct-dg__filterpanel')).toBeNull();
    expect(document.activeElement).toBe(btn);
  });

  it('the text filter input has an aria-label, not just a placeholder', () => {
    const fixture = make();
    (fixture.nativeElement.querySelector('.strct-dg__filterbtn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.strct-dg__filterinput') as HTMLInputElement;
    expect(input.getAttribute('aria-label')).toBe('Filter: Name');
  });

  it('filter button click does not sort, and filters ride on lazyLoad', () => {
    let last: StrctDatagridLazyState | null = null;
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentInstance.lazyLoad.subscribe((s) => (last = s));
    fixture.detectChanges();
    fixture.componentRef.setInput('filters', { name: 'web' });
    fixture.detectChanges();
    expect(last!.filters).toEqual({ name: 'web' });
    // Lazy mode never filters client-side.
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
  });
});

describe('StrctDatagrid tree-grid', () => {
  const cols: StrctDatagridColumn[] = [{ key: 'name', label: 'Name', sortable: true }];
  const rows: StrctRow[] = [
    {
      name: 'cluster-01',
      kids: [{ name: 'hv-02', kids: [{ name: 'vm-b' }, { name: 'vm-a' }] }, { name: 'hv-01' }],
    },
    { name: 'cluster-02' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('childrenKey', 'kids');
    fixture.componentRef.setInput('rowId', 'name');
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture;
  }
  const names = (f: ReturnType<typeof make>) =>
    [...f.nativeElement.querySelectorAll('tbody tr')].map((tr) =>
      (tr as HTMLElement).textContent!.trim(),
    );

  it('renders roots collapsed with carets and aria-level', () => {
    const fixture = make();
    expect(names(fixture)).toEqual(['cluster-01', 'cluster-02']);
    const first = fixture.nativeElement.querySelector('tbody tr')!;
    expect(first.getAttribute('aria-level')).toBe('1');
    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(
      fixture.nativeElement.querySelectorAll('.strct-dg__treebtn:not(.strct-dg__treebtn--leaf)')
        .length,
    ).toBe(1);
  });

  it('expands on caret click, sorts siblings per level, collapses back', () => {
    const fixture = make();
    fixture.componentInstance.sortBy('name');
    fixture.detectChanges();
    const caret = fixture.nativeElement.querySelector(
      '.strct-dg__treebtn:not(.strct-dg__treebtn--leaf)',
    ) as HTMLButtonElement;
    caret.click();
    fixture.detectChanges();
    expect(names(fixture)).toEqual(['cluster-01', 'hv-01', 'hv-02', 'cluster-02']);
    // Expand hv-02 too: its children sort among themselves.
    const carets = fixture.nativeElement.querySelectorAll(
      '.strct-dg__treebtn:not(.strct-dg__treebtn--leaf)',
    );
    (carets[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(names(fixture)).toEqual(['cluster-01', 'hv-01', 'hv-02', 'vm-a', 'vm-b', 'cluster-02']);
    const vmRow = [...fixture.nativeElement.querySelectorAll('tbody tr')].find((tr) =>
      (tr as HTMLElement).textContent!.includes('vm-a'),
    )!;
    expect(vmRow.getAttribute('aria-level')).toBe('3');
    (fixture.nativeElement.querySelector('.strct-dg__treebtn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(names(fixture)).toEqual(['cluster-01', 'cluster-02']);
  });

  it('an active filter shows matches with ancestors, force-expanded', () => {
    const fixture = make({
      columns: [{ key: 'name', label: 'Name', filterable: true }],
      filters: { name: 'vm-a' },
    });
    expect(names(fixture)).toEqual(['cluster-01', 'hv-02', 'vm-a']);
  });

  it('row keyboard: roving tabindex, ArrowUp/Down move, ArrowRight/Left expand/collapse', async () => {
    const fixture = make();
    const trs = () => [...fixture.nativeElement.querySelectorAll('tbody tr')] as HTMLElement[];
    const key = (tr: HTMLElement, k: string) =>
      tr.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

    // Roving tabindex: exactly one row is tabbable.
    expect(trs().map((t) => t.tabIndex)).toEqual([0, -1]);

    // ArrowDown moves the tabindex and focus to the next row.
    key(trs()[0], 'ArrowDown');
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    expect(trs().map((t) => t.tabIndex)).toEqual([-1, 0]);
    expect(document.activeElement).toBe(trs()[1]);

    // ArrowUp moves back.
    key(trs()[1], 'ArrowUp');
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    expect(trs().map((t) => t.tabIndex)).toEqual([0, -1]);
    expect(document.activeElement).toBe(trs()[0]);

    // ArrowRight expands the collapsed parent, ArrowLeft collapses it again.
    key(trs()[0], 'ArrowRight');
    fixture.detectChanges();
    expect(names(fixture)).toEqual(['cluster-01', 'hv-02', 'hv-01', 'cluster-02']);
    expect(trs()[0].getAttribute('aria-expanded')).toBe('true');
    key(trs()[0], 'ArrowLeft');
    fixture.detectChanges();
    expect(names(fixture)).toEqual(['cluster-01', 'cluster-02']);

    // ArrowRight on a leaf row does nothing (no crash, no expansion).
    key(trs()[1], 'ArrowRight');
    fixture.detectChanges();
    expect(names(fixture)).toEqual(['cluster-01', 'cluster-02']);
  });
});

describe('StrctDatagrid inline editing', () => {
  const cols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'cpu', label: 'CPU', editable: true },
  ];
  const rows: StrctRow[] = [{ name: 'web-01', cpu: '4' }];

  function make() {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    const edits: { value: string; previous: unknown }[] = [];
    fixture.componentInstance.cellEdit.subscribe((e) => edits.push(e));
    fixture.detectChanges();
    return { fixture, edits };
  }
  const editableCell = (f: ReturnType<typeof TestBed.createComponent<StrctDatagrid>>) =>
    f.nativeElement.querySelector('.strct-dg__cell--editable') as HTMLElement;

  it('double-click opens an input; Enter commits and emits value + previous', () => {
    const { fixture, edits } = make();
    editableCell(fixture).dispatchEvent(new MouseEvent('dblclick'));
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.strct-dg__editinput') as HTMLInputElement;
    expect(input.value).toBe('4');
    input.value = '8';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(edits).toEqual([{ row: rows[0], column: cols[1], value: '8', previous: '4' } as never]);
    expect(fixture.nativeElement.querySelector('.strct-dg__editinput')).toBeNull();
  });

  it('Escape cancels without emitting; unchanged commit does not emit', () => {
    const { fixture, edits } = make();
    editableCell(fixture).dispatchEvent(new MouseEvent('dblclick'));
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.strct-dg__editinput') as HTMLInputElement;
    input.value = '99';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(edits.length).toBe(0);
    expect(fixture.nativeElement.querySelector('.strct-dg__editinput')).toBeNull();

    // Reopen, commit unchanged via blur: no emit either.
    editableCell(fixture).dispatchEvent(new MouseEvent('dblclick'));
    fixture.detectChanges();
    const again = fixture.nativeElement.querySelector('.strct-dg__editinput') as HTMLInputElement;
    again.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(edits.length).toBe(0);
  });
});

describe('StrctDatagrid quick filter (FR-16-02)', () => {
  const cols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'moref', label: 'Ref' },
  ];
  const rows: StrctRow[] = [
    { name: 'db-prod-01', type: 'vm', moref: 'x1' },
    { name: 'web-01', type: 'vm', moref: 'db-prod' },
    { name: 'edge-01', type: 'host', moref: 'x3' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture;
  }
  const names = (f: ReturnType<typeof make>) =>
    [...f.nativeElement.querySelectorAll('tbody tr td:first-child')].map((td) =>
      (td as HTMLElement).textContent!.trim(),
    );

  it('one term OR-matches across every column by default', () => {
    const fixture = make({ quickFilter: 'db-prod' });
    // Matches name on row 1 and moref on row 2.
    expect(names(fixture)).toEqual(['db-prod-01', 'web-01']);
  });

  it('quickFilterFields restricts the scanned columns', () => {
    const fixture = make({ quickFilter: 'db-prod', quickFilterFields: ['name'] });
    expect(names(fixture)).toEqual(['db-prod-01']);
  });

  it('ANDs with per-column filters and preserves selection identity', () => {
    const fixture = make({
      selectable: true,
      rowId: 'name',
      quickFilter: 'vm',
      filters: { name: 'web' },
    });
    // With selectable on, the first cell is the checkbox — name is cell 2.
    const visibleNames = () =>
      [...fixture.nativeElement.querySelectorAll('tbody tr td:nth-child(2)')].map((td) =>
        (td as HTMLElement).textContent!.trim(),
      );
    expect(visibleNames()).toEqual(['web-01']);
    // Select the visible row, then clear the quick filter: selection survives.
    let selected: StrctRow[] = [];
    fixture.componentInstance.selectionChange.subscribe((s) => (selected = s));
    fixture.componentInstance.toggleRow(rows[1]);
    fixture.componentRef.setInput('quickFilter', '');
    fixture.detectChanges();
    expect(selected.map((r) => r['name'])).toEqual(['web-01']);
    // The per-column filter (name: web) is still active, so web-01 remains the
    // only visible row — and its checkbox is still checked.
    expect(visibleNames()).toEqual(['web-01']);
    const cb = fixture.nativeElement.querySelector('tbody strct-checkbox input');
    expect((cb as HTMLInputElement).checked).toBe(true);
  });

  it('quick filter aligns end by default; start opts out', () => {
    const fixture = make({ quickFilterable: true });
    const box = fixture.nativeElement.querySelector('.strct-dg__quickfilter')!;
    expect(box.classList).toContain('strct-dg__quickfilter--end');
    fixture.componentRef.setInput('quickFilterAlign', 'start');
    fixture.detectChanges();
    expect(box.classList).not.toContain('strct-dg__quickfilter--end');
  });

  it('quickFilterable renders the toolbar searchbox and the N / M note', () => {
    const fixture = make({ quickFilterable: true });
    const box = fixture.nativeElement.querySelector('.strct-dg__quickfilter input')!;
    expect(box).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.strct-dg__filternote')).toBeNull();
    (box as HTMLInputElement).value = 'vm';
    box.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(names(fixture).length).toBe(2);
    expect(fixture.nativeElement.querySelector('.strct-dg__filternote')?.textContent?.trim()).toBe(
      '2 / 3',
    );
  });

  it('lazy mode never filters client-side; the term rides on lazyLoad', () => {
    let last: StrctDatagridLazyState | null = null;
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentInstance.lazyLoad.subscribe((st) => (last = st));
    fixture.detectChanges();
    fixture.componentRef.setInput('quickFilter', 'db-prod');
    fixture.detectChanges();
    expect(last!.quickFilter).toBe('db-prod');
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
  });
});

describe('StrctDatagrid singleLine truncation reveal', () => {
  const cols: StrctDatagridColumn[] = [{ key: 'msg', label: 'Message' }];
  const rows: StrctRow[] = [{ msg: 'a very long certificate subject line that will clip' }];

  function make(singleLine: boolean) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('singleLine', singleLine);
    fixture.detectChanges();
    const td = fixture.nativeElement.querySelector('tbody td') as HTMLElement;
    return { fixture, td };
  }
  // jsdom has no layout — model clipped/fitting cells explicitly.
  const setWidths = (td: HTMLElement, scroll: number, client: number) => {
    Object.defineProperty(td, 'scrollWidth', { value: scroll, configurable: true });
    Object.defineProperty(td, 'clientWidth', { value: client, configurable: true });
  };

  it('hovering a clipped cell reveals the full text as title', () => {
    const { td } = make(true);
    setWidths(td, 500, 360);
    td.dispatchEvent(new Event('mouseover', { bubbles: true }));
    expect(td.getAttribute('title')).toBe(rows[0]['msg']);
  });

  it('a cell that fits gets no title, and a stale title is cleared', () => {
    const { td } = make(true);
    setWidths(td, 500, 360);
    td.dispatchEvent(new Event('mouseover', { bubbles: true }));
    expect(td.getAttribute('title')).toBeTruthy();
    // Column resized wider: the same cell now fits.
    setWidths(td, 360, 360);
    td.dispatchEvent(new Event('mouseover', { bubbles: true }));
    expect(td.getAttribute('title')).toBeNull();
  });

  it('singleLine off — behavior completely unchanged', () => {
    const { td } = make(false);
    setWidths(td, 500, 360);
    td.dispatchEvent(new Event('mouseover', { bubbles: true }));
    expect(td.getAttribute('title')).toBeNull();
  });
});

describe('StrctDatagrid transient surfaces (focus lifecycle)', () => {
  const cols: StrctDatagridColumn[] = [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
  ];
  const rows: StrctRow[] = [{ a: '1', b: '2' }];

  function makeChooser() {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('columnChooser', true);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();
    return fixture;
  }
  const chooserBtn = (f: ReturnType<typeof makeChooser>) =>
    f.nativeElement.querySelector('.strct-dg__actions button') as HTMLButtonElement;
  const chooserMenu = (f: ReturnType<typeof makeChooser>) =>
    f.nativeElement.querySelector('.strct-dg__chooser-menu') as HTMLElement | null;

  it('closes the column chooser on outside click', () => {
    const fixture = makeChooser();
    chooserBtn(fixture).click();
    fixture.detectChanges();
    expect(chooserMenu(fixture)).toBeTruthy();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(chooserMenu(fixture)).toBeNull();
  });

  it('Escape closes the chooser, restores focus to its button and stops propagation', () => {
    const fixture = makeChooser();
    const btn = chooserBtn(fixture);
    btn.focus();
    btn.click();
    fixture.detectChanges();
    expect(chooserMenu(fixture)).toBeTruthy();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(stopSpy).toHaveBeenCalled();
    expect(chooserMenu(fixture)).toBeNull();
    expect(document.activeElement).toBe(btn);
  });

  it('clicking a chooser row toggles the column; the checkbox toggles exactly once', () => {
    const fixture = makeChooser();
    chooserBtn(fixture).click();
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll(
      '.strct-dg__chooser-item',
    ) as NodeListOf<HTMLElement>;

    // Click the row (outside the checkbox) to hide column B.
    items[1].click();
    fixture.detectChanges();
    expect([...fixture.nativeElement.querySelectorAll('thead th')].length).toBe(1);
    // The menu stays open while the user flips columns.
    expect(chooserMenu(fixture)).toBeTruthy();

    // Clicking the checkbox itself flips it back — once, not twice.
    (items[1].querySelector('input') as HTMLInputElement).click();
    fixture.detectChanges();
    expect([...fixture.nativeElement.querySelectorAll('thead th')].length).toBe(2);
  });
});

describe('StrctDatagrid detail pane (focus lifecycle)', () => {
  @Component({
    imports: [StrctDatagrid, StrctRowDetailDef],
    template: `
      <strct-datagrid [columns]="cols" [rows]="rows" detailPane>
        <ng-template strctRowDetail let-row>{{ row['n'] }} detail</ng-template>
      </strct-datagrid>
    `,
  })
  class PaneHost {
    cols: StrctDatagridColumn[] = [{ key: 'n', label: 'N' }];
    rows: StrctRow[] = [{ n: 'a' }, { n: 'b' }];
  }

  function makePane() {
    const fixture = TestBed.createComponent(PaneHost);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.strct-dg__detailbtn') as HTMLButtonElement;
    btn.focus();
    btn.click();
    fixture.detectChanges();
    return { fixture, btn };
  }

  it('Escape closes the pane and focus returns to the row » button', () => {
    const { fixture, btn } = makePane();
    expect(fixture.nativeElement.querySelector('.strct-dg__pane')).toBeTruthy();
    (fixture.nativeElement.querySelector('.strct-dg__pane-close') as HTMLButtonElement).focus();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(stopSpy).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.strct-dg__pane')).toBeNull();
    expect(document.activeElement).toBe(btn);
  });

  it('the pane close button returns focus to the row » button', () => {
    const { fixture, btn } = makePane();
    const closeBtn = fixture.nativeElement.querySelector(
      '.strct-dg__pane-close',
    ) as HTMLButtonElement;
    closeBtn.focus();
    closeBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.strct-dg__pane')).toBeNull();
    expect(document.activeElement).toBe(btn);
  });
});

describe('StrctDatagrid selection integrity', () => {
  it('groupBy + pageSize: select-all covers every rendered row, not the page slice', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [
      { key: 'vm', label: 'VM' },
      { key: 'owner', label: 'Owner' },
    ] satisfies StrctDatagridColumn[]);
    fixture.componentRef.setInput('rows', [
      { vm: 'a', owner: 'ops' },
      { vm: 'b', owner: 'dev' },
      { vm: 'c', owner: 'ops' },
    ]);
    fixture.componentRef.setInput('groupBy', 'owner');
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('rowId', 'vm');
    fixture.componentRef.setInput('pageSize', 2);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    let emitted: StrctRow[] = [];
    cmp.selectionChange.subscribe((s) => (emitted = s));

    // Group mode renders all three rows (paging is bypassed); select-all must
    // match what is on screen, not the two-row page slice.
    cmp.toggleAll();
    fixture.detectChanges();
    expect(emitted.map((r) => r['vm'])).toEqual(['a', 'b', 'c']);
    expect(fixture.nativeElement.querySelectorAll('.strct-dg__row--selected').length).toBe(3);

    // Collapse 'ops': its rows leave the DOM, so the next select-all cycle
    // toggles only the still-rendered row and leaves the collapsed ones alone.
    cmp.toggleGroup('ops');
    fixture.detectChanges();
    cmp.toggleAll();
    fixture.detectChanges();
    expect(emitted.map((r) => r['vm'])).toEqual(['a', 'c']);
    expect(fixture.nativeElement.querySelectorAll('.strct-dg__row--selected').length).toBe(0);
  });

  it('lazy mode: selections from other pages stay in the payload, count and payload agree', () => {
    const page1 = [{ n: 'a' }];
    const page2 = [{ n: 'b' }];
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', page1);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('rowId', 'n');
    fixture.componentRef.setInput('lazy', true);
    fixture.componentRef.setInput('pageSize', 1);
    fixture.componentRef.setInput('total', 2);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    let emitted: StrctRow[] = [];
    cmp.selectionChange.subscribe((s) => (emitted = s));

    cmp.toggleRow(page1[0]);
    expect(emitted.map((r) => r['n'])).toEqual(['a']);

    // The server hands over page 2 — 'a' is gone from the data but stays selected.
    fixture.componentRef.setInput('rows', page2);
    fixture.detectChanges();
    cmp.toggleRow(page2[0]);
    fixture.detectChanges();

    expect(emitted.length).toBe(2);
    expect(emitted.map((r) => r['n']).sort()).toEqual(['a', 'b']);
    // The footer count reads from the same identity set — no disagreement.
    expect(fixture.nativeElement.querySelector('.strct-dg__count-sel')?.textContent?.trim()).toBe(
      '2 selected',
    );

    // Deselecting the on-page row keeps the off-page one in the payload.
    cmp.toggleRow(page2[0]);
    expect(emitted.map((r) => r['n'])).toEqual(['a']);
    cmp.clearSelection();
    expect(emitted).toEqual([]);
  });

  it('labels each row checkbox with its row identifier (localizable factory)', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('rowId', 'n');
    fixture.detectChanges();
    const ariaLabels = () =>
      [...fixture.nativeElement.querySelectorAll('tbody strct-checkbox input')].map((i) =>
        (i as HTMLElement).getAttribute('aria-label'),
      );
    expect(ariaLabels()).toEqual(['Select row gamma', 'Select row alpha', 'Select row beta']);

    fixture.componentRef.setInput('labels', { selectRowFor: (id: string) => `Zeile ${id} wählen` });
    fixture.detectChanges();
    expect(ariaLabels()).toEqual(['Zeile gamma wählen', 'Zeile alpha wählen', 'Zeile beta wählen']);
  });

  it('falls back to the 1-based row index when no rowId is set', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    const labels = [...fixture.nativeElement.querySelectorAll('tbody strct-checkbox input')].map(
      (i) => (i as HTMLElement).getAttribute('aria-label'),
    );
    expect(labels).toEqual(['Select row 1', 'Select row 2', 'Select row 3']);
  });
});

describe('StrctDatagrid column resize lifecycle', () => {
  it('destroying the grid mid-drag removes the document resize listeners', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [{ key: 'n', label: 'N' }]);
    fixture.componentRef.setInput('rows', [{ n: 1 }]);
    fixture.componentRef.setInput('resizable', true);
    fixture.detectChanges();

    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const handle = fixture.nativeElement.querySelector('.strct-dg__resize') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    fixture.destroy();
    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe('StrctDatagrid shift-range selection', () => {
  const RANGE_ROWS: StrctRow[] = [{ n: 'r1' }, { n: 'r2' }, { n: 'r3' }, { n: 'r4' }, { n: 'r5' }];

  function make() {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', RANGE_ROWS);
    fixture.componentRef.setInput('selectable', true);
    fixture.componentRef.setInput('rowId', 'n');
    fixture.detectChanges();
    return fixture;
  }

  /** Click a row checkbox the way a user does — the real input, so the
   *  bubbling click carries the modifier and the change follows it. */
  function click(
    fixture: ReturnType<typeof TestBed.createComponent<StrctDatagrid>>,
    index: number,
    shift = false,
  ): void {
    const inputs = fixture.nativeElement.querySelectorAll('tbody strct-checkbox input');
    (inputs[index] as HTMLInputElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: shift }),
    );
    fixture.detectChanges();
  }

  const selectedNames = (fixture: ReturnType<typeof TestBed.createComponent<StrctDatagrid>>) =>
    [...fixture.nativeElement.querySelectorAll('tbody tr')]
      .filter((tr) => (tr as HTMLElement).classList.contains('strct-dg__row--selected'))
      .map((tr) => (tr as HTMLElement).querySelector('td:nth-child(2)')!.textContent!.trim());

  it('shift-click fills in every row between the anchor and the target', () => {
    const fixture = make();
    let emitted: StrctRow[] = [];
    fixture.componentInstance.selectionChange.subscribe((s) => (emitted = s));

    click(fixture, 1);
    expect(selectedNames(fixture)).toEqual(['r2']);

    click(fixture, 3, true);
    expect(selectedNames(fixture)).toEqual(['r2', 'r3', 'r4']);
    expect(emitted.map((r) => r['n'])).toEqual(['r2', 'r3', 'r4']);
  });

  it('ranges upward too — the anchor may sit below the target', () => {
    const fixture = make();
    click(fixture, 3);
    click(fixture, 1, true);
    expect(selectedNames(fixture)).toEqual(['r2', 'r3', 'r4']);
  });

  it('shift-clicking a selected row clears the range instead of filling it', () => {
    const fixture = make();
    click(fixture, 0);
    click(fixture, 4, true);
    expect(selectedNames(fixture)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5']);

    // r5 is checked, so the same gesture now unchecks — and takes the block with it.
    click(fixture, 2);
    click(fixture, 4, true);
    expect(selectedNames(fixture)).toEqual(['r1', 'r2']);
  });

  it('the anchor stays put, so a second shift-click re-projects from the same origin', () => {
    const fixture = make();
    click(fixture, 0);
    click(fixture, 4, true);
    expect(selectedNames(fixture)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5']);

    // r3 is selected, so this clears the anchor..r3 block. Measured from the
    // original anchor (r1) that is r1–r3, leaving r4/r5; had the range moved
    // the anchor to r5, it would have cleared r3–r5 and left r1/r2 instead.
    click(fixture, 2, true);
    expect(selectedNames(fixture)).toEqual(['r4', 'r5']);
  });

  it('an unmodified click stays a plain toggle and re-seats the anchor', () => {
    const fixture = make();
    click(fixture, 0);
    click(fixture, 2);
    expect(selectedNames(fixture)).toEqual(['r1', 'r3']);

    // The anchor moved to r3, so the range runs r3..r5 — r2 is left alone.
    click(fixture, 4, true);
    expect(selectedNames(fixture)).toEqual(['r1', 'r3', 'r4', 'r5']);
  });

  it('shift with no anchor yet is just a toggle', () => {
    const fixture = make();
    click(fixture, 2, true);
    expect(selectedNames(fixture)).toEqual(['r3']);
  });

  it('toggleRow called programmatically is unaffected by a stale modifier', () => {
    const fixture = make();
    click(fixture, 0);
    fixture.componentInstance.toggleRow(RANGE_ROWS[3]);
    fixture.detectChanges();
    expect(selectedNames(fixture)).toEqual(['r1', 'r4']);
  });
});
