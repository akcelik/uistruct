import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, signal } from '@angular/core';
import { StrctIcon } from '../icon/icon';

/**
 * A nested fly-out inside a `strct-context-menu` or `strct-dropdown`. Reuse
 * `strct-dropdown-item` for the nested entries.
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
    <div class="strct-submenu" (mouseenter)="open.set(true)" (mouseleave)="open.set(false)">
      <div
        class="strct-submenu__trigger"
        role="menuitem"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        (click)="$event.stopPropagation()"
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
        <div class="strct-submenu__panel" role="menu"><ng-content /></div>
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
    @keyframes strct-submenu-in { from { opacity: 0; transform: translateX(-4px); } }
    `,
  ],
})
export class StrctSubmenu {
  readonly label = input('');
  /** Optional leading icon; when omitted the icon column is still reserved so
   *  the label stays aligned with sibling items that do have icons. */
  readonly icon = input('');
  readonly open = signal(false);
}
