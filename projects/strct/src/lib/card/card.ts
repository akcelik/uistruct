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
    `:host {
      display: block; background: var(--bg-1);
      border: 1px solid var(--b2); border-radius: 8px;
      box-shadow: var(--sh); overflow: hidden;
    }`,
  ],
})
export class StrctCard {}

@Component({
  selector: 'strct-card-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: [
    `:host {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      padding: 13px 16px; border-bottom: 1px solid var(--b1);
      font-size: 13px; font-weight: 600; color: var(--t1);
    }`,
  ],
})
export class StrctCardHeader {}

@Component({
  selector: 'strct-card-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: [`:host { display: block; padding: 16px; color: var(--t2); font-size: 13px; }`],
})
export class StrctCardBlock {}

@Component({
  selector: 'strct-card-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: [
    `:host {
      display: flex; align-items: center; justify-content: flex-end; gap: 8px;
      padding: 12px 16px; border-top: 1px solid var(--b1); background: var(--bg-2);
    }`,
  ],
})
export class StrctCardFooter {}
