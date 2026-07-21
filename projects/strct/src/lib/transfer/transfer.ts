import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { StrctButton } from '../button/button';
import { StrctCheckbox } from '../forms/checkbox';
import { StrctIcon } from '../icon/icon';
import { StrctSearchbox } from '../searchbox/searchbox';

/** One transferable item. */
export interface StrctTransferItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  data?: unknown;
}

/**
 * Dual-list transfer (picklist) — "assign hosts to the cluster": all items on
 * the left, the chosen set on the right, checkbox multi-select and move
 * buttons in between, with a searchbox per side.
 *
 *   <strct-transfer [items]="hosts" [(assigned)]="clusterHosts" />
 *
 * `assigned` is the two-way id set (string[]); `items` stays the single
 * source-of-truth list.
 */
@Component({
  selector: 'strct-transfer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctButton, StrctCheckbox, StrctIcon, StrctSearchbox],
  template: `
    <div class="strct-tf__col">
      <div class="strct-tf__head">
        <span class="strct-tf__title">{{ sourceLabel() }}</span>
        <span class="strct-tf__count">{{ sourceItems().length }}</span>
      </div>
      <strct-searchbox
        class="strct-tf__search"
        [placeholder]="searchPlaceholder()"
        [value]="sourceQuery()"
        (valueChange)="sourceQuery.set($event)"
      />
      <ul class="strct-tf__list" role="listbox" [attr.aria-label]="sourceLabel()">
        @for (item of sourceItems(); track item.id) {
          <li class="strct-tf__item" [class.strct-tf__item--disabled]="item.disabled">
            <strct-checkbox
              [checked]="sourceChecked().has(item.id)"
              [disabled]="item.disabled ?? false"
              (checkedChange)="toggle(sourceChecked, item.id)"
            >
              @if (item.icon) {
                <strct-icon [name]="item.icon" [size]="14" />
              }
              <span class="strct-tf__label">{{ item.label }}</span>
            </strct-checkbox>
          </li>
        } @empty {
          <li class="strct-tf__empty">{{ emptyLabel() }}</li>
        }
      </ul>
    </div>

    <div class="strct-tf__mid">
      <button
        strct-button
        size="sm"
        variant="neutral"
        [disabled]="!sourceChecked().size"
        [attr.aria-label]="assignLabel()"
        (click)="assign()"
      >
        <strct-icon name="chevronRight" [size]="14" />
      </button>
      <button
        strct-button
        size="sm"
        variant="neutral"
        [disabled]="!targetChecked().size"
        [attr.aria-label]="unassignLabel()"
        (click)="unassign()"
      >
        <strct-icon name="chevronLeft" [size]="14" />
      </button>
    </div>

    <div class="strct-tf__col">
      <div class="strct-tf__head">
        <span class="strct-tf__title">{{ targetLabel() }}</span>
        <span class="strct-tf__count">{{ targetItems().length }}</span>
      </div>
      <strct-searchbox
        class="strct-tf__search"
        [placeholder]="searchPlaceholder()"
        [value]="targetQuery()"
        (valueChange)="targetQuery.set($event)"
      />
      <ul class="strct-tf__list" role="listbox" [attr.aria-label]="targetLabel()">
        @for (item of targetItems(); track item.id) {
          <li class="strct-tf__item" [class.strct-tf__item--disabled]="item.disabled">
            <strct-checkbox
              [checked]="targetChecked().has(item.id)"
              [disabled]="item.disabled ?? false"
              (checkedChange)="toggle(targetChecked, item.id)"
            >
              @if (item.icon) {
                <strct-icon [name]="item.icon" [size]="14" />
              }
              <span class="strct-tf__label">{{ item.label }}</span>
            </strct-checkbox>
          </li>
        } @empty {
          <li class="strct-tf__empty">{{ emptyLabel() }}</li>
        }
      </ul>
    </div>
  `,
  host: { class: 'strct-tf' },
  styles: [
    `
      .strct-tf {
        display: flex;
        align-items: stretch;
        gap: 10px;
        width: 100%;
      }
      .strct-tf__col {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px;
        background: var(--bg-2);
        border: 1px solid var(--b2);
        border-radius: 9px;
      }
      .strct-tf__head {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      .strct-tf__title {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--t1);
      }
      .strct-tf__count {
        font-size: 11px;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }
      .strct-tf__search {
        width: 100%;
      }
      .strct-tf__list {
        list-style: none;
        margin: 0;
        padding: 0;
        min-height: 120px;
        max-height: 240px;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .strct-tf__item {
        display: flex;
        align-items: center;
        padding: 2px 4px;
        border-radius: 5px;
        color: var(--t1);
        font-size: 12.5px;
      }
      .strct-tf__item strct-icon {
        margin-inline-end: 6px;
      }
      .strct-tf__item:hover {
        background: var(--bg-3);
      }
      .strct-tf__item--disabled {
        color: var(--t4);
        cursor: default;
      }
      .strct-tf__label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .strct-tf__empty {
        padding: 12px 8px;
        font-size: 12px;
        color: var(--t3);
      }
      .strct-tf__mid {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
      }
    `,
  ],
})
export class StrctTransfer {
  /** The full item universe. */
  readonly items = input.required<StrctTransferItem[]>();
  /** Assigned item ids (two-way). */
  readonly assigned = model<string[]>([]);
  /** Localizable strings. */
  readonly sourceLabel = input('Available');
  readonly targetLabel = input('Assigned');
  readonly searchPlaceholder = input('Search');
  readonly emptyLabel = input('No items');
  readonly assignLabel = input('Assign selected');
  readonly unassignLabel = input('Unassign selected');
  /** A move happened (either direction) with the moved ids. */
  readonly moved = output<{ direction: 'assign' | 'unassign'; ids: string[] }>();

  protected readonly sourceQuery = signal('');
  protected readonly targetQuery = signal('');
  protected readonly sourceChecked = signal<Set<string>>(new Set());
  protected readonly targetChecked = signal<Set<string>>(new Set());

  private readonly assignedSet = computed(() => new Set(this.assigned()));

  protected readonly sourceItems = computed(() =>
    this.items().filter(
      (i) => !this.assignedSet().has(i.id) && this.matches(i, this.sourceQuery()),
    ),
  );
  protected readonly targetItems = computed(() =>
    this.items().filter((i) => this.assignedSet().has(i.id) && this.matches(i, this.targetQuery())),
  );

  private matches(item: StrctTransferItem, q: string): boolean {
    return !q.trim() || item.label.toLowerCase().includes(q.trim().toLowerCase());
  }

  protected toggle(which: typeof this.sourceChecked | typeof this.targetChecked, id: string): void {
    const next = new Set(which());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    which.set(next);
  }

  protected assign(): void {
    const ids = [...this.sourceChecked()];
    if (!ids.length) return;
    this.assigned.set([...this.assigned(), ...ids]);
    this.sourceChecked.set(new Set());
    this.moved.emit({ direction: 'assign', ids });
  }

  protected unassign(): void {
    const ids = new Set(this.targetChecked());
    if (!ids.size) return;
    this.assigned.set(this.assigned().filter((id) => !ids.has(id)));
    this.targetChecked.set(new Set());
    this.moved.emit({ direction: 'unassign', ids: [...ids] });
  }
}
