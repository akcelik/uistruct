import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * Shimmering loading placeholder.
 *   <strct-skeleton width="60%" height="14px" />
 *   <strct-skeleton circle width="40px" height="40px" />
 */
@Component({
  selector: 'strct-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '',
  host: {
    class: 'strct-skel',
    role: 'presentation',
    'aria-hidden': 'true',
    '[class.strct-skel--circle]': 'circle()',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
  styles: [
    `
      .strct-skel {
        display: block;
        border-radius: 5px;
        background: linear-gradient(
          90deg,
          var(--bg-3) 25%,
          var(--skeleton-hi, var(--acc18)) 50%,
          var(--bg-3) 75%
        );
        background-size: 400% 100%;
        animation: strct-skel-shimmer 1.4s ease infinite;
      }
      .strct-skel--circle {
        border-radius: 50%;
      }
      @keyframes strct-skel-shimmer {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-skel {
          animation: none;
          background: var(--skeleton-hi, var(--acc18));
        }
      }
    `,
  ],
})
export class StrctSkeleton {
  /** Width (CSS length). */
  readonly width = input('100%');
  /** Height in pixels. */
  readonly height = input('14px');
  /** Circle. */
  readonly circle = input(false, { transform: booleanAttribute });
}
