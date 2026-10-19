import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctBadge,
  StrctBreadcrumb,
  StrctBreadcrumbItem,
  StrctButton,
  StrctCommandItem,
  StrctCommandPalette,
  StrctKbd,
  StrctMenuSection,
  StrctPagination,
  StrctProductItem,
  StrctProductSwitcher,
  StrctProgress,
  StrctRail,
  StrctRailItem,
  StrctSearchbox,
  StrctSectionMenu,
  StrctToggle,
  StrctMenubar,
  StrctMenubarItem,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-navigation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeader,
    DemoBlock,
    StrctBadge,
    StrctBreadcrumb,
    StrctBreadcrumbItem,
    StrctButton,
    StrctCommandPalette,
    StrctKbd,
    StrctPagination,
    StrctProductSwitcher,
    StrctProgress,
    StrctRail,
    StrctSearchbox,
    StrctSectionMenu,
    StrctToggle,
    StrctMenubar,
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
      anchor="command-palette-sections"
      owner="command-palette"
      heading="Results from more than one source"
      description="A palette fed from several products reads as one undifferentiated list. Give each item a section and the results group under a heading the arrows pass over; sectionOrder puts the product you are in first. A badge (with a tone of its own) says which product a result belongs to, and a description takes the detail the tag has no room for — the tag now shrinks before the label does."
      code='items = [{ id: "vm-1", label: "Payments VM", section: "Backup", badge: { label: "Backup", tone: "var(--acc)" }, description: "esx-04 · last backup 2h ago", group: "Virtual machine" }]'
    >
      <div class="cp-demo">
        <button strct-button variant="primary" (click)="secOpen.set(true)">
          Search across products
        </button>
        @if (secLast()) {
          <span class="echo">picked: {{ secLast() }}</span>
        }
      </div>
      <strct-command-palette
        [items]="secItems"
        [sectionOrder]="['Manager', 'Backup', 'Site Recovery', 'Administration']"
        [open]="secOpen()"
        (openChange)="secOpen.set($event)"
        placeholder="Search every product…"
        [hotkey]="false"
        (picked)="secLast.set($event.label)"
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
      anchor="breadcrumb-interactive"
      owner="breadcrumb"
      heading="A trail that does not route"
      description="A folder path inside a view is a breadcrumb whose crumbs do not route: they move the view, not the URL. interactive makes the crumb itself the control — a tab stop that answers Enter and Space and emits (activated) — instead of an <a> with a click handler and no href, which no keyboard can reach. It is stated rather than inferred from the output having a listener, which Angular does not expose."
      code='<strct-breadcrumb-item interactive (activated)="cd(part)">vm-images</strct-breadcrumb-item>'
    >
      <div class="stack">
        <strct-breadcrumb regionLabel="Folder path">
          @for (part of path(); track $index; let last = $last) {
            @if (last) {
              <strct-breadcrumb-item current>{{ part }}</strct-breadcrumb-item>
            } @else {
              <strct-breadcrumb-item interactive (activated)="goToFolder($index)">
                {{ part }}
              </strct-breadcrumb-item>
            }
          }
        </strct-breadcrumb>
        <span class="echo">{{ pathEcho() || 'click or tab to a crumb' }}</span>
      </div>
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
      anchor="product-switcher"
      heading="Product switcher"
      description="Where am I, and where else can I go — the chip every multi-product console grows beside its logo. It opens the products this person may use, each with one line of health and a dot, and the shared platform after a divider. Rows are menuitemradio entries (the one you are in is checked) and real links where the product has an address, so middle-click and “open in a new tab” work. (opened) fires once per opening, so the health lines are read then and not before. Below 600px the chip shows each item's shortLabel — an icon alone does not say whether you are in Backup or in Site Recovery — while the full name stays in the accessible name. A person offered one product sees a plain chip, not a menu of one."
      code='<strct-product-switcher [items]="products" [(current)]="productId" [footerItems]="[admin]" (opened)="loadHealth()" (select)="go($event)" />'
    >
      <div class="ps-demo">
        <strct-product-switcher
          [items]="products"
          [footerItems]="platform"
          [(current)]="productId"
          (opened)="psOpens.set(psOpens() + 1)"
          (select)="psEcho.set($event.name)"
        />
        <span class="echo"
          >in: {{ productId() }} · menu opened {{ psOpens() }}×{{
            psEcho() ? ' · chose ' + psEcho() : ''
          }}</span
        >
      </div>
    </app-demo>

    <!-- FR-52-03: a product's tone is the operator's palette remapped on a
         subtree, so every accent-toned component follows without a cycle. -->
    <app-demo
      anchor="product-accent"
      owner="product-switcher"
      heading="A product's own accent"
      description="A product's colour is independent of the operator's palette (arctic / ember / sage × light / dark). Set --acc on an element carrying [data-accent] and every derived accent token — the translucent fills, the 30% border wash, the focus ring — is recomputed there, so badges, check marks, links and selection fills in that subtree follow. The colour is yours to pick, so its contrast is yours to check: text and marks want 4.5:1 on the surfaces they sit on, a line or a chip on the header wants 3:1."
      code='[data-accent="backup"] { --acc: #2f8f7a; } [data-theme="dark"] [data-accent="backup"] { --acc: #58b9a3; }'
    >
      <div class="pa-demo">
        @for (tone of accentDemo; track tone.id) {
          <div class="pa-demo__card" [attr.data-accent]="tone.id">
            <strct-badge status="accent">{{ tone.label }}</strct-badge>
            <a href="#product-accent" class="pa-demo__link">a link in this accent</a>
            <strct-progress [value]="tone.value" status="accent" [label]="tone.label + ' usage'" />
          </div>
        }
      </div>
    </app-demo>

    <app-demo
      anchor="section-menu"
      heading="Section menu"
      description="A two-level category / item menu (not a tree). Items carry the same trailing vocabulary as the rail: a status dot (Hosts — 'unsaved changes'), a muted trailing icon (VMs — 'restart required') and a count chip (Volumes — deviations). An entry with routerLink or href is drawn as a real link — middle-click, ⌘-click and “copy link address” work, and the router marks it aria-current — while (select) still fires on a plain activation, as the rail does. Here Hosts and Volumes are links; the rest are buttons. Toggle collapsible and icons to see the configurations."
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

    <app-demo
      anchor="menubar"
      heading="Menubar"
      description="The application-menu strip for dense tool consoles. Click or Enter/Down opens; Left/Right move across the bar and switch the open menu (APG menubar); Escape and outside click close."
      code='<strct-menubar [menus]="menus" (picked)="run($event)" />'
    >
      <div class="cp-demo">
        <strct-menubar [menus]="mbMenus" (picked)="mbLast.set($event.item.label ?? '')" />
        @if (mbLast()) {
          <span class="echo">picked: {{ mbLast() }}</span>
        }
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
      .ps-demo {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .pa-demo {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }
      .pa-demo__card {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 210px;
        padding: 14px;
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        background: var(--bg-1);
      }
      .pa-demo__link {
        font-size: 13px;
        color: var(--acc);
      }
      /* A product's accent, set on the subtree that carries it: every derived
         accent token follows (FR-52-03). Measured on --bg-1: 5.9 / 6.9 / 5.6
         in dark and 5.3 / 4.8 / 5.9 in light. */
      .pa-demo__card[data-accent='manager'] {
        --acc: #7b9ec8;
      }
      .pa-demo__card[data-accent='backup'] {
        --acc: #58b9a3;
      }
      .pa-demo__card[data-accent='recovery'] {
        --acc: #a98ad1;
      }
      /* :host-context and not a plain ancestor selector: emulated
         encapsulation stamps its content attribute on every compound
         selector, including the ancestor, and <html> does not carry it — so
         the light values never applied and the contrast check said so. */
      :host-context([data-theme='light']) .pa-demo__card[data-accent='manager'] {
        --acc: #4a6b8f;
      }
      :host-context([data-theme='light']) .pa-demo__card[data-accent='backup'] {
        --acc: #1f7a66;
      }
      :host-context([data-theme='light']) .pa-demo__card[data-accent='recovery'] {
        --acc: #6b4fa0;
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
        border-radius: 5px;
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
        border-radius: 5px;
        background: var(--bg-1);
      }
    `,
  ],
})
export class NavigationPage {
  // FR-48-09 — a folder path whose crumbs move the view, not the URL.
  protected readonly fullPath = ['datastore1', 'vm-images', 'templates', 'win2025.vhdx'];
  protected readonly depth = signal(4);
  protected readonly path = computed(() => this.fullPath.slice(0, this.depth()));
  protected readonly pathEcho = signal('');
  protected goToFolder(i: number): void {
    this.depth.set(i + 1);
    this.pathEcho.set('opened ' + this.fullPath[i]);
  }

  protected readonly mbLast = signal('');
  protected readonly mbMenus: StrctMenubarItem[] = [
    {
      id: 'vm',
      label: 'VM',
      items: [
        { label: 'Power on', icon: 'running' },
        { label: 'Suspend', icon: 'paused' },
        { divider: true },
        { label: 'Delete from disk', icon: 'trash', critical: true },
      ],
    },
    {
      id: 'host',
      label: 'Host',
      items: [
        { label: 'Enter maintenance mode', icon: 'maintenance' },
        { label: 'Reboot', icon: 'refresh' },
      ],
    },
    {
      id: 'cluster',
      label: 'Cluster',
      items: [{ label: 'Edit DRS settings', icon: 'settings' }],
    },
  ];

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
  protected readonly productId = signal<string | null>('backup');
  protected readonly psOpens = signal(0);
  protected readonly psEcho = signal('');
  protected readonly products: StrctProductItem[] = [
    {
      id: 'manager',
      name: 'HyperStruct Manager',
      shortLabel: 'Manager',
      icon: 'cluster',
      description: '128 hosts · 2 alarms',
      status: 'success',
      tone: 'var(--acc)',
    },
    {
      id: 'backup',
      name: 'HyperStruct Backup',
      shortLabel: 'Backup',
      icon: 'archive',
      description: '2 VMs past RPO',
      status: 'warning',
      tone: 'var(--success)',
    },
    {
      id: 'recovery',
      name: 'HyperStruct Site Recovery',
      shortLabel: 'Recovery',
      icon: 'refresh',
      description: 'DR ready · tested 6 days ago',
      status: 'success',
      tone: 'var(--warning)',
    },
  ];
  protected readonly platform: StrctProductItem[] = [
    { id: 'admin', name: 'Administration', shortLabel: 'Admin', icon: 'settings' },
  ];

  // The three demo products' own tones. Two shades each — a dark theme and a
  // light one — because one colour cannot clear 4.5:1 on both grounds; the
  // values live in this page's stylesheet, where a theme can scope them.
  protected readonly accentDemo = [
    { id: 'manager', label: 'Manager', value: 62 },
    { id: 'backup', label: 'Backup', value: 48 },
    { id: 'recovery', label: 'Site Recovery', value: 31 },
  ];

  protected readonly secOpen = signal(false);
  protected readonly secLast = signal('');
  // One object, three products: the same VM is its page, its backups and its
  // replication — which is why each result says where it belongs.
  protected readonly secItems: StrctCommandItem[] = [
    {
      id: 'm-vm',
      label: 'payments-db-01',
      section: 'Manager',
      icon: 'vm',
      group: 'Virtual machine',
      description: 'esx-04 · 8 vCPU · 32 GB',
      badge: { label: 'Manager', tone: 'var(--acc)' },
    },
    {
      id: 'm-host',
      label: 'esx-04.dc1.local',
      section: 'Manager',
      icon: 'host',
      group: 'Host',
      description: 'Cluster PROD · 62% CPU',
      badge: { label: 'Manager', tone: 'var(--acc)' },
    },
    {
      id: 'b-vm',
      label: 'payments-db-01',
      section: 'Backup',
      icon: 'archive',
      group: 'Backups · daily at 02:00',
      description: 'Last restore point 2h ago · 14 kept',
      badge: { label: 'Backup', tone: 'var(--success)' },
    },
    {
      id: 'b-policy',
      label: 'Gold — 7 daily, 4 weekly',
      section: 'Backup',
      icon: 'shield',
      group: 'Policy',
      description: '38 VMs · 2 past RPO',
      badge: { label: 'Backup', tone: 'var(--success)' },
    },
    {
      id: 's-plan',
      label: 'PROD → DR failover',
      section: 'Site Recovery',
      icon: 'refresh',
      group: 'Recovery plan',
      description: '12 VMs · tested 6 days ago',
      badge: { label: 'Site Recovery', tone: 'var(--warning)' },
    },
    {
      id: 'a-users',
      label: 'Users and roles',
      section: 'Administration',
      icon: 'users',
      group: 'Settings',
      badge: { label: 'Admin' },
    },
  ];

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
        {
          id: 'hosts',
          label: 'Hosts',
          icon: 'host',
          dot: true,
          dotStatus: 'warning',
          // A page with an address of its own (FR-52-06).
          routerLink: '/components/section-menu',
        },
        { id: 'vms', label: 'Virtual machines', icon: 'vm', trailingIcon: 'sync' },
        { id: 'clusters', label: 'Clusters', icon: 'cluster' },
      ],
    },
    {
      label: 'Storage',
      icon: 'storage',
      items: [
        {
          id: 'volumes',
          label: 'Volumes',
          icon: 'disk',
          badge: 3,
          badgeStatus: 'critical',
          routerLink: '/components/section-menu',
        },
        { id: 'pools', label: 'Pools', icon: 'storage' },
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
