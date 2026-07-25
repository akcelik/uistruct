import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { focusFirstIn } from '../overlay/focus';

/**
 * A nested fly-out inside a `strct-context-menu` or `strct-dropdown`. Opens on
 * hover, click/tap, or the keyboard (Enter / Space / → — focus then moves into
 * the fly-out, ← / Escape hand it back to the trigger), and flips to the left
 * near the right edge of the viewport, upward near the bottom edge.
 * Reuse `strct-dropdown-item` for entries.
 *   <strct-submenu label="Power">
 *     <strct-dropdown-item>Power on</strct-dropdown-item>
 *     <strct-dropdown-item>Power off</strct-dropdown-item>
 *   </strct-submenu>
 */
@Component({
  selector: 'strct-submenu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <div class="strct-submenu" (mouseenter)="setOpen(true)" (mouseleave)="open.set(false)">
      <div
        #trigger
        class="strct-submenu__trigger"
        role="menuitem"
        tabindex="0"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        (click)="$event.stopPropagation(); setOpen(!open())"
        (keydown.enter)="$event.preventDefault(); $event.stopPropagation(); openFromKeyboard()"
        (keydown.space)="$event.preventDefault(); $event.stopPropagation(); openFromKeyboard()"
        (keydown.arrowright)="$event.preventDefault(); $event.stopPropagation(); openFromKeyboard()"
        (keydown.arrowleft)="$event.stopPropagation(); open.set(false)"
        (keydown.escape)="$event.stopPropagation(); open.set(false)"
      >
        @if (icon()) {
          <strct-icon class="strct-submenu__icon" [name]="icon()" [size]="16" [strokeWidth]="1.3" />
        } @else {
          <span class="strct-submenu__icon-spacer" aria-hidden="true"></span>
        }
        <span class="strct-submenu__label"
          >{{ label() }}<ng-content select="[strctSubmenuLabel]"
        /></span>
        <strct-icon
          class="strct-submenu__arrow"
          name="chevronRight"
          [size]="12"
          [strokeWidth]="1.6"
        />
      </div>
      @if (open()) {
        <div
          #panel
          class="strct-submenu__panel"
          [class.strct-submenu__panel--flip]="flip()"
          [class.strct-submenu__panel--up]="flipUp()"
          role="menu"
          (keydown)="onPanelKeydown($event)"
        >
          <ng-content />
        </div>
      }
    </div>
  `,
  host: { class: 'strct-submenu-host' },
  styles: [
    `
      .strct-submenu {
        position: relative;
      }
      .strct-submenu__trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 8px 7px 10px;
        border-radius: 5px;
        cursor: default;
        font-size: 13px;
        color: var(--t1);
      }
      .strct-submenu__trigger:hover {
        background: var(--bg-3);
      }
      .strct-submenu__trigger:focus-visible {
        outline: none;
        background: var(--bg-3);
      }
      .strct-submenu__icon {
        color: var(--t2);
        flex-shrink: 0;
      }
      .strct-submenu__icon-spacer {
        width: 14px;
        flex-shrink: 0;
      }
      .strct-submenu__label {
        flex: 1;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .strct-submenu__arrow {
        color: var(--t3);
      }
      .strct-submenu__panel {
        position: absolute;
        top: -5px;
        inset-inline-start: 100%;
        z-index: var(--z-base);
        min-width: 170px;
        margin-inline-start: 2px;
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        box-shadow: var(--shh);
        animation: strct-submenu-in 0.1s ease;
      }
      .strct-submenu__panel--flip {
        inset-inline-start: auto;
        inset-inline-end: 100%;
        margin-inline-start: 0;
        margin-inline-end: 2px;
      }
      .strct-submenu__panel--up {
        top: auto;
        bottom: -5px;
      }
      /* RTL: mirror the fly-out affordance and its slide-in direction. */
      [dir='rtl'] .strct-submenu__arrow {
        transform: rotate(180deg);
      }
      [dir='rtl'] .strct-submenu__panel {
        animation-name: strct-submenu-in-rtl;
      }
      @keyframes strct-submenu-in {
        from {
          opacity: 0;
          transform: translateX(-4px);
        }
      }
      @keyframes strct-submenu-in-rtl {
        from {
          opacity: 0;
          transform: translateX(4px);
        }
      }
    `,
  ],
})
export class StrctSubmenu {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly trigger = viewChild<ElementRef<HTMLElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** Label text. */
  readonly label = input('');
  /** Optional leading icon; when omitted the icon column is still reserved so
   *  the label stays aligned with sibling items that do have icons. */
  readonly icon = input('');
  readonly open = signal(false);
  /** Open toward the inline start when the fly-out would overflow the inline-end edge. */
  protected readonly flip = signal(false);
  /** Open upward when the fly-out would overflow the bottom edge. */
  protected readonly flipUp = signal(false);

  protected setOpen(value: boolean): void {
    if (value) {
      const rect = this.host.nativeElement.getBoundingClientRect();
      // The fly-out opens toward the inline end; flip when that side would
      // overflow (right edge in LTR, left edge in RTL).
      const rtl = getComputedStyle(this.host.nativeElement).direction === 'rtl';
      this.flip.set(rtl ? rect.left - 190 < 0 : rect.right + 190 > window.innerWidth);
      this.flipUp.set(rect.bottom + 240 > window.innerHeight);
    }
    this.open.set(value);
  }

  /**
   * Keyboard open (Enter / Space / →): focus the first fly-out entry once the
   * panel has rendered — otherwise the fly-out is a keyboard dead end.
   */
  protected openFromKeyboard(): void {
    this.setOpen(true);
    setTimeout(() => {
      const panel = this.panel()?.nativeElement;
      // Dropdown-item rows carry tabindex=-1, outside FOCUSABLE_SELECTOR —
      // fall back to the first rovable row when nothing else is tabbable.
      if (panel && !focusFirstIn(panel)) this.panelItems()[0]?.focus();
    });
  }

  /**
   * APG keyboarding inside the fly-out: arrows rove, Home/End jump,
   * ← / Escape close and hand focus back to the trigger. Handled keys stop at
   * the panel so a host menu's own roving/Escape does not also run.
   */
  protected onPanelKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (key === 'ArrowLeft' || key === 'Escape') {
      event.stopPropagation();
      this.open.set(false);
      this.trigger()?.nativeElement.focus();
      return;
    }
    const items = this.panelItems();
    if (!items.length) return;
    const idx = items.indexOf(event.target as HTMLElement);
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      const next =
        idx === -1
          ? key === 'ArrowDown'
            ? 0
            : items.length - 1
          : (idx + (key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      event.stopPropagation();
      items[key === 'Home' ? 0 : items.length - 1].focus();
    }
  }

  /** Rovable rows of the open fly-out (dropdown items, skipping disabled). */
  private panelItems(): HTMLElement[] {
    const panel = this.panel()?.nativeElement;
    return panel
      ? [...panel.querySelectorAll<HTMLElement>('strct-dropdown-item:not([aria-disabled="true"])')]
      : [];
  }
}
