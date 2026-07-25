import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  booleanAttribute,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctOverlay } from '../overlay/overlay';

/**
 * Click-to-open menu:
 *   <strct-dropdown align="end">
 *     <button strct-button strctDropdownTrigger>Actions</button>
 *     <strct-dropdown-item>Rename</strct-dropdown-item>
 *     <strct-dropdown-item critical>Delete</strct-dropdown-item>
 *   </strct-dropdown>
 *
 * With `popover`, the panel holds *form controls* instead of menu items: an
 * inner click no longer closes it (only outside click / Escape do), and the
 * semantics switch from `role="menu"` to a labeled `role="dialog"` — a panel
 * of selects is not a menu to a screen reader either:
 *
 *   <strct-dropdown popover popoverLabel="Filters">
 *     <button strct-button strctDropdownTrigger>Filters</button>
 *     <strct-field label="Severity">…</strct-field>
 *   </strct-dropdown>
 */
@Component({
  selector: 'strct-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctOverlay],
  template: `
    <!--
      The wrapper is intentionally inert: the projected trigger should be a
      real button (nesting interactives fails axe). Its native click —
      pointer or Enter/Space — bubbles here; the strctDropdownTrigger
      directive puts aria-haspopup/aria-expanded on the button itself.
    -->
    <div #trigger class="strct-dd__trigger" (click)="toggle()">
      <ng-content select="[strctDropdownTrigger]" />
    </div>
    <!--
      One panel for both modes (a default ng-content per @if branch would strand
      the projected content in the inactive branch) — mode picks the semantics.
    -->
    @if (open()) {
      <div
        class="strct-dd__menu"
        [class.strct-dd__menu--popover]="popover()"
        [strctOverlay]="trigger"
        [strctOverlayPlacement]="align() === 'end' ? 'bottom-end' : 'bottom-start'"
        [attr.role]="popover() ? 'dialog' : 'menu'"
        [attr.aria-label]="popover() ? popoverLabel() : null"
        [attr.tabindex]="popover() ? -1 : 0"
        (click)="onInnerActivate($event)"
        (keydown)="onMenuKeydown($event)"
      >
        <ng-content />
      </div>
    }
  `,
  host: { class: 'strct-dd' },
  styles: [
    `
      .strct-dd {
        position: relative;
        display: inline-block;
      }
      .strct-dd__trigger {
        display: inline-flex;
      }
      .strct-dd__menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        z-index: var(--z-dropdown);
        min-width: 170px;
        max-width: calc(100vw - 24px);
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        box-shadow: var(--shh);
        animation: strct-dd-in 0.1s ease;
      }
      .strct-dd__menu--end {
        left: auto;
        right: 0;
      }
      /* Popover panels hold form controls — roomier padding, no item hover. */
      .strct-dd__menu--popover {
        min-width: 240px;
        padding: 12px 14px;
      }
      @keyframes strct-dd-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
      }
    `,
  ],
})
export class StrctDropdown {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Horizontal alignment of the menu. */
  readonly align = input<'start' | 'end'>('start');
  /**
   * Popover mode for panels holding form controls (filter/settings panels):
   * inner clicks never close the panel — only outside click / Escape do —
   * and it renders as a labeled `role="dialog"` instead of a menu.
   */
  readonly popover = input(false, { transform: booleanAttribute });
  /** Accessible name of the popover dialog (localizable). */
  readonly popoverLabel = input('Filters');
  readonly open = signal(false);

  constructor() {
    // The static `popover` attribute collides with the native HTML Popover
    // API: the UA styles [popover] hosts (Canvas background, medium border,
    // fixed positioning) — a white frame around the trigger in dark themes.
    // Angular has already read the input by now; the DOM attribute must go.
    this.host.nativeElement.removeAttribute('popover');
  }

  /** Where focus was when the menu opened — restored on Escape/selection. */
  private lastFocused: HTMLElement | null = null;

  toggle(): void {
    const willOpen = !this.open();
    if (willOpen) this.lastFocused = document.activeElement as HTMLElement | null;
    this.open.set(willOpen);
    if (willOpen && !this.popover()) this.focusInitialItem();
  }

  /** Open (if closed) and move focus into the menu — ArrowDown on the trigger. */
  openMenu(): void {
    if (this.open()) return;
    this.lastFocused = document.activeElement as HTMLElement | null;
    this.open.set(true);
    if (!this.popover()) this.focusInitialItem();
  }

  close(restoreFocus = false): void {
    this.open.set(false);
    if (restoreFocus) this.lastFocused?.focus?.();
  }

  /**
   * Menu mode closes ONLY on a real item activation — a click that lands on
   * the menu's padding or a divider (a 2px miss) keeps it open instead of
   * throwing the whole interaction away. Popover form controls never close.
   */
  protected onInnerActivate(event: Event): void {
    if (this.popover()) return;
    const item = (event.target as HTMLElement | null)?.closest('strct-dropdown-item');
    if (item && item.getAttribute('aria-disabled') !== 'true') this.close(true);
  }

  /** APG menu keyboarding: arrows rove, Home/End jump, Enter/Space activate. */
  protected onMenuKeydown(event: KeyboardEvent): void {
    if (this.popover()) return;
    const items = this.enabledItems();
    if (!items.length) return;
    const idx = items.indexOf(event.target as HTMLElement);
    const key = event.key;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      const next =
        idx === -1
          ? key === 'ArrowDown'
            ? 0
            : items.length - 1
          : (idx + (key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      items[key === 'Home' ? 0 : items.length - 1].focus();
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      (event.target as HTMLElement).click();
    } else if (key === 'Tab') {
      this.close();
    }
  }

  private enabledItems(): HTMLElement[] {
    return [
      ...this.host.nativeElement.querySelectorAll<HTMLElement>(
        'strct-dropdown-item:not([aria-disabled="true"]), strct-submenu .strct-submenu__trigger',
      ),
    ];
  }

  /** Focus the selected item if there is one, else the first — after render. */
  private focusInitialItem(): void {
    setTimeout(() => {
      const items = this.enabledItems();
      (items.find((i) => i.getAttribute('aria-checked') === 'true') ?? items[0])?.focus();
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.close(true);
  }
}

/**
 * Marks (and upgrades) the dropdown's trigger element. The attribute alone is
 * enough for content projection; importing the directive additionally wires
 * `aria-haspopup` / `aria-expanded` onto the real button.
 */
@Directive({
  selector: '[strctDropdownTrigger]',
  host: {
    '[attr.aria-haspopup]': "dd ? (dd.popover() ? 'dialog' : 'menu') : null",
    '[attr.aria-expanded]': 'dd ? dd.open() : null',
    '(keydown.arrowdown)': 'onArrowDown($event)',
  },
})
export class StrctDropdownTrigger {
  protected readonly dd = inject(StrctDropdown, { optional: true });

  protected onArrowDown(event: Event): void {
    if (!this.dd || this.dd.popover()) return;
    event.preventDefault();
    this.dd.openMenu();
  }
}

/** A selectable row inside a `<strct-dropdown>`. */
@Component({
  selector: 'strct-dropdown-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `@if (selected() !== null) {
      <span class="strct-dd__check" aria-hidden="true">
        @if (selected()) {
          <strct-icon strictName="check" [size]="12" [strokeWidth]="1.8" />
        }
      </span>
    }
    <ng-content />`,
  host: {
    class: 'strct-dd__item',
    '[attr.role]': "selected() === null ? 'menuitem' : 'menuitemradio'",
    '[attr.aria-checked]': 'selected()',
    '[attr.tabindex]': 'disabled() ? null : -1',
    '[class.strct-dd__item--critical]': 'critical()',
    '[class.strct-dd__item--selected]': 'selected() === true',
    '[attr.aria-disabled]': 'disabled() || null',
  },
  styles: [
    `
      .strct-dd__item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
      }
      .strct-dd__item:hover,
      .strct-dd__item:focus-visible {
        background: var(--bg-3);
        outline: none;
      }
      /* Selectable items (selected bound): a fixed lead slot keeps labels
         aligned; the check marks the current choice when reopening. */
      .strct-dd__check {
        display: inline-flex;
        width: 14px;
        flex: none;
        color: var(--acc);
      }
      .strct-dd__item--selected {
        color: var(--t1);
        font-weight: 600;
        background: var(--acc-s);
      }
      .strct-dd__item--critical {
        color: var(--critical);
      }
      .strct-dd__item--critical:hover {
        background: var(--critical-bg);
      }
      .strct-dd__item[aria-disabled='true'] {
        color: var(--t4);
        pointer-events: none;
      }
    `,
  ],
})
export class StrctDropdownItem {
  /**
   * Select-like usage: bind `selected` and the item becomes a
   * `menuitemradio` with `aria-checked`, a leading ✓ on the current choice
   * and an aligned lead slot — so reopening the menu shows what is chosen.
   * Leave unbound for plain action items.
   */
  readonly selected = input<boolean | null>(null);
  /** Danger. */
  readonly critical = input(false, { transform: booleanAttribute });
  /** Static disable flag. */
  readonly disabled = input(false, { transform: booleanAttribute });
}

/** Thin separator between groups of menu items. */
@Component({
  selector: 'strct-dropdown-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '',
  host: { class: 'strct-dd__divider', role: 'separator' },
  styles: [
    `
      .strct-dd__divider {
        display: block;
        height: 1px;
        margin: 4px 6px;
        background: var(--b2);
      }
    `,
  ],
})
export class StrctDropdownDivider {}
