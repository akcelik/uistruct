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

/** A completed move between two connected lists. */
export interface StrctReorderMoveEvent {
  /** The moved element, so the consumer can identify its own item. */
  item: HTMLElement;
  fromList: string;
  toList: string;
  fromIndex: number;
  toIndex: number;
}

/**
 * Connects several `[strctReorder]` lists, so a card can move between the
 * columns of a board — by its handle, or with Alt+ArrowLeft / Alt+ArrowRight.
 * Moves within one list stay on that list's `reordered`; moves across lists
 * come out here.
 */
@Directive({ selector: '[strctReorderGroup]' })
export class StrctReorderGroup {
  /** A card moved from one list to another. */
  readonly moved = output<StrctReorderMoveEvent>();
  /** Every list in this group, in DOM order. */
  readonly lists = signal<StrctReorder[]>([]);
  /** Where the current drag started, so a drop elsewhere knows its origin. */
  readonly source = signal<{ list: StrctReorder; index: number } | null>(null);

  register(list: StrctReorder): void {
    this.lists.update((ls) => [...ls, list]);
  }
  unregister(list: StrctReorder): void {
    this.lists.update((ls) => ls.filter((l) => l !== list));
  }
  /** The list next to `list` in the given direction, or null at the ends. */
  neighbour(list: StrctReorder, dir: -1 | 1): StrctReorder | null {
    const ordered = this.ordered();
    const i = ordered.indexOf(list);
    return ordered[i + dir] ?? null;
  }
  /** DOM order, not registration order — columns read left to right. */
  ordered(): StrctReorder[] {
    return [...this.lists()].sort((a, b) =>
      a.element().compareDocumentPosition(b.element()) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
  }
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
  /** The group this list belongs to, when it is one of several. */
  readonly group = inject(StrctReorderGroup, { optional: true });
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
  /** This list's name inside a `[strctReorderGroup]`. */
  readonly listId = input('');
  /** What a move between lists says (localizable). */
  readonly moveAnnouncement = input(
    (label: string, list: string, position: number, total: number) =>
      `Moved ${label} to ${list}, position ${position} of ${total}`,
  );

  readonly dragIndex = signal<number | null>(null);
  readonly overIndex = signal<number | null>(null);
  /** Id of the sr-only instructions element the items point to. */
  readonly instructionsId = `strct-reorder-hint-${++reorderCounter}`;
  private hint: HTMLElement | null = null;

  /** The container element — the group orders its lists by DOM position. */
  element(): HTMLElement {
    return this.host.nativeElement;
  }

  /** Move an item into this list at `index`, and say so. */
  acceptFrom(from: StrctReorder, fromIndex: number, index: number): void {
    const item = from.items()[fromIndex];
    if (!item) return;
    const label = item.textContent?.trim() ?? '';
    const toIndex = Math.max(0, Math.min(index, this.items().length));
    from.dragIndex.set(null);
    this.overIndex.set(null);
    this.group?.source.set(null);
    this.group?.moved.emit({
      item,
      fromList: from.listId(),
      toList: this.listId(),
      fromIndex,
      toIndex,
    });
    this.announcer.announce(
      this.moveAnnouncement()(label, this.listId(), toIndex + 1, this.items().length + 1),
    );
  }

  constructor() {
    this.group?.register(this);
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
    if (this.dragIndex() == null && !this.group?.source()) return;
    if ((event.target as HTMLElement).closest('[strctReorderItem]')) return;
    event.preventDefault();
  }

  @HostListener('drop', ['$event'])
  protected onContainerDrop(event: DragEvent): void {
    if ((event.target as HTMLElement).closest('[strctReorderItem]')) return;
    const source = this.group?.source();
    if (source && source.list !== this) {
      event.preventDefault();
      this.acceptFrom(source.list, source.index, this.items().length);
      return;
    }
    const from = this.dragIndex();
    if (from == null) return; // an item already consumed this drop
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
    this.group?.unregister(this);
    if (this.hint) {
      this.renderer.removeChild(this.doc.body, this.hint);
      this.hint = null;
    }
  }
}

/**
 * The only place a drag may start from, when an item has one. Content that is
 * itself draggable — text selection, a chart brush — must not start a move.
 */
@Directive({ selector: '[strctReorderHandle]', host: { class: 'strct-reorder__handle' } })
export class StrctReorderHandle {}

/** One draggable row inside a `[strctReorder]` container. */
@Directive({
  selector: '[strctReorderItem]',
  host: {
    '[attr.draggable]': '!list.reorderDisabled()',
    '[attr.tabindex]': 'hostTabindex()',
    '[class.strct-reorder--dragging]': 'isDragging()',
    '[class.strct-reorder--over]': 'isOver()',
    // A display-only list says nothing about sorting: no roledescription, no
    // shortcuts, no tab stop of its own, and no description pointing at
    // instructions that do not apply.
    '[attr.aria-roledescription]': "list.reorderDisabled() ? null : 'sortable'",
    '[attr.aria-keyshortcuts]': 'list.reorderDisabled() ? null : shortcuts()',
    '[attr.aria-posinset]': 'list.reorderDisabled() ? null : index() + 1',
    '[attr.aria-setsize]': 'list.reorderDisabled() ? null : list.items().length',
    '[attr.aria-describedby]':
      'list.reorderDisabled() || !list.instructions() ? null : list.instructionsId',
  },
})
export class StrctReorderItem {
  protected readonly list = inject(StrctReorder);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  // Captured before our own binding ever writes tabindex, so it never flips.
  private readonly hadOwnTabindex = this.el.nativeElement.hasAttribute('tabindex');

  protected hostTabindex(): number | null {
    if (this.hadOwnTabindex) return null;
    return this.list.reorderDisabled() ? null : 0;
  }

  /** The keys that apply: the sideways pair only when there is somewhere to go. */
  protected shortcuts(): string {
    return this.list.group
      ? 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight'
      : 'Alt+ArrowUp Alt+ArrowDown';
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

  /** Where the last pointerdown landed — a drag may only start on a handle. */
  private fromHandle = false;

  @HostListener('pointerdown', ['$event'])
  protected onPointerDown(event: PointerEvent): void {
    this.fromHandle = !!(event.target as HTMLElement).closest('[strctReorderHandle]');
  }

  @HostListener('dragstart', ['$event'])
  protected onDragStart(event: DragEvent): void {
    if (this.list.reorderDisabled()) return;
    // With a handle present, only the handle starts a move.
    if (this.el.nativeElement.querySelector('[strctReorderHandle]') && !this.fromHandle) {
      event.preventDefault();
      return;
    }
    this.list.dragIndex.set(this.index());
    this.list.group?.source.set({ list: this.list, index: this.index() });
    event.dataTransfer?.setData('text/plain', String(this.index()));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  @HostListener('dragover', ['$event'])
  protected onDragOver(event: DragEvent): void {
    if (this.list.dragIndex() == null && !this.list.group?.source()) return;
    event.preventDefault();
    this.list.overIndex.set(this.index());
  }

  @HostListener('drop', ['$event'])
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const source = this.list.group?.source();
    if (source && source.list !== this.list) {
      this.list.acceptFrom(source.list, source.index, this.index());
      return;
    }
    const from = this.list.dragIndex();
    if (from == null) return;
    this.list.commit(from, this.index());
  }

  @HostListener('dragend')
  protected onDragEnd(): void {
    this.list.dragIndex.set(null);
    this.list.overIndex.set(null);
    this.list.group?.source.set(null);
  }

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.list.reorderDisabled() || !event.altKey) return;
    const group = this.list.group;
    // Alt+Left / Alt+Right move to the neighbouring list at the same index.
    if (group && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const target = group.neighbour(this.list, event.key === 'ArrowLeft' ? -1 : 1);
      if (!target) return;
      event.preventDefault();
      const index = this.index();
      target.acceptFrom(this.list, index, index);
      setTimeout(() => target.items()[Math.min(index, target.items().length - 1)]?.focus());
      return;
    }
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
