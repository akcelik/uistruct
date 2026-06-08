import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  model,
  output,
} from '@angular/core';
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
  imports: [StrctIcon],
  template: `
    <nav class="strct-rail__nav" [attr.aria-label]="ariaLabel()">
      @for (item of items(); track item.id) {
        <button
          type="button"
          class="strct-rail__item"
          [class.strct-rail__item--active]="item.id === activeId()"
          [disabled]="item.disabled"
          [attr.aria-current]="item.id === activeId() ? 'page' : null"
          [attr.title]="collapsed() ? item.label : null"
          (click)="pick(item)"
        >
          <strct-icon class="strct-rail__icon" [name]="item.icon" [size]="18" [strokeWidth]="1.6" />
          @if (!collapsed()) {
            <span class="strct-rail__label">{{ item.label }}</span>
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
          }
        </button>
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
        border-right: 1px solid var(--b2);
        overflow: hidden;
        transition: width 0.16s ease;
      }
      .strct-rail--collapsed {
        width: 60px;
      }
      .strct-rail__nav {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px;
        overflow-y: auto;
      }
      .strct-rail__item {
        position: relative;
        display: flex;
        align-items: center;
        gap: 11px;
        width: 100%;
        padding: 8px 10px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--t2);
        cursor: pointer;
        font-size: 13.5px;
        font-family: var(--font);
        text-align: left;
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
        right: 7px;
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

  protected pick(item: StrctRailItem): void {
    if (item.disabled) return;
    this.activeId.set(item.id);
    this.select.emit(item);
  }
}
