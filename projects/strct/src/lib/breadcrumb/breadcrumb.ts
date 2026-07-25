import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

/** Breadcrumb trail container. Wraps `<strct-breadcrumb-item>` children. */
@Component({
  selector: 'strct-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ol class="strct-bc__list">
    <ng-content />
  </ol>`,
  host: { class: 'strct-bc', role: 'navigation', '[attr.aria-label]': 'regionLabel()' },
  styles: [
    `
      .strct-bc__list {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px;
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 13px;
      }
      .strct-bc__item:not(:last-child)::after {
        content: '/';
        margin: 0 8px;
        color: var(--t3);
        font-weight: 400;
      }
    `,
  ],
})
export class StrctBreadcrumb {
  /** Accessible label for the navigation region (localizable). */
  readonly regionLabel = input('Breadcrumb');
}

/** One crumb. Mark the final one `current`. */
@Component({
  selector: 'strct-breadcrumb-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: {
    class: 'strct-bc__item',
    role: 'listitem',
    '[class.strct-bc__item--current]': 'current()',
    '[attr.aria-current]': "current() ? 'page' : null",
  },
  styles: [
    `
      .strct-bc__item {
        display: inline-flex;
        align-items: center;
        color: var(--t2);
      }
      .strct-bc__item a {
        color: var(--t2);
        text-decoration: none;
      }
      .strct-bc__item a:hover {
        color: var(--acc);
        text-decoration: none;
      }
      .strct-bc__item--current {
        color: var(--t1);
        font-weight: 600;
      }
    `,
  ],
})
export class StrctBreadcrumbItem {
  /** Mark as the current page. */
  readonly current = input(false, { transform: booleanAttribute });
}
