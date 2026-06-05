import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  StrctAvatar,
  StrctBadge,
  StrctButton,
  StrctButtonGroup,
  StrctIcon,
  StrctProgress,
  StrctSpeedDial,
  StrctSpinner,
  StrctTag,
  StrctTooltip,
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
      </div>
    </app-demo>

    <app-demo
      anchor="spinner"
      heading="Spinner"
      description="Indeterminate loading ring in three sizes."
    >
      <strct-spinner size="sm" />
      <strct-spinner />
      <strct-spinner size="lg" />
    </app-demo>
  `,
  styles: [
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
  protected readonly tags = signal(['Frontend', 'Design', 'Infra']);

  protected removeTag(tag: string): void {
    this.tags.update((list) => list.filter((t) => t !== tag));
  }
}
