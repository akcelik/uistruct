import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctAnnouncer } from '../a11y/announcer';
import { StrctIcon } from '../icon/icon';

/**
 * Click-to-edit text: display mode shows the value (or a muted localizable
 * `placeholder` when empty) with a pencil edit affordance that appears on
 * hover/focus; activating either swaps in an input. Enter commits, Escape
 * cancels (propagation stopped so an enclosing dialog stays open), blur
 * commits. The committed value is announced in a live region via
 * `StrctAnnouncer` (label built by the localizable `announcement` factory).
 *
 *   <strct-inline-edit [(ngModel)]="vm.name" />
 *
 * A ControlValueAccessor over `string`; `disabled` (attribute) and the forms
 * API's `setDisabledState` both lock it into display mode.
 */
@Component({
  selector: 'strct-inline-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctInlineEdit), multi: true },
  ],
  template: `
    @if (editing()) {
      <input
        type="text"
        class="strct-control strct-ie__input"
        [value]="draft()"
        [attr.aria-label]="editLabel()"
        (input)="draft.set($any($event.target).value)"
        (keydown)="onInputKey($event)"
        (blur)="commit()"
      />
    } @else {
      <span class="strct-ie__display">
        <button
          type="button"
          class="strct-ie__value"
          [class.strct-ie__value--empty]="!value()"
          [disabled]="isDisabled()"
          (click)="startEdit()"
        >
          {{ value() || placeholder() }}
        </button>
        @if (!isDisabled()) {
          <button
            type="button"
            class="strct-ie__edit"
            tabindex="-1"
            [attr.aria-label]="editLabel()"
            (click)="startEdit()"
          >
            <strct-icon strictName="pencil" [size]="12" [strokeWidth]="1.6" />
          </button>
        }
      </span>
    }
  `,
  host: { class: 'strct-inline-edit-host' },
  styles: [
    `
      .strct-inline-edit-host {
        display: inline-block;
        min-inline-size: 0;
      }
      .strct-ie__display {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        max-inline-size: 100%;
      }
      .strct-ie__value {
        padding-block: 2px;
        padding-inline: 6px;
        border: 0;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--t1);
        font-family: var(--font);
        font-size: inherit;
        text-align: start;
        cursor: text;
        max-inline-size: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: background 0.13s ease;
      }
      .strct-ie__value:hover:not(:disabled) {
        background: var(--bg-3);
      }
      .strct-ie__value:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-ie__value:disabled {
        cursor: default;
      }
      .strct-ie__value--empty {
        color: var(--t3);
        font-style: italic;
      }
      .strct-ie__edit {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--t3);
        cursor: pointer;
        /* Revealed on hover/focus of the display group. */
        opacity: 0;
        transition:
          opacity 0.13s ease,
          color 0.13s ease;
      }
      .strct-ie__display:hover .strct-ie__edit,
      .strct-ie__display:focus-within .strct-ie__edit {
        opacity: 1;
      }
      .strct-ie__edit:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-ie__edit:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
        opacity: 1;
      }
      .strct-ie__input {
        min-inline-size: 10ch;
        padding-block: 1px;
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-ie__value,
        .strct-ie__edit {
          transition: none;
        }
      }
    `,
  ],
})
export class StrctInlineEdit implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly announcer = inject(StrctAnnouncer);

  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Disabled state pushed by the forms API (setDisabledState). */
  private readonly cvaDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  /** Shown (muted) when the value is empty (localizable). */
  readonly placeholder = input('Empty');
  /** Accessible label of the pencil edit button and the input (localizable). */
  readonly editLabel = input('Edit');
  /** Builds the live-region announcement after a commit (localizable). */
  readonly announcement = input((value: string) =>
    value ? `Changed to ${value}` : 'Value cleared',
  );

  /** Committed value — the CVA model. */
  readonly value = signal('');
  /** In-progress text while editing. */
  protected readonly draft = signal('');
  protected readonly editing = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Swap display mode for the input; the current value seeds the draft. */
  protected startEdit(): void {
    if (this.isDisabled() || this.editing()) return;
    this.draft.set(this.value());
    this.editing.set(true);
    setTimeout(() => this.inputEl()?.focus());
  }

  /** Enter commits; Escape cancels (and must not bubble to dialogs/menus). */
  protected onInputKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      // Leave edit mode first; the ensuing blur finds editing() false and
      // does not double-commit.
      this.editing.set(false);
      this.onTouched();
      this.restoreDisplayFocus();
    }
  }

  /** Commit the draft — Enter or blur. No-op once edit mode was left. */
  protected commit(): void {
    if (!this.editing()) return;
    const next = this.draft();
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
    this.editing.set(false);
    this.announcer.announce(this.announcement()(next));
    this.restoreDisplayFocus();
  }

  /** After leaving edit mode, focus lands back on the display value button. */
  private restoreDisplayFocus(): void {
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLElement>('.strct-ie__value')?.focus(),
    );
  }

  private inputEl(): HTMLInputElement | null {
    return this.host.nativeElement.querySelector<HTMLInputElement>('.strct-ie__input');
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
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
