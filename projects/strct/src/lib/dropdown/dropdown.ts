import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  booleanAttribute,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctOverlay } from '../overlay/overlay';

/**
 * Click-to-open menu:
 *   <strct-dropdown align="end">
 *     <button strct-button strctDropdownTrigger>Actions</button>
 *     <strct-dropdown-item>Rename</strct-dropdown-item>
 *     <strct-dropdown-item critical>Delete</strct-dropdown-item>
 *   </strct-dropdown>
 *
 * With `popover`, the panel holds *form controls* instead of menu items: an
 * inner click no longer closes it (only outside click / Escape do), and the
 * semantics switch from `role="menu"` to a labeled `role="dialog"` — a panel
 * of selects is not a menu to a screen reader either:
 *
 *   <strct-dropdown popover popoverLabel="Filters">
 *     <button strct-button strctDropdownTrigger>Filters</button>
 *     <strct-field label="Severity">…</strct-field>
 *   </strct-dropdown>
 */
@Component({
  selector: 'strct-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctOverlay],
  template: `
    <!--
      The wrapper is intentionally inert: the projected trigger should be a
      real button (nesting interactives fails axe). Its native click —
      pointer or Enter/Space — bubbles here; the strctDropdownTrigger
      directive puts aria-haspopup/aria-expanded on the button itself.
    -->
    <div #trigger class="strct-dd__trigger" (click)="toggle()">
      <ng-content select="[strctDropdownTrigger]" />
    </div>
    <!--
      One panel for both modes (a default ng-content per @if branch would strand
      the projected content in the inactive branch) — mode picks the semantics.
    -->
    @if (open()) {
      <div
        class="strct-dd__menu"
        [class.strct-dd__menu--popover]="popover()"
        [strctOverlay]="trigger"
        [strctOverlayPlacement]="align() === 'end' ? 'bottom-end' : 'bottom-start'"
        [attr.role]="popover() ? 'dialog' : 'menu'"
        [attr.aria-label]="popover() ? popoverLabel() : null"
        [attr.tabindex]="popover() ? -1 : 0"
        (click)="onInnerActivate()"
        (keydown.enter)="onInnerActivate()"
        (keydown.space)="onInnerActivate()"
      >
        <ng-content />
      </div>
    }
  `,
  host: { class: 'strct-dd' },
  styles: [
    `
      .strct-dd {
        position: relative;
        display: inline-block;
      }
      .strct-dd__trigger {
        display: inline-flex;
      }
      .strct-dd__menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        z-index: 200;
        min-width: 170px;
        max-width: calc(100vw - 24px);
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 7px;
        box-shadow: var(--shh);
        animation: strct-dd-in 0.1s ease;
      }
      .strct-dd__menu--end {
        left: auto;
        right: 0;
      }
      /* Popover panels hold form controls — roomier padding, no item hover. */
      .strct-dd__menu--popover {
        min-width: 240px;
        padding: 12px 14px;
      }
      @keyframes strct-dd-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
      }
    `,
  ],
})
export class StrctDropdown {
  private readonly host = inject(ElementRef<HTMLElement>);
  /** Horizontal alignment of the menu. */
  readonly align = input<'start' | 'end'>('start');
  /**
   * Popover mode for panels holding form controls (filter/settings panels):
   * inner clicks never close the panel — only outside click / Escape do —
   * and it renders as a labeled `role="dialog"` instead of a menu.
   */
  readonly popover = input(false, { transform: booleanAttribute });
  /** Accessible name of the popover dialog (localizable). */
  readonly popoverLabel = input('Filters');
  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  /** Menu items close on activation; popover form controls never do. */
  protected onInnerActivate(): void {
    if (!this.popover()) this.close();
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }
}

/**
 * Marks (and upgrades) the dropdown's trigger element. The attribute alone is
 * enough for content projection; importing the directive additionally wires
 * `aria-haspopup` / `aria-expanded` onto the real button.
 */
@Directive({
  selector: '[strctDropdownTrigger]',
  host: {
    '[attr.aria-haspopup]': "dd ? (dd.popover() ? 'dialog' : 'menu') : null",
    '[attr.aria-expanded]': 'dd ? dd.open() : null',
  },
})
export class StrctDropdownTrigger {
  protected readonly dd = inject(StrctDropdown, { optional: true });
}

/** A selectable row inside a `<strct-dropdown>`. */
@Component({
  selector: 'strct-dropdown-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: {
    class: 'strct-dd__item',
    role: 'menuitem',
    '[class.strct-dd__item--critical]': 'critical()',
    '[attr.aria-disabled]': 'disabled() || null',
  },
  styles: [
    `
      .strct-dd__item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
      }
      .strct-dd__item:hover {
        background: var(--bg-3);
      }
      .strct-dd__item--critical {
        color: var(--critical);
      }
      .strct-dd__item--critical:hover {
        background: var(--critical-bg);
      }
      .strct-dd__item[aria-disabled='true'] {
        color: var(--t4);
        pointer-events: none;
      }
    `,
  ],
})
export class StrctDropdownItem {
  /** Danger. */
  readonly critical = input(false, { transform: booleanAttribute });
  /** Static disable flag. */
  readonly disabled = input(false, { transform: booleanAttribute });
}

/** Thin separator between groups of menu items. */
@Component({
  selector: 'strct-dropdown-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '',
  host: { class: 'strct-dd__divider', role: 'separator' },
  styles: [
    `
      .strct-dd__divider {
        display: block;
        height: 1px;
        margin: 4px 6px;
        background: var(--b2);
      }
    `,
  ],
})
export class StrctDropdownDivider {}
