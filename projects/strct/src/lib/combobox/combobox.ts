import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';
import { StrctOverlay } from '../overlay/overlay';

export interface StrctOption {
  value: unknown;
  label: string;
}

let comboboxCounter = 0;

/**
 * Filterable single-select (autocomplete). CVA-compatible, fully keyboard
 * driven (↑/↓ to move, Enter to pick, Esc to close).
 *   <strct-combobox [options]="opts" [(ngModel)]="selected" placeholder="Pick…" />
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
    <div #field class="strct-cbx__field">
      <input
        #input
        type="text"
        class="strct-control strct-cbx__input"
        role="combobox"
        autocomplete="off"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="listId"
        [attr.aria-activedescendant]="open() && filtered().length ? listId + '-' + activeIndex() : null"
        [placeholder]="placeholder()"
        [value]="query()"
        [disabled]="isDisabled()"
        (focus)="openList()"
        (input)="onType($event)"
        (keydown)="onKeydown($event)"
        (blur)="onTouched()"
      />
      <strct-icon class="strct-cbx__caret" name="chevronDown" [size]="14" />
    </div>
    @if (open()) {
      <div
        class="strct-cbx__menu"
        role="listbox"
        [id]="listId"
        [strctOverlay]="field"
        strctOverlayPlacement="bottom-start"
        [strctOverlayMatchWidth]="true"
      >
        @for (opt of filtered(); track opt.value; let i = $index) {
          <div
            class="strct-cbx__opt"
            [id]="listId + '-' + i"
            [class.strct-cbx__opt--active]="opt.value === value()"
            [class.strct-cbx__opt--highlight]="i === activeIndex()"
            role="option"
            [attr.aria-selected]="opt.value === value()"
            (mousedown)="select(opt, $event)"
            (mousemove)="activeIndex.set(i)"
          >
            {{ opt.label }}
          </div>
        } @empty {
          <div class="strct-cbx__empty">No matches</div>
        }
      </div>
    }
  `,
  host: { class: 'strct-cbx' },
  styles: [
    `
    .strct-cbx { position: relative; display: inline-block; width: 100%; max-width: 280px; }
    .strct-cbx__field { position: relative; }
    .strct-cbx__input { padding-right: 30px; }
    .strct-cbx__caret {
      position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
      color: var(--t3); pointer-events: none;
    }
    .strct-cbx__menu {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
      max-height: 220px; overflow-y: auto; padding: 4px;
      background: var(--bg-1); border: 1px solid var(--b2);
      border-radius: 7px; box-shadow: var(--shh);
    }
    .strct-cbx__opt {
      padding: 7px 10px; border-radius: 5px; cursor: pointer; font-size: 13px; color: var(--t1);
    }
    .strct-cbx__opt--highlight { background: var(--bg-3); }
    .strct-cbx__opt--active { color: var(--acc); }
    .strct-cbx__opt--active.strct-cbx__opt--highlight { background: var(--acc-m); }
    .strct-cbx__empty { padding: 9px 10px; font-size: 13px; color: var(--t3); }
    `,
  ],
})
export class StrctCombobox implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly listId = `strct-cbx-${++comboboxCounter}`;

  readonly options = input<StrctOption[]>([]);
  readonly placeholder = input('');

  readonly query = signal('');
  readonly value = signal<unknown>(null);
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

  private onChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  openList(): void {
    if (this.isDisabled()) return;
    this.open.set(true);
    this.activeIndex.set(this.indexOfValue());
  }

  onType(event: Event): void {
    this.dirty.set(true);
    this.query.set((event.target as HTMLInputElement).value);
    this.open.set(true);
    this.activeIndex.set(0);
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
      case 'Enter': {
        if (!this.open()) return;
        event.preventDefault();
        const opt = this.filtered()[this.activeIndex()];
        if (opt) this.commit(opt);
        break;
      }
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  private move(delta: number): void {
    const len = this.filtered().length;
    if (!len) return;
    this.activeIndex.set((this.activeIndex() + delta + len) % len);
  }

  select(opt: StrctOption, event: Event): void {
    event.preventDefault(); // keep focus, avoid blur reordering
    this.commit(opt);
  }

  private commit(opt: StrctOption): void {
    this.value.set(opt.value);
    this.query.set(opt.label);
    this.dirty.set(false);
    this.open.set(false);
    this.onChange(opt.value);
    this.onTouched();
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

  private indexOfValue(): number {
    const idx = this.filtered().findIndex((o) => o.value === this.value());
    return idx < 0 ? 0 : idx;
  }

  private syncQueryToValue(): void {
    const match = this.options().find((o) => o.value === this.value());
    this.query.set(match?.label ?? '');
  }

  writeValue(value: unknown): void {
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
