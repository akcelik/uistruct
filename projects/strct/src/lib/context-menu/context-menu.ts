import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  HostListener,
  signal,
} from '@angular/core';

/**
 * Right-click (context) menu. Wraps a trigger area and shows a menu at the
 * cursor. Reuse `strct-dropdown-item` for the entries:
 *   <strct-context-menu>
 *     <div>Right-click here</div>
 *     <ng-container strctContextMenuItems>
 *       <strct-dropdown-item>Open</strct-dropdown-item>
 *       <strct-dropdown-item danger>Delete</strct-dropdown-item>
 *     </ng-container>
 *   </strct-context-menu>
 */
@Component({
  selector: 'strct-context-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="strct-ctx__trigger" (contextmenu)="onContextMenu($event)">
      <ng-content />
    </div>
    @if (open()) {
      <div
        class="strct-ctx__menu"
        role="menu"
        [style.left.px]="x()"
        [style.top.px]="y()"
        (click)="close()"
        (contextmenu)="$event.preventDefault(); close()"
      >
        <ng-content select="[strctContextMenuItems]" />
      </div>
    }
  `,
  host: { class: 'strct-ctx' },
  styles: [
    `
    .strct-ctx { display: block; }
    .strct-ctx__menu {
      position: fixed; z-index: 1100; min-width: 180px; padding: 4px;
      background: var(--bg-1); border: 1px solid var(--b2);
      border-radius: 7px; box-shadow: var(--shh);
      animation: strct-ctx-in .1s ease;
    }
    @keyframes strct-ctx-in { from { opacity: 0; transform: scale(.97); } }
    `,
  ],
})
export class StrctContextMenu {
  readonly open = signal(false);
  readonly x = signal(0);
  readonly y = signal(0);

  /** Approximate menu box used to keep it inside the viewport. */
  private static readonly MENU_W = 190;
  private static readonly MENU_H = 240;

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    this.x.set(Math.min(event.clientX, vw - StrctContextMenu.MENU_W));
    this.y.set(Math.min(event.clientY, vh - StrctContextMenu.MENU_H));
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:click')
  protected onDocClick(): void {
    if (this.open()) this.close();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.close();
  }
}
