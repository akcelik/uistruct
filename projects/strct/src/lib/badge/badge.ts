import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

export type StrctBadgeStatus =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

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
    '[class.strct-badge--danger]': "status() === 'danger'",
    '[class.strct-badge--solid]': 'solid()',
  },
  styles: [
    `
    /* Restrained: outlined on a neutral surface, color carried by text + a thin border. */
    .strct-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: 600; line-height: 1; letter-spacing: .2px;
      padding: 3px 7px 3px 9px; border-radius: 4px; white-space: nowrap;
      color: var(--t2); background: transparent;
      border: 1px solid var(--b3);
      /* Thicker left rail gives badges a distinct "tag" identity vs. buttons. */
      border-left-width: 3px;
    }
    .strct-badge--accent { color: var(--acc); border-color: var(--acc30); }
    .strct-badge--success { color: var(--ok); border-color: var(--ok); }
    .strct-badge--warning { color: var(--wrn); border-color: var(--wrn); }
    .strct-badge--danger { color: var(--crt); border-color: var(--crt); }

    /* Opt-in filled badge — uniform edges (no left rail). */
    .strct-badge--solid {
      color: var(--t1); background: var(--bg-a);
      border-color: transparent; border-left-width: 1px; padding-left: 7px;
    }
    .strct-badge--solid.strct-badge--accent { background: var(--acc); color: #fff; }
    .strct-badge--solid.strct-badge--success { background: var(--ok); color: #fff; }
    .strct-badge--solid.strct-badge--warning { background: var(--wrn); color: #fff; }
    .strct-badge--solid.strct-badge--danger { background: var(--crt); color: #fff; }
    `,
  ],
})
export class StrctBadge {
  readonly status = input<StrctBadgeStatus>('neutral');
  /** Opt-in filled style instead of the default outlined style. */
  readonly solid = input(false, { transform: booleanAttribute });
}
