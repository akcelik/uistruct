import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctMenuItem } from '../context-menu/menu';
import { focusFirstIn, restoreFocus, saveFocusedElement } from '../overlay/focus';

/** One top-level menubar entry with its menu. */
export interface StrctMenubarItem {
  id: string;
  label: string;
  items: StrctMenuItem[];
}

/**
 * Horizontal menubar — the application-menu strip ("File · Edit · View") for
 * dense tool-style consoles:
 *
 *   <strct-menubar [menus]="menus" (picked)="run($event)" />
 *
 * Click (or Enter/Down) opens a menu and focus moves into it; Left/Right move
 * across the bar and, while open, switch the open menu (the APG menubar
 * convention). Up/Down (+Home/End) rove the open menu, Right/Left enter and
 * leave an item's one-level `children` submenu. Escape and outside click
 * close, returning focus to the bar. `(picked)` carries `{ menu, item }`.
 */
@Component({
  selector: 'strct-menubar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <div class="strct-mb" role="menubar" [attr.aria-label]="ariaLabel()">
      @for (menu of menus(); track menu.id; let i = $index) {
        <div class="strct-mb__wrap">
          <button
            type="button"
            class="strct-mb__top"
            role="menuitem"
            [class.strct-mb__top--open]="openId() === menu.id"
            [attr.aria-haspopup]="'menu'"
            [attr.aria-expanded]="openId() === menu.id"
            [attr.tabindex]="i === focusIdx() ? 0 : -1"
            (click)="toggleMenu(menu.id, i)"
            (keydown)="onTopKey($event, i)"
          >
            {{ menu.label }}
          </button>
          @if (openId() === menu.id) {
            <div
              class="strct-mb__menu"
              role="menu"
              tabindex="-1"
              [attr.aria-label]="menu.label"
              (keydown)="onMenuKey($event, menu)"
            >
              @for (item of menu.items; track $index; let i = $index) {
                @if (item.divider) {
                  <div class="strct-mb__divider" role="separator"></div>
                } @else {
                  <div class="strct-mb__row">
                    <button
                      type="button"
                      class="strct-mb__item"
                      role="menuitem"
                      [attr.data-idx]="i"
                      [class.strct-mb__item--critical]="item.critical"
                      [attr.aria-haspopup]="item.children?.length ? 'menu' : null"
                      [attr.aria-expanded]="item.children?.length ? subIdx() === i : null"
                      [disabled]="item.disabled || null"
                      (click)="onItemClick(menu, item, i)"
                      (mouseenter)="onItemHover(item, i)"
                    >
                      @if (item.icon) {
                        <strct-icon [name]="item.icon" [size]="13" />
                      }
                      {{ item.label }}
                      @if (item.children?.length) {
                        <strct-icon class="strct-mb__caret" name="chevronRight" [size]="12" />
                      }
                    </button>
                    @if (subIdx() === i && item.children?.length) {
                      <div class="strct-mb__submenu" role="menu" [attr.aria-label]="item.label">
                        @for (sub of item.children ?? []; track $index) {
                          @if (sub.divider) {
                            <div class="strct-mb__divider" role="separator"></div>
                          } @else {
                            <button
                              type="button"
                              class="strct-mb__item strct-mb__subitem"
                              role="menuitem"
                              [class.strct-mb__item--critical]="sub.critical"
                              [disabled]="sub.disabled || null"
                              (click)="pick(menu, sub)"
                            >
                              @if (sub.icon) {
                                <strct-icon [name]="sub.icon" [size]="13" />
                              }
                              {{ sub.label }}
                            </button>
                          }
                        }
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .strct-mb {
        display: inline-flex;
        gap: 2px;
        padding: 2px;
        background: var(--bg-2);
        border: 1px solid var(--b1);
        border-radius: var(--radius-md);
      }
      .strct-mb__wrap {
        position: relative;
      }
      .strct-mb__top {
        padding: 4px 11px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t1);
        font-family: var(--font);
        font-size: 12.5px;
        cursor: pointer;
        white-space: nowrap;
      }
      .strct-mb__top:hover,
      .strct-mb__top--open {
        background: var(--bg-3);
      }
      .strct-mb__top:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-mb__menu {
        position: absolute;
        top: calc(100% + 4px);
        inset-inline-start: 0;
        z-index: var(--z-dropdown);
        min-width: 180px;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        box-shadow: var(--shh);
        display: flex;
        flex-direction: column;
      }
      .strct-mb__menu:focus {
        outline: none;
      }
      .strct-mb__item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 6px 10px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t1);
        font-family: var(--font);
        font-size: 12.5px;
        text-align: start;
        cursor: pointer;
        white-space: nowrap;
      }
      .strct-mb__item:hover:not(:disabled) {
        background: var(--bg-3);
      }
      .strct-mb__item--critical {
        color: var(--critical);
      }
      .strct-mb__item--critical:hover:not(:disabled) {
        background: var(--critical-bg);
      }
      .strct-mb__item:disabled {
        color: var(--t4);
        cursor: default;
      }
      .strct-mb__item:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-mb__divider {
        height: 1px;
        margin: 4px 6px;
        background: var(--b2);
      }
      .strct-mb__row {
        position: relative;
      }
      .strct-mb__caret {
        margin-inline-start: auto;
        color: var(--t3);
      }
      /* RTL: point the submenu caret toward the fly-out. */
      [dir='rtl'] .strct-mb__caret {
        transform: rotate(180deg);
      }
      .strct-mb__submenu {
        position: absolute;
        top: -5px;
        inset-inline-start: calc(100% + 2px);
        z-index: var(--z-base);
        min-width: 160px;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        box-shadow: var(--shh);
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class StrctMenubar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Top-level menus. */
  readonly menus = input.required<StrctMenubarItem[]>();
  /** Accessible name of the bar (localizable). */
  readonly ariaLabel = input('Application menu');
  /** A menu entry was chosen. */
  readonly picked = output<{ menu: StrctMenubarItem; item: StrctMenuItem }>();

  protected readonly openId = signal<string | null>(null);
  protected readonly focusIdx = signal(0);
  /** Index of the item whose one-level submenu is open. */
  protected readonly subIdx = signal<number | null>(null);
  /** Top-level button that opened the menu — focus returns here on close. */
  private trigger: HTMLElement | null = null;

  protected toggleMenu(id: string, i: number): void {
    this.focusIdx.set(i);
    if (this.openId() === id) {
      this.closeMenu(false);
    } else {
      this.trigger = saveFocusedElement();
      this.openId.set(id);
      this.subIdx.set(null);
    }
  }

  protected onItemClick(menu: StrctMenubarItem, item: StrctMenuItem, i: number): void {
    if (item.disabled) return;
    if (item.children?.length) {
      this.subIdx.set(this.subIdx() === i ? null : i);
      return;
    }
    this.pick(menu, item);
  }

  protected onItemHover(item: StrctMenuItem, i: number): void {
    if (item.disabled) return;
    if (item.children?.length) this.subIdx.set(i);
    else if (this.subIdx() != null) this.subIdx.set(null);
  }

  protected pick(menu: StrctMenubarItem, item: StrctMenuItem): void {
    if (item.disabled) return;
    this.closeMenu(true);
    item.action?.(item.data);
    this.picked.emit({ menu, item });
  }

  protected onTopKey(event: KeyboardEvent, i: number): void {
    const menus = this.menus();
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (this.openId()) {
        // While a menu is open, moving across the bar switches the open menu.
        this.switchTop(event.key === 'ArrowRight' ? 1 : -1);
      } else {
        const dir = event.key === 'ArrowRight' ? 1 : -1;
        const next = (i + dir + menus.length) % menus.length;
        this.focusIdx.set(next);
        setTimeout(() => this.topButtons()[next]?.focus());
      }
    } else if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
      this.trigger = saveFocusedElement();
      this.openId.set(menus[i].id);
      this.subIdx.set(null);
      setTimeout(() => {
        const menuEl = this.host.nativeElement.querySelector<HTMLElement>('.strct-mb__menu');
        if (menuEl) focusFirstIn(menuEl);
      });
    } else if (event.key === 'Escape' && this.openId()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeMenu(true);
    }
  }

  protected onMenuKey(event: KeyboardEvent, menu: StrctMenubarItem): void {
    const active = document.activeElement as HTMLElement | null;
    const inSub = !!active?.classList.contains('strct-mb__subitem');
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        event.stopPropagation();
        const list = this.navButtons(inSub);
        const dir = event.key === 'ArrowDown' ? 1 : -1;
        const cur = list.indexOf(active as HTMLElement);
        list[(cur + dir + list.length) % list.length]?.focus();
        break;
      }
      case 'Home':
      case 'End': {
        event.preventDefault();
        event.stopPropagation();
        const list = this.navButtons(inSub);
        (event.key === 'Home' ? list[0] : list[list.length - 1])?.focus();
        break;
      }
      case 'ArrowRight': {
        if (inSub) break; // deepest level — nothing further to open
        event.preventDefault();
        event.stopPropagation();
        const idx = Number(active?.getAttribute('data-idx'));
        if (menu.items[idx]?.children?.length) {
          this.subIdx.set(idx);
          setTimeout(() => this.navButtons(true)[0]?.focus());
        } else {
          this.switchTop(1);
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        event.stopPropagation();
        if (inSub) {
          const parent = this.subIdx();
          this.subIdx.set(null);
          this.host.nativeElement
            .querySelector<HTMLElement>(`.strct-mb__item[data-idx="${parent}"]`)
            ?.focus();
        } else if (this.subIdx() != null) {
          this.subIdx.set(null);
        } else {
          this.switchTop(-1);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        event.stopPropagation();
        this.closeMenu(true);
        break;
      }
    }
  }

  /** Switch the open menu to the next/previous top-level entry; focus follows. */
  private switchTop(dir: 1 | -1): void {
    const menus = this.menus();
    const next = (this.focusIdx() + dir + menus.length) % menus.length;
    this.focusIdx.set(next);
    this.openId.set(menus[next].id);
    this.subIdx.set(null);
    setTimeout(() => this.topButtons()[next]?.focus());
  }

  private closeMenu(returnFocus: boolean): void {
    this.openId.set(null);
    this.subIdx.set(null);
    if (returnFocus) restoreFocus(this.trigger);
    this.trigger = null;
  }

  private topButtons(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.strct-mb__top'));
  }

  /** Enabled item buttons of the open menu — either its items or the open submenu's. */
  private navButtons(sub: boolean): HTMLElement[] {
    const menuEl = this.host.nativeElement.querySelector('.strct-mb__menu');
    if (!menuEl) return [];
    const sel = sub
      ? '.strct-mb__subitem:not([disabled])'
      : '.strct-mb__item:not([disabled]):not(.strct-mb__subitem)';
    return Array.from(menuEl.querySelectorAll<HTMLElement>(sel));
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.openId() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenu(false);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.openId()) return;
    event.stopPropagation();
    this.closeMenu(true);
  }
}
