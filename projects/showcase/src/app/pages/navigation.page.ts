import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctBreadcrumb,
  StrctBreadcrumbItem,
  StrctMenuSection,
  StrctPagination,
  StrctRail,
  StrctRailItem,
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
    StrctPagination,
    StrctRail,
    StrctSectionMenu,
    StrctToggle,
  ],
  template: `
    <app-page-header title="Navigation" subtitle="Wayfinding and paging controls." />

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
      description="Collapsible, data-driven primary navigation. Toggle the foot control to collapse to icons — badges become dots and labels become tooltips."
      code='<strct-rail [items]="items" [(activeId)]="section" [(collapsed)]="off" />'
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
      description="A two-level category / item menu (not a tree). Toggle collapsible and icons to see the configurations."
      code='<strct-section-menu [sections]="nav" [(activeId)]="active" [collapsible]="true" [showIcons]="true" />'
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
  protected readonly pageA = signal(1);
  protected readonly pageB = signal(5);

  protected readonly section = signal('hosts');
  protected readonly railOff = signal(false);
  protected readonly railItems: StrctRailItem[] = [
    { id: 'overview', label: 'Overview', icon: 'datacenter' },
    { id: 'hosts', label: 'Hosts', icon: 'host', badge: 24 },
    { id: 'vms', label: 'Virtual machines', icon: 'vm', badge: 112 },
    { id: 'storage', label: 'Storage', icon: 'storage', badge: 3, badgeStatus: 'warning' },
    { id: 'network', label: 'Networking', icon: 'network' },
    { id: 'alerts', label: 'Alerts', icon: 'alarm', badge: 2, badgeStatus: 'critical' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  protected readonly menuActive = signal('hosts');
  protected readonly menuCollapsible = signal(true);
  protected readonly menuIcons = signal(true);
  protected readonly menuSections: StrctMenuSection[] = [
    {
      label: 'Compute',
      icon: 'cpu',
      items: [
        { id: 'hosts', label: 'Hosts', icon: 'host' },
        { id: 'vms', label: 'Virtual machines', icon: 'vm' },
        { id: 'clusters', label: 'Clusters', icon: 'cluster' },
      ],
    },
    {
      label: 'Storage',
      icon: 'storage',
      items: [
        { id: 'volumes', label: 'Volumes', icon: 'disk' },
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
