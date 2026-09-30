import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, model } from '@angular/core';
import { StrctIcon } from '../icon/icon';

/** Vertical container for `<strct-accordion-panel>` items. */
@Component({
  selector: 'strct-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-accordion' },
  styles: [
    `
      .strct-accordion {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--b2);
        border-radius: 8px;
        overflow: hidden;
        background: var(--bg-1);
      }
    `,
  ],
})
export class StrctAccordion {}

let accordionCounter = 0;

/** Collapsible panel with a header. `expanded` is two-way bindable. */
@Component({
  selector: 'strct-accordion-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <button
      type="button"
      class="strct-acc__head"
      [id]="headId"
      [attr.aria-expanded]="expanded()"
      [attr.aria-controls]="bodyId"
      (click)="toggle()"
    >
      <span class="strct-acc__chevron" [class.strct-acc__chevron--open]="expanded()">
        <strct-icon name="chevronRight" [size]="13" [strokeWidth]="1.7" />
      </span>
      <span class="strct-acc__title">{{ heading() }}</span>
    </button>
    @if (expanded()) {
      <div class="strct-acc__body" [id]="bodyId" role="region" [attr.aria-labelledby]="headId">
        <ng-content />
      </div>
    }
  `,
  host: {
    class: 'strct-acc',
    '[class.strct-acc--quiet]': "appearance() === 'quiet'",
  },
  styles: [
    `
      .strct-acc {
        display: block;
      }
      /* Hairline divider joins consecutive panels into one stacked surface. */
      .strct-acc + .strct-acc {
        border-top: 1px solid var(--b2);
      }
      .strct-acc__head {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        padding: 11px 14px;
        border: 0;
        background: transparent;
        cursor: pointer;
        font-family: var(--font);
        font-size: 13px;
        font-weight: 500;
        color: var(--t1);
        text-align: start;
      }
      .strct-acc__head:hover {
        background: var(--bg-3);
      }
      .strct-acc__chevron {
        display: inline-flex;
        color: var(--t3);
        transition: transform 0.16s ease;
      }
      .strct-acc__chevron--open {
        transform: rotate(90deg);
        color: var(--acc);
      }
      /* RTL: the collapsed chevron points toward the inline end (left).
         (Plain [dir='rtl'] because this component uses ViewEncapsulation.None.) */
      [dir='rtl'] .strct-acc__chevron:not(.strct-acc__chevron--open) {
        transform: rotate(180deg);
      }
      .strct-acc__title {
        flex: 1;
      }
      .strct-acc__body {
        padding: 4px 14px 14px;
        padding-inline-start: 32px;
        color: var(--t2);
        font-size: 13px;
        border-top: 1px solid var(--b1);
      }

      /* "How this works" is a quiet fold in running text — a one-line
         link-looking summary that opens in place, not a boxed accordion. It
         keeps the button + region semantics a raw <details> never had. */
      .strct-acc--quiet + .strct-acc--quiet {
        border-top: 0;
      }
      .strct-acc--quiet .strct-acc__head {
        width: auto;
        padding: 2px 0;
        gap: 6px;
        font-size: var(--text-sm);
        font-weight: 400;
        color: var(--t2);
      }
      .strct-acc--quiet .strct-acc__head:hover {
        background: none;
        color: var(--t1);
        text-decoration: underline;
      }
      .strct-acc--quiet .strct-acc__head:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 2px;
        border-radius: var(--radius-sm);
      }
      .strct-acc--quiet .strct-acc__title {
        flex: none;
      }
      .strct-acc--quiet .strct-acc__body {
        padding: 4px 0 8px;
        padding-inline-start: var(--space-3);
        border-top: 0;
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class StrctAccordionPanel {
  /** Panel heading. */
  readonly heading = input.required<string>();
  /** Whether the panel is open (two-way). */
  readonly expanded = model(false);
  /**
   * `quiet` is a fold in running text — no border or background, a `--text-sm`
   * summary in `--t2` with a chevron, the body indented. It reads like a raw
   * `<details>` while keeping the button + region semantics.
   */
  readonly appearance = input<'boxed' | 'quiet'>('boxed');

  protected readonly bodyId = `strct-acc-${++accordionCounter}`;
  protected readonly headId = `${this.bodyId}-head`;

  toggle(): void {
    this.expanded.update((v) => !v);
  }
}
