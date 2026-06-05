import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/** Timeline node state colors. */
export type StrctTimelineState = 'default' | 'current' | 'success' | 'warning' | 'critical';

/** Vertical timeline container. Wraps `<strct-timeline-item>` children. */
@Component({
  selector: 'strct-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-tl' },
  styles: [
    `
      .strct-tl {
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class StrctTimeline {}

/** A timeline entry: a node on the rail plus a title and projected body. */
@Component({
  selector: 'strct-timeline-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-tli__rail">
      <span class="strct-tli__node"></span>
      <span class="strct-tli__line"></span>
    </div>
    <div class="strct-tli__content">
      <div class="strct-tli__title">{{ title() }}</div>
      <div class="strct-tli__body"><ng-content /></div>
    </div>
  `,
  host: {
    class: 'strct-tli',
    '[class.strct-tli--current]': "state() === 'current'",
    '[class.strct-tli--success]': "state() === 'success'",
    '[class.strct-tli--warning]': "state() === 'warning'",
    '[class.strct-tli--critical]': "state() === 'critical'",
  },
  styles: [
    `
      .strct-tli {
        display: flex;
        gap: 12px;
      }
      .strct-tli__rail {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .strct-tli__node {
        width: 11px;
        height: 11px;
        border-radius: 50%;
        margin-top: 3px;
        flex-shrink: 0;
        background: var(--bg-1);
        border: 2px solid var(--b3);
      }
      .strct-tli__line {
        flex: 1;
        width: 2px;
        background: var(--b2);
        margin: 4px 0;
      }
      .strct-tli:last-child .strct-tli__line {
        display: none;
      }
      .strct-tli__content {
        padding-bottom: 18px;
      }
      .strct-tli__title {
        font-size: 13px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-tli__body {
        margin-top: 3px;
        font-size: 13px;
        color: var(--t2);
      }

      .strct-tli--current .strct-tli__node {
        border-color: var(--acc);
        background: var(--acc-m);
        box-shadow: 0 0 0 3px var(--acc18);
      }
      .strct-tli--success .strct-tli__node {
        border-color: var(--success);
        background: var(--success);
      }
      .strct-tli--warning .strct-tli__node {
        border-color: var(--warning);
        background: var(--warning);
      }
      .strct-tli--critical .strct-tli__node {
        border-color: var(--critical);
        background: var(--critical);
      }
    `,
  ],
})
export class StrctTimelineItem {
  /** Dialog title. */
  readonly title = input.required<string>();
  /** State. */
  readonly state = input<StrctTimelineState>('default');
}
