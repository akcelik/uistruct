import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StrctIcon } from '../icon/icon';
import { StrctStatus } from '../status';
import { StrctStatusDot } from '../status-dot/status-dot';
import {
  StrctDropdown,
  StrctDropdownDivider,
  StrctDropdownItem,
  StrctDropdownItemDescription,
  StrctDropdownItemIcon,
  StrctDropdownItemLabel,
  StrctDropdownTrigger,
} from '../dropdown/dropdown';

/** One product (or platform) a person may switch to. */
export interface StrctProductItem {
  /** Stable identity, matched against `current`. */
  id: string;
  /** The product's full name — the menu row's label, and what a reader hears. */
  name: string;
  /** What the chip shows; the full name when omitted. */
  label?: string;
  /**
   * What the chip shows below `shortLabelWidth`. An icon alone does not say
   * where you are — "Site Recovery" and "Backup" icons are not self-evident —
   * while a short word fits. The full name stays in the accessible name.
   */
  shortLabel?: string;
  /** Icon name from the icon set. */
  icon?: string;
  /** One line of health under the name ("2 VMs past RPO"). */
  description?: string;
  /** The dot beside that line. */
  status?: StrctStatus;
  /** The product's own colour (a token or value): the row's icon takes it. */
  tone?: string;
  /**
   * The product's accent, written on the row as `data-accent`: the library's
   * tints follow it (5.15.0), so the checked row is filled in **that
   * product's** accent rather than the shell's.
   */
  accent?: string;
  /**
   * The chip's own shade. The chip sits on `--hdr`, which is dark in every
   * scheme, and the menu rows on `--bg-1`: one colour measured 2.45–2.93 : 1
   * on one of the two, under the 3 : 1 a graphical object owes. Falls back to
   * `tone`.
   */
  headerTone?: string;
  /** Render the row as a real router link (middle-click, a new tab). */
  routerLink?: string | unknown[];
  /** Render the row as a plain link. */
  href?: string;
  disabled?: boolean;
}

/**
 * The product switcher every multi-product console grows: a chip beside the
 * logo saying where you are, opening the products you may use with a line of
 * health each, and the platform after a divider.
 *
 *   <strct-product-switcher
 *     [items]="products" [(current)]="productId" [footerItems]="[admin]"
 *     (opened)="loadHealth()" (select)="go($event)" />
 *
 * A person offered one product sees a plain chip, not a menu of one.
 */
@Component({
  selector: 'strct-product-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    StrctIcon,
    StrctStatusDot,
    StrctDropdown,
    StrctDropdownTrigger,
    StrctDropdownItem,
    StrctDropdownItemIcon,
    StrctDropdownItemLabel,
    StrctDropdownItemDescription,
    StrctDropdownDivider,
  ],
  template: `
    <!-- A row is a link where the product has an address, so it can be opened
         in a new tab — and a menuitemradio either way, checked on the one you
         are in. -->
    <ng-template #row let-item>
      @if (item.routerLink !== null && item.routerLink !== undefined && !item.disabled) {
        <a
          strctDropdownItem
          [routerLink]="item.routerLink"
          [selected]="item.id === current()"
          [attr.data-item]="item.id"
          [attr.data-accent]="item.accent || null"
          (click)="pick(item, $event)"
        >
          @if (item.icon) {
            <strct-icon
              strctDropdownItemIcon
              [tone]="item.tone ?? ''"
              [name]="item.icon"
              [size]="16"
            />
          }
          <span strctDropdownItemLabel>{{ item.name }}</span>
          @if (item.description) {
            <span strctDropdownItemDescription>
              @if (item.status) {
                <strct-status-dot [status]="item.status" />
              }
              {{ item.description }}
            </span>
          }
        </a>
      } @else if (item.href && !item.disabled) {
        <a
          strctDropdownItem
          [href]="item.href"
          [selected]="item.id === current()"
          [attr.data-item]="item.id"
          [attr.data-accent]="item.accent || null"
          (click)="pick(item, $event)"
        >
          @if (item.icon) {
            <strct-icon
              strctDropdownItemIcon
              [tone]="item.tone ?? ''"
              [name]="item.icon"
              [size]="16"
            />
          }
          <span strctDropdownItemLabel>{{ item.name }}</span>
          @if (item.description) {
            <span strctDropdownItemDescription>
              @if (item.status) {
                <strct-status-dot [status]="item.status" />
              }
              {{ item.description }}
            </span>
          }
        </a>
      } @else {
        <strct-dropdown-item
          [selected]="item.id === current()"
          [disabled]="!!item.disabled"
          [attr.data-item]="item.id"
          [attr.data-accent]="item.accent || null"
          (click)="pick(item)"
        >
          @if (item.icon) {
            <strct-icon
              strctDropdownItemIcon
              [tone]="item.tone ?? ''"
              [name]="item.icon"
              [size]="16"
            />
          }
          <span strctDropdownItemLabel>{{ item.name }}</span>
          @if (item.description) {
            <span strctDropdownItemDescription>
              @if (item.status) {
                <strct-status-dot [status]="item.status" />
              }
              {{ item.description }}
            </span>
          }
        </strct-dropdown-item>
      }
    </ng-template>

    @if (hasMenu()) {
      <strct-dropdown #menu align="start">
        <button
          type="button"
          class="strct-ps__chip"
          strctDropdownTrigger
          [attr.aria-label]="chipAriaLabel()"
        >
          <ng-container *ngTemplateOutlet="chipBody" />
          <strct-icon class="strct-ps__chevron" name="chevronDown" [size]="13" />
        </button>
        @for (item of items(); track item.id) {
          <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
        }
        @if (footerItems().length) {
          <strct-dropdown-divider />
          @for (item of footerItems(); track item.id) {
            <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
          }
        }
      </strct-dropdown>
    } @else {
      <!-- One product: a chip that says where you are, not a menu of one. -->
      <span class="strct-ps__chip strct-ps__chip--plain">
        <ng-container *ngTemplateOutlet="chipBody" />
      </span>
    }

    <ng-template #chipBody>
      @if (currentItem(); as item) {
        @if (item.icon) {
          <strct-icon
            class="strct-ps__icon"
            [name]="item.icon"
            [size]="16"
            [style.color]="item.headerTone || item.tone || null"
          />
        }
        <span class="strct-ps__label">{{ chipText() }}</span>
      }
    </ng-template>
  `,
  host: { class: 'strct-ps' },
  styles: [
    `
      .strct-ps {
        display: inline-flex;
        align-items: center;
        min-width: 0;
      }
      .strct-ps__chip {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        max-width: 100%;
        padding: 5px 8px;
        border: 1px solid var(--b2);
        border-radius: var(--radius-sm);
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .strct-ps__chip:hover {
        background: rgb(255 255 255 / 0.08);
      }
      .strct-ps__chip--plain {
        cursor: default;
        border-color: transparent;
      }
      .strct-ps__chip--plain:hover {
        background: transparent;
      }
      .strct-ps__label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-ps__icon {
        flex: none;
      }
      .strct-ps__chevron {
        flex: none;
        opacity: 0.7;
      }
    `,
  ],
})
export class StrctProductSwitcher {
  /** The products this person may switch to. */
  readonly items = input<readonly StrctProductItem[]>([]);
  /** Entries after a divider — the shared platform, administration. */
  readonly footerItems = input<readonly StrctProductItem[]>([]);
  /** Which product you are in, two-way. */
  readonly current = model<string | null>(null);
  /**
   * What the chip is for, after the product's name:
   * "HyperStruct Backup — switch product".
   */
  readonly switchLabel = input('switch product');
  /**
   * Below this width (px) the chip shows each item's `shortLabel` instead of
   * its label. The full name stays in the accessible name.
   */
  readonly shortLabelWidth = input(600);

  /** The menu has opened — read the health lines now, not before. */
  readonly opened = output<void>();
  /** A product was chosen (plain activation only, as the rail does). */
  readonly select = output<StrctProductItem>();

  private readonly menu = viewChild<StrctDropdown>('menu');
  private readonly narrow = signal(false);
  private wasOpen = false;

  /** With one product and nowhere else to go, there is no menu to open. */
  protected readonly hasMenu = computed(() => this.items().length + this.footerItems().length > 1);

  protected readonly currentItem = computed(
    () =>
      [...this.items(), ...this.footerItems()].find((i) => i.id === this.current()) ??
      this.items()[0] ??
      null,
  );

  protected readonly chipText = computed(() => {
    const item = this.currentItem();
    if (!item) return '';
    const full = item.label ?? item.name;
    return this.narrow() ? (item.shortLabel ?? full) : full;
  });

  protected readonly chipAriaLabel = computed(() => {
    const item = this.currentItem();
    if (!item) return this.switchLabel();
    return `${item.name} — ${this.switchLabel()}`;
  });

  constructor() {
    // The short label is a width question, and a width question the component
    // has to answer in script: the text it draws changes, not only its size.
    effect((onCleanup) => {
      const px = this.shortLabelWidth();
      if (typeof matchMedia !== 'function') return;
      const query = matchMedia(`(max-width: ${px}px)`);
      const update = () => this.narrow.set(query.matches);
      update();
      query.addEventListener('change', update);
      onCleanup(() => query.removeEventListener('change', update));
    });

    // (opened) fires once per opening, so an app can fetch the health lines
    // then — the menu never waits for them.
    effect(() => {
      const open = this.menu()?.open() ?? false;
      if (open && !this.wasOpen) this.opened.emit();
      this.wasOpen = open;
    });
  }

  protected pick(item: StrctProductItem, event?: MouseEvent): void {
    if (item.disabled) return;
    // A modified or non-primary click on a link is the browser's — a new tab,
    // a copied address — and must not switch the product here.
    if (
      event &&
      (item.routerLink != null || item.href) &&
      (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    ) {
      return;
    }
    this.current.set(item.id);
    this.select.emit(item);
  }
}
