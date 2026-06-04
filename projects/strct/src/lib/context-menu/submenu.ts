import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/**
 * A nested fly-out inside a `strct-context-menu` or `strct-dropdown`. Opens on
 * hover, click/tap, or the keyboard (Enter / Space / →), and flips to the left
 * near the right edge of the viewport. Reuse `strct-dropdown-item` for entries.
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
        class="strct-submenu__trigger"
        role="menuitem"
        tabindex="0"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        (click)="$event.stopPropagation(); setOpen(!open())"
        (keydown.enter)="$event.preventDefault(); $event.stopPropagation(); setOpen(true)"
        (keydown.space)="$event.preventDefault(); $event.stopPropagation(); setOpen(true)"
        (keydown.arrowright)="$event.preventDefault(); $event.stopPropagation(); setOpen(true)"
        (keydown.arrowleft)="$event.stopPropagation(); open.set(false)"
        (keydown.escape)="$event.stopPropagation(); open.set(false)"
      >
        @if (icon()) {
          <strct-icon class="strct-submenu__icon" [name]="icon()" [size]="14" [strokeWidth]="1.3" />
        } @else {
          <span class="strct-submenu__icon-spacer" aria-hidden="true"></span>
        }
        <span class="strct-submenu__label">{{ label() }}<ng-content select="[strctSubmenuLabel]" /></span>
        <strct-icon class="strct-submenu__arrow" name="chevronRight" [size]="12" [strokeWidth]="1.6" />
      </div>
      @if (open()) {
        <div class="strct-submenu__panel" [class.strct-submenu__panel--flip]="flip()" role="menu">
          <ng-content />
        </div>
      }
    </div>
  `,
  host: { class: 'strct-submenu-host' },
  styles: [
    `
    .strct-submenu { position: relative; }
    .strct-submenu__trigger {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 8px 7px 10px; border-radius: 5px; cursor: default;
      font-size: 13px; color: var(--t1);
    }
    .strct-submenu__trigger:hover { background: var(--bg-3); }
    .strct-submenu__trigger:focus-visible { outline: none; background: var(--bg-3); }
    .strct-submenu__icon { color: var(--t2); flex-shrink: 0; }
    .strct-submenu__icon-spacer { width: 14px; flex-shrink: 0; }
    .strct-submenu__label { flex: 1; display: inline-flex; align-items: center; gap: 8px; }
    .strct-submenu__arrow { color: var(--t3); }
    .strct-submenu__panel {
      position: absolute; top: -5px; left: 100%; z-index: 1; min-width: 170px;
      margin-left: 2px; padding: 4px;
      background: var(--bg-1); border: 1px solid var(--b2);
      border-radius: 7px; box-shadow: var(--shh);
      animation: strct-submenu-in .1s ease;
    }
    .strct-submenu__panel--flip { left: auto; right: 100%; margin-left: 0; margin-right: 2px; }
    @keyframes strct-submenu-in { from { opacity: 0; transform: translateX(-4px); } }
    `,
  ],
})
export class StrctSubmenu {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly label = input('');
  /** Optional leading icon; when omitted the icon column is still reserved so
   *  the label stays aligned with sibling items that do have icons. */
  readonly icon = input('');
  readonly open = signal(false);
  /** Open to the left when the fly-out would overflow the right edge. */
  protected readonly flip = signal(false);

  protected setOpen(value: boolean): void {
    if (value) {
      const rect = this.host.nativeElement.getBoundingClientRect();
      this.flip.set(rect.right + 190 > window.innerWidth);
    }
    this.open.set(value);
  }
}
