import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  contentChildren,
  input,
  output,
} from '@angular/core';
import { StrctStatus } from '../status';

/** Leading marker of a row — a badge, a status dot, an icon. */
@Directive({ selector: '[strctListItemLeading]' })
export class StrctListItemLeading {}

/** Secondary line under the row's title. */
@Directive({ selector: '[strctListItemDescription]' })
export class StrctListItemDescription {}

/** Quiet text at the end of the row — a time, a count. */
@Directive({ selector: '[strctListItemMeta]' })
export class StrctListItemMeta {}

/** Controls after the meta — a button, a menu trigger. Its own tab stop. */
@Directive({ selector: '[strctListItemTrailing]' })
export class StrctListItemTrailing {}

/**
 * One row of a {@link StrctList}: leading · title / description · meta ·
 * trailing.
 *
 * `interactive` makes the row itself activate (click, Enter or Space) and emit
 * `activated`, while anything in `[strctListItemTrailing]` stays a separate tab
 * stop — so "open this alarm" and "acknowledge it" are two different targets.
 *
 * The row carries `role="button"` rather than being a `<button>` element: a
 * template can project the same content into only one place, so branching the
 * markup on `interactive` would drop it in the other branch. `strct-tree` rows
 * work the same way.
 */
@Component({
  selector: 'strct-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="strct-li__main"
      [attr.role]="interactive() ? 'button' : null"
      [attr.tabindex]="interactive() ? 0 : null"
      [attr.aria-current]="selected() ? 'true' : null"
      (click)="onActivate()"
      (keydown.enter)="onActivate()"
      (keydown.space)="$event.preventDefault(); onActivate()"
    >
      <span class="strct-li__leading"><ng-content select="[strctListItemLeading]" /></span>
      <span class="strct-li__text">
        <span class="strct-li__title"><ng-content /></span>
        <span class="strct-li__desc"><ng-content select="[strctListItemDescription]" /></span>
      </span>
      <span class="strct-li__meta"><ng-content select="[strctListItemMeta]" /></span>
    </div>
    <span class="strct-li__trailing"><ng-content select="[strctListItemTrailing]" /></span>
  `,
  host: {
    class: 'strct-li',
    role: 'listitem',
    '[class.strct-li--interactive]': 'interactive()',
    '[class.strct-li--selected]': 'selected()',
    '[class.strct-li--status]': 'status()',
    '[attr.data-status]': 'status()',
  },
  styles: [
    `
      .strct-li {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding-inline: var(--space-3);
        position: relative;
      }
      .strct-list--dividers .strct-li + .strct-li {
        border-block-start: 1px solid var(--b1);
      }
      .strct-li__main {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex: 1;
        min-width: 0;
        /* The row's own height; dense trims it to 32px. */
        min-height: 44px;
        padding-block: 6px;
        text-align: start;
        border-radius: var(--radius-sm);
      }
      .strct-list--dense .strct-li__main {
        min-height: 32px;
        padding-block: 2px;
      }
      .strct-li--interactive .strct-li__main {
        cursor: pointer;
      }
      .strct-li--interactive:hover {
        background: var(--bg-2);
      }
      .strct-li--selected {
        background: var(--acc-s);
      }
      .strct-li__main:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      /* A status rail, as strct-card [status] draws one. */
      .strct-li--status::before {
        content: '';
        position: absolute;
        inset-block: 0;
        inset-inline-start: 0;
        width: 2px;
        background: var(--t3);
      }
      .strct-li[data-status='accent']::before {
        background: var(--acc);
      }
      .strct-li[data-status='success']::before {
        background: var(--success);
      }
      .strct-li[data-status='warning']::before {
        background: var(--warning);
      }
      .strct-li[data-status='critical']::before {
        background: var(--critical);
      }
      .strct-li__leading:empty,
      .strct-li__meta:empty,
      .strct-li__desc:empty,
      .strct-li__trailing:empty {
        display: none;
      }
      .strct-li__leading {
        display: inline-flex;
        align-items: center;
        flex: none;
      }
      .strct-li__text {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;
        min-width: 0;
      }
      .strct-li__title {
        font-size: var(--text-md);
        color: var(--t1);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-li__desc {
        font-size: var(--text-sm);
        color: var(--t3);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-li__meta {
        display: inline-flex;
        align-items: center;
        flex: none;
        font-size: var(--text-sm);
        color: var(--t3);
        white-space: nowrap;
      }
      .strct-li__trailing {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        flex: none;
      }
      /* Narrow: the meta drops under the description instead of squeezing the
         title to nothing. */
      @container (max-width: 360px) {
        .strct-li__main {
          flex-wrap: wrap;
        }
        .strct-li__meta {
          flex-basis: 100%;
          padding-inline-start: 0;
        }
      }
    `,
  ],
})
export class StrctListItem {
  /** The row activates on click / Enter / Space and emits `activated`. */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** Marks the current row (`aria-current`). */
  readonly selected = input(false, { transform: booleanAttribute });
  /** Optional leading rail, as `strct-card [status]`. */
  readonly status = input<StrctStatus | null>(null);
  /** Emitted when an `interactive` row is activated. */
  readonly activated = output<void>();

  protected onActivate(): void {
    if (this.interactive()) this.activated.emit();
  }
}

/**
 * A short list of things with a status — alarms, findings, clusters in a
 * summary. A table needs a header row and columns, a timeline implies time
 * order, and an alert per item is too heavy; without a list every screen
 * invents its own rows.
 *
 *   <strct-list dense [label]="'Active alarms'">
 *     <strct-list-item interactive (activated)="open(a)">
 *       <strct-badge strctListItemLeading status="critical">Critical</strct-badge>
 *       {{ a.name }}
 *       <span strctListItemDescription>{{ a.object }}</span>
 *       <span strctListItemMeta>{{ a.when }}</span>
 *       <button strctListItemTrailing strct-button size="mini" variant="flat">Acknowledge</button>
 *     </strct-list-item>
 *   </strct-list>
 */
@Component({
  selector: 'strct-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-content />
    @if (emptyText() && !items().length) {
      <p class="strct-list__empty">{{ emptyText() }}</p>
    }
  `,
  host: {
    class: 'strct-list',
    role: 'list',
    '[attr.aria-label]': 'label() || null',
    '[class.strct-list--dense]': 'dense()',
    '[class.strct-list--dividers]': 'dividers()',
  },
  styles: [
    `
      .strct-list {
        display: block;
        container-type: inline-size;
      }
      .strct-list__empty {
        margin: 0;
        padding: var(--space-3);
        font-size: var(--text-sm);
        color: var(--t3);
      }
    `,
  ],
})
export class StrctList {
  /** 32px rows instead of 44px. */
  readonly dense = input(false, { transform: booleanAttribute });
  /** Hairline between rows. */
  readonly dividers = input(true, { transform: booleanAttribute });
  /** Shown when the list has no items. */
  readonly emptyText = input('');
  /** Accessible name of the list. */
  readonly label = input('');

  protected readonly items = contentChildren(StrctListItem);
}
