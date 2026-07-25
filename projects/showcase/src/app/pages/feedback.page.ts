import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import {
  StrctAlert,
  StrctBadge,
  StrctButton,
  StrctConfirmOutlet,
  StrctConfirmService,
  StrctEmptyState,
  StrctHero,
  StrctMetricTile,
  StrctNotificationCenter,
  StrctPopover,
  StrctPopoverTrigger,
  StrctSignpost,
  StrctSignpostTrigger,
  StrctSkeleton,
  StrctToastService,
  StrctTooltip,
  StrctTour,
  StrctTourStep,
  StrctAnnouncer,
  StrctHotkeysHelp,
  StrctHotkeysService,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-feedback-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    StrctAlert,
    StrctBadge,
    StrctButton,
    StrctConfirmOutlet,
    StrctHero,
    StrctMetricTile,
    StrctNotificationCenter,
    StrctPopover,
    StrctPopoverTrigger,
    StrctTooltip,
    StrctSignpost,
    StrctSignpostTrigger,
    StrctSkeleton,
    StrctEmptyState,
    StrctTour,
    StrctHotkeysHelp,
  ],
  template: `
    <app-page-header title="Feedback" subtitle="Contextual messages and hints." />

    <app-demo
      anchor="hero"
      heading="Hero"
      description="A page-level status summary with a leading icon chip, heading, description and optional right-aligned metadata / actions."
      code='<strct-hero status="success" icon="shield" heading="High availability is on">…</strct-hero>'
    >
      <div class="stack stack--wide">
        <strct-hero status="success" icon="shield" heading="Protected — high availability is on">
          The standby node keeps a live copy and can take over if this one fails.
          <div strctHeroMeta><strct-badge status="success">HA ON</strct-badge></div>
          <div strctHeroActions>
            <button strct-button size="sm" variant="neutral">Switch over</button>
          </div>
        </strct-hero>

        <strct-hero status="success" heading="All systems healthy">
          All services are responding and resources are within limits.
          <div strctHeroMeta>
            <strct-metric-tile label="Version" value="1.4.2" />
            <strct-metric-tile label="Uptime" value="6d 4h" />
          </div>
        </strct-hero>

        <strct-hero status="warning" dense heading="Clock drift detected">
          The system clock is 2.4s ahead of the NTP source.
          <div strctHeroActions>
            <button strct-button size="sm" variant="neutral">Re-sync</button>
          </div>
        </strct-hero>

        <strct-hero status="critical" heading="Standby node unreachable">
          Failover is not available until the standby node reconnects.
        </strct-hero>
      </div>
    </app-demo>

    <app-demo
      anchor="alert"
      heading="Alert"
      description="Four contextual types, optionally dismissible."
      code='<strct-alert type="warning">…</strct-alert>'
    >
      <div class="stack">
        <strct-alert type="info">Informational message with a neutral accent.</strct-alert>
        <strct-alert type="success">The operation completed successfully.</strct-alert>
        <strct-alert type="warning">Heads up — this needs your attention.</strct-alert>
        @if (showDanger()) {
          <strct-alert type="critical" closable (closed)="showDanger.set(false)">
            Something went wrong. This one is dismissible.
          </strct-alert>
        } @else {
          <button strct-button variant="flat" size="sm" (click)="showDanger.set(true)">
            Restore dismissed alert
          </button>
        }
      </div>
    </app-demo>

    <app-demo
      anchor="confirm"
      heading="Confirm"
      description="Promise-based confirmation for destructive actions — render the outlet once, then await the service from anywhere; a new call cancels the pending one, and Cancel / X / Escape / backdrop all resolve false. The critical tone styles the confirm button as destructive and focus lands on Cancel, never on the destructive action."
      code='if (await inject(StrctConfirmService).confirm({ title: "…", message: "…", tone: "critical" })) { … }'
    >
      <button strct-button variant="critical" (click)="askDelete()">Delete cluster…</button>
      @if (confirmResult() !== null) {
        <span class="echo">confirmed: {{ confirmResult() }}</span>
      }
      <strct-confirm-outlet />
    </app-demo>

    <app-demo
      anchor="tooltip"
      heading="Tooltip"
      description="Hover or focus the buttons. Position is configurable."
      code='<button strct-button strctTooltip="More info">?</button>'
    >
      <button strct-button strctTooltip="Appears above" tooltipPosition="top">Top</button>
      <button strct-button strctTooltip="Appears below" tooltipPosition="bottom">Bottom</button>
      <button strct-button strctTooltip="Appears left" tooltipPosition="left">Left</button>
      <button strct-button strctTooltip="Appears right" tooltipPosition="right">Right</button>
    </app-demo>

    <app-demo
      anchor="signpost"
      heading="Signpost"
      description="A click-triggered popover with an arrow for richer contextual content."
      code='<strct-signpost position="right">…</strct-signpost>'
    >
      <strct-signpost position="bottom">
        <button strct-button size="sm" strctSignpostTrigger>Open below</button>
        <h4>About signposts</h4>
        <p>
          Any projected content fits here — text, lists or controls. Click outside or press Escape
          to close.
        </p>
      </strct-signpost>

      <strct-signpost position="right">
        <button strct-button size="sm" strctSignpostTrigger>Open right</button>
        <h4>Positioned right</h4>
        <p>The arrow follows the chosen position.</p>
      </strct-signpost>
    </app-demo>

    <app-demo
      anchor="popover"
      heading="Popover"
      description="The generic anchored panel behind menus, signposts and rich pickers — a trigger button plus any projected content, edge-flipped and scroll-tracked by the overlay. Plain popovers never steal focus; the trap variant moves focus inside on open, cycles Tab and hands focus back on close."
      code='<strct-popover placement="bottom-start"><button strctPopoverTrigger>…</button>…</strct-popover>'
    >
      <strct-popover placement="bottom-start" ariaLabel="Host details">
        <button strct-button size="sm" strctPopoverTrigger>Host details</button>
        <h4>hv-02.fra.corp</h4>
        <p>cluster-01 · 128 vCPUs · 768 GiB — any projected content fits here.</p>
      </strct-popover>

      <strct-popover placement="bottom-end" ariaLabel="Edit tags" trap>
        <button strct-button size="sm" strctPopoverTrigger>Edit tags (trap)</button>
        <h4>Tags</h4>
        <p>Focus is trapped — Tab cycles the controls, Escape closes.</p>
        <button strct-button size="sm" variant="primary">Save</button>
      </strct-popover>
    </app-demo>

    <app-demo
      anchor="toast"
      heading="Toast"
      description="Transient notifications queued through a service, auto-dismissed after a few seconds."
      code="inject(StrctToastService).success('Saved');"
    >
      <button strct-button (click)="toast.info('Build started')">Info</button>
      <button strct-button (click)="toast.success('Deployment complete')">Success</button>
      <button strct-button (click)="toast.warning('Disk space low')">Warning</button>
      <button strct-button (click)="toast.critical('Connection lost')">Danger</button>
    </app-demo>

    <app-demo
      anchor="notification-center"
      heading="Notification center"
      description="A bell with an unread badge that opens the persistent view of what the toasts announced transiently — every toast fired through StrctToastService lands in its capped history. Clicking an entry marks it read and emits it through (activated); 'mark all read' / 'clear all' act on the shared history."
      code='<strct-notification-center (activated)="open($event)" />  +  toast.success("Saved")'
    >
      <strct-notification-center (activated)="ncLast.set($event.message)" />
      <button strct-button (click)="toast.success('Snapshot completed')">Fire success</button>
      <button strct-button (click)="toast.warning('Datastore above 80%')">Fire warning</button>
      <button strct-button (click)="toast.critical('Host not responding')">Fire critical</button>
      @if (ncLast()) {
        <span class="echo">activated: "{{ ncLast() }}"</span>
      }
    </app-demo>

    <app-demo
      anchor="skeleton"
      heading="Skeleton"
      description="Shimmering placeholders for content that is still loading."
      code='<strct-skeleton width="60%" height="14px" />'
    >
      <div class="skel-card">
        <strct-skeleton circle width="44px" height="44px" />
        <div class="skel-lines">
          <strct-skeleton width="55%" height="13px" />
          <strct-skeleton width="80%" height="11px" />
          <strct-skeleton width="40%" height="11px" />
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="empty-state"
      heading="Empty state"
      description="Centered zero / permission / error states with an icon, copy and a call to action."
    >
      <div class="es-grid">
        <strct-empty-state
          variant="empty"
          title="No virtual machines"
          description="This cluster has no VMs yet. Create one to get started."
        >
          <button strct-button variant="primary" size="sm">New VM</button>
        </strct-empty-state>
        <strct-empty-state
          variant="denied"
          title="Insufficient privileges"
          description="You don't have access to this cluster. Ask an administrator for the Operator role."
        >
          <button strct-button variant="outline" size="sm">Request access</button>
        </strct-empty-state>
      </div>
    </app-demo>

    <app-demo
      anchor="tour"
      heading="Tour"
      description="Coach marks over live UI: each step spotlights its target with an accent ring and anchors a dialog card next to it. Arrows/buttons step, Escape dismisses; reopening restarts."
      code='<strct-tour [(open)]="tourOpen" [steps]="steps" (finished)="markSeen()" />'
    >
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <button strct-button variant="primary" id="tour-start" (click)="tourOpen.set(true)">
          Start tour
        </button>
        <strct-badge id="tour-badge" status="success">Deployment healthy</strct-badge>
        @if (tourMsg()) {
          <span class="echo">{{ tourMsg() }}</span>
        }
      </div>
      <strct-tour
        [(open)]="tourOpen"
        [steps]="tourSteps"
        (finished)="tourMsg.set('finished')"
        (dismissed)="tourMsg.set('dismissed')"
      />
    </app-demo>

    <app-demo
      anchor="announcer"
      heading="Announcer"
      description="Screen-reader announcements for state changes with no visible text — a root-provided service maintaining hidden polite/assertive live regions. Identical consecutive messages re-announce (clear-then-set)."
      code="inject(StrctAnnouncer).announce('12 rows loaded')  ·  .announce('disk failure', 'assertive')"
    >
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <button strct-button variant="neutral" (click)="announcePolite()">Announce politely</button>
        <button strct-button variant="neutral" (click)="announceAssertive()">
          Announce assertively
        </button>
        <span class="echo">{{ annMsg() || 'turn on a screen reader to hear it' }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="hotkeys"
      heading="Hotkeys"
      description="Centrally registered application hotkeys (Blueprint pattern): combos like mod+k (mod = Ctrl/⌘), plain keys suppressed while typing, and a ? cheatsheet overlay that lists everything. This docs site's ? runs on it — try pressing ?."
      code="hotkeys.register({ combo: 'mod+k', description: 'Open palette', group: 'Global', handler: open })  +  <strct-hotkeys-help />"
    >
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <button strct-button variant="primary" (click)="helpOpen.set(true)">
          Open cheatsheet (or press ?)
        </button>
        @if (hkMsg()) {
          <span class="echo">{{ hkMsg() }}</span>
        }
      </div>
      <strct-hotkeys-help [(open)]="helpOpen" />
    </app-demo>
  `,
  styles: [
    `
      .echo {
        font-size: 12.5px;
        color: var(--t2);
      }
    `,
    `
      .es-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 14px;
        width: 100%;
      }
      .es-grid strct-empty-state {
        border: 1px solid var(--b2);
        border-radius: 11px;
        background: var(--bg-2);
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        max-width: 520px;
      }
      .stack--wide {
        max-width: 100%;
      }
      .skel-card {
        display: flex;
        gap: 14px;
        align-items: center;
        width: 100%;
        max-width: 320px;
      }
      .skel-lines {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
    `,
  ],
})
export class FeedbackPage {
  private readonly announcer = inject(StrctAnnouncer);
  private readonly hotkeys = inject(StrctHotkeysService);
  protected readonly annMsg = signal('');
  protected readonly helpOpen = signal(false);
  protected readonly hkMsg = signal('');

  protected announcePolite(): void {
    this.announcer.announce('12 rows loaded');
    this.annMsg.set('announced (polite): "12 rows loaded"');
  }
  protected announceAssertive(): void {
    this.announcer.announce('Fan redundancy lost on hv-02', 'assertive');
    this.annMsg.set('announced (assertive): "Fan redundancy lost on hv-02"');
  }

  constructor() {
    const dispose = this.hotkeys.register({
      combo: 'shift+d',
      description: 'Demo: deploy something',
      group: 'Demos',
      handler: () => this.hkMsg.set('shift+D fired'),
    });
    inject(DestroyRef).onDestroy(dispose);
  }

  protected readonly tourOpen = signal(false);
  protected readonly tourMsg = signal('');
  protected readonly tourSteps: StrctTourStep[] = [
    { target: '#tour-start', title: 'Start here', body: 'This button opened the tour you are on.' },
    { target: '#tour-badge', title: 'Live status', body: 'Badges carry deployment health.' },
    { target: null, title: 'All set', body: 'A targetless step centers the card.' },
  ];

  protected readonly showDanger = signal(true);
  protected readonly toast = inject(StrctToastService);

  private readonly confirm = inject(StrctConfirmService);
  protected readonly confirmResult = signal<boolean | null>(null);
  protected readonly ncLast = signal('');

  protected async askDelete(): Promise<void> {
    this.confirmResult.set(
      await this.confirm.confirm({
        title: 'Delete cluster?',
        message:
          'Deleting "Edge Cluster" removes its 3 hosts and all of their VMs. This cannot be undone.',
        confirmLabel: 'Delete',
        tone: 'critical',
      }),
    );
  }
}
