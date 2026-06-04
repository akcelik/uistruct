import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StrctBadge, StrctCard, StrctCardBlock, StrctCardHeader, StrctThemeSwitcher } from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

interface TokenGroup {
  title: string;
  tokens: { name: string; varName: string }[];
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
            <span class="hint">Palette dots set the hue family; the pill toggles light / dark.</span>
          </div>
        </strct-card-block>
      </strct-card>
    </app-demo>

    <app-demo
      anchor="tokens"
      heading="Color tokens"
      description="The semantic variables every component reads from. Their values change per active scheme."
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
  `,
  styles: [
    `
    .switch-row { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
    .switch-row strct-theme-switcher {
      padding: 8px 12px; border-radius: 8px; background: var(--hdr);
    }
    .hint { font-size: 12px; color: var(--t2); }

    .tg { width: 100%; }
    .tg + .tg { margin-top: 18px; }
    .tg__title {
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px;
      color: var(--t2); margin-bottom: 10px;
    }
    .tg__grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px;
    }
    .tok {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border: 1px solid var(--b2); border-radius: 7px; background: var(--bg-1);
    }
    .tok__swatch {
      width: 26px; height: 26px; border-radius: 5px; flex-shrink: 0;
      border: 1px solid var(--b2);
    }
    .tok__name { font-size: 12px; color: var(--t1); flex: 1; }
    .tok__var { font-family: var(--mono); font-size: 10px; color: var(--t3); }
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
        { name: 'Success', varName: '--ok' },
        { name: 'Warning', varName: '--wrn' },
        { name: 'Critical', varName: '--crt' },
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
}
