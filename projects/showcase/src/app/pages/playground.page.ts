import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctAlert,
  StrctAvatar,
  StrctBadge,
  StrctButton,
  StrctIcon,
  StrctInput,
  StrctProgress,
  StrctRange,
  StrctSpinner,
  StrctTag,
  StrctToggle,
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
        font-size: 11px;
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
