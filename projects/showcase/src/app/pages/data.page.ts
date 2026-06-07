import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctBadge,
  StrctBadgeStatus,
  StrctButton,
  StrctCellDef,
  StrctCheckbox,
  StrctColumn,
  StrctDatagrid,
  StrctDatagridActionBar,
  StrctDatagridColumn,
  StrctIcon,
  StrctRow,
  StrctRowDetailDef,
  StrctStack,
  StrctStackItem,
  StrctTable,
  StrctTimeline,
  StrctTimelineItem,
} from 'strct';
import { DemoBlock, PageHeader } from '../ui/demo';

@Component({
  selector: 'app-data-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeader,
    DemoBlock,
    FormsModule,
    StrctTable,
    StrctDatagrid,
    StrctRowDetailDef,
    StrctDatagridActionBar,
    StrctCellDef,
    StrctBadge,
    StrctIcon,
    StrctButton,
    StrctCheckbox,
    StrctTimeline,
    StrctTimelineItem,
    StrctStack,
    StrctStackItem,
  ],
  template: `
    <app-page-header title="Data" subtitle="Declarative, token-styled data display." />

    <app-demo
      anchor="table"
      heading="Table"
      description="Driven by columns and rows inputs, with optional striped and hover styling. Cluster rows as an example."
      code='<strct-table [columns]="cols" [rows]="rows" striped hover />'
    >
      <strct-table style="width: 100%;" [columns]="cols" [rows]="rows" striped hover />
    </app-demo>

    <app-demo
      anchor="datagrid"
      heading="Datagrid"
      description="Sortable columns, row selection, expandable detail rows, a batch action bar, paging, resizable columns and a column chooser. Populated with cluster rows; status renders as a badge."
      code='<strct-datagrid [columns]="cols" [rows]="rows" rowId="name" selectable expandable>&#10;  <ng-template strctCell="status" let-value="value">…</ng-template>&#10;</strct-datagrid>'
    >
      <div class="dg-wrap">
        <strct-checkbox [ngModel]="dense()" (ngModelChange)="dense.set($event)"
          >Compact</strct-checkbox
        >

        <strct-datagrid
          style="width: 100%;"
          [columns]="dgCols"
          [rows]="dgRows"
          rowId="name"
          selectable
          expandable
          resizable
          columnChooser
          sync
          [footerActionsDisabled]="refreshing()"
          (syncChange)="onRefresh()"
          [compact]="dense()"
          [pageSize]="5"
        >
          <ng-template strctCell="status" let-value="value">
            <strct-badge [status]="badgeFor(value)">{{ value }}</strct-badge>
          </ng-template>
          <div strctDatagridActionBar>
            <button strct-button variant="primary" size="sm">
              <strct-icon name="upload" [size]="14" /> Add host
            </button>
            <button strct-button iconOnly size="sm" aria-label="Export">
              <strct-icon name="download" [size]="14" />
            </button>
          </div>

          <ng-template strctRowDetail let-row>
            <strct-stack style="max-width: 380px;">
              <strct-stack-item label="Cluster">{{ row['name'] }}</strct-stack-item>
              <strct-stack-item label="Type">{{ row['type'] }}</strct-stack-item>
              <strct-stack-item label="Hosts">{{ row['hosts'] }}</strct-stack-item>
              <strct-stack-item label="Status">{{ row['status'] }}</strct-stack-item>
            </strct-stack>
          </ng-template>
        </strct-datagrid>
      </div>
    </app-demo>

    <app-demo
      anchor="detailpane"
      heading="Detail pane"
      description="A different pattern from expandable rows: click the » button to collapse the grid to a single column and open a side pane with that row's details (the » keeps row cells free to select/copy). Click it again or the × to return."
      code='<strct-datagrid [columns]="cols" [rows]="rows" detailPane>…</strct-datagrid>'
    >
      <strct-datagrid
        style="width: 100%;"
        [columns]="dgCols"
        [rows]="dgRows"
        detailPane
        [pageSize]="6"
      >
        <ng-template strctRowDetail let-row>
          <strct-stack style="max-width: 340px;">
            <strct-stack-item label="Cluster">{{ row['name'] }}</strct-stack-item>
            <strct-stack-item label="Type">{{ row['type'] }}</strct-stack-item>
            <strct-stack-item label="Hosts">{{ row['hosts'] }}</strct-stack-item>
            <strct-stack-item label="Status">{{ row['status'] }}</strct-stack-item>
          </strct-stack>
        </ng-template>
      </strct-datagrid>
    </app-demo>

    <app-demo
      anchor="timeline"
      heading="Timeline"
      description="A vertical sequence of events, each with a state."
    >
      <strct-timeline>
        <strct-timeline-item title="Deployed to production" state="success">
          v1.4.0 shipped at 09:24.
        </strct-timeline-item>
        <strct-timeline-item title="Running smoke tests" state="current">
          14 of 20 checks passed.
        </strct-timeline-item>
        <strct-timeline-item title="Awaiting approval" state="warning">
          Needs a second reviewer.
        </strct-timeline-item>
        <strct-timeline-item title="Build queued">
          Scheduled behind 2 other jobs.
        </strct-timeline-item>
      </strct-timeline>
    </app-demo>

    <app-demo
      anchor="stack"
      heading="Stack view"
      description="A read-only key/value definition list."
    >
      <strct-stack style="width: 100%; max-width: 420px;">
        <strct-stack-item label="Service">api-gateway</strct-stack-item>
        <strct-stack-item label="Region">eu-west</strct-stack-item>
        <strct-stack-item label="Replicas">4</strct-stack-item>
        <strct-stack-item label="Status">Running</strct-stack-item>
        <strct-stack-item label="Last deploy">Jun 3, 2026 · 09:24</strct-stack-item>
      </strct-stack>
    </app-demo>
  `,
  styles: [
    `
      .echo {
        font-size: 12px;
        color: var(--t2);
        font-family: var(--mono);
      }
      .dg-wrap {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        align-items: flex-start;
      }
    `,
  ],
})
export class DataPage {
  protected readonly dense = signal(false);
  protected readonly refreshing = signal(false);

  protected onRefresh(): void {
    this.refreshing.set(true);
    setTimeout(() => this.refreshing.set(false), 1500);
  }

  protected badgeFor(status: unknown): StrctBadgeStatus {
    switch (status) {
      case 'Running':
        return 'success';
      case 'Degraded':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  protected readonly cols: StrctColumn[] = [
    { key: 'name', label: 'Cluster' },
    { key: 'type', label: 'Type' },
    { key: 'hosts', label: 'Hosts', align: 'end' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly rows: StrctRow[] = [
    { name: 'Production Cluster', type: 'Failover', hosts: 8, status: 'Running' },
    { name: 'DR Cluster', type: 'Failover', hosts: 4, status: 'Running' },
    { name: 'Edge Cluster', type: 'Standard', hosts: 3, status: 'Degraded' },
    { name: 'Dev Cluster', type: 'Standard', hosts: 2, status: 'Running' },
  ];

  protected readonly dgCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Cluster', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'hosts', label: 'Hosts', sortable: true, align: 'end' },
    { key: 'status', label: 'Status', sortable: true },
  ];

  protected readonly dgRows: StrctRow[] = [
    { name: 'Production Cluster', type: 'Failover', hosts: 8, status: 'Running' },
    { name: 'DR Cluster', type: 'Failover', hosts: 4, status: 'Running' },
    { name: 'Edge Cluster', type: 'Standard', hosts: 3, status: 'Degraded' },
    { name: 'Dev Cluster', type: 'Standard', hosts: 2, status: 'Running' },
    { name: 'Staging Cluster', type: 'Failover', hosts: 3, status: 'Running' },
    { name: 'Backup Cluster', type: 'Standard', hosts: 2, status: 'Idle' },
    { name: 'Analytics Cluster', type: 'Failover', hosts: 6, status: 'Running' },
    { name: 'Test Cluster', type: 'Standard', hosts: 1, status: 'Degraded' },
    { name: 'AI Training Cluster', type: 'Failover', hosts: 12, status: 'Running' },
    { name: 'Observability Cluster', type: 'Standard', hosts: 2, status: 'Running' },
    { name: 'Archive Cluster', type: 'Standard', hosts: 2, status: 'Idle' },
    { name: 'Management Cluster', type: 'Failover', hosts: 4, status: 'Running' },
  ];
}
