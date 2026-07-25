import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctAlert,
  StrctAvatar,
  StrctBadge,
  StrctButton,
  StrctCombobox,
  StrctConfirmOutlet,
  StrctConfirmService,
  StrctDatetimePicker,
  StrctHeatmap,
  StrctHeatmapCell,
  StrctIcon,
  StrctInlineEdit,
  StrctInput,
  StrctKnob,
  StrctNotificationCenter,
  StrctNumber,
  StrctOption,
  StrctPopover,
  StrctPopoverTrigger,
  StrctProgress,
  StrctRange,
  StrctRating,
  StrctSegmented,
  StrctSegmentedOption,
  StrctSpinner,
  StrctStatusDot,
  StrctTag,
  StrctToastService,
  StrctToggle,
  StrctTreeNodeData,
  StrctTreeSelect,
} from 'strct';

type ControlType = 'select' | 'boolean' | 'text' | 'number';
interface Control {
  prop: string;
  type: ControlType;
  options?: string[];
  min?: number;
  max?: number;
}
interface PlaygroundCmp {
  id: string;
  label: string;
  controls: Control[];
  defaults: Record<string, unknown>;
  code: (v: Record<string, unknown>) => string;
}

const STATUS = ['neutral', 'accent', 'success', 'warning', 'critical'];
const SEMANTIC = ['accent', 'success', 'warning', 'critical'];

const PLAYGROUND: PlaygroundCmp[] = [
  {
    id: 'button',
    label: 'Button',
    controls: [
      {
        prop: 'variant',
        type: 'select',
        options: ['neutral', 'primary', 'critical', 'outline', 'flat'],
      },
      { prop: 'size', type: 'select', options: ['md', 'sm', 'mini'] },
      { prop: 'solid', type: 'boolean' },
      { prop: 'block', type: 'boolean' },
      { prop: 'label', type: 'text' },
    ],
    defaults: { variant: 'primary', size: 'md', solid: false, block: false, label: 'Save changes' },
    code: (v) =>
      `<button strct-button variant="${v['variant']}" size="${v['size']}"${v['solid'] ? ' solid' : ''}${v['block'] ? ' block' : ''}>${v['label']}</button>`,
  },
  {
    id: 'badge',
    label: 'Badge',
    controls: [
      { prop: 'status', type: 'select', options: STATUS },
      { prop: 'solid', type: 'boolean' },
      { prop: 'label', type: 'text' },
    ],
    defaults: { status: 'success', solid: false, label: 'Active' },
    code: (v) =>
      `<strct-badge status="${v['status']}"${v['solid'] ? ' solid' : ''}>${v['label']}</strct-badge>`,
  },
  {
    id: 'tag',
    label: 'Tag',
    controls: [
      { prop: 'status', type: 'select', options: STATUS },
      { prop: 'removable', type: 'boolean' },
      { prop: 'label', type: 'text' },
    ],
    defaults: { status: 'accent', removable: true, label: 'production' },
    code: (v) =>
      `<strct-tag status="${v['status']}"${v['removable'] ? ' removable' : ''}>${v['label']}</strct-tag>`,
  },
  {
    id: 'avatar',
    label: 'Avatar',
    controls: [
      { prop: 'name', type: 'text' },
      { prop: 'size', type: 'select', options: ['sm', 'md', 'lg'] },
      { prop: 'status', type: 'select', options: ['none', 'online', 'busy', 'offline'] },
    ],
    defaults: { name: 'Ada Lovelace', size: 'md', status: 'online' },
    code: (v) => `<strct-avatar name="${v['name']}" size="${v['size']}" status="${v['status']}" />`,
  },
  {
    id: 'progress',
    label: 'Progress',
    controls: [
      { prop: 'value', type: 'number', min: 0, max: 100 },
      { prop: 'status', type: 'select', options: SEMANTIC },
    ],
    defaults: { value: 64, status: 'success' },
    code: (v) => `<strct-progress [value]="${v['value']}" status="${v['status']}" />`,
  },
  {
    id: 'spinner',
    label: 'Spinner',
    controls: [{ prop: 'size', type: 'select', options: ['sm', 'md', 'lg'] }],
    defaults: { size: 'md' },
    code: (v) => `<strct-spinner size="${v['size']}" />`,
  },
  {
    id: 'alert',
    label: 'Alert',
    controls: [
      { prop: 'type', type: 'select', options: ['info', 'success', 'warning', 'critical'] },
      { prop: 'closable', type: 'boolean' },
      { prop: 'message', type: 'text' },
    ],
    defaults: { type: 'info', closable: true, message: 'Your configuration has been saved.' },
    code: (v) =>
      `<strct-alert type="${v['type']}"${v['closable'] ? ' closable' : ''}>${v['message']}</strct-alert>`,
  },
  {
    id: 'status-dot',
    label: 'Status dot',
    controls: [
      { prop: 'status', type: 'select', options: STATUS },
      { prop: 'size', type: 'select', options: ['md', 'sm'] },
      { prop: 'label', type: 'text' },
    ],
    defaults: { status: 'success', size: 'md', label: '' },
    code: (v) =>
      `<strct-status-dot status="${v['status']}" size="${v['size']}"${v['label'] ? ` label="${v['label']}"` : ''} />`,
  },
  {
    id: 'segmented',
    label: 'Segmented',
    controls: [{ prop: 'size', type: 'select', options: ['md', 'sm'] }],
    defaults: { size: 'md' },
    code: (v) => `<strct-segmented [options]="options" [(ngModel)]="period" size="${v['size']}" />`,
  },
  {
    id: 'rating',
    label: 'Rating',
    controls: [
      { prop: 'max', type: 'number', min: 3, max: 10 },
      { prop: 'readonly', type: 'boolean' },
    ],
    defaults: { max: 5, readonly: false },
    code: (v) =>
      `<strct-rating [max]="${v['max']}"${v['readonly'] ? ' readonly' : ''} [(ngModel)]="stars" />`,
  },
  {
    id: 'number',
    label: 'Number',
    controls: [
      { prop: 'min', type: 'number', min: 0, max: 50 },
      { prop: 'max', type: 'number', min: 10, max: 100 },
      { prop: 'step', type: 'number', min: 1, max: 10 },
      { prop: 'disabled', type: 'boolean' },
      { prop: 'placeholder', type: 'text' },
    ],
    defaults: { min: 0, max: 100, step: 1, disabled: false, placeholder: 'vCPUs' },
    code: (v) =>
      `<strct-number [min]="${v['min']}" [max]="${v['max']}" [step]="${v['step']}"${v['disabled'] ? ' disabled' : ''}${v['placeholder'] ? ` placeholder="${v['placeholder']}"` : ''} [(ngModel)]="count" />`,
  },
  {
    id: 'knob',
    label: 'Knob',
    controls: [
      { prop: 'min', type: 'number', min: 0, max: 50 },
      { prop: 'max', type: 'number', min: 10, max: 100 },
      { prop: 'step', type: 'number', min: 1, max: 10 },
      { prop: 'status', type: 'select', options: SEMANTIC },
    ],
    defaults: { min: 0, max: 100, step: 5, status: 'accent' },
    code: (v) =>
      `<strct-knob [min]="${v['min']}" [max]="${v['max']}" [step]="${v['step']}" status="${v['status']}" [(ngModel)]="level" />`,
  },
  {
    id: 'inline-edit',
    label: 'Inline edit',
    controls: [
      { prop: 'placeholder', type: 'text' },
      { prop: 'disabled', type: 'boolean' },
    ],
    defaults: { placeholder: 'Unnamed VM', disabled: false },
    code: (v) =>
      `<strct-inline-edit [(ngModel)]="vmName" placeholder="${v['placeholder']}"${v['disabled'] ? ' disabled' : ''} />`,
  },
  {
    id: 'combobox',
    label: 'Combobox',
    controls: [
      { prop: 'clearable', type: 'boolean' },
      { prop: 'multiple', type: 'boolean' },
      { prop: 'allowCustomValue', type: 'boolean' },
    ],
    defaults: { clearable: true, multiple: false, allowCustomValue: false },
    code: (v) =>
      `<strct-combobox [options]="cities" [(ngModel)]="city"${v['clearable'] ? ' clearable' : ''}${v['multiple'] ? ' multiple' : ''}${v['allowCustomValue'] ? ' allowCustomValue' : ''} />`,
  },
  {
    id: 'tree-select',
    label: 'Tree select',
    controls: [{ prop: 'clearable', type: 'boolean' }],
    defaults: { clearable: true },
    code: (v) =>
      `<strct-tree-select [nodes]="nodes" [(ngModel)]="hostId"${v['clearable'] ? ' clearable' : ''} />`,
  },
  {
    id: 'datetime-picker',
    label: 'Datetime picker',
    controls: [{ prop: 'minuteStep', type: 'select', options: ['1', '5', '15', '30'] }],
    defaults: { minuteStep: '15' },
    code: (v) => `<strct-datetime-picker [(ngModel)]="stamp" [minuteStep]="${v['minuteStep']}" />`,
  },
  {
    id: 'popover',
    label: 'Popover',
    controls: [{ prop: 'trap', type: 'boolean' }],
    defaults: { trap: false },
    code: (v) =>
      `<strct-popover${v['trap'] ? ' trap' : ''}><button strct-button strctPopoverTrigger>Open</button>…</strct-popover>`,
  },
  {
    id: 'confirm',
    label: 'Confirm',
    controls: [{ prop: 'tone', type: 'select', options: ['default', 'critical'] }],
    defaults: { tone: 'default' },
    code: (v) =>
      `await inject(StrctConfirmService).confirm({ title: 'Delete cluster?', message: '…', tone: '${v['tone']}' })`,
  },
  {
    id: 'notification-center',
    label: 'Notification center',
    controls: [{ prop: 'maxItems', type: 'number', min: 3, max: 20 }],
    defaults: { maxItems: 5 },
    code: (v) =>
      `<strct-notification-center [maxItems]="${v['maxItems']}" />  +  toast.success('Snapshot completed')`,
  },
  {
    id: 'heatmap',
    label: 'Heatmap',
    controls: [{ prop: 'status', type: 'select', options: SEMANTIC }],
    defaults: { status: 'accent' },
    code: (v) =>
      `<strct-heatmap [data]="cells" [rows]="rows" [cols]="cols" [max]="100" status="${v['status']}" />`,
  },
];

/** Interactive props playground — pick a component, tweak its inputs live, copy the code. */
@Component({
  selector: 'app-playground-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    StrctButton,
    StrctBadge,
    StrctTag,
    StrctAvatar,
    StrctProgress,
    StrctSpinner,
    StrctAlert,
    StrctInput,
    StrctToggle,
    StrctRange,
    StrctIcon,
    StrctStatusDot,
    StrctSegmented,
    StrctRating,
    StrctNumber,
    StrctKnob,
    StrctInlineEdit,
    StrctCombobox,
    StrctTreeSelect,
    StrctDatetimePicker,
    StrctPopover,
    StrctPopoverTrigger,
    StrctConfirmOutlet,
    StrctNotificationCenter,
    StrctHeatmap,
  ],
  template: `
    <header class="pg__head">
      <h1 class="pg__title">Playground</h1>
      <p class="pg__sub">Pick a component, adjust its inputs, and copy the generated code.</p>
    </header>

    <div class="pg__picker">
      @for (c of components; track c.id) {
        <button
          strct-button
          size="sm"
          [variant]="c.id === selected() ? 'primary' : 'neutral'"
          [solid]="c.id === selected()"
          (click)="select(c.id)"
        >
          {{ c.label }}
        </button>
      }
    </div>

    <div class="pg__body">
      <div class="pg__stage">
        @switch (selected()) {
          @case ('button') {
            <button
              strct-button
              [variant]="$any(v('variant'))"
              [size]="$any(v('size'))"
              [solid]="b('solid')"
              [block]="b('block')"
            >
              {{ v('label') }}
            </button>
          }
          @case ('badge') {
            <strct-badge [status]="$any(v('status'))" [solid]="b('solid')">{{
              v('label')
            }}</strct-badge>
          }
          @case ('tag') {
            <strct-tag [status]="$any(v('status'))" [removable]="b('removable')">{{
              v('label')
            }}</strct-tag>
          }
          @case ('avatar') {
            <strct-avatar
              [name]="$any(v('name'))"
              [size]="$any(v('size'))"
              [status]="$any(v('status'))"
            />
          }
          @case ('progress') {
            <div style="width: 100%; max-width: 320px;">
              <strct-progress [value]="n('value')" [status]="$any(v('status'))" />
            </div>
          }
          @case ('spinner') {
            <strct-spinner [size]="$any(v('size'))" />
          }
          @case ('alert') {
            <div style="width: 100%; max-width: 420px;">
              <strct-alert [type]="$any(v('type'))" [closable]="b('closable')">{{
                v('message')
              }}</strct-alert>
            </div>
          }
          @case ('status-dot') {
            <strct-status-dot
              [status]="$any(v('status'))"
              [size]="$any(v('size'))"
              [label]="$any(v('label'))"
            />
          }
          @case ('segmented') {
            <strct-segmented [options]="segOptions" [size]="$any(v('size'))" />
          }
          @case ('rating') {
            <strct-rating [max]="n('max')" [readonly]="b('readonly')" />
          }
          @case ('number') {
            <div style="width: 100%; max-width: 220px;">
              <strct-number
                [min]="n('min')"
                [max]="n('max')"
                [step]="n('step')"
                [disabled]="b('disabled')"
                [placeholder]="$any(v('placeholder'))"
              />
            </div>
          }
          @case ('knob') {
            <strct-knob
              [min]="n('min')"
              [max]="n('max')"
              [step]="n('step')"
              [status]="$any(v('status'))"
              label="Level"
            />
          }
          @case ('inline-edit') {
            <strct-inline-edit
              [ngModel]="ieValue()"
              (ngModelChange)="ieValue.set($event)"
              [placeholder]="$any(v('placeholder'))"
              [disabled]="b('disabled')"
            />
          }
          @case ('combobox') {
            <div style="width: 100%; max-width: 280px;">
              <strct-combobox
                [options]="cbxOptions"
                [clearable]="b('clearable')"
                [multiple]="b('multiple')"
                [allowCustomValue]="b('allowCustomValue')"
                placeholder="Pick a city…"
              />
            </div>
          }
          @case ('tree-select') {
            <div style="width: 100%; max-width: 280px;">
              <strct-tree-select
                [nodes]="tsNodes"
                [clearable]="b('clearable')"
                placeholder="Pick a host…"
              />
            </div>
          }
          @case ('datetime-picker') {
            <div style="width: 100%; max-width: 280px;">
              <strct-datetime-picker [minuteStep]="n('minuteStep')" />
            </div>
          }
          @case ('popover') {
            <strct-popover [trap]="b('trap')" ariaLabel="Host details">
              <button strct-button size="sm" strctPopoverTrigger>Host details</button>
              <h4 style="margin: 0 0 4px;">hv-02.fra.corp</h4>
              <p style="margin: 0;">cluster-01 · 128 vCPUs · 768 GiB</p>
            </strct-popover>
          }
          @case ('confirm') {
            <div style="display: flex; align-items: center; gap: 12px;">
              <button
                strct-button
                [variant]="v('tone') === 'critical' ? 'critical' : 'primary'"
                (click)="askConfirm()"
              >
                Delete cluster…
              </button>
              @if (confirmResult() !== null) {
                <span style="font-size: 12px; color: var(--t3);"
                  >confirmed: {{ confirmResult() }}</span
                >
              }
            </div>
          }
          @case ('notification-center') {
            <div style="display: flex; align-items: center; gap: 12px;">
              <strct-notification-center [maxItems]="n('maxItems')" />
              <button strct-button (click)="toast.success('Snapshot completed')">
                Fire a toast
              </button>
            </div>
          }
          @case ('heatmap') {
            <div style="width: 100%; max-width: 480px;">
              <strct-heatmap
                [data]="heatCells"
                [rows]="heatRows"
                [cols]="heatCols"
                [max]="100"
                [status]="$any(v('status'))"
              />
            </div>
          }
        }
      </div>

      <aside class="pg__controls">
        <div class="pg__controls-cap">Controls</div>
        @for (c of current().controls; track c.prop) {
          <div class="ctl">
            <span class="ctl__label">{{ c.prop }}</span>
            @switch (c.type) {
              @case ('select') {
                <select strctInput [ngModel]="v(c.prop)" (ngModelChange)="set(c.prop, $event)">
                  @for (o of c.options ?? []; track o) {
                    <option [value]="o">{{ o }}</option>
                  }
                </select>
              }
              @case ('boolean') {
                <strct-toggle [ngModel]="b(c.prop)" (ngModelChange)="set(c.prop, $event)" />
              }
              @case ('text') {
                <input strctInput [ngModel]="v(c.prop)" (ngModelChange)="set(c.prop, $event)" />
              }
              @case ('number') {
                <strct-range
                  [min]="c.min ?? 0"
                  [max]="c.max ?? 100"
                  [ngModel]="n(c.prop)"
                  (ngModelChange)="set(c.prop, $event)"
                  showValue
                />
              }
            }
          </div>
        }
      </aside>
    </div>

    <div class="pg__code">
      <div class="pg__code-bar">
        <span>Generated code</span>
        <button strct-button size="mini" (click)="copy()">
          <strct-icon [name]="copied() ? 'check' : 'copy'" [size]="13" />
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <pre class="pg__code-pre"><code>{{ code() }}</code></pre>
    </div>

    <strct-confirm-outlet />
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 920px;
      }
      .pg__head {
        margin-bottom: 16px;
      }
      .pg__title {
        margin: 0;
        font-size: 24px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .pg__sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--t3);
      }
      .pg__picker {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      .pg__body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 260px;
        gap: 16px;
        align-items: start;
      }
      @media (max-width: 760px) {
        .pg__body {
          grid-template-columns: 1fr;
        }
      }
      .pg__stage {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 220px;
        padding: 28px;
        border: 1px solid var(--b2);
        border-radius: 11px;
        background: var(--bg-2);
      }
      .pg__controls {
        border: 1px solid var(--b2);
        border-radius: 11px;
        background: var(--bg-1);
        padding: 14px;
      }
      .pg__controls-cap {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--t3);
        margin-bottom: 12px;
      }
      .ctl {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }
      .ctl__label {
        font-size: 12px;
        font-weight: 600;
        color: var(--t2);
        text-transform: capitalize;
      }
      .pg__code {
        margin-top: 16px;
        border: 1px solid var(--b2);
        border-radius: 11px;
        overflow: hidden;
      }
      .pg__code-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: var(--bg-2);
        border-bottom: 1px solid var(--b1);
        font-size: 12px;
        color: var(--t3);
      }
      .pg__code-pre {
        margin: 0;
        padding: 14px;
        overflow-x: auto;
        font-family: var(--mono);
        font-size: 12.5px;
        line-height: 1.6;
        color: var(--t1);
        background: var(--bg-0);
      }
    `,
  ],
})
export class PlaygroundPage {
  protected readonly components = PLAYGROUND;
  protected readonly selected = signal('button');
  protected readonly values = signal<Record<string, unknown>>({ ...PLAYGROUND[0].defaults });
  protected readonly copied = signal(false);

  protected readonly toast = inject(StrctToastService);
  private readonly confirm = inject(StrctConfirmService);
  protected readonly confirmResult = signal<boolean | null>(null);
  protected readonly ieValue = signal('web-frontend-01');

  protected readonly segOptions: StrctSegmentedOption[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];
  protected readonly cbxOptions: StrctOption[] = [
    { value: 'ist', label: 'Istanbul' },
    { value: 'ams', label: 'Amsterdam' },
    { value: 'ber', label: 'Berlin' },
    { value: 'lon', label: 'London' },
    { value: 'par', label: 'Paris' },
  ];
  protected readonly tsNodes: StrctTreeNodeData[] = [
    {
      id: 'dc-east',
      label: 'dc-east',
      children: [
        { id: 'hv-01', label: 'hv-01', icon: 'host' },
        { id: 'hv-02', label: 'hv-02', icon: 'host' },
      ],
    },
    {
      id: 'dc-west',
      label: 'dc-west',
      children: [{ id: 'hv-03', label: 'hv-03', icon: 'host' }],
    },
  ];
  protected readonly heatRows = ['hv-01', 'hv-02', 'hv-03'];
  protected readonly heatCols = ['00', '04', '08', '12', '16', '20'];
  protected readonly heatCells: StrctHeatmapCell[] = this.heatRows.flatMap((row, r) =>
    this.heatCols.map((col, h) => ({
      row,
      col,
      value: Math.round(15 + 60 * Math.abs(Math.sin(h / 2 + r * 1.3))),
    })),
  );

  protected async askConfirm(): Promise<void> {
    this.confirmResult.set(
      await this.confirm.confirm({
        title: 'Delete cluster?',
        message: 'Deleting "Edge Cluster" removes its hosts and VMs. This cannot be undone.',
        confirmLabel: 'Delete',
        tone: this.v('tone') === 'critical' ? 'critical' : 'default',
      }),
    );
  }

  protected readonly current = computed(
    () => PLAYGROUND.find((p) => p.id === this.selected()) ?? PLAYGROUND[0],
  );
  protected readonly code = computed(() => this.current().code(this.values()));

  protected select(id: string): void {
    const cmp = PLAYGROUND.find((p) => p.id === id);
    if (!cmp) return;
    this.selected.set(id);
    this.values.set({ ...cmp.defaults });
  }

  protected set(prop: string, val: unknown): void {
    this.values.update((v) => ({ ...v, [prop]: val }));
  }

  /** Raw value accessor for the template. */
  protected v(prop: string): unknown {
    return this.values()[prop];
  }
  protected b(prop: string): boolean {
    return !!this.values()[prop];
  }
  protected n(prop: string): number {
    return Number(this.values()[prop] ?? 0);
  }

  protected copy(): void {
    void navigator.clipboard?.writeText(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }
}
