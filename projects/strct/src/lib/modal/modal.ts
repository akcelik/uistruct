import {
  DOCUMENT,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/** Fixed modal width presets: sm 380 · md 480 · lg 640 · xl 860 (px). */
export type StrctModalSize = 'sm' | 'md' | 'lg' | 'xl';

let modalCounter = 0;

// Body scroll-lock shared across any number of simultaneously open modals.
let scrollLockCount = 0;
let savedBodyOverflow = '';
function lockBodyScroll(doc: Document): void {
  if (scrollLockCount === 0) {
    savedBodyOverflow = doc.body.style.overflow;
    doc.body.style.overflow = 'hidden';
  }
  scrollLockCount++;
}
function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) doc.body.style.overflow = savedBodyOverflow;
}

/**
 * Overlay dialog with two-way `open`:
 *   <strct-modal [(open)]="show" title="Confirm">
 *     Body…
 *     <ng-container strctModalFooter>
 *       <button strct-button (click)="show = false">Cancel</button>
 *     </ng-container>
 *   </strct-modal>
 */
@Component({
  selector: 'strct-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StrctIcon],
  template: `
    @if (open()) {
      <div
        class="strct-modal__overlay"
        role="button"
        tabindex="0"
        (click)="onBackdrop()"
        (keydown.enter)="onBackdrop()"
        (keydown.space)="onBackdrop()"
      >
        <div
          #dialog
          class="strct-modal__dialog strct-modal__dialog--{{ size() }}"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="title() ? titleId : null"
          tabindex="-1"
          (click)="$event.stopPropagation()"
          (keydown.tab)="onTab($event)"
          (keydown.shift.tab)="onTab($event)"
        >
          <div class="strct-modal__head">
            <span class="strct-modal__title" [id]="titleId">{{ title() }}</span>
            <button type="button" class="strct-modal__close" aria-label="Close" (click)="close()">
              <strct-icon name="close" [size]="14" />
            </button>
          </div>
          <div class="strct-modal__body"><ng-content /></div>
          @if (!hideFooter()) {
            <div class="strct-modal__foot"><ng-content select="[strctModalFooter]" /></div>
          }
        </div>
      </div>
    }
  `,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  styles: [
    `
      .strct-modal__overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-5);
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        animation: strct-modal-fade 0.12s ease;
      }
      @media (max-width: 768px) {
        .strct-modal__overlay {
          padding: var(--space-3);
        }
      }
      .strct-modal__dialog {
        width: 100%;
        max-height: calc(100vh - 48px);
        display: flex;
        flex-direction: column;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-elevated);
        overflow: hidden;
        animation: strct-modal-rise 0.14s ease;
      }
      /* Fixed width scale — the only widths a modal can take. */
      .strct-modal__dialog--sm {
        max-width: min(380px, calc(100vw - 32px));
      }
      .strct-modal__dialog--md {
        max-width: min(480px, calc(100vw - 32px));
      }
      .strct-modal__dialog--lg {
        max-width: min(640px, calc(100vw - 32px));
      }
      .strct-modal__dialog--xl {
        max-width: min(860px, calc(100vw - 32px));
      }
      .strct-modal__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--b1);
      }
      .strct-modal__title {
        font-size: 14px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-modal__close {
        display: inline-flex;
        padding: 4px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
      }
      .strct-modal__close:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-modal__body {
        padding: var(--space-4);
        overflow-y: auto;
        color: var(--t2);
        font-size: 13px;
      }
      .strct-modal__foot {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        border-top: 1px solid var(--b1);
        background: var(--bg-2);
      }
      @keyframes strct-modal-fade {
        from {
          opacity: 0;
        }
      }
      @keyframes strct-modal-rise {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.98);
        }
      }
    `,
  ],
})
export class StrctModal {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);

  /** Whether the panel is open (two-way). */
  readonly open = model(false);
  /** Dialog title. */
  readonly title = input('');
  /** Size variant. */
  readonly size = input<StrctModalSize>('md');
  /** Hide the footer slot. */
  readonly hideFooter = input(false, { transform: booleanAttribute });
  /**
   * Allow closing via a backdrop click / the Escape key. **Off by default** —
   * a modal closes only through its X button or an explicit action button, so a
   * stray click outside (or Escape) never discards in-progress work. Set
   * `dismissible` for lightweight, transient dialogs where quick dismissal is fine.
   */
  readonly dismissible = input(false, { transform: booleanAttribute });
  /** Emitted when the alert is dismissed. */
  readonly closed = output<void>();

  protected readonly titleId = `strct-modal-${++modalCounter}`;
  /** Element that had focus before the dialog opened, restored on close. */
  private previousActive: HTMLElement | null = null;
  /** Whether this instance currently holds a scroll lock. */
  private locked = false;

  constructor() {
    effect(() => {
      const open = this.open();
      if (open && !this.locked) {
        this.locked = true;
        lockBodyScroll(this.doc);
        this.previousActive = this.doc.activeElement as HTMLElement | null;
        // Move focus into the dialog once it has rendered.
        setTimeout(() => this.focusInitial());
      } else if (!open && this.locked) {
        this.locked = false;
        unlockBodyScroll(this.doc);
        if (this.previousActive) {
          this.previousActive.focus?.();
          this.previousActive = null;
        }
      }
    });

    // Release the lock if the modal is destroyed while still open.
    inject(DestroyRef).onDestroy(() => {
      if (this.locked) {
        this.locked = false;
        unlockBodyScroll(this.doc);
      }
    });
  }

  close(): void {
    this.open.set(false);
    this.closed.emit();
  }

  protected onBackdrop(): void {
    if (this.dismissible()) this.close();
  }

  protected onEscape(): void {
    if (this.open() && this.dismissible()) this.close();
  }

  /** Wrap Tab focus within the dialog. */
  protected onTab(event: Event): void {
    const e = event as KeyboardEvent;
    const items = this.focusable();
    if (!items.length) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = this.doc.activeElement;
    if (e.shiftKey && (active === first || !this.dialog()?.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  private dialog(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector('.strct-modal__dialog');
  }

  private focusable(): HTMLElement[] {
    const dialog = this.dialog();
    if (!dialog) return [];
    return Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null || el === this.doc.activeElement);
  }

  private focusInitial(): void {
    const items = this.focusable();
    (items[0] ?? this.dialog())?.focus();
  }
}
