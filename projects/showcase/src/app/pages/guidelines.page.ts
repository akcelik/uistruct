import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  StrctBadge,
  StrctButton,
  StrctCheckbox,
  StrctIcon,
  StrctModal,
  StrctToastService,
} from 'strct';
import { UsageGuide } from '../docs/doc-ui';

interface Row {
  id: string;
  name: string;
}

/**
 * #3 — UX pattern guidelines: live, interactive examples of the interaction
 * patterns every console needs, each paired with do/don't guidance.
 */
@Component({
  selector: 'app-guidelines-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, StrctButton, StrctIcon, StrctBadge, StrctCheckbox, StrctModal, UsageGuide],
  template: `
    <header class="gl__head">
      <h1 class="gl__title">Guidelines</h1>
      <p class="gl__sub">
        Interaction patterns composed from strct — with guidance on when to use each.
      </p>
    </header>

    <!-- Pattern 1 · Destructive confirmation -->
    <section class="gl__pattern">
      <div class="gl__pat-head">
        <h2 class="gl__h2">Destructive confirmation</h2>
        <p class="gl__p">
          Guard irreversible actions behind an explicit confirmation that names the object.
        </p>
      </div>
      <div class="gl__demo">
        <button strct-button variant="critical" (click)="confirmOpen.set(true)">
          <strct-icon name="close" [size]="14" /> Delete cluster
        </button>
        @if (lastAction()) {
          <strct-badge status="accent">{{ lastAction() }}</strct-badge>
        }
        <strct-modal [(open)]="confirmOpen" title="Delete cluster?" size="sm">
          Permanently delete <strong>Prod-A</strong> and its 8 hosts? This action cannot be undone.
          <ng-container strctModalFooter>
            <button strct-button variant="flat" (click)="confirmOpen.set(false)">Cancel</button>
            <button strct-button variant="critical" solid (click)="confirmDelete()">
              Delete cluster
            </button>
          </ng-container>
        </strct-modal>
      </div>
      <app-usage [do]="confirmDo" [dont]="confirmDont" />
    </section>

    <!-- Pattern 2 · Bulk selection -->
    <section class="gl__pattern">
      <div class="gl__pat-head">
        <h2 class="gl__h2">Bulk selection &amp; actions</h2>
        <p class="gl__p">
          Reveal batch actions only when rows are selected, and always show the count.
        </p>
      </div>
      <div class="gl__demo gl__demo--block">
        @if (selected().length) {
          <div class="gl__bulkbar">
            <span class="gl__bulkcount">{{ selected().length }} selected</span>
            <button strct-button size="sm" (click)="bulk('Exported')">
              <strct-icon name="download" [size]="13" /> Export
            </button>
            <button strct-button size="sm" variant="critical" (click)="bulk('Deleted')">
              <strct-icon name="close" [size]="13" /> Delete
            </button>
            <button strct-button size="sm" variant="flat" (click)="clear()">Clear</button>
          </div>
        }
        <div class="gl__list">
          <div class="gl__row gl__row--head">
            <strct-checkbox [ngModel]="allSelected()" (ngModelChange)="toggleAll($event)" />
            <span class="gl__rowname">Name</span>
          </div>
          @for (r of rows; track r.id) {
            <div class="gl__row">
              <strct-checkbox
                [ngModel]="isSelected(r.id)"
                (ngModelChange)="toggleRow(r.id, $event)"
              />
              <span class="gl__rowname"><strct-icon name="vm" [size]="14" /> {{ r.name }}</span>
            </div>
          }
        </div>
      </div>
      <app-usage [do]="bulkDo" [dont]="bulkDont" />
    </section>

    <!-- Pattern 3 · Transient feedback -->
    <section class="gl__pattern">
      <div class="gl__pat-head">
        <h2 class="gl__h2">Transient feedback (toasts)</h2>
        <p class="gl__p">Use auto-dismissing toasts for brief, non-blocking confirmations.</p>
      </div>
      <div class="gl__demo">
        <button strct-button size="sm" (click)="toast.success('Snapshot created')">Success</button>
        <button strct-button size="sm" (click)="toast.info('Sync started')">Info</button>
        <button strct-button size="sm" (click)="toast.warning('Storage running low')">
          Warning
        </button>
        <button strct-button size="sm" (click)="toast.critical('Host unreachable')">Error</button>
      </div>
      <app-usage [do]="toastDo" [dont]="toastDont" />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 820px;
      }
      .gl__head {
        margin-bottom: 20px;
      }
      .gl__title {
        margin: 0;
        font-size: 24px;
        font-weight: 650;
        color: var(--t1);
        letter-spacing: -0.01em;
      }
      .gl__sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--t3);
      }
      .gl__pattern {
        margin-bottom: 34px;
      }
      .gl__h2 {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        color: var(--t1);
      }
      .gl__p {
        margin: 4px 0 12px;
        font-size: 13px;
        color: var(--t2);
      }
      .gl__demo {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding: 20px;
        border: 1px solid var(--b2);
        border-radius: 11px;
        background: var(--bg-2);
      }
      .gl__demo--block {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .gl__bulkbar {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: var(--acc-m);
        border: 1px solid var(--acc30);
        border-radius: 8px;
      }
      .gl__bulkcount {
        color: var(--acc);
        font-weight: 600;
        font-size: 13px;
        margin-right: auto;
      }
      .gl__list {
        border: 1px solid var(--b2);
        border-radius: 9px;
        overflow: hidden;
        background: var(--bg-1);
      }
      .gl__row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 9px 13px;
        border-bottom: 1px solid var(--b1);
      }
      .gl__row:last-child {
        border-bottom: 0;
      }
      .gl__row--head {
        background: var(--bg-2);
      }
      .gl__row--head .gl__rowname {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--t3);
      }
      .gl__rowname {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 13px;
        color: var(--t1);
      }
      .gl__rowname strct-icon {
        color: var(--t2);
      }
    `,
  ],
})
export class GuidelinesPage {
  protected readonly toast = inject(StrctToastService);

  protected readonly confirmOpen = signal(false);
  protected readonly lastAction = signal('');

  protected readonly rows: Row[] = [
    { id: 'a', name: 'web-frontend-01' },
    { id: 'b', name: 'api-gateway-01' },
    { id: 'c', name: 'db-primary' },
  ];
  protected readonly selected = signal<string[]>([]);
  protected readonly allSelected = computed(() => this.selected().length === this.rows.length);

  protected isSelected(id: string): boolean {
    return this.selected().includes(id);
  }
  protected toggleRow(id: string, on: boolean): void {
    this.selected.update((s) => (on ? [...s, id] : s.filter((x) => x !== id)));
  }
  protected toggleAll(on: boolean): void {
    this.selected.set(on ? this.rows.map((r) => r.id) : []);
  }
  protected clear(): void {
    this.selected.set([]);
  }
  protected bulk(action: string): void {
    this.toast.success(`${action} ${this.selected().length} object(s)`);
    this.selected.set([]);
  }

  protected confirmDelete(): void {
    this.confirmOpen.set(false);
    this.lastAction.set('Prod-A deleted');
    this.toast.critical('Cluster Prod-A deleted');
  }

  protected readonly confirmDo = [
    'Require explicit confirmation for irreversible actions.',
    'Name the exact object being affected in the dialog.',
    'Reserve the critical color for the confirm button only.',
  ];
  protected readonly confirmDont = [
    'Do not rely on undo for permanent deletions.',
    "Don't auto-focus the destructive button.",
  ];
  protected readonly bulkDo = [
    'Offer a select-all control and a running selected count.',
    'Surface batch actions only once something is selected.',
  ];
  protected readonly bulkDont = [
    'Do not hide how many items are selected.',
    'Avoid destructive batch actions without a confirmation step.',
  ];
  protected readonly toastDo = [
    'Use toasts for brief, non-blocking confirmations.',
    'Auto-dismiss success/info toasts; keep messages short.',
  ];
  protected readonly toastDont = [
    'Do not put decisions or critical errors in a toast.',
    'Avoid firing many toasts at once.',
  ];
}
