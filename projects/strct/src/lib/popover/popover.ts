import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  afterRenderEffect,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { StrctOverlay, StrctOverlayPlacement } from '../overlay/overlay';
import { focusFirstIn, keepTabInside, restoreFocus, saveFocusedElement } from '../overlay/focus';

/**
 * A generic anchored overlay panel for arbitrary projected content — the
 * public primitive behind menus, signposts and rich pickers:
 *   <strct-popover placement="bottom-end" ariaLabel="More actions">
 *     <button strct-button strctPopoverTrigger>Actions</button>
 *     <p>Any content — text, lists or controls…</p>
 *   </strct-popover>
 *
 * `open` is two-way, so the panel can also be driven from the outside:
 *   <strct-popover [(open)]="show">…</strct-popover>
 *
 * Positioning, edge-flip and scroll/resize tracking come from StrctOverlay;
 * the panel is `position: fixed`, so it escapes ancestor overflow clipping.
 */
@Component({
  selector: 'strct-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctOverlay],
  template: `
    <!--
      Same contract as the signpost: the wrapper stays inert and the real
      trigger button carries aria-haspopup/aria-expanded (wired by the
      strctPopoverTrigger directive) — nested interactives fail axe.
    -->
    <div #trigger class="strct-popover__trigger">
      <ng-content select="[strctPopoverTrigger]" />
    </div>
    @if (open()) {
      <div
        #panel
        class="strct-popover__panel"
        role="dialog"
        tabindex="-1"
        [attr.aria-label]="ariaLabel()"
        [strctOverlay]="trigger"
        [strctOverlayPlacement]="placement()"
        (keydown.tab)="onTab($event)"
        (keydown.shift.tab)="onTab($event)"
      >
        <ng-content />
      </div>
    }
  `,
  host: { class: 'strct-popover' },
  styles: [
    `
      .strct-popover {
        position: relative;
        display: inline-block;
      }
      .strct-popover__trigger {
        display: inline-flex;
      }
      /* position:fixed + coordinates are set inline by the strctOverlay directive. */
      .strct-popover__panel {
        z-index: var(--z-popover);
        width: max-content;
        max-width: 320px;
        padding: var(--space-3);
        font-size: 13px;
        color: var(--t1);
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-floating);
        animation: strct-popover-in 0.11s ease;
      }
      @keyframes strct-popover-in {
        from {
          opacity: 0;
          transform: scale(0.97);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .strct-popover__panel {
          animation: none;
        }
      }
    `,
  ],
})
export class StrctPopover {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** Whether the panel is open (two-way). */
  readonly open = model(false);
  /** Panel placement relative to the trigger; edge-flip is automatic. */
  readonly placement = input<StrctOverlayPlacement>('bottom-start');
  /** Accessible name of the popover dialog (localizable). */
  readonly ariaLabel = input('Details');
  /**
   * Modal-ish usage: move focus into the panel on open, trap Tab inside and
   * hand focus back to the trigger on close. Off by default — a plain popover
   * never steals focus and Tab moves on freely.
   */
  readonly trap = input(false, { transform: booleanAttribute });

  /** Where focus was when the panel opened — restored on Escape / trap close. */
  private lastFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (!this.open()) return;
      this.lastFocused = saveFocusedElement();
    });
    // Runs after the render that attached the panel (the viewChild signal
    // resolves then), so the focus-in needs no manual scheduling.
    afterRenderEffect(() => {
      const panel = this.panelRef()?.nativeElement;
      if (!this.open() || !this.trap() || !panel) return;
      // The panel renders in the same pass that flipped `open`; focus it now.
      if (!focusFirstIn(panel)) panel.focus();
    });
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(restore = false): void {
    if (!this.open()) return;
    this.open.set(false);
    // A trapped panel held focus — always give it back, however it closed.
    if (restore || this.trap()) restoreFocus(this.lastFocused);
  }

  /** Wrap Tab within the panel in trap mode; a no-op otherwise. */
  protected onTab(event: Event): void {
    const panel = this.panelRef()?.nativeElement;
    if (this.trap() && panel) keepTabInside(event as KeyboardEvent, panel);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.open()) return;
    // Document-level: stopImmediatePropagation so a host modal/drawer with its
    // own document listener doesn't also see the Escape the panel consumed.
    event.stopImmediatePropagation();
    this.close(true);
  }
}

/**
 * Marks (and upgrades) the popover's trigger element. The attribute alone is
 * enough for content projection; importing the directive additionally wires
 * the toggle and `aria-haspopup` / `aria-expanded` onto the real button.
 * Put it on a native `<button>`: Enter/Space then fire a single click —
 * no keydown handlers, no double-toggle, one tab stop.
 */
@Directive({
  selector: '[strctPopoverTrigger]',
  host: {
    '[attr.aria-haspopup]': "popover ? 'dialog' : null",
    '[attr.aria-expanded]': 'popover ? popover.open() : null',
    '(click)': 'popover?.toggle()',
  },
})
export class StrctPopoverTrigger {
  protected readonly popover = inject(StrctPopover, { optional: true });
}
