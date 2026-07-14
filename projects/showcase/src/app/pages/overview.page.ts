import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StrctBadge, StrctCard, StrctCardBlock, StrctCardHeader, StrctThemeSwitcher } from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

interface TokenGroup {
  title: string;
  tokens: { name: string; varName: string }[];
}
interface TypeStep {
  varName: string;
  px: string;
  use: string;
}
interface ContrastRow {
  token: string;
  usage: string;
  dark: string;
  light: string;
}

@Component({
  selector: 'app-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    StrctThemeSwitcher,
    StrctCard,
    StrctCardHeader,
    StrctCardBlock,
    StrctBadge,
  ],
  template: `
    <app-page-header
      title="Theming"
      subtitle="One token system, three palettes — Arctic, Ember, Sage — each in light and dark. Every component is driven entirely by CSS custom properties, so switching the palette or theme re-skins the whole library instantly."
    />

    <app-demo
      anchor="palettes"
      heading="Palettes & themes"
      description="Six surface schemes from three palettes × two modes. Try the switcher — it persists your choice."
    >
      <strct-card>
        <strct-card-header>
          <span>Live switcher</span>
          <strct-badge status="accent">6 schemes</strct-badge>
        </strct-card-header>
        <strct-card-block>
          <div class="switch-row">
            <strct-theme-switcher />
            <span class="hint"
              >Palette dots set the hue family; the pill toggles light / dark.</span
            >
          </div>
        </strct-card-block>
      </strct-card>
    </app-demo>

    <app-demo
      anchor="tokens"
      heading="Color tokens"
      description="The semantic variables every component reads from. Their values change per active scheme — flip the theme above and watch the swatches follow."
    >
      @for (group of groups; track group.title) {
        <div class="tg">
          <div class="tg__title">{{ group.title }}</div>
          <div class="tg__grid">
            @for (t of group.tokens; track t.varName) {
              <div class="tok">
                <span class="tok__swatch" [style.background]="'var(' + t.varName + ')'"></span>
                <span class="tok__name">{{ t.name }}</span>
                <code class="tok__var">{{ t.varName }}</code>
              </div>
            }
          </div>
        </div>
      }
    </app-demo>

    <app-demo
      anchor="typography"
      heading="Typography scale"
      description="A compact, console-first scale: a 12px floor for UI text, tokenized display sizes for big numerals (gauges, tiles), and JetBrains Mono with tabular numerals for data."
    >
      <div class="type-table">
        @for (s of typeScale; track s.varName) {
          <div class="type-row">
            <code class="type-var">{{ s.varName }}</code>
            <span class="type-px">{{ s.px }}</span>
            <span class="type-sample" [style.fontSize]="'var(' + s.varName + ')'"
              >Deploy 24 hosts across us-east</span
            >
            <span class="type-use">{{ s.use }}</span>
          </div>
        }
        <div class="type-row">
          <code class="type-var">--mono</code>
          <span class="type-px">—</span>
          <span class="type-sample" style="font-family: var(--mono); font-size: 13px"
            >172.16.75.100/24 · 0140 vs O14O</span
          >
          <span class="type-use">Data, IDs, code — tabular numerals</span>
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="space"
      heading="Spacing & radius"
      description="A 4px-based spacing scale and a four-step radius scale keep rhythm consistent across every surface."
    >
      <div class="scale-cols">
        <div class="scale-col">
          <div class="tg__title">Spacing — 4px base</div>
          @for (s of spaces; track s.i) {
            <div class="space-row">
              <code class="type-var">--space-{{ s.i }}</code>
              <span class="space-bar" [style.width.px]="s.px"></span>
              <span class="type-px">{{ s.px }}px</span>
            </div>
          }
        </div>
        <div class="scale-col">
          <div class="tg__title">Radius</div>
          <div class="radius-row">
            @for (r of radii; track r.name) {
              <div class="radius-demo">
                <span
                  class="radius-box"
                  [style.borderRadius]="'var(--radius-' + r.name + ')'"
                ></span>
                <code class="type-var">--radius-{{ r.name }}</code>
                <span class="type-px">{{ r.px }}px</span>
              </div>
            }
          </div>
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="contrast"
      heading="Contrast & accessibility"
      description="Every text token and every semantic text tone meets WCAG AA (≥ 4.5:1) in all six schemes — measured, not assumed. Text on solid status fills uses --inv, so filled chips stay readable in both modes."
    >
      <div class="aa-table">
        <div class="aa-head">
          <span>Token</span><span>Used for</span><span>Dark</span><span>Light</span>
        </div>
        @for (r of contrast; track r.token) {
          <div class="aa-row">
            <code class="type-var">{{ r.token }}</code>
            <span class="aa-use">{{ r.usage }}</span>
            <span class="aa-val">{{ r.dark }} <strct-badge status="success">AA</strct-badge></span>
            <span class="aa-val">{{ r.light }} <strct-badge status="success">AA</strct-badge></span>
          </div>
        }
      </div>

      <ul class="a11y-list">
        <li>
          <strong>OS-aware theming</strong> — follows <code>prefers-color-scheme</code> until you
          choose; your choice persists.
        </li>
        <li>
          <strong>prefers-contrast: more</strong> — borders and secondary text strengthen when the
          OS asks.
        </li>
        <li>
          <strong>prefers-reduced-motion</strong> — every animation (charts, modal, drawer, toast,
          spinner) collapses to instant state changes; charts track the setting live.
        </li>
        <li>
          <strong>Color-blind safe</strong> — icon state badges are shape-coded (✓ × ! i –) and
          chart series can add a dash channel, so state never relies on hue alone.
        </li>
        <li>
          <strong>Keyboard-complete</strong> — tree (roving tabindex + arrows), charts (focusable
          crosshair with live announcements), datagrid sort headers, donut legends and every form
          control.
        </li>
      </ul>
    </app-demo>
  `,
  styles: [
    `
      .switch-row {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
      }
      .switch-row strct-theme-switcher {
        padding: 8px 12px;
        border-radius: 8px;
        background: var(--hdr);
      }
      .hint {
        font-size: 12px;
        color: var(--t2);
      }

      .tg {
        width: 100%;
      }
      .tg + .tg {
        margin-top: 18px;
      }
      .tg__title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--t2);
        margin-bottom: 10px;
      }
      .tg__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 10px;
      }
      .tok {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 8px 10px;
        border: 1px solid var(--b2);
        border-radius: 7px;
        background: var(--bg-1);
      }
      .tok__swatch {
        width: 26px;
        height: 26px;
        border-radius: 5px;
        flex-shrink: 0;
        border: 1px solid var(--b2);
      }
      .tok__name {
        font-size: 12px;
        color: var(--t1);
        flex: 1;
      }
      .tok__var {
        font-family: var(--mono);
        font-size: 12px;
        color: var(--t3);
      }

      /* Typography table */
      .type-table {
        width: 100%;
        border: 1px solid var(--b2);
        border-radius: 10px;
        background: var(--bg-1);
        overflow: hidden;
      }
      .type-row {
        display: grid;
        grid-template-columns: 110px 48px 1fr 230px;
        align-items: baseline;
        gap: 14px;
        padding: 10px 14px;
      }
      .type-row + .type-row {
        border-top: 1px solid var(--b1);
      }
      .type-var {
        font-family: var(--mono);
        font-size: 12px;
        color: var(--acc);
      }
      .type-px {
        font-family: var(--mono);
        font-size: 12px;
        color: var(--t3);
      }
      .type-sample {
        color: var(--t1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .type-use {
        font-size: 12px;
        color: var(--t3);
        text-align: end;
      }
      @media (max-width: 760px) {
        .type-row {
          grid-template-columns: 100px 1fr;
        }
        .type-px,
        .type-use {
          display: none;
        }
      }

      /* Spacing & radius */
      .scale-cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 26px;
        width: 100%;
      }
      .space-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 5px 0;
      }
      .space-bar {
        height: 12px;
        border-radius: 3px;
        background: var(--acc);
        opacity: 0.75;
      }
      .radius-row {
        display: flex;
        gap: 18px;
        flex-wrap: wrap;
      }
      .radius-demo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .radius-box {
        width: 52px;
        height: 52px;
        background: var(--acc-m);
        border: 1.5px solid var(--acc);
      }

      /* Contrast table */
      .aa-table {
        width: 100%;
        border: 1px solid var(--b2);
        border-radius: 10px;
        background: var(--bg-1);
        overflow: hidden;
        font-size: 12.5px;
      }
      .aa-head,
      .aa-row {
        display: grid;
        grid-template-columns: 110px 1fr 130px 130px;
        gap: 12px;
        align-items: center;
        padding: 9px 14px;
      }
      .aa-head {
        font-weight: 600;
        color: var(--t2);
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.4px;
        border-bottom: 1px solid var(--b2);
        background: var(--bg-2);
      }
      .aa-row + .aa-row {
        border-top: 1px solid var(--b1);
      }
      .aa-use {
        color: var(--t2);
      }
      .aa-val {
        font-family: var(--mono);
        color: var(--t1);
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }
      @media (max-width: 700px) {
        .aa-head,
        .aa-row {
          grid-template-columns: 100px 1fr 100px;
        }
        .aa-head span:nth-child(2),
        .aa-row .aa-use {
          display: none;
        }
      }

      .a11y-list {
        margin: 18px 0 0;
        padding: 0 0 0 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;
        line-height: 1.55;
        color: var(--t2);
        max-width: 74ch;
      }
      .a11y-list strong {
        color: var(--t1);
      }
      .a11y-list code {
        font-family: var(--mono);
        font-size: 12px;
        color: var(--acc);
      }
    `,
  ],
})
export class OverviewPage {
  protected readonly groups: TokenGroup[] = [
    {
      title: 'Surfaces',
      tokens: [
        { name: 'Base', varName: '--bg-0' },
        { name: 'Panel', varName: '--bg-1' },
        { name: 'Sunken', varName: '--bg-2' },
        { name: 'Raised', varName: '--bg-3' },
        { name: 'Header', varName: '--hdr' },
      ],
    },
    {
      title: 'Accent & semantic',
      tokens: [
        { name: 'Accent', varName: '--acc' },
        { name: 'Success', varName: '--success' },
        { name: 'Warning', varName: '--warning' },
        { name: 'Critical', varName: '--critical' },
      ],
    },
    {
      title: 'Text & on-fill',
      tokens: [
        { name: 'Primary', varName: '--t1' },
        { name: 'Secondary', varName: '--t2' },
        { name: 'Tertiary', varName: '--t3' },
        { name: 'On solid fill', varName: '--inv' },
      ],
    },
    {
      title: 'Borders',
      tokens: [
        { name: 'Hairline', varName: '--b1' },
        { name: 'Subtle', varName: '--b2' },
        { name: 'Strong', varName: '--b3' },
      ],
    },
  ];

  protected readonly typeScale: TypeStep[] = [
    { varName: '--text-sm', px: '12px', use: 'Captions, labels, axis text (the floor)' },
    { varName: '--text-md', px: '13px', use: 'Body & control text' },
    { varName: '--text-lg', px: '14px', use: 'Emphasized body, titles' },
    { varName: '--text-xl', px: '16px', use: 'Section headings, hero banners' },
    { varName: '--text-2xl', px: '22px', use: 'Display — gauge & donut centers' },
    { varName: '--text-3xl', px: '26px', use: 'Display — metric tile values' },
  ];

  protected readonly spaces = [1, 2, 3, 4, 5, 6].map((i) => ({
    i,
    px: [4, 8, 12, 16, 24, 32][i - 1],
  }));
  protected readonly radii = [
    { name: 'sm', px: 4 },
    { name: 'md', px: 6 },
    { name: 'lg', px: 8 },
    { name: 'xl', px: 12 },
  ];

  /** Contrast ratios computed from the token values (WCAG relative luminance). */
  protected readonly contrast: ContrastRow[] = [
    { token: '--t1', usage: 'Primary text on panels', dark: '14.4:1', light: '13.5:1' },
    { token: '--t2', usage: 'Secondary text', dark: '5.5:1', light: '6.1:1' },
    { token: '--t3', usage: 'Tertiary / captions', dark: '4.8:1', light: '4.8:1' },
    { token: '--acc', usage: 'Links, active nav, accent text', dark: '6.3:1', light: '5.4:1' },
    { token: '--success', usage: 'Success text & badges', dark: '6.5:1', light: '4.9:1' },
    { token: '--warning', usage: 'Warning text & badges', dark: '7.9:1', light: '4.9:1' },
    { token: '--critical', usage: 'Critical text & badges', dark: '5.0:1', light: '4.6:1' },
  ];
}
