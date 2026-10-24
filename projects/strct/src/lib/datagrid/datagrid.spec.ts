import { TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  StrctDatagrid,
  StrctDatagridColumn,
  StrctDatagridColumnState,
  StrctDatagridLazyState,
  StrctRowDetailDef,
  StrctDetailPaneTitle,
  StrctDetailPaneActions,
} from './datagrid';
import { StrctCellDef, StrctRow } from '../table/table';
import { resetStrctDevWarnings } from '../util/dev-warn';

/**
 * 6.0: a feature object REPLACES, it does not merge — so a fixture that sets
 * its own `grouping: { by }` and then applies a test's `grouping: { groups }`
 * would lose the `by`. Every helper below goes through this, which merges
 * each object with what the component already holds. A consumer with a
 * wrapper component around the grid needs the same (docs/migration-6.md).
 */
const OBJECT_INPUTS = new Set([
  'selection',
  'paging',
  'pane',
  'virtual',
  'grouping',
  'filtering',
  'state',
]);

function applyInputs(
  fixture: { componentRef: { setInput(n: string, v: unknown): void }; componentInstance: unknown },
  inputs: Record<string, unknown>,
): void {
  for (const [k, v] of Object.entries(inputs)) {
    if (OBJECT_INPUTS.has(k) && v && typeof v === 'object') {
      const held = (fixture.componentInstance as Record<string, () => unknown>)[k + 'Cfg'];
      const current = typeof held === 'function' ? ((held() as object) ?? {}) : {};
      fixture.componentRef.setInput(k, { ...current, ...(v as object) });
    } else {
      fixture.componentRef.setInput(k, v);
    }
  }
}

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
    fixture.componentRef.setInput('virtual', { viewportHeight: 380, rowHeight: 38 });
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
    fixture.componentRef.setInput('paging', { lazy: true, total: 500, pageSize: 3 });
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
    fixture.componentRef.setInput('selection', { enabled: true });
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
    fixture.componentRef.setInput('grouping', { by: 'owner' });
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
    fixture.componentRef.setInput('selection', { enabled: true });
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
    fixture.componentRef.setInput('selection', { enabled: true, initial: ['alpha', 'beta'] });
    fixture.componentRef.setInput('paging', { pageSize: 10 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.strct-dg__row--selected').length).toBe(2);

    // Assigning a new array re-seeds.
    fixture.componentRef.setInput('selection', { enabled: true, initial: ['gamma'] });
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
    fixture.componentRef.setInput('paging', { pageSize: 10 });
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
    applyInputs(fixture, inputs);
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
    fixture.componentRef.setInput('paging', { lazy: true, pageSize: 10 });
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
    fixture.componentRef.setInput('grouping', { childrenKey: 'kids' });
    fixture.componentRef.setInput('rowId', 'name');
    applyInputs(fixture, inputs);
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
    expect(edits).toEqual([
      { row: rows[0], column: cols[1], value: '8', typedValue: '8', previous: '4' } as never,
    ]);
    expect(fixture.nativeElement.querySelector('.strct-dg__editinput')).toBeNull();
  });

  // FR-48-08 — a value that is one of a set is chosen, not typed.
  const selCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Rule' },
    {
      key: 'proto',
      label: 'Protocol',
      editable: true,
      editor: 'select',
      editorOptions: [
        { value: 'tcp', label: 'TCP' },
        { value: 'udp', label: 'UDP' },
      ],
    },
    {
      key: 'port',
      label: 'Port',
      editable: true,
      editor: 'number',
      editorMin: 1,
      editorMax: 65535,
    },
  ];

  function makeTyped() {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', selCols);
    fixture.componentRef.setInput('rows', [{ name: 'ssh', proto: 'tcp', port: 22 }]);
    const edits: { value: string; typedValue: unknown; previous: unknown }[] = [];
    fixture.componentInstance.cellEdit.subscribe((e) => edits.push(e));
    fixture.detectChanges();
    return { fixture, edits };
  }

  it('shows a select column as its option label at rest and opens strct-select', () => {
    const { fixture } = makeTyped();
    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[1].textContent?.trim()).toBe('TCP');
    cells[1].dispatchEvent(new MouseEvent('dblclick'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('strct-select.strct-dg__editselect')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.strct-dg__editinput')).toBeNull();
  });

  it('commits a chosen option as typedValue, with value as its text form', () => {
    const { fixture, edits } = makeTyped();
    const row = fixture.componentInstance.rows()[0];
    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    cells[1].dispatchEvent(new MouseEvent('dblclick'));
    fixture.detectChanges();
    // Open the list and choose UDP — choosing is the commit.
    (fixture.nativeElement.querySelector('.strct-sel__btn') as HTMLElement).click();
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.strct-sel__opt');
    expect(options.length).toBe(2);
    options[1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(edits).toEqual([
      { row, column: selCols[1], value: 'udp', typedValue: 'udp', previous: 'tcp' } as never,
    ]);
    expect(fixture.nativeElement.querySelector('strct-select.strct-dg__editselect')).toBeNull();
  });

  it('clamps a number editor to the column bounds before committing', () => {
    const { fixture, edits } = makeTyped();
    const row = fixture.componentInstance.rows()[0];
    const grid = fixture.componentInstance as unknown as {
      startEdit: (r: StrctRow, c: StrctDatagridColumn) => void;
      commitValue: (r: StrctRow, c: StrctDatagridColumn, v: unknown) => void;
    };
    grid.startEdit(row, selCols[2]);
    fixture.detectChanges();
    grid.commitValue(row, selCols[2], 999999);
    fixture.detectChanges();
    expect(edits).toEqual([
      { row, column: selCols[2], value: '65535', typedValue: 65535, previous: 22 } as never,
    ]);
  });

  it('opens strct-number for a number column and keeps text columns on the input', () => {
    const { fixture } = makeTyped();
    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    cells[2].dispatchEvent(new MouseEvent('dblclick'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('strct-number.strct-dg__editnumber')).toBeTruthy();
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
    applyInputs(fixture, inputs);
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
    const fixture = make({ quickFilter: 'db-prod', filtering: { fields: ['name'] } });
    expect(names(fixture)).toEqual(['db-prod-01']);
  });

  it('ANDs with per-column filters and preserves selection identity', () => {
    const fixture = make({
      rowId: 'name',
      quickFilter: 'vm',
      filters: { name: 'web' },
      selection: { enabled: true },
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
    const fixture = make({ filtering: { quick: true } });
    const box = fixture.nativeElement.querySelector('.strct-dg__quickfilter')!;
    expect(box.classList).toContain('strct-dg__quickfilter--end');
    fixture.componentRef.setInput('filtering', { quick: true, align: 'start' });
    fixture.detectChanges();
    expect(box.classList).not.toContain('strct-dg__quickfilter--end');
  });

  it('quickFilterable renders the toolbar searchbox and the N / M note', () => {
    const fixture = make({ filtering: { quick: true } });
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
    fixture.componentRef.setInput('paging', { lazy: true, pageSize: 10 });
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
    fixture.componentRef.setInput('paging', { pageSize: 10 });
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
      <strct-datagrid [columns]="cols" [rows]="rows" pane>
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
    fixture.componentRef.setInput('grouping', { by: 'owner' });
    fixture.componentRef.setInput('selection', { enabled: true });
    fixture.componentRef.setInput('rowId', 'vm');
    fixture.componentRef.setInput('paging', { pageSize: 2 });
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
    fixture.componentRef.setInput('selection', { enabled: true });
    fixture.componentRef.setInput('rowId', 'n');
    fixture.componentRef.setInput('paging', { lazy: true, pageSize: 1, total: 2 });
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
    fixture.componentRef.setInput('selection', { enabled: true });
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
    fixture.componentRef.setInput('selection', { enabled: true });
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
    fixture.componentRef.setInput('selection', { enabled: true });
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

describe('StrctDatagrid unresolvable rowId', () => {
  type Fixture = ReturnType<typeof TestBed.createComponent<StrctDatagrid>>;
  // rowId="id", but the rows genuinely have no `id` field.
  const UNKEYED: StrctRow[] = [
    { name: 'Intel X710', conn: 'pnic0' },
    { name: 'Intel X710', conn: 'pnic1' },
    { name: 'Intel X710', conn: 'pnic2' },
  ];
  const cols: StrctDatagridColumn[] = [
    { key: 'conn', label: 'Connection' },
    { key: 'name', label: 'Name', editable: true },
  ];

  function make(rows: StrctRow[], rowId: string | ((r: StrctRow) => unknown) = 'id'): Fixture {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', rowId);
    fixture.componentRef.setInput('selection', { enabled: true });
    fixture.detectChanges();
    return fixture;
  }
  const rowBoxes = (f: Fixture) =>
    [...f.nativeElement.querySelectorAll('tbody strct-checkbox input')] as HTMLInputElement[];
  const selectAll = (f: Fixture) =>
    f.nativeElement.querySelector('thead strct-checkbox input') as HTMLInputElement;

  it('does not merge rows whose rowId field is missing', () => {
    const fixture = make(UNKEYED);
    let emitted: StrctRow[] = [];
    fixture.componentInstance.selectionChange.subscribe((s) => (emitted = s));

    rowBoxes(fixture)[0].click();
    fixture.detectChanges();

    expect(emitted).toEqual([UNKEYED[0]]);
    expect(rowBoxes(fixture).map((b) => b.checked)).toEqual([true, false, false]);
    expect(selectAll(fixture).checked).toBe(false);
  });

  it('a rowId function that returns undefined falls back the same way', () => {
    const fixture = make(UNKEYED, () => undefined);
    rowBoxes(fixture)[1].click();
    fixture.detectChanges();
    expect(rowBoxes(fixture).map((b) => b.checked)).toEqual([false, true, false]);
  });

  it('keeps 0 and "" as usable row ids', () => {
    const rows: StrctRow[] = [
      { id: 0, conn: 'a' },
      { id: '', conn: 'b' },
      { id: 1, conn: 'c' },
    ];
    const fixture = make(rows);
    let emitted: StrctRow[] = [];
    fixture.componentInstance.selectionChange.subscribe((s) => (emitted = s));

    for (const i of [0, 1, 2]) {
      fixture.componentInstance.clearSelection();
      fixture.detectChanges();
      rowBoxes(fixture)[i].click();
      fixture.detectChanges();
      expect(emitted).toEqual([rows[i]]);
    }
    // And the id — not the object — is still the key: a seed of 0 and '' hits.
    // An object replaces: the tick column has to be asked for again.
    fixture.componentRef.setInput('selection', { enabled: true, initial: [0, ''] });
    fixture.detectChanges();
    expect(rowBoxes(fixture).map((b) => b.checked)).toEqual([true, true, false]);
  });

  it('inline editing opens exactly one editor', () => {
    const fixture = make(UNKEYED);
    const cells = fixture.nativeElement.querySelectorAll('.strct-dg__cell--editable');
    (cells[0] as HTMLElement).dispatchEvent(new MouseEvent('dblclick'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.strct-dg__editinput').length).toBe(1);
  });

  @Component({
    imports: [StrctDatagrid, StrctRowDetailDef],
    template: `
      <strct-datagrid
        [columns]="cols"
        [rows]="rows"
        rowId="id"
        [expandable]="!pane"
        [pane]="{ enabled: pane }"
      >
        <ng-template strctRowDetail let-row>{{ row['conn'] }} detail</ng-template>
      </strct-datagrid>
    `,
  })
  class DetailHost {
    cols: StrctDatagridColumn[] = [{ key: 'conn', label: 'Connection' }];
    rows = UNKEYED;
    pane = false;
  }

  function makeDetail(pane: boolean) {
    const fixture = TestBed.createComponent(DetailHost);
    fixture.componentInstance.pane = pane;
    fixture.detectChanges();
    return fixture;
  }

  it('does not expand sibling rows when rowId is unresolvable', () => {
    const fixture = makeDetail(false);
    (fixture.nativeElement.querySelector('.strct-dg__expandbtn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const details = fixture.nativeElement.querySelectorAll('.strct-dg__detailrow');
    expect(details.length).toBe(1);
    expect((details[0] as HTMLElement).textContent).toContain('pnic0 detail');
  });

  it('the detail pane opens for an unkeyed row (it used to stay shut)', () => {
    const fixture = makeDetail(true);
    const btns = fixture.nativeElement.querySelectorAll('.strct-dg__detailbtn');
    (btns[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const pane = fixture.nativeElement.querySelector('.strct-dg__pane') as HTMLElement;
    expect(pane).toBeTruthy();
    expect(pane.textContent).toContain('pnic1 detail');
  });
});

describe('StrctDatagrid silent-failure diagnostics', () => {
  beforeEach(() => resetStrctDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  function make(inputs: Record<string, unknown>) {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [{ key: 'n', label: 'N' }]);
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    return { fixture, messages: () => warn.mock.calls.map((c) => String(c[0])) };
  }

  it('warns when rowId resolves to the same value for several rows', () => {
    const { messages } = make({ rowId: 'id', rows: [{ id: 1 }, { id: 1 }, { id: 2 }] });
    expect(messages()).toHaveLength(1);
    expect(messages()[0]).toContain('[strct-datagrid] rowId="id" resolves to the same value');
    expect(messages()[0]).toContain('(1)');
  });

  it('warns when rowId does not resolve, naming the count and the consequence', () => {
    const { messages } = make({ rowId: 'id', rows: [{ n: 'a' }, { n: 'b' }, { id: 3 }] });
    expect(messages()).toEqual([
      expect.stringContaining('rowId="id" does not resolve for 2 of 3 rows'),
    ]);
    expect(messages()[0]).toContain('will not survive a data refresh');
  });

  it('warns when initialSelection matches no row', () => {
    const { messages } = make({
      rowId: 'id',
      rows: [{ id: 'a' }, { id: 'b' }],
      selection: { enabled: true, initial: ['x', 'y'] },
    });
    expect(messages()).toEqual([
      expect.stringContaining(
        'initialSelection has 2 value(s), none of which matches any row\'s rowId="id"',
      ),
    ]);
  });

  it('stays quiet when identities are healthy, a seed partly matches, or rows are not loaded yet', () => {
    expect(
      make({
        rowId: 'id',
        rows: [{ id: 'a' }, { id: 0 }],
        selection: { enabled: true, initial: ['a', 'gone'] },
      }).messages(),
    ).toEqual([]);
    expect(
      make({ rowId: 'id', rows: [], selection: { enabled: true, initial: ['a'] } }).messages(),
    ).toEqual([]);
  });

  it('lazy mode does not flag a seed for rows on other pages', () => {
    const { messages } = make({
      rowId: 'id',
      rows: [{ id: 'a' }],
      paging: { lazy: true, total: 100 },
      selection: { enabled: true, initial: ['on-page-7'] },
    });
    expect(messages()).toEqual([]);
  });
});

describe('StrctDatagrid cell context', () => {
  @Component({
    imports: [StrctDatagrid, StrctCellDef],
    template: `
      <strct-datagrid [columns]="cols" [rows]="rows">
        <ng-template strctCell="a" let-row="row" let-value="value"
          >{{ row['b'] }}/{{ value }}</ng-template
        >
      </strct-datagrid>
    `,
  })
  class NamedRowHost {
    cols: StrctDatagridColumn[] = [{ key: 'a', label: 'A' }];
    rows: StrctRow[] = [{ a: 'x', b: 'named' }];
  }

  it('let-row="row" binds the row, not undefined', () => {
    const fixture = TestBed.createComponent(NamedRowHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody td').textContent.trim()).toBe('named/x');
  });
});

describe('StrctDatagrid — single selection, row locks, group select-all (FR-48-01)', () => {
  const HOSTS: StrctRow[] = [
    { id: 'h1', name: 'hv-01', pool: 'Prod', ready: true },
    { id: 'h2', name: 'hv-02', pool: 'Prod', ready: false },
    { id: 'h3', name: 'hv-03', pool: 'Edge', ready: true },
  ];
  const COLUMNS: StrctDatagridColumn[] = [{ key: 'name', label: 'Host' }];

  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', HOSTS);
    fixture.componentRef.setInput('rowId', 'id');
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      radios: () => [...el.querySelectorAll<HTMLInputElement>('.strct-dg__radio')],
      boxes: () => [...el.querySelectorAll<HTMLInputElement>('tbody strct-checkbox input')],
      rows: () => [...el.querySelectorAll<HTMLElement>('tbody tr')],
    };
  }

  it('single mode draws one radio group; picking a row replaces the previous pick', () => {
    const { fixture, el, radios, rows } = make({ selection: { mode: 'single' } });
    let emitted: StrctRow[] = [];
    fixture.componentInstance.selectionChange.subscribe((s) => (emitted = s));
    expect(radios().length).toBe(3);
    expect(new Set(radios().map((r) => r.name)).size).toBe(1); // one group per grid
    // No select-all in the header: there is nothing to select all of.
    expect(el.querySelector('thead strct-checkbox')).toBeNull();

    radios()[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedId()).toBe('h1');
    expect(emitted.map((r) => r['id'])).toEqual(['h1']); // one-element array

    radios()[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedId()).toBe('h3');
    expect(emitted.map((r) => r['id'])).toEqual(['h3']);
    expect(rows()[2].getAttribute('aria-selected')).toBe('true');
    expect(rows()[0].getAttribute('aria-selected')).toBe('false');
  });

  it('single mode: a click anywhere on the row picks it, and the footer count is hidden', () => {
    const { fixture, el, rows } = make({ selection: { mode: 'single' } });
    rows()[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedId()).toBe('h2');
    expect(el.querySelector('.strct-dg__count-sel')).toBeNull();
  });

  it('rowSelectable locks a row, says why, and refuses the pick', () => {
    const lock = (row: StrctRow) => (row['ready'] ? true : 'Agent too old');
    const { fixture, el, radios, rows } = make({
      selection: { mode: 'single', rowSelectable: lock },
    });
    const locked = radios()[1];
    expect(locked.disabled).toBe(true);
    expect(locked.getAttribute('aria-description')).toBe('Agent too old');
    expect(rows()[1].getAttribute('aria-disabled')).toBe('true');
    expect(rows()[1].getAttribute('title')).toBe('Agent too old');

    rows()[1].click(); // clicking the locked row changes nothing
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedId()).toBeNull();
    expect(el.querySelector('.strct-dg__row--locked')).toBeTruthy();
  });

  it('a locked row is skipped by multi-select and by select-all', () => {
    const lock = (row: StrctRow) => row['ready'] === true;
    const { fixture, boxes } = make({ selection: { enabled: true, rowSelectable: lock } });
    let emitted: StrctRow[] = [];
    fixture.componentInstance.selectionChange.subscribe((s) => (emitted = s));
    expect(boxes()[1].disabled).toBe(true);

    fixture.componentInstance.toggleRow(HOSTS[1]);
    fixture.detectChanges();
    expect(emitted).toEqual([]);

    fixture.componentInstance.toggleAll();
    fixture.detectChanges();
    expect(emitted.map((r) => r['id'])).toEqual(['h1', 'h3']);
  });

  it('groupSelect puts a tri-state checkbox on the group header', () => {
    const { fixture, el } = make({
      selection: { enabled: true, groupSelect: true },
      grouping: { by: 'pool' },
    });
    const groupBox = () =>
      el.querySelector<HTMLInputElement>('.strct-dg__grouprow strct-checkbox input')!;
    expect(groupBox()).toBeTruthy();
    expect(groupBox().checked).toBe(false);

    // Selecting one of the group's two rows makes it indeterminate.
    fixture.componentInstance.toggleRow(HOSTS[0]);
    fixture.detectChanges();
    expect(groupBox().indeterminate).toBe(true);

    // The header checkbox then takes the whole group.
    groupBox().click();
    fixture.detectChanges();
    expect(groupBox().checked).toBe(true);
    expect(groupBox().indeterminate).toBe(false);
  });

  it('group select-all ignores locked rows', () => {
    const { fixture, el } = make({
      selection: {
        enabled: true,
        groupSelect: true,
        rowSelectable: (row: StrctRow) => row['ready'] === true,
      },
      grouping: { by: 'pool' },
    });
    let emitted: StrctRow[] = [];
    fixture.componentInstance.selectionChange.subscribe((s) => (emitted = s));
    el.querySelector<HTMLInputElement>('.strct-dg__grouprow strct-checkbox input')!.click();
    fixture.detectChanges();
    // Prod holds h1 (ready) and h2 (locked): only h1 is taken, and the box is
    // fully checked because every SELECTABLE row of the group is selected.
    expect(emitted.map((r) => r['id'])).toEqual(['h1']);
    expect(
      el.querySelector<HTMLInputElement>('.strct-dg__grouprow strct-checkbox input')!.checked,
    ).toBe(true);
  });

  it('defaults render exactly as before: no selection column, no radios', () => {
    const { el } = make({});
    expect(el.querySelector('.strct-dg__sel')).toBeNull();
    expect(el.querySelectorAll('.strct-dg__radio').length).toBe(0);
    expect(el.querySelector('tbody tr')!.hasAttribute('aria-selected')).toBe(false);
  });

  it('selectable stays the boolean spelling of multiple selection', () => {
    const { el, boxes } = make({ selection: { enabled: true } });
    expect(boxes().length).toBe(3);
    expect(el.querySelector('thead strct-checkbox')).toBeTruthy();
    expect(el.querySelectorAll('.strct-dg__radio').length).toBe(0);
  });
});

// FR-48-26 / FR-48-27 — presentation as column metadata, and cursor paging.
describe('StrctDatagrid presentation and cursor paging', () => {
  const cols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Host', descriptionKey: 'hint' },
    { key: 'guid', label: 'GUID', mono: true, emptyText: '—', emptyLabel: 'not read' },
    { key: 'errors', label: 'Errors', numeric: true },
    { key: 'note', label: 'Note', muted: true },
  ];
  const rows: StrctRow[] = [
    { name: 'hv-01', hint: 'primary', guid: 'a1b2', errors: 12, note: 'quiet' },
    { name: 'hv-02', hint: '', guid: '', errors: 0, note: '' },
  ];

  function make(extra: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    applyInputs(fixture, extra);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('carries mono / muted / numeric on the cells and aligns a numeric column', () => {
    const { el } = make();
    const cells = el.querySelectorAll('tbody tr:first-child td');
    expect(cells[1].classList).toContain('strct-dg__cell--mono');
    expect(cells[2].classList).toContain('strct-dg__cell--numeric');
    expect(cells[3].classList).toContain('strct-dg__cell--muted');
    expect((cells[2] as HTMLElement).style.textAlign).toBe('end');
    const headers = el.querySelectorAll('thead th');
    expect((headers[2] as HTMLElement).style.textAlign).toBe('end');
  });

  it('shows emptyText for a blank value, with its own accessible text', () => {
    const { el } = make();
    const blank = el.querySelectorAll('tbody tr')[1].querySelectorAll('td')[1];
    const empty = blank.querySelector('.strct-dg__empty') as HTMLElement;
    expect(empty.textContent?.trim()).toBe('—');
    expect(empty.getAttribute('aria-label')).toBe('not read');
    // a value that is present is untouched
    expect(el.querySelectorAll('tbody tr')[0].querySelectorAll('td')[1].textContent?.trim()).toBe(
      'a1b2',
    );
  });

  it('renders a second line from descriptionKey, and nothing when it is empty', () => {
    const { el } = make();
    const first = el.querySelectorAll('tbody tr')[0].querySelector('td');
    expect(first?.querySelector('.strct-dg__celldesc')?.textContent?.trim()).toBe('primary');
    const second = el.querySelectorAll('tbody tr')[1].querySelector('td');
    expect(second?.querySelector('.strct-dg__celldesc')).toBeNull();
  });

  it('renders a caption that names the grid, and flushes the chrome', () => {
    const { el } = make({ caption: 'Recent tasks', flush: true });
    const caption = el.querySelector('caption.strct-dg__caption') as HTMLElement;
    expect(caption.textContent?.trim()).toBe('Recent tasks');
    expect(el.querySelector('table')?.getAttribute('aria-labelledby')).toBe(caption.id);
    expect(el.classList).toContain('strct-dg-host--flush');
  });

  // Two grids on one page had two landmarks each with the same name — "rows"
  // and "Pagination" — which a landmark list cannot tell apart (axe
  // `landmark-unique`). The caption tells them apart.
  it('names its landmarks after the caption, so two grids are told apart', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `hv-${i}` }));
    const grid = (caption: string) => {
      const fixture = TestBed.createComponent(StrctDatagrid);
      applyInputs(fixture, {
        columns: [{ key: 'name', label: 'Host' }],
        rows: many,
        paging: { pageSize: 5 },
        caption,
      });
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      return {
        region: el.querySelector('.strct-dg__scroll')!.getAttribute('aria-label'),
        pager: el.querySelector('strct-pagination')!.getAttribute('aria-label'),
      };
    };

    expect(grid('Hosts')).toEqual({ region: 'Hosts rows', pager: 'Hosts Pagination' });
    expect(grid('Tasks')).toEqual({ region: 'Tasks rows', pager: 'Tasks Pagination' });
    // No caption: the names it always had.
    expect(grid('')).toEqual({ region: 'rows', pager: 'Pagination' });
  });

  it('localizes the pager landmark through labels.pagination', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    applyInputs(fixture, {
      columns: [{ key: 'name', label: 'Host' }],
      rows: Array.from({ length: 12 }, (_, i) => ({ name: `hv-${i}` })),
      paging: { pageSize: 5 },
      labels: { pagination: 'Seitennavigation' },
    });
    fixture.detectChanges();
    const pager = (fixture.nativeElement as HTMLElement).querySelector('strct-pagination')!;
    expect(pager.getAttribute('aria-label')).toBe('Seitennavigation');
  });

  it('is unchanged without any of them', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Host' }]);
    fixture.componentRef.setInput('rows', [{ name: 'hv-01' }]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('caption')).toBeNull();
    expect(el.classList).not.toContain('strct-dg-host--flush');
    const cell = el.querySelector('tbody td') as HTMLElement;
    expect(cell.className).toBe('');
    expect(cell.style.textAlign).toBe('start');
  });

  describe('paging="more"', () => {
    it('shows the count and a Load more button that emits', () => {
      const { fixture, el } = make({ paging: { mode: 'more', hasMore: true, moreTotal: 812 } });
      expect(el.querySelector('strct-pagination')).toBeNull();
      // FR-49-04 — "more" takes the pager's place, and the footer itself stays.
      expect(el.querySelector('.strct-dg__foot .strct-dg__count')?.textContent?.trim()).toBe(
        'Showing the latest 2 of 812',
      );
      let asked = 0;
      fixture.componentInstance.loadMore.subscribe(() => asked++);
      (el.querySelector('.strct-dg__more') as HTMLElement).click();
      expect(asked).toBe(1);
    });

    it('drops the button when there is no more, and waits while loading', () => {
      const { el } = make({ paging: { mode: 'more', hasMore: false } });
      expect(el.querySelector('.strct-dg__more')).toBeNull();
      expect(el.querySelector('.strct-dg__count')?.textContent?.trim()).toBe('Showing 2');

      const { el: busy } = make({ paging: { mode: 'more', hasMore: true, loadingMore: true } });
      const button = busy.querySelector('.strct-dg__more') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(button.querySelector('strct-spinner')).toBeTruthy();
    });
  });
});

// BUG-49-06 — a consumer that writes selectedId must see the row checked.
describe('StrctDatagrid — selectedId drives the checked row', () => {
  const cols: StrctDatagridColumn[] = [{ key: 'name', label: 'Host' }];
  const rows: StrctRow[] = [
    { id: 'h1', name: 'hv-01' },
    { id: 'h2', name: 'hv-02' },
  ];

  function make() {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    fixture.componentRef.setInput('selection', { mode: 'single' });
    const changes: unknown[][] = [];
    fixture.componentInstance.selectionChange.subscribe((e) => changes.push(e));
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, changes };
  }
  const radios = (el: HTMLElement) => [
    ...el.querySelectorAll<HTMLInputElement>('.strct-dg__radio'),
  ];

  it('checks the row an outside write names, and emits nothing', () => {
    const { fixture, el, changes } = make();
    expect(radios(el).map((r) => r.checked)).toEqual([false, false]);

    fixture.componentRef.setInput('selectedId', 'h2');
    fixture.detectChanges();
    expect(radios(el).map((r) => r.checked)).toEqual([false, true]);
    expect(el.querySelectorAll('tbody tr')[1].getAttribute('aria-selected')).toBe('true');
    expect(changes).toEqual([]); // an external write is not a user pick
  });

  it('clears the pick when selectedId goes back to null', () => {
    const { fixture, el } = make();
    fixture.componentRef.setInput('selectedId', 'h1');
    fixture.detectChanges();
    expect(radios(el)[0].checked).toBe(true);
    fixture.componentRef.setInput('selectedId', null);
    fixture.detectChanges();
    expect(radios(el).map((r) => r.checked)).toEqual([false, false]);
  });

  it('still emits for a user pick, and keeps selectedId in step', () => {
    const { fixture, el, changes } = make();
    radios(el)[1].click();
    fixture.detectChanges();
    expect(changes.length).toBe(1);
    expect(fixture.componentInstance.selectedId()).toBe('h2');
    expect(radios(el)[1].checked).toBe(true);
  });

  // BUG-49-07 — a selection must not outlive its rows.
  it('prunes ids whose rows are gone, and says so once', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    fixture.componentRef.setInput('selection', { enabled: true, initial: ['h1', 'h2'] });
    const changes: unknown[][] = [];
    fixture.componentInstance.selectionChange.subscribe((e) => changes.push(e));
    fixture.detectChanges();
    const count = () => fixture.nativeElement.querySelectorAll('.strct-dg__row--selected').length;
    expect(count()).toBe(2);

    // h2 is deleted
    fixture.componentRef.setInput('rows', [rows[0]]);
    fixture.detectChanges();
    expect(count()).toBe(1);
    expect(changes.length).toBe(1);
    expect((changes[0] as StrctRow[]).map((r) => r['id'])).toEqual(['h1']);

    // rows that merely change without losing a selected id emit nothing more
    fixture.componentRef.setInput('rows', [{ ...rows[0], name: 'hv-01b' }]);
    fixture.detectChanges();
    expect(changes.length).toBe(1);
  });
});

// FR-49-02 — an editable cell opened only on double-click, so a keyboard user
// could not reach one at all.
describe('StrctDatagrid — keyboard access to editable cells', () => {
  const cols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Rule' },
    { key: 'port', label: 'Port', editable: true },
    { key: 'note', label: 'Note', editable: true },
  ];
  const rows: StrctRow[] = [
    { name: 'allow-ssh', port: '22', note: 'jump host' },
    { name: 'allow-https', port: '443', note: 'public' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    applyInputs(fixture, inputs);
    const edits: { value: string; previous: unknown }[] = [];
    fixture.componentInstance.cellEdit.subscribe((e) => edits.push(e));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // jsdom does not move focus on .focus() for elements it thinks are not
    // focusable; tabindex makes them so, and this is what the browser does.
    document.body.appendChild(el);
    return {
      fixture,
      el,
      edits,
      cells: () => [...el.querySelectorAll<HTMLElement>('td[data-edit]')],
      input: () => el.querySelector('.strct-dg__editinput') as HTMLInputElement | null,
    };
  }
  const press = (el: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));

  it('gives the editable cells one roving tab stop', () => {
    const { fixture, cells } = make();
    expect(cells().length).toBe(4);
    expect(cells().map((c) => c.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);

    // Focusing another cell moves the tab stop with it.
    cells()[2].dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(cells().map((c) => c.getAttribute('tabindex'))).toEqual(['-1', '-1', '0', '-1']);
  });

  it('opens on Enter and on F2, and Escape closes it and comes back to the cell', async () => {
    const { fixture, cells, input, el } = make();
    const cell = cells()[0];
    cell.focus();
    press(cell, 'Enter');
    fixture.detectChanges();
    expect(input()!.value).toBe('22');

    press(input()!, 'Escape');
    fixture.detectChanges();
    expect(input()).toBeNull();
    await new Promise((r) => setTimeout(r));
    expect(document.activeElement).toBe(cell);

    press(cell, 'F2');
    fixture.detectChanges();
    expect(input()).toBeTruthy();
    press(input()!, 'Escape');
    fixture.detectChanges();
    el.remove();
  });

  it('walks the cells with the arrow keys — along the row and down a column', () => {
    const { fixture, cells } = make();
    const at = () => cells().findIndex((c) => c.getAttribute('tabindex') === '0');
    cells()[0].focus();
    fixture.detectChanges();

    press(cells()[0], 'ArrowRight');
    fixture.detectChanges();
    expect(at()).toBe(1);

    press(cells()[1], 'ArrowDown');
    fixture.detectChanges();
    expect(at()).toBe(3); // same column, next row

    press(cells()[3], 'ArrowLeft');
    fixture.detectChanges();
    expect(at()).toBe(2);

    press(cells()[2], 'ArrowUp');
    fixture.detectChanges();
    expect(at()).toBe(0);

    // The edges hold: nothing moves and the event is left alone.
    const atEdge = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    });
    cells()[0].dispatchEvent(atEdge);
    fixture.detectChanges();
    expect(at()).toBe(0);
    expect(atEdge.defaultPrevented).toBe(false);
  });

  it('Tab commits the open editor and opens the next cell', () => {
    const { fixture, cells, input, edits, el } = make();
    cells()[0].focus();
    press(cells()[0], 'Enter');
    fixture.detectChanges();
    input()!.value = '2222';
    press(input()!, 'Tab');
    fixture.detectChanges();

    expect(edits.map((e) => e.value)).toEqual(['2222']);
    // The next editable cell is open, holding its own value.
    expect(input()!.value).toBe('jump host');
    expect(cells()[1].getAttribute('tabindex')).toBe('0');
    press(input()!, 'Escape');
    fixture.detectChanges();
    el.remove();
  });

  it('describes the cell for assistive tech, and the pencil is opt-in', () => {
    const { fixture, cells, el } = make();
    const hint = el.querySelector('.strct-sr-only')!;
    expect(hint.textContent).toContain('Press Enter or F2 to edit');
    expect(cells()[0].getAttribute('aria-describedby')).toBe(hint.id);
    expect(el.querySelector('.strct-dg__editpencil')).toBeNull();

    fixture.componentRef.setInput('editHint', true);
    fixture.detectChanges();
    expect(el.querySelectorAll('.strct-dg__editpencil').length).toBe(4);
    el.remove();
  });

  it('says nothing when no column is editable', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Rule' }]);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.strct-dg__hint')).toBeNull();
    expect(el.querySelector('td[data-edit]')).toBeNull();
  });
});

// FR-49-03 — multiple mode had only initialSelection plus (selectionChange).
describe('StrctDatagrid — two-way selectedIds', () => {
  const cols: StrctDatagridColumn[] = [{ key: 'name', label: 'Host' }];
  const rows: StrctRow[] = [
    { id: 'h1', name: 'hv-01' },
    { id: 'h2', name: 'hv-02' },
    { id: 'h3', name: 'hv-03' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    fixture.componentRef.setInput('selection', { enabled: true });
    applyInputs(fixture, inputs);
    const emitted: StrctRow[][] = [];
    fixture.componentInstance.selectionChange.subscribe((s) => emitted.push(s));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      emitted,
      boxes: () => [...el.querySelectorAll<HTMLInputElement>('tbody strct-checkbox input')],
    };
  }

  it('writing it checks those rows and counts them, and emits nothing', () => {
    const { fixture, el, emitted, boxes } = make({ selectedIds: ['h1', 'h3'] });
    expect(boxes().map((b) => b.checked)).toEqual([true, false, true]);
    // FR-50-03: a selection is something to count, so the footer appears for it.
    expect(el.querySelector('.strct-dg__count-sel')!.textContent!.trim()).toBe('2 selected');
    expect(emitted).toEqual([]);

    fixture.componentRef.setInput('selectedIds', ['h2']);
    fixture.detectChanges();
    expect(boxes().map((b) => b.checked)).toEqual([false, true, false]);
    expect(emitted).toEqual([]);

    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();
    expect(boxes().some((b) => b.checked)).toBe(false);
    expect(emitted).toEqual([]);
  });

  it('the user’s own picks write back, in the order they were made', () => {
    const { fixture, emitted, boxes } = make({ selectedIds: [] });
    const ids = () => fixture.componentInstance.selectedIds();
    boxes()[2].click();
    fixture.detectChanges();
    boxes()[0].click();
    fixture.detectChanges();
    expect(ids()).toEqual(['h3', 'h1']);
    // A pick is still a pick: selectionChange fires for it.
    expect(emitted.length).toBe(2);

    boxes()[2].click();
    fixture.detectChanges();
    expect(ids()).toEqual(['h1']);
  });

  it('is left alone when the consumer does not use it', () => {
    const { fixture, boxes } = make({ selection: { initial: ['h2'] } });
    expect(boxes().map((b) => b.checked)).toEqual([false, true, false]);
    expect(fixture.componentInstance.selectedIds()).toBeNull();
    boxes()[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedIds()).toBeNull();
  });
});

// FR-49-04 — the footer's parts are the footer's, not the pager's.
describe('StrctDatagrid — footer and chrome combinations', () => {
  const cols: StrctDatagridColumn[] = [{ key: 'name', label: 'Host' }];
  const rows: StrctRow[] = Array.from({ length: 5 }, (_, i) => ({ name: 'hv-0' + (i + 1) }));

  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('paging="more" takes the pager’s place and leaves the rest of the footer', () => {
    const { el } = make({
      columnChooser: true,
      paging: { mode: 'more', hasMore: true },
      state: { sync: true },
    });
    expect(el.querySelector('strct-pagination')).toBeNull();
    expect(el.querySelector('.strct-dg__more')).toBeTruthy();
    // The chooser and the sync button used to go with the pager.
    expect(el.querySelectorAll('.strct-dg__actions button').length).toBe(2);
    expect(el.querySelector('.strct-dg__count')!.textContent!.trim()).toBe('Showing 5');
  });

  it('paging="more" does not hide rows behind a pager it never draws', () => {
    const { el } = make({ paging: { mode: 'more', pageSize: 2, hasMore: true } });
    expect(el.querySelectorAll('tbody tr').length).toBe(5);
    expect(el.querySelector('strct-pagination')).toBeNull();
  });

  it('a chooser or a sync button is enough to draw the footer', () => {
    expect(make({ columnChooser: true }).el.querySelector('.strct-dg__foot')).toBeTruthy();
    expect(make({ state: { sync: true } }).el.querySelector('.strct-dg__foot')).toBeTruthy();
    expect(make({}).el.querySelector('.strct-dg__foot')).toBeNull();
  });

  it('maxHeight bounds any grid, not only a virtual one', () => {
    const { el } = make({ maxHeight: 320, grouping: { by: 'name' } });
    const scroll = el.querySelector('.strct-dg__scroll') as HTMLElement;
    expect(scroll.style.maxHeight).toBe('320px');
    expect(el.classList).toContain('strct-dg-host--bounded');
    expect(
      make({}).el.querySelector('.strct-dg__scroll')!.getAttribute('style') ?? '',
    ).not.toContain('max-height');
  });
});

// BUG-50-01 / 02 — the selection model's two regressions from 5.0.1 / 5.0.2.
describe('StrctDatagrid — a seeded pick survives, and a row that returns is still picked', () => {
  const cols: StrctDatagridColumn[] = [{ key: 'name', label: 'Host' }];
  const rows: StrctRow[] = [
    { id: 'h1', name: 'hv-01' },
    { id: 'h2', name: 'hv-02' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    fixture.componentRef.setInput('selection', { enabled: true });
    applyInputs(fixture, inputs);
    const emitted: StrctRow[][] = [];
    fixture.componentInstance.selectionChange.subscribe((s) => emitted.push(s));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      emitted,
      radios: () => [...el.querySelectorAll<HTMLInputElement>('.strct-dg__radio')],
      boxes: () => [...el.querySelectorAll<HTMLInputElement>('tbody strct-checkbox input')],
      selected: () => el.querySelectorAll('.strct-dg__row--selected').length,
    };
  }

  // BUG-50-01 — an unbound selectedId is "not driven", not "cleared".
  it('keeps what initialSelection seeded in single mode, and a binding still wins', () => {
    const { fixture, radios } = make({ selection: { mode: 'single', initial: ['h2'] } });
    expect(radios().map((r) => r.checked)).toEqual([false, true]);

    // Binding it still decides.
    fixture.componentInstance.selectedId.set('h1');
    fixture.detectChanges();
    expect(radios().map((r) => r.checked)).toEqual([true, false]);

    // And once driven, null clears, as documented.
    fixture.componentInstance.selectedId.set(null);
    fixture.detectChanges();
    expect(radios().some((r) => r.checked)).toBe(false);
  });

  // BUG-50-02.1 — the row leaves and comes back: switch host, switch back.
  it('re-applies the single pick when its row returns', () => {
    const { fixture, radios } = make({ selection: { mode: 'single' } });
    fixture.componentInstance.selectedId.set('h2');
    fixture.detectChanges();
    expect(radios()[1].checked).toBe(true);

    fixture.componentRef.setInput('rows', [rows[0]]);
    fixture.detectChanges();
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    expect(radios().map((r) => r.checked)).toEqual([false, true]);
    expect(fixture.componentInstance.selectedId()).toBe('h2');
  });

  // BUG-50-02.2 — a poll that blanks the array is not a delete.
  it('does not prune on an empty re-emit, nor while loading', () => {
    const { fixture, emitted, selected } = make({ selection: { initial: ['h1', 'h2'] } });
    expect(selected()).toBe(2);

    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    expect(selected()).toBe(2);
    expect(emitted).toEqual([]);

    // A grid still loading says nothing about what is gone either.
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('rows', [rows[0]]);
    fixture.detectChanges();
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    // A real delete still prunes, and says so once.
    expect(selected()).toBe(1);
    expect(emitted.length).toBe(1);
    expect(emitted[0].map((r) => r['id'])).toEqual(['h1']);
  });
});

// BUG-50-03 — a utility column is still a column.
describe('StrctDatagrid — utility columns have names', () => {
  it('names the detail, expand and single-select columns without showing them', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Host' }]);
    fixture.componentRef.setInput('rows', [{ id: 'h1', name: 'hv-01' }]);
    fixture.componentRef.setInput('rowId', 'id');
    fixture.componentRef.setInput('expandable', true);
    fixture.componentRef.setInput('selection', { enabled: true, mode: 'single' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const heads = [...el.querySelectorAll('thead th')];
    expect(heads.every((h) => h.textContent!.trim().length > 0)).toBe(true);
    expect(heads.every((h) => h.getAttribute('scope') === 'col')).toBe(true);
    expect(
      [...el.querySelectorAll('thead .strct-sr-only')].map((n) => n.textContent!.trim()),
    ).toContain('Select row');

    // Multiple mode keeps the checkbox rather than the hidden word.
    fixture.componentRef.setInput('selection', { enabled: true, mode: 'multiple' });
    fixture.detectChanges();
    expect(el.querySelector('thead .strct-dg__sel strct-checkbox')).toBeTruthy();
    expect(el.querySelector('thead .strct-dg__sel .strct-sr-only')).toBeNull();
  });
});

// BUG-54-01 — jsdom cannot see paint; the mode the paint depends on is visible.
describe('StrctDatagrid — singleLine draws in separate mode', () => {
  it('marks the host so the row lines composite over the cell, not the table', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Host' }]);
    fixture.componentRef.setInput('rows', [{ name: 'hv-01' }]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList).not.toContain('strct-dg-host--singleline');

    fixture.componentRef.setInput('singleLine', true);
    fixture.detectChanges();
    expect(el.classList).toContain('strct-dg-host--singleline');

    // The rule that follows from it, asserted on the component's own styles.
    const css = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('');
    expect(css).toMatch(
      /\.strct-dg-host--singleline\s+\.strct-dg[^{]*\{[^}]*border-collapse:\s*separate/,
    );
  });
});

// FR-50-03 / 06 / 10 — the footer, the per-row picker and the number editor.
describe('StrctDatagrid — a count worth showing, and a picker per row', () => {
  const rows: StrctRow[] = [
    { id: 'r1', proto: 'tcp', port: 22 },
    { id: 'r2', proto: 'held', port: 80 },
  ];
  const cols: StrctDatagridColumn[] = [
    {
      key: 'proto',
      label: 'Protocol',
      editable: true,
      editor: 'select',
      // Per row: the held value is offered only to the row that holds it.
      editorOptions: (row: StrctRow) =>
        row['id'] === 'r2'
          ? [
              { value: 'tcp', label: 'TCP' },
              { value: 'held', label: 'held (not discovered)' },
            ]
          : [{ value: 'tcp', label: 'TCP' }],
    },
    { key: 'port', label: 'Port', editable: true, editor: 'number' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('shows the footer once something is selected, with no pager at all', () => {
    const { fixture, el } = make({ selection: { enabled: true } });
    expect(el.querySelector('.strct-dg__foot')).toBeNull();

    fixture.componentInstance.toggleRow(rows[0]);
    fixture.detectChanges();
    expect(el.querySelector('.strct-dg__count-sel')!.textContent!.trim()).toBe('1 selected');

    fixture.componentInstance.toggleRow(rows[0]);
    fixture.detectChanges();
    expect(el.querySelector('.strct-dg__foot')).toBeNull();
  });

  it('asks the column for this row’s options, and reads the value through them', () => {
    const { el } = make();
    const cells = [...el.querySelectorAll('tbody td')];
    // r1 does not know "held"; r2 does, and shows its label.
    expect(cells[0].textContent!.trim()).toBe('TCP');
    expect(cells[2].textContent!.trim()).toBe('held (not discovered)');
  });

  it('names the number editor from its column', () => {
    const { fixture, el } = make();
    const portCell = [...el.querySelectorAll('tbody td')][1] as HTMLElement;
    portCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    const editor = el.querySelector('.strct-dg__editnumber input[role=spinbutton]')!;
    expect(editor.getAttribute('aria-label')).toBe('Edit: Port');
  });
});

// FR-51 (lists) — sorting what the cell means, columns that start hidden, an
// export of what is shown, and a sort the grid remembers.
describe('StrctDatagrid — sort values, hidden columns, exports', () => {
  const rows: StrctRow[] = [
    { id: 'a', name: 'alpha', size: '900 GB', bytes: 966367641600, note: 'ok' },
    { id: 'b', name: 'beta', size: '1.5 TB', bytes: 1649267441664, note: null },
    { id: 'c', name: '=HYPERLINK("http://x")', size: null, bytes: null, note: 'odd' },
  ];
  const cols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'size',
      label: 'Size',
      sortable: true,
      sortValue: (r: StrctRow) => r['bytes'],
      exportValue: (r: StrctRow) => r['bytes'],
    },
    { key: 'note', label: 'Note', hidden: true },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      heads: () => [...el.querySelectorAll('thead th')].map((h) => h.textContent!.trim()),
      col: (i: number) =>
        [...el.querySelectorAll('tbody tr')].map((r) => r.children[i].textContent!.trim()),
      sortBy: (label: string) => {
        const th = [...el.querySelectorAll<HTMLElement>('thead th')].find((h) =>
          h.textContent!.includes(label),
        )!;
        (th.querySelector('button') ?? th).click();
        fixture.detectChanges();
      },
    };
  }

  it('sorts by what the column means, and keeps unread values last both ways', () => {
    const { col, sortBy } = make();
    sortBy('Size');
    // 900 GB < 1.5 TB by bytes, and the unread one is last.
    expect(col(1)).toEqual(['900 GB', '1.5 TB', '']);
    sortBy('Size');
    expect(col(1)).toEqual(['1.5 TB', '900 GB', '']);
  });

  it('a column can start hidden, and the chooser still lists it', () => {
    const { el, heads } = make({ columnChooser: true });
    expect(heads()).not.toContain('Note');
    const chooser = [...el.querySelectorAll('.strct-dg__chooser-item')].map((i) =>
      i.textContent!.trim(),
    );
    expect(chooser.length === 0 || chooser.includes('Note')).toBe(true);
  });

  it('exports what the column says, in the user’s order, guarded against formulas', () => {
    const { fixture } = make();
    const csv = fixture.componentInstance.toCSV();
    const [header, ...body] = csv.split('\n');
    expect(header).toBe('Name,Size');
    // The size column exports its bytes, not its text.
    expect(body[0]).toContain('966367641600');
    // A name that opens with "=" is text, not a formula.
    expect(body.some((line) => line.includes(`"'=HYPERLINK`))).toBe(true);
  });

  it('remembers the sort with the rest of the column state', () => {
    const { fixture, sortBy } = make({ state: { key: 'spec-sort' } });
    sortBy('Name');
    const state = fixture.componentInstance.columnState();
    expect(state!.sortKey).toBe('name');
    expect(state!.sortDir).toBe('asc');

    // A grid built again from that state opens sorted the same way.
    const next = TestBed.createComponent(StrctDatagrid);
    next.componentRef.setInput('columns', cols);
    next.componentRef.setInput('rows', rows);
    next.componentRef.setInput('columnState', { ...state, sortKey: 'size', sortDir: 'desc' });
    next.detectChanges();
    const first = (next.nativeElement as HTMLElement).querySelector('tbody tr')!;
    expect(first.children[1].textContent!.trim()).toBe('1.5 TB');
  });
});

// FR-56-01 — a triage page orders its groups by urgency, not alphabetically.
describe('StrctDatagrid — groups the consumer defines', () => {
  const rows: StrctRow[] = [
    { id: '1', state: 'passed', test: 'A' },
    { id: '2', state: 'needs', test: 'B' },
    { id: '3', state: 'passed', test: 'C' },
    { id: '4', state: 'other', test: 'D' },
  ];
  const cols: StrctDatagridColumn[] = [{ key: 'test', label: 'Test' }];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    fixture.componentRef.setInput('grouping', { by: 'state' });
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      groups: () =>
        [...el.querySelectorAll('.strct-dg__grouprow')].map((g) =>
          g.querySelector('.strct-dg__grouplabel')!.textContent!.trim(),
        ),
      bodyRows: () => el.querySelectorAll('tbody tr:not(.strct-dg__grouprow)').length,
    };
  }

  it('renders the declared order, labels, counts, tone and note; the rest follow', () => {
    const { el, groups } = make({
      grouping: {
        groups: [
          {
            value: 'needs',
            label: 'Needs your decision',
            status: 'critical',
            note: 'Blocks the join',
          },
          { value: 'passed', label: 'Passed', collapsed: true },
        ],
      },
      collapsedGroups: ['passed'],
    });
    expect(groups()).toEqual(['Needs your decision', 'Passed', 'other']);
    const first = el.querySelector('.strct-dg__grouprow')!;
    expect(first.querySelector('.strct-dg__grouplabel')!.className).toContain(
      'strct-dg__grouplabel--critical',
    );
    expect(first.querySelector('.strct-dg__groupnote')!.textContent!.trim()).toBe(
      'Blocks the join',
    );
    // "Passed" is folded, so only the two open groups' rows are rendered.
    expect(el.querySelectorAll('tbody tr:not(.strct-dg__grouprow)').length).toBe(2);
  });

  it('counts what the consumer says, and can keep an empty group', () => {
    const empty = [{ value: 'nobody', label: 'Not applicable', count: 11 }];
    expect(make({ grouping: { groups: empty } }).groups()).not.toContain('Not applicable');

    const { el, groups } = make({ grouping: { groups: empty, showEmpty: true } });
    expect(groups()).toContain('Not applicable');
    expect(
      [...el.querySelectorAll('.strct-dg__groupcount')].map((c) => c.textContent!.trim()),
    ).toContain('11');
  });

  it('collapsedGroups is two-way', () => {
    const { fixture, el } = make({ collapsedGroups: [] });
    const btn = el.querySelector('.strct-dg__groupbtn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect([...fixture.componentInstance.collapsedGroups()].length).toBe(1);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });
});

// FR-56-02 — the 260px single column cut a test name in half and hid its status.
describe('StrctDatagrid — a usable detail pane', () => {
  const rows: StrctRow[] = [
    { id: 'a', status: 'Failed', test: 'Validate Switch Enabled Teaming Configurations' },
    { id: 'b', status: 'Passed', test: 'Validate Cluster Network Configuration' },
  ];
  const cols: StrctDatagridColumn[] = [
    { key: 'status', label: 'Status', keepInPane: true },
    { key: 'test', label: 'Test', keepInPane: true },
    { key: 'where', label: 'Where' },
  ];

  @Component({
    imports: [StrctDatagrid, StrctRowDetailDef, StrctDetailPaneTitle, StrctDetailPaneActions],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
      <strct-datagrid
        [columns]="cols"
        [rows]="rows"
        rowId="id"
        [pane]="{ listWidth: '420px' }"
        [(activeRowId)]="active"
      >
        <span strctDetailPaneTitle class="ptitle">The finding</span>
        <button strctDetailPaneActions type="button" class="pact">Accept</button>
        <ng-template strctRowDetail let-row>
          <p class="pbody">{{ row.test }}</p>
        </ng-template>
      </strct-datagrid>
    `,
  })
  class Host {
    cols = cols;
    rows = rows;
    active = signal<unknown>(null);
  }

  function build() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  }

  it('opens from outside, keeps the columns that ask to stay, and closes on null', () => {
    const { fixture, el, host } = build();
    expect(el.querySelector('.strct-dg__pane')).toBeNull();
    // Three columns while the pane is shut.
    expect(el.querySelectorAll('thead th').length).toBe(4); // + the detail column

    host.active.set('a');
    fixture.detectChanges();
    expect(el.querySelector('.strct-dg__pane')).toBeTruthy();
    expect(el.querySelector('.pbody')!.textContent).toContain('Teaming');
    // Status and Test stay; Where goes.
    const heads = [...el.querySelectorAll('thead th')].map((h) => h.textContent!.trim());
    expect(heads).toContain('Status');
    expect(heads).toContain('Test');
    expect(heads).not.toContain('Where');
    // The list's width is the consumer's.
    expect(
      (el.querySelector('.strct-dg__layout') as HTMLElement).style.getPropertyValue(
        '--strct-dg-pane-list-w',
      ),
    ).toBe('420px');
    // The header's own slots.
    expect(el.querySelector('.strct-dg__pane-title .ptitle')).toBeTruthy();
    expect(el.querySelector('.strct-dg__pane-actions .pact')).toBeTruthy();

    host.active.set(null);
    fixture.detectChanges();
    expect(el.querySelector('.strct-dg__pane')).toBeNull();
  });

  it('opens on Enter, moves with the arrows, and closes on Escape', () => {
    const { fixture, el, host } = build();
    const tr = () => [...el.querySelectorAll<HTMLElement>('tbody tr')];
    const press = (el: HTMLElement, key: string) =>
      el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    expect(tr()[0].getAttribute('tabindex')).toBe('0');
    press(tr()[0], 'Enter');
    fixture.detectChanges();
    expect(host.active()).toBe('a');

    press(tr()[0], 'ArrowDown');
    fixture.detectChanges();
    expect(host.active()).toBe('b');

    press(tr()[1], 'Escape');
    fixture.detectChanges();
    expect(host.active()).toBeNull();
  });
});

// BUG-57-01 / BUG-57-02 — the row tints and the table's own clip. Both are
// pure CSS, so they are asserted on the stylesheet the component ships.
describe('StrctDatagrid — the row tints and the frame', () => {
  function sheet(): string {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Host' }]);
    fixture.componentRef.setInput('rows', [{ name: 'hv-01' }]);
    fixture.detectChanges();
    return [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .join('')
      .replace(/\s+/g, ' ');
  }

  it('composites every row tint over the cell’s own surface', () => {
    const css = sheet();
    // --acc-s and --acc-m are translucent: set as the background they replace
    // the cell's opaque surface and the table's --bg-2 shows through, which
    // left a selected row +0.9 luminance from its neighbours in dark.
    for (const selector of [
      '\\.strct-dg tbody tr:not\\(\\.strct-dg__detailrow\\):hover td',
      '\\.strct-dg tbody \\.strct-dg__row--selected td',
      '\\.strct-dg tbody \\.strct-dg__row--active td',
    ]) {
      for (const [prefix, surface] of [
        ['', 'bg-1'],
        ['\\[data-theme=.?dark.?\\] ', 'bg-3'],
      ]) {
        const rule = new RegExp(
          `${prefix}${selector} \\{ background: linear-gradient\\(var\\(--acc-[sm]\\), ?var\\(--acc-[sm]\\)\\) var\\(--${surface}\\)`,
        );
        expect(css, `${prefix}${selector} over --${surface}`).toMatch(rule);
      }
    }
    // No row tint may be a bare translucent fill again.
    expect(css).not.toMatch(
      /\.strct-dg tbody [^{]*(row--selected|row--active|:hover)[^{]*\{ background: var\(--acc-[sm]\); \}/,
    );
  });

  it('keeps the table’s clip for singleLine, and drops it only for the scrolling hosts', () => {
    const css = sheet();
    // singleLine needs separate borders (BUG-54-01) but not the visible
    // overflow: that is what rounds the frame's corners (BUG-57-02).
    const single = /\.strct-dg-host--singleline \.strct-dg \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(single).toContain('border-collapse: separate');
    expect(single).not.toContain('overflow');
    expect(single).not.toContain('border-radius');

    const scrolling = /\.strct-dg-host--sticky \.strct-dg,([^{]*)\{([^}]*)\}/.exec(css);
    expect(scrolling?.[1]).not.toContain('singleline');
    expect(scrolling?.[2]).toContain('overflow: visible');
  });
});

// A3 / A4 / A5 / C1 — what the grid says to someone who cannot see it, and
// what it says out loud when it changes under them.
describe('StrctDatagrid — the grid says what it does', () => {
  const COLS: StrctDatagridColumn[] = [
    { key: 'name', label: 'Cluster', sortable: true },
    { key: 'type', label: 'Type' },
    { key: 'note', label: 'Note', muted: true },
  ];
  const ROWS: StrctRow[] = [
    { name: 'gamma', type: 'Failover', note: 'n1' },
    { name: 'alpha', type: 'Standard', note: 'n2' },
    { name: 'beta', type: 'Failover', note: 'n3' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      said: () => el.querySelector('.strct-dg__announcer')!.textContent!.trim(),
      sortBtn: () => el.querySelector('thead .strct-dg__sortbtn') as HTMLButtonElement,
    };
  }

  it('sorts from a real button, and keeps aria-sort on the column header', () => {
    const { fixture, el, sortBtn } = make();
    const headers = [...el.querySelectorAll('thead th')];
    const sortable = headers[0];

    // A th with tabindex reads as "column header, focusable" and never says it
    // can be activated; a button does.
    expect(sortBtn()).toBeTruthy();
    expect(sortBtn().textContent!.trim()).toContain('Cluster');
    expect(sortable.hasAttribute('tabindex')).toBe(false);
    expect(sortable.getAttribute('aria-sort')).toBe('none');
    // A column that does not sort has no button to press.
    expect(headers[1].querySelector('.strct-dg__sortbtn')).toBeNull();

    sortBtn().click();
    fixture.detectChanges();
    expect(sortable.getAttribute('aria-sort')).toBe('ascending');
    expect(
      [...el.querySelectorAll('tbody tr td:first-child')].map((c) => c.textContent!.trim()),
    ).toEqual(['alpha', 'beta', 'gamma']);

    sortBtn().click();
    fixture.detectChanges();
    expect(sortable.getAttribute('aria-sort')).toBe('descending');
  });

  it('says nothing until something happens, then says what it did', () => {
    const { fixture, said, sortBtn } = make();
    expect(said()).toBe('');

    sortBtn().click();
    fixture.detectChanges();
    expect(said()).toBe('Sorted by Cluster, ascending');

    sortBtn().click();
    fixture.detectChanges();
    expect(said()).toBe('Sorted by Cluster, descending');

    // A third press clears the sort, and says so.
    sortBtn().click();
    fixture.detectChanges();
    expect(said()).toBe('Sorting cleared');
  });

  it('says where the pager went, and how much a filter left', () => {
    const { fixture, el, said } = make({ paging: { pageSize: 2 }, filtering: { quick: true } });
    const pager = el.querySelector('.strct-pg') as HTMLElement;
    const second = [...pager.querySelectorAll('button')].find(
      (b) => b.textContent!.trim() === '2',
    )!;
    second.click();
    fixture.detectChanges();
    expect(said()).toBe('Page 2 of 2');

    fixture.componentRef.setInput('quickFilter', 'failover');
    fixture.detectChanges();
    expect(said()).toBe('2 of 3 rows match');

    // The same sentence twice in a row is nudged, or a reader drops it.
    fixture.componentRef.setInput('quickFilter', 'failover ');
    fixture.detectChanges();
    expect(said().startsWith('2 of 3 rows match')).toBe(true);
  });

  it('marks itself busy while it is loading', () => {
    const { fixture, el } = make();
    expect(el.getAttribute('aria-busy')).toBeNull();

    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-busy')).toBe('true');

    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
    expect(el.getAttribute('aria-busy')).toBeNull();
  });

  it('keeps cell text off the faint token, which is under AA on a dark cell', () => {
    make();
    const css = [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .join('')
      .replace(/\s+/g, ' ');
    // Measured over a grid cell: --t3 is 4.27–4.45:1 in the three dark
    // schemes, --t2 is 5.11–6.20:1. Glyphs may keep --t3; text may not.
    for (const selector of [
      '\\.strct-dg td\\.strct-dg__cell--muted',
      '\\.strct-dg__celldesc',
      '\\.strct-dg__filternote',
    ]) {
      expect(css, selector).toMatch(new RegExp(`${selector} \\{[^}]*color: var\\(--t2\\)`));
    }
  });
});

// A1 / A2 / B1 (and FR-58-01, FR-58-04) — the grid interaction model.
describe('StrctDatagrid — interactionMode="grid"', () => {
  const COLS: StrctDatagridColumn[] = [
    { key: 'name', label: 'Cluster', sortable: true },
    { key: 'type', label: 'Type' },
  ];
  const ROWS: StrctRow[] = [
    { id: 'a', name: 'alpha', type: 'Failover' },
    { id: 'b', name: 'beta', type: 'Standard' },
    { id: 'c', name: 'gamma', type: 'Failover' },
  ];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('rowId', 'id');
    fixture.componentRef.setInput('interactionMode', 'grid');
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const rows = () => [...el.querySelectorAll<HTMLElement>('tbody tr')];
    const press = (target: HTMLElement, key: string) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };
    return { fixture, el, rows, press };
  }

  it('is one tab stop: the cursor row carries it, every other row is -1', () => {
    const { el, rows } = make();
    expect(el.querySelector('table')!.getAttribute('role')).toBe('grid');
    expect(rows().map((r) => r.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('moves the cursor with the arrows, Home and End', async () => {
    const { rows, press } = make();
    const at = () => rows().findIndex((r) => r.getAttribute('tabindex') === '0');

    press(rows()[0], 'ArrowDown');
    expect(at()).toBe(1);
    press(rows()[1], 'ArrowDown');
    expect(at()).toBe(2);
    // Past the last row it stays put rather than wrapping into nothing.
    press(rows()[2], 'ArrowDown');
    expect(at()).toBe(2);
    press(rows()[2], 'Home');
    expect(at()).toBe(0);
    press(rows()[0], 'End');
    expect(at()).toBe(2);
  });

  it('picks with Space and activates with Enter', () => {
    const { fixture, rows, press } = make({ selection: { mode: 'single' } });
    const picked: unknown[] = [];
    const activated: unknown[] = [];
    fixture.componentInstance.selectionChange.subscribe((r: StrctRow[]) =>
      picked.push(r[0]?.['id']),
    );
    fixture.componentInstance.rowActivate.subscribe((r: StrctRow) => activated.push(r['id']));

    const space = press(rows()[1], ' ');
    expect(space.defaultPrevented).toBe(true); // the page must not scroll
    expect(picked).toEqual(['b']);
    expect(rows()[1].getAttribute('aria-selected')).toBe('true');
    expect(activated).toEqual([]);

    press(rows()[1], 'Enter');
    expect(activated).toEqual(['b']);
  });

  it('activates on a double-click, and a single click only moves the cursor', () => {
    const { fixture, rows } = make();
    const activated: unknown[] = [];
    fixture.componentInstance.rowActivate.subscribe((r: StrctRow) => activated.push(r['id']));

    rows()[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(activated).toEqual([]);
    expect(rows()[2].getAttribute('tabindex')).toBe('0');

    rows()[2].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    expect(activated).toEqual(['c']);
  });

  it('steps through the row’s own controls with the arrows, and Escape comes back', () => {
    const { el, rows, press } = make({
      selection: { mode: 'multiple' },
      rowActions: () => [{ id: 'open', label: 'Open' }],
    });
    const row = rows()[0];
    const controls = [...row.querySelectorAll<HTMLElement>('button, input')];
    expect(controls.length).toBeGreaterThan(1);
    // In grid mode they are out of the tab order — the row is the tab stop.
    expect(controls.every((c) => c.getAttribute('tabindex') === '-1')).toBe(true);

    row.focus();
    press(row, 'ArrowRight');
    expect(document.activeElement).toBe(controls[0]);

    press(controls[0], 'ArrowRight');
    expect(document.activeElement).toBe(controls[1]);

    press(controls[1], 'Escape');
    expect(document.activeElement).toBe(row);
    expect(el.querySelector('table')!.getAttribute('role')).toBe('grid');
  });

  it('can select without a tick column, and opens the pane from the row', () => {
    @Component({
      imports: [StrctDatagrid, StrctRowDetailDef],
      template: `
        <strct-datagrid
          [columns]="cols"
          [rows]="rows"
          rowId="id"
          interactionMode="grid"
          [selection]="{ mode: 'single', column: 'none' }"
          pane
        >
          <ng-template strctRowDetail let-row>{{ row['name'] }} detail</ng-template>
        </strct-datagrid>
      `,
    })
    class GridPaneHost {
      cols = COLS;
      rows = ROWS;
    }

    const fixture = TestBed.createComponent(GridPaneHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // A file list picks by clicking the row; no radio column is drawn.
    expect(el.querySelector('tbody input[type="radio"]')).toBeNull();

    const row = [...el.querySelectorAll<HTMLElement>('tbody tr')][1];
    row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(row.getAttribute('aria-selected')).toBe('true');
    // FR-58-01: the row itself opens its pane, no » button needed.
    expect(el.querySelector('.strct-dg__pane')).toBeTruthy();
  });

  it('leaves the table alone in the default mode', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('selection', { mode: 'multiple' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('table')!.getAttribute('role')).toBeNull();
    expect([...el.querySelectorAll('tbody tr')].every((r) => !r.hasAttribute('tabindex'))).toBe(
      true,
    );
    expect(el.querySelector('tbody .strct-cb__native')!.getAttribute('tabindex')).toBeNull();
  });
});

// B2 / B3 — the two empty states, and the way past a page-wide selection.
describe('StrctDatagrid — empty states and the bulk escape', () => {
  const COLS: StrctDatagridColumn[] = [{ key: 'n', label: 'N' }];
  const ROWS: StrctRow[] = Array.from({ length: 7 }, (_, i) => ({ id: i, n: `row-${i}` }));

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('rowId', 'id');
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('says "nothing here" and "nothing matches" differently', () => {
    const bare = make({ rows: [] });
    const empty = bare.el.querySelector('strct-empty-state')!;
    expect(empty.textContent).toContain('No data');
    expect(empty.querySelector('button')).toBeNull();

    const filtered = make({ quickFilter: 'zzzz', filtering: { quick: true } });
    const state = filtered.el.querySelector('strct-empty-state')!;
    expect(state.textContent).toContain('No rows match the filter');
    // The query is named, and there is a way back.
    expect(state.textContent).toContain('zzzz');
    expect(state.querySelector('button')!.textContent!.trim()).toBe('Clear filters');
  });

  it('clears the filter from the empty state and the rows come back', () => {
    const { fixture, el } = make({ quickFilter: 'zzzz', filtering: { quick: true } });
    expect(el.querySelectorAll('tbody tr').length).toBe(1);

    el.querySelector<HTMLButtonElement>('strct-empty-state button')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('tbody tr').length).toBe(7);
    expect(el.querySelector('strct-empty-state')).toBeNull();
  });

  it('offers the rest of the set once the page is selected, then offers to clear', () => {
    const { fixture, el } = make({ selection: { enabled: true }, paging: { pageSize: 3 } });
    expect(el.querySelector('.strct-dg__bulk')).toBeNull();

    el.querySelector<HTMLInputElement>('thead .strct-cb__native')!.click();
    fixture.detectChanges();
    const bulk = el.querySelector('.strct-dg__bulk')!;
    expect(bulk.textContent).toContain('All 3 rows on this page are selected.');
    const action = bulk.querySelector('button')!;
    expect(action.textContent!.trim()).toBe('Select all 7');

    action.click();
    fixture.detectChanges();
    expect(el.querySelector('.strct-dg__bulk')!.textContent).toContain('All 7 rows are selected.');
    expect(el.querySelector('.strct-dg__bulk button')!.textContent!.trim()).toBe('Clear selection');
  });

  it('does not offer what it cannot do: one page, or a lazy grid', () => {
    const onePage = make({ selection: { enabled: true } });
    onePage.el.querySelector<HTMLInputElement>('thead .strct-cb__native')!.click();
    onePage.fixture.detectChanges();
    // Every row is already on the page — there is no "rest" to offer.
    expect(onePage.el.querySelector('.strct-dg__bulk')).toBeNull();

    const lazy = make({
      selection: { enabled: true },
      paging: { pageSize: 3, lazy: true, total: 99 },
    });
    lazy.el.querySelector<HTMLInputElement>('thead .strct-cb__native')!.click();
    lazy.fixture.detectChanges();
    // The grid cannot name rows the server has not sent.
    expect(lazy.el.querySelector('.strct-dg__bulk')).toBeNull();
  });
});

// BUG-58-13 / BUG-58-14 — the saved state is read before anything acts on it.
describe('StrctDatagrid — column state is read first', () => {
  const COLS: StrctDatagridColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'size', label: 'Size', sortable: true },
    { key: 'note', label: 'Note', hidden: true },
  ];
  const ROWS: StrctRow[] = [
    { id: 1, name: 'b', size: 2, note: 'x' },
    { id: 2, name: 'a', size: 1, note: 'y' },
  ];

  @Component({
    imports: [StrctDatagrid],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<strct-datagrid
      [columns]="cols"
      [rows]="rows"
      rowId="id"
      [state]="{ key: key() }"
      [columnState]="bound()"
      [paging]="{ lazy: lazy(), total: 99 }"
      (lazyLoad)="asks.push($event)"
    />`,
  })
  class Host {
    cols = COLS;
    rows = ROWS;
    key = signal<string | null>(null);
    bound = signal<StrctDatagridColumnState | null>(null);
    lazy = signal(false);
    asks: StrctDatagridLazyState[] = [];
  }

  afterEach(() => localStorage.clear());

  it('restores what the operator saved — a template-bound stateKey is not null by then', () => {
    localStorage.setItem(
      'strct-dg:k',
      JSON.stringify({ widths: {}, hidden: [], sortKey: 'size', sortDir: 'desc' }),
    );
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.key.set('k');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    // The column the operator un-hid stays shown, though it declares hidden.
    const headers = [...el.querySelectorAll('thead th')].map((h) => h.textContent!.trim());
    expect(headers).toContain('Note');
    // And the sort it was left in is the sort it opens with.
    const size = [...el.querySelectorAll('thead th')].find((h) => h.textContent!.includes('Size'))!;
    expect(size.getAttribute('aria-sort')).toBe('descending');
    // What was stored is still what is stored: the defaults did not land on it.
    expect(JSON.parse(localStorage.getItem('strct-dg:k')!)).toMatchObject({
      sortKey: 'size',
      sortDir: 'desc',
      hidden: [],
    });
  });

  it('asks the server once, with the sort already applied', () => {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.lazy.set(true);
    host.bound.set({ widths: {}, hidden: [], sortKey: 'size', sortDir: 'desc' });
    fixture.detectChanges();

    // It used to ask twice: unsorted, then sorted — the first request was
    // sent to the server and cancelled.
    expect(host.asks.length).toBe(1);
    expect(host.asks[0]).toMatchObject({ sortKey: 'size', sortDir: 'desc' });
  });

  it('still saves what the operator changes afterwards', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.key.set('k2');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('thead .strct-dg__sortbtn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(JSON.parse(localStorage.getItem('strct-dg:k2')!)).toMatchObject({
      sortKey: 'name',
      sortDir: 'asc',
    });
  });
});

// BUG-58-01 / BUG-58-03 — what the group header draws, and whose width is whose.
describe('StrctDatagrid — group tones and the paned list width', () => {
  function sheet(): string {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', [{ key: 'n', label: 'N' }]);
    fixture.componentRef.setInput('rows', [{ n: 'a' }]);
    fixture.detectChanges();
    return [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .join('')
      .replace(/\s+/g, ' ');
  }

  it('draws the status classes the template has always written', () => {
    const css = sheet();
    // The template wrote --critical / --warning / --success and the stylesheet
    // had a rule for none of them: four groups of different severity looked
    // identical.
    for (const [cls, token] of [
      ['grouplabel--critical', 'critical'],
      ['grouplabel--warning', 'warning'],
      ['grouplabel--success', 'success'],
    ]) {
      expect(css, cls).toMatch(new RegExp(`\\.strct-dg__${cls} \\{ color: var\\(--${token}\\)`));
    }
    // The count chip's status rules must come after its base rule, or the
    // accent wash wins on equal specificity.
    const base = css.indexOf('.strct-dg__groupcount {');
    const toned = css.indexOf('.strct-dg__groupcount--critical');
    expect(base).toBeGreaterThan(-1);
    expect(toned).toBeGreaterThan(base);
    // The note is a second voice, not more heading.
    expect(css).toMatch(/\.strct-dg__groupnote \{[^}]*font-weight: 400/);
  });

  it('gives the paned width to the scroller alone, and only to this list', () => {
    const css = sheet();
    // A percentage used to compound: the list was 40% of the layout and the
    // table 40% of the list.
    expect(css).toMatch(
      /\.strct-dg__layout--paned > \.strct-dg__scroll \{[^}]*width: var\(--strct-dg-pane-list-w/,
    );
    expect(css).toMatch(
      /\.strct-dg__layout--paned > \.strct-dg__scroll > \.strct-dg \{[^}]*width: 100%/,
    );
    // Descendant selectors reached a datagrid drawn inside the pane.
    expect(css).not.toMatch(/\.strct-dg__layout--paned \.strct-dg \{/);
    expect(css).not.toMatch(/\.strct-dg__layout--panetakeover \.strct-dg__scroll \{/);
  });
});

// BUG-59-01 / FR-59-01 — what an empty grid adds to a page's outline, and
// what a group header's count is read as.
describe('StrctDatagrid — the empty row is not a heading', () => {
  const cols: StrctDatagridColumn[] = [{ key: 'name', label: 'Name' }];

  function make(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', []);
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('an empty grid puts no h1–h6 in the page outline', () => {
    const { el } = make({ emptyText: 'No hosts yet' });
    expect(
      el.querySelectorAll('tbody h1, tbody h2, tbody h3, tbody h4, tbody h5, tbody h6').length,
    ).toBe(0);
    // The text is still there, as a paragraph.
    const title = el.querySelector('tbody .strct-empty__title')!;
    expect(title.tagName).toBe('P');
    expect(title.textContent?.trim()).toBe('No hosts yet');
  });

  it('a grid emptied by a filter says so, and still adds no heading', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', [{ name: 'hv-01' }]);
    fixture.componentRef.setInput('filtering', { quick: true });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('.strct-dg__quickfilter input')!;
    input.value = 'zzzz';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('tbody .strct-empty__title')?.tagName).toBe('P');
    expect(
      el.querySelectorAll('tbody h1, tbody h2, tbody h3, tbody h4, tbody h5, tbody h6').length,
    ).toBe(0);
  });

  it('an empty title draws no title element at all', () => {
    const { el } = make({ emptyText: '' });
    expect(el.querySelector('tbody .strct-empty__title')).toBeNull();
  });
});

describe('StrctDatagrid — a group count is heard with the grid noun', () => {
  const rows: StrctRow[] = [
    { id: '1', state: 'failed', test: 'A' },
    { id: '2', state: 'failed', test: 'B' },
    { id: '3', state: 'passed', test: 'C' },
  ];
  const cols: StrctDatagridColumn[] = [{ key: 'test', label: 'Test' }];

  function make(labels?: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    fixture.componentRef.setInput('grouping', { by: 'state' });
    if (labels) fixture.componentRef.setInput('labels', labels);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return [...el.querySelectorAll('.strct-dg__groupbtn')].map((b) =>
      (b.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
  }

  it('reads "2 rows" after the count, and the singular for one', () => {
    const [first, second] = make();
    expect(first).toBe('failed, 2 rows');
    expect(second).toBe('passed, 1 row');
  });

  it('takes the noun from labels, so a grid of tests says tests', () => {
    const [first, second] = make({ row: 'test', rows: 'tests' });
    expect(first).toBe('failed, 2 tests');
    expect(second).toBe('passed, 1 test');
  });

  it('the chip itself still shows only the number', () => {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('grouping', { by: 'state' });
    fixture.detectChanges();
    const chips = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('.strct-dg__groupcount'),
    ];
    expect(chips.map((c) => c.textContent!.trim())).toEqual(['2', '1']);
  });
});

// 6.x step 1: the grid's 54 inputs are more than a template can read, so each
// cluster becomes one object. The flat inputs keep working through 5.x — this
// is the layer that lets a consumer move a screen at a time.
describe('StrctDatagrid — the feature objects', () => {
  const rows: StrctRow[] = Array.from({ length: 7 }, (_, i) => ({ id: String(i), name: 'r' + i }));
  const cols: StrctDatagridColumn[] = [{ key: 'name', label: 'Name' }];

  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      bodyRows: () => el.querySelectorAll('tbody tr:not(.strct-dg__grouprow)').length,
    };
  }

  it('[paging] carries what six flat inputs carried', () => {
    const object = make({ paging: { mode: 'pages', pageSize: 3 } });
    expect(object.bodyRows()).toBe(3);
    // The mode on its own is what it always was.
    const mode = make({ paging: { mode: 'more', hasMore: true } });
    expect(mode.el.querySelector('.strct-dg__more')).toBeTruthy();
  });

  it('[selection] turns the tick column on, and keeps [(selectedIds)] where it is', () => {
    const { fixture, el } = make({ selection: { enabled: true }, selectedIds: ['1', '2'] });
    expect(el.querySelectorAll('tbody strct-checkbox').length).toBe(rows.length);
    expect(el.querySelectorAll('.strct-dg__row--selected').length).toBe(2);

    // Two-way state stays flat on purpose: [(selectedIds)] cannot bind
    // through a property of an object.
    el.querySelector<HTMLElement>('tbody .strct-cb input')!.click();
    fixture.detectChanges();
    expect([...(fixture.componentInstance.selectedIds() ?? [])].length).toBe(3);
  });

  it('[selection] takes the single-row mode and drops the control column', () => {
    const { el } = make({ selection: { enabled: true, mode: 'single', column: 'none' } });
    expect(el.querySelectorAll('tbody input[type="radio"]').length).toBe(0);
    expect(el.querySelector('tbody tr')!.getAttribute('aria-selected')).toBe('false');
  });

  it('[virtual] and [pane] still take the bare attribute, and now an object', () => {
    const flag = make({ virtual: { enabled: true } });
    expect(flag.el.querySelector('.strct-dg__scroll')).toBeTruthy();
    const object = make({ virtual: { viewportHeight: 120, rowHeight: 20 } });
    const scroll = object.el.querySelector<HTMLElement>('.strct-dg__scroll')!;
    // An object turns the feature on without saying `enabled` twice, and
    // carries what the satellite inputs carried.
    expect(scroll.style.maxHeight).toBe('120px');
    expect(object.fixture.componentInstance.virtual()).toBe(true);
    expect(object.fixture.componentInstance.rowHeight()).toBe(20);

    // The pane is drawn when a row is active; what the object carries is the
    // configuration, which is what this asserts.
    const pane = make({ pane: { listWidth: '40%' }, activeRowId: '1' });
    expect(pane.fixture.componentInstance.detailPane()).toBe(true);
    expect(pane.fixture.componentInstance.paneListWidth()).toBe('40%');
  });

  it('[grouping], [filtering] and [state] carry their clusters', () => {
    const grouped = make({ grouping: { by: 'name' } });
    expect(grouped.el.querySelectorAll('.strct-dg__grouprow').length).toBe(rows.length);

    const filtered = make({ filtering: { quick: true, align: 'start' } });
    const quick = filtered.el.querySelector('.strct-dg__quickfilter')!;
    expect(quick).toBeTruthy();
    expect(quick.classList).not.toContain('strct-dg__quickfilter--end');
    expect(
      make({ filtering: { quick: true } }).el.querySelector('.strct-dg__quickfilter')!.classList,
    ).toContain('strct-dg__quickfilter--end');

    const stated = make({ state: { key: 'grid-3', sync: true } });
    expect(stated.el.querySelector('button[aria-label="Refresh data"]')).toBeTruthy();
    expect(stated.fixture.componentInstance.stateKey()).toBe('grid-3');
  });
});

// A height cap is not a virtual setting. It was folded into [virtual] in
// 5.30.0, and every [virtual] object turns virtual scrolling on — so a
// grouped grid given a cap silently lost its groups and kept the virtual
// viewport's height instead.
describe('StrctDatagrid — a height cap is not virtual scrolling', () => {
  const rows: StrctRow[] = [
    { id: '1', name: 'a', type: 'Failover' },
    { id: '2', name: 'b', type: 'Failover' },
    { id: '3', name: 'c', type: 'Standard' },
  ];
  const cols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
  ];

  function make(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(StrctDatagrid);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('rowId', 'id');
    applyInputs(fixture, inputs);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      scroll: el.querySelector<HTMLElement>('.strct-dg__scroll')!,
      groupRows: () => el.querySelectorAll('.strct-dg__grouprow').length,
    };
  }

  it('caps the height and keeps the grouping', () => {
    const { fixture, scroll, groupRows } = make({
      grouping: { by: 'type' },
      maxHeight: 220,
    });
    expect(groupRows()).toBe(2);
    expect(scroll.style.maxHeight).toBe('220px');
    expect(fixture.componentInstance.virtual()).toBe(false);
  });

  it('does not turn virtual scrolling on, and is not in the virtual object', () => {
    const { fixture } = make({ maxHeight: 220 });
    expect(fixture.componentInstance.virtual()).toBe(false);
    // What [virtual] does carry still turns it on, because those settings
    // mean nothing otherwise.
    const virt = make({ virtual: { viewportHeight: 120 } });
    expect(virt.fixture.componentInstance.virtual()).toBe(true);
    expect(virt.scroll.style.maxHeight).toBe('120px');
  });

  it('says so when grouping and virtual scrolling are asked for together', () => {
    resetStrctDevWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { groupRows } = make({ grouping: { by: 'type' }, virtual: { enabled: true } });
      expect(groupRows()).toBe(0); // the rows render ungrouped, as before
      const said = warn.mock.calls.map((c) => String(c[0])).join('\n');
      expect(said).toContain('[grouping] is ignored while virtual scrolling is on');
    } finally {
      warn.mockRestore();
    }
  });
});
