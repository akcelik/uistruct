import { DOCUMENT } from '@angular/common';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  Injectable,
  NgZone,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { restoreFocus, saveFocusedElement } from '../overlay/focus';

/** Where a window sits and how big it is, in viewport px. */
export interface StrctWindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Every string the window's own controls use. */
export interface StrctWindowLabels {
  minimize: string;
  maximize: string;
  restore: string;
  close: string;
  /** The dock's accessible name. */
  dock: string;
  /**
   * The tooltip each control shows on hover, when it says more than the name
   * does — the console's minimise is "stays connected". Empty shows none.
   */
  minimizeHint: string;
  maximizeHint: string;
  restoreHint: string;
  closeHint: string;
}

/** The title bar's height — what must stay on screen for the window to be
 *  draggable back from an edge. */
const TITLE_H = 36;

const WINDOW_LABELS: StrctWindowLabels = {
  minimize: 'Minimize',
  maximize: 'Maximize',
  restore: 'Restore',
  close: 'Close',
  dock: 'Minimized windows',
  minimizeHint: '',
  maximizeHint: '',
  restoreHint: '',
  closeHint: '',
};

let windowCounter = 0;

/**
 * Knows which windows exist, which is on top, and which are minimised — so the
 * dock can list them and a click can raise one.
 */
@Injectable({ providedIn: 'root' })
export class StrctWindowService {
  private topZ = 0;
  readonly windows = signal<StrctWindow[]>([]);
  /** The minimised ones, in the order they were opened. */
  readonly minimized = computed(() => this.windows().filter((w) => w.minimized()));

  register(w: StrctWindow): void {
    this.windows.update((ws) => [...ws, w]);
  }
  unregister(w: StrctWindow): void {
    this.windows.update((ws) => ws.filter((x) => x !== w));
  }
  /** Raise a window above the others; returns its new stacking offset. */
  raise(): number {
    return ++this.topZ;
  }
}

/**
 * Some work lives in a window beside the page: a VM console stays open while
 * the operator browses. It can be moved, resized and minimised, and it comes
 * back from the dock. A modal blocks the page and a drawer is pinned to an
 * edge — neither is a window.
 *
 *   <strct-window [(open)]="open" [(minimized)]="min" heading="APP01" palette="dark">
 *     <ng-container strctWindowTitleMeta><strct-badge status="success">Running</strct-badge></ng-container>
 *     <ng-container strctWindowActions>…</ng-container>
 *     …content…
 *     <ng-container strctWindowStatus>…</ng-container>
 *   </strct-window>
 *   <strct-window-dock />
 */
@Component({
  selector: 'strct-window',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    @if (open() && !minimized()) {
      <div
        class="strct-window__frame"
        role="dialog"
        aria-modal="false"
        [attr.aria-labelledby]="titleId"
        [attr.data-palette]="palette() === 'inherit' ? null : hostPalette()"
        [attr.data-theme]="palette() === 'inherit' ? null : palette()"
        [style.z-index]="zIndex()"
        [style.left.px]="maximized() ? null : rect().x"
        [style.top.px]="maximized() ? null : rect().y"
        [style.width.px]="maximized() ? null : rect().width"
        [style.height.px]="maximized() ? null : rect().height"
        [class.strct-window__frame--max]="maximized()"
        (pointerdown)="focusWindow()"
        (keydown.escape)="minimize()"
      >
        <!-- The title bar moves the window: by pointer, or with Alt+arrows. -->
        <div
          class="strct-window__title"
          tabindex="0"
          [attr.aria-label]="heading()"
          (pointerdown)="onDragStart($event)"
          (keydown)="onTitleKeydown($event)"
          (dblclick)="onTitleDblclick()"
        >
          @if (icon()) {
            <strct-icon class="strct-window__icon" [name]="icon()" [size]="14" />
          }
          <span class="strct-window__heading" [id]="titleId">{{ heading() }}</span>
          <span class="strct-window__meta"><ng-content select="[strctWindowTitleMeta]" /></span>
          <span class="strct-window__actions"><ng-content select="[strctWindowActions]" /></span>
          <span class="strct-window__controls">
            <button
              type="button"
              class="strct-window__btn"
              [attr.aria-label]="L().minimize"
              [attr.title]="L().minimizeHint || null"
              (click)="minimize()"
            >
              <strct-icon strictName="minus" [size]="14" />
            </button>
            <button
              type="button"
              class="strct-window__btn"
              [attr.aria-label]="maximized() ? L().restore : L().maximize"
              [attr.title]="(maximized() ? L().restoreHint : L().maximizeHint) || null"
              (click)="toggleMaximized()"
            >
              <strct-icon
                [strictName]="maximized() ? 'exitFullscreen' : 'fullscreen'"
                [size]="13"
              />
            </button>
            <button
              type="button"
              class="strct-window__btn strct-window__btn--close"
              [attr.aria-label]="L().close"
              [attr.title]="L().closeHint || null"
              (click)="close()"
            >
              <strct-icon strictName="close" [size]="14" />
            </button>
          </span>
        </div>

        <div class="strct-window__body"><ng-content /></div>
        <div class="strct-window__status"><ng-content select="[strctWindowStatus]" /></div>

        @if (resizable() && !maximized()) {
          <!-- Focusable, so a window can be resized without a pointer. -->
          @for (corner of CORNERS; track corner) {
            <button
              type="button"
              class="strct-window__rz strct-window__rz--{{ corner }}"
              [attr.aria-label]="resizeLabel()(corner)"
              (pointerdown)="onResizeStart($event, corner)"
              (keydown)="onResizeKeydown($event, corner)"
            ></button>
          }
        }
      </div>
    }
  `,
  host: { class: 'strct-window' },
  styles: [
    `
      .strct-window {
        display: contents;
      }
      .strct-window__frame {
        position: fixed;
        display: flex;
        flex-direction: column;
        min-width: 0;
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        background: var(--bg-1);
        color: var(--t1);
        box-shadow: var(--shadow-overlay, 0 12px 40px rgba(0, 0, 0, 0.32));
        overflow: hidden;
      }
      .strct-window__frame--max {
        inset: var(--space-3);
        width: auto;
        height: auto;
      }
      .strct-window__icon {
        flex: none;
        color: var(--t3);
      }
      .strct-window__title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: 6px 6px 6px var(--space-3);
        border-block-end: 1px solid var(--b1);
        background: var(--bg-2);
        cursor: move;
        user-select: none;
        touch-action: none;
      }
      .strct-window__title:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-window__heading {
        font-size: var(--text-sm);
        font-weight: 600;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-window__meta,
      .strct-window__actions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .strct-window__actions {
        margin-inline-start: auto;
      }
      .strct-window__controls {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        flex: none;
      }
      .strct-window__btn {
        display: inline-flex;
        padding: 4px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--t2);
        cursor: pointer;
      }
      .strct-window__btn:hover {
        background: var(--bg-3);
        color: var(--t1);
      }
      .strct-window__btn--close:hover {
        background: var(--critical-bg);
        color: var(--critical);
      }
      .strct-window__body {
        flex: 1;
        min-height: 0;
        overflow: auto;
      }
      .strct-window__status:empty {
        display: none;
      }
      .strct-window__status {
        border-block-start: 1px solid var(--b1);
        padding: 4px var(--space-3);
        font-size: var(--text-sm);
        color: var(--t3);
        background: var(--bg-2);
      }
      /* Corner grips: invisible until focused, so the frame stays clean. */
      .strct-window__rz {
        position: absolute;
        width: 14px;
        height: 14px;
        padding: 0;
        border: 0;
        background: transparent;
      }
      .strct-window__rz:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-window__rz--nw {
        inset-block-start: 0;
        inset-inline-start: 0;
        cursor: nwse-resize;
      }
      .strct-window__rz--ne {
        inset-block-start: 0;
        inset-inline-end: 0;
        cursor: nesw-resize;
      }
      .strct-window__rz--sw {
        inset-block-end: 0;
        inset-inline-start: 0;
        cursor: nesw-resize;
      }
      .strct-window__rz--se {
        inset-block-end: 0;
        inset-inline-end: 0;
        cursor: nwse-resize;
      }
    `,
  ],
})
export class StrctWindow {
  /** Whether the window exists on screen (two-way). */
  readonly open = model(false);
  /** Minimised to the dock (two-way). */
  readonly minimized = model(false);
  /** Filling the viewport — not browser fullscreen (two-way). */
  readonly maximized = model(false);
  /** Position and size in px (two-way); null lets the window place itself. */
  readonly bounds = model<StrctWindowBounds | null>(null);
  /** The title-bar heading, and the window's accessible name. */
  readonly heading = input('');
  /** Corner resize grips. */
  readonly resizable = input(true, { transform: booleanAttribute });
  readonly minWidth = input(480);
  readonly minHeight = input(320);
  /** `dark` / `light` force that scheme inside the window (a console is dark). */
  readonly palette = input<'inherit' | 'dark' | 'light'>('inherit');
  /** What a click outside does. A window is not dismissed like a modal. */
  readonly closeOnOutside = input<'none' | 'minimize'>('none');
  /** The window's own strings. */
  readonly labels = input<Partial<StrctWindowLabels>>({});
  /** The accessible name of each resize grip. */
  readonly resizeLabel = input<(corner: string) => string>((corner) => `Resize (${corner})`);
  /** A leading icon in the title bar, as `strct-page-header [icon]` has. */
  readonly icon = input('');
  /**
   * What a double-click on the title bar does. A console whose content has a
   * real full screen of its own wants `none` and its own answer to
   * `(titleDblclick)`.
   */
  readonly titleDblclick = input<'maximize' | 'none'>('maximize');
  /** The window was closed. */
  readonly closed = output<void>();
  /** The title bar was double-clicked, whatever `titleDblclick` then did. */
  readonly titleDblclicked = output<void>();

  protected readonly CORNERS = ['nw', 'ne', 'sw', 'se'] as const;
  protected readonly titleId = `strct-window-${++windowCounter}`;
  protected readonly L = computed<StrctWindowLabels>(() => ({
    ...WINDOW_LABELS,
    ...this.labels(),
  }));

  private readonly service = inject(StrctWindowService);
  private readonly doc = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zOffset = signal(0);
  protected readonly zIndex = computed(() => `calc(var(--z-window) + ${this.zOffset()})`);
  /** The palette in force outside, so `palette` only swaps the scheme. */
  protected readonly hostPalette = computed(
    () => this.doc.documentElement.getAttribute('data-palette') ?? 'arctic',
  );

  /** Where the window is. Defaults to a slightly offset, comfortable box. */
  private readonly fallback = signal<StrctWindowBounds>({ x: 80, y: 80, width: 720, height: 460 });
  protected readonly rect = computed(() => this.bounds() ?? this.fallback());

  private restoreTo: HTMLElement | null = null;

  /** A click beside the window, when `closeOnOutside` asks for one. */
  private readonly onOutside = (event: PointerEvent) => {
    if (this.closeOnOutside() !== 'minimize' || !this.open() || this.minimized()) return;
    const frame = this.host.nativeElement.querySelector('.strct-window__frame');
    const target = event.target;
    if (frame && target instanceof Node && frame.contains(target)) return;
    this.zone.run(() => this.minimize());
  };

  constructor() {
    this.service.register(this);
    effect(() => {
      if (this.open() && !this.minimized()) {
        this.restoreTo ??= saveFocusedElement();
        this.zOffset.set(this.service.raise());
        queueMicrotask(() => this.focusTitle());
      }
    });
    // `closeOnOutside` was declared and never read. The listener is added only
    // while a window asks for it, and outside the zone — a click anywhere on
    // the page must not cost a change-detection pass for every open window.
    effect((onCleanup) => {
      if (this.closeOnOutside() !== 'minimize' || !this.open() || this.minimized()) return;
      // Deferred, so the click that opened the window does not close it.
      const timer = setTimeout(() =>
        this.zone.runOutsideAngular(() =>
          this.doc.addEventListener('pointerdown', this.onOutside, true),
        ),
      );
      onCleanup(() => {
        clearTimeout(timer);
        this.doc.removeEventListener('pointerdown', this.onOutside, true);
      });
    });
  }

  /** Raise this window above the others when it is clicked. */
  protected focusWindow(): void {
    this.zOffset.set(this.service.raise());
  }

  private focusTitle(): void {
    this.host.nativeElement.querySelector<HTMLElement>('.strct-window__title')?.focus();
  }

  minimize(): void {
    if (!this.open()) return;
    this.minimized.set(true);
    restoreFocus(this.restoreTo);
  }

  /** Bring a minimised window back and raise it. */
  restore(): void {
    this.minimized.set(false);
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.minimized.set(false);
    this.closed.emit();
    restoreFocus(this.restoreTo);
    this.restoreTo = null;
  }

  // ── Moving ───────────────────────────────────────────────────────────────
  private dragFrom: { x: number; y: number; rect: StrctWindowBounds } | null = null;
  private readonly onMove = (e: PointerEvent) => this.dragMove(e);
  private readonly onUp = () => this.dragEnd();

  protected onDragStart(event: PointerEvent): void {
    if ((event.target as HTMLElement).closest('button')) return;
    if (this.maximized()) return;
    event.preventDefault();
    this.dragFrom = { x: event.clientX, y: event.clientY, rect: this.rect() };
    this.doc.addEventListener('pointermove', this.onMove);
    this.doc.addEventListener('pointerup', this.onUp);
    this.doc.addEventListener('pointercancel', this.onUp);
  }

  private dragMove(event: PointerEvent): void {
    const from = this.dragFrom;
    if (!from) return;
    this.setRect({
      ...from.rect,
      x: from.rect.x + (event.clientX - from.x),
      y: from.rect.y + (event.clientY - from.y),
    });
  }

  private dragEnd(): void {
    this.dragFrom = null;
    this.doc.removeEventListener('pointermove', this.onMove);
    this.doc.removeEventListener('pointerup', this.onUp);
    this.doc.removeEventListener('pointercancel', this.onUp);
  }

  /** Alt+arrows move the window; Escape minimises it. */
  protected toggleMaximized(): void {
    this.maximized.set(!this.maximized());
  }

  protected onTitleDblclick(): void {
    this.titleDblclicked.emit();
    if (this.titleDblclick() === 'maximize') this.toggleMaximized();
  }

  protected onTitleKeydown(event: KeyboardEvent): void {
    if (!event.altKey) return;
    const step = event.shiftKey ? 64 : 16;
    const r = this.rect();
    const moves: Record<string, Partial<StrctWindowBounds>> = {
      ArrowLeft: { x: r.x - step },
      ArrowRight: { x: r.x + step },
      ArrowUp: { y: r.y - step },
      ArrowDown: { y: r.y + step },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    this.setRect({ ...r, ...move });
  }

  // ── Resizing ─────────────────────────────────────────────────────────────
  private resizeFrom: {
    x: number;
    y: number;
    rect: StrctWindowBounds;
    corner: string;
  } | null = null;
  private readonly onResizeMove = (e: PointerEvent) => this.resizeMove(e);
  private readonly onResizeUp = () => this.resizeEnd();

  protected onResizeStart(event: PointerEvent, corner: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizeFrom = { x: event.clientX, y: event.clientY, rect: this.rect(), corner };
    this.doc.addEventListener('pointermove', this.onResizeMove);
    this.doc.addEventListener('pointerup', this.onResizeUp);
    this.doc.addEventListener('pointercancel', this.onResizeUp);
  }

  private resizeMove(event: PointerEvent): void {
    const from = this.resizeFrom;
    if (!from) return;
    this.setRect(
      this.resized(from.rect, from.corner, event.clientX - from.x, event.clientY - from.y),
    );
  }

  private resizeEnd(): void {
    this.resizeFrom = null;
    this.doc.removeEventListener('pointermove', this.onResizeMove);
    this.doc.removeEventListener('pointerup', this.onResizeUp);
    this.doc.removeEventListener('pointercancel', this.onResizeUp);
  }

  /** Arrows resize by 16px, Shift+arrows by 64px. */
  protected onResizeKeydown(event: KeyboardEvent, corner: string): void {
    const step = event.shiftKey ? 64 : 16;
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    this.setRect(this.resized(this.rect(), corner, delta[0], delta[1]));
  }

  /**
   * A corner drag moves the two edges it touches: the west and north edges move
   * the window's origin as well as its size, so the opposite corner stays put.
   */
  private resized(
    rect: StrctWindowBounds,
    corner: string,
    dx: number,
    dy: number,
  ): StrctWindowBounds {
    const west = corner.includes('w');
    const north = corner.includes('n');
    const width = Math.max(this.minWidth(), rect.width + (west ? -dx : dx));
    const height = Math.max(this.minHeight(), rect.height + (north ? -dy : dy));
    return {
      x: west ? rect.x + (rect.width - width) : rect.x,
      y: north ? rect.y + (rect.height - height) : rect.y,
      width,
      height,
    };
  }

  /**
   * A window dragged off the screen cannot be dragged back: the title bar is
   * the only handle it has. Keep enough of that bar on screen to grab — the
   * window may hang off any edge, but never past its own title.
   */
  private clamp(next: StrctWindowBounds): StrctWindowBounds {
    const view = this.doc.defaultView;
    if (!view) return next;
    const KEEP = 48; // enough of the bar to put a pointer on
    const maxX = view.innerWidth - KEEP;
    const maxY = view.innerHeight - TITLE_H;
    return {
      ...next,
      x: Math.min(Math.max(next.x, KEEP - next.width), maxX),
      y: Math.min(Math.max(next.y, 0), Math.max(0, maxY)),
    };
  }

  private setRect(next: StrctWindowBounds): void {
    const clamped = this.clamp(next);
    if (this.bounds()) this.bounds.set(clamped);
    else this.fallback.set(clamped);
  }
}

/**
 * What a dock chip shows, when the window's heading is not enough — a status
 * dot, an icon, a count. The window is the context:
 *
 *   <ng-template strctWindowDockItem let-w>
 *     <strct-status-dot [status]="tone(w)" size="sm" /> {{ w.heading() }}
 *   </ng-template>
 */
@Directive({ selector: 'ng-template[strctWindowDockItem]' })
export class StrctWindowDockItem {}

/**
 * Where minimised windows wait. Put it in a toolbar or a status bar; each entry
 * restores its window — or asks the consumer to, through `(restoreRequest)` —
 * and its × closes it.
 */
@Component({
  selector: 'strct-window-dock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, NgTemplateOutlet],
  template: `
    @for (w of service.minimized(); track w) {
      <span class="strct-windock__chip">
        <button type="button" class="strct-windock__open" (click)="onRestore(w)">
          @if (itemTpl(); as tpl) {
            <!-- A chip can say more than a heading: a status dot, an icon, a
                 count. The window is the template's context. -->
            <ng-container
              [ngTemplateOutlet]="tpl"
              [ngTemplateOutletContext]="{ $implicit: w, window: w }"
            />
          } @else {
            {{ w.heading() }}
          }
        </button>
        <button
          type="button"
          class="strct-windock__close"
          [attr.aria-label]="closeLabel()(w.heading())"
          (click)="w.close()"
        >
          <strct-icon strictName="close" [size]="11" />
        </button>
      </span>
    }
  `,
  host: {
    class: 'strct-windock',
    role: 'group',
    '[attr.aria-label]': 'label()',
  },
  styles: [
    `
      .strct-windock {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .strct-windock__chip {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding-inline: 8px 4px;
        border: 1px solid var(--b2);
        border-radius: var(--radius-full, 999px);
        background: var(--bg-1);
        font-size: 12px;
      }
      .strct-windock__open,
      .strct-windock__close {
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;
        padding: 3px 2px;
        border-radius: var(--radius-sm);
      }
      .strct-windock__open:hover {
        color: var(--acc);
      }
      .strct-windock__close {
        display: inline-flex;
        color: var(--t3);
      }
      .strct-windock__close:hover {
        color: var(--critical);
      }
      .strct-windock__open:focus-visible,
      .strct-windock__close:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
    `,
  ],
})
export class StrctWindowDock {
  protected readonly service = inject(StrctWindowService);
  /** The dock's accessible name. */
  readonly label = input('Minimized windows');
  /** The name of each chip's close button. */
  readonly closeLabel = input<(heading: string) => string>((heading) => `Close ${heading}`);
  /** What each chip shows, when a heading is not enough. */
  protected readonly itemTpl = contentChild(StrctWindowDockItem, { read: TemplateRef });
  /**
   * Who restores a window when its chip is pressed. `dock` does it itself, as
   * before; `request` only emits `(restoreRequest)`, so an app that allows one
   * open window at a time can close the other first — the dock's own restore
   * would walk past that rule.
   */
  readonly restoreMode = input<'dock' | 'request'>('dock');
  /** A chip was pressed. Always emitted; with `restoreMode="request"` it is
   *  the only thing that happens. */
  readonly restoreRequest = output<StrctWindow>();

  protected onRestore(w: StrctWindow): void {
    this.restoreRequest.emit(w);
    if (this.restoreMode() === 'dock') w.restore();
  }
}
