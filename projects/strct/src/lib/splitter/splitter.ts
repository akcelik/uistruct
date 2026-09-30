import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

/**
 * Two resizable panes with a draggable gutter — master/detail layouts where
 * the split is the user's to own:
 *
 *   <strct-splitter [(split)]="pct" [min]="20" [max]="80">
 *     <div strctPaneStart>…list…</div>
 *     <div strctPaneEnd>…detail…</div>
 *   </strct-splitter>
 *
 * `split` is the start pane's share in percent (two-way, persistable).
 * The gutter is a keyboard separator: arrows nudge, Home/End jump to min/max.
 */
@Component({
  selector: 'strct-splitter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="strct-split__pane"
      [class.strct-split__pane--collapsed]="collapsed()"
      [style.flex-basis]="startBasis()"
    >
      <ng-content select="[strctPaneStart]" />
    </div>
    <div
      class="strct-split__gutter"
      role="separator"
      tabindex="0"
      [attr.aria-label]="gutterLabel()"
      [attr.aria-orientation]="vertical() ? 'horizontal' : 'vertical'"
      [attr.aria-valuenow]="collapsed() ? 0 : clamped()"
      [attr.aria-valuemin]="lowerBound()"
      [attr.aria-valuemax]="upperBound()"
      [attr.aria-expanded]="collapsible() ? !collapsed() : null"
      (pointerdown)="onDragStart($event)"
      (keydown)="onKeydown($event)"
    >
      <span class="strct-split__grip" aria-hidden="true"></span>
    </div>
    <div class="strct-split__pane strct-split__pane--end">
      <ng-content select="[strctPaneEnd]" />
    </div>
  `,
  host: {
    class: 'strct-split',
    '[class.strct-split--vertical]': 'vertical()',
    '[class.strct-split--dragging]': 'dragging()',
  },
  styles: [
    `
      .strct-split {
        display: flex;
        width: 100%;
        min-height: 0;
      }
      .strct-split--vertical {
        flex-direction: column;
      }
      .strct-split__pane--collapsed {
        overflow: hidden;
      }
      .strct-split__pane {
        flex-grow: 0;
        flex-shrink: 0;
        overflow: auto;
        min-width: 0;
        min-height: 0;
      }
      .strct-split__pane--end {
        flex: 1 1 0;
      }
      .strct-split__gutter {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 7px;
        cursor: col-resize;
        background: transparent;
        touch-action: none;
      }
      .strct-split--vertical > .strct-split__gutter {
        width: auto;
        height: 7px;
        cursor: row-resize;
      }
      .strct-split__gutter:hover,
      .strct-split--dragging > .strct-split__gutter {
        background: var(--acc18);
      }
      .strct-split__gutter:focus-visible {
        outline: 2px solid var(--acc50);
        outline-offset: -2px;
      }
      .strct-split__grip {
        width: 1.5px;
        height: 26px;
        border-radius: 1px;
        background: var(--b2);
      }
      .strct-split--vertical .strct-split__grip {
        width: 26px;
        height: 1.5px;
      }
      .strct-split--dragging {
        user-select: none;
      }
    `,
  ],
})
export class StrctSplitter {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Start pane share in percent (two-way). */
  readonly split = model(50);
  /** Clamp bounds for the split (percent). */
  readonly min = input(15);
  readonly max = input(85);
  /**
   * What `split`, `minSize` and `maxSize` are measured in. A sidebar is 280px,
   * not 22%, so `px` sizes the start pane in pixels and drags it in pixels.
   */
  readonly unit = input<'percent' | 'px'>('percent');
  /** Bounds in `unit` for the start pane; they win over `min` / `max`. */
  readonly minSize = input<number | null>(null);
  readonly maxSize = input<number | null>(null);
  /** The start pane can be collapsed to nothing (Enter on the gutter). */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Whether it is collapsed (two-way). */
  readonly collapsed = model(false);
  /** Stack panes vertically (gutter drags up/down). */
  readonly vertical = input(false, { transform: booleanAttribute });
  /** Accessible name of the separator (localizable). */
  readonly gutterLabel = input('Resize panes');
  /** Keyboard nudge step in percent. */
  readonly step = input(3);

  /** The effective bounds, in whichever unit the splitter is measured in. */
  protected readonly lowerBound = computed(
    () => this.minSize() ?? (this.unit() === 'px' ? 0 : this.min()),
  );
  protected readonly upperBound = computed(
    () => this.maxSize() ?? (this.unit() === 'px' ? Number.POSITIVE_INFINITY : this.max()),
  );
  protected readonly clamped = computed(() =>
    Math.min(this.upperBound(), Math.max(this.lowerBound(), this.split())),
  );
  /** The start pane's flex-basis: its size, or nothing while collapsed. */
  protected readonly startBasis = computed(() => {
    if (this.collapsed()) return '0px';
    return this.unit() === 'px' ? `${this.clamped()}px` : `${this.clamped()}%`;
  });

  protected readonly dragging = signal(false);
  private moveHandler = (e: PointerEvent) => this.onDragMove(e);
  private upHandler = () => this.onDragEnd();

  constructor() {
    // Remove document drag listeners if the component is destroyed mid-drag.
    inject(DestroyRef).onDestroy(() => this.removeDragListeners());
  }

  protected onDragStart(event: PointerEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging.set(true);
    document.addEventListener('pointermove', this.moveHandler);
    document.addEventListener('pointerup', this.upHandler);
    document.addEventListener('pointercancel', this.upHandler);
  }

  private onDragMove(event: PointerEvent): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    // clientX/clientY are physical, but the start pane sits at the inline
    // start: in RTL a horizontal drag is measured from the rect's right edge.
    let ratio = this.vertical()
      ? (event.clientY - rect.top) / rect.height
      : (event.clientX - rect.left) / rect.width;
    if (!this.vertical() && this.isRtl()) ratio = 1 - ratio;
    const span = this.vertical() ? rect.height : rect.width;
    const next = this.unit() === 'px' ? Math.round(ratio * span) : Math.round(ratio * 100);
    if (this.collapsed()) this.collapsed.set(false);
    this.split.set(Math.min(this.upperBound(), Math.max(this.lowerBound(), next)));
  }

  private onDragEnd(): void {
    this.dragging.set(false);
    this.removeDragListeners();
  }

  private removeDragListeners(): void {
    document.removeEventListener('pointermove', this.moveHandler);
    document.removeEventListener('pointerup', this.upHandler);
    document.removeEventListener('pointercancel', this.upHandler);
  }

  /** Document direction — pointer coordinates and arrow keys are physical, panes are logical. */
  private isRtl(): boolean {
    return getComputedStyle(this.host.nativeElement).direction === 'rtl';
  }

  protected onKeydown(event: KeyboardEvent): void {
    let dec = this.vertical() ? 'ArrowUp' : 'ArrowLeft';
    let inc = this.vertical() ? 'ArrowDown' : 'ArrowRight';
    // RTL: the start pane extends to the left, so Left grows and Right shrinks.
    if (!this.vertical() && this.isRtl()) [dec, inc] = [inc, dec];
    // Enter collapses a collapsible pane, and restores it.
    if (this.collapsible() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.collapsed.update((v) => !v);
      return;
    }
    const step = this.unit() === 'px' ? this.step() * 8 : this.step();
    let next: number | null = null;
    if (event.key === dec) next = this.clamped() - step;
    else if (event.key === inc) next = this.clamped() + step;
    else if (event.key === 'Home') next = this.lowerBound();
    else if (event.key === 'End')
      next = Number.isFinite(this.upperBound()) ? this.upperBound() : this.clamped() + step * 4;
    if (next == null) return;
    event.preventDefault();
    if (this.collapsed()) this.collapsed.set(false);
    this.split.set(Math.min(this.upperBound(), Math.max(this.lowerBound(), next)));
  }
}
