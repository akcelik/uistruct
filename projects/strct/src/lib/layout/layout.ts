import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { StrctIcon } from '../icon/icon';
import { strctDevWarn } from '../util/dev-warn';
import {
  StrctDropdown,
  StrctDropdownItem,
  StrctDropdownItemIcon,
  StrctDropdownTrigger,
} from '../dropdown/dropdown';

let shellCounter = 0;

/** Shared layout state between shell parts. */
export class StrctShellService {
  readonly mobileNavOpen = signal(false);
  /** Id of the vertical nav controlled by the header drawer toggle. */
  readonly navId = `strct-vnav-${++shellCounter}`;
  /**
   * The header's drawer toggle, so closing the drawer can hand focus back to
   * what opened it. The header registers it; nothing else writes it.
   */
  drawerToggle: HTMLElement | null = null;

  /**
   * Closes the navigation drawer. On a phone the drawer holds the
   * navigation, so a choice made in it opens a page *behind* it; the shell
   * calls this on every completed navigation unless told not to.
   */
  closeNav(): void {
    if (this.mobileNavOpen()) this.mobileNavOpen.set(false);
  }
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
  /**
   * Close the drawer when a navigation completes — the subscription every app
   * with a router ends up writing. It needs a `Router`; without one nothing
   * happens. Set it to `false` to keep the drawer open across navigations,
   * and close it yourself with `StrctShellService.closeNav()`.
   */
  readonly closeNavOnNavigate = input(true, { transform: booleanAttribute });

  /** The drawer's open state lives on the shell, and so does its backdrop. */
  protected readonly shell = inject(StrctShellService);

  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router, { optional: true });

  constructor() {
    // An app without the router package still works: the token is optional and
    // the events stream is simply never there.
    this.router?.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd && this.closeNavOnNavigate()) this.shell.closeNav();
    });
  }

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

/** What a header action is, and whether it may move into the overflow menu. */
export interface StrctHeaderActionConfig {
  /** The name the overflow row shows, and the action's own name. */
  label: string;
  /** Optional icon for the overflow row (an icon-set name). */
  icon?: string;
  /**
   * `'phone'` (the default) moves the action into the "More" menu below the
   * breakpoint. `'never'` keeps it in the header at every width — what an
   * action that opens its own popover (alarms, the account menu) needs, since
   * a popover inside a menu is a menu inside a menu.
   */
  overflow?: 'phone' | 'never';
  /**
   * What the overflow row does when it is chosen. Given one, the row is a
   * menu item with the icon and the label — a command.
   *
   * Without one the action's own template is drawn in the menu instead, in a
   * row that is not a menu item: the way out for an action that is a control
   * in its own right (a segmented choice, a switcher). It keeps its own tab
   * stop and its own clicks, and using it does not close the menu.
   */
  run?: () => void;
}

/**
 * An action in the header that knows whether it may move into the overflow
 * menu on a phone:
 *
 *   <ng-container *strctHeaderAction="{ label: 'Create', icon: 'plus', run: create }">
 *     <button strct-button variant="flat" iconOnly aria-label="Create">…</button>
 *   </ng-container>
 *
 * Content projected into the header without this directive never moves.
 */
@Directive({ selector: '[strctHeaderAction]' })
export class StrctHeaderAction {
  readonly config = input.required<StrctHeaderActionConfig>({ alias: 'strctHeaderAction' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Top application bar. Holds brand on the left and actions on the right. */
@Component({
  selector: 'strct-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgTemplateOutlet,
    StrctIcon,
    StrctDropdown,
    StrctDropdownTrigger,
    StrctDropdownItem,
    StrctDropdownItemIcon,
  ],
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
    @if (actions().length) {
      <span class="strct-header__actions">
        @for (action of inlineActions(); track action) {
          <ng-container *ngTemplateOutlet="action.template" />
        }
        @if (overflowActions().length) {
          <!-- A menu may only hold menu items, so a panel that carries a
               control of its own (a theme switcher, a segmented choice) is a
               labelled dialog instead — the dropdown's popover mode. A panel
               of plain commands stays a menu, with its arrow keys. -->
          <strct-dropdown
            #overflow
            align="end"
            [popover]="overflowIsPanel()"
            [focusable]="overflowIsPanel()"
            [popoverLabel]="overflowLabel()"
          >
            <button
              type="button"
              class="strct-header__more"
              strctDropdownTrigger
              [attr.aria-label]="overflowLabel()"
            >
              <strct-icon name="dots" [size]="18" />
            </button>
            @for (action of overflowActions(); track action) {
              @if (action.config().run; as run) {
                @if (overflowIsPanel()) {
                  <button type="button" class="strct-header__morecmd" (click)="runAndClose(run)">
                    @if (action.config().icon; as icon) {
                      <strct-icon [name]="icon" [size]="15" />
                    }
                    {{ action.config().label }}
                  </button>
                } @else {
                  <strct-dropdown-item (click)="run()">
                    @if (action.config().icon; as icon) {
                      <strct-icon strctDropdownItemIcon [name]="icon" [size]="15" />
                    }
                    {{ action.config().label }}
                  </strct-dropdown-item>
                }
              } @else {
                <div
                  class="strct-header__moreslot"
                  role="group"
                  [attr.aria-label]="action.config().label"
                >
                  <ng-container *ngTemplateOutlet="action.template" />
                </div>
              }
            }
          </strct-dropdown>
        }
      </span>
    }
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
      .strct-header__actions {
        display: flex;
        align-items: center;
        gap: inherit;
        min-width: 0;
      }
      .strct-header__more {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .strct-header__more:hover {
        background: rgb(255 255 255 / 0.12);
      }
      .strct-header__moreslot {
        display: flex;
        align-items: center;
        padding: 6px 10px;
      }
      /* A command inside the panel: a menu item's look without its role,
         because a dialog has no menu items. */
      .strct-header__morecmd {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        padding: 9px 10px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: var(--t1);
        font-size: 13px;
        font-family: var(--font);
        text-align: start;
        cursor: pointer;
      }
      .strct-header__morecmd:hover,
      .strct-header__morecmd:focus-visible {
        background: var(--bg-3);
        outline: none;
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

  /**
   * Below this width (px) the actions marked `overflow: 'phone'` move into a
   * "More" menu. A console header carries more icons than a phone has room
   * for, and an app should not have to draw two copies of each.
   */
  readonly overflowBreakpoint = input(600);
  /** The "More" trigger's accessible name (localisable). */
  readonly overflowLabel = input('More');

  protected readonly actions = contentChildren(StrctHeaderAction);
  /** Whether the viewport is below `overflowBreakpoint`. */
  private readonly narrow = signal(false);

  protected readonly inlineActions = computed(() =>
    this.actions().filter((a) => !this.narrow() || a.config().overflow === 'never'),
  );
  protected readonly overflowActions = computed(() =>
    this.narrow() ? this.actions().filter((a) => a.config().overflow !== 'never') : [],
  );
  /** An action that brings its own control makes the panel a dialog, not a menu. */
  protected readonly overflowIsPanel = computed(() =>
    this.overflowActions().some((a) => !a.config().run),
  );
  private readonly overflowPanel = viewChild<StrctDropdown>('overflow');

  /** In panel mode nothing closes on activation, so a command closes it. */
  protected runAndClose(run: () => void): void {
    run();
    this.overflowPanel()?.close(true);
  }

  protected readonly shell = inject(StrctShellService);
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Dev-only: the shell clips what overflows the header, so a header that
    // does not fit a phone fails silently — the triggers are simply not
    // there. Say so, with the two numbers that make it obvious.
    afterNextRender(() => {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const el = this.hostEl.nativeElement;
        const over = el.scrollWidth - el.clientWidth;
        if (over > 1) {
          strctDevWarn(
            'header-overflow',
            `[strct] strct-header: its content is ${el.scrollWidth}px wide in a ` +
              `${el.clientWidth}px header, so ${over}px of it is clipped and cannot be ` +
              'reached. Mark the triggers that may move with *strctHeaderAction so they ' +
              'collect into the header\u2019s "More" menu below overflowBreakpoint.',
          );
        }
      }
    });

    // The breakpoint has to be read in script, not only in CSS: moving an
    // action means rendering it somewhere else, which no media query can do.
    effect((onCleanup) => {
      const px = this.overflowBreakpoint();
      if (typeof matchMedia !== 'function') return;
      const query = matchMedia(`(max-width: ${px}px)`);
      const update = () => this.narrow.set(query.matches);
      update();
      query.addEventListener('change', update);
      onCleanup(() => query.removeEventListener('change', update));
    });
    // The drawer hands focus back here when it closes, so the shell has to
    // know which element opened it.
    afterNextRender(() => {
      this.shell.drawerToggle = this.hostEl.nativeElement.querySelector(
        '.strct-header__drawer-toggle',
      );
    });
  }
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
