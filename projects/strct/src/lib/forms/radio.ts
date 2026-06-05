import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let groupCounter = 0;

/**
 * Radio group (the form control). Wrap `<strct-radio>` items:
 *   <strct-radio-group [(ngModel)]="size">
 *     <strct-radio [value]="'sm'">Small</strct-radio>
 *     <strct-radio [value]="'lg'">Large</strct-radio>
 *   </strct-radio-group>
 */
@Component({
  selector: 'strct-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctRadioGroup), multi: true },
  ],
  template: `<ng-content />`,
  host: { class: 'strct-radio-group', role: 'radiogroup' },
  styles: [
    `
      .strct-radio-group {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
    `,
  ],
})
export class StrctRadioGroup implements ControlValueAccessor {
  readonly name = `strct-radio-${++groupCounter}`;
  readonly value = signal<unknown>(null);
  readonly isDisabled = signal(false);

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  select(value: unknown): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: unknown): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}

/** One option inside a `<strct-radio-group>`. */
@Component({
  selector: 'strct-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="strct-rb" [class.strct-rb--disabled]="disabled() || group.isDisabled()">
      <input
        type="radio"
        class="strct-rb__native"
        [name]="group.name"
        [checked]="group.value() === value()"
        [disabled]="disabled() || group.isDisabled()"
        (change)="group.select(value())"
      />
      <span class="strct-rb__dot"></span>
      <span class="strct-rb__label"><ng-content /></span>
    </label>
  `,
  styles: [
    `
      .strct-rb {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
        user-select: none;
      }
      .strct-rb--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .strct-rb__native {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      .strct-rb__dot {
        position: relative;
        width: 17px;
        height: 17px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--bg-2);
        border: 1px solid var(--b3);
        transition: border-color 0.14s ease;
      }
      .strct-rb__dot::after {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--acc);
        transform: scale(0);
        transition: transform 0.14s ease;
      }
      .strct-rb__native:checked + .strct-rb__dot {
        border-color: var(--acc);
      }
      .strct-rb__native:checked + .strct-rb__dot::after {
        transform: scale(1);
      }
      .strct-rb__native:focus-visible + .strct-rb__dot {
        box-shadow: 0 0 0 3px var(--acc18);
      }
    `,
  ],
})
export class StrctRadio {
  /** Current value. */
  readonly value = input.required<unknown>();
  /** Static disable flag. */
  readonly disabled = input(false, { transform: booleanAttribute });
  protected readonly group = inject(StrctRadioGroup);
}
