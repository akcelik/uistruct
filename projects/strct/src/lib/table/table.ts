import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
} from '@angular/core';

/** Column definition for the table. */
export interface StrctColumn {
  key: string;
  label: string;
  align?: 'start' | 'center' | 'end';
  width?: string;
}

/** Shorthand for a record-shaped table/datagrid row. */
export type StrctRow = Record<string, unknown>;

/** Context passed to a per-column cell template. */
export interface StrctCellContext {
  /** The row object. */
  $implicit: StrctRow;
  /** The raw value for this column (`row[column.key]`). */
  value: unknown;
  /** The column definition. */
  column: StrctColumn;
}

/**
 * Per-column cell template for `strct-table` / `strct-datagrid`. The column key
 * is the directive value; the row, value and column are the template context:
 *
 *   <ng-template strctCell="status" let-row let-value="value">
 *     <strct-badge [status]="row['success'] ? 'success' : 'critical'">{{ value }}</strct-badge>
 *   </ng-template>
 */
@Directive({ selector: '[strctCell]' })
export class StrctCellDef {
  /** Key. */
  readonly key = input.required<string>({ alias: 'strctCell' });
  readonly template = inject<TemplateRef<StrctCellContext>>(TemplateRef);
}

/**
 * Declarative data table. Cells render `row[col.key]` as text by default; supply
 * a `*strctCell` template per column for custom content.
 *   <strct-table [columns]="cols" [rows]="data" hover />
 */
@Component({
  selector: 'strct-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    <table class="strct-table">
      <thead>
        <tr>
          @for (col of columns(); track col.key) {
            <th [style.text-align]="col.align ?? 'start'" [style.width]="col.width">
              {{ col.label }}
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @if (loading()) {
          @for (_ of [1, 2, 3]; track $index) {
            <tr class="strct-table__skeleton-row">
              @for (col of columns(); track col.key) {
                <td [style.text-align]="col.align ?? 'start'">
                  <div class="strct-table__skeleton-block"></div>
                </td>
              }
            </tr>
          }
        } @else {
          @for (row of rows(); track $index) {
            <tr>
              @for (col of columns(); track col.key) {
                <td [style.text-align]="col.align ?? 'start'">
                  @if (cellTemplate(col.key); as tpl) {
                    <ng-container
                      [ngTemplateOutlet]="tpl"
                      [ngTemplateOutletContext]="{
                        $implicit: row,
                        value: row[col.key],
                        column: col,
                      }"
                    />
                  } @else {
                    {{ row[col.key] }}
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td class="strct-table__empty" [attr.colspan]="columns().length">
                {{ emptyText() }}
              </td>
            </tr>
          }
        }
      </tbody>
    </table>
  `,
  host: {
    class: 'strct-table-host',
    tabindex: '0',
    role: 'region',
    'aria-label': 'Table',
    '[class.strct-table-host--striped]': 'striped()',
    '[class.strct-table-host--hover]': 'hover()',
  },
  styles: [
    `
      .strct-table-host {
        display: block;
        overflow-x: auto;
      }
      .strct-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        border: 1px solid var(--b2);
        border-radius: 8px;
        overflow: hidden;
      }
      .strct-table th,
      .strct-table td {
        padding: 9px 13px;
        text-align: start;
        border-bottom: 1px solid var(--b1);
      }
      .strct-table th {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--t2);
        background: var(--bg-2);
      }
      .strct-table td {
        color: var(--t1);
      }
      .strct-table tbody tr:last-child td {
        border-bottom: 0;
      }
      .strct-table-host--striped tbody tr:nth-child(even) td {
        background: var(--bg-2);
      }
      .strct-table-host--hover tbody tr:hover td {
        background: var(--acc-s);
      }
      @keyframes strct-skeleton-pulse {
        0%,
        100% {
          opacity: 0.4;
        }
        50% {
          opacity: 0.7;
        }
      }
      .strct-table__skeleton-block {
        height: 12px;
        border-radius: var(--radius-sm);
        /* Same sweep as strct-datagrid / strct-skeleton — "loading" must look
           identical across the three surfaces, and a pulse on --bg-3 is
           invisible on dark themes. */
        background: linear-gradient(
          90deg,
          var(--bg-3) 25%,
          var(--skeleton-hi, var(--acc18)) 50%,
          var(--bg-3) 75%
        );
        background-size: 200% 100%;
        animation: strct-table-skeleton-sweep 1.1s linear infinite;
      }
      @keyframes strct-table-skeleton-sweep {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: -100% 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-table__skeleton-block {
          animation: none;
          background: var(--skeleton-hi, var(--acc18));
        }
      }
      .strct-table__skeleton-row td {
        border-bottom: 1px solid var(--b1);
      }
      .strct-table__empty {
        text-align: center;
        color: var(--t3);
        padding: 22px;
      }
    `,
  ],
})
export class StrctTable {
  /** Column definitions. */
  readonly columns = input.required<StrctColumn[]>();
  /** Data rows. */
  readonly rows = input.required<StrctRow[]>();
  /** Enable zebra-striping. */
  readonly striped = input(false, { transform: booleanAttribute });
  /** Highlight rows on hover. */
  readonly hover = input(false, { transform: booleanAttribute });
  /** Message shown when there are no rows. */
  readonly emptyText = input('No data');
  /** Show skeleton rows while data is loading. */
  readonly loading = input(false, { transform: booleanAttribute });

  private readonly cellDefs = contentChildren(StrctCellDef);
  private readonly cellMap = computed(() => {
    const m = new Map<string, TemplateRef<StrctCellContext>>();
    for (const d of this.cellDefs()) m.set(d.key(), d.template);
    return m;
  });

  protected cellTemplate(key: string): TemplateRef<StrctCellContext> | null {
    return this.cellMap().get(key) ?? null;
  }
}
