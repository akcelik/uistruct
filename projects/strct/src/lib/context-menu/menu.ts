import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  NgZone,
  OnDestroy,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  createComponent,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/** A single entry in a data-driven menu. */
export interface StrctMenuItem {
  label: string;
  icon?: string;
  /** Destructive styling. */
  danger?: boolean;
  disabled?: boolean;
  /** Render a separator instead of an entry (label is ignored). */
  divider?: boolean;
  /** Nested submenu. */
  children?: StrctMenuItem[];
  /** Invoked on selection, with the trigger's `strctContextMenuData`. */
  action?: (data?: unknown) => void;
  /** Arbitrary payload. */
  data?: unknown;
}

/**
 * Floating menu panel — portaled into `<body>` (so it escapes overflow /
 * transform clipping), positioned by its real measured size, with full keyboard
 * navigation and recursive submenus. Usually created by `[strctContextMenu]`,
 * but can be embedded directly with `submenu`.
 */
@Component({
  selector: 'strct-menu-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <div class="strct-menu" role="menu" tabindex="-1" (keydown)="onKeydown($event)">
      @for (item of items(); track $index; let i = $index) {
        @if (item.divider) {
          <div class="strct-menu__sep" role="separator"></div>
        } @else {
          <div class="strct-menu__wrap" (mouseenter)="onHover(i)" (mouseleave)="onLeave(i)">
            <button
              type="button"
              class="strct-menu__item"
              [attr.data-idx]="i"
              [class.strct-menu__item--danger]="item.danger"
              [class.strct-menu__item--active]="i === activeIndex()"
              [disabled]="item.disabled"
              role="menuitem"
              [attr.aria-haspopup]="item.children?.length ? 'menu' : null"
              [attr.aria-expanded]="item.children?.length ? openSubIndex() === i : null"
              [attr.tabindex]="i === activeIndex() ? 0 : -1"
              (click)="onItemClick(item, i, $event)"
            >
              @if (item.icon) {
                <strct-icon class="strct-menu__icon" [name]="item.icon" [size]="14" [strokeWidth]="1.3" />
              } @else {
                <span class="strct-menu__icon-spacer" aria-hidden="true"></span>
              }
              <span class="strct-menu__label">{{ item.label }}</span>
              @if (item.children?.length) {
                <strct-icon class="strct-menu__arrow" name="chevronRight" [size]="12" [strokeWidth]="1.6" />
              }
            </button>
            @if (openSubIndex() === i && item.children?.length) {
              <strct-menu-panel
                submenu
                class="strct-menu__subpanel"
                [class.strct-menu__subpanel--flip]="flipLeft()"
                [items]="item.children!"
                [data]="data()"
                (select)="select.emit($event)"
                (close)="close.emit()"
                (back)="closeSub(); focusItem(i)"
              />
            }
          </div>
        }
      }
    </div>
  `,
  host: {
    class: 'strct-menu-host',
    '[style.position]': "submenu() ? null : 'fixed'",
    '[style.left.px]': 'submenu() ? null : posX()',
    '[style.top.px]': 'submenu() ? null : posY()',
    '[style.zIndex]': 'submenu() ? null : 1100',
  },
  styles: [
    `
    .strct-menu-host { display: block; }
    .strct-menu {
      min-width: 180px; padding: 4px;
      background: var(--bg-1); border: 1px solid var(--b2);
      border-radius: 7px; box-shadow: var(--shh);
      animation: strct-menu-in .1s ease;
    }
    .strct-menu:focus { outline: none; }
    .strct-menu__wrap { position: relative; }
    .strct-menu__item {
      display: flex; align-items: center; gap: 8px; width: 100%;
      padding: 7px 8px 7px 10px; border: 0; border-radius: 5px; cursor: pointer;
      background: transparent; color: var(--t1); font-size: 13px; font-family: var(--font);
      text-align: left;
    }
    .strct-menu__item:hover:not(:disabled),
    .strct-menu__item--active:not(:disabled) { background: var(--bg-3); }
    .strct-menu__item:focus-visible { outline: none; background: var(--bg-3); }
    .strct-menu__item--danger { color: var(--crt); }
    .strct-menu__item--danger:hover:not(:disabled),
    .strct-menu__item--danger.strct-menu__item--active:not(:disabled) { background: var(--crt-bg); }
    .strct-menu__item:disabled { opacity: .45; cursor: not-allowed; }
    .strct-menu__icon { color: var(--t2); flex-shrink: 0; }
    .strct-menu__item--danger .strct-menu__icon { color: var(--crt); }
    .strct-menu__icon-spacer { width: 14px; flex-shrink: 0; }
    .strct-menu__label { flex: 1; white-space: nowrap; }
    .strct-menu__arrow { color: var(--t3); flex-shrink: 0; }
    .strct-menu__sep { height: 1px; margin: 4px 6px; background: var(--b1); }

    .strct-menu__subpanel { position: absolute; top: -5px; left: 100%; margin-left: 2px; z-index: 1; }
    .strct-menu__subpanel--flip { left: auto; right: 100%; margin-left: 0; margin-right: 2px; }
    @keyframes strct-menu-in { from { opacity: 0; transform: scale(.97); } }
    `,
  ],
})
export class StrctMenuPanel {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  readonly items = input.required<StrctMenuItem[]>();
  readonly data = input<unknown>(undefined);
  readonly x = input(0);
  readonly y = input(0);
  readonly submenu = input(false, { transform: booleanAttribute });

  readonly select = output<StrctMenuItem>();
  readonly close = output<void>();
  /** ArrowLeft inside a submenu — asks the parent to close it. */
  readonly back = output<void>();

  protected readonly posX = signal(0);
  protected readonly posY = signal(0);
  protected readonly flipLeft = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly openSubIndex = signal<number | null>(null);

  private readonly navIndices = computed(() =>
    this.items()
      .map((it, i) => (it.divider ? -1 : i))
      .filter((i) => i >= 0),
  );

  constructor() {
    this.posX.set(this.x());
    this.posY.set(this.y());
    afterNextRender(() => {
      this.activeIndex.set(this.navIndices()[0] ?? 0);
      if (!this.submenu()) this.clampToViewport();
      this.focusItem(this.activeIndex());
    });
  }

  private clampToViewport(): void {
    const host = this.host.nativeElement;
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const m = 6;
    let nx = this.x();
    let ny = this.y();
    if (nx + w > vw - m) nx = Math.max(m, Math.min(this.x() - w, vw - w - m));
    if (ny + h > vh - m) ny = Math.max(m, vh - h - m);
    this.posX.set(nx);
    this.posY.set(ny);
    // Submenus of a panel near the right edge open to the left.
    this.flipLeft.set(nx + w > vw - 220);
  }

  protected focusItem(i: number): void {
    this.activeIndex.set(i);
    this.host.nativeElement
      .querySelector<HTMLElement>(`.strct-menu__item[data-idx="${i}"]`)
      ?.focus();
  }

  private move(dir: 1 | -1): void {
    const nav = this.navIndices();
    if (!nav.length) return;
    const pos = nav.indexOf(this.activeIndex());
    const next = nav[(pos + dir + nav.length) % nav.length];
    this.openSubIndex.set(null);
    this.focusItem(next);
  }

  protected onHover(i: number): void {
    this.activeIndex.set(i);
    const it = this.items()[i];
    this.openSubIndex.set(it?.children?.length ? i : null);
  }

  protected onLeave(i: number): void {
    if (this.openSubIndex() === i) this.openSubIndex.set(null);
  }

  protected onItemClick(item: StrctMenuItem, i: number, event: Event): void {
    event.stopPropagation();
    if (item.disabled) return;
    if (item.children?.length) {
      this.openSubIndex.set(this.openSubIndex() === i ? null : i);
      this.focusItem(i);
    } else {
      this.select.emit(item);
    }
  }

  protected closeSub(): void {
    this.openSubIndex.set(null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const item = this.items()[this.activeIndex()];
    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        this.move(-1);
        break;
      case 'Home':
        event.preventDefault();
        event.stopPropagation();
        this.focusItem(this.navIndices()[0] ?? 0);
        break;
      case 'End':
        event.preventDefault();
        event.stopPropagation();
        this.focusItem(this.navIndices().at(-1) ?? 0);
        break;
      case 'ArrowRight':
        if (item?.children?.length) {
          event.preventDefault();
          event.stopPropagation();
          this.openSubIndex.set(this.activeIndex());
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        event.stopPropagation();
        if (this.openSubIndex() != null) this.closeSub();
        else if (this.submenu()) this.back.emit();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        if (item && !item.disabled) {
          if (item.children?.length) this.openSubIndex.set(this.activeIndex());
          else this.select.emit(item);
        }
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close.emit();
        break;
    }
  }
}

/**
 * Right-click (context) menu driven by a data array. Attach to any trigger; the
 * menu portals into `<body>` and runs each item's `action` on selection.
 *   <div [strctContextMenu]="menuFor(host)" [strctContextMenuData]="host"
 *        (menuSelect)="onPick($event)">…</div>
 */
@Directive({ selector: '[strctContextMenu]' })
export class StrctContextMenuTrigger implements OnDestroy {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly zone = inject(NgZone);
  private readonly doc = inject(DOCUMENT);

  readonly items = input.required<StrctMenuItem[]>({ alias: 'strctContextMenu' });
  readonly data = input<unknown>(undefined, { alias: 'strctContextMenuData' });
  readonly menuSelect = output<StrctMenuItem>();

  private ref: ComponentRef<StrctMenuPanel> | null = null;
  private readonly onClose = () => this.zone.run(() => this.closeMenu());

  @HostListener('contextmenu', ['$event'])
  protected onContextMenu(event: MouseEvent): void {
    if (!this.items()?.length) return;
    event.preventDefault();
    this.openAt(event.clientX, event.clientY);
  }

  private openAt(x: number, y: number): void {
    this.closeMenu();
    const ref = createComponent(StrctMenuPanel, { environmentInjector: this.envInjector });
    ref.setInput('items', this.items());
    ref.setInput('data', this.data());
    ref.setInput('x', x);
    ref.setInput('y', y);
    ref.instance.select.subscribe((item) => {
      item.action?.(this.data());
      this.menuSelect.emit(item);
      this.closeMenu();
    });
    ref.instance.close.subscribe(() => this.closeMenu());

    this.appRef.attachView(ref.hostView);
    this.doc.body.appendChild(ref.location.nativeElement);
    this.ref = ref;

    // Defer global listeners so the opening right-click doesn't immediately close.
    setTimeout(() => {
      this.zone.runOutsideAngular(() => {
        this.doc.addEventListener('mousedown', this.onOutside, true);
        window.addEventListener('scroll', this.onClose, true);
        window.addEventListener('resize', this.onClose);
      });
    });
  }

  private readonly onOutside = (event: Event) => {
    if (this.ref && !this.ref.location.nativeElement.contains(event.target as Node)) {
      this.onClose();
    }
  };

  private closeMenu(): void {
    if (!this.ref) return;
    this.doc.removeEventListener('mousedown', this.onOutside, true);
    window.removeEventListener('scroll', this.onClose, true);
    window.removeEventListener('resize', this.onClose);
    this.appRef.detachView(this.ref.hostView);
    this.ref.destroy();
    this.ref = null;
  }

  ngOnDestroy(): void {
    this.closeMenu();
  }
}
