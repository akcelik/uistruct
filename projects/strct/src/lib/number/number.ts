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

/**
 * Numeric stepper input: − / + buttons flanking a text field. The value is
 * `number | null` (null = empty); typing is free-form (intermediate states
 * like "-" are kept), committed values clamp to `min`/`max` on blur, and the
 * buttons + keyboard always clamp immediately.
 *
 *   <strct-number [min]="0" [max]="64" [step]="4" [(ngModel)]="vcpus" />
 *
 * Keyboard on the field: ArrowUp/Down ±step, PageUp/Down ±10×step,
 * Home/End jump to min/max. The field exposes `role="spinbutton"` with
 * aria-valuemin/max/now so assistive tech announces it as a number control.
 */
@Component({
  selector: 'strct-number',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctNumber), multi: true },
  ],
  template: `
    <div class="strct-num__wrap">
      <button
        type="button"
        class="strct-num__btn"
        [attr.aria-label]="decrementLabel()"
        [disabled]="isDisabled() || atMin()"
        (click)="stepBy(-1)"
      >
        <strct-icon strictName="minus" [size]="12" [strokeWidth]="1.8" />
      </button>
      <input
        type="text"
        inputmode="decimal"
        class="strct-control strct-num__input"
        role="spinbutton"
        [attr.aria-valuemin]="min()"
        [attr.aria-valuemax]="max()"
        [attr.aria-valuenow]="value()"
        [placeholder]="placeholder()"
        [value]="text()"
        [disabled]="isDisabled()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (blur)="onBlur()"
      />
      <button
        type="button"
        class="strct-num__btn"
        [attr.aria-label]="incrementLabel()"
        [disabled]="isDisabled() || atMax()"
        (click)="stepBy(1)"
      >
        <strct-icon strictName="plus" [size]="12" [strokeWidth]="1.8" />
      </button>
    </div>
  `,
  host: { class: 'strct-num' },
  styles: [
    `
      .strct-num {
        display: block;
        width: 100%;
      }
      .strct-num__wrap {
        display: flex;
        align-items: stretch;
        gap: var(--space-1);
      }
      .strct-num__input {
        flex: 1;
        min-width: 0;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }
      .strct-num__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        padding-inline: var(--space-2);
        color: var(--t2);
        background: var(--bg-2);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition:
          border-color 0.14s ease,
          color 0.14s ease,
          background 0.14s ease;
      }
      .strct-num__btn:hover:not(:disabled) {
        color: var(--t1);
        border-color: var(--b3);
        background: var(--bg-3);
      }
      .strct-num__btn:disabled {
        opacity: var(--disabled-opacity);
        cursor: not-allowed;
      }
    `,
  ],
})
export class StrctNumber implements ControlValueAccessor {
  /** Minimum allowed value; null = unbounded. */
  readonly min = input<number | null>(null);
  /** Maximum allowed value; null = unbounded. */
  readonly max = input<number | null>(null);
  /** Step increment for buttons and Arrow keys (PageUp/Down use 10×). */
  readonly step = input(1);
  /** Placeholder text when empty. */
  readonly placeholder = input('');
  /** Accessible label of the + button (localizable). */
  readonly incrementLabel = input('Increment');
  /** Accessible label of the − button (localizable). */
  readonly decrementLabel = input('Decrement');
  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly value = signal<number | null>(null);
  /** Raw field text — may hold an unparseable intermediate state while typing. */
  protected readonly text = signal('');
  /** Disabled state pushed by the forms API (setDisabledState). */
  private readonly cvaDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /** At/below min (or min unset → never) — greys out the − button. */
  protected readonly atMin = computed(() => {
    const v = this.value();
    const m = this.min();
    return v !== null && m !== null && v <= m;
  });
  /** At/above max (or max unset → never) — greys out the + button. */
  protected readonly atMax = computed(() => {
    const v = this.value();
    const m = this.max();
    return v !== null && m !== null && v >= m;
  });

  private onChange: (value: number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.text.set(raw);
    const trimmed = raw.trim();
    if (trimmed === '') {
      this.value.set(null);
      this.onChange(null);
      return;
    }
    const parsed = Number(trimmed);
    // Intermediate states ("-", "1.", "2e") don't parse yet — keep the text,
    // hold the last value; clamping happens on blur.
    if (Number.isFinite(parsed)) {
      this.value.set(parsed);
      this.onChange(parsed);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.stepBy(1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.stepBy(-1);
        break;
      case 'PageUp':
        event.preventDefault();
        this.stepBy(1, 10);
        break;
      case 'PageDown':
        event.preventDefault();
        this.stepBy(-1, 10);
        break;
      case 'Home': {
        const m = this.min();
        if (m === null) return;
        event.preventDefault();
        this.commitTo(m);
        break;
      }
      case 'End': {
        const m = this.max();
        if (m === null) return;
        event.preventDefault();
        this.commitTo(m);
        break;
      }
    }
  }

  /** Commit the pending text on blur: parse, clamp, restore on garbage. */
  protected onBlur(): void {
    const trimmed = this.text().trim();
    if (trimmed === '') {
      if (this.value() !== null) {
        this.value.set(null);
        this.onChange(null);
      }
      this.text.set('');
    } else {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        const clamped = this.clamp(parsed);
        this.value.set(clamped);
        if (clamped !== parsed) this.onChange(clamped);
        this.text.set(String(clamped));
      } else {
        // Unparseable — restore the last committed value.
        this.text.set(this.value() === null ? '' : String(this.value()));
      }
    }
    this.onTouched();
  }

  /** Button / keyboard step: an empty field first lands on min (or 0). */
  protected stepBy(dir: 1 | -1, factor = 1): void {
    if (this.isDisabled()) return;
    const v = this.value();
    if (v === null) {
      this.commitTo(this.min() ?? 0);
      return;
    }
    this.commitTo(v + dir * factor * this.step());
  }

  private commitTo(n: number): void {
    const clamped = this.clamp(this.snap(n));
    this.value.set(clamped);
    this.text.set(String(clamped));
    this.onChange(clamped);
    this.onTouched();
  }

  private clamp(n: number): number {
    const lo = this.min();
    const hi = this.max();
    if (lo !== null && n < lo) return lo;
    if (hi !== null && n > hi) return hi;
    return n;
  }

  /** Trim float dust from step arithmetic (0.1 + 0.2), not a grid snap. */
  private snap(n: number): number {
    const step = this.step();
    if (!Number.isFinite(step) || step <= 0) return n;
    const decimals = (String(step).split('.')[1] ?? '').length;
    return Number(n.toFixed(Math.min(decimals + 2, 12)));
  }

  writeValue(value: number | null): void {
    const parsed = value === null || value === undefined ? null : Number(value);
    const v = parsed !== null && Number.isFinite(parsed) ? this.clamp(parsed) : null;
    this.value.set(v);
    this.text.set(v === null ? '' : String(v));
  }
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
