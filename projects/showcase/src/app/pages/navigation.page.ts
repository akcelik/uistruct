import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  StrctBreadcrumb,
  StrctBreadcrumbItem,
  StrctPagination,
  StrctRail,
  StrctRailItem,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-navigation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    StrctBreadcrumb,
    StrctBreadcrumbItem,
    StrctPagination,
    StrctRail,
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
}
