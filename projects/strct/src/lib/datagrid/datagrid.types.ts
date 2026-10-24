/**
 * The datagrid's vocabulary: its columns, its labels, the objects its features
 * take and the shapes its outputs carry. Declarations only — the component is
 * in `datagrid.ts`, which re-exports every name here, so an import from the
 * package is unchanged.
 */
import { StrctOption } from '../combobox/combobox';
import { StrctRow } from '../table/table';
import { StrctStatus } from '../status';

/** Which way a column is sorted. */
export type SortDir = 'asc' | 'desc';

/** Every user-visible / assistive string in the grid, overridable for i18n. */
export interface StrctDatagridLabels {
  row: string;
  /** Name of the scrolling rows region (prefixed with `caption`, if any). */
  rows: string;
  /** Name of the pager's navigation landmark (prefixed with `caption`, if any). */
  pagination: string;
  selected: string;
  selectAll: string;
  /** Base row-checkbox label; superseded by {@link selectRowFor}, which
   *  appends the row's identifier. Kept for existing overrides. */
  selectRow: string;
  /** Row-checkbox label factory: receives the row's id (`rowId`) or its
   *  1-based index, so every row's checkbox gets a distinct name. */
  selectRowFor: (id: string) => string;
  /** Label of a group header's select-all checkbox (`groupSelect`). */
  selectAllInGroup: (group: string) => string;
  openDetail: string;
  toggleDetail: string;
  closeDetail: string;
  /** The pane's way back to the list, when it has taken the list's place. */
  backToList: string;
  rowActions: string;
  chooseColumns: string;
  refresh: string;
  actions: string;
  filterColumn: string;
  filterPlaceholder: string;
  clearFilter: string;
  editCell: string;
  /** How an editable cell says, to assistive tech, that it can be edited. */
  editCellInstructions: string;
  /** The names of the utility columns, read but not shown. */
  detailColumn: string;
  expandColumn: string;
  selectColumn: string;
  toggleChildren: string;
  quickFilter: string;
  /** `paging="more"`: the button that asks for the next slice. */
  loadMore: string;
  /** `paging="more"`: what the footer says it is showing. */
  showing: (shown: number, total?: number) => string;
  /**
   * What the grid announces after it changes under the reader: sorting
   * reorders every row, a page replaces them, a filter hides most of them —
   * none of it is visible to someone who cannot see the table.
   */
  /** The resize separator's name, per column. */
  resizeColumn: (column: string) => string;
  /** The two empty states, and the way out of the filtered one. */
  noMatches: string;
  noMatchesFor: (query: string) => string;
  clearFilters: string;
  /** The bulk-selection escape: the page is selected, everything is not. */
  pageSelected: (shown: number) => string;
  selectAllCount: (total: number) => string;
  allSelected: (total: number) => string;
  clearSelection: string;
  sortedAscending: (column: string) => string;
  sortedDescending: (column: string) => string;
  sortCleared: string;
  pageOf: (page: number, pages: number) => string;
  rowsMatch: (shown: number, total: number) => string;
}

export const DG_LABELS: StrctDatagridLabels = {
  loadMore: 'Load more',
  showing: (shown, total) =>
    total === undefined ? `Showing ${shown}` : `Showing the latest ${shown} of ${total}`,
  row: 'row',
  rows: 'rows',
  pagination: 'Pagination',
  selected: 'selected',
  selectAll: 'Select all rows on this page',
  selectRow: 'Select row',
  selectRowFor: (id: string) => `Select row ${id}`,
  selectAllInGroup: (group: string) => `Select all in ${group}`,
  openDetail: 'Open detail',
  toggleDetail: 'Toggle detail',
  closeDetail: 'Close detail',
  backToList: 'Back to the list',
  rowActions: 'Row actions',
  chooseColumns: 'Choose columns',
  refresh: 'Refresh data',
  actions: 'Actions',
  filterColumn: 'Filter',
  filterPlaceholder: 'Filter…',
  clearFilter: 'Clear filter',
  editCell: 'Edit',
  editCellInstructions: 'Editable cell. Press Enter or F2 to edit, arrow keys to move.',
  detailColumn: 'Open detail',
  expandColumn: 'Expand row',
  selectColumn: 'Select row',
  toggleChildren: 'Toggle children',
  quickFilter: 'Quick filter',
  resizeColumn: (column) => `Resize ${column}`,
  noMatches: 'No rows match the filter',
  noMatchesFor: (query) => `Nothing matches “${query}”.`,
  clearFilters: 'Clear filters',
  pageSelected: (shown) => `All ${shown} rows on this page are selected.`,
  selectAllCount: (total) => `Select all ${total}`,
  allSelected: (total) => `All ${total} rows are selected.`,
  clearSelection: 'Clear selection',
  sortedAscending: (column) => `Sorted by ${column}, ascending`,
  sortedDescending: (column) => `Sorted by ${column}, descending`,
  sortCleared: 'Sorting cleared',
  pageOf: (page, pages) => `Page ${page} of ${pages}`,
  rowsMatch: (shown, total) => `${shown} of ${total} rows match`,
};

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
  /** Header filter popover: contains-text by default; see `filterOptions`. */
  filterable?: boolean;
  /** Distinct values for a checkbox set-filter (implies `filterable`). */
  filterOptions?: unknown[];
  /**
   * Inline cell editing: double-click opens an input; Enter / blur commit via
   * `(cellEdit)`, Escape cancels. The grid never mutates rows — apply the
   * change in your handler and pass the updated array back in.
   */
  editable?: boolean;
  /**
   * Which editor an `editable` column opens. `'text'` (the default) is the
   * free-text box; `'number'` opens `strct-number`, and `'select'` opens
   * `strct-select` over `editorOptions` — a value that is one of a set is
   * chosen, not typed. The cell shows the chosen option's label at rest.
   */
  editor?: 'text' | 'number' | 'select';
  /** Options for `editor: 'select'` (the library's own option shape). */
  /**
   * What this column sorts by, when the cell does not show it: "1.5 TB" is
   * sorted by its bytes, a formatted date by its timestamp. `null` and `''`
   * are "unread" and sort last in both directions.
   */
  sortValue?: (row: StrctRow) => unknown;
  /** Full control of the order, when a key is not enough. Wins over `sortValue`. */
  comparator?: (a: StrctRow, b: StrctRow) => number;
  /** What an export writes for this column; defaults to the stored value. */
  exportValue?: (row: StrctRow) => unknown;
  /**
   * Keep this column visible while a `detailPane` is open. Without any, the
   * list collapses to its first column — which cuts a long name in half and
   * hides the status the operator is triaging by.
   */
  keepInPane?: boolean;
  /**
   * Hidden until the chooser is asked for it — the column exists, it is just
   * not one of the defaults. A persisted or bound `columnState` wins.
   */
  hidden?: boolean;
  /**
   * The choices an `editor: 'select'` offers. A function is asked per row: a
   * rule that holds a value the host no longer reports lists it for that row
   * only, rather than every row's picker carrying every other row's.
   */
  editorOptions?: StrctOption[] | ((row: StrctRow) => StrctOption[]);
  /** Bounds and step for `editor: 'number'`. */
  editorMin?: number;
  editorMax?: number;
  editorStep?: number;
  /** The look of a cell is column metadata, not a cell template. */
  mono?: boolean;
  muted?: boolean;
  /** Aligns to the end with tabular figures — a counter reads as a column. */
  numeric?: boolean;
  /** Shown in `--t3` when the value is null / undefined / '' (default: blank). */
  emptyText?: string;
  /** Read as the value by assistive tech in place of `emptyText`'s glyph. */
  emptyLabel?: string;
  /** A quiet second line in the cell, from `row[descriptionKey]`. */
  descriptionKey?: string;
}

/** Per-column filter state: contains-text, or the checked value set. */
export type StrctDatagridFilters = Record<string, string | unknown[]>;

/** How rows are picked. Replaces `selectable`, `selectionMode`, `selectionColumn`, `rowSelectable`, `groupSelect`, `initialSelection`. */
export interface StrctDatagridSelection {
  /** Rows can be picked at all. */
  enabled?: boolean;
  /** `multiple` (tick column) or `single` (a native radio group). */
  mode?: 'none' | 'multiple' | 'single';
  /** `none` drops the tick / radio column: the row itself is the control. */
  column?: 'auto' | 'none';
  /** Which rows may be picked — a string is the reason the row cannot. */
  rowSelectable?: (row: StrctRow) => boolean | string;
  /** A group header's tick picks the group's rows. */
  groupSelect?: boolean;
  /** Ids ticked on first render. */
  initial?: readonly unknown[] | null;
}

/** How the rows are paged. Replaces `pageSize`, `hasMore`, `loadingMore`, `moreTotal`, `lazy`, `total`. */
export interface StrctDatagridPaging {
  /** Numbered pages, or a "load more" footer. */
  mode?: 'pages' | 'more';
  /** Rows per page; 0 shows every row. */
  pageSize?: number;
  /** `more` mode: there is another page to ask for. */
  hasMore?: boolean;
  /** `more` mode: the next page is on its way. */
  loadingMore?: boolean;
  /** `more` mode: how many rows there are in all. */
  moreTotal?: number | null;
  /** The server sorts, filters and pages; the grid asks with `(lazyLoad)`. */
  lazy?: boolean;
  /** `lazy` mode: the row count the server reports. */
  total?: number | null;
}

/** The detail pane beside the rows. Replaces `detailPane`, `paneListWidth`, `paneTakeoverWidth`. */
export interface StrctDatagridPane {
  /** Draw the pane. */
  enabled?: boolean;
  /** The list's width beside it — a length or a percentage. */
  listWidth?: string;
  /** Under this width the pane takes the whole grid over. */
  takeoverWidth?: number;
}

/**
 * Virtual scrolling. Replaces `viewportHeight` and `rowHeight` — both of
 * which mean nothing unless the grid virtualises, which is why an object
 * here turns it on. `maxHeight` is NOT one of them: it caps a grid that is
 * not virtual, so it stays an input of its own (5.33.0).
 */
export interface StrctDatagridVirtual {
  /** Render only the rows in view. */
  enabled?: boolean;
  /** The scrolling viewport's height in px. */
  viewportHeight?: number;
  /** One row's height in px — the measure the window is computed from. */
  rowHeight?: number;
}

/** How rows are grouped. Replaces `groupBy`, `groups`, `showEmptyGroups`, `childrenKey`. */
export interface StrctDatagridGrouping {
  /** The column whose value groups the rows. */
  by?: string | null;
  /** The groups the consumer defines, in their own order. */
  groups?: readonly StrctDatagridGroup[] | null;
  /** Draw a declared group that no row landed in. */
  showEmpty?: boolean;
  /** The row property that holds child rows (a tree grid). */
  childrenKey?: string | null;
}

/** The quick filter. Replaces `quickFilterable`, `quickFilterFields`, `quickFilterAlign`. */
export interface StrctDatagridFiltering {
  /** Draw the quick-filter field in the toolbar. */
  quick?: boolean;
  /** The columns it searches; every column when absent. */
  fields?: string[] | null;
  /** Which end of the toolbar it sits at. */
  align?: 'start' | 'end';
}

/** Remembered state. Replaces `stateKey`, `sync`. */
export interface StrctDatagridState {
  /** Storage key: the grid restores and persists its columns under it. */
  key?: string | null;
  /** Draw the footer's sync button. */
  sync?: boolean;
}

/** What the grid wants loaded in server-side (`lazy`) mode. */
export interface StrctDatagridLazyState {
  /** 1-based page. */
  page: number;
  pageSize: number;
  sortKey: string | null;
  sortDir: SortDir;
  /** Active per-column filters (empty object when none). */
  filters: StrctDatagridFilters;
  /** The global quick-filter term ('' when none). */
  quickFilter: string;
}

/**
 * A group the consumer defines, beside `groupBy`. A triage page orders its
 * groups by urgency, not alphabetically, and "Passed (59)" starts folded.
 */
export interface StrctDatagridGroup {
  /** The `groupBy` column's value this group holds. */
  value: unknown;
  /** Shown instead of the raw value. */
  label?: string;
  /** Tints the label and the count chip. */
  status?: StrctStatus;
  /** One muted line after the count — "Blocks the join until …". */
  note?: string;
  /** Initial state; groups are expanded by default. */
  collapsed?: boolean;
  /** Shown instead of the row count — a server's total. */
  count?: number;
}

/** Persistable user column preferences (widths from resize, hidden from the
 *  chooser, order from drag-reorder). */
export interface StrctDatagridColumnState {
  widths?: Record<string, number>;
  hidden?: string[];
  order?: string[];
  /** The column the operator sorted by, and which way. */
  sortKey?: string | null;
  sortDir?: 'asc' | 'desc';
}
