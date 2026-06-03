import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctTag } from '../tag/tag';

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
    <div class="strct-chips" (click)="input.focus()">
      @for (chip of value(); track chip) {
        <strct-tag status="accent" removable (removed)="remove(chip)">{{ chip }}</strct-tag>
      }
      <input
        #input
        type="text"
        class="strct-chips__input"
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
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      width: 100%; max-width: 360px; min-height: 38px; padding: 5px 8px;
      background: var(--bg-2); border: 1px solid var(--b2); border-radius: 6px;
      cursor: text; transition: border-color .14s ease, box-shadow .14s ease;
    }
    .strct-chips:focus-within { border-color: var(--acc50); box-shadow: 0 0 0 3px var(--acc18); background: var(--bg-1); }
    .strct-chips__input {
      flex: 1; min-width: 80px; border: 0; outline: none; background: transparent;
      font-family: var(--font); font-size: 13px; color: var(--t1); padding: 3px 2px;
    }
    .strct-chips__input::placeholder { color: var(--t3); }
    `,
  ],
})
export class StrctChips implements ControlValueAccessor {
  readonly placeholder = input('');
  readonly allowDuplicates = input(false);

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

  remove(chip: string): void {
    this.value.update((v) => v.filter((c) => c !== chip));
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
