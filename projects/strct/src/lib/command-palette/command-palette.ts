import {
  DOCUMENT,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { StrctKbd } from '../kbd/kbd';

let paletteCounter = 0;

/** One searchable command in the palette. */
export interface StrctCommandItem {
  /** Stable key; returned with (picked). */
  id: string;
  label: string;
  /** Right-aligned group tag (e.g. a category or section name). */
  group?: string;
  /** Leading icon name (StrctIcon set). */
  icon?: string;
  /** Right-aligned shortcut hint, rendered as a key chip. */
  hint?: string;
  /** Extra search terms beyond label/group. */
  keywords?: string[];
  /** Arbitrary payload carried back with (picked). */
  data?: unknown;
}

/**
 * ⌘/Ctrl-K command palette — a spotlight search over app commands or pages.
 * Mount once near the app root, feed it `items`, and act on `(picked)`:
 *
 *   <strct-command-palette [items]="commands" [(open)]="paletteOpen"
 *                          (picked)="run($event)" />
 *
 * Opens via the two-way `open` model or the built-in ⌘/Ctrl-K hotkey
 * (`hotkey` input). Implements the ARIA combobox/listbox pattern: arrow keys
 * move the active option, Enter picks, Escape closes; focus returns to the
 * previously focused element on close.
 */
@Component({
  selector: 'strct-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctKbd],
  host: { '(document:keydown)': 'onGlobalKey($event)' },
  template: `
    @if (open()) {
      <!-- Backdrop: pointer-only dismiss (Escape covers keyboard). -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <div class="strct-cmdp__backdrop" (click)="close()">
        <div
          class="strct-cmdp"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="placeholder()"
          (click)="$event.stopPropagation()"
          (keydown)="onKey($event)"
        >
          <div class="strct-cmdp__search">
            <strct-icon name="search" [size]="16" />
            <input
              #input
              class="strct-cmdp__input"
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="true"
              [attr.aria-controls]="listId"
              [attr.aria-activedescendant]="filtered().length ? optionId(activeIndex()) : null"
              [placeholder]="placeholder()"
              [value]="query()"
              (input)="onType($event)"
            />
            <strct-kbd>Esc</strct-kbd>
          </div>
          <div class="strct-cmdp__list" role="listbox" [id]="listId">
            @if (loading()) {
              <div class="strct-cmdp__loading" aria-live="polite">
                <span class="strct-cmdp__spin" aria-hidden="true"></span>{{ loadingText() }}
              </div>
            }
            @for (item of filtered(); track item.id; let i = $index) {
              <button
                type="button"
                class="strct-cmdp__item"
                role="option"
                [id]="optionId(i)"
                [attr.aria-selected]="i === activeIndex()"
                [class.is-active]="i === activeIndex()"
                tabindex="-1"
                (click)="pick(item)"
                (mousemove)="activeIndex.set(i)"
              >
                @if (item.icon) {
                  <strct-icon
                    class="strct-cmdp__icon"
                    [name]="item.icon"
                    [size]="16"
                    [strokeWidth]="1.4"
                  />
                }
                <span class="strct-cmdp__label">{{ item.label }}</span>
                @if (item.hint) {
                  <strct-kbd>{{ item.hint }}</strct-kbd>
                }
                @if (item.group) {
                  <span class="strct-cmdp__group">{{ item.group }}</span>
                }
              </button>
            } @empty {
              @if (!loading()) {
                <div class="strct-cmdp__empty">{{ emptyText() }} “{{ query() }}”</div>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .strct-cmdp__backdrop {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 14vh 16px 16px;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        animation: strct-cmdp-fade 0.12s ease;
      }
      .strct-cmdp {
        width: 100%;
        max-width: 560px;
        max-height: 60vh;
        display: flex;
        flex-direction: column;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-floating);
        overflow: hidden;
        animation: strct-cmdp-rise 0.14s ease;
      }
      .strct-cmdp__search {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--b1);
        color: var(--t3);
      }
      .strct-cmdp__input {
        flex: 1;
        min-width: 0;
        border: 0;
        background: transparent;
        color: var(--t1);
        font-size: 15px;
        font-family: var(--font);
        outline: none;
      }
      .strct-cmdp__list {
        overflow-y: auto;
        padding: 6px;
      }
      .strct-cmdp__item {
        display: flex;
        align-items: center;
        gap: 11px;
        width: 100%;
        padding: 9px 11px;
        border: 0;
        border-radius: var(--radius-md);
        background: transparent;
        cursor: pointer;
        text-align: start;
        font-family: var(--font);
      }
      .strct-cmdp__item.is-active {
        background: var(--acc-m);
      }
      .strct-cmdp__icon {
        color: var(--t2);
        flex-shrink: 0;
      }
      .strct-cmdp__item.is-active .strct-cmdp__icon {
        color: var(--acc);
      }
      .strct-cmdp__label {
        flex: 1;
        min-width: 0;
        font-size: var(--text-lg);
        color: var(--t1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .strct-cmdp__group {
        font-size: var(--text-sm);
        color: var(--t3);
        flex-shrink: 0;
      }
      .strct-cmdp__loading {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 10px 12px;
        font-size: var(--text-md);
        color: var(--t3);
      }
      .strct-cmdp__spin {
        width: 13px;
        height: 13px;
        border: 2px solid var(--acc30);
        border-top-color: var(--acc);
        border-radius: 50%;
        flex-shrink: 0;
      }
      @media (prefers-reduced-motion: no-preference) {
        .strct-cmdp__spin {
          animation: strct-cmdp-spin 0.8s linear infinite;
        }
      }
      @keyframes strct-cmdp-spin {
        to {
          transform: rotate(360deg);
        }
      }
      .strct-cmdp__empty {
        padding: 20px;
        text-align: center;
        font-size: var(--text-md);
        color: var(--t3);
      }
      @keyframes strct-cmdp-fade {
        from {
          opacity: 0;
        }
      }
      @keyframes strct-cmdp-rise {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-cmdp__backdrop,
        .strct-cmdp {
          animation: none;
        }
      }
    `,
  ],
})
export class StrctCommandPalette {
  private readonly doc = inject(DOCUMENT);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  /** Searchable commands. */
  readonly items = input<StrctCommandItem[]>([]);
  /** Whether the palette is open (two-way). */
  readonly open = model(false);
  /** Enable the built-in ⌘/Ctrl-K toggle. */
  readonly hotkey = input(true, { transform: booleanAttribute });
  /** Search input placeholder / dialog name (localizable). */
  readonly placeholder = input('Type a command or search…');
  /** Empty-result message prefix (localizable). */
  readonly emptyText = input('No matches for');
  /** Maximum rendered results. */
  readonly maxResults = input(50);
  /**
   * Internal ranked filtering. Set `false` for a **server-backed** palette:
   * items render in the order given (you already filtered them) and the query
   * reaches you through the two-way `query` model. `maxResults` still caps
   * rendering.
   */
  readonly filter = input(true, { transform: booleanAttribute });
  /** Show a "searching" row while server results are in flight. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Localizable text of the loading row. */
  readonly loadingText = input('Searching…');
  /** Emitted when a command is chosen (Enter or click); the palette closes. */
  readonly picked = output<StrctCommandItem>();

  /**
   * The typed query (two-way). The palette still owns typing and keyboard
   * behaviour; consumers observe it to serve results asynchronously.
   */
  readonly query = model('');
  protected readonly activeIndex = signal(0);
  protected readonly listId = `strct-cmdp-list-${++paletteCounter}`;
  private previousActive: HTMLElement | null = null;

  protected optionId(i: number): string {
    return `${this.listId}-opt-${i}`;
  }

  /** Rank: label prefix > word-start > substring; group/keyword matches last. */
  protected readonly filtered = computed(() => {
    const items = this.items();
    // Server-backed mode: the caller already filtered — render as given.
    if (!this.filter()) return items.slice(0, this.maxResults());
    const q = this.query().trim().toLowerCase();
    if (!q) return items.slice(0, this.maxResults());
    const scored: { item: StrctCommandItem; score: number }[] = [];
    for (const item of items) {
      const label = item.label.toLowerCase();
      const hay = [item.group ?? '', ...(item.keywords ?? [])].join(' ').toLowerCase();
      let score = -1;
      if (label.startsWith(q)) score = 0;
      else if (label.split(/\s+/).some((w) => w.startsWith(q))) score = 1;
      else if (label.includes(q)) score = 2;
      else if (hay.includes(q)) score = 3;
      if (score >= 0) scored.push({ item, score });
    }
    return scored
      .sort((a, b) => a.score - b.score)
      .slice(0, this.maxResults())
      .map((s) => s.item);
  });

  constructor() {
    // Async results can shrink under the cursor — keep the active option in range.
    effect(() => {
      const len = this.filtered().length;
      if (this.activeIndex() >= len) this.activeIndex.set(Math.max(0, len - 1));
    });
    // Focus the input on open; restore focus on close.
    effect(() => {
      if (this.open()) {
        this.previousActive = this.doc.activeElement as HTMLElement | null;
        this.query.set('');
        this.activeIndex.set(0);
        setTimeout(() => this.inputRef()?.nativeElement.focus());
      } else if (this.previousActive) {
        this.previousActive.focus?.();
        this.previousActive = null;
      }
    });
  }

  /** ⌘/Ctrl-K toggle + global Escape while open. */
  protected onGlobalKey(event: KeyboardEvent): void {
    if (this.hotkey() && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open.update((v) => !v);
    } else if (event.key === 'Escape' && this.open()) {
      this.close();
    }
  }

  protected onType(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(0);
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(Math.max(0, this.filtered().length - 1));
        break;
      case 'Enter': {
        event.preventDefault();
        const item = this.filtered()[this.activeIndex()];
        if (item) this.pick(item);
        break;
      }
    }
  }

  private move(delta: number): void {
    const n = this.filtered().length;
    if (!n) return;
    const next = (this.activeIndex() + delta + n) % n;
    this.activeIndex.set(next);
    this.doc.getElementById(this.optionId(next))?.scrollIntoView?.({ block: 'nearest' });
  }

  protected pick(item: StrctCommandItem): void {
    this.close();
    this.picked.emit(item);
  }

  protected close(): void {
    this.open.set(false);
  }
}
