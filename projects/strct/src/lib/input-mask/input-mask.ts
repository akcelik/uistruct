import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Masked text input. Mask tokens: `9` = digit, `A` = letter, `*` = alphanumeric;
 * every other character is a literal. CVA value is the formatted string.
 *   <strct-input-mask mask="(999) 999 99 99" [(ngModel)]="phone" />
 *   <strct-input-mask mask="9999 9999 9999 9999" [(ngModel)]="card" />
 */
@Component({
  selector: 'strct-input-mask',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctInputMask), multi: true },
  ],
  template: `
    <input
      class="strct-control strct-mask__input"
      type="text"
      inputmode="text"
      [placeholder]="placeholder() || mask()"
      [value]="display()"
      [disabled]="isDisabled()"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
  styles: [`.strct-input-mask, .strct-mask__input { display: block; width: 100%; max-width: 280px; }`],
})
export class StrctInputMask implements ControlValueAccessor {
  readonly mask = input.required<string>();
  readonly placeholder = input('');

  readonly display = signal('');
  readonly isDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const formatted = this.format(el.value);
    this.display.set(formatted);
    // keep the field text in sync (covers rejected characters)
    el.value = formatted;
    this.onChange(formatted);
  }

  private isToken(c: string): boolean {
    return c === '9' || c === 'A' || c === '*';
  }

  private matches(ch: string, token: string): boolean {
    if (token === '9') return /[0-9]/.test(ch);
    if (token === 'A') return /[a-zA-Z]/.test(ch);
    return /[0-9a-zA-Z]/.test(ch); // '*'
  }

  private format(raw: string): string {
    const mask = this.mask();
    // Pull out only the data characters (drop literals / rejected input).
    const data: string[] = [];
    for (const ch of raw) {
      if (/[0-9a-zA-Z]/.test(ch)) data.push(ch);
    }
    let out = '';
    let di = 0;
    for (let mi = 0; mi < mask.length && di < data.length; ) {
      const m = mask[mi];
      if (this.isToken(m)) {
        if (this.matches(data[di], m)) {
          out += data[di];
          mi++;
          di++;
        } else {
          di++; // skip a data char that doesn't fit this token
        }
      } else {
        out += m; // literal
        mi++;
      }
    }
    return out;
  }

  writeValue(value: string): void {
    this.display.set(this.format(value ?? ''));
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
