import { TestBed } from '@angular/core/testing';
import { StrctDatagrid, StrctDatagridColumn } from './datagrid';
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
