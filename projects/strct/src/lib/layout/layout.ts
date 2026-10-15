import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  input,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { StrctIcon } from '../icon/icon';

let shellCounter = 0;

/** Shared layout state between shell parts. */
export class StrctShellService {
  readonly mobileNavOpen = signal(false);
  /** Id of the vertical nav controlled by the header drawer toggle. */
  readonly navId = `strct-vnav-${++shellCounter}`;
}

/**
 * Application frame: a full-viewport grid of header / body / footer rows.
 *   <strct-shell>
 *     <strct-header>…</strct-header>
 *     <div strctShellMain>… sidebar + content …</div>
 *     <strct-footer>…</strct-footer>
 *   </strct-shell>
 */
@Component({
  selector: 'strct-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [StrctShellService],
  template: `
    @if (skipLinkTarget()) {
      <!-- The first focusable element on the page, invisible until focused. -->
      <a
        class="strct-shell__skip"
        [attr.href]="'#' + skipLinkTarget()"
        (click)="skipToMain($event)"
        >{{ skipLinkLabel() }}</a
      >
    }
    <ng-content select="strct-header" />
    @if (shell.mobileNavOpen()) {
      <!-- Outside the drawer, which is transformed and would otherwise be this
           fixed element's containing block (BUG-53-01). -->
      <div
        class="strct-vnav__backdrop"
        tabindex="-1"
        role="button"
        [attr.aria-label]="closeNavLabel()"
        (click)="shell.mobileNavOpen.set(false)"
        (keydown.enter)="shell.mobileNavOpen.set(false)"
        (keydown.space)="shell.mobileNavOpen.set(false)"
      ></div>
    }
    <div class="strct-shell__main"><ng-content /></div>
    <ng-content select="strct-footer" />
  `,
  host: { class: 'strct-shell' },
  styles: [
    `
      .strct-shell {
        display: grid;
        grid-template-rows: auto 1fr auto;
        height: 100vh;
        overflow: hidden;
        /* The ladder's lowest surface: the page is the ground, and a card
           (--bg-1) sits one step above it — raised in both themes, rather than
           3 levels apart in light and sunk in dark. */
        background: var(--bg-0);
      }
      .strct-shell__main {
        display: flex;
        min-height: 0;
        overflow: hidden;
      }
      /* Off-screen until focused, then the first thing on the page. */
      .strct-shell__skip {
        position: absolute;
        inset-inline-start: 0;
        top: 0;
        z-index: 1;
        transform: translateY(-120%);
        padding: var(--space-2) var(--space-3);
        border-radius: 0 0 var(--radius-md) 0;
        background: var(--acc);
        color: var(--inv);
        font-size: var(--text-sm);
        text-decoration: none;
      }
      .strct-shell__skip:focus-visible {
        transform: none;
        outline: 2px solid var(--acc50);
        outline-offset: 2px;
      }
    `,
  ],
})
export class StrctShell {
  /**
   * Id of the main region. Given one, the shell renders "Skip to main content"
   * as its first focusable element — invisible until focused. Null (the
   * default) renders nothing, so existing shells are unchanged.
   */
  readonly skipLinkTarget = input<string | null>(null);
  /** The link's text (localisable). */
  readonly skipLinkLabel = input('Skip to main content');
  /** The name of the backdrop that closes the navigation drawer on a phone. */
  readonly closeNavLabel = input('Close navigation');

  /** The drawer's open state lives on the shell, and so does its backdrop. */
  protected readonly shell = inject(StrctShellService);

  private readonly doc = inject(DOCUMENT);

  /**
   * Moves focus rather than only the scroll position: an href alone scrolls
   * without focusing, so the next Tab would resume from the link.
   */
  protected skipToMain(event: Event): void {
    const id = this.skipLinkTarget();
    const target = id ? this.doc.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
    // Optional: not every environment implements it (jsdom does not).
    target.scrollIntoView?.({ block: 'start' });
  }
}

/** Top application bar. Holds brand on the left and actions on the right. */
@Component({
  selector: 'strct-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <button
      type="button"
      class="strct-header__drawer-toggle"
      [attr.aria-label]="drawerToggleAriaLabel()"
      [attr.aria-expanded]="shell.mobileNavOpen()"
      [attr.aria-controls]="shell.mobileNavOpen() ? shell.navId : null"
      (click)="shell.mobileNavOpen.update((v) => !v)"
    >
      <strct-icon name="menu" [size]="18" />
    </button>
    <ng-content />
  `,
  host: {
    class: 'strct-header',
    '[class.strct-header--accent]': 'accent()',
    '[style.--strct-header-accent]': 'accent() || null',
  },
  styles: [
    `
      /* The drawer's backdrop: a sibling of the drawer, so inset: 0 is the
         viewport and the page beside the drawer is what gets dimmed. */
      .strct-vnav__backdrop {
        position: fixed;
        inset: 0;
        z-index: calc(var(--z-nav) - 1);
        background: var(--backdrop);
        animation: strct-vnav-backdrop-in 0.2s ease;
      }
      @media (min-width: 769px) {
        .strct-vnav__backdrop {
          display: none;
        }
      }
      @keyframes strct-vnav-backdrop-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .strct-header {
        display: flex;
        align-items: center;
        gap: var(--strct-header-gap, 14px);
        height: 56px;
        padding: 0 var(--strct-header-pad, 18px);
        background: var(--hdr);
        border-bottom: 1px solid var(--b2);
        color: var(--hdr-fg);
      }
      /* The product you are in is said three ways: its name, its icon, and a
         line in its colour under the header. An inset line, because an extra
         border would change the height of everything under it. */
      .strct-header--accent {
        box-shadow: inset 0 -3px 0 var(--strct-header-accent, var(--acc));
      }
      /* Below a phone's width seven 32–36px triggers only fit with a tighter
         gap and padding; an app should not have to override our selector. */
      @media (max-width: 600px) {
        .strct-header {
          gap: var(--strct-header-gap, 4px);
          padding: 0 var(--strct-header-pad, 6px);
        }
      }
      /* A button projected into the header sits on --hdr, not on a surface,
         so the six triggers an app puts there had to be native buttons with
         color: inherit. The flat variant now takes the header's own
         foreground — nothing else changes about it. */
      /* …but only in the header itself. A modal renders where it is written,
         so a wizard opened from a header control had its flat Back / Cancel
         painted in the header's near-white on the dialog's own surface. The
         exclusion stops the re-tone at every overlay a header can open. */
      .strct-header
        .strct-btn--flat:not(
          .strct-modal__dialog *,
          .strct-drawer *,
          .strct-popover__panel *,
          .strct-dd__menu *,
          .strct-tour__card *
        ) {
        color: color-mix(in srgb, var(--hdr-fg) 72%, transparent);
      }
      .strct-header
        .strct-btn--flat:not(
          .strct-modal__dialog *,
          .strct-drawer *,
          .strct-popover__panel *,
          .strct-dd__menu *,
          .strct-tour__card *
        ):hover:not(:disabled) {
        background: color-mix(in srgb, var(--hdr-fg) 12%, transparent);
        color: var(--hdr-fg);
      }
      .strct-header
        .strct-btn--flat:not(
          .strct-modal__dialog *,
          .strct-drawer *,
          .strct-popover__panel *,
          .strct-dd__menu *,
          .strct-tour__card *
        ):focus-visible {
        outline-color: color-mix(in srgb, var(--hdr-fg) 60%, transparent);
      }
      .strct-header__drawer-toggle {
        display: none;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: color-mix(in srgb, var(--hdr-fg) 85%, transparent);
        cursor: pointer;
      }
      .strct-header__drawer-toggle:hover {
        background: rgba(255, 255, 255, 0.12);
        color: var(--hdr-fg);
      }
      @media (max-width: 768px) {
        .strct-header__drawer-toggle {
          display: inline-flex;
        }
      }
    `,
  ],
})
export class StrctHeader {
  /** Accessible label of the mobile drawer toggle. */
  readonly drawerToggleAriaLabel = input('Toggle navigation');
  /**
   * A thin line in a product's colour under the header — a colour token or
   * any CSS colour. It is drawn inset, so the header keeps its height and
   * nothing under it moves. Empty leaves today's border alone.
   */
  readonly accent = input('');

  protected readonly shell = inject(StrctShellService);
}

/** Bottom status bar. */
@Component({
  selector: 'strct-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-footer' },
  styles: [
    `
      .strct-footer {
        display: flex;
        align-items: center;
        gap: 12px;
        height: 32px;
        padding: 0 16px;
        background: var(--bg-1);
        border-top: 1px solid var(--b2);
        font-size: 12px;
        color: var(--t2);
      }
    `,
  ],
})
export class StrctFooter {}
