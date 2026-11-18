import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { StrctIcon, StrctIconBadge, StrctIconMode, StrctIconStatus } from '../icon/icon';
import { StrctBadge, StrctBadgeStatus } from '../badge/badge';
import { StrctSpinner } from '../spinner/spinner';
import { StrctContextMenuTrigger, StrctMenuItem } from '../context-menu/menu';
import { StrctAnnouncer } from '../a11y/announcer';

/** A node in the data-driven tree (`<strct-tree [nodes]="...">`). */
/**
 * Whether the object can be reached at all. It is the axis that decides
 * whether the rest of the row can be trusted, so it is drawn on the ROW —
 * the label recedes and the kind icon is cut — rather than in a corner of the
 * icon, where it used to take the power badge's slot and make "switched off"
 * and "not answering" the same mark.
 */
export type StrctTreeReach = 'ok' | 'stale' | 'unreachable' | 'orphaned';

/** The object's own power, where it has one. `on` draws nothing. */
export type StrctTreePower = 'on' | 'off' | 'suspended';

/**
 * What the alarms say about this object. `ok` draws nothing — and `unknown`
 * is not `ok`: it is the case where the alarms were never read, or the read
 * failed, which a tree that can only say "no mark" reports as healthy.
 */
export type StrctTreeHealth = 'ok' | 'unknown' | 'warning' | 'critical';

/** What the alarms say about everything under a node that is collapsed. */
export interface StrctTreeRollup {
  warning?: number;
  critical?: number;
  /**
   * How many children could not be judged. It is NOT counted as a warning
   * and draws no chip — "we have not read these" is not an alarm, and a
   * number beside the name would make it look like one. It is said in the
   * node's description, where a reader who asks gets the answer.
   */
  unknown?: number;
}

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
  /**
   * A mode the operator put the object in — drained for patching — drawn in
   * the icon's own top-end corner, so health keeps the bottom one and a host
   * that is both in maintenance and alarmed shows both.
   */
  mode?: StrctIconMode;
  /**
   * What a screen reader hears about this node's state, after its label.
   * Built from the mode and the badge when absent; `''` says nothing, for a
   * tree that already puts the words in the label.
   */
  stateLabel?: string;
  /**
   * Can the object be reached, and how recently? `unreachable` (not
   * answering, disconnected) and `orphaned` (its parent no longer knows it)
   * draw the row back and cut the icon, and leave the other three axes to say
   * what was last known. `stale` is the rung below them — it answered, but
   * the reading is older than the consumer's threshold — so the row recedes
   * and the icon is NOT cut: nobody is saying it is down.
   */
  reach?: StrctTreeReach;
  /**
   * Its power: `off` and `suspended` are drawn in the icon's bottom corner,
   * `on` draws nothing — a running machine is the normal case, and a tree
   * where every normal row carries a mark is a tree with no marks.
   */
  power?: StrctTreePower;
  /**
   * What its alarms say. `unknown` draws a ring in the health corner — a
   * slot with nothing in it — so an object nobody has read is never drawn as
   * a healthy one.
   */
  health?: StrctTreeHealth;
  /** What the alarms under it say, for a node whose children are not visible. */
  rollup?: StrctTreeRollup;
  /** Highlight as the selected node. */
  active?: boolean;
  /** Initial expanded state. */
  expanded?: boolean;
  children?: StrctTreeNodeData[];
  /**
   * A quiet trailing word on the row — what `[strctTreeTrailing]` is for a
   * projected node: "VM" on a virtual machine's own folder.
   */
  meta?: string;
  /** A trailing tag instead of (or beside) `meta`. */
  tag?: { label: string; status?: StrctBadgeStatus };
  /**
   * "It has children, they have not been read yet": the chevron and
   * `aria-expanded` appear before `children` arrives, and expanding emits
   * `(nodeToggled)` as usual. A node that turns out to be empty loses its
   * chevron when `children` arrives as `[]`.
   */
  hasChildren?: boolean;
  /** Its children are being read: a quiet row under it, and `aria-busy`. */
  loading?: boolean;
  /** Arbitrary payload returned with (nodeActivated). */
  data?: unknown;
}

/** Per-node menu resolver for the data-driven tree — returns the items for one node. */
export type StrctTreeNodeMenuFn = (node: StrctTreeNodeData) => StrctMenuItem[];

/** Payload of (nodeDrop): the dragged node and the node it was dropped on. */
export interface StrctTreeDropEvent {
  source: StrctTreeNodeData;
  target: StrctTreeNodeData;
  /**
   * Where the drop landed. Only `'into'` today — the field exists so
   * before/after reordering can be added without changing the event's shape.
   */
  position: 'into';
}

/** Payload of (dropRefused): a refusal the consumer gave a reason for. */
export interface StrctTreeDropRefusal {
  source: StrctTreeNodeData;
  target: StrctTreeNodeData;
  reason: string;
}

/** Payload of (nodeMenuSelect). */
export interface StrctTreeMenuEvent {
  node: StrctTreeNodeData;
  item: StrctMenuItem;
}

/**
 * What a node's state is called, after its label. One object, so a tree is
 * translated in one place (FR-61-02).
 */
export type StrctTreeStateWords = Partial<
  Record<StrctIconBadge | StrctIconMode | StrctTreeReach | StrctTreePower | StrctTreeHealth, string>
>;

/** The library's words for the badge and mode states. */
export const defaultStateWords: StrctTreeStateWords = {
  maintenance: 'In maintenance',
  maintenanceEntering: 'Entering maintenance',
  critical: 'Critical',
  warning: 'Warning',
  success: 'Healthy',
  info: 'Information',
  running: 'Running',
  paused: 'Paused',
  off: 'Off',
  unreachable: 'Not reachable',
  orphaned: 'Orphaned',
  stale: 'Not current',
  unknown: 'Health unknown',
  suspended: 'Suspended',
};

/** Default chevron aria-label factory — mirrors the `chevronAriaLabel` input default. */
const defaultChevronAriaLabel = (expanded: boolean, label: string): string =>
  `${expanded ? 'Collapse' : 'Expand'} ${label}`;

let treeNodeCounter = 0;

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
  imports: [StrctIcon, StrctContextMenuTrigger, StrctBadge, StrctSpinner],
  template: `
    <div
      class="strct-tnode__row"
      [class.strct-tnode__row--active]="displayActive()"
      [class.strct-tnode__row--stale]="displayReach() === 'stale' || treeStale()"
      [class.strct-tnode__row--unreachable]="
        displayReach() === 'unreachable' || displayReach() === 'orphaned'
      "
      [class.strct-tnode__row--orphaned]="displayReach() === 'orphaned'"
      role="treeitem"
      [attr.tabindex]="rowTabindex()"
      [attr.aria-level]="level"
      [attr.aria-setsize]="setSize()"
      [attr.aria-posinset]="posInSet()"
      [attr.aria-selected]="displayActive()"
      [attr.aria-description]="stateDescription() || null"
      [attr.aria-expanded]="hasChildren() ? isOpen() : null"
      [attr.aria-busy]="node()?.loading ? true : null"
      [attr.aria-owns]="hasChildren() && isOpen() ? groupId : null"
      [attr.draggable]="isDraggable() ? 'true' : null"
      [class.strct-tnode__row--dragging]="isDragSource()"
      [class.strct-tnode__row--droptarget]="isDropTarget()"
      [strctContextMenu]="menuItems()"
      [strctContextMenuData]="node()"
      (menuSelect)="onMenuSelect($event)"
      (dragstart)="onDragStart($event)"
      (dragend)="onDragEnd()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave()"
      (drop)="onDrop($event)"
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
          [attr.aria-label]="chevronAriaLabel()"
          [attr.tabindex]="tree ? -1 : 0"
          (click)="$event.stopPropagation(); toggle()"
          (keydown.enter)="$event.stopPropagation(); toggle()"
          (keydown.space)="$event.preventDefault(); $event.stopPropagation(); toggle()"
        >
          <strct-icon name="chevronRight" [size]="12" />
        </span>
      } @else {
        <span class="strct-tnode__spacer"></span>
      }
      @if (displayIcon()) {
        <strct-icon
          class="strct-tnode__icon"
          [class.strct-tnode__icon--moded]="displayMode() !== 'none'"
          [class.strct-tnode__icon--marked]="iconBadge() !== 'none' || iconLifecycle() !== 'none'"
          [status]="iconStatus()"
          [name]="displayIcon()!"
          [size]="iconSize()"
          [badge]="iconBadge()"
          [lifecycle]="iconLifecycle()"
          [mode]="displayMode()"
        />
      }
      <span class="strct-tnode__label">{{ displayLabel() }}</span>
      <!-- What is wrong UNDER a closed node is not the node's own state, so
           it does not take one of the glyph's corners: at 18px a third mark
           would overlap the alarm in the opposite one. It sits against the
           name instead, in the same shape and tone language, so the glyph
           keeps saying what the object itself is (FR-82-01). -->
      @if (stateMark(); as mark) {
        <span class="strct-tnode__rollup strct-tnode__rollup--{{ mark.tone }}" aria-hidden="true">
          <svg viewBox="0 0 10 10" aria-hidden="true">
            @if (mark.shape === 'critical') {
              <path d="M5 0.6L9.4 5L5 9.4L0.6 5Z" />
            } @else {
              <path d="M5 0.8L9.5 9.1H0.5Z" />
            }
          </svg>
          {{ mark.count }}
        </span>
      }
      @if (node()?.tag; as tag) {
        <strct-badge class="strct-tnode__tag" [status]="tag.status ?? 'neutral'">{{
          tag.label
        }}</strct-badge>
      }
      @if (node()?.meta; as meta) {
        <span class="strct-tnode__meta">{{ meta }}</span>
      }
      <ng-content select="[strctTreeTrailing]" />
    </div>
    @if (hasChildren() && isOpen()) {
      <div class="strct-tnode__children" role="group" [id]="groupId">
        @if (node()?.loading) {
          <div class="strct-tnode__loading">
            <span class="strct-tnode__spacer"></span>
            <strct-spinner size="sm" [caption]="loadingLabel()" />
          </div>
        }
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
    // Presentational wrapper: the treeitem row and its children group are
    // siblings in the DOM, so the host must not appear in the a11y tree.
    role: 'none',
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
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: var(--text-md);
        color: var(--t1);
        user-select: none;
      }
      .strct-tnode__row:hover {
        background: var(--bg-3);
      }
      /* Drag feedback, in tokens: the source dims, an accepting target is
         outlined. A refusing target gets no class — the browser's own
         "not-allowed" cursor says so, because dragover is not prevented. */
      .strct-tnode__row--dragging {
        opacity: 0.45;
      }
      .strct-tnode__row--droptarget,
      .strct-tnode__row--droptarget:hover {
        background: var(--acc-s);
        outline: 1px solid var(--acc);
        outline-offset: -1px;
      }
      .strct-tnode__row:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 2px var(--acc50);
      }
      /* The accent on its own fill measured 4.49:1 over --bg-2 (arctic light)
         — under AA, and a tree in a sidebar sits on --bg-2 all the time. The
         label takes the primary text colour; the fill, the weight and the
         accent icon still say which row is active, and an icon only owes
         3:1. */
      .strct-tnode__row--active {
        background: var(--acc-m);
        color: var(--t1);
        font-weight: 600;
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
      /* RTL: the collapsed chevron points toward the inline end (left). */
      [dir='rtl'] .strct-tnode__chevron:not(.strct-tnode__chevron--open) {
        transform: rotate(180deg);
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
        /* --t2 unless the glyph has been given a tone of its own (the
           icon's own status), which is how an alarmed object reads as
           alarmed. */
        color: var(--strct-icon-color, var(--t2));
        flex-shrink: 0;
      }
      /* The corner marks overhang the glyph by 3-4px; without this the label
         starts against them and the two read as one smudge. */
      .strct-tnode__icon--moded,
      .strct-tnode__icon--marked {
        margin-inline-end: 5px;
      }
      .strct-tnode__label {
        flex: 0 1 auto;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      /* A reading that is no longer current: the row recedes, and that is
         all. It is the rung below unreachable on purpose — the object
         answered, so nothing cuts its glyph; what is in doubt is the age of
         what the row says, not whether anyone can hear it. The same muting
         covers a whole tree under the stale input, where the appliance itself
         has gone quiet and every row is as old as the last read. */
      .strct-tnode__row--stale .strct-tnode__label,
      .strct-tnode__row--stale .strct-tnode__meta {
        color: var(--t2);
      }
      .strct-tnode__row--stale .strct-tnode__icon > svg {
        opacity: 0.75;
      }
      /* An object that cannot be reached: the row recedes and its kind icon
         is cut, so a reader can see at a glance which part of the tree is
         still being heard from. What was last known about it — its power,
         the mode it was put in, its alarms — stays drawn, quietly: the point
         is that it cannot be reached, not that it is gone. */
      .strct-tnode__row--unreachable .strct-tnode__label {
        color: var(--t3);
      }
      .strct-tnode__row--unreachable .strct-tnode__icon {
        position: relative;
      }
      /* The GLYPH recedes, not the marks on it: an alarm on an object nobody
         can reach is the loudest thing on the row, and dimming the badge
         with the drawing underneath it would bury the news with the box. */
      .strct-tnode__row--unreachable .strct-tnode__icon > svg {
        opacity: 0.5;
      }
      .strct-tnode__row--unreachable .strct-tnode__icon::after {
        content: '';
        position: absolute;
        inset-inline: -2px;
        top: 50%;
        height: 1.5px;
        border-radius: var(--radius-xs);
        background: var(--t2);
        transform: rotate(-38deg);
      }
      /* Orphaned: the same recession, and the cut is dashed — nobody is
         saying it is down, only that its parent no longer knows it. */
      .strct-tnode__row--orphaned .strct-tnode__icon::after {
        background: repeating-linear-gradient(90deg, var(--t2) 0 2px, transparent 2px 4px);
      }
      /* The rollup: a count against the name, in the alarm's own silhouette
         and tone. It is not a trailing mark — it belongs to the node it is
         beside, and a reader should never have to cross the row to find it. */
      .strct-tnode__rollup {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        flex-shrink: 0;
        margin-inline-start: var(--space-2);
        font-size: var(--text-xs);
        font-variant-numeric: tabular-nums;
        line-height: 1;
      }
      .strct-tnode__rollup > svg {
        width: 11px;
        height: 11px;
        fill: currentColor;
        flex: none;
      }
      .strct-tnode__rollup--warning {
        color: var(--warning);
      }
      .strct-tnode__rollup--critical {
        color: var(--critical);
      }
      /* Trailing marks: they follow the label, never push it out of the row. */
      .strct-tnode__tag,
      .strct-tnode__meta,
      .strct-tnode__rollup {
        flex-shrink: 0;
      }
      .strct-tnode__meta {
        font-size: var(--text-xs);
        color: var(--t3);
        font-variant-numeric: tabular-nums;
      }
      /* An active row writes in 600; the trailing marks stay quiet. */
      .strct-tnode__row--active .strct-tnode__meta {
        font-weight: 400;
      }
      .strct-tnode__children {
        margin-inline-start: 16px;
      }
      /* "Its children are being read": one row in the children group, lined up
         with where the child labels will appear. */
      .strct-tnode__loading {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 9px;
        font-size: var(--text-md);
        color: var(--t3);
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
  /** A mode the operator chose (content mode) — drawn in the icon's own corner. */
  readonly mode = input<StrctIconMode>('none');
  /** What a reader hears after the label (content mode); '' says nothing. */
  readonly stateLabel = input<string | undefined>(undefined);
  /** Can it be reached (content mode)? */
  readonly reach = input<StrctTreeReach>('ok');
  /** Its power (content mode); `on` draws nothing. */
  readonly power = input<StrctTreePower>('on');
  /** What its alarms say (content mode); `ok` draws nothing. */
  readonly health = input<StrctTreeHealth>('ok');
  /** What the alarms under it say, while it is collapsed (content mode). */
  readonly rollup = input<StrctTreeRollup | null>(null);
  /** Whether the item is active / selected. */
  readonly active = input(false, { transform: booleanAttribute });
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

  /** Whether this row can be picked up — the tree asks the consumer's `canDrag`.
   *  Reads `nodes()` too, so a refresh that makes a node movable is honoured. */
  protected readonly isDraggable = computed(() => {
    const n = this.node();
    this.tree?.nodes();
    return !!n && !!this.tree?.canDragNode(n);
  });
  protected readonly isDragSource = computed(() => {
    const n = this.node();
    return !!n && !!this.tree?.isDragSource(n);
  });
  protected readonly isDropTarget = computed(() => {
    const n = this.node();
    return !!n && !!this.tree?.isDropTarget(n);
  });

  protected onDragStart(event: DragEvent): void {
    const n = this.node();
    if (!n || !this.tree || !this.isDraggable()) return;
    event.stopPropagation();
    // Firefox starts no drag without data on the transfer.
    event.dataTransfer?.setData('text/plain', n.label);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    this.tree.beginDrag(n);
  }

  protected onDragEnd(): void {
    this.tree?.endDrag();
  }

  protected onDragOver(event: DragEvent): void {
    const n = this.node();
    if (!n || !this.tree) return;
    event.stopPropagation();
    this.tree.dragOver(n, event.clientY, event.clientX);
    if (!this.tree.acceptsDrop(n)) {
      // No preventDefault: the pointer keeps the browser's "not allowed" cursor.
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  protected onDragLeave(): void {
    const n = this.node();
    if (n) this.tree?.dragLeave(n);
  }

  protected onDrop(event: DragEvent): void {
    const n = this.node();
    if (!n || !this.tree) return;
    event.preventDefault();
    event.stopPropagation();
    this.tree.dropOn(n);
  }

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
  /** Node icon scales with the owning tree's density (16 native → 18 comfortable). */
  /**
   * The glyph carries the object's state in its two corners, so it has to be
   * big enough to hold them: an 8px badge on a 16px glyph is a smudge at
   * arm's length on a 1920x1080 screen. 18px compact, 22px comfortable.
   */
  protected readonly iconSize = computed(() => (this.tree?.density() === 'comfortable' ? 22 : 18));
  /** Parent tree node (element-injector ancestor); drives aria-level + ArrowLeft. */
  readonly parent = inject(StrctTreeNode, { optional: true, skipSelf: true });
  /** 1-based depth, exposed as aria-level. */
  readonly level: number = (this.parent?.level ?? 0) + 1;
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _id = ++treeNodeCounter;
  /** Id of the children group container — the row's aria-owns target. */
  protected readonly groupId = `strct-tnode-group-${this._id}`;

  private readonly childNodes = contentChildren(StrctTreeNode);
  /** Direct projected children only (descendants would skew the sibling count). */
  private readonly directChildNodes = contentChildren(StrctTreeNode, { descendants: false });
  /** Data-mode expansion fallback when there is no owning tree (seeded from node.expanded). */
  private readonly dataExpanded = signal<boolean | null>(null);

  protected readonly displayLabel = computed(() => this.node()?.label ?? this.label());
  protected readonly displayIcon = computed(() => this.node()?.icon ?? this.icon());
  protected readonly displayBadge = computed<StrctIconBadge>(
    () => this.node()?.badge ?? this.badge(),
  );
  protected readonly displayMode = computed<StrctIconMode>(() => this.node()?.mode ?? this.mode());
  protected readonly displayReach = computed<StrctTreeReach>(
    () => this.node()?.reach ?? this.reach(),
  );
  protected readonly displayPower = computed<StrctTreePower>(
    () => this.node()?.power ?? this.power(),
  );
  protected readonly displayHealth = computed<StrctTreeHealth>(
    () => this.node()?.health ?? this.health(),
  );
  protected readonly displayRollup = computed<StrctTreeRollup | null>(
    () => this.node()?.rollup ?? this.rollup(),
  );

  /**
   * The badge the icon carries: an explicit `badge` still wins, so every map
   * written against the single-slot model keeps working. Otherwise it is the
   * power axis and nothing else — `on` is the normal case and draws nothing,
   * because a tree where every normal row carries a mark is a tree with no
   * marks.
   */
  protected readonly iconBadge = computed<StrctIconBadge>(() => {
    const own = this.displayBadge();
    if (own !== 'none') return own;
    const health = this.displayHealth();
    return health === 'ok' ? 'none' : health;
  });

  /** Is the whole tree out of date, whatever this row's own reach says? */
  protected readonly treeStale = computed(() => !!this.tree?.stale());

  /** The bottom corner: what the object's own power is doing. */
  protected readonly iconLifecycle = computed<'none' | 'running' | 'paused' | 'off'>(() => {
    // A tree still written against the single slot said everything through
    // `badge`; it keeps that drawing and gets no second mark.
    if (this.displayBadge() !== 'none') return 'none';
    switch (this.displayPower()) {
      case 'off':
        return 'off';
      case 'suspended':
        return 'paused';
      default:
        return 'none';
    }
  });

  /**
   * The glyph's own tone. An object whose alarm is critical IS red in an
   * inventory an operator knows — Clarity's `status`, which colours the icon
   * rather than decorating a corner of it. The row's end carries the same
   * state as a SHAPE, because colour alone is not enough (Clarity says so
   * too), and an object nobody can reach keeps the neutral glyph: what its
   * alarms said is last known, not current.
   */
  protected readonly iconStatus = computed<StrctIconStatus>(() => {
    const reach = this.displayReach();
    // Out of reach: what its alarms said is last known, not current, so the
    // glyph keeps the neutral tone. `stale` does NOT neutralise it — an
    // alarm twenty minutes old is still an alarm, and the receded row is
    // what says how old it is.
    if (reach === 'unreachable' || reach === 'orphaned') return 'neutral';
    const health = this.displayHealth();
    // Not read is not a fault: the ring says so without taking a hue.
    if (health === 'ok' || health === 'unknown') return 'neutral';
    return health;
  });

  /**
   * The mark at the row's end: this node's own alarm, or — while it is
   * collapsed — the worst alarm under it with how many there are. A node
   * whose children are open says only its own: the children are saying
   * theirs on their own rows.
   */
  protected readonly stateMark = computed<{
    shape: 'warning' | 'critical';
    tone: 'warning' | 'critical';
    count: number | null;
  } | null>(() => {
    // The node's own alarm is the badge on its glyph; this is only what is
    // under it while it is closed, which it wears as a number on that glyph.
    const rollup = this.displayRollup();
    if (!rollup || this.isOpen()) return null;
    const critical = rollup.critical ?? 0;
    const warning = rollup.warning ?? 0;
    if (!critical && !warning) return null;
    const shape = critical ? 'critical' : 'warning';
    return { shape, tone: shape, count: critical + warning };
  });

  /**
   * FR-61-02: a treeitem's name is its label, so a running VM, an alarmed host
   * and a drained one all read the same. The state goes in `aria-description`,
   * which leaves the name — and the tree's type-ahead — untouched.
   */
  protected readonly stateDescription = computed(() => {
    const own = this.node()?.stateLabel ?? this.stateLabel();
    if (own !== undefined && own !== null && own !== '') return own;
    if (own === '') return '';
    const words = this.tree?.stateWords() ?? defaultStateWords;
    const parts: string[] = [];
    // The order a reader needs it in: can it be reached, what was it put in,
    // is it on, and what are its alarms saying — the axes, each said once.
    const reach = this.displayReach();
    const mode = this.displayMode();
    const power = this.displayPower();
    const health = this.displayHealth();
    const badge = this.displayBadge();
    if (reach !== 'ok') parts.push(words[reach] ?? '');
    if (mode !== 'none') parts.push(words[mode] ?? '');
    if (power !== 'on') parts.push(words[power] ?? '');
    if (health !== 'ok') parts.push(words[health] ?? '');
    // The single-slot model, for a tree that has not moved to the axes.
    if (badge !== 'none' && power === 'on' && health === 'ok') parts.push(words[badge] ?? '');
    const mark = this.stateMark();
    if (mark?.count) {
      parts.push(`${mark.count} ${words[mark.tone] ?? mark.tone}`.toLowerCase());
    }
    // What is under it that nobody has read. It draws no chip — it is not an
    // alarm — but a reader who asks the row what it holds gets the number.
    const rollup = this.displayRollup();
    const unread = !this.isOpen() ? (rollup?.unknown ?? 0) : 0;
    if (unread) parts.push(`${unread} ${words.unknown ?? 'unknown'}`.toLowerCase());
    return parts.filter(Boolean).join(', ');
  });
  protected readonly displayActive = computed(() => this.node()?.active ?? this.active());

  /** Data-mode siblings (null in content mode): the parent's children, else the tree roots. */
  private readonly siblingData = computed<StrctTreeNodeData[] | null>(() => {
    const n = this.node();
    if (!n) return null;
    return this.parent?.node()?.children ?? this.tree?.nodes() ?? [n];
  });
  /** Content-mode siblings: the parent's (or owning tree's) direct projected nodes. */
  private readonly contentSiblings = computed<readonly StrctTreeNode[]>(() =>
    this.parent ? this.parent.contentChildNodes() : (this.tree?.contentChildNodes() ?? [this]),
  );
  /** Sibling count, exposed as aria-setsize. */
  protected readonly setSize = computed(
    () => this.siblingData()?.length ?? this.contentSiblings().length,
  );
  /** 1-based position among the siblings, exposed as aria-posinset. */
  protected readonly posInSet = computed(() => {
    const data = this.siblingData();
    if (data) return data.indexOf(this.node()!) + 1;
    return this.contentSiblings().indexOf(this) + 1;
  });

  /** Direct projected child nodes (content mode) — sibling source for aria-setsize/posinset. */
  contentChildNodes(): readonly StrctTreeNode[] {
    return this.directChildNodes();
  }

  /** Visible label text — matched by the owning tree's typeahead. */
  typeaheadLabel(): string {
    return this.displayLabel();
  }

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

  /** Wording of the "children are being read" row (from the owning tree). */
  protected readonly loadingLabel = computed(() => this.tree?.loadingLabel() ?? 'Loading…');

  /** Accessible label of the chevron toggle (factory from the owning tree). */
  protected readonly chevronAriaLabel = computed(() =>
    (this.tree?.chevronAriaLabel() ?? defaultChevronAriaLabel)(this.isOpen(), this.displayLabel()),
  );

  protected onRowFocus(): void {
    this.tree?.setActive(this);
  }

  protected onRowKeydown(event: KeyboardEvent): void {
    if (!this.tree) return;
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      this.tree.navigate(this, event.key);
      return;
    }
    // APG typeahead: a printable character jumps to the next matching visible
    // node. Space is excluded — it activates the row (keydown.space above).
    if (
      event.key.length === 1 &&
      event.key !== ' ' &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.tree.typeahead(this, event.key);
    }
  }

  readonly hasChildren = computed(() => {
    const n = this.node();
    if (!n) return this.childNodes().length > 0;
    // A folder whose listing has not been asked for still opens: without
    // this it had no chevron and no aria-expanded, so it could not be.
    if (n.hasChildren !== undefined) return n.hasChildren || (n.children?.length ?? 0) > 0;
    return (n.children?.length ?? 0) > 0;
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
    @if (stale(); as text) {
      <!-- Drawn once at the top. A screen reader hears it through the tree's
           own aria-description instead, so this one is out of the a11y tree:
           inside role="tree", only treeitems may be read. -->
      <div class="strct-tree__stale" aria-hidden="true">
        <span class="strct-tree__stalemark"></span>{{ text }}
      </div>
    }
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
    @if (dropRefusal()) {
      <!-- The sentence the operator reads while the pointer refuses to land.
           A screen reader hears it through the announcer instead, so this one
           is hidden from the a11y tree. -->
      <span
        class="strct-tree__refusal"
        aria-hidden="true"
        [style.left.px]="pointer().x + 14"
        [style.top.px]="pointer().y + 16"
        >{{ dropRefusal() }}</span
      >
    }
  `,
  host: {
    class: 'strct-tree',
    role: 'tree',
    '[attr.aria-description]': 'stale() || null',
    '[class.strct-tree--stale]': 'stale()',
    '[class.strct-tree--comfortable]': "density() === 'comfortable'",
    '[class.strct-tree--framed]': 'framed()',
    '[style.max-height.px]': 'maxHeight()',
  },
  styles: [
    `
      .strct-tree {
        display: block;
      }
      /* The caption for a tree whose readings have all stopped. It takes the
         ring the unknown health mark uses, because it is saying the same kind
         of thing one level up: what is below is not known to be current. It
         is a caption, not an alarm — nothing here is red. */
      .strct-tree__stale {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-block-end: var(--space-1);
        padding: 4px var(--space-2);
        font-size: var(--text-xs);
        color: var(--t2);
        background: var(--bg-2);
        border-radius: var(--radius-sm);
      }
      .strct-tree__stalemark {
        flex-shrink: 0;
        width: 9px;
        height: 9px;
        border: 2px solid var(--t3);
        border-radius: 50%;
      }
      /* The refusal beside the pointer: fixed, so no ancestor's overflow can
         clip it, and never under the pointer itself. */
      .strct-tree__refusal {
        position: fixed;
        z-index: 1300;
        pointer-events: none;
        max-inline-size: 260px;
        padding: 5px 8px;
        font-size: var(--text-xs);
        font-weight: 500;
        line-height: 1.4;
        color: var(--t1);
        background: var(--bg-0);
        border: 1px solid var(--critical);
        border-radius: var(--radius-md);
        box-shadow: var(--shh);
      }
      /* A tree used as a picker inside a dialog sits in a frame and scrolls
         inside it — instead of an inline-styled wrapper per dialog, with its
         dark-theme colours hard-coded. */
      .strct-tree--framed {
        border: 1px solid var(--b2);
        border-radius: var(--radius-md);
        background: var(--bg-1);
        padding: var(--space-1);
      }
      .strct-tree[style*='max-height'] {
        overflow: auto;
      }

      /* Comfortable density: larger text / icons, taller rows, wider indent.
         Opt-in — the compact default stays pixel-identical. */
      .strct-tree--comfortable .strct-tnode__row {
        gap: 7px;
        padding: 6px 10px;
        border-radius: var(--radius-md);
        font-size: var(--text-lg);
      }
      .strct-tree--comfortable .strct-tnode__chevron {
        margin: -4px;
        margin-inline-end: -9px;
      }
      .strct-tree--comfortable .strct-tnode__spacer {
        width: 16px;
      }
      .strct-tree--comfortable .strct-tnode__children {
        margin-inline-start: 19px;
      }
    `,
  ],
})
export class StrctTree {
  /** Data-driven node list; when set, projected content is ignored. */
  readonly nodes = input<StrctTreeNodeData[] | null>(null);
  /**
   * Row density. `compact` (default) is the dense inventory layout —
   * 13px text / 16px icons; `comfortable` relaxes to 14px text / 18px icons
   * with taller rows for touch-friendly or low-density consoles.
   */
  readonly density = input<'compact' | 'comfortable'>('compact');
  /** A bordered surface around the tree — for a picker inside a dialog. */
  readonly framed = input(false, { transform: booleanAttribute });
  /** Caps the height in px; the tree scrolls inside its frame. */
  readonly maxHeight = input<number | null>(null);
  /** Per-node right-click menu resolver. */
  readonly nodeMenu = input<StrctTreeNodeMenuFn | null>(null);
  /**
   * Which nodes can be picked up. Default: none, so a tree without this input
   * behaves exactly as before. Asked again whenever `nodes` changes, because
   * a refresh can make a node movable.
   */
  readonly canDrag = input<((node: StrctTreeNodeData) => boolean) | null>(null);
  /**
   * Where the dragged node may land, asked during `dragover`. A browser does
   * not let `dragover` read the drag's data, so the tree keeps the source node
   * and hands it to you here. Without this input nothing accepts a drop — the
   * gesture belongs to the tree, the rule belongs to you.
   *
   * Two rules are built in whatever this returns: a node is never dropped on
   * itself, and never into its own subtree (that would be a cycle).
   */
  readonly canDrop = input<
    ((source: StrctTreeNodeData, target: StrctTreeNodeData) => boolean | string) | null
  >(null);
  /** How long a collapsed node must be hovered mid-drag before it expands (ms). */
  readonly dragExpandDelay = input(700);
  /** Emitted for an accepted drop only. */
  readonly nodeDrop = output<StrctTreeDropEvent>();
  /**
   * Emitted once per target when `canDrop` refuses with a sentence: the same
   * sentence the operator is shown and the screen reader hears.
   */
  readonly dropRefused = output<StrctTreeDropRefusal>();
  /** Wording of the row shown under a node whose children are being read (`node.loading`). */
  readonly loadingLabel = input('Loading…');
  /** What each state is called after a node's label — translate once per tree. */
  readonly stateWords = input<StrctTreeStateWords>(defaultStateWords);
  /**
   * The whole tree is out of date, and why — "Not current since 14:02", or
   * `null` while it is live. Set it when the consumer has had no successful
   * read for longer than its own threshold: every row recedes the way one
   * `reach: 'stale'` row does, the axes keep their last value, and the
   * sentence is drawn once at the top and described once on the tree itself.
   * Once, not per node: a screen reader walking two thousand rows must not
   * hear it two thousand times.
   */
  readonly stale = input<string | null>(null);
  /** Accessible label of each node's chevron toggle; receives the expanded state and the node label. */
  readonly chevronAriaLabel =
    input<(expanded: boolean, label: string) => string>(defaultChevronAriaLabel);
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
  /** Direct projected root nodes (content mode) — sibling source for aria-setsize/posinset. */
  private readonly projectedNodes = contentChildren(StrctTreeNode, { descendants: false });
  /** Document-ordered cache of the visible nodes; null = stale. */
  private orderedCache: StrctTreeNode[] | null = null;
  /** `nodes` identity the cache was built for (data-mode `@for` can reorder in place). */
  private orderedCacheNodes: StrctTreeNodeData[] | null = null;

  registerNode(node: StrctTreeNode): void {
    this.registeredNodes.update((list) => [...list, node]);
    this.orderedCache = null;
  }
  unregisterNode(node: StrctTreeNode): void {
    this.registeredNodes.update((list) => list.filter((n) => n !== node));
    if (this.activeRoving() === node) this.activeRoving.set(null);
    this.orderedCache = null;
  }

  /** Direct projected root nodes (content mode); empty in data mode. */
  contentChildNodes(): readonly StrctTreeNode[] {
    return this.projectedNodes();
  }

  /** Visible nodes in document order (collapsed subtrees are never registered). */
  private ordered(): StrctTreeNode[] {
    // Data-mode `@for` moves views in place on reorder (no register/unregister),
    // so the node-list identity is part of the cache key.
    const ns = this.nodes();
    if (this.orderedCache && this.orderedCacheNodes === ns) return this.orderedCache;
    this.orderedCache = [...this.registeredNodes()].sort((a, b) => {
      const ra = a.rowEl();
      const rb = b.rowEl();
      if (!ra || !rb) return 0;
      return ra.compareDocumentPosition(rb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    this.orderedCacheNodes = ns;
    return this.orderedCache;
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

  /** Idle gap after which the accumulated typeahead search string resets (ms). */
  private static readonly TYPEAHEAD_TIMEOUT = 500;
  private typeaheadQuery = '';
  private typeaheadStamp = 0;

  /**
   * APG typeahead: move focus to the next visible node whose label starts with
   * the typed prefix. Repeating one character cycles through its matches;
   * different characters accumulate into a search string (reset after a pause).
   */
  typeahead(from: StrctTreeNode, key: string): void {
    const list = this.ordered();
    const start = list.indexOf(from);
    if (start < 0) return;
    const char = key.toLowerCase();
    const now = Date.now();
    const fresh = now - this.typeaheadStamp > StrctTree.TYPEAHEAD_TIMEOUT;
    this.typeaheadStamp = now;
    const cycling =
      !fresh && this.typeaheadQuery.length > 0 && [...this.typeaheadQuery].every((c) => c === char);
    this.typeaheadQuery = fresh || cycling ? char : this.typeaheadQuery + char;
    const query = this.typeaheadQuery;
    for (let step = 1; step <= list.length; step++) {
      const candidate = list[(start + step) % list.length];
      if (candidate.typeaheadLabel().toLowerCase().startsWith(query)) {
        this.focusNode(candidate);
        return;
      }
    }
  }

  // ── Drag and drop ──────────────────────────────────────────────
  private readonly announcer = inject(StrctAnnouncer);
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dragSourceNode = signal<StrctTreeNodeData | null>(null);
  private readonly dropTargetNode = signal<StrctTreeNodeData | null>(null);
  /** Pending hover-expand for a collapsed target. */
  private expandTimer: ReturnType<typeof setTimeout> | null = null;
  private expandTimerKey: string | null = null;
  /** Edge auto-scroll while a drag is in flight. */
  private scrollFrame: number | null = null;
  private scrollStep = 0;

  canDragNode(node: StrctTreeNodeData): boolean {
    return this.canDrag()?.(node) ?? false;
  }
  isDragSource(node: StrctTreeNodeData): boolean {
    const src = this.dragSourceNode();
    return !!src && this.keyOf(src) === this.keyOf(node);
  }
  isDropTarget(node: StrctTreeNodeData): boolean {
    const t = this.dropTargetNode();
    return !!t && this.keyOf(t) === this.keyOf(node);
  }

  /** Whether the current drag may land on `target`: the built-in guards first,
   *  then the consumer's rule. */
  acceptsDrop(target: StrctTreeNodeData): boolean {
    return this.verdictFor(target) === true;
  }

  /**
   * The consumer's answer for this target: `true`, `false`, or the sentence
   * the operator should read. The two built-in guards answer first and have
   * no sentence — a node onto itself, or into its own subtree.
   */
  private verdictFor(target: StrctTreeNodeData): boolean | string {
    const source = this.dragSourceNode();
    if (!source) return false;
    if (this.keyOf(source) === this.keyOf(target)) return false;
    if (this.containsNode(source, target)) return false;
    const verdict = this.canDrop()?.(source, target) ?? false;
    return verdict === true ? true : verdict || false;
  }

  /** The refusal sentence for the target being hovered, or '' . */
  readonly dropRefusal = signal('');
  /** Where the pointer is, so the sentence can stand beside it. */
  protected readonly pointer = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  /** Whether `node` is somewhere inside `root`'s subtree. */
  private containsNode(root: StrctTreeNodeData, node: StrctTreeNodeData): boolean {
    const key = this.keyOf(node);
    const walk = (list: StrctTreeNodeData[] | undefined): boolean =>
      (list ?? []).some((n) => this.keyOf(n) === key || walk(n.children));
    return walk(root.children);
  }

  beginDrag(node: StrctTreeNodeData): void {
    this.dragSourceNode.set(node);
    this.announcer.announce(`Dragging ${node.label}`);
  }

  /** Called from every `dragover` on a row: highlight, hover-expand, scroll. */
  dragOver(target: StrctTreeNodeData, clientY: number, clientX = 0): void {
    this.pointer.set({ x: clientX, y: clientY });
    if (!this.dragSourceNode()) return;
    const verdict = this.verdictFor(target);
    this.dropTargetNode.set(verdict === true ? target : null);
    // A refusal with a reason says it beside the pointer and, once per
    // target, politely — a drag that simply refuses tells the operator
    // nothing, and a toast after the drop is too late (FR-59-07).
    const reason = typeof verdict === 'string' ? verdict : '';
    if (reason !== this.dropRefusal()) {
      this.dropRefusal.set(reason);
      if (reason) {
        this.announcer.announce(reason);
        this.dropRefused.emit({ source: this.dragSourceNode()!, target, reason });
      }
    }
    this.scheduleHoverExpand(target);
    this.edgeScroll(clientY);
  }

  dragLeave(target: StrctTreeNodeData): void {
    if (this.isDropTarget(target)) this.dropTargetNode.set(null);
    this.dropRefusal.set('');
    if (this.expandTimerKey === this.keyOf(target)) this.clearExpandTimer();
    this.stopEdgeScroll();
  }

  dropOn(target: StrctTreeNodeData): void {
    const source = this.dragSourceNode();
    const accepted = !!source && this.acceptsDrop(target);
    if (source && accepted) {
      this.nodeDrop.emit({ source, target, position: 'into' });
      this.announcer.announce(`Dropped ${source.label} on ${target.label}`);
    }
    this.endDrag();
  }

  /** Always runs, including when the drop lands outside the tree (dragend). */
  endDrag(): void {
    this.dragSourceNode.set(null);
    this.dropTargetNode.set(null);
    this.dropRefusal.set('');
    this.clearExpandTimer();
    this.stopEdgeScroll();
  }

  /** A collapsed node hovered long enough opens, so a target that is not yet
   *  visible can be reached at all — the normal case in a big inventory. */
  private scheduleHoverExpand(target: StrctTreeNodeData): void {
    const key = this.keyOf(target);
    if (this.expandTimerKey === key) return;
    this.clearExpandTimer();
    if (!target.children?.length || this.currentSet().has(key)) return;
    this.expandTimerKey = key;
    this.expandTimer = setTimeout(() => {
      this.expandTimer = null;
      this.expandTimerKey = null;
      if (this.dragSourceNode() && !this.currentSet().has(key)) this.toggleNode(target);
    }, this.dragExpandDelay());
  }

  private clearExpandTimer(): void {
    if (this.expandTimer != null) clearTimeout(this.expandTimer);
    this.expandTimer = null;
    this.expandTimerKey = null;
  }

  /** Nearest scrolling ancestor, so a long tree can be traversed mid-drag. */
  private scrollParent(): HTMLElement | null {
    let el: HTMLElement | null = this.hostEl.nativeElement;
    while (el) {
      const canScroll = el.scrollHeight > el.clientHeight + 1;
      if (canScroll && /auto|scroll|overlay/.test(getComputedStyle(el).overflowY)) return el;
      el = el.parentElement;
    }
    return null;
  }

  private edgeScroll(clientY: number): void {
    const box = this.scrollParent();
    if (!box) return;
    const r = box.getBoundingClientRect();
    const zone = 36;
    const step = clientY < r.top + zone ? -12 : clientY > r.bottom - zone ? 12 : 0;
    this.scrollStep = step;
    if (!step) return this.stopEdgeScroll();
    if (this.scrollFrame != null) return;
    const tick = (): void => {
      if (!this.scrollStep || !this.dragSourceNode()) return this.stopEdgeScroll();
      box.scrollTop += this.scrollStep;
      this.scrollFrame = requestAnimationFrame(tick);
    };
    this.scrollFrame = requestAnimationFrame(tick);
  }

  private stopEdgeScroll(): void {
    if (this.scrollFrame != null) cancelAnimationFrame(this.scrollFrame);
    this.scrollFrame = null;
    this.scrollStep = 0;
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
