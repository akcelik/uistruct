import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctOverlay } from '../overlay/overlay';
import { focusFirstIn, restoreFocus, saveFocusedElement } from '../overlay/focus';
import { StrctNotification, StrctToastService, StrctToastType } from '../toast/toast';

const TYPE_ICON: Record<StrctToastType, string> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'critical',
};

/** Badge saturates past this count (shows `99+`) so it never grows the bell. */
const MAX_BADGE = 99;

/**
 * Bell button with an unread badge that opens an anchored panel listing the
 * recent notifications recorded by `StrctToastService` — every shown toast is
 * kept in a capped history, so the center is the persistent view of what the
 * toasts announced transiently:
 *   <strct-notification-center (activated)="open($event)" />
 *
 * Clicking an entry marks it read and emits it through `activated` (wire it to
 * navigation); "mark all read" / "clear all" act on the shared history. Focus
 * moves into the panel on open, Escape closes with stopPropagation (a host
 * modal must not close too), and focus returns to the bell on close.
 */
@Component({
  selector: 'strct-notification-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctOverlay],
  template: `
    <button
      #bell
      type="button"
      class="strct-nc__bell"
      [attr.aria-label]="bellAria()"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      (click)="toggle()"
    >
      <strct-icon name="bell" [size]="16" />
      @if (unread() > 0) {
        <span class="strct-nc__badge" aria-hidden="true">{{ badgeText() }}</span>
      }
    </button>

    @if (open()) {
      <div
        #panel
        class="strct-nc__panel"
        role="dialog"
        [attr.aria-label]="title()"
        tabindex="-1"
        [strctOverlay]="bell"
        strctOverlayPlacement="bottom-end"
        (keydown)="onPanelKeydown($event)"
      >
        <div class="strct-nc__head">
          <span class="strct-nc__title">{{ title() }}</span>
          @if (hasHistory()) {
            <button type="button" class="strct-nc__action" (click)="markAllRead()">
              {{ markAllReadLabel() }}
            </button>
            <button type="button" class="strct-nc__action" (click)="clearAll()">
              {{ clearLabel() }}
            </button>
          }
        </div>

        @if (items().length) {
          <ul class="strct-nc__list">
            @for (n of items(); track n.id) {
              <li>
                <button
                  type="button"
                  class="strct-nc__item"
                  [class.strct-nc__item--unread]="!n.read"
                  (click)="activate(n)"
                >
                  <strct-icon [name]="icon(n.type)" [size]="14" />
                  <span class="strct-nc__body">
                    @if (n.title) {
                      <span class="strct-nc__item-title">{{ n.title }}</span>
                    }
                    <span class="strct-nc__msg">{{ n.message }}</span>
                  </span>
                  <span class="strct-nc__meta">
                    <span class="strct-nc__time">{{ timeText(n) }}</span>
                    @if (!n.read) {
                      <span class="strct-nc__dot" aria-hidden="true"></span>
                    }
                  </span>
                </button>
              </li>
            }
          </ul>
        } @else {
          <div class="strct-nc__empty">{{ emptyText() }}</div>
        }
      </div>
    }
  `,
  host: { class: 'strct-nc' },
  styles: [
    `
      .strct-nc {
        position: relative;
        display: inline-block;
      }
      .strct-nc__bell {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--t2);
        cursor: pointer;
      }
      .strct-nc__bell:hover {
        background: var(--bg-3);
        color: var(--t1);
      }
      .strct-nc__bell:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-nc__badge {
        position: absolute;
        top: -3px;
        inset-inline-end: -5px;
        min-width: 15px;
        padding: 1px 4px;
        border-radius: 99px;
        background: var(--critical);
        color: var(--inv);
        font-size: 10px;
        font-weight: 700;
        line-height: 1.2;
        text-align: center;
        pointer-events: none;
      }

      .strct-nc__panel {
        z-index: var(--z-popover);
        width: 340px;
        max-width: calc(100vw - 24px);
        padding: 4px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-floating);
        animation: strct-nc-in 0.1s ease;
      }
      .strct-nc__panel:focus-visible {
        outline: none;
      }
      .strct-nc__head {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        border-bottom: 1px solid var(--b1);
      }
      .strct-nc__title {
        font-size: 13px;
        font-weight: 600;
        color: var(--t1);
        margin-inline-end: auto;
      }
      .strct-nc__action {
        border: 0;
        background: transparent;
        padding: 2px 4px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        color: var(--acc);
        cursor: pointer;
        white-space: nowrap;
      }
      .strct-nc__action:hover {
        background: var(--acc-s);
      }
      .strct-nc__action:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }

      .strct-nc__list {
        list-style: none;
        margin: 0;
        padding: 4px 0;
        max-height: 320px;
        overflow-y: auto;
      }
      .strct-nc__item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        width: 100%;
        padding: var(--space-2) var(--space-3);
        border: 0;
        background: transparent;
        text-align: start;
        font-size: 13px;
        color: var(--t2);
        cursor: pointer;
        border-radius: var(--radius-sm);
      }
      .strct-nc__item:hover,
      .strct-nc__item:focus-visible {
        background: var(--bg-3);
        outline: none;
      }
      .strct-nc__item strct-icon {
        flex-shrink: 0;
        margin-top: 1px;
        color: var(--acc);
      }
      /* Unread entries read as fresh: full-strength text + a trailing dot —
         two channels (weight and marker), not color alone. */
      .strct-nc__item--unread {
        color: var(--t1);
      }
      .strct-nc__item--unread .strct-nc__msg {
        font-weight: 600;
      }
      .strct-nc__body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .strct-nc__item-title {
        font-weight: 600;
        color: var(--t1);
      }
      .strct-nc__meta {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-inline-start: var(--space-2);
      }
      .strct-nc__time {
        font-size: 12px;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .strct-nc__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--acc);
      }
      .strct-nc__empty {
        padding: var(--space-4) var(--space-3);
        font-size: 13px;
        color: var(--t3);
        text-align: center;
      }

      @keyframes strct-nc-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-nc__panel {
          animation: none;
        }
      }
    `,
  ],
})
export class StrctNotificationCenter {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly service = inject(StrctToastService);

  /** Panel heading and dialog accessible name (localizable). */
  readonly title = input('Notifications');
  /** Header button that clears the whole history (localizable). */
  readonly clearLabel = input('Clear all');
  /** Header button that flags every entry as read (localizable). */
  readonly markAllReadLabel = input('Mark all read');
  /** Shown when the history is empty (localizable). */
  readonly emptyText = input('No notifications');
  /** Maximum entries rendered in the panel (the newest ones). */
  readonly maxItems = input(20);
  /**
   * Factory for the bell's aria-label (localizable); receives the unread
   * count. When null, a default English label is generated.
   */
  readonly bellLabelFormat = input<((unread: number) => string) | null>(null);
  /**
   * Formatter for an entry's timestamp (localizable). When null, the locale's
   * short time is shown.
   */
  readonly timeFormat = input<((timestamp: number) => string) | null>(null);

  /** Emits the clicked entry (also marked read); the panel closes. */
  readonly activated = output<StrctNotification>();

  readonly open = signal(false);
  protected readonly unread = this.service.unreadCount;
  protected readonly hasHistory = computed(() => this.service.history().length > 0);
  /** Newest first, capped to `maxItems`. */
  protected readonly items = computed(() =>
    this.service.history().slice(-this.maxItems()).reverse(),
  );
  protected readonly badgeText = computed(() => {
    const n = this.unread();
    return n > MAX_BADGE ? `${MAX_BADGE}+` : `${n}`;
  });
  protected readonly bellAria = computed(() => {
    const n = this.unread();
    const custom = this.bellLabelFormat();
    if (custom) return custom(n);
    return n > 0 ? `Notifications, ${n} unread` : 'Notifications';
  });

  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');
  /** Element focused before opening — focus returns here on close. */
  private restoreTo: HTMLElement | null = null;

  toggle(): void {
    if (this.open()) {
      this.close(true);
      return;
    }
    this.restoreTo = saveFocusedElement();
    this.open.set(true);
    // Defer past the render so the panel (and its first button) exist.
    setTimeout(() => {
      const el = this.panelEl()?.nativeElement;
      if (el && !focusFirstIn(el)) el.focus();
    });
  }

  close(restore = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restore) {
      restoreFocus(this.restoreTo);
      this.restoreTo = null;
    }
  }

  /** Pick an entry: mark read, emit, close like a menu selection. */
  protected activate(n: StrctNotification): void {
    this.service.markRead(n.id);
    this.activated.emit(n);
    this.close(true);
  }

  protected markAllRead(): void {
    this.service.markAllRead();
  }

  protected clearAll(): void {
    this.service.clearHistory();
  }

  protected icon(type: StrctToastType): string {
    return TYPE_ICON[type];
  }

  protected timeText(n: StrctNotification): string {
    const custom = this.timeFormat();
    if (custom) return custom(n.timestamp);
    return new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    // Consumed here — a host modal/drawer must not close with the panel.
    event.stopPropagation();
    this.close(true);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  /** Fallback for focus landing outside the panel; in-panel Escape stops first. */
  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.open()) return;
    event.stopPropagation();
    this.close(true);
  }
}
