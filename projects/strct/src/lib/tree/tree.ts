import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChildren,
  input,
  model,
  output,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';

/** Root container for a tree of `<strct-tree-node>` items. */
@Component({
  selector: 'strct-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />`,
  host: { class: 'strct-tree', role: 'tree' },
  styles: [`.strct-tree { display: block; }`],
})
export class StrctTree {}

/**
 * Tree node. Nest `<strct-tree-node>` children to build hierarchy:
 *   <strct-tree-node label="Group" [(expanded)]="open">
 *     <strct-tree-node label="Leaf" icon="grid" [active]="true" />
 *   </strct-tree-node>
 */
@Component({
  selector: 'strct-tree-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <div
      class="strct-tnode__row"
      [class.strct-tnode__row--active]="active()"
      role="treeitem"
      [attr.aria-expanded]="hasChildren() ? expanded() : null"
      (click)="activated.emit()"
    >
      @if (hasChildren()) {
        <span
          class="strct-tnode__chevron"
          [class.strct-tnode__chevron--open]="expanded()"
          (click)="$event.stopPropagation(); toggle()"
        >
          <strct-icon name="chevronRight" [size]="12" [strokeWidth]="1.7" />
        </span>
      } @else {
        <span class="strct-tnode__spacer"></span>
      }
      @if (icon()) {
        <strct-icon class="strct-tnode__icon" [name]="icon()!" [size]="14" [strokeWidth]="1.3" />
      }
      <span class="strct-tnode__label">{{ label() }}</span>
      <ng-content select="[strctTreeTrailing]" />
    </div>
    @if (hasChildren() && expanded()) {
      <div class="strct-tnode__children" role="group">
        <ng-content />
      </div>
    }
  `,
  host: { class: 'strct-tnode' },
  styles: [
    `
    .strct-tnode { display: block; }
    .strct-tnode__row {
      display: flex; align-items: center; gap: 7px;
      padding: 7px 10px; border-radius: 5px; cursor: pointer;
      font-size: 13px; color: var(--t1); user-select: none;
    }
    .strct-tnode__row:hover { background: var(--bg-3); }
    .strct-tnode__row--active { background: var(--acc-m); color: var(--acc); font-weight: 500; }
    .strct-tnode__row--active .strct-tnode__icon,
    .strct-tnode__row--active .strct-tnode__chevron { color: var(--acc); }
    .strct-tnode__chevron {
      display: inline-flex; color: var(--t3); transition: transform .15s ease;
      width: 14px; justify-content: center;
    }
    .strct-tnode__chevron--open { transform: rotate(90deg); }
    .strct-tnode__spacer { width: 14px; flex-shrink: 0; }
    .strct-tnode__icon { color: var(--t2); flex-shrink: 0; }
    .strct-tnode__label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .strct-tnode__children { margin-left: 16px; }
    `,
  ],
})
export class StrctTreeNode {
  readonly label = input.required<string>();
  readonly icon = input<string | undefined>(undefined);
  readonly active = input(false);
  readonly expanded = model(false);
  readonly activated = output<void>();

  private readonly childNodes = contentChildren(StrctTreeNode);
  protected readonly hasChildren = computed(() => this.childNodes().length > 0);

  toggle(): void {
    this.expanded.update((v) => !v);
  }
}
