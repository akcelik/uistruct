import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  effect,
  forwardRef,
  input,
  model,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';

/** Checkbox with custom box. Works with `[(ngModel)]` / reactive forms. */
@Component({
  selector: 'strct-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StrctIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctCheckbox), multi: true },
  ],
  template: `
    <label class="strct-cb" [class.strct-cb--disabled]="isDisabled()">
      <input
        type="checkbox"
        class="strct-cb__native"
        [checked]="checked()"
        [disabled]="isDisabled()"
        [indeterminate]="indeterminate()"
        [attr.aria-label]="ariaLabel()"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <span class="strct-cb__box">
        <strct-icon name="check" [size]="11" [strokeWidth]="2" />
      </span>
      <span class="strct-cb__label"><ng-content /></span>
    </label>
  `,
  styles: [
    `
      .strct-cb {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
        user-select: none;
      }
      .strct-cb--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .strct-cb__native {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      .strct-cb__box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 17px;
        height: 17px;
        border-radius: 4px;
        flex-shrink: 0;
        background: var(--bg-2);
        border: 1px solid var(--b3);
        color: transparent;
        transition:
          background 0.14s ease,
          border-color 0.14s ease;
      }
      .strct-cb__native:checked + .strct-cb__box {
        background: var(--acc);
        border-color: transparent;
        color: var(--inv);
      }
      .strct-cb__native:focus-visible + .strct-cb__box {
        box-shadow: 0 0 0 3px var(--acc18);
      }
    `,
  ],
})
export class StrctCheckbox implements ControlValueAccessor {
  readonly checked = model(false);
  readonly isDisabled = model(false);
  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Tri-state visual indicator for a parent / intermediate state. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Accessible label for the checkbox (used when no text label is present). */
  readonly ariaLabel = input<string | null>(null);

  private onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    effect(() => this.isDisabled.set(this.disabled()));
  }

  onToggle(event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.checked.set(value);
    this.onChange(value);
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
