import {
  DOCUMENT,
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  Renderer2,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { StrctAnnouncer } from '../a11y/announcer';

/** A completed reorder: move the item at `from` to `to` in your array. */
export interface StrctReorderEvent {
  from: number;
  to: number;
}

let reorderCounter = 0;

/**
 * List drag-reorder primitive — the consumer owns the array:
 *
 *   <ul strctReorder (reordered)="move($event)">
 *     @for (s of steps(); track s.id) {
 *       <li strctReorderItem>{{ s.label }}</li>
 *     }
 *   </ul>
 *
 *   move({ from, to }: StrctReorderEvent) {
 *     this.steps.update((s) => { const c = [...s]; c.splice(to, 0, ...c.splice(from, 1)); return c; });
 *   }
 *
 * Items are HTML5-draggable; keyboard reorder is Alt+ArrowUp / Alt+ArrowDown
 * on the focused item (items get `tabindex="0"` unless they already manage
 * focus). Indexes are positions among the `strctReorderItem` siblings.
 * Completed moves are announced in a live region (see `announcement`) and
 * items reference the sr-only `instructions` via `aria-describedby`.
 */
@Directive({ selector: '[strctReorder]' })
export class StrctReorder implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly doc = inject(DOCUMENT);
  private readonly announcer = inject(StrctAnnouncer);
  /** Emits when a drag or keyboard move completes. */
  readonly reordered = output<StrctReorderEvent>();
  /** Disable all reordering (display-only mode). */
  readonly reorderDisabled = input(false, { transform: booleanAttribute });
  /**
   * Keyboard instructions (localizable), rendered sr-only and referenced by
   * every item's `aria-describedby`. Set to '' to opt out.
   */
  readonly instructions = input('Press Alt+ArrowUp or Alt+ArrowDown to move this item');
  /**
   * Builds the live-region announcement after a move (localizable):
   * (moved item's text, new 1-based position, item count).
   */
  readonly announcement = input(
    (label: string, position: number, total: number) =>
      `Moved ${label} to position ${position} of ${total}`,
  );

  readonly dragIndex = signal<number | null>(null);
  readonly overIndex = signal<number | null>(null);
  /** Id of the sr-only instructions element the items point to. */
  readonly instructionsId = `strct-reorder-hint-${++reorderCounter}`;
  private hint: HTMLElement | null = null;

  constructor() {
    // Keep the sr-only instructions element in sync with the input.
    effect(() => {
      const text = this.instructions();
      if (text && !this.hint) {
        this.hint = this.renderer.createElement('span') as HTMLElement;
        this.renderer.setAttribute(this.hint, 'id', this.instructionsId);
        this.hint.style.cssText =
          'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;';
        this.renderer.appendChild(this.doc.body, this.hint);
      }
      if (this.hint) this.hint.textContent = text;
    });
  }

  items(): HTMLElement[] {
    return [...this.host.nativeElement.querySelectorAll<HTMLElement>('[strctReorderItem]')];
  }

  indexOf(el: HTMLElement): number {
    return this.items().indexOf(el);
  }

  commit(from: number, to: number): void {
    this.dragIndex.set(null);
    this.overIndex.set(null);
    if (from < 0 || to < 0 || from === to) return;
    const label = this.items()[from]?.textContent?.trim() ?? '';
    this.reordered.emit({ from, to });
    this.announcer.announce(this.announcement()(label, to + 1, this.items().length));
  }

  @HostListener('dragover', ['$event'])
  protected onContainerDragOver(event: DragEvent): void {
    // Only the container's own empty space (below the last item); drags over
    // items are handled by the items themselves.
    if (this.dragIndex() == null) return;
    if ((event.target as HTMLElement).closest('[strctReorderItem]')) return;
    event.preventDefault();
  }

  @HostListener('drop', ['$event'])
  protected onContainerDrop(event: DragEvent): void {
    const from = this.dragIndex();
    if (from == null) return; // an item already consumed this drop
    if ((event.target as HTMLElement).closest('[strctReorderItem]')) return;
    event.preventDefault();
    // Drop into empty space moves the item to the end.
    this.commit(from, this.items().length - 1);
  }

  @HostListener('dragleave', ['$event'])
  protected onDragLeave(event: DragEvent): void {
    // dragleave also fires when moving between children; only clear the
    // highlight when the drag truly leaves the container.
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    this.overIndex.set(null);
  }

  ngOnDestroy(): void {
    if (this.hint) {
      this.renderer.removeChild(this.doc.body, this.hint);
      this.hint = null;
    }
  }
}

/** One draggable row inside a `[strctReorder]` container. */
@Directive({
  selector: '[strctReorderItem]',
  host: {
    '[attr.draggable]': '!list.reorderDisabled()',
    '[attr.tabindex]': 'hostTabindex()',
    '[class.strct-reorder--dragging]': 'isDragging()',
    '[class.strct-reorder--over]': 'isOver()',
    '[attr.aria-roledescription]': "'sortable'",
    '[attr.aria-keyshortcuts]': "'Alt+ArrowUp Alt+ArrowDown'",
    '[attr.aria-posinset]': 'index() + 1',
    '[attr.aria-setsize]': 'list.items().length',
    '[attr.aria-describedby]': 'list.instructions() ? list.instructionsId : null',
  },
})
export class StrctReorderItem {
  protected readonly list = inject(StrctReorder);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  // Captured before our own binding ever writes tabindex, so it never flips.
  private readonly hadOwnTabindex = this.el.nativeElement.hasAttribute('tabindex');

  protected hostTabindex(): number | null {
    return this.hadOwnTabindex ? null : 0;
  }

  protected isDragging(): boolean {
    return this.list.dragIndex() === this.index();
  }
  protected isOver(): boolean {
    return this.list.overIndex() === this.index() && this.list.dragIndex() !== this.index();
  }

  protected index(): number {
    return this.list.indexOf(this.el.nativeElement);
  }

  @HostListener('dragstart', ['$event'])
  protected onDragStart(event: DragEvent): void {
    if (this.list.reorderDisabled()) return;
    this.list.dragIndex.set(this.index());
    event.dataTransfer?.setData('text/plain', String(this.index()));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  @HostListener('dragover', ['$event'])
  protected onDragOver(event: DragEvent): void {
    if (this.list.dragIndex() == null) return;
    event.preventDefault();
    this.list.overIndex.set(this.index());
  }

  @HostListener('drop', ['$event'])
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const from = this.list.dragIndex();
    if (from == null) return;
    this.list.commit(from, this.index());
  }

  @HostListener('dragend')
  protected onDragEnd(): void {
    this.list.dragIndex.set(null);
    this.list.overIndex.set(null);
  }

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.list.reorderDisabled() || !event.altKey) return;
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const from = this.index();
    const to = event.key === 'ArrowUp' ? from - 1 : from + 1;
    if (to < 0 || to >= this.list.items().length) return;
    this.list.commit(from, to);
    // Keep focus on the moved item after the consumer re-renders.
    setTimeout(() => this.list.items()[to]?.focus());
  }
}
