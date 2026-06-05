import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

/** Chart / gauge / sparkline status colors. */
export type StrctChartStatus = 'accent' | 'success' | 'warning' | 'critical';

const STROKE: Record<StrctChartStatus, string> = {
  accent: 'var(--acc)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  critical: 'var(--critical)',
};

/**
 * Tiny inline trend line. `<strct-sparkline [data]="[3,5,4,8,6,9]" area />`.
 */
@Component({
  selector: 'strct-sparkline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <svg
      class="strct-spark__svg"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      [style.width.px]="width()"
      [style.height.px]="height()"
    >
      @if (area()) {
        <polygon class="strct-spark__area" [attr.points]="areaPoints()" [attr.fill]="color()" />
      }
      <polyline
        class="strct-spark__line"
        fill="none"
        [attr.points]="linePoints()"
        [attr.stroke]="color()"
      />
    </svg>
  `,
  host: { class: 'strct-spark' },
  styles: [
    `
      .strct-spark {
        display: inline-block;
        line-height: 0;
      }
      .strct-spark__line {
        stroke-width: 1.6;
        vector-effect: non-scaling-stroke;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
      .strct-spark__area {
        opacity: 0.14;
      }
    `,
  ],
})
export class StrctSparkline {
  /** Data array. */
  readonly data = input.required<number[]>();
  /** Visual status color. */
  readonly status = input<StrctChartStatus>('accent');
  /** Fill the area under the line. */
  readonly area = input(false, { transform: booleanAttribute });
  /** Width (CSS length). */
  readonly width = input(100);
  /** Height in pixels. */
  readonly height = input(30);

  protected readonly color = computed(() => STROKE[this.status()]);

  private readonly points = computed(() => {
    const d = this.data();
    if (!d.length) return [] as { x: number; y: number }[];
    const min = Math.min(...d);
    const max = Math.max(...d);
    const span = max - min || 1;
    const stepX = d.length > 1 ? 100 / (d.length - 1) : 0;
    return d.map((v, i) => ({ x: i * stepX, y: 29 - ((v - min) / span) * 28 }));
  });

  protected readonly linePoints = computed(() =>
    this.points()
      .map((p) => `${p.x},${p.y}`)
      .join(' '),
  );

  protected readonly areaPoints = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    return `0,30 ${pts.map((p) => `${p.x},${p.y}`).join(' ')} 100,30`;
  });
}
