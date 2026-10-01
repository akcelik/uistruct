import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctSectionHeader,
  StrctSectionHeaderActions,
  StrctSectionHeaderMeta,
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
  StrctDropdownItemAction,
  StrctDropdownTrigger,
  StrctField,
  StrctInput,
  StrctCheckbox,
  StrctIcon,
  StrctMediaFrame,
  StrctModal,
  StrctModalSize,
  StrctStep,
  StrctTab,
  StrctTabs,
  StrctTree,
  StrctTreeNode,
  StrctTreeNodeData,
  StrctTreeNodeMenuFn,
  StrctTreeDropEvent,
  StrctWizard,
  StrctPageHeader,
  StrctPageHeaderActions,
  StrctPageHeaderCrumbs,
  StrctBreadcrumb,
  StrctBreadcrumbItem,
  StrctResizeHandle,
  StrctWindow,
  StrctWindowBounds,
  StrctWindowDock,
  StrctSplitter,
  StrctWatermark,
  StrctWizardAside,
  StrctProgress,
  StrctStatusDot,
  StrctCardHeaderLeading,
  StrctCardHeaderMeta,
  StrctWindowDockItem,
  StrctThemeSwitcher,
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
    StrctSplitter,
    StrctWatermark,
    StrctWizardAside,
    StrctProgress,
    StrctSectionHeader,
    StrctSectionHeaderMeta,
    StrctSectionHeaderActions,
    StrctDropdownItemAction,
    StrctMediaFrame,
    StrctResizeHandle,
    StrctWindow,
    StrctWindowDock,
    StrctStatusDot,
    StrctCardHeaderLeading,
    StrctCardHeaderMeta,
    StrctWindowDockItem,
    StrctThemeSwitcher,
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

      <div class="ph-pane">
        <strct-page-header size="pane" [level]="2" title="Network" subtitle="2 adapters · 1 bond">
          <button strct-button strctPageHeaderActions size="sm" variant="neutral">Edit</button>
        </strct-page-header>
        <p class="strct-text-muted" style="margin: 10px 0 0; font-size: 13px">
          size="pane" is the header a side pane or a dialog section wants: an 18px title on one row
          with its actions, and no divider by default.
        </p>
      </div>
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
      anchor="card-fill"
      owner="card"
      heading="A row of cards, one line of actions"
      description="fill makes the card a column inside the height its grid cell already gives it: the block takes the slack and the footer sits on the bottom edge, so a row of cards has its Open buttons on one line instead of four heights. The header can carry a real heading element (level), wrap a long title instead of ellipsising it, and take a leading slot — a drag grip, a status dot — before the title."
      code='<strct-card fill>&#10;  <strct-card-header heading="Host Update Manager" [level]="3" wrap>&#10;    <span strctCardHeaderLeading>⠿</span>&#10;    <strct-badge strctCardHeaderMeta status="success">Healthy</strct-badge>&#10;  </strct-card-header>&#10;  <strct-card-block>…</strct-card-block>&#10;  <strct-card-footer><button strct-button size="sm">Open</button></strct-card-footer>&#10;</strct-card>'
    >
      <div class="fill-cards">
        @for (c of fillCards; track c.heading) {
          <strct-card fill>
            <strct-card-header [heading]="c.heading" [level]="3" wrap>
              <strct-status-dot strctCardHeaderLeading [status]="c.tone" />
              <strct-badge strctCardHeaderMeta [status]="c.tone">{{ c.state }}</strct-badge>
            </strct-card-header>
            <strct-card-block>{{ c.body }}</strct-card-block>
            <strct-card-footer>
              <button strct-button size="sm" variant="flat">Open</button>
            </strct-card-footer>
          </strct-card>
        }
      </div>
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
      anchor="accordion-quiet"
      owner="accordion"
      heading="A quiet fold"
      description='“How this works” is a quiet fold in running text — a one-line, link-looking summary that opens in place — not a boxed accordion. appearance="quiet" drops the border and background and indents the body, while keeping the button + region semantics that 17 raw <details> folds in the audited app never had.'
      code='<strct-accordion-panel appearance="quiet" heading="How backup works">…</strct-accordion-panel>'
    >
      <div style="max-width: 560px; width: 100%;">
        <p style="margin: 0 0 6px; font-size: 13px; color: var(--t2);">
          Backups run nightly and are kept for 30 days.
        </p>
        <strct-accordion-panel appearance="quiet" heading="How backup works">
          A full copy is taken on Sunday and incremental copies on the other nights. Restores read
          the last full copy plus every increment since.
        </strct-accordion-panel>
        <strct-accordion-panel appearance="quiet" heading="Where backups are stored">
          On the appliance's own volume, and on any target you add under Backup targets.
        </strct-accordion-panel>
      </div>
    </app-demo>

    <app-demo
      anchor="media-frame"
      heading="Media frame"
      description="A live picture — a console thumbnail, a camera — sits in a fixed-ratio frame, and when there is no picture yet, or none at all, the frame says why in its own small space: an empty state is too large for a 240px card. state covers content, loading, empty, off and error; a screen that is off goes black, because that reads as a screen. interactive makes the whole frame one tab stop, so the thumbnail is the button that opens the console. fit says what a picture does with a frame it does not match: cover crops to fill, contain shows all of it — what a console thumbnail needs, since the corner cover would crop is where the error is."
      code='<strct-media-frame ratio="4 / 3" state="off" message="The VM is off" interactive (activated)="openConsole()" />'
    >
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        @for (f of mediaFrames; track f.state) {
          <div style="width: 200px;">
            <strct-media-frame
              [state]="f.state"
              [message]="f.message"
              interactive
              activateLabel="Open the console"
              (activated)="frameEcho.set(f.state)"
            />
            <span style="font-size: 12px; color: var(--t3);">{{ f.state }}</span>
          </div>
        }
      </div>
      <span class="echo">{{ frameEcho() ? 'opened: ' + frameEcho() : 'click a frame' }}</span>

      <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 18px">
        @for (fit of ['cover', 'contain']; track fit) {
          <div style="width: 200px">
            <strct-media-frame ratio="4 / 3" [fit]="$any(fit)">
              <img
                alt=""
                src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='120'%3E%3Crect width='320' height='120' fill='%23204a6b'/%3E%3Ctext x='8' y='26' fill='%23fff' font-family='monospace' font-size='16'%3EAPP01 login:%3C/text%3E%3Ctext x='250' y='110' fill='%23ff8080' font-family='monospace' font-size='13'%3EERR 7%3C/text%3E%3C/svg%3E"
              />
            </strct-media-frame>
            <span style="font-size: 12px; color: var(--t3)">fit="{{ fit }}"</span>
          </div>
        }
      </div>
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
      anchor="section-header"
      heading="Section header"
      description="A page is made of titled sections, and a section title is a heading at the right level. strct-page-header is the page's h1 and strct-card-header needs a card; this is the piece between them. level sets the element (h2–h6) and appearance sets the look, so the document outline stays right whatever the section is styled like. Meta follows the heading on its line; actions go to the end and wrap under it when narrow."
      code='<strct-section-header heading="Proxy" description="How the appliance reaches the internet." [level]="3">&#10;  <strct-badge strctSectionHeaderMeta status="success">Tested</strct-badge>&#10;  <button strct-button strctSectionHeaderActions size="sm" variant="outline">Edit proxy…</button>&#10;</strct-section-header>'
    >
      <div class="stack" style="width: 100%; max-width: 560px;">
        <strct-section-header
          heading="Proxy"
          description="How the appliance reaches the internet."
          [level]="3"
        >
          <strct-badge strctSectionHeaderMeta status="success">Tested</strct-badge>
          <button strct-button strctSectionHeaderActions size="sm" variant="outline">
            Edit proxy…
          </button>
        </strct-section-header>
        <strct-section-header heading="Certificates" appearance="overline" [level]="3" divider />
        <strct-section-header
          heading="Retention"
          description="Older snapshots are removed first."
          appearance="overline"
          [level]="4"
        >
          <strct-badge strctSectionHeaderMeta>12 kept</strct-badge>
        </strct-section-header>
      </div>
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
      anchor="tree-framed"
      owner="tree"
      heading="A framed picker"
      description="A tree used as a picker inside a dialog sits in a frame and scrolls inside it — a destination-folder field, for instance. framed draws the surface from tokens (so it follows the theme instead of hard-coding a dark fallback) and maxHeight bounds it in px; arrow-key navigation scrolls the focused node into view inside the frame."
      code='<strct-tree [nodes]="folders" framed [maxHeight]="220" />'
    >
      <div style="max-width: 320px; width: 100%;">
        <strct-tree [nodes]="inventory" framed [maxHeight]="220" />
      </div>
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
      anchor="tree-dnd"
      owner="tree"
      heading="Drag and drop"
      description="The tree owns the gesture; you own the rule. canDrag says which nodes can be picked up (none by default), canDrop is asked during dragover with BOTH nodes — the browser will not let dragover read the drag's data, which is the part a consumer cannot do from outside — and (nodeDrop) fires only for a target canDrop accepted. Dropping a node on itself or into its own subtree is refused whatever canDrop says, so a folder cannot be moved into its own subfolder. Drag a VM onto a folder or a host: the source dims, an accepting row is outlined, a refusing one keeps the browser's not-allowed cursor, and hovering a collapsed folder for 700ms opens it so an unseen target can be reached."
      code='<strct-tree [nodes]="nodes()" [canDrag]="canDrag" [canDrop]="canDrop" (nodeDrop)="move($event)" />'
    >
      <div class="stack">
        <strct-tree
          style="width: 100%; max-width: 340px;"
          [nodes]="dndNodes()"
          [canDrag]="dndCanDrag"
          [canDrop]="dndCanDrop"
          (nodeDrop)="onNodeDrop($event)"
        />
        <span class="echo">{{ dndLog() || 'Drag a VM onto a folder or a host.' }}</span>
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
      anchor="window"
      heading="Window"
      description='Some work lives in a window beside the page: a VM console stays open while the operator browses. It can be moved (by the title bar, or Alt+arrows on it), resized from a focusable corner grip (arrows 16px, Shift+arrows 64px), minimised to a dock and brought back from it — and it does not block the page, because a modal does that and a drawer is pinned to an edge. icon puts a mark before the heading; labels carries a tooltip per control, for a minimise that means "stays connected"; the title bar is clamped so a window dragged at an edge can always be dragged back; titleDblclick="none" leaves the double-click to the consumer, which a console with a real full screen of its own wants, and (titleDblclicked) still fires. A dock chip can be an <ng-template strctWindowDockItem> — a status dot, a count — and restoreMode="request" hands the restore to the app, for one open window at a time. closeOnOutside="minimize" sends it to the dock when the operator clicks the page beside it — a window is never dismissed by an outside click, only set aside. It is a role="dialog" with aria-modal="false" on its own --z-window layer between the tour and the modal, so a modal opened from inside a window still comes up over it. Escape minimises rather than closes, since a window is not dismissed. palette="dark" forces the dark scheme inside while keeping your palette — what a console wants.'
      code='<strct-window [(open)]="open" [(minimized)]="min" heading="APP01" palette="dark">…</strct-window>&#10;<strct-window-dock />'
    >
      <div class="stack" style="width: 100%;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <button strct-button variant="primary" (click)="consoleOpen.set(true)">
            Open console
          </button>
          <button
            strct-button
            size="sm"
            variant="neutral"
            [attr.aria-pressed]="dismissOutside()"
            (click)="dismissOutside.set(!dismissOutside())"
          >
            closeOnOutside: {{ dismissOutside() ? 'minimize' : 'none' }}
          </button>
          <strct-window-dock>
            <ng-template strctWindowDockItem let-w>
              <strct-status-dot status="success" size="sm" />
              {{ w.heading() }}
            </ng-template>
          </strct-window-dock>
        </div>
        <strct-window
          [(open)]="consoleOpen"
          [(minimized)]="consoleMin"
          [(bounds)]="consoleBounds"
          heading="APP01 · console"
          icon="monitor"
          palette="dark"
          titleDblclick="none"
          [labels]="windowLabels"
          [closeOnOutside]="dismissOutside() ? 'minimize' : 'none'"
          (titleDblclicked)="windowEcho.set('the console answers the double-click itself')"
          [minWidth]="360"
          [minHeight]="240"
          (closed)="windowEcho.set('closed')"
        >
          <strct-badge strctWindowTitleMeta status="success">Running</strct-badge>
          <div
            style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 160px; background: #000; color: rgba(255,255,255,0.6); font-family: var(--mono); font-size: 12px;"
          >
            APP01 login:
          </div>
          <span strctWindowStatus>Connected · 1920×1080 · US keyboard</span>
        </strct-window>
        <span class="echo">
          {{
            consoleOpen()
              ? consoleMin()
                ? 'minimised — restore it from the dock'
                : 'open at ' + consoleBounds()!.x + ', ' + consoleBounds()!.y
              : windowEcho() || 'the window is closed'
          }}
        </span>
      </div>
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
      anchor="dropdown-select"
      owner="dropdown"
      heading="Select-like menu"
      description="Bind [selected] and items become menuitemradio entries: a leading check marks the current choice, reopening focuses it, and arrows/Enter work end to end. A click on the menu's padding or a divider no longer closes it — only a real pick does."
      code='<strct-dropdown-item [selected]="sort === opt" (click)="sort = opt">…</strct-dropdown-item>'
    >
      <strct-dropdown>
        <button strct-button strctDropdownTrigger>
          Sort: {{ ddSort() }}
          <strct-icon strictName="chevronDown" [size]="13" />
        </button>
        @for (opt of ddSortOptions; track opt) {
          <strct-dropdown-item [selected]="ddSort() === opt" (click)="ddSort.set(opt)">
            {{ opt }}
          </strct-dropdown-item>
        }
      </strct-dropdown>
    </app-demo>

    <app-demo
      anchor="dropdown-item-action"
      owner="dropdown"
      heading="A second action on a menu item"
      description="A saved item in a menu can be removed from the menu: the row opens the view, the × deletes it. [strctDropdownItemAction] renders at the item's end and keeps its click to itself — the item is not activated and the menu stays open — while staying out of the Tab order: the right arrow reaches it from its item, the left arrow returns, and Delete on the item triggers it, as the WAI-ARIA pattern for a secondary action does."
      code='<strct-dropdown-item (click)="open(v)"> … <button strctDropdownItemAction strct-button variant="flat" size="mini" iconOnly aria-label="Delete view" (click)="remove(v)">×</button></strct-dropdown-item>'
    >
      <div class="stack">
        <strct-dropdown>
          <button strct-button strctDropdownTrigger>
            Saved views
            <strct-icon strictName="chevronDown" [size]="13" />
          </button>
          @for (v of savedViews(); track v) {
            <strct-dropdown-item (click)="viewEcho.set('opened ' + v)">
              {{ v }}
              <button
                strctDropdownItemAction
                strct-button
                variant="flat"
                size="mini"
                iconOnly
                [attr.aria-label]="'Delete ' + v"
                (click)="removeView(v)"
              >
                <strct-icon strictName="close" [size]="12" />
              </button>
            </strct-dropdown-item>
          } @empty {
            <strct-dropdown-item disabled hint="Save a view from the monitor toolbar.">
              No saved views
            </strct-dropdown-item>
          }
        </strct-dropdown>
        <span class="echo">{{ viewEcho() || 'open the menu, then try × or Delete' }}</span>
      </div>
    </app-demo>

    <app-demo
      anchor="dropdown-popover"
      owner="dropdown"
      heading="Popover mode — filter / settings panels"
      description="With popover, the panel holds form controls: inner clicks never close it (only outside click / Escape), and it announces as a labeled dialog instead of a menu. A menu's rows are roved with the arrow keys and stay out of the Tab order; a panel's rows are controls in their own right, so focusable gives them a real tab stop — without it a strct-theme-switcher in a user menu cannot be reached from the keyboard at all. The switcher itself takes tone=“surface” there, because the header's foreground is invisible on a raised one."
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

      <strct-dropdown popover popoverLabel="Account" focusable align="end">
        <button strct-button strctDropdownTrigger>
          <strct-icon name="user" [size]="13" />
          Ada Lovelace
        </button>
        <strct-dropdown-item>Profile</strct-dropdown-item>
        <strct-dropdown-item>Audit log</strct-dropdown-item>
        <div style="padding: 6px 4px">
          <strct-theme-switcher tone="surface" />
        </div>
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
      anchor="wizard-vertical"
      owner="wizard"
      heading="Vertical wizard"
      description="vertical turns the steps into a left rail: dashed-ring states (idle / active / done), a progress bar with an n/N counter, click-back navigation to visited steps, and an optional live-summary column via strctWizardAside. Resize the panel — the rail collapses to a compact vertical ring column, never a horizontal strip."
      code='<strct-wizard vertical title="Create VM"><strct-step label="Identity" description="Name, environment">…</strct-step><aside strctWizardAside>…</aside></strct-wizard>'
    >
      <strct-wizard
        vertical
        style="width: 100%;"
        title="Create virtual machine"
        [(current)]="vwStep"
        (finished)="vwDone.set(true)"
      >
        <strct-step label="Identity" description="Name, environment, owner">
          <div class="vw-fields">
            <label class="vw-f"
              ><span>Machine name</span><input strctInput value="ist-prod-sql-07"
            /></label>
            <label class="vw-f"
              ><span>Environment</span><input strctInput value="Production"
            /></label>
          </div>
        </strct-step>
        <strct-step label="Placement" description="Cluster and template">
          <div class="vw-fields">
            <label class="vw-f"><span>Cluster</span><input strctInput value="PROD-IST-01" /></label>
            <label class="vw-f"
              ><span>Template</span><input strctInput value="tpl-win2022-sql-hardened"
            /></label>
          </div>
        </strct-step>
        <strct-step label="Resources" description="CPU and memory">
          <div class="vw-fields">
            <label class="vw-f"><span>vCPU</span><input strctInput value="8" /></label>
            <label class="vw-f"><span>Memory (GiB)</span><input strctInput value="32" /></label>
          </div>
        </strct-step>
        <strct-step label="Review" description="Apply on finish">
          Review the live summary, then Finish.
          @if (vwDone()) {
            <strct-badge status="success" style="margin-inline-start: 8px;">Queued</strct-badge>
          }
        </strct-step>
        <aside strctWizardAside class="vw-aside">
          <div class="vw-aside__h">Live summary</div>
          <div class="vw-kv"><span>Machine</span><b>ist-prod-sql-07</b></div>
          <div class="vw-kv"><span>Cluster</span><b>PROD-IST-01</b></div>
          <div class="vw-kv"><span>vCPU / Mem</span><b>8 / 32 GiB</b></div>
          <div class="vw-aside__h" style="margin-top: 14px;">Cluster impact</div>
          <div class="vw-meter">
            <span>CPU</span><strct-progress [value]="68" style="flex: 1;" />
          </div>
          <div class="vw-meter">
            <span>Memory</span><strct-progress [value]="63" style="flex: 1;" />
          </div>
        </aside>
      </strct-wizard>
    </app-demo>

    <app-demo
      anchor="wizard-dialog"
      owner="wizard"
      heading="Wizard as the dialog"
      description="The natural composition: strct-modal chromeless hosting a flush vertical wizard — the rail reaches the dialog edges and the wizard's own footer is the dialog footer. The dialog sizes to the wizard, whose content column has a guaranteed minimum (--strct-wiz-content-min): toggle the aside below and the form keeps the exact same width — the aside grows the dialog instead of squeezing the form. Keep cancelable: the head's X is gone."
      code='<strct-modal chromeless [(open)]="open"><strct-wizard vertical flush cancelable title="Create VM" (cancelled)="open = false">…</strct-wizard></strct-modal>'
    >
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <button strct-button variant="primary" (click)="wdOpen.set(true)">
          Open wizard dialog
        </button>
        <strct-checkbox [ngModel]="wdAside()" (ngModelChange)="wdAside.set($event)"
          >With summary aside</strct-checkbox
        >
      </div>
      <strct-modal
        [open]="wdOpen()"
        (openChange)="wdOpen.set($event)"
        chromeless
        title="Create virtual machine"
        panelClass="demo-wiz-dialog"
      >
        <strct-wizard
          vertical
          flush
          cancelable
          title="Create virtual machine"
          (cancelled)="wdOpen.set(false)"
          (finished)="wdOpen.set(false)"
        >
          <strct-step label="Identity" description="Name, environment">
            <div class="vw-fields">
              <label class="vw-f"
                ><span>Machine name</span><input strctInput value="ist-prod-sql-07"
              /></label>
              <label class="vw-f"
                ><span>Environment</span><input strctInput value="Production"
              /></label>
            </div>
          </strct-step>
          <strct-step label="Placement" description="Cluster and template">
            <div class="vw-fields">
              <label class="vw-f"
                ><span>Cluster</span><input strctInput value="PROD-IST-01"
              /></label>
            </div>
          </strct-step>
          <strct-step label="Review" description="Apply on finish"
            >Finish queues the create task.</strct-step
          >
          @if (wdAside()) {
            <aside strctWizardAside>
              <div class="vw-aside__h">Live summary</div>
              <div class="vw-kv"><span>Machine</span><b>ist-prod-sql-07</b></div>
              <div class="vw-kv"><span>Cluster</span><b>PROD-IST-01</b></div>
            </aside>
          }
        </strct-wizard>
      </strct-modal>
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

    <app-demo
      anchor="splitter"
      heading="Splitter"
      description="Two resizable panes with a draggable gutter — master/detail where the split is the user's to own. The gutter is a keyboard separator: arrows nudge, Home/End jump to the bounds. Persist [(split)] with your other preferences."
      code='<strct-splitter [(split)]="pct"><div strctPaneStart>…</div><div strctPaneEnd>…</div></strct-splitter>'
    >
      <div style="width: 100%;">
        <strct-splitter
          [(split)]="splitPct"
          [min]="20"
          [max]="80"
          style="height: 180px; border: 1px solid var(--b2); border-radius: 9px;"
        >
          <div strctPaneStart style="padding: 12px; font-size: 12.5px; color: var(--t2);">
            VM list ({{ splitPct() }}%)
          </div>
          <div strctPaneEnd style="padding: 12px; font-size: 12.5px; color: var(--t2);">
            Selected VM detail
          </div>
        </strct-splitter>
      </div>
    </app-demo>

    <app-demo
      anchor="splitter-px"
      owner="splitter"
      heading="Pixels, bounds and a collapsible pane"
      description='A sidebar is 280px, not 22%. unit="px" sizes and drags the first pane in pixels, minSize / maxSize bound it in the same unit, and collapsible lets Enter on the gutter fold the pane away and bring it back — the gutter says so with aria-expanded. Percent mode is unchanged. For a layout the splitter does not own — a shell grid, a docked panel — [strctResizeHandle] is the same gutter on its own: it draws the grip, carries role="separator" with its value and bounds, steps with the arrows (four times with Shift), jumps with Home and End, and leaves the size to you.'
      code='<strct-splitter unit="px" [(split)]="sidebar" [minSize]="200" [maxSize]="480" collapsible />'
    >
      <div class="stack" style="width: 100%; gap: 18px;">
        <strct-splitter
          unit="px"
          [(split)]="sidebarPx"
          [minSize]="180"
          [maxSize]="420"
          collapsible
          [(collapsed)]="sidebarCollapsed"
          style="height: 160px; border: 1px solid var(--b2); border-radius: var(--radius-md);"
        >
          <div strctPaneStart style="padding: 10px; font-size: 12px; color: var(--t3);">
            {{ sidebarCollapsed() ? '' : 'Sidebar · ' + sidebarPx() + 'px' }}
          </div>
          <div strctPaneEnd style="padding: 10px; font-size: 12px; color: var(--t3);">
            Content — drag or focus the gutter and press the arrows; Enter collapses.
          </div>
        </strct-splitter>

        <div
          style="display: flex; flex-direction: column; border: 1px solid var(--b2); border-radius: var(--radius-md); overflow: hidden;"
        >
          <div style="flex: 1; padding: 10px; font-size: 12px; color: var(--t3);">
            A layout the splitter does not own
          </div>
          <div
            [strctResizeHandle]="'y'"
            [(size)]="panelHeight"
            [min]="80"
            [max]="260"
            side="after"
            aria-label="Resize the task panel"
          ></div>
          <div
            [style.height.px]="panelHeight()"
            style="padding: 10px; font-size: 12px; color: var(--t3); background: var(--bg-1);"
          >
            Task panel · {{ panelHeight() }}px
          </div>
        </div>
      </div>
    </app-demo>

    <app-demo
      anchor="watermark"
      heading="Watermark"
      description="A pointer-transparent repeating text overlay for compliance consoles — content stays fully interactive and selectable. Stamp who/when for screenshot traceability."
      code='<strct-watermark text="CONFIDENTIAL · serkan@corp">…page…</strct-watermark>'
    >
      <strct-watermark text="CONFIDENTIAL · serkan@corp" style="width: 100%;">
        <div
          style="height: 140px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--b2); border-radius: 9px; color: var(--t2); font-size: 12.5px;"
        >
          A classified inventory table would render here — try selecting this text.
        </div>
      </strct-watermark>
    </app-demo>
  `,
  styles: [
    `
      .fill-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: var(--space-3);
        align-items: stretch;
        width: 100%;
        max-width: 760px;
      }
      .ph-pane {
        margin-top: 22px;
        max-width: 340px;
        padding: var(--space-3);
        background: var(--bg-1);
        border: 1px solid var(--b1);
        border-radius: var(--r2);
      }
      .demo-wiz-dialog {
        height: min(520px, calc(100vh - 96px));
      }
      .vw-fields {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 260px));
        gap: 12px;
      }
      .vw-f {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 12px;
        color: var(--t2);
      }
      .vw-aside {
        display: block;
        padding: 16px;
      }
      .vw-aside__h {
        font-size: 10px;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: var(--t3);
        font-weight: 600;
        margin-bottom: 8px;
      }
      .vw-kv {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 4px 0;
        font-size: 12px;
        color: var(--t2);
      }
      .vw-kv b {
        font-family: var(--mono);
        font-size: 11.5px;
        font-weight: 500;
        color: var(--t1);
      }
      .vw-meter {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11.5px;
        color: var(--t2);
        margin-bottom: 8px;
      }
    `,
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
  // FR-48-33 — a console that stays open beside the page.
  protected readonly consoleOpen = signal(false);
  protected readonly consoleMin = signal(false);
  /** Whether the console minimises when the operator clicks the page beside it. */
  protected readonly dismissOutside = signal(true);
  /** A tooltip per control: the console's minimise keeps the session. */
  protected readonly windowLabels = {
    minimizeHint: 'Minimise — the session stays connected',
    closeHint: 'Close — the session ends',
  };

  /** Deliberately uneven, so `fill` has something to prove. */
  protected readonly fillCards = [
    {
      heading: 'Host Update Manager',
      state: 'Healthy',
      tone: 'success' as const,
      body: 'All 12 hosts are on the current baseline.',
    },
    {
      heading: 'Certificates',
      state: 'Attention',
      tone: 'warning' as const,
      body: 'Two certificates expire within 30 days, and one of them is the one the console itself presents to browsers on the management network.',
    },
    {
      heading: 'Backups',
      state: 'Healthy',
      tone: 'success' as const,
      body: 'Last run 03:15.',
    },
  ];
  protected readonly consoleBounds = signal<StrctWindowBounds | null>({
    x: 120,
    y: 140,
    width: 560,
    height: 360,
  });
  protected readonly windowEcho = signal('');

  // FR-48-35 — a sidebar in pixels, and a handle the splitter does not own.
  protected readonly sidebarPx = signal(240);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly panelHeight = signal(120);

  // FR-48-34 — the states a console thumbnail goes through.
  protected readonly mediaFrames: {
    state: 'content' | 'loading' | 'empty' | 'off' | 'error';
    message: string;
  }[] = [
    { state: 'loading', message: 'Connecting…' },
    { state: 'empty', message: 'No screenshot yet' },
    { state: 'off', message: 'The VM is off' },
    { state: 'error', message: 'Console unavailable' },
  ];
  protected readonly frameEcho = signal('');

  // FR-48-11 — the row opens the view, the × removes it.
  protected readonly savedViews = signal(['CPU pressure', 'Storage latency', 'Network drops']);
  protected readonly viewEcho = signal('');
  protected removeView(name: string): void {
    this.savedViews.update((v) => v.filter((x) => x !== name));
    this.viewEcho.set('deleted ' + name);
  }

  protected readonly ddSort = signal('Name');
  protected readonly ddSortOptions = ['Name', 'CPU usage', 'Memory', 'Uptime'];

  protected readonly vwStep = signal(0);
  protected readonly wdOpen = signal(false);
  protected readonly wdAside = signal(true);
  protected readonly vwDone = signal(false);

  protected readonly splitPct = signal(40);

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

  // Drag-and-drop demo: only VMs move, and only onto a folder or a host.
  protected readonly dndNodes = signal<StrctTreeNodeData[]>([
    {
      id: 'dc',
      label: 'Datacenter-01',
      icon: 'datacenter',
      expanded: true,
      children: [
        {
          id: 'prod',
          label: 'Production',
          icon: 'folder',
          expanded: true,
          children: [
            { id: 'vm-a', label: 'web-vm-01', icon: 'vm', badge: 'success' },
            { id: 'vm-b', label: 'sql-vm-02', icon: 'vm', badge: 'success' },
          ],
        },
        { id: 'staging', label: 'Staging', icon: 'folder', children: [] },
        { id: 'hv-07', label: 'hv-07', icon: 'host', badge: 'success', children: [] },
      ],
    },
  ]);
  protected readonly dndLog = signal('');
  protected readonly dndCanDrag = (node: StrctTreeNodeData): boolean => node.icon === 'vm';
  protected readonly dndCanDrop = (
    _source: StrctTreeNodeData,
    target: StrctTreeNodeData,
  ): boolean => target.icon === 'folder' || target.icon === 'host';

  /** Moving things around is the consumer's business — the tree only reports it. */
  protected onNodeDrop(event: StrctTreeDropEvent): void {
    const move = (list: StrctTreeNodeData[]): StrctTreeNodeData[] =>
      list
        .filter((n) => n.id !== event.source.id)
        .map((n) => {
          const children = move(n.children ?? []);
          if (n.id === event.target.id)
            return { ...n, expanded: true, children: [...children, event.source] };
          return n.children ? { ...n, children } : n;
        });
    this.dndNodes.update((roots) => move(roots));
    this.dndLog.set(`Moved ${event.source.label} into ${event.target.label}`);
  }

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
