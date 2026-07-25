import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  ViewEncapsulation,
  computed,
  inject,
  input,
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
  /** Optional bold lead-in; kept in the history entry shown by the notification center. */
  title?: string;
}

/**
 * A persistent notification entry. Every shown toast is also recorded here
 * (capped ring buffer) so `<strct-notification-center>` can offer a history
 * view — toasts stay transient, the center is the persistent view. Shares the
 * toast's `id`, so callers can correlate the two.
 */
export interface StrctNotification {
  id: number;
  type: StrctToastType;
  /** Bold lead-in; '' when the toast had no title. */
  title: string;
  message: string;
  /** Epoch ms when the notification was recorded. */
  timestamp: number;
  read: boolean;
}

/** History ring-buffer capacity: only the newest entries survive a burst. */
export const STRCT_NOTIFICATION_HISTORY_LIMIT = 50;

/**
 * Queues transient notifications. Render `<strct-toast-outlet />` once near the
 * app root, then call from anywhere:
 *   inject(StrctToastService).success('Saved');
 */
@Injectable({ providedIn: 'root' })
export class StrctToastService {
  private counter = 0;
  private readonly _toasts = signal<StrctToast[]>([]);
  private readonly _history = signal<StrctNotification[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  readonly toasts = this._toasts.asReadonly();
  /** Persistent entries, oldest → newest, capped at STRCT_NOTIFICATION_HISTORY_LIMIT. */
  readonly history = this._history.asReadonly();
  /** Unread history entries — drives the notification-center badge. */
  readonly unreadCount = computed(() =>
    this._history().reduce((n, item) => n + (item.read ? 0 : 1), 0),
  );

  show(message: string, options: StrctToastOptions = {}): number {
    const id = ++this.counter;
    const duration = options.duration ?? 4000;
    const type = options.type ?? 'info';
    this._toasts.update((list) => [...list, { id, type, message, duration }]);
    this._history.update((list) =>
      [
        ...list,
        { id, type, title: options.title ?? '', message, timestamp: Date.now(), read: false },
      ].slice(-STRCT_NOTIFICATION_HISTORY_LIMIT),
    );
    if (duration > 0) {
      this.startTimer(id, duration);
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

  /**
   * Pause the auto-dismiss countdown (WCAG 2.2.1), e.g. while the toast is
   * hovered or focus is inside it.
   */
  pause(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  /** Resume the auto-dismiss countdown; it restarts from the full duration. */
  resume(id: number): void {
    const toast = this._toasts().find((t) => t.id === id);
    if (toast && toast.duration > 0) {
      this.startTimer(id, toast.duration);
    }
  }

  dismiss(id: number): void {
    this.pause(id);
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this._toasts.set([]);
  }

  /** Flag one history entry as read (id is the one `show` returned). */
  markRead(id: number): void {
    this._history.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  /** Flag every history entry as read — empties the center's unread badge. */
  markAllRead(): void {
    this._history.update((list) => list.map((n) => (n.read ? n : { ...n, read: true })));
  }

  /** Drop the whole history (transient toasts are not affected). */
  clearHistory(): void {
    this._history.set([]);
  }

  private startTimer(id: number, duration: number): void {
    this.pause(id);
    this.timers.set(
      id,
      setTimeout(() => {
        this.timers.delete(id);
        this.dismiss(id);
      }, duration),
    );
  }
}

const TOAST_ICON: Record<StrctToastType, string> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'critical',
};

/** Maximum number of toasts rendered at once; a burst shows only the newest. */
const MAX_VISIBLE_TOASTS = 5;

/**
 * Renders the toast stack, capped at the newest 5 toasts so a burst cannot
 * grow off-viewport. Place once, typically just inside the app shell.
 */
@Component({
  selector: 'strct-toast-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <div class="strct-toasts" role="region" [attr.aria-label]="regionLabel()" aria-live="polite">
      @for (toast of toasts(); track toast.id) {
        <div
          class="strct-toast"
          [class.strct-toast--success]="toast.type === 'success'"
          [class.strct-toast--warning]="toast.type === 'warning'"
          [class.strct-toast--critical]="toast.type === 'critical'"
          [attr.role]="toast.type === 'critical' ? 'alert' : null"
          (mouseenter)="service.pause(toast.id)"
          (mouseleave)="service.resume(toast.id)"
          (focusin)="service.pause(toast.id)"
          (focusout)="service.resume(toast.id)"
        >
          <strct-icon [name]="icon(toast.type)" [size]="16" />
          <span class="strct-toast__msg">{{ toast.message }}</span>
          <button
            type="button"
            class="strct-toast__close"
            [attr.aria-label]="dismissLabel()"
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
        inset-inline-end: var(--space-4);
        z-index: var(--z-toast);
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
        border-inline-start: 3px solid var(--acc);
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
        border-inline-start-color: var(--success);
      }
      .strct-toast--success strct-icon {
        color: var(--success);
      }
      .strct-toast--warning {
        border-inline-start-color: var(--warning);
      }
      .strct-toast--warning strct-icon {
        color: var(--warning);
      }
      .strct-toast--critical {
        border-inline-start-color: var(--critical);
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

      @media (prefers-reduced-motion: reduce) {
        .strct-toast {
          animation: none;
        }
      }
    `,
  ],
})
export class StrctToastOutlet {
  /** Accessible name of the notifications region (localizable). */
  readonly regionLabel = input('Notifications');
  /** Accessible label of the dismiss button (localizable). */
  readonly dismissLabel = input('Dismiss');
  protected readonly service = inject(StrctToastService);
  protected readonly toasts = computed(() => this.service.toasts().slice(-MAX_VISIBLE_TOASTS));
  protected icon(type: StrctToastType): string {
    return TOAST_ICON[type];
  }
}
