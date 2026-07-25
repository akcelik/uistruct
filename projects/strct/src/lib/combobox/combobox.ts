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
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';
import { StrctOverlay } from '../overlay/overlay';

/** One option in a combobox or similar list. */
export interface StrctOption {
  value: unknown;
  label: string;
  /** Grayed out and skipped by keyboard navigation. */
  disabled?: boolean;
  /** Options sharing a group label render under one header (combobox). */
  group?: string;
}

/** A render row of the option list: a group header or an option. */
interface CbxRow {
  key: string;
  header?: string;
  opt?: StrctOption;
  /** Flat option index (headers carry none) — drives ids and highlight. */
  index?: number;
}

let comboboxCounter = 0;

/**
 * Filterable select (autocomplete). CVA-compatible, fully keyboard driven
 * (↑/↓ move, Home/End jump, Enter picks, Esc closes) with the shared select
 * ergonomics: an aligned ✓ lead slot marks the current choice, the typed
 * match is emphasised in each label, and disabled options gray out and are
 * skipped.
 *
 *   <strct-combobox [options]="opts" [(ngModel)]="selected" placeholder="Pick…" />
 *
 * Variants: `clearable` adds an × that resets the selection; `multiple`
 * switches the value to an array and renders the picks as removable chips —
 * the list stays open while picking and Backspace on an empty query removes
 * the last chip. Options may carry `group` labels (rendered as headers) and
 * `disabled`.
 */
@Component({
  selector: 'strct-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctOverlay],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctCombobox), multi: true },
  ],
  template: `
    <div
      #field
      class="strct-cbx__field"
      [class.strct-control]="multiple()"
      [class.strct-cbx__field--multi]="multiple()"
      (click)="focusInput()"
    >
      @if (multiple()) {
        @for (v of values(); track $index) {
          <span class="strct-cbx__chip">
            {{ labelOf(v) }}
            <button
              type="button"
              class="strct-cbx__chip-x"
              [attr.aria-label]="removeLabel() + ' ' + labelOf(v)"
              [disabled]="isDisabled()"
              (click)="removeValue(v, $event)"
            >
              <strct-icon strictName="close" [size]="10" [strokeWidth]="1.8" />
            </button>
          </span>
        }
      }
      <input
        #input
        type="text"
        class="strct-cbx__input"
        [class.strct-control]="!multiple()"
        [class.strct-cbx__input--bare]="multiple()"
        role="combobox"
        autocomplete="off"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="listId"
        [attr.aria-activedescendant]="open() && flat().length ? listId + '-' + activeIndex() : null"
        [placeholder]="multiple() && values().length ? '' : placeholder()"
        [value]="query()"
        [disabled]="isDisabled()"
        (focus)="openList()"
        (click)="openList()"
        (input)="onType($event)"
        (keydown)="onKeydown($event)"
        (blur)="onTouched()"
      />
      @if (clearable() && hasSelection() && !isDisabled()) {
        <button
          type="button"
          class="strct-cbx__clear"
          [attr.aria-label]="clearLabel()"
          (click)="clear($event)"
        >
          <strct-icon strictName="close" [size]="12" [strokeWidth]="1.6" />
        </button>
      }
      <strct-icon class="strct-cbx__caret" strictName="chevronDown" [size]="14" />
    </div>
    @if (open()) {
      <div
        class="strct-cbx__menu"
        role="listbox"
        [id]="listId"
        [attr.aria-multiselectable]="multiple() || null"
        [strctOverlay]="field"
        strctOverlayPlacement="bottom-start"
        [strctOverlayMatchWidth]="true"
        (mousedown)="$event.preventDefault()"
      >
        @if (loading()) {
          <div class="strct-cbx__skeleton">
            <div class="strct-cbx__skeleton-block"></div>
          </div>
        } @else {
          @for (row of rows(); track row.key) {
            @if (row.header !== undefined) {
              <div class="strct-cbx__group" role="presentation">{{ row.header }}</div>
            } @else {
              <div
                class="strct-cbx__opt"
                [id]="listId + '-' + row.index"
                [class.strct-cbx__opt--selected]="isSelected(row.opt!.value)"
                [class.strct-cbx__opt--highlight]="row.index === activeIndex()"
                role="option"
                [attr.aria-selected]="isSelected(row.opt!.value)"
                [attr.aria-disabled]="row.opt!.disabled || null"
                (mousedown)="select(row.opt!, $event)"
                (mousemove)="!row.opt!.disabled && activeIndex.set(row.index!)"
              >
                <span class="strct-cbx__check" aria-hidden="true">
                  @if (isSelected(row.opt!.value)) {
                    <strct-icon strictName="check" [size]="12" [strokeWidth]="1.8" />
                  }
                </span>
                @let seg = segments(row.opt!.label);
                <span class="strct-cbx__label"
                  >{{ seg.pre }}<span class="strct-cbx__match">{{ seg.match }}</span
                  >{{ seg.post }}</span
                >
              </div>
            }
          } @empty {
            <div class="strct-cbx__empty">{{ emptyText() }}</div>
          }
        }
      </div>
    }
  `,
  host: { class: 'strct-cbx' },
  styles: [
    `
      /* Full width of its container by default — no artificial cap. */
      .strct-cbx {
        position: relative;
        display: block;
        width: 100%;
      }
      .strct-cbx__field {
        position: relative;
      }
      .strct-cbx__input {
        padding-inline-end: 30px;
      }
      /* Multiple mode: the FIELD wears the control skin and wraps chips; the
         inner input goes chromeless. */
      .strct-cbx__field--multi {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        padding-block: 4px;
        cursor: text;
      }
      .strct-cbx__field--multi:focus-within {
        outline: none;
        border-color: var(--acc50);
        box-shadow: 0 0 0 3px var(--acc18);
        background: var(--bg-1);
      }
      .strct-cbx__input--bare {
        flex: 1;
        min-width: 60px;
        padding: 2px 0;
        font: inherit;
        font-size: 13px;
        color: var(--t1);
        background: none;
        border: none;
        outline: none;
      }
      .strct-cbx__chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        max-width: 100%;
        padding: 2px 4px 2px 8px;
        font-size: 12px;
        color: var(--t1);
        background: var(--bg-3);
        border: 1px solid var(--b2);
        border-radius: var(--radius-sm);
      }
      .strct-cbx__chip-x {
        display: inline-flex;
        align-items: center;
        padding: 2px;
        color: var(--t3);
        background: none;
        border: none;
        border-radius: 3px;
        cursor: pointer;
      }
      .strct-cbx__chip-x:hover {
        color: var(--t1);
        background: var(--bg-4);
      }
      .strct-cbx__clear {
        position: absolute;
        right: 26px;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        padding: 2px;
        color: var(--t3);
        background: none;
        border: none;
        border-radius: 3px;
        cursor: pointer;
      }
      .strct-cbx__clear:hover {
        color: var(--t1);
      }
      .strct-cbx__caret {
        position: absolute;
        right: 9px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--t3);
        pointer-events: none;
      }
      /* Positioned by StrctOverlay (position: fixed, set inline) — only the
       surface styling lives here. */
      .strct-cbx__menu {
        z-index: 200;
        max-height: 240px;
        overflow-y: auto;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 7px;
        box-shadow: var(--shh);
      }
      .strct-cbx__group {
        padding: 7px 10px 3px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--t3);
      }
      .strct-cbx__opt {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
      }
      .strct-cbx__opt--highlight {
        background: var(--bg-3);
      }
      .strct-cbx__opt--selected {
        font-weight: 600;
        background: var(--acc-s);
      }
      .strct-cbx__opt--selected.strct-cbx__opt--highlight {
        background: var(--acc-m);
      }
      .strct-cbx__opt[aria-disabled='true'] {
        color: var(--t4);
        cursor: default;
      }
      /* Fixed lead slot keeps labels aligned; ✓ marks the current choice. */
      .strct-cbx__check {
        display: inline-flex;
        width: 14px;
        flex: none;
        color: var(--acc);
      }
      .strct-cbx__label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-cbx__match {
        font-weight: 700;
        color: var(--acc);
      }
      @keyframes strct-skeleton-pulse {
        0%,
        100% {
          opacity: 0.4;
        }
        50% {
          opacity: 0.7;
        }
      }
      .strct-cbx__skeleton {
        padding: 9px 10px;
      }
      .strct-cbx__skeleton-block {
        height: 12px;
        background: var(--bg-3);
        border-radius: var(--radius-sm);
        animation: strct-skeleton-pulse 1.4s ease infinite;
      }
      .strct-cbx__empty {
        padding: 9px 10px;
        font-size: 13px;
        color: var(--t3);
      }
    `,
  ],
})
export class StrctCombobox implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');
  protected readonly listId = `strct-cbx-${++comboboxCounter}`;

  /** Available options (`disabled` grays out; `group` renders headers). */
  readonly options = input<StrctOption[]>([]);
  /** Placeholder text when empty. */
  readonly placeholder = input('');
  /** Show a skeleton placeholder while options are loading. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Show an × that resets the selection. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /**
   * Multi-select: the value becomes an array and the picks render as
   * removable chips; the list stays open while picking.
   */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Text shown when the filter matches nothing (localizable). */
  readonly emptyText = input('No matches');
  /** Accessible label of the × clear button (localizable). */
  readonly clearLabel = input('Clear selection');
  /** Accessible label prefix of a chip's × button (localizable). */
  readonly removeLabel = input('Remove');

  readonly query = signal('');
  readonly value = signal<unknown>(null);
  /** Selection in `multiple` mode. */
  readonly values = signal<unknown[]>([]);
  readonly open = signal(false);
  readonly activeIndex = signal(0);
  readonly isDisabled = signal(false);
  /** True while the user is typing a filter that hasn't been committed yet. */
  private readonly dirty = signal(false);

  protected readonly filtered = computed(() => {
    const q = this.dirty() ? this.query().toLowerCase().trim() : '';
    if (!q) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(q));
  });

  /** Flat option list (no headers) — keyboard navigation and ids live here. */
  protected readonly flat = computed(() => this.filtered());

  /** Render rows: group headers interleaved with their options. */
  protected readonly rows = computed<CbxRow[]>(() => {
    const out: CbxRow[] = [];
    let lastGroup: string | undefined;
    this.filtered().forEach((opt, index) => {
      if (opt.group !== undefined && opt.group !== lastGroup) {
        out.push({ key: `h:${opt.group}`, header: opt.group });
      }
      lastGroup = opt.group;
      out.push({ key: `o:${index}`, opt, index });
    });
    return out;
  });

  protected readonly hasSelection = computed(() =>
    this.multiple() ? this.values().length > 0 : this.value() !== null,
  );

  private onChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  protected isSelected(v: unknown): boolean {
    return this.multiple() ? this.values().includes(v) : this.value() === v;
  }

  protected labelOf(v: unknown): string {
    return this.options().find((o) => o.value === v)?.label ?? String(v);
  }

  /** The typed match emphasised inside a label (first occurrence). */
  protected segments(label: string): { pre: string; match: string; post: string } {
    const q = this.dirty() ? this.query().toLowerCase().trim() : '';
    const at = q ? label.toLowerCase().indexOf(q) : -1;
    if (at < 0) return { pre: label, match: '', post: '' };
    return {
      pre: label.slice(0, at),
      match: label.slice(at, at + q.length),
      post: label.slice(at + q.length),
    };
  }

  protected focusInput(): void {
    this.inputEl().nativeElement.focus();
  }

  openList(): void {
    if (this.isDisabled()) return;
    this.open.set(true);
    this.activeIndex.set(this.initialIndex());
  }

  onType(event: Event): void {
    this.dirty.set(true);
    this.query.set((event.target as HTMLInputElement).value);
    this.open.set(true);
    this.activeIndex.set(this.firstEnabled(0));
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open()) return this.openList();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Home':
      case 'End':
        if (!this.open()) return;
        event.preventDefault();
        this.activeIndex.set(event.key === 'Home' ? this.firstEnabled(0) : this.lastEnabled());
        this.scrollActiveIntoView();
        break;
      case 'Enter': {
        if (!this.open()) return;
        event.preventDefault();
        const opt = this.flat()[this.activeIndex()];
        if (opt && !opt.disabled) this.commit(opt);
        break;
      }
      case 'Backspace':
        if (this.multiple() && !this.query() && this.values().length) {
          this.removeValue(this.values()[this.values().length - 1]);
        }
        break;
      case 'Tab':
        this.close();
        break;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  private move(delta: number): void {
    const opts = this.flat();
    if (!opts.length) return;
    let i = this.activeIndex();
    let guard = opts.length;
    do {
      i = (i + delta + opts.length) % opts.length;
    } while (opts[i].disabled && --guard > 0);
    this.activeIndex.set(i);
    this.scrollActiveIntoView();
  }

  private firstEnabled(from: number): number {
    const opts = this.flat();
    for (let i = from; i < opts.length; i++) if (!opts[i].disabled) return i;
    return 0;
  }

  private lastEnabled(): number {
    const opts = this.flat();
    for (let i = opts.length - 1; i >= 0; i--) if (!opts[i].disabled) return i;
    return 0;
  }

  private scrollActiveIntoView(): void {
    setTimeout(() => {
      document
        .getElementById(`${this.listId}-${this.activeIndex()}`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }

  select(opt: StrctOption, event: Event): void {
    event.preventDefault(); // keep focus, avoid blur reordering
    if (opt.disabled) return;
    this.commit(opt);
  }

  private commit(opt: StrctOption): void {
    if (this.multiple()) {
      const next = this.values().includes(opt.value)
        ? this.values().filter((v) => v !== opt.value)
        : [...this.values(), opt.value];
      this.values.set(next);
      this.query.set('');
      this.dirty.set(false);
      this.activeIndex.set(this.options().indexOf(opt));
      this.onChange([...next]);
      this.onTouched();
      return; // the list stays open while picking
    }
    this.value.set(opt.value);
    this.query.set(opt.label);
    this.dirty.set(false);
    this.open.set(false);
    this.onChange(opt.value);
    this.onTouched();
  }

  protected removeValue(v: unknown, event?: Event): void {
    event?.stopPropagation();
    const next = this.values().filter((x) => x !== v);
    this.values.set(next);
    this.onChange([...next]);
    this.onTouched();
    // A clicked chip × vanishes with its chip — keep focus in the control.
    if (event) this.focusInput();
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    if (this.multiple()) {
      this.values.set([]);
      this.onChange([]);
    } else {
      this.value.set(null);
      this.onChange(null);
    }
    this.query.set('');
    this.dirty.set(false);
    this.onTouched();
    this.focusInput();
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private close(): void {
    this.open.set(false);
    this.dirty.set(false);
    this.syncQueryToValue();
  }

  /** Highlight starts on the selected option — or the first enabled one. */
  private initialIndex(): number {
    const opts = this.flat();
    const sel = opts.findIndex((o) => this.isSelected(o.value) && !o.disabled);
    return sel < 0 ? this.firstEnabled(0) : sel;
  }

  private syncQueryToValue(): void {
    if (this.multiple()) {
      this.query.set('');
      return;
    }
    const match = this.options().find((o) => o.value === this.value());
    this.query.set(match?.label ?? '');
  }

  writeValue(value: unknown): void {
    if (this.multiple()) {
      this.values.set(Array.isArray(value) ? value : []);
      return;
    }
    this.value.set(value);
    this.syncQueryToValue();
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
