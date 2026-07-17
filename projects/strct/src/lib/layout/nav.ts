import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  inject,
} from '@angular/core';
import { StrctShellService } from './layout';

/** Scrollable left sidebar surface. Holds the icon nav and/or a tree. */
@Component({
  selector: 'strct-vertical-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (shell.mobileNavOpen()) {
      <div
        class="strct-vnav__backdrop"
        tabindex="0"
        role="button"
        aria-label="Close navigation"
        (click)="shell.mobileNavOpen.set(false)"
        (keydown.enter)="shell.mobileNavOpen.set(false)"
        (keydown.space)="shell.mobileNavOpen.set(false)"
      ></div>
    }
    <ng-content />
  `,
  host: {
    class: 'strct-vnav',
    '[class.strct-vnav--open]': 'shell.mobileNavOpen()',
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
      @media (max-width: 768px) {
        .strct-vnav {
          position: fixed;
          top: 0;
          inset-inline-start: 0;
          bottom: 0;
          z-index: 300;
          transform: translateX(-100%);
          transition: transform 0.2s ease;
        }
        [dir='rtl'] .strct-vnav {
          transform: translateX(100%);
        }
        .strct-vnav--open,
        [dir='rtl'] .strct-vnav--open {
          transform: translateX(0);
        }
        .strct-vnav__backdrop {
          position: fixed;
          inset: 0;
          z-index: 299;
          background: rgba(0, 0, 0, 0.5);
          animation: strct-vnav-backdrop-in 0.2s ease;
        }
      }
      @media (min-width: 769px) {
        .strct-vnav__backdrop {
          display: none;
        }
      }
      @keyframes strct-vnav-backdrop-in {
        from {
          opacity: 0;
        }
      }
    `,
  ],
})
export class StrctVerticalNav {
  protected readonly shell = inject(StrctShellService);
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
  },
  styles: [
    `
      .strct-nav-item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 7px;
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
  readonly active = input(false);
  /** Label text. */
  readonly label = input('');
}
