import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

/** Follows the heading on its line — a badge, a count, a status dot. */
@Directive({ selector: '[strctSectionHeaderMeta]' })
export class StrctSectionHeaderMeta {}

/** Goes to the end of the heading row (the `strctPageHeaderActions` precedent). */
@Directive({ selector: '[strctSectionHeaderActions]' })
export class StrctSectionHeaderActions {}

/**
 * The title of a section within a page. `strct-page-header` is the page's `h1`
 * and `strct-card-header` needs a card; the section between the two had no
 * component, so consumers wrote an uppercase `h3` by hand — the single largest
 * source of hand-written CSS in the app this came from.
 *
 *   <strct-section-header heading="Proxy" description="How the appliance reaches the internet." [level]="3">
 *     <strct-badge strctSectionHeaderMeta status="success">Tested</strct-badge>
 *     <button strct-button strctSectionHeaderActions size="sm" variant="outline">Edit proxy…</button>
 *   </strct-section-header>
 *
 * `level` sets the element (`h2`–`h6`) and `appearance` sets the look, so the
 * document outline stays correct whatever the section is styled like.
 */
@Component({
  selector: 'strct-section-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-sech__row">
      <!-- One heading per level: a real h2–h6, not a div with a role. -->
      @switch (level()) {
        @case (2) {
          <h2 class="strct-sech__heading">{{ heading() }}</h2>
        }
        @case (3) {
          <h3 class="strct-sech__heading">{{ heading() }}</h3>
        }
        @case (4) {
          <h4 class="strct-sech__heading">{{ heading() }}</h4>
        }
        @case (5) {
          <h5 class="strct-sech__heading">{{ heading() }}</h5>
        }
        @default {
          <h6 class="strct-sech__heading">{{ heading() }}</h6>
        }
      }
      <div class="strct-sech__meta"><ng-content select="[strctSectionHeaderMeta]" /></div>
      <div class="strct-sech__actions"><ng-content select="[strctSectionHeaderActions]" /></div>
    </div>
    @if (description()) {
      <p class="strct-sech__description">{{ description() }}</p>
    }
    <ng-content />
  `,
  host: {
    class: 'strct-sech',
    '[class.strct-sech--overline]': "appearance() === 'overline'",
    '[class.strct-sech--divider]': 'divider()',
  },
  styles: [
    `
      .strct-sech {
        display: block;
        margin-block-start: var(--space-5);
        margin-block-end: var(--space-2);
      }
      .strct-sech:first-child {
        margin-block-start: 0;
      }
      .strct-sech--divider {
        padding-block-end: var(--space-2);
        border-block-end: 1px solid var(--b1);
      }
      .strct-sech__row {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .strct-sech__heading {
        margin: 0;
        font-size: var(--text-md);
        font-weight: 600;
        color: var(--t1);
      }
      /* Independent of level: the outline is the level, this is only the look. */
      .strct-sech--overline .strct-sech__heading {
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--t2);
      }
      .strct-sech__meta:empty,
      .strct-sech__actions:empty {
        display: none;
      }
      .strct-sech__meta {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .strct-sech__actions {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-wrap: wrap;
        /* Pushed to the end of the row, and wraps under it when narrow. */
        margin-inline-start: auto;
      }
      .strct-sech__description {
        margin: 4px 0 0;
        font-size: var(--text-sm);
        line-height: 1.5;
        color: var(--t3);
        max-width: 72ch;
      }
    `,
  ],
})
export class StrctSectionHeader {
  /** Section title. */
  readonly heading = input.required<string>();
  /** One line under the heading. */
  readonly description = input('');
  /** Heading level — the document outline, independent of `appearance`. */
  readonly level = input<2 | 3 | 4 | 5 | 6>(2);
  /** `title` — sentence case; `overline` — uppercase, letter-spaced, quieter. */
  readonly appearance = input<'title' | 'overline'>('title');
  /** Hairline under the header, like `strct-page-header`. */
  readonly divider = input(false, { transform: booleanAttribute });
}
