import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctChartStatus } from '../charts/sparkline';

/** One density value at a row × column intersection. */
export interface StrctHeatmapCell {
  row: string;
  col: string;
  value: number;
}

/** Facts handed to `summaryFormat` to build the role="img" aria summary. */
export interface StrctHeatmapSummaryInfo {
  /** Grid dimensions. */
  rows: number;
  cols: number;
  /** Observed value range (after clamping to the effective `max`). */
  min: number;
  max: number;
}

const COLOR: Record<StrctChartStatus, string> = {
  accent: 'var(--acc)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  critical: 'var(--critical)',
};

/** Fallback width (px) before the element is measured. */
const W0 = 600;
const PAD = { t: 4, r: 8, b: 16 };

const round = (n: number): number => Math.round(n * 100) / 100;

interface CellRender {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  /** Native tooltip; null for a missing (no-data) cell. */
  tip: string | null;
}

interface LabelRender {
  text: string;
  x: number;
  y: number;
}

/** First-seen order of unique keys — the default axis ordering. */
function uniqueOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/**
 * SVG grid heatmap for density data (host × hour, queue × weekday …).
 *   <strct-heatmap [data]="cells" [rows]="hosts" [cols]="hours" />
 *
 * Each cell's fill is a single-hue intensity ramp — `color-mix` between the
 * status token and the surface — so the scale stays readable under
 * color-vision deficiency (luminance, not hue, carries the value). Rows and
 * columns follow the explicit `rows`/`cols` arrays when given, else first-seen
 * order in `data`; entries outside an explicit ordering are ignored, and
 * intersections without data render as empty cells. The SVG is measured (1:1
 * viewBox) so cells stay crisp at any width; hover a cell for its value.
 */
@Component({
  selector: 'strct-heatmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (isEmpty()) {
      <div class="strct-heatmap__empty">{{ emptyText() }}</div>
    } @else {
      <svg
        class="strct-heatmap__svg"
        role="img"
        [attr.aria-label]="aria()"
        [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
        [attr.width]="width()"
        [attr.height]="height()"
      >
        @for (l of rowLabels(); track l.text) {
          <text
            class="strct-heatmap__label strct-heatmap__label--row"
            [attr.x]="l.x"
            [attr.y]="l.y"
            text-anchor="end"
            dominant-baseline="central"
          >
            {{ l.text }}
          </text>
        }
        @for (l of colLabels(); track l.text) {
          <text
            class="strct-heatmap__label strct-heatmap__label--col"
            [attr.x]="l.x"
            [attr.y]="l.y"
            text-anchor="middle"
          >
            {{ l.text }}
          </text>
        }
        @for (c of cells(); track c.key) {
          <rect
            class="strct-heatmap__cell"
            [class.strct-heatmap__cell--empty]="c.tip === null"
            [attr.x]="c.x"
            [attr.y]="c.y"
            [attr.width]="c.w"
            [attr.height]="c.h"
            [attr.fill]="c.fill"
            rx="2"
          >
            @if (c.tip !== null) {
              <title>{{ c.tip }}</title>
            }
          </rect>
        }
      </svg>
    }
  `,
  host: { class: 'strct-heatmap' },
  styles: [
    `
      .strct-heatmap {
        display: block;
      }
      .strct-heatmap__svg {
        width: 100%;
        display: block;
      }
      .strct-heatmap__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 60px;
        font-size: 12px;
        color: var(--t3);
      }
      .strct-heatmap__label {
        fill: var(--t3);
        font-size: 10px;
      }
      .strct-heatmap__label--row {
        font-family: var(--font);
      }
      .strct-heatmap__label--col {
        font-family: var(--mono);
        font-variant-numeric: tabular-nums;
      }
      .strct-heatmap__cell {
        stroke: var(--bg-1);
        stroke-width: 1;
      }
      @media (prefers-reduced-motion: no-preference) {
        .strct-heatmap__cell {
          transition: opacity 0.12s ease;
        }
      }
      .strct-heatmap__cell:hover {
        opacity: 0.75;
      }
    `,
  ],
})
export class StrctHeatmap {
  /** Density values; a missing row × col intersection renders as an empty cell. */
  readonly data = input<StrctHeatmapCell[]>([]);
  /** Explicit row order (top → bottom). Absent: first-seen order in `data`. */
  readonly rows = input<string[] | null>(null);
  /** Explicit column order (left → right). Absent: first-seen order in `data`. */
  readonly cols = input<string[] | null>(null);
  /** Scale ceiling — the value that maps to full intensity. Auto (data max) when null. */
  readonly max = input<number | null>(null);
  /** Base color of the intensity ramp. */
  readonly status = input<StrctChartStatus>('accent');
  /** Shown when there is no data (localizable). */
  readonly emptyText = input('No data');
  /** Accessible name of the chart, leading the role="img" summary (localizable). */
  readonly ariaLabel = input('Heatmap');
  /**
   * Factory for the role="img" aria summary (localizable); receives the
   * computed facts. When null, a default English summary is generated.
   */
  readonly summaryFormat = input<((info: StrctHeatmapSummaryInfo) => string) | null>(null);
  /** Cell height in pixels (widths flex to the measured container). */
  readonly cellHeight = input(18);
  /** Gap between cells in pixels. */
  readonly gap = input(3);
  /** Left gutter width for the row labels in pixels. */
  readonly rowLabelWidth = input(96);

  /** Measured pixel width → 1:1 viewBox so cells stay crisp at any size. */
  protected readonly width = signal(W0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.host.nativeElement;
      const measure = () => this.width.set(el.clientWidth || W0);
      measure();
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        destroyRef.onDestroy(() => ro.disconnect());
      }
    });
  }

  protected readonly rowOrder = computed(
    () => this.rows() ?? uniqueOrder(this.data().map((d) => d.row)),
  );
  protected readonly colOrder = computed(
    () => this.cols() ?? uniqueOrder(this.data().map((d) => d.col)),
  );

  protected readonly isEmpty = computed(() => !this.rowOrder().length || !this.colOrder().length);

  /** Last write wins when a row × col pair appears twice. */
  private readonly valueMap = computed(() => {
    const map = new Map<string, number>();
    for (const d of this.data()) map.set(`${d.row}\n${d.col}`, d.value);
    return map;
  });

  /** Effective scale ceiling: explicit `max`, else the data's own maximum. */
  protected readonly maxVal = computed(() => {
    const m = this.max();
    if (m != null) return m;
    const vals = this.data().map((d) => d.value);
    return vals.length ? Math.max(...vals) : 0;
  });

  private readonly color = computed(() => COLOR[this.status()]);

  /** Cell width: the plot flexes to the measured container width. */
  private readonly cellW = computed(() => {
    const n = this.colOrder().length;
    if (!n) return 0;
    const plotW = this.width() - this.rowLabelWidth() - PAD.r;
    return Math.max(1, (plotW - (n - 1) * this.gap()) / n);
  });

  protected readonly height = computed(() => {
    const n = this.rowOrder().length;
    if (!n) return 0;
    return PAD.t + n * this.cellHeight() + (n - 1) * this.gap() + PAD.b;
  });

  protected readonly cells = computed<CellRender[]>(() => {
    const out: CellRender[] = [];
    const w = this.cellW();
    const ch = this.cellHeight();
    const gap = this.gap();
    const x0 = this.rowLabelWidth();
    this.rowOrder().forEach((row, r) => {
      this.colOrder().forEach((col, c) => {
        const value = this.valueMap().get(`${row}\n${col}`);
        out.push({
          key: `${r}:${c}`,
          x: round(x0 + c * (w + gap)),
          y: round(PAD.t + r * (ch + gap)),
          w: round(w),
          h: ch,
          fill: value === undefined ? 'var(--bg-2)' : this.fillFor(value),
          tip: value === undefined ? null : `${row} × ${col}: ${value}`,
        });
      });
    });
    return out;
  });

  protected readonly rowLabels = computed<LabelRender[]>(() => {
    const ch = this.cellHeight();
    const gap = this.gap();
    return this.rowOrder().map((text, r) => ({
      text,
      x: this.rowLabelWidth() - 6,
      y: round(PAD.t + r * (ch + gap) + ch / 2),
    }));
  });

  protected readonly colLabels = computed<LabelRender[]>(() => {
    const w = this.cellW();
    const gap = this.gap();
    const x0 = this.rowLabelWidth();
    const y = this.height() - 4;
    return this.colOrder().map((text, c) => ({ text, x: round(x0 + c * (w + gap) + w / 2), y }));
  });

  /** Screen-reader summary of the whole grid (role="img" name). */
  protected readonly aria = computed(() => {
    const info: StrctHeatmapSummaryInfo = {
      rows: this.rowOrder().length,
      cols: this.colOrder().length,
      min: this.data().length ? Math.min(...this.data().map((d) => d.value)) : 0,
      max: this.maxVal(),
    };
    const custom = this.summaryFormat();
    if (custom) return custom(info);
    return `${this.ariaLabel()}, ${info.rows} rows by ${info.cols} columns. Min ${info.min}, max ${info.max}`;
  });

  /**
   * Intensity ramp: 8% of the status hue for the smallest non-zero value up
   * to 100% at the ceiling; zero stays on the empty-cell surface.
   */
  private fillFor(value: number): string {
    if (value <= 0) return 'var(--bg-2)';
    const maxV = this.maxVal();
    const t = maxV > 0 ? Math.min(value / maxV, 1) : 0;
    const pct = 8 + Math.round(t * 92);
    return `color-mix(in srgb, ${this.color()} ${pct}%, var(--bg-1))`;
  }
}
