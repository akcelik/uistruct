import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

export type StrctAlertType = 'info' | 'success' | 'warning' | 'danger';

/** Inline contextual banner. `<strct-alert type="warning">…</strct-alert>`. */
@Component({
  selector: 'strct-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <strct-icon [name]="icon()" [size]="15" />
    <div class="strct-alert__body"><ng-content /></div>
    @if (closable()) {
      <button type="button" class="strct-alert__close" aria-label="Dismiss" (click)="closed.emit()">
        <strct-icon name="close" [size]="13" />
      </button>
    }
  `,
  host: {
    class: 'strct-alert',
    role: 'status',
    '[class.strct-alert--success]': "type() === 'success'",
    '[class.strct-alert--warning]': "type() === 'warning'",
    '[class.strct-alert--danger]': "type() === 'danger'",
  },
  styles: [
    `
    /* Restrained: neutral surface with a colored left rail + colored icon,
       instead of a fully tinted background. */
    .strct-alert {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 12px; border-radius: 7px; font-size: 13px;
      color: var(--t1); background: var(--bg-1);
      border: 1px solid var(--b2); border-left: 3px solid var(--acc);
    }
    .strct-alert strct-icon { color: var(--acc); margin-top: 1px; flex-shrink: 0; }
    .strct-alert__body { flex: 1; color: var(--t1); }
    .strct-alert__close {
      flex-shrink: 0; display: inline-flex; padding: 2px; margin: -2px -2px 0 0;
      border: 0; background: transparent; color: var(--t3); cursor: pointer; border-radius: 4px;
    }
    .strct-alert__close:hover { color: var(--t1); background: var(--bg-3); }

    .strct-alert--success { border-left-color: var(--ok); }
    .strct-alert--success strct-icon { color: var(--ok); }
    .strct-alert--warning { border-left-color: var(--wrn); }
    .strct-alert--warning strct-icon { color: var(--wrn); }
    .strct-alert--danger { border-left-color: var(--crt); }
    .strct-alert--danger strct-icon { color: var(--crt); }
    `,
  ],
})
export class StrctAlert {
  readonly type = input<StrctAlertType>('info');
  readonly closable = input(false, { transform: booleanAttribute });
  readonly closed = output<void>();

  protected readonly icon = computed(() => {
    switch (this.type()) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      default:
        return 'info';
    }
  });
}
