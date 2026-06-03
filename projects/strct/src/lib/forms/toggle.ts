import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** On/off switch. Works with `[(ngModel)]` / reactive forms. */
@Component({
  selector: 'strct-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctToggle), multi: true },
  ],
  template: `
    <label class="strct-tg" [class.strct-tg--disabled]="isDisabled()">
      <input
        type="checkbox"
        class="strct-tg__native"
        role="switch"
        [checked]="checked()"
        [disabled]="isDisabled()"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <span class="strct-tg__track"><span class="strct-tg__thumb"></span></span>
      <span class="strct-tg__label"><ng-content /></span>
    </label>
  `,
  styles: [
    `
    .strct-tg {
      display: inline-flex; align-items: center; gap: 9px; cursor: pointer;
      font-size: 13px; color: var(--t1); user-select: none;
    }
    .strct-tg--disabled { opacity: .5; cursor: not-allowed; }
    .strct-tg__native { position: absolute; opacity: 0; width: 0; height: 0; }
    .strct-tg__track {
      position: relative; width: 34px; height: 19px; border-radius: 11px; flex-shrink: 0;
      background: var(--bg-3); border: 1px solid var(--b3);
      transition: background .16s ease, border-color .16s ease;
    }
    .strct-tg__thumb {
      position: absolute; top: 2px; left: 2px; width: 13px; height: 13px; border-radius: 50%;
      background: var(--t2); transition: transform .16s ease, background .16s ease;
    }
    .strct-tg__native:checked + .strct-tg__track {
      background: var(--acc); border-color: transparent;
    }
    .strct-tg__native:checked + .strct-tg__track .strct-tg__thumb {
      transform: translateX(15px); background: #fff;
    }
    .strct-tg__native:focus-visible + .strct-tg__track { box-shadow: 0 0 0 3px var(--acc18); }
    `,
  ],
})
export class StrctToggle implements ControlValueAccessor {
  readonly checked = signal(false);
  readonly isDisabled = signal(false);
  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });

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
