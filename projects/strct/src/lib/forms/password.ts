import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';

const LEVEL_COLORS = [
  'var(--critical)',
  'var(--critical)',
  'var(--warning)',
  'var(--acc)',
  'var(--success)',
];

/**
 * Password input with a reveal toggle and an optional strength meter. CVA-compatible.
 *   <strct-password [(ngModel)]="pw" meter />
 */
@Component({
  selector: 'strct-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctPassword), multi: true },
  ],
  template: `
    <div class="strct-pw__field">
      <input
        class="strct-control strct-pw__input"
        [type]="revealed() ? 'text' : 'password'"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="isDisabled()"
        [attr.autocomplete]="autocomplete()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <button
        type="button"
        class="strct-pw__toggle"
        [attr.aria-label]="revealed() ? hideLabel() : showLabel()"
        [disabled]="isDisabled()"
        (click)="revealed.set(!revealed())"
      >
        <strct-icon [name]="revealed() ? 'eyeOff' : 'eye'" [size]="16" [strokeWidth]="1.3" />
      </button>
    </div>
    @if (meter() && value()) {
      <div class="strct-pw__meter" role="status" aria-live="polite">
        <div class="strct-pw__bars">
          @for (i of [0, 1, 2, 3]; track i) {
            <span
              class="strct-pw__bar"
              [style.background]="i < score() ? level().color : 'var(--bg-3)'"
            ></span>
          }
        </div>
        <span class="strct-pw__label" [style.color]="level().color">{{ level().label }}</span>
      </div>
    }
  `,
  host: { class: 'strct-pw' },
  styles: [
    `
      .strct-pw {
        display: block;
        width: 100%;
      }
      .strct-pw__field {
        position: relative;
      }
      .strct-pw__input {
        padding-inline-end: 38px;
      }
      .strct-pw__toggle {
        position: absolute;
        inset-inline-end: 4px;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        padding: 5px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t2);
        cursor: pointer;
      }
      .strct-pw__toggle:hover {
        color: var(--acc);
        background: var(--bg-3);
      }
      .strct-pw__meter {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-top: 7px;
      }
      .strct-pw__bars {
        display: flex;
        gap: 3px;
        flex: 1;
      }
      .strct-pw__bar {
        flex: 1;
        height: 3px;
        border-radius: 2px;
        transition: background 0.2s ease;
      }
      .strct-pw__label {
        font-size: 12px;
        font-weight: 600;
        min-width: 42px;
        text-align: end;
      }
    `,
  ],
})
export class StrctPassword implements ControlValueAccessor {
  /** Placeholder text when empty. */
  readonly placeholder = input('');
  /** Show a strength meter. */
  readonly meter = input(false, { transform: booleanAttribute });
  /** Static disable flag. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Localized strength labels, weakest to strongest. */
  readonly strengthLabels = input(['Weak', 'Fair', 'Good', 'Strong']);
  /** aria-label of the reveal toggle when the password is hidden. */
  readonly showLabel = input('Show password');
  /** aria-label of the reveal toggle when the password is visible. */
  readonly hideLabel = input('Hide password');
  /** Autocomplete hint; the default lets password managers work. */
  readonly autocomplete = input('current-password');

  readonly value = signal('');
  readonly revealed = signal(false);
  readonly isDisabled = signal(false);

  protected readonly score = computed(() => {
    const v = this.value();
    if (!v) return 0;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  });
  protected readonly level = computed(() => {
    const s = this.score();
    const labels = this.strengthLabels();
    // Scores 0-1 share the weakest label; clamp so custom arrays of any size work.
    const idx = Math.max(0, Math.min(s - 1, labels.length - 1));
    return { label: labels[idx] ?? '', color: LEVEL_COLORS[s] };
  });

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(value: string): void {
    this.value.set(value || '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
