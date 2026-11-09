import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { StrctControlSize, strctControlHeight, strctIconSize } from '../control-size';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';

/** One id per field on the page, so a hint belongs to the field that owns it. */
let capsSeq = 0;

const LEVEL_COLORS = [
  'var(--critical)',
  'var(--critical)',
  'var(--warning)',
  'var(--acc)',
  'var(--success)',
];

/**
 * Password input with a reveal toggle and an optional strength meter. CVA-compatible.
 *   <strct-password [(ngModel)]="pw" meter />
 */
@Component({
  selector: 'strct-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctPassword), multi: true },
  ],
  template: `
    <div class="strct-pw__field">
      <input
        class="strct-control strct-pw__input"
        [type]="revealed() ? 'text' : 'password'"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="isDisabled()"
        [attr.autocomplete]="autocomplete()"
        [attr.aria-describedby]="capsId"
        [attr.data-strct-described-by]="capsId"
        (input)="onInput($event)"
        (keydown)="onKey($event)"
        (keyup)="onKey($event)"
        (blur)="onTouched()"
      />
      <button
        type="button"
        class="strct-pw__toggle"
        [attr.aria-label]="revealed() ? hideLabel() : showLabel()"
        [disabled]="isDisabled()"
        (click)="revealed.set(!revealed())"
      >
        <strct-icon [name]="revealed() ? 'eyeOff' : 'eye'" [size]="16" />
      </button>
    </div>
    @if (capsOn()) {
      <p class="strct-pw__caps" [id]="capsId" role="status" aria-live="polite">
        <strct-icon name="lock" [size]="13" aria-hidden="true" />
        {{ capsLockText() }}
      </p>
    }
    @if (meter() && value()) {
      <div class="strct-pw__meter" role="status" aria-live="polite">
        <div class="strct-pw__bars">
          @for (i of [0, 1, 2, 3]; track i) {
            <span
              class="strct-pw__bar"
              [style.background]="i < score() ? level().color : 'var(--bg-3)'"
            ></span>
          }
        </div>
        <span class="strct-pw__label" [style.color]="level().color">{{ level().label }}</span>
      </div>
    }
  `,
  host: {
    class: 'strct-pw',
    '[style.--control-h]': 'controlHeight()',
    '[style.--icon-size]': 'controlIconSize()',
  },
  styles: [
    `
      .strct-pw__caps {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: var(--space-2) 0 0;
        font-size: var(--text-sm);
        color: var(--warning);
      }
      .strct-pw {
        display: block;
        width: 100%;
      }
      .strct-pw__field {
        position: relative;
      }
      .strct-pw__input {
        padding-inline-end: 38px;
      }
      .strct-pw__toggle {
        position: absolute;
        inset-inline-end: 4px;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        /* As tall as the field it sits in, so it is a target wherever the
           control height is set — a 26px eye inside a 44px field is not one
           on the tablet the sign-in page is opened from (FR-76-01). */
        min-width: var(--control-h, 36px);
        min-height: var(--control-h, 36px);
        padding: 5px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--t2);
        cursor: pointer;
      }
      .strct-pw__toggle:hover {
        color: var(--acc);
        background: var(--bg-3);
      }
      .strct-pw__meter {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-top: 7px;
      }
      .strct-pw__bars {
        display: flex;
        gap: 3px;
        flex: 1;
      }
      .strct-pw__bar {
        flex: 1;
        height: 3px;
        border-radius: var(--radius-xs);
        transition: background 0.2s ease;
      }
      .strct-pw__label {
        font-size: var(--text-sm);
        font-weight: 600;
        min-width: 42px;
        text-align: end;
      }
    `,
  ],
})
export class StrctPassword implements ControlValueAccessor {
  /**
   * Control size — the shared scale, so this lines up with the buttons and
   * fields beside it. Left unset it follows an enclosing [strctControlSize],
   * or the default height when there is none.
   */
  readonly size = input<StrctControlSize | undefined>(undefined);
  /** The height its size asks for; nothing while it states no size. */
  protected readonly controlHeight = computed(() => {
    const s = this.size();
    return s ? strctControlHeight(s) : null;
  });
  /** And the icon size that goes with it, for the icons it holds. */
  protected readonly controlIconSize = computed(() => {
    const s = this.size();
    return s ? strctIconSize(s) : null;
  });

  /** Placeholder text when empty. */
  readonly placeholder = input('');
  /** Show a strength meter. */
  readonly meter = input(false, { transform: booleanAttribute });
  /** Static disable flag. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Localized strength labels, weakest to strongest. */
  readonly strengthLabels = input(['Weak', 'Fair', 'Good', 'Strong']);
  /** aria-label of the reveal toggle when the password is hidden. */
  readonly showLabel = input('Show password');
  /** aria-label of the reveal toggle when the password is visible. */
  readonly hideLabel = input('Hide password');
  /** Autocomplete hint; the default lets password managers work. */
  readonly autocomplete = input('current-password');
  /**
   * What the field says while Caps Lock is on. Empty draws nothing, for a
   * consumer putting its own words somewhere else from `(capsLock)`.
   */
  readonly capsLockText = input('Caps Lock is on');
  /**
   * Caps Lock went on or off. Nothing is emitted before a key is typed into
   * the field: a browser cannot be asked for the state, only told it by a
   * key event (FR-76-02).
   */
  readonly capsLock = output<boolean>();

  readonly value = signal('');
  readonly revealed = signal(false);
  readonly isDisabled = signal(false);
  /** The hint's id is declared once and for all: a surrounding strct-field
   *  reads it when it links, which is before anyone has typed, and an id
   *  pointing at nothing is ignored until the hint is there to point at. */
  /** Whether the last key event said Caps Lock was on. */
  protected readonly caps = signal(false);
  protected readonly capsOn = computed(() => this.caps() && !!this.capsLockText());
  protected readonly capsId = `strct-pw-caps-${++capsSeq}`;

  /**
   * Read from the key events the field itself receives. `getModifierState` is
   * the only way to know, and only a real key event carries it — which is why
   * nothing is said until the operator has typed something.
   */
  protected onKey(event: KeyboardEvent): void {
    if (typeof event.getModifierState !== 'function') return;
    const on = event.getModifierState('CapsLock');
    if (on === this.caps()) return;
    this.caps.set(on);
    this.capsLock.emit(on);
  }

  protected readonly score = computed(() => {
    const v = this.value();
    if (!v) return 0;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  });
  protected readonly level = computed(() => {
    const s = this.score();
    const labels = this.strengthLabels();
    // Scores 0-1 share the weakest label; clamp so custom arrays of any size work.
    const idx = Math.max(0, Math.min(s - 1, labels.length - 1));
    return { label: labels[idx] ?? '', color: LEVEL_COLORS[s] };
  });

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(value: string): void {
    this.value.set(value || '');
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
