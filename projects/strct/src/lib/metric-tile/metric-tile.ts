import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctChartStatus, StrctSparkline } from '../charts/sparkline';

/** Accent colour for a metric tile. */
export type StrctMetricStatus = 'neutral' | 'accent' | 'success' | 'warning' | 'critical';

/**
 * Dense KPI tile: a label, a large value (+ unit), an optional change indicator
 * and an optional inline sparkline. Built for at-a-glance dashboards.
 *
 *   <strct-metric-tile label="CPU" [value]="62" unit="%" icon="cpu"
 *                      status="warning" [delta]="8" [data]="cpuTrend" />
 */
@Component({
  selector: 'strct-metric-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctSparkline],
  template: `
    <div class="strct-mt__top">
      @if (icon()) {
        <span class="strct-mt__icon"><strct-icon [name]="icon()" [size]="16" /></span>
      }
      <span class="strct-mt__label">{{ label() }}</span>
      @if (hasDelta()) {
        <span class="strct-mt__delta strct-mt__delta--{{ deltaTone() }}">
          <strct-icon
            [name]="delta()! >= 0 ? 'arrowUp' : 'arrowDown'"
            [size]="11"
            [strokeWidth]="2"
          />
          {{ absDelta() }}{{ deltaSuffix() }}
        </span>
      }
    </div>

    <div class="strct-mt__value strct-mt__value--{{ status() }}">
      {{ value() }}
      @if (unit()) {
        <span class="strct-mt__unit">{{ unit() }}</span>
      }
    </div>

    @if (caption()) {
      <div class="strct-mt__caption">{{ caption() }}</div>
    }

    @if (data().length) {
      <div class="strct-mt__spark">
        <strct-sparkline [data]="data()" [status]="sparkStatus()" area [height]="28" />
      </div>
    }
  `,
  host: { class: 'strct-mt' },
  styles: [
    `
      .strct-mt {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 13px 15px;
        border: 1px solid var(--b2);
        border-radius: 10px;
        background: var(--bg-1);
        min-width: 0;
      }
      .strct-mt__top {
        display: flex;
        align-items: center;
        gap: 7px;
      }
      .strct-mt__icon {
        display: inline-flex;
        color: var(--t3);
        flex-shrink: 0;
      }
      .strct-mt__label {
        font-size: 12px;
        font-weight: 500;
        color: var(--t3);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .strct-mt__delta {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        margin-inline-start: auto;
        font-size: 12px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
      }
      .strct-mt__delta--up {
        color: var(--success);
      }
      .strct-mt__delta--down {
        color: var(--critical);
      }
      .strct-mt__delta--flat {
        color: var(--t3);
      }
      .strct-mt__value {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-size: var(--text-3xl);
        font-weight: 650;
        letter-spacing: -0.01em;
        color: var(--t1);
        line-height: 1.1;
      }
      .strct-mt__value--accent {
        color: var(--acc);
      }
      .strct-mt__value--success {
        color: var(--success);
      }
      .strct-mt__value--warning {
        color: var(--warning);
      }
      .strct-mt__value--critical {
        color: var(--critical);
      }
      .strct-mt__unit {
        font-size: 14px;
        font-weight: 500;
        color: var(--t3);
        letter-spacing: 0;
      }
      .strct-mt__caption {
        font-size: 12px;
        color: var(--t3);
      }
      .strct-mt__spark {
        margin-top: 2px;
        line-height: 0;
      }
      .strct-mt__spark strct-sparkline,
      .strct-mt__spark .strct-spark__svg {
        width: 100%;
      }
    `,
  ],
})
export class StrctMetricTile {
  /** Small caption above the value. */
  readonly label = input.required<string>();
  /** The headline value. */
  readonly value = input.required<string | number>();
  /** Unit shown after the value (e.g. `%`, `GB`). */
  readonly unit = input('');
  /** Optional leading icon name. */
  readonly icon = input('');
  /** Tints the value (defaults to neutral primary text). */
  readonly status = input<StrctMetricStatus>('neutral');
  /** Change indicator; sign drives the arrow + colour. Null hides it. */
  readonly delta = input<number | null>(null);
  /** Suffix for the delta number. */
  readonly deltaSuffix = input('%');
  /** Treat a positive delta as bad (e.g. error rate, latency). */
  readonly invertDelta = input(false, { transform: booleanAttribute });
  /** Small sub-text under the value (e.g. "of 256 GB"). */
  readonly caption = input('');
  /** Sparkline series; empty hides the chart. */
  readonly data = input<number[]>([]);

  protected readonly hasDelta = computed(() => this.delta() !== null);
  protected readonly absDelta = computed(() => Math.abs(this.delta() ?? 0));
  protected readonly deltaTone = computed<'up' | 'down' | 'flat'>(() => {
    const d = this.delta() ?? 0;
    if (d === 0) return 'flat';
    const good = this.invertDelta() ? d < 0 : d > 0;
    return good ? 'up' : 'down';
  });

  protected readonly sparkStatus = computed<StrctChartStatus>(() => {
    const s = this.status();
    return s === 'neutral' ? 'accent' : s;
  });
}
