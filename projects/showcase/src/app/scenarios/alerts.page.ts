import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  StrctBadge,
  StrctButton,
  StrctCellDef,
  StrctConfirmOutlet,
  StrctConfirmService,
  StrctDatagrid,
  StrctDatagridColumn,
  StrctFilterBar,
  StrctFilterChip,
  StrctIcon,
  StrctMenuItem,
  StrctNotificationCenter,
  StrctRow,
  StrctStatus,
  StrctStatusDot,
  StrctToastService,
  StrctToolbar,
  StrctToolbarSpacer,
} from 'strct';

type AlertSeverity = 'critical' | 'warning' | 'info';

interface Alert {
  [key: string]: unknown;
  id: string;
  severity: AlertSeverity;
  message: string;
  source: string;
  time: string;
  state: 'Active' | 'Acknowledged';
}

/**
 * Scenario: an operations alerting console — a filter bar with severity chips,
 * a selection-aware toolbar over an alerts grid (status-dot severity cells,
 * per-row actions), acknowledge/delete flows guarded by the confirm dialog,
 * and a notification center that records everything the page announces.
 */
@Component({
  selector: 'app-alerts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StrctFilterBar,
    StrctToolbar,
    StrctToolbarSpacer,
    StrctDatagrid,
    StrctCellDef,
    StrctBadge,
    StrctButton,
    StrctIcon,
    StrctStatusDot,
    StrctNotificationCenter,
    StrctConfirmOutlet,
  ],
  template: `
    <header class="al__head">
      <div>
        <h1 class="al__title">Alerts</h1>
        <p class="al__sub">Active alarms across hosts, VMs and datastores</p>
      </div>
      <div class="al__actions">
        <strct-notification-center />
      </div>
    </header>

    <strct-filter-bar
      [(query)]="query"
      [filters]="chips()"
      [count]="rows().length"
      countLabel="alerts"
      placeholder="Filter by message or source…"
      (removed)="severity.set(null)"
      (cleared)="severity.set(null)"
    >
      <span class="al__sevs">
        @for (sev of severities; track sev) {
          <button
            type="button"
            class="al__sev"
            [class.is-on]="severity() === sev"
            (click)="toggleSeverity(sev)"
          >
            <strct-status-dot [status]="severityStatus(sev)" size="sm" /> {{ sev }}
          </button>
        }
      </span>
    </strct-filter-bar>

    <strct-toolbar
      ariaLabel="Alert actions"
      [selectionCount]="selected().length"
      (cleared)="grid.clearSelection()"
      divided
    >
      <button
        strct-button
        size="sm"
        [disabled]="!selected().length"
        (click)="acknowledgeSelected()"
      >
        <strct-icon name="check" [size]="14" /> Acknowledge
      </button>
      <button
        strct-button
        variant="critical"
        size="sm"
        [disabled]="!selected().length"
        (click)="confirmDeleteSelected()"
      >
        <strct-icon name="trash" [size]="14" /> Delete
      </button>
      <strct-toolbar-spacer />
      <button strct-button variant="outline" size="sm" (click)="raiseTestAlert()">
        <strct-icon name="warning" [size]="14" /> Raise test alert
      </button>
    </strct-toolbar>

    <strct-datagrid
      #grid
      [columns]="cols"
      [rows]="rows()"
      rowId="id"
      selectable
      [pageSize]="8"
      [rowActions]="rowMenu"
      (selectionChange)="selected.set($event)"
      (rowAction)="onRowAction($event)"
    >
      <ng-template strctCell="severity" let-value="value">
        <span class="sevcell"
          ><strct-status-dot [status]="severityStatus(value)" size="sm" [label]="value" />
          {{ value }}</span
        >
      </ng-template>
      <ng-template strctCell="state" let-value="value">
        <strct-badge [status]="value === 'Active' ? 'warning' : 'neutral'">{{ value }}</strct-badge>
      </ng-template>
    </strct-datagrid>

    <strct-confirm-outlet />
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .al__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }
      .al__title {
        margin: 0;
        font-size: 24px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .al__sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--t3);
      }
      .al__actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      strct-filter-bar {
        margin-bottom: 12px;
      }
      strct-toolbar {
        margin-bottom: 10px;
      }
      .al__sevs {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .al__sev {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border: 1px solid var(--b2);
        border-radius: 99px;
        background: var(--bg-1);
        color: var(--t2);
        font-size: 12px;
        font-family: var(--font);
        cursor: pointer;
        text-transform: capitalize;
      }
      .al__sev:hover {
        background: var(--bg-3);
        color: var(--t1);
      }
      .al__sev.is-on {
        border-color: var(--acc30);
        background: var(--acc-m);
        color: var(--acc);
        font-weight: 600;
      }
      .sevcell {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: var(--t1);
        text-transform: capitalize;
      }
    `,
  ],
})
export class AlertsPage {
  private readonly confirm = inject(StrctConfirmService);
  private readonly toast = inject(StrctToastService);
  private readonly grid = viewChild('grid', { read: StrctDatagrid });

  protected readonly query = signal('');
  protected readonly severity = signal<AlertSeverity | null>(null);
  protected readonly selected = signal<StrctRow[]>([]);
  protected readonly severities: AlertSeverity[] = ['critical', 'warning', 'info'];

  protected readonly cols: StrctDatagridColumn[] = [
    { key: 'severity', label: 'Severity', sortable: true, width: '120px' },
    { key: 'message', label: 'Alert', sortable: true },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'time', label: 'Raised', sortable: true, width: '90px' },
    { key: 'state', label: 'State', sortable: true, width: '140px' },
  ];

  private readonly alerts = signal<Alert[]>([
    {
      id: 'a1',
      severity: 'critical',
      message: 'CPU sustained above 95% for 15m',
      source: 'hv-prod-03',
      time: '12:04',
      state: 'Active',
    },
    {
      id: 'a2',
      severity: 'critical',
      message: 'Datastore usage above 90%',
      source: 'S2D-Capacity',
      time: '11:52',
      state: 'Active',
    },
    {
      id: 'a3',
      severity: 'warning',
      message: 'Memory ballooning detected',
      source: 'db-primary',
      time: '11:31',
      state: 'Active',
    },
    {
      id: 'a4',
      severity: 'warning',
      message: 'Fan redundancy degraded',
      source: 'hv-prod-02',
      time: '10:58',
      state: 'Acknowledged',
    },
    {
      id: 'a5',
      severity: 'info',
      message: 'Live migration completed',
      source: 'web-frontend-01',
      time: '10:12',
      state: 'Acknowledged',
    },
    {
      id: 'a6',
      severity: 'warning',
      message: 'Snapshot older than 7 days',
      source: 'db-replica-01',
      time: '09:40',
      state: 'Active',
    },
    {
      id: 'a7',
      severity: 'critical',
      message: 'Host not responding',
      source: 'hv-dr-01',
      time: '08:17',
      state: 'Active',
    },
    {
      id: 'a8',
      severity: 'info',
      message: 'Backup job finished',
      source: 'backup-nfs-01',
      time: '06:00',
      state: 'Acknowledged',
    },
  ]);

  protected readonly rows = computed<StrctRow[]>(() => {
    const q = this.query().toLowerCase().trim();
    const sev = this.severity();
    return this.alerts().filter(
      (a) =>
        (!sev || a.severity === sev) &&
        (!q || a.message.toLowerCase().includes(q) || a.source.toLowerCase().includes(q)),
    );
  });

  /** The severity quick-filter surfaces as a removable chip in the filter bar. */
  protected readonly chips = computed<StrctFilterChip[]>(() => {
    const sev = this.severity();
    return sev ? [{ id: 'severity', label: `severity: ${sev}` }] : [];
  });

  protected severityStatus(value: unknown): StrctStatus {
    switch (value) {
      case 'critical':
        return 'critical';
      case 'warning':
        return 'warning';
      default:
        return 'accent';
    }
  }

  protected toggleSeverity(sev: AlertSeverity): void {
    this.severity.update((cur) => (cur === sev ? null : sev));
  }

  /** Per-row action menu (built-in datagrid kebab column). */
  protected readonly rowMenu = (): StrctMenuItem[] => [
    { label: 'Acknowledge', icon: 'check' },
    { label: 'Open object', icon: 'compass' },
    { divider: true },
    { label: 'Delete alert', icon: 'trash', critical: true },
  ];

  protected onRowAction(e: { row: StrctRow; item: StrctMenuItem }): void {
    if (e.item.label === 'Acknowledge') {
      this.acknowledge([String(e.row['id'])]);
      return;
    }
    if (e.item.label === 'Delete alert') {
      void this.confirmDelete([e.row]);
      return;
    }
    this.toast.info(`Opening ${e.row['source']} in the inventory`);
  }

  protected acknowledgeSelected(): void {
    const ids = this.selected().map((r) => String(r['id']));
    if (!ids.length) return;
    this.acknowledge(ids);
    this.grid()?.clearSelection();
  }

  private acknowledge(ids: string[]): void {
    this.alerts.update((list) =>
      list.map((a) => (ids.includes(a.id) ? { ...a, state: 'Acknowledged' } : a)),
    );
    this.toast.show(
      ids.length === 1 ? '1 alert acknowledged' : `${ids.length} alerts acknowledged`,
      { type: 'success', title: 'Alerts' },
    );
  }

  protected async confirmDeleteSelected(): Promise<void> {
    if (!this.selected().length) return;
    await this.confirmDelete(this.selected());
    this.grid()?.clearSelection();
  }

  /** Delete is destructive — always goes through the confirm dialog. */
  private async confirmDelete(rows: StrctRow[]): Promise<void> {
    const n = rows.length;
    const ok = await this.confirm.confirm({
      title: n === 1 ? 'Delete this alert?' : `Delete ${n} alerts?`,
      message:
        'Deleted alerts are removed from the history and will not be re-raised unless the condition occurs again.',
      confirmLabel: 'Delete',
      tone: 'critical',
    });
    if (!ok) return;
    const ids = rows.map((r) => String(r['id']));
    this.alerts.update((list) => list.filter((a) => !ids.includes(a.id)));
    this.toast.show(n === 1 ? '1 alert deleted' : `${n} alerts deleted`, {
      type: 'info',
      title: 'Alerts',
    });
  }

  /** Demo helper: raises a fresh alarm — it also lands in the notification center. */
  protected raiseTestAlert(): void {
    const id = `a${Date.now()}`;
    const alert: Alert = {
      id,
      severity: 'critical',
      message: 'CPU sustained above 95% for 15m',
      source: 'hv-edge-01',
      time: 'now',
      state: 'Active',
    };
    this.alerts.update((list) => [alert, ...list]);
    this.toast.show(`${alert.message} · ${alert.source}`, {
      type: 'critical',
      title: 'New alert',
    });
  }
}
