import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctButton,
  StrctCheckbox,
  StrctContextMenu,
  StrctContextMenuTrigger,
  StrctDropdownDivider,
  StrctDropdownItem,
  StrctField,
  StrctIcon,
  StrctInput,
  StrctLogin,
  StrctMenuItem,
  StrctPassword,
  StrctSparkline,
  StrctSubmenu,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-patterns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    FormsModule,
    StrctLogin,
    StrctInput,
    StrctField,
    StrctPassword,
    StrctCheckbox,
    StrctButton,
    StrctIcon,
    StrctContextMenu,
    StrctContextMenuTrigger,
    StrctDropdownItem,
    StrctDropdownDivider,
    StrctSparkline,
    StrctSubmenu,
  ],
  template: `
    <app-page-header
      title="Patterns"
      subtitle="Compositions assembled entirely from library components."
    />

    <app-demo
      anchor="login"
      heading="Login"
      description="A two-panel auth pattern for an operations console: the brand aside layers token-driven ambient visuals (accent glows, a dot matrix, a slow-pulsing node constellation — reduced-motion safe) over a live status strip, beside a corporate sign-in flow with SSO / passkey options and audit microcopy. Everything re-skins with the palette."
      code="<strct-login split><div strctLoginAside>…</div><form>…</form></strct-login>"
    >
      <div class="login-stage">
        <strct-login split [maxWidth]="960">
          <div strctLoginAside class="auth-hero">
            <!-- Ambient, token-driven layers: accent glows, a dot matrix and a
                 slow-pulsing node constellation (reduced-motion safe). -->
            <div class="auth-hero__glow auth-hero__glow--a" aria-hidden="true"></div>
            <div class="auth-hero__glow auth-hero__glow--b" aria-hidden="true"></div>
            <div class="auth-hero__matrix" aria-hidden="true"></div>
            <svg class="auth-hero__net" viewBox="0 0 340 430" aria-hidden="true">
              <path
                class="auth-net__link"
                d="M48 96 L142 158 L104 272 L224 312 M142 158 L262 118 L224 312 M262 118 L300 222 L224 312"
              />
              <circle class="auth-net__node" cx="48" cy="96" r="3" />
              <circle class="auth-net__node auth-net__node--p2" cx="142" cy="158" r="4.5" />
              <circle class="auth-net__node auth-net__node--p3" cx="262" cy="118" r="3" />
              <circle class="auth-net__node auth-net__node--p2" cx="104" cy="272" r="3" />
              <circle class="auth-net__node auth-net__node--p3" cx="224" cy="312" r="4.5" />
              <circle class="auth-net__node" cx="300" cy="222" r="3" />
            </svg>

            <div class="auth-brand">
              <span class="auth-brand__mark">
                <strct-icon name="hexagon" [size]="18" [strokeWidth]="1.5" />
              </span>
              <span class="auth-brand__name">STRUCT OPS</span>
              <span class="auth-brand__env">CONSOLE</span>
            </div>

            <div class="auth-hero-body">
              <div class="auth-kicker">Datacenter operations</div>
              <h2 class="auth-welcome">Command your infrastructure.</h2>
              <span class="auth-rule"></span>
              <p class="auth-lead">
                Hosts, virtual machines, storage and alarms in one console — with the audit trail
                your compliance team expects.
              </p>
            </div>

            <div class="auth-status">
              <span class="auth-status__dot" aria-hidden="true"></span>
              <span class="auth-status__label">All systems operational</span>
              <strct-sparkline [data]="loginTrend" [width]="64" status="success" />
              <span class="auth-status__uptime">99.99% uptime</span>
            </div>
          </div>

          <form strctLoginMain class="auth-form" (submit)="$event.preventDefault()">
            <h3 class="auth-title">Sign in</h3>
            <p class="auth-sub">Use your corporate account to continue.</p>

            <strct-field class="auth-field" label="Email">
              <input
                strctInput
                type="email"
                placeholder="you@company.com"
                [(ngModel)]="email"
                name="email"
              />
            </strct-field>

            <strct-field class="auth-field" label="Password">
              <strct-password [(ngModel)]="password" name="password" placeholder="••••••••" />
            </strct-field>

            <div class="auth-row">
              <strct-checkbox [(ngModel)]="remember" name="remember"
                >Keep me signed in</strct-checkbox
              >
              <a href="javascript:void(0)" class="auth-link">Forgot password?</a>
            </div>

            <button strct-button variant="primary" solid block type="submit">Sign in</button>

            <div class="auth-divider" role="separator"><span>or continue with</span></div>
            <div class="auth-sso">
              <button strct-button variant="outline" type="button">
                <strct-icon name="shield" [size]="15" [strokeWidth]="1.5" /> Corporate SSO
              </button>
              <button strct-button variant="outline" type="button">
                <strct-icon name="key" [size]="15" [strokeWidth]="1.5" /> Passkey
              </button>
            </div>

            <p class="auth-legal">
              Protected system — access is logged and audited.
              <a href="javascript:void(0)" class="auth-link">Terms</a> ·
              <a href="javascript:void(0)" class="auth-link">Privacy</a>
            </p>
          </form>
        </strct-login>
      </div>
    </app-demo>

    <app-demo
      anchor="contextmenu"
      heading="Context menu"
      description="Right-click the area below. The menu opens at the cursor and reuses dropdown items."
      code="<strct-context-menu><div>…</div><ng-container strctContextMenuItems>…</ng-container></strct-context-menu>"
    >
      <strct-context-menu>
        <div class="ctx-target">
          <strct-icon name="grid" [size]="18" />
          <span>Right-click anywhere in this panel</span>
          @if (lastAction()) {
            <span class="ctx-echo">last action: {{ lastAction() }}</span>
          }
        </div>
        <ng-container strctContextMenuItems>
          <strct-dropdown-item (click)="lastAction.set('Open')">
            <strct-icon name="search" [size]="14" /> Open
          </strct-dropdown-item>
          <strct-dropdown-item (click)="lastAction.set('Rename')">
            <strct-icon name="form" [size]="14" /> Rename
          </strct-dropdown-item>
          <strct-dropdown-item (click)="lastAction.set('Duplicate')">
            <strct-icon name="layers" [size]="14" /> Duplicate
          </strct-dropdown-item>
          <strct-dropdown-divider />
          <strct-submenu label="Power">
            <strct-dropdown-item (click)="lastAction.set('Power on')">
              <strct-icon name="power" [size]="14" /> Power on
            </strct-dropdown-item>
            <strct-dropdown-item (click)="lastAction.set('Power off')">
              <strct-icon name="stopped" [size]="14" /> Power off
            </strct-dropdown-item>
            <strct-dropdown-item (click)="lastAction.set('Restart')">
              <strct-icon name="sync" [size]="14" /> Restart
            </strct-dropdown-item>
          </strct-submenu>
          <strct-dropdown-divider />
          <strct-dropdown-item critical (click)="lastAction.set('Delete')">
            <strct-icon name="close" [size]="14" /> Delete
          </strct-dropdown-item>
        </ng-container>
      </strct-context-menu>
    </app-demo>

    <app-demo
      anchor="contextmenu-data"
      owner="contextmenu"
      heading="Data-driven context menu (directive)"
      description='Attach [strctContextMenu]="items" to any element. The menu portals into the body (no clipping), positions by its real size, supports keyboard (↑/↓/→/←/Enter/Esc) and nested submenus, and runs each item&apos;s action.'
      code='<div [strctContextMenu]="items" [strctContextMenuData]="row" (menuSelect)="on($event)">…</div>'
    >
      <div
        class="ctx-target"
        [strctContextMenu]="menuItems"
        [strctContextMenuData]="'host-01'"
        (menuSelect)="lastAction.set($event.label ?? '')"
      >
        <strct-icon name="host" [size]="18" />
        <span>Right-click this host — data-driven menu</span>
        @if (lastAction()) {
          <span class="ctx-echo">last action: {{ lastAction() }}</span>
        }
      </div>
    </app-demo>
  `,
  styles: [
    `
      .login-stage {
        width: 100%;
      }

      .auth-hero {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 40px;
      }
      /* Ambient layers span the full aside (under its padding). */
      .auth-hero__glow {
        position: absolute;
        inset: -36px;
        pointer-events: none;
        filter: blur(46px);
      }
      .auth-hero__glow--a {
        background: radial-gradient(360px 300px at 12% 8%, var(--acc30), transparent 70%);
      }
      .auth-hero__glow--b {
        background: radial-gradient(320px 300px at 92% 96%, var(--acc18), transparent 70%);
      }
      .auth-hero__matrix {
        position: absolute;
        inset: -36px;
        pointer-events: none;
        background-image: radial-gradient(var(--acc30) 1px, transparent 1.4px);
        background-size: 22px 22px;
        opacity: 0.4;
        mask-image: linear-gradient(155deg, rgba(0, 0, 0, 0.9), transparent 72%);
      }
      .auth-hero__net {
        position: absolute;
        inset: -36px;
        width: calc(100% + 72px);
        height: calc(100% + 72px);
        pointer-events: none;
      }
      .auth-net__link {
        fill: none;
        stroke: var(--acc30);
        stroke-width: 1;
      }
      .auth-net__node {
        fill: var(--acc);
        opacity: 0.55;
      }
      @media (prefers-reduced-motion: no-preference) {
        .auth-net__node {
          animation: auth-node-pulse 4.5s ease-in-out infinite;
        }
        .auth-net__node--p2 {
          animation-delay: 1.4s;
        }
        .auth-net__node--p3 {
          animation-delay: 2.8s;
        }
        .auth-status__dot {
          animation: auth-node-pulse 2.6s ease-in-out infinite;
        }
      }
      @keyframes auth-node-pulse {
        0%,
        100% {
          opacity: 0.35;
        }
        50% {
          opacity: 0.85;
        }
      }

      .auth-brand {
        position: relative;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .auth-brand__mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--acc-m);
        border: 1px solid var(--acc30);
        color: var(--acc);
      }
      .auth-brand__name {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 2px;
        color: var(--t1);
      }
      .auth-brand__env {
        font-family: var(--mono);
        font-size: 10px;
        letter-spacing: 1.5px;
        color: var(--t3);
        border: 1px solid var(--b2);
        border-radius: 99px;
        padding: 2px 8px;
      }

      .auth-hero-body {
        position: relative;
      }
      .auth-kicker {
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        margin-bottom: 10px;
        color: var(--acc);
      }
      .auth-welcome {
        margin: 0;
        font-size: 24px;
        line-height: 1.14;
        font-weight: 700;
        letter-spacing: -0.015em;
        color: var(--t1);
        text-wrap: balance;
      }
      .auth-rule {
        display: block;
        width: 44px;
        height: 3px;
        border-radius: 2px;
        background: var(--acc);
        margin: 16px 0;
      }
      .auth-lead {
        margin: 0;
        font-size: 13px;
        line-height: 1.65;
        max-width: 36ch;
        color: var(--t2);
      }

      /* Live status strip — the aside speaks the console's own language. */
      .auth-status {
        position: relative;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px 10px;
        min-width: 0;
        padding: 9px 12px;
        border: 1px solid var(--b2);
        border-radius: 10px;
        background: var(--acc-s);
      }
      .auth-status__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--success);
        flex-shrink: 0;
      }
      .auth-status__label {
        font-size: 12px;
        font-weight: 600;
        color: var(--t1);
        flex: 1;
      }
      .auth-status__uptime {
        font-family: var(--mono);
        font-size: 11px;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
      }
      .auth-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--acc);
      }
      .auth-sub {
        margin: 6px 0 22px;
        font-size: 13px;
        color: var(--t2);
      }
      .auth-field {
        margin-bottom: 14px;
      }
      .auth-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 4px 0 20px;
      }
      .auth-link {
        font-size: 12px;
        color: var(--acc);
      }
      .auth-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 18px 0 14px;
        color: var(--t3);
        font-size: 11.5px;
      }
      .auth-divider::before,
      .auth-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--b2);
      }
      .auth-sso {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .auth-legal {
        margin: 18px 0 0;
        font-size: 11.5px;
        line-height: 1.6;
        color: var(--t3);
      }

      .ctx-target {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 36px;
        text-align: center;
        color: var(--t2);
        font-size: 13px;
        background: var(--bg-1);
        border: 1px dashed var(--b3);
        border-radius: 10px;
      }
      .ctx-target strct-icon {
        color: var(--t3);
      }
      .ctx-echo {
        font-family: var(--mono);
        font-size: 12px;
        color: var(--acc);
      }
    `,
  ],
})
export class PatternsPage {
  protected email = '';
  protected password = '';
  protected remember = false;
  /** Tiny "system healthy" trend in the login aside's status strip. */
  protected readonly loginTrend = [62, 64, 63, 66, 65, 68, 67, 70, 69, 71];
  protected readonly lastAction = signal('');

  protected readonly menuItems: StrctMenuItem[] = [
    { label: 'Open console', icon: 'search' },
    { label: 'Rename', icon: 'form' },
    {
      label: 'Power',
      icon: 'power',
      children: [
        { label: 'Power on', icon: 'power' },
        { label: 'Power off', icon: 'stopped' },
        { label: 'Restart', icon: 'sync' },
      ],
    },
    { label: 'Maintenance mode', icon: 'maintenance', disabled: true },
    { divider: true },
    { label: 'Remove from inventory', icon: 'close', critical: true },
  ];
}
