import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/** A leaf entry under a {@link StrctMenuSection}. */
export interface StrctMenuLink {
  /** Stable identity, matched against the menu's `activeId`. */
  id: string;
  label: string;
  /** Optional leading icon name. */
  icon?: string;
  disabled?: boolean;
}

/** A category (level 1) that groups {@link StrctMenuLink} items (level 2). */
export interface StrctMenuSection {
  label: string;
  /** Optional category icon (collapsible mode). */
  icon?: string;
  /** Initial expanded state in collapsible mode (defaults to expanded). */
  expanded?: boolean;
  items: StrctMenuLink[];
}

/**
 * A two-level navigation menu: categories (level 1) each holding a flat list of
 * items (level 2) — not a tree. Categories can be collapsible (chevrons) or
 * static section labels, and item/category icons can be hidden.
 *
 *   <strct-section-menu [sections]="nav" [(activeId)]="active"
 *                       [collapsible]="true" [showIcons]="true"
 *                       (select)="go($event)" />
 */
@Component({
  selector: 'strct-section-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <nav class="strct-sm" [attr.aria-label]="ariaLabel()">
      @for (sec of sections(); track sec.label) {
        <div class="strct-sm__section" [class.strct-sm__section--collapsible]="collapsible()">
          @if (collapsible()) {
            <button
              type="button"
              class="strct-sm__cat"
              [attr.aria-expanded]="isOpen(sec)"
              (click)="toggle(sec)"
            >
              <span class="strct-sm__chevron" [class.strct-sm__chevron--open]="isOpen(sec)">
                <strct-icon name="chevronRight" [size]="12" [strokeWidth]="1.7" />
              </span>
              @if (showIcons() && sec.icon) {
                <strct-icon
                  class="strct-sm__cat-icon"
                  [name]="sec.icon"
                  [size]="15"
                  [strokeWidth]="1.4"
                />
              }
              <span class="strct-sm__cat-label">{{ sec.label }}</span>
            </button>
          } @else {
            <div class="strct-sm__cat-static">{{ sec.label }}</div>
          }

          @if (isOpen(sec)) {
            <div class="strct-sm__items" role="group">
              @for (item of sec.items; track item.id) {
                <button
                  type="button"
                  class="strct-sm__item"
                  [class.strct-sm__item--active]="item.id === activeId()"
                  [disabled]="item.disabled"
                  [attr.aria-current]="item.id === activeId() ? 'page' : null"
                  (click)="pick(item)"
                >
                  @if (showIcons() && item.icon) {
                    <strct-icon
                      class="strct-sm__item-icon"
                      [name]="item.icon"
                      [size]="15"
                      [strokeWidth]="1.4"
                    />
                  }
                  <span class="strct-sm__item-label">{{ item.label }}</span>
                </button>
              }
            </div>
          }
        </div>
      }
    </nav>
  `,
  host: { class: 'strct-sm-host' },
  styles: [
    `
      .strct-sm {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .strct-sm__section--collapsible + .strct-sm__section--collapsible {
        margin-top: 1px;
      }
      .strct-sm__cat {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 7px 9px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--t2);
        font-size: 13px;
        font-weight: 500;
        font-family: var(--font);
        cursor: pointer;
        text-align: left;
        transition:
          background 0.13s ease,
          color 0.13s ease;
      }
      .strct-sm__cat:hover {
        background: var(--bg-3);
        color: var(--t1);
      }
      .strct-sm__cat:focus-visible,
      .strct-sm__item:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-sm__chevron {
        display: inline-flex;
        color: var(--t3);
        flex-shrink: 0;
        transition: transform 0.15s ease;
      }
      .strct-sm__chevron--open {
        transform: rotate(90deg);
      }
      .strct-sm__cat-icon {
        color: var(--t3);
        flex-shrink: 0;
      }
      .strct-sm__cat-label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .strct-sm__cat-static {
        padding: 11px 10px 5px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--t3);
      }
      .strct-sm__items {
        display: flex;
        flex-direction: column;
      }
      .strct-sm__item {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        padding: 7px 10px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--t1);
        font-size: 13px;
        font-family: var(--font);
        cursor: pointer;
        text-align: left;
        transition: background 0.13s ease;
      }
      /* Indent level-2 items under a collapsible category. */
      .strct-sm__section--collapsible .strct-sm__item {
        padding-left: 31px;
      }
      .strct-sm__item:hover:not(:disabled) {
        background: var(--bg-3);
      }
      .strct-sm__item--active {
        background: var(--acc-m);
        color: var(--acc);
        font-weight: 500;
      }
      .strct-sm__item--active .strct-sm__item-icon {
        color: var(--acc);
      }
      .strct-sm__item:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .strct-sm__item-icon {
        color: var(--t2);
        flex-shrink: 0;
      }
      .strct-sm__item-label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
})
export class StrctSectionMenu {
  /** Categories with their items (max two levels). */
  readonly sections = input.required<StrctMenuSection[]>();
  /** Active item id (two-way). */
  readonly activeId = model<string | null>(null);
  /** Categories collapse via a chevron; `false` renders static section labels. */
  readonly collapsible = input(true, { transform: booleanAttribute });
  /** Show category / item icons. */
  readonly showIcons = input(true, { transform: booleanAttribute });
  /** Accessible label for the nav landmark. */
  readonly ariaLabel = input('Sections');
  /** Emitted when an item is chosen. */
  readonly select = output<StrctMenuLink>();

  /** Per-section open overrides (keyed by label); absent ⇒ use `expanded`. */
  private readonly overrides = signal<Map<string, boolean>>(new Map());

  protected isOpen(sec: StrctMenuSection): boolean {
    if (!this.collapsible()) return true;
    return this.overrides().get(sec.label) ?? sec.expanded !== false;
  }

  protected toggle(sec: StrctMenuSection): void {
    const open = this.isOpen(sec);
    const next = new Map(this.overrides());
    next.set(sec.label, !open);
    this.overrides.set(next);
  }

  protected pick(item: StrctMenuLink): void {
    if (item.disabled) return;
    this.activeId.set(item.id);
    this.select.emit(item);
  }
}
