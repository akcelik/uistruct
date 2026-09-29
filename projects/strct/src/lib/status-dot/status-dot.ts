import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { StrctStatus } from '../status';

/** Dot sizes: `sm` for dense rows (tables, menus), `md` standalone. */
export type StrctStatusDotSize = 'sm' | 'md';

/**
 * Default accessible text per status, used when `label` is not given
 * (localizable — override via `label`). The canonical `StrctStatus` vocabulary
 * has no 'ok'/'info': OK maps to 'success', info to 'accent'.
 */
const DEFAULT_LABEL: Record<StrctStatus, string> = {
  neutral: 'Neutral',
  accent: 'Info',
  success: 'OK',
  warning: 'Warning',
  critical: 'Critical',
};

/**
 * Presence/state dot that never relies on colour alone: the tone is painted by
 * a pure-CSS dot while the state is also rendered as visually-hidden text, so
 * screen readers (and colour-blind users copying text) get "Warning", not just
 * a yellow circle. Use it inside avatars, menu rows, metric tiles — anywhere a
 * bare coloured dot would otherwise carry meaning.
 *
 *   <strct-status-dot status="success" />
 *   <strct-status-dot status="critical" size="sm" label="Node unreachable" />
 */
@Component({
  selector: 'strct-status-dot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <span class="strct-dot__dot" aria-hidden="true"></span>
    <span class="strct-dot__sr">{{ text() }}</span>
  `,
  host: {
    class: 'strct-dot',
    '[class.strct-dot--accent]': "status() === 'accent'",
    '[class.strct-dot--success]': "status() === 'success'",
    '[class.strct-dot--warning]': "status() === 'warning'",
    '[class.strct-dot--critical]': "status() === 'critical'",
    '[class.strct-dot--sm]': "size() === 'sm'",
    '[class.strct-dot--pulse]': 'pulse()',
  },
  styles: [
    `
      .strct-dot {
        display: inline-flex;
        align-items: center;
        flex: none;
        line-height: 0;
      }
      .strct-dot__dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--t3);
      }
      .strct-dot--sm .strct-dot__dot {
        width: 8px;
        height: 8px;
      }
      .strct-dot--accent .strct-dot__dot {
        background: var(--acc);
      }
      .strct-dot--success .strct-dot__dot {
        background: var(--success);
      }
      .strct-dot--warning .strct-dot__dot {
        background: var(--warning);
      }
      .strct-dot--critical .strct-dot__dot {
        background: var(--critical);
      }
      /* Something happening now pulses: a halo around the dot, never its size
         — a dot that changes size makes a row of them jitter. */
      .strct-dot--pulse .strct-dot__dot {
        position: relative;
      }
      .strct-dot--pulse .strct-dot__dot::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: inherit;
        animation: strct-dot-pulse 1s ease-out infinite;
      }
      @keyframes strct-dot-pulse {
        from {
          box-shadow: 0 0 0 0 currentColor;
          opacity: 0.55;
        }
        to {
          box-shadow: 0 0 0 5px transparent;
          opacity: 0;
        }
      }
      .strct-dot--pulse .strct-dot__dot {
        color: var(--t3);
      }
      .strct-dot--pulse.strct-dot--accent .strct-dot__dot {
        color: var(--acc);
      }
      .strct-dot--pulse.strct-dot--success .strct-dot__dot {
        color: var(--success);
      }
      .strct-dot--pulse.strct-dot--warning .strct-dot__dot {
        color: var(--warning);
      }
      .strct-dot--pulse.strct-dot--critical .strct-dot__dot {
        color: var(--critical);
      }
      /* Reduced motion: the halo stays, as a static ring. */
      @media (prefers-reduced-motion: reduce) {
        .strct-dot--pulse .strct-dot__dot::after {
          animation: none;
          box-shadow: 0 0 0 3px currentColor;
          opacity: 0.25;
        }
      }

      /* Visually hidden state text — the colour alone doesn't carry it. */
      .strct-dot__sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    `,
  ],
})
export class StrctStatusDot {
  /** Status tone (canonical vocabulary: OK = 'success', info = 'accent'). */
  readonly status = input<StrctStatus>('neutral');
  /**
   * Accessible text describing the state (localizable). Empty falls back to a
   * per-status default ("OK", "Warning", …) so the dot is never color-only.
   */
  readonly label = input('');
  /** Dot size: `sm` for dense rows, `md` standalone. */
  readonly size = input<StrctStatusDotSize>('md');
  /**
   * Something happening *now* — a task running, a live chart. The halo pulses
   * once a second; the dot itself never changes size, so a column of dots does
   * not jitter. Under `prefers-reduced-motion` the halo is a static ring.
   */
  readonly pulse = input(false, { transform: booleanAttribute });

  protected readonly text = computed(() => this.label() || DEFAULT_LABEL[this.status()]);
}
