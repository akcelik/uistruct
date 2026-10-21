import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostListener,
  NgZone,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctPagination } from '../pagination/pagination';

import { StrctStatus } from '../status';
import { StrctCheckbox } from '../forms/checkbox';
import { StrctOption } from '../combobox/combobox';
import { StrctSelect } from '../select/select';
import { StrctSpinner } from '../spinner/spinner';
import { StrctEmptyState } from '../empty-state/empty-state';
import { StrctNumber } from '../number/number';
import { StrctButton, StrctButtonGroup } from '../button/button';
import { StrctCellContext, StrctCellDef, StrctRow } from '../table/table';
import { StrctMenuItem, StrctMenuService } from '../context-menu/menu';
import { StrctOverlay } from '../overlay/overlay';
import { focusFirstIn, restoreFocus } from '../overlay/focus';
import { StrctSearchbox } from '../searchbox/searchbox';
import { XlsxValue, buildXlsx } from './xlsx';
import { strctDevWarn, strctOnDevWarnReset } from '../util/dev-warn';
// The grid's vocabulary lives beside it now, and is re-exported here so every
// import path that worked before the split still works.
export * from './datagrid.types';
import {
  DG_LABELS,
  SortDir,
  StrctDatagridColumn,
  StrctDatagridColumnState,
  StrctDatagridFiltering,
  StrctDatagridFilters,
  StrctDatagridGroup,
  StrctDatagridGrouping,
  StrctDatagridLabels,
  StrctDatagridLazyState,
  StrctDatagridPane,
  StrctDatagridPaging,
  StrctDatagridSelection,
  StrctDatagridState,
  StrctDatagridVirtual,
  StrctRowId,
} from './datagrid.types';

/*
 * ── The grid's features, as objects (5.30.0) ──────────────────────────────
 *
 * The component grew to 54 inputs, which is more than a template can read.
 * Each cluster of them becomes one object; the flat inputs keep working
 * through 5.x and dev mode says which object each has moved into, so a
 * consumer upgrades a screen at a time. They are removed in 6.0.
 *
 * What stays flat on purpose: the two-way state (`selectedIds`, `filters`,
 * `columnState`, `collapsedGroups`, `quickFilter`, `activeRowId`,
 * `selectedId`), because `[(…)]` cannot bind through a property of an
 * object; and the grid's core (`columns`, `rows`, `rowId`, `labels`) with the
 * handful of look flags.
 */

/** Flat inputs already named in a deprecation warning, per app run. */
const warnedFlatInputs = new Set<string>();
const pendingFlatInputWarnings = new Set<string>();
let flatInputWarningQueued = false;
strctOnDevWarnReset(() => {
  warnedFlatInputs.clear();
  pendingFlatInputWarnings.clear();
});

/**
 * `virtual` and `pane` take the flag they always took — including the bare
 * attribute, which arrives as `''` — or the object that replaced their
 * satellite inputs.
 */
function objectOrBoolean<T extends object>(value: boolean | '' | T): boolean | T {
  return typeof value === 'object' && value !== null ? value : booleanAttribute(value);
}

/**
 * A fully custom group header row:
 *
 *   <ng-template strctGroupHeader let-group let-count="count">
 *     <strct-badge [status]="group.status">{{ group.label }}</strct-badge> {{ count }}
 *   </ng-template>
 */
/** The pane header's own title, instead of the first column's value. */
@Directive({ selector: '[strctDetailPaneTitle]' })
export class StrctDetailPaneTitle {}

/** Status, category, nodes — what the row is, beside its title. */
@Directive({ selector: '[strctDetailPaneMeta]' })
export class StrctDetailPaneMeta {}

/** Controls at the pane header's end; the close button stays the library's. */
@Directive({ selector: '[strctDetailPaneActions]' })
export class StrctDetailPaneActions {}

@Directive({ selector: 'ng-template[strctGroupHeader]' })
export class StrctGroupHeaderDef {
  readonly template = inject(TemplateRef);
}

/** One rendered tbody item: a data row, or a group header. */
interface DgItem {
  row?: StrctRow;
  group?: {
    key: unknown;
    label: string;
    count: number;
    collapsed: boolean;
    status?: StrctStatus;
    note?: string;
  };
}

let datagridCounter = 0;

/** Utility-column widths used when sticky columns are active (px). */
const UTIL_W = { detail: 36, expand: 36, sel: 40 } as const;
/** Fallback width for a sticky column without an explicit px width. */
const STICKY_FALLBACK_W = 120;

/**
 * Marks the expandable-row detail template. The row is the template's implicit
 * context (`let-row`, or `let-row="row"`): `<ng-template strctRowDetail let-row> … {{ row['name'] }} … </ng-template>`.
 */
@Directive({ selector: '[strctRowDetail]' })
export class StrctRowDetailDef {
  readonly template = inject(TemplateRef);
}

/** Muted note inside the action bar, before the buttons. */
@Directive({ selector: '[strctDatagridActionBarCaption]' })
export class StrctDatagridActionBarCaption {}

/** Marks the persistent action-bar (toolbar) content shown above the grid. */
@Directive({ selector: '[strctDatagridActionBar]' })
export class StrctDatagridActionBar {}

/**
 * Interactive data table: sortable columns, row selection (Shift-click a row
 * checkbox to carry its new state across a whole block), expandable detail
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
    StrctOverlay,
    StrctSearchbox,
    StrctSelect,
    StrctNumber,
    StrctSpinner,
    StrctEmptyState,
    FormsModule,
  ],
  templateUrl: './datagrid.html',
  host: {
    class: 'strct-dg-host',
    // The skeleton rows say "updating" to the eye; this says it to everyone else.
    '[attr.aria-busy]': 'loading() || loadingMore() ? "true" : null',
    '[class.strct-dg-host--compact]': 'compact()',
    '[class.strct-dg-host--singleline]': 'singleLine()',
    '[class.strct-dg-host--virtual]': 'virtual()',
    '[class.strct-dg-host--bounded]': '!virtual() && maxHeight() !== null',
    '[class.strct-dg-host--sticky]': 'stickyActive()',
    '[class.strct-dg-host--flush]': 'flush()',
  },
  styleUrl: './datagrid.css',
})
export class StrctDatagrid {
  /** Column definitions. */
  readonly columns = input.required<StrctDatagridColumn[]>();
  /** Data rows. */
  readonly rows = input.required<StrctRow[]>();
  /** Rows per page (0 disables paging). */
  readonly pageSizeFlat = input(0, { alias: 'pageSize' });
  /** Enable row selection. */
  readonly selectableFlat = input(false, { alias: 'selectable', transform: booleanAttribute });
  /** Expand a row in place to reveal its detail template below it. */
  readonly expandable = input(false, { transform: booleanAttribute });
  /** Collapse the grid to a single column and open a side detail pane for the
   *  clicked row (distinct from {@link expandable}). */
  readonly detailPaneFlat = input(false, { alias: 'detailPane', transform: booleanAttribute });
  /**
   * How wide the list column is while the pane is open — px or any CSS width.
   * 260px cuts a test name like "Validate Switch Enabled Teaming
   * Configurations" in half and hides its status.
   */
  readonly paneListWidthFlat = input<string>('260px', { alias: 'paneListWidth' });
  /**
   * Below this container width (px) the pane takes the list's place, with a
   * way back in its header, rather than squeezing both into a phone.
   */
  readonly paneTakeoverWidthFlat = input(900, { alias: 'paneTakeoverWidth' });
  /**
   * The row whose pane is open, two-way: a "what to do next" chip opens the
   * finding it settles, a URL fragment deep-links to a test, `null` closes it.
   */
  readonly activeRowId = model<unknown>(null);
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
  readonly syncFlat = input(false, { alias: 'sync', transform: booleanAttribute });
  /** Disable all footer action buttons (sync, column chooser, etc.). */
  readonly footerActionsDisabled = input(false, { transform: booleanAttribute });
  /**
   * Stable row identity (property key or function). Set this for live-refreshing
   * data so selection, expansion and the active detail row survive re-fetches
   * that replace the row objects. Defaults to object identity.
   */
  readonly rowId = input<StrctRowId | null>(null);
  /**
   * How many rows a user may pick. `selectable` remains the boolean for
   * `multiple`, so nothing changes for a grid that already uses it; picking
   * exactly one row is grid behaviour rather than a column of radios the
   * consumer builds and wires by hand.
   */
  readonly selectionModeFlat = input<'none' | 'multiple' | 'single'>('none', {
    alias: 'selectionMode',
  });
  /** Two-way single selection: the row id (per `rowId`), or null. */
  readonly selectedId = model<unknown>(null);
  /**
   * Whether a row may be picked. Return `false` to lock it, or a string to lock
   * it AND say why — shown as the row's tooltip and given to assistive tech as
   * the control's description, following the `hint` convention.
   */
  readonly rowSelectableFlat = input<((row: StrctRow) => boolean | string) | null>(null, {
    alias: 'rowSelectable',
  });
  /** No outer border, radius or shadow — for a grid inside a bordered panel. */
  readonly flush = input(false, { transform: booleanAttribute });
  /** The grid's title, rendered above the header and used as its accessible name. */
  readonly caption = input('');
  /** Whether there is another slice to ask for. */
  readonly hasMoreFlat = input(false, { alias: 'hasMore', transform: booleanAttribute });
  /** A slice is on its way: the button waits with a spinner. */
  readonly loadingMoreFlat = input(false, { alias: 'loadingMore', transform: booleanAttribute });
  /** The grand total, when the API knows it — "Showing the latest 50 of 812". */
  readonly moreTotalFlat = input<number | null>(null, { alias: 'moreTotal' });
  /** The user asked for the next slice. */
  readonly loadMore = output<void>();
  /** With `groupBy` and multiple selection: a tri-state checkbox per group. */
  readonly groupSelectFlat = input(false, { alias: 'groupSelect', transform: booleanAttribute });
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
  readonly initialSelectionFlat = input<readonly unknown[] | null>(null, {
    alias: 'initialSelection',
  });
  /**
   * The selection itself, two-way, for `selectionMode="multiple"` — what
   * `selectedId` is for single mode. Write it and the grid checks those rows
   * and counts them; the user's own picks write back, in the order they were
   * made. `null` (the default) means the consumer does not drive the
   * selection, so a grid that only seeds with `initialSelection` is unchanged.
   */
  readonly selectedIds = model<readonly unknown[] | null>(null);
  /** Override any user-visible / assistive string (partial; merged over defaults). */
  readonly labels = input<Partial<StrctDatagridLabels>>({});
  /** Effective labels (defaults + overrides). */
  protected readonly L = computed(() => ({ ...DG_LABELS, ...this.labels() }));
  /** Scroll viewport height in px (virtual mode). */
  readonly viewportHeightFlat = input(360, { alias: 'viewportHeight' });
  /**
   * Show a pencil on an editable cell when it is hovered or focused. A mouse
   * user finds an editable cell by double-clicking one; nothing said so.
   */
  readonly editHint = input(false, { transform: booleanAttribute });
  /** Uniform row height in px (virtual mode; tune when `compact`). */
  readonly rowHeightFlat = input(38, { alias: 'rowHeight' });
  /**
   * Server-side mode: the grid never sorts or slices `rows` itself — it shows
   * them as given and emits `(lazyLoad)` with `{ page, pageSize, sortKey,
   * sortDir }` whenever the user pages or sorts (and once on init). Provide
   * `total` so the pager and count reflect the full server-side set.
   */
  readonly lazyFlat = input(false, { alias: 'lazy', transform: booleanAttribute });
  /** Total row count on the server (lazy mode). */
  readonly totalFlat = input<number | null>(null, { alias: 'total' });
  /**
   * Persist the user's column widths + hidden columns under this key in
   * localStorage (`strct-dg:<key>`), restoring them on init. For full control
   * use the two-way `columnState` instead (both may be combined).
   */
  readonly stateKeyFlat = input<string | null>(null, { alias: 'stateKey' });
  /** User column preferences (two-way): widths from resize, hidden from the chooser. */
  readonly columnState = model<StrctDatagridColumnState | null>(null);
  /** Let the user reorder data columns by dragging their headers. */
  readonly reorderable = input(false, { transform: booleanAttribute });
  /**
   * Group rows by this column key: the grid renders a collapsible header row
   * per distinct value (with a count), respecting the current sort within
   * groups. Paging is bypassed while grouped; not combinable with `virtual`.
   */
  readonly groupByFlat = input<string | null>(null, { alias: 'groupBy' });
  /**
   * The groups themselves, beside `groupBy`: their order, their labels, a
   * tone, a note, whether they start folded and a count of the consumer's
   * own. Values no group mentions follow, in the order the rows arrived.
   */
  readonly groupsFlat = input<readonly StrctDatagridGroup[] | null>(null, { alias: 'groups' });
  /** Keep a declared group that holds no rows, rather than dropping it. */
  readonly showEmptyGroupsFlat = input(false, {
    alias: 'showEmptyGroups',
    transform: booleanAttribute,
  });
  /**
   * Which groups are folded, two-way — so a summary counter elsewhere on the
   * page can open the group it counts.
   */
  readonly collapsedGroups = model<readonly unknown[]>([]);
  /**
   * Two-way per-column filter state: `key → contains-text` (text filter) or
   * `key → unknown[]` (checked value set). Applied client-side; in `lazy`
   * mode it is passed through on `lazyLoad` instead.
   */
  readonly filters = model<StrctDatagridFilters>({});
  /**
   * Global quick filter (two-way): one term substring-matched (OR) across
   * `quickFilterFields` — the console-standard "filter this list fast" box.
   * Complementary to the per-column `filters` (which AND). Applied before
   * paging client-side; passed through on `lazyLoad` in server mode.
   */
  readonly quickFilter = model('');
  /** Columns the quick term scans. Defaults to every column's `key`. */
  readonly quickFilterFieldsFlat = input<string[] | null>(null, { alias: 'quickFilterFields' });
  /** Render the built-in quick-filter searchbox in the toolbar. */
  readonly quickFilterableFlat = input(false, {
    alias: 'quickFilterable',
    transform: booleanAttribute,
  });
  /**
   * Where the built-in box sits in the toolbar. `'end'` (default) follows the
   * console convention: action verbs lead on the left, view controls sit at
   * the far right — and the box keeps a stable position across grids whose
   * button sets differ.
   */
  readonly quickFilterAlignFlat = input<'start' | 'end'>('end', { alias: 'quickFilterAlign' });
  /**
   * Tree-grid: the row property holding a row's children array. Rows render
   * hierarchically with indent + carets; sorting applies per sibling level;
   * an active filter shows matches with their ancestors, force-expanded.
   * Not combinable with `groupBy` or `lazy`.
   *
   * The table claims `role="treegrid"` and honors the row-level core of the
   * treegrid keyboard contract: rows carry a roving tabindex, ArrowUp/Down
   * move focus between rows, ArrowRight expands a collapsed parent row and
   * ArrowLeft collapses an expanded one. There is no cell-level navigation —
   * Tab walks the interactive elements inside each row as usual.
   */
  readonly childrenKeyFlat = input<string | null>(null, { alias: 'childrenKey' });
  /**
   * `'table'` (the default) is what the grid has always been: a table whose
   * controls each take a tab stop. `'grid'` is the APG grid: the table claims
   * `role="grid"`, the rows carry a roving tabindex so the whole grid is **one**
   * tab stop, ↑/↓ move the cursor, Home/End jump, →/← step through the focused
   * row's own controls and Escape comes back out, Space picks and Enter
   * activates. It also makes a selected row say so — `aria-selected` on a row
   * reaches no screen reader outside a grid.
   *
   * Opt-in, because it changes what Tab does inside the table.
   */
  readonly interactionMode = input<'table' | 'grid'>('table');
  /**
   * `'none'` hides the tick / radio column while selection keeps working — a
   * file list selects by clicking the row, not a control in it. The row is
   * then the control, so pair it with `interactionMode="grid"`.
   */
  readonly selectionColumnFlat = input<'auto' | 'none'>('auto', { alias: 'selectionColumn' });
  /**
   * The row was opened: a double-click, or Enter on the focused row in grid
   * mode. Selection is "which rows do I mean"; activation is "go".
   */
  readonly rowActivate = output<StrctRow>();
  /** Emitted when the selection changes. */
  readonly selectionChange = output<StrctRow[]>();
  /** Emitted when the refresh button is clicked. */
  readonly syncChange = output<void>();
  /** Emitted when a row's action-menu item is chosen. */
  readonly rowAction = output<{ row: StrctRow; item: StrctMenuItem }>();
  /** Server-side data request (lazy mode): load this page / sort and set `rows`. */
  readonly lazyLoad = output<StrctDatagridLazyState>();
  /** An editable cell was committed (Enter / blur, or choosing in a `select`
   *  editor). The grid does not mutate rows — apply the value to your data and
   *  pass the updated array back in. */
  readonly cellEdit = output<{
    row: StrctRow;
    column: StrctDatagridColumn;
    /** The committed value as text — what a `text` editor produces. */
    value: string;
    /**
     * The same commit, typed: the number a `number` editor holds, or the
     * option's `value` a `select` editor chose. `value` stays a string so
     * handlers written against it keep working.
     */
    typedValue: unknown;
    previous: unknown;
  }>();

  // ── The feature objects, and the flat inputs they replace ───────────────
  // Each resolved signal below keeps the name the rest of the component (and
  // the template) already uses, so the object is read where the flat input
  // was. The object wins when it carries the property; otherwise the flat
  // input answers, as it did before 5.30.0.

  /**
   * Caps the grid's height in px; it scrolls inside that. Not a virtual
   * setting — a virtual grid is sized by `[virtual].viewportHeight` — which
   * is why it is not in that object (it was, in 5.30.0 – 5.32.0, and an
   * object there turns virtual scrolling on: a grouped grid given a height
   * cap silently lost its groups).
   */
  readonly maxHeight = input<number | null>(null);

  /** How rows are picked — replaces six flat inputs. */
  readonly selectionCfg = input<StrctDatagridSelection>({}, { alias: 'selection' });
  /** The detail pane — replaces three. `[pane]` on its own turns it on. */
  readonly paneFlat = input<boolean | StrctDatagridPane, boolean | '' | StrctDatagridPane>(false, {
    alias: 'pane',
    transform: objectOrBoolean,
  });
  protected readonly paneCfg = computed<StrctDatagridPane>(() => {
    const v = this.paneFlat();
    return typeof v === 'boolean' ? (v ? { enabled: true } : {}) : { enabled: true, ...v };
  });
  /** How rows are paged. Takes the mode on its own, as before, or the object. */
  readonly pagingFlat = input<'pages' | 'more' | StrctDatagridPaging>('pages', {
    alias: 'paging',
  });
  protected readonly pagingCfg = computed<StrctDatagridPaging>(() => {
    const v = this.pagingFlat();
    return typeof v === 'string' ? { mode: v } : v;
  });
  /** Numbered pages or a "load more" footer. */
  readonly paging = computed(() => this.pagingCfg().mode ?? 'pages');
  /** Virtual scrolling. Takes the flag on its own, as before, or the object. */
  readonly virtualFlat = input<boolean | StrctDatagridVirtual, boolean | '' | StrctDatagridVirtual>(
    false,
    { alias: 'virtual', transform: objectOrBoolean },
  );
  protected readonly virtualCfg = computed<StrctDatagridVirtual>(() => {
    const v = this.virtualFlat();
    return typeof v === 'boolean' ? (v ? { enabled: true } : {}) : { enabled: true, ...v };
  });
  /** Whether the grid renders only the rows in view. */
  readonly virtual = computed(() => this.virtualCfg().enabled ?? false);
  /** How rows are grouped — replaces four flat inputs. */
  readonly groupingCfg = input<StrctDatagridGrouping>({}, { alias: 'grouping' });
  /** The quick filter — replaces three flat inputs. */
  readonly filteringCfg = input<StrctDatagridFiltering>({}, { alias: 'filtering' });
  /** Remembered state — replaces `stateKey` and `sync`. */
  readonly stateCfg = input<StrctDatagridState>({}, { alias: 'state' });

  /**
   * The flat inputs this grid is actually given, with the object each has
   * moved into. "Given" is read as "not its default", which is what a
   * template can be checked against from inside the component.
   */
  private readonly flatInputsInUse: readonly [string, () => boolean, string][] = [
    ['pageSize', () => this.pageSizeFlat() !== 0, '[paging].pageSize'],
    ['selectable', () => this.selectableFlat(), '[selection].enabled'],
    ['detailPane', () => this.detailPaneFlat(), '[pane].enabled'],
    ['paneListWidth', () => this.paneListWidthFlat() !== '260px', '[pane].listWidth'],
    ['paneTakeoverWidth', () => this.paneTakeoverWidthFlat() !== 900, '[pane].takeoverWidth'],
    ['sync', () => this.syncFlat(), '[state].sync'],
    ['selectionMode', () => this.selectionModeFlat() !== 'none', '[selection].mode'],
    ['rowSelectable', () => this.rowSelectableFlat() !== null, '[selection].rowSelectable'],
    ['hasMore', () => this.hasMoreFlat(), '[paging].hasMore'],
    ['loadingMore', () => this.loadingMoreFlat(), '[paging].loadingMore'],
    ['moreTotal', () => this.moreTotalFlat() !== null, '[paging].moreTotal'],
    ['groupSelect', () => this.groupSelectFlat(), '[selection].groupSelect'],
    ['initialSelection', () => this.initialSelectionFlat() !== null, '[selection].initial'],
    ['viewportHeight', () => this.viewportHeightFlat() !== 360, '[virtual].viewportHeight'],
    ['rowHeight', () => this.rowHeightFlat() !== 38, '[virtual].rowHeight'],
    ['lazy', () => this.lazyFlat(), '[paging].lazy'],
    ['total', () => this.totalFlat() !== null, '[paging].total'],
    ['stateKey', () => this.stateKeyFlat() !== null, '[state].key'],
    ['groupBy', () => this.groupByFlat() !== null, '[grouping].by'],
    ['groups', () => this.groupsFlat() !== null, '[grouping].groups'],
    ['showEmptyGroups', () => this.showEmptyGroupsFlat(), '[grouping].showEmpty'],
    ['quickFilterFields', () => this.quickFilterFieldsFlat() !== null, '[filtering].fields'],
    ['quickFilterable', () => this.quickFilterableFlat(), '[filtering].quick'],
    ['quickFilterAlign', () => this.quickFilterAlignFlat() !== 'end', '[filtering].align'],
    ['childrenKey', () => this.childrenKeyFlat() !== null, '[grouping].childrenKey'],
    ['selectionColumn', () => this.selectionColumnFlat() !== 'auto', '[selection].column'],
  ];

  /**
   * Dev mode says, once per app run, which flat inputs have moved — a
   * console line per name would be a wall in a screen with four grids, so
   * the names are collected and reported together.
   */
  private reportFlatInputs(): void {
    const fresh = this.flatInputsInUse
      .filter(([name, given]) => given() && !warnedFlatInputs.has(name))
      .map(([name, , to]) => {
        warnedFlatInputs.add(name);
        return `  ${name} → ${to}`;
      });
    if (!fresh.length) return;
    for (const line of fresh) pendingFlatInputWarnings.add(line);
    if (flatInputWarningQueued) return;
    flatInputWarningQueued = true;
    setTimeout(() => {
      flatInputWarningQueued = false;
      const lines = [...pendingFlatInputWarnings].sort();
      pendingFlatInputWarnings.clear();
      console.warn(
        `[strct-datagrid] ${lines.length} input(s) have moved into a feature ` +
          `object and are removed in 6.0. They keep working through 5.x:\n` +
          lines.join('\n') +
          `\nThe objects are [selection], [paging], [pane], [virtual], ` +
          `[grouping], [filtering] and [state]; two-way state ` +
          `(selectedIds, filters, columnState, …) stays where it is.`,
      );
    });
  }

  /** `[paging].pageSize` when it is set, else the flat `pageSize` (deprecated). */
  readonly pageSize = computed(() => this.pagingCfg().pageSize ?? this.pageSizeFlat());
  /** `[selection].enabled` when it is set, else the flat `selectable` (deprecated). */
  readonly selectable = computed(() => this.selectionCfg().enabled ?? this.selectableFlat());
  /** `[pane].enabled` when it is set, else the flat `detailPane` (deprecated). */
  readonly detailPane = computed(() => this.paneCfg().enabled ?? this.detailPaneFlat());
  /** `[pane].listWidth` when it is set, else the flat `paneListWidth` (deprecated). */
  readonly paneListWidth = computed(() => this.paneCfg().listWidth ?? this.paneListWidthFlat());
  /** `[pane].takeoverWidth` when it is set, else the flat `paneTakeoverWidth` (deprecated). */
  readonly paneTakeoverWidth = computed(
    () => this.paneCfg().takeoverWidth ?? this.paneTakeoverWidthFlat(),
  );
  /** `[state].sync` when it is set, else the flat `sync` (deprecated). */
  readonly sync = computed(() => this.stateCfg().sync ?? this.syncFlat());
  /** `[selection].mode` when it is set, else the flat `selectionMode` (deprecated). */
  readonly selectionMode = computed(() => this.selectionCfg().mode ?? this.selectionModeFlat());
  /** `[selection].rowSelectable` when it is set, else the flat `rowSelectable` (deprecated). */
  readonly rowSelectable = computed(
    () => this.selectionCfg().rowSelectable ?? this.rowSelectableFlat(),
  );
  /** `[paging].hasMore` when it is set, else the flat `hasMore` (deprecated). */
  readonly hasMore = computed(() => this.pagingCfg().hasMore ?? this.hasMoreFlat());
  /** `[paging].loadingMore` when it is set, else the flat `loadingMore` (deprecated). */
  readonly loadingMore = computed(() => this.pagingCfg().loadingMore ?? this.loadingMoreFlat());
  /** `[paging].moreTotal` when it is set, else the flat `moreTotal` (deprecated). */
  readonly moreTotal = computed(() => this.pagingCfg().moreTotal ?? this.moreTotalFlat());
  /** `[selection].groupSelect` when it is set, else the flat `groupSelect` (deprecated). */
  readonly groupSelect = computed(() => this.selectionCfg().groupSelect ?? this.groupSelectFlat());
  /** `[selection].initial` when it is set, else the flat `initialSelection` (deprecated). */
  readonly initialSelection = computed(
    () => this.selectionCfg().initial ?? this.initialSelectionFlat(),
  );
  /** `[virtual].viewportHeight` when it is set, else the flat `viewportHeight` (deprecated). */
  readonly viewportHeight = computed(
    () => this.virtualCfg().viewportHeight ?? this.viewportHeightFlat(),
  );

  /** `[virtual].rowHeight` when it is set, else the flat `rowHeight` (deprecated). */
  readonly rowHeight = computed(() => this.virtualCfg().rowHeight ?? this.rowHeightFlat());
  /** `[paging].lazy` when it is set, else the flat `lazy` (deprecated). */
  readonly lazy = computed(() => this.pagingCfg().lazy ?? this.lazyFlat());
  /** `[paging].total` when it is set, else the flat `total` (deprecated). */
  readonly total = computed(() => this.pagingCfg().total ?? this.totalFlat());
  /** `[state].key` when it is set, else the flat `stateKey` (deprecated). */
  readonly stateKey = computed(() => this.stateCfg().key ?? this.stateKeyFlat());
  /** `[grouping].by` when it is set, else the flat `groupBy` (deprecated). */
  readonly groupBy = computed(() => this.groupingCfg().by ?? this.groupByFlat());
  /** `[grouping].groups` when it is set, else the flat `groups` (deprecated). */
  readonly groups = computed(() => this.groupingCfg().groups ?? this.groupsFlat());
  /** `[grouping].showEmpty` when it is set, else the flat `showEmptyGroups` (deprecated). */
  readonly showEmptyGroups = computed(
    () => this.groupingCfg().showEmpty ?? this.showEmptyGroupsFlat(),
  );
  /** `[filtering].fields` when it is set, else the flat `quickFilterFields` (deprecated). */
  readonly quickFilterFields = computed(
    () => this.filteringCfg().fields ?? this.quickFilterFieldsFlat(),
  );
  /** `[filtering].quick` when it is set, else the flat `quickFilterable` (deprecated). */
  readonly quickFilterable = computed(
    () => this.filteringCfg().quick ?? this.quickFilterableFlat(),
  );
  /** `[filtering].align` when it is set, else the flat `quickFilterAlign` (deprecated). */
  readonly quickFilterAlign = computed(
    () => this.filteringCfg().align ?? this.quickFilterAlignFlat(),
  );
  /** `[grouping].childrenKey` when it is set, else the flat `childrenKey` (deprecated). */
  readonly childrenKey = computed(() => this.groupingCfg().childrenKey ?? this.childrenKeyFlat());
  /** `[selection].column` when it is set, else the flat `selectionColumn` (deprecated). */
  readonly selectionColumn = computed(
    () => this.selectionCfg().column ?? this.selectionColumnFlat(),
  );

  private readonly menu = inject(StrctMenuService);

  protected readonly detailDef = contentChild(StrctRowDetailDef);
  /** An `<ng-template strctGroupHeader let-group let-count="count">`. */
  protected readonly groupHeaderDef = contentChild(StrctGroupHeaderDef);
  protected readonly paneTitleDef = contentChild(StrctDetailPaneTitle);
  protected readonly actionBarDef = contentChild(StrctDatagridActionBar);
  /** A read-only grid with a note needed an empty action bar to show it. */
  protected readonly actionBarCaptionDef = contentChild(StrctDatagridActionBarCaption);
  private readonly cellDefs = contentChildren(StrctCellDef);
  private readonly cellMap = computed(() => {
    const m = new Map<string, TemplateRef<StrctCellContext>>();
    for (const d of this.cellDefs()) m.set(d.key(), d.template);
    return m;
  });

  readonly page = signal(1);
  /** What the polite region is saying right now; '' until something happens. */
  protected readonly announcement = signal('');
  /** The first filtered() run is the initial render, which announces nothing. */
  private filterSettled = false;
  private readonly sort = signal<{ key: string | null; dir: SortDir }>({ key: null, dir: 'asc' });
  /** Selection / expansion are tracked by row id (see {@link rowId}). */
  private readonly selected = signal<Set<unknown>>(new Set());
  protected readonly selectedCount = computed(() => this.selected().size);
  private readonly expandedRows = signal<Set<unknown>>(new Set());
  protected readonly columnWidths = signal<Map<string, number>>(new Map());
  protected readonly hiddenColumns = signal<Set<string>>(new Set());
  protected readonly chooserOpen = signal(false);
  private resizeState: { key: string; startX: number; startWidth: number } | null = null;
  private readonly onMove = (e: MouseEvent) => this.onResizeMove(e);
  private readonly onUp = () => this.onResizeEnd();

  colWidth(key: string): string | null {
    const px = this.columnWidths().get(key);
    return px != null ? `${px}px` : null;
  }

  /**
   * A focusable separator owes ARIA a value, and a column that has never been
   * resized has no stored width — so the header's real width is swept after
   * render and whenever the grid resizes. Without it every handle was an
   * `aria-required-attr` violation (12 of them on the showcase's own page).
   */
  private readonly measuredWidths = signal<Map<string, number>>(new Map());

  protected separatorValue(key: string): number | null {
    return this.columnWidths().get(key) ?? this.measuredWidths().get(key) ?? null;
  }

  private sweepHeaderWidths(): void {
    if (!this.resizable()) return;
    const next = new Map<string, number>();
    for (const th of this.hostRef.nativeElement.querySelectorAll<HTMLElement>(
      'thead th[data-col]',
    )) {
      const key = th.dataset['col'];
      if (key) next.set(key, Math.round(th.offsetWidth));
    }
    const current = this.measuredWidths();
    if (next.size === current.size && [...next].every(([k, v]) => current.get(k) === v)) return;
    this.measuredWidths.set(next);
  }

  /**
   * The keyboard half of a resize: the arrows step 16px (4px with Shift for a
   * fine adjustment), Home gives the column back its natural width. Steps are
   * the only way a separator can be moved without a pointer.
   */
  protected onResizeKey(event: KeyboardEvent, key: string): void {
    const step = event.shiftKey ? 4 : 16;
    const th = (event.target as HTMLElement).closest('th');
    const current = this.columnWidths().get(key) ?? th?.offsetWidth ?? 160;
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = current + step;
    else if (event.key === 'ArrowLeft') next = current - step;
    else if (event.key === 'Home') next = null;
    else return;
    event.preventDefault();
    if (next === null) this.resetWidth(key);
    else this.setColumnWidth(key, Math.max(40, next));
  }

  /** Give the column back the width the content asks for. */
  protected resetWidth(key: string): void {
    this.columnWidths.update((m) => {
      const next = new Map(m);
      next.delete(key);
      return next;
    });
  }

  private setColumnWidth(key: string, px: number): void {
    this.columnWidths.update((m) => new Map(m).set(key, px));
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

  protected readonly activeRow = computed(() => {
    const id = this.activeRowId();
    if (id == null) return null;
    return this.rows().find((r) => this.idOf(r) === id) ?? null;
  });

  /**
   * Whether the container is too narrow to show the list and the pane at once.
   * It is the grid's own width that decides, not the viewport: the same grid
   * is wide in a page and narrow in a drawer.
   */
  protected readonly narrowPane = signal(false);

  protected readonly canExpand = computed(
    () => this.expandable() && !this.detailPane() && !!this.detailDef(),
  );
  protected readonly canDetail = computed(() => this.detailPane() && !!this.detailDef());
  protected readonly paneOpen = computed(
    () => this.detailPane() && !!this.detailDef() && !!this.activeRow(),
  );
  /** Whether to render the trailing row-actions (kebab) column. */
  protected readonly canActions = computed(() => !!this.rowActions() && !this.paneOpen());
  /** User-chosen column order (keys); unknown keys keep declared positions. */
  private readonly columnOrder = signal<string[] | null>(null);
  /** Declared columns re-arranged by the user's drag order. */
  private readonly orderedColumns = computed(() => {
    const cols = this.columns();
    const order = this.columnOrder();
    if (!order?.length) return cols;
    const byKey = new Map(cols.map((c) => [c.key, c]));
    const out: StrctDatagridColumn[] = [];
    for (const key of order) {
      const c = byKey.get(key);
      if (c) {
        out.push(c);
        byKey.delete(key);
      }
    }
    for (const c of cols) if (byKey.has(c.key)) out.push(c);
    return out;
  });
  /** Only the first column is shown while the detail pane is open. */
  protected readonly visibleColumns = computed(() => {
    const hidden = this.hiddenColumns();
    const shown = this.orderedColumns().filter((c) => !hidden.has(c.key));
    if (!this.paneOpen()) return shown;
    // A results list keeps its status and its name while the pane is open;
    // one 260px column cut the name in half and hid the status. Columns that
    // ask to stay, stay; otherwise the first one, as before.
    const kept = shown.filter((c) => c.keepInPane);
    return kept.length ? kept : shown.slice(0, 1);
  });

  // ── Column drag-reorder ────────────────────────────────────────
  protected readonly dragKey = signal<string | null>(null);
  protected readonly dropKey = signal<string | null>(null);
  protected onColDragStart(key: string, event: DragEvent): void {
    // Text selection inside the filter panel must not start a column drag.
    if ((event.target as HTMLElement | null)?.closest?.('.strct-dg__filterpanel')) {
      event.preventDefault();
      return;
    }
    if (!this.reorderable()) return;
    this.dragKey.set(key);
    event.dataTransfer?.setData('text/plain', key);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }
  protected onColDragOver(key: string, event: DragEvent): void {
    if (!this.reorderable() || !this.dragKey() || key === this.dragKey()) return;
    event.preventDefault();
    this.dropKey.set(key);
  }
  protected onColDrop(key: string): void {
    const from = this.dragKey();
    this.dragKey.set(null);
    this.dropKey.set(null);
    if (!from || from === key) return;
    const keys = this.orderedColumns().map((c) => c.key);
    const fromIdx = keys.indexOf(from);
    const toIdx = keys.indexOf(key);
    if (fromIdx < 0 || toIdx < 0) return;
    keys.splice(toIdx, 0, ...keys.splice(fromIdx, 1));
    this.columnOrder.set(keys);
  }
  protected onColDragEnd(): void {
    this.dragKey.set(null);
    this.dropKey.set(null);
  }

  // ── Row grouping ───────────────────────────────────────────────
  /** The folded groups as a set, from the two-way `collapsedGroups`. */
  private readonly collapsedSet = computed(() => new Set(this.collapsedGroups()));
  /** Collapse / expand one group header. */
  toggleGroup(key: unknown): void {
    const next = new Set(this.collapsedGroups());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.collapsedGroups.set([...next]);
  }
  /** What tbody renders: plain (virtual/paged) rows, or groups + their rows. */
  protected readonly displayItems = computed<DgItem[]>(() => {
    const g = this.groupBy();
    if (g && this.virtual() && typeof ngDevMode !== 'undefined' && ngDevMode) {
      // Grouping and virtual scrolling cannot both be honoured: the window is
      // computed over rows, and a group header is not one. The grid drops the
      // grouping, which it used to do without a word — and a grid that lost
      // its groups to a height cap is how that was found.
      strctDevWarn(
        'dg-group-virtual',
        '[strct] strct-datagrid: [grouping] is ignored while virtual scrolling is on, ' +
          'so the rows render ungrouped. Turn one of them off — and note that any ' +
          '[virtual] object turns virtual scrolling on.',
      );
    }
    if (!g || this.virtual()) return this.renderRows().map((row) => ({ row }));
    const map = new Map<unknown, StrctRow[]>();
    for (const row of this.sorted()) {
      const key = row[g];
      const bucket = map.get(key);
      if (bucket) bucket.push(row);
      else map.set(key, [row]);
    }
    // Declared groups come first, in the order they were given: a triage page
    // orders by urgency, not alphabetically. Values nobody declared follow, in
    // the order the rows arrived — today's behaviour.
    const declared = this.groups() ?? [];
    const byValue = new Map(declared.map((d) => [d.value, d]));
    const order: unknown[] = [
      ...declared.map((d) => d.value),
      ...[...map.keys()].filter((k) => !byValue.has(k)),
    ];
    const collapsedSet = this.collapsedSet();
    const out: DgItem[] = [];
    for (const key of order) {
      const rows = map.get(key) ?? [];
      const def = byValue.get(key);
      // A declared group with nothing in it is dropped unless it is asked for.
      if (!rows.length && (!def || !this.showEmptyGroups())) continue;
      const collapsed = collapsedSet.has(key);
      out.push({
        group: {
          key,
          label: def?.label ?? String(key ?? '—'),
          count: def?.count ?? rows.length,
          collapsed,
          status: def?.status,
          note: def?.note,
        },
      });
      if (!collapsed) for (const row of rows) out.push({ row });
    }
    return out;
  });
  protected itemKey(it: DgItem): unknown {
    return it.group ? `strct-group:${String(it.group.key)}` : this.rowKey(it.row!);
  }

  // ── Column filter popover ──────────────────────────────────────
  protected readonly filterOpenKey = signal<string | null>(null);
  /** The filter button that opened the panel — focus returns here on close. */
  private filterTrigger: HTMLElement | null = null;
  protected toggleFilterPanel(key: string, event: Event): void {
    event.stopPropagation();
    const opening = this.filterOpenKey() !== key;
    this.filterOpenKey.set(opening ? key : null);
    if (opening) {
      this.filterTrigger = event.currentTarget as HTMLElement;
      // Move focus into the panel once it has rendered.
      setTimeout(() => {
        const panel =
          this.hostRef.nativeElement.querySelector<HTMLElement>('.strct-dg__filterpanel');
        if (panel) focusFirstIn(panel);
      });
    } else {
      this.filterTrigger = null;
    }
  }
  private closeFilterPanel(restore = false): void {
    if (!this.filterOpenKey()) return;
    this.filterOpenKey.set(null);
    if (restore) restoreFocus(this.filterTrigger);
    this.filterTrigger = null;
  }
  protected hasFilter(key: string): boolean {
    const v = this.filters()[key];
    return Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== '';
  }
  protected textFilter(key: string): string {
    const v = this.filters()[key];
    return typeof v === 'string' ? v : '';
  }
  protected setTextFilter(key: string, value: string): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }
  protected optionChecked(key: string, opt: unknown): boolean {
    const v = this.filters()[key];
    return Array.isArray(v) && v.includes(opt);
  }
  protected toggleFilterOption(key: string, opt: unknown): void {
    this.filters.update((f) => {
      const cur = Array.isArray(f[key]) ? [...(f[key] as unknown[])] : [];
      const i = cur.indexOf(opt);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(opt);
      return { ...f, [key]: cur };
    });
  }
  /**
   * The escape every bulk workflow needs: the header tick selects the page,
   * and nothing says the other pages exist. Offered only when the grid holds
   * the rows — in `lazy` mode it cannot name rows the server has not sent,
   * and selecting them would be a lie.
   */
  protected readonly bulkHint = computed<{ text: string; action: string; run: () => void } | null>(
    () => {
      if (this.mode() !== 'multiple' || this.lazy()) return null;
      const all = this.filteredRows();
      const page = this.selectionRows();
      if (!page.length || all.length <= page.length) return null;
      const l = this.L();
      const selected = this.selected();
      const everything = all.every((r) => selected.has(this.idOf(r)));
      if (everything) {
        return {
          text: l.allSelected(all.length),
          action: l.clearSelection,
          run: () => this.clearSelection(),
        };
      }
      if (!this.allPageSelected()) return null;
      return {
        text: l.pageSelected(page.length),
        action: l.selectAllCount(all.length),
        run: () => this.selectAllFiltered(),
      };
    },
  );

  /** Select every row the filter allows, not only the page. */
  selectAllFiltered(): void {
    const next = new Set(this.selected());
    for (const row of this.filteredRows()) {
      if (this.lockedReason(row) === null) next.add(this.idOf(row));
    }
    this.commitSelection(next);
  }

  /** Rows exist, but nothing the filter allows — the undoable empty. */
  protected readonly filteredAway = computed(
    () => this.rows().length > 0 && this.anyFilter() && this.filteredRows().length === 0,
  );

  protected readonly anyFilter = computed(
    () => this.quickFilter().trim().length > 0 || Object.keys(this.filters()).length > 0,
  );

  protected noMatchesDescription(): string {
    const q = this.quickFilter().trim();
    return q ? this.L().noMatchesFor(q) : '';
  }

  /** The way back out of the filtered empty state. */
  protected clearAllFilters(): void {
    this.quickFilter.set('');
    this.filters.set({});
  }

  protected clearFilter(key: string): void {
    this.filters.update((f) => {
      const next = { ...f };
      delete next[key];
      return next;
    });
  }
  @HostListener('document:click', ['$event'])
  protected onDocClickOverlays(event: MouseEvent): void {
    const t = event.target as HTMLElement;
    if (
      this.filterOpenKey() &&
      !t.closest('.strct-dg__filterpanel') &&
      !t.closest('.strct-dg__filterbtn')
    ) {
      this.closeFilterPanel();
    }
    if (this.chooserOpen() && !t.closest('.strct-dg__chooser-menu')) this.closeChooser();
  }
  /** Escape closes the topmost transient surface and hands focus back to its
   *  trigger; stopPropagation keeps a host modal / drawer from also closing. */
  @HostListener('document:keydown.escape', ['$event'])
  protected onEscapeOverlays(event: Event): void {
    if (this.filterOpenKey()) {
      event.stopPropagation();
      this.closeFilterPanel(true);
    } else if (this.chooserOpen()) {
      event.stopPropagation();
      this.closeChooser(true);
    } else if (this.paneOpen()) {
      event.stopPropagation();
      this.closePane();
    }
  }

  // ── Tree-grid state ────────────────────────────────────────────
  private readonly expandedTree = signal<Set<unknown>>(new Set());
  protected treeDepth(row: StrctRow): number {
    return this.treeFlat().meta.get(this.rowKey(row))?.depth ?? 0;
  }
  protected treeHasChildren(row: StrctRow): boolean {
    return this.treeFlat().meta.get(this.rowKey(row))?.hasChildren ?? false;
  }
  protected treeExpanded(row: StrctRow): boolean {
    return this.treeFlat().meta.get(this.rowKey(row))?.expanded ?? false;
  }
  /** Expand / collapse one tree row. */
  toggleTreeRow(row: StrctRow): void {
    const key = this.rowKey(row);
    const next = new Set(this.expandedTree());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.expandedTree.set(next);
  }

  /**
   * Treegrid keyboard contract (row-level core; there is deliberately no
   * cell-level navigation — Tab still walks the interactive elements inside
   * each row): ↑/↓ move focus between rows via a roving tabindex, → expands
   * a collapsed parent row, ← collapses an expanded one.
   */
  /** Roving-tabindex target (row key); defaults to the first rendered row. */
  private readonly activeTreeRow = signal<unknown>(null);

  protected treeRowTabindex(row: StrctRow): number {
    const rows = this.renderRows();
    if (!rows.length) return -1;
    const active = this.activeTreeRow();
    const current =
      active != null && rows.some((r) => this.rowKey(r) === active) ? active : this.rowKey(rows[0]);
    return current === this.rowKey(row) ? 0 : -1;
  }

  protected onTreeRowKeydown(row: StrctRow, event: KeyboardEvent): void {
    // Text inputs (cell editing, the selection checkbox) own their arrow keys.
    if ((event.target as HTMLElement | null)?.tagName === 'INPUT') return;
    const rows = this.renderRows();
    const idx = rows.indexOf(row);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusTreeRow(idx + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusTreeRow(idx - 1);
        break;
      case 'ArrowRight':
        if (this.treeHasChildren(row) && !this.treeExpanded(row)) {
          event.preventDefault();
          this.toggleTreeRow(row);
        }
        break;
      case 'ArrowLeft':
        if (this.treeHasChildren(row) && this.treeExpanded(row)) {
          event.preventDefault();
          this.toggleTreeRow(row);
        }
        break;
    }
  }

  // ── The grid interaction model (opt-in) ────────────────────────
  // APG's grid, at row level: the grid is one tab stop, the cursor row carries
  // it, the arrows move inside. Cell-level navigation is deliberately not here
  // — a console grid's cells are text, and its controls live at the row's
  // edges, so →/← step through those instead.

  /** The row the grid's single tab stop is on. */
  private readonly cursorRow = signal<unknown>(null);

  protected gridRowTabindex(row: StrctRow): number {
    const rows = this.renderRows();
    if (!rows.length) return -1;
    const cursor = this.cursorRow();
    const current =
      cursor != null && rows.some((r) => this.rowKey(r) === cursor) ? cursor : this.rowKey(rows[0]);
    return current === this.rowKey(row) ? 0 : -1;
  }

  /** The focused row's own controls, in the order the arrows visit them. */
  private rowControls(rowEl: HTMLElement): HTMLElement[] {
    return [
      ...rowEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not(tr)',
      ),
    ].filter((el) => el.tagName !== 'TR');
  }

  protected onGridRowKeydown(row: StrctRow, event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const rowEl = (target?.closest('tr') ?? null) as HTMLElement | null;
    const onRow = target?.tagName === 'TR';
    // A text field inside a cell keeps every key it understands.
    if (target instanceof HTMLInputElement && target.type === 'text') return;
    const rows = this.renderRows();
    const idx = rows.indexOf(row);

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!onRow) return;
        const next = idx + (event.key === 'ArrowDown' ? 1 : -1);
        if (next < 0 || next >= rows.length) return;
        event.preventDefault();
        if (this.paneOpen()) this.activeRowId.set(this.idOf(rows[next]));
        this.focusGridRow(next);
        break;
      }
      case 'Home':
      case 'End': {
        if (!onRow) return;
        event.preventDefault();
        this.focusGridRow(event.key === 'Home' ? 0 : rows.length - 1);
        break;
      }
      case 'ArrowRight':
      case 'ArrowLeft': {
        if (!rowEl) return;
        const controls = this.rowControls(rowEl);
        if (!controls.length) return;
        event.preventDefault();
        const at = controls.indexOf(target as HTMLElement);
        const step = event.key === 'ArrowRight' ? 1 : -1;
        // From the row itself the first arrow lands on the first (or last)
        // control; from a control it steps, and stepping off the start comes
        // back to the row.
        if (onRow) {
          controls[step === 1 ? 0 : controls.length - 1]?.focus();
        } else if (at + step < 0) {
          rowEl.focus();
        } else {
          controls[at + step]?.focus();
        }
        break;
      }
      case 'Escape': {
        if (!onRow && rowEl) {
          event.preventDefault();
          rowEl.focus();
          return;
        }
        if (!this.paneOpen()) return;
        event.preventDefault();
        this.closePane();
        break;
      }
      case ' ': {
        if (!onRow || this.mode() === 'none') return;
        event.preventDefault(); // Space on a row picks it, not scrolls the page
        if (this.mode() === 'single') this.selectSingle(row);
        else this.toggleRow(row);
        break;
      }
      case 'Enter': {
        if (!onRow) return;
        event.preventDefault();
        this.onRowActivate(row);
        break;
      }
    }
  }

  /** Move the cursor to the row at `idx` and focus it once it has rendered. */
  private focusGridRow(idx: number): void {
    const rows = this.renderRows();
    if (idx < 0 || idx >= rows.length) return;
    this.cursorRow.set(this.rowKey(rows[idx]));
    setTimeout(() => {
      const trs = this.hostRef.nativeElement.querySelectorAll<HTMLElement>('tbody tr[tabindex]');
      trs[idx]?.focus();
    });
  }

  /**
   * "Go": a double-click, or Enter on the focused row. It opens the detail
   * pane where there is one — a row click that shows the row is what every
   * console does — and always tells the consumer.
   */
  protected onRowActivate(row: StrctRow): void {
    if (this.lockedReason(row) !== null) return;
    if (this.canDetail()) this.openDetail(row);
    this.rowActivate.emit(row);
  }

  /** Move the roving tabindex to the row at `idx` and focus its element once
   *  the new tabindex has rendered. */
  private focusTreeRow(idx: number): void {
    const rows = this.renderRows();
    if (idx < 0 || idx >= rows.length) return;
    this.activeTreeRow.set(this.rowKey(rows[idx]));
    setTimeout(() => {
      // Only data rows carry a tabindex; their DOM order matches renderRows.
      const trs = this.hostRef.nativeElement.querySelectorAll<HTMLElement>('tbody tr[tabindex]');
      trs[idx]?.focus();
    });
  }

  // ── Inline cell editing ────────────────────────────────────────
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly editing = signal<{ rowKey: unknown; colKey: string } | null>(null);
  protected isEditingCell(row: StrctRow, col: StrctDatagridColumn): boolean {
    const e = this.editing();
    return !!e && e.rowKey === this.rowKey(row) && e.colKey === col.key;
  }
  /** The value a typed editor holds while it is open (committed on Enter / blur). */
  protected readonly editDraft = signal<unknown>(null);

  /**
   * Keyboard access to editable cells (FR-49-02). An editable cell opened only
   * on double-click, so a keyboard user could not reach one at all.
   *
   * The editable cells of a grid form one roving tab stop, as a toolbar's
   * buttons do: Tab reaches the grid, the arrow keys move between cells,
   * Enter or F2 opens the editor and Escape closes it — focus coming back to
   * the cell either way, so the next key press continues from where the user
   * was. While an editor is open, Tab commits it and opens the next cell, the
   * way a spreadsheet fills a row.
   */
  protected readonly editHintId = `strct-dg-edithint-${++datagridCounter}`;
  /** The cell that currently holds the grid's editable-cell tab stop. */
  private readonly activeEditCell = signal<{ row: StrctRow; col: StrctDatagridColumn } | null>(
    null,
  );
  private readonly editableColumns = computed(() =>
    this.visibleColumns().filter((c) => c.editable),
  );
  protected readonly hasEditableColumn = computed(() => this.editableColumns().length > 0);

  protected editCellTabindex(row: StrctRow, col: StrctDatagridColumn): number {
    const active = this.activeEditCell();
    if (active) {
      const rows = this.renderRows();
      // The active row may have paged away; fall back to the first cell.
      if (rows.some((r) => this.rowKey(r) === this.rowKey(active.row))) {
        return this.rowKey(active.row) === this.rowKey(row) && active.col.key === col.key ? 0 : -1;
      }
    }
    const first = this.renderRows()[0];
    const firstCol = this.editableColumns()[0];
    return first && firstCol && this.rowKey(first) === this.rowKey(row) && firstCol.key === col.key
      ? 0
      : -1;
  }

  protected onEditCellFocus(row: StrctRow, col: StrctDatagridColumn): void {
    this.activeEditCell.set({ row, col });
  }

  /** Every editable cell in DOM order — the order the arrows walk. */
  private editCells(): HTMLElement[] {
    return [...this.hostRef.nativeElement.querySelectorAll<HTMLElement>('td[data-edit]')];
  }

  /**
   * Move focus `delta` cells along (or `delta` rows, when `byRow`). Focusing
   * the cell runs its own focus handler, so the roving tab stop follows.
   */
  private moveEditFocus(from: HTMLElement, delta: number, byRow = false): boolean {
    const cells = this.editCells();
    const i = cells.indexOf(from);
    if (i < 0) return false;
    const step = byRow ? Math.max(1, this.editableColumns().length) : 1;
    const next = cells[i + delta * step];
    if (!next) return false;
    next.focus();
    return true;
  }

  /** Commit whatever the open editor holds, by the kind of editor it is. */
  private commitOpenEditor(row: StrctRow, col: StrctDatagridColumn, event: Event): void {
    switch (col.editor ?? 'text') {
      case 'number':
        this.commitDraft(row, col, event);
        break;
      case 'select':
        // Choosing an option already committed; leaving only closes it.
        this.cancelEdit();
        break;
      default:
        this.commitEdit(row, col, event);
    }
  }

  protected onEditCellKeydown(row: StrctRow, col: StrctDatagridColumn, event: KeyboardEvent): void {
    const cell = event.currentTarget as HTMLElement;
    if (this.isEditingCell(row, col)) {
      // Enter and Escape belong to the editor; only Tab is the grid's.
      if (event.key !== 'Tab') return;
      event.preventDefault();
      this.commitOpenEditor(row, col, event);
      if (!this.moveEditFocus(cell, event.shiftKey ? -1 : 1)) {
        cell.focus();
        return;
      }
      const next = this.activeEditCell();
      if (next) this.startEdit(next.row, next.col);
      return;
    }
    switch (event.key) {
      case 'Enter':
      case 'F2':
        event.preventDefault();
        this.startEdit(row, col);
        break;
      case 'ArrowRight':
      case 'ArrowLeft':
        if (this.moveEditFocus(cell, event.key === 'ArrowRight' ? 1 : -1)) event.preventDefault();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        if (this.moveEditFocus(cell, event.key === 'ArrowDown' ? 1 : -1, true))
          event.preventDefault();
        break;
    }
  }

  /** Put focus back on the cell an editor just left, so the keys keep working. */
  private refocusCell(from: EventTarget | null): void {
    const cell = (from as HTMLElement | null)?.closest?.('td[data-edit]') as HTMLElement | null;
    if (cell) setTimeout(() => cell.focus());
  }

  /** A column's choices, asked per row when the column gives a function. */
  protected editorOptionsFor(row: StrctRow, col: StrctDatagridColumn): StrctOption[] {
    const opts = col.editorOptions;
    return typeof opts === 'function' ? opts(row) : (opts ?? []);
  }

  protected startEdit(row: StrctRow, col: StrctDatagridColumn): void {
    this.editing.set({ rowKey: this.rowKey(row), colKey: col.key });
    this.editDraft.set(row[col.key]);
    setTimeout(() => {
      const editor = this.hostRef.nativeElement.querySelector<HTMLElement>(
        '.strct-dg__editinput, .strct-dg__editselect, .strct-dg__editnumber',
      );
      if (!editor) return;
      // The stepper buttons come first in the DOM; the value is what the user
      // came to change, so focus lands on the field itself.
      const field = editor.matches('input')
        ? editor
        : (editor.querySelector<HTMLElement>('input') ??
          editor.querySelector<HTMLElement>('button'));
      field?.focus();
      // Opening from the keyboard, the first thing typed is meant to replace
      // the value, not to be appended to it.
      if (field instanceof HTMLInputElement && field.type === 'text') field.select();
    });
  }

  protected readonly captionId = `strct-dg-caption-${++datagridCounter}`;

  /** Whether a cell has nothing to show and the column says what to show then. */
  protected isBlank(row: StrctRow, col: StrctDatagridColumn): boolean {
    if (!col.emptyText) return false;
    const v = row[col.key];
    return v === null || v === undefined || v === '';
  }

  /** A select column reads as its option's label, not as the stored value. */
  protected displayValue(row: StrctRow, col: StrctDatagridColumn): unknown {
    const raw = row[col.key];
    if (col.editor !== 'select') return raw;
    // Per-row options: this row's own choices decide what its value reads as.
    return this.editorOptionsFor(row, col).find((o) => o.value === raw)?.label ?? raw;
  }

  /** Close the editor and emit `cellEdit` when the value actually changed. */
  protected commitValue(row: StrctRow, col: StrctDatagridColumn, raw: unknown): void {
    if (!this.isEditingCell(row, col)) return;
    this.editing.set(null);
    const value = this.clampToColumn(col, raw);
    const previous = row[col.key];
    if (previous === value) return;
    this.cellEdit.emit({
      row,
      column: col,
      value: value == null ? '' : String(value),
      typedValue: value,
      previous,
    });
  }

  /** Enter / blur on a typed editor commits what it currently holds. */
  protected commitDraft(row: StrctRow, col: StrctDatagridColumn, event?: Event): void {
    event?.stopPropagation();
    this.commitValue(row, col, this.editDraft());
    if (event && event.type !== 'focusout') this.refocusCell(event.target);
  }

  /**
   * A column that declares bounds means them: Enter commits what the field
   * holds, and `strct-number` only clamps on blur, so the grid clamps here
   * rather than letting an out-of-range value reach `cellEdit`.
   */
  private clampToColumn(col: StrctDatagridColumn, value: unknown): unknown {
    if (col.editor !== 'number' || typeof value !== 'number' || !Number.isFinite(value))
      return value;
    const min = col.editorMin;
    const max = col.editorMax;
    let v = value;
    if (min != null && v < min) v = min;
    if (max != null && v > max) v = max;
    return v;
  }

  /**
   * A number editor is a field between two stepper buttons, so focus moves
   * inside it — only a move that actually leaves the editor is a blur.
   */
  protected commitOnLeave(row: StrctRow, col: StrctDatagridColumn, event: FocusEvent): void {
    const editor = event.currentTarget as HTMLElement;
    const next = event.relatedTarget;
    if (next instanceof Node && editor.contains(next)) return;
    this.commitDraft(row, col, event);
  }
  protected commitEdit(row: StrctRow, col: StrctDatagridColumn, event: Event): void {
    if (!this.isEditingCell(row, col)) return; // Escape/Enter already closed it
    const value = (event.target as HTMLInputElement).value;
    this.editing.set(null);
    if (event.type !== 'blur') this.refocusCell(event.target);
    const previous = row[col.key];
    if (String(previous ?? '') !== value)
      this.cellEdit.emit({ row, column: col, value, typedValue: value, previous });
  }
  protected cancelEdit(event?: Event): void {
    event?.stopPropagation();
    this.editing.set(null);
    if (event) this.refocusCell(event.target);
  }

  /**
   * `singleLine` reveal: hovering a cell whose content is actually clipped
   * gets the full text as a native `title`. Hover-lazy (one delegated
   * listener, zero render cost — virtual grids pay nothing for unhovered
   * cells), covers plain and `strctCell`-templated cells alike via
   * `textContent`, and self-corrects after a column resize.
   */
  protected revealIfClipped(event: Event): void {
    if (!this.singleLine()) return;
    const td = (event.target as HTMLElement | null)?.closest('td');
    if (!td) return;
    if (td.scrollWidth > td.clientWidth) {
      const full = (td.textContent ?? '').trim();
      if (full && td.getAttribute('title') !== full) td.setAttribute('title', full);
    } else {
      td.removeAttribute('title');
    }
  }

  /** Active (non-empty) filter entries. */
  private readonly activeFilters = computed(() =>
    Object.entries(this.filters()).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : String(v).trim() !== '',
    ),
  );

  private readonly quickTerm = computed(() => this.quickFilter().trim().toLowerCase());

  private matchesQuick(row: StrctRow): boolean {
    const term = this.quickTerm();
    if (!term) return true;
    const fields = this.quickFilterFields() ?? this.columns().map((c) => c.key);
    return fields.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(term),
    );
  }

  private matchesFilters(row: StrctRow): boolean {
    return (
      this.matchesQuick(row) &&
      this.activeFilters().every(([key, v]) =>
        Array.isArray(v)
          ? v.some((opt) => opt === row[key])
          : String(row[key] ?? '')
              .toLowerCase()
              .includes(String(v).trim().toLowerCase()),
      )
    );
  }

  /** Rows surviving the quick + per-column filters (client-side modes only). */
  private readonly filteredRows = computed(() => {
    if (this.lazy() || (!this.activeFilters().length && !this.quickTerm())) return this.rows();
    return this.rows().filter((r) => this.matchesFilters(r));
  });

  /** "12 / 480" — shown while any client-side filtering narrows the set. */
  protected readonly filterNote = computed(() => {
    if (this.lazy() || (!this.activeFilters().length && !this.quickTerm())) return null;
    return `${this.sorted().length} / ${this.rows().length}`;
  });

  /** Tree mode: flattened visible rows + per-row depth/children/expanded meta. */
  private readonly treeFlat = computed<{
    rows: StrctRow[];
    meta: Map<unknown, { depth: number; hasChildren: boolean; expanded: boolean }>;
  }>(() => {
    const ck = this.childrenKey()!;
    const { key, dir } = this.sort();
    const sign = dir === 'asc' ? 1 : -1;
    const sortRows = (rs: StrctRow[]) => {
      const c = [...rs];
      if (key) c.sort((a, b) => this.compareRows(a, b, key, sign));
      return c;
    };
    const filtering = this.activeFilters().length > 0 || this.quickTerm() !== '';
    const kidsOf = (r: StrctRow) => (r[ck] as StrctRow[] | undefined) ?? [];
    const survives = (r: StrctRow): boolean => this.matchesFilters(r) || kidsOf(r).some(survives);
    const meta = new Map<unknown, { depth: number; hasChildren: boolean; expanded: boolean }>();
    const rowsOut: StrctRow[] = [];
    const walk = (rs: StrctRow[], depth: number) => {
      for (const r of sortRows(rs)) {
        const kids = filtering ? kidsOf(r).filter(survives) : kidsOf(r);
        // Filtering force-expands so matches are never hidden under a fold.
        const expanded = filtering ? true : this.expandedTree().has(this.rowKey(r));
        meta.set(this.rowKey(r), { depth, hasChildren: kids.length > 0, expanded });
        rowsOut.push(r);
        if (kids.length && expanded) walk(kids, depth + 1);
      }
    };
    walk(filtering ? this.rows().filter(survives) : this.rows(), 0);
    return { rows: rowsOut, meta };
  });

  protected readonly sorted = computed(() => {
    // Server-side mode: rows arrive already ordered / sliced — never touch them.
    if (this.lazy()) return this.rows();
    if (this.childrenKey()) return this.treeFlat().rows;
    const { key, dir } = this.sort();
    const data = [...this.filteredRows()];
    if (!key) return data;
    const sign = dir === 'asc' ? 1 : -1;
    return data.sort((a, b) => this.compareRows(a, b, key, sign));
  });

  protected readonly paged = computed(() => {
    const size = this.pageSize();
    // A cursor feed accumulates: slicing it by pageSize would hide every row
    // past the first page behind a pager that "more" does not draw.
    if (this.lazy() || size <= 0 || this.paging() === 'more') return this.sorted();
    const start = (this.page() - 1) * size;
    return this.sorted().slice(start, start + size);
  });

  /**
   * The footer exists for the count, the column chooser, the sync button and
   * whichever pager applies — `paging="more"` used to replace all of it, and a
   * chooser on a grid with no pager had nowhere to live.
   */
  protected readonly showFooter = computed(
    () =>
      !this.loading() &&
      (this.paging() === 'more' ||
        this.pageSize() > 0 ||
        this.virtual() ||
        this.columnChooser() ||
        this.sync() ||
        // "3 selected" is something to say, and a grid with no pager had
        // nowhere to say it: two member pickers went `virtual` for the count.
        (this.mode() !== 'single' && this.selectedCount() > 0)),
  );

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
  /**
   * A virtual grid draws 23 rows of 20.000 and, without these, says it has
   * 23. The count includes the header row, as the ARIA spec asks.
   */
  protected readonly ariaRowCount = computed(() => {
    if (!this.virtual() && !this.lazy()) return null;
    const total = this.lazy() ? (this.total() ?? this.rows().length) : this.sorted().length;
    return total + 1;
  });

  /**
   * The grid's own noun for a count, singular for one — what the footer
   * already says, used where a bare number would be read alone (FR-59-01).
   */
  protected countNoun(count: number): string {
    const l = this.L();
    return count === 1 ? l.row : l.rows;
  }

  /** 1 is the header row, so data rows start at 2. */
  protected ariaRowIndex(row: StrctRow): number | null {
    if (this.ariaRowCount() === null) return null;
    const offset = this.virtual() ? this.vRange().start : 0;
    const at = this.renderRows().indexOf(row);
    return at < 0 ? null : offset + at + 2;
  }

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
      (this.hasSelectionColumn() ? UTIL_W.sel : 0),
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

  /** The rows the select-all checkbox operates on: what the user can actually
   *  see — the current page, or every row under the expanded groups (group
   *  mode bypasses paging, so `paged()` would silently under-select). */
  private readonly selectionRows = computed(() => {
    if (this.groupBy() && !this.virtual()) {
      return this.displayItems().flatMap((it) => (it.row ? [it.row] : []));
    }
    return this.paged();
  });

  protected readonly allPageSelected = computed(() => {
    const rows = this.selectionRows();
    return rows.length > 0 && rows.every((r) => this.selected().has(this.idOf(r)));
  });
  protected readonly somePageSelected = computed(
    () =>
      !this.allPageSelected() &&
      this.selectionRows().some((r) => this.selected().has(this.idOf(r))),
  );

  /** Dev-mode check that row identities can do their job (see util/dev-warn). */
  private diagnoseIdentity(
    rowId: StrctRowId | null,
    rows: readonly StrctRow[],
    init: readonly unknown[] | null,
    lazy: boolean,
  ): void {
    if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) return;
    if (rows.length === 0) return;
    const label =
      rowId == null ? '' : typeof rowId === 'function' ? 'rowId (function)' : `rowId="${rowId}"`;

    if (rowId != null) {
      const seen = new Set<unknown>();
      const dupes = new Set<unknown>();
      let unresolved = 0;
      for (const r of rows) {
        const raw = typeof rowId === 'function' ? rowId(r) : r[rowId];
        if (raw == null) unresolved++;
        else if (seen.has(raw)) dupes.add(raw);
        else seen.add(raw);
      }
      if (dupes.size > 0) {
        const sample = [...dupes]
          .slice(0, 3)
          .map((v) => JSON.stringify(v))
          .join(', ');
        strctDevWarn(
          `datagrid:dupe:${label}`,
          `[strct-datagrid] ${label} resolves to the same value for more than one row ` +
            `(${sample}). Selection and expansion key on this value, so those rows ` +
            `will behave as one. Give each row a distinct value, or drop rowId to key ` +
            `on the row object.`,
        );
      }
      if (unresolved > 0) {
        strctDevWarn(
          `datagrid:unresolved:${label}`,
          `[strct-datagrid] ${label} does not resolve for ${unresolved} of ${rows.length} ` +
            `rows. Those rows fall back to object identity, so their selection and ` +
            `expansion will not survive a data refresh. Check the field name, or give ` +
            `every row a value.`,
        );
      }
    }

    // Lazy mode seeds ids for rows on other pages, so a miss there is normal.
    if (!lazy && init && init.length > 0) {
      const ids = new Set(rows.map((r) => this.idOf(r)));
      if (!init.some((v) => ids.has(v))) {
        strctDevWarn(
          `datagrid:init:${label}`,
          `[strct-datagrid] initialSelection has ${init.length} value(s), none of which ` +
            (rowId == null
              ? `is one of the rows — with no rowId, the values must be the row objects themselves. `
              : `matches any row's ${label}. `) +
            `The pre-selection will be empty.`,
        );
      }
    }
  }

  /** `selectionMode` wins; `selectable` is the pre-4.8 spelling of 'multiple'. */
  protected readonly mode = computed<'none' | 'multiple' | 'single'>(() => {
    const explicit = this.selectionMode();
    if (explicit !== 'none') return explicit;
    return this.selectable() ? 'multiple' : 'none';
  });
  protected readonly hasSelectionColumn = computed(
    () => this.mode() !== 'none' && this.selectionColumn() !== 'none',
  );
  /** The grid interaction model, opt-in. */
  protected readonly gridMode = computed(() => this.interactionMode() === 'grid');
  /**
   * In grid mode the row is the tab stop and its controls are reached with the
   * arrows, so they leave the tab order; in table mode nothing changes.
   */
  protected ctlTabindex(): number | null {
    return this.gridMode() ? -1 : null;
  }
  /** One radio group per grid instance. */
  protected readonly radioName = `strct-dg-pick-${++datagridCounter}`;

  /**
   * Why a row cannot be picked: `null` when it can, `''` when it cannot with no
   * reason given, or the reason. A locked row keeps its normal colours — a
   * locked candidate is still worth reading — and stays reachable, so the
   * reason can be read.
   */
  lockedReason(row: StrctRow): string | null {
    const fn = this.rowSelectable();
    if (!fn) return null;
    const verdict = fn(row);
    if (verdict === true) return null;
    return typeof verdict === 'string' ? verdict : '';
  }

  /** Click anywhere on the row picks it, in single mode only. */
  protected onRowPick(row: StrctRow): void {
    if (this.gridMode()) {
      // The cursor follows the pointer, or Tab would return to a row the user
      // has not looked at since.
      this.cursorRow.set(this.rowKey(row));
      // A console opens the row's pane by clicking the row, not a » button.
      if (this.canDetail()) this.activeRowId.set(this.idOf(row));
    }
    if (this.mode() !== 'single') return;
    this.selectSingle(row);
  }

  /** Pick exactly this row. `selectionChange` still fires, with one element. */
  selectSingle(row: StrctRow): void {
    if (this.mode() !== 'single' || this.lockedReason(row) !== null) return;
    const id = this.idOf(row);
    this.selectedId.set(id);
    this.commitSelection(new Set([id]));
  }

  /** Rows of one group that are actually pickable. */
  private groupRows(key: unknown): StrctRow[] {
    const g = this.groupBy();
    if (!g) return [];
    return this.sorted().filter((r) => r[g] === key && this.lockedReason(r) === null);
  }
  protected groupAllSelected(key: unknown): boolean {
    const rows = this.groupRows(key);
    return rows.length > 0 && rows.every((r) => this.selected().has(this.idOf(r)));
  }
  protected groupSomeSelected(key: unknown): boolean {
    return (
      !this.groupAllSelected(key) &&
      this.groupRows(key).some((r) => this.selected().has(this.idOf(r)))
    );
  }
  protected toggleGroupSelection(key: unknown): void {
    const rows = this.groupRows(key);
    const next = new Set(this.selected());
    if (this.groupAllSelected(key)) rows.forEach((r) => next.delete(this.idOf(r)));
    else rows.forEach((r) => next.add(this.idOf(r)));
    this.commitSelection(next);
  }

  /** Resolve a row's stable identity: its `rowId` value, or the row object
   *  itself when there is no `rowId` or it resolves to null/undefined. */
  private idOf(row: StrctRow): unknown {
    const id = this.rowId();
    if (id == null) return row;
    const resolved = typeof id === 'function' ? id(row) : row[id];
    // An unresolvable id must not collapse rows onto one another: a Set holds
    // `undefined` once, so every row missing the field would share one
    // identity — select one, select them all. `??`, not `||`: 0 and '' are
    // legitimate ids.
    return resolved ?? row;
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
    // FIRST, before the effects that read column state or announce a lazy
    // page. Two faults lived here:
    //  - the persisted state was read in this constructor's body, where a
    //    template-bound stateKey is still null, so nothing was ever restored
    //    — and the persistence effect then wrote the defaults over what the
    //    operator had saved;
    //  - a bound columnState was applied after the lazy effect had already
    //    announced an unsorted first page.
    // Reading it in the first run of an effect puts it after input binding
    // and before both.
    effect(() => {
      const sk = this.stateKey();
      const bound = this.columnState();
      untracked(() => {
        if (this.stateRestored) return;
        this.stateRestored = true;
        // A bound columnState is the consumer's own word and wins over
        // storage; without one, storage speaks.
        if (bound) {
          this.lastStateKey = JSON.stringify(bound);
          this.applyColumnState(bound);
          return;
        }
        if (!sk) return;
        const persisted = this.readPersistedState();
        if (persisted) {
          this.lastStateKey = JSON.stringify(persisted);
          this.applyColumnState(persisted);
        }
      });
    });

    // A filter can leave one row out of twelve with nothing said. Announce the
    // count it left, but only while a filter is actually on, and never for the
    // first render.
    effect(() => {
      const shown = this.filteredRows().length;
      const total = this.rows().length;
      const active = this.quickFilter().trim().length > 0 || Object.keys(this.filters()).length > 0;
      untracked(() => {
        if (!this.filterSettled) {
          this.filterSettled = true;
          return;
        }
        if (active) this.announce(this.L().rowsMatch(shown, total));
      });
    });

    // The resize listeners live on document — if the grid is destroyed
    // mid-drag they must not leak (onResizeEnd is a safe no-op when idle).
    inject(DestroyRef).onDestroy(() => this.onResizeEnd());
    // Keep the page in range when the data set shrinks (server total in lazy mode).
    effect(() => {
      const size = this.pageSize();
      if (size <= 0) return;
      const count = this.totalCount();
      const pageCount = Math.max(1, Math.ceil(count / size));
      if (this.page() > pageCount) this.page.set(pageCount);
    });
    // A changed filter always restarts from page 1.
    effect(() => {
      this.filters();
      this.quickTerm();
      untracked(() => this.page.set(1));
    });
    // Seed the selection from initialSelection (re-runs only when the input changes,
    // so a user's own toggles afterward are untouched).
    effect(() => {
      const init = this.initialSelection();
      if (init == null) return;
      untracked(() => this.selected.set(new Set(init)));
    });
    // A selection must not outlive its rows: after a delete the footer said
    // "2 selected" and selectionChange consumers held ids for rows that are
    // gone. Prune to the ids the current rows can account for, and emit only
    // when the pruning actually removed something. A lazy grid cannot prove a
    // row is gone rather than on another page, so it is left alone.
    effect(() => {
      const rows = this.rows();
      if (this.lazy()) return;
      // An empty array proves nothing was deleted: a poll that replaces the
      // rows, a reload that blanks them and a grid still loading all look the
      // same from here, and wiping the pick on one of those is the bug this
      // guard exists for. A genuinely emptied grid is the consumer's to clear.
      if (!rows.length || this.loading()) return;
      untracked(() => {
        const selected = this.selected();
        if (!selected.size) return;
        const present = new Set(rows.map((r) => this.idOf(r)));
        const kept = new Set([...selected].filter((id) => present.has(id)));
        if (kept.size === selected.size) return;
        this.commitSelection(kept);
      });
    });
    // Multiple mode: the checked rows follow `selectedIds`, whoever wrote them
    // — the user picking, or a consumer that also un-ticks a member somewhere
    // else on the screen. Like the single-mode effect, it writes `selected`
    // directly, so an external write never emits selectionChange.
    effect(() => {
      if (this.mode() === 'single') return;
      const ids = this.selectedIds();
      if (ids == null) return;
      untracked(() => {
        const next = new Set(ids);
        const current = this.selected();
        if (current.size === next.size && [...next].every((v) => current.has(v))) return;
        this.selected.set(next);
        this.selectedRowCache.clear();
        for (const row of this.rows()) {
          const id = this.idOf(row);
          if (next.has(id)) this.selectedRowCache.set(id, row);
        }
      });
    });
    // Single mode: the checked row follows `selectedId`, whoever wrote it — the
    // user picking, or a consumer restoring a pick from an earlier step. It
    // writes `selected` directly rather than through commitSelection, so an
    // external write never emits selectionChange (a user's own pick already
    // emitted one).
    effect(() => {
      if (this.mode() !== 'single') return;
      const id = this.selectedId();
      // `selectedId` is a model, so its null is two things: "the consumer does
      // not drive it" and "the consumer cleared the pick". Until it has once
      // been non-null it is the former — otherwise the first run wipes what
      // `initialSelection` seeded, which is how a 4.x grid picks its row.
      if (id == null && !this.selectedIdDriven) return;
      if (id != null) this.selectedIdDriven = true;
      // Read the rows as well: a pick whose row leaves and comes back must be
      // checked again, and `selectedId` itself never changed to say so.
      this.rows();
      untracked(() => {
        const next = id == null ? new Set<unknown>() : new Set([id]);
        const current = this.selected();
        if (current.size === next.size && [...next].every((v) => current.has(v))) return;
        this.selected.set(next);
        // Keep the row snapshot in step when the row is loaded; a pick set
        // before the rows arrive is cached when it is toggled later.
        this.selectedRowCache.clear();
        if (id != null) {
          const row = this.rows().find((r) => this.idOf(r) === id);
          if (row) this.selectedRowCache.set(id, row);
        }
      });
    });
    // Dev mode only: say so when rowId or initialSelection cannot do what they
    // were given to do. In production the effect is never registered.
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      effect(() => {
        const rowId = this.rowId();
        const rows = this.rows();
        const init = this.initialSelection();
        const lazy = this.lazy();
        untracked(() => this.diagnoseIdentity(rowId, rows, init, lazy));
      });
    }
    // Server-side mode: announce what to load whenever page / sort / pageSize
    // change (and once on init, so the consumer fetches the first page).
    effect(() => {
      if (!this.lazy()) return;
      // Nothing is announced before the saved or bound state has been read,
      // or the server is asked for an unsorted page and then asked again.
      if (!this.stateRestored) return;
      const state: StrctDatagridLazyState = {
        page: this.page(),
        pageSize: this.pageSize(),
        sortKey: this.sort().key,
        sortDir: this.sort().dir,
        filters: this.filters(),
        quickFilter: this.quickTerm(),
      };
      const key = JSON.stringify(state);
      untracked(() => {
        if (key === this.lastLazyKey) return;
        this.lastLazyKey = key;
        this.lazyLoad.emit(state);
      });
    });
    // The inputs are bound by the first render, so this is where they can be
    // read and reported.
    afterNextRender(() => {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) this.reportFlatInputs();
    });
    // Below `paneTakeoverWidth` the pane replaces the list. The grid's own
    // width decides, not the viewport: the same grid is wide in a page and
    // narrow in a drawer.
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const host = this.hostRef.nativeElement;
      const ro = new ResizeObserver(() =>
        this.zone.run(() => {
          this.narrowPane.set(host.clientWidth < this.paneTakeoverWidth());
          this.sweepHeaderWidths();
        }),
      );
      ro.observe(host);
      this.sweepHeaderWidths();
      this.destroyRef.onDestroy(() => ro.disconnect());
    });
    // The columns' own `hidden` flags, read once they exist — a required input
    // is not available in the constructor.
    effect(() => {
      const cols = this.columns();
      untracked(() => this.applyDeclaredHidden(cols));
    });
    // Apply externally-driven columnState (later changes; the first one is
    // taken by the restore effect above).
    effect(() => {
      const st = this.columnState();
      untracked(() => {
        if (!st || JSON.stringify(st) === this.lastStateKey) return;
        this.lastStateKey = JSON.stringify(st);
        this.applyColumnState(st);
      });
    });
    // Push user changes (resize / chooser / reorder) outward + persist under stateKey.
    effect(() => {
      const widths = Object.fromEntries(this.columnWidths());
      const hidden = [...this.hiddenColumns()];
      const order = this.columnOrder() ?? undefined;
      // A list an operator sorted by Host CPU opened sorted by name again, and
      // a lazy one asked the server for the wrong order first.
      const { key: sortKey, dir: sortDir } = this.sort();
      const st: StrctDatagridColumnState = { widths, hidden, order, sortKey, sortDir };
      const key = JSON.stringify(st);
      untracked(() => {
        // Never write before reading: this is what overwrote the operator's
        // saved state with the component's defaults.
        if (!this.stateRestored) return;
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

  /** Whether the saved (or bound) column state has been read yet. */
  private stateRestored = false;

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
    if (st.hidden) this.hiddenDecidedByState = true;
    this.hiddenColumns.set(new Set(st.hidden ?? []));
    this.columnOrder.set(st.order?.length ? [...st.order] : null);
    if (st.sortKey !== undefined) this.sort.set({ key: st.sortKey, dir: st.sortDir ?? 'asc' });
  }

  /** Whether a persisted or bound state has already decided what is hidden. */
  private hiddenDecidedByState = false;
  /** Whether the columns' own `hidden` flags have been read (once). */
  private declaredHiddenApplied = false;

  /**
   * Columns the consumer declared hidden — the default for a column no state
   * mentions. A list that shows five of twenty columns says so on the columns,
   * rather than seeding `columnState` and reaching into the library's storage
   * key to keep from overriding what the operator chose.
   */
  private applyDeclaredHidden(cols: readonly StrctDatagridColumn[]): void {
    if (this.declaredHiddenApplied || this.hiddenDecidedByState) return;
    this.declaredHiddenApplied = true;
    const declared = cols.filter((c) => c.hidden).map((c) => c.key);
    if (!declared.length) return;
    this.hiddenColumns.update((set) => new Set([...set, ...declared]));
  }

  /**
   * The grid as CSV: header labels + every non-hidden column, all rows in the
   * current order (client mode: the full sorted set, not just the page).
   */
  toCSV(): string {
    const hidden = this.hiddenColumns();
    // The user's order, as the xlsx export already used: the same grid wrote
    // its columns two different ways.
    const cols = this.orderedColumns().filter((c) => !hidden.has(c.key));
    const esc = (v: unknown): string => {
      let s = v == null ? '' : String(v);
      // A cell that opens with one of these is a formula to a spreadsheet, so
      // a VM named "=HYPERLINK(…)" ran when the export was opened. A leading
      // apostrophe is the spreadsheet's own "this is text".
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const data = this.lazy() ? this.rows() : this.sorted();
    return [
      cols.map((c) => esc(c.label)).join(','),
      ...data.map((r) => cols.map((c) => esc(this.exportValueOf(r, c))).join(',')),
    ].join('\n');
  }

  /**
   * What an export writes for a cell: what the column says, else the stored
   * value. A templated cell shows "2 h 15 m" and stored 8100; without this the
   * export carries the seconds, an enum code or a bare `true`.
   */
  private exportValueOf(row: StrctRow, col: StrctDatagridColumn): unknown {
    return col.exportValue ? col.exportValue(row) : row[col.key];
  }

  /**
   * The grid as a real .xlsx workbook (dependency-free SpreadsheetML):
   * header labels + every non-hidden column in the current order, all rows in
   * the current sort; numeric cells stay numeric.
   */
  toXLSX(): Uint8Array {
    const hidden = this.hiddenColumns();
    const cols = this.orderedColumns().filter((c) => !hidden.has(c.key));
    const data = this.lazy() ? this.rows() : this.sorted();
    return buildXlsx(
      cols.map((c) => c.label),
      data.map((r) => cols.map((c) => this.exportValueOf(r, c) as XlsxValue)),
    );
  }

  /** Download the grid as an .xlsx file. */
  downloadXLSX(filename = 'datagrid.xlsx'): void {
    if (typeof document === 'undefined') return;
    const bytes = this.toXLSX();
    const copy = new Uint8Array(bytes);
    const blob = new Blob([copy.buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
      (this.hasSelectionColumn() ? 1 : 0) +
      (this.canExpand() ? 1 : 0) +
      (this.canDetail() ? 1 : 0) +
      (this.canActions() ? 1 : 0)
    );
  }

  /** Toggle the detail pane for a row (triggered by its »  button, not the row,
   *  so row cells remain selectable for copy). */
  /** One tab stop for the list while a pane can be opened from it. */
  protected paneRowTabindex(row: StrctRow): number {
    const rows = this.renderRows();
    if (!rows.length) return -1;
    const active = this.activeRow();
    const current = active && rows.includes(active) ? active : rows[0];
    return current === row ? 0 : -1;
  }

  /**
   * The mail-client contract a triage list is read with: Enter or Space opens
   * the row's pane, the arrows move the active row while it is open, and
   * Escape closes the pane and leaves focus on the row it came from.
   */
  protected onPaneRowKeydown(row: StrctRow, event: KeyboardEvent): void {
    if (!this.canDetail()) return;
    if ((event.target as HTMLElement | null)?.closest('input, button, select, textarea')) return;
    const rows = this.renderRows();
    const idx = rows.indexOf(row);
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.openDetail(row);
        break;
      case 'Escape':
        if (!this.paneOpen()) return;
        event.preventDefault();
        this.closePane();
        break;
      case 'ArrowDown':
      case 'ArrowUp': {
        const next = rows[idx + (event.key === 'ArrowDown' ? 1 : -1)];
        if (!next) return;
        event.preventDefault();
        // While the pane is open the arrows move the pane with the row, as a
        // mail client does; closed, they only move focus.
        if (this.paneOpen()) this.activeRowId.set(this.idOf(next));
        setTimeout(() => {
          const trs =
            this.hostRef.nativeElement.querySelectorAll<HTMLElement>('tbody tr[tabindex]');
          trs[idx + (event.key === 'ArrowDown' ? 1 : -1)]?.focus();
        });
        break;
      }
    }
  }

  openDetail(row: StrctRow): void {
    const id = this.idOf(row);
    this.activeRowId.set(this.activeRowId() === id ? null : id);
  }

  closePane(): void {
    // Hand focus back to the row's » button, but only when it was inside the
    // pane — a programmatic close leaves the user's focus alone.
    const host = this.hostRef.nativeElement;
    const focusInside = !!host.querySelector('.strct-dg__pane')?.contains(document.activeElement);
    const trigger = host.querySelector<HTMLElement>('.strct-dg__detailbtn--active');
    this.activeRowId.set(null);
    if (focusInside) restoreFocus(trigger);
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
    const { key: sorted, dir } = this.sort();
    const label = this.columns().find((c) => c.key === key)?.label ?? key;
    const l = this.L();
    this.announce(
      sorted === null
        ? l.sortCleared
        : dir === 'asc'
          ? l.sortedAscending(label)
          : l.sortedDescending(label),
    );
  }

  /** The pager's own change, plus what it means for a reader. */
  protected goToPage(page: number): void {
    this.page.set(page);
    const pages = Math.max(1, Math.ceil(this.totalCount() / Math.max(1, this.pageSize())));
    this.announce(this.L().pageOf(page, pages));
  }

  /**
   * Says something once. The same text twice in a row would be dropped by a
   * screen reader, so a repeat is nudged with a trailing space.
   */
  private announce(text: string): void {
    this.announcement.set(this.announcement() === text ? text + ' ' : text);
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

  /** The footer button that opened the column chooser — focus returns here. */
  private chooserTrigger: HTMLElement | null = null;
  protected toggleChooser(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.chooserOpen()) this.chooserTrigger = event.currentTarget as HTMLElement;
    this.chooserOpen.set(!this.chooserOpen());
  }
  protected closeChooser(restore = false): void {
    if (!this.chooserOpen()) return;
    this.chooserOpen.set(false);
    if (restore) restoreFocus(this.chooserTrigger);
    this.chooserTrigger = null;
  }

  toggleColumn(key: string, visible: boolean): void {
    this.hiddenColumns.update((set) => {
      const next = new Set(set);
      if (visible) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /** Distinct aria label per row checkbox: the base label + this row's
   *  identifier (its `rowId` value, falling back to the 1-based row index). */
  protected selectRowLabel(row: StrctRow): string {
    return this.L().selectRowFor(this.rowIdentifier(row));
  }

  private rowIdentifier(row: StrctRow): string {
    if (this.rowId() != null) {
      const id = this.idOf(row);
      if (typeof id === 'string' || typeof id === 'number') return String(id);
    }
    return String(this.rows().indexOf(row) + 1);
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

  /** The row a Shift-click measures its range from: the last one toggled on
   *  its own. A range leaves it where it is, so successive Shift-clicks
   *  re-project from the same origin instead of walking the anchor along. */
  private rangeAnchor: unknown = null;
  /** Set by the row checkbox's click, consumed by the `toggleRow` that the
   *  same interaction fires immediately after. */
  private rangeIntent = false;

  protected noteRangeIntent(event: MouseEvent): void {
    this.rangeIntent = event.shiftKey;
  }

  /**
   * Toggle one row. Shift-clicking a row checkbox instead applies the clicked
   * box's new state across every row between the anchor and this one — so a
   * Shift-click selects a block, and Shift-clicking a checked box clears one.
   */
  toggleRow(row: StrctRow): void {
    if (this.lockedReason(row) !== null) return;
    const id = this.idOf(row);
    const select = !this.selected().has(id);
    const next = new Set(this.selected());
    const ranged = this.rangeIntent;
    this.rangeIntent = false;

    if (ranged && this.rangeAnchor !== null) {
      const rows = this.selectionRows();
      const from = rows.findIndex((r) => this.idOf(r) === this.rangeAnchor);
      const to = rows.findIndex((r) => this.idOf(r) === id);
      // A vanished anchor (paged away, filtered out) degrades to a plain toggle.
      if (from !== -1 && to !== -1) {
        for (let i = Math.min(from, to); i <= Math.max(from, to); i++) {
          const rid = this.idOf(rows[i]);
          if (select) next.add(rid);
          else next.delete(rid);
        }
        this.commitSelection(next);
        return;
      }
    }

    if (select) next.add(id);
    else next.delete(id);
    this.rangeAnchor = id;
    this.commitSelection(next);
  }

  toggleAll(): void {
    const next = new Set(this.selected());
    const rows = this.selectionRows().filter((r) => this.lockedReason(r) === null);
    if (this.allPageSelected()) {
      rows.forEach((r) => next.delete(this.idOf(r)));
    } else {
      rows.forEach((r) => next.add(this.idOf(r)));
    }
    this.rangeAnchor = null;
    this.commitSelection(next);
  }

  clearSelection(): void {
    this.rangeAnchor = null;
    this.commitSelection(new Set());
  }

  /** Whether `selectedId` has ever been given a value — see the effect. */
  private selectedIdDriven = false;

  /** Last known row object per selected id — selections made on one page stay
   *  in the payload when the data set no longer contains them (lazy paging),
   *  so `selectionChange` and `selectedCount` never disagree. */
  private readonly selectedRowCache = new Map<unknown, StrctRow>();

  /** Emit every selected row: fresh objects from the latest data where
   *  available, the last known snapshot otherwise (off-page lazy rows). */
  private commitSelection(next: Set<unknown>): void {
    // Snapshot newly selected rows before they can page away; drop deselected ids.
    for (const r of this.rows()) {
      const id = this.idOf(r);
      if (next.has(id)) this.selectedRowCache.set(id, r);
    }
    for (const id of [...this.selectedRowCache.keys()]) {
      if (!next.has(id)) this.selectedRowCache.delete(id);
    }
    this.selected.set(next);
    // Keep the two-way model in step with what the user did. The effect above
    // compares sets, so writing it here cannot loop.
    if (this.mode() !== 'single' && this.selectedIds() != null) this.selectedIds.set([...next]);
    const fresh = this.rows().filter((r) => next.has(this.idOf(r)));
    const freshIds = new Set(fresh.map((r) => this.idOf(r)));
    const offData = [...next]
      .filter((id) => !freshIds.has(id))
      .map((id) => this.selectedRowCache.get(id))
      .filter((r): r is StrctRow => !!r);
    this.selectionChange.emit([...fresh, ...offData]);
  }

  /**
   * One row's sort key for a column: what the column says to sort by, else the
   * stored value. A cell that shows "1.5 TB" sorts as text without this, which
   * puts it before "900 GB"; a date written by toLocaleString sorts across
   * days and AM/PM by its characters.
   */
  private sortKeyOf(row: StrctRow, col: StrctDatagridColumn | undefined, key: string): unknown {
    return col?.sortValue ? col.sortValue(row) : row[key];
  }

  /** The column a key belongs to — the comparator and the sort key need it. */
  private columnOf(key: string): StrctDatagridColumn | undefined {
    return this.columns().find((c) => c.key === key);
  }

  /** Compare two rows by a column, honouring its comparator and nulls-last. */
  private compareRows(a: StrctRow, b: StrctRow, key: string, sign: number): number {
    const col = this.columnOf(key);
    if (col?.comparator) return sign * col.comparator(a, b);
    const av = this.sortKeyOf(a, col, key);
    const bv = this.sortKeyOf(b, col, key);
    // An unread value is neither the smallest nor the largest: it is not an
    // answer at all, so it goes last whichever way the column is sorted.
    const aEmpty = av == null || av === '';
    const bEmpty = bv == null || bv === '';
    if (aEmpty || bEmpty) return aEmpty && bEmpty ? 0 : aEmpty ? 1 : -1;
    return sign * this.compare(av, bv);
  }

  private compare(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
  }
}
