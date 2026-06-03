import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/** Scrollable left sidebar surface. Holds the icon nav and/or a tree. */
@Component({
  selector: 'strct-vertical-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-vnav' },
  styles: [
    `
    .strct-vnav {
      display: flex; flex-direction: column; width: 264px; flex-shrink: 0;
      background: var(--bg-1); border-right: 1px solid var(--b2);
      overflow: hidden;
    }
    `,
  ],
})
export class StrctVerticalNav {}

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
      display: flex; align-items: center; gap: 4px; padding: 8px 10px;
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
      display: inline-flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border-radius: 7px; cursor: pointer;
      color: var(--t2); transition: background .14s ease, color .14s ease;
    }
    .strct-nav-item:hover { background: var(--bg-3); color: var(--t1); }
    .strct-nav-item--active { background: var(--acc-m); color: var(--acc); }
    .strct-nav-item:focus-visible { outline: 2px solid var(--acc50); outline-offset: 1px; }
    `,
  ],
})
export class StrctNavItem {
  readonly active = input(false);
  readonly label = input('');
}
