import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Ready-made masks for common datacenter / form fields. */
export const STRCT_MASKS = {
  phoneTr: '(999) 999 99 99',
  nationalIdTr: '99999999999',
  creditCard: '9999 9999 9999 9999',
  /** MAC address — 6 hex octets, e.g. 00:1B:44:11:3A:B7 */
  mac: 'HH:HH:HH:HH:HH:HH',
  /** Fibre-channel WWPN — 8 hex octets, e.g. 20:00:00:25:B5:1A:00:0F */
  wwpn: 'HH:HH:HH:HH:HH:HH:HH:HH',
} as const;

/**
 * Masked text input. Mask tokens: `9` = digit, `A` = letter, `H` = hex digit,
 * `*` = alphanumeric; every other character is a literal. CVA value is the
 * formatted string.
 *   <strct-input-mask mask="(999) 999 99 99" [(ngModel)]="phone" />
 *   <strct-input-mask mask="HH:HH:HH:HH:HH:HH" uppercase [(ngModel)]="mac" />
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
  /** Upper-case entered letters (handy for hex MAC / WWPN). */
  readonly uppercase = input(false, { transform: booleanAttribute });

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
    return c === '9' || c === 'A' || c === 'H' || c === '*';
  }

  private matches(ch: string, token: string): boolean {
    if (token === '9') return /[0-9]/.test(ch);
    if (token === 'A') return /[a-zA-Z]/.test(ch);
    if (token === 'H') return /[0-9a-fA-F]/.test(ch);
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
          out += this.uppercase() ? data[di].toUpperCase() : data[di];
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
