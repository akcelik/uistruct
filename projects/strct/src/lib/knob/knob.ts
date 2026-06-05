import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  ElementRef,
  HostListener,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Knob accent color variants. */
export type StrctKnobStatus = 'accent' | 'success' | 'warning' | 'critical';

const COLOR: Record<StrctKnobStatus, string> = {
  accent: 'var(--acc)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  critical: 'var(--critical)',
};

/**
 * Rotary dial input. Drag (up/down), arrow keys, Home/End or the wheel change
 * the value. CVA-compatible.
 *   <strct-knob [min]="0" [max]="100" [(ngModel)]="fanSpeed" label="Fan" />
 */
@Component({
  selector: 'strct-knob',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctKnob), multi: true },
  ],
  template: `
    <div
      class="strct-knob"
      [style.width.px]="size()"
      [style.height.px]="size()"
      role="slider"
      tabindex="0"
      [attr.aria-valuemin]="min()"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="value()"
      [attr.aria-disabled]="isDisabled() || null"
      (pointerdown)="onPointerDown($event)"
    >
      <svg [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
        <g [attr.transform]="'rotate(135 ' + half() + ' ' + half() + ')'">
          <circle
            class="strct-knob__track"
            [attr.cx]="half()"
            [attr.cy]="half()"
            [attr.r]="radius()"
            fill="none"
            [attr.stroke-width]="thickness()"
            stroke-linecap="round"
            [attr.stroke-dasharray]="trackDash()"
          />
          <circle
            class="strct-knob__value"
            [attr.cx]="half()"
            [attr.cy]="half()"
            [attr.r]="radius()"
            fill="none"
            [attr.stroke]="color()"
            [attr.stroke-width]="thickness()"
            stroke-linecap="round"
            [attr.stroke-dasharray]="valueDash()"
          />
        </g>
        <g [attr.transform]="'rotate(' + pointerAngle() + ' ' + half() + ' ' + half() + ')'">
          <line
            class="strct-knob__pointer"
            [attr.x1]="half()"
            [attr.y1]="half()"
            [attr.x2]="half()"
            [attr.y2]="thickness() + 3"
            [attr.stroke]="color()"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </g>
      </svg>
      <div class="strct-knob__center">
        <div class="strct-knob__num">{{ value() }}</div>
        @if (label()) {
          <div class="strct-knob__label">{{ label() }}</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .strct-knob {
        position: relative;
        display: inline-flex;
        cursor: ns-resize;
        user-select: none;
        touch-action: none;
        outline: none;
      }
      .strct-knob:focus-visible {
        border-radius: 50%;
        box-shadow: 0 0 0 3px var(--acc18);
      }
      .strct-knob[aria-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .strct-knob__track {
        stroke: var(--bg-3);
      }
      .strct-knob__value {
        transition: stroke-dasharray 0.05s linear;
      }
      .strct-knob__center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .strct-knob__num {
        font-size: 18px;
        font-weight: 600;
        color: var(--t1);
        line-height: 1;
      }
      .strct-knob__label {
        font-size: 11px;
        color: var(--t2);
        margin-top: 3px;
      }
    `,
  ],
})
export class StrctKnob implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Minimum allowed value. */
  readonly min = input(0);
  /** Maximum allowed value or top of the value axis. */
  readonly max = input(100);
  /** Step increment. */
  readonly step = input(1);
  /** Size variant. */
  readonly size = input(96);
  /** Stroke thickness in pixels. */
  readonly thickness = input(9);
  /** Visual status color. */
  readonly status = input<StrctKnobStatus>('accent');
  /** Label text. */
  readonly label = input('');

  readonly value = signal(0);
  readonly isDisabled = signal(false);

  protected readonly half = computed(() => this.size() / 2);
  protected readonly radius = computed(() => (this.size() - this.thickness()) / 2 - 2);
  protected readonly color = computed(() => COLOR[this.status()]);

  private readonly fraction = computed(() => {
    const span = this.max() - this.min();
    return span <= 0 ? 0 : (this.value() - this.min()) / span;
  });
  private readonly circumference = computed(() => 2 * Math.PI * this.radius());

  protected readonly trackDash = computed(() => {
    const c = this.circumference();
    return `${0.75 * c} ${c}`;
  });
  protected readonly valueDash = computed(() => {
    const c = this.circumference();
    return `${this.fraction() * 0.75 * c} ${c}`;
  });
  /** Pointer rotation: -135° (start, lower-left) to +135° (end, lower-right). */
  protected readonly pointerAngle = computed(() => -135 + this.fraction() * 270);

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  private dragStartY = 0;
  private dragStartValue = 0;
  private readonly onMove = (e: PointerEvent) => {
    const span = this.max() - this.min();
    const delta = (this.dragStartY - e.clientY) / 150; // 150px ≈ full range
    this.setValue(this.dragStartValue + delta * span);
  };
  private readonly onUp = () => {
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    this.onTouched();
  };

  protected onPointerDown(event: PointerEvent): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    (this.elementRef.nativeElement.firstElementChild as HTMLElement)?.focus?.();
    this.dragStartY = event.clientY;
    this.dragStartValue = this.value();
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
  }

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const s = this.step();
    let handled = true;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        this.setValue(this.value() + s);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        this.setValue(this.value() - s);
        break;
      case 'Home':
        this.setValue(this.min());
        break;
      case 'End':
        this.setValue(this.max());
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      this.onTouched();
    }
  }

  @HostListener('wheel', ['$event'])
  protected onWheel(event: WheelEvent): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    this.setValue(this.value() + (event.deltaY < 0 ? this.step() : -this.step()));
    this.onTouched();
  }

  private setValue(raw: number): void {
    const step = this.step();
    const snapped = Math.round(raw / step) * step;
    const clamped = Math.max(this.min(), Math.min(this.max(), snapped));
    if (clamped !== this.value()) {
      this.value.set(clamped);
      this.onChange(clamped);
    }
  }

  writeValue(value: number): void {
    this.value.set(Math.max(this.min(), Math.min(this.max(), Number(value) || 0)));
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
