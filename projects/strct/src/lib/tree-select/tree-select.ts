import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  ElementRef,
  HostListener,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { StrctIcon } from '../icon/icon';
import { StrctOverlay } from '../overlay/overlay';
import { restoreFocus, saveFocusedElement } from '../overlay/focus';
import { StrctTree, StrctTreeNodeData } from '../tree/tree';

/**
 * Tree picker in a dropdown: a trigger button wearing the shared
 * `.strct-control` look opens an overlay panel hosting the data-driven
 * `<strct-tree>`. CVA-compatible single-select of a node key (`id`, falling
 * back to `label` — the same key the tree uses for `expandedIds`); the
 * trigger shows the selected node's full label path (`Parent / Child`).
 *
 *   <strct-tree-select [nodes]="tree" [(ngModel)]="nodeId" clearable />
 *
 * Keyboard: ArrowDown/Enter/Space open from the trigger; inside the panel the
 * tree's own ARIA pattern applies (arrows rove, Right/Left expand/collapse,
 * typeahead jumps, Enter picks). Escape closes (stopPropagation, so a host
 * modal/drawer stays open); focus returns to the trigger on close.
 */
@Component({
  selector: 'strct-tree-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon, StrctOverlay, StrctTree],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StrctTreeSelect), multi: true },
  ],
  template: `
    <div #field class="strct-tsel__field">
      <button
        #trigger
        type="button"
        class="strct-control strct-tsel__trigger"
        [class.strct-tsel__trigger--clearable]="showClear()"
        aria-haspopup="tree"
        [attr.aria-expanded]="open()"
        [disabled]="isDisabled()"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
      >
        <span class="strct-tsel__value" [class.strct-tsel__value--empty]="!selectedLabel()">
          {{ selectedLabel() || placeholder() }}
        </span>
        <strct-icon class="strct-tsel__caret" strictName="chevronDown" [size]="14" />
      </button>
      @if (showClear()) {
        <button
          type="button"
          class="strct-tsel__clear"
          [attr.aria-label]="clearLabel()"
          (click)="clear($event)"
        >
          <strct-icon strictName="close" [size]="12" [strokeWidth]="1.6" />
        </button>
      }
    </div>
    @if (open()) {
      <div
        class="strct-tsel__panel"
        tabindex="-1"
        [strctOverlay]="field"
        strctOverlayPlacement="bottom-start"
        [strctOverlayMatchWidth]="true"
        (keydown)="onPanelKeydown($event)"
      >
        @if (nodes().length) {
          <strct-tree
            [nodes]="displayNodes()"
            [(expandedIds)]="expandedIds"
            (nodeActivated)="pick($event)"
          />
        } @else {
          <div class="strct-tsel__empty">{{ emptyText() }}</div>
        }
      </div>
    }
  `,
  host: { class: 'strct-tsel' },
  styles: [
    `
      .strct-tsel {
        position: relative;
        display: block;
        width: 100%;
      }
      .strct-tsel__field {
        position: relative;
      }
      /* The trigger is a real button wearing the shared control skin — flex so
         the value truncates and the caret keeps its corner. */
      .strct-tsel__trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-inline-end: 30px;
        text-align: start;
        cursor: pointer;
      }
      .strct-tsel__trigger--clearable {
        padding-inline-end: 48px;
      }
      .strct-tsel__trigger:disabled {
        cursor: not-allowed;
      }
      .strct-tsel__value {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .strct-tsel__value--empty {
        color: var(--t3);
      }
      .strct-tsel__caret {
        position: absolute;
        inset-inline-end: 9px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--t3);
        pointer-events: none;
      }
      /* The × sits over the trigger end, left of the caret (combobox idiom). */
      .strct-tsel__clear {
        position: absolute;
        inset-inline-end: 26px;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        padding: 2px;
        color: var(--t3);
        background: none;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
      }
      .strct-tsel__clear:hover {
        color: var(--t1);
      }
      /* Positioned by StrctOverlay (position: fixed, set inline) — only the
         surface styling lives here. */
      .strct-tsel__panel {
        z-index: var(--z-dropdown);
        max-height: 260px;
        overflow-y: auto;
        padding: var(--space-1);
        background: var(--bg-1);
        border: 1px solid var(--b2);
        border-radius: var(--radius-lg);
        box-shadow: var(--shh);
      }
      .strct-tsel__empty {
        padding: 9px 10px;
        font-size: 13px;
        color: var(--t3);
      }
    `,
  ],
})
export class StrctTreeSelect implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Root nodes rendered by the embedded `<strct-tree>` (data-driven mode). */
  readonly nodes = input<StrctTreeNodeData[]>([]);
  /** Placeholder text when empty (localizable). */
  readonly placeholder = input('Select…');
  /** Show an × that resets the selection. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Text shown when `nodes` is empty (localizable). */
  readonly emptyText = input('No items');
  /** Accessible label of the × clear button (localizable). */
  readonly clearLabel = input('Clear selection');
  /** Static disable; forms' setDisabledState also drives the disabled state. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly value = signal<string | null>(null);
  readonly open = signal(false);
  /**
   * Expansion state handed to the tree (controlled). Seeded with the selected
   * node's ancestors on open so the current pick is visible; afterwards owned
   * by the tree through the two-way binding.
   */
  readonly expandedIds = signal<string[] | null>(null);
  /** Disabled state pushed by the forms API (setDisabledState). */
  private readonly cvaDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /** Element focused before the panel opened — focus returns here on close. */
  private restoreTo: HTMLElement | null = null;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  /** Stable key for a node: its `id`, or the `label` as a fallback (tree idiom). */
  private keyOf(n: StrctTreeNodeData): string {
    return n.id ?? n.label;
  }

  /** The tree data with `active` flagged on the selected node (highlight + focus target). */
  protected readonly displayNodes = computed<StrctTreeNodeData[]>(() => {
    const v = this.value();
    const walk = (ns: StrctTreeNodeData[]): StrctTreeNodeData[] =>
      ns.map((n) => ({
        ...n,
        active: v !== null && this.keyOf(n) === v,
        children: n.children ? walk(n.children) : undefined,
      }));
    return walk(this.nodes());
  });

  /** Full label path of the selected node, joined with ` / ` ("Parent / Child"). */
  protected readonly selectedLabel = computed(() => {
    const v = this.value();
    if (v === null) return '';
    const path = this.findPath(this.nodes(), v);
    return path ? path.map((n) => n.label).join(' / ') : '';
  });

  protected readonly showClear = computed(
    () => this.clearable() && this.value() !== null && !this.isDisabled(),
  );

  /** Chain of nodes from a root down to the node with key `v` (null when absent). */
  private findPath(ns: StrctTreeNodeData[], v: string): StrctTreeNodeData[] | null {
    for (const n of ns) {
      if (this.keyOf(n) === v) return [n];
      if (n.children?.length) {
        const found = this.findPath(n.children, v);
        if (found) return [n, ...found];
      }
    }
    return null;
  }

  toggle(): void {
    if (this.isDisabled()) return;
    if (this.open()) this.closePanel();
    else this.openPanel();
  }

  openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.restoreTo = saveFocusedElement();
    // Reveal the current pick: expand its ancestors (or fall back to the
    // nodes' own `expanded` seeds when nothing is selected).
    const v = this.value();
    const path = v !== null ? this.findPath(this.nodes(), v) : null;
    this.expandedIds.set(path ? path.slice(0, -1).map((n) => this.keyOf(n)) : null);
    this.open.set(true);
    // Move focus into the tree: the selected row, else the first one.
    setTimeout(() => {
      const panel = this.host.nativeElement.querySelector('.strct-tsel__panel');
      const row =
        panel?.querySelector<HTMLElement>('.strct-tnode__row--active') ??
        panel?.querySelector<HTMLElement>('.strct-tnode__row');
      row?.focus();
    });
  }

  closePanel(): void {
    if (!this.open()) return;
    this.open.set(false);
    restoreFocus(this.restoreTo);
    this.restoreTo = null;
  }

  /**
   * ArrowDown/Enter/Space open the panel from the trigger. preventDefault so
   * Space doesn't scroll the page and Enter/Space don't also fire the native
   * button click (which would toggle the panel straight back shut).
   */
  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openPanel();
    }
  }

  /** Escape inside the panel (the tree's rows don't handle it themselves). */
  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      // Consumed here — a host modal/drawer must not close with the panel.
      event.stopPropagation();
      this.closePanel();
    } else if (event.key === 'Tab') {
      // No preventDefault: the panel closes and focus moves on naturally.
      this.closePanel();
    }
  }

  /** Commit a node pick: its key becomes the value and the panel closes. */
  pick(node: StrctTreeNodeData): void {
    const v = this.keyOf(node);
    this.value.set(v);
    this.closePanel();
    this.onChange(v);
    this.onTouched();
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    this.onChange(null);
    this.onTouched();
    this.host.nativeElement.querySelector<HTMLButtonElement>('.strct-tsel__trigger')?.focus();
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      // Focus already went to the click target — just close, don't restore it.
      this.open.set(false);
      this.restoreTo = null;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.open()) return;
    // Fallback for focus outside the panel (in-panel Escape is consumed by the
    // panel first). stopImmediatePropagation so a host modal/drawer with its
    // own document listener doesn't also see the Escape the panel consumed.
    event.stopImmediatePropagation();
    this.closePanel();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
