import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctButton,
  StrctCheckbox,
  StrctContextMenu,
  StrctDropdownDivider,
  StrctDropdownItem,
  StrctIcon,
  StrctInput,
  StrctLogin,
  StrctPassword,
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
    StrctPassword,
    StrctCheckbox,
    StrctButton,
    StrctIcon,
    StrctContextMenu,
    StrctDropdownItem,
    StrctDropdownDivider,
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
      description="A two-panel auth layout: a decorative accent aside beside the sign-in form. The aside is driven by theme tokens, so it re-skins with every palette."
      code="<strct-login split><div strctLoginAside>…</div><form>…</form></strct-login>"
    >
      <div class="login-stage">
        <strct-login split>
          <div strctLoginAside class="auth-hero">
            <div class="auth-brand">
              <strct-icon name="hexagon" [size]="20" [strokeWidth]="1.5" />
              <span>COMPANY NAME</span>
            </div>
            <div class="auth-hero-body">
              <div class="auth-kicker">Nice to see you again</div>
              <h2 class="auth-welcome">Welcome back</h2>
              <span class="auth-rule"></span>
              <p class="auth-lead">
                Sign in to pick up right where you left off. Your workspace, dashboards and
                recent activity are waiting.
              </p>
            </div>
          </div>

          <form strctLoginMain class="auth-form" (submit)="$event.preventDefault()">
            <h3 class="auth-title">Login Account</h3>
            <p class="auth-sub">Enter your credentials to access your account.</p>

            <label class="auth-field">
              <span>Email</span>
              <input strctInput type="email" placeholder="you@example.com" [(ngModel)]="email" name="email" />
            </label>

            <label class="auth-field">
              <span>Password</span>
              <strct-password [(ngModel)]="password" name="password" placeholder="••••••••" />
            </label>

            <div class="auth-row">
              <strct-checkbox [(ngModel)]="remember" name="remember">Keep me signed in</strct-checkbox>
              <a href="javascript:void(0)" class="auth-link">Forgot password?</a>
            </div>

            <button strct-button variant="primary" solid block type="submit">Sign in</button>
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
          <strct-dropdown-item danger (click)="lastAction.set('Delete')">
            <strct-icon name="close" [size]="14" /> Delete
          </strct-dropdown-item>
        </ng-container>
      </strct-context-menu>
    </app-demo>
  `,
  styles: [
    `
    .login-stage { width: 100%; }

    .auth-hero { height: 100%; display: flex; flex-direction: column; justify-content: space-between; gap: 40px; }
    .auth-brand {
      display: flex; align-items: center; gap: 9px;
      font-size: 12px; font-weight: 600; letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.9);
    }
    .auth-kicker { font-size: 13px; color: rgba(255, 255, 255, 0.82); margin-bottom: 8px; }
    .auth-welcome { margin: 0; font-size: 30px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #fff; }
    .auth-rule { display: block; width: 40px; height: 3px; border-radius: 2px; background: rgba(255, 255, 255, 0.85); margin: 14px 0; }
    .auth-lead { margin: 0; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.78); max-width: 34ch; }

    .auth-form { display: flex; flex-direction: column; }
    .auth-title { margin: 0; font-size: 20px; font-weight: 600; color: var(--acc); }
    .auth-sub { margin: 6px 0 22px; font-size: 13px; color: var(--t2); }
    .auth-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .auth-field > span { font-size: 12px; font-weight: 600; color: var(--t2); }
    .auth-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 4px 0 20px; }
    .auth-link { font-size: 12px; color: var(--acc); }

    .ctx-target {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      width: 100%; padding: 36px; text-align: center;
      color: var(--t2); font-size: 13px;
      background: var(--bg-1); border: 1px dashed var(--b3); border-radius: 10px;
    }
    .ctx-target strct-icon { color: var(--t3); }
    .ctx-echo { font-family: var(--mono); font-size: 12px; color: var(--acc); }
    `,
  ],
})
export class PatternsPage {
  protected email = '';
  protected password = '';
  protected remember = false;
  protected readonly lastAction = signal('');
}
