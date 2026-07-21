import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctBreadcrumb,
  StrctBreadcrumbItem,
  StrctButton,
  StrctCommandItem,
  StrctCommandPalette,
  StrctKbd,
  StrctMenuSection,
  StrctPagination,
  StrctRail,
  StrctRailItem,
  StrctSearchbox,
  StrctSectionMenu,
  StrctToggle,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-navigation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeader,
    DemoBlock,
    StrctBreadcrumb,
    StrctBreadcrumbItem,
    StrctButton,
    StrctCommandPalette,
    StrctKbd,
    StrctPagination,
    StrctRail,
    StrctSearchbox,
    StrctSectionMenu,
    StrctToggle,
  ],
  template: `
    <app-page-header title="Navigation" subtitle="Wayfinding and paging controls." />

    <app-demo
      anchor="command-palette"
      heading="Command palette"
      description="A ⌘/Ctrl-K spotlight over commands or pages: ranked search, keyboard-first, focus-restoring. This docs site's own ⌘K runs on this component."
      code='<strct-command-palette [items]="commands" [(open)]="open" (picked)="run($event)" />'
    >
      <div class="cp-demo">
        <button strct-button variant="primary" (click)="cpOpen.set(true)">Open palette</button>
        <span class="cp-hint"
          >or press <strct-kbd>⌘K</strct-kbd> / <strct-kbd>Ctrl K</strct-kbd></span
        >
        @if (cpLast()) {
          <span class="echo">picked: {{ cpLast() }}</span>
        }
      </div>
      <strct-command-palette
        [items]="cpItems"
        [open]="cpOpen()"
        (openChange)="cpOpen.set($event)"
        (picked)="cpLast.set($event.label)"
        [hotkey]="false"
      />
    </app-demo>

    <app-demo
      anchor="command-palette-server"
      owner="command-palette"
      heading="Server-backed search"
      description="For RBAC-filtered / thousands-of-objects inventories the query has to reach an API: bind [(query)], pass [filter]=false (items render in the order you already ranked them) and flip [loading] while results are in flight. maxResults still caps rendering."
      code='<strct-command-palette [(open)]="open" [(query)]="q" [items]="results()" [filter]="false" [loading]="searching()" (picked)="go($event)" />'
    >
      <div class="cp-demo">
        <button strct-button variant="primary" (click)="srvOpen.set(true)">
          Search inventory (simulated API)
        </button>
        @if (srvLast()) {
          <span class="echo">picked: {{ srvLast() }}</span>
        }
      </div>
      <strct-command-palette
        [items]="srvResults()"
        [open]="srvOpen()"
        (openChange)="srvOpen.set($event)"
        [query]="srvQuery()"
        (queryChange)="onSrvQuery($event)"
        [filter]="false"
        [loading]="srvLoading()"
        placeholder="Search the inventory…"
        emptyText="No inventory matches"
        [hotkey]="false"
        (picked)="srvLast.set($event.label)"
      />
    </app-demo>

    <app-demo
      anchor="searchbox"
      heading="Searchbox"
      description="The docs-header search pattern as a component. Default mode is a real search field — two-way value, Enter emits (search), Escape or the × clears. trigger mode is a button that only emits (activated): pair it with the command palette and show the hotkey in hint. The header of this site runs on it."
      code='<strct-searchbox [(value)]="q" (search)="run($event)" />  ·  <strct-searchbox trigger hint="⌘K" (activated)="palette.open.set(true)" />'
    >
      <div class="sb-demo">
        <div class="sb-demo__row">
          <strct-searchbox
            style="width: 260px"
            placeholder="Search hosts…"
            [(value)]="sbQuery"
            (search)="sbLast.set($event)"
          />
          @if (sbLast()) {
            <span class="echo">searched: {{ sbLast() }}</span>
          } @else if (sbQuery()) {
            <span class="echo">typing: {{ sbQuery() }}</span>
          }
        </div>
        <div class="sb-demo__row">
          <strct-searchbox trigger hint="⌘K" placeholder="Search" (activated)="cpOpen.set(true)" />
          <span class="cp-hint">trigger mode — opens the palette above</span>
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="kbd"
      heading="Kbd"
      description="Inline key chips for shortcut hints."
      code="Press <strct-kbd>⌘K</strct-kbd> to search"
    >
      <div class="cp-demo">
        <span class="cp-hint">
          Press <strct-kbd>⌘K</strct-kbd> to search · <strct-kbd>Esc</strct-kbd> to close ·
          <strct-kbd>↑</strct-kbd><strct-kbd>↓</strct-kbd> to move
        </span>
      </div>
    </app-demo>

    <app-demo
      anchor="breadcrumb"
      heading="Breadcrumb"
      description="A trail of links ending in the current page."
      code="<strct-breadcrumb><strct-breadcrumb-item>…</strct-breadcrumb-item></strct-breadcrumb>"
    >
      <strct-breadcrumb>
        <strct-breadcrumb-item><a href="javascript:void(0)">Home</a></strct-breadcrumb-item>
        <strct-breadcrumb-item><a href="javascript:void(0)">Components</a></strct-breadcrumb-item>
        <strct-breadcrumb-item><a href="javascript:void(0)">Navigation</a></strct-breadcrumb-item>
        <strct-breadcrumb-item current>Breadcrumb</strct-breadcrumb-item>
      </strct-breadcrumb>
    </app-demo>

    <app-demo
      anchor="pagination"
      heading="Pagination"
      description="Windowed page range with ellipsis gaps for large sets."
      code='<strct-pagination [total]="240" [pageSize]="20" [(page)]="page" />'
    >
      <div class="stack">
        <strct-pagination [total]="60" [pageSize]="10" [(page)]="pageA" />
        <strct-pagination [total]="240" [pageSize]="20" [(page)]="pageB" />
        <span class="echo">small set page: {{ pageA() }} · large set page: {{ pageB() }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="rail"
      heading="Rail"
      description="Collapsible, data-driven primary navigation. placement: 'bottom' pins an item (Administration) to the foot under a divider; routerLink/href items are real links — middle-click or ⌘-click 'Rail docs' to open a new tab. Toggle the foot control to collapse to icons — badges become dots and labels become tooltips."
      code='<strct-rail [items]="[{id:&#39;compute&#39;,label:&#39;Compute&#39;,icon:&#39;host&#39;,routerLink:&#39;/compute&#39;}, …, {id:&#39;admin&#39;,label:&#39;Administration&#39;,icon:&#39;settings&#39;,placement:&#39;bottom&#39;}]" [(activeId)]="section" />'
    >
      <div class="rail-demo">
        <strct-rail [items]="railItems" [(activeId)]="section" [(collapsed)]="railOff" />
        <div class="rail-demo__canvas">
          <span class="echo">
            active: {{ section() }} · {{ railOff() ? 'collapsed' : 'expanded' }}
          </span>
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="section-menu"
      heading="Section menu"
      description="A two-level category / item menu (not a tree). Items carry the same trailing vocabulary as the rail: a status dot (Hosts — 'unsaved changes'), a muted trailing icon (VMs — 'restart required') and a count chip (Volumes — deviations). Toggle collapsible and icons to see the configurations."
      code='<strct-section-menu [sections]="[{label:&#39;Compute&#39;,items:[{id:&#39;hosts&#39;,label:&#39;Hosts&#39;,dot:true,dotStatus:&#39;warning&#39;},{id:&#39;vms&#39;,label:&#39;VMs&#39;,trailingIcon:&#39;sync&#39;}]}]" [(activeId)]="active" />'
    >
      <div class="sm-demo">
        <div class="sm-demo__controls">
          <strct-toggle [ngModel]="menuCollapsible()" (ngModelChange)="menuCollapsible.set($event)"
            >Collapsible</strct-toggle
          >
          <strct-toggle [ngModel]="menuIcons()" (ngModelChange)="menuIcons.set($event)"
            >Show icons</strct-toggle
          >
        </div>
        <div class="sm-demo__panel">
          <strct-section-menu
            [sections]="menuSections"
            [(activeId)]="menuActive"
            [collapsible]="menuCollapsible()"
            [showIcons]="menuIcons()"
          />
        </div>
        <span class="echo">active: {{ menuActive() }}</span>
      </div>
    </app-demo>
  `,
  styles: [
    `
      .sb-demo {
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: 100%;
      }
      .sb-demo__row {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }

      .cp-demo {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }
      .cp-hint {
        font-size: 13px;
        color: var(--t2);
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }
      .echo {
        font-size: 12px;
        color: var(--t2);
        font-family: var(--mono);
      }
      .rail-demo {
        display: flex;
        height: 320px;
        width: 100%;
        max-width: 560px;
        border: 1px solid var(--b2);
        border-radius: 10px;
        overflow: hidden;
      }
      .rail-demo__canvas {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-2);
      }
      .sm-demo {
        display: flex;
        flex-direction: column;
        gap: 14px;
        align-items: flex-start;
      }
      .sm-demo__controls {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }
      .sm-demo__panel {
        width: 244px;
        padding: 8px;
        border: 1px solid var(--b2);
        border-radius: 10px;
        background: var(--bg-1);
      }
    `,
  ],
})
export class NavigationPage {
  protected readonly cpOpen = signal(false);
  protected readonly cpLast = signal('');
  protected readonly sbQuery = signal('');
  protected readonly sbLast = signal('');
  protected readonly cpItems: StrctCommandItem[] = [
    { id: 'deploy', label: 'Deploy new cluster', group: 'Actions', icon: 'cluster', hint: '⌘D' },
    { id: 'snapshot', label: 'Create snapshot', group: 'Actions', icon: 'snapshot' },
    { id: 'hosts', label: 'Go to hosts', group: 'Navigate', icon: 'host' },
    { id: 'alarms', label: 'Go to alarms', group: 'Navigate', icon: 'siren' },
    {
      id: 'theme',
      label: 'Toggle dark mode',
      group: 'Preferences',
      icon: 'moon',
      keywords: ['appearance', 'light'],
    },
    { id: 'logout', label: 'Sign out', group: 'Session', icon: 'logout' },
  ];

  // Server-backed palette demo: a simulated API with latency.
  protected readonly srvOpen = signal(false);
  protected readonly srvQuery = signal('');
  protected readonly srvLoading = signal(false);
  protected readonly srvLast = signal('');
  private readonly srvCorpus: StrctCommandItem[] = [
    { id: 'vm-web-01', label: 'web-01', group: 'Virtual machines', icon: 'vm' },
    { id: 'vm-web-02', label: 'web-02', group: 'Virtual machines', icon: 'vm' },
    { id: 'vm-db-01', label: 'db-primary', group: 'Virtual machines', icon: 'vm' },
    { id: 'vm-db-02', label: 'db-replica', group: 'Virtual machines', icon: 'vm' },
    { id: 'hv-01', label: 'hv-01.dc-east', group: 'Hosts', icon: 'host' },
    { id: 'hv-02', label: 'hv-02.dc-east', group: 'Hosts', icon: 'host' },
    { id: 'ds-ssd', label: 'datastore-ssd-01', group: 'Storage', icon: 'disk' },
    { id: 'ds-hdd', label: 'datastore-hdd-02', group: 'Storage', icon: 'disk' },
    { id: 'net-dmz', label: 'pg-dmz', group: 'Networks', icon: 'network' },
    { id: 'net-mgmt', label: 'pg-mgmt', group: 'Networks', icon: 'network' },
  ];
  protected readonly srvResults = signal<StrctCommandItem[]>(this.srvCorpus.slice(0, 6));
  private srvTimer: ReturnType<typeof setTimeout> | undefined;

  protected onSrvQuery(q: string): void {
    this.srvQuery.set(q);
    clearTimeout(this.srvTimer);
    this.srvLoading.set(true);
    this.srvTimer = setTimeout(() => {
      const needle = q.trim().toLowerCase();
      this.srvResults.set(
        needle
          ? this.srvCorpus.filter((i) => i.label.toLowerCase().includes(needle))
          : this.srvCorpus.slice(0, 6),
      );
      this.srvLoading.set(false);
    }, 350);
  }

  protected readonly pageA = signal(1);
  protected readonly pageB = signal(5);

  protected readonly section = signal('hosts');
  protected readonly railOff = signal(false);
  protected readonly railItems: StrctRailItem[] = [
    { id: 'overview', label: 'Overview', icon: 'datacenter' },
    { id: 'hosts', label: 'Hosts', icon: 'host', badge: 24 },
    { id: 'vms', label: 'Virtual machines', icon: 'vm', badge: 112 },
    { id: 'storage', label: 'Storage', icon: 'storage', badge: 3, badgeStatus: 'warning' },
    { id: 'network', label: 'Networking', icon: 'network', dot: true, dotStatus: 'warning' },
    { id: 'alerts', label: 'Alerts', icon: 'alarm', badge: 2, badgeStatus: 'critical' },
    // A real router link: middle-click / ⌘-click opens a new tab.
    { id: 'docs', label: 'Rail docs (link)', icon: 'link', routerLink: '/components/rail' },
    // Pinned to the foot of the rail, under a divider.
    { id: 'admin', label: 'Administration', icon: 'settings', placement: 'bottom' },
  ];

  protected readonly menuActive = signal('hosts');
  protected readonly menuCollapsible = signal(true);
  protected readonly menuIcons = signal(true);
  protected readonly menuSections: StrctMenuSection[] = [
    {
      label: 'Compute',
      icon: 'cpu',
      items: [
        // "unsaved changes" dot + "restart required" trailing icon (FR-NAV-02)
        { id: 'hosts', label: 'Hosts', icon: 'host', dot: true, dotStatus: 'warning' },
        { id: 'vms', label: 'Virtual machines', icon: 'vm', trailingIcon: 'sync' },
        { id: 'clusters', label: 'Clusters', icon: 'cluster' },
      ],
    },
    {
      label: 'Storage',
      icon: 'storage',
      items: [
        { id: 'volumes', label: 'Volumes', icon: 'disk', badge: 3, badgeStatus: 'critical' },
        { id: 'pools', label: 'Pools', icon: 'database' },
      ],
    },
    {
      label: 'Network',
      icon: 'network',
      expanded: false,
      items: [
        { id: 'switches', label: 'Switches', icon: 'switch' },
        { id: 'firewall', label: 'Firewall', icon: 'firewall' },
      ],
    },
  ];
}
