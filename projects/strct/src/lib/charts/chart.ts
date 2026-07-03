import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { StrctChartStatus } from './sparkline';

/** Chart rendering types (line, area, bar). */
export type StrctChartType = 'line' | 'area' | 'bar';
/** Line interpolation between points. */
export type StrctChartCurve = 'smooth' | 'linear' | 'step';

/** One series in a multi-series chart. */
export interface StrctChartSeries {
  data: number[];
  /** Legend + tooltip name. */
  label?: string;
  /** Per-series color; falls back to the chart's `status`. */
  status?: StrctChartStatus;
  /** Per-series area fill. */
  area?: boolean;
  /** Per-series interpolation; falls back to the chart's `curve`. */
  curve?: StrctChartCurve;
}

/** A horizontal reference / threshold line. */
export interface StrctChartThreshold {
  value: number;
  label?: string;
  /** Line color; default 'warning'. */
  status?: StrctChartStatus;
  /** Dashed line; default true. */
  dashed?: boolean;
}

interface Pt {
  x: number;
  y: number;
}

const COLOR: Record<StrctChartStatus, string> = {
  accent: 'var(--acc)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  critical: 'var(--critical)',
};

/** Fallback width (px) before the element is measured. */
const W0 = 600;
const PAD = { l: 8, r: 8, t: 14, b: 12 };
/** Left gutter when the y-axis scale labels are shown. */
const Y_AXIS_GUTTER = 42;

let chartUid = 0;

const round = (n: number): number => Math.round(n * 100) / 100;

/** Linear path: straight segments between points. */
function linearPath(p: Pt[]): string {
  if (!p.length) return '';
  return (
    `M${round(p[0].x)},${round(p[0].y)}` +
    p
      .slice(1)
      .map((q) => `L${round(q.x)},${round(q.y)}`)
      .join('')
  );
}

/** Step-after path: hold, then jump. */
function stepPath(p: Pt[]): string {
  if (!p.length) return '';
  let d = `M${round(p[0].x)},${round(p[0].y)}`;
  for (let i = 1; i < p.length; i++) {
    d += `L${round(p[i].x)},${round(p[i - 1].y)}L${round(p[i].x)},${round(p[i].y)}`;
  }
  return d;
}

/**
 * Monotone cubic (Fritsch–Carlson) interpolation — smooth curves that never
 * overshoot the data, so a metric line stays within its own min/max.
 */
function smoothPath(p: Pt[]): string {
  const n = p.length;
  if (n < 3) return linearPath(p);

  const dx: number[] = [];
  const delta: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1].x - p[i].x;
    delta[i] = dx[i] === 0 ? 0 : (p[i + 1].y - p[i].y) / dx[i];
  }

  const tan: number[] = new Array(n);
  tan[0] = delta[0];
  tan[n - 1] = delta[n - 2];
  for (let i = 1; i < n - 1; i++) {
    tan[i] = delta[i - 1] * delta[i] <= 0 ? 0 : (delta[i - 1] + delta[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (delta[i] === 0) {
      tan[i] = 0;
      tan[i + 1] = 0;
      continue;
    }
    const a = tan[i] / delta[i];
    const b = tan[i + 1] / delta[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      tan[i] = t * a * delta[i];
      tan[i + 1] = t * b * delta[i];
    }
  }

  let d = `M${round(p[0].x)},${round(p[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    const c1x = p[i].x + h;
    const c1y = p[i].y + h * tan[i];
    const c2x = p[i + 1].x - h;
    const c2y = p[i + 1].y - h * tan[i + 1];
    d += `C${round(c1x)},${round(c1y)} ${round(c2x)},${round(c2y)} ${round(p[i + 1].x)},${round(p[i + 1].y)}`;
  }
  return d;
}

function pathFor(pts: Pt[], curve: StrctChartCurve): string {
  return curve === 'linear' ? linearPath(pts) : curve === 'step' ? stepPath(pts) : smoothPath(pts);
}

interface SeriesRender {
  color: string;
  label: string;
  area: boolean;
  pts: Pt[];
  path: string;
  areaPath: string;
  /** Global x-offset (right-aligned) so shorter series line up on the right. */
  offset: number;
  data: number[];
}

/**
 * Single- or multi-series chart (line / area / bar). Dependency-free SVG,
 * token-coloured.
 *
 * Lines are smooth by default (monotone cubic, no overshoot); set `curve` to
 * `linear` or `step`. Toggle the gradient fill with `area`, the ambient glow with
 * `glow`, and turn on `live` for streaming metrics. Pass `series` for multiple
 * lines with a `legend`; add persistent scale labels with `yAxis`, reference lines
 * with `thresholds`, a floor with `min`, and thin x labels with `xTicks`. Hover
 * anywhere for a crosshair + tooltip. The SVG is measured (1:1 coordinates) so
 * dots and the glow stay crisp at any width. Reduced-motion safe.
 *
 *   <strct-chart [data]="cpu" area glow [labels]="hours" status="warning" />
 *   <strct-chart [series]="[{data:inArr,label:'In'},{data:outArr,label:'Out'}]" legend />
 */
@Component({
  selector: 'strct-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (isEmpty()) {
      <div class="strct-chart__empty" [style.height.px]="height()">{{ emptyText() }}</div>
    } @else {
      @if (legend() && legendItems().length) {
        <div class="strct-chart__legend">
          @for (it of legendItems(); track it.label) {
            <span class="strct-chart__leg">
              <span class="strct-chart__leg-sw" [style.background]="it.color"></span>{{ it.label }}
            </span>
          }
        </div>
      }

      <svg
        #svg
        class="strct-chart__svg"
        [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
        [attr.width]="width()"
        [attr.height]="height()"
        [style.height.px]="height()"
        (pointermove)="onMove($event)"
        (pointerleave)="hoverIdx.set(null)"
      >
        <defs>
          <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" [attr.stop-color]="color()" stop-opacity="0.22" />
            <stop offset="0.9" [attr.stop-color]="color()" stop-opacity="0" />
          </linearGradient>
          <clipPath [attr.id]="clipId">
            <rect [attr.x]="0" [attr.y]="0" [attr.width]="width()" [attr.height]="height()" />
          </clipPath>
        </defs>

        @if (grid()) {
          @for (g of gridY(); track g) {
            <line
              class="strct-chart__grid"
              [attr.x1]="pl()"
              [attr.x2]="width() - pad.r"
              [attr.y1]="g"
              [attr.y2]="g"
            />
          }
        }

        @if (type() === 'bar' && !isMulti()) {
          @for (b of bars(); track $index) {
            <rect
              class="strct-chart__bar"
              [attr.x]="b.x"
              [attr.y]="b.y"
              [attr.width]="b.w"
              [attr.height]="b.h"
              [attr.fill]="color()"
            />
          }
        } @else {
          <g [attr.clip-path]="'url(#' + clipId + ')'">
            <g
              class="strct-chart__flow"
              [style.transform]="'translateX(' + slidePx() + 'px)'"
              [style.transition]="sliding() ? 'transform ' + interval() + 'ms linear' : 'none'"
            >
              @if (isMulti()) {
                @for (s of multiSeries(); track $index) {
                  @if (s.area && s.areaPath) {
                    <path
                      class="strct-chart__area strct-chart__area--flat"
                      [attr.d]="s.areaPath"
                      [attr.fill]="s.color"
                    />
                  }
                  <path
                    class="strct-chart__line"
                    fill="none"
                    [attr.stroke-width]="strokeWidth()"
                    [attr.d]="s.path"
                    [attr.stroke]="s.color"
                  />
                }
              } @else {
                @if (showArea()) {
                  <path
                    class="strct-chart__area"
                    [attr.d]="areaPath()"
                    [attr.fill]="'url(#' + gradId + ')'"
                  />
                }
                <path
                  class="strct-chart__line"
                  [class.strct-chart__line--draw]="drawOn()"
                  fill="none"
                  pathLength="1"
                  [attr.stroke-width]="strokeWidth()"
                  [attr.d]="linePath()"
                  [attr.stroke]="color()"
                />
                @if (dots()) {
                  @for (p of points(); track $index) {
                    <circle
                      class="strct-chart__dot"
                      [attr.cx]="p.x"
                      [attr.cy]="p.y"
                      r="2.5"
                      [attr.fill]="color()"
                    />
                  }
                }
              }
            </g>
          </g>

          @for (t of thresholdLines(); track $index) {
            <line
              class="strct-chart__threshold"
              [class.strct-chart__threshold--dashed]="t.dashed"
              [attr.x1]="pl()"
              [attr.x2]="width() - pad.r"
              [attr.y1]="t.y"
              [attr.y2]="t.y"
              [attr.stroke]="t.color"
            />
          }

          @if (interactive() && hoverX() !== null) {
            <line
              class="strct-chart__cross"
              [attr.x1]="hoverX()"
              [attr.x2]="hoverX()"
              [attr.y1]="pad.t"
              [attr.y2]="height() - pad.b"
            />
            @if (!isMulti() && hoverPt(); as hp) {
              <line
                class="strct-chart__cross"
                [attr.x1]="pl()"
                [attr.x2]="width() - pad.r"
                [attr.y1]="hp.y"
                [attr.y2]="hp.y"
              />
              <circle
                class="strct-chart__hoverdot"
                [attr.cx]="hp.x"
                [attr.cy]="hp.y"
                r="3.5"
                [attr.fill]="color()"
              />
            }
            @if (isMulti()) {
              @for (d of hoverDots(); track $index) {
                <circle
                  class="strct-chart__hoverdot"
                  [attr.cx]="d.x"
                  [attr.cy]="d.y"
                  r="3.5"
                  [attr.fill]="d.color"
                />
              }
            }
          }

          @if (!isMulti() && live() && head(); as h) {
            <g class="strct-chart__head" [attr.transform]="'translate(' + h.x + ',' + h.y + ')'">
              <circle class="strct-chart__pulse" r="3" [attr.fill]="color()" />
              <circle class="strct-chart__head-dot" r="3" [attr.fill]="color()" />
            </g>
          }
        }
      </svg>

      @if (yAxis()) {
        @for (t of yAxisTicks(); track t.value) {
          <div class="strct-chart__ytick" [style.top.px]="t.y">{{ t.text }}</div>
        }
      }

      @for (t of thresholdLines(); track $index) {
        @if (t.label) {
          <div class="strct-chart__thr" [style.top.px]="t.y" [style.color]="t.color">
            {{ t.label }}
          </div>
        }
      }

      @if (interactive() && hoverX() !== null) {
        @if (isMulti()) {
          <div class="strct-chart__tip strct-chart__tip--multi" [style.left.px]="hoverX()">
            @if (hoverMeta()) {
              <span class="strct-chart__tip-l">{{ hoverMeta() }}</span>
            }
            @for (r of hoverRows(); track r.label) {
              <span class="strct-chart__tip-row">
                <span class="strct-chart__tip-sw" [style.background]="r.color"></span>
                @if (r.label) {
                  <span class="strct-chart__tip-rl">{{ r.label }}</span>
                }
                <span class="strct-chart__tip-rv">{{ r.text }}</span>
              </span>
            }
          </div>
        } @else if (hoverPt(); as hp) {
          <div class="strct-chart__axis-y" [style.top.px]="hp.y">{{ hoverValueText() }}</div>
          <div class="strct-chart__tip" [style.left.px]="hp.x" [style.top.px]="hp.y">
            <span class="strct-chart__tip-v">{{ hoverValueText() }}</span>
            @if (hoverDelta() !== null || hoverMeta()) {
              <span class="strct-chart__tip-meta">
                @if (hoverDelta() !== null) {
                  <span
                    class="strct-chart__tip-delta"
                    [class.strct-chart__tip-delta--up]="hoverDelta()! > 0"
                    [class.strct-chart__tip-delta--down]="hoverDelta()! < 0"
                  >
                    {{ hoverDelta()! > 0 ? '▲' : hoverDelta()! < 0 ? '▼' : '·'
                    }}{{ absDeltaText() }}
                  </span>
                }
                @if (hoverMeta()) {
                  <span class="strct-chart__tip-l">{{ hoverMeta() }}</span>
                }
              </span>
            }
          </div>
        }
      }

      @if (displayLabels().length) {
        <div
          class="strct-chart__labels"
          [style.paddingLeft.px]="yAxis() ? pl() : 0"
          [style.paddingRight.px]="yAxis() ? pad.r : 0"
        >
          @for (l of displayLabels(); track $index) {
            <span [class.strct-chart__label--active]="interactive() && hoverIdx() === l.i">{{
              l.text
            }}</span>
          }
        </div>
      }
    }
  `,
  host: {
    class: 'strct-chart',
    '[class.strct-chart--glow]': 'glow()',
    '[style.--strct-chart-c]': 'color()',
  },
  styles: [
    `
      .strct-chart {
        display: block;
        position: relative;
      }
      .strct-chart__svg {
        width: 100%;
        display: block;
        touch-action: none;
      }
      .strct-chart__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: var(--t3);
      }
      .strct-chart__grid {
        stroke: var(--b1);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .strct-chart__line {
        vector-effect: non-scaling-stroke;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
      .strct-chart__area {
        stroke: none;
      }
      .strct-chart__area--flat {
        opacity: 0.14;
      }
      .strct-chart__dot,
      .strct-chart__hoverdot,
      .strct-chart__head-dot {
        stroke: var(--bg-1);
        stroke-width: 1.5;
      }
      .strct-chart__cross {
        stroke: var(--strct-chart-c);
        stroke-width: 1;
        opacity: 0.4;
        stroke-dasharray: 3 3;
        vector-effect: non-scaling-stroke;
      }
      .strct-chart__threshold {
        stroke-width: 1;
        opacity: 0.85;
        vector-effect: non-scaling-stroke;
      }
      .strct-chart__threshold--dashed {
        stroke-dasharray: 4 3;
      }
      .strct-chart__bar {
        rx: 1.5;
      }

      /* Ambient neon glow — layered shadows for depth without thickening the line. */
      .strct-chart--glow .strct-chart__line {
        filter: drop-shadow(0 0 1.5px var(--strct-chart-c))
          drop-shadow(0 0 5px var(--strct-chart-c));
      }
      .strct-chart--glow .strct-chart__head-dot {
        filter: drop-shadow(0 0 2px var(--strct-chart-c)) drop-shadow(0 0 6px var(--strct-chart-c));
      }
      .strct-chart--glow .strct-chart__hoverdot {
        filter: drop-shadow(0 0 4px var(--strct-chart-c));
      }

      /* Persistent y-axis scale labels + crosshair value chip on the y-axis edge. */
      .strct-chart__ytick {
        position: absolute;
        left: 0;
        width: ${Y_AXIS_GUTTER - 8}px;
        text-align: right;
        transform: translateY(-50%);
        pointer-events: none;
        font-family: var(--mono);
        font-size: 10px;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }
      .strct-chart__thr {
        position: absolute;
        right: 2px;
        transform: translateY(-50%);
        pointer-events: none;
        font-size: 10px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        background: var(--bg-1);
        padding: 0 3px;
        border-radius: 3px;
      }
      .strct-chart__axis-y {
        position: absolute;
        left: 0;
        transform: translateY(-50%);
        pointer-events: none;
        padding: 1px 5px;
        border-radius: var(--radius-sm);
        background: var(--bg-a);
        border: 1px solid var(--b2);
        font-family: var(--mono);
        font-size: 10px;
        font-weight: 600;
        color: var(--t2);
        font-variant-numeric: tabular-nums;
        z-index: 2;
      }
      .strct-chart__label--active {
        color: var(--t1);
        font-weight: 700;
      }

      /* Legend */
      .strct-chart__legend {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 14px;
        margin-bottom: 8px;
        font-size: 11px;
        color: var(--t2);
      }
      .strct-chart__leg {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .strct-chart__leg-sw {
        width: 9px;
        height: 3px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      /* Hover tooltip. */
      .strct-chart__tip {
        position: absolute;
        transform: translate(-50%, calc(-100% - 10px));
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        background: var(--bg-a);
        border: 1px solid var(--b2);
        box-shadow: var(--shadow-elevated);
        white-space: nowrap;
        z-index: 2;
      }
      .strct-chart__tip--multi {
        top: 6px;
        transform: translate(-50%, 0);
        align-items: stretch;
        gap: 3px;
      }
      .strct-chart__tip-v {
        font-size: 12px;
        font-weight: 700;
        color: var(--t1);
        font-variant-numeric: tabular-nums;
      }
      .strct-chart__tip-meta {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .strct-chart__tip-delta {
        font-size: 10px;
        font-weight: 600;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }
      .strct-chart__tip-delta--up {
        color: var(--success);
      }
      .strct-chart__tip-delta--down {
        color: var(--critical);
      }
      .strct-chart__tip-l {
        font-size: 10px;
        color: var(--t3);
      }
      .strct-chart__tip-row {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
      }
      .strct-chart__tip-sw {
        width: 8px;
        height: 3px;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .strct-chart__tip-rl {
        color: var(--t3);
        margin-right: auto;
      }
      .strct-chart__tip-rv {
        color: var(--t1);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      .strct-chart__labels {
        display: flex;
        justify-content: space-between;
        margin-top: 6px;
        font-size: 10px;
        color: var(--t3);
      }

      @media (prefers-reduced-motion: no-preference) {
        .strct-chart__line--draw {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: strct-chart-draw 0.9s ease forwards;
        }
        .strct-chart__pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: strct-chart-pulse 2.4s ease-out infinite;
        }
      }
      @keyframes strct-chart-draw {
        to {
          stroke-dashoffset: 0;
        }
      }
      @keyframes strct-chart-pulse {
        0% {
          transform: scale(1);
          opacity: 0.45;
        }
        70% {
          opacity: 0;
        }
        100% {
          transform: scale(2.5);
          opacity: 0;
        }
      }
    `,
  ],
})
export class StrctChart {
  /** Single-series data (or use `series`). */
  readonly data = input<number[]>([]);
  /** Multiple series; when set it takes precedence over `data`. */
  readonly series = input<StrctChartSeries[] | null>(null);
  /** Visual type / variant. */
  readonly type = input<StrctChartType>('line');
  /** Line interpolation. */
  readonly curve = input<StrctChartCurve>('smooth');
  /** Fill the area under the line with a soft gradient. */
  readonly area = input(false, { transform: booleanAttribute });
  /** Soft ambient glow on the line and the leading-edge dot. */
  readonly glow = input(false, { transform: booleanAttribute });
  /** Live streaming: the window scrolls left as new points arrive. */
  readonly live = input(false, { transform: booleanAttribute });
  /** Expected ms between updates in live mode (drives the scroll duration). */
  readonly interval = input(1000);
  /** Hover crosshair + value tooltip. */
  readonly interactive = input(true, { transform: booleanAttribute });
  /** Line thickness in pixels. */
  readonly strokeWidth = input(1.75);
  /** Show the horizontal gridlines. */
  readonly grid = input(true, { transform: booleanAttribute });
  /** Show a dot at each data point (single-series). */
  readonly dots = input(false, { transform: booleanAttribute });
  /** Show a legend (with `series`). */
  readonly legend = input(false, { transform: booleanAttribute });
  /** X-axis labels. */
  readonly labels = input<string[]>([]);
  /** Target number of x labels; null renders every label. */
  readonly xTicks = input<number | null>(null);
  /** Formatter for x labels. */
  readonly xFormat = input<((label: string, index: number) => string) | null>(null);
  /** Visual status color. */
  readonly status = input<StrctChartStatus>('accent');
  /** Height in pixels. */
  readonly height = input(160);
  /** Override the top of the value axis (defaults to the data max + headroom). */
  readonly max = input<number | null>(null);
  /** Override the floor of the value axis (defaults to 0). */
  readonly min = input<number | null>(null);
  /** Persistent y-axis scale labels. */
  readonly yAxis = input(false, { transform: booleanAttribute });
  /** Approx number of y ticks. */
  readonly yTicks = input(3);
  /** Formatter for y-axis labels; falls back to `valueFormat`. */
  readonly axisFormat = input<((v: number) => string) | null>(null);
  /** Horizontal reference / threshold lines. */
  readonly thresholds = input<StrctChartThreshold[]>([]);
  /** Text shown when there is no data. */
  readonly emptyText = input<string>('No data');
  /**
   * Optional formatter for the values shown in the hover tooltip + y-axis flag
   * (and the delta magnitude). Lets callers add units / fixed precision, e.g.
   * `[valueFormat]="v => v.toFixed(3) + ' %'"`. When null, the raw value is shown.
   */
  readonly valueFormat = input<((v: number) => string) | null>(null);

  protected readonly pad = PAD;
  protected readonly color = computed(() => COLOR[this.status()]);
  protected readonly showArea = computed(() => this.area() || this.type() === 'area');

  private readonly uid = ++chartUid;
  protected readonly gradId = `strct-chart-grad-${this.uid}`;
  protected readonly clipId = `strct-chart-clip-${this.uid}`;

  /** Measured pixel width → 1:1 viewBox so dots / glow stay crisp at any size. */
  protected readonly width = signal(W0);
  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('svg');

  // Live-scroll state.
  protected readonly slidePx = signal(0);
  protected readonly sliding = signal(false);
  protected readonly drawOn = signal(true);
  private firstData = true;
  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hover state.
  protected readonly hoverIdx = signal<number | null>(null);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const el = this.svgRef()?.nativeElement;
      if (!el) return;
      const measure = () => this.width.set(el.clientWidth || W0);
      measure();
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        destroyRef.onDestroy(() => ro.disconnect());
      }
    });

    // On each new data frame in live mode, jump one step right then ease back to
    // 0 — a continuous left scroll (the classic realtime "conveyor").
    effect(() => {
      const d = this.data();
      if (
        this.isMulti() ||
        !this.live() ||
        this.reduceMotion ||
        typeof requestAnimationFrame === 'undefined'
      )
        return;
      untracked(() => {
        if (this.firstData) {
          this.firstData = false;
          return;
        }
        if (d.length < 2) return;
        this.sliding.set(false);
        this.slidePx.set(this.stepX());
        requestAnimationFrame(() => {
          this.sliding.set(true);
          this.slidePx.set(0);
        });
      });
    });
  }

  // ── Series / domain ────────────────────────────────────────────
  private readonly seriesResolved = computed<StrctChartSeries[] | null>(() => {
    const s = this.series();
    return s && s.length ? s : null;
  });
  protected readonly isMulti = computed(() => this.seriesResolved() !== null);

  /** All data arrays (multi or single). */
  private readonly allData = computed<number[][]>(() => {
    const s = this.seriesResolved();
    return s ? s.map((x) => x.data ?? []) : [this.data()];
  });
  protected readonly isEmpty = computed(() => this.allData().every((d) => d.length === 0));

  /** Number of x slots. */
  private readonly nx = computed(() => Math.max(1, ...this.allData().map((d) => d.length)));

  /** Left padding: wider when the y-axis labels are shown. */
  protected readonly pl = computed(() => (this.yAxis() ? Y_AXIS_GUTTER : PAD.l));
  private chartW(): number {
    return this.width() - this.pl() - PAD.r;
  }
  private chartH(): number {
    return this.height() - PAD.t - PAD.b;
  }

  /** Horizontal gap between two data points, in px. */
  private stepX(): number {
    const n = this.nx();
    return n > 1 ? this.chartW() / (n - 1) : 0;
  }

  private readonly yMax = computed(() => {
    const explicit = this.max();
    if (explicit != null) return explicit || 1;
    const m = Math.max(0, ...this.allData().flat());
    return m === 0 ? 1 : m * 1.1;
  });
  private readonly yMin = computed(() => this.min() ?? 0);

  private yOf(v: number): number {
    const lo = this.yMin();
    const hi = this.yMax();
    const range = hi - lo || 1;
    const c = Math.max(lo, Math.min(hi, v));
    return PAD.t + (1 - (c - lo) / range) * this.chartH();
  }

  // ── Single-series geometry (unchanged output) ─────────────────
  protected readonly points = computed<Pt[]>(() => {
    const d = this.data();
    const step = this.stepX();
    const pl = this.pl();
    return d.map((v, i) => ({ x: pl + i * step, y: this.yOf(v) }));
  });

  protected readonly head = computed<Pt | null>(() => {
    const p = this.points();
    return p.length ? p[p.length - 1] : null;
  });

  private readonly plotPoints = computed<Pt[]>(() => {
    const p = this.points();
    if (!this.live() || p.length < 2) return p;
    return [{ x: p[0].x - this.stepX(), y: p[0].y }, ...p];
  });

  protected readonly linePath = computed(() => pathFor(this.plotPoints(), this.curve()));

  protected readonly areaPath = computed(() => {
    const line = this.linePath();
    const p = this.plotPoints();
    if (!line || !p.length) return '';
    const base = this.height() - PAD.b;
    return `${line}L${round(p[p.length - 1].x)},${round(base)}L${round(p[0].x)},${round(base)}Z`;
  });

  // ── Multi-series geometry ─────────────────────────────────────
  protected readonly multiSeries = computed<SeriesRender[]>(() => {
    const s = this.seriesResolved();
    if (!s) return [];
    const N = this.nx();
    const step = this.stepX();
    const pl = this.pl();
    const base = this.height() - PAD.b;
    return s.map((x) => {
      const data = x.data ?? [];
      const offset = N - data.length; // right-align shorter series
      const pts = data.map((v, i) => ({ x: pl + (offset + i) * step, y: this.yOf(v) }));
      const curve = x.curve ?? this.curve();
      const path = pathFor(pts, curve);
      const area = x.area ?? false;
      const areaPath =
        area && pts.length
          ? `${path}L${round(pts[pts.length - 1].x)},${round(base)}L${round(pts[0].x)},${round(base)}Z`
          : '';
      return {
        color: COLOR[x.status ?? this.status()],
        label: x.label ?? '',
        area,
        pts,
        path,
        areaPath,
        offset,
        data,
      };
    });
  });

  protected readonly legendItems = computed(() =>
    this.multiSeries()
      .filter((s) => s.label)
      .map((s) => ({ label: s.label, color: s.color })),
  );

  // ── Bars (single-series only) ─────────────────────────────────
  protected readonly bars = computed(() => {
    const d = this.data();
    const chartW = this.chartW();
    const base = this.height() - PAD.b;
    const slot = d.length ? chartW / d.length : chartW;
    const w = slot * 0.6;
    const pl = this.pl();
    return d.map((v, i) => {
      const h = ((Math.max(0, v) - this.yMin()) / (this.yMax() - this.yMin() || 1)) * this.chartH();
      return { x: pl + i * slot + (slot - w) / 2, y: base - Math.max(0, h), w, h: Math.max(0, h) };
    });
  });

  // ── Axes ───────────────────────────────────────────────────────
  protected readonly gridY = computed(() => {
    const top = PAD.t;
    const bottom = this.height() - PAD.b;
    return [top, (top + bottom) / 2, bottom];
  });

  private fmtAxis(v: number): string {
    const f = this.axisFormat() ?? this.valueFormat();
    return f ? f(v) : String(Math.round(v * 100) / 100);
  }

  protected readonly yAxisTicks = computed(() => {
    if (!this.yAxis()) return [];
    const n = Math.max(2, this.yTicks());
    const lo = this.yMin();
    const hi = this.yMax();
    const out: { value: number; y: number; text: string }[] = [];
    for (let i = 0; i < n; i++) {
      const v = lo + (hi - lo) * (i / (n - 1));
      out.push({ value: v, y: this.yOf(v), text: this.fmtAxis(v) });
    }
    return out;
  });

  protected readonly thresholdLines = computed(() =>
    this.thresholds().map((t) => ({
      y: this.yOf(t.value),
      color: COLOR[t.status ?? 'warning'],
      dashed: t.dashed ?? true,
      label: t.label ?? '',
    })),
  );

  protected readonly displayLabels = computed(() => {
    const ls = this.labels();
    const fmt = this.xFormat();
    const xt = this.xTicks();
    let items: { l: string; i: number }[];
    if (xt && xt > 1 && ls.length > xt) {
      const stepI = (ls.length - 1) / (xt - 1);
      const idxs = Array.from(new Set(Array.from({ length: xt }, (_, k) => Math.round(k * stepI))));
      items = idxs.map((i) => ({ l: ls[i], i }));
    } else {
      items = ls.map((l, i) => ({ l, i }));
    }
    return items.map(({ l, i }) => ({ text: fmt ? fmt(l, i) : l, i }));
  });

  // ── Hover ──────────────────────────────────────────────────────
  protected readonly hoverX = computed<number | null>(() => {
    const i = this.hoverIdx();
    if (i == null) return null;
    return this.pl() + i * this.stepX();
  });
  protected readonly hoverPt = computed<Pt | null>(() => {
    const i = this.hoverIdx();
    const p = this.points();
    return i != null && i >= 0 && i < p.length ? p[i] : null;
  });
  protected readonly hoverValue = computed(() => {
    const i = this.hoverIdx();
    const d = this.data();
    return i != null && i >= 0 && i < d.length ? d[i] : '';
  });
  /** hoverValue run through valueFormat (unit / precision), else the raw value. */
  protected readonly hoverValueText = computed(() => {
    const v = this.hoverValue();
    if (v === '' || v == null) return '';
    const f = this.valueFormat();
    return f ? f(v as number) : String(v);
  });
  /** Delta magnitude, formatted the same way so its unit matches the value. */
  protected readonly absDeltaText = computed(() => {
    const f = this.valueFormat();
    return f ? f(this.absDelta()) : String(this.absDelta());
  });
  protected readonly hoverLabel = computed(() => {
    const i = this.hoverIdx();
    const l = this.labels();
    return i != null && i >= 0 && i < l.length ? l[i] : '';
  });
  /** Change from the previous point (single-series; null at the first point). */
  protected readonly hoverDelta = computed<number | null>(() => {
    const i = this.hoverIdx();
    const d = this.data();
    return i != null && i > 0 && i < d.length ? d[i] - d[i - 1] : null;
  });
  protected readonly absDelta = computed(() => Math.abs(this.hoverDelta() ?? 0));
  /** Second tooltip line: "Xs ago" while live, else the x label. */
  protected readonly hoverMeta = computed(() => {
    const i = this.hoverIdx();
    if (i == null) return '';
    if (this.live()) {
      const ago = Math.round(((this.nx() - 1 - i) * this.interval()) / 1000);
      return ago <= 0 ? 'now' : `${ago}s ago`;
    }
    const l = this.labels();
    return i >= 0 && i < l.length ? l[i] : '';
  });

  /** Per-series value at the hovered index (multi-series tooltip). */
  protected readonly hoverRows = computed(() => {
    const i = this.hoverIdx();
    const s = this.multiSeries();
    if (i == null || !s.length) return [];
    const f = this.valueFormat();
    return s
      .map((x) => {
        const li = i - x.offset;
        const v = li >= 0 && li < x.data.length ? x.data[li] : null;
        return {
          label: x.label,
          color: x.color,
          value: v,
          text: v == null ? '' : f ? f(v) : String(v),
        };
      })
      .filter((r) => r.value !== null);
  });

  /** Per-series hover dots (multi-series). */
  protected readonly hoverDots = computed(() => {
    const i = this.hoverIdx();
    const s = this.multiSeries();
    if (i == null || !s.length) return [];
    return s
      .map((x) => {
        const li = i - x.offset;
        return li >= 0 && li < x.pts.length
          ? { x: x.pts[li].x, y: x.pts[li].y, color: x.color }
          : null;
      })
      .filter((d): d is { x: number; y: number; color: string } => d !== null);
  });

  protected onMove(event: PointerEvent): void {
    if (!this.interactive() || (this.type() === 'bar' && !this.isMulti())) return;
    const el = this.svgRef()?.nativeElement;
    const n = this.nx();
    if (!el || this.isEmpty()) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const plFrac = this.pl() / this.width();
    const rFrac = PAD.r / this.width();
    const fx = ((event.clientX - rect.left) / rect.width - plFrac) / (1 - plFrac - rFrac);
    const idx = Math.max(0, Math.min(n - 1, Math.round(fx * (n - 1))));
    this.hoverIdx.set(idx);
  }
}
