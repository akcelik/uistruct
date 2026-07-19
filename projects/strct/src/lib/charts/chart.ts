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
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { StrctChartStatus } from './sparkline';

/** Chart rendering types (line, area, bar). */
export type StrctChartType = 'line' | 'area' | 'bar';
/** Line interpolation between points. */
export type StrctChartCurve = 'smooth' | 'linear' | 'step';

/**
 * A categorical palette slot: theme tokens `--chart-1..8` (FR-CHART-15).
 * Fixed slot order per palette is the CVD-safety mechanism; slot 1 tracks the
 * theme's accent hue at data-grade chroma. Use for N *distinct entities*
 * (per-node CPU, per-datastore latency) — the four semantic statuses stay
 * reserved for health/threshold meaning.
 */
export type StrctChartSlot =
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'chart-6'
  | 'chart-7'
  | 'chart-8';

/** A series color role: a semantic status, or a categorical palette slot. */
export type StrctChartColor = StrctChartStatus | StrctChartSlot;

/** Resolve a color role to its CSS value. */
function colorOf(role: StrctChartColor): string {
  return role.startsWith('chart-') ? `var(--${role})` : COLOR[role as StrctChartStatus];
}

/** One series in a multi-series chart. */
export interface StrctChartSeries {
  /** Values; `null` (or `NaN`) marks a data gap — the line breaks, no interpolation. */
  data: (number | null)[];
  /** Legend + tooltip name. */
  label?: string;
  /**
   * Color role: a semantic status *or* a categorical slot `'chart-1'..'chart-8'`
   * (theme tokens, validator-passed per palette × mode). Takes precedence over
   * `status`; two-directional pairs (in/out, read/write) should instead share
   * one hue and differ by `dash`.
   */
  color?: StrctChartColor;
  /** Per-series semantic color; falls back to the chart's `status`. */
  status?: StrctChartStatus;
  /** Per-series area fill. */
  area?: boolean;
  /** Per-series interpolation; falls back to the chart's `curve`. */
  curve?: StrctChartCurve;
  /**
   * Dashed line — a second visual channel besides color, so two series stay
   * distinguishable under color-vision deficiency. `true` uses `'5 4'`; pass a
   * custom SVG dasharray string to tune it.
   */
  dash?: boolean | string;
  /**
   * Optional per-point lower/upper bound (e.g. min/max per downsampled bucket).
   * When both are set a soft band is filled between them behind the line, so
   * within-bucket spikes stay visible; the tooltip shows `avg (min–max)`.
   */
  lower?: (number | null)[];
  upper?: (number | null)[];
}

/** A vertical event / annotation marker anchored to a data index. */
export interface StrctChartAnnotation {
  /** X position as a data index. */
  index: number;
  /** Shown near the top of the line and in the tooltip at that index. */
  label?: string;
  /** Line color; default 'accent'. */
  status?: StrctChartStatus;
  /** Dashed line; default true. */
  dashed?: boolean;
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

/** A real value — `null` and `NaN` both mark a data gap. */
function isVal(v: number | null | undefined): v is number {
  return v != null && !Number.isNaN(v);
}

/** Split a nullable point array into contiguous non-gap segments. */
function segs(pts: (Pt | null)[]): Pt[][] {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  for (const p of pts) {
    if (p) cur.push(p);
    else if (cur.length) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Line path that breaks at gaps (one sub-path per segment). */
function pathForSegs(pts: (Pt | null)[], curve: StrctChartCurve): string {
  return segs(pts)
    .map((s) => pathFor(s, curve))
    .join('');
}

/** Area path per segment — the fill drops to the baseline at gap edges, never across. */
function areaForSegs(pts: (Pt | null)[], curve: StrctChartCurve, base: number): string {
  return segs(pts)
    .map(
      (s) =>
        `${pathFor(s, curve)}L${round(s[s.length - 1].x)},${round(base)}L${round(s[0].x)},${round(base)}Z`,
    )
    .join('');
}

/** Closed band between per-point upper and lower bounds (gap-aware). */
function bandPath(upper: (Pt | null)[], lower: (Pt | null)[], curve: StrctChartCurve): string {
  let out = '';
  let u: Pt[] = [];
  let l: Pt[] = [];
  const flush = () => {
    if (u.length > 1) {
      const back = pathFor([...l].reverse(), curve).replace(/^M/, 'L');
      out += pathFor(u, curve) + back + 'Z';
    }
    u = [];
    l = [];
  };
  for (let i = 0; i < upper.length; i++) {
    const up = upper[i];
    const lo = lower[i];
    if (up && lo) {
      u.push(up);
      l.push(lo);
    } else flush();
  }
  flush();
  return out;
}

interface SeriesRender {
  color: string;
  label: string;
  area: boolean;
  dash: string | null;
  pts: (Pt | null)[];
  path: string;
  areaPath: string;
  bandPath: string;
  /** Global x-offset (right-aligned) so shorter series line up on the right. */
  offset: number;
  data: (number | null)[];
  lower?: (number | null)[];
  upper?: (number | null)[];
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
              <span
                class="strct-chart__leg-sw"
                [style.background]="
                  it.dash
                    ? 'repeating-linear-gradient(90deg, ' +
                      it.color +
                      ' 0 4px, transparent 4px 7px)'
                    : it.color
                "
              ></span
              >{{ it.label }}
            </span>
          }
        </div>
      }

      <div class="strct-chart__plot">
        <svg
          #svg
          class="strct-chart__svg"
          role="img"
          [attr.aria-label]="chartAria()"
          [attr.tabindex]="interactive() && type() !== 'bar' ? 0 : null"
          [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
          [attr.width]="width()"
          [attr.height]="height()"
          [style.height.px]="height()"
          (pointerdown)="onDown($event)"
          (pointermove)="onMove($event)"
          (pointerup)="onUp()"
          (lostpointercapture)="onUp()"
          (pointerleave)="onLeave()"
          (dblclick)="onDblClick()"
          (keydown)="onKey($event)"
          (blur)="onLeave()"
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

          <!-- Event / annotation markers: behind the data, above the grid. -->
          @for (a of annotationLines(); track $index) {
            <line
              class="strct-chart__ann"
              [class.strct-chart__ann--dashed]="a.dashed"
              [attr.x1]="a.x"
              [attr.x2]="a.x"
              [attr.y1]="pad.t"
              [attr.y2]="height() - pad.b"
              [attr.stroke]="a.color"
            />
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
                    @if (s.bandPath) {
                      <path
                        class="strct-chart__band"
                        [class.strct-chart__band--stack]="stacked()"
                        [attr.d]="s.bandPath"
                        [attr.fill]="s.color"
                      />
                    }
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
                      [attr.stroke-dasharray]="s.dash"
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
                    @for (p of dotPts(); track $index) {
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

            @if (brushRect(); as br) {
              <rect
                class="strct-chart__brush"
                [attr.x]="br.x"
                [attr.y]="pad.t"
                [attr.width]="br.w"
                [attr.height]="height() - pad.t - pad.b"
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

        @for (a of annotationLines(); track $index) {
          @if (a.label) {
            <div class="strct-chart__ann-label" [style.left.px]="a.x" [style.color]="a.color">
              {{ a.label }}
            </div>
          }
        }

        @if (zoomed()) {
          <button type="button" class="strct-chart__reset" (click)="resetZoom()">
            ⟲ {{ resetLabel() }}
          </button>
        }

        @if (interactive() && hoverX() !== null) {
          @if (isMulti()) {
            <div
              class="strct-chart__tip strct-chart__tip--multi"
              [style.left.px]="hoverX()"
              [style.transform]="tipShift()"
            >
              @if (hoverMeta()) {
                <span class="strct-chart__tip-l">{{ hoverMeta() }}</span>
              }
              @if (annAt(); as ann) {
                <span class="strct-chart__tip-ann" [style.color]="ann.color">{{ ann.label }}</span>
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
            <div class="strct-chart__axis-y" [style.top.px]="axisChipY(hp.y)">
              {{ hoverValueText() }}
            </div>
            <div
              class="strct-chart__tip"
              [style.left.px]="hp.x"
              [style.top.px]="hp.y"
              [style.transform]="tipShiftRaised()"
            >
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
              @if (annAt(); as ann) {
                <span class="strct-chart__tip-ann" [style.color]="ann.color">{{ ann.label }}</span>
              }
            </div>
          } @else if (hoverGap()) {
            <!-- A gap point: keep the time slot, say "no data" instead of a value. -->
            <div
              class="strct-chart__tip strct-chart__tip--gap"
              [style.left.px]="hoverX()"
              [style.transform]="tipShift()"
            >
              <span class="strct-chart__tip-v">{{ gapText() }}</span>
              @if (hoverMeta()) {
                <span class="strct-chart__tip-l">{{ hoverMeta() }}</span>
              }
            </div>
          }
        }

        @if (interactive() && type() !== 'bar') {
          <span class="strct-chart__sr" aria-live="polite">{{ srText() }}</span>
        }
      </div>

      @if (displayLabels().length) {
        <!-- Labels sit at their datapoint's real x, so a subsampled axis never lies. -->
        <div class="strct-chart__labels">
          @for (l of displayLabels(); track $index) {
            <span
              [class.strct-chart__label--active]="interactive() && dispIdx() === l.i"
              [style.left.px]="xOf(l.i)"
              >{{ l.text }}</span
            >
          }
        </div>
      }
    }
  `,
  host: {
    class: 'strct-chart',
    '[class.strct-chart--glow]': 'glow()',
    '[class.strct-chart--brush]': 'brush() || zoom()',
    '[style.--strct-chart-c]': 'color()',
  },
  styles: [
    `
      .strct-chart {
        display: block;
        position: relative;
      }
      /* Overlays (ticks, tooltip, threshold tags) anchor to the plot, so a legend
         above the svg can never shift them. */
      .strct-chart__plot {
        position: relative;
      }
      .strct-chart__svg {
        width: 100%;
        display: block;
        touch-action: none;
      }
      .strct-chart__svg:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }
      .strct-chart__sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
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

      /* Min–max envelope behind the series line. */
      .strct-chart__band {
        opacity: 0.13;
        stroke: none;
      }
      /* Stacked fills read as solid layers, not a faint halo. */
      .strct-chart__band--stack {
        opacity: 0.32;
      }

      /* Vertical event / annotation markers. */
      .strct-chart__ann {
        stroke-width: 1;
        opacity: 0.8;
        vector-effect: non-scaling-stroke;
      }
      .strct-chart__ann--dashed {
        stroke-dasharray: 4 3;
      }
      .strct-chart__ann-label {
        position: absolute;
        top: 0;
        transform: translateX(-50%);
        pointer-events: none;
        font-size: 12px;
        font-weight: 600;
        background: var(--bg-1);
        padding: 0 3px;
        border-radius: 3px;
        white-space: nowrap;
      }

      /* Brush selection + zoom-out chip. */
      .strct-chart--brush .strct-chart__svg {
        cursor: crosshair;
      }
      .strct-chart__brush {
        fill: var(--acc);
        opacity: 0.16;
        stroke: var(--acc50);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .strct-chart__reset {
        position: absolute;
        top: 6px;
        right: 8px;
        z-index: 3;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 9px;
        border: 1px solid var(--b2);
        border-radius: 99px;
        background: var(--bg-a);
        color: var(--t2);
        font-family: var(--font);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .strct-chart__reset:hover {
        color: var(--t1);
        border-color: var(--acc50);
      }
      .strct-chart__reset:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }

      .strct-chart__tip--gap {
        top: 6px;
      }
      .strct-chart__tip-ann {
        font-size: 12px;
        font-weight: 600;
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
        text-align: end;
        transform: translateY(-50%);
        pointer-events: none;
        font-family: var(--mono);
        font-size: 12px;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }
      .strct-chart__thr {
        position: absolute;
        right: 2px;
        transform: translateY(-50%);
        pointer-events: none;
        font-size: 12px;
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
        font-size: 12px;
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
        font-size: 12px;
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
        font-size: 12px;
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
        font-size: 12px;
        color: var(--t3);
      }
      .strct-chart__tip-row {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      .strct-chart__tip-sw {
        width: 8px;
        height: 3px;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .strct-chart__tip-rl {
        color: var(--t3);
        margin-inline-end: auto;
      }
      .strct-chart__tip-rv {
        color: var(--t1);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      .strct-chart__labels {
        position: relative;
        height: 15px;
        margin-top: 6px;
        font-size: 12px;
        color: var(--t3);
      }
      .strct-chart__labels span {
        position: absolute;
        transform: translateX(-50%);
        white-space: nowrap;
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
  /** Single-series data (or use `series`). `null` / `NaN` marks a gap — the line breaks. */
  readonly data = input<(number | null)[]>([]);
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
  /** Formatter for the live-mode "Xs ago" tooltip line (receives seconds). */
  readonly agoFormat = input<((seconds: number) => string) | null>(null);
  /**
   * Optional formatter for the values shown in the hover tooltip + y-axis flag
   * (and the delta magnitude). Lets callers add units / fixed precision, e.g.
   * `[valueFormat]="v => v.toFixed(3) + ' %'"`. When null, the raw value is shown.
   */
  readonly valueFormat = input<((v: number) => string) | null>(null);
  /** Vertical event / annotation markers ("alarm raised", "deploy", …). */
  readonly annotations = input<StrctChartAnnotation[]>([]);
  /**
   * Drive the crosshair externally (e.g. mirror a sibling chart's hover for a
   * vCenter-style synced dashboard). A local pointer wins while over this chart.
   */
  readonly activeIndex = input<number | null>(null);
  /** Drag-select a range; the selection is emitted through `brushChange`. */
  readonly brush = input(false, { transform: booleanAttribute });
  /**
   * Drag-select **zooms into** the selected range (implies `brush`).
   * Double-click, Escape or the reset chip zooms back out.
   */
  readonly zoom = input(false, { transform: booleanAttribute });
  /**
   * Stack multi-series values cumulatively: each series draws its line at the
   * running total and fills the band down to the series below (nulls break the
   * stack at that slot). Tooltips keep the original per-series values.
   */
  readonly stacked = input(false, { transform: booleanAttribute });
  /** Y-axis scale. `log` needs positive values; non-positives clamp to the floor. */
  readonly scale = input<'linear' | 'log'>('linear');
  /**
   * Per-point timestamps (ms epoch or Date). When set, x positions map to real
   * time, so uneven sampling renders honestly instead of equally spaced.
   */
  readonly times = input<(number | Date)[] | null>(null);
  /** Tooltip text for a gap (null) point. */
  readonly gapText = input('no data');
  /** Accessible label of the reset-zoom chip (localizable). */
  readonly resetLabel = input('Reset zoom');

  /** Emits the hovered point index (or null on leave) — wire cross-chart sync with it. */
  readonly hoverIndex = output<number | null>();
  /** Emits the brushed [startIndex, endIndex] (inclusive), or null when cleared. */
  readonly brushChange = output<[number, number] | null>();

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
  /** Reactive OS motion preference (tracks live changes, not just first load). */
  private readonly reduceMotion = signal(
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Hover state. `hoverIdx` is the local pointer/keyboard index; `dispIdx` is
  // what actually renders — local wins, else the externally driven activeIndex.
  protected readonly hoverIdx = signal<number | null>(null);
  protected readonly dispIdx = computed<number | null>(() => {
    const local = this.hoverIdx();
    const i = local ?? this.activeIndex();
    if (i == null) return null;
    const [s, e] = this.domain();
    return i >= s && i <= e ? i : null;
  });

  // Zoom / brush state (indices are always in the full-data domain).
  private readonly viewRange = signal<[number, number] | null>(null);
  protected readonly brushDrag = signal<{ a: number; b: number } | null>(null);
  private readonly brushEnabled = computed(() => this.brush() || this.zoom());
  protected readonly zoomed = computed(() => this.viewRange() !== null);

  constructor() {
    const destroyRef = inject(DestroyRef);

    if (typeof matchMedia !== 'undefined') {
      const mq = matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = (e: MediaQueryListEvent) => this.reduceMotion.set(e.matches);
      mq.addEventListener?.('change', onChange);
      destroyRef.onDestroy(() => mq.removeEventListener?.('change', onChange));
    }

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
        this.reduceMotion() ||
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
  private readonly allData = computed<(number | null)[][]>(() => {
    const s = this.seriesResolved();
    return s ? s.map((x) => x.data ?? []) : [this.data()];
  });
  protected readonly isEmpty = computed(() => this.allData().every((d) => d.length === 0));

  /** Number of x slots. */
  private readonly nx = computed(() => Math.max(1, ...this.allData().map((d) => d.length)));

  /** Visible index window: the brush-zoom range, or the full data. */
  private readonly domain = computed<[number, number]>(() => {
    const n = this.nx();
    const vr = this.viewRange();
    if (!vr) return [0, n - 1];
    const s = Math.max(0, Math.min(vr[0], n - 1));
    const e = Math.max(s, Math.min(vr[1], n - 1));
    return e > s ? [s, e] : [0, n - 1];
  });

  /** Left padding: wider when the y-axis labels are shown. */
  protected readonly pl = computed(() => (this.yAxis() ? Y_AXIS_GUTTER : PAD.l));
  private chartW(): number {
    return this.width() - this.pl() - PAD.r;
  }
  private chartH(): number {
    return this.height() - PAD.t - PAD.b;
  }

  /** Horizontal gap between two data points, in px (of the visible window). */
  private stepX(): number {
    const [s, e] = this.domain();
    return e > s ? this.chartW() / (e - s) : 0;
  }

  /** Real values inside the visible window (multi-aware; bands included;
   *  per-slot totals when stacked). */
  private readonly visibleValues = computed<number[]>(() => {
    const [s, e] = this.domain();
    const out: number[] = [];
    const push = (v: number | null | undefined) => {
      if (isVal(v)) out.push(v);
    };
    const ser = this.seriesResolved();
    if (ser && this.stacked() && ser.length > 1) {
      const N = this.nx();
      const totals = new Array<number>(N).fill(0);
      const has = new Array<boolean>(N).fill(false);
      for (const x of ser) {
        const data = x.data ?? [];
        const offset = N - data.length;
        for (let li = 0; li < data.length; li++) {
          const v = data[li];
          if (isVal(v)) {
            totals[offset + li] += v;
            has[offset + li] = true;
          }
        }
      }
      for (let gi = s; gi <= Math.min(e, N - 1); gi++) if (has[gi]) out.push(totals[gi]);
      return out;
    }
    if (ser) {
      const N = this.nx();
      for (const x of ser) {
        const data = x.data ?? [];
        const offset = N - data.length;
        for (let gi = Math.max(s, offset); gi <= e; gi++) {
          const li = gi - offset;
          if (li < 0 || li >= data.length) continue;
          push(data[li]);
          push(x.upper?.[li]);
        }
      }
    } else {
      const d = this.data();
      for (let i = s; i <= Math.min(e, d.length - 1); i++) push(d[i]);
    }
    return out;
  });

  private readonly yMax = computed(() => {
    const explicit = this.max();
    if (explicit != null) return explicit || 1;
    const m = Math.max(0, ...this.visibleValues());
    return m === 0 ? 1 : m * 1.1;
  });
  private readonly yMin = computed(() => this.min() ?? 0);

  /** Smallest positive visible value — the floor of a log axis. */
  private readonly logFloor = computed(() => {
    const explicit = this.min();
    if (explicit != null && explicit > 0) return explicit;
    const positives = this.visibleValues().filter((v) => v > 0);
    return positives.length ? Math.min(...positives) : 1;
  });

  private yOf(v: number): number {
    if (this.scale() === 'log') {
      const lo = this.logFloor();
      const hi = Math.max(this.yMax(), lo * 10);
      const c = Math.max(lo, Math.min(hi, v));
      const span = Math.log10(hi) - Math.log10(lo) || 1;
      const f = (Math.log10(c) - Math.log10(lo)) / span;
      return PAD.t + (1 - f) * this.chartH();
    }
    const lo = this.yMin();
    const hi = this.yMax();
    const range = hi - lo || 1;
    const c = Math.max(lo, Math.min(hi, v));
    return PAD.t + (1 - (c - lo) / range) * this.chartH();
  }

  /** Timestamps normalized to ms (null when the axis is index-based). */
  private readonly timesMs = computed<number[] | null>(() => {
    const t = this.times();
    return t?.length ? t.map((v) => +v) : null;
  });

  // ── Single-series geometry (gap-aware; null keeps its x-slot) ──
  protected readonly points = computed<(Pt | null)[]>(() => {
    const d = this.data();
    return d.map((v, i) => (isVal(v) ? { x: this.xOf(i), y: this.yOf(v) } : null));
  });

  /** Non-gap points only (dot rendering). */
  protected readonly dotPts = computed<Pt[]>(() =>
    this.points().filter((p): p is Pt => p !== null),
  );

  protected readonly head = computed<Pt | null>(() => {
    const p = this.points();
    for (let i = p.length - 1; i >= 0; i--) if (p[i]) return p[i];
    return null;
  });

  private readonly plotPoints = computed<(Pt | null)[]>(() => {
    const p = this.points();
    if (!this.live() || p.length < 2 || !p[0]) return p;
    return [{ x: p[0].x - this.stepX(), y: p[0].y }, ...p];
  });

  protected readonly linePath = computed(() => pathForSegs(this.plotPoints(), this.curve()));

  protected readonly areaPath = computed(() =>
    areaForSegs(this.plotPoints(), this.curve(), this.height() - PAD.b),
  );

  // ── Multi-series geometry ─────────────────────────────────────
  protected readonly multiSeries = computed<SeriesRender[]>(() => {
    const s = this.seriesResolved();
    if (!s) return [];
    const N = this.nx();
    const base = this.height() - PAD.b;
    // Stacked: each series rides on the running total of the ones before it,
    // filling the band down to that total; a null breaks the stack there.
    if (this.stacked() && s.length > 1) {
      const running = new Array<number>(N).fill(0);
      return s.map((x) => {
        const data = x.data ?? [];
        const offset = N - data.length;
        const pts: (Pt | null)[] = [];
        const lowerPts: (Pt | null)[] = [];
        for (let li = 0; li < data.length; li++) {
          const v = data[li];
          const gi = offset + li;
          if (isVal(v)) {
            const lo = running[gi];
            const hi = lo + v;
            running[gi] = hi;
            const px = this.xOf(gi);
            lowerPts.push({ x: px, y: this.yOf(lo) });
            pts.push({ x: px, y: this.yOf(hi) });
          } else {
            lowerPts.push(null);
            pts.push(null);
          }
        }
        const curve = x.curve ?? this.curve();
        return {
          color: colorOf(x.color ?? x.status ?? this.status()),
          label: x.label ?? '',
          area: false,
          dash: x.dash ? (typeof x.dash === 'string' ? x.dash : '5 4') : null,
          pts,
          path: pathForSegs(pts, curve),
          areaPath: '',
          bandPath: bandPath(pts, lowerPts, curve),
          offset,
          data,
        };
      });
    }
    return s.map((x) => {
      const data = x.data ?? [];
      const offset = N - data.length; // right-align shorter series
      const ptOf = (v: number | null | undefined, i: number): Pt | null =>
        isVal(v) ? { x: this.xOf(offset + i), y: this.yOf(v) } : null;
      const pts = data.map((v, i) => ptOf(v, i));
      const curve = x.curve ?? this.curve();
      const path = pathForSegs(pts, curve);
      const area = x.area ?? false;
      const areaPath = area ? areaForSegs(pts, curve, base) : '';
      const band =
        x.lower && x.upper
          ? bandPath(
              x.upper.map((v, i) => ptOf(v, i)),
              x.lower.map((v, i) => ptOf(v, i)),
              curve,
            )
          : '';
      return {
        color: colorOf(x.color ?? x.status ?? this.status()),
        label: x.label ?? '',
        area,
        dash: x.dash ? (typeof x.dash === 'string' ? x.dash : '5 4') : null,
        pts,
        path,
        areaPath,
        bandPath: band,
        offset,
        data,
        lower: x.lower,
        upper: x.upper,
      };
    });
  });

  protected readonly legendItems = computed(() =>
    this.multiSeries()
      .filter((s) => s.label)
      .map((s) => ({ label: s.label, color: s.color, dash: s.dash })),
  );

  // ── Bars (single-series only; gaps render no bar, keep their slot) ──
  protected readonly bars = computed(() => {
    const d = this.data();
    const [s, e] = this.domain();
    const chartW = this.chartW();
    const base = this.height() - PAD.b;
    const last = Math.min(e, d.length - 1);
    const count = Math.max(1, last - s + 1);
    const slot = chartW / count;
    const w = slot * 0.6;
    const pl = this.pl();
    const out: { x: number; y: number; w: number; h: number }[] = [];
    for (let i = s; i <= last; i++) {
      const v = d[i];
      if (!isVal(v)) continue;
      const h = ((Math.max(0, v) - this.yMin()) / (this.yMax() - this.yMin() || 1)) * this.chartH();
      out.push({
        x: pl + (i - s) * slot + (slot - w) / 2,
        y: base - Math.max(0, h),
        w,
        h: Math.max(0, h),
      });
    }
    return out;
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
    const out: { value: number; y: number; text: string }[] = [];
    if (this.scale() === 'log') {
      // Decade ticks between the floor and the max, endpoints included.
      const lo = this.logFloor();
      const hi = Math.max(this.yMax(), lo * 10);
      const values = new Set<number>([lo, hi]);
      for (let p = Math.ceil(Math.log10(lo)); p <= Math.floor(Math.log10(hi)); p++) {
        values.add(10 ** p);
      }
      for (const v of [...values].sort((a, b) => a - b)) {
        out.push({ value: v, y: this.yOf(v), text: this.fmtAxis(v) });
      }
      return out;
    }
    const n = Math.max(2, this.yTicks());
    const lo = this.yMin();
    const hi = this.yMax();
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
    const [s, e] = this.domain();
    const last = Math.min(e, ls.length - 1);
    let idxs: number[];
    if (xt && xt > 1 && last - s + 1 > xt) {
      const stepI = (last - s) / (xt - 1);
      idxs = Array.from(new Set(Array.from({ length: xt }, (_, k) => s + Math.round(k * stepI))));
    } else {
      idxs = Array.from({ length: Math.max(0, last - s + 1) }, (_, k) => s + k);
    }
    return idxs
      .filter((i) => i >= 0 && i < ls.length)
      .map((i) => ({
        text: fmt ? fmt(ls[i], i) : ls[i],
        i,
      }));
  });

  // ── Hover (driven by dispIdx: local pointer, else external activeIndex) ──
  protected readonly hoverX = computed<number | null>(() => {
    const i = this.dispIdx();
    if (i == null) return null;
    return this.xOf(i);
  });

  /**
   * Tooltip edge-flip (FR-CHART-14): near the left edge the balloon
   * left-aligns, near the right edge it right-aligns, otherwise it stays
   * centered — so the first/last point's values are never clipped by an
   * `overflow: hidden` ancestor. Only the balloon shifts; the crosshair
   * stays on the true point-X.
   */
  private readonly tipAlign = computed<'start' | 'center' | 'end'>(() => {
    const x = this.hoverX();
    const w = this.width();
    if (x == null || !w) return 'center';
    if (x < w * 0.12) return 'start';
    if (x > w * 0.88) return 'end';
    return 'center';
  });
  /** Horizontal-only shift (multi / gap tips, anchored below the plot top). */
  protected readonly tipShift = computed(() => {
    switch (this.tipAlign()) {
      case 'start':
        return 'translate(8px, 0)';
      case 'end':
        return 'translate(calc(-100% - 8px), 0)';
      default:
        return 'translate(-50%, 0)';
    }
  });
  /** Shift incl. the single tip's vertical lift above the hover point. */
  protected readonly tipShiftRaised = computed(() => {
    switch (this.tipAlign()) {
      case 'start':
        return 'translate(8px, calc(-100% - 10px))';
      case 'end':
        return 'translate(calc(-100% - 8px), calc(-100% - 10px))';
      default:
        return 'translate(-50%, calc(-100% - 10px))';
    }
  });
  /** Keep the y-axis value chip vertically inside the plot box. */
  protected axisChipY(y: number): number {
    return Math.max(12, Math.min(this.height() - 12, y));
  }

  protected readonly hoverPt = computed<Pt | null>(() => {
    const i = this.dispIdx();
    const p = this.points();
    return i != null && i >= 0 && i < p.length ? p[i] : null;
  });
  protected readonly hoverValue = computed(() => {
    const i = this.dispIdx();
    const d = this.data();
    const v = i != null && i >= 0 && i < d.length ? d[i] : null;
    return isVal(v) ? v : '';
  });
  /** The hovered slot exists but holds a gap (single-series). */
  protected readonly hoverGap = computed(() => {
    const i = this.dispIdx();
    if (i == null || this.isMulti()) return false;
    const d = this.data();
    return i >= 0 && i < d.length && !isVal(d[i]);
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
    const i = this.dispIdx();
    const l = this.labels();
    return i != null && i >= 0 && i < l.length ? l[i] : '';
  });
  /** Change from the previous point (single-series; null at the first point or across a gap). */
  protected readonly hoverDelta = computed<number | null>(() => {
    const i = this.dispIdx();
    const d = this.data();
    if (i == null || i <= 0 || i >= d.length) return null;
    const cur = d[i];
    const prev = d[i - 1];
    return isVal(cur) && isVal(prev) ? cur - prev : null;
  });
  protected readonly absDelta = computed(() => Math.abs(this.hoverDelta() ?? 0));
  /** Second tooltip line: "Xs ago" while live, else the x label. */
  protected readonly hoverMeta = computed(() => {
    const i = this.dispIdx();
    if (i == null) return '';
    if (this.live()) {
      const ago = Math.round(((this.nx() - 1 - i) * this.interval()) / 1000);
      const fmt = this.agoFormat();
      if (fmt) return fmt(ago);
      return ago <= 0 ? 'now' : `${ago}s ago`;
    }
    const l = this.labels();
    return i >= 0 && i < l.length ? l[i] : '';
  });

  /** Per-series value at the hovered index (multi-series tooltip; bands as `avg (min–max)`). */
  protected readonly hoverRows = computed(() => {
    const i = this.dispIdx();
    const s = this.multiSeries();
    if (i == null || !s.length) return [];
    const f = this.valueFormat();
    const fmt = (v: number) => (f ? f(v) : String(v));
    return s
      .map((x) => {
        const li = i - x.offset;
        const raw = li >= 0 && li < x.data.length ? x.data[li] : null;
        const v = isVal(raw) ? raw : null;
        const lo = x.lower?.[li];
        const hi = x.upper?.[li];
        const band = isVal(lo) && isVal(hi) ? ` (${fmt(lo)}–${fmt(hi)})` : '';
        return {
          label: x.label,
          color: x.color,
          value: v,
          text: v == null ? '' : fmt(v) + band,
        };
      })
      .filter((r) => r.value !== null);
  });

  /** Per-series hover dots (multi-series). */
  protected readonly hoverDots = computed(() => {
    const i = this.dispIdx();
    const s = this.multiSeries();
    if (i == null || !s.length) return [];
    return s
      .map((x) => {
        const li = i - x.offset;
        const p = li >= 0 && li < x.pts.length ? x.pts[li] : null;
        return p ? { x: p.x, y: p.y, color: x.color } : null;
      })
      .filter((d): d is { x: number; y: number; color: string } => d !== null);
  });

  // ── Annotations ────────────────────────────────────────────────
  protected readonly annotationLines = computed(() => {
    const [s, e] = this.domain();
    return this.annotations()
      .filter((a) => a.index >= s && a.index <= e)
      .map((a) => ({
        x: this.xOf(a.index),
        color: COLOR[a.status ?? 'accent'],
        dashed: a.dashed ?? true,
        label: a.label ?? '',
        index: a.index,
      }));
  });
  /** The annotation sitting exactly under the crosshair, if any. */
  protected readonly annAt = computed(() => {
    const i = this.dispIdx();
    if (i == null) return null;
    return this.annotationLines().find((a) => a.index === i && a.label) ?? null;
  });

  // ── Brush / zoom ───────────────────────────────────────────────
  protected readonly brushRect = computed(() => {
    const d = this.brushDrag();
    if (!d) return null;
    const x1 = this.xOf(Math.min(d.a, d.b));
    const x2 = this.xOf(Math.max(d.a, d.b));
    return { x: round(x1), w: round(Math.max(1, x2 - x1)) };
  });

  /** Zoom back out to the full data window (also emits `brushChange` null). */
  resetZoom(): void {
    this.brushDrag.set(null);
    if (this.viewRange() !== null) {
      this.viewRange.set(null);
      this.brushChange.emit(null);
    }
  }

  /** Screen-reader summary of the whole chart (role="img" name). */
  protected readonly chartAria = computed(() => {
    const f = this.valueFormat() ?? ((v: number) => String(Math.round(v * 100) / 100));
    if (this.isMulti()) {
      const parts = this.multiSeries().map((s) => {
        const reals = s.data.filter(isVal);
        const last = reals.length ? f(reals[reals.length - 1]) : '';
        return `${s.label || 'series'} latest ${last}`;
      });
      return `Chart, ${this.multiSeries().length} series: ${parts.join('; ')}`;
    }
    const d = this.data();
    const reals = d.filter(isVal);
    if (!reals.length) return this.emptyText();
    return `Chart, ${d.length} points. Min ${f(Math.min(...reals))}, max ${f(Math.max(...reals))}, latest ${f(reals[reals.length - 1])}`;
  });

  /** aria-live text announcing the hovered / keyboard-selected point. */
  protected readonly srText = computed(() => {
    const i = this.dispIdx();
    if (i == null) return '';
    if (this.isMulti()) {
      const rows = this.hoverRows()
        .map((r) => `${r.label || 'series'} ${r.text}`)
        .join(', ');
      return `${this.hoverMeta() || 'point ' + (i + 1)}: ${rows}`;
    }
    const meta = this.hoverMeta();
    const value = this.hoverGap() ? this.gapText() : this.hoverValueText();
    return `${meta ? meta + ': ' : ''}${value}`;
  });

  /** Pixel x of a data index (shared by the plot, labels and annotations).
   *  With `times`, positions map to real timestamps — uneven sampling shows. */
  protected xOf(i: number): number {
    const [s, e] = this.domain();
    const t = this.timesMs();
    if (t && e > s) {
      const clamp = (k: number) => Math.min(Math.max(k, 0), t.length - 1);
      const t0 = t[clamp(s)];
      const span = t[clamp(e)] - t0 || 1;
      return this.pl() + ((t[clamp(i)] - t0) / span) * this.chartW();
    }
    return this.pl() + (i - s) * this.stepX();
  }

  /** Set the local hover index, emitting `hoverIndex` on change. */
  private setHover(i: number | null): void {
    if (i === this.hoverIdx()) return;
    this.hoverIdx.set(i);
    this.hoverIndex.emit(i);
  }

  protected onLeave(): void {
    this.setHover(null);
  }

  /** Keyboard access: arrows walk the points; Escape unwinds brush → zoom → crosshair. */
  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.brushDrag()) {
        this.brushDrag.set(null);
      } else if (this.zoomed()) {
        this.resetZoom();
      } else {
        this.setHover(null);
      }
      return;
    }
    if (!this.interactive() || this.type() === 'bar') return;
    const [s, e] = this.domain();
    const cur = this.hoverIdx();
    let next: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
        next = cur == null ? s : Math.min(e, cur + 1);
        break;
      case 'ArrowLeft':
        next = cur == null ? e : Math.max(s, cur - 1);
        break;
      case 'Home':
        next = s;
        break;
      case 'End':
        next = e;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.setHover(next);
  }

  /** Data index under the pointer, clamped to the visible window. */
  private idxAt(event: PointerEvent): number | null {
    const el = this.svgRef()?.nativeElement;
    if (!el || this.isEmpty()) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return null;
    const [s, e] = this.domain();
    if (this.timesMs()) {
      // Non-uniform x: nearest point by pixel distance.
      const svgX = ((event.clientX - rect.left) / rect.width) * this.width();
      let best = s;
      let bestDist = Infinity;
      for (let i = s; i <= e; i++) {
        const d = Math.abs(this.xOf(i) - svgX);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    }
    const plFrac = this.pl() / this.width();
    const rFrac = PAD.r / this.width();
    const fx = ((event.clientX - rect.left) / rect.width - plFrac) / (1 - plFrac - rFrac);
    return Math.max(s, Math.min(e, s + Math.round(fx * (e - s))));
  }

  protected onDown(event: PointerEvent): void {
    if (!this.brushEnabled() || this.isEmpty()) return;
    const i = this.idxAt(event);
    if (i == null) return;
    (event.currentTarget as Element | null)?.setPointerCapture?.(event.pointerId);
    this.brushDrag.set({ a: i, b: i });
    this.setHover(null);
    event.preventDefault();
  }

  protected onMove(event: PointerEvent): void {
    const drag = this.brushDrag();
    if (drag) {
      const i = this.idxAt(event);
      if (i != null && i !== drag.b) this.brushDrag.set({ a: drag.a, b: i });
      return;
    }
    if (!this.interactive() || (this.type() === 'bar' && !this.isMulti())) return;
    const i = this.idxAt(event);
    if (i != null) this.setHover(i);
  }

  protected onUp(): void {
    const d = this.brushDrag();
    if (!d) return;
    this.brushDrag.set(null);
    const lo = Math.min(d.a, d.b);
    const hi = Math.max(d.a, d.b);
    if (hi - lo < 1) return; // a click, not a selection
    if (this.zoom()) this.viewRange.set([lo, hi]);
    this.brushChange.emit([lo, hi]);
  }

  protected onDblClick(): void {
    if (this.brushEnabled()) this.resetZoom();
  }

  // ── Export (FR-CHART-13) ───────────────────────────────────────
  /**
   * The rendered chart as a standalone SVG string — theme colors resolved to
   * literals, background baked in, y-tick / x-label text included.
   */
  toSVG(): string {
    const svg = this.svgRef()?.nativeElement;
    if (!svg || typeof getComputedStyle === 'undefined') return '';
    const doc = svg.ownerDocument;
    const NS = 'http://www.w3.org/2000/svg';
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', NS);
    clone.removeAttribute('class');
    clone.removeAttribute('style');
    clone.removeAttribute('tabindex');
    const PROPS = [
      'stroke',
      'fill',
      'stroke-width',
      'stroke-dasharray',
      'stroke-linecap',
      'stroke-linejoin',
      'opacity',
      'fill-opacity',
      'stroke-opacity',
    ];
    const src = Array.from(svg.querySelectorAll<SVGElement>('*'));
    const dst = Array.from(clone.querySelectorAll<SVGElement>('*'));
    src.forEach((el, i) => {
      const cs = getComputedStyle(el);
      for (const p of PROPS) {
        const v = cs.getPropertyValue(p);
        if (v) dst[i].setAttribute(p, v);
      }
      dst[i].removeAttribute('class');
    });
    const rootCs = getComputedStyle(svg);
    const bg = rootCs.getPropertyValue('--bg-1').trim();
    const fg = rootCs.getPropertyValue('--t3').trim() || '#888';
    const hasLabels = this.displayLabels().length > 0;
    const w = this.width();
    const h = this.height() + (hasLabels ? 18 : 0);
    clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));
    if (bg) {
      const rect = doc.createElementNS(NS, 'rect');
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      rect.setAttribute('fill', bg);
      clone.insertBefore(rect, clone.firstChild);
    }
    const text = (x: number, y: number, content: string, anchor: string) => {
      const t = doc.createElementNS(NS, 'text');
      t.setAttribute('x', String(round(x)));
      t.setAttribute('y', String(round(y)));
      t.setAttribute('fill', fg);
      t.setAttribute('font-size', '10');
      t.setAttribute('font-family', 'monospace');
      t.setAttribute('text-anchor', anchor);
      t.textContent = content;
      clone.appendChild(t);
    };
    for (const tick of this.yAxisTicks()) text(this.pl() - 6, tick.y + 3.5, tick.text, 'end');
    if (hasLabels) {
      for (const l of this.displayLabels())
        text(this.xOf(l.i), this.height() + 12, l.text, 'middle');
    }
    return new XMLSerializer().serializeToString(clone);
  }

  /** The chart as a PNG data URL at the given scale (default 2×). */
  toPNG(scale = 2): Promise<string> {
    const s = this.toSVG();
    const w = this.width();
    const h = this.height() + (this.displayLabels().length ? 18 : 0);
    return new Promise((resolve, reject) => {
      if (!s) {
        reject(new Error('chart is not rendered'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('no 2d canvas context'));
          return;
        }
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('SVG rasterization failed'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }
}
