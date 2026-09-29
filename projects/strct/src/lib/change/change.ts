import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/**
 * A value change, as one phrase: "v10.27 → v10.28". The old value is muted, the
 * arrow is the library's, the new one is emphasised — and assistive tech hears
 * a sentence rather than an arrow glyph.
 *
 *   <strct-change from="v10.27" to="v10.28" mono />
 */
@Component({
  selector: 'strct-change',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <span class="strct-change__from" aria-hidden="true">{{ from() }}</span>
    <strct-icon
      class="strct-change__arrow"
      strictName="arrowRight"
      [size]="13"
      aria-hidden="true"
    />
    <span class="strct-change__to" aria-hidden="true">{{ to() }}</span>
    <span class="strct-change__sr">{{ label()(from(), to()) }}</span>
  `,
  host: {
    class: 'strct-change',
    '[class.strct-change--mono]': 'mono()',
  },
  styles: [
    `
      .strct-change {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        min-width: 0;
      }
      .strct-change--mono {
        font-family: var(--mono);
        font-size: var(--text-sm);
      }
      .strct-change__from {
        color: var(--t3);
      }
      .strct-change__arrow {
        color: var(--t3);
        flex: none;
      }
      .strct-change__to {
        color: var(--t1);
        font-weight: 600;
      }
      .strct-change__sr {
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
export class StrctChange {
  /** The value before. */
  readonly from = input.required<string>();
  /** The value after. */
  readonly to = input.required<string>();
  /** Monospace, for versions and identifiers. */
  readonly mono = input(false, { transform: booleanAttribute });
  /** What assistive tech hears in place of the arrow (localisable). */
  readonly label = input<(from: string, to: string) => string>(
    (from, to) => `from ${from} to ${to}`,
  );
}
