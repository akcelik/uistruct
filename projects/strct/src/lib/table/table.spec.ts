import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctTable, StrctCellDef } from './table';

@Component({
  imports: [StrctTable, StrctCellDef],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-table [columns]="cols" [rows]="rows" [striped]="striped" [hover]="hover">
      <ng-template strctCell="name" let-row let-value="value">{{ value }}</ng-template>
    </strct-table>
  `,
})
class HostComponent {
  cols = [{ key: 'name', label: 'Name' }];
  rows = [{ name: 'A' }];
  striped = false;
  hover = false;
}

describe('StrctTable', () => {
  it('applies the base host class', () => {
    const fixture = TestBed.createComponent(StrctTable);
    fixture.componentRef.setInput('columns', [{ key: 'a', label: 'A' }]);
    fixture.componentRef.setInput('rows', [{ a: 1 }]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-table-host');
  });

  it('applies the striped modifier class', () => {
    const fixture = TestBed.createComponent(StrctTable);
    fixture.componentRef.setInput('columns', [{ key: 'a', label: 'A' }]);
    fixture.componentRef.setInput('rows', [{ a: 1 }]);
    fixture.componentRef.setInput('striped', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-table-host--striped');
  });

  it('applies the hover modifier class', () => {
    const fixture = TestBed.createComponent(StrctTable);
    fixture.componentRef.setInput('columns', [{ key: 'a', label: 'A' }]);
    fixture.componentRef.setInput('rows', [{ a: 1 }]);
    fixture.componentRef.setInput('hover', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('strct-table-host--hover');
  });

  it('has a localizable region label (defaults to "Table")', () => {
    const fixture = TestBed.createComponent(StrctTable);
    fixture.componentRef.setInput('columns', [{ key: 'a', label: 'A' }]);
    fixture.componentRef.setInput('rows', [{ a: 1 }]);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Table');

    fixture.componentRef.setInput('label', 'Deployments');
    fixture.detectChanges();
    expect(host.getAttribute('aria-label')).toBe('Deployments');
  });
});

describe('StrctCellDef', () => {
  it('renders a custom cell template', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('td') as HTMLElement;
    expect(cell.textContent!.trim()).toBe('A');
  });
});
