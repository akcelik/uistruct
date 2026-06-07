import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  StrctBadge,
  StrctButton,
  StrctCard,
  StrctCardBlock,
  StrctCardHeader,
  StrctChart,
  StrctGauge,
  StrctIcon,
  StrctProgress,
  StrctSparkline,
  StrctStack,
  StrctStackItem,
  StrctTab,
  StrctTabs,
  StrctTag,
  StrctTimeline,
  StrctTimelineItem,
  StrctTimelineState,
} from 'strct';

/**
 * Scenario: a single-host detail page — the natural drill-down from Inventory.
 * Header with identity + actions, then tabs (Summary / Performance / Events)
 * composed from stack views, gauges, charts and a timeline.
 */
@Component({
  selector: 'app-host-detail-scenario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    StrctTabs,
    StrctTab,
    StrctCard,
    StrctCardHeader,
    StrctCardBlock,
    StrctStack,
    StrctStackItem,
    StrctBadge,
    StrctTag,
    StrctButton,
    StrctIcon,
    StrctChart,
    StrctGauge,
    StrctProgress,
    StrctSparkline,
    StrctTimeline,
    StrctTimelineItem,
  ],
  template: `
    <header class="det__head">
      <div class="det__id">
        <a routerLink="/scenarios/inventory" class="det__back">
          <strct-icon name="chevronLeft" [size]="13" /> Inventory
        </a>
        <div class="det__titlerow">
          <span class="det__avatar"
            ><strct-icon name="host" [size]="22" [strokeWidth]="1.4"
          /></span>
          <h1 class="det__title">esx-prod-03</h1>
          <strct-badge status="success">Running</strct-badge>
          <strct-tag status="accent">Prod-B</strct-tag>
        </div>
      </div>
      <div class="det__actions">
        <button strct-button size="sm">
          <strct-icon name="compass" [size]="14" /> Open console
        </button>
        <button strct-button size="sm"><strct-icon name="sync" [size]="14" /> Migrate</button>
        <button strct-button variant="critical" size="sm">
          <strct-icon name="maintenance" [size]="14" /> Maintenance
        </button>
      </div>
    </header>

    <strct-tabs>
      <strct-tab label="Summary">
        <div class="det__grid det__grid--3">
          <strct-card>
            <strct-card-header><span>Overview</span></strct-card-header>
            <strct-card-block>
              <strct-stack>
                <strct-stack-item label="Cluster">Prod-B</strct-stack-item>
                <strct-stack-item label="Hypervisor">VMware ESXi 8.0</strct-stack-item>
                <strct-stack-item label="CPU">2× Intel Xeon Gold 6248R · 48 cores</strct-stack-item>
                <strct-stack-item label="Memory">512 GB DDR4</strct-stack-item>
                <strct-stack-item label="IP address">10.0.1.13</strct-stack-item>
                <strct-stack-item label="Uptime">201 days</strct-stack-item>
              </strct-stack>
            </strct-card-block>
          </strct-card>

          <strct-card>
            <strct-card-header><span>Resource usage</span></strct-card-header>
            <strct-card-block>
              <div class="det__gauges">
                <strct-gauge [value]="86" status="critical" label="CPU" [size]="116" />
                <strct-gauge [value]="78" status="warning" label="Memory" [size]="116" />
              </div>
            </strct-card-block>
          </strct-card>

          <strct-card>
            <strct-card-header><span>Capacity</span></strct-card-header>
            <strct-card-block>
              <div class="det__bars">
                @for (c of capacity; track c.label) {
                  <div class="bar">
                    <div class="bar__row">
                      <span>{{ c.label }}</span
                      ><span class="bar__detail">{{ c.detail }}</span>
                    </div>
                    <strct-progress [value]="c.value" [status]="c.status" />
                  </div>
                }
              </div>
            </strct-card-block>
          </strct-card>
        </div>
      </strct-tab>

      <strct-tab label="Performance">
        <div class="det__grid det__grid--2">
          <strct-card>
            <strct-card-header
              ><span>CPU — last 24h</span
              ><strct-badge status="critical">peak 92%</strct-badge></strct-card-header
            >
            <strct-card-block>
              <strct-chart
                [data]="cpu24"
                type="area"
                [labels]="hours"
                status="critical"
                [height]="160"
                [max]="100"
              />
            </strct-card-block>
          </strct-card>
          <strct-card>
            <strct-card-header><span>Memory — last 24h</span></strct-card-header>
            <strct-card-block>
              <strct-chart
                [data]="mem24"
                type="area"
                [labels]="hours"
                status="warning"
                [height]="160"
                [max]="100"
              />
            </strct-card-block>
          </strct-card>
          <strct-card>
            <strct-card-header><span>Network throughput (Gbps)</span></strct-card-header>
            <strct-card-block>
              <strct-chart
                [data]="net"
                type="bar"
                [labels]="hours"
                status="accent"
                [height]="160"
              />
            </strct-card-block>
          </strct-card>
          <strct-card>
            <strct-card-header><span>Disk IOPS</span></strct-card-header>
            <strct-card-block>
              <div class="det__iops">
                <div>
                  <span class="det__big">44.8k</span
                  ><span class="det__big-label">avg over 24h</span>
                </div>
                <strct-sparkline [data]="iops" status="success" area [width]="180" [height]="56" />
              </div>
            </strct-card-block>
          </strct-card>
        </div>
      </strct-tab>

      <strct-tab label="Events">
        <strct-card>
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
      </strct-tab>
    </strct-tabs>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .det__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .det__back {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--t3);
        text-decoration: none;
      }
      .det__back:hover {
        color: var(--acc);
      }
      .det__titlerow {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
      }
      .det__avatar {
        display: inline-flex;
        padding: 8px;
        border-radius: 9px;
        color: var(--acc);
        background: var(--acc-s);
      }
      .det__title {
        margin: 0;
        font-size: 22px;
        font-weight: 650;
        color: var(--t1);
      }
      .det__actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .det__grid {
        display: grid;
        gap: 14px;
        margin-top: 16px;
      }
      .det__grid--3 {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
      .det__grid--2 {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .det__gauges {
        display: flex;
        gap: 12px;
        justify-content: space-around;
        flex-wrap: wrap;
      }
      .det__bars {
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
      .det__iops {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
      }
      .det__big {
        display: block;
        font-size: 28px;
        font-weight: 700;
        color: var(--t1);
      }
      .det__big-label {
        font-size: 12px;
        color: var(--t3);
      }
    `,
  ],
})
export class HostDetailPage {
  protected readonly hours = ['00', '03', '06', '09', '12', '15', '18', '21', '24'];
  protected readonly cpu24 = [54, 61, 58, 67, 79, 86, 92, 74, 68];
  protected readonly mem24 = [60, 62, 64, 68, 71, 74, 78, 77, 76];
  protected readonly net = [3.2, 4.1, 3.8, 5.4, 7.2, 8.1, 6.4, 5.0, 4.6];
  protected readonly iops = [38, 41, 36, 45, 52, 48, 44, 47, 45];

  protected readonly capacity: {
    label: string;
    value: number;
    status: 'accent' | 'success' | 'warning' | 'critical';
    detail: string;
  }[] = [
    { label: 'vCPU allocation', value: 86, status: 'critical', detail: '82 / 96 vCPU' },
    { label: 'Memory allocation', value: 78, status: 'warning', detail: '400 / 512 GB' },
    { label: 'Local datastore', value: 62, status: 'success', detail: '1.2 / 2 TB' },
  ];

  protected readonly events: { title: string; state: StrctTimelineState; detail: string }[] = [
    { title: 'CPU sustained > 90%', state: 'critical', detail: '12:04 · alert raised' },
    {
      title: 'VM powered on',
      state: 'current',
      detail: '11:20 · web-frontend-07 placed here by DRS',
    },
    { title: 'Snapshot consolidated', state: 'success', detail: '09:42 · db-replica-01' },
    { title: 'Patch applied', state: 'default', detail: 'Yesterday · ESXi 8.0 U2 build 23305546' },
  ];
}
