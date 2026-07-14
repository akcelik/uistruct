import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';
import { StrctOverlay } from '../overlay/overlay';

interface DayCell {
  day: number;
  iso: string;
  inMonth: boolean;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * Calendar date picker. Value is an ISO `yyyy-mm-dd` string. CVA-compatible.
 *   <strct-datepicker [(ngModel)]="date" />
 */
@Component({
  selector: 'strct-datepicker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctOverlay],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctDatepicker), multi: true },
  ],
  template: `
    <div #field class="strct-dp__field">
      <input
        type="text"
        class="strct-control strct-dp__input"
        readonly
        [value]="displayLabel()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        (click)="toggle()"
        (keydown)="onKeydown($event)"
      />
      <button
        type="button"
        class="strct-dp__icon"
        aria-label="Open calendar"
        [disabled]="isDisabled()"
        (click)="toggle()"
      >
        <strct-icon name="calendar" [size]="16" />
      </button>
    </div>

    @if (open()) {
      <div
        class="strct-dp__panel"
        role="dialog"
        [strctOverlay]="field"
        strctOverlayPlacement="bottom-start"
      >
        <div class="strct-dp__head">
          <button
            type="button"
            class="strct-dp__nav"
            aria-label="Previous month"
            (click)="shiftMonth(-1)"
          >
            <strct-icon name="chevronLeft" [size]="14" [strokeWidth]="1.7" />
          </button>
          <span class="strct-dp__title">{{ monthLabel() }}</span>
          <button
            type="button"
            class="strct-dp__nav"
            aria-label="Next month"
            (click)="shiftMonth(1)"
          >
            <strct-icon name="chevronRight" [size]="14" [strokeWidth]="1.7" />
          </button>
        </div>
        <div class="strct-dp__dow">
          @for (d of dow; track d) {
            <span>{{ d }}</span>
          }
        </div>
        <div class="strct-dp__grid">
          @for (cell of cells(); track cell.iso) {
            <button
              type="button"
              class="strct-dp__day"
              [class.strct-dp__day--muted]="!cell.inMonth"
              [class.strct-dp__day--today]="cell.iso === today"
              [class.strct-dp__day--focused]="cell.iso === focusedIso()"
              [class.strct-dp__day--selected]="cell.iso === value()"
              (click)="pick(cell.iso)"
            >
              {{ cell.day }}
            </button>
          }
        </div>
      </div>
    }
  `,
  host: { class: 'strct-dp' },
  styles: [
    `
      .strct-dp {
        position: relative;
        display: inline-block;
        width: 100%;
        max-width: 240px;
      }
      .strct-dp__field {
        position: relative;
      }
      .strct-dp__input {
        padding-inline-end: 36px;
        cursor: pointer;
      }
      .strct-dp__icon {
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        padding: 5px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t2);
        cursor: pointer;
      }
      .strct-dp__icon:hover {
        color: var(--acc);
        background: var(--bg-3);
      }
      .strct-dp__panel {
        position: absolute;
        top: calc(100% + 5px);
        left: 0;
        z-index: 250;
        width: 250px;
        padding: 10px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 9px;
        box-shadow: var(--shh);
      }
      .strct-dp__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .strct-dp__title {
        font-size: 13px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-dp__nav {
        display: inline-flex;
        padding: 5px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t2);
        cursor: pointer;
      }
      .strct-dp__nav:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-dp__dow {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        margin-bottom: 4px;
      }
      .strct-dp__dow span {
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--t3);
        padding: 4px 0;
      }
      .strct-dp__grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }
      .strct-dp__day {
        aspect-ratio: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 6px;
        background: transparent;
        cursor: pointer;
        font-family: var(--font);
        font-size: 12px;
        color: var(--t1);
      }
      .strct-dp__day:hover {
        background: var(--bg-3);
      }
      .strct-dp__day--muted {
        color: var(--t3);
      }
      .strct-dp__day--today {
        box-shadow: inset 0 0 0 1px var(--acc30);
      }
      .strct-dp__day--focused {
        box-shadow: inset 0 0 0 2px var(--acc);
      }
      .strct-dp__day--selected {
        background: var(--acc);
        color: var(--inv);
      }
      .strct-dp__day--selected:hover {
        background: var(--acc);
      }
    `,
  ],
})
export class StrctDatepicker implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Placeholder text when empty. */
  readonly placeholder = input('Select a date');
  protected readonly dow = DOW;

  readonly value = signal('');
  readonly open = signal(false);
  readonly isDisabled = signal(false);
  /** Keyboard cursor within the open calendar. */
  readonly focusedIso = signal('');
  private readonly view = signal(this.startOfMonth(new Date()));

  protected get today(): string {
    const d = new Date();
    return toIso(d.getFullYear(), d.getMonth(), d.getDate());
  }

  protected readonly monthLabel = computed(() => {
    const v = this.view();
    return `${MONTHS[v.m]} ${v.y}`;
  });

  protected readonly displayLabel = computed(() => {
    const iso = this.value();
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
  });

  protected readonly cells = computed<DayCell[]>(() => {
    const { y, m } = this.view();
    const firstDow = new Date(y, m, 1).getDay();
    const start = new Date(y, m, 1 - firstDow);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return {
        day: d.getDate(),
        iso: toIso(d.getFullYear(), d.getMonth(), d.getDate()),
        inMonth: d.getMonth() === m,
      };
    });
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.isDisabled()) return;
    const next = !this.open();
    this.open.set(next);
    if (next) this.syncFocus();
  }

  shiftMonth(delta: number): void {
    const { y, m } = this.view();
    this.view.set(this.startOfMonth(new Date(y, m + delta, 1)));
  }

  pick(iso: string): void {
    this.value.set(iso);
    this.focusedIso.set(iso);
    const [y, m] = iso.split('-').map(Number);
    this.view.set({ y, m: m - 1 });
    this.open.set(false);
    this.onChange(iso);
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (!this.open()) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.toggle();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.shiftFocus(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.shiftFocus(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.shiftFocus(-7);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.shiftFocus(7);
        break;
      case 'PageUp':
        event.preventDefault();
        this.shiftFocus(0, -1);
        break;
      case 'PageDown':
        event.preventDefault();
        this.shiftFocus(0, 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.focusedIso()) this.pick(this.focusedIso());
        break;
      case 'Escape':
        event.preventDefault();
        this.open.set(false);
        break;
    }
  }

  private syncFocus(): void {
    const base = this.value() || this.today;
    this.focusedIso.set(base);
    const [y, m] = base.split('-').map(Number);
    this.view.set({ y, m: m - 1 });
  }

  private shiftFocus(days: number, months = 0): void {
    const [y, m, d] = (this.focusedIso() || this.today).split('-').map(Number);
    const next = new Date(y, m - 1 + months, d + days);
    this.focusedIso.set(toIso(next.getFullYear(), next.getMonth(), next.getDate()));
    this.view.set({ y: next.getFullYear(), m: next.getMonth() });
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }

  private startOfMonth(date: Date): { y: number; m: number } {
    return { y: date.getFullYear(), m: date.getMonth() };
  }

  writeValue(value: string): void {
    this.value.set(value || '');
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (y && m) this.view.set({ y, m: m - 1 });
    }
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
