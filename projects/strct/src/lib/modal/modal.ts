import {
  DOCUMENT,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

export type StrctModalSize = 'sm' | 'md' | 'lg';

let modalCounter = 0;

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
      <div class="strct-modal__overlay" (click)="onBackdrop()">
        <div
          #dialog
          class="strct-modal__dialog"
          [class.strct-modal__dialog--sm]="size() === 'sm'"
          [class.strct-modal__dialog--lg]="size() === 'lg'"
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
      position: fixed; inset: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 24px;
      background: rgba(0,0,0,.5); backdrop-filter: blur(2px);
      animation: strct-modal-fade .12s ease;
    }
    .strct-modal__dialog {
      width: 100%; max-width: 460px; max-height: calc(100vh - 48px);
      display: flex; flex-direction: column;
      background: var(--bg-1); border: 1px solid var(--b2);
      border-radius: 10px; box-shadow: var(--shh); overflow: hidden;
      animation: strct-modal-rise .14s ease;
    }
    .strct-modal__dialog--sm { max-width: 360px; }
    .strct-modal__dialog--lg { max-width: 720px; }
    .strct-modal__head {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 14px 18px; border-bottom: 1px solid var(--b1);
    }
    .strct-modal__title { font-size: 14px; font-weight: 600; color: var(--t1); }
    .strct-modal__close {
      display: inline-flex; padding: 4px; border: 0; border-radius: 5px;
      background: transparent; color: var(--t3); cursor: pointer;
    }
    .strct-modal__close:hover { color: var(--t1); background: var(--bg-3); }
    .strct-modal__body { padding: 18px; overflow-y: auto; color: var(--t2); font-size: 13px; }
    .strct-modal__foot {
      display: flex; align-items: center; justify-content: flex-end; gap: 8px;
      padding: 13px 18px; border-top: 1px solid var(--b1); background: var(--bg-2);
    }
    @keyframes strct-modal-fade { from { opacity: 0; } }
    @keyframes strct-modal-rise { from { opacity: 0; transform: translateY(8px) scale(.98); } }
    `,
  ],
})
export class StrctModal {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);

  readonly open = model(false);
  readonly title = input('');
  readonly size = input<StrctModalSize>('md');
  readonly hideFooter = input(false, { transform: booleanAttribute });
  /** Allow closing via backdrop click / Escape. */
  readonly dismissable = input(true, { transform: booleanAttribute });
  readonly closed = output<void>();

  protected readonly titleId = `strct-modal-${++modalCounter}`;
  /** Element that had focus before the dialog opened, restored on close. */
  private previousActive: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.previousActive = this.doc.activeElement as HTMLElement | null;
        // Move focus into the dialog once it has rendered.
        setTimeout(() => this.focusInitial());
      } else if (this.previousActive) {
        this.previousActive.focus?.();
        this.previousActive = null;
      }
    });
  }

  close(): void {
    this.open.set(false);
    this.closed.emit();
  }

  protected onBackdrop(): void {
    if (this.dismissable()) this.close();
  }

  protected onEscape(): void {
    if (this.open() && this.dismissable()) this.close();
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
