import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctAccordion,
  StrctAccordionPanel,
  StrctBadge,
  StrctButton,
  StrctCard,
  StrctCardBlock,
  StrctCardFooter,
  StrctCardHeader,
  StrctDivider,
  StrctDrawer,
  StrctDrawerFooter,
  StrctDrawerSide,
  StrctDropdown,
  StrctDropdownItem,
  StrctDropdownTrigger,
  StrctField,
  StrctInput,
  StrctCheckbox,
  StrctIcon,
  StrctModal,
  StrctModalSize,
  StrctStep,
  StrctTab,
  StrctTabs,
  StrctTree,
  StrctTreeNode,
  StrctTreeNodeData,
  StrctTreeNodeMenuFn,
  StrctWizard,
  StrctPageHeader,
  StrctPageHeaderActions,
  StrctPageHeaderCrumbs,
  StrctBreadcrumb,
  StrctBreadcrumbItem,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-surfaces-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    StrctCard,
    StrctCardHeader,
    StrctCardBlock,
    StrctCardFooter,
    StrctButton,
    StrctBadge,
    StrctAccordion,
    StrctAccordionPanel,
    StrctTabs,
    StrctTab,
    StrctTree,
    StrctTreeNode,
    StrctModal,
    StrctDrawer,
    StrctDrawerFooter,
    StrctDropdown,
    StrctDropdownItem,
    StrctDropdownTrigger,
    StrctField,
    StrctInput,
    StrctCheckbox,
    FormsModule,
    StrctIcon,
    StrctWizard,
    StrctStep,
    StrctDivider,
    StrctPageHeader,
    StrctPageHeaderActions,
    StrctPageHeaderCrumbs,
    StrctBreadcrumb,
    StrctBreadcrumbItem,
  ],
  template: `
    <app-page-header
      title="Surfaces"
      subtitle="Containers and disclosure patterns: cards, accordions, tabs, trees, modals, menus and a multi-step wizard."
    />

    <app-demo
      anchor="page-header"
      heading="Page header"
      description="The top of every console object page: an optional breadcrumb row, an h1 title + subtitle, end-aligned actions and a projected meta strip below. The doc pages you are reading use it."
      code='<strct-page-header title="hv-02" subtitle="Hypervisor · cluster-01"><strct-breadcrumb strctPageHeaderCrumbs>…</strct-breadcrumb><button strct-button strctPageHeaderActions>Migrate</button></strct-page-header>'
    >
      <strct-page-header
        style="width: 100%"
        title="hv-02"
        subtitle="Hypervisor · cluster-01 · 2×64 cores · 1.5 TB"
        divider
      >
        <strct-breadcrumb strctPageHeaderCrumbs>
          <strct-breadcrumb-item><a href="javascript:void(0)">Compute</a></strct-breadcrumb-item>
          <strct-breadcrumb-item><a href="javascript:void(0)">Hosts</a></strct-breadcrumb-item>
          <strct-breadcrumb-item current>hv-02</strct-breadcrumb-item>
        </strct-breadcrumb>
        <button strct-button strctPageHeaderActions size="sm" variant="neutral">Maintenance</button>
        <button strct-button strctPageHeaderActions size="sm" variant="primary" solid>
          Migrate VMs
        </button>
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <strct-badge status="success">Connected</strct-badge>
          <strct-badge status="neutral">vSAN member</strct-badge>
        </div>
      </strct-page-header>
    </app-demo>

    <app-demo
      anchor="card"
      heading="Card"
      description="Composed from header / block / footer pieces."
    >
      <strct-card style="max-width: 360px;">
        <strct-card-header>
          <span>Deployment</span>
          <strct-badge status="success">Healthy</strct-badge>
        </strct-card-header>
        <strct-card-block>
          Surfaces stack a header, a content block and an optional footer. Each piece reads from the
          shared token layer.
        </strct-card-block>
        <strct-card-footer>
          <button strct-button variant="flat" size="sm">Details</button>
          <button strct-button variant="primary" size="sm">Open</button>
        </strct-card-footer>
      </strct-card>
    </app-demo>

    <app-demo
      anchor="card-rich"
      owner="card"
      heading="Rich cards"
      description="Opt-in states: a status tone rail, hover-lift for clickable cards, a selection ring, dense padding, a loading bar with aria-busy, and collapsible cards whose header grows a chevron."
      code='<strct-card status="warning" collapsible [(collapsed)]="hidden">…</strct-card>'
    >
      <div class="rich-cards">
        <strct-card status="success" interactive>
          <strct-card-header icon="host">hv-01 · healthy</strct-card-header>
          <strct-card-block>Interactive + success rail — hover me.</strct-card-block>
        </strct-card>

        <strct-card
          status="warning"
          [selected]="richSelected()"
          interactive
          (click)="richSelected.set(!richSelected())"
        >
          <strct-card-header icon="disk">Volume SSD-01</strct-card-header>
          <strct-card-block>Click to toggle the selection ring.</strct-card-block>
        </strct-card>

        <strct-card [loading]="richLoading()" dense>
          <strct-card-header icon="sync">Replication status</strct-card-header>
          <strct-card-block>Dense paddings; body dims while loading.</strct-card-block>
          <strct-card-footer>
            <button strct-button size="sm" variant="flat" (click)="richLoading.set(!richLoading())">
              {{ richLoading() ? 'Stop' : 'Load' }}
            </button>
          </strct-card-footer>
        </strct-card>

        <strct-card status="critical" collapsible [(collapsed)]="richCollapsed">
          <strct-card-header icon="siren">3 active alarms</strct-card-header>
          <strct-card-block
            >Fan redundancy lost on hv-02 · SSD-01 above 85% · NTP drift.</strct-card-block
          >
          <strct-card-footer
            ><button strct-button size="sm">Acknowledge all</button></strct-card-footer
          >
        </strct-card>
      </div>
    </app-demo>

    <app-demo
      anchor="accordion"
      heading="Accordion"
      description="Independently collapsible panels."
    >
      <strct-accordion style="width: 100%; max-width: 480px;">
        <strct-accordion-panel heading="General" [expanded]="true">
          Panels manage their own expanded state via a two-way binding.
        </strct-accordion-panel>
        <strct-accordion-panel heading="Advanced">
          The chevron rotates as the panel opens.
        </strct-accordion-panel>
        <strct-accordion-panel heading="Danger zone">
          Keep destructive settings tucked away here.
        </strct-accordion-panel>
      </strct-accordion>
    </app-demo>

    <app-demo
      anchor="tabs"
      heading="Tabs"
      description="Content children projected into a tab group."
    >
      <strct-tabs style="width: 100%; max-width: 520px;">
        <strct-tab label="Summary">A concise overview of the resource lives here.</strct-tab>
        <strct-tab label="Activity">Recent activity and an audit trail.</strct-tab>
        <strct-tab label="Settings" [disabled]="true">Disabled tab.</strct-tab>
      </strct-tabs>
    </app-demo>

    <app-demo
      anchor="tree"
      heading="Tree"
      description="Nested, expandable nodes with optional icons."
    >
      <strct-tree style="width: 100%; max-width: 320px;">
        <strct-tree-node label="Workspace" icon="layers" [expanded]="true">
          <strct-tree-node label="Components" icon="grid" [active]="true" />
          <strct-tree-node label="Tokens" icon="palette" />
          <strct-tree-node label="Layout" icon="sidebar" [expanded]="false">
            <strct-tree-node label="Shell" />
            <strct-tree-node label="Navigation" />
          </strct-tree-node>
        </strct-tree-node>
      </strct-tree>
    </app-demo>

    <app-demo
      anchor="tree-data"
      owner="tree"
      heading="Data-driven tree"
      description="Pass [nodes] for a self-recursing tree of any depth; per-node badges surface object state. Provide [nodeMenu] to attach a per-node right-click menu — right-click any node below."
      code='<strct-tree [nodes]="roots" [nodeMenu]="menuFor" (nodeActivated)="select($event)" (nodeMenuSelect)="onPick($event)" />'
    >
      <div class="stack">
        <strct-tree
          style="width: 100%; max-width: 340px;"
          [nodes]="inventory"
          [nodeMenu]="treeMenu"
          (nodeActivated)="treePick.set('selected: ' + $event.label)"
          (nodeMenuSelect)="treePick.set($event.item.label + ' → ' + $event.node.label)"
        />
        @if (treePick()) {
          <span class="echo">{{ treePick() }}</span>
        }
      </div>
    </app-demo>

    <app-demo
      anchor="tree-expanded"
      owner="tree"
      heading="Controlled & persisted expansion"
      description="Give nodes a stable id and bind [(expandedIds)] — the parent becomes the single source of truth, so saving/restoring which nodes are open (e.g. to localStorage) is a one-liner. expandedChange also emits the full set on every toggle."
      code='<strct-tree [nodes]="nodes" [(expandedIds)]="expandedIds" />'
    >
      <div class="stack">
        <div style="display: flex; gap: 8px;">
          <button strct-button size="sm" variant="neutral" (click)="expandAll()">Expand all</button>
          <button strct-button size="sm" variant="neutral" (click)="expandedIds.set([])">
            Collapse all
          </button>
        </div>
        <strct-tree
          style="width: 100%; max-width: 340px;"
          [nodes]="regionTree"
          [(expandedIds)]="expandedIds"
        />
        <span class="echo">expandedIds: [{{ expandedIds()?.join(', ') }}]</span>
      </div>
    </app-demo>

    <app-demo
      anchor="tree-density"
      owner="tree"
      heading="Density"
      description="compact (default) is the dense inventory layout — 13px text / 16px icons. comfortable relaxes to 14px text / 18px icons with taller rows, for touch-friendly or low-density consoles."
      code='<strct-tree [nodes]="nodes" density="comfortable" />'
    >
      <div style="display: flex; gap: 32px; flex-wrap: wrap;">
        <div class="stack" style="flex: 1; min-width: 220px; max-width: 300px;">
          <span class="echo">compact (default)</span>
          <strct-tree [nodes]="densityTree" />
        </div>
        <div class="stack" style="flex: 1; min-width: 220px; max-width: 300px;">
          <span class="echo">comfortable</span>
          <strct-tree [nodes]="densityTree" density="comfortable" />
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="modal"
      heading="Modal"
      description="Overlay dialog in four fixed widths (sm 480 · md 640 · lg 860 · xl 1080 px). Closes only via the X or an action button — clicking outside won't dismiss it; add dismissible to allow backdrop / Escape."
    >
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button strct-button variant="primary" (click)="openModal('sm')">Small</button>
        <button strct-button (click)="openModal('md')">Medium</button>
        <button strct-button (click)="openModal('lg')">Large</button>
        <button strct-button (click)="openModal('xl')">Extra large</button>
      </div>
      <strct-modal [(open)]="modalOpen" [size]="modalSize()" [title]="'Modal · ' + modalSize()">
        A fixed-width dialog — modals only ever take one of four preset sizes, so layouts stay
        consistent. This one is <strong>{{ modalSize() }}</strong
        >.
        <ng-container strctModalFooter>
          <button strct-button variant="flat" (click)="modalOpen.set(false)">Cancel</button>
          <button strct-button variant="primary" (click)="modalOpen.set(false)">OK</button>
        </ng-container>
      </strct-modal>
    </app-demo>

    <app-demo
      anchor="modal-rich"
      owner="modal"
      heading="Draggable & glass"
      description='draggable lets operators move the dialog aside by its header to read what&apos;s behind it (viewport-clamped; re-centers on every open). variant="glass" is a theme-aware frosted preset; panelClass / backdropClass are the escape hatch for fully custom looks from app-global CSS.'
      code='<strct-modal draggable variant="glass" …>'
    >
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button strct-button variant="primary" (click)="dragModalOpen.set(true)">
          Draggable modal
        </button>
        <button strct-button (click)="glassModalOpen.set(true)">Glass modal</button>
      </div>
      <strct-modal [(open)]="dragModalOpen" draggable size="md" title="Drag me by the header">
        Grab the header and move this dialog aside — it stays inside the viewport, and every reopen
        starts centered again. The close button never starts a drag.
        <ng-container strctModalFooter>
          <button strct-button variant="primary" (click)="dragModalOpen.set(false)">Done</button>
        </ng-container>
      </strct-modal>
      <strct-modal
        [(open)]="glassModalOpen"
        draggable
        dismissible
        variant="glass"
        size="md"
        title="Frosted glass"
      >
        A translucent, blurred panel over a tinted backdrop — theme-aware out of the box. For a
        fully custom look, style your own classes via <code>panelClass</code> /
        <code>backdropClass</code> from global CSS.
        <ng-container strctModalFooter>
          <button strct-button variant="primary" (click)="glassModalOpen.set(false)">Close</button>
        </ng-container>
      </strct-modal>
    </app-demo>

    <app-demo
      anchor="drawer"
      heading="Drawer"
      description="Edge-anchored slide-out panel for inspector / edit flows. Backdrop & Escape dismiss; project a footer with strctDrawerFooter."
    >
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button strct-button variant="primary" (click)="openDrawer('end')">Inspect (end)</button>
        <button strct-button variant="flat" (click)="openDrawer('start')">Filters (start)</button>
        <button strct-button variant="flat" (click)="openDrawer('bottom')">Console (bottom)</button>
      </div>
      <strct-drawer [(open)]="drawerOpen" [side]="drawerSide()" title="Virtual machine" size="md">
        <p style="margin: 0 0 10px;">
          Inspect or edit a record without losing the underlying list's scroll position or
          selection.
        </p>
        <p style="margin: 0; color: var(--t2);">Anchored to: {{ drawerSide() }}</p>
        <ng-container strctDrawerFooter>
          <button strct-button variant="flat" (click)="drawerOpen.set(false)">Close</button>
          <button strct-button variant="primary" (click)="drawerOpen.set(false)">Save</button>
        </ng-container>
      </strct-drawer>
    </app-demo>

    <app-demo
      anchor="dropdown"
      heading="Dropdown"
      description="Click-to-open menu that closes on outside click."
    >
      <strct-dropdown align="start">
        <button strct-button strctDropdownTrigger>
          Actions
          <strct-icon name="chevronDown" [size]="13" />
        </button>
        <strct-dropdown-item>Rename</strct-dropdown-item>
        <strct-dropdown-item>Duplicate</strct-dropdown-item>
        <strct-dropdown-item critical>Delete</strct-dropdown-item>
      </strct-dropdown>
    </app-demo>

    <app-demo
      anchor="dropdown-popover"
      owner="dropdown"
      heading="Popover mode — filter / settings panels"
      description="With popover, the panel holds form controls: inner clicks never close it (only outside click / Escape), and it announces as a labeled dialog instead of a menu."
      code='<strct-dropdown popover popoverLabel="Filters">…form controls…</strct-dropdown>'
    >
      <strct-dropdown popover popoverLabel="Alarm filters">
        <button strct-button strctDropdownTrigger>
          <strct-icon name="filter" [size]="13" />
          Filters
          <strct-icon name="chevronDown" [size]="13" />
        </button>
        <div class="stack" style="min-width: 220px;">
          <strct-field label="Severity">
            <select strctInput [(ngModel)]="popoverSeverity">
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
            </select>
          </strct-field>
          <strct-checkbox [(ngModel)]="popoverAcked">Include acknowledged</strct-checkbox>
        </div>
      </strct-dropdown>
      <span style="color: var(--t2); font-size: 12.5px;">
        severity: {{ popoverSeverity() }} · acknowledged: {{ popoverAcked() ? 'shown' : 'hidden' }}
      </span>
    </app-demo>

    <app-demo
      anchor="wizard"
      heading="Wizard"
      description="Multi-step flow with Back / Next / Finish."
    >
      <strct-wizard style="width: 100%; max-width: 560px;" (finished)="wizardDone.set(true)">
        <strct-step label="Account">Step 1 — set up the account.</strct-step>
        <strct-step label="Profile">Step 2 — fill in profile details.</strct-step>
        <strct-step label="Review">Step 3 — review and finish.</strct-step>
      </strct-wizard>
      @if (wizardDone()) {
        <strct-badge status="success">Finished</strct-badge>
      }
    </app-demo>

    <app-demo
      anchor="wizard-guard"
      owner="wizard"
      heading="Step validation & cancel"
      description="Gate Next per step with [canAdvance]; show a busy Finish via [submitting] and an optional Cancel."
      code='<strct-step label="Account" [canAdvance]="form.valid">…</strct-step>'
    >
      <div class="stack">
        <button strct-button size="sm" (click)="step1Valid.set(!step1Valid())">
          Toggle step 1 validity — now {{ step1Valid() ? 'valid' : 'invalid' }}
        </button>
        <strct-wizard
          style="width: 100%; max-width: 560px;"
          cancelable
          [submitting]="submitting()"
          (cancelled)="wizMsg.set('cancelled')"
          (finished)="onFinish()"
        >
          <strct-step label="Account" [canAdvance]="step1Valid()">
            Step 1 — “Next” stays disabled until this step is valid.
          </strct-step>
          <strct-step label="Review">Step 2 — review, then Finish (shows a busy state).</strct-step>
        </strct-wizard>
        @if (wizMsg()) {
          <strct-badge [status]="wizMsg() === 'finished' ? 'success' : 'neutral'">{{
            wizMsg()
          }}</strct-badge>
        }
      </div>
    </app-demo>

    <app-demo
      anchor="divider"
      heading="Divider"
      description="A separator rule, optionally with a centered label."
    >
      <div style="width: 100%; max-width: 360px;">
        <p style="margin: 0 0 4px; color: var(--t2); font-size: 13px;">Section one</p>
        <strct-divider>or</strct-divider>
        <p style="margin: 4px 0 0; color: var(--t2); font-size: 13px;">Section two</p>
        <div
          style="display: flex; align-items: center; gap: 8px; margin-top: 14px; color: var(--t2); font-size: 13px;"
        >
          <span>Inline</span><strct-divider vertical /><span>separated</span
          ><strct-divider vertical /><span>items</span>
        </div>
      </div>
    </app-demo>
  `,
  styles: [
    `
      .rich-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 14px;
        width: 100%;
      }
      .stack {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        width: 100%;
      }
      .echo {
        font-size: 12px;
        color: var(--t2);
        font-family: var(--mono);
      }
    `,
  ],
})
export class SurfacesPage {
  protected readonly richSelected = signal(false);
  protected readonly richLoading = signal(true);
  protected richCollapsed = false;

  protected readonly modalOpen = signal(false);
  protected readonly modalSize = signal<StrctModalSize>('md');
  protected readonly drawerOpen = signal(false);
  protected readonly drawerSide = signal<StrctDrawerSide>('end');

  protected openModal(size: StrctModalSize): void {
    this.modalSize.set(size);
    this.modalOpen.set(true);
  }

  protected openDrawer(side: StrctDrawerSide): void {
    this.drawerSide.set(side);
    this.drawerOpen.set(true);
  }
  protected readonly wizardDone = signal(false);

  protected readonly dragModalOpen = signal(false);
  protected readonly glassModalOpen = signal(false);

  protected readonly treePick = signal('');

  // Popover filter panel state.
  protected readonly popoverSeverity = signal('all');
  protected readonly popoverAcked = signal(false);

  // Controlled-expansion demo: ids are the single source of truth.
  protected readonly regionTree: StrctTreeNodeData[] = [
    {
      id: 'us',
      label: 'us-east',
      icon: 'cloud',
      children: [
        {
          id: 'us-a',
          label: 'zone-a',
          icon: 'rack',
          children: [
            { id: 'us-a-1', label: 'hv-01', icon: 'host', badge: 'success' },
            { id: 'us-a-2', label: 'hv-02', icon: 'host', badge: 'warning' },
          ],
        },
        {
          id: 'us-b',
          label: 'zone-b',
          icon: 'rack',
          children: [{ id: 'us-b-1', label: 'hv-03', icon: 'host' }],
        },
      ],
    },
    {
      id: 'eu',
      label: 'eu-west',
      icon: 'cloud',
      children: [
        {
          id: 'eu-a',
          label: 'zone-a',
          icon: 'rack',
          children: [{ id: 'eu-a-1', label: 'hv-04', icon: 'host' }],
        },
      ],
    },
  ];
  protected readonly expandedIds = signal<string[] | null>(['us', 'us-a']);

  // Density demo: the same nodes rendered compact vs comfortable.
  protected readonly densityTree: StrctTreeNodeData[] = [
    {
      id: 'd-cluster',
      label: 'cluster-01',
      icon: 'cluster',
      expanded: true,
      children: [
        { id: 'd-hv1', label: 'hv-01', icon: 'host', badge: 'success' },
        { id: 'd-hv2', label: 'hv-02', icon: 'host', badge: 'warning' },
        { id: 'd-store', label: 'datastore-a', icon: 'storage' },
      ],
    },
  ];
  protected expandAll(): void {
    const ids: string[] = [];
    const walk = (ns: StrctTreeNodeData[]) =>
      ns.forEach((n) => {
        if (n.children?.length) {
          ids.push(n.id!);
          walk(n.children);
        }
      });
    walk(this.regionTree);
    this.expandedIds.set(ids);
  }

  protected readonly step1Valid = signal(false);
  protected readonly submitting = signal(false);
  protected readonly wizMsg = signal('');

  protected readonly inventory: StrctTreeNodeData[] = [
    {
      label: 'Datacenter-01',
      icon: 'datacenter',
      expanded: true,
      children: [
        {
          label: 'Cluster-A',
          icon: 'cluster',
          badge: 'success',
          expanded: true,
          children: [
            { label: 'hv-01 · running', icon: 'host', badge: 'success' },
            { label: 'hv-02 · maintenance', icon: 'host', badge: 'warning' },
            { label: 'hv-03 · powered off', icon: 'host', badge: 'off' },
          ],
        },
        {
          label: 'Cluster-B',
          icon: 'cluster',
          badge: 'critical',
          children: [
            { label: 'hv-04 · critical', icon: 'host', badge: 'critical' },
            { label: 'web-vm-01', icon: 'vm', badge: 'success' },
          ],
        },
      ],
    },
  ];

  protected readonly treeMenu: StrctTreeNodeMenuFn = (node) => [
    { label: 'Open', icon: 'compass' },
    {
      label: node.badge === 'warning' ? 'Exit maintenance' : 'Enter maintenance',
      icon: 'maintenance',
    },
    { label: 'Snapshot', icon: 'snapshot' },
    { divider: true },
    {
      label: 'Remove from inventory',
      icon: 'close',
      critical: true,
      disabled: (node.children?.length ?? 0) > 0,
    },
  ];

  protected onFinish(): void {
    this.submitting.set(true);
    // Simulate an async submit, then resolve.
    setTimeout(() => {
      this.submitting.set(false);
      this.wizMsg.set('finished');
    }, 900);
  }
}
