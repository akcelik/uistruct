import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

type PageToken = number | 'dots';

/**
 * Page navigator with first/last + a windowed range and ellipsis gaps.
 *   <strct-pagination [total]="240" [pageSize]="20" [(page)]="page" />
 */
@Component({
  selector: 'strct-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <button
      type="button"
      class="strct-pg__btn strct-pg__nav"
      [disabled]="page() <= 1"
      aria-label="Previous page"
      (click)="go(page() - 1)"
    >
      <strct-icon name="chevronLeft" [size]="13" [strokeWidth]="1.7" />
    </button>

    @for (token of pages(); track $index) {
      @if (token === 'dots') {
        <span class="strct-pg__dots"><strct-icon name="ellipsis" [size]="14" /></span>
      } @else {
        <button
          type="button"
          class="strct-pg__btn"
          [class.strct-pg__btn--active]="token === page()"
          [attr.aria-current]="token === page() ? 'page' : null"
          (click)="go(token)"
        >
          {{ token }}
        </button>
      }
    }

    <button
      type="button"
      class="strct-pg__btn strct-pg__nav"
      [disabled]="page() >= pageCount()"
      aria-label="Next page"
      (click)="go(page() + 1)"
    >
      <strct-icon name="chevronRight" [size]="13" [strokeWidth]="1.7" />
    </button>
  `,
  host: { class: 'strct-pg', role: 'navigation', 'aria-label': 'Pagination' },
  styles: [
    `
    .strct-pg { display: inline-flex; align-items: center; gap: 4px; }
    .strct-pg__btn {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 30px; height: 30px; padding: 0 7px; border-radius: 6px;
      font-family: var(--font); font-size: 13px; cursor: pointer;
      color: var(--t1); background: transparent; border: 1px solid transparent;
      transition: background .14s ease, border-color .14s ease, color .14s ease;
    }
    .strct-pg__btn:hover { background: var(--bg-3); }
    .strct-pg__btn--active { color: var(--acc); border-color: var(--acc30); background: var(--acc-m); }
    .strct-pg__btn:disabled { color: var(--t4); cursor: not-allowed; background: transparent; }
    .strct-pg__nav { color: var(--t2); }
    .strct-pg__dots {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 24px; height: 30px; color: var(--t3);
    }
    `,
  ],
})
export class StrctPagination {
  readonly total = input.required<number>();
  readonly pageSize = input(10);
  readonly page = model(1);

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );

  protected readonly pages = computed<PageToken[]>(() => {
    const count = this.pageCount();
    const current = this.page();
    if (count <= 7) {
      return Array.from({ length: count }, (_, i) => i + 1);
    }
    const tokens: PageToken[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(count - 1, current + 1);
    if (start > 2) tokens.push('dots');
    for (let p = start; p <= end; p++) tokens.push(p);
    if (end < count - 1) tokens.push('dots');
    tokens.push(count);
    return tokens;
  });

  go(target: number): void {
    const clamped = Math.max(1, Math.min(this.pageCount(), target));
    if (clamped !== this.page()) this.page.set(clamped);
  }
}
