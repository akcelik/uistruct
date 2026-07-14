import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { StrctThresholds } from '../status';

/** Progress bar color variants. */
export type StrctProgressStatus = 'accent' | 'success' | 'warning' | 'critical';

/** Horizontal value/usage bar. `<strct-progress [value]="72" status="warning" />`. */
@Component({
  selector: 'strct-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="strct-progress__track"
      role="progressbar"
      [attr.aria-label]="label() || 'Progress'"
      [attr.aria-valuenow]="clamped()"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="strct-progress__fill" [style.width.%]="clamped()"></div>
    </div>
  `,
  host: {
    class: 'strct-progress',
    '[class.strct-progress--success]': "resolvedStatus() === 'success'",
    '[class.strct-progress--warning]': "resolvedStatus() === 'warning'",
    '[class.strct-progress--critical]': "resolvedStatus() === 'critical'",
  },
  styles: [
    `
      .strct-progress {
        display: block;
      }
      .strct-progress__track {
        height: 6px;
        border-radius: 4px;
        background: var(--bg-3);
        overflow: hidden;
      }
      .strct-progress__fill {
        height: 100%;
        border-radius: 4px;
        background: var(--acc);
        transition: width 0.3s ease;
      }
      .strct-progress--success .strct-progress__fill {
        background: var(--success);
      }
      .strct-progress--warning .strct-progress__fill {
        background: var(--warning);
      }
      .strct-progress--critical .strct-progress__fill {
        background: var(--critical);
      }
    `,
  ],
})
export class StrctProgress {
  /** Current value. */
  readonly value = input(0);
  /** Accessible name of the bar (e.g. "CPU usage"). Falls back to "Progress". */
  readonly label = input('');
  /** Visual status color. */
  readonly status = input<StrctProgressStatus>('accent');
  /**
   * Optional value-driven thresholds. When set, the component picks its own
   * status from the value instead of the caller computing it: `value >= critical`
   * → critical, `>= warning` → warning, else the healthy base. The healthy base is
   * `status` when it has been set to a semantic tone, or `'success'` when `status`
   * is left at its default `'accent'`.
   */
  readonly thresholds = input<StrctThresholds | null>(null);

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, this.value())));

  /** Status after applying thresholds (falls back to `status` when none set). */
  protected readonly resolvedStatus = computed<StrctProgressStatus>(() => {
    const t = this.thresholds();
    if (!t) return this.status();
    const v = this.value();
    if (t.critical != null && v >= t.critical) return 'critical';
    if (t.warning != null && v >= t.warning) return 'warning';
    const base = this.status();
    return base === 'accent' ? 'success' : base;
  });
}
