import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctAlert,
  StrctBadge,
  StrctButton,
  StrctCard,
  StrctCardBlock,
  StrctCardHeader,
  StrctDesc,
  StrctDescriptionList,
  StrctIcon,
  StrctLegend,
  StrctLegendItem,
  StrctMetricTile,
  StrctSegmented,
  StrctSegmentedOption,
  StrctWiring,
  StrctWiringLink,
  StrctWiringNode,
} from 'strct';

/** One row of the two-sided reading table in the detail panel. */
interface Reading {
  label: string;
  host: string;
  peer: string;
  /** The row the two sides disagree on. */
  off?: boolean;
}

interface Detail {
  rows: Reading[];
  checks: { label: string; status: 'success' | 'warning' | 'critical' }[];
  advice: string;
  compared: string;
}

/**
 * Scenario: a cluster's storage fabric, read one cable at a time.
 *
 * The screen a fabric review actually runs on: what is wrong at the top, the
 * wiring in the middle, and the cable under the cursor spelled out beside it.
 * Everything here is composed from the library — the map is `strct-wiring`,
 * the strip is `strct-metric-tile`, the key is `strct-legend`, the readings
 * are `strct-description-list`.
 */
@Component({
  selector: 'app-fabric-scenario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    StrctAlert,
    StrctBadge,
    StrctButton,
    StrctCard,
    StrctCardHeader,
    StrctCardBlock,
    StrctDesc,
    StrctDescriptionList,
    StrctIcon,
    StrctLegend,
    StrctMetricTile,
    StrctSegmented,
    StrctWiring,
  ],
  template: `
    <header class="fab__head">
      <div class="fab__id">
        <span class="fab__kicker">Cluster</span>
        <h1 class="fab__title">PROD-CL01</h1>
        <span class="fab__meta">4 nodes · SET over 2 × 25 Gbps · RoCEv2 · tor-a, tor-b</span>
      </div>
      <div class="fab__actions">
        <button strct-button size="sm" variant="neutral">
          <strct-icon name="refresh" [size]="14" />
          Capture switch ports
        </button>
        <button strct-button size="sm" variant="neutral">All clusters and hosts</button>
      </div>
    </header>

    <strct-alert type="critical">
      <strong>Storage traffic on HV-PRD-03 is not lossless</strong> — its port on tor-b pauses
      priority 4, and the host sends SMB Direct on 3. One priority has to be true across the fabric,
      and this one is not.
    </strct-alert>

    <div class="fab__strip">
      <strct-metric-tile
        label="Needs attention"
        value="1 critical"
        status="critical"
        caption="HV-PRD-03 · PFC differs from tor-b"
      />
      <strct-metric-tile
        label="To review"
        value="4 warnings"
        status="warning"
        caption="VLAN · flaps · pinning · LLDP"
      />
      <strct-metric-tile label="SMB Direct" value="RoCEv2 on 8 of 8" caption="adapters · RDMA on" />
      <strct-metric-tile
        label="Switch side"
        value="7 of 8 heard"
        status="warning"
        caption="latest capture 3 h ago"
      />
      <strct-metric-tile
        label="Symmetry"
        value="Same on every node"
        status="success"
        caption="2 × 25 Gbps · one port to each switch"
      />
      <strct-metric-tile label="Read" value="4 of 4 nodes" caption="3 min ago · 3 not judged" />
    </div>

    <div class="fab__board">
      <strct-card>
        <strct-card-header heading="Wiring">
          <span strctCardHeaderNote>node ports → switch ports, as LLDP heard them</span>
          <div strctCardHeaderActions>
            <strct-segmented size="sm" [options]="filters" [(ngModel)]="filter" />
          </div>
        </strct-card-header>
        <strct-card-block>
          <strct-wiring
            [nodes]="nodes"
            [links]="shown()"
            [columns]="['Nodes · SET team', 'Switches']"
            navigable
            [(selected)]="picked"
          />
          <div class="fab__key">
            <strct-legend [items]="key" orientation="horizontal" />
            <span class="fab__hint">A line or a port opens it on the right</span>
          </div>
        </strct-card-block>
      </strct-card>

      @let link = current();
      <strct-card [status]="link?.status ?? 'neutral'">
        <strct-card-header heading="Selected link">
          <span strctCardHeaderMeta>{{ link ? toneWord(link.status) : 'nothing picked' }}</span>
        </strct-card-header>
        @if (link) {
          <strct-card-block>
            <h2 class="fab__linkname">{{ endName(link.from) }}</h2>
            <p class="fab__linkpeer">↔ {{ endName(link.to) }} · heard 3 h ago over LLDP</p>
          </strct-card-block>
          <strct-card-block>
            <table class="fab__readings">
              <thead>
                <tr>
                  <th scope="col">Reading</th>
                  <th scope="col">Host side</th>
                  <th scope="col">Switch side</th>
                </tr>
              </thead>
              <tbody>
                @for (r of detail().rows; track r.label) {
                  <tr [class.fab__row--off]="r.off">
                    <th scope="row">{{ r.label }}</th>
                    <td>{{ r.host }}</td>
                    <td>{{ r.peer }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </strct-card-block>
          <strct-card-block>
            <div class="fab__cap">Checks on this link</div>
            <div class="fab__checks">
              @for (c of detail().checks; track c.label) {
                <strct-badge size="sm" [status]="c.status">{{ c.label }}</strct-badge>
              }
            </div>
          </strct-card-block>
          <strct-card-block>
            <div class="fab__cap">What to do</div>
            <p class="fab__advice">{{ detail().advice }}</p>
            <strct-description-list align="start">
              <div strctDesc label="Compared with">{{ detail().compared }}</div>
            </strct-description-list>
          </strct-card-block>
          <strct-card-block>
            <div class="fab__linkactions">
              <button strct-button size="sm" variant="neutral">Capture this port now</button>
              <button strct-button size="sm" variant="neutral">Open the adapter</button>
            </div>
          </strct-card-block>
        } @else {
          <strct-card-block>
            <p class="fab__advice">
              Pick a cable, or tab into the map and walk it: ↑ and ↓ move down a column, → and ←
              follow the cable to the port at its far end.
            </p>
          </strct-card-block>
        }
      </strct-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }
      .fab__head {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: var(--space-3);
      }
      .fab__id {
        display: flex;
        align-items: baseline;
        gap: var(--space-3);
        min-width: 0;
      }
      .fab__kicker {
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--t3);
      }
      .fab__title {
        margin: 0;
        font-size: var(--text-2xl);
        font-weight: 600;
        letter-spacing: -0.01em;
        color: var(--t1);
      }
      .fab__meta {
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .fab__actions {
        display: flex;
        gap: var(--space-2);
      }
      .fab__strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-3);
      }
      .fab__board {
        display: grid;
        grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr);
        align-items: start;
        gap: var(--space-4);
      }
      @media (max-width: 1100px) {
        .fab__board {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .fab__key {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        margin-block-start: var(--space-4);
        padding-block-start: var(--space-3);
        border-block-start: 1px solid var(--b1);
      }
      .fab__hint {
        font-size: var(--text-xs);
        color: var(--t3);
      }
      .fab__linkname {
        margin: 0;
        font-size: var(--text-lg);
        font-weight: 600;
        color: var(--t1);
      }
      .fab__linkpeer {
        margin: var(--space-1) 0 0;
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .fab__readings {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--text-sm);
      }
      .fab__readings th,
      .fab__readings td {
        padding: 5px var(--space-2);
        text-align: start;
        vertical-align: top;
        font-weight: 400;
      }
      .fab__readings thead th {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--t3);
        border-block-end: 1px solid var(--b1);
      }
      .fab__readings tbody th {
        color: var(--t2);
        white-space: nowrap;
      }
      .fab__readings tbody td {
        color: var(--t1);
        font-family: var(--mono);
        font-size: var(--text-xs);
      }
      /* The one row the two ends disagree on: the tone layers over the card's
         own surface rather than replacing it. */
      .fab__row--off {
        background-image: linear-gradient(var(--critical-bg), var(--critical-bg));
      }
      .fab__row--off td:last-child {
        color: var(--critical);
      }
      .fab__cap {
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--t3);
        margin-block-end: var(--space-2);
      }
      .fab__checks {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
      }
      .fab__advice {
        margin: 0 0 var(--space-3);
        font-size: var(--text-md);
        line-height: var(--leading-normal);
        color: var(--t1);
      }
      .fab__linkactions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }
    `,
  ],
})
export class FabricPage {
  protected readonly nodes: StrctWiringNode[] = [
    {
      id: 'hv1',
      label: 'HV-PRD-01',
      sublabel: 'SETswitch',
      column: 0,
      ports: [
        { id: 'hv1p1', label: 'SLOT 3 Port 1', meta: '25G · RDMA', status: 'success' },
        { id: 'hv1p2', label: 'SLOT 3 Port 2', meta: '25G · RDMA', status: 'warning' },
      ],
    },
    {
      id: 'hv2',
      label: 'HV-PRD-02',
      sublabel: 'SETswitch',
      column: 0,
      ports: [
        { id: 'hv2p1', label: 'SLOT 3 Port 1', meta: '25G · 6 flaps', status: 'warning' },
        { id: 'hv2p2', label: 'SLOT 3 Port 2', meta: '25G · RDMA', status: 'success' },
      ],
    },
    {
      id: 'hv3',
      label: 'HV-PRD-03',
      sublabel: 'SETswitch',
      column: 0,
      ports: [
        { id: 'hv3p1', label: 'SLOT 3 Port 1', meta: '25G · RDMA', status: 'success' },
        { id: 'hv3p2', label: 'SLOT 3 Port 2', meta: 'PFC 3', status: 'critical' },
      ],
    },
    {
      id: 'hv4',
      label: 'HV-PRD-04',
      sublabel: 'SETswitch',
      column: 0,
      ports: [
        { id: 'hv4p1', label: 'SLOT 3 Port 1', meta: '25G · RDMA', status: 'success' },
        { id: 'hv4p2', label: 'SLOT 3 Port 2', meta: '25G · RDMA', status: 'warning' },
      ],
    },
    {
      id: 'tora',
      label: 'tor-a',
      sublabel: 'Nexus 93180 · LLDP',
      column: 1,
      icon: 'switch',
      ports: [
        { id: 'a11', label: 'Eth1/11', meta: 'PFC 3', status: 'success' },
        { id: 'a12', label: 'Eth1/12', meta: 'PFC 3', status: 'warning' },
        { id: 'a13', label: 'Eth1/13', meta: 'PFC 3', status: 'success' },
        { id: 'a16', label: 'Eth1/16', meta: 'PFC 3', status: 'success' },
      ],
    },
    {
      id: 'torb',
      label: 'tor-b',
      sublabel: 'Nexus 93180 · LLDP',
      column: 1,
      icon: 'switch',
      ports: [
        { id: 'b11', label: 'Eth1/11', meta: 'not heard' },
        { id: 'b12', label: 'Eth1/12', meta: 'PFC 3', status: 'success' },
        { id: 'b14', label: 'Eth1/14', meta: 'PFC 4', status: 'critical' },
        { id: 'b16', label: 'Eth1/16', meta: 'VLAN 711', status: 'warning' },
      ],
    },
  ];

  protected readonly links: StrctWiringLink[] = [
    { id: 'l1', from: 'hv1p1', to: 'a11', status: 'success' },
    { id: 'l2', from: 'hv1p2', to: 'b11', style: 'dashed', label: 'not heard for 2 d' },
    { id: 'l3', from: 'hv2p1', to: 'a12', status: 'warning', label: '6 flaps in 1 h' },
    { id: 'l4', from: 'hv2p2', to: 'b12', status: 'success' },
    { id: 'l5', from: 'hv3p1', to: 'a13', status: 'success' },
    { id: 'l6', from: 'hv3p2', to: 'b14', status: 'critical', label: 'PFC 3 ≠ 4' },
    { id: 'l7', from: 'hv4p1', to: 'a16', status: 'success' },
    { id: 'l8', from: 'hv4p2', to: 'b16', status: 'warning', label: 'VLAN 712 missing' },
  ];

  protected readonly filters: StrctSegmentedOption[] = [
    { value: 'problems', label: 'Problems' },
    { value: 'storage', label: 'Storage traffic' },
    { value: 'all', label: 'All' },
  ];
  protected readonly filter = signal('all');

  /** Which cables the filter draws. The ports stay: an empty port is an answer. */
  protected readonly shown = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.links;
    if (f === 'storage') return this.links.filter((l) => l.status !== 'neutral');
    return this.links.filter((l) => l.status === 'warning' || l.status === 'critical');
  });

  protected readonly key: StrctLegendItem[] = [
    { label: 'agrees', status: 'success', shape: 'line' },
    { label: 'to review', status: 'warning', shape: 'line' },
    { label: 'critical', status: 'critical', shape: 'line' },
    { label: 'not in the latest capture', shape: 'dash', muted: true },
  ];

  protected readonly picked = signal<string | null>('l6');
  protected readonly current = computed(
    () => this.shown().find((l) => l.id === this.picked()) ?? null,
  );

  protected endName(portId: string): string {
    for (const n of this.nodes) {
      const p = n.ports.find((q) => q.id === portId);
      if (p) return `${n.label} · ${p.label}`;
    }
    return portId;
  }

  protected toneWord(status: StrctWiringLink['status']): string {
    return status === 'critical'
      ? '1 critical'
      : status === 'warning'
        ? '1 to review'
        : status === 'success'
          ? 'agrees'
          : 'not in the latest capture';
  }

  private readonly details: Record<string, Detail> = {
    l6: {
      rows: [
        { label: 'Speed', host: '25 Gbps', peer: '—' },
        { label: 'RDMA', host: 'RoCEv2 · on', peer: '—' },
        { label: 'PFC', host: '3 · policy and adapter', peer: '4 · LLDP and link peer', off: true },
        { label: 'ETS', host: 'TC3 50 % · TC7 2 %', peer: 'TC3 50 % · TC7 2 %' },
        { label: 'DCBX Willing', host: 'Off', peer: 'Willing off' },
        { label: 'VLANs', host: '0, 711, 712', peer: '0, 711, 712' },
        { label: 'Max frame', host: '9014 + 4', peer: '9216' },
        { label: 'Aggregation', host: 'SET (switch-independent)', peer: 'Not aggregated' },
      ],
      checks: [
        { label: 'H9 PFC', status: 'critical' },
        { label: 'H10 classes', status: 'success' },
        { label: 'H7 VLANs', status: 'success' },
        { label: 'H8 frame', status: 'success' },
        { label: 'H13 aggregation', status: 'success' },
      ],
      advice:
        'Enable PFC on priority 3 on tor-b Eth1/14, as on the other seven ports. If the switch is right, the SMB Direct policy moves to 4 on every node instead — one priority across the fabric.',
      compared:
        'Observed (host, adapter, link peer, switch) · Windows defaults to 3 with no intent set',
    },
    l3: {
      rows: [
        { label: 'Speed', host: '25 Gbps', peer: '25 Gbps' },
        { label: 'Link flaps', host: '6 in 1 h', peer: '6 in 1 h', off: true },
        { label: 'Last down', host: '12 min ago · 1.4 s', peer: '12 min ago' },
        { label: 'FEC', host: 'RS-FEC', peer: 'RS-FEC' },
        { label: 'Transceiver', host: '—', peer: 'SFP28 · 2.1 dBm · 41 °C' },
      ],
      checks: [
        { label: 'H4 link stability', status: 'warning' },
        { label: 'H9 PFC', status: 'success' },
        { label: 'H6 switch side heard', status: 'success' },
      ],
      advice:
        'Six flaps in an hour on one port and none on its twin is the cable or the optic, not the configuration. Swap the DAC for the spare on tor-a Eth1/12 and watch for an hour.',
      compared: 'Observed (host counters, switch counters) over the last 24 h',
    },
    l8: {
      rows: [
        { label: 'Speed', host: '25 Gbps', peer: '25 Gbps' },
        { label: 'VLANs', host: '0, 711, 712', peer: '0, 711', off: true },
        { label: 'Native VLAN', host: '0', peer: '0' },
        { label: 'RDMA', host: 'RoCEv2 · on', peer: '—' },
      ],
      checks: [
        { label: 'H7 VLANs', status: 'warning' },
        { label: 'H9 PFC', status: 'success' },
        { label: 'H17 live migration', status: 'warning' },
      ],
      advice:
        'SMB2 lives on VLAN 712 and tor-b Eth1/16 does not carry it, so live migration for this node has one leg. Add 712 to the trunk.',
      compared: 'Cluster network roles (SMB1 711, SMB2 712) against the switch port',
    },
    l2: {
      rows: [
        { label: 'Speed', host: '25 Gbps', peer: '—' },
        { label: 'LLDP', host: 'sent', peer: 'nothing for 2 d', off: true },
        { label: 'Link', host: 'up', peer: '—' },
        { label: 'Last capture', host: '—', peer: '3 h ago' },
      ],
      checks: [
        { label: 'H6 switch side heard', status: 'warning' },
        { label: 'H4 link stability', status: 'success' },
      ],
      advice:
        'The host says the link is up and the switch has not heard it for two days, so this pairing is inferred from the last good capture, not observed. Capture tor-b again before trusting anything else on this row.',
      compared: 'Host adapter state against the stored LLDP table',
    },
  };

  private readonly healthy: Detail = {
    rows: [
      { label: 'Speed', host: '25 Gbps', peer: '25 Gbps' },
      { label: 'RDMA', host: 'RoCEv2 · on', peer: '—' },
      { label: 'PFC', host: '3 · policy and adapter', peer: '3 · LLDP and link peer' },
      { label: 'VLANs', host: '0, 711, 712', peer: '0, 711, 712' },
    ],
    checks: [
      { label: 'H9 PFC', status: 'success' },
      { label: 'H7 VLANs', status: 'success' },
      { label: 'H8 frame', status: 'success' },
    ],
    advice: 'Nothing to do: both ends agree on every reading this check set compares.',
    compared: 'Observed (host, adapter, link peer, switch)',
  };

  protected readonly detail = computed(() => this.details[this.picked() ?? ''] ?? this.healthy);
}
