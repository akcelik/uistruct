import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StrctChart, StrctDonut, StrctDonutSegment, StrctGauge, StrctSparkline } from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-charts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, DemoBlock, StrctSparkline, StrctChart, StrctDonut, StrctGauge],
  template: `
    <app-page-header
      title="Charts"
      subtitle="Lightweight, dependency-free SVG charts coloured from theme tokens — sized for dashboards and monitoring panels."
    />

    <app-demo
      anchor="sparkline"
      heading="Sparkline"
      description="Inline trend lines for tables and cards."
      code='<strct-sparkline [data]="cpu" area />'
    >
      <div class="spark-row">
        <span class="spark-lbl">CPU</span>
        <strct-sparkline [data]="cpuTrend" [width]="140" area />
        <span class="spark-val">62%</span>
      </div>
      <div class="spark-row">
        <span class="spark-lbl">Memory</span>
        <strct-sparkline [data]="memTrend" [width]="140" status="warning" area />
        <span class="spark-val">81%</span>
      </div>
      <div class="spark-row">
        <span class="spark-lbl">Net I/O</span>
        <strct-sparkline [data]="netTrend" [width]="140" status="success" />
        <span class="spark-val">340 Mb/s</span>
      </div>
    </app-demo>

    <app-demo
      anchor="line"
      heading="Line & area"
      description="Single-series time chart. Switch type between line and area."
      code='<strct-chart [data]="cpu" type="area" [labels]="hours" />'
    >
      <div class="chart-box">
        <strct-chart
          [data]="dayCpu"
          type="area"
          [labels]="hours"
          status="accent"
          [height]="170"
          [max]="100"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="bar"
      heading="Bar"
      description="Categorical comparison, e.g. VMs per host."
      code='<strct-chart [data]="perHost" type="bar" [labels]="hosts" />'
    >
      <div class="chart-box">
        <strct-chart
          [data]="perHost"
          type="bar"
          [labels]="hostNames"
          status="accent"
          [height]="170"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="donut"
      heading="Donut"
      description="Composition of a whole, e.g. VM power states."
      code='<strct-donut [segments]="states" centerValue="48" centerLabel="VMs" />'
    >
      <div class="donut-row">
        <strct-donut [segments]="vmStates" [centerValue]="48" centerLabel="VMs" [size]="140" />
        <div class="legend">
          @for (s of vmStates; track s.label) {
            <div class="legend__item">
              <span class="legend__dot" [style.background]="s.color"></span>
              <span>{{ s.label }}</span>
              <span class="legend__val">{{ s.value }}</span>
            </div>
          }
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="gauge"
      heading="Gauge"
      description="A 0–100 radial dial for utilisation."
      code='<strct-gauge [value]="72" status="warning" label="CPU" />'
    >
      <div class="gauge-row">
        <strct-gauge [value]="41" status="success" label="CPU" />
        <strct-gauge [value]="78" status="warning" label="Memory" />
        <strct-gauge [value]="93" status="critical" label="Storage" />
      </div>
    </app-demo>
  `,
  styles: [
    `
      .spark-row {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        max-width: 320px;
        margin-bottom: 6px;
      }
      .spark-lbl {
        width: 70px;
        font-size: 12px;
        color: var(--t2);
      }
      .spark-val {
        margin-left: auto;
        font-size: 12px;
        font-family: var(--mono);
        color: var(--t1);
      }
      .chart-box {
        width: 100%;
        max-width: 520px;
      }
      .donut-row {
        display: flex;
        align-items: center;
        gap: 26px;
        flex-wrap: wrap;
      }
      .legend {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;
        color: var(--t1);
      }
      .legend__item {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 150px;
      }
      .legend__dot {
        width: 10px;
        height: 10px;
        border-radius: 3px;
      }
      .legend__val {
        margin-left: auto;
        font-family: var(--mono);
        color: var(--t2);
      }
      .gauge-row {
        display: flex;
        gap: 22px;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class ChartsPage {
  protected readonly cpuTrend = [40, 52, 48, 61, 55, 68, 62, 70, 62];
  protected readonly memTrend = [70, 72, 75, 74, 78, 80, 79, 82, 81];
  protected readonly netTrend = [120, 180, 90, 260, 200, 340, 280, 310, 340];

  protected readonly hours = ['00', '04', '08', '12', '16', '20', '24'];
  protected readonly dayCpu = [22, 35, 48, 72, 65, 58, 44];

  protected readonly hostNames = ['esx-01', 'esx-02', 'esx-03', 'esx-04', 'esx-05'];
  protected readonly perHost = [18, 24, 12, 30, 21];

  protected readonly vmStates: StrctDonutSegment[] = [
    { value: 36, label: 'Running', color: 'var(--ok)' },
    { value: 8, label: 'Stopped', color: 'var(--t3)' },
    { value: 3, label: 'Suspended', color: 'var(--wrn)' },
    { value: 1, label: 'Error', color: 'var(--crt)' },
  ];
}
