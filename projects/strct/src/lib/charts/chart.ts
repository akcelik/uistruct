import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import { StrctChartStatus } from './sparkline';

export type StrctChartType = 'line' | 'area' | 'bar';

const COLOR: Record<StrctChartStatus, string> = {
  accent: 'var(--acc)',
  success: 'var(--ok)',
  warning: 'var(--wrn)',
  danger: 'var(--crt)',
};

const VB_W = 320;
const PAD = { l: 6, r: 6, t: 10, b: 10 };

/**
 * Single-series chart (line / area / bar). Dependency-free SVG, token-coloured.
 *   <strct-chart [data]="cpu" type="area" [labels]="hours" status="warning" />
 */
@Component({
  selector: 'strct-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <svg
      class="strct-chart__svg"
      [attr.viewBox]="'0 0 ' + vbW + ' ' + height()"
      preserveAspectRatio="none"
      [style.height.px]="height()"
    >
      @for (g of gridY(); track g) {
        <line class="strct-chart__grid" [attr.x1]="pad.l" [attr.x2]="vbW - pad.r" [attr.y1]="g" [attr.y2]="g" />
      }

      @if (type() === 'bar') {
        @for (b of bars(); track $index) {
          <rect class="strct-chart__bar" [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" [attr.fill]="color()" />
        }
      } @else {
        @if (type() === 'area') {
          <polygon class="strct-chart__area" [attr.points]="areaPoints()" [attr.fill]="color()" />
        }
        <polyline class="strct-chart__line" fill="none" [attr.points]="linePoints()" [attr.stroke]="color()" />
        @for (p of points(); track $index) {
          <circle class="strct-chart__dot" [attr.cx]="p.x" [attr.cy]="p.y" r="2" [attr.fill]="color()" />
        }
      }
    </svg>

    @if (labels().length) {
      <div class="strct-chart__labels">
        @for (l of labels(); track $index) {
          <span>{{ l }}</span>
        }
      </div>
    }
  `,
  host: { class: 'strct-chart' },
  styles: [
    `
    .strct-chart { display: block; }
    .strct-chart__svg { width: 100%; display: block; }
    .strct-chart__grid { stroke: var(--b1); stroke-width: 1; vector-effect: non-scaling-stroke; }
    .strct-chart__line { stroke-width: 2; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; }
    .strct-chart__area { opacity: .13; }
    .strct-chart__dot { stroke: var(--bg-1); stroke-width: 1.5; }
    .strct-chart__bar { rx: 1.5; }
    .strct-chart__labels {
      display: flex; justify-content: space-between; margin-top: 6px;
      font-size: 10px; color: var(--t3);
    }
    `,
  ],
})
export class StrctChart {
  readonly data = input.required<number[]>();
  readonly type = input<StrctChartType>('line');
  readonly labels = input<string[]>([]);
  readonly status = input<StrctChartStatus>('accent');
  readonly height = input(160);
  /** Override the top of the value axis (defaults to the data max + headroom). */
  readonly max = input<number | null>(null);

  protected readonly vbW = VB_W;
  protected readonly pad = PAD;
  protected readonly color = computed(() => COLOR[this.status()]);

  private readonly maxValue = computed(() => {
    const explicit = this.max();
    if (explicit != null) return explicit || 1;
    const m = Math.max(0, ...this.data());
    return m === 0 ? 1 : m * 1.1;
  });

  private chartH(): number {
    return this.height() - PAD.t - PAD.b;
  }

  protected readonly points = computed(() => {
    const d = this.data();
    const chartW = VB_W - PAD.l - PAD.r;
    const max = this.maxValue();
    const stepX = d.length > 1 ? chartW / (d.length - 1) : 0;
    return d.map((v, i) => ({
      x: PAD.l + i * stepX,
      y: PAD.t + (1 - Math.max(0, v) / max) * this.chartH(),
    }));
  });

  protected readonly linePoints = computed(() =>
    this.points().map((p) => `${p.x},${p.y}`).join(' '),
  );

  protected readonly areaPoints = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const base = this.height() - PAD.b;
    return `${PAD.l},${base} ${pts.map((p) => `${p.x},${p.y}`).join(' ')} ${VB_W - PAD.r},${base}`;
  });

  protected readonly bars = computed(() => {
    const d = this.data();
    const chartW = VB_W - PAD.l - PAD.r;
    const max = this.maxValue();
    const base = this.height() - PAD.b;
    const slot = d.length ? chartW / d.length : chartW;
    const w = slot * 0.6;
    return d.map((v, i) => {
      const h = (Math.max(0, v) / max) * this.chartH();
      return { x: PAD.l + i * slot + (slot - w) / 2, y: base - h, w, h };
    });
  });

  protected readonly gridY = computed(() => {
    const top = PAD.t;
    const bottom = this.height() - PAD.b;
    return [top, (top + bottom) / 2, bottom];
  });
}
