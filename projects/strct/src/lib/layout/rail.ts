import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StrctIcon } from '../icon/icon';

/** Semantic colour for a rail item's count badge. */
export type StrctRailStatus = 'accent' | 'success' | 'warning' | 'critical';

/** A single entry in a {@link StrctRail}. */
export interface StrctRailItem {
  /** Stable identity, matched against the rail's `activeId`. */
  id: string;
  label: string;
  /** Icon name (see the icon set). */
  icon: string;
  /** Optional count/indicator — e.g. number of active alerts. */
  badge?: string | number;
  /** Badge colour (defaults to `accent`). When collapsed it renders as a dot. */
  badgeStatus?: StrctRailStatus;
  disabled?: boolean;
  /** `'bottom'` pins the item to the foot of the rail (e.g. Administration). */
  placement?: 'top' | 'bottom';
  /**
   * Render as a real router link (`<a routerLink>`): middle-click, ⌘/Ctrl-click
   * and "open in new tab" work; `(select)` still fires on plain activation.
   * When neither `routerLink` nor `href` is set the item stays a `<button>`.
   */
  routerLink?: string | unknown[];
  /** Render as a plain `<a href>` (external or non-router destinations). */
  href?: string;
  /** Small trailing status dot with no text (e.g. "unsaved changes"). */
  dot?: boolean;
  /** Dot tone; defaults to `accent`. */
  dotStatus?: StrctRailStatus;
  /** Muted trailing icon (e.g. "restart required"), before any badge / dot. */
  trailingIcon?: string;
}

/**
 * Collapsible, data-driven primary navigation rail for an application shell.
 * Each item is an icon + label + optional status badge; collapsing shrinks it to
 * an icon-only rail (badges become dots, labels become tooltips).
 *
 *   <strct-rail [items]="navItems" [(activeId)]="section" [(collapsed)]="railOff"
 *               (select)="go($event)" />
 */
@Component({
  selector: 'strct-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, StrctIcon],
  template: `
    <!-- Shared row content: icon, label, trailing indicator, badge / dot. -->
    <ng-template #rowContent let-item>
      <strct-icon class="strct-rail__icon" [name]="item.icon" [size]="18" [strokeWidth]="1.6" />
      @if (!collapsed()) {
        <span class="strct-rail__label">{{ item.label }}</span>
        @if (item.trailingIcon) {
          <strct-icon
            class="strct-rail__trailing"
            [name]="item.trailingIcon"
            [size]="14"
            [strokeWidth]="1.5"
          />
        }
      }
      @if (item.badge !== undefined && item.badge !== null && item.badge !== '') {
        <span
          class="strct-rail__badge strct-rail__badge--{{ item.badgeStatus ?? 'accent' }}"
          [class.strct-rail__badge--dot]="collapsed()"
        >
          @if (!collapsed()) {
            {{ item.badge }}
          }
        </span>
      } @else if (item.dot) {
        <span class="strct-rail__dot strct-rail__dot--{{ item.dotStatus ?? 'accent' }}"></span>
      }
    </ng-template>

    <!-- One rail row: a router link, a plain link, or a button (today's default). -->
    <ng-template #row let-item>
      @if (isRouted(item)) {
        <a
          class="strct-rail__item"
          [routerLink]="item.routerLink"
          routerLinkActive
          #rla="routerLinkActive"
          [class.strct-rail__item--active]="isActive(item, rla.isActive)"
          [attr.aria-current]="isActive(item, rla.isActive) ? 'page' : null"
          [attr.title]="collapsed() ? item.label : null"
          (click)="pick(item, $event)"
        >
          <ng-container *ngTemplateOutlet="rowContent; context: { $implicit: item }" />
        </a>
      } @else if (item.href && !item.disabled) {
        <a
          class="strct-rail__item"
          [href]="item.href"
          [class.strct-rail__item--active]="item.id === activeId()"
          [attr.aria-current]="item.id === activeId() ? 'page' : null"
          [attr.title]="collapsed() ? item.label : null"
          (click)="pick(item, $event)"
        >
          <ng-container *ngTemplateOutlet="rowContent; context: { $implicit: item }" />
        </a>
      } @else {
        <button
          type="button"
          class="strct-rail__item"
          [class.strct-rail__item--active]="item.id === activeId()"
          [disabled]="item.disabled"
          [attr.aria-current]="item.id === activeId() ? 'page' : null"
          [attr.title]="collapsed() ? item.label : null"
          (click)="pick(item, $event)"
        >
          <ng-container *ngTemplateOutlet="rowContent; context: { $implicit: item }" />
        </button>
      }
    </ng-template>

    <nav class="strct-rail__nav" [attr.aria-label]="ariaLabel()">
      <div class="strct-rail__group strct-rail__group--top">
        @for (item of topItems(); track item.id) {
          <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
        }
      </div>
      @if (bottomItems().length) {
        <div class="strct-rail__group strct-rail__group--bottom">
          @for (item of bottomItems(); track item.id) {
            <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
          }
        </div>
      }
    </nav>

    @if (collapsible()) {
      <button
        type="button"
        class="strct-rail__toggle"
        [attr.aria-label]="collapsed() ? 'Expand navigation' : 'Collapse navigation'"
        [attr.aria-expanded]="!collapsed()"
        (click)="collapsed.set(!collapsed())"
      >
        <strct-icon class="strct-rail__toggle-icon" name="chevronRight" [size]="16" />
        @if (!collapsed()) {
          <span class="strct-rail__toggle-label">Collapse</span>
        }
      </button>
    }
  `,
  host: {
    class: 'strct-rail',
    '[class.strct-rail--collapsed]': 'collapsed()',
  },
  styles: [
    `
      .strct-rail {
        display: flex;
        flex-direction: column;
        width: 232px;
        flex-shrink: 0;
        background: var(--bg-1);
        border-inline-end: 1px solid var(--b2);
        overflow: hidden;
        transition: width 0.16s ease;
      }
      .strct-rail--collapsed {
        width: 60px;
      }
      .strct-rail__nav {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: 8px;
      }
      .strct-rail__group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      /* Top group scrolls; the bottom group stays pinned under a divider. */
      .strct-rail__group--top {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }
      .strct-rail__group--bottom {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--b1);
      }
      .strct-rail__item {
        position: relative;
        display: flex;
        align-items: center;
        gap: 11px;
        width: 100%;
        box-sizing: border-box;
        padding: 8px 10px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--t2);
        cursor: pointer;
        font-size: 13.5px;
        font-family: var(--font);
        text-align: start;
        text-decoration: none;
        white-space: nowrap;
        transition:
          background 0.14s ease,
          color 0.14s ease;
      }
      .strct-rail--collapsed .strct-rail__item {
        justify-content: center;
        padding: 8px;
      }
      .strct-rail__item:hover:not(:disabled) {
        background: var(--bg-3);
        color: var(--t1);
      }
      .strct-rail__item--active {
        background: var(--acc-m);
        color: var(--acc);
      }
      .strct-rail__item--active .strct-rail__icon {
        color: var(--acc);
      }
      .strct-rail__item:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .strct-rail__item:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-rail__icon {
        flex-shrink: 0;
      }
      .strct-rail__label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .strct-rail__badge {
        flex-shrink: 0;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        border-radius: 9px;
        font-variant-numeric: tabular-nums;
      }
      .strct-rail__badge--dot {
        position: absolute;
        top: 5px;
        inset-inline-end: 7px;
        min-width: 8px;
        width: 8px;
        height: 8px;
        padding: 0;
        border-radius: 50%;
      }
      .strct-rail__badge--accent {
        background: var(--acc-m);
        color: var(--acc);
      }
      .strct-rail__badge--success {
        background: var(--success-bg);
        color: var(--success);
      }
      .strct-rail__badge--warning {
        background: var(--warning-bg);
        color: var(--warning);
      }
      .strct-rail__badge--critical {
        background: var(--critical-bg);
        color: var(--critical);
      }
      .strct-rail__badge--dot.strct-rail__badge--accent {
        background: var(--acc);
      }
      .strct-rail__badge--dot.strct-rail__badge--success {
        background: var(--success);
      }
      .strct-rail__badge--dot.strct-rail__badge--warning {
        background: var(--warning);
      }
      .strct-rail__badge--dot.strct-rail__badge--critical {
        background: var(--critical);
      }
      /* Muted trailing indicator icon ("restart required" etc.). */
      .strct-rail__trailing {
        flex-shrink: 0;
        color: var(--t3);
      }
      /* Small trailing status dot ("unsaved changes" etc.). */
      .strct-rail__dot {
        flex-shrink: 0;
        width: 7px;
        height: 7px;
        border-radius: 50%;
      }
      .strct-rail--collapsed .strct-rail__dot {
        position: absolute;
        top: 5px;
        inset-inline-end: 7px;
      }
      .strct-rail__dot--accent {
        background: var(--acc);
      }
      .strct-rail__dot--success {
        background: var(--success);
      }
      .strct-rail__dot--warning {
        background: var(--warning);
      }
      .strct-rail__dot--critical {
        background: var(--critical);
      }
      .strct-rail__toggle {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 14px;
        border: 0;
        border-top: 1px solid var(--b1);
        background: transparent;
        color: var(--t3);
        cursor: pointer;
        font-size: 12.5px;
        font-family: var(--font);
      }
      .strct-rail--collapsed .strct-rail__toggle {
        justify-content: center;
        padding: 9px;
      }
      .strct-rail__toggle:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-rail__toggle-icon {
        transition: transform 0.16s ease;
      }
      .strct-rail:not(.strct-rail--collapsed) .strct-rail__toggle-icon {
        transform: rotate(180deg);
      }
    `,
  ],
})
export class StrctRail {
  /** Navigation entries. */
  readonly items = input.required<StrctRailItem[]>();
  /** Currently-active item id (two-way). */
  readonly activeId = model<string | null>(null);
  /** Collapsed (icon-only) state (two-way). */
  readonly collapsed = model(false);
  /** Show the collapse toggle at the foot of the rail. */
  readonly collapsible = input(true);
  /** Accessible label for the nav landmark. */
  readonly ariaLabel = input('Primary');
  /** Emitted when an item is chosen. */
  readonly select = output<StrctRailItem>();

  protected readonly topItems = computed(() =>
    this.items().filter((i) => i.placement !== 'bottom'),
  );
  protected readonly bottomItems = computed(() =>
    this.items().filter((i) => i.placement === 'bottom'),
  );

  /** Enabled item with a router destination → renders as `<a routerLink>`. */
  protected isRouted(item: StrctRailItem): boolean {
    return item.routerLink != null && !item.disabled;
  }

  /**
   * Active state of a router-link item: an explicit `activeId` is authoritative;
   * without one, the router's own active state drives it.
   */
  protected isActive(item: StrctRailItem, routerActive: boolean): boolean {
    const id = this.activeId();
    return id !== null ? item.id === id : routerActive;
  }

  protected pick(item: StrctRailItem, event?: MouseEvent): void {
    if (item.disabled) return;
    // A modified / non-primary click on a link is the browser's (new tab etc.) —
    // never ours: no activeId change, no (select).
    if (
      event &&
      (item.routerLink != null || item.href) &&
      (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    ) {
      return;
    }
    this.activeId.set(item.id);
    this.select.emit(item);
  }
}
