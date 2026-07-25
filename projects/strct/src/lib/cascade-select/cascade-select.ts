import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';
import { StrctOverlay } from '../overlay/overlay';
import { restoreFocus, saveFocusedElement } from '../overlay/focus';

/** One option in a cascade select. */
export interface StrctCascadeOption {
  label: string;
  value?: unknown;
  children?: StrctCascadeOption[];
}

/** DI token the columns use to talk back to the host control (avoids a circular type). */
export abstract class StrctCascadeHost {
  abstract pick(value: unknown): void;
  abstract isSelected(value: unknown): boolean;
}

/**
 * One column of a cascade: a flat list of rows plus at most one open fly-out
 * column for the active group row. Recurses to any depth. Keyboard follows the
 * menu pattern (`context-menu/menu.ts`): roving tabindex, ArrowUp/Down rove,
 * ArrowRight opens a group's fly-out (and focuses its first row), ArrowLeft
 * backs out, Home/End jump, Enter/Space pick or open, Escape/Tab close.
 */
@Component({
  selector: 'strct-cascade-column',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, forwardRef(() => StrctCascadeColumn)],
  template: `
    <div class="strct-csc" role="menu" tabindex="-1" (keydown)="onKeydown($event)">
      @for (opt of items(); track $index; let i = $index) {
        <div class="strct-csc__wrap" (mouseenter)="onHover(i)" (mouseleave)="onLeave(i)">
          <button
            type="button"
            class="strct-csn"
            [attr.data-idx]="i"
            [class.strct-csn--active]="i === activeIndex()"
            [class.strct-csn--selected]="isLeafSelected(opt)"
            role="menuitem"
            [attr.aria-haspopup]="opt.children?.length ? 'menu' : null"
            [attr.aria-expanded]="opt.children?.length ? openSubIndex() === i : null"
            [attr.tabindex]="i === activeIndex() ? 0 : -1"
            (click)="onItemClick(opt, i, $event)"
          >
            <span class="strct-csn__label">{{ opt.label }}</span>
            @if (opt.children?.length) {
              <strct-icon
                class="strct-csn__arrow"
                name="chevronRight"
                [size]="12"
                [strokeWidth]="1.6"
              />
            }
          </button>
          @if (openSubIndex() === i && opt.children?.length) {
            <strct-cascade-column
              submenu
              class="strct-csc__subpanel"
              [items]="opt.children!"
              [focusOnOpen]="subFocusOnOpen"
              (back)="closeSub(); focusItem(i)"
              (close)="close.emit()"
            />
          }
        </div>
      }
    </div>
  `,
  host: { class: 'strct-csc-host' },
  styles: [
    `
      .strct-csc-host {
        display: block;
      }
      .strct-csc {
        min-width: 160px;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 7px;
        box-shadow: var(--shh);
      }
      .strct-csc:focus {
        outline: none;
      }
      .strct-csc__wrap {
        position: relative;
      }
      .strct-csn {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 7px 8px 7px 10px;
        border: 0;
        border-radius: 5px;
        cursor: pointer;
        background: transparent;
        color: var(--t1);
        font-size: 13px;
        font-family: var(--font);
        text-align: start;
      }
      .strct-csn:hover,
      .strct-csn--active {
        background: var(--bg-3);
      }
      .strct-csn:focus-visible {
        outline: none;
        background: var(--bg-3);
      }
      .strct-csn--selected {
        color: var(--acc);
        background: var(--acc-m);
      }
      .strct-csn__label {
        flex: 1;
        white-space: nowrap;
      }
      .strct-csn__arrow {
        color: var(--t3);
        flex-shrink: 0;
      }
      .strct-csc__subpanel {
        position: absolute;
        top: -5px;
        inset-inline-start: 100%;
        margin-inline-start: 2px;
        z-index: var(--z-base);
      }
      /* RTL: the fly-out opens toward the inline end — point the arrow at it. */
      [dir='rtl'] .strct-csn__arrow {
        transform: rotate(180deg);
      }
    `,
  ],
})
export class StrctCascadeColumn {
  private readonly host = inject(StrctCascadeHost);
  private readonly el: ElementRef<HTMLElement> = inject(ElementRef);

  /** Options shown in this column. */
  readonly items = input.required<StrctCascadeOption[]>();
  /** Rendered as a fly-out of a parent column (ArrowLeft asks the parent to close it). */
  readonly submenu = input(false, { transform: booleanAttribute });
  /** Focus the first row when the column appears (keyboard opens only). */
  readonly focusOnOpen = input(true, { transform: booleanAttribute });

  /** Emitted when the whole cascade should close (Escape/Tab at any depth). */
  readonly close = output<void>();
  /** ArrowLeft at a fly-out's top level — asks the parent to close the fly-out. */
  readonly back = output<void>();

  protected readonly activeIndex = signal(0);
  protected readonly openSubIndex = signal<number | null>(null);

  /** Whether the fly-out being opened should take focus (keyboard opens only). */
  protected subFocusOnOpen = false;

  constructor() {
    afterNextRender(() => {
      if (this.focusOnOpen()) this.focusItem(0);
    });
  }

  protected isLeafSelected(opt: StrctCascadeOption): boolean {
    return !opt.children?.length && this.host.isSelected(opt.value);
  }

  protected focusItem(i: number): void {
    this.activeIndex.set(i);
    this.el.nativeElement.querySelector<HTMLElement>(`.strct-csn[data-idx="${i}"]`)?.focus();
  }

  protected closeSub(): void {
    this.openSubIndex.set(null);
  }

  /** Open the active row's fly-out; keyboard opens move focus into it. */
  private openSub(withFocus: boolean): void {
    this.subFocusOnOpen = withFocus;
    this.openSubIndex.set(this.activeIndex());
  }

  private move(dir: 1 | -1): void {
    const items = this.items();
    if (!items.length) return;
    const next = (this.activeIndex() + dir + items.length) % items.length;
    this.openSubIndex.set(null);
    this.focusItem(next);
  }

  protected onHover(i: number): void {
    this.activeIndex.set(i);
    const opt = this.items()[i];
    this.subFocusOnOpen = false; // hover previews only — focus stays where it is
    this.openSubIndex.set(opt?.children?.length ? i : null);
  }

  protected onLeave(i: number): void {
    if (this.openSubIndex() !== i) return;
    // Don't collapse a fly-out the keyboard is still inside.
    const sub = this.el.nativeElement.querySelector('.strct-csc__subpanel');
    if (sub?.contains(document.activeElement)) return;
    this.openSubIndex.set(null);
  }

  protected onItemClick(opt: StrctCascadeOption, i: number, event: Event): void {
    event.stopPropagation();
    if (opt.children?.length) {
      // Group rows only toggle their fly-out; the click keeps focus on the row.
      this.subFocusOnOpen = false;
      this.openSubIndex.set(this.openSubIndex() === i ? null : i);
      this.focusItem(i);
    } else {
      this.host.pick(opt.value);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const opt = this.items()[this.activeIndex()];
    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        this.move(-1);
        break;
      case 'Home':
        event.preventDefault();
        event.stopPropagation();
        this.focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        event.stopPropagation();
        this.focusItem(this.items().length - 1);
        break;
      case 'ArrowRight':
        if (opt?.children?.length) {
          event.preventDefault();
          event.stopPropagation();
          this.openSub(true);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        event.stopPropagation();
        if (this.openSubIndex() != null) this.closeSub();
        else if (this.submenu()) this.back.emit();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        if (opt?.children?.length) this.openSub(true);
        else if (opt) this.host.pick(opt.value);
        break;
      case 'Escape':
        // Consumed here (stopPropagation) so a host modal/drawer with its own
        // document listener doesn't also see the Escape the panel consumed.
        event.preventDefault();
        event.stopPropagation();
        this.close.emit();
        break;
      case 'Tab':
        // No preventDefault: the panel closes and focus moves on naturally.
        this.close.emit();
        break;
    }
  }
}

/**
 * Hierarchical single-select — pick a leaf from nested groups (e.g. a port
 * group under a virtual switch). CVA-compatible.
 *   <strct-cascade-select [options]="switches" [(ngModel)]="portGroup" />
 *
 * Keyboard: ArrowDown/Enter/Space open from the trigger; inside the panel
 * arrows rove, ArrowRight opens a group's fly-out, ArrowLeft backs out,
 * Home/End jump, Enter/Space pick a leaf, Escape/Tab close. Focus returns to
 * the trigger on close.
 */
@Component({
  selector: 'strct-cascade-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctCascadeColumn, StrctIcon, StrctOverlay],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctCascadeSelect), multi: true },
    { provide: StrctCascadeHost, useExisting: forwardRef(() => StrctCascadeSelect) },
  ],
  template: `
    <button
      #trigger
      type="button"
      class="strct-control strct-cs__trigger"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [disabled]="isDisabled()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <span class="strct-cs__value" [class.strct-cs__value--empty]="!selectedLabel()">
        {{ selectedLabel() || placeholder() }}
      </span>
      <strct-icon class="strct-cs__caret" name="chevronDown" [size]="14" />
    </button>
    @if (open()) {
      <strct-cascade-column
        class="strct-cs__panel"
        [strctOverlay]="trigger"
        strctOverlayPlacement="bottom-start"
        [items]="options()"
        (close)="closePanel()"
      />
    }
  `,
  host: { class: 'strct-cs' },
  styles: [
    `
      .strct-cs {
        position: relative;
        display: inline-block;
        width: 100%;
      }
      /* The trigger is a real button wearing the shared control skin — flex so
         the value truncates and the caret keeps its corner. */
      .strct-cs__trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        text-align: start;
        cursor: pointer;
      }
      .strct-cs__trigger:disabled {
        cursor: not-allowed;
      }
      .strct-cs__value {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .strct-cs__value--empty {
        color: var(--t3);
      }
      .strct-cs__caret {
        flex: none;
        color: var(--t3);
      }
      /* Positioned by StrctOverlay (position: fixed, set inline). */
      .strct-cs__panel {
        z-index: var(--z-dropdown);
        min-width: 180px;
      }
    `,
  ],
})
export class StrctCascadeSelect extends StrctCascadeHost implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Available options. */
  readonly options = input<StrctCascadeOption[]>([]);
  /** Placeholder text when empty (localizable). */
  readonly placeholder = input('Select…');
  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Value identity check — override to match object values coming from a form
   * (e.g. by id) instead of the default reference equality.
   */
  readonly compareWith = input<(a: unknown, b: unknown) => boolean>((a, b) => a === b);

  readonly value = signal<unknown>(null);
  readonly open = signal(false);
  /** Disabled state pushed by the forms API (setDisabledState). */
  private readonly cvaDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly selectedLabel = computed(() => this.findLabel(this.options(), this.value()));

  /** Element focused before the panel opened — focus returns here on close. */
  private restoreTo: HTMLElement | null = null;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.isDisabled()) return;
    if (this.open()) this.closePanel();
    else this.openPanel();
  }

  openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.restoreTo = saveFocusedElement();
    this.open.set(true);
  }

  closePanel(): void {
    if (!this.open()) return;
    this.open.set(false);
    restoreFocus(this.restoreTo);
    this.restoreTo = null;
  }

  /**
   * ArrowDown/Enter/Space open the panel from the trigger. preventDefault so
   * Space doesn't scroll the page and Enter/Space don't also fire the native
   * button click (which would toggle the panel straight back shut).
   */
  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openPanel();
    }
  }

  override pick(value: unknown): void {
    this.value.set(value);
    this.closePanel();
    this.onChange(value);
    this.onTouched();
  }

  override isSelected(value: unknown): boolean {
    return value !== undefined && this.compareWith()(value, this.value());
  }

  private findLabel(opts: StrctCascadeOption[], value: unknown): string {
    for (const o of opts) {
      if (o.value !== undefined && this.compareWith()(o.value, value)) return o.label;
      if (o.children) {
        const found = this.findLabel(o.children, value);
        if (found) return found;
      }
    }
    return '';
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      // Focus already went to the click target — just close, don't restore it.
      this.open.set(false);
      this.restoreTo = null;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.open()) return;
    // Fallback for focus outside the panel (in-panel Escape is consumed by the
    // column first). stopImmediatePropagation so a host modal/drawer with its
    // own document listener doesn't also see the Escape the panel consumed.
    event.stopImmediatePropagation();
    this.closePanel();
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
    this.cvaDisabled.set(isDisabled);
  }
}
