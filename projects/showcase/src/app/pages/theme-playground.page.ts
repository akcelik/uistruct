import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/core';
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
  StrctColorPicker,
  StrctDonut,
  StrctDonutSegment,
  StrctInput,
  StrctProgress,
  StrctRange,
  StrctTag,
  StrctThemeService,
  StrctThemeSwitcher,
  StrctToggle,
} from 'strct';

// ── Palette-builder color math ──────────────────────────────────
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const f =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)) as [number, number, number];
};
const relLum = ([r, g, b]: [number, number, number]): number => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a: string, b: string): number => {
  const l1 = relLum(hexToRgb(a));
  const l2 = relLum(hexToRgb(b));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};
/** Darken toward AA-on-light: scale RGB until contrast vs white surface ≥ 4.5. */
const deriveLightAccent = (hex: string): string => {
  let [r, g, b] = hexToRgb(hex);
  for (let i = 0; i < 24 && contrast(rgbHex(r, g, b), '#f4f6f8') < 4.5; i++) {
    r = Math.round(r * 0.92);
    g = Math.round(g * 0.92);
    b = Math.round(b * 0.92);
  }
  return rgbHex(r, g, b);
};
const rgbHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
/** The six accent tokens the token layer defines, from one hex. */
const accentTokens = (hex: string, mode: 'dark' | 'light'): Record<string, string> => {
  const [r, g, b] = hexToRgb(hex);
  const a = (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`;
  return {
    '--acc': hex,
    '--acc-m': a(mode === 'dark' ? 0.12 : 0.1),
    '--acc-s': a(mode === 'dark' ? 0.06 : 0.05),
    '--acc50': a(0.5),
    '--acc30': a(0.3),
    '--acc18': a(0.18),
  };
};

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
    StrctColorPicker,
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

    <!-- Palette builder: pick an accent, watch the whole page re-skin,
         export the derived token set as CSS. -->
    <strct-card class="tp__builder">
      <strct-card-header icon="palette">
        <span>Palette builder</span>
        @if (builderActive()) {
          <strct-badge status="accent">custom accent live</strct-badge>
        }
      </strct-card-header>
      <strct-card-block>
        <div class="tp__builder-row">
          <div class="tp__builder-field">
            <span class="tp__builder-label">Accent · dark mode</span>
            <strct-color-picker [ngModel]="accDark()" (ngModelChange)="setAccent($event)" />
            <span class="tp__aa" [class.tp__aa--fail]="contrastDark() < 4.5">
              {{ contrastDark().toFixed(2) }}:1 {{ contrastDark() >= 4.5 ? 'AA ✓' : 'AA ✗' }}
            </span>
          </div>
          <div class="tp__builder-field">
            <span class="tp__builder-label">Accent · light mode</span>
            <strct-color-picker [ngModel]="accLight()" (ngModelChange)="setAccentLight($event)" />
            <span class="tp__aa" [class.tp__aa--fail]="contrastLight() < 4.5">
              {{ contrastLight().toFixed(2) }}:1 {{ contrastLight() >= 4.5 ? 'AA ✓' : 'AA ✗' }}
            </span>
          </div>
          <div class="tp__builder-actions">
            <button strct-button size="sm" variant="neutral" (click)="copyCss()">
              {{ copied() ? 'Kopyalandı ✓' : 'CSS kopyala' }}
            </button>
            <button strct-button size="sm" variant="neutral" (click)="downloadCss()">
              .css indir
            </button>
            <button
              strct-button
              size="sm"
              variant="flat"
              [disabled]="!builderActive()"
              (click)="resetAccent()"
            >
              Sıfırla
            </button>
          </div>
        </div>
        <p class="tp__builder-hint">
          The light-mode accent auto-derives (darkened for AA on light surfaces) — override it
          freely. Export produces a
          <code>[data-palette='custom']</code> block with all six accent tokens per mode; contrast
          is measured against each mode's card surface.
        </p>
      </strct-card-block>
    </strct-card>

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
      .tp__builder {
        display: block;
        margin-bottom: 14px;
      }
      .tp__builder-row {
        display: flex;
        align-items: flex-end;
        gap: 22px;
        flex-wrap: wrap;
      }
      .tp__builder-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tp__builder-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--t2);
      }
      .tp__aa {
        font-size: 12px;
        font-family: var(--mono);
        font-variant-numeric: tabular-nums;
        color: var(--success);
      }
      .tp__aa--fail {
        color: var(--critical);
      }
      .tp__builder-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-inline-start: auto;
      }
      .tp__builder-hint {
        margin: 12px 0 0;
        font-size: 12.5px;
        color: var(--t3);
        max-width: 70ch;
      }
      .tp__builder-hint code {
        font-family: var(--mono);
        font-size: 11.5px;
        color: var(--t2);
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
  private readonly doc = inject(DOCUMENT);
  private readonly theme = inject(StrctThemeService);

  // ── Palette builder ─────────────────────────────────────────────
  /** Custom accents; null = the palette's own accent (builder inactive). */
  protected readonly accDark = signal<string | null>(null);
  protected readonly accLight = signal<string | null>(null);
  protected readonly copied = signal(false);
  protected readonly builderActive = computed(() => this.accDark() !== null);

  /** Card surfaces the accent sits on, per mode (arctic values). */
  private readonly surfaceDark = '#161920';
  private readonly surfaceLight = '#ffffff';

  protected readonly contrastDark = computed(() =>
    contrast(this.accDark() ?? '#7b9ec8', this.surfaceDark),
  );
  protected readonly contrastLight = computed(() =>
    contrast(this.accLight() ?? '#4a6b8f', this.surfaceLight),
  );

  protected setAccent(hex: string): void {
    this.accDark.set(hex);
    this.accLight.set(deriveLightAccent(hex));
  }
  protected setAccentLight(hex: string): void {
    if (this.accDark() === null) this.accDark.set(hex);
    this.accLight.set(hex);
  }

  protected resetAccent(): void {
    this.accDark.set(null);
    this.accLight.set(null);
  }

  constructor() {
    // Live preview: write the current mode's accent tokens onto the document
    // root; the whole app re-skins because every component reads the tokens.
    effect(() => {
      const dark = this.accDark();
      const light = this.accLight();
      const mode = this.theme.mode();
      const root = this.doc.documentElement;
      const tokens = accentTokens((mode === 'dark' ? dark : light) ?? '', mode);
      for (const key of Object.keys(tokens)) {
        if (dark === null) root.style.removeProperty(key);
        else root.style.setProperty(key, tokens[key]);
      }
    });
  }

  /** The exportable CSS block for both modes. */
  private buildCss(): string {
    const dark = this.accDark() ?? '#7b9ec8';
    const light = this.accLight() ?? deriveLightAccent(dark);
    const block = (mode: 'dark' | 'light', hex: string) =>
      `[data-palette='custom'][data-theme='${mode}'] {\n` +
      Object.entries(accentTokens(hex, mode))
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n') +
      '\n}';
    return (
      `/* UIStruct custom accent — generated by the theme playground.\n` +
      ` * Load after the theme, then set data-palette="custom" on <html>\n` +
      ` * (e.g. themeService is not required; any palette's other tokens\n` +
      ` * can be copied the same way from styles/_tokens.scss). */\n` +
      block('dark', dark) +
      '\n\n' +
      block('light', light) +
      '\n'
    );
  }

  protected copyCss(): void {
    void navigator.clipboard?.writeText(this.buildCss()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    });
  }

  protected downloadCss(): void {
    const blob = new Blob([this.buildCss()], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = this.doc.createElement('a');
    a.href = url;
    a.download = 'strct-custom-accent.css';
    a.click();
    URL.revokeObjectURL(url);
  }

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
