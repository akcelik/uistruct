import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  contentChild,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctControlDescription } from './description';

let toggleCounter = 0;

/** On/off switch. Works with `[(ngModel)]` / reactive forms. */
@Component({
  selector: 'strct-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctToggle), multi: true },
  ],
  template: `
    <label
      class="strct-tg"
      [class.strct-tg--disabled]="isDisabled()"
      [class.strct-tg--described]="described()"
    >
      <input
        type="checkbox"
        class="strct-tg__native"
        role="switch"
        [checked]="checked()"
        [disabled]="isDisabled()"
        [attr.aria-labelledby]="labelledBy()"
        [attr.aria-describedby]="describedBy()"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <span class="strct-tg__track"><span class="strct-tg__thumb"></span></span>
      <span class="strct-tg__text">
        @if (projected()) {
          <span class="strct-tg__desc strct-tg__desc--projected" [id]="projDescId">
            <ng-content select="[strctControlDescription]" />
          </span>
        }
        <span class="strct-tg__label" [id]="labelId"><ng-content /></span>
        @if (description()) {
          <span class="strct-tg__desc" [id]="descId">{{ description() }}</span>
        }
      </span>
    </label>
  `,
  styles: [
    `
      .strct-tg {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
        user-select: none;
      }
      .strct-tg--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .strct-tg__native {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      .strct-tg__track {
        position: relative;
        width: 34px;
        height: 19px;
        border-radius: 11px;
        flex-shrink: 0;
        background: var(--bg-3);
        border: 1px solid var(--b3);
        transition:
          background 0.16s ease,
          border-color 0.16s ease;
      }
      .strct-tg__thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: var(--t2);
        transition:
          transform 0.16s ease,
          background 0.16s ease;
      }
      .strct-tg__native:checked + .strct-tg__track {
        background: var(--acc);
        border-color: transparent;
      }
      .strct-tg__native:checked + .strct-tg__track .strct-tg__thumb {
        transform: translateX(15px);
        background: var(--inv);
      }
      /* RTL: the thumb travels toward the inline-end, i.e. to the left.
         (:host-context because this component uses emulated encapsulation.) */
      :host-context([dir='rtl']) .strct-tg__native:checked + .strct-tg__track .strct-tg__thumb {
        transform: translateX(-15px);
      }
      .strct-tg__native:focus-visible + .strct-tg__track {
        box-shadow: 0 0 0 3px var(--acc18);
      }
      .strct-tg__text {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }
      .strct-tg__desc {
        font-size: var(--text-sm);
        line-height: 1.4;
        color: var(--t3);
      }
      .strct-tg__desc--projected {
        order: 1;
      }
      .strct-tg--described {
        align-items: flex-start;
      }
      .strct-tg--described .strct-tg__track {
        margin-block-start: 1px;
      }
    `,
  ],
})
export class StrctToggle implements ControlValueAccessor {
  readonly checked = signal(false);
  /** Disabled state pushed by the forms API (setDisabledState). */
  private readonly cvaDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * A sentence under the label explaining what turning this on does. It renders
   * inside the component's own `<label>` and is linked with `aria-describedby`;
   * `[strctControlDescription]` projects one with markup in it.
   */
  readonly description = input('');

  private readonly n = ++toggleCounter;
  protected readonly descId = `strct-tg-desc-${this.n}`;
  protected readonly labelId = `strct-tg-label-${this.n}`;
  protected readonly projDescId = `strct-tg-pdesc-${this.n}`;
  protected readonly projected = contentChild(StrctControlDescription);
  protected readonly described = computed(() => !!this.description() || !!this.projected());
  protected readonly describedBy = computed(() =>
    this.description() ? this.descId : this.projected() ? this.projDescId : null,
  );
  /** Keeps the name to the label when the description shares its `<label>`. */
  protected readonly labelledBy = computed(() => (this.described() ? this.labelId : null));

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
