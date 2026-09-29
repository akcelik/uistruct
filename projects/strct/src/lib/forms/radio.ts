import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon, StrctIconName } from '../icon/icon';
import { StrctControlDescription } from './description';

let groupCounter = 0;
let radioCounter = 0;

/**
 * Radio group (the form control). Wrap `<strct-radio>` items:
 *   <strct-radio-group [(ngModel)]="size">
 *     <strct-radio [value]="'sm'">Small</strct-radio>
 *     <strct-radio [value]="'lg'">Large</strct-radio>
 *   </strct-radio-group>
 */
@Component({
  selector: 'strct-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctRadioGroup), multi: true },
  ],
  template: `<ng-content />`,
  host: {
    class: 'strct-radio-group',
    role: 'radiogroup',
    '[class.strct-radio-group--card]': "variant() === 'card'",
  },
  styles: [
    `
      .strct-radio-group {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      /* Cards lay themselves out: as many 220px columns as fit, then stack. */
      .strct-radio-group--card {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(min(var(--strct-radio-card-min, 220px), 100%), 1fr)
        );
        gap: var(--space-2);
      }
    `,
  ],
})
export class StrctRadioGroup implements ControlValueAccessor {
  /**
   * `'card'` renders each option as a tile with room for an icon and a
   * sentence — a choice between a few kinds of thing, each needing an
   * explanation. It stays a native radio group: one tab stop, arrow keys.
   */
  readonly variant = input<'default' | 'card'>('default');
  readonly name = `strct-radio-${++groupCounter}`;
  readonly value = signal<unknown>(null);
  readonly isDisabled = signal(false);

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  select(value: unknown): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
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

/** One option inside a `<strct-radio-group>`. */
@Component({
  selector: 'strct-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StrctIcon],
  template: `
    <label
      class="strct-rb"
      [class.strct-rb--disabled]="disabled() || group.isDisabled()"
      [class.strct-rb--card]="card()"
      [class.strct-rb--described]="described()"
      [class.strct-rb--checked]="group.value() === value()"
    >
      <input
        type="radio"
        class="strct-rb__native"
        [name]="group.name"
        [checked]="group.value() === value()"
        [disabled]="disabled() || group.isDisabled()"
        [attr.aria-labelledby]="labelledBy()"
        [attr.aria-describedby]="describedBy()"
        (change)="group.select(value())"
      />
      <span class="strct-rb__dot"></span>
      <span class="strct-rb__text">
        @if (projected()) {
          <span class="strct-rb__desc strct-rb__desc--projected" [id]="projDescId">
            <ng-content select="[strctControlDescription]" />
          </span>
        }
        <span class="strct-rb__label" [id]="labelId">
          @if (card() && icon()) {
            <strct-icon class="strct-rb__icon" [name]="icon()" [size]="15" />
          }
          <ng-content />
        </span>
        @if (description()) {
          <span class="strct-rb__desc" [id]="descId">{{ description() }}</span>
        }
      </span>
    </label>
  `,
  styles: [
    `
      .strct-rb {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
        user-select: none;
      }
      .strct-rb--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .strct-rb__native {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      .strct-rb__dot {
        position: relative;
        width: 17px;
        height: 17px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--bg-2);
        border: 1px solid var(--b3);
        transition: border-color 0.14s ease;
      }
      .strct-rb__dot::after {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--acc);
        transform: scale(0);
        transition: transform 0.14s ease;
      }
      .strct-rb__native:checked + .strct-rb__dot {
        border-color: var(--acc);
      }
      .strct-rb__native:checked + .strct-rb__dot::after {
        transform: scale(1);
      }
      .strct-rb__native:focus-visible + .strct-rb__dot {
        box-shadow: 0 0 0 3px var(--acc18);
      }
      .strct-rb__text {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }
      .strct-rb__label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .strct-rb__desc {
        font-size: var(--text-sm);
        line-height: 1.4;
        color: var(--t3);
      }
      .strct-rb__desc--projected {
        order: 1;
      }
      .strct-rb--described {
        align-items: flex-start;
      }
      .strct-rb--described .strct-rb__dot {
        margin-block-start: 1px;
      }
      /* ── Card variant ─────────────────────────────────────────────────────
         The tile is the option: a card look over radio semantics, with the
         native control still at its start rather than replaced by the tile. */
      .strct-rb--card {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        height: 100%;
        box-sizing: border-box;
        transition:
          border-color 0.14s ease,
          background 0.14s ease;
      }
      .strct-rb--card:hover:not(.strct-rb--disabled) {
        border-color: var(--b3);
      }
      .strct-rb--card.strct-rb--checked {
        border-color: var(--acc);
        background: var(--acc-s);
      }
      .strct-rb--card .strct-rb__label {
        font-weight: 600;
      }
      .strct-rb__icon {
        color: var(--acc);
        flex: none;
      }
    `,
  ],
})
export class StrctRadio {
  /** Current value. */
  readonly value = input.required<unknown>();
  /** Static disable flag. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * A sentence under the label. It renders inside the component's own
   * `<label>` and is linked with `aria-describedby`;
   * `[strctControlDescription]` projects one with markup in it.
   */
  readonly description = input('');
  /** Leading icon — card variant only. */
  readonly icon = input<StrctIconName | ''>('');

  protected readonly group = inject(StrctRadioGroup);
  protected readonly card = computed(() => this.group.variant() === 'card');

  private readonly n = ++radioCounter;
  protected readonly descId = `strct-rb-desc-${this.n}`;
  protected readonly labelId = `strct-rb-label-${this.n}`;
  protected readonly projDescId = `strct-rb-pdesc-${this.n}`;
  protected readonly projected = contentChild(StrctControlDescription);
  protected readonly described = computed(() => !!this.description() || !!this.projected());
  protected readonly describedBy = computed(() =>
    this.description() ? this.descId : this.projected() ? this.projDescId : null,
  );
  /** Keeps the name to the label when the description shares its `<label>`. */
  protected readonly labelledBy = computed(() => (this.described() ? this.labelId : null));
}
