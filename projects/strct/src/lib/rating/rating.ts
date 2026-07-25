import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  forwardRef,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Star rating input. CVA value is the selected count (0–max). */
@Component({
  selector: 'strct-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctRating), multi: true },
  ],
  template: `
    <div
      class="strct-rating"
      role="radiogroup"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-readonly]="readonly() || null"
      (keydown)="onKeydown($event)"
    >
      @for (star of stars(); track star) {
        <button
          #starBtn
          type="button"
          role="radio"
          class="strct-rating__star"
          [class.strct-rating__star--on]="star <= (hover() || value())"
          [class.strct-rating__star--readonly]="readonly()"
          [attr.aria-checked]="star === value()"
          [attr.aria-label]="starAriaLabel()(star, max())"
          [disabled]="isDisabled()"
          (mouseenter)="!readonly() && hover.set(star)"
          (mouseleave)="hover.set(0)"
          (click)="pick(star)"
        >
          <svg viewBox="0 0 16 16" [style.width.px]="size()" [style.height.px]="size()">
            <path
              d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.2 4.1 13.3l.9-4.3-3.3-3 4.4-.5z"
              [attr.fill]="star <= (hover() || value()) ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="1.1"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .strct-rating {
        display: inline-flex;
        gap: 3px;
      }
      .strct-rating__star {
        display: inline-flex;
        padding: 1px;
        border: 0;
        background: transparent;
        cursor: pointer;
        color: var(--t4);
        transition:
          color 0.12s ease,
          transform 0.1s ease;
      }
      .strct-rating__star:hover:not(:disabled):not(.strct-rating__star--readonly) {
        transform: scale(1.12);
      }
      .strct-rating__star--on {
        color: var(--warning);
      }
      .strct-rating__star:disabled,
      .strct-rating__star--readonly {
        cursor: default;
      }
    `,
  ],
})
export class StrctRating implements ControlValueAccessor {
  /** Maximum allowed value or top of the value axis. */
  readonly max = input(5);
  /** Size variant. */
  readonly size = input(18);
  /** Prevent user interaction. Stars stay focusable so AT users can read the value. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Accessible name of the radiogroup. */
  readonly ariaLabel = input('Rating');
  /** Accessible label for each star button; receives the star index (1-based) and max. */
  readonly starAriaLabel = input<(star: number, max: number) => string>(
    (star, max) => `${star} of ${max}`,
  );

  readonly value = signal(0);
  readonly hover = signal(0);
  readonly isDisabled = signal(false);
  private readonly starButtons = viewChildren('starBtn', { read: ElementRef });

  protected stars(): number[] {
    return Array.from({ length: this.max() }, (_, i) => i + 1);
  }

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  pick(star: number): void {
    if (this.readonly() || this.isDisabled()) return;
    const next = this.value() === star ? 0 : star; // click the current star to clear
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }

  /** Arrow keys / Home / End move focus between stars (radiogroup pattern). */
  protected onKeydown(event: KeyboardEvent): void {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    const home = event.key === 'Home';
    const end = event.key === 'End';
    if (!forward && !backward && !home && !end) return;
    event.preventDefault();

    const btns = this.starButtons().filter((b) => !(b.nativeElement as HTMLButtonElement).disabled);
    if (!btns.length) return;
    const current = btns.findIndex((b) => b.nativeElement === event.target);

    let next: number;
    if (home) next = 0;
    else if (end) next = btns.length - 1;
    else if (forward) next = current < 0 ? 0 : (current + 1) % btns.length;
    else next = current < 0 ? btns.length - 1 : (current - 1 + btns.length) % btns.length;

    (btns[next].nativeElement as HTMLButtonElement).focus();
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
