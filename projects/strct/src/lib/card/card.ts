import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Surface container. Compose with the header / block / footer pieces:
 *   <strct-card>
 *     <strct-card-header>Title</strct-card-header>
 *     <strct-card-block>...</strct-card-block>
 *     <strct-card-footer><button strct-button>OK</button></strct-card-footer>
 *   </strct-card>
 */
@Component({
  selector: 'strct-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: [
    `
      :host {
        display: block;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        box-shadow: var(--sh);
        overflow: hidden;
      }
    `,
  ],
})
export class StrctCard {}

/** Header section of a {@link StrctCard}. */
@Component({
  selector: 'strct-card-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--b1);
        font-size: 13px;
        font-weight: 600;
        color: var(--t1);
      }
    `,
  ],
})
export class StrctCardHeader {}

/** Body section of a {@link StrctCard}. */
@Component({
  selector: 'strct-card-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: [
    `
      :host {
        display: block;
        padding: var(--space-4);
        color: var(--t2);
        font-size: 13px;
      }
    `,
  ],
})
export class StrctCardBlock {}

/** Footer section of a {@link StrctCard}. */
@Component({
  selector: 'strct-card-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        border-top: 1px solid var(--b1);
        background: var(--bg-2);
      }
    `,
  ],
})
export class StrctCardFooter {}
