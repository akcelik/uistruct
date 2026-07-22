import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  StrctBadge,
  StrctBadgeStatus,
  StrctButton,
  StrctCellDef,
  StrctCheckbox,
  StrctColumn,
  StrctDatagrid,
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
  StrctTable,
  StrctTimeline,
  StrctTimelineItem,
  StrctCode,
  StrctFilterBar,
  StrctFilterChip,
  StrctReorder,
  StrctReorderItem,
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
    StrctIcon,
    StrctButton,
    StrctCheckbox,
    StrctTimeline,
    StrctTimelineItem,
    StrctStack,
    StrctStackItem,
    StrctDescriptionList,
    StrctDesc,
    StrctCode,
    StrctFilterBar,
    StrctReorder,
    StrctReorderItem,
  ],
  template: `
    <app-page-header title="Data" subtitle="Declarative, token-styled data display." />

    <app-demo
      anchor="description-list"
      heading="Description list"
      description="Aligned label → value pairs. Project strct-desc so a value can host a badge; or pass plain pairs via items. The inline variant is a horizontal stat strip."
      code='<strct-description-list><strct-desc label="IPv4" mono>172.16.75.100/24</strct-desc></strct-description-list>'
    >
      <div class="dl-grid">
        <strct-description-list>
          <strct-desc label="IPv4" mono>172.16.75.100/24</strct-desc>
          <strct-desc label="Gateway" mono>172.16.75.2</strct-desc>
          <strct-desc label="IPv6"><strct-badge status="success">Enabled</strct-badge></strct-desc>
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
        <strct-desc label="Access · VIP"
          ><strct-badge status="accent" solid>172.16.75.250</strct-badge></strct-desc
        >
        <strct-desc label="Viewing"
          ><strct-badge status="neutral">hyperstruct01</strct-badge></strct-desc
        >
      </strct-description-list>
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
      anchor="datagrid-singleline"
      owner="datagrid"
      heading="Single-line rows"
      description="By default cells wrap, so a long value can make one row much taller than the rest. Enable singleLine to keep every row exactly one line tall — long values truncate with an ellipsis and the grid's rhythm stays intact."
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
      </div>
    </app-demo>
  `,
  styles: [
    `
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
        cursor: grab;
      }
      .ro-item.strct-reorder--dragging {
        opacity: 0.5;
      }
      .ro-item.strct-reorder--over {
        border-color: var(--acc);
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
    `,
  ],
})
export class DataPage {
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
    { name: 'Production Cluster', type: 'Failover', hosts: 8, status: 'Running' },
    { name: 'DR Cluster', type: 'Failover', hosts: 4, status: 'Running' },
    { name: 'Edge Cluster', type: 'Standard', hosts: 3, status: 'Degraded' },
    { name: 'Dev Cluster', type: 'Standard', hosts: 2, status: 'Running' },
  ];

  protected readonly dgCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Cluster', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'hosts', label: 'Hosts', sortable: true, align: 'end' },
    { key: 'status', label: 'Status', sortable: true },
  ];

  /** Seeds [initialSelection] — the rows the picker opens with already checked. */
  protected readonly preChecked = ['Production Cluster', 'DR Cluster'];

  protected readonly dgRows: StrctRow[] = [
    { name: 'Production Cluster', type: 'Failover', hosts: 8, status: 'Running' },
    { name: 'DR Cluster', type: 'Failover', hosts: 4, status: 'Running' },
    { name: 'Edge Cluster', type: 'Standard', hosts: 3, status: 'Degraded' },
    { name: 'Dev Cluster', type: 'Standard', hosts: 2, status: 'Running' },
    { name: 'Staging Cluster', type: 'Failover', hosts: 3, status: 'Running' },
    { name: 'Backup Cluster', type: 'Standard', hosts: 2, status: 'Idle' },
    { name: 'Analytics Cluster', type: 'Failover', hosts: 6, status: 'Running' },
    { name: 'Test Cluster', type: 'Standard', hosts: 1, status: 'Degraded' },
    { name: 'AI Training Cluster', type: 'Failover', hosts: 12, status: 'Running' },
    { name: 'Observability Cluster', type: 'Standard', hosts: 2, status: 'Running' },
    { name: 'Archive Cluster', type: 'Standard', hosts: 2, status: 'Idle' },
    { name: 'Management Cluster', type: 'Failover', hosts: 4, status: 'Running' },
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
