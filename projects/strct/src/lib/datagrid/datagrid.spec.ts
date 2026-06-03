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
});
