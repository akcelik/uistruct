import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctButton,
  StrctChart,
  StrctChartAnnotation,
  StrctChartCurve,
  StrctChartSeries,
  StrctChartThreshold,
  StrctDonut,
  StrctDonutSegment,
  StrctFlow,
  StrctFlowNode,
  StrctGauge,
  StrctIcon,
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
    StrctIcon,
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
      anchor="line-categorical"
      owner="line"
      heading="Categorical series — theme data palette"
      description="For N distinct entities (per-node CPU here) use the categorical slots color: 'chart-1..8' — theme tokens with a fixed, colorblind-validated order per palette; slot 1 tracks the theme's accent hue at data-grade chroma. Semantic statuses stay reserved for health. Switch the palette from the header to see the whole set re-skin."
      code="<strct-chart [series]=&quot;[{data: nodeA, label: 'node-a', color: 'chart-1'}, …]&quot; legend />"
    >
      <div class="chart-box">
        <strct-chart
          [series]="catSeries"
          legend
          yAxis
          [min]="0"
          [max]="100"
          [labels]="monLabels"
          [xTicks]="8"
          [valueFormat]="pctFormat"
          [height]="200"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="line-monitoring"
      owner="line"
      heading="Monitoring: gaps, annotations & min–max band"
      description="A null in the data breaks the line — an agent outage never reads as a flat line (hover the gap: 'no data'). Vertical annotations anchor events ('alarm', 'reboot') to the time axis, and lower/upper per point shades a min–max envelope so downsampled spikes stay visible; the tooltip shows avg (min–max)."
      code='<strct-chart [series]="[{data:avg,lower:min,upper:max,label:&#39;CPU&#39;}]" [annotations]="[{index:14,label:&#39;alarm&#39;,status:&#39;critical&#39;}]" />'
    >
      <div class="chart-box">
        <strct-chart
          [series]="monSeries"
          [annotations]="monAnnotations"
          legend
          yAxis
          [min]="0"
          [max]="100"
          [labels]="monLabels"
          [xTicks]="8"
          [valueFormat]="pctFormat"
          [height]="200"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="line-sync"
      owner="line"
      heading="Synced crosshairs (vCenter-style)"
      description="A performance dashboard stacks charts on one time axis. Wire each chart's (hoverIndex) into the other's [activeIndex] and the crosshair moves on both while you hover either — read every metric at the same instant."
      code='<strct-chart (hoverIndex)="memIdx.set($event)" [activeIndex]="cpuIdx()" … />'
    >
      <div class="chart-box chart-box--stack">
        <strct-chart
          [data]="syncCpu"
          [activeIndex]="syncIdxMem()"
          (hoverIndex)="syncIdxCpu.set($event)"
          [labels]="monLabels"
          [xTicks]="8"
          [min]="0"
          [max]="100"
          [valueFormat]="pctFormat"
          area
          [height]="130"
        />
        <strct-chart
          [data]="syncMem"
          [activeIndex]="syncIdxCpu()"
          (hoverIndex)="syncIdxMem.set($event)"
          [labels]="monLabels"
          [xTicks]="8"
          [min]="0"
          [max]="100"
          [valueFormat]="pctFormat"
          status="success"
          area
          [height]="130"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="line-stacked"
      owner="line"
      heading="Stacked series"
      description="stacked draws each series on the running total of the ones below it, filling solid layer bands — composition and total read together (per-series tooltips keep the original values)."
      code='<strct-chart [series]="tiers" stacked legend />'
    >
      <div class="chart-box">
        <strct-chart
          [series]="stackSeries"
          stacked
          legend
          yAxis
          [labels]="monLabels"
          [xTicks]="8"
          [height]="200"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="line-timelog"
      owner="line"
      heading="Time axis & log scale"
      description="times maps x positions to real timestamps, so uneven sampling renders honestly (watch the gap widths). scale='log' spaces decades equally — the right chart shows request latency percentiles spanning three orders of magnitude."
      code='<strct-chart [data]="lat" [times]="stamps" scale="log" yAxis />'
    >
      <div class="chart-box chart-box--stack">
        <strct-chart
          [data]="timeData"
          [times]="timeStamps"
          [labels]="timeLabels"
          curve="linear"
          dots
          yAxis
          [height]="150"
        />
        <strct-chart
          [series]="latSeries"
          scale="log"
          [min]="1"
          [max]="2000"
          legend
          yAxis
          status="warning"
          [labels]="monLabels"
          [xTicks]="8"
          [valueFormat]="msFormat"
          [height]="170"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="line-zoom"
      owner="line"
      heading="Zoom into a range & export"
      description="Drag across the plot to zoom into that window (the ⟲ chip, a double-click or Escape zooms back out); (brushChange) also emits the selected index range so you can re-query it at finer resolution. toPNG() exports the rendered chart — theme colors baked in — ready for a ticket."
      code='<strct-chart zoom (brushChange)="range.set($event)" #perf /> … perf.toPNG(2)'
    >
      <div class="stack">
        <div class="chart-box">
          <strct-chart
            #zoomChart
            zoom
            (brushChange)="zoomRange.set($event)"
            [data]="zoomData"
            [labels]="zoomLabels"
            [xTicks]="10"
            yAxis
            area
            [min]="0"
            [max]="100"
            [valueFormat]="pctFormat"
            [height]="200"
          />
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button strct-button size="sm" variant="neutral" (click)="exportPng(zoomChart)">
            <strct-icon name="download" [size]="14" /> PNG olarak indir
          </button>
          <span class="echo">
            {{
              zoomRange()
                ? 'seçim: [' + zoomRange()![0] + ', ' + zoomRange()![1] + ']'
                : 'sürükleyerek bir aralık seç'
            }}
          </span>
        </div>
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
      .chart-box--stack {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        max-width: 520px;
      }
      .echo {
        font-size: 12px;
        font-family: var(--mono);
        color: var(--t3);
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
    { data: [18, 28, 22, 40, 35, 52, 30], label: 'Out', status: 'success', dash: true },
  ];
  protected readonly netThresholds: StrctChartThreshold[] = [
    { value: 90, status: 'critical', label: 'cap' },
  ];
  protected readonly pctFormat = (v: number) => v.toFixed(0) + '%';

  // Monitoring demo: 30-minute CPU window with an agent outage (nulls) and a
  // min–max envelope around the per-bucket average.
  protected readonly monLabels = Array.from({ length: 30 }, (_, i) => `${i}m`);
  protected readonly monSeries: StrctChartSeries[] = (() => {
    const avg: (number | null)[] = [];
    const lo: (number | null)[] = [];
    const hi: (number | null)[] = [];
    for (let i = 0; i < 30; i++) {
      if (i >= 12 && i <= 15) {
        avg.push(null);
        lo.push(null);
        hi.push(null);
        continue;
      }
      const base = 38 + 18 * Math.sin(i / 4) + (i > 20 ? 14 : 0);
      avg.push(Math.round(base));
      lo.push(Math.round(base - 6 - (i % 4)));
      hi.push(Math.round(base + 8 + ((i * 3) % 11)));
    }
    return [{ data: avg, lower: lo, upper: hi, label: 'CPU avg (min–max)' }];
  })();
  protected readonly monAnnotations: StrctChartAnnotation[] = [
    { index: 11, label: 'alarm', status: 'critical' },
    { index: 21, label: 'reboot', status: 'warning' },
  ];

  // Categorical demo: 4 distinct nodes on the theme's data palette.
  protected readonly catSeries: StrctChartSeries[] = ['node-a', 'node-b', 'node-c', 'node-d'].map(
    (label, n) => ({
      label,
      color: (['chart-1', 'chart-2', 'chart-3', 'chart-4'] as const)[n],
      data: Array.from({ length: 30 }, (_, i) =>
        Math.round(38 + 22 * Math.sin(i / (3.1 + n * 0.7) + n * 1.9) + 6 * Math.sin(i * 1.3 + n)),
      ),
    }),
  );

  // Synced crosshair demo: two metrics on one time axis.
  protected readonly syncCpu = Array.from({ length: 30 }, (_, i) =>
    Math.round(45 + 22 * Math.sin(i / 3.4) + 6 * Math.sin(i * 1.7)),
  );
  protected readonly syncMem = Array.from({ length: 30 }, (_, i) =>
    Math.round(62 + 9 * Math.sin(i / 5 + 2) + 4 * Math.cos(i * 1.3)),
  );
  protected readonly syncIdxCpu = signal<number | null>(null);
  protected readonly syncIdxMem = signal<number | null>(null);

  // Zoom & export demo: a dense 24h window.
  protected readonly zoomLabels = Array.from({ length: 96 }, (_, i) => {
    const m = i * 15;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  });
  protected readonly zoomData = Array.from({ length: 96 }, (_, i) =>
    Math.round(34 + 20 * Math.sin(i / 8) + 9 * Math.sin(i / 2.1) + (i > 60 && i < 66 ? 28 : 0)),
  );
  protected readonly zoomRange = signal<[number, number] | null>(null);

  // Stacked demo: storage tiers composing a total.
  protected readonly stackSeries: StrctChartSeries[] = [
    {
      data: Array.from({ length: 30 }, (_, i) => Math.round(20 + 6 * Math.sin(i / 4))),
      label: 'Hot tier',
      status: 'accent',
    },
    {
      data: Array.from({ length: 30 }, (_, i) => Math.round(14 + 5 * Math.cos(i / 5))),
      label: 'Warm tier',
      status: 'success',
    },
    {
      data: Array.from({ length: 30 }, (_, i) => Math.round(9 + 3 * Math.sin(i / 3 + 2))),
      label: 'Cold tier',
      status: 'warning',
    },
  ];

  // Time-axis demo: uneven sampling (bursts + quiet stretches).
  protected readonly timeStamps = [0, 1, 2, 3, 8, 9, 15, 16, 17, 25].map((m) => m * 60000);
  protected readonly timeData = [42, 45, 51, 48, 62, 58, 41, 44, 49, 46];
  protected readonly timeLabels = this.timeStamps.map((ms) => `${ms / 60000}m`);

  // Log demo: latency percentiles across three orders of magnitude.
  protected readonly latSeries: StrctChartSeries[] = [
    {
      data: Array.from({ length: 30 }, (_, i) => Math.round(3 + Math.abs(Math.sin(i / 5)) * 4)),
      label: 'p50',
      status: 'success',
    },
    {
      data: Array.from({ length: 30 }, (_, i) => Math.round(20 + Math.abs(Math.sin(i / 4)) * 40)),
      label: 'p95',
      status: 'accent',
    },
    {
      data: Array.from({ length: 30 }, (_, i) =>
        Math.round(150 + Math.abs(Math.sin(i / 6)) * 1400),
      ),
      label: 'p99',
      status: 'warning',
    },
  ];
  protected readonly msFormat = (v: number) => `${v} ms`;
  protected exportPng(chart: StrctChart): void {
    void chart.toPNG(2).then((url) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chart.png';
      a.click();
    });
  }

  protected readonly hostNames = ['hv-01', 'hv-02', 'hv-03', 'hv-04', 'hv-05'];
  protected readonly perHost = [18, 24, 12, 30, 21];

  protected readonly vmStates: StrctDonutSegment[] = [
    { value: 36, label: 'Running', color: 'var(--success)' },
    { value: 8, label: 'Stopped', color: 'var(--t3)' },
    { value: 3, label: 'Suspended', color: 'var(--warning)' },
    { value: 1, label: 'Error', color: 'var(--critical)' },
  ];
}
