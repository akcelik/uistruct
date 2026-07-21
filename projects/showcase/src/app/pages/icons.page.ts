import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  STRCT_ICON_GROUPS,
  StrctButton,
  StrctButtonGroup,
  StrctIcon,
  StrctIconBadge,
  registerStrctIcon,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

interface StateExample {
  name: string;
  object: string;
  badge: StrctIconBadge;
  label: string;
}

@Component({
  selector: 'app-icons-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, DemoBlock, StrctIcon, StrctButton, StrctButtonGroup],
  template: `
    <app-page-header
      title="Icons"
      subtitle="A datacenter-flavoured stroke icon set. Object state (running, stopped, maintenance) is layered on with the icon's badge input rather than a separate glyph per state."
    />

    <app-demo
      anchor="gallery"
      heading="Icon set"
      [description]="
        totalIcons +
        ' glyphs, grouped. Type to filter; click any tile to copy its name. Names are exported' +
        ' as the StrctIconName union (plus the STRCT_ICON_NAMES array), so a mistyped name is a' +
        ' compile error — and strct-icon warns once in dev mode if an unknown name slips through.'
      "
    >
      <input
        class="ig-search"
        type="search"
        placeholder="Filter icons… (e.g. clock, gpu, chevron)"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
      @for (group of filteredGroups(); track group.label) {
        <div class="ig-group">
          <div class="ig-group__title">{{ group.label }} · {{ group.names.length }}</div>
          <div class="ig-grid">
            @for (name of group.names; track name) {
              <button
                type="button"
                class="ig-tile"
                (click)="copyName(name)"
                [title]="'Copy “' + name + '”'"
              >
                <strct-icon [name]="name" [size]="22" [strokeWidth]="1.4" />
                <span class="ig-name">{{ copied() === name ? 'copied!' : name }}</span>
              </button>
            }
          </div>
        </div>
      } @empty {
        <p class="ig-empty">No icon matches “{{ query() }}”.</p>
      }
    </app-demo>

    <app-demo
      anchor="sizes"
      heading="Sizes — the “16 Native” policy"
      description="Glyphs are drawn on a 16px grid (the Octicons / Carbon / Fluent convention) and must render at native 16px or larger — fractional downscaling blurs hairlines. Simple single-stroke glyphs (chevrons, close, check) may go smaller. Detail budget: keep gaps between parallel details ≥ 1.5px on the grid."
    >
      <div class="ig-sizes">
        @for (sz of [16, 20, 24, 32]; track sz) {
          <div class="ig-size">
            <strct-icon name="host" [size]="sz" [strokeWidth]="1.4" badge="running" />
            <span class="ig-name">{{ sz }}px</span>
          </div>
        }
        <div class="ig-size ig-size--sep"></div>
        @for (sz of [12, 14]; track sz) {
          <div class="ig-size">
            <strct-icon name="chevronRight" [size]="sz" [strokeWidth]="1.5" />
            <span class="ig-name">{{ sz }}px · simple</span>
          </div>
        }
      </div>
    </app-demo>

    <app-demo
      anchor="states"
      heading="Object states"
      description="The same object glyph carries any state via a status badge. Two families: lifecycle speaks vCenter's media language (▶ running · ⏸ paused · ■ off), health is silhouette-coded (circle ✓ · triangle ! · diamond × · wrench) — both read without color."
      code='<strct-icon name="vm" badge="running" />  <!-- running VM -->'
    >
      <div class="ig-states">
        @for (s of states; track s.label) {
          <div class="ig-state">
            <strct-icon [name]="s.object" [size]="28" [strokeWidth]="1.3" [badge]="s.badge" />
            <span class="ig-state__label">{{ s.label }}</span>
          </div>
        }
      </div>
    </app-demo>

    <app-demo
      anchor="interactive-states"
      heading="Interactive object states"
      description="Pick an object and click a state to see how the badge overlays the icon."
      code='<strct-icon [name]="activeObjectData().icon" [badge]="activeState()" />'
    >
      <div class="ig-interactive">
        <!-- Object selector tabs -->
        <div class="ig-interactive__tabs">
          @for (obj of interactiveObjects; track obj.name) {
            <button
              class="ig-interactive__tab"
              [class.is-active]="activeObject() === obj.name"
              (click)="activeObject.set(obj.name)"
            >
              <strct-icon [name]="obj.icon" [size]="18" [strokeWidth]="1.4" />
              <span>{{ obj.label }}</span>
            </button>
          }
        </div>

        <!-- Large icon stage -->
        <div class="ig-interactive__stage">
          <strct-icon
            [name]="activeObjectData().icon"
            [size]="56"
            [strokeWidth]="1.2"
            [badge]="activeState()"
          />
          <span class="ig-interactive__state"
            >{{ activeObjectData().label }} · {{ activeStateLabel() }}</span
          >
        </div>

        <!-- State selector -->
        <div class="ig-interactive__controls">
          <strct-button-group>
            @for (opt of stateOptions; track opt.badge) {
              <button
                strct-button
                size="sm"
                [variant]="activeState() === opt.badge ? 'primary' : 'neutral'"
                (click)="activeState.set(opt.badge)"
              >
                {{ opt.label }}
              </button>
            }
          </strct-button-group>
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="vendors"
      heading="Vendors"
      description="Vendor name labels used as fallback marks when licensed logos are not available."
    >
      <div class="ig-vendors">
        @for (name of vendorNames; track name) {
          <div class="ig-vendor">
            <span class="ig-vendor__text">{{ vendorLabel(name) }}</span>
            <span class="ig-name">{{ name }}</span>
          </div>
        }
      </div>
    </app-demo>

    <app-demo
      anchor="raw"
      heading="Custom / brand icons (raw SVG)"
      description="Register your own full-SVG icons that keep their viewBox and colors — drop in licensed brand logos. Below is a generic example; size and status badges still apply."
      code="registerStrctIcon('myLogo', '<svg viewBox=&quot;0 0 24 24&quot;>…</svg>', { raw: true });"
    >
      <strct-icon name="demoRaw" [size]="22" />
      <strct-icon name="demoRaw" [size]="34" />
      <strct-icon name="demoRaw" [size]="44" badge="success" />
    </app-demo>
  `,
  styles: [
    `
      .ig-search {
        width: 100%;
        max-width: 380px;
        margin-bottom: 16px;
        padding: 8px 12px;
        font-family: var(--font);
        font-size: 13px;
        color: var(--t1);
        background: var(--bg-2);
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
      }
      .ig-search:focus-visible {
        outline: none;
        border-color: var(--acc);
        box-shadow: 0 0 0 3px var(--acc18);
      }
      .ig-empty {
        font-size: 13px;
        color: var(--t3);
      }
      .ig-sizes {
        display: flex;
        align-items: flex-end;
        gap: 22px;
        flex-wrap: wrap;
      }
      .ig-size {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: var(--t1);
      }
      .ig-size--sep {
        width: 1px;
        align-self: stretch;
        background: var(--b2);
      }
      .ig-group {
        width: 100%;
      }
      .ig-group + .ig-group {
        margin-top: 20px;
      }
      .ig-group__title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--t2);
        margin-bottom: 10px;
      }
      .ig-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
        gap: 2px;
      }
      /* Frameless tiles: just the glyph + name, with a soft highlight on hover. */
      .ig-tile {
        border: 0;
        font: inherit;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 16px 6px 12px;
        border-radius: 10px;
        background: transparent;
        transition: background 0.14s ease;
      }
      .ig-tile:hover {
        background: var(--bg-2);
      }
      .ig-tile strct-icon {
        color: var(--t2);
        transition: color 0.14s ease;
      }
      .ig-tile:hover strct-icon {
        color: var(--t1);
      }
      .ig-name {
        font-family: var(--mono);
        font-size: 10px;
        color: var(--t3);
        text-align: center;
        word-break: break-word;
      }

      .ig-states {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
      }
      .ig-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 96px;
        padding: 16px 8px;
        border: 1px solid var(--b2);
        border-radius: 8px;
        background: var(--bg-1);
      }
      .ig-state strct-icon {
        color: var(--t1);
      }
      .ig-state__label {
        font-size: 12px;
        color: var(--t2);
        text-align: center;
      }

      .ig-interactive {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 22px;
        border: 1px solid var(--b2);
        border-radius: 12px;
        background: var(--bg-1);
      }
      .ig-interactive__tabs {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
      }
      .ig-interactive__tab {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border: 1px solid var(--b2);
        border-radius: 8px;
        background: transparent;
        color: var(--t2);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition:
          background 0.15s ease,
          border-color 0.15s ease,
          color 0.15s ease;
      }
      .ig-interactive__tab:hover {
        background: var(--bg-2);
      }
      .ig-interactive__tab.is-active {
        background: var(--acc);
        border-color: var(--acc);
        color: var(--bg-1);
      }
      .ig-interactive__stage {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 28px 36px;
        border: 1px dashed var(--b2);
        border-radius: 12px;
      }
      .ig-interactive__stage strct-icon {
        color: var(--t1);
      }
      .ig-interactive__state {
        font-size: 12px;
        font-weight: 600;
        color: var(--t2);
        text-align: center;
      }
      .ig-interactive__controls {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
      }

      .ig-vendors {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
      }
      .ig-vendor {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 9px;
        width: 96px;
        padding: 18px 8px;
        border: 1px solid var(--b2);
        border-radius: 8px;
        background: var(--bg-1);
      }
      .ig-vendor__text {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.4px;
        color: var(--acc);
        text-transform: uppercase;
      }
    `,
  ],
})
export class IconsPage {
  constructor() {
    // A generic, original example of a registered full-SVG (raw) icon — this is
    // the same mechanism you use to register licensed brand logos.
    registerStrctIcon(
      'demoRaw',
      `<svg viewBox="0 0 24 24">
         <rect x="3" y="3" width="8" height="8" rx="2" fill="#7b9ec8"/>
         <rect x="13" y="3" width="8" height="8" rx="2" fill="#7da87e"/>
         <rect x="3" y="13" width="8" height="8" rx="2" fill="#bfae6a"/>
         <rect x="13" y="13" width="8" height="8" rx="2" fill="#b87872"/>
       </svg>`,
      { raw: true },
    );
  }

  protected readonly activeObject = signal<'cluster' | 'host' | 'vm'>('cluster');
  protected readonly activeState = signal<StrctIconBadge>('success');

  protected readonly interactiveObjects = [
    { name: 'cluster' as const, label: 'Cluster', icon: 'cluster' },
    { name: 'host' as const, label: 'Host', icon: 'host' },
    { name: 'vm' as const, label: 'VM', icon: 'vm' },
  ];

  protected readonly activeObjectData = computed(
    () => this.interactiveObjects.find((o) => o.name === this.activeObject())!,
  );

  protected readonly activeStateLabel = computed(
    () => this.stateOptions.find((s) => s.badge === this.activeState())?.label ?? '',
  );

  protected readonly stateOptions: { badge: StrctIconBadge; label: string }[] = [
    { badge: 'running', label: 'Running' },
    { badge: 'paused', label: 'Paused' },
    { badge: 'off', label: 'Stopped' },
    { badge: 'success', label: 'Healthy' },
    { badge: 'warning', label: 'Degraded' },
    { badge: 'critical', label: 'Critical' },
    { badge: 'maintenance', label: 'Maint' },
  ];

  protected readonly groups = STRCT_ICON_GROUPS;
  protected readonly totalIcons = STRCT_ICON_GROUPS.reduce((n, g) => n + g.names.length, 0);
  protected readonly query = signal('');
  protected readonly copied = signal('');
  protected readonly filteredGroups = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.groups;
    return this.groups
      .map((g) => ({ ...g, names: g.names.filter((n) => n.toLowerCase().includes(q)) }))
      .filter((g) => g.names.length > 0);
  });

  protected copyName(name: string): void {
    void navigator.clipboard?.writeText(name);
    this.copied.set(name);
    setTimeout(() => this.copied.set(''), 1200);
  }
  protected readonly vendorNames =
    STRCT_ICON_GROUPS.find((g) => g.label.startsWith('Vendor'))?.names ?? [];

  protected readonly states: StateExample[] = [
    { name: 'host-run', object: 'host', badge: 'running', label: 'Host · running' },
    { name: 'host-off', object: 'host', badge: 'off', label: 'Host · powered off' },
    { name: 'host-maint', object: 'host', badge: 'maintenance', label: 'Host · maintenance' },
    { name: 'host-critical', object: 'host', badge: 'critical', label: 'Host · critical' },
    { name: 'vm-run', object: 'vm', badge: 'running', label: 'VM · running' },
    { name: 'vm-paused', object: 'vm', badge: 'paused', label: 'VM · paused' },
    { name: 'vm-off', object: 'vm', badge: 'off', label: 'VM · stopped' },
    { name: 'vm-maint', object: 'vm', badge: 'warning', label: 'VM · maintenance' },
    { name: 'vm-critical', object: 'vm', badge: 'critical', label: 'VM · critical' },
    { name: 'cluster-ok', object: 'cluster', badge: 'success', label: 'Cluster · healthy' },
    { name: 'cluster-degraded', object: 'cluster', badge: 'warning', label: 'Cluster · degraded' },
    {
      name: 'cluster-maint',
      object: 'cluster',
      badge: 'maintenance',
      label: 'Cluster · maintenance',
    },
    { name: 'cluster-critical', object: 'cluster', badge: 'critical', label: 'Cluster · critical' },
    { name: 'cluster-off', object: 'cluster', badge: 'off', label: 'Cluster · stopped' },
    { name: 'storage-warn', object: 'storage', badge: 'warning', label: 'Volume · low' },
  ];

  protected vendorLabel(name: string): string {
    const map: Record<string, string> = {
      vendorVmware: 'VMWARE',
      vendorCisco: 'CISCO',
      vendorHpe: 'HPE',
      vendorDell: 'DELL',
      vendorKaytus: 'KAYTUS',
    };
    return map[name] ?? name.replace('vendor', '').toUpperCase();
  }
}
