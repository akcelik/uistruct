import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
  StrctIcon,
  StrctModal,
  StrctStep,
  StrctTab,
  StrctTabs,
  StrctTree,
  StrctTreeNode,
  StrctTreeNodeData,
  StrctTreeNodeMenuFn,
  StrctWizard,
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
    StrctIcon,
    StrctWizard,
    StrctStep,
    StrctDivider,
  ],
  template: `
    <app-page-header
      title="Surfaces"
      subtitle="Containers and disclosure patterns: cards, accordions, tabs, trees, modals, menus and a multi-step wizard."
    />

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
      anchor="modal"
      heading="Modal"
      description="Overlay dialog with two-way open, backdrop & Escape dismiss."
    >
      <button strct-button variant="primary" (click)="modalOpen.set(true)">Open modal</button>
      <strct-modal [(open)]="modalOpen" title="Confirm action">
        This dialog closes on the backdrop, the Escape key, or the buttons below.
        <ng-container strctModalFooter>
          <button strct-button variant="flat" (click)="modalOpen.set(false)">Cancel</button>
          <button strct-button variant="primary" (click)="modalOpen.set(false)">Confirm</button>
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
  protected readonly modalOpen = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly drawerSide = signal<StrctDrawerSide>('end');

  protected openDrawer(side: StrctDrawerSide): void {
    this.drawerSide.set(side);
    this.drawerOpen.set(true);
  }
  protected readonly wizardDone = signal(false);

  protected readonly treePick = signal('');
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
