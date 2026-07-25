import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  signal,
  viewChild,
} from '@angular/core';
import { restoreFocus, saveFocusedElement } from '../overlay/focus';

/**
 * Right-click (context) menu. Wraps a trigger area and shows a menu at the
 * cursor. Reuse `strct-dropdown-item` for the entries:
 *   <strct-context-menu>
 *     <div>Right-click here</div>
 *     <ng-container strctContextMenuItems>
 *       <strct-dropdown-item>Open</strct-dropdown-item>
 *       <strct-dropdown-item critical>Delete</strct-dropdown-item>
 *     </ng-container>
 *   </strct-context-menu>
 *
 * Keyboard model mirrors `StrctMenuPanel` (menu.ts): focus moves into the
 * menu on open, Arrow/Home/End roam it, Enter/Space picks the active item,
 * Escape closes with stopPropagation, and focus returns to the trigger.
 *
 * @deprecated Prefer the data-driven `[strctContextMenu]` directive backed by
 * `StrctMenuService` (menu.ts) for new code — same visual menu, portaled into
 * `<body>`, with submenus and item actions.
 */
@Component({
  selector: 'strct-context-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-ctx__trigger" (contextmenu)="onContextMenu($event)">
      <ng-content />
    </div>
    @if (open()) {
      <!-- eslint-disable-next-line @angular-eslint/template/mouse-events-have-key-events -- hover only syncs the arrow anchor; keyboard roves focus directly. -->
      <div
        #menu
        class="strct-ctx__menu"
        role="menu"
        tabindex="-1"
        [style.left.px]="x()"
        [style.top.px]="y()"
        (click)="onMenuClick($event)"
        (contextmenu)="$event.preventDefault(); close()"
        (keydown)="onMenuKeydown($event)"
        (mouseover)="onMenuMouseOver($event)"
      >
        <ng-content select="[strctContextMenuItems]" />
      </div>
    }
  `,
  host: { class: 'strct-ctx' },
  styles: [
    `
      .strct-ctx {
        display: block;
      }
      .strct-ctx__menu {
        position: fixed;
        z-index: var(--z-overlay);
        min-width: 180px;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        box-shadow: var(--shh);
        animation: strct-ctx-in 0.1s ease;
      }
      @keyframes strct-ctx-in {
        from {
          opacity: 0;
          transform: scale(0.97);
        }
      }
    `,
  ],
})
export class StrctContextMenu {
  readonly open = signal(false);
  readonly x = signal(0);
  readonly y = signal(0);

  protected readonly menuEl = viewChild<ElementRef<HTMLElement>>('menu');
  /** Index within the navigable (non-disabled) items. */
  protected readonly activeIndex = signal(0);
  /** Element focused before opening — focus returns here on close. */
  private restoreTo: HTMLElement | null = null;

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.restoreTo = saveFocusedElement();
    this.x.set(event.clientX);
    this.y.set(event.clientY);
    this.activeIndex.set(0);
    this.open.set(true);
    // Defer past the render so clamping measures the real menu box (not a
    // guessed size) and focus can land on the first item.
    setTimeout(() => {
      this.clampToViewport();
      this.focusItem(0);
    });
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    // Hand focus back to the trigger (selection, Escape, Tab, outside click).
    restoreFocus(this.restoreTo);
    this.restoreTo = null;
  }

  /** Enabled `strct-dropdown-item` elements in DOM order. */
  private navItems(): HTMLElement[] {
    const el = this.menuEl()?.nativeElement;
    if (!el) return [];
    return Array.from(
      el.querySelectorAll<HTMLElement>('.strct-dd__item:not([aria-disabled="true"])'),
    );
  }

  /**
   * Focus-based roving: items keep the `tabindex="-1"` their host binding
   * sets (so Tab never stops mid-menu), the active element moves instead.
   */
  protected focusItem(i: number): void {
    const items = this.navItems();
    if (!items.length) return;
    const next = ((i % items.length) + items.length) % items.length;
    this.activeIndex.set(next);
    items[next].focus();
  }

  /** Re-position with the measured box so the menu stays inside the viewport. */
  private clampToViewport(): void {
    const el = this.menuEl()?.nativeElement;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const m = 6;
    const nx = Math.max(m, Math.min(this.x(), window.innerWidth - w - m));
    const ny = Math.max(m, Math.min(this.y(), window.innerHeight - h - m));
    this.x.set(nx);
    this.y.set(ny);
  }

  /** Close on a real item pick only — padding / divider misclicks keep the menu open. */
  protected onMenuClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.strct-dd__item')) this.close();
  }

  /** Keep the arrow-key anchor in sync with the hovered item. */
  protected onMenuMouseOver(event: MouseEvent): void {
    const item = (event.target as HTMLElement).closest('.strct-dd__item');
    if (!item) return;
    const i = this.navItems().indexOf(item as HTMLElement);
    if (i >= 0) this.activeIndex.set(i);
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    const items = this.navItems();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        this.focusItem(this.activeIndex() + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        this.focusItem(this.activeIndex() - 1);
        break;
      case 'Home':
        event.preventDefault();
        event.stopPropagation();
        this.focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        event.stopPropagation();
        this.focusItem(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        // Runs the item's own (click) wiring; onMenuClick then closes.
        items[this.activeIndex()]?.click();
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close();
        break;
      case 'Tab':
        // APG: Tab closes the menu — no preventDefault, so focus moves on
        // naturally once the panel (and the focus inside it) is gone.
        this.close();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (!this.open()) return;
    const el = this.menuEl()?.nativeElement;
    // Clicks inside the menu are handled (or deliberately ignored) by onMenuClick.
    if (el && !el.contains(event.target as Node)) this.close();
  }

  /** Fallback for focus landing outside the panel; in-panel Escape stops first. */
  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.open()) return;
    event.stopPropagation();
    this.close();
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.close();
  }
}
