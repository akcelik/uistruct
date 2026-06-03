import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

export type StrctSpinnerSize = 'sm' | 'md' | 'lg';

/** Indeterminate loading ring. `<strct-spinner size="sm" />`. */
@Component({
  selector: 'strct-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '',
  host: {
    class: 'strct-spinner',
    role: 'progressbar',
    'aria-label': 'Loading',
    '[class.strct-spinner--sm]': "size() === 'sm'",
    '[class.strct-spinner--lg]': "size() === 'lg'",
  },
  styles: [
    `
    .strct-spinner {
      display: inline-block; width: 22px; height: 22px;
      border: 2.5px solid var(--b3); border-top-color: var(--acc);
      border-radius: 50%; animation: strct-spin .7s linear infinite;
    }
    .strct-spinner--sm { width: 14px; height: 14px; border-width: 2px; }
    .strct-spinner--lg { width: 34px; height: 34px; border-width: 3px; }
    @keyframes strct-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .strct-spinner { animation-duration: 1.6s; } }
    `,
  ],
})
export class StrctSpinner {
  readonly size = input<StrctSpinnerSize>('md');
}
