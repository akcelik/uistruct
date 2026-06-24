import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  StrctAlert,
  StrctBadge,
  StrctButton,
  StrctEmptyState,
  StrctHero,
  StrctMetricTile,
  StrctSignpost,
  StrctSkeleton,
  StrctToastService,
  StrctTooltip,
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
    StrctHero,
    StrctMetricTile,
    StrctTooltip,
    StrctSignpost,
    StrctSkeleton,
    StrctEmptyState,
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
  `,
  styles: [
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
  protected readonly showDanger = signal(true);
  protected readonly toast = inject(StrctToastService);
}
