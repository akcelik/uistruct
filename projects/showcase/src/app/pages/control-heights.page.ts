import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctButton,
  StrctCombobox,
  StrctControlSize,
  StrctControlSizeDirective,
  StrctIcon,
  StrctInput,
  StrctNumber,
  StrctPassword,
  StrctSearchbox,
  StrctSegmented,
  StrctSelect,
  StrctSpinner,
} from 'strct';

/**
 * One height per size, side by side — the fastest way to see a regression in
 * it, and what `scripts/control-height.mjs` measures in CI.
 *
 * Every control in a row states the same `size`, so every box in that row has
 * to be exactly as tall as the others. Before 6.2.0 a row like this stood at
 * 34.9px for the field, 31px for the button, 28px for the searchbox and 22px
 * for a small button, and nothing could make them agree (FR-63-01).
 */
@Component({
  selector: 'app-control-heights-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    StrctButton,
    StrctCombobox,
    StrctControlSizeDirective,
    StrctIcon,
    StrctInput,
    StrctNumber,
    StrctPassword,
    StrctSearchbox,
    StrctSegmented,
    StrctSelect,
    StrctSpinner,
  ],
  template: `
    <h1 class="ch__title">Control heights</h1>
    <p class="ch__lead">
      Every single-line control draws <code>height: var(--control-h)</code>, so controls of one size
      are exactly as tall as each other whatever they hold — an icon, a spinner, a longer word or
      nothing at all. Override <code>--control-h-sm</code> / <code>-md</code> / <code>-lg</code> in
      one place to change the density of a whole application.
    </p>

    @for (size of sizes; track size) {
      <section class="ch__row" [attr.data-size]="size">
        <h2 class="ch__size">
          {{ size }} <span class="ch__token">var(--control-h-{{ size }})</span>
        </h2>

        <!-- Each control states the size itself. -->
        <div class="ch__strip">
          <input strctInput [size]="size" placeholder="Name this view…" [(ngModel)]="text" />
          <strct-select [size]="size" [options]="opts" [(ngModel)]="pick" />
          <strct-combobox [size]="size" [options]="opts" [(ngModel)]="pick" />
          <strct-number [size]="size" [(ngModel)]="count" />
          <strct-password [size]="size" [(ngModel)]="secret" />
          <strct-searchbox [size]="size" placeholder="Search" />
          <strct-segmented
            [size]="size"
            [options]="segOpts"
            [ngModel]="seg()"
            (ngModelChange)="seg.set($event)"
          />
          <button strct-button [size]="size">Save view</button>
          <button strct-button [size]="size" variant="primary">
            <strct-icon name="check" /> With an icon
          </button>
          <button strct-button [size]="size" variant="neutral" icon aria-label="Refresh">
            <strct-icon name="refresh" />
          </button>
          <button strct-button [size]="size" variant="neutral" disabled>Disabled</button>
          <button strct-button [size]="size" variant="neutral">
            <strct-spinner size="sm" /> Loading
          </button>
        </div>

        <!-- And the same row again, with the size set once on the container. -->
        <div class="ch__strip" [strctControlSize]="size">
          <input strctInput placeholder="Set by the container" [(ngModel)]="text" />
          <strct-select [options]="opts" [(ngModel)]="pick" />
          <strct-searchbox placeholder="Search" />
          <button strct-button [size]="size">Apply</button>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .ch__title {
        font-size: var(--text-2xl);
        margin: 0 0 8px;
      }
      .ch__lead {
        max-width: 68ch;
        color: var(--t2);
        margin: 0 0 28px;
      }
      .ch__row {
        margin-bottom: 28px;
      }
      .ch__size {
        display: flex;
        align-items: baseline;
        gap: 10px;
        font-size: var(--text-lg);
        text-transform: uppercase;
        letter-spacing: 0.4px;
        margin: 0 0 10px;
      }
      .ch__token {
        font-family: var(--mono);
        font-size: var(--text-xs);
        font-weight: 400;
        color: var(--t3);
        text-transform: none;
        letter-spacing: 0;
      }
      /* Baseline-aligned so a control that is a pixel out shows up as a step
         in the row rather than something you have to measure. */
      .ch__strip {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 10px;
        padding: 12px;
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        background: var(--bg-2);
        margin-bottom: 8px;
      }
      .ch__strip > * {
        width: auto;
        flex: 0 0 auto;
      }
      .ch__strip input,
      .ch__strip strct-select,
      .ch__strip strct-combobox,
      .ch__strip strct-number,
      .ch__strip strct-password {
        width: 170px;
      }
      .ch__strip strct-searchbox {
        width: 190px;
      }
    `,
  ],
})
export class ControlHeightsPage {
  protected readonly sizes: StrctControlSize[] = ['sm', 'md', 'lg'];
  protected readonly opts = [
    { value: 'prod', label: 'Production' },
    { value: 'stage', label: 'Staging' },
    { value: 'lab', label: 'Lab' },
  ];
  protected readonly segOpts = [
    { value: 'live', label: 'Live' },
    { value: '6h', label: 'Last 6 hours' },
  ];
  protected readonly text = signal('');
  protected readonly pick = signal('prod');
  protected readonly count = signal(8);
  protected readonly secret = signal('');
  protected readonly seg = signal('live');
}
