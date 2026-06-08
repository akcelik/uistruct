import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChildren,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { StrctIcon, StrctIconBadge } from '../icon/icon';
import { StrctContextMenuTrigger, StrctMenuItem } from '../context-menu/menu';

/** A node in the data-driven tree (`<strct-tree [nodes]="...">`). */
export interface StrctTreeNodeData {
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
      tabindex="0"
      [attr.aria-selected]="displayActive()"
      [attr.aria-expanded]="hasChildren() ? isOpen() : null"
      [strctContextMenu]="menuItems()"
      [strctContextMenuData]="node()"
      (menuSelect)="onMenuSelect($event)"
      (click)="onActivate()"
      (keydown.enter)="onActivate()"
      (keydown.space)="onActivate()"
    >
      @if (hasChildren()) {
        <span
          class="strct-tnode__chevron"
          [class.strct-tnode__chevron--open]="isOpen()"
          role="button"
          tabindex="0"
          (click)="$event.stopPropagation(); toggle()"
          (keydown.enter)="$event.stopPropagation(); toggle()"
          (keydown.space)="$event.stopPropagation(); toggle()"
        >
          <strct-icon name="chevronRight" [size]="12" [strokeWidth]="1.7" />
        </span>
      } @else {
        <span class="strct-tnode__spacer"></span>
      }
      @if (displayIcon()) {
        <strct-icon
          class="strct-tnode__icon"
          [name]="displayIcon()!"
          [size]="14"
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
          @for (child of node()!.children ?? []; track $index) {
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
  host: { class: 'strct-tnode' },
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
        color: var(--t3);
        transition: transform 0.15s ease;
        width: 14px;
        justify-content: center;
      }
      .strct-tnode__chevron--open {
        transform: rotate(90deg);
      }
      .strct-tnode__spacer {
        width: 14px;
        flex-shrink: 0;
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
        margin-left: 16px;
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

  private readonly childNodes = contentChildren(StrctTreeNode);
  /** Data-mode expansion (seeded from node.expanded on first toggle). */
  private readonly dataExpanded = signal<boolean | null>(null);

  protected readonly displayLabel = computed(() => this.node()?.label ?? this.label());
  protected readonly displayIcon = computed(() => this.node()?.icon ?? this.icon());
  protected readonly displayBadge = computed<StrctIconBadge>(
    () => this.node()?.badge ?? this.badge(),
  );
  protected readonly displayActive = computed(() => this.node()?.active ?? this.active());

  protected readonly hasChildren = computed(() => {
    const n = this.node();
    return n ? (n.children?.length ?? 0) > 0 : this.childNodes().length > 0;
  });

  protected readonly isOpen = computed(() => {
    if (this.node()) return this.dataExpanded() ?? this.node()!.expanded ?? false;
    return this.expanded();
  });

  toggle(): void {
    if (this.node()) {
      this.dataExpanded.set(!this.isOpen());
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
      @for (n of ns; track $index) {
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
}
