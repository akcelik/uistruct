import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';
import { StrctOverlay } from '../overlay/overlay';
import { StrctOption } from '../combobox/combobox';

let selectCounter = 0;

/**
 * Select-only combobox (APG pattern): a real button trigger wearing the shared
 * `.strct-control` look, opening a token-styled listbox — so the option list
 * matches the theme instead of the OS popup a native `<select>` shows.
 * CVA-compatible; options are non-filterable (reach for `strct-combobox` when
 * the list needs typing to narrow).
 *
 *   <strct-field label="Region">
 *     <strct-select [options]="regions" [(ngModel)]="region" placeholder="Pick a region" />
 *   </strct-field>
 *
 * Keyboard follows the native select: ArrowDown/Up and Enter/Space open,
 * arrows move (skipping disabled options), Home/End jump, typing jumps to the
 * matching label (typeahead), Enter/Space commit, Escape/Tab close without
 * committing. The selected option carries a leading ✓ and gets the highlight
 * when reopening — the same select ergonomics as `strct-dropdown-item
 * [selected]`.
 */
@Component({
  selector: 'strct-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctOverlay],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctSelect), multi: true },
  ],
  template: `
    <button
      #btn
      type="button"
      strctField
      class="strct-control strct-sel__btn"
      role="combobox"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? listId : null"
      [attr.aria-activedescendant]="open() ? listId + '-' + activeIndex() : null"
      [disabled]="isDisabled() || disabled()"
      (click)="toggle()"
      (keydown)="onKeydown($event)"
      (blur)="onBlur()"
    >
      <span class="strct-sel__value" [class.strct-sel__value--placeholder]="!selectedOption()">
        {{ selectedOption()?.label ?? placeholder() }}
      </span>
      <strct-icon class="strct-sel__caret" strictName="chevronDown" [size]="14" />
    </button>
    @if (open()) {
      <div
        class="strct-sel__list"
        role="listbox"
        [id]="listId"
        [attr.aria-label]="listLabel() || null"
        [strctOverlay]="btn"
        strctOverlayPlacement="bottom-start"
        [strctOverlayMatchWidth]="true"
        (mousedown)="$event.preventDefault()"
      >
        @for (opt of options(); track opt.value; let i = $index) {
          <div
            class="strct-sel__opt"
            [id]="listId + '-' + i"
            [class.strct-sel__opt--highlight]="i === activeIndex()"
            [class.strct-sel__opt--selected]="opt.value === value()"
            role="option"
            [attr.aria-selected]="opt.value === value()"
            [attr.aria-disabled]="opt.disabled || null"
            (mousedown)="pick(opt, $event)"
            (mousemove)="!opt.disabled && activeIndex.set(i)"
          >
            <span class="strct-sel__check" aria-hidden="true">
              @if (opt.value === value()) {
                <strct-icon strictName="check" [size]="12" [strokeWidth]="1.8" />
              }
            </span>
            {{ opt.label }}
          </div>
        } @empty {
          <div class="strct-sel__empty">{{ emptyText() }}</div>
        }
      </div>
    }
  `,
  host: { class: 'strct-sel' },
  styles: [
    `
      .strct-sel {
        position: relative;
        display: block;
        width: 100%;
      }
      /* The trigger is a real button wearing the shared control skin — flex so
         the value truncates and the caret keeps its corner. */
      .strct-sel__btn {
        display: flex;
        align-items: center;
        gap: 8px;
        text-align: start;
        cursor: pointer;
      }
      .strct-sel__btn:disabled {
        cursor: not-allowed;
      }
      .strct-sel__value {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-sel__value--placeholder {
        color: var(--t3);
      }
      .strct-sel__caret {
        flex: none;
        color: var(--t3);
      }
      /* Positioned by StrctOverlay (position: fixed, set inline). */
      .strct-sel__list {
        z-index: 200;
        max-height: 240px;
        overflow-y: auto;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 7px;
        box-shadow: var(--shh);
      }
      .strct-sel__opt {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
      }
      .strct-sel__opt--highlight {
        background: var(--bg-3);
      }
      .strct-sel__opt--selected {
        font-weight: 600;
        background: var(--acc-s);
      }
      .strct-sel__opt--selected.strct-sel__opt--highlight {
        background: var(--acc-m);
      }
      .strct-sel__opt[aria-disabled='true'] {
        color: var(--t4);
        cursor: default;
      }
      /* Fixed lead slot keeps labels aligned; ✓ marks the current choice. */
      .strct-sel__check {
        display: inline-flex;
        width: 14px;
        flex: none;
        color: var(--acc);
      }
      .strct-sel__empty {
        padding: 9px 10px;
        font-size: 13px;
        color: var(--t3);
      }
    `,
  ],
})
export class StrctSelect implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly listId = `strct-sel-${++selectCounter}`;

  /** Available options (set `disabled: true` on an option to gray it out). */
  readonly options = input<StrctOption[]>([]);
  /** Muted text shown while no value is selected (localizable). */
  readonly placeholder = input('Select…');
  /** Accessible name of the listbox (localizable). */
  readonly listLabel = input('');
  /** Text shown when `options` is empty (localizable). */
  readonly emptyText = input('No options');
  /** Static disable flag (forms also drive it via setDisabledState). */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly value = signal<unknown>(null);
  readonly open = signal(false);
  readonly activeIndex = signal(0);
  readonly isDisabled = signal(false);

  protected readonly selectedOption = computed(() =>
    this.options().find((o) => o.value === this.value()),
  );

  /** Typeahead buffer — clears half a second after the last keystroke. */
  private typed = '';
  private typedTimer: ReturnType<typeof setTimeout> | null = null;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.open()) this.close();
    else this.openList();
  }

  openList(): void {
    if (this.isDisabled() || this.disabled()) return;
    this.open.set(true);
    this.activeIndex.set(this.initialIndex());
    this.scrollActiveIntoView();
  }

  close(): void {
    this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const opts = this.options();
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) return this.openList();
      this.move(key === 'ArrowDown' ? 1 : -1);
    } else if (key === 'Home' || key === 'End') {
      if (!this.open()) return;
      event.preventDefault();
      this.moveTo(key === 'Home' ? 0 : opts.length - 1, key === 'Home' ? 1 : -1);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (!this.open()) return this.openList();
      const opt = opts[this.activeIndex()];
      if (opt && !opt.disabled) this.commit(opt);
    } else if (key === 'Escape') {
      if (this.open()) {
        event.preventDefault();
        this.close();
      }
    } else if (key === 'Tab') {
      this.close();
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.typeahead(key);
    }
  }

  /**
   * Native-select typeahead: letters accumulate into a prefix that jumps to
   * the matching label; repeating one letter cycles its matches instead.
   */
  private typeahead(char: string): void {
    const lower = char.toLowerCase();
    if (this.typedTimer) clearTimeout(this.typedTimer);
    this.typedTimer = setTimeout(() => (this.typed = ''), 500);
    const repeatCycle = this.typed.length > 0 && [...this.typed].every((c) => c === lower);
    this.typed += lower;
    const prefix = repeatCycle ? lower : this.typed;
    const opts = this.options();
    if (!opts.length) return;
    const wasOpen = this.open();
    if (!wasOpen) this.openList();
    const from = this.activeIndex();
    for (let step = repeatCycle || !wasOpen ? 1 : 0; step <= opts.length; step++) {
      const i = (from + step) % opts.length;
      const opt = opts[i];
      if (!opt.disabled && opt.label.toLowerCase().startsWith(prefix)) {
        this.activeIndex.set(i);
        this.scrollActiveIntoView();
        return;
      }
    }
  }

  private move(delta: number): void {
    const opts = this.options();
    if (!opts.length) return;
    let i = this.activeIndex();
    let guard = opts.length;
    do {
      i = (i + delta + opts.length) % opts.length;
    } while (opts[i].disabled && --guard > 0);
    this.activeIndex.set(i);
    this.scrollActiveIntoView();
  }

  /** Jump to `index`, walking `dir` past disabled options. */
  private moveTo(index: number, dir: 1 | -1): void {
    const opts = this.options();
    let i = index;
    for (let n = 0; n < opts.length && opts[i]?.disabled; n++) {
      i = (i + dir + opts.length) % opts.length;
    }
    if (opts[i] && !opts[i].disabled) {
      this.activeIndex.set(i);
      this.scrollActiveIntoView();
    }
  }

  protected pick(opt: StrctOption, event: Event): void {
    event.preventDefault(); // keep focus on the trigger button
    if (opt.disabled) return;
    this.commit(opt);
  }

  private commit(opt: StrctOption): void {
    this.value.set(opt.value);
    this.close();
    this.onChange(opt.value);
    this.onTouched();
  }

  protected onBlur(): void {
    // Any mousedown inside the list preventDefaults, so focus never leaves
    // the trigger mid-interaction; outside clicks close via onDocClick and
    // Tab closes in onKeydown — blur only marks the control touched.
    this.onTouched();
  }

  /** Highlight starts on the selected option — or the first enabled one. */
  private initialIndex(): number {
    const opts = this.options();
    const sel = opts.findIndex((o) => o.value === this.value() && !o.disabled);
    if (sel >= 0) return sel;
    const first = opts.findIndex((o) => !o.disabled);
    return first < 0 ? 0 : first;
  }

  private scrollActiveIntoView(): void {
    setTimeout(() => {
      document
        .getElementById(`${this.listId}-${this.activeIndex()}`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
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
