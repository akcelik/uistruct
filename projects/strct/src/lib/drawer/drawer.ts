import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  input,
  model,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

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
      <div
        class="strct-drawer__backdrop"
        [class.strct-drawer__backdrop--bare]="!dismissable()"
        (click)="onBackdrop()"
        (keydown.escape)="onEscape()"
        tabindex="-1"
      ></div>
      <aside
        class="strct-drawer strct-drawer--{{ side() }} strct-drawer--{{ size() }}"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title() || 'Panel'"
      >
        @if (title() || dismissable()) {
          <header class="strct-drawer__head">
            <span class="strct-drawer__title">{{ title() }}</span>
            @if (dismissable()) {
              <button
                type="button"
                class="strct-drawer__close"
                aria-label="Close"
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
  host: { class: 'strct-drawer-host' },
  styles: [
    `
      .strct-drawer__backdrop {
        position: fixed;
        inset: 0;
        z-index: 1100;
        background: rgba(0, 0, 0, 0.44);
        backdrop-filter: blur(1px);
        animation: strct-drawer-fade 0.16s ease;
      }
      .strct-drawer__backdrop--bare {
        background: transparent;
        backdrop-filter: none;
      }
      .strct-drawer {
        position: fixed;
        z-index: 1101;
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
        left: 0;
        border-inline-end: 1px solid var(--b2);
        animation: strct-drawer-in-start 0.18s ease;
      }
      .strct-drawer--end {
        right: 0;
        border-inline-start: 1px solid var(--b2);
        animation: strct-drawer-in-end 0.18s ease;
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

  protected readonly footerDef = contentChild(StrctDrawerFooter);
  protected readonly hasFooter = computed(() => !!this.footerDef());

  protected onBackdrop(): void {
    if (this.dismissable()) this.close();
  }
  protected onEscape(): void {
    if (this.dismissable()) this.close();
  }
  close(): void {
    this.open.set(false);
  }
}
