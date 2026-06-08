import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * Separator rule. Horizontal by default; pass `vertical` for an inline rule.
 * Projected content becomes a centered label on a horizontal divider.
 *   <strct-divider>OR</strct-divider>
 *   <strct-divider vertical />
 */
@Component({
  selector: 'strct-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<span class="strct-divider__label"><ng-content /></span>`,
  host: {
    class: 'strct-divider',
    role: 'separator',
    '[class.strct-divider--vertical]': 'vertical()',
    '[attr.aria-orientation]': "vertical() ? 'vertical' : 'horizontal'",
  },
  styles: [
    `
      .strct-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        color: var(--t3);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .strct-divider::before,
      .strct-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--b2);
      }
      .strct-divider__label:empty {
        display: none;
      }
      .strct-divider:has(.strct-divider__label:empty) {
        gap: 0;
      }

      .strct-divider--vertical {
        display: inline-block;
        width: 1px;
        min-height: 1em;
        height: auto;
        align-self: stretch;
        background: var(--b2);
        margin: 0 2px;
      }
      .strct-divider--vertical::before,
      .strct-divider--vertical::after {
        content: none;
      }
      .strct-divider--vertical .strct-divider__label {
        display: none;
      }
    `,
  ],
})
export class StrctDivider {
  /** Render as a vertical rule. */
  readonly vertical = input(false, { transform: booleanAttribute });
}
