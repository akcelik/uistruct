import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injectable,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { StrctIcon } from 'strct';
import { ALL_COMPONENTS, DOCS, GUIDES, SCENARIOS } from '../docs/registry';

/** Shared open-state so any trigger (header button, ⌘K) can summon the palette. */
@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  readonly open = signal(false);
}

interface Entry {
  label: string;
  group: string;
  path: string;
  icon: string;
}

/**
 * Command palette — a ⌘/Ctrl-K spotlight over every component, scenario and
 * guide page. Always mounted; opens via the service or the keyboard.
 */
@Component({
  selector: 'app-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StrctIcon],
  template: `
    @if (svc.open()) {
      <div class="cmd__backdrop" (click)="close()">
        <div
          class="cmd"
          role="dialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
          (keydown)="onKey($event)"
        >
          <div class="cmd__search">
            <strct-icon name="search" [size]="16" />
            <input
              #input
              class="cmd__input"
              type="text"
              placeholder="Search components, scenarios, pages…"
              [value]="query()"
              (input)="onType($event)"
            />
            <kbd class="cmd__kbd">Esc</kbd>
          </div>
          <div class="cmd__list">
            @for (e of filtered(); track e.path; let i = $index) {
              <button
                type="button"
                class="cmd__item"
                [class.is-active]="i === activeIndex()"
                (click)="go(e)"
                (mousemove)="activeIndex.set(i)"
              >
                <strct-icon
                  class="cmd__item-icon"
                  [name]="e.icon"
                  [size]="15"
                  [strokeWidth]="1.4"
                />
                <span class="cmd__item-label">{{ e.label }}</span>
                <span class="cmd__item-group">{{ e.group }}</span>
              </button>
            } @empty {
              <div class="cmd__empty">No matches for “{{ query() }}”</div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .cmd__backdrop {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 14vh 16px 16px;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        animation: cmd-fade 0.12s ease;
      }
      .cmd {
        width: 100%;
        max-width: 540px;
        max-height: 60vh;
        display: flex;
        flex-direction: column;
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: 12px;
        box-shadow: var(--shh);
        overflow: hidden;
        animation: cmd-rise 0.14s ease;
      }
      .cmd__search {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--b1);
        color: var(--t3);
      }
      .cmd__input {
        flex: 1;
        border: 0;
        background: transparent;
        color: var(--t1);
        font-size: 15px;
        font-family: var(--font);
        outline: none;
      }
      .cmd__kbd {
        font-size: 10px;
        padding: 2px 6px;
        border: 1px solid var(--b2);
        border-radius: 4px;
        color: var(--t3);
        font-family: var(--mono);
      }
      .cmd__list {
        overflow-y: auto;
        padding: 6px;
      }
      .cmd__item {
        display: flex;
        align-items: center;
        gap: 11px;
        width: 100%;
        padding: 9px 11px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        cursor: pointer;
        text-align: left;
      }
      .cmd__item.is-active {
        background: var(--acc-m);
      }
      .cmd__item-icon {
        color: var(--t2);
        flex-shrink: 0;
      }
      .cmd__item.is-active .cmd__item-icon {
        color: var(--acc);
      }
      .cmd__item-label {
        flex: 1;
        font-size: 13.5px;
        color: var(--t1);
      }
      .cmd__item-group {
        font-size: 11px;
        color: var(--t3);
      }
      .cmd__empty {
        padding: 20px;
        text-align: center;
        font-size: 13px;
        color: var(--t3);
      }
      @keyframes cmd-fade {
        from {
          opacity: 0;
        }
      }
      @keyframes cmd-rise {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
      }
    `,
  ],
})
export class CommandPalette {
  protected readonly svc = inject(CommandPaletteService);
  private readonly router = inject(Router);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  private readonly all: Entry[] = [
    ...GUIDES.items.map((i) => ({
      label: i.label,
      group: 'Foundations',
      path: i.path,
      icon: GUIDES.icon,
    })),
    ...SCENARIOS.items.map((i) => ({
      label: i.label,
      group: 'Scenarios',
      path: i.path,
      icon: SCENARIOS.icon,
    })),
    ...ALL_COMPONENTS.map((c) => ({
      label: c.title,
      group: c.category.label,
      path: `/components/${c.id}`,
      icon: c.category.icon,
    })),
  ];

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = q
      ? this.all.filter(
          (e) => e.label.toLowerCase().includes(q) || e.group.toLowerCase().includes(q),
        )
      : this.all;
    return list.slice(0, 60);
  });

  constructor() {
    // Keep DOCS referenced so the relationship is obvious to readers / tree-shakers.
    void DOCS;
    effect(() => {
      if (this.svc.open()) {
        this.query.set('');
        this.activeIndex.set(0);
        setTimeout(() => this.input()?.nativeElement.focus());
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  protected onGlobalKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.svc.open.set(!this.svc.open());
    } else if (event.key === 'Escape' && this.svc.open()) {
      this.close();
    }
  }

  protected onType(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.move(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.filtered()[this.activeIndex()];
      if (item) this.go(item);
    }
  }

  private move(delta: number): void {
    const n = this.filtered().length;
    if (!n) return;
    this.activeIndex.set((this.activeIndex() + delta + n) % n);
  }

  protected go(entry: Entry): void {
    this.close();
    void this.router.navigate([entry.path]);
  }

  protected close(): void {
    this.svc.open.set(false);
  }
}
