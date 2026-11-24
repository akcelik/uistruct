import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  STRCT_ICON_GROUPS,
  StrctBadge,
  StrctButton,
  StrctCellDef,
  StrctDatagrid,
  StrctDatagridColumn,
  StrctIcon,
  StrctProgress,
  StrctRow,
  StrctThemeSwitcher,
  StrctTree,
  StrctTreeNodeData,
} from 'strct';
import { COMPONENT_COUNT, DOCS, PACKAGE_NAME } from '../docs/registry';

const ICON_COUNT = STRCT_ICON_GROUPS.reduce((n, g) => n + g.names.length, 0);

interface Feature {
  icon: string;
  title: string;
  body: string;
}

@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    StrctBadge,
    StrctButton,
    StrctCellDef,
    StrctDatagrid,
    StrctIcon,
    StrctProgress,
    StrctThemeSwitcher,
    StrctTree,
  ],
  template: `
    <section class="hero">
      <div class="hero__say">
        <p class="hero__kicker">Angular · infrastructure UI</p>
        <h1 class="hero__title">104 components for the screens that run a datacenter.</h1>
        <p class="hero__tagline">
          Host and VM trees, grids of two thousand rows, wiring maps, alarm axes. The console on the
          right is not a picture — it is this library, running on this page.
        </p>

        <div class="hero__install">
          <code>npm install {{ pkg }}</code>
          <button
            strct-button
            size="sm"
            iconOnly
            aria-label="Copy install command"
            (click)="copy()"
          >
            <strct-icon [name]="copied() ? 'check' : 'copy'" />
          </button>
        </div>

        <div class="hero__cta">
          <button strct-button variant="primary" solid routerLink="/get-started">
            Get started
          </button>
          <button strct-button routerLink="/components/button">
            Browse {{ count }} components
          </button>
          <a
            strct-button
            variant="flat"
            href="https://github.com/akcelik/uistruct"
            target="_blank"
            rel="noreferrer"
          >
            <strct-icon name="code" /> GitHub
          </a>
        </div>

        <div class="hero__switch">
          <strct-theme-switcher />
          <span class="hero__hint">Change the palette — the console changes with it.</span>
        </div>
      </div>

      <!-- The claim's own proof. Built from the library's tokens, so the
           palette switcher beside it re-skins the thing it is pointing at. -->
      <div class="console" aria-label="A live inventory console built from this library">
        <div class="console__bar">
          <span class="console__pulse" aria-hidden="true"></span>
          <span class="console__what">strct-tree · strct-datagrid · strct-progress</span>
        </div>
        <div class="console__body">
          <div class="console__tree">
            <strct-tree [nodes]="consoleTree" />
          </div>
          <div class="console__grid">
            <strct-datagrid
              singleLine
              compact
              [columns]="consoleCols"
              [rows]="consoleRows"
              rowId="object"
            >
              <ng-template strctCell="health" let-value="value">
                <strct-badge [status]="healthStatus($any(value))">{{ value }}</strct-badge>
              </ng-template>
              <ng-template strctCell="cpu" let-value="value">
                @if (value === null) {
                  <strct-progress [value]="null" />
                } @else {
                  <strct-progress [value]="$any(value)" [status]="cpuStatus($any(value))" />
                }
              </ng-template>
            </strct-datagrid>
          </div>
        </div>
      </div>
    </section>

    <section class="facts" aria-label="What is in the library">
      <div class="fact">
        <strong>{{ count }}</strong
        ><span>components</span>
      </div>
      <div class="fact">
        <strong>{{ iconCount }}</strong
        ><span>icons</span>
      </div>
      <div class="fact"><strong>6</strong><span>schemes — 3 palettes × 2 themes</span></div>
      <div class="fact fact--lead">
        <strong>1452</strong><span>specs and 19 measurement gates, every release</span>
      </div>
    </section>

    <section class="features" aria-labelledby="landing-features">
      <!-- The cards are h3s under this h2 — the outline went h1 → h3 before. -->
      <h2 id="landing-features" class="strct-sr-only">Why UIStruct</h2>
      @for (f of features; track f.title) {
        <div class="feat">
          <span class="feat__icon"><strct-icon [name]="f.icon" [size]="20" /></span>
          <h3 class="feat__title">{{ f.title }}</h3>
          <p class="feat__body">{{ f.body }}</p>
        </div>
      }
    </section>

    <section class="cats">
      <div class="cats__head">
        <h2>{{ count }} components, organised</h2>
        <p>
          {{ cats.length }} categories — from buttons to datagrids, charts and full page patterns.
        </p>
      </div>
      <div class="cats__grid">
        @for (cat of cats; track cat.id) {
          <a class="cat" [routerLink]="['/components', cat.components[0].id]">
            <span class="cat__icon"><strct-icon [name]="cat.icon" [size]="18" /></span>
            <span class="cat__text">
              <span class="cat__label">{{ cat.label }}</span>
              <span class="cat__count">{{ cat.components.length }} components</span>
            </span>
            <strct-icon name="chevronRight" [size]="15" class="cat__go" />
          </a>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      /* The hero states the thesis and proves it beside itself: the claim
         on the left, the library running on the right. */
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.12fr);
        gap: 40px;
        align-items: center;
        padding: 44px 20px 36px;
        max-width: 1280px;
        margin: 0 auto;
      }
      .hero__kicker {
        margin: 0;
        font-family: var(--mono);
        font-size: var(--text-xs);
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--acc);
      }
      .hero__title {
        margin: 14px 0 0;
        font-size: clamp(30px, 3.6vw, 46px);
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: -0.025em;
        text-wrap: balance;
        color: var(--t1);
      }
      .hero__tagline {
        margin: 16px 0 0;
        max-width: 48ch;
        font-size: var(--text-md);
        line-height: 1.6;
        color: var(--t2);
      }
      /* The console. Every colour comes from the same tokens the components
         use, so the switcher beside it re-skins it along with the page —
         which is the sentence the hero is making. */
      .console {
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        background: var(--bg-1);
        overflow: hidden;
        box-shadow: var(--shh);
        min-width: 0;
      }
      .console__bar {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: 7px var(--space-3);
        border-bottom: 1px solid var(--b2);
        background: var(--bg-2);
        font-family: var(--mono);
        font-size: var(--text-xs);
        color: var(--t3);
      }
      .console__pulse {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--success);
        flex-shrink: 0;
      }
      .console__body {
        display: grid;
        grid-template-columns: 214px minmax(0, 1fr);
      }
      .console__tree {
        border-inline-end: 1px solid var(--b2);
        padding: var(--space-2);
        overflow: hidden;
      }
      .console__grid {
        min-width: 0;
        padding: var(--space-2);
      }
      .console__grid strct-datagrid {
        width: 100%;
      }
      /* The four facts, with the one that is actually the difference given
         the room. */
      .facts {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1px;
        background: var(--b2);
        border-block: 1px solid var(--b2);
        max-width: 1280px;
        margin: 8px auto 0;
      }
      .fact {
        background: var(--bg-0);
        padding: 16px 20px;
        min-width: 0;
      }
      .fact strong {
        display: block;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--t1);
        font-variant-numeric: tabular-nums;
      }
      .fact span {
        font-size: var(--text-sm);
        color: var(--t3);
      }
      .fact--lead strong {
        color: var(--acc);
      }
      @media (max-width: 1000px) {
        .hero {
          grid-template-columns: 1fr;
          gap: 28px;
        }
        .console__body {
          grid-template-columns: 1fr;
        }
        .console__tree {
          border-inline-end: 0;
          border-bottom: 1px solid var(--b2);
        }
        .facts {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 560px) {
        .facts {
          grid-template-columns: 1fr;
        }
      }
      .hero__install {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 26px;
        padding: 6px 6px 6px 14px;
        border: 1px solid var(--b2);
        border-radius: 4px;
        background: var(--bg-1);
      }
      .hero__install code {
        font-family: var(--mono);
        font-size: 13px;
        color: var(--t1);
      }
      .hero__cta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 22px;
      }
      .hero__switch {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: 28px;
        flex-wrap: wrap;
      }
      .hero__switch strct-theme-switcher {
        padding: 8px 12px;
        border-radius: 4px;
        background: var(--hdr);
      }
      .hero__hint {
        font-size: 12.5px;
        color: var(--t3);
      }

      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
        margin: 30px auto 0;
        max-width: 980px;
      }
      .feat {
        padding: 18px;
        border: 1px solid var(--b2);
        border-radius: 5px;
        background: var(--bg-1);
      }
      .feat__icon {
        display: inline-flex;
        padding: 9px;
        border-radius: 4px;
        color: var(--acc);
        background: var(--acc-s);
        margin-bottom: 10px;
      }
      .feat__title {
        margin: 0 0 5px;
        font-size: 14px;
        font-weight: 600;
        color: var(--t1);
      }
      .feat__body {
        margin: 0;
        font-size: 13px;
        line-height: 1.55;
        color: var(--t2);
      }

      .cats {
        max-width: 980px;
        margin: 44px auto 20px;
      }
      .cats__head {
        text-align: center;
        margin-bottom: 18px;
      }
      .cats__head h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 650;
        color: var(--t1);
      }
      .cats__head p {
        margin: 6px 0 0;
        font-size: 14px;
        color: var(--t2);
      }
      .cats__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
      }
      .cat {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border: 1px solid var(--b2);
        border-radius: 5px;
        background: var(--bg-1);
        text-decoration: none;
        transition:
          border-color 0.14s ease,
          transform 0.14s ease;
      }
      .cat:hover {
        border-color: var(--acc50);
        transform: translateY(-1px);
      }
      .cat__icon {
        display: inline-flex;
        padding: 8px;
        border-radius: 4px;
        color: var(--acc);
        background: var(--acc-s);
      }
      .cat__text {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .cat__label {
        font-size: 14px;
        font-weight: 600;
        color: var(--t1);
      }
      .cat__count {
        font-size: 12px;
        color: var(--t3);
      }
      .cat__go {
        color: var(--t3);
      }
      .cat:hover .cat__go {
        color: var(--acc);
      }
    `,
  ],
})
export class LandingPage {
  protected readonly pkg = PACKAGE_NAME;

  /** The console in the hero: a small inventory, drawn with the state axes. */
  protected readonly consoleTree: StrctTreeNodeData[] = [
    {
      id: 'dc',
      label: 'dc-ankara',
      icon: 'datacenter',
      expanded: true,
      children: [
        {
          id: 'c1',
          label: 'cluster-01',
          icon: 'cluster',
          expanded: true,
          children: [
            { id: 'h2', label: 'HV-NODE-02', icon: 'host', mode: 'maintenance', health: 'warning' },
            { id: 'h3', label: 'HV-NODE-03', icon: 'host' },
            { id: 'h4', label: 'HV-NODE-04', icon: 'host', health: 'unknown' },
            { id: 'v7', label: 'vm-07', icon: 'vm', power: 'off', health: 'critical' },
            { id: 'v11', label: 'vm-11', icon: 'vmSnapshot' },
          ],
        },
        {
          id: 'c2',
          label: 'cluster-02',
          icon: 'cluster',
          rollup: { critical: 2 },
          children: [{ id: 'h9', label: 'HV-NODE-09', icon: 'host' }],
        },
      ],
    },
  ];

  protected readonly consoleCols: StrctDatagridColumn[] = [
    { key: 'object', label: 'Object' },
    { key: 'health', label: 'Health' },
    { key: 'power', label: 'Power' },
    { key: 'cpu', label: 'CPU', width: '110px' },
  ];

  protected readonly consoleRows: StrctRow[] = [
    { object: 'HV-NODE-02', health: 'warning', power: 'on', cpu: 62 },
    { object: 'HV-NODE-03', health: 'ok', power: 'on', cpu: 31 },
    { object: 'HV-NODE-04', health: 'unknown', power: '\u2014', cpu: null },
    { object: 'vm-07', health: 'critical', power: 'off', cpu: 94 },
    { object: 'vm-11', health: 'ok', power: 'on', cpu: 24 },
  ];

  protected healthStatus(v: string): 'success' | 'warning' | 'critical' | 'neutral' {
    return v === 'ok'
      ? 'success'
      : v === 'warning'
        ? 'warning'
        : v === 'critical'
          ? 'critical'
          : 'neutral';
  }

  protected cpuStatus(v: number): 'accent' | 'warning' | 'critical' {
    return v >= 90 ? 'critical' : v >= 70 ? 'warning' : 'accent';
  }

  protected readonly count = COMPONENT_COUNT;
  protected readonly cats = DOCS;
  protected readonly iconCount = ICON_COUNT;
  protected readonly copied = signal(false);

  protected readonly features: Feature[] = [
    {
      icon: 'palette',
      title: 'One token system',
      body: 'Every color comes from CSS custom properties — three palettes (Arctic, Ember, Sage) × light & dark, no hard-coded hex anywhere.',
    },
    {
      icon: 'layers',
      title: 'Standalone & signal-based',
      body: 'Standalone components with signal inputs and OnPush change detection throughout. Drop in only what you use.',
    },
    {
      icon: 'form',
      title: 'Form-ready',
      body: 'Every control implements ControlValueAccessor, so it works with ngModel and reactive forms out of the box.',
    },
    {
      icon: 'universalAccess',
      title: 'Accessible, measured',
      body: 'WCAG AA contrast in all six schemes, keyboard-complete trees/charts/grids, shape-coded status for color-vision safety, reduced-motion everywhere.',
    },
    {
      icon: 'chart',
      title: 'Datacenter-flavoured',
      body: 'A stroke icon set with object-state badges, plus datagrids, timelines and charts built for infrastructure dashboards.',
    },
    {
      icon: 'code',
      title: 'No framework lock-in',
      body: 'No runtime CSS framework dependency. Just Angular, the token stylesheet, and the components you import.',
    },
  ];

  protected copy(): void {
    void navigator.clipboard?.writeText(`npm install ${this.pkg}`);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }
}
