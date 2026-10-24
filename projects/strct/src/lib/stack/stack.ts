import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/** Key/value definition list. Wraps `<strct-stack-item>` rows. */
@Component({
  selector: 'strct-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<dl class="strct-stack__list"><ng-content /></dl>`,
  host: { class: 'strct-stack' },
  styles: [
    `
      .strct-stack {
        display: block;
        border: 1px solid var(--b2);
        border-radius: 4px;
        overflow: hidden;
      }
      .strct-stack__list {
        margin: 0;
      }
    `,
  ],
})
export class StrctStack {}

/**
 * A label + value row. The value is projected content.
 *
 * Use **`<div strctStackItem>`** inside `strct-stack`: `<dl>` allows only
 * `dt` / `dd` pairs or `<div>` wrappers as children, so a custom element
 * between the list and its `dt` / `dd` breaks the content model (axe
 * `definition-list` / `dlitem`, both serious) — the BUG-49-05 fix
 * `strct-desc` got in 5.0.1. The element form still renders identically.
 *
 *   <strct-stack>
 *     <div strctStackItem label="Cluster">Prod-B</div>
 *   </strct-stack>
 */
@Component({
  selector: 'strct-stack-item, div[strctStackItem]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <dt class="strct-stack__label">{{ label() }}</dt>
    <dd class="strct-stack__value"><ng-content /></dd>
  `,
  host: { class: 'strct-stack__item' },
  styles: [
    `
      .strct-stack__item {
        display: grid;
        grid-template-columns: minmax(120px, 34%) 1fr;
        gap: 12px;
        padding: 10px 14px;
        border-bottom: 1px solid var(--b1);
        font-size: 13px;
      }
      .strct-stack__item:last-child {
        border-bottom: 0;
      }
      .strct-stack__item:nth-child(even) {
        background: var(--bg-2);
      }
      .strct-stack__label {
        color: var(--t2);
      }
      .strct-stack__value {
        margin: 0;
        color: var(--t1);
      }
    `,
  ],
})
export class StrctStackItem {
  /** Label text. */
  readonly label = input.required<string>();
}
