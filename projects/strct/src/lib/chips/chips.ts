import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctTag } from '../tag/tag';
import { StrctField } from '../forms/field';

/**
 * Tag input — type a word and press Enter to add a chip; Backspace on an empty
 * field removes the last. CVA value is `string[]`.
 *   <strct-chips [(ngModel)]="labels" placeholder="Add a tag…" />
 */
@Component({
  selector: 'strct-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctTag],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctChips), multi: true },
  ],
  template: `
    <!-- Pointer convenience only: a click on the field's padding focuses the
         real <input>, which is the tab stop and owns the keyboard path. It was
         a role="button" tab stop wrapping the input and the chips' remove
         buttons — an interactive inside an interactive (axe nested-interactive)
         and one Tab press that did nothing. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <div class="strct-chips" (click)="input.focus()">
      @for (chip of value(); track $index) {
        <strct-tag status="accent" removable [disabled]="isDisabled()" (removed)="remove($index)">{{
          chip
        }}</strct-tag>
      }
      <input
        #input
        type="text"
        class="strct-chips__input"
        [attr.aria-label]="ariaLabel() || (inField ? null : placeholder() || null)"
        [value]="draft()"
        [placeholder]="value().length ? '' : placeholder()"
        [disabled]="isDisabled()"
        (input)="draft.set($any($event.target).value)"
        (keydown)="onKeydown($event)"
        (blur)="commitDraft(); onTouched()"
      />
    </div>
  `,
  styles: [
    `
      .strct-chips {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        width: 100%;
        min-height: 38px;
        padding: 5px 8px;
        background: var(--bg-2);
        border: 1px solid var(--b2);
        border-radius: 3px;
        cursor: text;
        transition:
          border-color 0.14s ease,
          box-shadow 0.14s ease;
      }
      .strct-chips:focus-within {
        border-color: var(--acc50);
        box-shadow: 0 0 0 3px var(--acc18);
        background: var(--bg-1);
      }
      .strct-chips__input {
        flex: 1;
        min-width: 80px;
        border: 0;
        outline: none;
        background: transparent;
        font-family: var(--font);
        font-size: 13px;
        color: var(--t1);
        padding: 3px 2px;
      }
      .strct-chips__input::placeholder {
        color: var(--t3);
      }
    `,
  ],
})
export class StrctChips implements ControlValueAccessor {
  /** Placeholder text when empty. */
  readonly placeholder = input('');
  /**
   * Accessible name of the text field. Outside a `strct-field` it falls back
   * to `placeholder`; inside one, the field's `<label for>` names it and the
   * placeholder stays a placeholder.
   */
  readonly ariaLabel = input('');
  /**
   * Inside a `strct-field`, whose `<label for>` names the text field.
   *
   * Asked through DI rather than with `closest('strct-field')`: projected
   * content is not under the field in the DOM yet when this class is built,
   * so the DOM answered no while the template said yes — and the fallback
   * below then overrode the field's visible label with the placeholder's
   * wording (WCAG 2.5.3). The element injector follows the template the
   * consumer wrote, so it answers correctly even in a view inserted later.
   */
  protected readonly inField = !!inject(StrctField, { optional: true });
  /** Allow duplicate tags. */
  readonly allowDuplicates = input(false, { transform: booleanAttribute });

  readonly value = signal<string[]>([]);
  readonly draft = signal('');
  readonly isDisabled = signal(false);

  private onChange: (value: string[]) => void = () => {};
  protected onTouched: () => void = () => {};

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.commitDraft();
    } else if (event.key === 'Backspace' && !this.draft() && this.value().length) {
      this.value.update((v) => v.slice(0, -1));
      this.emit();
    }
  }

  protected commitDraft(): void {
    const tag = this.draft().trim();
    if (!tag) return;
    if (this.allowDuplicates() || !this.value().includes(tag)) {
      this.value.update((v) => [...v, tag]);
      this.emit();
    }
    this.draft.set('');
  }

  remove(index: number): void {
    this.value.update((v) => v.filter((_, i) => i !== index));
    this.emit();
  }

  private emit(): void {
    this.onChange(this.value());
  }

  writeValue(value: string[]): void {
    this.value.set(Array.isArray(value) ? [...value] : []);
  }
  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
