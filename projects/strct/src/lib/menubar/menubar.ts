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
 * Click (or Enter/Down) opens a menu; Left/Right move across the bar and,
 * while open, switch the open menu (the APG menubar convention). Escape and
 * outside click close. `(picked)` carries `{ menu, item }`.
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
            <div class="strct-mb__menu" role="menu" [attr.aria-label]="menu.label">
              @for (item of menu.items; track $index) {
                @if (item.divider) {
                  <div class="strct-mb__divider" role="separator"></div>
                } @else {
                  <button
                    type="button"
                    class="strct-mb__item"
                    role="menuitem"
                    [class.strct-mb__item--critical]="item.critical"
                    [disabled]="item.disabled || null"
                    (click)="pick(menu, item)"
                  >
                    @if (item.icon) {
                      <strct-icon [name]="item.icon" [size]="13" />
                    }
                    {{ item.label }}
                  </button>
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
        border-radius: 7px;
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
        z-index: 200;
        min-width: 180px;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 7px;
        box-shadow: var(--shh);
        display: flex;
        flex-direction: column;
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

  protected toggleMenu(id: string, i: number): void {
    this.focusIdx.set(i);
    this.openId.set(this.openId() === id ? null : id);
  }

  protected pick(menu: StrctMenubarItem, item: StrctMenuItem): void {
    if (item.disabled) return;
    this.openId.set(null);
    this.picked.emit({ menu, item });
  }

  protected onTopKey(event: KeyboardEvent, i: number): void {
    const menus = this.menus();
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const dir = event.key === 'ArrowRight' ? 1 : -1;
      const next = (i + dir + menus.length) % menus.length;
      this.focusIdx.set(next);
      // While a menu is open, moving across the bar switches the open menu.
      if (this.openId()) this.openId.set(menus[next].id);
      setTimeout(() => {
        const tops = this.host.nativeElement.querySelectorAll<HTMLElement>('.strct-mb__top');
        tops[next]?.focus();
      });
    } else if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
      this.openId.set(menus[i].id);
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.openId() && !this.host.nativeElement.contains(event.target as Node)) {
      this.openId.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.openId.set(null);
  }
}
