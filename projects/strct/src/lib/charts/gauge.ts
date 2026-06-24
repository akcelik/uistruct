import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { StrctChartStatus } from './sparkline';
import { StrctThresholds } from '../status';

const COLOR: Record<StrctChartStatus, string> = {
  accent: 'var(--acc)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  critical: 'var(--critical)',
};

/**
 * 270° radial gauge for a 0–100 value (CPU, memory, capacity …).
 *   <strct-gauge [value]="72" status="warning" label="CPU" />
 */
@Component({
  selector: 'strct-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-gauge__wrap" [style.width.px]="size()" [style.height.px]="size()">
      <svg
        [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
        [style.width.px]="size()"
        [style.height.px]="size()"
      >
        <g [attr.transform]="'rotate(135 ' + half() + ' ' + half() + ')'">
          <circle
            class="strct-gauge__track"
            [attr.cx]="half()"
            [attr.cy]="half()"
            [attr.r]="radius()"
            fill="none"
            [attr.stroke-width]="thickness()"
            stroke-linecap="round"
            [attr.stroke-dasharray]="trackDash()"
          />
          <circle
            class="strct-gauge__value"
            [attr.cx]="half()"
            [attr.cy]="half()"
            [attr.r]="radius()"
            fill="none"
            [attr.stroke]="color()"
            [attr.stroke-width]="thickness()"
            stroke-linecap="round"
            [attr.stroke-dasharray]="valueDash()"
          />
        </g>
      </svg>
      <div class="strct-gauge__center">
        <div class="strct-gauge__num">{{ clamped() }}<span class="strct-gauge__pct">%</span></div>
        @if (label()) {
          <div class="strct-gauge__label">{{ label() }}</div>
        }
      </div>
    </div>
  `,
  host: { class: 'strct-gauge' },
  styles: [
    `
      .strct-gauge {
        display: inline-block;
      }
      .strct-gauge__wrap {
        position: relative;
      }
      .strct-gauge__track {
        stroke: var(--bg-3);
      }
      .strct-gauge__value {
        transition: stroke-dasharray 0.4s ease;
      }
      .strct-gauge__center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .strct-gauge__num {
        font-size: 22px;
        font-weight: 600;
        color: var(--t1);
        line-height: 1;
      }
      .strct-gauge__pct {
        font-size: 12px;
        color: var(--t2);
        margin-left: 1px;
      }
      .strct-gauge__label {
        font-size: 12px;
        color: var(--t2);
        margin-top: 3px;
      }
    `,
  ],
})
export class StrctGauge {
  /** Current value. */
  readonly value = input(0);
  /** Visual status color. */
  readonly status = input<StrctChartStatus>('accent');
  /**
   * Optional value-driven thresholds. When set, the gauge picks its own status
   * from the value: `value >= critical` → critical, `>= warning` → warning, else
   * the healthy base (`status`, or `'success'` when `status` is left at its
   * default `'accent'`).
   */
  readonly thresholds = input<StrctThresholds | null>(null);
  /** Label text. */
  readonly label = input('');
  /** Size variant. */
  readonly size = input(120);
  /** Stroke thickness in pixels. */
  readonly thickness = input(12);

  protected readonly clamped = computed(() => Math.round(Math.max(0, Math.min(100, this.value()))));
  protected readonly half = computed(() => this.size() / 2);
  protected readonly radius = computed(() => (this.size() - this.thickness()) / 2);

  /** Status after applying thresholds (falls back to `status` when none set). */
  protected readonly resolvedStatus = computed<StrctChartStatus>(() => {
    const t = this.thresholds();
    if (!t) return this.status();
    const v = this.value();
    if (t.critical != null && v >= t.critical) return 'critical';
    if (t.warning != null && v >= t.warning) return 'warning';
    const base = this.status();
    return base === 'accent' ? 'success' : base;
  });

  protected readonly color = computed(() => COLOR[this.resolvedStatus()]);

  private readonly circumference = computed(() => 2 * Math.PI * this.radius());

  protected readonly trackDash = computed(() => {
    const c = this.circumference();
    return `${0.75 * c} ${c}`;
  });

  protected readonly valueDash = computed(() => {
    const c = this.circumference();
    return `${(this.clamped() / 100) * 0.75 * c} ${c}`;
  });
}
