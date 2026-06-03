import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export interface StrctColumn {
  key: string;
  label: string;
  align?: 'start' | 'center' | 'end';
  width?: string;
}

export type StrctRow = Record<string, unknown>;

/**
 * Declarative data table.
 *   <strct-table [columns]="cols" [rows]="data" hover />
 */
@Component({
  selector: 'strct-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table class="strct-table">
      <thead>
        <tr>
          @for (col of columns(); track col.key) {
            <th [style.text-align]="col.align ?? 'start'" [style.width]="col.width">{{ col.label }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track $index) {
          <tr>
            @for (col of columns(); track col.key) {
              <td [style.text-align]="col.align ?? 'start'">{{ row[col.key] }}</td>
            }
          </tr>
        } @empty {
          <tr>
            <td class="strct-table__empty" [attr.colspan]="columns().length">{{ emptyText() }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  host: {
    class: 'strct-table-host',
    '[class.strct-table-host--striped]': 'striped()',
    '[class.strct-table-host--hover]': 'hover()',
  },
  styles: [
    `
    .strct-table-host { display: block; overflow-x: auto; }
    .strct-table {
      width: 100%; border-collapse: collapse; font-size: 13px;
      border: 1px solid var(--b2); border-radius: 8px; overflow: hidden;
    }
    .strct-table th, .strct-table td {
      padding: 9px 13px; text-align: left;
      border-bottom: 1px solid var(--b1);
    }
    .strct-table th {
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px;
      color: var(--t2); background: var(--bg-2);
    }
    .strct-table td { color: var(--t1); }
    .strct-table tbody tr:last-child td { border-bottom: 0; }
    .strct-table-host--striped tbody tr:nth-child(even) td { background: var(--bg-2); }
    .strct-table-host--hover tbody tr:hover td { background: var(--acc-s); }
    .strct-table__empty { text-align: center; color: var(--t3); padding: 22px; }
    `,
  ],
})
export class StrctTable {
  readonly columns = input.required<StrctColumn[]>();
  readonly rows = input.required<StrctRow[]>();
  readonly striped = input(false, { transform: booleanAttribute });
  readonly hover = input(false, { transform: booleanAttribute });
  readonly emptyText = input('No data');
}
