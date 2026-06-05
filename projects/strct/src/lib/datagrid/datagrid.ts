import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctPagination } from '../pagination/pagination';
import { StrctCellContext, StrctCellDef, StrctRow } from '../table/table';

/** Resolves a stable identity for a row: a property key, or a function. */
export type StrctRowId = string | ((row: StrctRow) => unknown);

/** Column definition for the datagrid. */
export interface StrctDatagridColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
  /** Allow the user to resize this column by dragging its right edge.
   *  Defaults to the global {@link StrctDatagrid#resizable} setting. */
  resizable?: boolean;
}

type SortDir = 'asc' | 'desc';

/**
 * Marks the expandable-row detail template. The row is the template's implicit
 * context: `<ng-template strctRowDetail let-row> … {{ row['name'] }} … </ng-template>`.
 */
@Directive({ selector: '[strctRowDetail]' })
export class StrctRowDetailDef {
  readonly template = inject(TemplateRef);
}

/** Marks the persistent action-bar (toolbar) content shown above the grid. */
@Directive({ selector: '[strctDatagridActionBar]' })
export class StrctDatagridActionBar {}

/**
 * Interactive data table: sortable columns, row selection, expandable detail
 * rows, a batch action bar and built-in paging.
 *   <strct-datagrid [columns]="cols" [rows]="data" selectable expandable [pageSize]="10">
 *     <button strct-button strctDatagridActions size="sm">Migrate</button>
 *     <ng-template strctRowDetail let-row> … </ng-template>
 *   </strct-datagrid>
 */
@Component({
  selector: 'strct-datagrid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctPagination, NgTemplateOutlet],
  template: `
    @if (actionBarDef()) {
      <div class="strct-dg__toolbar"><ng-content select="[strctDatagridActionBar]" /></div>
    }

    <div class="strct-dg__layout" [class.strct-dg__layout--paned]="paneOpen()">
      <div class="strct-dg__scroll">
        <table class="strct-dg">
          <thead>
            <tr>
              @if (canDetail()) {
                <th class="strct-dg__expandcol"></th>
              }
              @if (canExpand()) {
                <th class="strct-dg__expandcol"></th>
              }
              @if (selectable()) {
                <th class="strct-dg__sel">
                  <input
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    [checked]="allPageSelected()"
                    [indeterminate]="somePageSelected()"
                    (change)="toggleAll()"
                  />
                </th>
              }
              @for (col of visibleColumns(); track col.key) {
                <th
                  [style.text-align]="col.align ?? 'start'"
                  [style.width]="colWidth(col.key) ?? col.width ?? null"
                  [class.strct-dg__th--sortable]="col.sortable"
                  [attr.tabindex]="col.sortable ? 0 : null"
                  [attr.aria-sort]="col.sortable ? ariaSort(col.key) : null"
                  (click)="col.sortable && sortBy(col.key)"
                  (keydown.enter)="col.sortable && sortBy(col.key)"
                  (keydown.space)="col.sortable && onHeaderSpace($event, col.key)"
                >
                  <span class="strct-dg__hd">
                    {{ col.label }}
                    @if (col.sortable) {
                      <strct-icon
                        class="strct-dg__sorticon"
                        [name]="sortIcon(col.key)"
                        [size]="13"
                      />
                    }
                  </span>
                  @if (resizable() && col.resizable !== false) {
                    <div
                      class="strct-dg__resize"
                      (mousedown)="onResizeStart($event, col.key)"
                    ></div>
                  }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              @for (_ of [1, 2, 3, 4, 5]; track $index) {
                <tr class="strct-dg__skeleton-row">
                  @if (canDetail()) {
                    <td class="strct-dg__expandcell"></td>
                  }
                  @if (canExpand()) {
                    <td class="strct-dg__expandcell"></td>
                  }
                  @if (selectable()) {
                    <td class="strct-dg__sel"></td>
                  }
                  @for (col of visibleColumns(); track col.key) {
                    <td [style.text-align]="col.align ?? 'start'">
                      <div class="strct-dg__skeleton-block"></div>
                    </td>
                  }
                </tr>
              }
            } @else {
              @for (row of paged(); track rowKey(row)) {
                <tr
                  [class.strct-dg__row--selected]="isSelected(row)"
                  [class.strct-dg__row--active]="paneOpen() && row === activeRow()"
                >
                  @if (canDetail()) {
                    <td class="strct-dg__expandcell">
                      <button
                        type="button"
                        class="strct-dg__detailbtn"
                        [class.strct-dg__detailbtn--active]="row === activeRow()"
                        [attr.aria-expanded]="row === activeRow()"
                        aria-label="Open detail"
                        (click)="openDetail(row)"
                      >
                        <strct-icon name="chevronDoubleRight" [size]="13" [strokeWidth]="1.6" />
                      </button>
                    </td>
                  }
                  @if (canExpand()) {
                    <td class="strct-dg__expandcell">
                      <button
                        type="button"
                        class="strct-dg__expandbtn"
                        [class.strct-dg__expandbtn--open]="isExpanded(row)"
                        [attr.aria-expanded]="isExpanded(row)"
                        aria-label="Toggle detail"
                        (click)="toggleExpand(row)"
                      >
                        <strct-icon name="chevronRight" [size]="12" [strokeWidth]="1.7" />
                      </button>
                    </td>
                  }
                  @if (selectable()) {
                    <td class="strct-dg__sel">
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        [checked]="isSelected(row)"
                        (change)="toggleRow(row)"
                      />
                    </td>
                  }
                  @for (col of visibleColumns(); track col.key) {
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
                @if (canExpand() && isExpanded(row)) {
                  <tr class="strct-dg__detailrow">
                    <td [attr.colspan]="colspan()">
                      <div class="strct-dg__detail">
                        <ng-container
                          [ngTemplateOutlet]="detailDef()!.template"
                          [ngTemplateOutletContext]="{ $implicit: row }"
                        />
                      </div>
                    </td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td class="strct-dg__empty" [attr.colspan]="colspan()">{{ emptyText() }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      @if (paneOpen()) {
        <aside class="strct-dg__pane">
          <div class="strct-dg__pane-head">
            <span class="strct-dg__pane-title">{{ activeRow()![columns()[0].key] }}</span>
            <button
              type="button"
              class="strct-dg__pane-close"
              aria-label="Close detail"
              (click)="closePane()"
            >
              <strct-icon name="close" [size]="13" />
            </button>
          </div>
          <div class="strct-dg__pane-body">
            <ng-container
              [ngTemplateOutlet]="detailDef()!.template"
              [ngTemplateOutletContext]="{ $implicit: activeRow() }"
            />
          </div>
        </aside>
      }
    </div>

    @if (pageSize() > 0 && !loading()) {
      <div class="strct-dg__foot">
        <span class="strct-dg__count">
          {{ sorted().length }} {{ sorted().length === 1 ? 'row' : 'rows' }}
          @if (selectedCount()) {
            <span class="strct-dg__count-sep">|</span>
            <span class="strct-dg__count-sel">{{ selectedCount() }} selected</span>
          }
        </span>
        <strct-pagination [total]="sorted().length" [pageSize]="pageSize()" [(page)]="page" />
      </div>
    }
  `,
  host: {
    class: 'strct-dg-host',
    '[class.strct-dg-host--compact]': 'compact()',
  },
  styles: [
    `
      .strct-dg-host {
        display: block;
      }
      .strct-dg__scroll {
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .strct-dg {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        font-size: 13px;
        border: 1px solid var(--b2);
        border-radius: 8px;
        overflow: hidden;
      }
      .strct-dg th,
      .strct-dg td {
        padding: 9px 13px;
        text-align: left;
        border-bottom: 1px solid var(--b1);
      }
      .strct-dg-host--compact .strct-dg th,
      .strct-dg-host--compact .strct-dg td {
        padding: 5px 11px;
      }
      .strct-dg th {
        position: relative;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--t2);
        background: var(--bg-2);
        white-space: nowrap;
        user-select: none;
      }
      .strct-dg__th--sortable {
        cursor: pointer;
      }
      .strct-dg__th--sortable:hover {
        color: var(--t1);
      }
      .strct-dg__th--sortable:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-dg__hd {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .strct-dg__sorticon {
        color: var(--t3);
      }
      .strct-dg__th--sortable:hover .strct-dg__sorticon {
        color: var(--acc);
      }
      .strct-dg__resize {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: col-resize;
        background: transparent;
        z-index: 2;
      }
      .strct-dg__resize:hover {
        background: var(--acc);
      }
      .strct-dg td {
        color: var(--t1);
      }
      .strct-dg tbody tr:last-child td {
        border-bottom: 0;
      }
      .strct-dg tbody tr:not(.strct-dg__detailrow):hover td {
        background: var(--acc-s);
      }
      .strct-dg__row--selected td {
        background: var(--acc-m);
      }
      .strct-dg__sel {
        width: 1%;
        white-space: nowrap;
      }
      .strct-dg__sel input {
        accent-color: var(--acc);
        width: 15px;
        height: 15px;
        cursor: pointer;
      }

      .strct-dg__expandcol,
      .strct-dg__expandcell {
        width: 1%;
        white-space: nowrap;
      }
      .strct-dg__expandbtn {
        display: inline-flex;
        padding: 3px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
        transition:
          transform 0.15s ease,
          color 0.15s ease;
      }
      .strct-dg__expandbtn:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-dg__expandbtn--open {
        transform: rotate(90deg);
        color: var(--acc);
      }
      .strct-dg__detailbtn {
        display: inline-flex;
        padding: 3px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
        transition:
          color 0.14s ease,
          background 0.14s ease;
      }
      .strct-dg__detailbtn:hover {
        color: var(--acc);
        background: var(--bg-3);
      }
      .strct-dg__detailbtn--active {
        color: var(--acc);
        background: var(--acc-m);
      }
      .strct-dg__detailrow td {
        background: var(--bg-2);
        padding: 0;
      }
      .strct-dg__detail {
        padding: 14px 16px;
        font-size: 13px;
        color: var(--t2);
      }

      /* Detail pane: grid collapses to one column, content opens beside it. */
      .strct-dg__layout {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        min-width: 0;
      }
      .strct-dg__layout--paned .strct-dg {
        width: auto;
        min-width: 180px;
        max-width: 260px;
        flex-shrink: 0;
      }
      .strct-dg__row--clickable {
        cursor: pointer;
      }
      .strct-dg__row--active td {
        background: var(--acc-m);
      }
      /* Caret on the active row that points toward the open detail pane. */
      .strct-dg__layout--paned .strct-dg__row--active td:last-child {
        position: relative;
        padding-right: 26px;
      }
      .strct-dg__layout--paned .strct-dg__row--active td:last-child::after {
        content: '';
        position: absolute;
        right: 11px;
        top: 50%;
        width: 6px;
        height: 6px;
        border-top: 1.6px solid var(--acc);
        border-right: 1.6px solid var(--acc);
        transform: translateY(-50%) rotate(45deg);
      }
      .strct-dg__pane {
        flex: 1;
        min-width: 0;
        align-self: stretch;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-left: 2px solid var(--acc);
        border-radius: 8px;
        overflow: hidden;
        animation: strct-dg-pane-in 0.14s ease;
      }
      .strct-dg__pane-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 11px 14px;
        border-bottom: 1px solid var(--b1);
        font-size: 13px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-dg__pane-close {
        display: inline-flex;
        padding: 3px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
      }
      .strct-dg__pane-close:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-dg__pane-body {
        padding: 14px 16px;
        font-size: 13px;
        color: var(--t2);
      }
      @keyframes strct-dg-pane-in {
        from {
          opacity: 0;
          transform: translateX(8px);
        }
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
      .strct-dg__skeleton-block {
        height: 12px;
        background: var(--bg-3);
        border-radius: var(--radius-sm);
        animation: strct-skeleton-pulse 1.4s ease infinite;
      }
      .strct-dg__skeleton-row td {
        border-bottom: 1px solid var(--b1);
      }
      .strct-dg__empty {
        text-align: center;
        color: var(--t3);
        padding: 22px;
      }
      /* Persistent action bar (toolbar) above the grid — always visible. */
      .strct-dg__toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        padding: 8px 0;
        margin-bottom: 8px;
        border-bottom: 1px solid var(--b1);
      }

      .strct-dg__foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 12px;
        flex-wrap: wrap;
      }
      .strct-dg__count {
        font-size: 12px;
        color: var(--t2);
      }
      .strct-dg__count-sep {
        margin: 0 8px;
        color: var(--b2);
      }
      .strct-dg__count-sel {
        color: var(--acc);
      }
    `,
  ],
})
export class StrctDatagrid {
  /** Column definitions. */
  readonly columns = input.required<StrctDatagridColumn[]>();
  /** Data rows. */
  readonly rows = input.required<StrctRow[]>();
  /** Rows per page (0 disables paging). */
  readonly pageSize = input(0);
  /** Enable row selection. */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Expand a row in place to reveal its detail template below it. */
  readonly expandable = input(false, { transform: booleanAttribute });
  /** Collapse the grid to a single column and open a side detail pane for the
   *  clicked row (distinct from {@link expandable}). */
  readonly detailPane = input(false, { transform: booleanAttribute });
  /** Compact density mode. */
  readonly compact = input(false, { transform: booleanAttribute });
  /** Message shown when there are no rows. */
  readonly emptyText = input('No data');
  /** Show skeleton rows while data is loading. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Enable column resizing by dragging column headers. */
  readonly resizable = input(false, { transform: booleanAttribute });
  /**
   * Stable row identity (property key or function). Set this for live-refreshing
   * data so selection, expansion and the active detail row survive re-fetches
   * that replace the row objects. Defaults to object identity.
   */
  readonly rowId = input<StrctRowId | null>(null);
  /** Emitted when the selection changes. */
  readonly selectionChange = output<StrctRow[]>();

  protected readonly detailDef = contentChild(StrctRowDetailDef);
  protected readonly actionBarDef = contentChild(StrctDatagridActionBar);
  private readonly cellDefs = contentChildren(StrctCellDef);
  private readonly cellMap = computed(() => {
    const m = new Map<string, TemplateRef<StrctCellContext>>();
    for (const d of this.cellDefs()) m.set(d.key(), d.template);
    return m;
  });

  readonly page = signal(1);
  private readonly sort = signal<{ key: string | null; dir: SortDir }>({ key: null, dir: 'asc' });
  /** Selection / expansion are tracked by row id (see {@link rowId}). */
  private readonly selected = signal<Set<unknown>>(new Set());
  protected readonly selectedCount = computed(() => this.selected().size);
  private readonly expandedRows = signal<Set<unknown>>(new Set());
  private readonly columnWidths = signal<Map<string, number>>(new Map());
  private resizeState: { key: string; startX: number; startWidth: number } | null = null;
  private readonly onMove = (e: MouseEvent) => this.onResizeMove(e);
  private readonly onUp = () => this.onResizeEnd();

  colWidth(key: string): string | null {
    const px = this.columnWidths().get(key);
    return px != null ? `${px}px` : null;
  }

  onResizeStart(e: MouseEvent, key: string) {
    e.preventDefault();
    const th = (e.target as HTMLElement).closest('th');
    if (!th) return;
    this.resizeState = { key, startX: e.clientX, startWidth: th.offsetWidth };
    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onUp);
  }

  private onResizeMove(e: MouseEvent) {
    if (!this.resizeState) return;
    const diff = e.clientX - this.resizeState.startX;
    const newWidth = Math.max(40, this.resizeState.startWidth + diff);
    this.columnWidths.update((m) => {
      const next = new Map(m);
      next.set(this.resizeState!.key, newWidth);
      return next;
    });
  }

  private onResizeEnd() {
    this.resizeState = null;
    document.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseup', this.onUp);
  }

  private readonly activeId = signal<unknown>(null);
  protected readonly activeRow = computed(() => {
    const id = this.activeId();
    if (id == null) return null;
    return this.rows().find((r) => this.idOf(r) === id) ?? null;
  });

  protected readonly canExpand = computed(
    () => this.expandable() && !this.detailPane() && !!this.detailDef(),
  );
  protected readonly canDetail = computed(() => this.detailPane() && !!this.detailDef());
  protected readonly paneOpen = computed(
    () => this.detailPane() && !!this.detailDef() && !!this.activeRow(),
  );
  /** Only the first column is shown while the detail pane is open. */
  protected readonly visibleColumns = computed(() =>
    this.paneOpen() ? this.columns().slice(0, 1) : this.columns(),
  );

  protected readonly sorted = computed(() => {
    const { key, dir } = this.sort();
    const data = [...this.rows()];
    if (!key) return data;
    const sign = dir === 'asc' ? 1 : -1;
    return data.sort((a, b) => sign * this.compare(a[key], b[key]));
  });

  protected readonly paged = computed(() => {
    const size = this.pageSize();
    if (size <= 0) return this.sorted();
    const start = (this.page() - 1) * size;
    return this.sorted().slice(start, start + size);
  });

  protected readonly allPageSelected = computed(() => {
    const rows = this.paged();
    return rows.length > 0 && rows.every((r) => this.selected().has(this.idOf(r)));
  });
  protected readonly somePageSelected = computed(
    () => !this.allPageSelected() && this.paged().some((r) => this.selected().has(this.idOf(r))),
  );

  /** Resolve a row's stable identity (defaults to the row object itself). */
  private idOf(row: StrctRow): unknown {
    const id = this.rowId();
    if (id == null) return row;
    return typeof id === 'function' ? id(row) : row[id];
  }

  protected rowKey(row: StrctRow): unknown {
    return this.idOf(row);
  }

  protected cellTemplate(key: string): TemplateRef<StrctCellContext> | null {
    return this.cellMap().get(key) ?? null;
  }

  constructor() {
    // Keep the page in range when the data set shrinks.
    effect(() => {
      const size = this.pageSize();
      if (size <= 0) return;
      const pageCount = Math.max(1, Math.ceil(this.sorted().length / size));
      if (this.page() > pageCount) this.page.set(pageCount);
    });
  }

  protected colspan(): number {
    return (
      this.visibleColumns().length +
      (this.selectable() ? 1 : 0) +
      (this.canExpand() ? 1 : 0) +
      (this.canDetail() ? 1 : 0)
    );
  }

  /** Toggle the detail pane for a row (triggered by its »  button, not the row,
   *  so row cells remain selectable for copy). */
  openDetail(row: StrctRow): void {
    const id = this.idOf(row);
    this.activeId.set(this.activeId() === id ? null : id);
  }

  closePane(): void {
    this.activeId.set(null);
  }

  sortBy(key: string): void {
    const current = this.sort();
    if (current.key !== key) {
      this.sort.set({ key, dir: 'asc' });
    } else if (current.dir === 'asc') {
      this.sort.set({ key, dir: 'desc' });
    } else {
      this.sort.set({ key: null, dir: 'asc' });
    }
  }

  protected sortIcon(key: string): string {
    const { key: k, dir } = this.sort();
    if (k !== key) return 'sortNone';
    return dir === 'asc' ? 'sortAsc' : 'sortDesc';
  }

  protected ariaSort(key: string): 'ascending' | 'descending' | 'none' {
    const { key: k, dir } = this.sort();
    if (k !== key) return 'none';
    return dir === 'asc' ? 'ascending' : 'descending';
  }

  protected onHeaderSpace(event: Event, key: string): void {
    event.preventDefault(); // stop page scroll
    this.sortBy(key);
  }

  protected isSelected(row: StrctRow): boolean {
    return this.selected().has(this.idOf(row));
  }

  protected isExpanded(row: StrctRow): boolean {
    return this.expandedRows().has(this.idOf(row));
  }

  toggleExpand(row: StrctRow): void {
    const id = this.idOf(row);
    const next = new Set(this.expandedRows());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expandedRows.set(next);
  }

  toggleRow(row: StrctRow): void {
    const id = this.idOf(row);
    const next = new Set(this.selected());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.commitSelection(next);
  }

  toggleAll(): void {
    const next = new Set(this.selected());
    const rows = this.paged();
    if (this.allPageSelected()) {
      rows.forEach((r) => next.delete(this.idOf(r)));
    } else {
      rows.forEach((r) => next.add(this.idOf(r)));
    }
    this.commitSelection(next);
  }

  clearSelection(): void {
    this.commitSelection(new Set());
  }

  /** Emit the current row objects whose id is selected (resolved against the
   *  latest data, so consumers always get fresh references). */
  private commitSelection(next: Set<unknown>): void {
    this.selected.set(next);
    this.selectionChange.emit(this.rows().filter((r) => next.has(this.idOf(r))));
  }

  private compare(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
  }
}
