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
      /* A status label, not a control. Measured on 5.24.0: a neutral badge
         and a neutral mini button shared the border token (--b3), the radius
         (2px), the transparent fill and the text size (12px) — 2px of height,
         100 of weight and a 2px-thicker start rail were the whole difference,
         so the badge read as something to press. The box is gone: a 6px dot
         carries the tone, the word carries the meaning. */
      .strct-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1;
        letter-spacing: 0.2px;
        /* A trailing pad only, so two badges beside each other never run
           together whatever the container's gap is. */
        padding: 0 8px 0 0;
        border: 0;
        border-radius: 0;
        white-space: nowrap;
        color: var(--t2);
        background: transparent;
      }
      .strct-badge::before {
        content: '';
        flex: none;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--strct-badge-dot, var(--t3));
      }
      /* A badge that carries its own icon already says its kind; a dot beside
         it would be a second mark for the same thing. */
      .strct-badge:has(> strct-icon, > .strct-icon, > svg, > strct-status-dot)::before {
        display: none;
      }
      .strct-badge--accent {
        --strct-badge-dot: var(--acc);
      }
      .strct-badge--success {
        --strct-badge-dot: var(--success);
      }
      .strct-badge--warning {
        --strct-badge-dot: var(--warning);
      }
      .strct-badge--critical {
        --strct-badge-dot: var(--critical);
      }

      /* A tone the five statuses do not carry: a product's own accent on a
         row, where green / amber / red already mean something else. The dot
         takes the colour; the word stays in the reading tone. Either set
         [tone] or the custom property. */
      .strct-badge--tone {
        --strct-badge-dot: var(--strct-badge-fg, var(--t3));
      }

      /* Opt-in filled chip, for the few places that want the weight of a
         block (a version on a header, a count on a tab). It keeps a box
         deliberately, so it keeps the dot off. */
      .strct-badge--solid {
        gap: 4px;
        padding: 3px 8px;
        border-radius: var(--radius-sm);
        font-weight: 600;
        color: var(--t1);
        background: var(--bg-a);
      }
      .strct-badge--solid::before {
        display: none;
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
          // A real input since 5.13.0 — a colour of its own, so it takes any
          // colour token or value rather than one of a list.
          tone: 'a colour token or value, e.g. var(--prod-acc)',
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
