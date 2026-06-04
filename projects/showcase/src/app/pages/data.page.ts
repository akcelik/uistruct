import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctButton,
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
      description="Driven by columns and rows inputs, with optional striped and hover styling."
      code="<strct-table [columns]=&quot;cols&quot; [rows]=&quot;rows&quot; striped hover />"
    >
      <strct-table style="width: 100%;" [columns]="cols" [rows]="rows" striped hover />
    </app-demo>

    <app-demo
      anchor="datagrid"
      heading="Datagrid"
      description="Sortable columns, row selection, expandable detail rows, a batch action bar and paging. Sort by a header, tick rows for the action bar, or expand a row with the chevron."
      code="<strct-datagrid [columns]=&quot;cols&quot; [rows]=&quot;rows&quot; selectable expandable [pageSize]=&quot;5&quot;>…</strct-datagrid>"
    >
      <div class="dg-wrap">
        <strct-checkbox [ngModel]="dense()" (ngModelChange)="dense.set($event)">Compact</strct-checkbox>

        <strct-datagrid
          style="width: 100%;"
          [columns]="dgCols"
          [rows]="dgRows"
          selectable
          expandable
          [compact]="dense()"
          [pageSize]="5"
          (selectionChange)="selected.set($event.length)"
        >
          <div strctDatagridActionBar>
            <button strct-button variant="primary" size="sm">
              <strct-icon name="upload" [size]="14" /> Add host
            </button>
            <button strct-button size="sm">
              <strct-icon name="sync" [size]="14" /> Refresh
            </button>
            <button strct-button iconOnly size="sm" aria-label="Export">
              <strct-icon name="download" [size]="14" />
            </button>
          </div>

          <button strct-button strctDatagridActions variant="primary" size="sm">Migrate</button>
          <button strct-button strctDatagridActions variant="danger" size="sm">Decommission</button>

          <ng-template strctRowDetail let-row>
            <strct-stack style="max-width: 380px;">
              <strct-stack-item label="Service">{{ row['name'] }}</strct-stack-item>
              <strct-stack-item label="Region">{{ row['region'] }}</strct-stack-item>
              <strct-stack-item label="Replicas">{{ row['replicas'] }}</strct-stack-item>
              <strct-stack-item label="Status">{{ row['status'] }}</strct-stack-item>
            </strct-stack>
          </ng-template>
        </strct-datagrid>

        <span class="echo">{{ selected() }} row(s) selected</span>
      </div>
    </app-demo>

    <app-demo
      anchor="detailpane"
      heading="Detail pane"
      description="A different pattern from expandable rows: click the » button to collapse the grid to a single column and open a side pane with that row's details (the » keeps row cells free to select/copy). Click it again or the × to return."
      code="<strct-datagrid [columns]=&quot;cols&quot; [rows]=&quot;rows&quot; detailPane>…</strct-datagrid>"
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
            <strct-stack-item label="Service">{{ row['name'] }}</strct-stack-item>
            <strct-stack-item label="Region">{{ row['region'] }}</strct-stack-item>
            <strct-stack-item label="Replicas">{{ row['replicas'] }}</strct-stack-item>
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
    .echo { font-size: 12px; color: var(--t2); font-family: var(--mono); }
    .dg-wrap { display: flex; flex-direction: column; gap: 12px; width: 100%; align-items: flex-start; }
    `,
  ],
})
export class DataPage {
  protected readonly selected = signal(0);
  protected readonly dense = signal(false);

  protected readonly cols: StrctColumn[] = [
    { key: 'name', label: 'Service' },
    { key: 'region', label: 'Region' },
    { key: 'replicas', label: 'Replicas', align: 'end' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly rows: StrctRow[] = [
    { name: 'api-gateway', region: 'eu-west', replicas: 4, status: 'Running' },
    { name: 'auth-service', region: 'us-east', replicas: 3, status: 'Running' },
    { name: 'billing-worker', region: 'eu-west', replicas: 2, status: 'Degraded' },
    { name: 'search-index', region: 'apac', replicas: 6, status: 'Running' },
  ];

  protected readonly dgCols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Service', sortable: true },
    { key: 'region', label: 'Region', sortable: true },
    { key: 'replicas', label: 'Replicas', sortable: true, align: 'end' },
    { key: 'status', label: 'Status', sortable: true },
  ];

  protected readonly dgRows: StrctRow[] = [
    { name: 'api-gateway', region: 'eu-west', replicas: 4, status: 'Running' },
    { name: 'auth-service', region: 'us-east', replicas: 3, status: 'Running' },
    { name: 'billing-worker', region: 'eu-west', replicas: 2, status: 'Degraded' },
    { name: 'search-index', region: 'apac', replicas: 6, status: 'Running' },
    { name: 'cache-redis', region: 'us-east', replicas: 5, status: 'Running' },
    { name: 'mailer', region: 'eu-west', replicas: 1, status: 'Idle' },
    { name: 'metrics-agent', region: 'apac', replicas: 8, status: 'Running' },
    { name: 'cron-runner', region: 'us-west', replicas: 1, status: 'Degraded' },
    { name: 'image-resizer', region: 'eu-central', replicas: 3, status: 'Running' },
    { name: 'webhook-relay', region: 'apac', replicas: 2, status: 'Running' },
    { name: 'pdf-export', region: 'us-east', replicas: 2, status: 'Idle' },
    { name: 'audit-log', region: 'eu-west', replicas: 4, status: 'Running' },
  ];
}
