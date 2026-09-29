import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  StrctAvatar,
  StrctBadge,
  StrctButton,
  StrctButtonGroup,
  StrctIcon,
  StrctProgress,
  StrctProgressSegment,
  StrctSpeedDial,
  StrctSpinner,
  StrctStatusDot,
  StrctTag,
  StrctTagLeading,
  StrctTooltip,
  StrctCopy,
  StrctSplitButton,
  StrctMenuItem,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-controls-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    StrctButton,
    StrctButtonGroup,
    StrctIcon,
    StrctBadge,
    StrctTag,
    StrctAvatar,
    StrctProgress,
    StrctSpinner,
    StrctSpeedDial,
    StrctTooltip,
    StrctCopy,
    StrctSplitButton,
    StrctStatusDot,
    StrctTagLeading,
  ],
  template: `
    <app-page-header title="Controls" subtitle="Buttons and at-a-glance status indicators." />

    <app-demo
      anchor="button"
      heading="Button"
      description="Restrained by default — outlined / ghost surfaces with color used only as a subtle border and text accent, never a loud fill."
      code='<button strct-button variant="primary">Primary</button>'
    >
      <button strct-button variant="primary">Primary</button>
      <button strct-button>Neutral</button>
      <button strct-button variant="outline">Outline</button>
      <button strct-button variant="flat">Flat</button>
      <button strct-button variant="critical">Danger</button>
      <button strct-button variant="primary" disabled>Disabled</button>
    </app-demo>

    <app-demo
      anchor="button-link"
      owner="button"
      heading="Link variant"
      description='An action inside running text looks like a link and behaves like a button — “Show all”, a folder name in a cell, “Use another method”. A flat button is too heavy inline, and an <a> with a click handler and no href cannot be reached with Tab. variant="link" drops the padding, border and background, sits on the text baseline, underlines on hover and on focus, and scales only the font with size. It works on a real <a href> too, and a disabled one goes quiet (--t4) with no underline.'
      code='Nothing here yet — <button strct-button variant="link">create a view</button> to start.'
    >
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
        <p style="margin: 0; font-size: 13px; color: var(--t2);">
          3 of 47 alarms shown.
          <button strct-button variant="link" (click)="lastLink.set('Show all')">Show all</button>
        </p>
        <p style="margin: 0; font-size: 13px; color: var(--t2);">
          Signed in as admin.
          <button
            strct-button
            variant="link"
            size="sm"
            (click)="lastLink.set('Use another method')"
          >
            Use another method
          </button>
          ·
          <button strct-button variant="link" disabled>Disabled</button>
        </p>
        <span class="echo">{{ lastLink() || 'click a link' }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="button-solid"
      owner="button"
      heading="Solid (opt-in)"
      description="Add the solid attribute for a rare filled call to action."
      code='<button strct-button variant="primary" solid>Deploy</button>'
    >
      <button strct-button variant="primary" solid>Deploy</button>
      <button strct-button solid>Neutral</button>
      <button strct-button variant="critical" solid>Delete</button>
    </app-demo>

    <app-demo
      anchor="button-sizes"
      owner="button"
      heading="Button sizes"
      description="md (default), sm, mini."
    >
      <button strct-button variant="primary">Medium</button>
      <button strct-button variant="primary" size="sm">Small</button>
      <button strct-button variant="primary" size="mini">Mini</button>
    </app-demo>

    <app-demo
      anchor="badge"
      heading="Badge"
      description="Outlined by default; add the solid attribute for a filled badge."
      code='<strct-badge status="success">Active</strct-badge>'
    >
      <strct-badge>Neutral</strct-badge>
      <strct-badge status="accent">Accent</strct-badge>
      <strct-badge status="success">Active</strct-badge>
      <strct-badge status="warning">Pending</strct-badge>
      <strct-badge status="critical">Failed</strct-badge>
      <strct-badge status="accent" solid>Solid</strct-badge>
    </app-demo>

    <app-demo
      anchor="buttongroup"
      heading="Button group"
      description="Segmented buttons joined into one control, plus square icon-only buttons."
      code="<strct-button-group>…</strct-button-group> · <button strct-button iconOnly>…</button>"
    >
      <strct-button-group>
        <button strct-button>Day</button>
        <button strct-button>Week</button>
        <button strct-button>Month</button>
      </strct-button-group>

      <strct-button-group>
        <button strct-button iconOnly aria-label="Previous">
          <strct-icon name="chevronLeft" [size]="15" />
        </button>
        <button strct-button iconOnly aria-label="Refresh">
          <strct-icon name="sync" [size]="15" />
        </button>
        <button strct-button iconOnly aria-label="Next">
          <strct-icon name="chevronRight" [size]="15" />
        </button>
      </strct-button-group>

      <button strct-button iconOnly variant="primary" solid aria-label="Add">
        <strct-icon name="upload" [size]="15" />
      </button>
    </app-demo>

    <app-demo
      anchor="speeddial"
      heading="Speed dial"
      description="A floating action button that fans out to reveal actions, each with an optional tooltip."
      code='<strct-speed-dial icon="ellipsis" direction="up">…</strct-speed-dial>'
    >
      <div class="sd-stage">
        <strct-speed-dial icon="ellipsis" direction="up">
          <button
            strct-button
            iconOnly
            variant="primary"
            solid
            strctTooltip="Snapshot"
            tooltipPosition="left"
          >
            <strct-icon name="snapshot" [size]="15" />
          </button>
          <button
            strct-button
            iconOnly
            variant="primary"
            solid
            strctTooltip="Restart"
            tooltipPosition="left"
          >
            <strct-icon name="sync" [size]="15" />
          </button>
          <button
            strct-button
            iconOnly
            variant="primary"
            solid
            strctTooltip="Migrate"
            tooltipPosition="left"
          >
            <strct-icon name="upload" [size]="15" />
          </button>
        </strct-speed-dial>

        <strct-speed-dial icon="ellipsis" direction="right">
          <button strct-button iconOnly><strct-icon name="search" [size]="15" /></button>
          <button strct-button iconOnly><strct-icon name="bell" [size]="15" /></button>
        </strct-speed-dial>
      </div>
    </app-demo>

    <app-demo
      anchor="tag"
      heading="Tag"
      description="Compact labels; add removable for a dismiss button."
      code='<strct-tag status="accent" removable (removed)="drop()">Frontend</strct-tag>'
    >
      <strct-tag>Plain</strct-tag>
      <strct-tag status="accent">Accent</strct-tag>
      <strct-tag status="success">Stable</strct-tag>
      @for (t of tags(); track t) {
        <strct-tag status="accent" removable (removed)="removeTag(t)">{{ t }}</strct-tag>
      }
    </app-demo>

    <app-demo
      anchor="tag-interactive"
      owner="tag"
      heading="A tag as a control"
      description='A tag is also the natural control for a thing you can reopen — a minimised console, a suggested question, a VM in a list — and removing it is a separate act. interactive makes the body activate on click, Enter or Space and emit (activated), while the × stays its own tab stop: two targets, two things to say. [strctTagLeading] projects a status dot or an icon before the text, shape="pill" rounds it fully, and mono is for names that are identifiers. The body carries role="button" rather than being a <button>, because a template can project the same content into only one place — the shape strct-list-item and strct-tree rows use.'
      code='<strct-tag interactive removable shape="pill" (activated)="restore(c)" (removed)="close(c)" removeLabel="Close the console of APP01">&#10;  <strct-status-dot strctTagLeading status="success" size="sm" />&#10;  APP01&#10;</strct-tag>'
    >
      <div style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          @for (c of consoles(); track c.name) {
            <strct-tag
              interactive
              removable
              shape="pill"
              [removeLabel]="'Close the console of ' + c.name"
              (activated)="lastTagAction.set('opened ' + c.name)"
              (removed)="closeConsole(c.name)"
            >
              <strct-status-dot strctTagLeading [status]="c.status" size="sm" />
              <strct-icon strctTagLeading strictName="monitor" [size]="13" />
              {{ c.name }}
            </strct-tag>
          }
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <strct-tag mono>vm-8f3c2a1b</strct-tag>
          <strct-tag mono status="critical">stranded: db-02</strct-tag>
          <strct-tag
            shape="pill"
            interactive
            (activated)="lastTagAction.set('asked: why is it slow?')"
          >
            Why is this host slow?
          </strct-tag>
        </div>
        <span class="echo">{{ lastTagAction() || 'click a chip, or its ×' }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="copy"
      heading="Copy"
      description="Click-to-copy with built-in feedback: the icon flips to a ✓ 'Copied' state and announces it to screen readers. The console workhorse for UUIDs, IPs and serials."
      code='<strct-copy text="172.16.75.100" />  ·  <strct-copy [text]="host.id" label="Copy ID" />'
    >
      <div style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
        <span style="font-family: var(--mono); font-size: 13px; color: var(--t1);"
          >172.16.75.100 <strct-copy text="172.16.75.100"
        /></span>
        <span style="font-family: var(--mono); font-size: 13px; color: var(--t1);"
          >KX-99213-AC <strct-copy text="KX-99213-AC"
        /></span>
        <strct-copy text="550e8400-e29b-41d4-a716-446655440000" label="Copy UUID" />
      </div>
    </app-demo>

    <app-demo
      anchor="avatar"
      heading="Avatar"
      description="Initials fallback, three sizes and an optional status dot."
      code='<strct-avatar name="Ada Lovelace" status="online" />'
    >
      <strct-avatar name="Ada Lovelace" size="sm" />
      <strct-avatar name="Grace Hopper" status="online" />
      <strct-avatar name="Linus Torvalds" status="busy" />
      <strct-avatar name="Margaret Hamilton" size="lg" status="offline" />
    </app-demo>

    <app-demo
      anchor="avatar-icon"
      owner="avatar"
      heading="Not every avatar is a person"
      description='A group is a square, an assistant is an icon, a brand mark is a tile. icon renders in place of initials (an src image still wins), shape="square" rounds to --radius-md instead of a circle, and tone paints the surface — accent-soft for the quiet accent tile a brand mark or an assistant wants.'
      code='<strct-avatar icon="users" shape="square" tone="neutral" name="Platform Admins" />'
    >
      <div style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
        <strct-avatar name="Ada Lovelace" />
        <strct-avatar name="Platform Admins" icon="users" shape="square" />
        <strct-avatar name="Assistant" icon="sparkles" tone="accent-soft" />
        <strct-avatar name="UIStruct" icon="layers" shape="square" tone="accent" size="lg" />
        <strct-avatar name="Alert owner" icon="bell" tone="critical" size="sm" />
      </div>
    </app-demo>

    <app-demo
      anchor="progress"
      heading="Progress"
      description="Value bar with a semantic status color."
      code='<strct-progress [value]="72" status="warning" />'
    >
      <div class="stack">
        <strct-progress [value]="38" />
        <strct-progress [value]="64" status="success" />
        <strct-progress [value]="82" status="warning" />
        <strct-progress [value]="96" status="critical" />
        <strct-progress [value]="12" status="neutral" />
      </div>
    </app-demo>

    <app-demo
      anchor="progress-meter"
      owner="progress"
      heading="Meter mode"
      description="A capacity bar says what it measures and how much, next to the bar: visibleLabel puts the label at the start of a row above the track, showValue puts valueText at its end, and caption adds a quiet line under it. segments stacks more than one fill — what a host runs now, plus what would arrive if its neighbour failed — each with its own tone and its own name in the accessible text. indeterminate is a task that is running but reports no percentage; under prefers-reduced-motion it is a static striped fill instead of a sweep. All of it is off by default."
      code='<strct-progress [value]="57" label="Memory" visibleLabel showValue valueText="293 GB of 512 GB" caption="219 GB free across 2 nodes" />'
    >
      <div class="stack" style="max-width: 420px;">
        <strct-progress
          [value]="57"
          label="Memory"
          visibleLabel
          showValue
          valueText="293 GB of 512 GB"
          caption="219 GB free across 2 nodes"
        />
        <strct-progress [value]="83" label="CPU" visibleLabel showValue status="warning" />
        <strct-progress
          label="Failover headroom"
          visibleLabel
          [segments]="failoverSegments"
          caption="Used now, plus what would arrive if hv-04 failed."
        />
        <strct-progress label="Reclaiming space" visibleLabel indeterminate status="neutral" />
      </div>
    </app-demo>

    <app-demo
      anchor="spinner"
      heading="Spinner"
      description="Indeterminate loading ring in three sizes. A caption says what is being waited for, beside the ring — and becomes the spinner's accessible name, so it is not announced as “Loading” while it says something else."
      code='<strct-spinner caption="Reading…" />'
    >
      <strct-spinner size="sm" />
      <strct-spinner />
      <strct-spinner size="lg" />
      <strct-spinner caption="Reading…" />
    </app-demo>

    <app-demo
      anchor="split-button"
      heading="Split button"
      description="A primary action plus a chevron of variants: the main segment fires (action), menu entries fire (picked). Use when one action dominates but variants exist."
      code='<strct-split-button label="Deploy" solid [items]="variants" (action)="deploy()" (picked)="run($event)" />'
    >
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <strct-split-button
          label="Deploy"
          icon="rocket"
          solid
          [items]="deployVariants"
          (action)="sbLast.set('Deploy')"
          (picked)="sbLast.set($event.label ?? '')"
        />
        <strct-split-button
          label="Power on"
          [items]="powerVariants"
          (action)="sbLast.set('Power on')"
          (picked)="sbLast.set($event.label ?? '')"
        />
        @if (sbLast()) {
          <span class="echo">ran: {{ sbLast() }}</span>
        }
      </div>
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
      .stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        max-width: 420px;
      }
      .sd-stage {
        display: flex;
        gap: 70px;
        align-items: flex-end;
        padding: 80px 16px 10px;
      }
    `,
  ],
})
export class ControlsPage {
  protected readonly sbLast = signal('');
  protected readonly deployVariants: StrctMenuItem[] = [
    { label: 'Deploy with snapshot', icon: 'snapshot' },
    { label: 'Deploy paused', icon: 'paused' },
    { divider: true },
    { label: 'Force deploy', icon: 'warning', critical: true },
  ];
  protected readonly powerVariants: StrctMenuItem[] = [
    { label: 'Power on and open console' },
    { label: 'Power on all in cluster' },
  ];

  /** Used now, plus what would land here if a neighbour failed. */
  protected readonly failoverSegments: StrctProgressSegment[] = [
    { value: 61, status: 'accent', label: 'Used' },
    { value: 22, status: 'warning', label: 'Arriving' },
  ];

  protected readonly lastLink = signal('');
  protected readonly tags = signal(['Frontend', 'Design', 'Infra']);

  // FR-48-03 — minimised consoles: the body opens one, the × closes it.
  protected readonly consoles = signal<{ name: string; status: 'success' | 'warning' }[]>([
    { name: 'APP01', status: 'success' },
    { name: 'DB-PRIMARY', status: 'success' },
    { name: 'BUILD-07', status: 'warning' },
  ]);
  protected readonly lastTagAction = signal('');
  protected closeConsole(name: string): void {
    this.consoles.update((list) => list.filter((c) => c.name !== name));
    this.lastTagAction.set('closed ' + name);
  }

  protected removeTag(tag: string): void {
    this.tags.update((list) => list.filter((t) => t !== tag));
  }
}
