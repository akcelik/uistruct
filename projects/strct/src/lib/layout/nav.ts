import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  effect,
  input,
  inject,
  untracked,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { focusFirstIn, keepTabInside, restoreFocus } from '../overlay/focus';
import { StrctShellService } from './layout';

/** Scrollable left sidebar surface. Holds the icon nav and/or a tree. */
@Component({
  selector: 'strct-vertical-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <!-- The backdrop is drawn by strct-shell. Here it was a fixed child of a
         transformed element, so its inset: 0 was the drawer's own box and its
         z-index put it above the drawer's content: the page beside the drawer
         was never dimmed, and every tap on the rail or the menu landed on the
         backdrop and closed the drawer. -->
    @if (closeButton()) {
      <!-- Only in drawer mode (CSS): on a wide screen the sidebar is just
           part of the page and has nothing to close. -->
      <button
        type="button"
        class="strct-vnav__close"
        [attr.aria-label]="closeLabel()"
        (click)="shell.closeNav()"
      >
        <strct-icon name="close" [size]="16" />
      </button>
    }
    <ng-content />
  `,
  host: {
    class: 'strct-vnav',
    '[id]': 'shell.navId',
    '[class.strct-vnav--open]': 'shell.mobileNavOpen()',
    '[style.--strct-vnav-drawer-max]': 'drawerMaxWidth() || null',
    '[attr.aria-modal]': 'trapped() ? "true" : null',
    '[attr.role]': 'trapped() ? "dialog" : null',
    '(document:keydown.escape)': 'onEscape()',
    '(keydown.tab)': 'onTab($event)',
    '(keydown.shift.tab)': 'onTab($event)',
  },
  styles: [
    `
      .strct-vnav {
        display: flex;
        flex-direction: column;
        width: 264px;
        flex-shrink: 0;
        background: var(--bg-1);
        border-inline-end: 1px solid var(--b2);
        overflow: hidden;
      }
      /* Not in the page's flow until the drawer is: a close control makes no
         sense on a sidebar that is simply part of the page. */
      .strct-vnav__close {
        display: none;
      }
      @media (max-width: 768px) {
        .strct-vnav {
          position: fixed;
          top: 0;
          inset-inline-start: 0;
          bottom: 0;
          z-index: var(--z-nav);
          transform: translateX(-100%);
          transition: transform 0.2s ease;
          /* The width an app picks for a desktop sidebar can be wider than a
             phone; leave enough of the page to tap the drawer away. */
          max-width: var(--strct-vnav-drawer-max, calc(100vw - 48px));
        }
        .strct-vnav__close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          align-self: flex-end;
          flex: none;
          width: 34px;
          height: 34px;
          margin: 8px 8px 0;
          border: 0;
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--t2);
          cursor: pointer;
        }
        .strct-vnav__close:hover {
          background: var(--bg-3);
          color: var(--t1);
        }
        [dir='rtl'] .strct-vnav {
          transform: translateX(100%);
        }
        .strct-vnav--open,
        [dir='rtl'] .strct-vnav--open {
          transform: translateX(0);
        }
      }
    `,
  ],
})
export class StrctVerticalNav {
  protected readonly shell = inject(StrctShellService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * How wide the drawer may get on a phone — only in drawer mode, so the
   * width an app sets for its desktop sidebar is untouched. The default
   * leaves 48px of page to tap the drawer away.
   */
  readonly drawerMaxWidth = input('');
  /**
   * Draw a close control at the drawer's top. Escape and the backdrop close
   * it too, but neither is visible, and a touch screen has no Escape.
   */
  readonly closeButton = input(false, { transform: booleanAttribute });
  /** The close control's accessible name (localisable). */
  readonly closeLabel = input('Close navigation');
  /**
   * Keep Tab inside the open drawer and move focus into it, the way a dialog
   * does. It is only ever on in drawer mode: a sidebar that is part of the
   * page must not trap anything.
   */
  readonly trapFocus = input(true, { transform: booleanAttribute });

  /** True while the drawer is open AND the viewport is in drawer mode. */
  protected trapped(): boolean {
    return this.shell.mobileNavOpen() && this.trapFocus() && this.isDrawer();
  }

  constructor() {
    // Opening the drawer without moving focus leaves the keyboard behind the
    // page it covers; closing it without handing focus back leaves it nowhere.
    effect(() => {
      const open = this.shell.mobileNavOpen();
      untracked(() => {
        if (!this.isDrawer()) return;
        if (open) {
          const el = this.host.nativeElement;
          // After the open class has painted, or the drawer is still
          // translated off-screen and focusing it scrolls the page.
          requestAnimationFrame(() => {
            if (!focusFirstIn(el)) {
              el.setAttribute('tabindex', '-1');
              el.focus();
            }
          });
        } else {
          restoreFocus(this.shell.drawerToggle);
        }
      });
    });
  }

  /** Closes the mobile nav on Escape. */
  protected onEscape(): void {
    if (this.shell.mobileNavOpen()) this.shell.closeNav();
  }

  protected onTab(event: Event): void {
    if (this.trapped()) keepTabInside(event as KeyboardEvent, this.host.nativeElement);
  }

  /**
   * The drawer breakpoint is the media query the styles use; matchMedia is
   * the only way the component can read it, and a server render has none.
   */
  private isDrawer(): boolean {
    return typeof matchMedia === 'function' ? matchMedia('(max-width: 768px)').matches : false;
  }
}

/** Horizontal strip of icon tabs (e.g. section switcher at the top of a sidebar). */
@Component({
  selector: 'strct-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-nav' },
  styles: [
    `
      .strct-nav {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 10px;
        border-bottom: 1px solid var(--b1);
      }
    `,
  ],
})
export class StrctNav {}

/** A single icon tab inside `<strct-nav>`. */
@Component({
  selector: 'strct-nav-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: {
    class: 'strct-nav-item',
    role: 'button',
    tabindex: '0',
    '[class.strct-nav-item--active]': 'active()',
    '[attr.title]': 'label() || null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-pressed]': 'active()',
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
  styles: [
    `
      .strct-nav-item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 3px;
        cursor: pointer;
        color: var(--t2);
        transition:
          background 0.14s ease,
          color 0.14s ease;
      }
      .strct-nav-item:hover {
        background: var(--bg-3);
        color: var(--t1);
      }
      .strct-nav-item--active {
        background: var(--acc-m);
        color: var(--acc);
      }
      .strct-nav-item:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
    `,
  ],
})
export class StrctNavItem {
  /** Whether the item is active / selected. */
  readonly active = input(false, { transform: booleanAttribute });
  /** Label text. */
  readonly label = input('');

  private readonly host = inject(ElementRef<HTMLElement>);

  /** Activates the item from the keyboard, like a native button. */
  protected activate(event: Event): void {
    event.preventDefault();
    this.host.nativeElement.click();
  }
}
