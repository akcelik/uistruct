import { ChangeDetectionStrategy, Component } from '@angular/core';
import { STRCT_ICON_GROUPS, StrctIcon, StrctIconBadge, registerStrctIcon } from 'strct';
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
  imports: [PageHeader, DemoBlock, StrctIcon],
  template: `
    <app-page-header
      title="Icons"
      subtitle="A datacenter-flavoured stroke icon set. Object state (running, stopped, maintenance) is layered on with the icon's badge input rather than a separate glyph per state."
    />

    <app-demo
      anchor="gallery"
      heading="Icon set"
      description="Every glyph, grouped. Click-to-copy is up to you — names are shown below each."
    >
      @for (group of groups; track group.label) {
        <div class="ig-group">
          <div class="ig-group__title">{{ group.label }}</div>
          <div class="ig-grid">
            @for (name of group.names; track name) {
              <div class="ig-tile">
                <strct-icon [name]="name" [size]="22" [strokeWidth]="1.4" />
                <span class="ig-name">{{ name }}</span>
              </div>
            }
          </div>
        </div>
      }
    </app-demo>

    <app-demo
      anchor="states"
      heading="Object states"
      description="The same object glyph carries any state via a status badge — one icon, many variations."
      code='<strct-icon name="host" badge="ok" />  <!-- running host -->'
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
      .ig-group {
        width: 100%;
      }
      .ig-group + .ig-group {
        margin-top: 20px;
      }
      .ig-group__title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--t2);
        margin-bottom: 10px;
      }
      .ig-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
        gap: 8px;
      }
      .ig-tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 14px 6px 10px;
        border: 1px solid var(--b2);
        border-radius: 8px;
        background: var(--bg-1);
      }
      .ig-tile strct-icon {
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
        font-size: 11px;
        color: var(--t2);
        text-align: center;
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

  protected readonly groups = STRCT_ICON_GROUPS;
  protected readonly vendorNames =
    STRCT_ICON_GROUPS.find((g) => g.label.startsWith('Vendor'))?.names ?? [];

  protected readonly states: StateExample[] = [
    { name: 'host-run', object: 'host', badge: 'success', label: 'Host · running' },
    { name: 'host-off', object: 'host', badge: 'off', label: 'Host · powered off' },
    { name: 'host-maint', object: 'host', badge: 'warning', label: 'Host · maintenance' },
    { name: 'host-critical', object: 'host', badge: 'critical', label: 'Host · critical' },
    { name: 'vm-run', object: 'vm', badge: 'success', label: 'VM · running' },
    { name: 'vm-off', object: 'vm', badge: 'off', label: 'VM · stopped' },
    { name: 'cluster-ok', object: 'cluster', badge: 'success', label: 'Cluster · healthy' },
    { name: 'cluster-degraded', object: 'cluster', badge: 'warning', label: 'Cluster · degraded' },
    { name: 'storage-warn', object: 'storage', badge: 'warning', label: 'Datastore · low' },
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
