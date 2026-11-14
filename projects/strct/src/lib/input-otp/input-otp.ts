import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  afterNextRender,
  booleanAttribute,
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
  host: { '[attr.data-align]': 'align()' },
  template: `
    <div class="strct-otp" [class.strct-otp--fill]="fill()" [class.strct-otp--lg]="size() === 'lg'">
      @for (i of indices(); track i) {
        @if (groupSize() > 0 && i > 0 && i % groupSize() === 0) {
          <span class="strct-otp__sep" aria-hidden="true">–</span>
        }
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
      /* The cell's designed size, the cap fill may grow it to, and the
         ratio it keeps while it grows: a digit cell reads as a cell because
         it is upright, and past square it reads as a short text field. */
      .strct-otp {
        --strct-otp-box-w: 40px;
        --strct-otp-box-h: 46px;
        --strct-otp-box-max: 48px;
        --strct-otp-box-ratio: 20 / 23;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .strct-otp--lg {
        --strct-otp-box-w: 48px;
        --strct-otp-box-h: 56px;
        --strct-otp-box-max: 58px;
        --strct-otp-box-ratio: 6 / 7;
      }
      /* fill — the row spans the field, so the code lines up with a
         full-width Verify button under it. The boxes grow with it, to the
         cap and no further, and keep their ratio the whole way (BUG-80-03:
         growing the width alone made a 59x46 landscape tile out of a 40x46
         portrait cell, and the wider the card the flatter it read). Past the
         cap the spare width goes into the gaps, so the first and the last
         box still sit on the row's edges. */
      .strct-otp--fill {
        display: flex;
        width: 100%;
        justify-content: space-between;
      }
      .strct-otp--fill .strct-otp__box {
        flex: 1 1 var(--strct-otp-box-w);
        min-width: 0;
        max-width: var(--strct-otp-box-max);
        height: auto;
        aspect-ratio: var(--strct-otp-box-ratio);
      }
      /* The gap places the groups once the row is wider than the code. */
      .strct-otp--fill .strct-otp__sep {
        margin-inline: 0;
      }
      /* align — the host is an inline element, so its row starts at the
         field's left edge however wide the field is, while everything else
         on a sign-in card is centred or full-width (FR-80-06). start is the
         default and leaves the host inline: nothing that exists moves. */
      strct-input-otp[data-align='center'],
      strct-input-otp[data-align='end'] {
        display: flex;
      }
      strct-input-otp[data-align='center'] {
        justify-content: center;
      }
      strct-input-otp[data-align='end'] {
        justify-content: flex-end;
      }
      /* Group separator — mirrors how authenticator apps display the code. */
      .strct-otp__sep {
        margin-inline: 3px;
        color: var(--t3);
        font-size: var(--text-xl);
        user-select: none;
      }
      .strct-otp__box {
        width: var(--strct-otp-box-w);
        height: var(--strct-otp-box-h);
        text-align: center;
        font-family: var(--mono);
        font-size: var(--text-xl);
        color: var(--t1);
        background: var(--bg-2);
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        transition:
          border-color 0.14s ease,
          box-shadow 0.14s ease,
          background 0.14s ease;
      }
      .strct-otp--lg .strct-otp__box {
        font-size: var(--text-2xl);
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
  readonly masked = input(false, { transform: booleanAttribute });
  /**
   * Focus box 0 on first render — the "second-factor step just appeared"
   * case, declaratively.
   */
  readonly autofocus = input(false, { transform: booleanAttribute });
  /**
   * Insert a visual separator every N boxes (0 = none): `groupSize=3` renders
   * `nnn – nnn`, mirroring how authenticator apps display the code.
   */
  readonly groupSize = input(0);
  /**
   * Spread the boxes across the full width, so the code lines up with a
   * full-width button under it rather than huddling at the start of the row.
   */
  readonly fill = input(false, { transform: booleanAttribute });
  /**
   * Where the row sits in the width the host is given: `start` (the default,
   * which leaves the host inline and moves nothing) | `center` | `end`. A
   * code entry is one control, and on a card whose title, button and
   * recovery link are centred, a row hung on the left reads as misplaced.
   * With `fill` the row already spans the field, so `align` has nothing left
   * to place.
   */
  readonly align = input<'start' | 'center' | 'end'>('start');
  /**
   * The cell's size: `md` (40x46, the default) or `lg` (48x56 with the larger
   * glyph) — a sign-in page's own step, drawn larger without stretching the
   * cells. `fill` grows either one to a cap of its own, keeping the ratio.
   */
  readonly size = input<'md' | 'lg'>('md');

  readonly slots = signal<string[]>([]);
  readonly isDisabled = signal(false);

  protected readonly indices = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    afterNextRender(() => {
      if (this.autofocus()) this.focusBox(0);
    });
  }

  /** Move the caret to a box — e.g. back to 0 after clearing a rejected code. */
  focus(index = 0): void {
    this.focusBox(index);
  }

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
