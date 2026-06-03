import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/** Key/value definition list. Wraps `<strct-stack-item>` rows. */
@Component({
  selector: 'strct-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-stack' },
  styles: [
    `
    .strct-stack {
      display: block; border: 1px solid var(--b2); border-radius: 8px; overflow: hidden;
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
    <span class="strct-stack__label">{{ label() }}</span>
    <span class="strct-stack__value"><ng-content /></span>
  `,
  host: { class: 'strct-stack__item' },
  styles: [
    `
    .strct-stack__item {
      display: grid; grid-template-columns: minmax(120px, 34%) 1fr; gap: 12px;
      padding: 10px 14px; border-bottom: 1px solid var(--b1); font-size: 13px;
    }
    .strct-stack__item:last-child { border-bottom: 0; }
    .strct-stack__item:nth-child(even) { background: var(--bg-2); }
    .strct-stack__label { color: var(--t2); }
    .strct-stack__value { color: var(--t1); }
    `,
  ],
})
export class StrctStackItem {
  readonly label = input.required<string>();
}
