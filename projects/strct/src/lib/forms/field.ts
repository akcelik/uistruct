import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctSpinner } from '../spinner/spinner';
import { StrctValidationState, strctValidationIcon } from '../validation/validation';

let fieldCounter = 0;

/**
 * Form-field wrapper: a label (with optional required marker), the projected
 * control, and a hint or error message. It auto-links the control via
 * `aria-describedby` and sets `aria-invalid` when an error is present.
 *
 *   <strct-field label="Email" required hint="We never share it." [error]="emailError()">
 *     <input strctInput type="email" [(ngModel)]="email" />
 *   </strct-field>
 */
@Component({
  selector: 'strct-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctSpinner],
  template: `
    @if (label()) {
      <label class="strct-field__label" [attr.for]="controlId() || null">
        {{ label() }}
        @if (required()) {
          <span class="strct-field__req" aria-hidden="true">*</span>
        }
      </label>
    }
    <div class="strct-field__control">
      <ng-content />
      @if (stateActive()) {
        <span class="strct-field__adorn strct-field__adorn--{{ stateStatus() }}" aria-hidden="true">
          @if (stateStatus() === 'checking') {
            <strct-spinner size="sm" />
          } @else if (stateIcon()) {
            <strct-icon [name]="stateIcon()" [size]="15" />
          }
        </span>
      }
    </div>
    @if (errorText()) {
      <div class="strct-field__msg strct-field__msg--error" [id]="errorId" role="alert">
        {{ errorText() }}
      </div>
    } @else if (stateMessage()) {
      <div
        class="strct-field__msg strct-field__msg--{{ stateStatus() }}"
        [id]="hintId"
        [attr.role]="stateStatus() === 'error' ? 'alert' : null"
        aria-live="polite"
      >
        {{ stateMessage() }}
      </div>
    } @else if (hint()) {
      <div class="strct-field__msg strct-field__msg--hint" [id]="hintId">{{ hint() }}</div>
    }
  `,
  host: {
    class: 'strct-field',
    '[class.strct-field--invalid]': 'isInvalid()',
    '[class.strct-field--validating]': 'stateActive()',
  },
  styles: [
    `
      .strct-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .strct-field__label {
        font-size: 12px;
        font-weight: 600;
        color: var(--t2);
      }
      .strct-field__req {
        color: var(--critical);
        margin-inline-start: 2px;
      }
      .strct-field__control {
        position: relative;
        display: flex;
        flex-direction: column;
      }
      /* Trailing validation adornment, vertically centred on a single-line control. */
      .strct-field__adorn {
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        pointer-events: none;
      }
      .strct-field__adorn--ok {
        color: var(--success);
      }
      .strct-field__adorn--warning {
        color: var(--warning);
      }
      .strct-field__adorn--error {
        color: var(--critical);
      }
      /* Make room for the adornment so it never overlaps the text. */
      .strct-field--validating .strct-control {
        padding-inline-end: 32px;
      }
      .strct-field__msg {
        font-size: 12px;
        line-height: 1.4;
      }
      .strct-field__msg--hint,
      .strct-field__msg--checking {
        color: var(--t3);
      }
      .strct-field__msg--ok {
        color: var(--success);
      }
      .strct-field__msg--warning {
        color: var(--warning);
      }
      .strct-field__msg--error {
        color: var(--critical);
      }
    `,
  ],
})
export class StrctField {
  /** Label text. */
  readonly label = input('');
  /** Show a required marker on the label. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Helper text shown below the field. */
  readonly hint = input('');
  /** Error message (string or first-of array); falsy clears the error state. */
  readonly error = input<string | string[] | null | undefined>(null);
  /**
   * Async-validation state rendered as a trailing adornment (spinner / check /
   * warning) plus its message in the hint/error slot — so apps stop composing a
   * spinner + badge by hand for live "checking… → ok / warning / error" checks.
   */
  readonly validationState = input<StrctValidationState | null>(null);

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly n = ++fieldCounter;
  protected readonly hintId = `strct-field-hint-${this.n}`;
  protected readonly errorId = `strct-field-err-${this.n}`;
  protected readonly controlId = signal('');

  protected readonly errorText = computed(() => {
    const e = this.error();
    return (Array.isArray(e) ? e[0] : e) ?? '';
  });

  /** Effective validation status ('idle' when no state supplied). */
  protected readonly stateStatus = computed(() => this.validationState()?.status ?? 'idle');
  /** Whether to show the trailing adornment (an explicit error suppresses it). */
  protected readonly stateActive = computed(
    () => !this.errorText() && this.stateStatus() !== 'idle',
  );
  protected readonly stateIcon = computed(() => strctValidationIcon(this.stateStatus()));
  /** Validation message, shown only when there is no explicit error. */
  protected readonly stateMessage = computed(() =>
    this.errorText() ? '' : (this.validationState()?.message ?? ''),
  );
  /** Invalid when an explicit error is set or the validation state is 'error'. */
  protected readonly isInvalid = computed(
    () => !!this.errorText() || this.stateStatus() === 'error',
  );

  constructor() {
    afterNextRender(() => this.link());
    // Keep aria in sync as the error / hint / validation state change.
    effect(() => {
      this.errorText();
      this.hint();
      this.stateStatus();
      this.stateMessage();
      this.applyAria();
    });
  }

  private control(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(
      'input, select, textarea, [strctInput], [strctField]',
    );
  }

  private link(): void {
    const el = this.control();
    if (!el) return;
    if (!el.id) el.id = `strct-field-ctrl-${this.n}`;
    this.controlId.set(el.id);
    this.applyAria();
  }

  private applyAria(): void {
    const el = this.control();
    if (!el) return;
    const describedBy = this.errorText()
      ? this.errorId
      : this.stateMessage() || this.hint()
        ? this.hintId
        : '';
    if (describedBy) el.setAttribute('aria-describedby', describedBy);
    else el.removeAttribute('aria-describedby');
    if (this.isInvalid()) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }
}
