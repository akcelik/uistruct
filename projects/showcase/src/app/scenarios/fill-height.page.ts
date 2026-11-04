import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  StrctDatagrid,
  StrctDatagridColumn,
  StrctRow,
  StrctRowDetailDef,
  StrctStack,
  StrctStackItem,
} from 'strct';

/**
 * Scenario: FR-69-02 — a grid that takes the height left in its pane.
 *
 * Every case the ask's acceptance names is on this one page, because a gate
 * can only read what a page renders. `#fill-tall` is the ordinary case; the
 * window is resized around it. `#fill-short` has fewer rows than the cap, so
 * it must draw exactly as it did before. `#fill-stacked` is two of them on one
 * page, each of which has to get at least the floor. `#fill-paned` has a
 * detail pane open, which is `align-self: stretch` inside an
 * `align-items: flex-start` layout and would otherwise stretch the grid past
 * its own cap.
 */
@Component({
  selector: 'app-fill-height-scenario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StrctDatagrid, StrctRowDetailDef, StrctStack, StrctStackItem],
  template: `
    <header class="fh__head">
      <h1 class="fh__title">A grid that fills its pane</h1>
      <p class="fh__sub">
        <code>[maxHeight]="'fill'"</code> bounds the scroll frame to the space left in the nearest
        scrolling ancestor, less the grid's own footer and whatever the page has after it,
        recomputed as that ancestor or the window changes size. <code>fillMin</code> is the floor
        under which the page scrolls instead.
      </p>
    </header>

    <!-- The ordinary case: one grid, the pane's whole remaining height. -->
    <section class="fh__pane" id="fill-tall" aria-label="A fill grid in a scrolling pane">
      <h2 class="fh__h2">Fill</h2>
      <strct-datagrid
        style="width: 100%"
        singleLine
        [maxHeight]="'fill'"
        [columns]="cols"
        [rows]="many"
        [paging]="{ pageSize: 50 }"
      />
    </section>

    <!-- Fewer rows than the cap: nothing may change. -->
    <section class="fh__pane" id="fill-short" aria-label="A short fill grid">
      <h2 class="fh__h2">Short</h2>
      <strct-datagrid
        style="width: 100%"
        singleLine
        [maxHeight]="'fill'"
        [columns]="cols"
        [rows]="few"
      />
    </section>

    <!-- Two in one pane: each gets at least the floor. -->
    <section class="fh__pane" id="fill-stacked" aria-label="Two fill grids stacked">
      <h2 class="fh__h2">Stacked</h2>
      <strct-datagrid
        style="width: 100%"
        singleLine
        [maxHeight]="'fill'"
        [fillMin]="200"
        [columns]="cols"
        [rows]="many"
      />
      <strct-datagrid
        style="width: 100%"
        singleLine
        [maxHeight]="'fill'"
        [fillMin]="200"
        [columns]="cols"
        [rows]="many"
      />
    </section>

    <!-- A pane open beside a bounded list. -->
    <section class="fh__pane" id="fill-paned" aria-label="A fill grid with its detail pane open">
      <h2 class="fh__h2">With a detail pane</h2>
      <strct-datagrid
        style="width: 100%"
        singleLine
        [maxHeight]="'fill'"
        [columns]="cols"
        [rows]="many"
        [pane]="{ enabled: true }"
        rowId="name"
        [(activeRowId)]="activeId"
      >
        <ng-template strctRowDetail let-row>
          <strct-stack>
            @for (n of detailLines; track n) {
              <div strctStackItem [label]="'Line ' + n">{{ row['name'] }} · {{ n }}</div>
            }
          </strct-stack>
        </ng-template>
      </strct-datagrid>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: var(--space-5);
      }
      .fh__head {
        margin-bottom: var(--space-5);
      }
      .fh__title {
        margin: 0;
        font-size: var(--text-3xl);
        font-weight: 600;
      }
      .fh__sub {
        margin: var(--space-2) 0 0;
        max-width: 72ch;
        color: var(--t2);
        font-size: var(--text-md);
      }
      /* A real page's scroll pane: a bounded box that scrolls, which is what a
         fill grid measures itself against. Sized against the viewport, because
         a pane with a fixed pixel height cannot show the thing this item is
         about — that a fixed number is right for one window and wrong for
         every other. */
      .fh__pane {
        height: clamp(300px, calc(100vh - 330px), 760px);
        overflow-y: auto;
        padding: var(--space-4);
        margin-bottom: var(--space-5);
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        background: var(--bg-1);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      /* Deliberately short: two grids in here have to fall back to the floor. */
      #fill-stacked {
        height: 420px;
      }
      .fh__h2 {
        margin: 0;
        font-size: var(--text-lg);
        font-weight: 600;
      }
    `,
  ],
})
export class FillHeightPage {
  protected readonly cols: StrctDatagridColumn[] = [
    { key: 'name', label: 'Host', width: '240px' },
    { key: 'cluster', label: 'Cluster', width: '140px' },
    { key: 'state', label: 'State', width: '120px' },
  ];

  private static rows(n: number): StrctRow[] {
    return Array.from({ length: n }, (_, i) => ({
      name: `hv-${String(i + 1).padStart(3, '0')}.dc.internal`,
      cluster: i % 3 === 0 ? 'prod-a' : i % 3 === 1 ? 'prod-b' : 'edge',
      state: i % 7 === 0 ? 'Maintenance' : 'Running',
    }));
  }

  /** More rows than any cap on this page, so the frame is what bounds them. */
  protected readonly many = FillHeightPage.rows(120);
  /** Fewer rows than the floor, so the grid must draw as it always did. */
  protected readonly few = FillHeightPage.rows(3);
  /** Enough detail to make the pane taller than the list, which is the bug. */
  protected readonly detailLines = Array.from({ length: 14 }, (_, i) => i + 1);

  /** The pane is open from the first frame: a closed pane proves nothing. */
  protected readonly activeId = signal<unknown>('hv-001.dc.internal');
}
