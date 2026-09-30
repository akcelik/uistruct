import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  StrctBadge,
  StrctProgress,
  StrctBadgeStatus,
  StrctButton,
  StrctCellDef,
  StrctCheckbox,
  StrctColumn,
  StrctDatagrid,
  StrctListItemTrailing,
  StrctListItemMeta,
  StrctListItemDescription,
  StrctListItemLeading,
  StrctListItem,
  StrctLiveIndicator,
  StrctLiveState,
  StrctChange,
  StrctStepAction,
  StrctStepState,
  StrctSteps,
  StrctList,
  StrctDatagridActionBar,
  StrctDatagridColumn,
  StrctDatagridFilters,
  StrctDatagridLazyState,
  StrctDesc,
  StrctDescriptionList,
  StrctIcon,
  StrctRow,
  StrctRowDetailDef,
  StrctStack,
  StrctStackItem,
  StrctStatusDot,
  StrctTable,
  StrctTimeline,
  StrctTimelineItem,
  StrctToolbar,
  StrctToolbarSpacer,
  StrctCode,
  StrctFilterBar,
  StrctFilterChip,
  StrctReorder,
  StrctReorderItem,
  StrctReorderMoveEvent,
  StrctReorderHandle,
  StrctReorderGroup,
  StrctReorderEvent,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-data-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JsonPipe,
    PageHeader,
    DemoBlock,
    FormsModule,
    StrctTable,
    StrctDatagrid,
    StrctRowDetailDef,
    StrctDatagridActionBar,
    StrctCellDef,
    StrctBadge,
    StrctProgress,
    StrctIcon,
    StrctButton,
    StrctCheckbox,
    StrctTimeline,
    StrctTimelineItem,
    StrctStack,
    StrctStackItem,
    StrctStatusDot,
    StrctDescriptionList,
    StrctDesc,
    StrctCode,
    StrctFilterBar,
    StrctReorder,
    StrctReorderItem,
    StrctToolbar,
    StrctToolbarSpacer,
    StrctList,
    StrctListItem,
    StrctListItemLeading,
    StrctListItemDescription,
    StrctListItemMeta,
    StrctListItemTrailing,
    StrctLiveIndicator,
    StrctChange,
    StrctStepAction,
    StrctSteps,
    StrctReorderGroup,
    StrctReorderHandle,
  ],
  template: `
    <app-page-header title="Data" subtitle="Declarative, token-styled data display." />

    <app-demo
      anchor="list"
      heading="List"
      description="Short lists of things with a status are lists, not tables: a leading marker, a title, a secondary line, a quiet meta and a control at the end. A table needs a header row, a timeline implies time order, and an alert per item is too heavy. interactive makes the row itself open — click, Enter or Space — while anything in [strctListItemTrailing] stays a separate tab stop, so “open this alarm” and “acknowledge it” are two different targets. dense gives 32px rows, status draws the rail strct-card uses, and below a 360px container the meta drops under the description. wrap lets the title and description carry a sentence — why a host is blocked, what a check found — instead of ending in an ellipsis; the leading marker stays on the title's first line. Put it on the list for every row, or on one row."
      code='<strct-list dense label="Active alarms">&#10;  <strct-list-item interactive status="critical" (activated)="open(a)">&#10;    <strct-badge strctListItemLeading status="critical">Critical</strct-badge>&#10;    Datastore latency&#10;    <span strctListItemDescription>ds-prod-01</span>&#10;    <span strctListItemMeta>2 min ago</span>&#10;    <button strctListItemTrailing strct-button size="sm" variant="flat">Acknowledge</button>&#10;  </strct-list-item>&#10;</strct-list>'
    >
      <div class="stack" style="width: 100%; max-width: 560px;">
        <strct-list label="Active alarms">
          @for (a of alarmRows; track a.name) {
            <strct-list-item
              interactive
              [status]="a.tone"
              [selected]="a.name === selectedAlarm()"
              (activated)="selectedAlarm.set(a.name)"
            >
              <strct-badge strctListItemLeading [status]="a.tone">{{ a.severity }}</strct-badge>
              {{ a.name }}
              <span strctListItemDescription>{{ a.object }}</span>
              <span strctListItemMeta>{{ a.when }}</span>
              <button strct-button strctListItemTrailing size="sm" variant="flat">
                Acknowledge
              </button>
            </strct-list-item>
          }
        </strct-list>
        <strct-list wrap label="What the last check found">
          @for (f of findingRows; track f.title) {
            <strct-list-item [status]="f.tone">
              <strct-status-dot strctListItemLeading [status]="f.tone" />
              {{ f.title }}
              <span strctListItemDescription>{{ f.detail }}</span>
              <span strctListItemMeta>{{ f.when }}</span>
            </strct-list-item>
          }
        </strct-list>
        <strct-list dense [dividers]="false" label="Cluster members" emptyText="No members">
          @for (m of memberRows; track m) {
            <strct-list-item>
              <strct-status-dot strctListItemLeading status="success" />
              {{ m }}
            </strct-list-item>
          }
        </strct-list>
      </div>
    </app-demo>

    <app-demo
      anchor="description-list"
      heading="Description list"
      description="Aligned label → value pairs. Project a row as <div strctDesc> so a value can host a badge — a <dl> allows only dt / dd pairs or <div> wrappers as children, so a custom element between them is invalid — or pass plain pairs via items. The inline variant is a horizontal stat strip."
      code='<strct-description-list><div strctDesc label="IPv4" mono>172.16.75.100/24</div></strct-description-list>'
    >
      <div class="dl-grid">
        <strct-description-list>
          <div strctDesc label="IPv4" mono>172.16.75.100/24</div>
          <div strctDesc label="Gateway" mono>172.16.75.2</div>
          <div strctDesc label="IPv6"><strct-badge status="success">Enabled</strct-badge></div>
        </strct-description-list>

        <strct-description-list
          [items]="[
            { label: 'Hostname', value: 'hyperstruct01', mono: true },
            { label: 'Serial', value: 'KX-99213-AC', mono: true },
            { label: 'Location', value: 'Rack B12', muted: true },
          ]"
        />
      </div>

      <strct-description-list inline class="dl-strip">
        <div strctDesc label="Access · VIP">
          <strct-badge status="accent" solid>172.16.75.250</strct-badge>
        </div>
        <div strctDesc label="Viewing">
          <strct-badge status="neutral">hyperstruct01</strct-badge>
        </div>
      </strct-description-list>
    </app-demo>

    <app-demo
      anchor="description-list-grid"
      owner="description-list"
      heading="One label column, a state and a note"
      description='A list of facts lines its values up. align="grid" gives the list one label column sized to its longest label — what about 33 hand-built auto 1fr grids in the audited app are for — and labelWidth fixes that column when several lists should agree. A fact can carry its state and a short note too: status puts a dot before the label and note a quiet second line under the value, so “Agent · connected · last seen 12 s ago” is one row rather than three.'
      code='<strct-description-list align="grid" labelWidth="150px">&#10;  <div strctDesc label="Agent" status="success" note="last seen 12 s ago">Connected</div>&#10;</strct-description-list>'
    >
      <div class="dl-grid">
        <strct-description-list align="grid">
          <div strctDesc label="Agent" status="success" note="last seen 12 s ago">Connected</div>
          <div strctDesc label="Cluster membership" status="warning" note="quorum at 2 of 3">
            Degraded
          </div>
          <div strctDesc label="Firmware" icon="cpu" mono>4.21.0-rc2</div>
          <div strctDesc label="Uptime">14 days</div>
        </strct-description-list>

        <strct-description-list
          align="grid"
          labelWidth="150px"
          [items]="[
            { label: 'Hostname', value: 'hyperstruct01', mono: true },
            { label: 'Serial', value: 'KX-99213-AC', mono: true },
            { label: 'Location', value: 'Rack B12', muted: true },
          ]"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="status-dot"
      heading="Status dot"
      description="A presence dot that never relies on colour alone: the tone is painted by CSS while the state also renders as visually-hidden text ('OK', 'Warning', …), overridable via label. sm for dense rows, md standalone."
      code='<strct-status-dot status="success" />  ·  <strct-status-dot status="critical" size="sm" label="Node unreachable" />'
    >
      <span class="dot-row"><strct-status-dot status="neutral" /> Neutral</span>
      <span class="dot-row"><strct-status-dot status="accent" /> Info</span>
      <span class="dot-row"><strct-status-dot status="success" /> OK</span>
      <span class="dot-row"><strct-status-dot status="warning" /> Warning</span>
      <span class="dot-row"><strct-status-dot status="critical" /> Critical</span>
      <span class="dot-row"
        ><strct-status-dot status="success" size="sm" /> sm, for dense rows</span
      >
    </app-demo>

    <app-demo
      anchor="live-indicator"
      owner="status-dot"
      heading="Live, reconnecting, stale"
      description='Something happening now pulses once a second; something that should be live and is not says so. pulse animates the dot&apos;s halo and never its size, so a column of dots does not jitter — and under prefers-reduced-motion the halo is a static ring. “Live · updates every 5 s”, “Reconnecting…” and “Last updated 3 min ago” are states of one indicator, not three captions beside three hand-rolled dots: strct-live-indicator switches wording and tone by state, re-renders its relative time every 30 s, and is a polite role="status" so a change is announced once — never each tick. Every string is an input.'
      code='<strct-live-indicator state="live" [interval]="5000" />  ·  <strct-live-indicator state="stale" [updatedAt]="lastRead" />'
    >
      <div class="stack" style="gap: 12px;">
        <span class="dot-row"><strct-status-dot status="success" pulse /> a task running</span>
        <div style="display: flex; gap: 18px; flex-wrap: wrap;">
          <strct-live-indicator state="live" [interval]="5000" />
          <strct-live-indicator state="connecting" />
          <strct-live-indicator state="reconnecting" />
          <strct-live-indicator state="paused" />
          <strct-live-indicator state="stale" [updatedAt]="lastRead" />
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          @for (st of liveStates; track st) {
            <button strct-button size="sm" variant="flat" (click)="liveState.set(st)">
              {{ st }}
            </button>
          }
        </div>
        <strct-live-indicator [state]="liveState()" [interval]="5000" [updatedAt]="lastRead" />
      </div>
    </app-demo>

    <app-demo
      anchor="code"
      heading="Code"
      description="Copyable mono code / rendered-config block — the component form of the details/pre pattern. Header carries a title, a language tag and a copy button; collapsible folds it to the header; line numbers live in an uncopyable gutter."
      code='<strct-code [code]="yaml" language="yaml" title="cloud-init" collapsible lineNumbers />'
    >
      <div class="stack" style="width: 100%; max-width: 640px;">
        <strct-code
          [code]="cloudInit"
          language="yaml"
          title="cloud-init.yaml"
          lineNumbers
          [maxHeight]="220"
        />
        <strct-code
          [code]="renderedCfg"
          language="ini"
          title="Rendered config"
          collapsible
          [collapsed]="true"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="code-wrap"
      owner="code"
      heading="Soft wrap — long unbroken text"
      description="wrap soft-wraps PEM/CSR blocks, base64 thumbprints and long one-liner commands so a dialog never scrolls horizontally. overflow-wrap: anywhere breaks unbroken base64 while prose still breaks at spaces; wrap hides the line-number gutter, whose alignment wrapping would break."
      code='<strct-code [code]="csr.csr_pem" copyable wrap />'
    >
      <div class="stack" style="width: 100%; max-width: 640px;">
        <strct-code [code]="csrLine" language="pem" title="CSR (single line) — wrap" wrap />
        <strct-code
          [code]="csrLine"
          language="pem"
          title="Same content without wrap — scrolls sideways"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="filter-bar"
      heading="Filter bar"
      description="The standard strip above a grid: a searchbox, removable filter chips, clear-all and a live result count. The bar owns no filtering logic — it renders state and announces intent."
      code='<strct-filter-bar [(query)]="q" [filters]="chips" [count]="rows.length" (removed)="drop($event)" (cleared)="reset()" />'
    >
      <div class="dg-wrap">
        <strct-filter-bar
          [(query)]="fbQuery"
          [filters]="fbChips()"
          [count]="fbCount()"
          placeholder="Search hosts…"
          (removed)="fbRemove($event)"
          (cleared)="fbChips.set([])"
        />
        <span class="echo">query: "{{ fbQuery() }}" · aktif filtre: {{ fbChips().length }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="table"
      heading="Table"
      description="Driven by columns and rows inputs, with optional striped and hover styling. Cluster rows as an example."
      code='<strct-table [columns]="cols" [rows]="rows" striped hover />'
    >
      <strct-table style="width: 100%;" [columns]="cols" [rows]="rows" striped hover />
    </app-demo>

    <app-demo
      anchor="toolbar"
      heading="Toolbar"
      description="Action bar for datagrid/card tops: projected actions, a spacer pushing the rest to the far end, and — once selectionCount > 0 — a 'N selected' chip with a × clear affordance that emits (cleared). APG keyboard: arrows rove focus across the controls, Home/End jump to the ends."
      code='<strct-toolbar [selectionCount]="sel().length" (cleared)="sel.set([])">…<strct-toolbar-spacer />…</strct-toolbar>'
    >
      <div class="dg-wrap">
        <strct-toolbar
          ariaLabel="Host actions"
          divided
          [selectionCount]="tbSelected()"
          (cleared)="tbClear()"
        >
          <button strct-button size="sm" variant="primary">Restart</button>
          <button strct-button size="sm">Enter maintenance</button>
          <strct-toolbar-spacer />
          <button strct-button iconOnly size="sm" aria-label="Export">
            <strct-icon name="download" [size]="14" />
          </button>
        </strct-toolbar>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button strct-button size="sm" variant="flat" (click)="tbSimulate()">
            Simulate: 3 rows selected
          </button>
          <span class="echo">{{ tbEcho() }}</span>
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid"
      heading="Datagrid"
      description="Sortable columns, row selection, expandable detail rows, a batch action bar, paging, resizable columns and a column chooser. Populated with cluster rows; status renders as a badge. Opens with two rows pre-checked via [initialSelection] (ids matching rowId) — ideal for a picker dialog seeded with the current members."
      code='<strct-datagrid [columns]="cols" [rows]="rows" rowId="name" selectable [initialSelection]="preChecked" expandable>&#10;  <ng-template strctCell="status" let-value="value">…</ng-template>&#10;</strct-datagrid>'
    >
      <div class="dg-wrap">
        <strct-checkbox [ngModel]="dense()" (ngModelChange)="dense.set($event)"
          >Compact</strct-checkbox
        >

        <strct-datagrid
          style="width: 100%;"
          [columns]="dgCols"
          [rows]="dgRows"
          rowId="name"
          selectable
          [initialSelection]="preChecked"
          expandable
          resizable
          columnChooser
          sync
          [footerActionsDisabled]="refreshing()"
          (syncChange)="onRefresh()"
          [compact]="dense()"
          [pageSize]="5"
        >
          <ng-template strctCell="status" let-value="value">
            <strct-badge [status]="badgeFor(value)">{{ value }}</strct-badge>
          </ng-template>
          <ng-template strctCell="cpu" let-value="value">
            <div class="dg-cpu">
              <strct-progress [value]="$any(value)" [status]="cpuStatus($any(value))" />
              <span class="dg-cpu__pct">{{ value }}%</span>
            </div>
          </ng-template>
          <div strctDatagridActionBar>
            <button strct-button variant="primary" size="sm">
              <strct-icon name="upload" [size]="14" /> Add host
            </button>
            <button strct-button iconOnly size="sm" aria-label="Export">
              <strct-icon name="download" [size]="14" />
            </button>
          </div>

          <ng-template strctRowDetail let-row>
            <strct-stack style="max-width: 380px;">
              <strct-stack-item label="Cluster">{{ row['name'] }}</strct-stack-item>
              <strct-stack-item label="Type">{{ row['type'] }}</strct-stack-item>
              <strct-stack-item label="Hosts">{{ row['hosts'] }}</strct-stack-item>
              <strct-stack-item label="Status">{{ row['status'] }}</strct-stack-item>
            </strct-stack>
          </ng-template>
        </strct-datagrid>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-pick"
      owner="datagrid"
      heading="Picking one row, and rows that cannot be picked"
      description="selectionMode=&quot;single&quot; makes the grid its own picker: a native radio group, one name per grid, so the arrow keys move between rows and Space picks — without a radio column wired by hand outside the grid. Clicking anywhere on the row picks it, [(selectedId)] carries the row id, and (selectionChange) still fires with a one-element array so existing listeners keep working. rowSelectable locks a row and can say why: the reason becomes the row's tooltip and the control's accessible description, and a locked row keeps its normal colours because a locked candidate is still worth reading."
      code='<strct-datagrid selectionMode="single" [(selectedId)]="targetId" [rowSelectable]="canDeploy" rowId="id" />'
    >
      <div class="dg-wrap">
        <strct-datagrid
          style="width: 100%;"
          [columns]="pickCols"
          [rows]="pickRows"
          rowId="id"
          selectionMode="single"
          [(selectedId)]="pickedHost"
          [rowSelectable]="canDeploy"
        />
        <span class="echo">Target: {{ pickedHost() ?? 'none chosen' }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-groupselect"
      owner="datagrid"
      heading="Select all in a group"
      description="With groupBy and multiple selection, groupSelect puts a tri-state checkbox on each group header: checked when every selectable row of the group is selected, indeterminate when only some are, and it skips locked rows entirely."
      code='<strct-datagrid selectable groupBy="pool" groupSelect [rowSelectable]="canDeploy" rowId="id" />'
    >
      <div class="dg-wrap">
        <strct-datagrid
          style="width: 100%;"
          [columns]="pickCols"
          [rows]="pickRows"
          rowId="id"
          selectable
          groupBy="pool"
          groupSelect
          [rowSelectable]="canDeploy"
          (selectionChange)="pickedGroup.set($event.length)"
        />
        <span class="echo">{{ pickedGroup() }} selected</span>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-singleline"
      owner="datagrid"
      heading="Single-line rows"
      description="By default cells wrap, so a long value can make one row much taller than the rest. Enable singleLine to keep every row exactly one line tall — long values truncate with an ellipsis and the grid's rhythm stays intact. Hover a clipped cell to reveal its full value; cells that fit get no tooltip."
      code='<strct-datagrid [columns]="cols" [rows]="rows" singleLine />'
    >
      <div class="dg-wrap">
        <strct-checkbox [ngModel]="oneLine()" (ngModelChange)="oneLine.set($event)"
          >Single-line rows</strct-checkbox
        >
        <strct-datagrid
          style="width: 100%;"
          [columns]="slCols"
          [rows]="slRows"
          [singleLine]="oneLine()"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-virtual"
      owner="datagrid"
      heading="Virtual scroll — 20.000 rows"
      description="virtual keeps only the viewport (plus a small overscan) in the DOM, so tens of thousands of rows scroll smoothly with a sticky header. The first column is frozen (sticky), headers can be drag-reordered (reorderable — order persists under stateKey along with widths and visibility), and the whole set exports as CSV or a real dependency-free .xlsx."
      code='<strct-datagrid [columns]="cols" [rows]="rows20k" virtual reorderable stateKey="inventory" #g /> … g.downloadXLSX()'
    >
      <div class="dg-wrap">
        <strct-datagrid
          #vgrid
          style="width: 100%;"
          [columns]="vCols"
          [rows]="vRows"
          rowId="id"
          virtual
          [viewportHeight]="380"
          selectable
          resizable
          reorderable
          columnChooser
          stateKey="docs-inventory"
          [labels]="{ rows: 'hosts' }"
        />
        <div style="display: flex; gap: 10px; align-items: center;">
          <button
            strct-button
            size="sm"
            variant="neutral"
            (click)="vgrid.downloadCSV('inventory.csv')"
          >
            <strct-icon name="download" [size]="14" /> CSV
          </button>
          <button
            strct-button
            size="sm"
            variant="neutral"
            (click)="vgrid.downloadXLSX('inventory.xlsx')"
          >
            <strct-icon name="download" [size]="14" /> Excel (.xlsx)
          </button>
          <span class="echo">DOM'da yalnızca görünür satırlar render edilir</span>
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-lazy"
      owner="datagrid"
      heading="Server-side data (lazy)"
      description="With lazy the grid never sorts or slices rows itself — it emits (lazyLoad) with { page, pageSize, sortKey, sortDir } whenever you page or sort (and once on init), and you fetch that window from your API. total drives the pager. Below, a fake 500-row server answers with 300ms latency."
      code='<strct-datagrid [columns]="cols" [rows]="pageRows()" lazy [total]="500" [pageSize]="8" [loading]="busy()" (lazyLoad)="fetch($event)" />'
    >
      <div class="dg-wrap">
        <strct-datagrid
          style="width: 100%;"
          [columns]="lzCols"
          [rows]="lzRows()"
          rowId="id"
          lazy
          [total]="500"
          [pageSize]="8"
          [loading]="lzLoading()"
          (lazyLoad)="onLazyLoad($event)"
        />
        <span class="echo">{{ lzEcho() }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-grouping"
      owner="datagrid"
      heading="Row grouping"
      description="groupBy renders a collapsible header row per distinct value with a count — sorting still applies within groups. Click a group header to collapse it."
      code='<strct-datagrid [columns]="cols" [rows]="rows" groupBy="type" />'
    >
      <div class="dg-wrap">
        <strct-checkbox [ngModel]="grouped()" (ngModelChange)="grouped.set($event)"
          >Group by type</strct-checkbox
        >
        <strct-datagrid
          style="width: 100%;"
          [columns]="dgCols"
          [rows]="dgRows"
          rowId="name"
          [groupBy]="grouped() ? 'type' : null"
        >
          <ng-template strctCell="status" let-value="value">
            <strct-badge [status]="badgeFor(value)">{{ value }}</strct-badge>
          </ng-template>
        </strct-datagrid>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-filters"
      owner="datagrid"
      heading="Filters — quick + per-column"
      description="quickFilterable renders the built-in quick-filter box: one term OR-matched across every column (the console-standard fast filter), with a filtered-from-total count. Per-column filters (contains-text popover / checkbox value set) AND on top. Both reset paging and ride on (lazyLoad) in server mode."
      code='<strct-datagrid quickFilterable [(quickFilter)]="q" [(filters)]="filters" … />  ·  cols = [{ key: "name", filterable: true }, { key: "status", filterOptions: [...] }]'
    >
      <div class="dg-wrap">
        <strct-datagrid
          style="width: 100%;"
          [columns]="dgFilterCols"
          [rows]="dgRows"
          rowId="name"
          quickFilterable
          [(quickFilter)]="dgQuickFilter"
          [(filters)]="dgFilters"
        >
          <ng-template strctCell="status" let-value="value">
            <strct-badge [status]="badgeFor(value)">{{ value }}</strct-badge>
          </ng-template>
        </strct-datagrid>
        <span class="echo">quick: “{{ dgQuickFilter() }}” · filters: {{ dgFilters() | json }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-tree"
      owner="datagrid"
      heading="Tree grid"
      description="childrenKey renders hierarchical rows with indentation and carets — the vCenter inventory shape. Sorting applies per sibling level; a text filter shows matches with their ancestors force-expanded."
      code='<strct-datagrid [columns]="cols" [rows]="tree" childrenKey="children" rowId="name" />'
    >
      <strct-datagrid
        style="width: 100%;"
        [columns]="dgTreeCols"
        [rows]="dgTreeRows"
        childrenKey="children"
        rowId="name"
      >
        <ng-template strctCell="status" let-value="value">
          <strct-badge [status]="badgeFor(value)">{{ value }}</strct-badge>
        </ng-template>
      </strct-datagrid>
    </app-demo>

    <app-demo
      anchor="datagrid-editing"
      owner="datagrid"
      heading="Inline cell editing"
      description="editable columns open an input on double-click; Enter or blur commit through (cellEdit) — Escape cancels. The grid never mutates your rows: apply the change and pass the array back, so your store stays the single source of truth."
      code='<strct-datagrid [columns]="cols" [rows]="rows()" (cellEdit)="apply($event)" />'
    >
      <div class="dg-wrap">
        <strct-datagrid
          style="width: 100%;"
          [columns]="dgEditCols"
          [rows]="dgEditRows()"
          rowId="name"
          (cellEdit)="onCellEdit($event)"
        />
        <span class="echo">{{ dgEditLast() || 'double-click a CPU / Memory cell' }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-editors"
      owner="datagrid"
      heading="Select and number editors"
      description='Rows of structured settings — firewall rules, service bindings — are edited in the grid. A column whose value is one of a set gets editor: "select" over editorOptions: the cell reads as the option&apos;s label at rest, opens strct-select on double-click, and choosing is the commit. editor: "number" opens strct-number with editorMin / editorMax / editorStep, committing on Enter or blur. (cellEdit) still carries value as text, and typedValue as the number or the option&apos;s value.'
      code='{ key: "proto", label: "Protocol", editable: true, editor: "select",&#10;  editorOptions: [{ value: "tcp", label: "TCP" }, { value: "udp", label: "UDP" }] }'
    >
      <div class="dg-wrap">
        <strct-datagrid
          style="width: 100%;"
          [columns]="fwCols"
          [rows]="fwRows()"
          rowId="id"
          (cellEdit)="onRuleEdit($event)"
        />
        <span class="echo">{{ fwLast() || 'double-click a Protocol, Port or Action cell' }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-presentation"
      owner="datagrid"
      heading="The look of a cell is column metadata"
      description="A GUID column is monospace, a counter is right-aligned with tabular figures, an unread value is an em dash in --t3, and a name can carry a muted hint under it. Those are column flags — mono, muted, numeric, emptyText (with emptyLabel for what assistive tech should hear instead of the glyph) and descriptionKey — not four cell templates. caption gives the grid its own title and names it for assistive tech, and flush drops the outer border, radius and shadow for a grid inside a panel that already has them, instead of a stylesheet reaching into .strct-dg-host."
      code='{ key: "guid", label: "GUID", mono: true, emptyText: "—", emptyLabel: "not read" }'
    >
      <div
        class="dg-wrap"
        style="border: 1px solid var(--b2); border-radius: var(--radius-lg); background: var(--bg-2);"
      >
        <strct-datagrid
          style="width: 100%;"
          caption="Recent tasks"
          flush
          [columns]="taskCols"
          [rows]="taskRows"
          rowId="id"
          [pageSize]="0"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="datagrid-loadmore"
      owner="datagrid"
      heading="Cursor paging"
      description='A feed that pages by cursor loads more at the end — an event log, an audit trail. lazy speaks page numbers, which a cursor API cannot answer, so paging="more" swaps the pager for a count and a Load more button: (loadMore) asks for the next slice, loadingMore puts a spinner in the button while it arrives, hasMore drops the button at the end, and the consumer appends the rows. moreTotal fills in “of 812” when the API knows the total.'
      code='<strct-datagrid paging="more" [hasMore]="hasMore()" [loadingMore]="busy()" [moreTotal]="812" (loadMore)="next()" />'
    >
      <div class="dg-wrap">
        <strct-datagrid
          style="width: 100%;"
          [columns]="eventCols"
          [rows]="eventRows()"
          rowId="id"
          paging="more"
          [hasMore]="eventsHasMore()"
          [loadingMore]="eventsLoading()"
          [moreTotal]="24"
          (loadMore)="loadMoreEvents()"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="detailpane"
      heading="Detail pane"
      description="A different pattern from expandable rows: click the » button to collapse the grid to a single column and open a side pane with that row's details (the » keeps row cells free to select/copy). Click it again or the × to return."
      code='<strct-datagrid [columns]="cols" [rows]="rows" detailPane>…</strct-datagrid>'
    >
      <strct-datagrid
        style="width: 100%;"
        [columns]="dgCols"
        [rows]="dgRows"
        detailPane
        [pageSize]="6"
      >
        <ng-template strctRowDetail let-row>
          <strct-stack style="max-width: 340px;">
            <strct-stack-item label="Cluster">{{ row['name'] }}</strct-stack-item>
            <strct-stack-item label="Type">{{ row['type'] }}</strct-stack-item>
            <strct-stack-item label="Hosts">{{ row['hosts'] }}</strct-stack-item>
            <strct-stack-item label="Status">{{ row['status'] }}</strct-stack-item>
          </strct-stack>
        </ng-template>
      </strct-datagrid>
    </app-demo>

    <app-demo
      anchor="timeline"
      heading="Timeline"
      description="A vertical sequence of events, each with a state."
    >
      <strct-timeline>
        <strct-timeline-item title="Deployed to production" state="success">
          v1.4.0 shipped at 09:24.
        </strct-timeline-item>
        <strct-timeline-item title="Running smoke tests" state="current">
          14 of 20 checks passed.
        </strct-timeline-item>
        <strct-timeline-item title="Awaiting approval" state="warning">
          Needs a second reviewer.
        </strct-timeline-item>
        <strct-timeline-item title="Build queued">
          Scheduled behind 2 other jobs.
        </strct-timeline-item>
      </strct-timeline>
    </app-demo>

    <app-demo
      anchor="steps"
      heading="Steps"
      description="A process the user watches rather than drives: an update run per host, or a numbered method on a landing page. A wizard's rail is the wrong control — the user did not start each step and cannot go back to one — and a timeline implies history; neither can say “skipped” or “blocked”. The states are done, active, failed, blocked, skipped and pending, each with its own tone, and each said in words for assistive tech (“Install, in progress”). The active step pulses its own edge, and holds still under prefers-reduced-motion. pills is the default, dots fits a long run in a dense row, and cards is the numbered method with a description and a per-step action."
      code='<strct-steps [steps]="run" appearance="pills" dense />'
    >
      <div class="stack" style="gap: 20px; width: 100%;">
        <strct-steps [steps]="runSteps" />
        <strct-steps [steps]="runSteps" appearance="dots" />
        <strct-steps [steps]="runSteps" numbered dense orientation="vertical" />
        <strct-steps [steps]="methodSteps" appearance="cards">
          <ng-template strctStepAction let-step>
            <button strct-button size="sm" variant="flat" (click)="stepEcho.set(step.label)">
              Run
            </button>
          </ng-template>
        </strct-steps>
        <span class="echo">{{
          stepEcho() ? 'ran ' + stepEcho() : 'each card carries its own action'
        }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="change"
      heading="Change"
      description="An upgrade or an edit states what changes as “from → to”: the old value muted, the arrow the library's, the new one emphasised. Assistive tech hears a sentence — “from v10.27 to v10.28” — rather than an arrow glyph, and label makes that sentence localisable."
      code='<strct-change from="v10.27" to="v10.28" mono />'
    >
      <div class="stack">
        <strct-change from="v10.27" to="v10.28" mono />
        <strct-change from="26100.4351" to="26100.4652" mono />
        <strct-change from="Maintenance" to="In service" />
      </div>
    </app-demo>

    <app-demo
      anchor="stack"
      heading="Stack view"
      description="A read-only key/value definition list."
    >
      <strct-stack style="width: 100%; max-width: 420px;">
        <strct-stack-item label="Service">api-gateway</strct-stack-item>
        <strct-stack-item label="Region">eu-west</strct-stack-item>
        <strct-stack-item label="Replicas">4</strct-stack-item>
        <strct-stack-item label="Status">Running</strct-stack-item>
        <strct-stack-item label="Last deploy">Jun 3, 2026 · 09:24</strct-stack-item>
      </strct-stack>
    </app-demo>

    <app-demo
      anchor="reorder"
      heading="Reorder"
      description="A list drag-reorder primitive: the container emits (reordered) {from,to} and you own the array move — drag rows, or focus one and press Alt+↑/↓. Powers priority lists, boot orders, pipeline steps."
      code='<ul strctReorder (reordered)="move($event)">@for … <li strctReorderItem>…</li>}</ul>'
    >
      <div class="dg-wrap">
        <ul class="ro-list" strctReorder (reordered)="roMove($event)">
          @for (step of roSteps(); track step) {
            <li class="ro-item" strctReorderItem>
              <strct-icon name="dragHandle" [size]="13" />
              {{ step }}
            </li>
          }
        </ul>
        <span class="echo">boot order: {{ roSteps().join(' → ') }}</span>
        <div style="margin-top: 14px">
          <p class="strct-text-hint" style="margin: 0 0 6px">
            The same list with [reorderDisabled] — display only: no tab stop, no "sortable"
            announcement, no drag.
          </p>
          <ul class="ro-list" strctReorder reorderDisabled>
            @for (step of roSteps(); track step) {
              <li class="ro-item ro-item--static" strctReorderItem>
                <strct-icon name="dragHandle" [size]="13" />
                {{ step }}
              </li>
            }
          </ul>
        </div>
      </div>
    </app-demo>
    <app-demo
      anchor="reorder-board"
      owner="reorder"
      heading="Two columns, moved by their handle"
      description="A dashboard's cards move within a column and between columns. [strctReorderGroup] connects the lists and emits (moved) with { item, fromList, toList, fromIndex, toIndex }; when an item contains a [strctReorderHandle], only the handle starts a drag, so text selection and a chart brush inside the card stay safe. From the keyboard, Alt+ArrowUp / Alt+ArrowDown move within a column and Alt+ArrowLeft / Alt+ArrowRight move to the neighbouring one at the same index — and every move is announced with the column's name. A single list is unchanged."
      code='<div strctReorderGroup (moved)="onMove($event)">&#10;  <div strctReorder listId="left">…<span strctReorderHandle></span>…</div>&#10;  <div strctReorder listId="right">…</div>&#10;</div>'
    >
      <div class="stack" style="width: 100%;">
        <div strctReorderGroup (moved)="onBoardMove($event)" class="board">
          @for (col of ['left', 'right']; track col) {
            <div strctReorder [listId]="col" class="board__col">
              <span class="board__head">{{ col === 'left' ? 'Column 1' : 'Column 2' }}</span>
              @for (c of boardCards()[col]; track c) {
                <div strctReorderItem class="board__card">
                  <span strctReorderHandle class="board__grip" aria-hidden="true"></span>
                  {{ c }}
                </div>
              }
            </div>
          }
        </div>
        <span class="echo">{{ boardEcho() || 'drag a card by its grip, or press Alt+→' }}</span>
      </div>
    </app-demo>
  `,
  styles: [
    `
      .board {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        width: 100%;
        max-width: 520px;
      }
      .board__col {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-2);
        border: 1px dashed var(--b2);
        border-radius: var(--radius-md);
        min-height: 120px;
      }
      .board__head {
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .board__card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        background: var(--bg-1);
        font-size: 13px;
      }
      .board__card:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .board__grip {
        width: 8px;
        height: 16px;
        flex: none;
        cursor: grab;
        background: radial-gradient(circle, var(--t3) 1px, transparent 1px) 0 0 / 4px 4px;
      }
      .dg-cpu {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dg-cpu strct-progress {
        flex: 1;
        min-width: 56px;
      }
      .dg-cpu__pct {
        font-family: var(--mono);
        font-size: 11px;
        color: var(--t3);
        min-width: 30px;
        text-align: end;
      }

      .ro-list {
        list-style: none;
        margin: 0;
        padding: 0;
        max-width: 300px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .ro-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border: 1px solid var(--b2);
        border-radius: 7px;
        background: var(--bg-2);
        color: var(--t1);
        font-size: 12.5px;
      }
      .ro-item--static {
        opacity: 0.85;
      }
      .ro-item:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
    `,
    `
      .echo {
        font-size: 12px;
        color: var(--t2);
        font-family: var(--mono);
      }
      .dl-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 14px 32px;
        width: 100%;
      }
      .dl-strip {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--b1);
      }
      .dg-wrap {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        align-items: flex-start;
      }
      .dg-wrap strct-toolbar {
        width: 100%;
      }
      .dot-row {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 12.5px;
        color: var(--t2);
      }
    `,
  ],
})
export class DataPage {
  // FR-48-36 — a board whose cards move between two columns.
  protected readonly boardCards = signal<Record<string, string[]>>({
    left: ['Capacity', 'Alarms', 'Recent tasks'],
    right: ['Storage'],
  });
  protected readonly boardEcho = signal('');
  protected onBoardMove(e: StrctReorderMoveEvent): void {
    this.boardCards.update((cols) => {
      const from = [...cols[e.fromList]];
      const [card] = from.splice(e.fromIndex, 1);
      const to = [...cols[e.toList]];
      to.splice(e.toIndex, 0, card);
      return { ...cols, [e.fromList]: from, [e.toList]: to };
    });
    this.boardEcho.set(`moved to ${e.toList}, position ${e.toIndex + 1}`);
  }

  // FR-48-30 — a remediation run, and the three-step method.
  protected readonly runSteps: StrctStepState[] = [
    { id: 'check', label: 'Check', state: 'done' },
    { id: 'download', label: 'Download', state: 'done' },
    { id: 'maint', label: 'Maintenance', state: 'skipped', description: 'Host already drained' },
    { id: 'install', label: 'Install', state: 'active' },
    { id: 'restart', label: 'Restart', state: 'pending' },
    { id: 'verify', label: 'Verify', state: 'blocked', description: 'Waiting for the next window' },
    { id: 'back', label: 'Back in service', state: 'pending' },
  ];
  protected readonly methodSteps: StrctStepState[] = [
    {
      id: 'baseline',
      label: 'Baseline',
      state: 'done',
      description: 'Capture what is installed on every host.',
    },
    {
      id: 'check',
      label: 'Check',
      state: 'active',
      description: 'Compare the estate against the catalogue.',
    },
    {
      id: 'remediate',
      label: 'Remediate',
      state: 'pending',
      description: 'Roll the updates out, one host at a time.',
    },
  ];
  protected readonly stepEcho = signal('');

  // FR-48-26 — a borderless grid inside a panel, with column presentation.
  protected readonly taskCols: StrctDatagridColumn[] = [
    { key: 'task', label: 'Task', descriptionKey: 'target' },
    { key: 'id', label: 'Task ID', mono: true, emptyText: '—', emptyLabel: 'not assigned' },
    { key: 'retries', label: 'Retries', numeric: true },
    { key: 'started', label: 'Started', muted: true },
  ];
  protected readonly taskRows: StrctRow[] = [
    {
      task: 'Deploy VM',
      target: 'web-07 · Cluster-A',
      id: 'b3f1a7',
      retries: 0,
      started: '2 min ago',
    },
    { task: 'Apply updates', target: 'hv-02.dc-west', id: '', retries: 3, started: '11 min ago' },
    {
      task: 'Rebalance storage',
      target: 'ds-prod-01',
      id: '9c02de',
      retries: 12,
      started: '1 h ago',
    },
  ];

  // FR-48-27 — an event feed that pages by cursor.
  protected readonly eventCols: StrctDatagridColumn[] = [
    { key: 'when', label: 'When', muted: true },
    { key: 'event', label: 'Event' },
    { key: 'actor', label: 'Actor', mono: true },
  ];
  private readonly allEvents: StrctRow[] = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    when: `${i + 1} min ago`,
    event: ['Signed in', 'Snapshot taken', 'Policy changed', 'Host entered maintenance'][i % 4],
    actor: ['admin', 'svc-backup', 'operator'][i % 3],
  }));
  protected readonly eventRows = signal<StrctRow[]>(this.allEvents.slice(0, 6));
  protected readonly eventsLoading = signal(false);
  protected readonly eventsHasMore = computed(
    () => this.eventRows().length < this.allEvents.length,
  );
  protected loadMoreEvents(): void {
    this.eventsLoading.set(true);
    setTimeout(() => {
      this.eventRows.update((rows) => this.allEvents.slice(0, rows.length + 6));
      this.eventsLoading.set(false);
    }, 600);
  }

  // FR-48-19 — the states of one live view.
  protected readonly liveStates: StrctLiveState[] = [
    'live',
    'connecting',
    'reconnecting',
    'paused',
    'stale',
  ];
  protected readonly liveState = signal<StrctLiveState>('live');
  protected readonly lastRead = Date.now() - 3 * 60_000;

  protected readonly roSteps = signal(['disk', 'network (PXE)', 'optical', 'usb']);
  protected roMove(e: StrctReorderEvent): void {
    this.roSteps.update((list) => {
      const next = [...list];
      next.splice(e.to, 0, ...next.splice(e.from, 1));
      return next;
    });
  }

  protected readonly dense = signal(false);
  protected readonly oneLine = signal(true);

  // Toolbar demo: a simulated row selection driving the selection chip.
  protected readonly tbSelected = signal(0);
  protected readonly tbEcho = signal('no selection');
  protected tbSimulate(): void {
    this.tbSelected.set(3);
    this.tbEcho.set('3 rows selected');
  }
  protected tbClear(): void {
    this.tbSelected.set(0);
    this.tbEcho.set('selection cleared');
  }

  // Code demo
  protected readonly cloudInit = `#cloud-config
hostname: hv-02
users:
  - name: ops
    groups: [sudo]
    ssh_authorized_keys:
      - ssh-ed25519 AAAA...ops@bastion
package_update: true
packages: [qemu-guest-agent, chrony]
runcmd:
  - systemctl enable --now qemu-guest-agent`;
  protected readonly renderedCfg = `[datastore]
name = ssd-01
policy = raid1
capacity_gb = 4096

[network]
vlan = 120
mtu = 9000`;

  // One-line CSR: the wrap demo's worst case — no spaces for 300+ chars.
  protected readonly csrLine =
    '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';

  // Filter bar demo
  protected readonly fbQuery = signal('');
  protected readonly fbChips = signal<StrctFilterChip[]>([
    { id: 'state', label: 'state: running' },
    { id: 'zone', label: 'zone: eu-1' },
    { id: 'cluster', label: 'cluster: prod' },
  ]);
  protected readonly fbCount = computed(() => 42 - this.fbChips().length * 9);
  protected fbRemove(chip: StrctFilterChip): void {
    this.fbChips.update((list) => list.filter((c) => c.id !== chip.id));
  }
  protected readonly grouped = signal(true);

  // Virtual scroll demo: a 20k-row inventory.
  protected readonly vCols: StrctDatagridColumn[] = [
    { key: 'host', label: 'Host', sticky: true, width: '150px', sortable: true },
    { key: 'cluster', label: 'Cluster', sortable: true },
    { key: 'cpu', label: 'CPU %', align: 'end', sortable: true },
    { key: 'mem', label: 'Memory %', align: 'end', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    { key: 'zone', label: 'Zone' },
    { key: 'kernel', label: 'Kernel' },
  ];
  protected readonly vRows = Array.from({ length: 20000 }, (_, i) => ({
    id: i,
    host: `hv-${String(i).padStart(5, '0')}`,
    cluster: `cluster-${(i % 40) + 1}`,
    cpu: Math.round(20 + 70 * Math.abs(Math.sin(i / 7))),
    mem: Math.round(30 + 60 * Math.abs(Math.cos(i / 11))),
    state: i % 13 === 0 ? 'maintenance' : i % 7 === 0 ? 'degraded' : 'running',
    zone: `zone-${(i % 6) + 1}`,
    kernel: `5.14.0-${300 + (i % 90)}`,
  }));

  // Lazy demo: a fake 500-row "server" answering with latency.
  protected readonly lzCols: StrctDatagridColumn[] = [
    { key: 'id', label: '#', align: 'end', width: '64px' },
    { key: 'vm', label: 'VM', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'vcpus', label: 'vCPUs', align: 'end', sortable: true },
  ];
  private readonly lzAll = Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    vm: `vm-${String(i + 1).padStart(3, '0')}`,
    owner: ['ops', 'dev', 'qa', 'sec'][i % 4],
    vcpus: 2 + (i % 7),
  }));
  protected readonly lzRows = signal<StrctRow[]>([]);
  protected readonly lzLoading = signal(false);
  protected readonly lzEcho = signal('bekleniyor…');
  protected onLazyLoad(state: StrctDatagridLazyState): void {
    this.lzLoading.set(true);
    this.lzEcho.set(
      `istek: sayfa ${state.page} · sıralama ${state.sortKey ?? '—'} ${state.sortKey ? state.sortDir : ''}`,
    );
    setTimeout(() => {
      const data = [...this.lzAll];
      if (state.sortKey) {
        const k = state.sortKey;
        const sign = state.sortDir === 'asc' ? 1 : -1;
        data.sort((a, b) => {
          const av = a[k as keyof typeof a];
          const bv = b[k as keyof typeof b];
          return sign * String(av).localeCompare(String(bv), undefined, { numeric: true });
        });
      }
      const start = (state.page - 1) * state.pageSize;
      this.lzRows.set(data.slice(start, start + state.pageSize));
      this.lzLoading.set(false);
    }, 300);
  }

  // Single-line demo: one column carries a deliberately long value.
  protected readonly slCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Alarm' },
    { key: 'object', label: 'Object' },
    { key: 'description', label: 'Description' },
  ];
  protected readonly slRows = [
    {
      name: 'Datastore usage',
      object: 'datastore-a',
      description:
        'Usage on disk exceeded the warning threshold of 75% — consider migrating one of the powered-off virtual machines to another datastore or expanding the backing volume to restore headroom.',
    },
    {
      name: 'Host connection',
      object: 'hv-02',
      description: 'Host connection and power state changed to Not responding.',
    },
    {
      name: 'vCPU contention',
      object: 'vm-web-14',
      description:
        'Ready time above 12% sustained for 15 minutes — the virtual machine is starved for CPU; rebalance the cluster or reduce the vCPU count of oversized neighbours.',
    },
  ];
  protected readonly refreshing = signal(false);

  protected onRefresh(): void {
    this.refreshing.set(true);
    setTimeout(() => this.refreshing.set(false), 1500);
  }

  protected badgeFor(status: unknown): StrctBadgeStatus {
    switch (status) {
      case 'Running':
        return 'success';
      case 'Degraded':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  protected readonly cols: StrctColumn[] = [
    { key: 'name', label: 'Cluster' },
    { key: 'type', label: 'Type' },
    { key: 'hosts', label: 'Hosts', align: 'end' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly rows: StrctRow[] = [
    { name: 'Production Cluster', type: 'Failover', hosts: 8, cpu: 93, status: 'Running' },
    { name: 'DR Cluster', type: 'Failover', hosts: 4, cpu: 37, status: 'Running' },
    { name: 'Edge Cluster', type: 'Standard', hosts: 3, cpu: 31, status: 'Degraded' },
    { name: 'Dev Cluster', type: 'Standard', hosts: 2, cpu: 24, status: 'Running' },
  ];

  protected readonly selectedAlarm = signal('Datastore latency');
  protected readonly alarmRows: {
    severity: string;
    name: string;
    object: string;
    when: string;
    tone: 'critical' | 'warning' | 'accent';
  }[] = [
    {
      severity: 'Critical',
      name: 'Datastore latency',
      object: 'ds-prod-01',
      when: '2 min ago',
      tone: 'critical',
    },
    {
      severity: 'Warning',
      name: 'Memory pressure',
      object: 'hv-04.dc-west',
      when: '11 min ago',
      tone: 'warning',
    },
    {
      severity: 'Info',
      name: 'Snapshot chain long',
      object: 'sql-vm-02',
      when: '1 h ago',
      tone: 'accent',
    },
  ];
  /** Rows that carry a sentence — FR-49-01's case. */
  protected readonly findingRows = [
    {
      title: 'hv-02 cannot enter maintenance',
      detail:
        'Three VMs have a CD-ROM attached to a datastore that hv-03 cannot see, so they cannot be migrated there.',
      when: '2 min ago',
      tone: 'warning' as const,
    },
    {
      title: 'Datastore ds-prod-01 is 92% full',
      detail: 'At the current growth rate it reaches its limit in about 9 days.',
      when: '18 min ago',
      tone: 'critical' as const,
    },
  ];

  protected readonly memberRows = ['hv-01.dc-west', 'hv-02.dc-west', 'hv-03.dc-west'];

  // FR-48-01: a "choose one target" grid, with a row that cannot be chosen.
  protected readonly pickCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Host', sortable: true },
    { key: 'pool', label: 'Pool', sortable: true },
    { key: 'agent', label: 'Agent' },
  ];
  protected readonly pickRows: StrctRow[] = [
    { id: 'h1', name: 'hv-01.dc-west', pool: 'Production', agent: '4.4.1' },
    { id: 'h2', name: 'hv-02.dc-west', pool: 'Production', agent: '3.9.0' },
    { id: 'h3', name: 'hv-03.dc-west', pool: 'Production', agent: '4.4.1' },
    { id: 'h4', name: 'hv-07.edge', pool: 'Edge', agent: '4.4.0' },
  ];
  protected readonly pickedHost = signal<unknown>('h1');
  protected readonly pickedGroup = signal(0);
  /** A host with an old agent cannot receive a deployment — and says so. */
  protected readonly canDeploy = (row: StrctRow): boolean | string =>
    String(row['agent']).startsWith('4.') ? true : 'Agent too old to deploy';

  protected readonly dgCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Cluster', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'hosts', label: 'Hosts', sortable: true, align: 'end' },
    // FR-47-01 regression case: a progress bar inside a row, where the track
    // used to be the same colour as the row's ground in the dark theme.
    { key: 'cpu', label: 'CPU', sortable: true, width: '140px' },
    { key: 'status', label: 'Status', sortable: true },
  ];

  protected cpuStatus(v: number): 'accent' | 'warning' | 'critical' {
    return v >= 90 ? 'critical' : v >= 70 ? 'warning' : 'accent';
  }

  /** Seeds [initialSelection] — the rows the picker opens with already checked. */
  protected readonly preChecked = ['Production Cluster', 'DR Cluster'];

  protected readonly dgRows: StrctRow[] = [
    { name: 'Production Cluster', type: 'Failover', hosts: 8, cpu: 93, status: 'Running' },
    { name: 'DR Cluster', type: 'Failover', hosts: 4, cpu: 37, status: 'Running' },
    { name: 'Edge Cluster', type: 'Standard', hosts: 3, cpu: 31, status: 'Degraded' },
    { name: 'Dev Cluster', type: 'Standard', hosts: 2, cpu: 24, status: 'Running' },
    { name: 'Staging Cluster', type: 'Failover', hosts: 3, cpu: 52, status: 'Running' },
    { name: 'Backup Cluster', type: 'Standard', hosts: 2, cpu: 45, status: 'Idle' },
    { name: 'Analytics Cluster', type: 'Failover', hosts: 6, cpu: 66, status: 'Running' },
    { name: 'Test Cluster', type: 'Standard', hosts: 1, cpu: 31, status: 'Degraded' },
    { name: 'AI Training Cluster', type: 'Failover', hosts: 12, cpu: 80, status: 'Running' },
    { name: 'Observability Cluster', type: 'Standard', hosts: 2, cpu: 24, status: 'Running' },
    { name: 'Archive Cluster', type: 'Standard', hosts: 2, cpu: 52, status: 'Idle' },
    { name: 'Management Cluster', type: 'Failover', hosts: 4, cpu: 73, status: 'Running' },
  ];

  // Column filters demo
  protected readonly dgFilterCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Cluster', sortable: true, filterable: true },
    { key: 'type', label: 'Type', sortable: true, filterOptions: ['Failover', 'Standard'] },
    { key: 'hosts', label: 'Hosts', sortable: true, align: 'end' },
    { key: 'status', label: 'Status', filterOptions: ['Running', 'Degraded', 'Idle'] },
  ];
  protected readonly dgFilters = signal<StrctDatagridFilters>({});
  protected readonly dgQuickFilter = signal('');

  // Tree grid demo — the vCenter inventory shape.
  protected readonly dgTreeCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Inventory', sortable: true },
    { key: 'kind', label: 'Kind' },
    { key: 'status', label: 'Status' },
  ];
  protected readonly dgTreeRows: StrctRow[] = [
    {
      name: 'dc-east',
      kind: 'Datacenter',
      status: 'Running',
      children: [
        {
          name: 'cluster-01',
          kind: 'Cluster',
          status: 'Running',
          children: [
            {
              name: 'hv-01',
              kind: 'Host',
              status: 'Running',
              children: [
                { name: 'web-01', kind: 'VM', status: 'Running' },
                { name: 'web-02', kind: 'VM', status: 'Running' },
              ],
            },
            {
              name: 'hv-02',
              kind: 'Host',
              status: 'Degraded',
              children: [{ name: 'db-primary', kind: 'VM', status: 'Running' }],
            },
          ],
        },
        { name: 'cluster-02', kind: 'Cluster', status: 'Idle', children: [] },
      ],
    },
    { name: 'dc-west', kind: 'Datacenter', status: 'Idle', children: [] },
  ];

  // FR-48-08 — a rule list edited in the grid: a set of values is chosen, a
  // port is a number with bounds.
  protected readonly fwCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Rule' },
    {
      key: 'proto',
      label: 'Protocol',
      editable: true,
      editor: 'select',
      editorOptions: [
        { value: 'tcp', label: 'TCP' },
        { value: 'udp', label: 'UDP' },
        { value: 'icmp', label: 'ICMP' },
      ],
    },
    {
      key: 'port',
      label: 'Port',
      editable: true,
      editor: 'number',
      editorMin: 1,
      editorMax: 65535,
      align: 'end',
    },
    {
      key: 'action',
      label: 'Action',
      editable: true,
      editor: 'select',
      editorOptions: [
        { value: 'allow', label: 'Allow' },
        { value: 'drop', label: 'Drop' },
        { value: 'reject', label: 'Reject' },
      ],
    },
  ];
  protected readonly fwRows = signal<StrctRow[]>([
    { id: 'r1', name: 'SSH from jump host', proto: 'tcp', port: 22, action: 'allow' },
    { id: 'r2', name: 'DNS out', proto: 'udp', port: 53, action: 'allow' },
    { id: 'r3', name: 'Legacy RPC', proto: 'tcp', port: 135, action: 'drop' },
  ]);
  protected readonly fwLast = signal('');
  protected onRuleEdit(e: {
    row: StrctRow;
    column: StrctDatagridColumn;
    value: string;
    typedValue: unknown;
    previous: unknown;
  }): void {
    this.fwRows.update((rows) =>
      rows.map((r) => (r === e.row ? { ...r, [e.column.key]: e.typedValue } : r)),
    );
    const label = (v: unknown) =>
      String(e.column.editorOptions?.find((o) => o.value === v)?.label ?? v);
    this.fwLast.set(
      `${String(e.row['name'])}: ${e.column.label} ${label(e.previous)} \u2192 ${label(e.typedValue)}`,
    );
  }

  // Inline editing demo — the consumer owns the data.
  protected readonly dgEditCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'VM' },
    { key: 'cpu', label: 'vCPU', editable: true, align: 'end' },
    { key: 'mem', label: 'Memory (GiB)', editable: true, align: 'end' },
  ];
  protected readonly dgEditRows = signal<StrctRow[]>([
    { name: 'web-01', cpu: 4, mem: 16 },
    { name: 'web-02', cpu: 4, mem: 16 },
    { name: 'db-primary', cpu: 8, mem: 64 },
  ]);
  protected readonly dgEditLast = signal('');
  protected onCellEdit(e: {
    row: StrctRow;
    column: StrctDatagridColumn;
    value: string;
    typedValue: unknown;
    previous: unknown;
  }): void {
    this.dgEditRows.update((rows) =>
      rows.map((r) => (r === e.row ? { ...r, [e.column.key]: e.value } : r)),
    );
    this.dgEditLast.set(
      `${String(e.row['name'])}: ${e.column.label} ${String(e.previous)} \u2192 ${e.value}`,
    );
  }
}
