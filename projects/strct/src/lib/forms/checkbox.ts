import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  contentChild,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';
import { StrctControlDescription } from './description';

let checkboxCounter = 0;

/** Checkbox with custom box. Works with `[(ngModel)]` / reactive forms. */
@Component({
  selector: 'strct-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StrctIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctCheckbox), multi: true },
  ],
  template: `
    <label
      class="strct-cb"
      [class.strct-cb--disabled]="isDisabled()"
      [class.strct-cb--described]="described()"
    >
      <input
        type="checkbox"
        class="strct-cb__native"
        [checked]="checked()"
        [disabled]="isDisabled()"
        [indeterminate]="indeterminate()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-labelledby]="labelledBy()"
        [attr.aria-describedby]="describedBy()"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <span class="strct-cb__box">
        <strct-icon name="check" [size]="11" [strokeWidth]="2" />
      </span>
      <span class="strct-cb__text">
        <!-- The projected slot is declared first so its selector wins over the
             catch-all below; CSS order puts it under the label. -->
        @if (projected()) {
          <span class="strct-cb__desc strct-cb__desc--projected" [id]="projDescId">
            <ng-content select="[strctControlDescription]" />
          </span>
        }
        <span class="strct-cb__label" [id]="labelId"><ng-content /></span>
        @if (description()) {
          <span class="strct-cb__desc" [id]="descId">{{ description() }}</span>
        }
      </span>
    </label>
  `,
  styles: [
    `
      .strct-cb {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
        user-select: none;
      }
      .strct-cb--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .strct-cb__native {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      .strct-cb__box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 17px;
        height: 17px;
        border-radius: 4px;
        flex-shrink: 0;
        background: var(--bg-2);
        border: 1px solid var(--b3);
        color: transparent;
        transition:
          background 0.14s ease,
          border-color 0.14s ease;
      }
      .strct-cb__native:checked + .strct-cb__box {
        background: var(--acc);
        border-color: transparent;
        color: var(--inv);
      }
      .strct-cb__native:indeterminate + .strct-cb__box {
        background: var(--acc);
        border-color: transparent;
      }
      .strct-cb__native:indeterminate + .strct-cb__box strct-icon {
        visibility: hidden;
      }
      .strct-cb__native:indeterminate + .strct-cb__box::after {
        content: '';
        width: 9px;
        height: 2px;
        border-radius: 1px;
        background: var(--inv);
      }
      .strct-cb__native:focus-visible + .strct-cb__box {
        box-shadow: 0 0 0 3px var(--acc18);
      }
      /* An option whose consequence needs a sentence carries it here, inside
         the label — so clicking the sentence still toggles the option. */
      .strct-cb__text {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }
      .strct-cb__desc {
        font-size: var(--text-sm);
        line-height: 1.4;
        color: var(--t3);
      }
      .strct-cb__desc--projected {
        order: 1;
      }
      /* With a description the box aligns with the label's first line. */
      .strct-cb--described {
        align-items: flex-start;
      }
      .strct-cb--described .strct-cb__box {
        margin-block-start: 1px;
      }
    `,
  ],
})
export class StrctCheckbox implements ControlValueAccessor {
  readonly checked = model(false);
  /** Disabled state pushed by the forms API (setDisabledState). */
  private readonly cvaDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Tri-state visual indicator for a parent / intermediate state. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Accessible label for the checkbox (used when no text label is present). */
  readonly ariaLabel = input<string | null>(null);
  /**
   * A sentence under the label explaining the option's consequence. It renders
   * inside the component's own `<label>` — so clicking it still toggles the
   * option — and is linked with `aria-describedby` rather than becoming part of
   * the name. `[strctControlDescription]` projects one with markup in it.
   */
  readonly description = input('');

  private readonly n = ++checkboxCounter;
  protected readonly descId = `strct-cb-desc-${this.n}`;
  protected readonly labelId = `strct-cb-label-${this.n}`;
  protected readonly projDescId = `strct-cb-pdesc-${this.n}`;
  protected readonly projected = contentChild(StrctControlDescription);
  protected readonly described = computed(() => !!this.description() || !!this.projected());
  protected readonly describedBy = computed(() =>
    this.description() ? this.descId : this.projected() ? this.projDescId : null,
  );
  /**
   * The description sits inside the `<label>` so clicking it still toggles the
   * option — which would otherwise make it part of the name as well as the
   * description. Naming the label span keeps the name to the label alone.
   */
  protected readonly labelledBy = computed(() =>
    this.described() && !this.ariaLabel() ? this.labelId : null,
  );

  private onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  onToggle(event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.checked.set(value);
    this.onChange(value);
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
