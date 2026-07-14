import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { StrctIcon, StrctIconBadge } from '../icon/icon';
import { StrctContextMenuTrigger, StrctMenuItem } from '../context-menu/menu';

/** A node in the data-driven tree (`<strct-tree [nodes]="...">`). */
export interface StrctTreeNodeData {
  /**
   * Stable unique key — used for `trackBy`, controlled expansion state
   * (`expandedIds`) and a `data-node-id` DOM attribute. Falls back to `label`
   * when absent (backward-compatible).
   */
  id?: string;
  label: string;
  /** Optional leading icon name. */
  icon?: string;
  /** Status dot on the icon (running / maintenance / off …). */
  badge?: StrctIconBadge;
  /** Highlight as the selected node. */
  active?: boolean;
  /** Initial expanded state. */
  expanded?: boolean;
  children?: StrctTreeNodeData[];
  /** Arbitrary payload returned with (nodeActivated). */
  data?: unknown;
}

/** Per-node menu resolver for the data-driven tree — returns the items for one node. */
export type StrctTreeNodeMenuFn = (node: StrctTreeNodeData) => StrctMenuItem[];

/** Payload of (nodeMenuSelect). */
export interface StrctTreeMenuEvent {
  node: StrctTreeNodeData;
  item: StrctMenuItem;
}

/**
 * Tree node. Two modes:
 *  - **Content:** nest `<strct-tree-node>` children manually.
 *  - **Data:** pass a `[node]` object that recurses over its `children` —
 *    used internally by `<strct-tree [nodes]>`.
 *
 *   <strct-tree-node label="Group" icon="layers" badge="success" [(expanded)]="open">
 *     <strct-tree-node label="Leaf" icon="vm" [active]="true" />
 *   </strct-tree-node>
 */
@Component({
  selector: 'strct-tree-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctContextMenuTrigger],
  template: `
    <div
      class="strct-tnode__row"
      [class.strct-tnode__row--active]="displayActive()"
      role="treeitem"
      [attr.tabindex]="rowTabindex()"
      [attr.aria-level]="level"
      [attr.aria-selected]="displayActive()"
      [attr.aria-expanded]="hasChildren() ? isOpen() : null"
      [strctContextMenu]="menuItems()"
      [strctContextMenuData]="node()"
      (menuSelect)="onMenuSelect($event)"
      (click)="onActivate()"
      (focus)="onRowFocus()"
      (keydown)="onRowKeydown($event)"
      (keydown.enter)="onActivate()"
      (keydown.space)="$event.preventDefault(); onActivate()"
    >
      @if (hasChildren()) {
        <span
          class="strct-tnode__chevron"
          [class.strct-tnode__chevron--open]="isOpen()"
          role="button"
          [attr.aria-label]="(isOpen() ? 'Collapse ' : 'Expand ') + displayLabel()"
          [attr.tabindex]="tree ? -1 : 0"
          (click)="$event.stopPropagation(); toggle()"
          (keydown.enter)="$event.stopPropagation(); toggle()"
          (keydown.space)="$event.stopPropagation(); toggle()"
        >
          <strct-icon name="chevronRight" [size]="12" [strokeWidth]="1.5" />
        </span>
      } @else {
        <span class="strct-tnode__spacer"></span>
      }
      @if (displayIcon()) {
        <strct-icon
          class="strct-tnode__icon"
          [name]="displayIcon()!"
          [size]="16"
          [strokeWidth]="1.3"
          [badge]="displayBadge()"
        />
      }
      <span class="strct-tnode__label">{{ displayLabel() }}</span>
      <ng-content select="[strctTreeTrailing]" />
    </div>
    @if (hasChildren() && isOpen()) {
      <div class="strct-tnode__children" role="group">
        @if (node()) {
          @for (child of node()!.children ?? []; track child.id ?? child.label) {
            <strct-tree-node
              [node]="child"
              [nodeMenu]="nodeMenu()"
              (nodeActivated)="nodeActivated.emit($event)"
              (nodeMenuSelect)="nodeMenuSelect.emit($event)"
            />
          }
        } @else {
          <ng-content />
        }
      </div>
    }
  `,
  host: {
    class: 'strct-tnode',
    '[attr.data-node-id]': 'node()?.id ?? null',
  },
  styles: [
    `
      .strct-tnode {
        display: block;
      }
      .strct-tnode__row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 9px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 13px;
        color: var(--t1);
        user-select: none;
      }
      .strct-tnode__row:hover {
        background: var(--bg-3);
      }
      .strct-tnode__row:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 2px var(--acc50);
      }
      .strct-tnode__row--active {
        background: var(--acc-m);
        color: var(--acc);
        font-weight: 500;
      }
      .strct-tnode__row--active .strct-tnode__icon,
      .strct-tnode__row--active .strct-tnode__chevron {
        color: var(--acc);
      }
      .strct-tnode__chevron {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--t3);
        transition: transform 0.15s ease;
        /* 24px hit target (WCAG 2.5.8) without changing visual density. */
        width: 24px;
        height: 24px;
        margin: -5px;
        margin-inline-end: -10px;
        flex-shrink: 0;
      }
      .strct-tnode__chevron--open {
        transform: rotate(90deg);
      }
      .strct-tnode__spacer {
        width: 14px;
        flex-shrink: 0;
      }
      @media (prefers-reduced-motion: reduce) {
        .strct-tnode__chevron {
          transition: none;
        }
      }
      .strct-tnode__icon {
        color: var(--t2);
        flex-shrink: 0;
      }
      .strct-tnode__label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .strct-tnode__children {
        margin-inline-start: 16px;
      }
    `,
  ],
})
export class StrctTreeNode {
  /** Data-driven node; when set, label/icon/children come from it. */
  readonly node = input<StrctTreeNodeData | null>(null);
  /** Label text. */
  readonly label = input('');
  /** Icon name. */
  readonly icon = input<string | undefined>(undefined);
  /** Status dot variant. */
  readonly badge = input<StrctIconBadge>('none');
  /** Whether the item is active / selected. */
  readonly active = input(false);
  /** Whether the panel is open (two-way). */
  readonly expanded = model(false);
  /** Per-node menu resolver (data mode); bubbles down the recursion. */
  readonly nodeMenu = input<StrctTreeNodeMenuFn | null>(null);
  /** Content-mode click. */
  readonly activated = output<void>();
  /** Data-mode click — carries the activated node (bubbles to the tree). */
  readonly nodeActivated = output<StrctTreeNodeData>();
  /** Data-mode right-click menu selection (bubbles to the tree). */
  readonly nodeMenuSelect = output<StrctTreeMenuEvent>();

  /** Right-click menu items for this node ([] when no resolver / not data mode). */
  protected readonly menuItems = computed<StrctMenuItem[]>(() => {
    const fn = this.nodeMenu();
    const n = this.node();
    return fn && n ? fn(n) : [];
  });

  /** The owning `<strct-tree>` (null only for standalone nodes outside a tree). */
  protected readonly tree = inject<StrctTree | null>(
    forwardRef(() => StrctTree),
    { optional: true },
  );
  /** Parent tree node (element-injector ancestor); drives aria-level + ArrowLeft. */
  readonly parent = inject(StrctTreeNode, { optional: true, skipSelf: true });
  /** 1-based depth, exposed as aria-level. */
  readonly level: number = (this.parent?.level ?? 0) + 1;
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly childNodes = contentChildren(StrctTreeNode);
  /** Data-mode expansion fallback when there is no owning tree (seeded from node.expanded). */
  private readonly dataExpanded = signal<boolean | null>(null);

  protected readonly displayLabel = computed(() => this.node()?.label ?? this.label());
  protected readonly displayIcon = computed(() => this.node()?.icon ?? this.icon());
  protected readonly displayBadge = computed<StrctIconBadge>(
    () => this.node()?.badge ?? this.badge(),
  );
  protected readonly displayActive = computed(() => this.node()?.active ?? this.active());

  constructor() {
    // Register with the owning tree for roving focus / keyboard navigation.
    // Collapsed subtrees are not rendered, so the registry always holds exactly
    // the visible nodes.
    this.tree?.registerNode(this);
    inject(DestroyRef).onDestroy(() => this.tree?.unregisterNode(this));
  }

  /** The focusable row element of this node. */
  rowEl(): HTMLElement | null {
    return this.hostEl.nativeElement.querySelector(':scope > .strct-tnode__row');
  }

  /** Roving tabindex: inside a tree only the active row is tabbable. */
  protected readonly rowTabindex = computed(() =>
    this.tree ? (this.tree.isRovingActive(this) ? 0 : -1) : 0,
  );

  protected onRowFocus(): void {
    this.tree?.setActive(this);
  }

  protected onRowKeydown(event: KeyboardEvent): void {
    if (!this.tree) return;
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.tree.navigate(this, event.key);
  }

  readonly hasChildren = computed(() => {
    const n = this.node();
    return n ? (n.children?.length ?? 0) > 0 : this.childNodes().length > 0;
  });

  readonly isOpen = computed(() => {
    const n = this.node();
    if (n) {
      // Data mode: the owning tree is the single source of truth for expansion
      // (controlled `expandedIds` or its internal set). Only fall back to the
      // private seed when used as a standalone data node with no owning tree.
      if (this.tree) return this.tree.isNodeOpen(n);
      return this.dataExpanded() ?? n.expanded ?? false;
    }
    return this.expanded();
  });

  toggle(): void {
    const n = this.node();
    if (n) {
      if (this.tree) this.tree.toggleNode(n);
      else this.dataExpanded.set(!this.isOpen());
    } else {
      this.expanded.update((v) => !v);
    }
  }

  protected onActivate(): void {
    const n = this.node();
    if (n) this.nodeActivated.emit(n);
    else this.activated.emit();
  }

  protected onMenuSelect(item: StrctMenuItem): void {
    const n = this.node();
    if (n) this.nodeMenuSelect.emit({ node: n, item });
  }
}

/**
 * Root container for a tree. Either project `<strct-tree-node>` children, or
 * pass `[nodes]` for a fully data-driven, self-recursing tree:
 *   <strct-tree [nodes]="roots" (nodeActivated)="select($event)" />
 */
@Component({
  selector: 'strct-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctTreeNode],
  template: `
    @if (nodes(); as ns) {
      @for (n of ns; track n.id ?? n.label) {
        <strct-tree-node
          [node]="n"
          [nodeMenu]="nodeMenu()"
          (nodeActivated)="nodeActivated.emit($event)"
          (nodeMenuSelect)="nodeMenuSelect.emit($event)"
        />
      }
    } @else {
      <ng-content />
    }
  `,
  host: { class: 'strct-tree', role: 'tree' },
  styles: [
    `
      .strct-tree {
        display: block;
      }
    `,
  ],
})
export class StrctTree {
  /** Data-driven node list; when set, projected content is ignored. */
  readonly nodes = input<StrctTreeNodeData[] | null>(null);
  /** Per-node right-click menu resolver. */
  readonly nodeMenu = input<StrctTreeNodeMenuFn | null>(null);
  /** Emitted when any data-driven node is clicked. */
  readonly nodeActivated = output<StrctTreeNodeData>();
  /** Emitted when a data-driven node's right-click menu item is chosen. */
  readonly nodeMenuSelect = output<StrctTreeMenuEvent>();

  /**
   * Controlled expansion (two-way). When non-null it is the single source of
   * truth: node open state derives from it and toggles write back through it, so
   * persisting/restoring is `<strct-tree [(expandedIds)]="ids" />`. When null
   * (default), expansion is uncontrolled — seeded from each node's `expanded`
   * flag and owned internally (backward-compatible).
   */
  readonly expandedIds = model<string[] | null>(null);
  /** The full set of expanded ids, emitted on every expand / collapse. */
  readonly expandedChange = output<string[]>();
  /** Emitted per toggle with the node and its new state. */
  readonly nodeToggled = output<{ node: StrctTreeNodeData; expanded: boolean }>();

  /** Stable key for a node: its `id`, or the `label` as a fallback. */
  private readonly keyOf = (n: StrctTreeNodeData): string => n.id ?? n.label;

  /** Explicit user toggles layered on top of the `node.expanded` seed (uncontrolled). */
  private readonly overrides = signal<Map<string, boolean>>(new Map());

  /** Keys expanded by their `node.expanded` seed (pure — no flash on first render). */
  private readonly seededSet = computed<Set<string>>(() => {
    const set = new Set<string>();
    const walk = (arr: StrctTreeNodeData[]): void => {
      for (const n of arr) {
        if (n.expanded) set.add(this.keyOf(n));
        if (n.children?.length) walk(n.children);
      }
    };
    const ns = this.nodes();
    if (ns) walk(ns);
    return set;
  });

  /** The active expanded-key set — controlled `expandedIds`, or seed + overrides. */
  private readonly currentSet = computed<Set<string>>(() => {
    const ids = this.expandedIds();
    if (ids != null) return new Set(ids);
    const set = new Set(this.seededSet());
    for (const [key, open] of this.overrides()) {
      if (open) set.add(key);
      else set.delete(key);
    }
    return set;
  });

  /** Whether a node is currently expanded (called by its `StrctTreeNode`). */
  isNodeOpen(node: StrctTreeNodeData): boolean {
    return this.currentSet().has(this.keyOf(node));
  }

  // ── Roving focus / keyboard navigation (ARIA tree pattern) ─────
  private readonly registeredNodes = signal<StrctTreeNode[]>([]);
  private readonly activeRoving = signal<StrctTreeNode | null>(null);

  registerNode(node: StrctTreeNode): void {
    this.registeredNodes.update((list) => [...list, node]);
  }
  unregisterNode(node: StrctTreeNode): void {
    this.registeredNodes.update((list) => list.filter((n) => n !== node));
    if (this.activeRoving() === node) this.activeRoving.set(null);
  }

  /** Visible nodes in document order (collapsed subtrees are never registered). */
  private ordered(): StrctTreeNode[] {
    return [...this.registeredNodes()].sort((a, b) => {
      const ra = a.rowEl();
      const rb = b.rowEl();
      if (!ra || !rb) return 0;
      return ra.compareDocumentPosition(rb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  /** Whether this node currently holds the roving tabindex (0). */
  isRovingActive(node: StrctTreeNode): boolean {
    const active = this.activeRoving();
    if (active) return active === node;
    return this.ordered()[0] === node;
  }

  setActive(node: StrctTreeNode): void {
    this.activeRoving.set(node);
  }

  private focusNode(node: StrctTreeNode | undefined): void {
    if (!node) return;
    this.activeRoving.set(node);
    node.rowEl()?.focus();
  }

  /** Keyboard navigation between visible rows (called from the focused node). */
  navigate(node: StrctTreeNode, key: string): void {
    const list = this.ordered();
    const i = list.indexOf(node);
    if (i < 0) return;
    switch (key) {
      case 'ArrowDown':
        this.focusNode(list[Math.min(i + 1, list.length - 1)]);
        break;
      case 'ArrowUp':
        this.focusNode(list[Math.max(i - 1, 0)]);
        break;
      case 'Home':
        this.focusNode(list[0]);
        break;
      case 'End':
        this.focusNode(list[list.length - 1]);
        break;
      case 'ArrowRight':
        // Closed parent: open it. Open parent: move into the first child.
        if (node.hasChildren() && !node.isOpen()) node.toggle();
        else if (node.hasChildren() && i + 1 < list.length) this.focusNode(list[i + 1]);
        break;
      case 'ArrowLeft':
        // Open parent: close it. Otherwise: move focus to the parent node.
        if (node.hasChildren() && node.isOpen()) node.toggle();
        else if (node.parent) this.focusNode(node.parent);
        break;
    }
  }

  /** Toggle a node's expansion, updating state and emitting outputs. */
  toggleNode(node: StrctTreeNodeData): void {
    const key = this.keyOf(node);
    const expanded = !this.currentSet().has(key);
    if (this.expandedIds() != null) {
      const set = new Set(this.currentSet());
      if (expanded) set.add(key);
      else set.delete(key);
      this.expandedIds.set([...set]);
    } else {
      const next = new Map(this.overrides());
      next.set(key, expanded);
      this.overrides.set(next);
    }
    this.nodeToggled.emit({ node, expanded });
    this.expandedChange.emit([...this.currentSet()]);
  }
}
