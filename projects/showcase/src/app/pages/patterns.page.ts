import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctButton,
  StrctCard,
  StrctChatAttachment,
  StrctChatComposer,
  StrctChatMessage,
  StrctChatThread,
  StrctStack,
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
  StrctMenuPlacement,
  StrctMenuService,
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
    StrctCard,
    StrctChatAttachment,
    StrctChatComposer,
    StrctChatMessage,
    StrctChatThread,
    StrctStack,
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
      anchor="menu-anchor"
      owner="contextmenu"
      heading="A menu that belongs to a button"
      description="A menu opened from a control never covers it. Pass anchor (the element or its rect) instead of x / y, and the menu is measured after it renders and placed against the control: bottom-start by default, bottom-end to align the end edges, top-start above. It flips to the other side when the preferred one has no room — try the button in the bar at the bottom of the panel, which asks for a menu below and gets one above — and it stays hidden for the frame it is being measured in, rather than appearing in the wrong place first. Focus returns to the anchor on close."
      code="this.menus.open({ anchor: btn, placement: 'bottom-end', offset: 6, items });"
    >
      <div class="anchor-stage">
        <div class="anchor-row">
          <button strct-button (click)="openAnchored($event, 'bottom-start')">bottom-start</button>
          <button strct-button (click)="openAnchored($event, 'bottom-end')">bottom-end</button>
          <button strct-button (click)="openAnchored($event, 'right-start')">right-start</button>
        </div>
        <div class="anchor-bar">
          <span>status bar</span>
          <button strct-button size="sm" (click)="openAnchored($event, 'bottom-start')">
            asks for below — flips above
          </button>
        </div>
        <span class="ctx-echo">{{ lastAction() || 'open one of the menus' }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="chat"
      heading="Assistant chat"
      description='An assistant panel is built from the library, like every other panel. strct-chat-thread is a role="log" with aria-live="polite", so a streaming reply is announced once when it finishes rather than token by token; busy shows the typing dots, and the thread keeps the newest message in view unless the reader has scrolled up. Each strct-chat-message is an article named by its author, with the assistant&apos;s icon avatar, a bubble drawn from tokens (no blur, no gradient) and room for an attachment card under it — the action the user must approve. The composer grows with the text to maxRows, sends on Enter, breaks a line on Shift+Enter, and never sends mid-composition, so an IME&apos;s Enter commits the candidate instead of the message.'
      code='<strct-chat-thread [busy]="thinking()">…</strct-chat-thread>&#10;<strct-chat-composer [(value)]="draft" (send)="ask($event)" />'
    >
      <div class="chat-stage">
        <strct-chat-thread [busy]="chatBusy()" label="Assistant conversation">
          @for (m of chatMessages(); track m.id) {
            <strct-chat-message
              [author]="m.author"
              [name]="m.name"
              [avatarIcon]="m.author === 'assistant' ? 'sparkles' : ''"
              [streaming]="m.streaming ?? false"
              [time]="m.time ?? null"
            >
              {{ m.text }}
              @if (m.approval) {
                <strct-card strctChatAttachment status="warning" dense>
                  <strct-stack gap="2">
                    <span>Move 4 VMs off hv-02 and put it in maintenance?</span>
                    <div style="display: flex; gap: 8px;">
                      <button strct-button size="sm" variant="primary" (click)="approve()">
                        Approve
                      </button>
                      <button strct-button size="sm" variant="flat" (click)="approve()">
                        Not now
                      </button>
                    </div>
                  </strct-stack>
                </strct-card>
              }
            </strct-chat-message>
          }
        </strct-chat-thread>
        <strct-chat-composer
          [(value)]="chatDraft"
          [disabled]="chatBusy()"
          placeholder="Ask about this cluster…"
          (send)="ask($event)"
        />
      </div>
    </app-demo>

    <app-demo
      anchor="contextmenu-data"
      owner="contextmenu"
      heading="Data-driven context menu (directive)"
      description='Attach [strctContextMenu]="items" to any element. The menu portals into the body (no clipping), positions by its real size, supports keyboard (↑/↓/→/←/Enter/Esc) and nested submenus, and runs each item&apos;s action. A hint says why an entry is unavailable — rest the pointer on Maintenance mode — without putting the reason in the label, and a disabled entry with a hint stays reachable by keyboard so a screen reader can read it.'
      code='<div [strctContextMenu]="items" [strctContextMenuData]="row" (menuSelect)="on($event)">…</div>   // { label: &apos;Clone&apos;, disabled: true, hint: &apos;VM must be powered off to clone.&apos; }'
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
      .chat-stage {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        width: 100%;
        max-width: 560px;
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        background: var(--bg-1);
        padding: var(--space-2);
      }
      .chat-stage strct-chat-thread {
        max-height: 280px;
      }
      .anchor-stage {
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: 100%;
      }
      .anchor-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      /* A bar at the bottom of its own scroll box: a menu asked for below has
         nowhere to go and flips. */
      .anchor-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        background: var(--bg-2);
        font-size: 12px;
        color: var(--t3);
      }
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
  // FR-48-39 — the operations assistant, from the library.
  protected readonly chatMessages = signal<
    {
      id: number;
      author: 'user' | 'assistant' | 'system';
      name: string;
      text: string;
      streaming?: boolean;
      approval?: boolean;
      time?: Date;
    }[]
  >([
    { id: 1, author: 'system', name: '', text: 'Connected to cluster-a' },
    { id: 2, author: 'user', name: 'You', text: 'Why is hv-02 slow?' },
    {
      id: 3,
      author: 'assistant',
      name: 'Assistant',
      text: 'hv-02 is at 94% memory with two VMs ballooning. I can move them to hv-03.',
      approval: true,
    },
  ]);
  protected readonly chatDraft = signal('');
  protected readonly chatBusy = signal(false);
  private chatId = 4;
  protected ask(text: string): void {
    this.chatMessages.update((ms) => [
      ...ms,
      { id: this.chatId++, author: 'user' as const, name: 'You', text, time: new Date() },
    ]);
    this.chatBusy.set(true);
    setTimeout(() => {
      this.chatBusy.set(false);
      this.chatMessages.update((ms) => [
        ...ms,
        {
          id: this.chatId++,
          author: 'assistant' as const,
          name: 'Assistant',
          text: 'Looking at the last hour of metrics for that host…',
          streaming: true,
        },
      ]);
      setTimeout(
        () =>
          this.chatMessages.update((ms) =>
            ms.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
          ),
        1200,
      );
    }, 900);
  }
  protected approve(): void {
    this.chatMessages.update((ms) => ms.map((m) => ({ ...m, approval: false })));
  }

  private readonly menus = inject(StrctMenuService);

  /** FR-48-10 — the menu is placed against the button, not at a guessed point. */
  protected openAnchored(event: Event, placement: StrctMenuPlacement): void {
    this.menus.open({
      anchor: event.currentTarget as HTMLElement,
      placement,
      offset: 6,
      items: [
        { label: 'Open console' },
        { label: 'Take snapshot' },
        { divider: true },
        { label: 'Keyboard layout', children: [{ label: 'US' }, { label: 'TR' }] },
        { divider: true },
        { label: 'Power off', critical: true },
      ],
      onSelect: (item) => this.lastAction.set(`${placement}: ${item.label ?? ''}`),
    });
  }

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
        { label: 'Power on', icon: 'power', disabled: true, hint: 'VM is already powered on.' },
        { label: 'Power off', icon: 'stopped' },
        { label: 'Restart', icon: 'sync' },
      ],
    },
    {
      label: 'Maintenance mode',
      icon: 'maintenance',
      disabled: true,
      hint: 'Host still runs 3 VMs — migrate them first.',
    },
    { divider: true },
    { label: 'Remove from inventory', icon: 'close', critical: true },
  ];
}
