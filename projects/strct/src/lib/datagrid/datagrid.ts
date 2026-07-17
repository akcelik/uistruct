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
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctPagination } from '../pagination/pagination';

/** Every user-visible / assistive string in the grid, overridable for i18n. */
export interface StrctDatagridLabels {
  row: string;
  rows: string;
  selected: string;
  selectAll: string;
  selectRow: string;
  openDetail: string;
  toggleDetail: string;
  closeDetail: string;
  rowActions: string;
  chooseColumns: string;
  refresh: string;
  actions: string;
}

const DG_LABELS: StrctDatagridLabels = {
  row: 'row',
  rows: 'rows',
  selected: 'selected',
  selectAll: 'Select all rows on this page',
  selectRow: 'Select row',
  openDetail: 'Open detail',
  toggleDetail: 'Toggle detail',
  closeDetail: 'Close detail',
  rowActions: 'Row actions',
  chooseColumns: 'Choose columns',
  refresh: 'Refresh data',
  actions: 'Actions',
};
import { StrctCheckbox } from '../forms/checkbox';
import { StrctButton, StrctButtonGroup } from '../button/button';
import { StrctCellContext, StrctCellDef, StrctRow } from '../table/table';
import { StrctMenuItem, StrctMenuService } from '../context-menu/menu';

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
  /**
   * Freeze this column against horizontal scroll. Mark **leading** columns
   * (utility columns freeze automatically alongside). Give every sticky column
   * except the last an explicit px `width` so offsets stay exact.
   */
  sticky?: boolean;
}

type SortDir = 'asc' | 'desc';

/** What the grid wants loaded in server-side (`lazy`) mode. */
export interface StrctDatagridLazyState {
  /** 1-based page. */
  page: number;
  pageSize: number;
  sortKey: string | null;
  sortDir: SortDir;
}

/** Persistable user column preferences (widths from resize, hidden from the chooser). */
export interface StrctDatagridColumnState {
  widths?: Record<string, number>;
  hidden?: string[];
}

/** Utility-column widths used when sticky columns are active (px). */
const UTIL_W = { detail: 36, expand: 36, sel: 40 } as const;
/** Fallback width for a sticky column without an explicit px width. */
const STICKY_FALLBACK_W = 120;

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
  imports: [
    StrctIcon,
    StrctPagination,
    NgTemplateOutlet,
    StrctCheckbox,
    StrctButton,
    StrctButtonGroup,
  ],
  template: `
    @if (actionBarDef()) {
      <div class="strct-dg__toolbar"><ng-content select="[strctDatagridActionBar]" /></div>
    }

    <div class="strct-dg__layout" [class.strct-dg__layout--paned]="paneOpen()">
      <div
        class="strct-dg__scroll"
        tabindex="0"
        role="region"
        [attr.aria-label]="L().rows"
        [style.max-height.px]="virtual() ? viewportHeight() : null"
        (scroll)="virtual() && onScroll($event)"
      >
        <table class="strct-dg">
          <thead>
            <tr>
              @if (canDetail()) {
                <th
                  class="strct-dg__expandcol"
                  [class.strct-dg__cell--sticky]="stickyActive()"
                  [style.insetInlineStart.px]="utilLeft('detail')"
                ></th>
              }
              @if (canExpand()) {
                <th
                  class="strct-dg__expandcol"
                  [class.strct-dg__cell--sticky]="stickyActive()"
                  [style.insetInlineStart.px]="utilLeft('expand')"
                ></th>
              }
              @if (selectable()) {
                <th
                  class="strct-dg__sel"
                  [class.strct-dg__cell--sticky]="stickyActive()"
                  [style.insetInlineStart.px]="utilLeft('sel')"
                >
                  <strct-checkbox
                    [ariaLabel]="L().selectAll"
                    [checked]="allPageSelected()"
                    [indeterminate]="somePageSelected()"
                    (checkedChange)="toggleAll()"
                  />
                </th>
              }
              @for (col of visibleColumns(); track col.key) {
                <th
                  [style.text-align]="col.align ?? 'start'"
                  [style.width]="colWidth(col.key) ?? col.width ?? null"
                  [class.strct-dg__th--sortable]="col.sortable"
                  [class.strct-dg__cell--sticky]="isSticky(col)"
                  [class.strct-dg__cell--sticky-last]="col.key === lastStickyKey()"
                  [style.insetInlineStart.px]="stickyLeft(col.key)"
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
              @if (canActions()) {
                <th class="strct-dg__actioncol" [attr.aria-label]="L().actions"></th>
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
                  @if (canActions()) {
                    <td class="strct-dg__actioncell"></td>
                  }
                </tr>
              }
            } @else {
              @if (virtual() && topPad() > 0) {
                <tr class="strct-dg__vspacer" aria-hidden="true">
                  <td [attr.colspan]="colspan()" [style.height.px]="topPad()"></td>
                </tr>
              }
              @for (row of renderRows(); track rowKey(row)) {
                <tr
                  [class.strct-dg__row--selected]="isSelected(row)"
                  [class.strct-dg__row--active]="paneOpen() && row === activeRow()"
                >
                  @if (canDetail()) {
                    <td
                      class="strct-dg__expandcell"
                      [class.strct-dg__cell--sticky]="stickyActive()"
                      [style.insetInlineStart.px]="utilLeft('detail')"
                    >
                      <button
                        type="button"
                        class="strct-dg__detailbtn"
                        [class.strct-dg__detailbtn--active]="row === activeRow()"
                        [attr.aria-expanded]="row === activeRow()"
                        [attr.aria-label]="L().openDetail"
                        (click)="openDetail(row)"
                      >
                        <strct-icon name="chevronDoubleRight" [size]="13" [strokeWidth]="1.6" />
                      </button>
                    </td>
                  }
                  @if (canExpand()) {
                    <td
                      class="strct-dg__expandcell"
                      [class.strct-dg__cell--sticky]="stickyActive()"
                      [style.insetInlineStart.px]="utilLeft('expand')"
                    >
                      <button
                        type="button"
                        class="strct-dg__expandbtn"
                        [class.strct-dg__expandbtn--open]="isExpanded(row)"
                        [attr.aria-expanded]="isExpanded(row)"
                        [attr.aria-label]="L().toggleDetail"
                        (click)="toggleExpand(row)"
                      >
                        <strct-icon name="chevronRight" [size]="12" [strokeWidth]="1.7" />
                      </button>
                    </td>
                  }
                  @if (selectable()) {
                    <td
                      class="strct-dg__sel"
                      [class.strct-dg__cell--sticky]="stickyActive()"
                      [style.insetInlineStart.px]="utilLeft('sel')"
                    >
                      <strct-checkbox
                        [ariaLabel]="L().selectRow"
                        [checked]="isSelected(row)"
                        (checkedChange)="toggleRow(row)"
                      />
                    </td>
                  }
                  @for (col of visibleColumns(); track col.key) {
                    <td
                      [style.text-align]="col.align ?? 'start'"
                      [class.strct-dg__cell--sticky]="isSticky(col)"
                      [class.strct-dg__cell--sticky-last]="col.key === lastStickyKey()"
                      [style.insetInlineStart.px]="stickyLeft(col.key)"
                    >
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
                  @if (canActions()) {
                    <td class="strct-dg__actioncell">
                      <button
                        type="button"
                        class="strct-dg__kebab"
                        [attr.aria-label]="L().rowActions"
                        (click)="openRowMenu(row, $event)"
                      >
                        <strct-icon name="dots" [size]="16" />
                      </button>
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
              @if (virtual() && bottomPad() > 0) {
                <tr class="strct-dg__vspacer" aria-hidden="true">
                  <td [attr.colspan]="colspan()" [style.height.px]="bottomPad()"></td>
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
              [attr.aria-label]="L().closeDetail"
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

    @if ((pageSize() > 0 || virtual()) && !loading()) {
      <div class="strct-dg__foot">
        <div class="strct-dg__foot-left">
          @if (columnChooser() || sync()) {
            <div class="strct-dg__actions">
              <strct-button-group>
                @if (columnChooser()) {
                  <button
                    strct-button
                    size="sm"
                    [class.is-open]="chooserOpen()"
                    [disabled]="footerActionsDisabled()"
                    [attr.aria-label]="L().chooseColumns"
                    (click)="chooserOpen.set(!chooserOpen())"
                  >
                    <strct-icon name="settings" [size]="16" />
                  </button>
                }
                @if (sync()) {
                  <button
                    strct-button
                    size="sm"
                    [disabled]="footerActionsDisabled()"
                    [attr.aria-label]="L().refresh"
                    (click)="syncChange.emit()"
                  >
                    <strct-icon name="refresh" [size]="16" />
                  </button>
                }
              </strct-button-group>
              @if (columnChooser() && chooserOpen()) {
                <div class="strct-dg__chooser-menu">
                  @for (col of columns(); track col.key) {
                    <div class="strct-dg__chooser-item">
                      <strct-checkbox
                        [checked]="!hiddenColumns().has(col.key)"
                        (checkedChange)="toggleColumn(col.key, $event)"
                      />
                      <span>{{ col.label }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
          <span class="strct-dg__count">
            {{ totalCount() }} {{ totalCount() === 1 ? L().row : L().rows }}
            @if (selectedCount()) {
              <span class="strct-dg__count-sep">|</span>
              <span class="strct-dg__count-sel">{{ selectedCount() }} {{ L().selected }}</span>
            }
          </span>
        </div>
        <div class="strct-dg__foot-right">
          @if (pageSize() > 0) {
            <strct-pagination [total]="totalCount()" [pageSize]="pageSize()" [(page)]="page" />
          }
        </div>
      </div>
    }
  `,
  host: {
    class: 'strct-dg-host',
    '[class.strct-dg-host--compact]': 'compact()',
    '[class.strct-dg-host--singleline]': 'singleLine()',
    '[class.strct-dg-host--virtual]': 'virtual()',
    '[class.strct-dg-host--sticky]': 'stickyActive()',
  },
  styles: [
    `
      /* Enclosed chrome: the action bar, grid and footer share one frame so the
       * whole component reads as a single object on the page. */
      .strct-dg-host {
        display: block;
        border: 1px solid var(--b2);
        border-radius: 10px;
        background: var(--bg-2);
        box-shadow: var(--shadow-rest);
      }
      .strct-dg__scroll {
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      /* Virtual mode: a fixed-height y-scroll viewport with a sticky header. */
      .strct-dg-host--virtual .strct-dg__scroll {
        overflow-y: auto;
      }
      .strct-dg-host--virtual .strct-dg thead th {
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .strct-dg__vspacer td {
        padding: 0;
        border: 0;
        background: transparent;
      }
      /* Sticky cells require border-collapse: separate (collapse breaks
         position: sticky on table cells in Chromium); per-cell bottom borders
         keep the visuals identical. width: max-content lets declared column
         widths win so frozen offsets stay exact. */
      .strct-dg-host--sticky .strct-dg,
      .strct-dg-host--virtual .strct-dg {
        border-collapse: separate;
        border-spacing: 0;
        /* overflow: hidden on the table (corner rounding) would become the
           sticky containing block and defeat position: sticky entirely. */
        overflow: visible;
        border-radius: 0;
      }
      .strct-dg-host--sticky .strct-dg {
        width: max-content;
        min-width: 100%;
      }
      /* Frozen columns: pinned against horizontal scroll, opaque over content. */
      .strct-dg .strct-dg__cell--sticky {
        position: sticky;
        z-index: 3;
      }
      /* th.….--sticky (0-2-2) must beat the virtual-mode "thead th" rule of the
         same specificity by source order, so corner cells paint above both the
         scrolled header cells and the frozen body cells. */
      .strct-dg thead th.strct-dg__cell--sticky {
        z-index: 6;
      }
      .strct-dg .strct-dg__cell--sticky-last::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        inset-inline-end: -1px;
        width: 7px;
        pointer-events: none;
        background: linear-gradient(to right, rgba(0, 0, 0, 0.14), transparent);
      }
      [dir='rtl'] .strct-dg .strct-dg__cell--sticky-last::after {
        background: linear-gradient(to left, rgba(0, 0, 0, 0.14), transparent);
      }
      /* Fixed utility-column widths so frozen offsets stay exact. */
      .strct-dg-host--sticky .strct-dg__expandcol,
      .strct-dg-host--sticky .strct-dg__expandcell {
        width: 36px;
        min-width: 36px;
        max-width: 36px;
        box-sizing: border-box;
      }
      .strct-dg-host--sticky .strct-dg__sel {
        width: 40px;
        min-width: 40px;
        max-width: 40px;
        box-sizing: border-box;
      }
      /* Sticky header cells need an opaque ground (thead th already has bg-2;
         utility body cells inherit the row background rules below). */
      .strct-dg-host--sticky tbody .strct-dg__cell--sticky {
        background: var(--bg-1);
      }
      [data-theme='dark'] .strct-dg-host--sticky tbody .strct-dg__cell--sticky {
        background: var(--bg-3);
      }
      /* Hover / selected tints can be translucent — composite them over the
         opaque base so scrolled content never shows through a frozen cell. */
      .strct-dg-host--sticky tbody tr:hover .strct-dg__cell--sticky {
        background: linear-gradient(var(--acc-s), var(--acc-s)) var(--bg-1);
      }
      [data-theme='dark'] .strct-dg-host--sticky tbody tr:hover .strct-dg__cell--sticky {
        background: linear-gradient(var(--acc-s), var(--acc-s)) var(--bg-3);
      }
      .strct-dg-host--sticky tbody .strct-dg__row--selected .strct-dg__cell--sticky {
        background: linear-gradient(var(--acc-m), var(--acc-m)) var(--bg-1);
      }
      [data-theme='dark']
        .strct-dg-host--sticky
        tbody
        .strct-dg__row--selected
        .strct-dg__cell--sticky {
        background: linear-gradient(var(--acc-m), var(--acc-m)) var(--bg-3);
      }
      .strct-dg {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        overflow: hidden;
        background: var(--bg-2);
      }
      /* The table rounds only the frame corners it actually touches (no
       * toolbar above / no footer below); interior edges stay square. */
      .strct-dg-host:not(:has(.strct-dg__toolbar)) .strct-dg {
        border-start-start-radius: 9px;
        border-start-end-radius: 9px;
      }
      .strct-dg-host:not(:has(.strct-dg__foot)) .strct-dg {
        border-end-start-radius: 9px;
        border-end-end-radius: 9px;
      }
      .strct-dg th,
      .strct-dg td {
        padding: 9px 13px;
        text-align: start;
        border-bottom: 1px solid var(--b1);
      }
      .strct-dg tbody td {
        background: var(--bg-1);
      }
      /* In dark mode, body cells should read slightly lighter than the header
       * so the grid feels like a raised surface rather than a recessed pit. */
      [data-theme='dark'] .strct-dg tbody td {
        background: var(--bg-3);
      }
      .strct-dg-host--compact .strct-dg th,
      .strct-dg-host--compact .strct-dg td {
        padding: 5px 11px;
      }
      /* Single-line rows: cells never wrap; long values truncate with an
       * ellipsis (capped per cell) so row height stays uniform. */
      .strct-dg-host--singleline .strct-dg tbody tr:not(.strct-dg__detailrow) > td {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 360px;
      }
      .strct-dg th {
        position: relative;
        font-size: 12px;
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
        inset-inline-end: 0;
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
      .strct-dg__actioncol,
      .strct-dg__actioncell {
        width: 1%;
        white-space: nowrap;
        text-align: end;
      }
      .strct-dg__kebab {
        display: inline-flex;
        padding: 4px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
        transition:
          color 0.14s ease,
          background 0.14s ease;
      }
      .strct-dg__kebab:hover {
        color: var(--t1);
        background: var(--bg-3);
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
        align-items: flex-start;
        min-width: 0;
      }
      .strct-dg__layout--paned {
        gap: 0;
      }
      .strct-dg__layout--paned .strct-dg__scroll {
        flex: 0 0 auto;
        width: 260px;
        min-width: 260px;
        max-width: 260px;
      }
      .strct-dg__layout--paned .strct-dg {
        width: 260px;
        min-width: 260px;
        max-width: 260px;
        flex-shrink: 0;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
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
        padding-inline-end: 26px;
      }
      .strct-dg__layout--paned .strct-dg__row--active td:last-child::after {
        content: '';
        position: absolute;
        right: 11px;
        top: 50%;
        width: 6px;
        height: 6px;
        border-top: 1.6px solid var(--acc);
        border-inline-end: 1.6px solid var(--acc);
        transform: translateY(-50%) rotate(45deg);
      }
      .strct-dg__pane {
        flex: 1;
        min-width: 0;
        align-self: stretch;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-inline-start: 2px solid var(--acc);
        border-radius: 8px;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
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
        padding: 9px 14px;
        border-bottom: 1px solid var(--b2);
      }

      .strct-dg__foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 9px 14px;
        border-top: 1px solid var(--b2);
        flex-wrap: wrap;
      }
      .strct-dg__foot-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .strct-dg__foot-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .strct-dg__actions {
        position: relative;
      }
      .strct-dg__chooser-menu {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 0;
        z-index: 10;
        min-width: 180px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 8px;
        box-shadow: var(--shadow-pop);
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .strct-dg__chooser-menu--right {
        inset-inline-start: auto;
        inset-inline-end: 0;
      }
      .strct-dg__chooser-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        color: var(--t1);
        transition: background 0.1s ease;
        user-select: none;
      }
      .strct-dg__chooser-item:hover {
        background: var(--bg-3);
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
  /**
   * Keep every row exactly one line tall: cell content never wraps — long values
   * truncate with an ellipsis instead — so tall content can't distort the grid.
   */
  readonly singleLine = input(false, { transform: booleanAttribute });
  /** Message shown when there are no rows. */
  readonly emptyText = input('No data');
  /** Show skeleton rows while data is loading. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Enable column resizing by dragging column headers. */
  readonly resizable = input(false, { transform: booleanAttribute });
  /** Show a column-chooser dropdown in the footer. */
  readonly columnChooser = input(false, { transform: booleanAttribute });
  /** Show a refresh button in the footer. */
  readonly sync = input(false, { transform: booleanAttribute });
  /** Disable all footer action buttons (sync, column chooser, etc.). */
  readonly footerActionsDisabled = input(false, { transform: booleanAttribute });
  /**
   * Stable row identity (property key or function). Set this for live-refreshing
   * data so selection, expansion and the active detail row survive re-fetches
   * that replace the row objects. Defaults to object identity.
   */
  readonly rowId = input<StrctRowId | null>(null);
  /**
   * Per-row action menu resolver. When set, each row gets a trailing actions
   * column with a vertical-dots (kebab) button that opens this row's menu.
   *   [rowActions]="(row) => [{ label: 'Open', action: () => open(row) }, …]"
   */
  readonly rowActions = input<((row: StrctRow) => StrctMenuItem[]) | null>(null);
  /**
   * Seed the row selection. Each value is a row id (matching {@link rowId}); the
   * grid checks those rows when this input is set or changes. Requires
   * `selectable`. Assigning a new array (e.g. when opening a dialog) re-seeds the
   * selection; the user's subsequent toggles are preserved until the next change.
   */
  readonly initialSelection = input<readonly unknown[] | null>(null);
  /** Override any user-visible / assistive string (partial; merged over defaults). */
  readonly labels = input<Partial<StrctDatagridLabels>>({});
  /** Effective labels (defaults + overrides). */
  protected readonly L = computed(() => ({ ...DG_LABELS, ...this.labels() }));
  /**
   * Virtual scrolling for large data sets: only the rows inside the viewport
   * (plus a small overscan) are in the DOM — 20k+ rows stay smooth. The scroll
   * area gets `viewportHeight` and a sticky header. Assumes uniform
   * `rowHeight`; combine with `expandable` is unsupported.
   */
  readonly virtual = input(false, { transform: booleanAttribute });
  /** Scroll viewport height in px (virtual mode). */
  readonly viewportHeight = input(360);
  /** Uniform row height in px (virtual mode; tune when `compact`). */
  readonly rowHeight = input(38);
  /**
   * Server-side mode: the grid never sorts or slices `rows` itself — it shows
   * them as given and emits `(lazyLoad)` with `{ page, pageSize, sortKey,
   * sortDir }` whenever the user pages or sorts (and once on init). Provide
   * `total` so the pager and count reflect the full server-side set.
   */
  readonly lazy = input(false, { transform: booleanAttribute });
  /** Total row count on the server (lazy mode). */
  readonly total = input<number | null>(null);
  /**
   * Persist the user's column widths + hidden columns under this key in
   * localStorage (`strct-dg:<key>`), restoring them on init. For full control
   * use the two-way `columnState` instead (both may be combined).
   */
  readonly stateKey = input<string | null>(null);
  /** User column preferences (two-way): widths from resize, hidden from the chooser. */
  readonly columnState = model<StrctDatagridColumnState | null>(null);
  /** Emitted when the selection changes. */
  readonly selectionChange = output<StrctRow[]>();
  /** Emitted when the refresh button is clicked. */
  readonly syncChange = output<void>();
  /** Emitted when a row's action-menu item is chosen. */
  readonly rowAction = output<{ row: StrctRow; item: StrctMenuItem }>();
  /** Server-side data request (lazy mode): load this page / sort and set `rows`. */
  readonly lazyLoad = output<StrctDatagridLazyState>();

  private readonly menu = inject(StrctMenuService);

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
  protected readonly hiddenColumns = signal<Set<string>>(new Set());
  protected readonly chooserOpen = signal(false);
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
  /** Whether to render the trailing row-actions (kebab) column. */
  protected readonly canActions = computed(() => !!this.rowActions() && !this.paneOpen());
  /** Only the first column is shown while the detail pane is open. */
  protected readonly visibleColumns = computed(() => {
    if (this.paneOpen()) return this.columns().slice(0, 1);
    const hidden = this.hiddenColumns();
    return this.columns().filter((c) => !hidden.has(c.key));
  });

  protected readonly sorted = computed(() => {
    // Server-side mode: rows arrive already ordered / sliced — never touch them.
    if (this.lazy()) return this.rows();
    const { key, dir } = this.sort();
    const data = [...this.rows()];
    if (!key) return data;
    const sign = dir === 'asc' ? 1 : -1;
    return data.sort((a, b) => sign * this.compare(a[key], b[key]));
  });

  protected readonly paged = computed(() => {
    const size = this.pageSize();
    if (this.lazy() || size <= 0) return this.sorted();
    const start = (this.page() - 1) * size;
    return this.sorted().slice(start, start + size);
  });

  /** Full count for the pager / footer (server total in lazy mode). */
  protected readonly totalCount = computed(() =>
    this.lazy() ? (this.total() ?? this.rows().length) : this.sorted().length,
  );

  // ── Virtual scrolling ──────────────────────────────────────────
  private readonly scrollTop = signal(0);
  protected onScroll(event: Event): void {
    this.scrollTop.set((event.target as HTMLElement).scrollTop);
  }
  /** Visible index window incl. overscan (virtual mode). */
  private readonly vRange = computed(() => {
    const rh = Math.max(1, this.rowHeight());
    const n = this.sorted().length;
    const start = Math.max(0, Math.floor(this.scrollTop() / rh) - 6);
    const count = Math.ceil(this.viewportHeight() / rh) + 12;
    return { start, end: Math.min(n, start + count) };
  });
  /** The rows actually rendered: the virtual window, or the current page. */
  protected readonly renderRows = computed(() =>
    this.virtual() ? this.sorted().slice(this.vRange().start, this.vRange().end) : this.paged(),
  );
  protected readonly topPad = computed(() =>
    this.virtual() ? this.vRange().start * this.rowHeight() : 0,
  );
  protected readonly bottomPad = computed(() =>
    this.virtual() ? Math.max(0, (this.sorted().length - this.vRange().end) * this.rowHeight()) : 0,
  );

  // ── Sticky (frozen) columns ────────────────────────────────────
  protected readonly stickyActive = computed(
    () => !this.paneOpen() && this.visibleColumns().some((c) => c.sticky),
  );
  /** Total width of the frozen utility columns (detail / expand / select). */
  private readonly utilityWidth = computed(
    () =>
      (this.canDetail() ? UTIL_W.detail : 0) +
      (this.canExpand() ? UTIL_W.expand : 0) +
      (this.selectable() ? UTIL_W.sel : 0),
  );
  /** Left offset of a frozen utility column, or null when sticky is off. */
  protected utilLeft(which: 'detail' | 'expand' | 'sel'): number | null {
    if (!this.stickyActive()) return null;
    let x = 0;
    if (which === 'detail') return x;
    if (this.canDetail()) x += UTIL_W.detail;
    if (which === 'expand') return x;
    if (this.canExpand()) x += UTIL_W.expand;
    return x;
  }
  /** Effective px width of a column (resize override → declared px → fallback). */
  private colPx(col: StrctDatagridColumn): number {
    const resized = this.columnWidths().get(col.key);
    if (resized != null) return resized;
    const m = /^(\d+(?:\.\d+)?)px$/.exec(col.width ?? '');
    return m ? parseFloat(m[1]) : STICKY_FALLBACK_W;
  }
  /** key → left px for sticky data columns. */
  private readonly stickyOffsets = computed(() => {
    const map = new Map<string, number>();
    if (!this.stickyActive()) return map;
    let x = this.utilityWidth();
    for (const col of this.visibleColumns()) {
      if (!col.sticky) continue;
      map.set(col.key, x);
      x += this.colPx(col);
    }
    return map;
  });
  protected stickyLeft(key: string): number | null {
    return this.stickyOffsets().get(key) ?? null;
  }
  protected isSticky(col: StrctDatagridColumn): boolean {
    return !!col.sticky && this.stickyActive();
  }
  /** The last frozen column carries the edge shadow. */
  protected readonly lastStickyKey = computed(() => {
    let last: string | null = null;
    for (const col of this.visibleColumns()) if (col.sticky) last = col.key;
    return this.stickyActive() ? last : null;
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

  /** Last emitted lazy request (dedupe key). */
  private lastLazyKey = '';
  /** Last serialized column state pushed outward (loop guard). */
  private lastStateKey = '';

  constructor() {
    // Keep the page in range when the data set shrinks (server total in lazy mode).
    effect(() => {
      const size = this.pageSize();
      if (size <= 0) return;
      const count = this.totalCount();
      const pageCount = Math.max(1, Math.ceil(count / size));
      if (this.page() > pageCount) this.page.set(pageCount);
    });
    // Seed the selection from initialSelection (re-runs only when the input changes,
    // so a user's own toggles afterward are untouched).
    effect(() => {
      const init = this.initialSelection();
      if (init == null) return;
      untracked(() => this.selected.set(new Set(init)));
    });
    // Server-side mode: announce what to load whenever page / sort / pageSize
    // change (and once on init, so the consumer fetches the first page).
    effect(() => {
      if (!this.lazy()) return;
      const state: StrctDatagridLazyState = {
        page: this.page(),
        pageSize: this.pageSize(),
        sortKey: this.sort().key,
        sortDir: this.sort().dir,
      };
      const key = JSON.stringify(state);
      untracked(() => {
        if (key === this.lastLazyKey) return;
        this.lastLazyKey = key;
        this.lazyLoad.emit(state);
      });
    });
    // Restore persisted column preferences once, before the first render.
    const persisted = this.readPersistedState();
    if (persisted) this.applyColumnState(persisted);
    // Apply externally-driven columnState.
    effect(() => {
      const st = this.columnState();
      untracked(() => {
        if (!st || JSON.stringify(st) === this.lastStateKey) return;
        this.lastStateKey = JSON.stringify(st);
        this.applyColumnState(st);
      });
    });
    // Push user changes (resize / chooser) outward + persist under stateKey.
    effect(() => {
      const widths = Object.fromEntries(this.columnWidths());
      const hidden = [...this.hiddenColumns()];
      const st: StrctDatagridColumnState = { widths, hidden };
      const key = JSON.stringify(st);
      untracked(() => {
        if (key === this.lastStateKey) return;
        this.lastStateKey = key;
        this.columnState.set(st);
        const sk = this.stateKey();
        if (sk && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(`strct-dg:${sk}`, key);
          } catch {
            /* storage full / denied — persistence is best-effort */
          }
        }
      });
    });
  }

  private readPersistedState(): StrctDatagridColumnState | null {
    const sk = this.stateKey();
    if (!sk || typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`strct-dg:${sk}`);
      return raw ? (JSON.parse(raw) as StrctDatagridColumnState) : null;
    } catch {
      return null;
    }
  }

  private applyColumnState(st: StrctDatagridColumnState): void {
    this.columnWidths.set(new Map(Object.entries(st.widths ?? {}).map(([k, v]) => [k, Number(v)])));
    this.hiddenColumns.set(new Set(st.hidden ?? []));
  }

  /**
   * The grid as CSV: header labels + every non-hidden column, all rows in the
   * current order (client mode: the full sorted set, not just the page).
   */
  toCSV(): string {
    const hidden = this.hiddenColumns();
    const cols = this.columns().filter((c) => !hidden.has(c.key));
    const esc = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const data = this.lazy() ? this.rows() : this.sorted();
    return [
      cols.map((c) => esc(c.label)).join(','),
      ...data.map((r) => cols.map((c) => esc(r[c.key])).join(',')),
    ].join('\n');
  }

  /** Download the grid as a CSV file. */
  downloadCSV(filename = 'datagrid.csv'): void {
    if (typeof document === 'undefined') return;
    const blob = new Blob(['\uFEFF' + this.toCSV()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected colspan(): number {
    return (
      this.visibleColumns().length +
      (this.selectable() ? 1 : 0) +
      (this.canExpand() ? 1 : 0) +
      (this.canDetail() ? 1 : 0) +
      (this.canActions() ? 1 : 0)
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

  /** Open the row-action menu next to the clicked kebab button. */
  protected openRowMenu(row: StrctRow, event: MouseEvent): void {
    event.stopPropagation();
    const fn = this.rowActions();
    if (!fn) return;
    const items = fn(row);
    if (!items.length) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.menu.open({
      x: rect.right,
      y: rect.bottom + 4,
      items,
      data: row,
      onSelect: (item) => this.rowAction.emit({ row, item }),
    });
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

  toggleColumn(key: string, visible: boolean): void {
    this.hiddenColumns.update((set) => {
      const next = new Set(set);
      if (visible) next.delete(key);
      else next.add(key);
      return next;
    });
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
