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
  StrctDropdown,
  StrctDropdownItem,
  StrctIcon,
  StrctModal,
  StrctStep,
  StrctTab,
  StrctTabs,
  StrctTree,
  StrctTreeNode,
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

    <app-demo anchor="card" heading="Card" description="Composed from header / block / footer pieces.">
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

    <app-demo anchor="accordion" heading="Accordion" description="Independently collapsible panels.">
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

    <app-demo anchor="tabs" heading="Tabs" description="Content children projected into a tab group.">
      <strct-tabs style="width: 100%; max-width: 520px;">
        <strct-tab label="Summary">A concise overview of the resource lives here.</strct-tab>
        <strct-tab label="Activity">Recent activity and an audit trail.</strct-tab>
        <strct-tab label="Settings" [disabled]="true">Disabled tab.</strct-tab>
      </strct-tabs>
    </app-demo>

    <app-demo anchor="tree" heading="Tree" description="Nested, expandable nodes with optional icons.">
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

    <app-demo anchor="modal" heading="Modal" description="Overlay dialog with two-way open, backdrop & Escape dismiss.">
      <button strct-button variant="primary" (click)="modalOpen.set(true)">Open modal</button>
      <strct-modal [(open)]="modalOpen" title="Confirm action">
        This dialog closes on the backdrop, the Escape key, or the buttons below.
        <ng-container strctModalFooter>
          <button strct-button variant="flat" (click)="modalOpen.set(false)">Cancel</button>
          <button strct-button variant="primary" (click)="modalOpen.set(false)">Confirm</button>
        </ng-container>
      </strct-modal>
    </app-demo>

    <app-demo anchor="dropdown" heading="Dropdown" description="Click-to-open menu that closes on outside click.">
      <strct-dropdown align="start">
        <button strct-button strctDropdownTrigger>
          Actions
          <strct-icon name="chevronDown" [size]="13" />
        </button>
        <strct-dropdown-item>Rename</strct-dropdown-item>
        <strct-dropdown-item>Duplicate</strct-dropdown-item>
        <strct-dropdown-item danger>Delete</strct-dropdown-item>
      </strct-dropdown>
    </app-demo>

    <app-demo anchor="wizard" heading="Wizard" description="Multi-step flow with Back / Next / Finish.">
      <strct-wizard style="width: 100%; max-width: 560px;" (finished)="wizardDone.set(true)">
        <strct-step label="Account">Step 1 — set up the account.</strct-step>
        <strct-step label="Profile">Step 2 — fill in profile details.</strct-step>
        <strct-step label="Review">Step 3 — review and finish.</strct-step>
      </strct-wizard>
      @if (wizardDone()) {
        <strct-badge status="success">Finished</strct-badge>
      }
    </app-demo>

    <app-demo anchor="divider" heading="Divider" description="A separator rule, optionally with a centered label.">
      <div style="width: 100%; max-width: 360px;">
        <p style="margin: 0 0 4px; color: var(--t2); font-size: 13px;">Section one</p>
        <strct-divider>or</strct-divider>
        <p style="margin: 4px 0 0; color: var(--t2); font-size: 13px;">Section two</p>
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 14px; color: var(--t2); font-size: 13px;">
          <span>Inline</span><strct-divider vertical /><span>separated</span><strct-divider vertical /><span>items</span>
        </div>
      </div>
    </app-demo>
  `,
})
export class SurfacesPage {
  protected readonly modalOpen = signal(false);
  protected readonly wizardDone = signal(false);
}
