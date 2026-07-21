import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

/** Marks the breadcrumb row projected above the title. */
@Directive({ selector: '[strctPageHeaderCrumbs]' })
export class StrctPageHeaderCrumbs {}

/** Marks the action buttons aligned to the end of the title row. */
@Directive({ selector: '[strctPageHeaderActions]' })
export class StrctPageHeaderActions {}

/**
 * Page header — the top of every console object page: an optional breadcrumb
 * row, a title + subtitle, and actions aligned to the end. Default content
 * projects below the title row (status badges, meta strips).
 *
 *   <strct-page-header title="hv-02" subtitle="Hypervisor · cluster-01">
 *     <strct-breadcrumb strctPageHeaderCrumbs>…</strct-breadcrumb>
 *     <button strct-button strctPageHeaderActions variant="primary">Migrate</button>
 *   </strct-page-header>
 */
@Component({
  selector: 'strct-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-ph__crumbs"><ng-content select="[strctPageHeaderCrumbs]" /></div>
    <div class="strct-ph__row">
      <div class="strct-ph__text">
        <h1 class="strct-ph__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="strct-ph__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="strct-ph__actions"><ng-content select="[strctPageHeaderActions]" /></div>
    </div>
    <ng-content />
  `,
  host: {
    class: 'strct-ph',
    '[class.strct-ph--divider]': 'divider()',
  },
  styles: [
    `
      .strct-ph {
        display: block;
      }
      .strct-ph--divider {
        padding-bottom: 16px;
        border-bottom: 1px solid var(--b1);
      }
      .strct-ph__crumbs:empty {
        display: none;
      }
      .strct-ph__crumbs {
        margin-bottom: 6px;
      }
      .strct-ph__row {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
      }
      .strct-ph__text {
        flex: 1;
        min-width: 0;
      }
      .strct-ph__title {
        margin: 0;
        font-size: var(--text-2xl);
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--t1);
        text-wrap: balance;
      }
      .strct-ph__subtitle {
        margin: 6px 0 0;
        font-size: 13px;
        line-height: 1.55;
        color: var(--t2);
        max-width: 72ch;
      }
      .strct-ph__actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .strct-ph__actions:empty {
        display: none;
      }
    `,
  ],
})
export class StrctPageHeader {
  /** Page title (an h1). */
  readonly title = input.required<string>();
  /** One-line description under the title. */
  readonly subtitle = input('');
  /** Draw a hairline divider under the header. */
  readonly divider = input(false, { transform: booleanAttribute });
}
