import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctButton,
  StrctChart,
  StrctChartCurve,
  StrctChartSeries,
  StrctChartThreshold,
  StrctDonut,
  StrctDonutSegment,
  StrctFlow,
  StrctFlowNode,
  StrctGauge,
  StrctMetricTile,
  StrctSegmented,
  StrctSegmentedOption,
  StrctSparkline,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-charts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    FormsModule,
    StrctButton,
    StrctSegmented,
    StrctSparkline,
    StrctChart,
    StrctDonut,
    StrctFlow,
    StrctGauge,
    StrctMetricTile,
  ],
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
      description="Single-series time chart. Smooth monotone curves by default (no overshoot); toggle the gradient fill and the interpolation."
      code='<strct-chart [data]="cpu" [area]="true" curve="smooth" [labels]="hours" />'
    >
      <div class="chart-stack">
        <div class="chart-toolbar">
          <strct-segmented [options]="curveOptions" [(ngModel)]="curve" size="sm" />
          <button
            strct-button
            size="sm"
            [variant]="area() ? 'primary' : 'neutral'"
            (click)="area.set(!area())"
          >
            {{ area() ? 'Area on' : 'Area off' }}
          </button>
          <button
            strct-button
            size="sm"
            [variant]="glow() ? 'primary' : 'neutral'"
            (click)="glow.set(!glow())"
          >
            {{ glow() ? 'Glow on' : 'Glow off' }}
          </button>
        </div>
        <div class="chart-box">
          <strct-chart
            [data]="dayCpu"
            [area]="area()"
            [glow]="glow()"
            [curve]="curve()"
            [labels]="hours"
            status="accent"
            [height]="170"
            [max]="100"
          />
        </div>
        <span class="chart-hint">Hover the chart for a crosshair + value tooltip.</span>
      </div>
    </app-demo>

    <app-demo
      anchor="line-live"
      owner="line"
      heading="Live stream"
      description="A streaming metric: the window scrolls left as new points arrive, with a pulsing head at the leading edge. Honours prefers-reduced-motion."
      code='<strct-chart [data]="stream()" live area [interval]="1000" status="success" />'
    >
      <div class="chart-stack">
        <div class="chart-toolbar">
          <button
            strct-button
            size="sm"
            [variant]="streaming() ? 'critical' : 'primary'"
            (click)="toggleStream()"
          >
            {{ streaming() ? 'Pause stream' : 'Start stream' }}
          </button>
          <span class="spark-val">live · {{ lastValue() }} Mb/s</span>
        </div>
        <div class="chart-box">
          <strct-chart
            [data]="stream()"
            live
            area
            glow
            [interval]="streamInterval"
            status="success"
            [height]="170"
            [max]="100"
            [grid]="false"
          />
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="line-multi"
      owner="line"
      heading="Multi-series, legend, y-axis & thresholds"
      description="Compare two signals (network in vs out) with a legend, persistent y-axis scale labels and a threshold line. Hover for a per-series tooltip."
      code='<strct-chart [series]="[{data:inArr,label:&#39;In&#39;},{data:outArr,label:&#39;Out&#39;}]" legend yAxis [thresholds]="[{value:90,status:&#39;critical&#39;,label:&#39;cap&#39;}]" />'
    >
      <div class="chart-box">
        <strct-chart
          [series]="netSeries"
          legend
          yAxis
          area
          [min]="0"
          [max]="100"
          [thresholds]="netThresholds"
          [labels]="hours"
          [xTicks]="7"
          [valueFormat]="pctFormat"
          [height]="190"
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
      description="Composition of a whole, e.g. VM power states. Hover a slice or a legend row — the others dim and the center reads out that slice's value and share."
      code='<strct-donut [segments]="states" centerValue="48" centerLabel="VMs" legend />'
    >
      <strct-donut [segments]="vmStates" [centerValue]="48" centerLabel="VMs" [size]="150" legend />
    </app-demo>

    <app-demo
      anchor="gauge"
      heading="Gauge"
      description="A 0–100 radial dial for utilisation. Pass thresholds and the gauge colors itself from the value."
      code='<strct-gauge [value]="78" [thresholds]="{ warning: 70, critical: 90 }" label="Memory" />'
    >
      <div class="gauge-row">
        <strct-gauge [value]="41" [thresholds]="meterThresholds" label="CPU" />
        <strct-gauge [value]="78" [thresholds]="meterThresholds" label="Memory" />
        <strct-gauge [value]="93" [thresholds]="meterThresholds" label="Storage" />
      </div>
    </app-demo>

    <app-demo
      anchor="metric-tile"
      heading="Metric tile"
      description="Compact KPI tiles — a value, a change indicator (sign drives the arrow + colour) and an inline sparkline."
      code='<strct-metric-tile label="CPU" [value]="62" unit="%" icon="cpu" status="warning" [delta]="8" [data]="cpuTrend" />'
    >
      <div class="mt-grid">
        <strct-metric-tile
          label="CPU"
          [value]="62"
          unit="%"
          icon="cpu"
          status="warning"
          [delta]="8"
          [data]="cpuTrend"
        />
        <strct-metric-tile
          label="Memory"
          [value]="81"
          unit="%"
          icon="memory"
          status="critical"
          [delta]="4"
          [data]="memTrend"
        />
        <strct-metric-tile
          label="Network"
          [value]="340"
          unit="Mb/s"
          icon="network"
          [delta]="12"
          [data]="netTrend"
          caption="last 5 minutes"
        />
        <strct-metric-tile
          label="Errors / min"
          [value]="3"
          icon="alarm"
          status="success"
          [delta]="-40"
          invertDelta
          [data]="errTrend"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="flow"
      heading="Flow"
      description="An animated connection between endpoints — replication, sync, a pipeline. Toggle the live flow; packets stop and the connector rests when idle (and honour reduced motion)."
      code='<strct-flow [nodes]="nodes" [live]="flowing()" label="live replication · 0 lag" status="success" />'
    >
      <div class="flow-demo">
        <strct-flow
          [nodes]="haNodes"
          [live]="flowing()"
          label="live replication · 0 lag"
          status="success"
        />

        <strct-flow
          [nodes]="pipeline"
          [live]="flowing()"
          direction="both"
          label="bidirectional sync"
          status="accent"
        />

        <button strct-button size="sm" variant="neutral" (click)="flowing.set(!flowing())">
          {{ flowing() ? 'Pause flow' : 'Start flow' }}
        </button>
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
      .gauge-row {
        display: flex;
        gap: 22px;
        flex-wrap: wrap;
      }
      .mt-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 12px;
        width: 100%;
      }
      .flow-demo {
        display: flex;
        flex-direction: column;
        gap: 18px;
        width: 100%;
        max-width: 480px;
      }
      .flow-demo button {
        align-self: flex-start;
      }
      .chart-stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
      }
      .chart-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .chart-toolbar .spark-val {
        margin-left: auto;
        font-family: var(--mono);
        font-size: 12px;
        color: var(--success);
      }
      .chart-hint {
        font-size: 11px;
        color: var(--t3);
      }
    `,
  ],
})
export class ChartsPage implements OnDestroy {
  // Line & area demo controls.
  protected readonly area = signal(true);
  protected readonly glow = signal(true);
  protected readonly curve = signal<StrctChartCurve>('smooth');
  protected readonly curveOptions: StrctSegmentedOption[] = [
    { value: 'smooth', label: 'Smooth' },
    { value: 'linear', label: 'Linear' },
    { value: 'step', label: 'Step' },
  ];

  // Live-stream demo: a fixed-length sliding window of values.
  protected readonly streamInterval = 900;
  protected readonly stream = signal<number[]>(
    Array.from({ length: 40 }, (_, i) => 45 + Math.round(18 * Math.sin(i / 4))),
  );
  protected readonly streaming = signal(false);
  protected readonly lastValue = computed(() => {
    const s = this.stream();
    return s.length ? s[s.length - 1] : 0;
  });
  private streamTimer: ReturnType<typeof setInterval> | null = null;
  private streamSeed = 40;

  protected toggleStream(): void {
    if (this.streaming()) {
      this.stopStream();
      return;
    }
    this.streaming.set(true);
    this.streamTimer = setInterval(() => {
      // Bounded random walk in [8, 96].
      this.streamSeed += 1;
      const drift = 10 * Math.sin(this.streamSeed / 5);
      const next = Math.max(8, Math.min(96, this.lastValue() + drift + (this.streamSeed % 7) - 3));
      this.stream.update((w) => [...w.slice(1), Math.round(next)]);
    }, this.streamInterval);
  }

  private stopStream(): void {
    if (this.streamTimer !== null) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
    this.streaming.set(false);
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  protected readonly meterThresholds = { warning: 70, critical: 90 };
  protected readonly flowing = signal(true);
  protected readonly haNodes: StrctFlowNode[] = [
    { id: 'a', label: 'hyperstruct01', role: 'ACTIVE', status: 'success' },
    { id: 'b', label: 'hyperstruct02', role: 'STANDBY', status: 'accent' },
  ];
  protected readonly pipeline: StrctFlowNode[] = [
    { id: 's', label: 'primary', sublabel: 'us-east' },
    { id: 'r', label: 'replica', sublabel: 'us-west' },
  ];

  protected readonly cpuTrend = [40, 52, 48, 61, 55, 68, 62, 70, 62];
  protected readonly memTrend = [70, 72, 75, 74, 78, 80, 79, 82, 81];
  protected readonly netTrend = [120, 180, 90, 260, 200, 340, 280, 310, 340];
  protected readonly errTrend = [8, 6, 7, 5, 4, 3];

  protected readonly hours = ['00', '04', '08', '12', '16', '20', '24'];
  protected readonly dayCpu = [22, 35, 48, 72, 65, 58, 44];

  // Multi-series demo: network in vs out (% of link capacity).
  protected readonly netSeries: StrctChartSeries[] = [
    { data: [30, 45, 38, 62, 55, 78, 48], label: 'In', status: 'accent' },
    { data: [18, 28, 22, 40, 35, 52, 30], label: 'Out', status: 'success' },
  ];
  protected readonly netThresholds: StrctChartThreshold[] = [
    { value: 90, status: 'critical', label: 'cap' },
  ];
  protected readonly pctFormat = (v: number) => v.toFixed(0) + '%';

  protected readonly hostNames = ['hv-01', 'hv-02', 'hv-03', 'hv-04', 'hv-05'];
  protected readonly perHost = [18, 24, 12, 30, 21];

  protected readonly vmStates: StrctDonutSegment[] = [
    { value: 36, label: 'Running', color: 'var(--success)' },
    { value: 8, label: 'Stopped', color: 'var(--t3)' },
    { value: 3, label: 'Suspended', color: 'var(--warning)' },
    { value: 1, label: 'Error', color: 'var(--critical)' },
  ];
}
