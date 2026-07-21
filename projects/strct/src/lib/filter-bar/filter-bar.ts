import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  model,
  output,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctSearchbox } from '../searchbox/searchbox';

/** One active filter chip in a {@link StrctFilterBar}. */
export interface StrctFilterChip {
  /** Stable identity, returned with (removed). */
  id: string;
  /** Chip text, e.g. "state: running". */
  label: string;
  /** Arbitrary payload carried back with (removed). */
  data?: unknown;
}

/**
 * The standard strip above a data grid: a search field, the active filter
 * chips (each removable), a result count and a clear-all action. The bar owns
 * no filtering logic — it renders state and announces intent:
 *
 *   <strct-filter-bar [(query)]="q" [filters]="chips" [count]="rows.length"
 *                     (removed)="drop($event)" (cleared)="reset()" />
 */
@Component({
  selector: 'strct-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctSearchbox],
  template: `
    <strct-searchbox
      class="strct-fb__search"
      [placeholder]="placeholder()"
      [(value)]="query"
      (search)="search.emit($event)"
    />
    @for (chip of filters(); track chip.id) {
      <span class="strct-fb__chip">
        <span class="strct-fb__chip-label">{{ chip.label }}</span>
        <button
          type="button"
          class="strct-fb__chip-x"
          [attr.aria-label]="removeLabel() + ' ' + chip.label"
          (click)="removed.emit(chip)"
        >
          <strct-icon name="close" [size]="10" [strokeWidth]="1.9" />
        </button>
      </span>
    }
    @if (filters().length > 1) {
      <button type="button" class="strct-fb__clear" (click)="cleared.emit()">
        {{ clearLabel() }}
      </button>
    }
    <ng-content />
    <span class="strct-fb__grow"></span>
    @if (count() !== null) {
      <span class="strct-fb__count" aria-live="polite">{{ count() }} {{ countLabel() }}</span>
    }
  `,
  host: { class: 'strct-fb' },
  styles: [
    `
      .strct-fb {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        width: 100%;
      }
      .strct-fb__search {
        width: 240px;
        max-width: 100%;
      }
      .strct-fb__chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 4px 3px 9px;
        border: 1px solid var(--b2);
        border-radius: 99px;
        background: var(--acc-m);
        color: var(--acc);
        font-size: 12px;
        font-weight: 500;
      }
      .strct-fb__chip-x {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .strct-fb__chip-x:hover {
        background: var(--acc30);
      }
      .strct-fb__chip-x:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-fb__clear {
        border: 0;
        padding: 3px 6px;
        border-radius: 5px;
        background: transparent;
        color: var(--t3);
        font-family: var(--font);
        font-size: 12px;
        cursor: pointer;
      }
      .strct-fb__clear:hover {
        color: var(--t1);
        background: var(--bg-3);
      }
      .strct-fb__clear:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-fb__grow {
        flex: 1;
      }
      .strct-fb__count {
        font-size: 12px;
        color: var(--t3);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
    `,
  ],
})
export class StrctFilterBar {
  /** Search text (two-way; forwards to the embedded searchbox). */
  readonly query = model('');
  /** Active filter chips. */
  readonly filters = input<StrctFilterChip[]>([]);
  /** Result count shown at the end; null hides it. */
  readonly count = input<number | null>(null);
  /** Localizable strings. */
  readonly placeholder = input('Search');
  readonly countLabel = input('results');
  readonly clearLabel = input('Clear filters');
  readonly removeLabel = input('Remove filter');
  /** Enter pressed in the search field. */
  readonly search = output<string>();
  /** A chip's × was clicked. */
  readonly removed = output<StrctFilterChip>();
  /** "Clear filters" was clicked. */
  readonly cleared = output<void>();
}
