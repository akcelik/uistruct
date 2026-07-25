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
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  STRCT_DP_DOW,
  STRCT_DP_DOW_FULL,
  STRCT_DP_MONTHS,
  StrctDatepicker,
  strctDpPad,
} from '../datepicker/datepicker';

/**
 * Date + time in one control — a thin composition over the existing
 * `<strct-datepicker>` (calendar, keyboard grid, focus lifecycle and Escape
 * handling included) plus hour/minute selects, sharing one `.strct-control`
 * field skin. The value is an ISO local datetime string `YYYY-MM-DDTHH:mm`;
 * CVA-compatible.
 *
 *   <strct-datetime-picker [(ngModel)]="stamp" [minuteStep]="15" />
 *
 * The calendar localization inputs (`monthNames`, `weekdayNames`,
 * `weekdayNamesFull`, `weekStart`, `prevMonthLabel`, `nextMonthLabel`) are
 * passed straight through to the embedded datepicker. Picking a time before a
 * date keeps the value empty until a date is picked.
 */
@Component({
  selector: 'strct-datetime-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctDatepicker, FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctDatetimePicker), multi: true },
  ],
  template: `
    <div class="strct-control strct-dtp__field" [class.strct-dtp__field--disabled]="isDisabled()">
      <strct-datepicker
        class="strct-dtp__date"
        [(ngModel)]="date"
        (ngModelChange)="onDatePicked()"
        [placeholder]="placeholder()"
        [monthNames]="monthNames()"
        [weekdayNames]="weekdayNames()"
        [weekdayNamesFull]="weekdayNamesFull()"
        [weekStart]="weekStart()"
        [prevMonthLabel]="prevMonthLabel()"
        [nextMonthLabel]="nextMonthLabel()"
        [disabled]="isDisabled()"
      />
      <select
        class="strct-dtp__time"
        [attr.aria-label]="hourLabel()"
        [disabled]="isDisabled()"
        (change)="onHourChange($event)"
      >
        @for (h of hours; track h) {
          <option [value]="h" [selected]="h === hour()">{{ h }}</option>
        }
      </select>
      <span class="strct-dtp__colon" aria-hidden="true">:</span>
      <select
        class="strct-dtp__time"
        [attr.aria-label]="minuteLabel()"
        [disabled]="isDisabled()"
        (change)="onMinuteChange($event)"
      >
        @for (m of minutes(); track m) {
          <option [value]="m" [selected]="m === minute()">{{ m }}</option>
        }
      </select>
    </div>
  `,
  host: { class: 'strct-dtp' },
  styles: [
    `
      .strct-dtp {
        display: block;
        width: 100%;
      }
      /* One shared control skin around the date input and the time selects —
         the inner datepicker input goes chromeless (combobox multi idiom). */
      .strct-dtp__field.strct-control {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px 2px 2px;
      }
      .strct-dtp__field:focus-within {
        outline: none;
        border-color: var(--acc50);
        box-shadow: 0 0 0 3px var(--acc18);
        background: var(--bg-1);
      }
      .strct-dtp__field--disabled {
        opacity: var(--disabled-opacity);
        background: var(--bg-3);
      }
      .strct-dtp__date {
        flex: 1;
        min-width: 0;
      }
      .strct-dtp .strct-dp__input,
      .strct-dtp .strct-dp__input:focus,
      .strct-dtp .strct-dp__input:focus-visible {
        padding-block: 6px;
        border-color: transparent;
        background: transparent;
        box-shadow: none;
      }
      .strct-dtp .strct-dp__input:disabled {
        opacity: 1;
        background: transparent;
      }
      .strct-dtp__time {
        flex: none;
        padding: 4px 6px;
        font-family: var(--font);
        font-size: 13px;
        color: var(--t1);
        background: transparent;
        border: 1px solid var(--b2);
        border-radius: var(--radius-sm);
        cursor: pointer;
      }
      .strct-dtp__time:hover {
        border-color: var(--b3);
      }
      .strct-dtp__time:focus-visible {
        outline: none;
        border-color: var(--acc50);
      }
      .strct-dtp__time:disabled {
        cursor: not-allowed;
      }
      .strct-dtp__colon {
        flex: none;
        color: var(--t3);
      }
    `,
  ],
})
export class StrctDatetimePicker implements ControlValueAccessor {
  /** Placeholder text of the date input when empty (localizable). */
  readonly placeholder = input('Select a date');
  /** Minute granularity of the minute select (1 = every minute). */
  readonly minuteStep = input(1);
  /** Calendar localization — passed straight through to the embedded datepicker. */
  readonly monthNames = input(STRCT_DP_MONTHS);
  readonly weekdayNames = input(STRCT_DP_DOW);
  readonly weekdayNamesFull = input(STRCT_DP_DOW_FULL);
  /** First day of the week: 0 = Sunday, 1 = Monday, … 6 = Saturday. */
  readonly weekStart = input(0);
  readonly prevMonthLabel = input('Previous month');
  readonly nextMonthLabel = input('Next month');
  /** Accessible labels of the time selects (localizable). */
  readonly hourLabel = input('Hour');
  readonly minuteLabel = input('Minute');
  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** The composed ISO value (`YYYY-MM-DDTHH:mm`, '' when no date is picked). */
  readonly value = signal('');
  /** Date part, two-way bound into the embedded datepicker. */
  readonly date = signal('');
  /** Time parts (zero-padded). */
  readonly hour = signal('00');
  readonly minute = signal('00');
  /** Disabled state pushed by the forms API (setDisabledState). */
  private readonly cvaDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly hours = Array.from({ length: 24 }, (_, h) => strctDpPad(h));

  /** Minute options at `minuteStep` granularity; an off-step written-in value stays selectable. */
  protected readonly minutes = computed(() => {
    const step = Math.max(1, Math.min(60, Math.trunc(this.minuteStep())));
    const out: string[] = [];
    for (let m = 0; m < 60; m += step) out.push(strctDpPad(m));
    const cur = this.minute();
    if (!out.includes(cur)) out.push(cur);
    return out.sort();
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** A user pick in the embedded calendar (ngModelChange is view→model only). */
  protected onDatePicked(): void {
    this.commit();
  }

  protected onHourChange(event: Event): void {
    this.hour.set((event.target as HTMLSelectElement).value);
    this.commit();
  }

  protected onMinuteChange(event: Event): void {
    this.minute.set((event.target as HTMLSelectElement).value);
    this.commit();
  }

  /** Compose date + time into the ISO value and report it through the CVA. */
  private commit(): void {
    const d = this.date();
    const v = d ? `${d}T${this.hour()}:${this.minute()}` : '';
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
  }

  writeValue(value: string | null): void {
    const v = value ?? '';
    this.value.set(v);
    const [d, t] = v.split('T');
    this.date.set(d ?? '');
    const [h, m] = (t ?? '').split(':');
    if (/^\d{1,2}$/.test(h)) this.hour.set(strctDpPad(+h));
    if (/^\d{1,2}$/.test(m)) this.minute.set(strctDpPad(+m));
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
