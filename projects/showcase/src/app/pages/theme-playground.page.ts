import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctAlert,
  StrctAvatar,
  StrctBadge,
  StrctButton,
  StrctCard,
  StrctCardBlock,
  StrctCardFooter,
  StrctCardHeader,
  StrctCheckbox,
  StrctChart,
  StrctDonut,
  StrctDonutSegment,
  StrctInput,
  StrctProgress,
  StrctRange,
  StrctTag,
  StrctThemeSwitcher,
  StrctToggle,
} from 'strct';

/**
 * Theme playground — switch palette & mode and watch every component reskin
 * live from the token layer. A kitchen-sink preview across the system.
 */
@Component({
  selector: 'app-theme-playground-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    StrctThemeSwitcher,
    StrctButton,
    StrctBadge,
    StrctTag,
    StrctInput,
    StrctCheckbox,
    StrctToggle,
    StrctRange,
    StrctCard,
    StrctCardHeader,
    StrctCardBlock,
    StrctCardFooter,
    StrctAlert,
    StrctProgress,
    StrctAvatar,
    StrctChart,
    StrctDonut,
  ],
  template: `
    <header class="tp__head">
      <h1 class="tp__title">Theme playground</h1>
      <p class="tp__sub">
        Switch palette &amp; mode — every component below reskins live from the token layer.
      </p>
    </header>

    <div class="tp__controls">
      <strct-theme-switcher />
      <span class="tp__hint">3 palettes × dark / light · one CSS custom-property system</span>
    </div>

    <div class="tp__grid">
      <strct-card>
        <strct-card-header><span>Buttons</span></strct-card-header>
        <strct-card-block>
          <div class="row">
            <button strct-button variant="primary">Primary</button>
            <button strct-button>Neutral</button>
            <button strct-button variant="outline">Outline</button>
            <button strct-button variant="flat">Flat</button>
            <button strct-button variant="critical">Critical</button>
          </div>
          <div class="row">
            <button strct-button variant="primary" solid>Deploy</button>
            <button strct-button variant="critical" solid>Delete</button>
            <button strct-button variant="primary" size="sm">Small</button>
            <button strct-button variant="primary" size="mini">Mini</button>
          </div>
        </strct-card-block>
      </strct-card>

      <strct-card>
        <strct-card-header><span>Status</span></strct-card-header>
        <strct-card-block>
          <div class="row">
            <strct-badge>Neutral</strct-badge>
            <strct-badge status="accent">Accent</strct-badge>
            <strct-badge status="success">Healthy</strct-badge>
            <strct-badge status="warning">Degraded</strct-badge>
            <strct-badge status="critical">Failed</strct-badge>
          </div>
          <div class="row">
            <strct-tag status="accent">production</strct-tag>
            <strct-tag status="success">stable</strct-tag>
            <strct-tag>eu-west</strct-tag>
          </div>
        </strct-card-block>
      </strct-card>

      <strct-card>
        <strct-card-header><span>Form controls</span></strct-card-header>
        <strct-card-block>
          <div class="col">
            <input
              strctInput
              placeholder="Cluster name"
              [ngModel]="text()"
              (ngModelChange)="text.set($event)"
            />
            <select strctInput [ngModel]="region()" (ngModelChange)="region.set($event)">
              <option value="east">Region east</option>
              <option value="west">Region west</option>
            </select>
            <strct-checkbox [ngModel]="agree()" (ngModelChange)="agree.set($event)"
              >Enable HA</strct-checkbox
            >
            <strct-toggle [ngModel]="on()" (ngModelChange)="on.set($event)"
              >Auto-optimize</strct-toggle
            >
            <strct-range
              [min]="0"
              [max]="100"
              [ngModel]="vol()"
              (ngModelChange)="vol.set($event)"
              showValue
            />
          </div>
        </strct-card-block>
      </strct-card>

      <strct-card>
        <strct-card-header><span>Feedback</span></strct-card-header>
        <strct-card-block>
          <div class="col">
            <strct-alert type="info">A new build is available.</strct-alert>
            <strct-alert type="success">Snapshot completed.</strct-alert>
            <strct-alert type="warning">Storage is running low.</strct-alert>
            <strct-alert type="critical">A host is unreachable.</strct-alert>
          </div>
        </strct-card-block>
      </strct-card>

      <strct-card>
        <strct-card-header><span>Data visualization</span></strct-card-header>
        <strct-card-block>
          <div class="viz">
            <div class="col" style="flex:1; min-width:160px;">
              <strct-progress [value]="38" />
              <strct-progress [value]="64" status="success" />
              <strct-progress [value]="82" status="warning" />
              <strct-progress [value]="95" status="critical" />
            </div>
            <strct-donut
              [segments]="donut"
              [size]="110"
              [thickness]="14"
              centerValue="42"
              centerLabel="hosts"
            />
          </div>
          <strct-chart [data]="series" type="area" status="accent" [height]="120" [max]="100" />
        </strct-card-block>
      </strct-card>

      <strct-card>
        <strct-card-header><span>People</span></strct-card-header>
        <strct-card-block>
          <div class="row">
            <strct-avatar name="Ada Lovelace" status="online" />
            <strct-avatar name="Grace Hopper" status="busy" />
            <strct-avatar name="Linus Torvalds" size="lg" status="offline" />
            <strct-avatar name="Margaret Hamilton" size="sm" />
          </div>
        </strct-card-block>
        <strct-card-footer>
          <button strct-button variant="flat" size="sm">Cancel</button>
          <button strct-button variant="primary" size="sm">Invite</button>
        </strct-card-footer>
      </strct-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .tp__head {
        margin-bottom: 16px;
      }
      .tp__title {
        margin: 0;
        font-size: 24px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .tp__sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--t3);
      }
      .tp__controls {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 18px;
        padding: 12px 14px;
        border: 1px solid var(--b2);
        border-radius: 10px;
        background: var(--hdr);
      }
      .tp__hint {
        font-size: 12.5px;
        color: rgba(255, 255, 255, 0.6);
      }
      .tp__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 14px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }
      .row + .row {
        margin-top: 12px;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 320px;
      }
      .viz {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }
    `,
  ],
})
export class ThemePlaygroundPage {
  protected readonly text = signal('Prod-West-A');
  protected readonly region = signal('east');
  protected readonly agree = signal(true);
  protected readonly on = signal(true);
  protected readonly vol = signal(60);

  protected readonly donut: StrctDonutSegment[] = [
    { value: 36, label: 'Running' },
    { value: 3, label: 'Warning' },
    { value: 2, label: 'Maintenance' },
    { value: 1, label: 'Stopped' },
  ];
  protected readonly series = [38, 42, 35, 48, 64, 72, 84, 61, 55];
}
