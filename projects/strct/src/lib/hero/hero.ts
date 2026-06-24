import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctStatus } from '../status';

let heroCounter = 0;

/** Default leading icon per status, when `icon` is not supplied. */
const DEFAULT_ICON: Record<StrctStatus, string> = {
  success: 'success',
  warning: 'warning',
  critical: 'critical',
  accent: 'info',
  neutral: 'info',
};

/**
 * Page-level status summary banner: a tone-colored surface with a leading icon
 * chip, a heading, a description, and optional right-aligned metadata / actions.
 *
 * Distinct from `StrctAlert` (a dismissible inline notification) and
 * `StrctSignpost` (a popover). Use it for the prominent "Protected", "All systems
 * healthy", "Clock synchronized" summaries apps otherwise hand-roll.
 *
 *   <strct-hero status="success" icon="shield" heading="High availability is on">
 *     The standby node can take over if this one fails.
 *     <div strctHeroMeta><strct-badge status="success">HA ON</strct-badge></div>
 *     <div strctHeroActions>
 *       <button strct-button size="sm">Switch over</button>
 *     </div>
 *   </strct-hero>
 */
@Component({
  selector: 'strct-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <span class="strct-hero__chip" aria-hidden="true">
      <strct-icon [name]="resolvedIcon()" [size]="dense() ? 16 : 18" />
    </span>

    <div class="strct-hero__text">
      <div class="strct-hero__heading" [id]="headingId">{{ heading() }}</div>
      <div class="strct-hero__desc"><ng-content /></div>
    </div>

    <div class="strct-hero__aside">
      <div class="strct-hero__meta"><ng-content select="[strctHeroMeta]" /></div>
      <div class="strct-hero__actions"><ng-content select="[strctHeroActions]" /></div>
    </div>
  `,
  host: {
    class: 'strct-hero',
    '[class.strct-hero--accent]': "status() === 'accent'",
    '[class.strct-hero--success]': "status() === 'success'",
    '[class.strct-hero--warning]': "status() === 'warning'",
    '[class.strct-hero--critical]': "status() === 'critical'",
    '[class.strct-hero--dense]': 'dense()',
    '[attr.role]': "status() === 'critical' ? 'alert' : 'status'",
    '[attr.aria-labelledby]': 'headingId',
  },
  styles: [
    `
      /* Restrained: neutral raised surface with a colored left rail + a filled,
         status-colored icon chip — the tint carries the tone without a loud fill. */
      .strct-hero {
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: var(--space-3);
        padding: var(--space-4) var(--space-5);
        border-radius: var(--radius-lg);
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-left: 3px solid var(--b3);
      }
      .strct-hero--dense {
        padding: var(--space-3) var(--space-4);
        gap: var(--space-2);
      }

      .strct-hero__chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--bg-a);
        color: var(--t2);
      }
      .strct-hero--dense .strct-hero__chip {
        width: 28px;
        height: 28px;
      }

      .strct-hero__text {
        flex: 1 1 280px;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .strct-hero__heading {
        font-size: var(--text-xl);
        font-weight: 650;
        letter-spacing: -0.01em;
        color: var(--t1);
        line-height: var(--leading-tight);
      }
      .strct-hero--dense .strct-hero__heading {
        font-size: var(--text-lg);
      }
      .strct-hero__desc {
        font-size: var(--text-md);
        color: var(--t2);
        line-height: var(--leading-normal);
      }
      /* Collapse the description wrapper when nothing is projected into it. */
      .strct-hero__desc:empty {
        display: none;
      }

      /* Right-aligned cluster: metadata above, actions below; wraps under the text
         on narrow widths. */
      .strct-hero__aside {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-2);
        margin-left: auto;
      }
      .strct-hero__meta,
      .strct-hero__actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-2);
        justify-content: flex-end;
      }
      .strct-hero__meta:empty,
      .strct-hero__actions:empty {
        display: none;
      }
      .strct-hero__aside:not(:has(*:not(:empty))) {
        display: none;
      }

      /* Status tints: colored left rail + filled icon chip. */
      .strct-hero--accent {
        border-left-color: var(--acc);
      }
      .strct-hero--accent .strct-hero__chip {
        background: var(--acc);
        color: #fff;
      }
      .strct-hero--success {
        border-left-color: var(--success);
      }
      .strct-hero--success .strct-hero__chip {
        background: var(--success);
        color: #fff;
      }
      .strct-hero--warning {
        border-left-color: var(--warning);
      }
      .strct-hero--warning .strct-hero__chip {
        background: var(--warning);
        color: #fff;
      }
      .strct-hero--critical {
        border-left-color: var(--critical);
      }
      .strct-hero--critical .strct-hero__chip {
        background: var(--critical);
        color: #fff;
      }

      @media (max-width: 560px) {
        .strct-hero__aside {
          margin-left: 0;
          align-items: stretch;
          width: 100%;
        }
        .strct-hero__meta,
        .strct-hero__actions {
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class StrctHero {
  /** Tone: drives the left rail + icon chip color. */
  readonly status = input<StrctStatus>('neutral');
  /** Leading icon name (StrctIcon set). Falls back to a per-status default. */
  readonly icon = input('');
  /** The headline; exposed as the banner's accessible name. */
  readonly heading = input.required<string>();
  /** Tighter padding for secondary placements. */
  readonly dense = input(false, { transform: booleanAttribute });

  protected readonly headingId = `strct-hero-${++heroCounter}`;
  protected readonly resolvedIcon = computed(() => this.icon() || DEFAULT_ICON[this.status()]);
}
