import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  StrctBreadcrumb,
  StrctBreadcrumbItem,
  StrctPagination,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-navigation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, DemoBlock, StrctBreadcrumb, StrctBreadcrumbItem, StrctPagination],
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
      code="<strct-pagination [total]=&quot;240&quot; [pageSize]=&quot;20&quot; [(page)]=&quot;page&quot; />"
    >
      <div class="stack">
        <strct-pagination [total]="60" [pageSize]="10" [(page)]="pageA" />
        <strct-pagination [total]="240" [pageSize]="20" [(page)]="pageB" />
        <span class="echo">small set page: {{ pageA() }} · large set page: {{ pageB() }}</span>
      </div>
    </app-demo>
  `,
  styles: [
    `
    .stack { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
    .echo { font-size: 12px; color: var(--t2); font-family: var(--mono); }
    `,
  ],
})
export class NavigationPage {
  protected readonly pageA = signal(1);
  protected readonly pageB = signal(5);
}
