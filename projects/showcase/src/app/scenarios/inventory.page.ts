import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctBadge,
  StrctBadgeStatus,
  StrctButton,
  StrctCellDef,
  StrctDatagrid,
  StrctDatagridActionBar,
  StrctDatagridColumn,
  StrctIcon,
  StrctInput,
  StrctMenuItem,
  StrctProgress,
  StrctRow,
  StrctRowDetailDef,
  StrctStack,
  StrctStackItem,
} from 'strct';

/**
 * Scenario: an infrastructure inventory grid that exercises the datagrid in full
 * — sortable/resizable columns, column chooser, sync, a live filter, row
 * selection with batch actions, templated status/usage cells, a per-row actions
 * dropdown, and an expandable detail row.
 */
@Component({
  selector: 'app-inventory-scenario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    StrctDatagrid,
    StrctDatagridActionBar,
    StrctRowDetailDef,
    StrctCellDef,
    StrctBadge,
    StrctProgress,
    StrctIcon,
    StrctButton,
    StrctInput,
    StrctStack,
    StrctStackItem,
  ],
  template: `
    <header class="inv__head">
      <div>
        <h1 class="inv__title">Inventory</h1>
        <p class="inv__sub">Hosts &amp; virtual machines across all clusters</p>
      </div>
      @if (lastAction()) {
        <strct-badge status="accent">{{ lastAction() }}</strct-badge>
      }
    </header>

    <strct-datagrid
      [columns]="cols"
      [rows]="rows()"
      rowId="id"
      selectable
      expandable
      resizable
      columnChooser
      sync
      [pageSize]="8"
      [rowActions]="rowMenu"
      (selectionChange)="selected.set($event.length)"
      (syncChange)="onSync()"
      (rowAction)="onRowAction($event)"
    >
      <!-- Persistent toolbar — filter + count, with batch actions on selection -->
      <div strctDatagridActionBar class="inv__toolbar">
        <input
          strctInput
          class="inv__filter"
          type="search"
          placeholder="Filter by name, type or cluster…"
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
        />
        <span class="inv__count"
          >{{ rows().length }} objects
          @if (selected()) {
            · {{ selected() }} selected
          }
        </span>
        <span class="grow"></span>
        @if (selected()) {
          <button strct-button size="sm" (click)="batch('Migrate')">
            <strct-icon name="sync" [size]="14" /> Migrate
          </button>
          <button strct-button size="sm" (click)="batch('Enter maintenance')">
            <strct-icon name="maintenance" [size]="14" /> Maintenance
          </button>
          <button strct-button variant="critical" size="sm" (click)="batch('Decommission')">
            <strct-icon name="close" [size]="14" /> Decommission
          </button>
        } @else {
          <button strct-button variant="primary" solid size="sm">
            <strct-icon name="host" [size]="14" /> Add host
          </button>
        }
      </div>

      <!-- Templated cells -->
      <ng-template strctCell="type" let-value="value">
        <span class="typecell"
          ><strct-icon [name]="typeIcon(value)" [size]="15" [strokeWidth]="1.4" /> {{ value }}</span
        >
      </ng-template>
      <ng-template strctCell="cpu" let-value="value">
        <span class="usecell">
          <strct-progress [value]="+value" [status]="usageStatus(+value)" />
          <span class="usecell__n">{{ value }}%</span>
        </span>
      </ng-template>
      <ng-template strctCell="mem" let-value="value">
        <span class="usecell">
          <strct-progress [value]="+value" [status]="usageStatus(+value)" />
          <span class="usecell__n">{{ value }}%</span>
        </span>
      </ng-template>
      <ng-template strctCell="status" let-value="value">
        <strct-badge [status]="statusBadge(value)">{{ value }}</strct-badge>
      </ng-template>
      <!-- Expandable detail -->
      <ng-template strctRowDetail let-row>
        <strct-stack style="max-width: 460px;">
          <strct-stack-item label="Cluster">{{ row['cluster'] }}</strct-stack-item>
          <strct-stack-item label="Power">{{ row['power'] }}</strct-stack-item>
          <strct-stack-item label="Operating system">{{ row['os'] }}</strct-stack-item>
          <strct-stack-item label="IP address">{{ row['ip'] }}</strct-stack-item>
          <strct-stack-item label="Uptime">{{ row['uptime'] }}</strct-stack-item>
        </strct-stack>
      </ng-template>
    </strct-datagrid>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .inv__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }
      .inv__title {
        margin: 0;
        font-size: 24px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .inv__sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--t3);
      }
      .inv__toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }
      .inv__filter {
        max-width: 320px;
      }
      .inv__count {
        font-size: 12px;
        color: var(--t3);
        white-space: nowrap;
      }
      .grow {
        flex: 1;
      }
      .typecell {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: var(--t1);
      }
      .typecell strct-icon {
        color: var(--t2);
      }
      .usecell {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 120px;
        width: 100%;
      }
      .usecell strct-progress {
        flex: 1;
      }
      .usecell__n {
        font-size: 12px;
        color: var(--t2);
        font-variant-numeric: tabular-nums;
        width: 34px;
        text-align: right;
      }
    `,
  ],
})
export class InventoryPage {
  protected readonly query = signal('');
  protected readonly selected = signal(0);
  protected readonly lastAction = signal('');

  protected readonly cols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Name', sortable: true, resizable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'cluster', label: 'Cluster', sortable: true, resizable: true },
    { key: 'cpu', label: 'CPU', sortable: true, width: '140px' },
    { key: 'mem', label: 'Memory', sortable: true, width: '140px' },
    { key: 'status', label: 'Status', sortable: true },
  ];

  private readonly allRows: StrctRow[] = [
    {
      id: 'h1',
      name: 'hv-prod-01',
      type: 'Host',
      cluster: 'Prod-A',
      cpu: 71,
      mem: 64,
      status: 'Running',
      power: 'On',
      os: 'Hyper-V Server 2022',
      ip: '10.0.1.11',
      uptime: '124 days',
    },
    {
      id: 'h2',
      name: 'hv-prod-02',
      type: 'Host',
      cluster: 'Prod-A',
      cpu: 44,
      mem: 52,
      status: 'Maintenance',
      power: 'On',
      os: 'Hyper-V Server 2022',
      ip: '10.0.1.12',
      uptime: '14 days',
    },
    {
      id: 'h3',
      name: 'hv-prod-03',
      type: 'Host',
      cluster: 'Prod-B',
      cpu: 86,
      mem: 78,
      status: 'Running',
      power: 'On',
      os: 'Hyper-V Server 2022',
      ip: '10.0.1.13',
      uptime: '201 days',
    },
    {
      id: 'v1',
      name: 'web-frontend-01',
      type: 'VM',
      cluster: 'Prod-A',
      cpu: 38,
      mem: 41,
      status: 'Running',
      power: 'On',
      os: 'Ubuntu 22.04',
      ip: '10.0.4.12',
      uptime: '63 days',
    },
    {
      id: 'v2',
      name: 'api-gateway-01',
      type: 'VM',
      cluster: 'Prod-A',
      cpu: 55,
      mem: 60,
      status: 'Running',
      power: 'On',
      os: 'Ubuntu 22.04',
      ip: '10.0.4.20',
      uptime: '63 days',
    },
    {
      id: 'v3',
      name: 'db-primary',
      type: 'VM',
      cluster: 'Prod-B',
      cpu: 82,
      mem: 88,
      status: 'Warning',
      power: 'On',
      os: 'RHEL 9',
      ip: '10.0.4.30',
      uptime: '198 days',
    },
    {
      id: 'v4',
      name: 'db-replica-01',
      type: 'VM',
      cluster: 'DR',
      cpu: 12,
      mem: 33,
      status: 'Running',
      power: 'On',
      os: 'RHEL 9',
      ip: '10.0.6.31',
      uptime: '40 days',
    },
    {
      id: 'v5',
      name: 'cache-redis-01',
      type: 'VM',
      cluster: 'Prod-B',
      cpu: 47,
      mem: 70,
      status: 'Running',
      power: 'On',
      os: 'Debian 12',
      ip: '10.0.4.40',
      uptime: '12 days',
    },
    {
      id: 'v6',
      name: 'batch-worker-03',
      type: 'VM',
      cluster: 'Dev',
      cpu: 3,
      mem: 18,
      status: 'Stopped',
      power: 'Off',
      os: 'Ubuntu 22.04',
      ip: '10.0.8.53',
      uptime: '—',
    },
    {
      id: 'h4',
      name: 'hv-edge-01',
      type: 'Host',
      cluster: 'Edge',
      cpu: 22,
      mem: 30,
      status: 'Running',
      power: 'On',
      os: 'Hyper-V Server 2022',
      ip: '10.0.2.11',
      uptime: '88 days',
    },
    {
      id: 'v7',
      name: 'mail-relay-01',
      type: 'VM',
      cluster: 'Edge',
      cpu: 9,
      mem: 22,
      status: 'Running',
      power: 'On',
      os: 'Alpine 3.19',
      ip: '10.0.2.50',
      uptime: '5 days',
    },
    {
      id: 'h5',
      name: 'hv-dr-01',
      type: 'Host',
      cluster: 'DR',
      cpu: 0,
      mem: 4,
      status: 'Stopped',
      power: 'Off',
      os: 'Hyper-V Server 2022',
      ip: '10.0.6.11',
      uptime: '—',
    },
  ];

  protected readonly rows = computed<StrctRow[]>(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.allRows;
    return this.allRows.filter((r) =>
      [r['name'], r['type'], r['cluster']].some((v) => String(v).toLowerCase().includes(q)),
    );
  });

  protected typeIcon(type: unknown): string {
    return type === 'Host' ? 'host' : type === 'VM' ? 'vm' : 'datacenter';
  }

  protected usageStatus(v: number): 'accent' | 'success' | 'warning' | 'critical' {
    return v > 80 ? 'critical' : v > 60 ? 'warning' : 'success';
  }

  protected statusBadge(value: unknown): StrctBadgeStatus {
    switch (value) {
      case 'Running':
        return 'success';
      case 'Maintenance':
      case 'Warning':
        return 'warning';
      case 'Stopped':
        return 'critical';
      default:
        return 'neutral';
    }
  }

  protected maintLabel(row: StrctRow): string {
    return row['status'] === 'Maintenance' ? 'Exit maintenance' : 'Enter maintenance';
  }
  protected powerLabel(row: StrctRow): string {
    return row['power'] === 'On' ? 'Power off' : 'Power on';
  }

  /** Per-row action menu (built-in datagrid kebab column). */
  protected readonly rowMenu = (row: StrctRow): StrctMenuItem[] => [
    { label: 'Open console', icon: 'compass' },
    { label: this.maintLabel(row), icon: 'maintenance' },
    { label: this.powerLabel(row), icon: 'power' },
    { divider: true },
    { label: 'Remove from inventory', icon: 'close', critical: true },
  ];
  protected onRowAction(e: { row: StrctRow; item: StrctMenuItem }): void {
    this.lastAction.set(`${e.item.label} · ${e.row['name']}`);
  }
  protected batch(action: string): void {
    this.lastAction.set(`${action} · ${this.selected()} object(s)`);
  }
  protected onSync(): void {
    this.lastAction.set('Synced just now');
  }
}
