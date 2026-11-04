import {
  Directive,
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

/** Controls at the alert's end — the fix the alert is about. */
@Directive({ selector: '[strctAlertActions]' })
export class StrctAlertActions {}

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
      <!-- Declared before the catch-all so the selector wins; it renders at
           the row's end either way, after the body. -->
      <span class="strct-alert__actions">
        <ng-content select="[strctAlertActions]" />
      </span>
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
      /* Severity on surface, weight and hue (7.0): a rail and an icon in the
         tone, and for warning and critical a tone fill and a heavier rail,
       instead of a fully tinted background. */
      .strct-alert {
        display: block;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-lg);
        font-size: var(--text-md);
        color: var(--t1);
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-inline-start: 3px solid var(--acc);
      }
      /* Severity rides on surface and weight, not hue alone (FR-67-06). The
         rail is a rail, not a border weight: 3px for a note, 4px for a
         warning, 5px for a critical.
         Before 7.0 all four tones were the same --bg-1 rectangle behind the
         same 3px rail, so at arm's length a critical note and an
         informational one were the same object. The tone fills the palettes
         already carried — --warning-bg, --critical-bg — were never used. */
      /* 7.4: the tone is a layer on top of the alert's own --bg-1, not a
         replacement for it. Replacing it let a 12% tint composite over the
         page instead, and in the dark palettes a critical alert then painted
         1.047:1 from the page — the loudest thing on the screen read as a
         hole in it. Layered, the same tone is 1.17:1 from a quiet alert. */
      .strct-alert--warning {
        background-image: linear-gradient(var(--warning-bg), var(--warning-bg));
        border-inline-start-width: 4px;
      }
      .strct-alert--critical {
        background-image: linear-gradient(var(--critical-bg), var(--critical-bg));
        border-inline-start-width: 5px;
        box-shadow: 0 1px 0 var(--b1);
      }
      .strct-alert--critical .strct-alert__body {
        font-weight: 500;
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
        order: 1;
      }
      /* A warning that carries its own fix — "3 VMs differ from the policy ·
         Remediate" — puts the button at the alert's end, on the body's first
         line. */
      .strct-alert__actions {
        order: 2;
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        flex: none;
      }
      .strct-alert__actions:empty {
        display: none;
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
