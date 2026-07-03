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

/**
 * Single-series chart (line / area / bar). Dependency-free SVG, token-coloured.
 *
 * Lines are smooth by default (monotone cubic, no overshoot); set `curve` to
 * `linear` or `step`. Toggle the gradient fill with `area`, the ambient glow with
 * `glow`, and turn on `live` for streaming metrics — the window scrolls left as
 * you push new points, with a pulsing head at the leading edge. Hover anywhere for
 * a crosshair + value tooltip. The SVG is measured (1:1 coordinates) so dots and
 * the glow stay crisp at any width. Reduced-motion safe.
 *
 *   <strct-chart [data]="cpu" area glow [labels]="hours" status="warning" />
 *   <strct-chart [data]="stream()" live area glow [interval]="1000" />
 */
@Component({
  selector: 'strct-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
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
            [attr.x1]="pad.l"
            [attr.x2]="width() - pad.r"
            [attr.y1]="g"
            [attr.y2]="g"
          />
        }
      }

      @if (type() === 'bar') {
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
          </g>
        </g>

        @if (interactive() && hoverPt(); as hp) {
          <line
            class="strct-chart__cross"
            [attr.x1]="hp.x"
            [attr.x2]="hp.x"
            [attr.y1]="pad.t"
            [attr.y2]="height() - pad.b"
          />
          <line
            class="strct-chart__cross"
            [attr.x1]="pad.l"
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

        @if (live() && head(); as h) {
          <g class="strct-chart__head" [attr.transform]="'translate(' + h.x + ',' + h.y + ')'">
            <circle class="strct-chart__pulse" r="3" [attr.fill]="color()" />
            <circle class="strct-chart__head-dot" r="3" [attr.fill]="color()" />
          </g>
        }
      }
    </svg>

    @if (interactive() && hoverPt(); as hp) {
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
                {{ hoverDelta()! > 0 ? '▲' : hoverDelta()! < 0 ? '▼' : '·' }}{{ absDeltaText() }}
              </span>
            }
            @if (hoverMeta()) {
              <span class="strct-chart__tip-l">{{ hoverMeta() }}</span>
            }
          </span>
        }
      </div>
    }

    @if (labels().length) {
      <div class="strct-chart__labels">
        @for (l of labels(); track $index) {
          <span [class.strct-chart__label--active]="interactive() && hoverIdx() === $index">{{
            l
          }}</span>
        }
      </div>
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

      /* Crosshair value chip on the y-axis edge. */
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
  /** Data array. */
  readonly data = input.required<number[]>();
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
  /** Show a dot at each data point. */
  readonly dots = input(false, { transform: booleanAttribute });
  /** X-axis labels. */
  readonly labels = input<string[]>([]);
  /** Visual status color. */
  readonly status = input<StrctChartStatus>('accent');
  /** Height in pixels. */
  readonly height = input(160);
  /** Override the top of the value axis (defaults to the data max + headroom). */
  readonly max = input<number | null>(null);
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
      if (!this.live() || this.reduceMotion || typeof requestAnimationFrame === 'undefined') return;
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

  private readonly maxValue = computed(() => {
    const explicit = this.max();
    if (explicit != null) return explicit || 1;
    const m = Math.max(0, ...this.data());
    return m === 0 ? 1 : m * 1.1;
  });

  private chartH(): number {
    return this.height() - PAD.t - PAD.b;
  }

  /** Horizontal gap between two data points, in px. */
  private stepX(): number {
    const n = this.data().length;
    const chartW = this.width() - PAD.l - PAD.r;
    return n > 1 ? chartW / (n - 1) : 0;
  }

  protected readonly points = computed<Pt[]>(() => {
    const d = this.data();
    const max = this.maxValue();
    const step = this.stepX();
    return d.map((v, i) => ({
      x: PAD.l + i * step,
      y: PAD.t + (1 - Math.max(0, v) / max) * this.chartH(),
    }));
  });

  /** The leading (newest) point — anchors the live pulse. */
  protected readonly head = computed<Pt | null>(() => {
    const p = this.points();
    return p.length ? p[p.length - 1] : null;
  });

  /**
   * Points fed to the path. In live mode a synthetic point is prepended one step
   * to the left (flat-held) so the line still covers the left edge while the group
   * is shifted right mid-scroll; it stays outside the clip.
   */
  private readonly plotPoints = computed<Pt[]>(() => {
    const p = this.points();
    if (!this.live() || p.length < 2) return p;
    return [{ x: p[0].x - this.stepX(), y: p[0].y }, ...p];
  });

  protected readonly linePath = computed(() => {
    const p = this.plotPoints();
    switch (this.curve()) {
      case 'linear':
        return linearPath(p);
      case 'step':
        return stepPath(p);
      default:
        return smoothPath(p);
    }
  });

  protected readonly areaPath = computed(() => {
    const line = this.linePath();
    const p = this.plotPoints();
    if (!line || !p.length) return '';
    const base = this.height() - PAD.b;
    return `${line}L${round(p[p.length - 1].x)},${round(base)}L${round(p[0].x)},${round(base)}Z`;
  });

  protected readonly bars = computed(() => {
    const d = this.data();
    const chartW = this.width() - PAD.l - PAD.r;
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

  // ── Hover ──────────────────────────────────────────────────────
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
  /** Change from the previous point (null at the first point). */
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
    const n = this.data().length;
    if (this.live()) {
      const ago = Math.round(((n - 1 - i) * this.interval()) / 1000);
      return ago <= 0 ? 'now' : `${ago}s ago`;
    }
    return this.hoverLabel();
  });

  protected onMove(event: PointerEvent): void {
    if (!this.interactive() || this.type() === 'bar') return;
    const el = this.svgRef()?.nativeElement;
    const n = this.data().length;
    if (!el || n === 0) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const fx = (event.clientX - rect.left) / rect.width;
    const idx = Math.max(0, Math.min(n - 1, Math.round(fx * (n - 1))));
    this.hoverIdx.set(idx);
  }
}
