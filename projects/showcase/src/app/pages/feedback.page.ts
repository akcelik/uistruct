import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  StrctAlert,
  StrctButton,
  StrctSignpost,
  StrctSkeleton,
  StrctToastService,
  StrctTooltip,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-feedback-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, DemoBlock, StrctAlert, StrctButton, StrctTooltip, StrctSignpost, StrctSkeleton],
  template: `
    <app-page-header title="Feedback" subtitle="Contextual messages and hints." />

    <app-demo
      anchor="alert"
      heading="Alert"
      description="Four contextual types, optionally dismissable."
      code="<strct-alert type=&quot;warning&quot;>…</strct-alert>"
    >
      <div class="stack">
        <strct-alert type="info">Informational message with a neutral accent.</strct-alert>
        <strct-alert type="success">The operation completed successfully.</strct-alert>
        <strct-alert type="warning">Heads up — this needs your attention.</strct-alert>
        @if (showDanger()) {
          <strct-alert type="danger" closable (closed)="showDanger.set(false)">
            Something went wrong. This one is dismissable.
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
      code="<button strct-button strctTooltip=&quot;More info&quot;>?</button>"
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
      code="<strct-signpost position=&quot;right&quot;>…</strct-signpost>"
    >
      <strct-signpost position="bottom">
        <button strct-button size="sm" strctSignpostTrigger>Open below</button>
        <h4>About signposts</h4>
        <p>Any projected content fits here — text, lists or controls. Click outside or press Escape to close.</p>
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
      <button strct-button (click)="toast.danger('Connection lost')">Danger</button>
    </app-demo>

    <app-demo
      anchor="skeleton"
      heading="Skeleton"
      description="Shimmering placeholders for content that is still loading."
      code="<strct-skeleton width=&quot;60%&quot; height=&quot;14px&quot; />"
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
  `,
  styles: [
    `
    .stack { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 520px; }
    .skel-card { display: flex; gap: 14px; align-items: center; width: 100%; max-width: 320px; }
    .skel-lines { flex: 1; display: flex; flex-direction: column; gap: 9px; }
    `,
  ],
})
export class FeedbackPage {
  protected readonly showDanger = signal(true);
  protected readonly toast = inject(StrctToastService);
}
