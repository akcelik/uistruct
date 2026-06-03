import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type StrctProgressStatus = 'accent' | 'success' | 'warning' | 'danger';

/** Horizontal value/usage bar. `<strct-progress [value]="72" status="warning" />`. */
@Component({
  selector: 'strct-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="strct-progress__track"
      role="progressbar"
      [attr.aria-valuenow]="clamped()"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="strct-progress__fill" [style.width.%]="clamped()"></div>
    </div>
  `,
  host: {
    class: 'strct-progress',
    '[class.strct-progress--success]': "status() === 'success'",
    '[class.strct-progress--warning]': "status() === 'warning'",
    '[class.strct-progress--danger]': "status() === 'danger'",
  },
  styles: [
    `
    .strct-progress { display: block; }
    .strct-progress__track {
      height: 6px; border-radius: 4px; background: var(--bg-3); overflow: hidden;
    }
    .strct-progress__fill {
      height: 100%; border-radius: 4px; background: var(--acc);
      transition: width .3s ease;
    }
    .strct-progress--success .strct-progress__fill { background: var(--ok); }
    .strct-progress--warning .strct-progress__fill { background: var(--wrn); }
    .strct-progress--danger .strct-progress__fill { background: var(--crt); }
    `,
  ],
})
export class StrctProgress {
  readonly value = input(0);
  readonly status = input<StrctProgressStatus>('accent');

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, this.value())));
}
