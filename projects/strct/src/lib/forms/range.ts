import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Slider built on a native range input — fully accessible, CVA-compatible.
 *   <strct-range [min]="0" [max]="100" [(ngModel)]="volume" showValue />
 */
@Component({
  selector: 'strct-range',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctRange), multi: true },
  ],
  template: `
    <input
      type="range"
      class="strct-range__input"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [value]="value()"
      [disabled]="isDisabled()"
      [style.--strct-range-fill.%]="fillPercent()"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
    @if (showValue()) {
      <span class="strct-range__value">{{ value() }}</span>
    }
  `,
  styles: [
    `
    .strct-range { display: inline-flex; align-items: center; gap: 10px; width: 100%; max-width: 280px; }
    .strct-range__input {
      flex: 1; appearance: none; height: 5px; border-radius: 3px; cursor: pointer;
      background: linear-gradient(
        to right,
        var(--acc) 0 var(--strct-range-fill, 0%),
        var(--bg-3) var(--strct-range-fill, 0%) 100%
      );
    }
    .strct-range__input:disabled { opacity: .5; cursor: not-allowed; }
    .strct-range__input::-webkit-slider-thumb {
      appearance: none; width: 15px; height: 15px; border-radius: 50%;
      background: var(--acc); border: 2px solid var(--bg-1); box-shadow: var(--sh);
    }
    .strct-range__input::-moz-range-thumb {
      width: 15px; height: 15px; border-radius: 50%;
      background: var(--acc); border: 2px solid var(--bg-1); box-shadow: var(--sh);
    }
    .strct-range__input:focus-visible { outline: none; }
    .strct-range__input:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--acc18); }
    .strct-range__value {
      min-width: 30px; text-align: right; font-size: 12px; font-family: var(--mono); color: var(--t2);
    }
    `,
  ],
})
export class StrctRange implements ControlValueAccessor {
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly showValue = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly value = signal(0);
  readonly isDisabled = signal(false);

  protected readonly fillPercent = computed(() => {
    const span = this.max() - this.min();
    return span <= 0 ? 0 : ((this.value() - this.min()) / span) * 100;
  });

  private onChange: (value: number) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    effect(() => this.isDisabled.set(this.disabled()));
  }

  onInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.value.set(value);
    this.onChange(value);
  }

  writeValue(value: number): void {
    this.value.set(Number(value) || 0);
  }
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
