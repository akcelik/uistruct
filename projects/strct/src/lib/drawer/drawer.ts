import {
  DOCUMENT,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { focusFirstIn, keepTabInside, restoreFocus, saveFocusedElement } from '../overlay/focus';
import { lockBodyScroll, unlockBodyScroll } from '../overlay/scroll-lock';

/** Marks the drawer's footer action area: `<ng-container strctDrawerFooter>…`. */
@Directive({ selector: '[strctDrawerFooter]' })
export class StrctDrawerFooter {}

/** Which edge the drawer slides in from. */
export type StrctDrawerSide = 'start' | 'end' | 'top' | 'bottom';
/** Drawer extent along its sliding axis. */
export type StrctDrawerSize = 'sm' | 'md' | 'lg';

/**
 * Slide-out overlay panel anchored to an edge of the viewport — for inspecting
 * or editing a record without losing the underlying table's scroll/selection.
 *
 *   <strct-drawer [(open)]="editing" side="end" title="Virtual machine">
 *     … body …
 *     <ng-container strctDrawerFooter>
 *       <button strct-button (click)="editing.set(false)">Cancel</button>
 *     </ng-container>
 *   </strct-drawer>
 */
@Component({
  selector: 'strct-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    @if (open()) {
      <!-- Backdrop: pointer-only dismiss target (click-through when not
           dismissable). Keyboard users dismiss via Escape. -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <div
        class="strct-drawer__backdrop"
        [class.strct-drawer__backdrop--bare]="!dismissable()"
        (click)="onBackdrop()"
      ></div>
      <aside
        class="strct-drawer strct-drawer--{{ side() }} strct-drawer--{{ size() }}"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-label]="title() || ariaLabel()"
        (keydown.tab)="onTab($event)"
        (keydown.shift.tab)="onTab($event)"
      >
        @if (title() || dismissable()) {
          <header class="strct-drawer__head">
            <span class="strct-drawer__title">{{ title() }}</span>
            @if (dismissable()) {
              <button
                type="button"
                class="strct-drawer__close"
                [attr.aria-label]="closeLabel()"
                (click)="close()"
              >
                <strct-icon name="close" [size]="15" />
              </button>
            }
          </header>
        }
        <div class="strct-drawer__body"><ng-content /></div>
        @if (hasFooter()) {
          <footer class="strct-drawer__foot"><ng-content select="[strctDrawerFooter]" /></footer>
        }
      </aside>
    }
  `,
  host: {
    class: 'strct-drawer-host',
    '(document:keydown.escape)': 'onEscape($event)',
  },
  styles: [
    `
      .strct-drawer__backdrop {
        position: fixed;
        inset: 0;
        z-index: var(--z-overlay);
        background: var(--backdrop);
        backdrop-filter: blur(1px);
        animation: strct-drawer-fade 0.16s ease;
      }
      .strct-drawer__backdrop--bare {
        background: transparent;
        backdrop-filter: none;
        /* Not dismissable: the transparent backdrop must not swallow clicks. */
        pointer-events: none;
      }
      .strct-drawer {
        position: fixed;
        z-index: calc(var(--z-overlay) + 1);
        display: flex;
        flex-direction: column;
        background: var(--bg-1);
        box-shadow: var(--shh);
      }
      /* Horizontal drawers (start/end) take full height; vertical take full width. */
      .strct-drawer--start,
      .strct-drawer--end {
        top: 0;
        bottom: 0;
        border-radius: 0;
      }
      .strct-drawer--start {
        inset-inline-start: 0;
        border-inline-end: 1px solid var(--b2);
        animation: strct-drawer-in-start 0.18s ease;
      }
      .strct-drawer--end {
        inset-inline-end: 0;
        border-inline-start: 1px solid var(--b2);
        animation: strct-drawer-in-end 0.18s ease;
      }
      /* RTL: start anchors right, so the slide-in mirrors. */
      [dir='rtl'] .strct-drawer--start {
        animation-name: strct-drawer-in-end;
      }
      [dir='rtl'] .strct-drawer--end {
        animation-name: strct-drawer-in-start;
      }
      .strct-drawer--top,
      .strct-drawer--bottom {
        left: 0;
        right: 0;
      }
      .strct-drawer--top {
        top: 0;
        border-bottom: 1px solid var(--b2);
        animation: strct-drawer-in-top 0.18s ease;
      }
      .strct-drawer--bottom {
        bottom: 0;
        border-top: 1px solid var(--b2);
        animation: strct-drawer-in-bottom 0.18s ease;
      }
      /* Size along the sliding axis. */
      .strct-drawer--start.strct-drawer--sm,
      .strct-drawer--end.strct-drawer--sm {
        width: 300px;
      }
      .strct-drawer--start.strct-drawer--md,
      .strct-drawer--end.strct-drawer--md {
        width: 420px;
      }
      .strct-drawer--start.strct-drawer--lg,
      .strct-drawer--end.strct-drawer--lg {
        width: 600px;
      }
      .strct-drawer--top.strct-drawer--sm,
      .strct-drawer--bottom.strct-drawer--sm {
        height: 220px;
      }
      .strct-drawer--top.strct-drawer--md,
      .strct-drawer--bottom.strct-drawer--md {
        height: 340px;
      }
      .strct-drawer--top.strct-drawer--lg,
      .strct-drawer--bottom.strct-drawer--lg {
        height: 480px;
      }
      .strct-drawer {
        max-width: 100vw;
        max-height: 100vh;
      }
      .strct-drawer__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--b1);
        flex-shrink: 0;
      }
      .strct-drawer__title {
        font-size: 15px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-drawer__close {
        display: inline-flex;
        padding: 4px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
        transition:
          color 0.14s ease,
          background 0.14s ease;
      }
      .strct-drawer__close:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-drawer__body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 16px 18px;
        font-size: 13px;
        color: var(--t1);
      }
      .strct-drawer__foot {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 18px;
        border-top: 1px solid var(--b1);
        flex-shrink: 0;
      }
      @keyframes strct-drawer-fade {
        from {
          opacity: 0;
        }
      }
      @keyframes strct-drawer-in-start {
        from {
          transform: translateX(-100%);
        }
      }
      @keyframes strct-drawer-in-end {
        from {
          transform: translateX(100%);
        }
      }
      @keyframes strct-drawer-in-top {
        from {
          transform: translateY(-100%);
        }
      }
      @keyframes strct-drawer-in-bottom {
        from {
          transform: translateY(100%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .strct-drawer__backdrop,
        .strct-drawer {
          animation: none;
        }
      }
    `,
  ],
})
export class StrctDrawer {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);

  /** Open state (two-way). */
  readonly open = model(false);
  /** Edge to anchor to. Defaults to `end` (right in LTR). */
  readonly side = input<StrctDrawerSide>('end');
  /** Extent along the sliding axis. */
  readonly size = input<StrctDrawerSize>('md');
  /** Header title. */
  readonly title = input('');
  /** Show the close button and allow backdrop/Esc dismissal. */
  readonly dismissable = input(true, { transform: booleanAttribute });
  /** Accessible name of the dialog when no `title` is set (localizable). */
  readonly ariaLabel = input('Panel');
  /** Accessible label of the X close button (localizable). */
  readonly closeLabel = input('Close');

  protected readonly footerDef = contentChild(StrctDrawerFooter);
  protected readonly hasFooter = computed(() => !!this.footerDef());

  /** Element that had focus before the drawer opened, restored on close. */
  private previousActive: HTMLElement | null = null;
  /** Whether this instance currently holds a scroll lock. */
  private locked = false;

  constructor() {
    effect(() => {
      const open = this.open();
      if (open && !this.locked) {
        this.locked = true;
        lockBodyScroll(this.doc);
        this.previousActive = saveFocusedElement();
        // Move focus into the panel once it has rendered.
        setTimeout(() => this.focusInitial());
      } else if (!open && this.locked) {
        this.locked = false;
        unlockBodyScroll(this.doc);
        restoreFocus(this.previousActive);
        this.previousActive = null;
      }
    });

    // Release the lock if the drawer is destroyed while still open.
    inject(DestroyRef).onDestroy(() => {
      if (this.locked) {
        this.locked = false;
        unlockBodyScroll(this.doc);
      }
    });
  }

  protected onBackdrop(): void {
    if (this.dismissable()) this.close();
  }

  protected onEscape(event: Event): void {
    if (!this.open() || !this.dismissable()) return;
    // A host modal/drawer must not also close on the same keypress.
    event.stopPropagation();
    this.close();
  }

  /** Wrap Tab focus within the panel. */
  protected onTab(event: Event): void {
    const panel = this.panel();
    if (panel) keepTabInside(event as KeyboardEvent, panel);
  }

  close(): void {
    this.open.set(false);
  }

  private panel(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector('.strct-drawer');
  }

  private focusInitial(): void {
    const panel = this.panel();
    if (!panel) return;
    // Nothing tabbable (empty body, dismissable=false) → focus the panel itself.
    if (!focusFirstIn(panel)) panel.focus();
  }
}
