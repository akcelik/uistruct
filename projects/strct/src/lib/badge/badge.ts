import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

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
        padding: 3px 7px 3px 9px;
        border-radius: var(--radius-sm);
        white-space: nowrap;
        color: var(--t2);
        background: transparent;
        border: 1px solid var(--b3);
        /* Thicker left rail gives badges a distinct "tag" identity vs. buttons. */
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

      /* Opt-in filled badge — uniform edges (no left rail). */
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
    `,
  ],
})
export class StrctBadge {
  /** Visual status color. */
  readonly status = input<StrctBadgeStatus>('neutral');
  /** Opt-in filled style instead of the default outlined style. */
  readonly solid = input(false, { transform: booleanAttribute });
}
