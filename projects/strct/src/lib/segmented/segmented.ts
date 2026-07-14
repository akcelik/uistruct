import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';

/** One segment of a `StrctSegmented`. */
export interface StrctSegmentedOption {
  value: unknown;
  label: string;
  /** Optional leading icon name (StrctIcon set). */
  icon?: string;
  /** Disable just this segment. */
  disabled?: boolean;
}

/** Segment size. */
export type StrctSegmentedSize = 'sm' | 'md';

/**
 * One-of-N selection rendered as a joined segmented control with managed
 * selected state — distinct from `StrctTabs` (panel switching) and
 * `StrctButtonGroup` (a visual cluster only). For mode pickers and list filters.
 * CVA-compatible, so `formControlName` and `[(ngModel)]` both work.
 *
 *   <strct-segmented
 *     [options]="[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }]"
 *     [(ngModel)]="filter" size="sm" />
 */
@Component({
  selector: 'strct-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctSegmented), multi: true },
  ],
  template: `
    @for (opt of options(); track opt.value; let i = $index) {
      <button
        #seg
        type="button"
        role="radio"
        class="strct-seg__opt"
        [class.strct-seg__opt--selected]="isSelected(opt)"
        [attr.aria-checked]="isSelected(opt)"
        [attr.tabindex]="rovingIndex(opt, i)"
        [disabled]="opt.disabled || isDisabled()"
        (click)="select(opt)"
        (blur)="onTouched()"
      >
        @if (opt.icon) {
          <strct-icon [name]="opt.icon" [size]="16" />
        }
        <span>{{ opt.label }}</span>
      </button>
    }
  `,
  host: {
    class: 'strct-seg',
    role: 'radiogroup',
    '[class.strct-seg--sm]': "size() === 'sm'",
    '[class.strct-seg--block]': 'block()',
    '[class.strct-seg--disabled]': 'isDisabled()',
    '(keydown)': 'onKeydown($event)',
  },
  styles: [
    `
      .strct-seg {
        display: inline-flex;
        gap: 2px;
        padding: 2px;
        background: var(--bg-2);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        max-width: 100%;
      }
      .strct-seg--block {
        display: flex;
        width: 100%;
      }
      .strct-seg__opt {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-1);
        flex: 1 1 auto;
        padding: 6px 14px;
        border: 0;
        border-radius: calc(var(--radius-md) - 2px);
        background: transparent;
        color: var(--t2);
        font-family: var(--font);
        font-size: 13px;
        font-weight: 500;
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
        transition:
          background 0.14s ease,
          color 0.14s ease;
      }
      .strct-seg--sm .strct-seg__opt {
        padding: 4px 10px;
        font-size: 12px;
      }
      .strct-seg__opt:hover:not(:disabled):not(.strct-seg__opt--selected) {
        color: var(--t1);
      }
      .strct-seg__opt--selected {
        background: var(--bg-a);
        color: var(--t1);
        font-weight: 600;
        box-shadow: var(--sh);
      }
      .strct-seg__opt:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--acc50);
      }
      .strct-seg__opt:disabled {
        opacity: var(--disabled-opacity);
        cursor: not-allowed;
      }
      .strct-seg--disabled {
        opacity: var(--disabled-opacity);
      }
      .strct-seg--disabled .strct-seg__opt {
        cursor: not-allowed;
      }
    `,
  ],
})
export class StrctSegmented implements ControlValueAccessor {
  /** The selectable segments. */
  readonly options = input<StrctSegmentedOption[]>([]);
  /** Segment size. */
  readonly size = input<StrctSegmentedSize>('md');
  /** Stretch to the full width of the container. */
  readonly block = input(false, { transform: booleanAttribute });
  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly value = signal<unknown>(null);
  readonly isDisabled = signal(false);
  private readonly segs = viewChildren('seg', { read: ElementRef });

  private onChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    effect(() => this.isDisabled.set(this.disabled()));
  }

  protected isSelected(opt: StrctSegmentedOption): boolean {
    return this.value() === opt.value;
  }

  /** Index of the currently selected (or first enabled) option for roving focus. */
  private readonly activeIndex = computed(() => {
    const opts = this.options();
    const selected = opts.findIndex((o) => o.value === this.value());
    if (selected >= 0) return selected;
    const firstEnabled = opts.findIndex((o) => !o.disabled);
    return firstEnabled >= 0 ? firstEnabled : 0;
  });

  protected rovingIndex(opt: StrctSegmentedOption, i: number): number {
    if (opt.disabled || this.isDisabled()) return -1;
    return i === this.activeIndex() ? 0 : -1;
  }

  protected select(opt: StrctSegmentedOption): void {
    if (opt.disabled || this.isDisabled() || opt.value === this.value()) return;
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    const home = event.key === 'Home';
    const end = event.key === 'End';
    if (!forward && !backward && !home && !end) return;
    event.preventDefault();

    const opts = this.options();
    const enabled = opts.map((o, i) => ({ o, i })).filter((x) => !x.o.disabled);
    if (!enabled.length) return;

    const current = this.activeIndex();
    let pos = enabled.findIndex((x) => x.i === current);
    if (pos < 0) pos = 0;

    let next: number;
    if (home) next = 0;
    else if (end) next = enabled.length - 1;
    else if (forward) next = (pos + 1) % enabled.length;
    else next = (pos - 1 + enabled.length) % enabled.length;

    const target = enabled[next];
    this.select(target.o);
    this.segs()[target.i]?.nativeElement.focus();
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
