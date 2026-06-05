import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/** Toast visual types. */
export type StrctToastType = 'info' | 'success' | 'warning' | 'critical';

/** A single toast notification. */
export interface StrctToast {
  id: number;
  type: StrctToastType;
  message: string;
  /** Auto-dismiss after this many ms; 0 keeps it until dismissed. */
  duration: number;
}

/** Options passed when creating a toast. */
export interface StrctToastOptions {
  type?: StrctToastType;
  duration?: number;
}

/**
 * Queues transient notifications. Render `<strct-toast-outlet />` once near the
 * app root, then call from anywhere:
 *   inject(StrctToastService).success('Saved');
 */
@Injectable({ providedIn: 'root' })
export class StrctToastService {
  private counter = 0;
  private readonly _toasts = signal<StrctToast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, options: StrctToastOptions = {}): number {
    const id = ++this.counter;
    const duration = options.duration ?? 4000;
    this._toasts.update((list) => [
      ...list,
      { id, type: options.type ?? 'info', message, duration },
    ]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    return id;
  }

  info(message: string, duration?: number) {
    return this.show(message, { type: 'info', duration });
  }
  success(message: string, duration?: number) {
    return this.show(message, { type: 'success', duration });
  }
  warning(message: string, duration?: number) {
    return this.show(message, { type: 'warning', duration });
  }
  critical(message: string, duration?: number) {
    return this.show(message, { type: 'critical', duration });
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}

const TOAST_ICON: Record<StrctToastType, string> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'critical',
};

/** Renders the toast stack. Place once, typically just inside the app shell. */
@Component({
  selector: 'strct-toast-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <div class="strct-toasts" role="region" aria-label="Notifications" aria-live="polite">
      @for (toast of service.toasts(); track toast.id) {
        <div
          class="strct-toast"
          [class.strct-toast--success]="toast.type === 'success'"
          [class.strct-toast--warning]="toast.type === 'warning'"
          [class.strct-toast--critical]="toast.type === 'critical'"
        >
          <strct-icon [name]="icon(toast.type)" [size]="15" />
          <span class="strct-toast__msg">{{ toast.message }}</span>
          <button
            type="button"
            class="strct-toast__close"
            aria-label="Dismiss"
            (click)="service.dismiss(toast.id)"
          >
            <strct-icon name="close" [size]="13" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .strct-toasts {
        position: fixed;
        top: var(--space-4);
        right: var(--space-4);
        z-index: 1200;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        max-width: 360px;
        pointer-events: none;
      }
      .strct-toast {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        padding: var(--space-3);
        font-size: 13px;
        color: var(--t1);
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-left: 3px solid var(--acc);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-floating);
        animation: strct-toast-in 0.16s ease;
      }
      .strct-toast strct-icon {
        color: var(--acc);
        margin-top: 1px;
        flex-shrink: 0;
      }
      .strct-toast__msg {
        flex: 1;
      }
      .strct-toast__close {
        flex-shrink: 0;
        display: inline-flex;
        padding: 2px;
        margin: -2px -2px 0 0;
        border: 0;
        background: transparent;
        color: var(--t3);
        cursor: pointer;
        border-radius: 4px;
      }
      .strct-toast__close:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-toast--success {
        border-left-color: var(--success);
      }
      .strct-toast--success strct-icon {
        color: var(--success);
      }
      .strct-toast--warning {
        border-left-color: var(--warning);
      }
      .strct-toast--warning strct-icon {
        color: var(--warning);
      }
      .strct-toast--critical {
        border-left-color: var(--critical);
      }
      .strct-toast--critical strct-icon {
        color: var(--critical);
      }
      @keyframes strct-toast-in {
        from {
          opacity: 0;
          transform: translateX(16px);
        }
      }
    `,
  ],
})
export class StrctToastOutlet {
  protected readonly service = inject(StrctToastService);
  protected icon(type: StrctToastType): string {
    return TOAST_ICON[type];
  }
}
