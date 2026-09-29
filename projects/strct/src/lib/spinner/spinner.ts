import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/** Spinner size variants. */
export type StrctSpinnerSize = 'sm' | 'md' | 'lg';

/** Indeterminate loading ring. `<strct-spinner size="sm" />`. */
@Component({
  selector: 'strct-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // With no caption the host IS the ring, exactly as before; a caption turns
  // the host into a row and moves the ring inside, so nothing changes for the
  // bare spinner that is already on hundreds of screens.
  template: `
    @if (caption()) {
      <span class="strct-spinner__ring"></span>
      <span class="strct-spinner__caption">{{ caption() }}</span>
    }
  `,
  host: {
    class: 'strct-spinner',
    role: 'progressbar',
    '[class.strct-spinner--captioned]': 'caption()',
    '[attr.aria-label]': 'caption() || label()',
    '[class.strct-spinner--sm]': "size() === 'sm'",
    '[class.strct-spinner--lg]': "size() === 'lg'",
  },
  styles: [
    `
      .strct-spinner {
        display: inline-block;
        width: 22px;
        height: 22px;
        border: 2.5px solid var(--b3);
        border-top-color: var(--acc);
        border-radius: 50%;
        animation: strct-spin 0.7s linear infinite;
      }
      .strct-spinner--sm {
        width: 14px;
        height: 14px;
        border-width: 2px;
      }
      .strct-spinner--lg {
        width: 34px;
        height: 34px;
        border-width: 3px;
      }
      @keyframes strct-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-spinner {
          animation-duration: 1.6s;
        }
      }
    `,
  ],
})
export class StrctSpinner {
  /** Size variant. */
  readonly size = input<StrctSpinnerSize>('md');
  /** Accessible label (localizable). */
  readonly label = input('Loading');
  /**
   * Visible text beside the ring — "Reading…". It becomes the accessible name
   * too, so the spinner is not announced as "Loading" while it says something
   * else on screen.
   */
  readonly caption = input('');
}
