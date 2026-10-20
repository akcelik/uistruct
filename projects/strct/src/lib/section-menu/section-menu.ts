import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { StrctIcon } from '../icon/icon';
import { StrctRailStatus } from '../layout/rail';

/** A leaf entry under a {@link StrctMenuSection}. */
export interface StrctMenuLink {
  /** Stable identity, matched against the menu's `activeId`. */
  id: string;
  label: string;
  /** Optional leading icon name. */
  icon?: string;
  disabled?: boolean;
  /** Trailing count/label chip (e.g. a deviation count). */
  badge?: string | number;
  /** Badge tone; defaults to `accent` (shared vocabulary with {@link StrctRailItem}). */
  badgeStatus?: StrctRailStatus;
  /** Small trailing status dot with no text (e.g. "unsaved changes"). */
  dot?: boolean;
  /** Dot tone; defaults to `accent`. */
  dotStatus?: StrctRailStatus;
  /** Muted trailing icon (e.g. "restart required"), before any badge / dot. */
  trailingIcon?: string;
  /**
   * Render as a real router link (`<a routerLink>`): middle-click, ⌘/Ctrl-click
   * and "open in new tab" work, and the address can be copied — which a page
   * with an address of its own needs. `(select)` still fires on plain
   * activation. Without `routerLink` or `href` the entry stays a `<button>`.
   */
  routerLink?: string | unknown[];
  /** Render as a plain `<a href>` (external or non-router destinations). */
  href?: string;
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
  imports: [NgTemplateOutlet, RouterLink, StrctIcon],
  template: `
    <!-- What every entry holds, whatever element carries it. -->
    <ng-template #rowContent let-item>
      @if (showIcons() && item.icon) {
        <strct-icon
          class="strct-sm__item-icon"
          [name]="item.icon"
          [size]="16"
          [strokeWidth]="1.4"
        />
      }
      <span class="strct-sm__item-label">{{ item.label }}</span>
      @if (item.trailingIcon) {
        <strct-icon
          class="strct-sm__trailing"
          [name]="item.trailingIcon"
          [size]="14"
          [strokeWidth]="1.5"
        />
      }
      @if (item.badge !== undefined && item.badge !== null && item.badge !== '') {
        <span class="strct-sm__badge strct-sm__badge--{{ item.badgeStatus ?? 'accent' }}">
          {{ item.badge }}
        </span>
      } @else if (item.dot) {
        <span class="strct-sm__dot strct-sm__dot--{{ item.dotStatus ?? 'accent' }}"></span>
      }
    </ng-template>

    <!-- A router link, a plain link, or a button (the default). A page with an
         address of its own has to be openable in a new tab, as the rail
         beside this menu already is. -->
    <ng-template #row let-item>
      @if (isRouted(item)) {
        <!-- No routerLinkActive here on purpose. That directive owns
             aria-current wherever it is attached: it writes the attribute on
             every navigation and removes it when it does not match, so a
             template binding cannot survive beside it (BUG-58-06) and an
             explicit activeId cannot win over its prefix match (BUG-59-02).
             The rail asks the router itself instead, and keeps one element. -->
        <a
          class="strct-sm__item"
          [routerLink]="item.routerLink"
          [class.strct-sm__item--active]="isActive(item, isRouterActive(item))"
          [attr.aria-current]="isActive(item, isRouterActive(item)) ? 'page' : null"
          (click)="pick(item, $event)"
        >
          <ng-container *ngTemplateOutlet="rowContent; context: { $implicit: item }" />
        </a>
      } @else if (item.href && !item.disabled) {
        <a
          class="strct-sm__item"
          [href]="item.href"
          [class.strct-sm__item--active]="item.id === activeId()"
          [attr.aria-current]="item.id === activeId() ? 'page' : null"
          (click)="pick(item, $event)"
        >
          <ng-container *ngTemplateOutlet="rowContent; context: { $implicit: item }" />
        </a>
      } @else {
        <button
          type="button"
          class="strct-sm__item"
          [class.strct-sm__item--active]="item.id === activeId()"
          [disabled]="item.disabled"
          [attr.aria-current]="item.id === activeId() ? 'page' : null"
          (click)="pick(item)"
        >
          <ng-container *ngTemplateOutlet="rowContent; context: { $implicit: item }" />
        </button>
      }
    </ng-template>

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
                  [size]="16"
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
                <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
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
        border-radius: 3px;
        background: transparent;
        color: var(--t2);
        font-size: 13px;
        font-weight: 500;
        font-family: var(--font);
        cursor: pointer;
        text-align: start;
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
        font-size: 12px;
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
        /* An entry can be an <a> now, which needs the box and the underline
           settled the way the button already has them. */
        box-sizing: border-box;
        text-align: start;
        text-decoration: none;
        padding: 7px 10px;
        border: 0;
        border-radius: 3px;
        background: transparent;
        color: var(--t1);
        font-size: 13px;
        font-family: var(--font);
        cursor: pointer;
        text-align: start;
        transition: background 0.13s ease;
      }
      /* Indent level-2 items under a collapsible category. */
      .strct-sm__section--collapsible .strct-sm__item {
        padding-inline-start: 31px;
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
      /* Trailing cues: muted icon, count chip, status dot — same vocabulary as
         the rail, so the two nav objects stay consistent. */
      .strct-sm__trailing {
        flex-shrink: 0;
        color: var(--t3);
      }
      .strct-sm__badge {
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
        border-radius: 4px;
        font-variant-numeric: tabular-nums;
      }
      .strct-sm__badge--accent {
        background: var(--acc-m);
        color: var(--acc);
      }
      .strct-sm__badge--success {
        background: var(--success-bg);
        color: var(--success);
      }
      .strct-sm__badge--warning {
        background: var(--warning-bg);
        color: var(--warning);
      }
      .strct-sm__badge--critical {
        background: var(--critical-bg);
        color: var(--critical);
      }
      .strct-sm__dot {
        flex-shrink: 0;
        width: 7px;
        height: 7px;
        border-radius: 50%;
      }
      .strct-sm__dot--accent {
        background: var(--acc);
      }
      .strct-sm__dot--success {
        background: var(--success);
      }
      .strct-sm__dot--warning {
        background: var(--warning);
      }
      .strct-sm__dot--critical {
        background: var(--critical);
      }
    `,
  ],
})
export class StrctSectionMenu {
  /** Optional: these entries work with no router at all (href / button rows). */
  private readonly router = inject(Router, { optional: true });
  /** Bumped on every finished navigation, so the active state re-reads. */
  private readonly navTick = signal(0);

  constructor() {
    this.router?.events.pipe(takeUntilDestroyed()).subscribe((e: unknown) => {
      if (e instanceof NavigationEnd) this.navTick.update((n) => n + 1);
    });
  }

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

  /** Enabled entry with a router destination → renders as `<a routerLink>`. */
  protected isRouted(item: StrctMenuLink): boolean {
    return item.routerLink != null && !item.disabled;
  }

  /**
   * Active state of a router-link entry: an explicit `activeId` is
   * authoritative; without one the router's own active state drives it — the
   * rail's contract.
   */
  /**
   * Whether the router is on this entry's destination — the prefix match
   * `RouterLinkActive` does, asked directly so no directive owns the
   * element's `aria-current` (BUG-58-06, BUG-59-02). Absolute destinations
   * are what these inputs take; a relative one is resolved from the root.
   */
  protected isRouterActive(item: StrctMenuLink): boolean {
    this.navTick();
    const link = item.routerLink;
    if (link == null || !this.router) return false;
    return this.router.isActive(this.router.createUrlTree(Array.isArray(link) ? link : [link]), {
      paths: 'subset',
      queryParams: 'subset',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  protected isActive(item: StrctMenuLink, routerActive: boolean): boolean {
    const id = this.activeId();
    return id !== null ? item.id === id : routerActive;
  }

  protected pick(item: StrctMenuLink, event?: MouseEvent): void {
    if (item.disabled) return;
    // A modified or non-primary click on a link belongs to the browser (a new
    // tab, a copied address) — never to us: no activeId change, no (select).
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
