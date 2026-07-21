import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';

/**
 * Compact search pill — the pattern from the docs header: a leading search
 * icon, a label / input and an optional keyboard-hint chip. Two modes:
 *
 *  - **input** (default): a real search field. Two-way `value` (also
 *    CVA-compatible), `(search)` emits on Enter, Escape / the × clears.
 *
 *      <strct-searchbox [(value)]="q" (search)="run($event)" />
 *
 *  - **`trigger`**: a button that only announces activation — the classic
 *    "fake search that opens the command palette" header pattern:
 *
 *      <strct-searchbox trigger hint="⌘K" (activated)="palette.open.set(true)" />
 */
@Component({
  selector: 'strct-searchbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctSearchbox), multi: true },
  ],
  template: `
    @if (trigger()) {
      <button
        type="button"
        class="strct-sb strct-sb--trigger"
        [disabled]="isDisabled()"
        [attr.aria-label]="ariaLabel() || placeholder()"
        (click)="activated.emit()"
      >
        <strct-icon class="strct-sb__icon" name="search" [size]="14" [strokeWidth]="1.6" />
        <span class="strct-sb__label">{{ placeholder() }}</span>
        @if (hint()) {
          <kbd class="strct-sb__kbd">{{ hint() }}</kbd>
        }
      </button>
    } @else {
      <div class="strct-sb" [class.strct-sb--disabled]="isDisabled()">
        <strct-icon class="strct-sb__icon" name="search" [size]="14" [strokeWidth]="1.6" />
        <input
          #field
          class="strct-sb__input"
          type="text"
          role="searchbox"
          [attr.aria-label]="ariaLabel() || placeholder()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [value]="value()"
          (input)="onInput($event)"
          (keydown.enter)="search.emit(value())"
          (keydown.escape)="clear()"
          (focus)="focused.set(true)"
          (blur)="focused.set(false); onTouched()"
        />
        @if (clearable() && value()) {
          <button
            type="button"
            class="strct-sb__clear"
            [attr.aria-label]="clearLabel()"
            (click)="clear(); field.focus()"
          >
            <strct-icon name="close" [size]="11" [strokeWidth]="1.8" />
          </button>
        } @else if (hint() && !focused()) {
          <kbd class="strct-sb__kbd">{{ hint() }}</kbd>
        }
      </div>
    }
  `,
  host: { class: 'strct-sb-host' },
  styles: [
    `
      .strct-sb-host {
        display: inline-flex;
        max-width: 100%;
      }
      /* Reskin hooks (--strct-sb-*): custom properties inherit across
         encapsulation boundaries, so hosts (e.g. an app header) can retheme
         the pill without piercing internals. */
      .strct-sb {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-width: 0;
        padding: 5px 8px 5px 10px;
        border: 1px solid var(--strct-sb-border, var(--b2));
        border-radius: 7px;
        background: var(--strct-sb-bg, var(--bg-2));
        color: var(--strct-sb-fg, var(--t2));
        font-family: var(--font);
        font-size: var(--strct-sb-font-size, 12.5px);
        transition:
          background 0.14s ease,
          border-color 0.14s ease,
          color 0.14s ease;
      }
      .strct-sb--trigger {
        cursor: pointer;
        text-align: start;
      }
      .strct-sb--trigger:hover:not(:disabled) {
        color: var(--strct-sb-fg-hover, var(--t1));
        background: var(--strct-sb-bg-hover, var(--bg-3));
      }
      .strct-sb--trigger:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-sb:focus-within:not(.strct-sb--trigger) {
        border-color: var(--acc50);
        color: var(--t1);
      }
      .strct-sb--disabled,
      .strct-sb--trigger:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .strct-sb__icon {
        flex-shrink: 0;
        color: var(--strct-sb-muted, var(--t3));
      }
      .strct-sb__label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-sb__input {
        flex: 1;
        min-width: 0;
        border: 0;
        padding: 0;
        background: transparent;
        color: var(--t1);
        font-family: var(--font);
        font-size: 12.5px;
        outline: none;
      }
      .strct-sb__input::placeholder {
        color: var(--t3);
      }
      /* Hint chip: strct-kbd's proven AA recipe (t3 on bg-2 + border). */
      .strct-sb__kbd {
        flex-shrink: 0;
        font-family: var(--mono);
        font-size: 10px;
        line-height: 1;
        padding: 3px 5px;
        border: 1px solid var(--strct-sb-kbd-border, var(--b2));
        border-radius: 4px;
        background: var(--strct-sb-kbd-bg, var(--bg-2));
        color: var(--strct-sb-kbd-fg, var(--t3));
      }
      .strct-sb__clear {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        margin: -2px;
        padding: 0;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
      }
      .strct-sb__clear:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-sb__clear:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-sb {
          transition: none;
        }
      }
    `,
  ],
})
export class StrctSearchbox implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Placeholder text (and the trigger mode's label). */
  readonly placeholder = input('Search');
  /** Keyboard-hint chip (e.g. "⌘K"); hidden while typing. */
  readonly hint = input('');
  /** Render as an activation button instead of a real input (palette opener). */
  readonly trigger = input(false, { transform: booleanAttribute });
  /** Show the × clear button when there is a value. */
  readonly clearable = input(true, { transform: booleanAttribute });
  /** Accessible label; falls back to `placeholder`. */
  readonly ariaLabel = input('');
  /** Accessible label of the clear button (localizable). */
  readonly clearLabel = input('Clear search');
  /** Current text (two-way; also drives the CVA value). */
  readonly value = model('');
  /** Enter pressed in input mode — run the search with the current text. */
  readonly search = output<string>();
  /** Trigger mode clicked (open your command palette / search surface). */
  readonly activated = output<void>();

  protected readonly focused = signal(false);
  readonly isDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  /** Clear the text (Escape / the × button). */
  clear(): void {
    if (!this.value()) return;
    this.value.set('');
    this.onChange('');
  }

  /** Focus the input programmatically (e.g. from a global shortcut). */
  focus(): void {
    this.host.nativeElement.querySelector<HTMLInputElement>('.strct-sb__input')?.focus();
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
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
