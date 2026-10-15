import {
  afterNextRender,
  ElementRef,
  inject,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';
import { strctCheckHostInputs } from '../util/host-check';

/** Badge color variants. */
export type StrctBadgeStatus = 'neutral' | 'accent' | 'success' | 'warning' | 'critical';

/** Small inline status pill: `<strct-badge status="success">Active</strct-badge>`. */
@Component({
  selector: 'strct-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: {
    class: 'strct-badge',
    '[class.strct-badge--accent]': "status() === 'accent'",
    '[class.strct-badge--success]': "status() === 'success'",
    '[class.strct-badge--warning]': "status() === 'warning'",
    // Deprecated alias of --warning (original typo), kept so consumer CSS keeps matching.
    '[class.strct-badge--warninging]': "status() === 'warning'",
    '[class.strct-badge--critical]': "status() === 'critical'",
    '[class.strct-badge--solid]': 'solid()',
    '[class.strct-badge--tone]': 'tone()',
    '[style.--strct-badge-fg]': 'tone() || null',
  },
  styles: [
    `
      /* Restrained: outlined on a neutral surface, color carried by text + a thin border. */
      .strct-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: 0.2px;
        padding-block: 3px;
        padding-inline: 9px 7px;
        border-radius: var(--radius-sm);
        white-space: nowrap;
        color: var(--t2);
        background: transparent;
        border: 1px solid var(--b3);
        /* Thicker start rail gives badges a distinct "tag" identity vs. buttons. */
        border-inline-start-width: 3px;
      }
      .strct-badge--accent {
        color: var(--acc);
        border-color: var(--acc30);
      }
      .strct-badge--success {
        color: var(--success);
        border-color: var(--success);
      }
      .strct-badge--warning {
        color: var(--warning);
        border-color: var(--warning);
      }
      .strct-badge--critical {
        color: var(--critical);
        border-color: var(--critical);
      }

      /* A tone the five statuses do not carry: a product's own accent on a
         row, where green / amber / red already mean something else. The text
         takes the colour and the border a 30% wash of it, as --accent does
         with --acc30. Either set [tone] or the two custom properties. */
      .strct-badge--tone {
        color: var(--strct-badge-fg, var(--t2));
        border-color: var(
          --strct-badge-border,
          color-mix(in srgb, var(--strct-badge-fg, var(--b3)) 30%, transparent)
        );
      }

      /* Opt-in filled badge — uniform edges (no start rail). */
      .strct-badge--solid {
        color: var(--t1);
        background: var(--bg-a);
        border-color: transparent;
        border-inline-start-width: 1px;
        padding-inline-start: 7px;
      }
      .strct-badge--solid.strct-badge--accent {
        background: var(--acc);
        color: var(--inv);
      }
      .strct-badge--solid.strct-badge--success {
        background: var(--success);
        color: var(--inv);
      }
      .strct-badge--solid.strct-badge--warning {
        background: var(--warning);
        color: var(--inv);
      }
      .strct-badge--solid.strct-badge--critical {
        background: var(--critical);
        color: var(--inv);
      }
      .strct-badge--solid.strct-badge--tone {
        background: var(--strct-badge-fg, var(--bg-a));
        color: var(--strct-badge-on, var(--inv));
        border-color: transparent;
      }
    `,
  ],
})
export class StrctBadge {
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Dev-only: writing this component the way a sibling is written must not
    // fail silently. Guarded inline, so production drops the call — and with it
    // the whole diagnostics module.
    afterNextRender(() => {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const el = this.hostEl.nativeElement;
        strctCheckHostInputs(el, 'strct-badge', {
          status: 'neutral, accent, success, warning, critical',
        });
      }
    });
  }
  /** Visual status color. */
  readonly status = input<StrctBadgeStatus>('neutral');
  /**
   * A colour of your own — `tone="var(--prod-acc)"` — for a distinction the
   * five statuses do not carry, such as which product a row belongs to. The
   * text takes it and the border a 30% wash of it; `solid` fills with it and
   * writes in `--strct-badge-on` (`--inv` by default). It overrides `status`.
   *
   * The same can be set from a stylesheet with `--strct-badge-fg`,
   * `--strct-badge-border` and `--strct-badge-on`, which is the better route
   * when a rule already selects the badges (`.product-badge { … }`).
   *
   * The colour is yours to pick, so its contrast is yours to check: the
   * library's own check covers `--acc` and the status tokens.
   */
  readonly tone = input('');

  /** Opt-in filled style instead of the default outlined style. */
  readonly solid = input(false, { transform: booleanAttribute });
}
