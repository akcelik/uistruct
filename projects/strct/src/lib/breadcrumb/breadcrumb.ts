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
  template: `<ng-content />`,
  host: { class: 'strct-bc', role: 'navigation', 'aria-label': 'Breadcrumb' },
  styles: [
    `
      .strct-bc {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px;
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
export class StrctBreadcrumb {}

/** One crumb. Mark the final one `current`. */
@Component({
  selector: 'strct-breadcrumb-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: {
    class: 'strct-bc__item',
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
