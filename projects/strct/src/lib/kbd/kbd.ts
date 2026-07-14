import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Inline keyboard-key chip: `<strct-kbd>⌘K</strct-kbd>`. Used for shortcut hints
 * in menus, tooltips and the command palette.
 */
@Component({
  selector: 'strct-kbd',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<kbd class="strct-kbd__key"><ng-content /></kbd>`,
  host: { class: 'strct-kbd' },
  styles: [
    `
      .strct-kbd {
        display: inline-flex;
      }
      .strct-kbd__key {
        font-size: 12px;
        line-height: 1;
        padding: 3px 6px;
        border: 1px solid var(--b2);
        border-bottom-width: 2px;
        border-radius: 4px;
        color: var(--t3);
        background: var(--bg-2);
        font-family: var(--mono);
        white-space: nowrap;
      }
    `,
  ],
})
export class StrctKbd {}
