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
  template: `
    @if (label()) {
      <label class="strct-field__label" [attr.for]="controlId() || null">
        {{ label() }}
        @if (required()) {
          <span class="strct-field__req" aria-hidden="true">*</span>
        }
      </label>
    }
    <div class="strct-field__control"><ng-content /></div>
    @if (errorText()) {
      <div class="strct-field__msg strct-field__msg--error" [id]="errorId" role="alert">
        {{ errorText() }}
      </div>
    } @else if (hint()) {
      <div class="strct-field__msg strct-field__msg--hint" [id]="hintId">{{ hint() }}</div>
    }
  `,
  host: {
    class: 'strct-field',
    '[class.strct-field--invalid]': '!!errorText()',
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
        margin-left: 2px;
      }
      .strct-field__control {
        display: flex;
        flex-direction: column;
      }
      .strct-field__msg {
        font-size: 12px;
        line-height: 1.4;
      }
      .strct-field__msg--hint {
        color: var(--t3);
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

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly n = ++fieldCounter;
  protected readonly hintId = `strct-field-hint-${this.n}`;
  protected readonly errorId = `strct-field-err-${this.n}`;
  protected readonly controlId = signal('');

  protected readonly errorText = computed(() => {
    const e = this.error();
    return (Array.isArray(e) ? e[0] : e) ?? '';
  });

  constructor() {
    afterNextRender(() => this.link());
    // Keep aria in sync as the error / hint change.
    effect(() => {
      this.errorText();
      this.hint();
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
    const describedBy = this.errorText() ? this.errorId : this.hint() ? this.hintId : '';
    if (describedBy) el.setAttribute('aria-describedby', describedBy);
    else el.removeAttribute('aria-describedby');
    if (this.errorText()) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }
}
