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
        border-radius: 8px;
        overflow: hidden;
      }
      .strct-stack__list {
        margin: 0;
      }
    `,
  ],
})
export class StrctStack {}

/** A label + value row. The value is projected content. */
@Component({
  selector: 'strct-stack-item',
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
