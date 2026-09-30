import {
  afterNextRender,
  ElementRef,
  inject,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { strctCheckHostInputs, strctCheckHostDisplay } from '../util/host-check';
import { StrctIcon } from '../icon/icon';

/** Alert visual types. */
export type StrctAlertType = 'info' | 'success' | 'warning' | 'critical';

/** Inline contextual banner. `<strct-alert type="warning">…</strct-alert>`. */
@Component({
  selector: 'strct-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <!-- The row carries the layout, not the host: a consumer setting
         display:block for spacing must not put the icon on its own line. -->
    <div class="strct-alert__row">
      <strct-icon class="strct-alert__icon" [name]="iconName()" [size]="16" />
      <div class="strct-alert__body"><ng-content /></div>
      @if (closable()) {
        <button
          type="button"
          class="strct-alert__close"
          [attr.aria-label]="dismissLabel()"
          (click)="closed.emit()"
        >
          <strct-icon name="close" [size]="13" />
        </button>
      }
    </div>
  `,
  host: {
    class: 'strct-alert',
    // role="alert" implies aria-live="assertive" for critical alerts.
    '[attr.role]': "type() === 'critical' ? 'alert' : 'status'",
    '[class.strct-alert--success]': "type() === 'success'",
    '[class.strct-alert--warning]': "type() === 'warning'",
    '[class.strct-alert--critical]': "type() === 'critical'",
  },
  styles: [
    `
      /* Restrained: neutral surface with a colored left rail + colored icon,
       instead of a fully tinted background. */
      .strct-alert {
        display: block;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-lg);
        font-size: 13px;
        color: var(--t1);
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-inline-start: 3px solid var(--acc);
      }
      .strct-alert__row {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
      }
      .strct-alert strct-icon {
        color: var(--acc);
        margin-top: 1px;
        flex-shrink: 0;
      }
      .strct-alert__body {
        flex: 1;
        color: var(--t1);
      }
      .strct-alert__close {
        flex-shrink: 0;
        display: inline-flex;
        padding: 2px;
        margin-block-start: -2px;
        margin-inline-end: -2px;
        border: 0;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
        border-radius: var(--radius-sm);
      }
      .strct-alert__close:hover {
        color: var(--t1);
        background: var(--bg-3);
      }

      .strct-alert--success {
        border-inline-start-color: var(--success);
      }
      .strct-alert--success strct-icon {
        color: var(--success);
      }
      .strct-alert--warning {
        border-inline-start-color: var(--warning);
      }
      .strct-alert--warning strct-icon {
        color: var(--warning);
      }
      .strct-alert--critical {
        border-inline-start-color: var(--critical);
      }
      .strct-alert--critical strct-icon {
        color: var(--critical);
      }
    `,
  ],
})
export class StrctAlert {
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Dev-only: writing this component the way a sibling is written must not
    // fail silently. Guarded inline, so production drops the call — and with it
    // the whole diagnostics module.
    afterNextRender(() => {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const el = this.hostEl.nativeElement;
        strctCheckHostInputs(el, 'strct-alert', {
          type: 'info, success, warning, critical',
          icon: 'an icon name',
        });
        strctCheckHostDisplay(el, 'strct-alert', 'block');
      }
    });
  }
  /** Visual type / variant. */
  readonly type = input<StrctAlertType>('info');
  /** Show a dismiss button. */
  readonly closable = input(false, { transform: booleanAttribute });
  /** Accessible label of the dismiss button (localizable). */
  readonly dismissLabel = input('Dismiss');
  /**
   * Overrides the icon derived from `type` — a lock for a locked setting, a
   * shield for a security note, when the tone alone does not say what kind of
   * note this is. `null` keeps the derived one.
   */
  readonly icon = input<string | null>(null);
  /** Emitted when the alert is dismissed. */
  readonly closed = output<void>();

  protected readonly iconName = computed(() => this.icon() ?? this.derivedIcon());

  private readonly derivedIcon = computed(() => {
    switch (this.type()) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'critical';
      default:
        return 'info';
    }
  });
}
