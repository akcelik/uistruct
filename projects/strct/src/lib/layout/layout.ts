import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  input,
  signal,
} from '@angular/core';
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
        background: var(--bg-2);
      }
      .strct-shell__main {
        display: flex;
        min-height: 0;
        overflow: hidden;
      }
    `,
  ],
})
export class StrctShell {}

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
