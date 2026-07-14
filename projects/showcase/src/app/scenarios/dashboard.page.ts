import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  StrctBadge,
  StrctBadgeStatus,
  StrctButton,
  StrctCard,
  StrctCardBlock,
  StrctCardHeader,
  StrctCellDef,
  StrctChart,
  StrctChartSeries,
  StrctChartThreshold,
  StrctColumn,
  StrctDonut,
  StrctDonutSegment,
  StrctFlow,
  StrctFlowNode,
  StrctGauge,
  StrctHero,
  StrctIcon,
  StrctProgress,
  StrctRow,
  StrctSparkline,
  StrctTable,
  StrctTimeline,
  StrctTimelineItem,
  StrctTimelineState,
} from 'strct';

interface Kpi {
  icon: string;
  label: string;
  value: string;
  delta: string;
  status: StrctBadgeStatus;
  trend: number[];
  trendStatus: 'accent' | 'success' | 'warning' | 'critical';
}
interface Usage {
  label: string;
  value: number;
  status: 'accent' | 'success' | 'warning' | 'critical';
  detail: string;
}
interface EventItem {
  title: string;
  state: StrctTimelineState;
  detail: string;
}

/**
 * Scenario: a composed datacenter overview dashboard built entirely from strct
 * components — KPIs, fleet-health donut, resource gauges, trend charts, an
 * events timeline and a hosts table with templated cells.
 */
@Component({
  selector: 'app-dashboard-scenario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StrctCard,
    StrctCardHeader,
    StrctCardBlock,
    StrctIcon,
    StrctBadge,
    StrctSparkline,
    StrctDonut,
    StrctGauge,
    StrctChart,
    StrctFlow,
    StrctHero,
    StrctProgress,
    StrctTimeline,
    StrctTimelineItem,
    StrctTable,
    StrctCellDef,
    StrctButton,
  ],
  template: `
    <header class="dash__head">
      <div>
        <h1 class="dash__title">Datacenter Overview</h1>
        <p class="dash__sub">Production region · us-east-1 · last updated just now</p>
      </div>
      <div class="dash__actions">
        <button strct-button size="sm"><strct-icon name="sync" [size]="14" /> Refresh</button>
        <button strct-button variant="primary" solid size="sm">
          <strct-icon name="cluster" [size]="14" /> New cluster
        </button>
      </div>
    </header>

    <strct-hero status="success" icon="shield" heading="All systems operational" class="dash__hero">
      42 hosts responding · replication in sync · no critical alarms in the last 24h.
      <div strctHeroMeta>
        <strct-badge status="success">HA ON</strct-badge>
        <strct-badge status="accent">v1.4.2</strct-badge>
      </div>
      <div strctHeroActions>
        <button strct-button size="sm" variant="neutral">View alarms</button>
      </div>
    </strct-hero>

    <!-- KPI row -->
    <section class="dash__kpis">
      @for (k of kpis; track k.label) {
        <div class="kpi">
          <span class="kpi__icon"
            ><strct-icon [name]="k.icon" [size]="20" [strokeWidth]="1.4"
          /></span>
          <div class="kpi__body">
            <span class="kpi__value">{{ k.value }}</span>
            <span class="kpi__label">{{ k.label }}</span>
          </div>
          <div class="kpi__right">
            <strct-badge [status]="k.status">{{ k.delta }}</strct-badge>
            <strct-sparkline
              [data]="k.trend"
              [status]="k.trendStatus"
              area
              [width]="80"
              [height]="26"
            />
          </div>
        </div>
      }
    </section>

    <!-- Health + gauges + volumes -->
    <section class="dash__grid dash__grid--3">
      <strct-card>
        <strct-card-header
          ><span>Fleet health</span
          ><strct-badge status="success">98% OK</strct-badge></strct-card-header
        >
        <strct-card-block>
          <div class="health">
            <strct-donut
              [segments]="health"
              [size]="132"
              [thickness]="16"
              centerValue="42"
              centerLabel="hosts"
            />
            <ul class="health__legend">
              @for (s of health; track s.label) {
                <li>
                  <span class="dot dot--{{ legendClass(s.label) }}"></span>{{ s.label
                  }}<span class="health__n">{{ s.value }}</span>
                </li>
              }
            </ul>
          </div>
        </strct-card-block>
      </strct-card>

      <strct-card>
        <strct-card-header><span>Resource usage</span></strct-card-header>
        <strct-card-block>
          <div class="gauges">
            <strct-gauge [value]="68" status="warning" label="CPU" [size]="120" />
            <strct-gauge [value]="54" status="accent" label="Memory" [size]="120" />
            <strct-gauge [value]="81" status="critical" label="Storage" [size]="120" />
          </div>
        </strct-card-block>
      </strct-card>

      <strct-card>
        <strct-card-header><span>Top volumes</span></strct-card-header>
        <strct-card-block>
          <div class="bars">
            @for (d of volumes; track d.label) {
              <div class="bar">
                <div class="bar__row">
                  <span>{{ d.label }}</span
                  ><span class="bar__detail">{{ d.detail }}</span>
                </div>
                <strct-progress
                  [value]="d.value"
                  [status]="d.status"
                  [label]="d.label + ' usage'"
                />
              </div>
            }
          </div>
        </strct-card-block>
      </strct-card>
    </section>

    <!-- Charts -->
    <section class="dash__grid dash__grid--2">
      <strct-card>
        <strct-card-header
          ><span>CPU vs memory — last 24h</span
          ><strct-badge status="warning">peak 84%</strct-badge></strct-card-header
        >
        <strct-card-block>
          <strct-chart
            [series]="usageSeries"
            legend
            yAxis
            [min]="0"
            [max]="100"
            [thresholds]="usageThresholds"
            [labels]="hours"
            [xTicks]="7"
            [valueFormat]="pct"
            [height]="190"
          />
        </strct-card-block>
      </strct-card>

      <strct-card>
        <strct-card-header><span>VMs per cluster</span></strct-card-header>
        <strct-card-block>
          <strct-chart
            [data]="vmsPerCluster"
            type="bar"
            [labels]="clusterNames"
            status="success"
            [height]="170"
          />
        </strct-card-block>
      </strct-card>
    </section>

    <!-- Replication -->
    <strct-card class="dash__flow">
      <strct-card-header
        ><span>Site replication</span
        ><strct-badge status="success">0 lag</strct-badge></strct-card-header
      >
      <strct-card-block>
        <strct-flow
          [nodes]="replication"
          [live]="true"
          label="asynchronous replication · RPO 15s"
          status="success"
        />
      </strct-card-block>
    </strct-card>

    <!-- Events + hosts -->
    <section class="dash__grid dash__grid--wide">
      <strct-card>
        <strct-card-header><span>Recent events</span></strct-card-header>
        <strct-card-block>
          <strct-timeline>
            @for (e of events; track e.title) {
              <strct-timeline-item [title]="e.title" [state]="e.state">{{
                e.detail
              }}</strct-timeline-item>
            }
          </strct-timeline>
        </strct-card-block>
      </strct-card>

      <strct-card>
        <strct-card-header
          ><span>Hosts</span
          ><strct-badge status="neutral">{{ hostRows.length }}</strct-badge></strct-card-header
        >
        <strct-card-block>
          <strct-table [columns]="hostCols" [rows]="hostRows" hover>
            <ng-template strctCell="status" let-value="value">
              <strct-badge [status]="statusBadge(value)">{{ value }}</strct-badge>
            </ng-template>
            <ng-template strctCell="cpu" let-value="value">
              <div class="cpucell">
                <strct-progress
                  label="CPU usage"
                  [value]="value"
                  [status]="value > 80 ? 'critical' : value > 60 ? 'warning' : 'success'"
                />
                <span class="cpucell__n">{{ value }}%</span>
              </div>
            </ng-template>
          </strct-table>
        </strct-card-block>
      </strct-card>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .dash__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .dash__title {
        margin: 0;
        font-size: 24px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .dash__sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--t3);
      }
      .dash__actions {
        display: flex;
        gap: 8px;
      }

      .dash__hero {
        display: block;
        margin-bottom: 18px;
      }
      .dash__flow {
        display: block;
        margin-bottom: 18px;
      }
      .dash__flow strct-flow {
        max-width: 520px;
      }
      .dash__kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
        margin-bottom: 16px;
      }
      .kpi {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border: 1px solid var(--b2);
        border-radius: 11px;
        background: var(--bg-1);
      }
      .kpi__icon {
        display: inline-flex;
        padding: 9px;
        border-radius: 9px;
        color: var(--acc);
        background: var(--acc-s);
      }
      .kpi__body {
        display: flex;
        flex-direction: column;
      }
      .kpi__value {
        font-size: 22px;
        font-weight: 700;
        color: var(--t1);
        line-height: 1.1;
      }
      .kpi__label {
        font-size: 12px;
        color: var(--t3);
      }
      .kpi__right {
        margin-left: auto;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
      }

      .dash__grid {
        display: grid;
        gap: 14px;
        margin-bottom: 16px;
      }
      .dash__grid--3 {
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }
      .dash__grid--2 {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .dash__grid--wide {
        grid-template-columns: minmax(280px, 1fr) minmax(360px, 1.4fr);
      }
      @media (max-width: 880px) {
        .dash__grid--wide {
          grid-template-columns: 1fr;
        }
      }

      .health {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
      }
      .health__legend {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
        min-width: 130px;
      }
      .health__legend li {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--t2);
      }
      .health__n {
        margin-left: auto;
        font-weight: 600;
        color: var(--t1);
        font-variant-numeric: tabular-nums;
      }
      .dot {
        width: 9px;
        height: 9px;
        border-radius: 3px;
        flex-shrink: 0;
      }
      .dot--ok {
        background: var(--success);
      }
      .dot--warn {
        background: var(--warning);
      }
      .dot--maint {
        background: var(--acc);
      }
      .dot--off {
        background: var(--t3);
      }

      .gauges {
        display: flex;
        gap: 10px;
        justify-content: space-around;
        flex-wrap: wrap;
      }
      .bars {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .bar__row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--t1);
        margin-bottom: 6px;
      }
      .bar__detail {
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }

      .cpucell {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 120px;
      }
      .cpucell strct-progress {
        flex: 1;
      }
      .cpucell__n {
        font-size: 12px;
        color: var(--t2);
        font-variant-numeric: tabular-nums;
        width: 34px;
        text-align: right;
      }
    `,
  ],
})
export class DashboardPage {
  protected readonly kpis: Kpi[] = [
    {
      icon: 'host',
      label: 'Hosts',
      value: '42',
      delta: '+2',
      status: 'success',
      trend: [30, 33, 32, 35, 38, 40, 42],
      trendStatus: 'success',
    },
    {
      icon: 'vm',
      label: 'Virtual machines',
      value: '318',
      delta: '+14',
      status: 'success',
      trend: [260, 271, 280, 290, 301, 312, 318],
      trendStatus: 'accent',
    },
    {
      icon: 'cluster',
      label: 'Clusters',
      value: '6',
      delta: '0',
      status: 'neutral',
      trend: [6, 6, 6, 6, 6, 6, 6],
      trendStatus: 'accent',
    },
    {
      icon: 'warning',
      label: 'Active alerts',
      value: '3',
      delta: '+1',
      status: 'warning',
      trend: [1, 0, 2, 1, 2, 2, 3],
      trendStatus: 'warning',
    },
  ];

  protected readonly health: StrctDonutSegment[] = [
    { value: 36, label: 'Running' },
    { value: 3, label: 'Warning' },
    { value: 2, label: 'Maintenance' },
    { value: 1, label: 'Stopped' },
  ];

  protected readonly volumes: Usage[] = [
    { label: 'Volume-SSD-01', value: 68, status: 'warning', detail: '6.8 / 10 TB' },
    { label: 'LUN-SAN-01', value: 44, status: 'success', detail: '2.2 / 5 TB' },
    { label: 'S2D-Capacity', value: 88, status: 'critical', detail: '35.2 / 40 TB' },
    { label: 'Backup-NFS', value: 21, status: 'accent', detail: '10.5 / 50 TB' },
  ];

  protected readonly hours = ['00', '03', '06', '09', '12', '15', '18', '21', '24'];
  protected readonly cpuSeries = [38, 42, 35, 48, 64, 72, 84, 61, 55];
  protected readonly clusterNames = ['Prod-A', 'Prod-B', 'Edge', 'Dev', 'DR', 'Lab'];
  protected readonly vmsPerCluster = [96, 84, 32, 58, 28, 20];

  protected readonly events: EventItem[] = [
    {
      title: 'Live migration completed',
      state: 'success',
      detail: 'web-frontend-01 → Hyper-V Host 03',
    },
    {
      title: 'Host entered maintenance',
      state: 'current',
      detail: 'Hyper-V Host 02 · fan redundancy alert',
    },
    { title: 'Volume usage high', state: 'warning', detail: 'S2D-Capacity crossed 85%' },
    { title: 'Snapshot created', state: 'default', detail: 'db-primary · pre-upgrade' },
  ];

  protected readonly hostCols: StrctColumn[] = [
    { key: 'name', label: 'Host' },
    { key: 'cluster', label: 'Cluster' },
    { key: 'vms', label: 'VMs', align: 'end' },
    { key: 'cpu', label: 'CPU' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly hostRows: StrctRow[] = [
    { name: 'Hyper-V Host 01', cluster: 'Prod-A', vms: 24, cpu: 71, status: 'Running' },
    { name: 'Hyper-V Host 02', cluster: 'Prod-A', vms: 18, cpu: 44, status: 'Maintenance' },
    { name: 'Hyper-V Host 03', cluster: 'Prod-B', vms: 31, cpu: 86, status: 'Running' },
    { name: 'Hyper-V Host 04', cluster: 'Edge', vms: 9, cpu: 22, status: 'Running' },
    { name: 'Hyper-V Host 05', cluster: 'DR', vms: 0, cpu: 3, status: 'Stopped' },
  ];

  protected readonly pct = (v: number) => v.toFixed(0) + '%';
  protected readonly usageSeries: StrctChartSeries[] = [
    { data: [42, 48, 51, 62, 70, 84, 76, 64, 58, 61, 66, 59, 52], label: 'CPU', status: 'accent' },
    {
      data: [55, 56, 58, 60, 63, 66, 68, 67, 65, 64, 62, 60, 58],
      label: 'Memory',
      status: 'success',
      dash: true,
    },
  ];
  protected readonly usageThresholds: StrctChartThreshold[] = [
    { value: 90, status: 'critical', label: 'SLA' },
  ];
  protected readonly replication: StrctFlowNode[] = [
    { id: 'p', label: 'us-east-1', role: 'PRIMARY', status: 'success' },
    { id: 'd', label: 'us-west-2', role: 'DR', status: 'accent' },
  ];

  protected legendClass(label: string | undefined): string {
    const map: Record<string, string> = {
      Running: 'ok',
      Warning: 'warn',
      Maintenance: 'maint',
      Stopped: 'off',
    };
    return (label ? map[label] : undefined) ?? 'ok';
  }

  protected statusBadge(value: unknown): StrctBadgeStatus {
    switch (value) {
      case 'Running':
        return 'success';
      case 'Maintenance':
        return 'warning';
      case 'Stopped':
        return 'critical';
      default:
        return 'neutral';
    }
  }
}
