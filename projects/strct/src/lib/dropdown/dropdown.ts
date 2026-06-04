import {
  ChangeDetectionStrategy,
  Component,
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
 *     <strct-dropdown-item danger>Delete</strct-dropdown-item>
 *   </strct-dropdown>
 */
@Component({
  selector: 'strct-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctOverlay],
  template: `
    <div #trigger class="strct-dd__trigger" (click)="toggle()">
      <ng-content select="[strctDropdownTrigger]" />
    </div>
    @if (open()) {
      <div
        class="strct-dd__menu"
        [strctOverlay]="trigger"
        [strctOverlayPlacement]="align() === 'end' ? 'bottom-end' : 'bottom-start'"
        role="menu"
        (click)="close()"
      >
        <ng-content />
      </div>
    }
  `,
  host: { class: 'strct-dd' },
  styles: [
    `
    .strct-dd { position: relative; display: inline-block; }
    .strct-dd__trigger { display: inline-flex; }
    .strct-dd__menu {
      position: absolute; top: calc(100% + 4px); left: 0; z-index: 200;
      min-width: 170px; padding: 4px;
      background: var(--bg-1); border: 1px solid var(--b2);
      border-radius: 7px; box-shadow: var(--shh);
      animation: strct-dd-in .1s ease;
    }
    .strct-dd__menu--end { left: auto; right: 0; }
    @keyframes strct-dd-in { from { opacity: 0; transform: translateY(-4px); } }
    `,
  ],
})
export class StrctDropdown {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly align = input<'start' | 'end'>('start');
  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
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

/** A selectable row inside a `<strct-dropdown>`. */
@Component({
  selector: 'strct-dropdown-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: {
    class: 'strct-dd__item',
    role: 'menuitem',
    '[class.strct-dd__item--danger]': 'danger()',
    '[attr.aria-disabled]': 'disabled() || null',
  },
  styles: [
    `
    .strct-dd__item {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 10px; border-radius: 5px; cursor: pointer;
      font-size: 13px; color: var(--t1);
    }
    .strct-dd__item:hover { background: var(--bg-3); }
    .strct-dd__item--danger { color: var(--crt); }
    .strct-dd__item--danger:hover { background: var(--crt-bg); }
    .strct-dd__item[aria-disabled='true'] { color: var(--t4); pointer-events: none; }
    `,
  ],
})
export class StrctDropdownItem {
  readonly danger = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
}

/** Thin separator between groups of menu items. */
@Component({
  selector: 'strct-dropdown-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '',
  host: { class: 'strct-dd__divider', role: 'separator' },
  styles: [`.strct-dd__divider { display: block; height: 1px; margin: 4px 6px; background: var(--b2); }`],
})
export class StrctDropdownDivider {}
