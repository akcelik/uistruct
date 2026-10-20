import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
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
    @if (from()) {
      <span class="strct-change__from" aria-hidden="true">{{ from() }}</span>
    }
    <strct-icon
      class="strct-change__arrow"
      strictName="arrowRight"
      [size]="13"
      aria-hidden="true"
    />
    @if (to()) {
      <span class="strct-change__to" aria-hidden="true">{{ to() }}</span>
    } @else {
      <span class="strct-change__gone" aria-hidden="true">{{ removedMark() }}</span>
    }
    <span class="strct-change__sr">{{ sentence() }}</span>
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
      /* Nothing on the other side: the mark stands where the value would be,
         in the muted tone, because there is no new value to emphasise. */
      .strct-change__gone {
        color: var(--t3);
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
  /**
   * The value before. Empty for something that did not exist — an install
   * reads "→ 1.4.2", and the sentence says "set to 1.4.2".
   */
  readonly from = input('');
  /**
   * The value after. Empty for something that is gone — a removal reads
   * "1.4.1 → —", and the sentence says "1.4.1 removed".
   */
  readonly to = input('');
  /** Monospace, for versions and identifiers. */
  readonly mono = input(false, { transform: booleanAttribute });
  /** What assistive tech hears in place of the arrow (localisable). */
  readonly label = input<(from: string, to: string) => string>(
    (from, to) => `from ${from} to ${to}`,
  );
  /** The sentence for a value that had no "before" (localisable). */
  readonly addedLabel = input<(to: string) => string>((to) => `set to ${to}`);
  /** The sentence for a value that is gone (localisable). */
  readonly removedLabel = input<(from: string) => string>((from) => `${from} removed`);
  /** What stands where the new value would be when there is none. */
  readonly removedMark = input('—');

  /** One side or two: the sentence assistive tech hears. */
  protected readonly sentence = computed(() => {
    const from = this.from();
    const to = this.to();
    if (from && to) return this.label()(from, to);
    if (to) return this.addedLabel()(to);
    if (from) return this.removedLabel()(from);
    return '';
  });
}
