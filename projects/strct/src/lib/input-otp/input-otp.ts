import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * One-time-password input — a row of single-character boxes with auto-advance,
 * backspace and paste. CVA value is the concatenated string.
 *   <strct-input-otp [length]="6" [(ngModel)]="code" />
 */
@Component({
  selector: 'strct-input-otp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctInputOtp), multi: true },
  ],
  template: `
    <div class="strct-otp">
      @for (i of indices(); track i) {
        <input
          class="strct-otp__box"
          [type]="masked() ? 'password' : 'text'"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="1"
          [value]="slots()[i] || ''"
          [disabled]="isDisabled()"
          (input)="onInput(i, $event)"
          (keydown)="onKeydown(i, $event)"
          (paste)="onPaste($event)"
          (focus)="$any($event.target).select()"
        />
      }
    </div>
  `,
  styles: [
    `
      .strct-otp {
        display: inline-flex;
        gap: 8px;
      }
      .strct-otp__box {
        width: 40px;
        height: 46px;
        text-align: center;
        font-family: var(--mono);
        font-size: 18px;
        color: var(--t1);
        background: var(--bg-2);
        border: 1px solid var(--b2);
        border-radius: 8px;
        transition:
          border-color 0.14s ease,
          box-shadow 0.14s ease,
          background 0.14s ease;
      }
      .strct-otp__box:focus {
        outline: none;
        border-color: var(--acc50);
        box-shadow: 0 0 0 3px var(--acc18);
        background: var(--bg-1);
      }
      .strct-otp__box:disabled {
        opacity: 0.5;
      }
    `,
  ],
})
export class StrctInputOtp implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);
  /** Number of OTP boxes. */
  readonly length = input(6);
  /** Mask each box as a password dot. */
  readonly masked = input(false);

  readonly slots = signal<string[]>([]);
  readonly isDisabled = signal(false);

  protected readonly indices = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  onInput(i: number, event: Event): void {
    const ch = (event.target as HTMLInputElement).value.slice(-1);
    this.setSlot(i, ch);
    if (ch) this.focusBox(i + 1);
    this.emit();
  }

  onKeydown(i: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      if (!this.slots()[i]) {
        event.preventDefault();
        this.setSlot(i - 1, '');
        this.focusBox(i - 1);
        this.emit();
      }
    } else if (event.key === 'ArrowLeft') {
      this.focusBox(i - 1);
    } else if (event.key === 'ArrowRight') {
      this.focusBox(i + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text') ?? '').replace(/\s/g, '');
    if (!text) return;
    const next = Array.from({ length: this.length() }, (_, i) => text[i] ?? '');
    this.slots.set(next);
    this.focusBox(Math.min(text.length, this.length() - 1));
    this.emit();
    this.onTouched();
  }

  private setSlot(i: number, ch: string): void {
    if (i < 0 || i >= this.length()) return;
    const next = [...this.slots()];
    while (next.length < this.length()) next.push('');
    next[i] = ch;
    this.slots.set(next);
  }

  private focusBox(i: number): void {
    const el = this.host.nativeElement as HTMLElement;
    const boxes = el.querySelectorAll('.strct-otp__box');
    (boxes[i] as HTMLInputElement | undefined)?.focus();
  }

  private emit(): void {
    this.onChange(this.slots().join(''));
    this.onTouched();
  }

  writeValue(value: string): void {
    const v = value ?? '';
    this.slots.set(Array.from({ length: this.length() }, (_, i) => v[i] ?? ''));
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
