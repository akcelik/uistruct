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
  host: { class: 'strct-header' },
  styles: [
    `
      .strct-header {
        display: flex;
        align-items: center;
        gap: 14px;
        height: 56px;
        padding: 0 18px;
        background: var(--hdr);
        border-bottom: 1px solid var(--b2);
        color: var(--hdr-fg);
      }
      /* A button projected into the header sits on --hdr, not on a surface,
         so the six triggers an app puts there had to be native buttons with
         color: inherit. The flat variant now takes the header's own
         foreground — nothing else changes about it. */
      .strct-header .strct-btn--flat {
        color: color-mix(in srgb, var(--hdr-fg) 72%, transparent);
      }
      .strct-header .strct-btn--flat:hover:not(:disabled) {
        background: color-mix(in srgb, var(--hdr-fg) 12%, transparent);
        color: var(--hdr-fg);
      }
      .strct-header .strct-btn--flat:focus-visible {
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
