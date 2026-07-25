import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { StrctOverlay, StrctOverlayPlacement } from '../overlay/overlay';
import { restoreFocus, saveFocusedElement } from '../overlay/focus';

/** Signpost popover placement. */
export type StrctSignpostPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * A click-triggered popover with an arrow, for contextual help / detail.
 *   <strct-signpost position="right">
 *     <button strct-button size="sm" strctSignpostTrigger>?</button>
 *     <h4>Title</h4>
 *     <p>Any projected content…</p>
 *   </strct-signpost>
 */
@Component({
  selector: 'strct-signpost',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctOverlay],
  template: `
    <!--
      The wrapper is intentionally inert: the projected trigger should be a
      real button (nesting interactives fails axe). Its native click —
      pointer or Enter/Space — is wired by the strctSignpostTrigger
      directive, which also puts aria-haspopup/aria-expanded on the button
      itself. No role/tabindex here: one tab stop, one activation.
    -->
    <div #trigger class="strct-sp__trigger">
      <ng-content select="[strctSignpostTrigger]" />
    </div>
    @if (open()) {
      <div
        class="strct-sp__panel"
        [class]="'strct-sp__panel--' + position()"
        role="dialog"
        [attr.aria-label]="ariaLabel()"
        [strctOverlay]="trigger"
        [strctOverlayPlacement]="overlayPlacement()"
      >
        <ng-content />
      </div>
    }
  `,
  host: { class: 'strct-sp' },
  styles: [
    `
      .strct-sp {
        position: relative;
        display: inline-block;
      }
      .strct-sp__trigger {
        display: inline-flex;
      }
      .strct-sp__panel {
        position: absolute;
        z-index: var(--z-nav);
        width: max-content;
        max-width: 280px;
        padding: 12px 14px;
        font-size: 13px;
        color: var(--t1);
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 8px;
        box-shadow: var(--shh);
        animation: strct-sp-in 0.11s ease;
      }
      .strct-sp__panel h4 {
        margin: 0 0 6px;
        font-size: 13px;
        font-weight: 600;
      }
      .strct-sp__panel p {
        margin: 0;
        color: var(--t2);
      }
      .strct-sp__panel::before {
        content: '';
        position: absolute;
        width: 9px;
        height: 9px;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-inline-end: 0;
        border-bottom: 0;
      }
      .strct-sp__panel--bottom {
        top: calc(100% + 9px);
        left: 0;
      }
      .strct-sp__panel--bottom::before {
        top: -5px;
        left: 16px;
        transform: rotate(45deg);
      }
      .strct-sp__panel--top {
        bottom: calc(100% + 9px);
        left: 0;
      }
      .strct-sp__panel--top::before {
        bottom: -5px;
        left: 16px;
        transform: rotate(225deg);
      }
      .strct-sp__panel--right {
        left: calc(100% + 9px);
        top: 0;
      }
      .strct-sp__panel--right::before {
        left: -5px;
        top: 14px;
        transform: rotate(-45deg);
      }
      .strct-sp__panel--left {
        right: calc(100% + 9px);
        top: 0;
      }
      .strct-sp__panel--left::before {
        right: -5px;
        top: 14px;
        transform: rotate(135deg);
      }
      @keyframes strct-sp-in {
        from {
          opacity: 0;
          transform: scale(0.97);
        }
      }
    `,
  ],
})
export class StrctSignpost {
  private readonly host = inject(ElementRef<HTMLElement>);
  /** Popover placement relative to the trigger. */
  readonly position = input<StrctSignpostPosition>('bottom');
  /** Accessible name of the signpost dialog (localizable). */
  readonly ariaLabel = input('Details');
  readonly open = signal(false);

  /** Where focus was when the popover opened — restored on Escape. */
  private lastFocused: HTMLElement | null = null;

  toggle(): void {
    if (!this.open()) this.lastFocused = saveFocusedElement();
    this.open.update((v) => !v);
  }
  close(restore = false): void {
    this.open.set(false);
    if (restore) restoreFocus(this.lastFocused);
  }

  protected overlayPlacement(): StrctOverlayPlacement {
    switch (this.position()) {
      case 'top':
        return 'top-start';
      case 'right':
        return 'right';
      case 'left':
        return 'left';
      default:
        return 'bottom-start';
    }
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
 * Marks (and upgrades) the signpost's trigger element. The attribute alone is
 * enough for content projection; importing the directive additionally wires
 * the toggle and `aria-haspopup` / `aria-expanded` onto the real button.
 * Put it on a native `<button>`: Enter/Space then fire a single click —
 * no keydown handlers, no double-toggle, one tab stop.
 */
@Directive({
  selector: '[strctSignpostTrigger]',
  host: {
    '[attr.aria-haspopup]': "sp ? 'dialog' : null",
    '[attr.aria-expanded]': 'sp ? sp.open() : null',
    '(click)': 'sp?.toggle()',
  },
})
export class StrctSignpostTrigger {
  protected readonly sp = inject(StrctSignpost, { optional: true });
}
