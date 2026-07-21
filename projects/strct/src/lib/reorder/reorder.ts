import { Directive, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';

/** A completed reorder: move the item at `from` to `to` in your array. */
export interface StrctReorderEvent {
  from: number;
  to: number;
}

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
 */
@Directive({ selector: '[strctReorder]' })
export class StrctReorder {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Emits when a drag or keyboard move completes. */
  readonly reordered = output<StrctReorderEvent>();
  /** Disable all reordering (display-only mode). */
  readonly reorderDisabled = input(false);

  readonly dragIndex = signal<number | null>(null);
  readonly overIndex = signal<number | null>(null);

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
    this.reordered.emit({ from, to });
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

  private index(): number {
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
