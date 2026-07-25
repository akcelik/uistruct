import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { StrctIcon } from '../icon/icon';
import { FOCUSABLE_SELECTOR } from '../overlay/focus';

/**
 * Action bar for datagrid/card tops — left-aligned projected actions with an
 * optional selection summary and clear-selection affordance:
 *
 *   <strct-toolbar [selectionCount]="sel.size" (cleared)="sel.clear()">
 *     <button type="button">Restart</button>
 *     <strct-toolbar-spacer />
 *     <button type="button">Add VM</button>
 *   </strct-toolbar>
 *
 * `role="toolbar"` with APG keyboard support: ArrowLeft/ArrowRight (Up/Down
 * when `orientation` is 'vertical', mirrored in RTL) rove focus across the
 * projected controls, Home/End jump to the first/last. `selectionCount > 0`
 * prepends a "N selected" chip (label built by the localizable
 * `selectionLabel` factory) with a × button that emits `(cleared)`.
 * `strct-toolbar-spacer` pushes following actions to the far end.
 */
@Component({
  selector: 'strct-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [StrctIcon],
  template: `
    <div
      class="strct-tb"
      role="toolbar"
      tabindex="-1"
      [class.strct-tb--divided]="divided()"
      [class.strct-tb--vertical]="orientation() === 'vertical'"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-orientation]="orientation()"
      (keydown)="onKeydown($event)"
    >
      @if (selectionCount() > 0) {
        <span class="strct-tb__selection">
          <span class="strct-tb__count" aria-live="polite">{{
            selectionLabel()(selectionCount())
          }}</span>
          <button
            type="button"
            class="strct-tb__clear"
            [attr.aria-label]="clearLabel()"
            (click)="cleared.emit()"
          >
            <strct-icon strictName="close" [size]="11" [strokeWidth]="1.8" />
          </button>
        </span>
        <span class="strct-tb__sep" role="separator" aria-orientation="vertical"></span>
      }
      <ng-content />
    </div>
  `,
  host: { class: 'strct-toolbar-host' },
  styles: [
    `
      .strct-toolbar-host {
        display: block;
      }
      .strct-tb {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        padding-block: var(--space-1);
        font-family: var(--font);
      }
      .strct-tb--divided {
        border-block-end: 1px solid var(--b1);
      }
      .strct-tb--vertical {
        flex-direction: column;
        align-items: stretch;
      }
      .strct-tb--divided.strct-tb--vertical {
        border-block-end: 0;
        border-inline-end: 1px solid var(--b1);
      }
      .strct-tb__selection {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding-inline-start: var(--space-2);
        border-radius: var(--radius-md);
        background: var(--acc-m);
        color: var(--acc);
        font-size: 12px;
        white-space: nowrap;
      }
      .strct-tb__clear {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .strct-tb__clear:hover {
        background: var(--acc-s);
      }
      .strct-tb__clear:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: 1px;
      }
      .strct-tb__sep {
        align-self: stretch;
        inline-size: 1px;
        margin-block: 2px;
        background: var(--b2);
      }
      .strct-tb--vertical > .strct-tb__sep {
        inline-size: auto;
        block-size: 1px;
        margin-block: 0;
        margin-inline: 2px;
      }
      strct-toolbar-spacer {
        flex: 1 1 auto;
      }
      .strct-tb--vertical > strct-toolbar-spacer {
        flex: 1 1 auto;
      }
    `,
  ],
})
export class StrctToolbar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Accessible name of the toolbar (localizable). */
  readonly ariaLabel = input('Toolbar');
  /** Roving axis: horizontal bars use Left/Right, vertical use Up/Down. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Number of selected rows/items; > 0 shows the selection chip + clear ×. */
  readonly selectionCount = input(0);
  /** Subtle bottom divider — the classic "actions above the grid" look. */
  readonly divided = input(false, { transform: booleanAttribute });
  /** Builds the selection-chip label from the count (localizable). */
  readonly selectionLabel = input((n: number) => `${n} selected`);
  /** Accessible label of the × clear-selection button (localizable). */
  readonly clearLabel = input('Clear selection');
  /** The × was pressed — clear your selection state. */
  readonly cleared = output<void>();

  /** APG toolbar roving across the projected (enabled, tabbable) controls. */
  protected onKeydown(event: KeyboardEvent): void {
    const items = this.items();
    const active = document.activeElement as HTMLElement | null;
    const idx = items.indexOf(active as HTMLElement);
    if (idx < 0) return; // focus is not on a toolbar control
    const vertical = this.orientation() === 'vertical';
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
    if (event.key === prevKey || event.key === nextKey) {
      event.preventDefault();
      let dir = event.key === nextKey ? 1 : -1;
      // RTL mirrors horizontal movement; vertical is direction-agnostic.
      if (!vertical && getComputedStyle(this.host.nativeElement).direction === 'rtl') dir = -dir;
      items[(idx + dir + items.length) % items.length].focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      (event.key === 'Home' ? items[0] : items[items.length - 1]).focus();
    }
  }

  /** Tabbable controls inside the bar, in DOM order. */
  private items(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }
}

/**
 * Flex spacer for `strct-toolbar` — pushes the actions after it to the far
 * (inline-end) side of the bar.
 */
@Component({
  selector: 'strct-toolbar-spacer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '',
})
export class StrctToolbarSpacer {}
