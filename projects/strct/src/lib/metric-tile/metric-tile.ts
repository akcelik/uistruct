import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctSkeleton } from '../skeleton/skeleton';
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
  imports: [StrctIcon, StrctSkeleton, StrctSparkline],
  template: `
    @if (loading()) {
      <strct-skeleton width="45%" height="12px" />
      <strct-skeleton width="65%" height="28px" />
    } @else {
      <div class="strct-mt__top">
        @if (icon()) {
          <span class="strct-mt__icon"><strct-icon [name]="icon()" [size]="16" /></span>
        }
        <span class="strct-mt__label">{{ label() }}</span>
        @if (hasDelta()) {
          <span class="strct-mt__delta strct-mt__delta--{{ deltaTone() }}">
            <strct-icon [name]="deltaIcon()" [size]="11" [strokeWidth]="2" />
            <span aria-hidden="true">{{ absDelta() }}{{ deltaSuffix() }}</span>
            <span class="strct-mt__sr">{{ deltaText() }}</span>
          </span>
        }
      </div>

      <div class="strct-mt__value strct-mt__value--{{ status() }}">
        {{ value() }}
        @if (unit()) {
          <span class="strct-mt__unit">{{ unit() }}</span>
        }
      </div>

      <!-- A number over its bar: the meter sits under the value and above the
           caption, so "62 %" and "of 80 GB" read as one thing. -->
      <div class="strct-mt__meter"><ng-content select="[strctMetricMeter]" /></div>

      @if (caption()) {
        <div class="strct-mt__caption strct-mt__caption--{{ captionStatus() ?? 'none' }}">
          {{ caption() }}
        </div>
      }

      @if (data().length) {
        <div class="strct-mt__spark">
          <strct-sparkline [data]="data()" [status]="sparkStatus()" area [height]="28" />
        </div>
      }
    }
    <!-- A KPI you can drill into is a link. The hit area covers the tile, so
         the whole tile is the target and the focus ring is the tile's own. -->
    @if (href()) {
      <a class="strct-mt__hit" [href]="href()" [attr.aria-label]="hitLabel()"></a>
    } @else if (interactive()) {
      <button
        type="button"
        class="strct-mt__hit"
        [attr.aria-label]="hitLabel()"
        (click)="activated.emit()"
      ></button>
    }
  `,
  host: {
    class: 'strct-mt',
    '[class.strct-mt--actionable]': 'href() || interactive()',
    '[class.strct-mt--loading]': 'loading()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
  styles: [
    `
      .strct-mt {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
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
      .strct-mt__meter:empty {
        display: none;
      }
      .strct-mt__hit {
        position: absolute;
        /* Over the border too, so the whole tile — not its padding box — is
           the target. */
        inset: -1px;
        padding: 0;
        border: 0;
        background: none;
        border-radius: inherit;
        cursor: pointer;
      }
      .strct-mt__hit:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 2px;
      }
      .strct-mt--actionable:hover {
        border-color: var(--b3);
        background: var(--bg-2);
      }
      /* Visually hidden direction text — the arrow + colour alone don't carry it. */
      .strct-mt__sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
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
      /* "2 down" is the warning; the 14 nodes above it are not — so the tone
         can sit on the caption instead of the value. */
      .strct-mt__caption--accent {
        color: var(--acc);
      }
      .strct-mt__caption--success {
        color: var(--success);
      }
      .strct-mt__caption--warning {
        color: var(--warning);
      }
      .strct-mt__caption--critical {
        color: var(--critical);
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
  /**
   * Tints the caption instead of the value — "2 down" is the warning, and the
   * 14 nodes above it are not. `null` keeps the caption muted.
   */
  readonly captionStatus = input<StrctMetricStatus | null>(null);
  /** Renders the tile as a link: the whole tile is the target. */
  readonly href = input<string | null>(null);
  /** Makes the whole tile a control that emits `activated`. */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** Emitted when an `interactive` tile is activated. */
  readonly activated = output<void>();

  /** The link / button's name: the KPI and its value, since the tile is the target. */
  protected readonly hitLabel = computed(() =>
    [this.label(), `${this.value()}${this.unit()}`].filter(Boolean).join(': '),
  );
  /** Change indicator; sign drives the arrow + colour. Null hides it. */
  readonly delta = input<number | null>(null);
  /** Suffix for the delta number. */
  readonly deltaSuffix = input('%');
  /**
   * Accessible text for the delta (rendered visually-hidden next to the number);
   * receives the signed delta and the suffix.
   */
  readonly deltaAriaLabel = input<(delta: number, suffix: string) => string>((delta, suffix) =>
    delta > 0
      ? `increased by ${Math.abs(delta)}${suffix}`
      : delta < 0
        ? `decreased by ${Math.abs(delta)}${suffix}`
        : 'unchanged',
  );
  /** Treat a positive delta as bad (e.g. error rate, latency). */
  readonly invertDelta = input(false, { transform: booleanAttribute });
  /** Skeleton placeholder + aria-busy while the metric loads. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Small sub-text under the value (e.g. "of 256 GB"). */
  readonly caption = input('');
  /** Sparkline series; empty hides the chart. */
  readonly data = input<number[]>([]);

  protected readonly hasDelta = computed(() => this.delta() !== null);
  protected readonly absDelta = computed(() => Math.abs(this.delta() ?? 0));
  protected readonly deltaIcon = computed(() => {
    const d = this.delta() ?? 0;
    return d === 0 ? 'minus' : d > 0 ? 'arrowUp' : 'arrowDown';
  });
  protected readonly deltaText = computed(() =>
    this.deltaAriaLabel()(this.delta() ?? 0, this.deltaSuffix()),
  );
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
