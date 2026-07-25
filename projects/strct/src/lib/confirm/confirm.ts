import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctButton } from '../button/button';
import { StrctModal } from '../modal/modal';

/** Confirm-dialog tone: `critical` styles the confirm button as destructive. */
export type StrctConfirmTone = 'default' | 'critical';

/** Options passed when asking for confirmation. */
export interface StrctConfirmOptions {
  /** Dialog title. */
  title: string;
  /** Body text spelling out the consequences. */
  message: string;
  /** Confirm button label — falls back to the outlet's `confirmLabel`. */
  confirmLabel?: string;
  /** Cancel button label — falls back to the outlet's `cancelLabel`. */
  cancelLabel?: string;
  /** `critical` renders the confirm button in the destructive tone. */
  tone?: StrctConfirmTone;
}

/** A pending confirmation, with its promise resolver attached. */
interface StrctConfirmRequest extends StrctConfirmOptions {
  resolve: (ok: boolean) => void;
}

/**
 * Promise-based confirmation for destructive actions. Render
 * `<strct-confirm-outlet />` once near the app root, then await from anywhere:
 *   if (await inject(StrctConfirmService).confirm({ title: 'Delete row?', message: '…', tone: 'critical' })) { … }
 */
@Injectable({ providedIn: 'root' })
export class StrctConfirmService {
  private readonly _active = signal<StrctConfirmRequest | null>(null);
  /** The confirmation currently on screen, if any. */
  readonly active = this._active.asReadonly();

  /**
   * Ask the user to confirm; resolves `true` on confirm, `false` on cancel,
   * the X, Escape or a backdrop click. One dialog at a time — a new call
   * cancels (resolves `false`) the pending one.
   */
  confirm(options: StrctConfirmOptions): Promise<boolean> {
    this.settle(false);
    return new Promise<boolean>((resolve) => {
      this._active.set({ tone: 'default', ...options, resolve });
    });
  }

  /** Resolve the pending confirmation and close the dialog. */
  settle(result: boolean): void {
    const req = this._active();
    if (!req) return;
    this._active.set(null);
    req.resolve(result);
  }
}

/**
 * Renders the active confirmation as a small strct-modal (focus trap, Escape /
 * backdrop dismissal and focus restore included). Place once, typically just
 * inside the app shell. The default labels are inputs, so an app can localize
 * every confirm() call in one place.
 */
@Component({
  selector: 'strct-confirm-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctModal, StrctButton],
  template: `
    <strct-modal
      [open]="req() !== null"
      [title]="req()?.title ?? ''"
      size="sm"
      dismissible
      [closeLabel]="closeLabel()"
      (closed)="service.settle(false)"
    >
      <!-- One projectable node per @if: mixing the body and the footer slot in
           a single block would break strctModalFooter content projection. -->
      @if (req(); as r) {
        <p class="strct-confirm__message">{{ r.message }}</p>
      }
      @if (req(); as r) {
        <ng-container strctModalFooter>
          <button
            type="button"
            strct-button
            class="strct-confirm__cancel"
            (click)="service.settle(false)"
          >
            {{ r.cancelLabel ?? cancelLabel() }}
          </button>
          <button
            type="button"
            strct-button
            [variant]="r.tone === 'critical' ? 'critical' : 'primary'"
            (click)="service.settle(true)"
          >
            {{ r.confirmLabel ?? confirmLabel() }}
          </button>
        </ng-container>
      }
    </strct-modal>
  `,
  styles: [
    `
      .strct-confirm__message {
        margin: 0;
        color: var(--t2);
      }
    `,
  ],
})
export class StrctConfirmOutlet {
  /** Default confirm button label (localizable). */
  readonly confirmLabel = input('Confirm');
  /** Default cancel button label (localizable). */
  readonly cancelLabel = input('Cancel');
  /** Accessible label of the X close button (localizable). */
  readonly closeLabel = input('Close');

  protected readonly service = inject(StrctConfirmService);
  protected readonly req = computed(() => this.service.active());
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  /** The request the safe-default focus was already applied for. */
  private focusedFor: StrctConfirmRequest | null = null;

  constructor() {
    afterRenderEffect(() => {
      const req = this.service.active();
      if (!req || req === this.focusedFor) return;
      this.focusedFor = req;
      // Safe default: focus Cancel, never the destructive action. The modal
      // schedules its own initial focus (the X button) on a macrotask when it
      // opens — queue ours behind it, after this render, so Cancel wins.
      setTimeout(() => {
        this.host.nativeElement.querySelector<HTMLElement>('.strct-confirm__cancel')?.focus();
      });
    });
  }
}
