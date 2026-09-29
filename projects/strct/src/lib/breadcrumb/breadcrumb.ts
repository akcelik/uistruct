import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
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
  template: `<span
    class="strct-bc__crumb"
    [attr.role]="interactive() ? 'button' : null"
    [attr.tabindex]="interactive() ? 0 : null"
    (click)="onActivate()"
    (keydown.enter)="onActivate()"
    (keydown.space)="$event.preventDefault(); onActivate()"
    ><ng-content
  /></span>`,
  host: {
    class: 'strct-bc__item',
    role: 'listitem',
    '[class.strct-bc__item--current]': 'current()',
    '[class.strct-bc__item--interactive]': 'interactive()',
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
      /* A crumb that does not route is still a crumb: it stays a tab stop and
         answers Enter / Space, rather than being an <a> with a click handler
         and no href, which no keyboard can reach. */
      .strct-bc__item--interactive .strct-bc__crumb {
        cursor: pointer;
        border-radius: var(--radius-sm);
      }
      .strct-bc__item--interactive:hover .strct-bc__crumb {
        color: var(--acc);
        text-decoration: underline;
      }
      .strct-bc__crumb:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 2px;
      }
    `,
  ],
})
export class StrctBreadcrumbItem {
  /** Mark as the current page. */
  readonly current = input(false, { transform: booleanAttribute });
  /**
   * The crumb itself is the control — for a trail that does not route, such as
   * a folder path. It is stated rather than inferred from `(activated)` having
   * a listener, which Angular's output API does not expose;
   * `strct-list-item` and `strct-tag` read the same way.
   */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** Emitted when an `interactive` crumb is activated (click / Enter / Space). */
  readonly activated = output<void>();

  protected onActivate(): void {
    if (this.interactive()) this.activated.emit();
  }
}
